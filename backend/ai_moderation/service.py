"""
AI Content Moderation Service
──────────────────────────────
Primary:  OpenAI Moderation API (free — no per-call cost, only needs an API key)
Fallback: better-profanity (local keyword filtering, works with no API key)

Violation escalation flow:
  1st–2nd violation  → warning + content removed
  3rd violation      → 7-day suspension
  5th violation      → 30-day suspension
  7th+ violation     → permanent ban

Admins can review AIViolationLog entries and mark false positives.
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger('ai_moderation')


# ── Content checking ──────────────────────────────────────────────────────────

def check_content(text: str) -> dict:
    """
    Check text for inappropriate content.

    Returns:
        {
            'flagged': bool,
            'reason': str,
            'categories': list[str],
            'method': str  # 'openai' | 'local' | 'none'
        }
    """
    if not text or not text.strip():
        return {'flagged': False, 'reason': '', 'categories': [], 'method': 'none'}

    # 1. Try OpenAI Moderation API (free endpoint)
    if settings.OPENAI_API_KEY:
        result = _check_with_openai(text)
        if result is not None:
            return result

    # 2. Fallback to local profanity filter
    return _check_with_local(text)


def _check_with_openai(text: str) -> dict | None:
    """Returns None if the API call fails (network error, quota, etc.)."""
    try:
        import openai
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.moderations.create(input=text[:10000])  # API limit
        result = response.results[0]

        if result.flagged:
            flagged_cats = [
                k.replace('/', '_')
                for k, v in result.categories.__dict__.items()
                if v
            ]
            return {
                'flagged': True,
                'reason': f'Content flagged: {", ".join(flagged_cats)}',
                'categories': flagged_cats,
                'method': 'openai',
            }
        return {'flagged': False, 'reason': '', 'categories': [], 'method': 'openai'}

    except Exception as exc:
        logger.warning('OpenAI moderation API failed: %s — falling back to local filter', exc)
        return None


def _check_with_local(text: str) -> dict:
    """Local keyword-based check using better-profanity."""
    try:
        from better_profanity import profanity
        profanity.load_censor_words()
        if profanity.contains_profanity(text):
            return {
                'flagged': True,
                'reason': 'Content contains inappropriate language.',
                'categories': ['profanity'],
                'method': 'local',
            }
    except ImportError:
        logger.warning('better-profanity not installed. Local moderation unavailable.')

    return {'flagged': False, 'reason': '', 'categories': [], 'method': 'local'}


# ── Violation handling ─────────────────────────────────────────────────────────

def handle_violation(user, content_type: str, content_id: int, content_text: str, reason: str):
    """
    Called after a piece of content is confirmed as a violation.
    Increments violation count, applies punishment, logs, and notifies.

    Args:
        user:         The User instance who created the offending content.
        content_type: 'POST' or 'COMMENT'
        content_id:   PK of the deleted content (for the audit log)
        content_text: Snapshot of the removed text (for audit log)
        reason:       Why it was flagged

    Returns:
        str: The action taken ('WARNED' | 'SUSPENDED_7' | 'SUSPENDED_30' | 'BANNED')
    """
    from moderation.models import AIViolationLog, Notification

    # Increment violation count
    user.violation_count += 1
    user.last_violation_at = timezone.now()
    user.save(update_fields=['violation_count', 'last_violation_at'])

    action = _apply_punishment(user)

    # Write audit log
    AIViolationLog.objects.create(
        user=user,
        content_type=content_type,
        content_id=content_id,
        content_text=content_text[:2000],
        reason=reason,
        action_taken=action,
        violation_number=user.violation_count,
    )

    # Notify the user
    _notify_user(user, content_type, reason, action)

    # Notify all platform admins/moderators
    _notify_admins(user, content_type, reason, action)

    logger.info(
        'AI violation handled: user=%s violation=#%d action=%s reason=%s',
        user.username, user.violation_count, action, reason
    )
    return action


def _apply_punishment(user) -> str:
    """Apply the appropriate suspension/ban based on violation count."""
    count = user.violation_count

    if count >= settings.VIOLATION_PERMANENT_BAN_THRESHOLD:
        user.is_active = False
        user.save(update_fields=['is_active'])
        return 'BANNED'

    elif count >= settings.VIOLATION_SUSPEND_30_THRESHOLD:
        user.suspended_until = timezone.now() + timedelta(days=30)
        user.save(update_fields=['suspended_until'])
        return 'SUSPENDED_30'

    elif count >= settings.VIOLATION_SUSPEND_7_THRESHOLD:
        user.suspended_until = timezone.now() + timedelta(days=7)
        user.save(update_fields=['suspended_until'])
        return 'SUSPENDED_7'

    return 'WARNED'


def _notify_user(user, content_type: str, reason: str, action: str):
    """Send an in-app notification to the offending user."""
    from moderation.models import Notification

    action_messages = {
        'WARNED': (
            f'Your {content_type.lower()} was removed because it violated community guidelines. '
            f'Reason: {reason}. This is violation #{user.violation_count}. '
            f'Further violations will result in account suspension.'
        ),
        'SUSPENDED_7': (
            f'Your {content_type.lower()} was removed and your account has been suspended for 7 days '
            f'due to repeated violations. Reason: {reason}.'
        ),
        'SUSPENDED_30': (
            f'Your {content_type.lower()} was removed and your account has been suspended for 30 days '
            f'due to repeated violations. Reason: {reason}.'
        ),
        'BANNED': (
            f'Your {content_type.lower()} was removed. Your account has been permanently suspended '
            f'due to repeated severe violations. Contact support to appeal.'
        ),
    }

    notif_type = 'SUSPENSION' if action != 'WARNED' else 'AI_VIOLATION'
    message = action_messages.get(action, f'Your content was removed. Reason: {reason}.')

    notif = Notification.objects.create(
        user=user,
        notif_type=notif_type,
        message=message,
    )
    _push_ws_notification(user.id, notif)


def _notify_admins(user, content_type: str, reason: str, action: str):
    """Notify all platform admins and moderators about the AI action."""
    from moderation.models import Notification
    from api.models import User as UserModel

    message = (
        f'AI removed {content_type} from @{user.username} '
        f'(violation #{user.violation_count}). Action: {action}. Reason: {reason}'
    )

    admins = UserModel.objects.filter(role__in=['ADMIN', 'MODERATOR'], is_active=True)
    notifications = [
        Notification(user=admin, notif_type='REPORT_ADMIN', message=message)
        for admin in admins
    ]
    Notification.objects.bulk_create(notifications)

    for notif in notifications:
        _push_ws_notification(notif.user_id, notif)


def _push_ws_notification(user_id: int, notif):
    """Push a real-time notification over WebSocket. Fails silently if Redis is down."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        async_to_sync(channel_layer.group_send)(
            f'user_notifications_{user_id}',
            {
                'type': 'send_notification',
                'data': {
                    'id': notif.id,
                    'notif_type': notif.notif_type,
                    'message': notif.message,
                    'is_read': False,
                    'created_at': notif.created_at.isoformat() if notif.created_at else None,
                },
            },
        )
    except Exception as exc:
        logger.debug('WebSocket push failed (non-critical): %s', exc)

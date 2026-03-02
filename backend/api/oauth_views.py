import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def _set_jwt_cookies(response, user):
    """Set access + refresh JWT cookies exactly like CustomTokenObtainPairView."""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    access_max_age = int(settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME').total_seconds())
    refresh_max_age = int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').total_seconds())

    response.set_cookie(
        key='access_token',
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='None' if not settings.DEBUG else 'Lax',
        path='/',
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='None' if not settings.DEBUG else 'Lax',
        path='/',
    )
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def google_oauth(request):
    """
    Exchange a Google ID token (credential) for a Voyage JWT session.
    Frontend sends: { credential: "<google_id_token>" }
    """
    credential = request.data.get('credential')
    if not credential:
        return Response({'error': 'Google credential is required.'}, status=400)

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    if not client_id:
        return Response({'error': 'Google OAuth is not configured on this server.'}, status=503)

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
        )
    except Exception:
        return Response({'error': 'Invalid Google credential.'}, status=400)

    email = idinfo.get('email')
    if not email:
        return Response({'error': 'Google account has no email.'}, status=400)

    if not idinfo.get('email_verified', False):
        return Response({'error': 'Google email is not verified.'}, status=400)

    # Derive name parts
    given_name = idinfo.get('given_name', '')
    family_name = idinfo.get('family_name', '')
    name_parts = idinfo.get('name', '').split(' ', 1) if not given_name else []

    first_name = given_name or (name_parts[0] if name_parts else email.split('@')[0])
    last_name = family_name or (name_parts[1] if len(name_parts) > 1 else '')

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': _unique_username(email.split('@')[0]),
            'first_name': first_name,
            'last_name': last_name,
            'email_verified': True,
        },
    )

    if not created:
        # Mark email verified on existing account
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified'])

    if user.is_deleted or (user.suspended_until and user.suspended_until > timezone.now()):
        return Response({'error': 'This account is suspended or deleted.'}, status=403)

    response = Response({'success': True, 'created': created})
    return _set_jwt_cookies(response, user)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def github_oauth(request):
    """
    Exchange a GitHub OAuth code for a Voyage JWT session.
    Frontend sends: { code: "<github_oauth_code>" }
    """
    code = request.data.get('code')
    if not code:
        return Response({'error': 'GitHub code is required.'}, status=400)

    client_id = getattr(settings, 'GITHUB_CLIENT_ID', '')
    client_secret = getattr(settings, 'GITHUB_CLIENT_SECRET', '')

    if not client_id or not client_secret:
        return Response({'error': 'GitHub OAuth is not configured on this server.'}, status=503)

    # Exchange code for access token
    token_resp = requests.post(
        'https://github.com/login/oauth/access_token',
        json={'client_id': client_id, 'client_secret': client_secret, 'code': code},
        headers={'Accept': 'application/json'},
        timeout=10,
    )

    if token_resp.status_code != 200:
        return Response({'error': 'Failed to exchange GitHub code.'}, status=400)

    token_data = token_resp.json()
    access_token = token_data.get('access_token')

    if not access_token:
        error = token_data.get('error_description', 'Invalid or expired code.')
        return Response({'error': error}, status=400)

    gh_headers = {'Authorization': f'Bearer {access_token}', 'Accept': 'application/json'}

    # Fetch user data
    user_resp = requests.get('https://api.github.com/user', headers=gh_headers, timeout=10)
    if user_resp.status_code != 200:
        return Response({'error': 'Failed to fetch GitHub user data.'}, status=400)

    gh_user = user_resp.json()

    # Fetch emails (in case primary email is not public)
    email = gh_user.get('email')
    if not email:
        emails_resp = requests.get('https://api.github.com/user/emails', headers=gh_headers, timeout=10)
        if emails_resp.status_code == 200:
            for e in emails_resp.json():
                if e.get('primary') and e.get('verified'):
                    email = e['email']
                    break

    if not email:
        return Response({'error': 'GitHub account has no verified email. Please make your email public on GitHub.'}, status=400)

    name = gh_user.get('name') or gh_user.get('login', '')
    name_parts = name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    login = gh_user.get('login', email.split('@')[0])

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': _unique_username(login),
            'first_name': first_name,
            'last_name': last_name,
            'email_verified': True,
        },
    )

    if created:
        user.set_unusable_password()
        user.save(update_fields=['password'])

    if user.is_deleted or (user.suspended_until and user.suspended_until > timezone.now()):
        return Response({'error': 'This account is suspended or deleted.'}, status=403)

    response = Response({'success': True, 'created': created})
    return _set_jwt_cookies(response, user)


def _unique_username(base: str) -> str:
    """Generate a unique username from a base string."""
    import re
    # Sanitize: keep letters, numbers, underscores
    base = re.sub(r'[^a-zA-Z0-9_]', '_', base)[:25]
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}_{counter}'
        counter += 1
    return username

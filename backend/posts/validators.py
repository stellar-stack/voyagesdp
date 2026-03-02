import os
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_image_file(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f'Invalid image type "{ext}". Allowed: {", ".join(settings.ALLOWED_IMAGE_EXTENSIONS)}'
        )
    if file.size > settings.MAX_IMAGE_UPLOAD_SIZE:
        max_mb = settings.MAX_IMAGE_UPLOAD_SIZE // (1024 * 1024)
        raise ValidationError(f'Image too large. Maximum size is {max_mb} MB.')


def validate_video_file(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(
            f'Invalid video type "{ext}". Allowed: {", ".join(settings.ALLOWED_VIDEO_EXTENSIONS)}'
        )
    if file.size > settings.MAX_VIDEO_UPLOAD_SIZE:
        max_mb = settings.MAX_VIDEO_UPLOAD_SIZE // (1024 * 1024)
        raise ValidationError(f'Video too large. Maximum size is {max_mb} MB.')


def validate_profile_picture(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f'Invalid image type "{ext}". Allowed: {", ".join(settings.ALLOWED_IMAGE_EXTENSIONS)}'
        )
    if file.size > settings.MAX_IMAGE_UPLOAD_SIZE:
        max_mb = settings.MAX_IMAGE_UPLOAD_SIZE // (1024 * 1024)
        raise ValidationError(f'Profile picture too large. Maximum size is {max_mb} MB.')

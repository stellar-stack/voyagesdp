import pytest
from rest_framework.test import APIClient
from api.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='TestPass123!',
        first_name='Test',
        last_name='User',
        country='US',
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username='adminuser',
        email='admin@example.com',
        password='AdminPass123!',
        role='ADMIN',
        country='US',
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client

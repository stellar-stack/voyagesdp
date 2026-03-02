import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, api_client):
        res = api_client.post('/api/v1/auth/register/', {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'country': 'US',
        }, format='multipart')
        assert res.status_code == 201
        assert res.data['success'] is True

    def test_register_duplicate_username(self, api_client, user):
        res = api_client.post('/api/v1/auth/register/', {
            'username': 'testuser',  # already exists
            'email': 'other@example.com',
            'password': 'StrongPass123!',
            'country': 'US',
        }, format='multipart')
        assert res.status_code == 400

    def test_register_duplicate_email(self, api_client, user):
        res = api_client.post('/api/v1/auth/register/', {
            'username': 'uniqueuser',
            'email': 'test@example.com',  # already exists
            'password': 'StrongPass123!',
            'country': 'US',
        }, format='multipart')
        assert res.status_code == 400


@pytest.mark.django_db
class TestUserProfile:
    def test_get_my_profile(self, auth_client, user):
        res = auth_client.get('/api/v1/auth/users/me/')
        assert res.status_code == 200
        assert res.data['username'] == 'testuser'

    def test_get_other_profile(self, auth_client, admin_user):
        res = auth_client.get(f'/api/v1/auth/users/{admin_user.username}/')
        assert res.status_code == 200

    def test_follow_user(self, auth_client, admin_user):
        res = auth_client.post('/api/v1/auth/users/follow/', {'username': admin_user.username})
        assert res.status_code == 200
        assert res.data['following'] is True

    def test_search_users(self, auth_client, admin_user):
        res = auth_client.get('/api/v1/auth/users/search/?q=admin')
        assert res.status_code == 200

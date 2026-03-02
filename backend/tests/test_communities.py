import pytest
from communities.models import Community, CommunityMembership


@pytest.mark.django_db
class TestCommunities:
    def test_create_community(self, auth_client, user):
        res = auth_client.post('/api/v1/communities/create/', {
            'name': 'MyNewCommunity',
            'about': 'A great place',
            'rules': 'Be kind.',
        })
        assert res.status_code == 201
        assert res.data['name'] == 'MyNewCommunity'

    def test_list_communities(self, auth_client, user):
        Community.objects.create(name='C1', about='About C1', created_by=user)
        res = auth_client.get('/api/v1/communities/')
        assert res.status_code == 200
        assert 'results' in res.data

    def test_join_community(self, auth_client, user, admin_user):
        community = Community.objects.create(name='JoinMe', about='Join this', created_by=admin_user)
        res = auth_client.post('/api/v1/communities/join/', {'community_id': community.id})
        assert res.status_code == 200
        assert res.data['joined'] is True

    def test_my_communities(self, auth_client, user):
        c = Community.objects.create(name='Mine', about='My community', created_by=user)
        CommunityMembership.objects.get_or_create(user=user, community=c)
        res = auth_client.get('/api/v1/communities/me/')
        assert res.status_code == 200

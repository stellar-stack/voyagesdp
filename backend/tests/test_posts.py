import pytest
from api.models import User
from communities.models import Community
from posts.models import Post


@pytest.fixture
def community(db, user):
    return Community.objects.create(name='TestCommunity', about='Test', created_by=user)


@pytest.fixture
def post(db, user):
    return Post.objects.create(user=user, post_type='TEXT', content='Hello world!')


@pytest.mark.django_db
class TestPosts:
    def test_create_text_post(self, auth_client):
        res = auth_client.post('/api/v1/posts/create/', {
            'post_type': 'TEXT',
            'content': 'This is a test post',
        }, format='multipart')
        assert res.status_code == 201

    def test_create_post_missing_content(self, auth_client):
        res = auth_client.post('/api/v1/posts/create/', {
            'post_type': 'TEXT',
        }, format='multipart')
        assert res.status_code == 400

    def test_get_feed(self, auth_client, post):
        res = auth_client.get('/api/v1/posts/feed/')
        assert res.status_code == 200
        assert 'results' in res.data

    def test_react_to_post(self, auth_client, post):
        res = auth_client.post('/api/v1/posts/react/', {
            'post_id': post.id,
            'reaction_type': 'LIKE',
        })
        assert res.status_code == 200
        assert res.data['reacted'] is True

    def test_add_comment(self, auth_client, post):
        res = auth_client.post('/api/v1/posts/comment/', {
            'post_id': post.id,
            'content': 'Great post!',
        })
        assert res.status_code == 201

    def test_bookmark_post(self, auth_client, post):
        res = auth_client.post(f'/api/v1/posts/{post.id}/bookmark/')
        assert res.status_code == 200
        assert res.data['bookmarked'] is True

    def test_delete_post(self, auth_client, post):
        res = auth_client.delete(f'/api/v1/posts/{post.id}/delete/')
        assert res.status_code == 200

    def test_delete_others_post_forbidden(self, auth_client, admin_user):
        other_post = Post.objects.create(user=admin_user, post_type='TEXT', content='Admin post')
        res = auth_client.delete(f'/api/v1/posts/{other_post.id}/delete/')
        assert res.status_code == 403


@pytest.mark.django_db
class TestCommunityFeed:
    def test_community_feed(self, auth_client, community, post):
        post.community = community
        post.save()
        res = auth_client.get(f'/api/v1/posts/community/{community.id}/')
        assert res.status_code == 200

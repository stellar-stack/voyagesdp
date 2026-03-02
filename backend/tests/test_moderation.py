import pytest
from posts.models import Post
from moderation.models import Report


@pytest.fixture
def post(db, user):
    return Post.objects.create(user=user, post_type='TEXT', content='Content')


@pytest.mark.django_db
class TestModeration:
    def test_report_post(self, auth_client, post, admin_user):
        other_post = Post.objects.create(user=admin_user, post_type='TEXT', content='Other content')
        res = auth_client.post('/api/v1/moderation/reports/create/', {
            'post': other_post.id,
            'reason': 'Inappropriate content',
        })
        assert res.status_code == 201

    def test_cannot_report_own_post(self, auth_client, post):
        res = auth_client.post('/api/v1/moderation/reports/create/', {
            'post': post.id,
            'reason': 'Testing',
        })
        assert res.status_code == 400

    def test_list_reports_admin_only(self, auth_client):
        res = auth_client.get('/api/v1/moderation/reports/')
        assert res.status_code == 403

    def test_list_reports_as_admin(self, admin_client):
        res = admin_client.get('/api/v1/moderation/reports/')
        assert res.status_code == 200

    def test_get_notifications(self, auth_client):
        res = auth_client.get('/api/v1/moderation/notifications/')
        assert res.status_code == 200

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # API v1 — all app routes
    path('api/v1/auth/', include('api.urls')),
    path('api/v1/communities/', include('communities.urls')),
    path('api/v1/posts/', include('posts.urls')),
    path('api/v1/moderation/', include('moderation.urls')),
    path('api/v1/messages/', include('messaging.urls')),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

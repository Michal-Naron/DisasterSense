from django.urls import path
from .views import RegisterView, LoginView, PostFavoriteLocation

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('favorite-locations/', PostFavoriteLocation.as_view(), name='favorite-location-list')
    path('edit-user', UserView.as_view(), name="edit-user")
]
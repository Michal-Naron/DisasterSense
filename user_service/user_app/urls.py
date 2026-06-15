from django.urls import path
from .views import RegisterView, LoginView, FavoriteLocationView, UserView # Poprawione nazwy klas

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('favorite-locations/', FavoriteLocationView.as_view(), name='favorite-location-list'),
    path('edit-user/', UserView.as_view(), name="edit-user"), 
]
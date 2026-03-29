from weather.views import  WeatherProcessor

from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('v1/weather/<str:weather>', WeatherProcessor.as_view())
]

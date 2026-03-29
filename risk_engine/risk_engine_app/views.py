from rest_framework.views import APIView
import requests

class RiskCalculator(APIView):
    BASE_URL = "http://localhost:8000/v1/weather/"
    
    def get(self, requst):
        weather_types = [
        "snowfall","visibility","rain","temperature_2m",
        "wind_speed_10m","cloud_cover","surface_pressure"
        ]

        data = {}

        for weather in weather_types:
            response = requests.get(f"{BASE_URL}{weather}")
            response.raise_for_status()
            data[weather] = response.json()[weather]  
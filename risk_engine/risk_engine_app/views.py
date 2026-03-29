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
    
    
    def rain_score(self,value):
        if value == 0:
            return 0
        elif value <= 2:
            return 25
        elif value <= 5:
            return 50
        elif value <= 10:
            return 75
        else:
            return 100
    
    def snowfall_score(self, value):
        if value == 0:
            return 0
        elif value <= 1:
            return 25
        elif value <= 2:
            return 50
        elif value <= 5:
            return 75
        else:
            return 100

    def visibility_score(self, value):
        if value > 10000:
            return 0
        elif value > 5000:
            return 25
        elif value > 2000:
            return 50
        elif value > 500:
            return 75
        else:
            return 100
    
    def temperature_score(self, value):
        if 15 <= value <= 25:
            return 0
        elif 5 <= value < 15:
            return 25
        elif 0 <= value < 5:
            return 50
        elif -10 <= value < 0:
            return 75
        else:
            return 100
    
    def wind_score(self, value):
        if value <= 10:
            return 0
        elif value <= 25:
            return 25
        elif value <= 50:
            return 50
        elif value <= 75:
            return 75
        else:
            return 100
    
    def cloud_score(self, value):
        if value <= 20:
            return 0
        elif value <= 50:
            return 25
        elif value <= 75:
            return 50
        elif value <= 90:
            return 75
        else:
            return 100

    def pressure_score(self, value):
        if value > 1020:
            return 0
        elif value > 1010:
            return 25
        elif value > 1000:
            return 50
        elif value > 990:
            return 75
        else:
            return 100
    
    def calculate(self, data):
        """
        Calculate a weighted weather risk score (0–100) for each timestamp
        
        Args:
            data (dict): Weather data grouped by parameter and timestamp.

        Returns:
            dict: Mapping of timestamp to risk score (0–100).
        """
            
        
        risk_index = {}

        timestamps = list(data["rain"].keys())

        for ts in timestamps:
            risk = 0

            risk += self.rain_score(data["rain"][ts]) * 0.3
            risk += self.snowfall_score(data["snowfall"][ts]) * 0.2
            risk += self.visibility_score(data["visibility"][ts]) * 0.2
            risk += self.temperature_score(data["temperature_2m"][ts]) * 0.1
            risk += self.wind_score(data["wind_speed_10m"][ts]) * 0.1
            risk += self.cloud_score(data["cloud_cover"][ts]) * 0.05
            risk += self.pressure_score(data["surface_pressure"][ts]) * 0.05

            risk_index[ts] = risk  

        return risk_index
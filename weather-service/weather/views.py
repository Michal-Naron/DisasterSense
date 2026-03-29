from rest_framework.views import APIView
from rest_framework.response import Response
import requests

URL = "https://api.open-meteo.com/v1/forecast"

# parametres of Berlin
LON = 13.41
LAT = 52.52

class Process_Snowfall(APIView):
    def get(self, request):
        params = {
            "latitude": request.query_params.get("lat",LAT), 
            "longitude": request.query_params.get("lon",LON),
            "hourly": "snowfall",
            "forecast_days": 8
        }

        response = requests.get(URL, params=params).json()

        return response
            
class WeatherProcessor(APIView):
    def get(self, request, weather):
        if weather not in ("snowfall","visibility","rain","temperature_2m", "wind_speed_10m", "cloud_cover", "surface_pressure"):
            return Response({"msg": "Please fill the url one of them snowfall visibility rain v1/weather/<weather>"})       
        params = {
            "latitude": request.query_params.get("lat",LAT), 
            "longitude": request.query_params.get("lon",LON),
            "hourly": weather,
            "forecast_days": 8
        }
        response = requests.get(URL, params=params).json()
        
        times = response["hourly"]["time"]
        weather1 = response["hourly"][weather]
        
        result = {}
        
        for i in range(len(times)):
            time = times[i].split("-")[1:]
            result["-".join(time)] = weather1[i]
            
        
        return Response({weather:result})
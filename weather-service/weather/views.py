from rest_framework.views import APIView
from rest_framework.response import Response
import requests

URL = "https://api.open-meteo.com/v1/forecast"

def process_rain(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "rain",
        "forecast_days": 8
    }

    response = requests.get(URL, params=params).json()

    times = response["hourly"]["time"]
    rains = response["hourly"]["rain"]

    sum_of_rain = 0
    counter = 0
    rain_array_per_day = []

    for i in range(len(rains)):
        sum_of_rain += rains[i]
        counter += 1

        if counter == 24:
            date = times[i].split("T")[0]  # np. 2026-03-15
            avg_rain = sum_of_rain / 24

            if avg_rain == 0:
                category = "no rain"
            elif avg_rain <= 0.1:
                category = "very small rain"
            elif avg_rain <= 0.5:
                category = "small rain"
            elif avg_rain <= 1:
                category = "medium rain"
            else:
                category = "heavy rain"

            rain_array_per_day.append({
                "date": date,
                "rain_level": category
            })

            sum_of_rain = 0
            counter = 0

    return rain_array_per_day

def process_visibility(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "visibility",
        "forecast_days": 8
    }

    response = requests.get(URL, params=params).json()

    times = response["hourly"]["time"]
    visibility = response["hourly"]["visibility"]

    sum_visibility = 0
    counter = 0
    visibility_per_day = []

    for i in range(len(visibility)):
        sum_visibility += visibility[i]
        counter += 1

        if counter == 24:
            date = times[i].split("T")[0]
            avg_visibility = sum_visibility / 24

            if avg_visibility > 10000:
                category = "very good visibility"
            elif avg_visibility > 5000:
                category = "good visibility"
            elif avg_visibility > 2000:
                category = "medium visibility"
            elif avg_visibility > 1000:
                category = "poor visibility"
            else:
                category = "very poor visibility"

            visibility_per_day.append({
                "date": date,
                "visibility_level": category
            })

            sum_visibility = 0
            counter = 0

    return visibility_per_day


def process_snowfall(lat, lot):
    params = {
        "latitude": lat,
        "longitude": lot,
        "hourly": "snowfall",
        "forecast_days": 8
    }

    response = requests.get(URL, params=params).json()

    times = response["hourly"]["time"]
    snowfall = response["hourly"]["snowfall"]

    sum_of_snow = 0
    counter = 0
    snow_per_day = []

    for i in range(len(snowfall)):
        sum_of_snow += snowfall[i]
        counter += 1

        if counter == 24:
            date = times[i].split("T")[0]
            daily_snow = sum_of_snow

            if daily_snow == 0:
                category = "no snow"
            elif daily_snow <= 1:
                category = "very light snow"
            elif daily_snow <= 5:
                category = "light snow"
            elif daily_snow <= 15:
                category = "moderate snow"
            else:
                category = "heavy snow"

            snow_per_day.append({
                "date": date,
                "snow_level": category
            })

            sum_of_snow = 0
            counter = 0

    return snow_per_day
            
class WeatherProcessor(APIView):
    def get(self, request):
        lat = request.query_params.get("lat")  
        lon = request.query_params.get("lon")
        if not(isinstance(lat, int) or isinstance(lat, float)):  
            lat = 52.52
        if not(isinstance(lon, int) or isinstance(lon, float)):  
            lon = 13.41   

        data = {
            "snowfall":process_snowfall(lat,lon),
            "visibility":process_visibility(lat,lon),
            "rain":process_rain(lat,lon)
            
        }
        return Response(data)
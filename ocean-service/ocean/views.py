import requests
from django.http import JsonResponse


def ai_message(request):
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")

    weather_rain = requests.get(
        "http://weather-service:8000/v1/weather/rain",
        params={"lat": lat, "lon": lon}
    ).json()

    weather_temperature = requests.get(
        "http://weather-service:8000/v1/weather/temperature_2m",
        params={"lat": lat, "lon": lon}
    ).json()

    weather_wind = requests.get(
        "http://weather-service:8000/v1/weather/wind_speed_10m",
        params={"lat": lat, "lon": lon}
    ).json()

    temperature = list(weather_temperature["temperature_2m"].values())[0]
    rain = list(weather_rain["rain"].values())[0]
    wind = list(weather_wind["wind_speed_10m"].values())[0]

    prompt = f"""
            You are a weather assistant.

            Based on the provided weather data, generate exactly two short sentences.

            Weather data:
            - Temperature: {temperature}°C
            - Rainfall: {rain} mm
            - Wind speed: {wind} km/h

            Requirements:
            - First sentence: briefly describe the weather.
            - Second sentence: recommend what to wear.
            - Do not mention that you are an AI.
            - Do not add greetings, jokes, warnings, or extra explanations.
            - Maximum 25 words total.
            - Return only the final message.
        """

    response = requests.post(
            "http://ollama:11434/api/generate",
            json={
                "model": "qwen3:1.7b",
                "prompt": prompt,
                "stream": False
            }
        )

    data = response.json()

    return JsonResponse({
            "message": data
        })
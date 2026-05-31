from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        # zapisanie usera
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response({
            "user": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(access)
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response({
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(access)
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Nieprawidłowe dane logowania"}, status=status.HTTP_401_UNAUTHORIZED)

class PostFavoriteLocation(APIView):
    def post(self, request):
        username = request.data.get("username")
        favorite_location = request.data.get("favorite_location")
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "Użytkownik nie istnieje"}, status=404)
        
        new_favorite = FavoriteLocation.objects.create(
            user=user,
            city_name=favorite_location
        )
        
        return Response({
            "message": "Dodano do ulubionych",
            "username": user.username,
            "favorite_location": new_favorite.city_name
        })
    
    def get(self, request):
        username = request.query_params.get("username")
        
        if not username:
            return Response({"error": "Musisz podać username w query params"}, status=400)
        
        try:
            user = User.objects.get(username=username) 
        except User.DoesNotExist:
            return Response({"error": "Nieprawidłowa nazwa użytkownika"}, status=404)
        
        locations = user.favorite_locations.all()
        
        locations_list = [loc.city_name for loc in locations]
        
        return Response({"favorite_locations": locations_list})
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken



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

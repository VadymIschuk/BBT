from .models import CustomUser
from .serializers import RegisterSerializer
from .models import Report
from .serializers import ReportSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import IsAnalyst
from rest_framework.exceptions import PermissionDenied


class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class ReportCreate(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MyReportList(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(created_by=self.request.user).order_by(
            "-created_at"
        )


class ReportDelete(generics.DestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(created_by=self.request.user)
    def perform_destroy(self, instance):
        if instance.status != Report.Status.NEW:
            raise PermissionDenied("Можна видалити лише звіт зі статусом 'new'.")
        instance.delete()
    
class Me(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", "user")

        return Response({
            "username": user.username,
            "role": role,
            "is_staff": user.is_staff,
            "rating": user.rating,
        })


class ReportListAll(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated, IsAnalyst]

    def get_queryset(self):
        qs = Report.objects.all().order_by("-created_at")
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs

class ReportRetrieveUpdate(generics.RetrieveUpdateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated, IsAnalyst]
    queryset = Report.objects.all()
    http_method_names = ["get", "patch"]
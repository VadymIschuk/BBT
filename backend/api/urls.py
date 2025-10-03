from django.urls import path
from .views import CreateUserView,ReportCreate,ReportDelete,MyReportList
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

urlpatterns = [
    path("token/",TokenObtainPairView.as_view(),name="get_token"),
    path("token/refresh/",TokenRefreshView.as_view(),name="refresh"),
    path("auth/register/", CreateUserView.as_view(), name="auth_register"),
    path("reports/create/", ReportCreate.as_view(), name="report-create"),
    path("reports/mine/",   MyReportList.as_view(), name="report-mine"),
    path("reports/<int:pk>/delete/", ReportDelete.as_view(), name="report-delete"),
]
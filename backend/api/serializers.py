from rest_framework import serializers
from .models import CustomUser,Report

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "username", "email", "password", "phone_number", "role", "rating")
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user
    
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "cwe",
            "cvss_score",
            "description",
            "impact",
            "poc_file",
            "status",
            "rating",
            "created_at",
            "created_by",
        ]
        extra_kwargs = {
            "created_by": {"read_only": True},
            "rating": {"read_only": True},       
            "created_at": {"read_only": True},  
        }
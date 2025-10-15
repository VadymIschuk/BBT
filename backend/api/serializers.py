from rest_framework import serializers
from .models import CustomUser, Report


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "id",
            "username",
            "email",
            "password",
            "phone_number",
            "role",
            "rating",
        )
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


class ReportSerializer(serializers.ModelSerializer):
    can_delete = serializers.SerializerMethodField()

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
            "can_delete",
        ]
        extra_kwargs = {
            "created_by": {"read_only": True},
            "created_at": {"read_only": True},
        }

    def get_can_delete(self, obj):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and obj.created_by_id == request.user.id
            and obj.status == Report.Status.NEW
        )

    def validate_rating(self, v):
        if v is None:
            return 0
        v = int(v)
        if not (0 <= v <= 5):
            raise serializers.ValidationError("Оцінка має бути від 0 до 5.")
        return v

    def update(self, instance, validated_data):
        allowed = {"status", "rating"}
        for k in list(validated_data.keys()):
            if k not in allowed:
                validated_data.pop(k)
        return super().update(instance, validated_data)
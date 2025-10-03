from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class CustomUser(AbstractUser):

    phone_validator = RegexValidator(
        regex=r"^\+?\d{7,15}$",
        message="Телефон повинен містити тільки цифри і опціонально '+' на початку (7-15 цифр).",
    )
    phone_number = models.CharField(
        max_length=16, validators=[phone_validator], blank=True, null=True, unique=True
    )

    email = models.EmailField(blank=True, null=True, unique=True)

    HUNTER = "hunter"
    ANALYST = "analyst"
    ROLE_CHOICES = [
        (HUNTER, "Hunter"),
        (ANALYST, "Analyst"),
    ]
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default=HUNTER, db_index=True
    )

    rating = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    def update_rating(self):
        total = sum(r.rating for r in self.reports.all())
        self.rating = total
        self.save(update_fields=["rating"])

    def __str__(self):
        return str(self.username)


class Report(models.Model):
    title = models.CharField(max_length=255)
    cwe = models.CharField(max_length=50, blank=True, null=True)

    cvss_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        blank=True,
        null=True,
        help_text="CVSS v3.1 (0.0–10.0)",
    )

    description = models.TextField()
    impact = models.TextField(blank=True, null=True)

    poc_file = models.FileField(
        upload_to="reports/poc/",
        blank=True,
        null=True,
        help_text="Завантаж файл з PoC (скрипт/архів/відео/скрін тощо)",
    )

    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_REVIEW = "in_review", "In Review"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)

    rating = models.PositiveSmallIntegerField(default=0)
    created_by = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="reports"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["cwe"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.cwe or 'no-CWE'})"

    @property
    def cvss_label(self) -> str:
        """Повертає рядок формату '5.5 (Medium)' або '' якщо score немає."""
        if self.cvss_score is None:
            return ""
        s = float(self.cvss_score)
        if s >= 9.0:
            sev = "Critical"
        elif s >= 7.0:
            sev = "High"
        elif s >= 4.0:
            sev = "Medium"
        elif s > 0:
            sev = "Low"
        else:
            sev = "None"
        return f"{s:.1f} ({sev})"


@receiver([post_save, post_delete], sender=Report)
def update_user_rating(sender, instance, **kwargs):
    if instance.created_by:
        instance.created_by.update_rating()

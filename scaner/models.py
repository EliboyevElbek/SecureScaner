from django.db import models
from django.utils import timezone
import json

# Create your models here.

class DomainScan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('scanning', 'Tahlil qilinmoqda'),
        ('completed', 'Tugallandi'),
        ('failed', 'Xatolik'),
    ]
    
    domain_name = models.CharField(max_length=255, verbose_name="Domain nomi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Holat")
    scan_date = models.DateTimeField(default=timezone.now, verbose_name="Tahlil sanasi")
    scan_result = models.JSONField(default=dict, verbose_name="Tahlil natijasi")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP manzil")
    dns_records = models.JSONField(default=dict, verbose_name="DNS yozuvlari")
    ssl_info = models.JSONField(default=dict, verbose_name="SSL ma'lumotlari")
    security_headers = models.JSONField(default=dict, verbose_name="Xavfsizlik sarlavhalari")
    error_message = models.TextField(blank=True, null=True, verbose_name="Xatolik xabari")
    
    class Meta:
        verbose_name = "Domain Tahlil"
        verbose_name_plural = "Domain Tahlillar"
        ordering = ['-scan_date']
        indexes = [
            models.Index(fields=['domain_name']),
            models.Index(fields=['status']),
            models.Index(fields=['scan_date']),
        ]
    
    def __str__(self):
        return f"{self.domain_name} - {self.get_status_display()}"
    
    def get_duration(self):
        """Tahlil davomiyligini hisoblash"""
        if self.status == 'completed':
            return "0.5 soniya"
        return "N/A"
    
    def get_status_color(self):
        """Status uchun rang"""
        colors = {
            'pending': 'warning',
            'scanning': 'info',
            'completed': 'success',
            'failed': 'danger',
        }
        return colors.get(self.status, 'secondary')

class KeshDomain(models.Model):
    domain_name = models.CharField(max_length=255, verbose_name="Domain nomi", unique=True)
    nmap = models.TextField(default="nmap {domain}", verbose_name="Nmap buyrug'i")
    sqlmap = models.TextField(default="sqlmap -u https://{domain}", verbose_name="SQLMap buyrug'i")
    xsstrike = models.TextField(default="xsstrike -u https://{domain}", verbose_name="XSStrike buyrug'i")
    gobuster = models.TextField(default="gobuster dir -u https://{domain} -w common.txt", verbose_name="Gobuster buyrug'i")
    
    class Meta:
        verbose_name = "Kesh Domain"
        verbose_name_plural = "Kesh Domainlar"
        ordering = ['domain_name']
        indexes = [
            models.Index(fields=['domain_name']),
        ]
    
    def __str__(self):
        return self.domain_name

class Tool(models.Model):
    TOOL_TYPES = [
        ('sqlmap', 'SQLMap'),
        ('nmap', 'Nmap'),
        ('xsstrike', 'XSStrike'),
        ('gobuster', 'Gobuster'),
        ('custom', 'Boshqa'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Tool nomi")
    tool_type = models.CharField(max_length=20, choices=TOOL_TYPES, verbose_name="Tool turi")
    executable_path = models.CharField(max_length=500, verbose_name="Ishlatish yo'li")
    description = models.TextField(blank=True, verbose_name="Tavsif")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Yaratilgan sana")
    
    class Meta:
        verbose_name = "Tool"
        verbose_name_plural = "Tool'lar"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class ToolParameter(models.Model):
    PARAMETER_TYPES = [
        ('flag', 'Bayroq'),
        ('option', 'Variant'),
        ('input', 'Kiritish'),
        ('checkbox', 'Belgilash'),
    ]
    
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='parameters', verbose_name="Tool")
    name = models.CharField(max_length=100, verbose_name="Parametr nomi")
    short_name = models.CharField(max_length=20, blank=True, verbose_name="Qisqa nom")
    parameter_type = models.CharField(max_length=20, choices=PARAMETER_TYPES, verbose_name="Parametr turi")
    description = models.TextField(blank=True, verbose_name="Tavsif")
    default_value = models.CharField(max_length=255, blank=True, verbose_name="Standart qiymat")
    is_required = models.BooleanField(default=False, verbose_name="Majburiy")
    order = models.IntegerField(default=0, verbose_name="Tartib")
    
    class Meta:
        verbose_name = "Tool Parametri"
        verbose_name_plural = "Tool Parametrlari"
        ordering = ['tool', 'order']
    
    def __str__(self):
        return f"{self.tool.name} - {self.name}"

class ScanSession(models.Model):
    STATUS_CHOICES = [
        ('preparing', 'Tayyorlanmoqda'),
        ('running', 'Ishlayapti'),
        ('completed', 'Tugallandi'),
        ('failed', 'Xatolik'),
        ('cancelled', 'Bekor qilindi'),
    ]
    
    name = models.CharField(max_length=255, verbose_name="Sessiya nomi")
    domains = models.JSONField(default=list, verbose_name="Domainlar")
    tools = models.JSONField(default=list, verbose_name="Tool'lar")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='preparing', verbose_name="Holat")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Yaratilgan sana")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="Boshlangan sana")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Tugallangan sana")
    results = models.JSONField(default=dict, verbose_name="Natijalar")
    error_message = models.TextField(blank=True, null=True, verbose_name="Xatolik xabari")
    
    class Meta:
        verbose_name = "Tahlil Sessiyasi"
        verbose_name_plural = "Tahlil Sessiyalari"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    def get_duration(self):
        """Sessiya davomiyligini hisoblash"""
        if self.started_at and self.completed_at:
            duration = self.completed_at - self.started_at
            return f"{duration.total_seconds():.1f} soniya"
        elif self.started_at:
            duration = timezone.now() - self.started_at
            return f"{duration.total_seconds():.1f} soniya"
        return "N/A"
    
    def get_progress(self):
        """Progress foizini hisoblash"""
        if self.status == 'completed':
            return 100
        elif self.status == 'running' and self.started_at:
            # Taxminiy progress
            return 50
        return 0

class ToolExecution(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Kutilmoqda'),
        ('running', 'Ishlayapti'),
        ('completed', 'Tugallandi'),
        ('failed', 'Xatolik'),
    ]
    
    scan_session = models.ForeignKey(ScanSession, on_delete=models.CASCADE, related_name='executions', verbose_name="Tahlil sessiyasi")
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, verbose_name="Tool")
    domain = models.CharField(max_length=255, verbose_name="Domain")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Holat")
    command = models.TextField(verbose_name="Buyruq")
    parameters = models.JSONField(default=dict, verbose_name="Parametrlar")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="Boshlangan sana")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Tugallangan sana")
    output = models.TextField(blank=True, verbose_name="Natija")
    error_output = models.TextField(blank=True, verbose_name="Xatolik")
    exit_code = models.IntegerField(null=True, blank=True, verbose_name="Chiqish kodi")
    
    class Meta:
        verbose_name = "Tool Ishga tushirish"
        verbose_name_plural = "Tool Ishga tushirishlar"
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.tool.name} - {self.domain} - {self.get_status_display()}"
    
    def get_duration(self):
        """Ishlash davomiyligini hisoblash"""
        if self.started_at and self.completed_at:
            duration = self.completed_at - self.started_at
            return f"{duration.total_seconds():.1f} soniya"
        elif self.started_at:
            duration = timezone.now() - self.started_at
            return f"{duration.total_seconds():.1f} soniya"
        return "N/A"

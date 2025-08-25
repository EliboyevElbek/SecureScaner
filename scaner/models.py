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
    tool_results = models.JSONField(default=dict, verbose_name="Tool tahlil natijalari")
    raw_tool_output = models.JSONField(default=dict, verbose_name="Tool raw natijalari")
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
    tool_commands = models.JSONField(default=list, verbose_name="Tool buyruqlari", help_text="Tool va buyruqlar ro'yxati")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Yaratilgan sana")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    
    class Meta:
        verbose_name = "Kesh Domain"
        verbose_name_plural = "Kesh Domainlar"
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['domain_name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return self.domain_name
    
    def get_tool_command(self, tool_type):
        """Ma'lum tool uchun buyruqni olish"""
        for command in self.tool_commands:
            if tool_type in command:
                return command[tool_type]
        return None
    
    def update_tool_command(self, tool_type, command):
        """Tool buyruqini yangilash yoki qo'shish"""
        # Mavjud buyruqni topish
        for i, command_item in enumerate(self.tool_commands):
            if tool_type in command_item:
                self.tool_commands[i] = {tool_type: command}
                self.save()
                return
        
        # Yangi buyruq qo'shish
        self.tool_commands.append({tool_type: command})
        self.save()
    
    def update_all_tool_commands(self, new_tool_commands):
        """Barcha tool buyruqlarini bir vaqtda yangilash"""
        self.tool_commands = new_tool_commands
        self.save()
    
    def merge_tool_commands(self, new_tool_commands):
        """Yangi tool buyruqlarini mavjudlar bilan birlashtirish"""
        # Mavjud buyruqlarni dictionary ga o'tkazish
        existing_commands = {}
        for command_item in self.tool_commands:
            for tool_type, command in command_item.items():
                existing_commands[tool_type] = command
        
        # Yangi buyruqlarni qo'shish yoki yangilash
        for command_item in new_tool_commands:
            for tool_type, command in command_item.items():
                existing_commands[tool_type] = command
        
        # Dictionary ni qayta list ga o'tkazish
        self.tool_commands = [{tool_type: command} for tool_type, command in existing_commands.items()]
        self.save()

class DomainToolConfiguration(models.Model):
    """Domain va tool konfiguratsiyasi"""
    domain = models.ForeignKey(KeshDomain, on_delete=models.CASCADE, related_name='tool_configs', verbose_name="Domain")
    tool_type = models.CharField(max_length=50, verbose_name="Tool turi")
    base_command = models.TextField(verbose_name="Asosiy buyruq")
    selected_parameters = models.JSONField(default=list, verbose_name="Tanlangan parametrlar")
    final_command = models.TextField(verbose_name="Yakuniy buyruq")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Yaratilgan sana")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan sana")
    
    class Meta:
        verbose_name = "Domain Tool Konfiguratsiyasi"
        verbose_name_plural = "Domain Tool Konfiguratsiyalari"
        unique_together = ['domain', 'tool_type']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.domain.domain_name} - {self.tool_type}"
    
    def update_parameters(self, parameters):
        """Parametrlarni yangilash va yakuniy buyruqni hisoblash"""
        self.selected_parameters = parameters
        self.final_command = f"{self.base_command} {' '.join(parameters)}"
        self.save()

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
    """Skan sessiyasi - yangi tahlillar uchun"""
    domains = models.JSONField(default=list, verbose_name="Domainlar")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Yaratilgan sana")
    
    class Meta:
        verbose_name = "Skan Sessiyasi"
        verbose_name_plural = "Skan Sessiyalari"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Sessiya {self.id} - {len(self.domains)} ta domain - {self.created_at.strftime('%d.%m.%Y %H:%M')}"

# ToolExecution modeli endi kerak emas, chunki ScanSession soddalashtirildi

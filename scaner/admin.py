from django.contrib import admin
from .models import DomainScan, Tool, KeshDomain, DomainToolConfiguration, ScanSession, ScanProcess

# Register your models here.

@admin.register(DomainScan)
class DomainScanAdmin(admin.ModelAdmin):
    list_display = ['domain_name', 'status', 'scan_date', 'ip_address']
    list_filter = ['status', 'scan_date']
    search_fields = ['domain_name', 'ip_address']
    readonly_fields = ['scan_date']
    ordering = ['-scan_date']

@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

@admin.register(KeshDomain)
class KeshDomainAdmin(admin.ModelAdmin):
    list_display = ['domain_name', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['domain_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(DomainToolConfiguration)
class DomainToolConfigurationAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tool_type', 'is_active', 'created_at']
    list_filter = ['tool_type', 'is_active', 'created_at']
    search_fields = ['domain__domain_name', 'tool_type']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ScanSession)
class ScanSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'domains', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']

@admin.register(ScanProcess)
class ScanProcessAdmin(admin.ModelAdmin):
    list_display = ['domain_name', 'tool_type', 'status', 'start_time', 'end_time']
    list_filter = ['status', 'tool_type', 'start_time']
    search_fields = ['domain_name', 'tool_type']
    readonly_fields = ['start_time', 'end_time', 'output_buffer']
    ordering = ['-start_time']

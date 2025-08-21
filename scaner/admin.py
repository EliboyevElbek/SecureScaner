from django.contrib import admin
from .models import DomainScan, Tool, ToolParameter, ScanSession, ToolExecution, KeshDomain, DomainToolConfiguration

# Register your models here.

@admin.register(KeshDomain)
class KeshDomainAdmin(admin.ModelAdmin):
    list_display = ['domain_name', 'tool_commands_count', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['domain_name']
    ordering = ['-updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('domain_name', 'is_active')
        }),
        ('Tool buyruqlari', {
            'fields': ('tool_commands',),
            'description': 'Tool va buyruqlar ro\'yxati. Namuna: [{"sqlmap": "sqlmap -u https://example.com --dbs"}, {"nmap": "nmap example.com -sS"}]'
        }),
        ('Vaqt ma\'lumotlari', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def tool_commands_count(self, obj):
        return len(obj.tool_commands) if obj.tool_commands else 0
    tool_commands_count.short_description = "Tool buyruqlari soni"

@admin.register(DomainScan)
class DomainScanAdmin(admin.ModelAdmin):
    list_display = ['domain_name', 'status', 'ip_address', 'scan_date', 'get_duration']
    list_filter = ['status', 'scan_date']
    search_fields = ['domain_name', 'ip_address']
    readonly_fields = ['scan_date', 'scan_result', 'dns_records', 'ssl_info', 'security_headers']
    date_hierarchy = 'scan_date'
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('domain_name', 'status', 'scan_date')
        }),
        ('Tahlil natijalari', {
            'fields': ('ip_address', 'dns_records', 'ssl_info', 'security_headers', 'scan_result')
        }),
        ('Xatolik ma\'lumotlari', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False

@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ['name', 'tool_type', 'is_active', 'created_at']
    list_filter = ['tool_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('name', 'tool_type', 'description', 'is_active')
        }),
        ('Ishlatish', {
            'fields': ('executable_path',)
        }),
        ('Vaqt', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(ToolParameter)
class ToolParameterAdmin(admin.ModelAdmin):
    list_display = ['tool', 'name', 'short_name', 'parameter_type', 'is_required', 'order']
    list_filter = ['tool', 'parameter_type', 'is_required']
    search_fields = ['name', 'short_name', 'description']
    ordering = ['tool', 'order']
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('tool', 'name', 'short_name', 'description')
        }),
        ('Parametr xususiyatlari', {
            'fields': ('parameter_type', 'default_value', 'is_required', 'order')
        }),
    )

@admin.register(ScanSession)
class ScanSessionAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'domains_count', 'tools_count', 'created_at', 'get_duration']
    list_filter = ['status', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'started_at', 'completed_at', 'results']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('name', 'status', 'domains', 'tools')
        }),
        ('Vaqt ma\'lumotlari', {
            'fields': ('created_at', 'started_at', 'completed_at')
        }),
        ('Natijalar', {
            'fields': ('results', 'error_message'),
            'classes': ('collapse',)
        }),
    )
    
    def domains_count(self, obj):
        return len(obj.domains) if obj.domains else 0
    domains_count.short_description = "Domainlar soni"
    
    def tools_count(self, obj):
        return len(obj.tools) if obj.tools else 0
    tools_count.short_description = "Tool'lar soni"
    
    def get_duration(self, obj):
        return obj.get_duration()
    get_duration.short_description = "Davomiyligi"

@admin.register(ToolExecution)
class ToolExecutionAdmin(admin.ModelAdmin):
    list_display = ['tool', 'domain', 'status', 'scan_session', 'started_at', 'get_duration']
    list_filter = ['status', 'tool', 'scan_session']
    search_fields = ['domain', 'tool__name']
    readonly_fields = ['started_at', 'completed_at', 'output', 'error_output', 'exit_code']
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('scan_session', 'tool', 'domain', 'status')
        }),
        ('Ishga tushirish', {
            'fields': ('command', 'parameters')
        }),
        ('Natijalar', {
            'fields': ('output', 'error_output', 'exit_code')
        }),
        ('Vaqt ma\'lumotlari', {
            'fields': ('started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_duration(self, obj):
        return obj.get_duration()
    get_duration.short_description = "Davomiyligi"

@admin.register(DomainToolConfiguration)
class DomainToolConfigurationAdmin(admin.ModelAdmin):
    list_display = ['domain', 'tool_type', 'base_command', 'parameters_count', 'is_active', 'updated_at']
    list_filter = ['tool_type', 'is_active', 'created_at', 'updated_at']
    search_fields = ['domain__domain_name', 'tool_type']
    ordering = ['-updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Asosiy ma\'lumotlar', {
            'fields': ('domain', 'tool_type', 'is_active')
        }),
        ('Buyruq ma\'lumotlari', {
            'fields': ('base_command', 'selected_parameters', 'final_command')
        }),
        ('Vaqt ma\'lumotlari', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def parameters_count(self, obj):
        return len(obj.selected_parameters) if obj.selected_parameters else 0
    parameters_count.short_description = "Parametrlar soni"

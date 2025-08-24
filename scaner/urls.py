from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('scaner/', views.scan, name='scan'),
    path('scaner/history/', views.scan_history, name='scan_history'),
    path('scaner/save-domains/', views.save_domains, name='save_domains'),
    path('scaner/delete-domain/', views.delete_domain, name='delete_domain'),
    path('scaner/clear-all-domains/', views.clear_all_domains, name='clear_all_domains'),
    path('scaner/update-domain/', views.update_domain, name='update_domain'),
    path('scaner/update-tool-commands/', views.update_tool_commands, name='update_tool_commands'),
    path('scaner/get-tools/', views.get_tools, name='get_tools'),
    path('scaner/get-domain-tool-config/', views.get_domain_tool_config, name='get_domain_tool_config'),
    path('scaner/save-domain-tool-config/', views.save_domain_tool_config, name='save_domain_tool_config'),
    path('scaner/get-domain-tools-preview/', views.get_domain_tools_preview, name='get_domain_tools_preview'),
    path('scaner/scan-progress/', views.scan_progress, name='scan_progress'),
    path('api/scan-details/<int:scan_id>/', views.viewScanDetails, name='scan_details'),
    path('tools/', views.tools, name='tools'),
    path('tools/<str:tool_name>/', views.tool_detail, name='tool_detail'),
]
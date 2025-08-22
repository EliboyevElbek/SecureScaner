from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('scan/', views.scan, name='scan'),
    path('scan-history/', views.scan_history, name='scan_history'),
    path('save-domains/', views.save_domains, name='save_domains'),
    path('delete-domain/', views.delete_domain, name='delete_domain'),
    path('clear-all-domains/', views.clear_all_domains, name='clear_all_domains'),
    path('update-domain/', views.update_domain, name='update_domain'),
    path('get-domain-tools-preview/', views.get_domain_tools_preview, name='get_domain_tools_preview'),
    path('update-tool-commands/', views.update_tool_commands, name='update_tool_commands'),
    path('get-tools/', views.get_tools, name='get_tools'),
    path('get-domain-tool-config/', views.get_domain_tool_config, name='get_domain_tool_config'),
    path('save-domain-tool-config/', views.save_domain_tool_config, name='save_domain_tool_config'),
    path('get-tool-parameters/', views.get_tool_parameters, name='get_tool_parameters'),
    path('get-domain-parameter-values/', views.get_domain_parameter_values, name='get_domain_parameter_values'),
    path('save-parameter-values/', views.save_parameter_values, name='save_parameter_values'),
    path('get-tool-preview/', views.get_tool_preview, name='get_tool_preview'),
    path('tool-parameters/', views.tool_parameters_view, name='tool_parameters'),
    path('tools/', views.tools, name='tools'),
    path('tools/<str:tool_name>/', views.tool_detail, name='tool_detail'),
    path('api/scan-details/<int:scan_id>/', views.viewScanDetails, name='scan_details'),
]
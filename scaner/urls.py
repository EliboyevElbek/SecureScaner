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
    path('scaner/get-tools/', views.get_tools, name='get_tools'),
    path('scaner/save-tool-commands/', views.save_tool_commands, name='save_tool_commands'),
    path('api/scan-details/<int:scan_id>/', views.viewScanDetails, name='scan_details'),
    path('tools/', views.tools, name='tools'),
    path('tools/<str:tool_name>/', views.tool_detail, name='tool_detail'),
]
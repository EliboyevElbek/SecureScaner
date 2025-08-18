from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('scaner/', views.scan, name='scan'),
    path('scaner/history/', views.scan_history, name='scan_history'),
    path('scaner/edit/<str:domain>/', views.edit_domain, name='edit_domain'),
]
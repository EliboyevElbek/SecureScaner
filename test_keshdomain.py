#!/usr/bin/env python3
"""
KeshDomain bazasini test qilish uchun script
"""

import os
import sys
import django

# Django environment ni sozlash
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from scaner.models import KeshDomain

def test_keshdomain():
    """KeshDomain bazasini test qilish"""
    print("KeshDomain bazasini test qilish...")
    
    # Mavjud domainlarni ko'rish
    domains = KeshDomain.objects.all()
    print(f"Jami {domains.count()} ta domain topildi:")
    
    for domain in domains:
        print(f"\nDomain: {domain.domain_name}")
        print(f"Tool buyruqlari: {domain.tool_commands}")
        print(f"Yaratilgan: {domain.created_at}")
        print(f"Yangilangan: {domain.updated_at}")
        print(f"Faol: {domain.is_active}")
    
    # Yangi test domain qo'shish
    test_domain = "test-example.com"
    test_commands = [
        {"sqlmap": "sqlmap -u https://test-example.com"},
        {"nmap": "nmap test-example.com"},
        {"xsstrike": "xsstrike -u https://test-example.com"},
        {"gobuster": "gobuster dir -u https://test-example.com -w wordlist.txt"}
    ]
    
    # Mavjud bo'lsa o'chirish
    KeshDomain.objects.filter(domain_name=test_domain).delete()
    
    # Yangi domain qo'shish
    new_domain = KeshDomain.objects.create(
        domain_name=test_domain,
        tool_commands=test_commands
    )
    
    print(f"\nYangi test domain qo'shildi: {new_domain.domain_name}")
    print(f"Tool buyruqlari: {new_domain.tool_commands}")
    
    # Test buyruqni olish
    nmap_cmd = new_domain.get_tool_command('nmap')
    print(f"\nNmap buyruq: {nmap_cmd}")
    
    # Buyruqni yangilash
    new_domain.update_tool_command('nmap', 'nmap -sS -sV test-example.com')
    print(f"Yangilangan nmap buyruq: {new_domain.get_tool_command('nmap')}")
    
    print("\nTest muvaffaqiyatli tugadi!")

if __name__ == "__main__":
    test_keshdomain()

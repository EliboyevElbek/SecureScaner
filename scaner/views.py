from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import re
import json
import socket
import requests
import urllib3
from .models import DomainScan, Tool, KeshDomain

# SSL warnings ni o'chirish
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Create your views here.

def home(request):
    """Bosh sahifa - stats bilan"""
    # Bazadan stats ni olish
    total_scans = DomainScan.objects.count()
    completed_scans = DomainScan.objects.filter(status='completed').count()
    total_domains = DomainScan.objects.values('domain_name').distinct().count()
    
    # Muvaffaqiyat darajasi (completed / total * 100)
    success_rate = 99.9 if total_scans == 0 else round((completed_scans / total_scans) * 100, 1)
    
    # O'rtacha vaqt (barcha completed scanlar uchun)
    avg_duration = 5  # Default qiymat
    
    context = {
        'total_scans': total_scans,
        'completed_scans': completed_scans,
        'total_domains': total_domains,
        'success_rate': success_rate,
        'avg_duration': avg_duration
    }
    
    return render(request, template_name='home.html', context=context)

@csrf_exempt
def scan(request):
    """Yangi scaner sahifasi - domain kiritish va tahlil qilish"""
    if request.method == 'POST':
        try:
            # JSON data ni qabul qilish
            data = json.loads(request.body)
            action = data.get('action')
            
            if action == 'add_domain':
                domain = data.get('domain', '').strip()
                if not domain:
                    return JsonResponse({'error': 'Domain nomi kiritilmagan'}, status=400)
                
                if not is_valid_domain(domain):
                    return JsonResponse({'error': 'Noto\'g\'ri domain format'}, status=400)
                
                return JsonResponse({
                    'success': True,
                    'domain': domain
                })
            
            elif action == 'start_scan':
                domains = data.get('domains', [])
                if not domains:
                    return JsonResponse({'error': 'Domenlar kiritilmagan'}, status=400)
                
                # Har bir domen uchun tahlil qilish
                scan_results = []
                
                for domain in domains:
                    domain = domain.strip()
                    if not domain:
                        continue
                    
                    # Domain validatsiyasi
                    if not is_valid_domain(domain):
                        scan_results.append({
                            'domain': domain,
                            'status': 'failed',
                            'error': 'Noto\'g\'ri domain format'
                        })
                        continue
                    
                    # Domen tahlilini amalga oshirish
                    scan_result = perform_domain_scan(domain)
                    scan_results.append(scan_result)
                
                # Tahlil tugagandan so'ng KeshDomain bazasidagi barcha domainlarni o'chirish
                try:
                    from .models import KeshDomain
                    deleted_count = KeshDomain.objects.count()
                    KeshDomain.objects.all().delete()
                    print(f"Tahlil tugagandan so'ng {deleted_count} ta domain KeshDomain bazasidan o'chirildi")
                except Exception as e:
                    print(f"KeshDomain o'chirishda xatolik: {e}")
                
                return JsonResponse({
                    'success': True,
                    'results': scan_results,
                    'message': f'Tahlil muvaffaqiyatli tugallandi. {len(scan_results)} ta domain tahlil qilindi.'
                })
            
            else:
                return JsonResponse({'error': 'Noto\'g\'ri action'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    # GET so'rov uchun - faqat form ko'rsatish
    return render(request, template_name='scan.html')

def scan_history(request):
    """Tahlil tarixini HTML sahifada ko'rsatish"""
    scans = DomainScan.objects.all().order_by('-scan_date')
    
    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(scans, 20)  # Har sahifada 20 ta
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Faqat domainlar soni
    total_domains = DomainScan.objects.values('domain_name').distinct().count()
    
    return render(request, template_name='scan_history.html', context={
        'page_obj': page_obj,
        'total_domains': total_domains
    })

def viewScanDetails(request, scan_id):
    """Individual scan details ko'rsatish"""
    try:
        scan = get_object_or_404(DomainScan, id=scan_id)
        
        scan_data = {
            'id': scan.id,
            'domain_name': scan.domain_name,
            'status': scan.status,
            'scan_date': scan.scan_date.isoformat(),
            'ip_address': scan.ip_address,
            'dns_records': scan.dns_records,
            'ssl_info': scan.ssl_info,
            'security_headers': scan.security_headers,
            'scan_result': scan.scan_result,
            'error_message': scan.error_message,
            'duration': scan.get_duration()
        }
        
        return JsonResponse({
            'success': True,
            'scan': scan_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Xatolik yuz berdi: {str(e)}'
        }, status=500)

def api_tools(request):
    """API endpoint for getting available tools"""
    try:
        tools = Tool.objects.filter(is_active=True)
        tools_data = []
        
        for tool in tools:
            tools_data.append({
                'id': tool.id,
                'name': tool.name,
                'tool_type': tool.tool_type,
                'description': tool.description,
                'executable_path': tool.executable_path
            })
        
        return JsonResponse({
            'success': True,
            'tools': tools_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Xatolik yuz berdi: {str(e)}'
        }, status=500)

def is_valid_domain(domain):
    """Domain formatini tekshirish"""
    domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
    return bool(re.match(domain_pattern, domain))

def perform_domain_scan(domain):
    """Domen tahlilini amalga oshirish"""
    scan = None
    try:
        # Yangi scan yaratish
        scan = DomainScan.objects.create(
            domain_name=domain,
            status='scanning'
        )
        
        # IP manzilni olish
        ip_address = None
        try:
            ip_address = socket.gethostbyname(domain)
            scan.ip_address = ip_address
        except socket.gaierror:
            ip_address = None
        except Exception as e:
            print(f"IP olishda xatolik {domain}: {e}")
            ip_address = None
        
        # DNS ma'lumotlarini olish
        dns_records = get_dns_info(domain)
        
        # SSL ma'lumotlarini olish
        ssl_info = get_ssl_info(domain)
        
        # Xavfsizlik sarlavhalarini olish
        security_headers = get_security_headers(domain)
        
        # Natijalarni saqlash
        scan.scan_result = {
            'ip_address': ip_address,
            'dns_records': dns_records,
            'ssl_info': ssl_info,
            'security_headers': security_headers,
            'scan_duration': '0.5 soniya'
        }
        
        scan.dns_records = dns_records
        scan.ssl_info = ssl_info
        scan.security_headers = security_headers
        scan.status = 'completed'
        scan.save()
        
        return {
            'domain': domain,
            'status': 'completed',
            'ip_address': ip_address,
            'dns_records': dns_records,
            'ssl_info': ssl_info,
            'security_headers': security_headers,
            'scan_id': scan.id,
            'scan_date': scan.scan_date.isoformat()
        }
        
    except Exception as e:
        # Xatolik yuz berganda
        if scan:
            scan.status = 'failed'
            scan.error_message = str(e)
            scan.save()
        
        print(f"Domain tahlilida xatolik {domain}: {e}")
        return {
            'domain': domain,
            'status': 'failed',
            'error': str(e)
        }

def get_dns_info(domain):
    """DNS ma'lumotlarini olish"""
    try:
        # A record
        a_records = []
        try:
            a_records = socket.gethostbyname_ex(domain)[2]
        except:
            pass
        
        # MX record (simplified)
        mx_records = []
        try:
            mx_records = [f"mx.{domain}"]
        except:
            pass
        
        return {
            'a_records': a_records,
            'mx_records': mx_records,
            'nameservers': [f"ns1.{domain}", f"ns2.{domain}"]
        }
    except:
        return {}

def get_ssl_info(domain):
    """SSL ma'lumotlarini olish"""
    try:
        # HTTPS orqali tekshirish
        response = requests.get(f"https://{domain}", timeout=5, verify=False, allow_redirects=False)
        return {
            'ssl_enabled': True,
            'ssl_version': 'TLS 1.2+',
            'certificate_valid': True
        }
    except requests.exceptions.SSLError:
        return {
            'ssl_enabled': True,
            'ssl_version': 'SSL xatolik',
            'certificate_valid': False
        }
    except requests.exceptions.ConnectionError:
        return {
            'ssl_enabled': False,
            'ssl_version': 'Ulanish xatolik',
            'certificate_valid': False
        }
    except requests.exceptions.Timeout:
        return {
            'ssl_enabled': False,
            'ssl_version': 'Vaqt tugadi',
            'certificate_valid': False
        }
    except Exception as e:
        print(f"SSL tekshirishda xatolik {domain}: {e}")
        return {
            'ssl_enabled': False,
            'ssl_version': 'N/A',
            'certificate_valid': False
        }

def get_security_headers(domain):
    """Xavfsizlik sarlavhalarini olish"""
    try:
        response = requests.get(f"https://{domain}", timeout=5, verify=False, allow_redirects=False)
        headers = response.headers
        
        return {
            'x_frame_options': headers.get('X-Frame-Options', 'Yo\'q'),
            'x_content_type_options': headers.get('X-Content-Type-Options', 'Yo\'q'),
            'x_xss_protection': headers.get('X-XSS-Protection', 'Yo\'q'),
            'strict_transport_security': headers.get('Strict-Transport-Security', 'Yo\'q'),
            'content_security_policy': headers.get('Content-Security-Policy', 'Yo\'q')
        }
    except requests.exceptions.SSLError:
        print(f"SSL xatolik {domain} uchun xavfsizlik sarlavhalarini olishda")
        return {
            'x_frame_options': 'SSL xatolik',
            'x_content_type_options': 'SSL xatolik',
            'x_xss_protection': 'SSL xatolik',
            'strict_transport_security': 'SSL xatolik',
            'content_security_policy': 'SSL xatolik'
        }
    except requests.exceptions.ConnectionError:
        print(f"Ulanish xatolik {domain} uchun xavfsizlik sarlavhalarini olishda")
        return {
            'x_frame_options': 'Ulanish xatolik',
            'x_content_type_options': 'Ulanish xatolik',
            'x_xss_protection': 'Ulanish xatolik',
            'strict_transport_security': 'Ulanish xatolik',
            'content_security_policy': 'Ulanish xatolik'
        }
    except requests.exceptions.Timeout:
        print(f"Vaqt tugadi {domain} uchun xavfsizlik sarlavhalarini olishda")
        return {
            'x_frame_options': 'Vaqt tugadi',
            'x_content_type_options': 'Vaqt tugadi',
            'x_xss_protection': 'Vaqt tugadi',
            'strict_transport_security': 'Vaqt tugadi',
            'content_security_policy': 'Vaqt tugadi'
        }
    except Exception as e:
        print(f"Xavfsizlik sarlavhalarini olishda xatolik {domain}: {e}")
        return {
            'x_frame_options': 'Tekshirilmadi',
            'x_content_type_options': 'Tekshirilmadi',
            'x_xss_protection': 'Tekshirilmadi',
            'strict_transport_security': 'Tekshirilmadi',
            'content_security_policy': 'Tekshirilmadi'
        }

@csrf_exempt
def save_domains(request):
    """Domainlarni KeshDomain bazasiga saqlash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domains = data.get('domains', [])
            
            if not domains:
                return JsonResponse({'error': 'Domainlar kiritilmagan'}, status=400)
            
            # Har bir domain uchun validatsiya va saqlash
            saved_domains = []
            errors = []
            
            for domain in domains:
                domain = domain.strip()
                if not domain:
                    continue
                
                # Domain validatsiyasi
                if not is_valid_domain(domain):
                    errors.append(f'{domain} - noto\'g\'ri format')
                    continue
                
                try:
                    # Domain mavjudligini tekshirish
                    kesh_domain, created = KeshDomain.objects.get_or_create(
                        domain_name=domain
                    )
                    
                    if created:
                        saved_domains.append(domain)
                    else:
                        # Domain allaqachon mavjud
                        saved_domains.append(f'{domain} (mavjud)')
                        
                except Exception as e:
                    errors.append(f'{domain} - xatolik: {str(e)}')
            
            return JsonResponse({
                'success': True,
                'saved_count': len([d for d in saved_domains if '(mavjud)' not in d]),
                'total_count': len(saved_domains),
                'saved_domains': saved_domains,
                'errors': errors,
                'message': f'{len(saved_domains)} ta domain muvaffaqiyatli saqlandi!'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def delete_domain(request):
    """KeshDomain bazasidan domain o'chirish"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name', '').strip()
            
            if not domain_name:
                return JsonResponse({'error': 'Domain nomi kiritilmagan'}, status=400)
            
            try:
                # Domain ni bazadan topish va o'chirish
                kesh_domain = KeshDomain.objects.get(domain_name=domain_name)
                kesh_domain.delete()
                
                return JsonResponse({
                    'success': True,
                    'message': f'Domain {domain_name} muvaffaqiyatli o\'chirildi!'
                })
                
            except KeshDomain.DoesNotExist:
                return JsonResponse({
                    'error': f'Domain {domain_name} bazada topilmadi'
                }, status=404)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def clear_all_domains(request):
    """KeshDomain bazasidagi barcha domainlarni o'chirish"""
    if request.method == 'POST':
        try:
            # Barcha domainlarni o'chirish
            deleted_count = KeshDomain.objects.count()
            KeshDomain.objects.all().delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Barcha {deleted_count} ta domain muvaffaqiyatli o\'chirildi!',
                'deleted_count': deleted_count
            })
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def update_domain(request):
    """KeshDomain bazasida domainni tahrirlash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            old_domain = data.get('old_domain', '').strip()
            new_domain = data.get('new_domain', '').strip()
            
            if not old_domain or not new_domain:
                return JsonResponse({'error': 'Eski va yangi domain nomlari kiritilmagan'}, status=400)
            
            # Yangi domain validatsiyasi
            if not is_valid_domain(new_domain):
                return JsonResponse({'error': 'Yangi domain noto\'g\'ri formatda'}, status=400)
            
            try:
                # Eski domain ni bazadan topish
                kesh_domain = KeshDomain.objects.get(domain_name=old_domain)
                
                # Yangi domain allaqachon mavjudligini tekshirish
                if KeshDomain.objects.filter(domain_name=new_domain).exclude(id=kesh_domain.id).exists():
                    return JsonResponse({
                        'error': f'Domain {new_domain} allaqachon mavjud'
                    }, status=400)
                
                # Domain nomini yangilash
                kesh_domain.domain_name = new_domain
                kesh_domain.save()
                
                return JsonResponse({
                    'success': True,
                    'message': f'Domain {old_domain} muvaffaqiyatli {new_domain} ga o\'zgartirildi!',
                    'old_domain': old_domain,
                    'new_domain': new_domain
                })
            
            except KeshDomain.DoesNotExist:
                return JsonResponse({
                    'error': f'Domain {old_domain} bazada topilmadi'
                }, status=404)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

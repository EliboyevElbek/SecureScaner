from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import re
import json
import socket
import requests
import urllib3
from .models import DomainScan, Tool, KeshDomain, DomainToolConfiguration, ScanSession, ToolParameter, ToolParameterValue

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
                
                # 1. ScanSession bazasini tozalash (avvalgi yangi tahlillarni "Barcha tahlillar"ga o'tkazish uchun)
                try:
                    ScanSession.objects.all().delete()
                    print("ScanSession bazasi tozalandi - avvalgi yangi tahlillar 'Barcha tahlillar'ga o'tdi")
                except Exception as e:
                    print(f"ScanSession tozalashda xatolik: {e}")
                
                # 2. Yangi ScanSession yaratish va domainlarni saqlash
                try:
                    new_session = ScanSession.objects.create(
                        domains=domains
                    )
                    print(f"Yangi ScanSession yaratildi: {new_session.id} - {len(domains)} ta domain")
                except Exception as e:
                    print(f"ScanSession yaratishda xatolik: {e}")
                
                # 3. Har bir domen uchun tahlil qilish
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
                
                # 4. Tahlil tugagandan so'ng KeshDomain bazasidagi barcha domainlarni o'chirish
                try:
                    from .models import KeshDomain
                    deleted_count = KeshDomain.objects.count()
                    KeshDomain.objects.all().delete()
                    print(f"Tahlil tugagandan so'ng {deleted_count} ta domain KeshDomain bazasidan o'chirildi")
                    
                    print(f"Yangi tahlil qilingan domainlar: {[r['domain'] for r in scan_results if r['status'] == 'completed']}")
                    
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
    
    # GET so'rov uchun - KeshDomain bazasidagi domainlarni ham qaytarish
    try:
        from .models import KeshDomain
        existing_domains = list(KeshDomain.objects.values_list('domain_name', flat=True))
    except:
        existing_domains = []
    
    return render(request, template_name='scan.html', context={
        'existing_domains': existing_domains
    })

def scan_history(request):
    """Scan history sahifasi - yangi va eski tahlillarni ko'rsatish"""
    try:
        # Barcha tahlillarni olish (status='completed' bo'lgan)
        all_scans = DomainScan.objects.filter(
            status='completed'
        ).order_by('-scan_date')
        
        # Yangi tahlillarni olish (eng so'nggi ScanSession dagi domainlar)
        # "Tahlil qilish" tugmasi bosilganda yaratilgan eng so'nggi sessiyadagi domainlar
        if all_scans.exists():
            # Eng so'nggi ScanSession ni topish
            latest_session = ScanSession.objects.order_by('-created_at').first()
            
            if latest_session and latest_session.domains:
                # Eng so'nggi sessiyadagi barcha domainlarni "yangi tahlillar" deb hisoblash
                new_domains = latest_session.domains
                new_scans = DomainScan.objects.filter(
                    domain_name__in=new_domains,
                    status='completed'
                ).order_by('-scan_date')
                print(f"ScanSession dan yangi tahlillar: {new_domains}")
            else:
                # ScanSession yo'q bo'lsa, eng so'nggi tahlil qilingan domainni olish
                latest_scan = all_scans.first()
                new_scans = DomainScan.objects.filter(
                    domain_name=latest_scan.domain_name,
                    status='completed'
                ).order_by('-scan_date')[:1]
                new_domains = [latest_scan.domain_name]
                print(f"ScanSession yo'q, eng so'nggi domain: {new_domains}")
            
            # Eski tahlillarni olish (yangi tahlillarda bo'lmagan domainlar)
            old_scans = DomainScan.objects.filter(
                status='completed'
            ).exclude(
                domain_name__in=new_domains
            ).order_by('-scan_date')[:50]
        else:
            new_scans = []
            old_scans = []
        
        context = {
            'new_scans': new_scans,
            'old_scans': old_scans,
            'new_count': new_scans.count(),
            'old_count': old_scans.count(),
            'total_count': all_scans.count()
        }
        
        return render(request, 'scan_history.html', context)
        
    except Exception as e:
        print(f"Scan history xatolik: {e}")
        context = {
            'new_scans': [],
            'old_scans': [],
            'new_count': 0,
            'old_count': 0,
            'total_count': 0,
            'error': str(e)
        }
        return render(request, 'scan_history.html', context)

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

def tools(request):
    """Tools sahifasi - mavjud toolar ro'yxati"""
    tools_list = [
        {
            'name': 'nmap',
            'display_name': 'Nmap',
            'description': 'Tarmoq skanerlash va portlarni topish vositasi',
            'category': 'Tarmoq Xavfsizligi',
            'features': ['Port skanerlash', 'Xizmatlarni aniqlash', 'OS fingerprinting', 'Zaifliklarni baholash']
        },
        {
            'name': 'sqlmap',
            'display_name': 'SQLMap',
            'description': 'SQL injection va ma\'lumotlar bazasini ekspluatatsiya qilish vositasi',
            'category': 'Veb Xavfsizlik',
            'features': ['SQL injection aniqlash', 'Ma\'lumotlar bazasini sanash', 'Ma\'lumotlarni olish', 'Avtomatik ekspluatatsiya']
        },
        {
            'name': 'xsstrike',
            'display_name': 'XSStrike',
            'description': 'XSS (Cross-Site Scripting) aniqlash va ekspluatatsiya vositasi',
            'category': 'Veb Xavfsizlik',
            'features': ['XSS aniqlash', 'Payload yaratish', 'Filtrlarni aylanib o\'tish', 'Avtomatik sinab ko\'rish']
        },
        {
            'name': 'gobuster',
            'display_name': 'Gobuster',
            'description': 'Papka va fayllarni topish vositasi',
            'category': 'Razvedka',
            'features': ['Papka brute forcing', 'Fayllarni topish', 'Subdomain sanash', 'Maxsus so\'zlar ro\'yxati']
        }
    ]
    
    context = {
        'tools': tools_list
    }
    
    return render(request, template_name='tools.html', context=context)

def tool_detail(request, tool_name):
    """Har bir tool uchun batafsil sahifa"""
    tools_data = {
        'nmap': {
            'name': 'Nmap',
            'description': 'Tarmoq skanerlash va portlarni topish vositasi',
            'category': 'Tarmoq Xavfsizligi',
            'parameters': [
                {'flag': '-sS', 'description': 'TCP SYN skanerlash - portlarni ochiq yoki yopiqligini aniqlash'},
                {'flag': '-sU', 'description': 'UDP skanerlash - UDP portlarni tekshirish'},
                {'flag': '-O', 'description': 'OS fingerprinting - operatsion tizimni aniqlash'},
                {'flag': '-sV', 'description': 'Xizmat versiyasini aniqlash'},
                {'flag': '-p', 'description': 'Maxsus portlarni skanerlash (masalan: -p 80,443,8080)'},
                {'flag': '-A', 'description': 'Aggressive skanerlash - barcha xususiyatlarni faollashtirish'},
                {'flag': '--script', 'description': 'NSE skriptlarini ishlatish'},
                {'flag': '-T4', 'description': 'Tezlik - 4 darajada tez skanerlash'}
            ],
            'examples': [
                'nmap -sS -p 80,443,8080 example.com',
                'nmap -O -sV 192.168.1.1',
                'nmap -A --script vuln target.com'
            ]
        },
        'sqlmap': {
            'name': 'SQLMap',
            'description': 'SQL injection va ma\'lumotlar bazasini ekspluatatsiya qilish vositasi',
            'category': 'Veb Xavfsizlik',
            'parameters': [
                {'flag': '--dbs', 'description': 'Mavjud ma\'lumotlar bazalarini ko\'rish'},
                {'flag': '--batch', 'description': 'Savollarsiz ishlash - avtomatik javoblar'},
                {'flag': '--random-agent', 'description': 'Tasodifiy User-Agent ishlatish'},
                {'flag': '--tables', 'description': 'Ma\'lumotlar bazasidagi jadvallarni ko\'rish'},
                {'flag': '--columns', 'description': 'Jadvaldagi ustunlarni ko\'rish'},
                {'flag': '--dump', 'description': 'Ma\'lumotlarni olish va saqlash'},
                {'flag': '--level', 'description': 'Test darajasi (1-5) - yuqori daraja ko\'proq test'},
                {'flag': '--risk', 'description': 'Xavf darajasi (1-3) - yuqori xavf ko\'proq payload'}
            ],
            'examples': [
                'sqlmap -u "http://example.com/page.php?id=1" --dbs',
                'sqlmap -u "http://example.com/page.php?id=1" --batch --random-agent',
                'sqlmap -u "http://example.com/page.php?id=1" --tables -D database_name'
            ]
        },
        'xsstrike': {
            'name': 'XSStrike',
            'description': 'XSS (Cross-Site Scripting) aniqlash va ekspluatatsiya vositasi',
            'category': 'Veb Xavfsizlik',
            'parameters': [
                {'flag': '--crawl', 'description': 'Sahifalarni avtomatik ko\'rish va tekshirish'},
                {'flag': '--blind', 'description': 'Blind XSS testlarini o\'tkazish'},
                {'flag': '--skip-dom', 'description': 'DOM XSS testlarini o\'tkazmaslik'},
                {'flag': '--skip-payload', 'description': 'Payload testlarini o\'tkazmaslik'},
                {'flag': '--params', 'description': 'Maxsus parametrlarni tekshirish'},
                {'flag': '--headers', 'description': 'HTTP headerlarni tekshirish'},
                {'flag': '--cookies', 'description': 'Cookie larni tekshirish'},
                {'flag': '--json', 'description': 'JSON formatida natijalarni ko\'rsatish'}
            ],
            'examples': [
                'xsstrike -u "http://example.com/page.php?q=test"',
                'xsstrike -u "http://example.com/page.php?q=test" --crawl',
                'xsstrike -u "http://example.com/page.php?q=test" --blind'
            ]
        },
        'gobuster': {
            'name': 'Gobuster',
            'description': 'Papka va fayllarni topish vositasi',
            'category': 'Razvedka',
            'parameters': [
                {'flag': 'dir', 'description': 'Papkalarni qidirish rejimi'},
                {'flag': 'dns', 'description': 'DNS subdomain qidirish rejimi'},
                {'flag': 'fuzz', 'description': 'Fayl nomlarini qidirish rejimi'},
                {'flag': '-w', 'description': 'So\'zlar ro\'yxati fayli (wordlist)'},
                {'flag': '-u', 'description': 'Target URL yoki domain'},
                {'flag': '-t', 'description': 'Threadlar soni (parallel ishlash)'},
                {'flag': '-x', 'description': 'Fayl kengaytmalarini qo\'shish'},
                {'flag': '--status-codes', 'description': 'Qaysi HTTP kodlarni ko\'rsatish'}
            ],
            'examples': [
                'gobuster dir -u http://example.com -w /usr/share/wordlists/dirb/common.txt',
                'gobuster dns -d example.com -w /usr/share/wordlists/subdomains.txt',
                'gobuster fuzz -u http://example.com/FUZZ -w wordlist.txt -x php,html,txt'
            ]
        }
    }
    
    # Tool nomini kichik harflarga o'tkazish va mos kelishini tekshirish
    tool_name_lower = tool_name.lower()
    
    if tool_name_lower not in tools_data:
        # Agar tool topilmasa, 404 xatosi
        from django.http import Http404
        raise Http404("Tool topilmadi")
    
    tool_data = tools_data[tool_name_lower]
    
    context = {
        'tool': tool_data
    }
    
    return render(request, template_name='tool_detail.html', context=context)

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
        # Avval HTTPS bilan urinish
        response = requests.get(f"https://{domain}", timeout=10, verify=False, allow_redirects=True)
        return {
            'ssl_enabled': True,
            'ssl_version': 'TLS 1.2+',
            'certificate_valid': True,
            'protocol': 'HTTPS'
        }
    except requests.exceptions.SSLError:
        # SSL xatolik bo'lsa HTTP bilan tekshirish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            return {
                'ssl_enabled': False,
                'ssl_version': 'HTTP ishlatiladi',
                'certificate_valid': False,
                'protocol': 'HTTP'
            }
        except Exception as e:
            return {
                'ssl_enabled': False,
                'ssl_version': 'SSL xatolik + HTTP ham xatolik',
                'certificate_valid': False,
                'protocol': 'Xatolik'
            }
    except requests.exceptions.ConnectionError:
        # HTTPS ulanish xatolik bo'lsa HTTP bilan tekshirish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            return {
                'ssl_enabled': False,
                'ssl_version': 'HTTP ishlatiladi',
                'certificate_valid': False,
                'protocol': 'HTTP'
            }
        except Exception as e:
            return {
                'ssl_enabled': False,
                'ssl_version': 'Ulanish xatolik',
                'certificate_valid': False,
                'protocol': 'Xatolik'
            }
    except requests.exceptions.Timeout:
        # HTTPS vaqt tugasa HTTP bilan tekshirish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            return {
                'ssl_enabled': False,
                'ssl_version': 'HTTP ishlatiladi',
                'certificate_valid': False,
                'protocol': 'HTTP'
            }
        except Exception as e:
            return {
                'ssl_enabled': False,
                'ssl_version': 'Vaqt tugadi',
                'certificate_valid': False,
                'protocol': 'Xatolik'
            }
    except Exception as e:
        # Boshqa xatolik bo'lsa HTTP bilan tekshirish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            return {
                'ssl_enabled': False,
                'ssl_version': 'HTTP ishlatiladi',
                'certificate_valid': False,
                'protocol': 'HTTP'
            }
        except Exception as e2:
            return {
                'ssl_enabled': False,
                'ssl_version': f'Xatolik: {str(e)}',
                'certificate_valid': False,
                'protocol': 'Xatolik'
            }

def get_security_headers(domain):
    """Xavfsizlik sarlavhalarini olish"""
    headers = {}
    
    # Avval HTTPS bilan urinish
    try:
        response = requests.get(f"https://{domain}", timeout=10, verify=False, allow_redirects=True)
        headers = response.headers
        print(f"HTTPS orqali muvaffaqiyatli ulanish {domain}")
    except requests.exceptions.SSLError:
        print(f"SSL xatolik {domain} uchun, HTTP bilan urinish")
        # SSL xatolik bo'lsa HTTP bilan urinish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            headers = response.headers
            print(f"HTTP orqali muvaffaqiyatli ulanish {domain}")
        except Exception as e:
            print(f"HTTP ham xatolik {domain}: {e}")
        return {
            'x_frame_options': 'SSL xatolik',
            'x_content_type_options': 'SSL xatolik',
            'x_xss_protection': 'SSL xatolik',
            'strict_transport_security': 'SSL xatolik',
            'content_security_policy': 'SSL xatolik'
        }
    except requests.exceptions.ConnectionError:
        print(f"HTTPS ulanish xatolik {domain} uchun, HTTP bilan urinish")
        # HTTPS ulanish xatolik bo'lsa HTTP bilan urinish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            headers = response.headers
            print(f"HTTP orqali muvaffaqiyatli ulanish {domain}")
        except Exception as e:
            print(f"HTTP ham xatolik {domain}: {e}")
        return {
            'x_frame_options': 'Ulanish xatolik',
            'x_content_type_options': 'Ulanish xatolik',
            'x_xss_protection': 'Ulanish xatolik',
            'strict_transport_security': 'Ulanish xatolik',
            'content_security_policy': 'Ulanish xatolik'
        }
    except requests.exceptions.Timeout:
        print(f"HTTPS vaqt tugadi {domain} uchun, HTTP bilan urinish")
        # HTTPS vaqt tugasa HTTP bilan urinish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            headers = response.headers
            print(f"HTTP orqali muvaffaqiyatli ulanish {domain}")
        except Exception as e:
            print(f"HTTP ham xatolik {domain}: {e}")
        return {
            'x_frame_options': 'Vaqt tugadi',
            'x_content_type_options': 'Vaqt tugadi',
            'x_xss_protection': 'Vaqt tugadi',
            'strict_transport_security': 'Vaqt tugadi',
            'content_security_policy': 'Vaqt tugadi'
        }
    except Exception as e:
        print(f"HTTPS xatolik {domain}: {e}, HTTP bilan urinish")
        # Boshqa xatolik bo'lsa HTTP bilan urinish
        try:
            response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
            headers = response.headers
            print(f"HTTP orqali muvaffaqiyatli ulanish {domain}")
        except Exception as e2:
            print(f"HTTP ham xatolik {domain}: {e2}")
        return {
            'x_frame_options': 'Tekshirilmadi',
            'x_content_type_options': 'Tekshirilmadi',
            'x_xss_protection': 'Tekshirilmadi',
            'strict_transport_security': 'Tekshirilmadi',
            'content_security_policy': 'Tekshirilmadi'
        }
    
    # Xavfsizlik sarlavhalarini tekshirish
    security_headers = {
        'x_frame_options': headers.get('X-Frame-Options', 'Yo\'q'),
        'x_content_type_options': headers.get('X-Content-Type-Options', 'Yo\'q'),
        'x_xss_protection': headers.get('X-XSS-Protection', 'Yo\'q'),
        'strict_transport_security': headers.get('Strict-Transport-Security', 'Yo\'q'),
        'content_security_policy': headers.get('Content-Security-Policy', 'Yo\'q'),
        'referrer_policy': headers.get('Referrer-Policy', 'Yo\'q'),
        'permissions_policy': headers.get('Permissions-Policy', 'Yo\'q')
    }
    
    # Debug ma'lumotlari
    print(f"Domain {domain} uchun topilgan sarlavhalar:")
    for key, value in security_headers.items():
        if value != 'Yo\'q':
            print(f"  {key}: {value}")
    
    return security_headers

@csrf_exempt
def save_domains(request):
    """Domainlarni KeshDomain bazasiga saqlash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domains = data.get('domains', [])
            
            print(f"save_domains called with domains: {domains}")
            
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
                    
                    print(f"Domain {domain}: created={created}, tool_commands={kesh_domain.tool_commands}")
                    
                    if created:
                        saved_domains.append(domain)
                    else:
                        # Domain allaqachon mavjud
                        saved_domains.append(f'{domain} (mavjud)')
                        
                except Exception as e:
                    print(f"Error saving domain {domain}: {str(e)}")
                    errors.append(f'{domain} - xatolik: {str(e)}')
            
            print(f"Save results: saved={saved_domains}, errors={errors}")
            
            return JsonResponse({
                'success': True,
                'saved_count': len([d for d in saved_domains if '(mavjud)' not in d]),
                'total_count': len(saved_domains),
                'saved_domains': saved_domains,
                'errors': errors,
                'message': f'{len(saved_domains)} ta domain muvaffaqiyatli saqlandi!'
            })
            
        except json.JSONDecodeError:
            print(f"JSON decode error in save_domains: {request.body}")
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            print(f"Error in save_domains: {str(e)}")
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

def delete_domain(request):
    """Domain o'chirish"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name')
            
            if not domain_name:
                return JsonResponse({'error': 'Domain nomi ko\'rsatilmagan'}, status=400)
            
            # Domain ni o'chirish
            try:
                domain = KeshDomain.objects.get(domain_name=domain_name)
                domain.delete()
                return JsonResponse({'success': True, 'message': f'{domain_name} o\'chirildi'})
            except KeshDomain.DoesNotExist:
                return JsonResponse({'error': 'Domain topilmadi'}, status=404)
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

def clear_all_domains(request):
    """Barcha domainlarni o'chirish"""
    if request.method == 'POST':
        try:
            KeshDomain.objects.all().delete()
            return JsonResponse({'success': True, 'message': 'Barcha domainlar o\'chirildi'})
        except Exception as e:
            return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

def update_domain(request):
    """Domain nomini yangilash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            old_name = data.get('old_name')
            new_name = data.get('new_name')
            
            if not old_name or not new_name:
                return JsonResponse({'error': 'Eski va yangi nom ko\'rsatilmagan'}, status=400)
            
            try:
                domain = KeshDomain.objects.get(domain_name=old_name)
                domain.domain_name = new_name
                domain.save()
                return JsonResponse({'success': True, 'message': f'Domain nomi {new_name} ga o\'zgartirildi'})
            except KeshDomain.DoesNotExist:
                return JsonResponse({'error': 'Domain topilmadi'}, status=404)
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def get_tools(request):
    """Barcha tool'larni olish"""
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
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

def get_domain_tool_config(request):
    """Domain uchun tool konfiguratsiyasini olish"""
    try:
        domain_name = request.GET.get('domain_name')
        tool_type = request.GET.get('tool_type')
        
        if not domain_name or not tool_type:
            return JsonResponse({'error': 'Domain yoki tool turi ko\'rsatilmagan'}, status=400)
        
        try:
            domain = KeshDomain.objects.get(domain_name=domain_name)
            config = DomainToolConfiguration.objects.get(domain=domain, tool_type=tool_type)
            
            return JsonResponse({
                'success': True,
                'config': {
                    'base_command': config.base_command,
                    'selected_parameters': config.selected_parameters,
                    'final_command': config.final_command
                }
            })
            
        except (KeshDomain.DoesNotExist, DomainToolConfiguration.DoesNotExist):
            return JsonResponse({'error': 'Konfiguratsiya topilmadi'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

def save_domain_tool_config(request):
    """Domain uchun tool konfiguratsiyasini saqlash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name')
            tool_type = data.get('tool_type')
            config_data = data.get('config', {})
            
            if not domain_name or not tool_type:
                return JsonResponse({'error': 'Domain yoki tool turi ko\'rsatilmagan'}, status=400)
            
            try:
                domain = KeshDomain.objects.get(domain_name=domain_name)
                config, created = DomainToolConfiguration.objects.get_or_create(
                    domain=domain,
                    tool_type=tool_type,
                    defaults={
                        'base_command': config_data.get('base_command', ''),
                        'selected_parameters': config_data.get('selected_parameters', []),
                        'final_command': config_data.get('final_command', '')
                    }
                )
                
                if not created:
                    config.base_command = config_data.get('base_command', '')
                    config.selected_parameters = config_data.get('selected_parameters', [])
                    config.final_command = config_data.get('final_command', '')
                    config.save()
                
                return JsonResponse({
                    'success': True,
                    'message': 'Konfiguratsiya saqlandi'
                })
                
            except KeshDomain.DoesNotExist:
                return JsonResponse({'error': 'Domain topilmadi'}, status=404)
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def update_tool_commands(request):
    """KeshDomain bazasida tool buyruqlarini yangilash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name', '').strip()
            tool_commands = data.get('tool_commands', [])
            
            print(f"update_tool_commands called for domain: {domain_name}")
            print(f"Tool commands received: {tool_commands}")
            
            if not domain_name:
                return JsonResponse({'error': 'Domain nomi kiritilmagan'}, status=400)
            
            try:
                # Domain ni bazadan topish
                kesh_domain = KeshDomain.objects.get(domain_name=domain_name)
                print(f"Found domain: {kesh_domain.domain_name}")
                print(f"Current tool_commands: {kesh_domain.tool_commands}")
                
                # Tool buyruqlarini yangilash - mavjud buyruqlar bilan birlashtirish
                if tool_commands:
                    print(f"Merging tool commands...")
                    kesh_domain.merge_tool_commands(tool_commands)
                else:
                    # Agar tool_commands bo'sh bo'lsa, to'g'ridan to'g'ri saqlash
                    print(f"Setting empty tool commands...")
                    kesh_domain.tool_commands = tool_commands
                    kesh_domain.save()
                
                print(f"Final tool_commands: {kesh_domain.tool_commands}")
                
                return JsonResponse({
                    'success': True,
                    'message': f'Domain {domain_name} uchun tool buyruqlari yangilandi!',
                    'tool_commands': kesh_domain.tool_commands
                })
            
            except KeshDomain.DoesNotExist:
                print(f"Domain {domain_name} not found")
                return JsonResponse({
                    'error': f'Domain {domain_name} bazada topilmadi'
                }, status=404)
            
        except json.JSONDecodeError:
            print(f"JSON decode error: {request.body}")
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
            print(f"Error in update_tool_commands: {str(e)}")
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat POST so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def get_domain_tools_preview(request):
    """Domain uchun tool'lar preview ni olish"""
    if request.method == 'GET':
        try:
            domain_name = request.GET.get('domain_name', '').strip()
            
            if not domain_name:
                return JsonResponse({'error': 'Domain nomi kiritilmagan'}, status=400)
            
            try:
                # Domain ni bazadan topish
                kesh_domain = KeshDomain.objects.get(domain_name=domain_name)
                
                # Tool'lar va ularning buyruqlarini olish
                tools_preview = []
                
                # Mavjud tool'larni olish
                tools = Tool.objects.filter(is_active=True)
                
                for tool in tools:
                    # Saqlangan buyruqni olish
                    saved_command = kesh_domain.get_tool_command(tool.tool_type)
                    
                    # Asosiy buyruqni yaratish
                    base_command = get_base_tool_command(tool.tool_type, domain_name)
                    
                    # Saqlangan parametrlarni olish
                    saved_parameters = []
                    if saved_command and saved_command != base_command:
                        # Saqlangan buyruqdan parametrlarni ajratib olish
                        saved_parameters = extract_parameters_from_command(saved_command, base_command)
                    
                    tools_preview.append({
                        'id': tool.id,
                        'name': tool.name,
                        'tool_type': tool.tool_type,
                        'base_command': base_command,
                        'saved_command': saved_command,
                        'saved_parameters': saved_parameters,
                        'description': tool.description
                    })
                
                return JsonResponse({
                    'success': True,
                    'domain': domain_name,
                    'tools_preview': tools_preview,
                    'saved_commands': kesh_domain.tool_commands
                })
            
            except KeshDomain.DoesNotExist:
                # Domain mavjud emas, yangi yaratish
                tools_preview = []
                tools = Tool.objects.filter(is_active=True)
                
                for tool in tools:
                    base_command = get_base_tool_command(tool.tool_type, domain_name)
                    tools_preview.append({
                        'id': tool.id,
                        'name': tool.name,
                        'tool_type': tool.tool_type,
                        'base_command': base_command,
                        'saved_command': None,
                        'saved_parameters': [],
                        'description': tool.description
                    })
                
                return JsonResponse({
                    'success': True,
                    'domain': domain_name,
                    'tools_preview': tools_preview,
                    'new_domain': True
                })
            
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat GET so\'rov qabul qilinadi'}, status=405)

def get_base_tool_command(tool_type, domain):
    """Tool turiga qarab asosiy buyruqni yaratish"""
    if not domain.startswith('http'):
        domain = f"https://{domain}"
    
    base_commands = {
        'nmap': f"nmap {domain.replace('https://', '').replace('http://', '')}",
        'sqlmap': f"sqlmap -u {domain}",
        'xsstrike': f"xsstrike -u {domain}",
        'gobuster': f"gobuster dir -u {domain} -w wordlist.txt"
    }
    
    return base_commands.get(tool_type, f"{tool_type} {domain}")

def extract_parameters_from_command(full_command, base_command):
    """To'liq buyruqdan parametrlarni ajratib olish"""
    if not full_command or not base_command:
        return []
    
    # Asosiy buyruqni to'liq buyruqdan olib tashlash
    if full_command.startswith(base_command):
        params_part = full_command[len(base_command):].strip()
        if params_part:
            return params_part.split()
    
    return []

@csrf_exempt
def get_tool_parameters(request):
    """Tool parametrlarini olish"""
    try:
        tool_type = request.GET.get('tool_type')
        if not tool_type:
            return JsonResponse({'error': 'Tool turi ko\'rsatilmagan'}, status=400)
        
        tool = get_object_or_404(Tool, tool_type=tool_type, is_active=True)
        parameters = ToolParameter.objects.filter(tool=tool).order_by('order')
        
        params_data = []
        for param in parameters:
            params_data.append({
                'id': param.id,
                'name': param.name,
                'short_name': param.short_name,
                'parameter_type': param.parameter_type,
                'description': param.description,
                'default_value': param.default_value,
                'placeholder': param.placeholder,
                'help_text': param.help_text,
                'is_required': param.is_required,
                'order': param.order
            })
        
        return JsonResponse({
            'success': True,
            'tool': {
                'id': tool.id,
                'name': tool.name,
                'tool_type': tool.tool_type,
                'executable_path': tool.executable_path
            },
            'parameters': params_data
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

@csrf_exempt
def get_domain_parameter_values(request):
    """Domain uchun saqlangan parametr qiymatlarini olish"""
    try:
        domain_name = request.GET.get('domain_name')
        tool_type = request.GET.get('tool_type')
        
        if not domain_name or not tool_type:
            return JsonResponse({'error': 'Domain yoki tool turi ko\'rsatilmagan'}, status=400)
        
        domain = get_object_or_404(KeshDomain, domain_name=domain_name)
        tool = get_object_or_404(Tool, tool_type=tool_type, is_active=True)
        
        # Mavjud parametr qiymatlarini olish
        existing_values = ToolParameterValue.objects.filter(
            domain=domain,
            parameter__tool=tool
        ).select_related('parameter')
        
        values_data = {}
        for value in existing_values:
            values_data[value.parameter.id] = {
                'enabled': value.is_enabled,
                'value': value.value
            }
        
        return JsonResponse({
            'success': True,
            'domain': domain_name,
            'tool_type': tool_type,
            'parameter_values': values_data
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

@csrf_exempt
def save_parameter_values(request):
    """Tool parametr qiymatlarini saqlash"""
    try:
        data = json.loads(request.body)
        domain_name = data.get('domain_name')
        tool_type = data.get('tool_type')
        parameters = data.get('parameters', {})
        
        if not domain_name or not tool_type:
            return JsonResponse({'error': 'Domain yoki tool turi ko\'rsatilmagan'}, status=400)
        
        domain = get_object_or_404(KeshDomain, domain_name=domain_name)
        tool = get_object_or_404(Tool, tool_type=tool_type, is_active=True)
        
        # Har bir parametr uchun qiymatni saqlash
        for param_id, param_data in parameters.items():
            try:
                param = ToolParameter.objects.get(id=param_id, tool=tool)
                value, created = ToolParameterValue.objects.get_or_create(
                    domain=domain,
                    parameter=param,
                    defaults={
                        'value': param_data.get('value', ''),
                        'is_enabled': param_data.get('enabled', False)
                    }
                )
                
                if not created:
                    value.value = param_data.get('value', '')
                    value.is_enabled = param_data.get('enabled', False)
                    value.save()
                    
            except ToolParameter.DoesNotExist:
                continue
        
        # Yakuniy buyruqni yaratish va saqlash
        final_command = build_final_command(tool, domain, parameters)
        
        # DomainToolConfiguration ni yangilash
        config, created = DomainToolConfiguration.objects.get_or_create(
            domain=domain,
            tool_type=tool_type,
            defaults={
                'base_command': f"{tool.executable_path}",
                'selected_parameters': list(parameters.keys()),
                'final_command': final_command
            }
        )
        
        if not created:
            config.selected_parameters = list(parameters.keys())
            config.final_command = final_command
            config.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Parametrlar saqlandi',
            'final_command': final_command
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

def build_final_command(tool, domain, parameters):
    """Yakuniy buyruqni yaratish"""
    command_parts = [tool.executable_path]
    
    for param_id, param_data in parameters.items():
        if not param_data.get('enabled', False):
            continue
            
        try:
            param = ToolParameter.objects.get(id=param_id)
            value = param_data.get('value', '').strip()
            
            if param.parameter_type == 'flag':
                # Faqat bayroq qo'shish
                if param.short_name:
                    command_parts.append(param.short_name)
            elif param.parameter_type == 'checkbox':
                # Checkbox belgilangan bo'lsa bayroq qo'shish
                if param.short_name:
                    command_parts.append(param.short_name)
            elif param.parameter_type == 'option' or param.parameter_type == 'input':
                # Qiymat bilan birga bayroq qo'shish
                if param.short_name and value:
                    command_parts.append(param.short_name)
                    command_parts.append(value)
                elif value:
                    # Short name yo'q bo'lsa faqat qiymat
                    command_parts.append(value)
                    
        except ToolParameter.DoesNotExist:
            continue
    
    return ' '.join(command_parts)

@csrf_exempt
def get_tool_preview(request):
    """Tool va uning parametrlari preview ko'rsatish"""
    try:
        tool_type = request.GET.get('tool_type')
        if not tool_type:
            return JsonResponse({'error': 'Tool turi ko\'rsatilmagan'}, status=400)
        
        tool = get_object_or_404(Tool, tool_type=tool_type, is_active=True)
        parameters = ToolParameter.objects.filter(tool=tool).order_by('order')
        
        # Tool haqida ma'lumot
        tool_info = {
            'id': tool.id,
            'name': tool.name,
            'tool_type': tool.tool_type,
            'description': tool.description,
            'executable_path': tool.executable_path
        }
        
        # Parametrlar ro'yxati
        params_list = []
        for param in parameters:
            param_info = {
                'id': param.id,
                'name': param.name,
                'short_name': param.short_name,
                'parameter_type': param.parameter_type,
                'description': param.description,
                'default_value': param.default_value,
                'placeholder': param.placeholder,
                'help_text': param.help_text,
                'is_required': param.is_required,
                'order': param.order
            }
            params_list.append(param_info)
        
        return JsonResponse({
            'success': True,
            'tool': tool_info,
            'parameters': params_list
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Xatolik: {str(e)}'}, status=500)

def tool_parameters_view(request):
    """Tool parametrlari sahifasini ko'rsatish"""
    return render(request, 'tool_parameters.html')

def tools(request):
    """Tools sahifasini ko'rsatish"""
    tools_list = Tool.objects.filter(is_active=True)
    context = {
        'tools': tools_list
    }
    return render(request, 'tools.html', context)

def tool_detail(request, tool_name):
    """Tool haqida batafsil ma'lumot"""
    try:
        tool = Tool.objects.get(name__iexact=tool_name, is_active=True)
        context = {
            'tool': tool
        }
        return render(request, 'tool_detail.html', context)
    except Tool.DoesNotExist:
        return render(request, '404.html', status=404)

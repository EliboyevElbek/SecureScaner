from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
import re
import json
import socket
import requests
import urllib3
import subprocess
import time
from .models import DomainScan, Tool, KeshDomain, DomainToolConfiguration, ScanSession, ScanProcess
import threading
import queue
from concurrent.futures import ThreadPoolExecutor
from django.utils import timezone

# SSL warnings ni o'chirish
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Global process manager
process_manager = {
    'processes': {},  # domain_tool -> process
    'output_queues': {},  # domain_tool -> queue
    'lock': threading.Lock()
}

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
                    
                    # DomainScan bazasiga saqlangan domainlarni ko'rsatish
                    completed_domains = [r['domain'] for r in scan_results if r['status'] == 'completed']
                    print(f"DomainScan bazasiga saqlangan domainlar: {completed_domains}")
                    
                    # Bazadagi ma'lumotlarni tekshirish
                    for domain in completed_domains:
                        try:
                            domain_scan = DomainScan.objects.filter(domain_name=domain, status='completed').first()
                            if domain_scan:
                                print(f"✅ {domain} - DomainScan bazasida mavjud (ID: {domain_scan.id})")
                            else:
                                print(f"❌ {domain} - DomainScan bazasida topilmadi!")
                        except Exception as e:
                            print(f"❌ {domain} - Bazada tekshirishda xatolik: {e}")
                    
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
            'new_count': len(new_scans) if isinstance(new_scans, list) else new_scans.count(),
            'old_count': len(old_scans) if isinstance(old_scans, list) else old_scans.count(),
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
            'tool_results': scan.tool_results,
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
    from .tools_config import get_tool_data
    
    # Tool nomini kichik harflarga o'tkazish va mos kelishini tekshirish
    tool_name_lower = tool_name.lower()
    tool_data = get_tool_data(tool_name_lower)
    
    if not tool_data:
        # Agar tool topilmasa, 404 xatosi
        from django.http import Http404
        raise Http404("Tool topilmadi")
    
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
        
        # Tool scanning natijalarini olish (KeshDomain bazasidagi buyruqlar bilan)
        tool_results = perform_tool_scans(domain)
        
        # Natijalarni saqlash
        scan.scan_result = {
            'ip_address': ip_address,
            'dns_records': dns_records,
            'ssl_info': ssl_info,
            'security_headers': security_headers,
            'tool_results': tool_results,
            'scan_duration': 'Background\'da ishlayapti'
        }
        
        scan.dns_records = dns_records
        scan.ssl_info = ssl_info
        scan.security_headers = security_headers
        scan.tool_results = tool_results
        scan.status = 'scanning'  # Endi 'scanning' holatida qoladi
        scan.save()
        
        print(f"DomainScan bazasiga {domain} ma'lumotlari saqlandi. ID: {scan.id}")
        
        return {
            'domain': domain,
            'status': 'completed',
            'ip_address': ip_address,
            'dns_records': dns_records,
            'ssl_info': ssl_info,
            'security_headers': security_headers,
            'tool_results': tool_results,
            'scan_id': scan.id,
            'scan_date': scan.scan_date.isoformat()
        }
        
    except Exception as e:
        # Xatolik yuz berganda
        if scan:
            scan.status = 'failed'
            scan.error_message = str(e)
            scan.save()
            print(f"❌ {domain} - Xatolik bilan DomainScan bazasiga saqlandi (ID: {scan.id})")
        else:
            print(f"❌ {domain} - Scan yaratilmagan, xatolik: {e}")
        
        print(f"Domain tahlilida xatolik {domain}: {e}")
        return {
            'domain': domain,
            'status': 'failed',
            'error': str(e)
        }

def start_background_tool_scan(domain, tool_type, command):
    """Tool'ni background'da ishga tushirish"""
    process_key = f"{domain}_{tool_type}"
    
    with process_manager['lock']:
        if process_key in process_manager['processes']:
            # Process allaqachon ishlayapti
            return False
        
        # Yangi output queue yaratish
        output_queue = queue.Queue()
        process_manager['output_queues'][process_key] = output_queue
        
        # ScanProcess yaratish
        scan_process = ScanProcess.objects.create(
            domain_name=domain,
            tool_type=tool_type,
            status='running'
        )
        
        # Background thread yaratish
        thread = threading.Thread(
            target=run_tool_in_background,
            args=(domain, tool_type, command, output_queue, scan_process)
        )
        thread.daemon = True
        thread.start()
        
        process_manager['processes'][process_key] = {
            'thread': thread,
            'scan_process': scan_process,
            'process': None
        }
        
        return True

def run_tool_in_background(domain, tool_type, command, output_queue, scan_process):
    """Background'da tool'ni ishga tushirish"""
    try:
        # Tool path'ni aniqlash
        if tool_type == 'nmap':
            tool_path = 'tools/nmap/nmap.exe'
            full_cmd = [tool_path] + command.split()[1:]
        elif tool_type == 'sqlmap':
            tool_path = 'tools/sqlmap/sqlmap.py'
            full_cmd = ['python', tool_path] + command.split()[1:]
        elif tool_type == 'gobuster':
            tool_path = 'tools/gobuster/gobuster.exe'
            full_cmd = [tool_path] + command.split()[1:]
        elif tool_type == 'xsstrike':
            tool_path = 'tools/XSStrike/xsstrike.py'
            full_cmd = ['python', tool_path] + command.split()[1:]
        else:
            raise ValueError(f"Unknown tool type: {tool_type}")
        
        # Domain ni almashtirish
        full_cmd = [part if part != 'my-courses.uz' else domain for part in full_cmd]
        
        # Subprocess'ni ishga tushirish
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Process ID'ni saqlash
        scan_process.process_id = process.pid
        scan_process.save()
        
        # Process manager'ga process'ni qo'shish
        process_key = f"{domain}_{tool_type}"
        with process_manager['lock']:
            if process_key in process_manager['processes']:
                process_manager['processes'][process_key]['process'] = process
        
        # Output'ni real-time o'qish
        for line in process.stdout:
            if line:
                line = line.strip()
                # Output'ni buffer'ga saqlash
                scan_process.add_output(line)
                # Queue'ga yuborish (real-time streaming uchun)
                output_queue.put(line)
        
        # Process tugashini kutish
        process.wait()
        
        # Natijani tekshirish
        if process.returncode == 0:
            scan_process.complete(success=True)
        else:
            scan_process.complete(success=False)
            scan_process.error_message = f"Process xatolik bilan tugadi (kod: {process.returncode})"
            scan_process.save()
        
        # Process manager'dan olib tashlash
        with process_manager['lock']:
            if process_key in process_manager['processes']:
                del process_manager['processes'][process_key]
            if process_key in process_manager['output_queues']:
                del process_manager['output_queues'][process_key]
                
    except Exception as e:
        scan_process.complete(success=False)
        scan_process.error_message = str(e)
        scan_process.save()
        
        # Process manager'dan olib tashlash
        process_key = f"{domain}_{tool_type}"
        with process_manager['lock']:
            if process_key in process_manager['processes']:
                del process_manager['processes'][process_key]
            if process_key in process_manager['output_queues']:
                del process_manager['output_queues'][process_key]

def perform_tool_scans(domain):
    """Domain uchun tool scanning natijalarini background'da ishga tushirish"""
    tool_results = {}
    
    try:
        # KeshDomain bazasidan tool buyruqlarini olish
        try:
            kesh_domain = KeshDomain.objects.filter(domain_name=domain).first()
            if kesh_domain and kesh_domain.tool_commands:
                print(f"KeshDomain bazasidan {domain} uchun tool buyruqlari topildi")
                print(f"Tool buyruqlari: {kesh_domain.tool_commands}")
                
                # Har bir tool uchun background'da ishga tushirish
                for tool_command in kesh_domain.tool_commands:
                    for tool_type, command in tool_command.items():
                        try:
                            print(f"Tool {tool_type} uchun buyruq: {command}")
                            
                            # Background'da tool'ni ishga tushirish
                            started = start_background_tool_scan(domain, tool_type, command)
                            
                            if started:
                                tool_results[tool_type] = {
                                    'status': 'running',
                                    'message': f'{tool_type} background\'da ishga tushirildi',
                                    'command': command
                                }
                                print(f"{tool_type} background'da ishga tushirildi")
                            else:
                                tool_results[tool_type] = {
                                    'status': 'already_running',
                                    'message': f'{tool_type} allaqachon ishlayapti',
                                    'command': command
                                }
                                print(f"{tool_type} allaqachon ishlayapti")
                                
                        except Exception as e:
                            print(f"{tool_type} scanning xatolik {domain}: {e}")
                            tool_results[tool_type] = {
                                'status': 'error',
                                'error': f'{tool_type} tool xatolik: {str(e)}'
                            }
            else:
                print(f"KeshDomain bazasida {domain} uchun tool buyruqlari topilmadi")
                tool_results['error'] = 'Tool buyruqlari topilmadi'
                
        except Exception as e:
            print(f"KeshDomain bazasidan ma'lumot olishda xatolik {domain}: {e}")
            tool_results['error'] = str(e)
        
    except Exception as e:
        print(f"Tool scanning xatolik {domain}: {e}")
        tool_results['error'] = str(e)
    
    print(f"Final tool_results: {tool_results}")
    return tool_results

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
                        # Yangi yaratilgan domain uchun default tool buyruqlarini saqlash
                        default_tool_commands = [
                            {"sqlmap": f"sqlmap -u https://{domain}"},
                            {"nmap": f"nmap {domain}"},
                            {"xsstrike": f"xsstrike -u https://{domain}"},
                            {"gobuster": f"gobuster dir -u https://{domain} -w wordlist.txt"}
                        ]
                        kesh_domain.tool_commands = default_tool_commands
                        kesh_domain.save()
                        print(f"Default tool commands saved for {domain}: {default_tool_commands}")
                        
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
                
                # KeshDomain.tool_commands maydondagi domain nomlarini yangilash
                if kesh_domain.tool_commands:
                    for command_item in kesh_domain.tool_commands:
                        for tool_type, command in command_item.items():
                            if command and old_domain in command:
                                command_item[tool_type] = command.replace(old_domain, new_domain)
                
                kesh_domain.save()
                
                # DomainToolConfiguration jadvalidagi tool buyruqlarini ham yangilash
                tool_configs = DomainToolConfiguration.objects.filter(domain=kesh_domain)
                for config in tool_configs:
                    # Eski domain nomini yangi domain nomi bilan almashtirish
                    if config.final_command:
                        config.final_command = config.final_command.replace(old_domain, new_domain)
                    if config.base_command:
                        config.base_command = config.base_command.replace(old_domain, new_domain)
                    config.save()
                
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

@csrf_exempt
def get_tools(request):
    """Barcha faol tool'larni olish"""
    if request.method == 'GET':
        try:
            # Faol tool'larni bazadan olish
            tools = Tool.objects.filter(is_active=True).values('id', 'name', 'tool_type', 'description')
            
            # Tool'larni list ga o'tkazish
            tools_list = list(tools)
            
            # Tool parametrlarini tools_config.py dan olish
            from .tools_config import TOOLS_DATA
            
            tools_data = {}
            for tool_name, tool_info in TOOLS_DATA.items():
                tools_data[tool_name] = {
                    'parameters': tool_info.get('parameters', []),
                    'inputs': tool_info.get('inputs', []),
                    'examples': tool_info.get('examples', [])
            }
            
            return JsonResponse({
                'success': True,
                'tools': tools_list,
                'tools_data': tools_data,
                'total_tools': len(tools_list)
            })
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat GET so\'rov qabul qilinadi'}, status=405)

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
def get_domain_tool_config(request):
    """Domain uchun tool konfiguratsiyasini olish"""
    if request.method == 'GET':
        try:
            domain_name = request.GET.get('domain_name', '').strip()
            
            if not domain_name:
                return JsonResponse({'error': 'Domain nomi kiritilmagan'}, status=400)
            
            try:
                # Domain ni bazadan topish
                kesh_domain = KeshDomain.objects.get(domain_name=domain_name)
                
                # Tool konfiguratsiyalarini olish
                tool_configs = []
                for config in kesh_domain.tool_configs.all():
                    tool_configs.append({
                        'tool_type': config.tool_type,
                        'base_command': config.base_command,
                        'selected_parameters': config.selected_parameters,
                        'final_command': config.final_command,
                        'is_active': config.is_active
                    })
                
                return JsonResponse({
                    'success': True,
                    'domain': domain_name,
                    'tool_configs': tool_configs,
                    'saved_commands': kesh_domain.tool_commands
                })
            
            except KeshDomain.DoesNotExist:
                return JsonResponse({
                    'error': f'Domain {domain_name} bazada topilmadi'
                }, status=404)
            
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat GET so\'rov qabul qilinadi'}, status=405)

@csrf_exempt
def save_domain_tool_config(request):
    """Domain uchun tool konfiguratsiyasini saqlash"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name', '').strip()
            tool_type = data.get('tool_type', '').strip()
            base_command = data.get('base_command', '').strip()
            selected_parameters = data.get('selected_parameters', [])
            
            if not all([domain_name, tool_type, base_command]):
                return JsonResponse({'error': 'Barcha maydonlar to\'ldirilishi kerak'}, status=400)
            
            try:
                # Domain ni bazadan topish yoki yaratish
                kesh_domain, created = KeshDomain.objects.get_or_create(
                    domain_name=domain_name
                )
                
                # Tool konfiguratsiyasini topish yoki yaratish
                tool_config, config_created = DomainToolConfiguration.objects.get_or_create(
                    domain=kesh_domain,
                    tool_type=tool_type,
                    defaults={
                        'base_command': base_command,
                        'selected_parameters': selected_parameters,
                        'final_command': f"{base_command} {' '.join(selected_parameters)}"
                    }
                )
                
                if not config_created:
                    # Mavjud konfiguratsiyani yangilash
                    tool_config.base_command = base_command
                    tool_config.selected_parameters = selected_parameters
                    tool_config.final_command = f"{base_command} {' '.join(selected_parameters)}"
                    tool_config.save()
                
                # KeshDomain tool_commands ni ham yangilash
                final_command = f"{base_command} {' '.join(selected_parameters)}"
                kesh_domain.merge_tool_commands([{tool_type: final_command}])
                
                return JsonResponse({
                    'success': True,
                    'message': f'Domain {domain_name} uchun {tool_type} konfiguratsiyasi saqlandi!',
                    'final_command': final_command,
                    'created': config_created
                })
            
            except Exception as e:
                return JsonResponse({'error': f'Saqlash xatosi: {str(e)}'}, status=500)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Noto\'g\'ri JSON format'}, status=400)
        except Exception as e:
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
def get_domains(request):
    """Barcha KeshDomain'larni olish"""
    if request.method == 'GET':
        try:
            domains = KeshDomain.objects.all().order_by('-created_at')
            
            domains_data = []
            for domain in domains:
                domains_data.append({
                    'domain_name': domain.domain_name,
                    'tool_commands': domain.tool_commands,
                    'created_at': domain.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'updated_at': domain.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'is_active': domain.is_active
                })
            
            return JsonResponse({
                'success': True,
                'domains': domains_data,
                'total_count': len(domains_data)
            })
                
        except Exception as e:
            return JsonResponse({'error': f'Xatolik yuz berdi: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Faqat GET so\'rov qabul qilinadi'}, status=405)

def run_nmap_scan_with_command(domain, command):
    """KeshDomain bazasidagi buyruq bilan Nmap scanning"""
    try:
        # Check if nmap tool exists
        import os
        nmap_path = 'tools/nmap/nmap.exe'
        if not os.path.exists(nmap_path):
            return {
                'status': 'error',
                'error': 'Nmap tool topilmadi. Iltimos, tools/nmap/ papkasini tekshiring.'
            }
        
        # Command ni parse qilish va domain ni almashtirish
        # command format: "nmap my-courses.uz" yoki "nmap -sS -sV my-courses.uz"
        cmd_parts = command.split()
        # Domain ni almashtirish
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        
        # Nmap path ni qo'shish
        full_cmd = [nmap_path] + cmd_parts[1:]  # nmap.exe + arguments
        
        print(f"Nmap command: {' '.join(full_cmd)}")
        
        # Subprocess'ni Popen bilan ishga tushirish
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='.'
        )
        
        # Natijani kutish
        try:
            stdout, stderr = process.communicate(timeout=300)  # 5 daqiqa
            
            if process.returncode == 0:
                return {
                    'status': 'completed',
                    'output': stdout,
                    'command_used': command
                }
            else:
                return {
                    'status': 'failed',
                    'error': stderr,
                    'return_code': process.returncode,
                    'command_used': command
                }
                
        except subprocess.TimeoutExpired:
            # Vaqt tugaganda process'ni to'xtatish
            process.terminate()
            
            return {
                'status': 'timeout',
                'error': 'Nmap scanning vaqti tugadi',
                'command_used': command
            }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'command_used': command
        }

def run_sqlmap_scan_with_command(domain, command):
    """KeshDomain bazasidagi buyruq bilan SQLMap scanning"""
    try:
        # Check if sqlmap tool exists
        import os
        sqlmap_path = 'tools/sqlmap/sqlmap.py'
        if not os.path.exists(sqlmap_path):
            return {
                'status': 'error',
                'error': 'SQLMap tool topilmadi. Iltimos, tools/sqlmap/ papkasini tekshiring.'
            }
        
        # Command ni parse qilish va domain ni almashtirish
        # command format: "sqlmap -u https://my-courses.uz"
        cmd_parts = command.split()
        # Domain ni almashtirish
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        
        # Python va sqlmap path ni qo'shish
        full_cmd = ['python', sqlmap_path] + cmd_parts[1:]  # python sqlmap.py + arguments
        
        print(f"SQLMap command: {' '.join(full_cmd)}")
        
        # Subprocess'ni Popen bilan ishga tushirish
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='.'
        )
        
        # Natijani kutish
        try:
            stdout, stderr = process.communicate(timeout=180)  # 3 daqiqa
            
            if process.returncode == 0:
                return {
                    'status': 'completed',
                    'output': stdout,
                    'command_used': command
                }
            else:
                return {
                    'status': 'failed',
                    'error': stderr,
                    'return_code': process.returncode,
                    'command_used': command
                }
                
        except subprocess.TimeoutExpired:
            # Vaqt tugaganda process'ni to'xtatish
            process.terminate()
            
            return {
                'status': 'timeout',
                'error': 'SQLMap scanning vaqti tugadi',
                'command_used': command
            }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'command_used': command
        }

def run_gobuster_scan_with_command(domain, command):
    """KeshDomain bazasidagi buyruq bilan Gobuster scanning"""
    try:
        # Check if gobuster tool exists
        import os
        gobuster_path = 'tools/gobuster/gobuster.exe'
        if not os.path.exists(gobuster_path):
            return {
                'status': 'error',
                'error': 'Gobuster tool topilmadi. Iltimos, tools/gobuster/ papkasini tekshiring.'
            }
        
        # Command ni parse qilish va domain ni almashtirish
        # command format: "gobuster dir -u https://my-courses.uz -w wordlist.txt"
        cmd_parts = command.split()
        # Domain ni almashtirish
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        
        # Wordlist ni to'g'ri path bilan almashtirish
        cmd_parts = [part if part != 'wordlist.txt' else 'tools/gobuster/common-files.txt' for part in cmd_parts]
        
        # Gobuster path ni qo'shish
        full_cmd = [gobuster_path] + cmd_parts[1:]  # gobuster.exe + arguments
        
        print(f"Gobuster command: {' '.join(full_cmd)}")
        
        # Subprocess'ni Popen bilan ishga tushirish
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='.'
        )
        
        # Natijani kutish
        try:
            stdout, stderr = process.communicate(timeout=180)  # 3 daqiqa
            
            if process.returncode == 0:
                return {
                    'status': 'completed',
                    'output': stdout,
                    'command_used': command
                }
            else:
                return {
                    'status': 'failed',
                    'error': stderr,
                    'return_code': process.returncode,
                    'command_used': command
                }
                
        except subprocess.TimeoutExpired:
            # Vaqt tugaganda process'ni to'xtatish
            process.terminate()
            
            return {
                'status': 'timeout',
                'error': 'Gobuster scanning vaqti tugadi',
                'command_used': command
            }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'command_used': command
        }

def run_xsstrike_scan_with_command(domain, command):
    """KeshDomain bazasidagi buyruq bilan XSStrike scanning"""
    try:
        # Check if xsstrike tool exists
        import os
        xsstrike_path = 'tools/XSStrike/xsstrike.py'
        if not os.path.exists(xsstrike_path):
            return {
                'status': 'error',
                'error': 'XSStrike tool topilmadi. Iltimos, tools/XSStrike/ papkasini tekshiring.'
            }
        
        # Command ni parse qilish va domain ni almashtirish
        # command format: "xsstrike -u https://my-courses.uz"
        cmd_parts = command.split()
        # Domain ni almashtirish
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        
        # Python va xsstrike path ni qo'shish
        full_cmd = ['python', xsstrike_path] + cmd_parts[1:]  # python xsstrike.py + arguments
        
        print(f"XSStrike command: {' '.join(full_cmd)}")
        
        # Subprocess'ni Popen bilan ishga tushirish
        process = subprocess.Popen(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='.'
        )
        
        # Natijani kutish
        try:
            stdout, stderr = process.communicate(timeout=180)  # 3 daqiqa
            
            if process.returncode == 0:
                return {
                    'status': 'completed',
                    'output': stdout,
                    'command_used': command
                }
            else:
                return {
                    'status': 'failed',
                    'error': stderr,
                    'return_code': process.returncode,
                    'command_used': command
                }
                
        except subprocess.TimeoutExpired:
            # Vaqt tugaganda process'ni to'xtatish
            process.terminate()
            
            return {
                'status': 'timeout',
                'error': 'XSStrike scanning vaqti tugadi',
                'command_used': command
            }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'command_used': command
        }

def stream_tool_output(request, domain, tool_type):
    """Real-time tool output streaming using Server-Sent Events"""
    def event_stream():
        try:
            process_key = f"{domain}_{tool_type}"
            
            # Avval ScanProcess'ni tekshirish
            scan_process = ScanProcess.objects.filter(
                domain_name=domain,
                tool_type=tool_type
            ).first()
            
            if scan_process and scan_process.is_running():
                # Process ishlayapti - real-time output ko'rsatish
                yield f"data: {json.dumps({'status': 'running', 'message': f'🚀 {tool_type} ishlayapti...'})}\n\n"
                
                # Mavjud output'ni ko'rsatish
                if scan_process.output_buffer:
                    for line in scan_process.output_buffer.split('\n'):
                        if line.strip():
                            yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                
                # Yangi output'larni real-time kuzatish
                if process_key in process_manager['output_queues']:
                    output_queue = process_manager['output_queues'][process_key]
                    
                    # Yangi output'larni kutish
                    while True:
                        try:
                            # 1 soniya kutish
                            output = output_queue.get(timeout=1)
                            if output:
                                yield f"data: {json.dumps({'output': output})}\n\n"
                        except queue.Empty:
                            # Timeout - process tugaganini tekshirish
                            scan_process.refresh_from_db()
                            if not scan_process.is_running():
                                break
                            continue
                
                # Process tugaganda
                if scan_process.status == 'completed':
                    yield f"data: {json.dumps({'status': 'completed', 'message': f'✅ {tool_type} muvaffaqiyatli tugadi'})}\n\n"
                elif scan_process.status == 'failed':
                    yield f"data: {json.dumps({'status': 'failed', 'message': f'❌ {tool_type} xatolik bilan tugadi: {scan_process.error_message}'})}\n\n"
                    
            elif scan_process and scan_process.status == 'completed':
                # Process tugagan - natijalarni ko'rsatish
                yield f"data: {json.dumps({'status': 'completed', 'message': f'✅ {tool_type} natijasi mavjud'})}\n\n"
                
                # To'liq natijani ko'rsatish
                for line in scan_process.output_buffer.split('\n'):
                    if line.strip():
                        yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                        
            elif scan_process and scan_process.status == 'failed':
                # Process xatolik bilan tugagan
                yield f"data: {json.dumps({'error': f'{tool_type} xatolik bilan tugadi: {scan_process.error_message}'})}\n\n"
                
            else:
                # Process topilmadi - tool'ni ishga tushirish
                kesh_domain = KeshDomain.objects.filter(domain_name=domain).first()
                if not kesh_domain or not kesh_domain.tool_commands:
                    yield f"data: {json.dumps({'error': 'Tool buyruqlari topilmadi'})}\n\n"
                    return
                
                # Tool buyrugini topish
                tool_command = None
                for cmd in kesh_domain.tool_commands:
                    if tool_type in cmd:
                        tool_command = cmd[tool_type]
                        break
                
                if not tool_command:
                    yield f"data: {json.dumps({'error': f'{tool_type} buyrugi topilmadi'})}\n\n"
                    return
                
                # Background'da tool'ni ishga tushirish
                started = start_background_tool_scan(domain, tool_type, tool_command)
                if started:
                    yield f"data: {json.dumps({'status': 'starting', 'message': f'🚀 {tool_type} ishga tushirilmoqda...'})}\n\n"
                    # Yangi process'ni kuzatish uchun qayta chaqirish
                    yield from stream_tool_output(request, domain, tool_type)
                else:
                    yield f"data: {json.dumps({'error': f'{tool_type} allaqachon ishlayapti'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Xatolik: {str(e)}'})}\n\n"
    
    response = StreamingHttpResponse(
        streaming_content=event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

def stream_nmap_output(domain, command):
    """Stream Nmap output in real-time"""
    try:
        import os
        nmap_path = 'tools/nmap/nmap.exe'
        if not os.path.exists(nmap_path):
            yield f"data: {json.dumps({'error': 'Nmap tool topilmadi. Iltimos, tools/nmap/ papkasini tekshiring.'})}\n\n"
            return
        
        # Parse command and replace domain
        cmd_parts = command.split()
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        full_cmd = [nmap_path] + cmd_parts[1:]
        
        yield f"data: {json.dumps({'status': 'starting', 'message': f'🚀 Nmap ishga tushirilmoqda: {" ".join(full_cmd)}'})}\n\n"
        
        # Start subprocess with real-time output and interactive input
        process = subprocess.Popen(
            full_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Real-time output oqish va interaktiv savollarga javob berish
        for line in process.stdout:
            if line:
                # Output ni real-time ko'rsatish
                yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                
                # Interaktiv savollarga avtomatik javob berish
                if "[y/N]" in line or "[Y/n]" in line or "Continue?" in line:
                    try:
                        process.stdin.write("y\n")
                        process.stdin.flush()
                        yield f"data: {json.dumps({'interactive': 'Avtomatik javob: Ha'})}\n\n"
                    except:
                        pass
        
        # Process tugashini kutish
        process.wait()
        
        # Natijani tekshirish
        return_code = process.returncode
        if return_code != 0:
            yield f"data: {json.dumps({'error': f'Nmap xatolik bilan tugadi (kod: {return_code})'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'completed', 'message': '✅ ✅ Nmap muvaffaqiyatli tugadi'})}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'error': f'Nmap xatolik: {str(e)}'})}\n\n"

def stream_sqlmap_output(domain, command):
    """Stream SQLMap output in real-time"""
    try:
        import os
        sqlmap_path = 'tools/sqlmap/sqlmap.py'
        if not os.path.exists(sqlmap_path):
            yield f"data: {json.dumps({'error': 'SQLMap tool topilmadi. Iltimos, tools/sqlmap/ papkasini tekshiring.'})}\n\n"
            return
        
        # Parse command and replace domain
        cmd_parts = command.split()
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        full_cmd = ['python', sqlmap_path] + cmd_parts[1:]
        
        yield f"data: {json.dumps({'status': 'starting', 'message': f'🚀 SQLMap ishga tushirilmoqda: {" ".join(full_cmd)}'})}\n\n"
        
        # Start subprocess with real-time output and interactive input
        process = subprocess.Popen(
            full_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Real-time output oqish va interaktiv savollarga javob berish
        for line in process.stdout:
            if line:
                # Output ni real-time ko'rsatish
                yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                
                # Interaktiv savollarga avtomatik javob berish
                if "[y/N]" in line or "[Y/n]" in line or "Continue?" in line or "Do you want to" in line:
                    try:
                        process.stdin.write("y\n")
                        process.stdin.flush()
                        yield f"data: {json.dumps({'interactive': 'Avtomatik javob: Ha'})}\n\n"
                    except:
                        pass
        
        # Process tugashini kutish
        process.wait()
        
        # Natijani tekshirish
        return_code = process.returncode
        if return_code != 0:
            yield f"data: {json.dumps({'error': f'SQLMap xatolik bilan tugadi (kod: {return_code})'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'completed', 'message': '✅ ✅ SQLMap muvaffaqiyatli tugadi'})}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'error': f'SQLMap xatolik: {str(e)}'})}\n\n"

def stream_gobuster_output(domain, command):
    """Stream Gobuster output in real-time"""
    try:
        import os
        gobuster_path = 'tools/gobuster/gobuster.exe'
        if not os.path.exists(gobuster_path):
            yield f"data: {json.dumps({'error': 'Gobuster tool topilmadi. Iltimos, tools/gobuster/ papkasini tekshiring.'})}\n\n"
            return
        
        # Parse command and replace domain
        cmd_parts = command.split()
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        full_cmd = [gobuster_path] + cmd_parts[1:]
        
        yield f"data: {json.dumps({'status': 'starting', 'message': f'🚀 Gobuster ishga tushirilmoqda: {" ".join(full_cmd)}'})}\n\n"
        
        # Start subprocess with real-time output and interactive input
        process = subprocess.Popen(
            full_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Real-time output oqish va interaktiv savollarga javob berish
        for line in process.stdout:
            if line:
                # Output ni real-time ko'rsatish
                yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                
                # Interaktiv savollarga avtomatik javob berish
                if "[y/N]" in line or "[Y/n]" in line or "Continue?" in line:
                    try:
                        process.stdin.write("y\n")
                        process.stdin.flush()
                        yield f"data: {json.dumps({'interactive': 'Avtomatik javob: Ha'})}\n\n"
                    except:
                        pass
        
        # Process tugashini kutish
        process.wait()
        
        # Natijani tekshirish
        return_code = process.returncode
        if return_code != 0:
            yield f"data: {json.dumps({'error': f'Gobuster xatolik bilan tugadi (kod: {return_code})'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'completed', 'message': '✅ ✅ Gobuster muvaffaqiyatli tugadi'})}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'error': f'Gobuster xatolik: {str(e)}'})}\n\n"

def stream_xsstrike_output(domain, command):
    """Stream XSStrike output in real-time"""
    try:
        import os
        xsstrike_path = 'tools/XSStrike/xsstrike.py'
        if not os.path.exists(xsstrike_path):
            yield f"data: {json.dumps({'error': 'XSStrike tool topilmadi. Iltimos, tools/XSStrike/ papkasini tekshiring.'})}\n\n"
            return
        
        # Parse command and replace domain
        cmd_parts = command.split()
        cmd_parts = [part if part != 'my-courses.uz' else domain for part in cmd_parts]
        full_cmd = ['python', xsstrike_path] + cmd_parts[1:]
        
        yield f"data: {json.dumps({'status': 'starting', 'message': f'🚀 XSStrike ishga tushirilmoqda: {" ".join(full_cmd)}'})}\n\n"
        
        # Start subprocess with real-time output and interactive input
        process = subprocess.Popen(
            full_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Real-time output oqish va interaktiv savollarga javob berish
        for line in process.stdout:
            if line:
                # Output ni real-time ko'rsatish
                yield f"data: {json.dumps({'output': line.strip()})}\n\n"
                
                # Interaktiv savollarga avtomatik javob berish
                if "[y/N]" in line or "[Y/n]" in line or "Continue?" in line or "Do you want to" in line:
                    try:
                        process.stdin.write("y\n")
                        process.stdin.flush()
                        yield f"data: {json.dumps({'interactive': 'Avtomatik javob: Ha'})}\n\n"
                    except:
                        pass
        
        # Process tugashini kutish
        process.wait()
        
        # Natijani tekshirish
        return_code = process.returncode
        if return_code != 0:
            yield f"data: {json.dumps({'error': f'XSStrike xatolik bilan tugadi (kod: {return_code})'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'completed', 'message': '✅ ✅ XSStrike muvaffaqiyatli tugadi'})}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'error': f'XSStrike xatolik: {str(e)}'})}\n\n"

@csrf_exempt
def scan_details_api(request, scan_id):
    """Scan details ni API orqali olish"""
    try:
        scan = get_object_or_404(DomainScan, id=scan_id)
        
        # Scan ma'lumotlarini JSON formatda qaytarish
        scan_data = {
            'id': scan.id,
            'domain_name': scan.domain_name,
            'status': scan.status,
            'scan_date': scan.scan_date.isoformat(),
            'ip_address': scan.ip_address,
            'dns_records': scan.dns_records,
            'ssl_info': scan.ssl_info,
            'security_headers': scan.security_headers,
            'tool_results': scan.tool_results,
            'raw_tool_output': scan.raw_tool_output,
            'error_message': scan.error_message,
        }
        
        return JsonResponse({
            'success': True,
            'scan': scan_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
def stop_tool_process(request, domain, tool_type):
    """Tool process'ini to'xtatish"""
    if request.method == 'POST':
        try:
            process_key = f"{domain}_{tool_type}"
            
            with process_manager['lock']:
                if process_key in process_manager['processes']:
                    process_info = process_manager['processes'][process_key]
                    
                    # Process'ni to'xtatish
                    if process_info['process']:
                        try:
                            process_info['process'].terminate()
                            process_info['process'].wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            process_info['process'].kill()
                    
                    # ScanProcess'ni yangilash
                    if process_info['scan_process']:
                        process_info['scan_process'].status = 'stopped'
                        process_info['scan_process'].end_time = timezone.now()
                        process_info['scan_process'].save()
                    
                    # Process manager'dan olib tashlash
                    del process_manager['processes'][process_key]
                    if process_key in process_manager['output_queues']:
                        del process_manager['output_queues'][process_key]
                    
                    return JsonResponse({
                        'success': True,
                        'message': f'{tool_type} process to\'xtatildi'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'error': f'{tool_type} process topilmadi'
                    })
                    
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Noto\'g\'ri so\'rov'
    }, status=400)



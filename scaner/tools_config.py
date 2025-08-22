# -*- coding: utf-8 -*-
"""
Tool konfiguratsiyalari - barcha tool'lar uchun parametrlar va input'lar
"""

TOOLS_DATA = {
    'nmap': {
        'name': 'Nmap',
        'description': 'Tarmoq skanerlash va portlarni topish vositasi',
        'category': 'Tarmoq Xavfsizligi',
        'parameters': [
            {'flag': '-sS', 'description': 'TCP SYN skanerlash - portlarni ochiq yoki yopiqligini aniqlash'},
            {'flag': '-sU', 'description': 'UDP skanerlash - UDP portlarni tekshirish'},
            {'flag': '-O', 'description': 'OS fingerprinting - operatsion tizimni aniqlash'},
            {'flag': '-sV', 'description': 'Xizmat versiyasini aniqlash'},
            {'flag': '-A', 'description': 'Aggressive skanerlash - barcha xususiyatlarni faollashtirish'},
            {'flag': '--script', 'description': 'NSE skriptlarini ishlatish'},
            {'flag': '-T4', 'description': 'Tezlik - 4 darajada tez skanerlash'}
        ],
        'inputs': [
            {
                'key': '-p',
                'description': 'Maxsus portlarni skanerlash',
                'placeholder': 'Masalan: 80,443,8080 yoki 1-1000',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--script',
                'description': 'NSE skript nomi yoki kategoriyasi',
                'placeholder': 'Masalan: vuln, auth, default',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--host-timeout',
                'description': 'Host uchun maksimal vaqt (millisekundlarda)',
                'placeholder': 'Masalan: 30000',
                'default': '',
                'type': 'number',
                'required': False
            }
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
            {'flag': '--threads', 'description': 'Parallel ishlash uchun threadlar soni'},
            {'flag': '--timeout', 'description': 'HTTP so\'rovlar uchun timeout'},
            {'flag': '--retries', 'description': 'Xatolik yuz berganda qayta urinishlar soni'}
        ],
        'inputs': [
            {
                'key': '--level',
                'description': 'Test darajasi (1-5) - yuqori daraja ko\'proq test',
                'placeholder': '1-5 orasida',
                'default': '1',
                'type': 'range',
                'required': False,
                'min': 1,
                'max': 5,
                'step': 1
            },
            {
                'key': '--risk',
                'description': 'Xavf darajasi (1-3) - yuqori xavf ko\'proq payload',
                'placeholder': '1-3 orasida',
                'default': '1',
                'type': 'range',
                'required': False,
                'min': 1,
                'max': 3,
                'step': 1
            },
            {
                'key': '-D',
                'description': 'Ma\'lumotlar bazasi nomi',
                'placeholder': 'Masalan: testdb',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '-T',
                'description': 'Jadval nomi',
                'placeholder': 'Masalan: users',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '-C',
                'description': 'Ustun nomi',
                'placeholder': 'Masalan: username,password',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--dbms',
                'description': 'Ma\'lumotlar bazasi turi',
                'placeholder': 'Masalan: mysql, postgresql, mssql',
                'default': '',
                'type': 'text',
                'required': False
            }
        ],
        'examples': [
            'sqlmap --dbs',
            'sqlmap --batch --random-agent',
            'sqlmap --tables -D database_name'
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
            {'flag': '--json', 'description': 'JSON formatida natijalarni ko\'rsatish'},
            {'flag': '--skip-waf', 'description': 'WAF tekshiruvlarini o\'tkazmaslik'},
            {'flag': '--blind', 'description': 'Blind XSS testlarini o\'tkazish'},
            {'flag': '--crawl', 'description': 'Sahifalarni avtomatik ko\'rish va tekshirish'}
        ],
        'inputs': [
            {
                'key': '--params',
                'description': 'Maxsus parametrlarni tekshirish',
                'placeholder': 'Masalan: q,id,search',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--headers',
                'description': 'HTTP headerlarni tekshirish',
                'placeholder': 'Masalan: User-Agent,Referer',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--cookies',
                'description': 'Cookie larni tekshirish',
                'placeholder': 'Masalan: session,user',
                'default': '',
                'type': 'text',
                'required': False
            },
            {
                'key': '--threads',
                'description': 'Parallel ishlash uchun threadlar soni',
                'placeholder': 'Masalan: 10',
                'default': '10',
                'type': 'number',
                'required': False,
                'min': 1,
                'max': 50
            }
        ],
        'examples': [
            'xsstrike --crawl',
            'xsstrike --blind',
            'xsstrike --json'
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
            {'flag': '--status-codes', 'description': 'Qaysi HTTP kodlarni ko\'rsatish'},
            {'flag': '--exclude-length', 'description': 'Ma\'lum uzunlikdagi javoblarni chiqarib tashlash'},
            {'flag': '--follow-redirect', 'description': 'Redirect\'larni kuzatib borish'},
            {'flag': '--no-tls-validation', 'description': 'TLS sertifikatini tekshirmaslik'},
            {'flag': '--random-agent', 'description': 'Tasodifiy User-Agent ishlatish'}
        ],
        'inputs': [
            {
                'key': '-w',
                'description': 'So\'zlar ro\'yxati fayli (wordlist)',
                'placeholder': 'Masalan: /usr/share/wordlists/dirb/common.txt',
                'default': '/usr/share/wordlists/dirb/common.txt',
                'type': 'file',
                'required': False
            },
            {
                'key': '-t',
                'description': 'Threadlar soni (parallel ishlash)',
                'placeholder': 'Masalan: 10',
                'default': '10',
                'type': 'number',
                'required': False,
                'min': 1,
                'max': 100
            },
            {
                'key': '-x',
                'description': 'Fayl kengaytmalarini qo\'shish',
                'placeholder': 'Masalan: php,html,txt,js',
                'default': 'php,html,txt',
                'type': 'text',
                'required': False
            },
            {
                'key': '--status-codes',
                'description': 'Qaysi HTTP kodlarni ko\'rsatish',
                'placeholder': 'Masalan: 200,204,301,302,307,401,403',
                'default': '200,204,301,302,307,401,403',
                'type': 'text',
                'required': False
            },
            {
                'key': '--exclude-length',
                'description': 'Ma\'lum uzunlikdagi javoblarni chiqarib tashlash',
                'placeholder': 'Masalan: 0',
                'default': '',
                'type': 'number',
                'required': False
            }
        ],
        'examples': [
            'gobuster dir -w /usr/share/wordlists/dirb/common.txt',
            'gobuster dns -d example.com -w /usr/share/wordlists/subdomains.txt',
            'gobuster fuzz -w wordlist.txt -x php,html,txt'
        ]
    }
}

def get_tool_data(tool_name):
    """Tool nomi bo'yicha ma'lumotlarni olish"""
    tool_name_lower = tool_name.lower()
    return TOOLS_DATA.get(tool_name_lower)

def get_all_tools():
    """Barcha tool'lar ro'yxatini olish"""
    return list(TOOLS_DATA.keys())

def get_tool_parameters(tool_name):
    """Tool parametrlarini olish"""
    tool_data = get_tool_data(tool_name)
    if tool_data:
        return tool_data.get('parameters', [])
    return []

def get_tool_inputs(tool_name):
    """Tool input'larini olish"""
    tool_data = get_tool_data(tool_name)
    if tool_data:
        return tool_data.get('inputs', [])
    return []

def get_tool_examples(tool_name):
    """Tool misollarini olish"""
    tool_data = get_tool_data(tool_name)
    if tool_data:
        return tool_data.get('examples', [])
    return []

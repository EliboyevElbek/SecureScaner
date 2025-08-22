from django.core.management.base import BaseCommand
from scaner.models import Tool, ToolParameter

class Command(BaseCommand):
    help = 'Tool va ularning parametrlarini yaratish'

    def handle(self, *args, **options):
        self.stdout.write('Tool parametrlarini yaratish boshlandi...')
        
        # SQLMap tool'ini yaratish
        sqlmap_tool, created = Tool.objects.get_or_create(
            tool_type='sqlmap',
            defaults={
                'name': 'SQLMap',
                'executable_path': 'tools/sqlmap/sqlmap.py',
                'description': 'SQL injection tahlil qilish uchun'
            }
        )
        
        if created:
            self.stdout.write(f'SQLMap tool yaratildi: {sqlmap_tool.name}')
        else:
            self.stdout.write(f'SQLMap tool mavjud: {sqlmap_tool.name}')
        
        # SQLMap parametrlari
        sqlmap_params = [
            {
                'name': 'URL',
                'short_name': '-u',
                'parameter_type': 'input',
                'description': 'Tahlil qilish uchun URL',
                'placeholder': 'https://example.com/page.php?id=1',
                'is_required': True,
                'order': 1
            },
            {
                'name': 'Level',
                'short_name': '--level',
                'parameter_type': 'option',
                'description': 'Tahlil darajasi (1-5)',
                'default_value': '1',
                'placeholder': '1-5 orasida',
                'validation_regex': '^[1-5]$',
                'help_text': 'Yuqori daraja = ko\'proq testlar, lekin sekinroq',
                'order': 2
            },
            {
                'name': 'Risk',
                'short_name': '--risk',
                'parameter_type': 'option',
                'description': 'Xavf darajasi (1-3)',
                'default_value': '1',
                'placeholder': '1-3 orasida',
                'validation_regex': '^[1-3]$',
                'help_text': 'Yuqori xavf = ko\'proq xavfli testlar',
                'order': 3
            },
            {
                'name': 'Database',
                'short_name': '--dbs',
                'parameter_type': 'flag',
                'description': 'Ma\'lumotlar bazalarini topish',
                'order': 4
            },
            {
                'name': 'Tables',
                'short_name': '--tables',
                'parameter_type': 'flag',
                'description': 'Jadvallarni topish',
                'order': 5
            },
            {
                'name': 'Columns',
                'short_name': '--columns',
                'parameter_type': 'flag',
                'description': 'Ustunlarni topish',
                'order': 6
            },
            {
                'name': 'Dump',
                'short_name': '--dump',
                'parameter_type': 'flag',
                'description': 'Ma\'lumotlarni yuklab olish',
                'order': 7
            },
            {
                'name': 'Verbose',
                'short_name': '-v',
                'parameter_type': 'checkbox',
                'description': 'Batafsil ma\'lumot',
                'order': 8
            },
            {
                'name': 'Threads',
                'short_name': '--threads',
                'parameter_type': 'option',
                'description': 'Parallel thread\'lar soni',
                'default_value': '1',
                'placeholder': '1-10 orasida',
                'validation_regex': '^[1-9]|10$',
                'help_text': 'Ko\'proq thread = tezroq, lekin serverga yuk',
                'order': 9
            }
        ]
        
        for param_data in sqlmap_params:
            param, created = ToolParameter.objects.get_or_create(
                tool=sqlmap_tool,
                name=param_data['name'],
                defaults=param_data
            )
            if created:
                self.stdout.write(f'  - {param.name} parametri yaratildi')
        
        # Nmap tool'ini yaratish
        nmap_tool, created = Tool.objects.get_or_create(
            tool_type='nmap',
            defaults={
                'name': 'Nmap',
                'executable_path': 'tools/nmap/nmap.exe',
                'description': 'Port va xizmat tahlil qilish uchun'
            }
        )
        
        if created:
            self.stdout.write(f'Nmap tool yaratildi: {nmap_tool.name}')
        else:
            self.stdout.write(f'Nmap tool mavjud: {nmap_tool.name}')
        
        # Nmap parametrlari
        nmap_params = [
            {
                'name': 'Target',
                'short_name': '',
                'parameter_type': 'input',
                'description': 'Tahlil qilish uchun IP yoki domain',
                'placeholder': '192.168.1.1 yoki example.com',
                'is_required': True,
                'order': 1
            },
            {
                'name': 'Port Range',
                'short_name': '-p',
                'parameter_type': 'option',
                'description': 'Port oralig\'i',
                'default_value': '1-1000',
                'placeholder': '1-1000, 80,443,8080',
                'help_text': 'Maxsus portlar yoki oralik',
                'order': 2
            },
            {
                'name': 'Service Detection',
                'short_name': '-sV',
                'parameter_type': 'flag',
                'description': 'Xizmat versiyalarini aniqlash',
                'order': 3
            },
            {
                'name': 'OS Detection',
                'short_name': '-O',
                'parameter_type': 'flag',
                'description': 'Operatsion tizimni aniqlash',
                'order': 4
            },
            {
                'name': 'Scripts',
                'short_name': '--script',
                'parameter_type': 'option',
                'description': 'Maxsus script\'lar',
                'placeholder': 'vuln,default,auth',
                'help_text': 'NSE script kategoriyalari',
                'order': 5
            },
            {
                'name': 'Timing',
                'short_name': '-T',
                'parameter_type': 'option',
                'description': 'Tahlil tezligi',
                'default_value': '3',
                'placeholder': '0-5 orasida',
                'validation_regex': '^[0-5]$',
                'help_text': '0 = juda sekin, 5 = juda tez',
                'order': 6
            }
        ]
        
        for param_data in nmap_params:
            param, created = ToolParameter.objects.get_or_create(
                tool=nmap_tool,
                name=param_data['name'],
                defaults=param_data
            )
            if created:
                self.stdout.write(f'  - {param.name} parametri yaratildi')
        
        # XSStrike tool'ini yaratish
        xsstrike_tool, created = Tool.objects.get_or_create(
            tool_type='xsstrike',
            defaults={
                'name': 'XSStrike',
                'executable_path': 'tools/XSStrike/xsstrike.py',
                'description': 'XSS zaifliklarini topish uchun'
            }
        )
        
        if created:
            self.stdout.write(f'XSStrike tool yaratildi: {xsstrike_tool.name}')
        else:
            self.stdout.write(f'XSStrike tool mavjud: {xsstrike_tool.name}')
        
        # XSStrike parametrlari
        xsstrike_params = [
            {
                'name': 'URL',
                'short_name': '-u',
                'parameter_type': 'input',
                'description': 'Tahlil qilish uchun URL',
                'placeholder': 'https://example.com/page.php?q=test',
                'is_required': True,
                'order': 1
            },
            {
                'name': 'Crawl',
                'short_name': '--crawl',
                'parameter_type': 'flag',
                'description': 'Sahifalarni avtomatik ko\'rish',
                'order': 2
            },
            {
                'name': 'Blind',
                'short_name': '--blind',
                'parameter_type': 'flag',
                'description': 'Blind XSS tahlil qilish',
                'order': 3
            },
            {
                'name': 'Skip DOM',
                'short_name': '--skip-dom',
                'parameter_type': 'checkbox',
                'description': 'DOM XSS ni o\'tkazib yuborish',
                'order': 4
            }
        ]
        
        for param_data in xsstrike_params:
            param, created = ToolParameter.objects.get_or_create(
                tool=xsstrike_tool,
                name=param_data['name'],
                defaults=param_data
            )
            if created:
                self.stdout.write(f'  - {param.name} parametri yaratildi')
        
        # Gobuster tool'ini yaratish
        gobuster_tool, created = Tool.objects.get_or_create(
            tool_type='gobuster',
            defaults={
                'name': 'Gobuster',
                'executable_path': 'tools/gobuster/gobuster.exe',
                'description': 'Directory va fayl topish uchun'
            }
        )
        
        if created:
            self.stdout.write(f'Gobuster tool yaratildi: {gobuster_tool.name}')
        else:
            self.stdout.write(f'Gobuster tool mavjud: {gobuster_tool.name}')
        
        # Gobuster parametrlari
        gobuster_params = [
            {
                'name': 'URL',
                'short_name': '-u',
                'parameter_type': 'input',
                'description': 'Tahlil qilish uchun URL',
                'placeholder': 'https://example.com',
                'is_required': True,
                'order': 1
            },
            {
                'name': 'Wordlist',
                'short_name': '-w',
                'parameter_type': 'option',
                'description': 'So\'zlar ro\'yxati',
                'default_value': 'common.txt',
                'placeholder': 'common.txt, directory-list.txt',
                'help_text': 'Fayl yo\'li yoki standart ro\'yxat',
                'order': 2
            },
            {
                'name': 'Extensions',
                'short_name': '-x',
                'parameter_type': 'option',
                'description': 'Fayl kengaytmalari',
                'placeholder': 'php,html,txt',
                'help_text': 'Qidirish uchun kengaytmalar',
                'order': 3
            },
            {
                'name': 'Threads',
                'short_name': '-t',
                'parameter_type': 'option',
                'description': 'Thread\'lar soni',
                'default_value': '10',
                'placeholder': '1-100 orasida',
                'validation_regex': '^[1-9][0-9]*$',
                'help_text': 'Ko\'proq thread = tezroq',
                'order': 4
            },
            {
                'name': 'Status Codes',
                'short_name': '-s',
                'parameter_type': 'option',
                'description': 'Qidirish uchun status kodlar',
                'default_value': '200,204,301,302,307,401,403',
                'placeholder': '200,204,301,302,307,401,403',
                'help_text': 'Muvaffaqiyatli natijalar uchun',
                'order': 5
            }
        ]
        
        for param_data in gobuster_params:
            param, created = ToolParameter.objects.get_or_create(
                tool=gobuster_tool,
                name=param_data['name'],
                defaults=param_data
            )
            if created:
                self.stdout.write(f'  - {param.name} parametri yaratildi')
        
        self.stdout.write(self.style.SUCCESS('Barcha tool parametrlari muvaffaqiyatli yaratildi!'))

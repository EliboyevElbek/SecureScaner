from django.core.management.base import BaseCommand
from scaner.models import Tool
import os

class Command(BaseCommand):
    help = 'Setup default tools for SiteScaner'

    def handle(self, *args, **options):
        # Get the base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        tools_dir = os.path.join(base_dir, 'tools')
        
        # Default tools configuration
        default_tools = [
            {
                'name': 'SQLMap',
                'tool_type': 'sqlmap',
                'executable_path': os.path.join(tools_dir, 'sqlmap', 'sqlmap.py'),
                'description': 'SQL injection testing tool'
            },
            {
                'name': 'Nmap',
                'tool_type': 'nmap',
                'executable_path': os.path.join(tools_dir, 'nmap', 'nmap.exe'),
                'description': 'Network discovery and security auditing tool'
            },
            {
                'name': 'XSStrike',
                'tool_type': 'xsstrike',
                'executable_path': os.path.join(tools_dir, 'XSStrike', 'xsstrike.py'),
                'description': 'XSS detection and exploitation tool'
            },
            {
                'name': 'Gobuster',
                'tool_type': 'gobuster',
                'executable_path': os.path.join(tools_dir, 'gobuster', 'gobuster.exe'),
                'description': 'Directory/file enumeration tool'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for tool_config in default_tools:
            tool, created = Tool.objects.get_or_create(
                name=tool_config['name'],
                defaults={
                    'tool_type': tool_config['tool_type'],
                    'executable_path': tool_config['executable_path'],
                    'description': tool_config['description'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created tool: {tool.name}')
                )
            else:
                # Update existing tool
                tool.tool_type = tool_config['tool_type']
                tool.executable_path = tool_config['executable_path']
                tool.description = tool_config['description']
                tool.is_active = True
                tool.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated tool: {tool.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully setup tools. Created: {created_count}, Updated: {updated_count}'
            )
        )

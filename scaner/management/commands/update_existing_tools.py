from django.core.management.base import BaseCommand
from scaner.models import KeshDomain

class Command(BaseCommand):
    help = 'Update existing domains with proper tool commands'

    def handle(self, *args, **options):
        self.stdout.write('Updating existing domains with tool commands...')
        
        domains = KeshDomain.objects.all()
        updated_count = 0
        
        for domain in domains:
            if not domain.tool_commands:
                # Create default tool commands for domains without them
                default_tool_commands = [
                    {"sqlmap": f"python tools/sqlmap/sqlmap.py -u https://{domain.domain_name}"},
                    {"nmap": f"tools/nmap/nmap.exe {domain.domain_name}"},
                    {"xsstrike": f"python tools/XSStrike/xsstrike.py -u https://{domain.domain_name}"},
                    {"gobuster": f"tools/gobuster/gobuster.exe dir -u https://{domain.domain_name} -w tools/gobuster/common-files.txt"}
                ]
                
                domain.tool_commands = default_tool_commands
                domain.save()
                updated_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated {domain.domain_name} with {len(default_tool_commands)} tool commands'
                    )
                )
            else:
                self.stdout.write(
                    f'Domain {domain.domain_name} already has {len(domain.tool_commands)} tool commands'
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} domains'
            )
        )


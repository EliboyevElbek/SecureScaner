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
                    {"sqlmap": f"sqlmap -u https://{domain.domain_name}"},
                    {"nmap": f"nmap {domain.domain_name}"},
                    {"xsstrike": f"xsstrike -u https://{domain.domain_name}"},
                    {"gobuster": f"gobuster dir -u https://{domain.domain_name} -w wordlist.txt"}
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

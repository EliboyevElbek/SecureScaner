import os
import uuid
import subprocess
import psutil
import time
import logging
from typing import Dict, List, Optional
from django.conf import settings
from .models import ScanProcess

logger = logging.getLogger(__name__)

class ScanProcessManager:
    """Har bir scan jarayonini boshqarish uchun manager"""
    
    def __init__(self):
        self.active_processes: Dict[str, subprocess.Popen] = {}  # scan_id -> process
    
    def start_scan(self, domain: str, tool_type: str, command: List[str], 
                   cwd: str = None, env: Dict = None) -> Dict:
        """Yangi scan jarayonini ishga tushirish"""
        try:
            # Unique scan_id yaratish
            scan_id = str(uuid.uuid4())
            
            logger.info(f"Scan boshlanmoqda: {scan_id} (Domain: {domain}, Tool: {tool_type})")
            
            # Process'ni ishga tushirish
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True,
                cwd=cwd,
                env=env
            )
            
            # Bazaga saqlash
            scan_process = ScanProcess.objects.create(
                scan_id=scan_id,
                domain_name=domain,
                tool_type=tool_type,
                pid=process.pid,
                command=' '.join(command),
                status='running',
                process_info={
                    'start_time': time.time(),
                    'cwd': cwd,
                    'env_keys': list(env.keys()) if env else []
                }
            )
            
            # Active process'larni saqlash
            self.active_processes[scan_id] = process
            
            logger.info(f"Scan muvaffaqiyatli ishga tushdi: {scan_id} (PID: {process.pid})")
            
            return {
                'success': True,
                'scan_id': scan_id,
                'pid': process.pid,
                'message': f'Scan ishga tushdi (PID: {process.pid})'
            }
            
        except Exception as e:
            logger.error(f"Scan boshlashda xatolik: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def stop_scan(self, scan_id: str, force: bool = False) -> Dict:
        """Scan jarayonini to'xtatish"""
        try:
            # Bazadan scan process'ni olish
            try:
                scan_process = ScanProcess.objects.get(scan_id=scan_id)
            except ScanProcess.DoesNotExist:
                return {
                    'success': False,
                    'error': f'Scan {scan_id} topilmadi'
                }
            
            pid = scan_process.pid
            
            logger.info(f"Scan to'xtatilmoqda: {scan_id} (PID: {pid})")
            
            # psutil orqali process'ni olish
            try:
                p = psutil.Process(pid)
                
                if force:
                    # Force kill - barcha child process'lar bilan
                    self._kill_process_tree(p)
                    logger.info(f"Scan force kill qilindi: {scan_id} (PID: {pid})")
                else:
                    # Graceful termination
                    p.terminate()
                    
                    # 5 soniya kutish
                    try:
                        p.wait(timeout=5)
                        logger.info(f"Scan graceful to'xtatildi: {scan_id} (PID: {pid})")
                    except psutil.TimeoutExpired:
                        # Timeout bo'lsa, force kill
                        logger.warning(f"Scan timeout, force kill qilinmoqda: {scan_id} (PID: {pid})")
                        self._kill_process_tree(p)
                
                # Bazadagi yozuvni o'chirish
                scan_process.delete()
                logger.info(f"Scan yozuvi bazadan o'chirildi: {scan_id}")
                
                # Active process'lardan o'chirish
                if scan_id in self.active_processes:
                    del self.active_processes[scan_id]
                
                return {
                    'success': True,
                    'message': f'Scan to\'xtatildi va o\'chirildi (PID: {pid})'
                }
                
            except psutil.NoSuchProcess:
                logger.warning(f"Process allaqachon tugagan: {scan_id} (PID: {pid})")
                # Bazadagi yozuvni o'chirish
                scan_process.delete()
                return {
                    'success': True,
                    'message': f'Process allaqachon tugagan va yozuv o\'chirildi (PID: {pid})'
                }
                
        except Exception as e:
            logger.error(f"Scan to'xtatishda xatolik: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _kill_process_tree(self, process: psutil.Process):
        """Process va uning barcha child'larini o'chirish"""
        try:
            # Barcha child process'larni o'chirish
            children = process.children(recursive=True)
            for child in children:
                try:
                    child.kill()
                    logger.debug(f"Child process o'chirildi: PID={child.pid}")
                except psutil.NoSuchProcess:
                    pass  # Process allaqachon tugagan
            
            # Asosiy process'ni o'chirish
            process.kill()
            logger.debug(f"Main process o'chirildi: PID={process.pid}")
            
        except Exception as e:
            logger.error(f"Process tree o'chirishda xatolik: {e}")
    
    def stop_all_scans(self, force: bool = False) -> Dict:
        """Barcha scan'larni to'xtatish"""
        try:
            terminated_count = 0
            errors = []
            debug_info = []
            
            logger.info("🔍 Barcha scan'larni to'xtatish boshlandi...")
            
            # Bazadan barcha running scan'larni olish
            running_scans = ScanProcess.objects.filter(status='running')
            total_scans = running_scans.count()
            
            logger.info(f"📊 Bazada {total_scans} ta running scan topildi")
            
            for scan_process in running_scans:
                scan_id = str(scan_process.scan_id)
                pid = scan_process.pid
                domain = scan_process.domain_name
                tool_type = scan_process.tool_type
                
                logger.info(f"🎯 SCAN TOPILDI:")
                logger.info(f"   Scan ID: {scan_id}")
                logger.info(f"   Domain: {domain}")
                logger.info(f"   Tool: {tool_type}")
                logger.info(f"   PID: {pid}")
                logger.info(f"   Command: {scan_process.command}")
                
                debug_info.append({
                    'scan_id': scan_id,
                    'pid': pid,
                    'domain': domain,
                    'tool_type': tool_type,
                    'command': scan_process.command,
                    'status': 'found'
                })
                
                # Scan'ni to'xtatish
                result = self.stop_scan(scan_id, force)
                if result['success']:
                    terminated_count += 1
                    logger.info(f"✅ Scan to'xtatildi: {scan_id}")
                    
                    debug_info.append({
                        'scan_id': scan_id,
                        'pid': pid,
                        'domain': domain,
                        'tool_type': tool_type,
                        'status': 'terminated'
                    })
                else:
                    error_msg = f"Scan {scan_id} to'xtatilmadi: {result['error']}"
                    errors.append(error_msg)
                    logger.error(f"❌ {error_msg}")
                    
                    debug_info.append({
                        'scan_id': scan_id,
                        'pid': pid,
                        'domain': domain,
                        'tool_type': tool_type,
                        'status': 'error',
                        'error': result['error']
                    })
            
            logger.info(f"\n📊 JAMI NATIJA:")
            logger.info(f"   Topilgan scan'lar: {total_scans}")
            logger.info(f"   To'xtatilgan scan'lar: {terminated_count}")
            logger.info(f"   Xatoliklar: {len(errors)}")
            
            if debug_info:
                logger.info(f"\n🔍 BATAFSIL MA'LUMOT:")
                for info in debug_info:
                    status_emoji = {
                        'found': '🎯',
                        'terminated': '✅',
                        'error': '❌'
                    }
                    logger.info(f"   {status_emoji.get(info['status'], '❓')} {info['scan_id']}: {info['domain']} - {info['tool_type']} (PID: {info['pid']})")
            
            return {
                'success': True,
                'message': f'{terminated_count} ta scan to\'xtatildi',
                'terminated_count': terminated_count,
                'total_count': total_scans,
                'debug_info': debug_info,
                'errors': errors
            }
            
        except Exception as e:
            logger.error(f'Barcha scan\'larni to\'xtatishda xatolik: {e}')
            return {'error': str(e)}
    
    def get_scan_status(self, scan_id: str) -> Optional[Dict]:
        """Scan holatini olish"""
        try:
            scan_process = ScanProcess.objects.get(scan_id=scan_id)
            
            try:
                p = psutil.Process(scan_process.pid)
                
                # Process holatini yangilash
                status = {
                    'scan_id': str(scan_process.scan_id),
                    'domain': scan_process.domain_name,
                    'tool_type': scan_process.tool_type,
                    'pid': scan_process.pid,
                    'command': scan_process.command,
                    'start_time': scan_process.start_time.isoformat(),
                    'status': 'running',
                    'cpu_percent': p.cpu_percent(),
                    'memory_info': p.memory_info()._asdict(),
                    'create_time': p.create_time(),
                    'num_threads': p.num_threads()
                }
                
                return status
                
            except psutil.NoSuchProcess:
                # Process tugagan
                scan_process.status = 'completed'
                scan_process.save()
                return {
                    'scan_id': str(scan_process.scan_id),
                    'domain': scan_process.domain_name,
                    'tool_type': scan_process.tool_type,
                    'status': 'completed',
                    'error': 'Process tugagan'
                }
                
        except ScanProcess.DoesNotExist:
            return None
    
    def get_all_scans(self) -> List[Dict]:
        """Barcha scan'larni olish"""
        scans = []
        
        for scan_process in ScanProcess.objects.all():
            status = self.get_scan_status(str(scan_process.scan_id))
            if status:
                scans.append(status)
        
        return scans
    
    def cleanup_completed_scans(self):
        """Tugagan scan'larni tozalash"""
        try:
            # Barcha scan'larni tekshirish
            for scan_process in ScanProcess.objects.all():
                try:
                    p = psutil.Process(scan_process.pid)
                    if p.status() == psutil.STATUS_ZOMBIE:
                        scan_process.delete()
                        logger.info(f"Zombie scan tozalandi: {scan_process.scan_id}")
                except psutil.NoSuchProcess:
                    scan_process.delete()
                    logger.info(f"Tugagan scan tozalandi: {scan_process.scan_id}")
            
            logger.info("Tugagan scan'lar tozalandi")
            
        except Exception as e:
            logger.error(f"Scan'larni tozalashda xatolik: {e}")

# Global scan manager instance
scan_manager = ScanProcessManager()

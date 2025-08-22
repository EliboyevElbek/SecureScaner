// Scan History Page JavaScript

// Avtomatik yangilanish uchun interval
let autoRefreshInterval;

// Sahifa yuklanganda avtomatik yangilanishni boshlash
document.addEventListener('DOMContentLoaded', function() {
    startAutoRefresh();
    checkScanHistoryUpdate();
});

// Scan history yangilanish signal'ini tekshirish
function checkScanHistoryUpdate() {
    const updateSignal = localStorage.getItem('scanHistoryUpdate');
    const updateTimestamp = localStorage.getItem('updateTimestamp');
    
    if (updateSignal === 'true' && updateTimestamp) {
        const timeDiff = Date.now() - parseInt(updateTimestamp);
        
        // 5 soniyadan kam bo'lsa, yangilash
        if (timeDiff < 5000) {
            localStorage.removeItem('scanHistoryUpdate');
            localStorage.removeItem('updateTimestamp');
            
            // Yangi tahlillar qismini yangilash
            refreshRecentScans();
            
            // Bildirish ko'rsatish
            showNotification('Yangi tahlillar qo\'shildi! Avvalgi yangi tahlillar eski qatorga ko\'chdi.', 'info');
        }
    }
}

// Avtomatik yangilanishni boshlash
function startAutoRefresh() {
    // Har 30 soniyada yangilash
    autoRefreshInterval = setInterval(refreshRecentScans, 30000);
    
    // Foydalanuvchi sahifada faol bo'lganda yangilash
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            refreshRecentScans();
        }
    });
}

// Avtomatik yangilanishni to'xtatish
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

// Yangi tahlillarni yangilash
async function refreshRecentScans() {
    try {
        const response = await fetch('/scaner/history/');
        const html = await response.text();
        
        // HTML dan yangi tahlillar qismini ajratib olish
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const newRecentSection = doc.querySelector('.recent-scans-section');
        const currentRecentSection = document.querySelector('.recent-scans-section');
        
        if (newRecentSection && currentRecentSection) {
            // Yangi tahlillar sonini yangilash
            const newCount = newRecentSection.querySelector('.count-badge');
            const currentCount = currentRecentSection.querySelector('.count-badge');
            
            if (newCount && currentCount) {
                const newCountValue = parseInt(newCount.textContent);
                const currentCountValue = parseInt(currentCount.textContent);
                
                // Agar yangi tahlillar qo'shilgan bo'lsa
                if (newCountValue > currentCountValue) {
                    // Yangi tahlillar qismini yangilash
                    currentRecentSection.innerHTML = newRecentSection.innerHTML;
                    
                    // Yangi tahlillar qo'shilganini bildirish
                    showNotification(`${newCountValue - currentCountValue} ta yangi tahlil qo'shildi!`, 'success');
                    
                    // Yangi tahlillarni ajratib ko'rsatish
                    highlightNewScans();
                }
            }
        }
    } catch (error) {
        console.error('Yangi tahlillarni yangilashda xatolik:', error);
    }
}

// Yangi tahlillarni ajratib ko'rsatish
function highlightNewScans() {
    const newScans = document.querySelectorAll('.recent-scan');
    
    newScans.forEach((scan, index) => {
        // Yangi tahlillarga animatsiya qo'shish
        scan.style.animation = 'pulse 2s ease-in-out';
        
        // 2 soniyadan keyin animatsiyani o'chirish
        setTimeout(() => {
            scan.style.animation = '';
        }, 2000);
    });
}

// Bildirish ko'rsatish
function showNotification(message, type = 'info') {
    // Mavjud bildirishni o'chirish
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Yangi bildirish yaratish
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Sahifaga qo'shish
    document.body.appendChild(notification);
    
    // 5 soniyadan keyin avtomatik yashirish
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Sahifa yopilganda avtomatik yangilanishni to'xtatish
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

async function viewScanDetails(scanId) {
    try {
        const response = await fetch(`/api/scan-details/${scanId}/`);
        const data = await response.json();
        
        if (data.success) {
            showScanDetailsModal(data.scan);
        } else {
            console.error('Failed to fetch scan details:', data.error);
            alert('Tahlil ma\'lumotlarini olishda xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Error fetching scan details:', error);
        alert('Tarmoq xatosi yuz berdi');
    }
}

function showScanDetailsModal(scanData) {
    const modal = document.getElementById('scanDetailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    // Modal title ga domain iconini qo'shish
    modalTitle.innerHTML = `
        <div class="modal-title-with-icon">
            <div class="modal-domain-icon">
                <img src="https://www.google.com/s2/favicons?domain=${scanData.domain_name}&sz=32" 
                     alt="${scanData.domain_name} icon" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3VjIwQzIgMjAuNTUyMyAyLjQ0NzcyIDIxIDMgMjFIMjFDMjEuNTUyMyAyMSAyMiAyMC41NTIzIDIyIDIwVjdMMTIgMloiIHN0cm9rZT0iIzAwZmYwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTkgMjFWMTRMMTUgMTBWMjEiIHN0cm9rZT0iIzAwZmYwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'"
                     class="modal-favicon">
            </div>
            <div class="modal-title-text">
                <span class="domain-name">${scanData.domain_name}</span>
                <span class="modal-subtitle">Batafsil natijalar</span>
            </div>
        </div>
    `;
    
    let modalContent = `
        <div class="detailed-result">
            <h4>Asosiy ma'lumotlar</h4>
            <p><strong>Domain:</strong> ${scanData.domain_name}</p>
            <p><strong>IP manzil:</strong> ${scanData.ip_address || 'N/A'}</p>
            <p><strong>Holat:</strong> ${scanData.status}</p>
            <p><strong>Sana:</strong> ${new Date(scanData.scan_date).toLocaleString('uz-UZ')}</p>
            <p><strong>Davomiyligi:</strong> ${scanData.duration}</p>
            
            <h4>DNS ma'lumotlari</h4>
            <ul>
                <li><strong>A yozuvlari:</strong> ${(scanData.dns_records?.a_records || []).join(', ') || 'N/A'}</li>
                <li><strong>MX yozuvlari:</strong> ${(scanData.dns_records?.mx_records || []).join(', ') || 'N/A'}</li>
                <li><strong>Nameserverlar:</strong> ${(scanData.dns_records?.nameservers || []).join(', ') || 'N/A'}</li>
            </ul>
            
            <h4>SSL ma'lumotlari</h4>
            <p><strong>SSL yoqilgan:</strong> ${scanData.ssl_info?.ssl_enabled ? 'Ha' : 'Yo\'q'}</p>
            <p><strong>SSL versiyasi:</strong> ${scanData.ssl_info?.ssl_version || 'N/A'}</p>
            <p><strong>Sertifikat to\'g\'ri:</strong> ${scanData.ssl_info?.certificate_valid ? 'Ha' : 'Yo\'q'}</p>
            
            <h4>Xavfsizlik sarlavhalari</h4>
            <ul>
                <li><strong>X-Frame-Options:</strong> ${scanData.security_headers?.x_frame_options || 'N/A'}</li>
                <li><strong>X-Content-Type-Options:</strong> ${scanData.security_headers?.x_content_type_options || 'N/A'}</li>
                <li><strong>X-XSS-Protection:</strong> ${scanData.security_headers?.x_xss_protection || 'N/A'}</li>
                <li><strong>Strict-Transport-Security:</strong> ${scanData.security_headers?.strict_transport_security || 'N/A'}</li>
                <li><strong>Content-Security-Policy:</strong> ${scanData.security_headers?.content_security_policy || 'N/A'}</li>
            </ul>
        </div>
    `;
    
    // Xatolik xabari bo'lsa ko'rsatish
    if (scanData.error_message) {
        modalContent += `
            <h4>Xatolik ma'lumotlari</h4>
            <p class="error-message">${scanData.error_message}</p>
        `;
    }
    
    modalBody.innerHTML = modalContent;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('scanDetailsModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('scanDetailsModal');
    if (e.target === modal) {
        closeModal();
    }
}); 
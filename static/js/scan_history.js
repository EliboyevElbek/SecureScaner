// Scan History Page JavaScript

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
    
    modalTitle.textContent = `${scanData.domain_name} - Batafsil natijalar`;
    
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
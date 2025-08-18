// Scan Results Page JavaScript

function viewDetailedResult(domain, resultData) {
    const modal = document.getElementById('scanDetailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${domain} - Batafsil natijalar`;
    
    let modalContent = `
        <div class="detailed-result">
            <h4>Asosiy ma'lumotlar</h4>
            <p><strong>Domain:</strong> ${domain}</p>
            <p><strong>IP manzil:</strong> ${resultData.ip_address || 'N/A'}</p>
            <p><strong>Holat:</strong> ${resultData.status}</p>
            
            <h4>DNS ma'lumotlari</h4>
            <ul>
                <li><strong>A yozuvlari:</strong> ${(resultData.dns_records?.a_records || []).join(', ') || 'N/A'}</li>
                <li><strong>MX yozuvlari:</strong> ${(resultData.dns_records?.mx_records || []).join(', ') || 'N/A'}</li>
                <li><strong>Nameserverlar:</strong> ${(resultData.dns_records?.nameservers || []).join(', ') || 'N/A'}</li>
            </ul>
            
            <h4>SSL ma'lumotlari</h4>
            <p><strong>SSL yoqilgan:</strong> ${resultData.ssl_info?.ssl_enabled ? 'Ha' : 'Yo\'q'}</p>
            <p><strong>SSL versiyasi:</strong> ${resultData.ssl_info?.ssl_version || 'N/A'}</p>
            <p><strong>Sertifikat to\'g\'ri:</strong> ${resultData.ssl_info?.certificate_valid ? 'Ha' : 'Yo\'q'}</p>
            
            <h4>Xavfsizlik sarlavhalari</h4>
            <ul>
                <li><strong>X-Frame-Options:</strong> ${resultData.security_headers?.x_frame_options || 'N/A'}</li>
                <li><strong>X-Content-Type-Options:</strong> ${resultData.security_headers?.x_content_type_options || 'N/A'}</li>
                <li><strong>X-XSS-Protection:</strong> ${resultData.security_headers?.x_xss_protection || 'N/A'}</li>
                <li><strong>Strict-Transport-Security:</strong> ${resultData.security_headers?.strict_transport_security || 'N/A'}</li>
                <li><strong>Content-Security-Policy:</strong> ${resultData.security_headers?.content_security_policy || 'N/A'}</li>
            </ul>
        </div>
    `;
    
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
// Scan History Page JavaScript

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
    console.log('Scan History page loaded');
    
    // Sahifa yuklanganda hech narsa qilmaymiz
    // Django view'da allaqachon to'g'ri logika yozilgan
    // Yangi tahlillar va eski tahlillar to'g'ri ajratilgan
});

// Bu funksiyalar endi kerak emas, chunki Django view'da allaqachon to'g'ri logika yozilgan
// Yangi tahlillar va eski tahlillar soni Django template'da ko'rsatiladi

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
            <p><strong>Davomiyligi:</strong> ${scanData.get_duration || 'N/A'}</p>
            
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
            
            <h4>Tool tahlil natijalari</h4>
            ${renderToolResults(scanData.tool_results)}
            
            <h4>Raw Tool Output (Batafsil natijalar)</h4>
            ${renderRawToolOutput(scanData.raw_tool_output)}
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

function renderToolResults(toolResults) {
    if (!toolResults || Object.keys(toolResults).length === 0) {
        return '<p>Tool tahlil natijalari mavjud emas</p>';
    }
    
    let html = '<div class="tool-results">';
    
    for (const [toolName, result] of Object.entries(toolResults)) {
        if (toolName === 'error') {
            html += `<div class="tool-result error"><strong>Xatolik:</strong> ${result}</div>`;
            continue;
        }
        
        html += `<div class="tool-result ${toolName}">`;
        html += `<h5>${toolName.toUpperCase()}</h5>`;
        
        if (result && typeof result === 'object') {
            if (result.status === 'error') {
                html += `<p class="error">Xatolik: ${result.error || 'Noma\'lum xatolik'}</p>`;
            } else if (result.status === 'completed') {
                html += `<p class="success">✅ Tahlil tugallandi</p>`;
                if (result.output) {
                    html += `<pre class="tool-output">${result.output}</pre>`;
                }
            } else {
                html += `<p>Holat: ${result.status || 'Noma\'lum'}</p>`;
                if (result.output) {
                    html += `<pre class="tool-output">${result.output}</pre>`;
                }
            }
        } else {
            html += `<p>Natija: ${result}</p>`;
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function renderRawToolOutput(rawOutput) {
    if (!rawOutput || Object.keys(rawOutput).length === 0) {
        return '<p>Raw tool output mavjud emas</p>';
    }
    
    let html = '<div class="raw-tool-output">';
    
    for (const [toolName, output] of Object.entries(rawOutput)) {
        const toolClass = `terminal-${toolName.toLowerCase()}`;
        html += `<div class="terminal-container ${toolClass}">`;
        html += `<div class="terminal-header">${toolName.toUpperCase()} TERMINAL</div>`;
        html += `<div class="terminal-output">`;
        
        if (typeof output === 'string') {
            // Agar output string bo'lsa (nmap natijasi kabi)
            html += formatTerminalOutput(output);
        } else if (typeof output === 'object') {
            // Agar output object bo'lsa
            if (output.command) {
                html += `<div class="command-line">${output.command}</div>`;
            }
            if (output.output) {
                html += formatTerminalOutput(output.output);
            }
            if (output.execution_time) {
                html += `<div class="terminal-status">⏱️ Ishlash vaqti: ${output.execution_time}</div>`;
            }
            if (output.status) {
                const statusClass = output.status === 'completed' ? 'completed' : 
                                  output.status === 'error' ? 'error' : 'starting';
                html += `<div class="terminal-status ${statusClass}">📊 Holat: ${output.status}</div>`;
            }
        }
        
        html += '</div>'; // terminal-output
        html += '</div>'; // terminal-container
    }
    
    html += '</div>';
    return html;
}

function formatTerminalOutput(output) {
    if (!output) return '';
    
    // Output ni qatorlarga ajratish
    const lines = output.split('\n');
    let formattedOutput = '';
    
    for (const line of lines) {
        if (line.trim()) {
            // Maxsus formatlarni aniqlash
            if (line.includes('[y/N]') || line.includes('[Y/n]') || line.includes('Continue?')) {
                formattedOutput += `<div class="interactive-prompt">${line}</div>`;
            } else if (line.startsWith('PORT') || line.startsWith('Starting') || line.startsWith('Nmap scan')) {
                formattedOutput += `<div style="color: #ffff00; font-weight: bold;">${line}</div>`;
            } else if (line.includes('open') || line.includes('closed')) {
                formattedOutput += `<div style="color: #00ff00;">${line}</div>`;
            } else if (line.includes('error') || line.includes('Error') || line.includes('failed')) {
                formattedOutput += `<div style="color: #ff0000;">${line}</div>`;
            } else if (line.includes('✅') || line.includes('success')) {
                formattedOutput += `<div style="color: #00ff00; font-weight: bold;">${line}</div>`;
            } else if (line.includes('🚀')) {
                formattedOutput += `<div style="color: #00bfff; font-weight: bold;">${line}</div>`;
            } else {
                formattedOutput += `<div>${line}</div>`;
            }
        }
    }
    
    return formattedOutput;
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
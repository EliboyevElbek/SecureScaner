// Home Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    initDashboard();
});

// Chart.js kutubxonasini yuklash
function loadChartJS() {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = initChart;
        document.head.appendChild(script);
    } else {
        initChart();
    }
}

// Diagrammali grafik yaratish
function initChart() {
    const ctx = document.getElementById('scanChart');
    if (!ctx) return;

    // Django template'dan kelgan ma'lumotlarni olish
    const chartLabels = window.chartLabels || ['01.09', '02.09', '03.09', '04.09', '05.09', '06.09', '07.09'];
    const chartData = window.chartData || [5, 8, 12, 15, 18, 22, 25];

    const chartConfig = {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Kunlik domainlar soni',
                data: chartData,
                backgroundColor: 'rgba(0, 255, 136, 0.8)',
                borderColor: '#00ff88',
                borderWidth: 2,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        font: {
                            size: 10
                        },
                        stepSize: 1,
                        beginAtZero: true
                    }
                }
            }
        }
    };

    new Chart(ctx, chartConfig);
}

// Dashboard ni ishga tushirish
function initDashboard() {
    loadChartJS();
    initTableCheckboxes();
    initModals();
    initTooltips();
}

// Table Checkbox Functionality
function initTableCheckboxes() {
    const selectAllCheckbox = document.getElementById('select-all');
    const domainCheckboxes = document.querySelectorAll('.domain-checkbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            domainCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    domainCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllState();
        });
    });
}

function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const domainCheckboxes = document.querySelectorAll('.domain-checkbox');
    const checkedCount = document.querySelectorAll('.domain-checkbox:checked').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCount === domainCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < domainCheckboxes.length;
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const domainCheckboxes = document.querySelectorAll('.domain-checkbox');
    
    domainCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Modal Functions
function initModals() {
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openScanModal() {
    const modal = document.getElementById('scanModal');
    modal.style.display = 'block';
    document.getElementById('domainInput').focus();
}

function closeScanModal() {
    const modal = document.getElementById('scanModal');
    modal.style.display = 'none';
    document.getElementById('domainInput').value = '';
}

function openDetailsModal() {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'block';
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'none';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Scan Functions
function startScan() {
    const domainInput = document.getElementById('domainInput');
    const domain = domainInput.value.trim();
    
    if (!domain) {
        showNotification('Domain nomini kiriting', 'error');
        return;
    }
    
    // Get selected tools
    const selectedTools = [];
    document.querySelectorAll('.tool-checkbox input:checked').forEach(checkbox => {
        selectedTools.push(checkbox.value);
    });
    
    if (selectedTools.length === 0) {
        showNotification('Kamida bitta tool tanlang', 'error');
        return;
    }
    
    // Show loading state
    const startButton = document.querySelector('#scanModal .btn-primary');
    const originalText = startButton.innerHTML;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tahlil qilinmoqda...';
    startButton.disabled = true;
    
    // Simulate scan process (replace with actual API call)
            setTimeout(() => {
        showNotification(`${domain} uchun tahlil boshlandi`, 'success');
        closeScanModal();
        
        // Reset button
        startButton.innerHTML = originalText;
        startButton.disabled = false;
        
        // Refresh table
        refreshTable();
    }, 2000);
}

// Table Functions
function refreshTable() {
    const tableBody = document.getElementById('domains-table-body');
    if (tableBody) {
        tableBody.classList.add('loading');
        
        // Simulate refresh (replace with actual API call)
        setTimeout(() => {
            tableBody.classList.remove('loading');
            showNotification('Jadval yangilandi', 'success');
        }, 1000);
    }
}

function exportData() {
    const selectedDomains = document.querySelectorAll('.domain-checkbox:checked');
    
    if (selectedDomains.length === 0) {
        showNotification('Eksport qilish uchun domain tanlang', 'warning');
        return;
    }
    
    const domains = Array.from(selectedDomains).map(checkbox => checkbox.value);
    
    // Create CSV data
    let csvContent = 'Domain,Status,SQLMap,Nmap,XSStrike,Gobuster\n';
    domains.forEach(domain => {
        const row = document.querySelector(`tr[data-domain="${domain}"]`);
        if (row) {
            const status = row.querySelector('.status-badge')?.textContent || 'N/A';
            const sqlmap = row.querySelector('td:nth-child(3) .tool-status')?.textContent.includes('✓') ? 'Yes' : 'No';
            const nmap = row.querySelector('td:nth-child(4) .tool-status')?.textContent.includes('✓') ? 'Yes' : 'No';
            const xsstrike = row.querySelector('td:nth-child(5) .tool-status')?.textContent.includes('✓') ? 'Yes' : 'No';
            const gobuster = row.querySelector('td:nth-child(6) .tool-status')?.textContent.includes('✓') ? 'Yes' : 'No';
            
            csvContent += `${domain},${status},${sqlmap},${nmap},${xsstrike},${gobuster}\n`;
        }
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `domain_scan_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`${domains.length} ta domain eksport qilindi`, 'success');
}

// Domain Action Functions
function viewDetails(domainName) {
    const modal = document.getElementById('detailsModal');
    const title = document.getElementById('detailsTitle');
    const content = document.getElementById('detailsContent');
    
    title.textContent = `${domainName} - Tafsilotlar`;
    
    // Get domain data from table row
    const row = document.querySelector(`tr[data-domain="${domainName}"]`);
    if (row) {
        const status = row.querySelector('.status-badge')?.textContent || 'N/A';
        const sqlmap = row.querySelector('td:nth-child(3) .tool-status')?.textContent || 'N/A';
        const nmap = row.querySelector('td:nth-child(4) .tool-status')?.textContent || 'N/A';
        const xsstrike = row.querySelector('td:nth-child(5) .tool-status')?.textContent || 'N/A';
        const gobuster = row.querySelector('td:nth-child(6) .tool-status')?.textContent || 'N/A';
        
        content.innerHTML = `
            <div class="domain-details-grid">
                <div class="detail-section">
                    <h4>Asosiy Ma'lumotlar</h4>
                    <div class="detail-item">
                        <strong>Domain:</strong> ${domainName}
                    </div>
                    <div class="detail-item">
                        <strong>Holat:</strong> <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Tool Natijalari</h4>
                    <div class="detail-item">
                        <strong>SQLMap:</strong> ${sqlmap}
                    </div>
                    <div class="detail-item">
                        <strong>Nmap:</strong> ${nmap}
                    </div>
                    <div class="detail-item">
                        <strong>XSStrike:</strong> ${xsstrike}
                    </div>
                    <div class="detail-item">
                        <strong>Gobuster:</strong> ${gobuster}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Amallar</h4>
                    <div class="detail-actions">
                        <button class="btn btn-warning" onclick="editDomain('${domainName}')">
                            <i class="fas fa-edit"></i> Tahrirlash
                        </button>
                        <button class="btn btn-danger" onclick="deleteDomain('${domainName}')">
                            <i class="fas fa-trash"></i> O'chirish
                        </button>
                        <button class="btn btn-info" onclick="rescanDomain('${domainName}')">
                            <i class="fas fa-redo"></i> Qayta Tahlil
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    openDetailsModal();
}

function editDomain(domainName) {
    showNotification(`${domainName} tahrirlash rejimi ochildi`, 'info');
    // Implement edit functionality
}

function deleteDomain(domainName) {
    if (confirm(`${domainName} ni o'chirishni xohlaysizmi?`)) {
        // Implement delete functionality
        showNotification(`${domainName} o'chirildi`, 'success');
        // Remove row from table
        const row = document.querySelector(`tr[data-domain="${domainName}"]`);
        if (row) {
            row.remove();
        }
    }
}

function rescanDomain(domainName) {
    showNotification(`${domainName} uchun qayta tahlil boshlandi`, 'info');
    // Implement rescan functionality
}

// Tooltip Functionality
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = event.target.getAttribute('data-tooltip');
    
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
        border: 1px solid #00ff00;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    event.target._tooltip = tooltip;
}

function hideTooltip(event) {
    if (event.target._tooltip) {
        event.target._tooltip.remove();
        event.target._tooltip = null;
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Make functions globally available
window.openScanModal = openScanModal;
window.closeScanModal = closeScanModal;
window.startScan = startScan;
window.refreshTable = refreshTable;
window.exportData = exportData;
window.viewDetails = viewDetails;
window.editDomain = editDomain;
window.deleteDomain = deleteDomain;
window.rescanDomain = rescanDomain;
window.toggleSelectAll = toggleSelectAll; 
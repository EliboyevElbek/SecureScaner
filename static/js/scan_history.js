// Scan History Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Scan History Dashboard loaded');
    initDashboard();
});

function initDashboard() {
    // Initialize dashboard functionality
    initTableCheckboxes();
    initModals();
    initFilters();
}

// Table Checkbox Functionality
function initTableCheckboxes() {
    const selectAllCheckbox = document.getElementById('select-all');
    const scanCheckboxes = document.querySelectorAll('.scan-checkbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            scanCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    scanCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllState();
        });
    });
}

function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const scanCheckboxes = document.querySelectorAll('.scan-checkbox');
    const checkedCount = document.querySelectorAll('.scan-checkbox:checked').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCount === scanCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < scanCheckboxes.length;
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const scanCheckboxes = document.querySelectorAll('.scan-checkbox');
    
    scanCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Filter Functionality
function initFilters() {
    // Status filter change event
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTable);
    }
    
    // Time filter change event
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const statusFilter = document.getElementById('statusFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    const rows = document.querySelectorAll('.scan-row');
    
    rows.forEach(row => {
        let showRow = true;
        
        // Status filter
        if (statusFilter && row.dataset.status !== statusFilter) {
            showRow = false;
        }
        
        // Time filter
        if (timeFilter && showRow) {
            const scanDate = new Date(row.dataset.date);
            const today = new Date();
            const diffTime = Math.abs(today - scanDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            switch (timeFilter) {
                case 'today':
                    if (diffDays > 1) showRow = false;
                    break;
                case 'week':
                    if (diffDays > 7) showRow = false;
                    break;
                case 'month':
                    if (diffDays > 30) showRow = false;
                    break;
                case 'old':
                    if (diffDays <= 30) showRow = false;
                    break;
            }
        }
        
        row.style.display = showRow ? 'table-row' : 'none';
    });
    
    updateVisibleCount();
}

function updateVisibleCount() {
    const visibleRows = document.querySelectorAll('.scan-row[style="display: table-row;"]').length;
    const totalRows = document.querySelectorAll('.scan-row').length;
    
    // Update filter info
    const filterInfo = document.querySelector('.filter-info');
    if (filterInfo) {
        filterInfo.textContent = `${visibleRows} ta natija ko'rsatilmoqda (jami: ${totalRows})`;
    }
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
    const modal = document.getElementById('newScanModal');
    modal.style.display = 'block';
    document.getElementById('domainInput').focus();
}

function closeNewScanModal() {
    const modal = document.getElementById('newScanModal');
    modal.style.display = 'none';
    document.getElementById('domainInput').value = '';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Scan Functions
function startNewScan() {
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
        showNotification('Kamida bitta tool tanlang', 'warning');
        return;
    }
    
    // Show loading state
    const startButton = document.querySelector('#newScanModal .btn-primary');
    const originalText = startButton.innerHTML;
    startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tahlil qilinmoqda...';
    startButton.disabled = true;
    
    // Simulate scan process (replace with actual API call)
    setTimeout(() => {
        showNotification(`${domain} uchun tahlil boshlandi`, 'success');
        closeNewScanModal();
        
        // Reset button
        startButton.innerHTML = originalText;
        startButton.disabled = false;
        
        // Refresh table
        refreshTable();
    }, 2000);
}

// Table Functions
function refreshTable() {
    const tableBody = document.getElementById('scans-table-body');
    if (tableBody) {
        tableBody.classList.add('loading');
        
        // Simulate refresh (replace with actual API call)
        setTimeout(() => {
            tableBody.classList.remove('loading');
            showNotification('Jadval yangilandi', 'success');
        }, 1000);
    }
}

function exportHistory() {
    const selectedScans = document.querySelectorAll('.scan-checkbox:checked');
    
    if (selectedScans.length === 0) {
        showNotification('Eksport qilish uchun tahlil tanlang', 'warning');
        return;
    }
    
    const scans = Array.from(selectedScans).map(checkbox => checkbox.value);
    
    // Create CSV data
    let csvContent = 'Domain,IP Address,Status,Date,Duration,Tools\n';
    scans.forEach(scanId => {
        const row = document.querySelector(`tr[data-scan="${scanId}"]`);
        if (row) {
            const domain = row.querySelector('.domain-text')?.textContent || 'N/A';
            const ip = row.querySelector('.ip-text')?.textContent || 'N/A';
            const status = row.querySelector('.status-badge')?.textContent || 'N/A';
            const date = row.querySelector('.date-text')?.textContent || 'N/A';
            const duration = row.querySelector('.duration-text')?.textContent || 'N/A';
            const tools = Array.from(row.querySelectorAll('.tool-status')).map(tool => tool.textContent).join('; ') || 'N/A';
            
            csvContent += `${domain},${ip},${status},${date},${duration},${tools}\n`;
        }
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`${scans.length} ta tahlil eksport qilindi`, 'success');
}

// Scan Action Functions
function viewScanDetails(scanId) {
    try {
        // For now, show a simple modal (replace with actual API call)
        const modal = document.getElementById('scanDetailsModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = `Tahlil ID: ${scanId}`;
        modalBody.innerHTML = `
            <div class="scan-details-content">
                <p>Bu yerda tahlil tafsilotlari ko'rsatiladi.</p>
                <p>API integratsiyasi qo'shilgandan keyin haqiqiy ma'lumotlar ko'rsatiladi.</p>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing scan details:', error);
        showNotification('Tahlil tafsilotlarini ko\'rishda xatolik', 'error');
    }
}

function rescanDomain(domainName) {
    if (confirm(`${domainName} uchun qayta tahlilni boshlashni xohlaysizmi?`)) {
        showNotification(`${domainName} uchun qayta tahlil boshlandi`, 'info');
        // Implement rescan functionality
    }
}

function deleteScan(scanId) {
    if (confirm('Bu tahlilni o\'chirishni xohlaysizmi?')) {
        // Implement delete functionality
        showNotification('Tahlil o\'chirildi', 'success');
        
        // Remove row from table
        const row = document.querySelector(`tr[data-scan="${scanId}"]`);
        if (row) {
            row.remove();
        }
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
window.closeNewScanModal = closeNewScanModal;
window.startNewScan = startNewScan;
window.refreshTable = refreshTable;
window.exportHistory = exportHistory;
window.viewScanDetails = viewScanDetails;
window.rescanDomain = rescanDomain;
window.deleteScan = deleteScan;
window.toggleSelectAll = toggleSelectAll;
window.filterTable = filterTable;


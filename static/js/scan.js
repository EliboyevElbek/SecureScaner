// Scan Page JavaScript - Professional Design with Real-time Progress

let domains = [];
let selectedToolParams = {}; // Tanlangan tool parametrlarini saqlash uchun
let scanInProgress = false;
let progressIntervals = {}; // Har bir domain uchun progress interval

// localStorage funksiyalari - tanlangan parametrlarni saqlash uchun
function saveToolParamsToStorage(domain, toolType, params) {
    const key = `tool_params_${domain}_${toolType}`;
    localStorage.setItem(key, JSON.stringify(params));
    console.log(`Parametrlar saqlandi: ${key} = ${JSON.stringify(params)}`);
}

function saveToolInputsToStorage(domain, toolType, inputs) {
    const key = `tool_inputs_${domain}_${toolType}`;
    localStorage.setItem(key, JSON.stringify(inputs));
    console.log(`Input'lar saqlandi: ${key} = ${JSON.stringify(inputs)}`);
}

function getToolParamsFromStorage(domain, toolType) {
    const key = `tool_params_${domain}_${toolType}`;
    const saved = localStorage.getItem(key);
    const params = saved ? JSON.parse(saved) : [];
    console.log(`Parametrlar yuklandi: ${key} = ${JSON.stringify(params)}`);
    return params;
}

function getToolInputsFromStorage(domain, toolType) {
    const key = `tool_inputs_${domain}_${toolType}`;
    const saved = localStorage.getItem(key);
    const inputs = saved ? JSON.parse(saved) : {};
    console.log(`Input'lar yuklandi: ${key} = ${JSON.stringify(inputs)}`);
    return inputs;
}

function loadSavedToolParams(domain) {
    const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
    tools.forEach(toolType => {
        const savedParams = getToolParamsFromStorage(domain, toolType);
        const savedInputs = getToolInputsFromStorage(domain, toolType);
        
        if (savedParams.length > 0) {
            selectedToolParams[toolType] = savedParams;
            console.log(`${domain} uchun ${toolType} parametrlari yuklandi:`, savedParams);
        }
        
        if (Object.keys(savedInputs).length > 0) {
            console.log(`${domain} uchun ${toolType} input'lari yuklandi:`, savedInputs);
        }
    });
}

function loadToolsData() {
    // Backend dan tool parametrlarini yuklash
    fetch('/scaner/get-tools/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.tools_data) {
            window.toolsData = data.tools_data;
            console.log('Tools data yuklandi:', window.toolsData);
        } else {
            console.log('Tools data yuklanmadi');
        }
    })
    .catch(error => {
        console.error('Tools data yuklashda xatolik:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Scan page loaded');
    
    // Add professional animations
    addProfessionalEffects();
    
    // Check for edited domains when page loads
    checkForEditedDomains();
    
    // Load tools data from backend
    loadToolsData();
});

function prepareDomains() {
    const domainsInput = document.getElementById('domainsInput');
    const domainsText = domainsInput.value.trim();
    
    if (!domainsText) {
        showNotification('Iltimos, domain nomlarini kiriting', 'warning');
        return;
    }
    
    // Parse domains from textarea
    const newDomains = domainsText.split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);
    
    if (newDomains.length === 0) {
        showNotification('Iltimos, kamida bitta domain kiriting', 'warning');
        return;
    }
    
    // Duplicate domainlarni olib tashlash
    const uniqueDomains = [...new Set(newDomains)];
    
    if (uniqueDomains.length !== newDomains.length) {
        showNotification(`${newDomains.length - uniqueDomains.length} ta duplicate domain olib tashlandi`, 'info');
    }
    
    domains = uniqueDomains;
    displayDomains();
    
    // Show domains section
    document.getElementById('domainsSection').style.display = 'block';
    
    showNotification(`${domains.length} ta domain tayyorlandi`, 'success');
}

function displayDomains() {
    const domainsList = document.getElementById('domainsList');
    domainsList.innerHTML = '';
    
    domains.forEach((domain, index) => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';
        domainItem.innerHTML = `
            <div class="domain-info">
                <span class="domain-name">${domain}</span>
                <span class="domain-number">#${index + 1}</span>
            </div>
            <div class="domain-actions">
                <button class="btn btn-sm btn-info" onclick="showToolConfig('${domain}')">
                    <i class="fas fa-cog"></i> Tool sozlamalari
                </button>
                <button class="btn btn-sm btn-danger" onclick="removeDomain(${index})">
                    <i class="fas fa-trash"></i> O'chirish
                </button>
            </div>
        `;
        domainsList.appendChild(domainItem);
    });
}

function startScan() {
    if (domains.length === 0) {
        showNotification('Iltimos, domainlarni tayyorlang', 'warning');
        return;
    }
    
    if (scanInProgress) {
        showNotification('Tahlil allaqachon jarayonda', 'warning');
        return;
    }
    
    scanInProgress = true;
    
    // Progress section ni ko'rsatish
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Progress container ni tozalash
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.innerHTML = '';
    
    // Har bir domain uchun progress item yaratish
    domains.forEach(domain => {
        const progressItem = createProgressItem(domain);
        progressContainer.appendChild(progressItem);
        
        // Progress interval ni boshlash
        startProgressTracking(domain);
    });
    
    // Backend ga scan so'rovini yuborish
    startBackendScan();
}

function createProgressItem(domain) {
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item card';
    progressItem.id = `progress-${domain.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    progressItem.innerHTML = `
        <div class="progress-header">
            <h3>${domain}</h3>
            <span class="status-badge status-scanning">⏳ Jarayonda</span>
        </div>
        <div class="progress-content">
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill-${domain.replace(/[^a-zA-Z0-9]/g, '_')}" style="width: 0%"></div>
            </div>
            <div class="progress-info">
                <span class="current-tool" id="current-tool-${domain.replace(/[^a-zA-Z0-9]/g, '_')}">DNS tekshirish...</span>
                <span class="progress-percentage" id="progress-percentage-${domain.replace(/[^a-zA-Z0-9]/g, '_')}">0%</span>
            </div>
            <div class="progress-actions">
                <button class="btn btn-sm btn-info" onclick="showProgressDetails('${domain}')">
                    <i class="fas fa-eye"></i> Jarayon
                </button>
            </div>
        </div>
        <div class="tool-progress" id="tool-progress-${domain.replace(/[^a-zA-Z0-9]/g, '_')}" style="display: none;">
            <!-- Tool progress details will be populated here -->
        </div>
    `;
    
    return progressItem;
}

function startProgressTracking(domain) {
    const domainId = domain.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Progress interval ni boshlash
    progressIntervals[domain] = setInterval(() => {
        updateProgress(domain);
    }, 2000); // Har 2 soniyada yangilash
}

function updateProgress(domain) {
    fetch('/scaner/scan-progress/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ domain: domain })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateProgressUI(domain, data);
        }
    })
    .catch(error => {
        console.error('Progress yangilashda xatolik:', error);
    });
}

function updateProgressUI(domain, data) {
    const domainId = domain.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Progress bar yangilash
    const progressFill = document.getElementById(`progress-fill-${domainId}`);
    const progressPercentage = document.getElementById(`progress-percentage-${domainId}`);
    const currentTool = document.getElementById(`current-tool-${domainId}`);
    const statusBadge = document.querySelector(`#progress-${domainId} .status-badge`);
    
    if (progressFill && progressPercentage && currentTool && statusBadge) {
        progressFill.style.width = `${data.scan_progress}%`;
        progressPercentage.textContent = `${data.scan_progress}%`;
        currentTool.textContent = data.current_tool || 'Tahlil qilinmoqda...';
        
        // Status yangilash
        if (data.scan_status === 'completed') {
            statusBadge.className = 'status-badge status-completed';
            statusBadge.innerHTML = '✅ Tugallandi';
            statusBadge.style.display = 'block';
        } else if (data.scan_status === 'failed') {
            statusBadge.className = 'status-badge status-failed';
            statusBadge.innerHTML = '❌ Xatolik';
            statusBadge.style.display = 'block';
        }
        
        // Tool progress yangilash
        updateToolProgress(domain, data.tool_statuses);
    }
}

function updateToolProgress(domain, toolStatuses) {
    const domainId = domain.replace(/[^a-zA-Z0-9]/g, '_');
    const toolProgress = document.getElementById(`tool-progress-${domainId}`);
    
    if (toolProgress && toolStatuses) {
        let toolProgressHTML = '<h4>Tool natijalari:</h4><div class="tool-list">';
        
        Object.entries(toolStatuses).forEach(([toolName, status]) => {
            const statusIcon = status.status === 'completed' ? '✅' : 
                             status.status === 'running' ? '⏳' : 
                             status.status === 'failed' ? '❌' : '⏸️';
            
            toolProgressHTML += `
                <div class="tool-item">
                    <span class="tool-name">${toolName}</span>
                    <span class="tool-status">${statusIcon} ${status.status}</span>
                    <span class="tool-duration">${status.progress}</span>
                </div>
            `;
        });
        
        toolProgressHTML += '</div>';
        toolProgress.innerHTML = toolProgressHTML;
        toolProgress.style.display = 'block';
    }
}

function showProgressDetails(domain) {
    // Tool progress ni ko'rsatish/yashirish
    const domainId = domain.replace(/[^a-zA-Z0-9]/g, '_');
    const toolProgress = document.getElementById(`tool-progress-${domainId}`);
    
    if (toolProgress) {
        if (toolProgress.style.display === 'none') {
            toolProgress.style.display = 'block';
        } else {
            toolProgress.style.display = 'none';
        }
    }
}

function startBackendScan() {
    fetch('/scaner/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            action: 'start_scan',
            domains: domains
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Tahlil muvaffaqiyatli boshlandi', 'success');
            
            // Natijalarni kutish
            setTimeout(() => {
                checkScanResults();
            }, 5000);
        } else {
            showNotification(`Xatolik: ${data.error}`, 'error');
            scanInProgress = false;
        }
    })
    .catch(error => {
        console.error('Scan boshlashda xatolik:', error);
        showNotification('Tahlil boshlashda xatolik yuz berdi', 'error');
        scanInProgress = false;
    });
}

function checkScanResults() {
    // Barcha domainlar tugagani tekshirish
    let allCompleted = true;
    
    domains.forEach(domain => {
        fetch('/scaner/scan-progress/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ domain: domain })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.scan_status === 'completed') {
                // Progress interval ni to'xtatish
                if (progressIntervals[domain]) {
                    clearInterval(progressIntervals[domain]);
                    delete progressIntervals[domain];
                }
            } else {
                allCompleted = false;
            }
            
            // Agar barchasi tugaganda natijalarni ko'rsatish
            if (allCompleted && Object.keys(progressIntervals).length === 0) {
                showFinalResults();
            }
        })
        .catch(error => {
            console.error('Natija tekshirishda xatolik:', error);
        });
    });
}

function showFinalResults() {
    scanInProgress = false;
    
    // Progress section ni yashirish
    document.getElementById('progressSection').style.display = 'none';
    
    // Results section ni ko'rsatish
    document.getElementById('resultsSection').style.display = 'block';
    
    // Natijalarni yuklash va ko'rsatish
    loadScanResults();
}

function loadScanResults() {
    // Backend dan natijalarni olish
    fetch('/scaner/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.text())
    .then(html => {
        // HTML dan natijalarni parse qilish
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Natijalarni ko'rsatish
        displayResults(doc);
    })
    .catch(error => {
        console.error('Natijalarni yuklashda xatolik:', error);
    });
}

function displayResults(doc) {
    // Summary yaratish
    const resultsSummary = document.getElementById('resultsSummary');
    resultsSummary.innerHTML = `
        <p><strong>Jami tahlil qilingan:</strong> ${domains.length} ta</p>
        <p><strong>Tahlil vaqti:</strong> ${new Date().toLocaleString('uz-UZ')}</p>
    `;
    
    // Har bir domain uchun natija ko'rsatish
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    domains.forEach(domain => {
        // Backend dan domain natijasini olish
        fetch('/scaner/scan-progress/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ domain: domain })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const resultItem = createResultItem(domain, data);
                resultsList.appendChild(resultItem);
            }
        })
        .catch(error => {
            console.error('Domain natijasini olishda xatolik:', error);
        });
    });
}

function createResultItem(domain, data) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item card';
    
    let toolResultsHTML = '';
    if (data.tool_statuses) {
        toolResultsHTML = '<div class="tool-results"><h4>Tool natijalari:</h4>';
        Object.entries(data.tool_statuses).forEach(([toolName, status]) => {
            toolResultsHTML += `
                <div class="tool-result">
                    <strong>${toolName}:</strong> 
                    <span class="tool-status-${status.status}">${status.status}</span>
                    ${status.output ? `<div class="tool-output">${status.output}</div>` : ''}
                </div>
            `;
        });
        toolResultsHTML += '</div>';
    }
    
    resultItem.innerHTML = `
        <div class="result-header">
            <h3>${domain}</h3>
            <span class="status-badge status-${data.scan_status}">
                ${data.scan_status === 'completed' ? '✅ Tugallandi' : 
                  data.scan_status === 'failed' ? '❌ Xatolik' : '⏳ Jarayonda'}
            </span>
        </div>
        <div class="result-details">
            <div class="detail-row">
                <strong>Joriy tool:</strong> ${data.current_tool || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Progress:</strong> ${data.scan_progress}%
            </div>
            ${toolResultsHTML}
        </div>
    `;
    
    return resultItem;
}

// ... existing code ...

 
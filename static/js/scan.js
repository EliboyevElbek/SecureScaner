// Scan Page JavaScript - Professional Design

let domains = [];
let selectedToolParams = {}; // Tanlangan tool parametrlarini saqlash uchun

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
    
    // Validate domains
    const invalidDomains = newDomains.filter(domain => !isValidDomain(domain));
    if (invalidDomains.length > 0) {
        showNotification('Quyidagi domainlar noto\'g\'ri formatda:\n' + invalidDomains.join('\n'), 'error');
        return;
    }
    
    // Show loading state
    const prepareButton = document.querySelector('.btn-primary');
    const originalText = prepareButton.textContent;
    prepareButton.textContent = '⏳ Saqlanmoqda...';
    prepareButton.disabled = true;
    
    // Send domains to backend for saving
    fetch('/scaner/save-domains/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            domains: newDomains
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add new domains to existing domains array
            domains = [...domains, ...newDomains];
            
            // Clear the input after successful preparation
            domainsInput.value = '';
            
            // Hide input section
            const inputSection = document.querySelector('.input-section');
            inputSection.classList.add('fade-out');
            
            setTimeout(() => {
                inputSection.style.display = 'none';
                inputSection.classList.remove('fade-out');
            }, 400);
            
            // Show domains section with smooth animation
            renderDomains();
            const domainsSection = document.getElementById('domainsSection');
            domainsSection.style.display = 'block';
            domainsSection.classList.add('fade-in');
            
            setTimeout(() => {
                domainsSection.classList.remove('fade-in');
            }, 600);
            
            // Scroll to domains section
            domainsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Show success notification with backend response
            showNotification(data.message, 'success');
            
            // Har bir domain uchun default tool buyruqlarini bazaga saqlash
            newDomains.forEach(domain => {
                saveDefaultToolCommands(domain);
            });
            
            // Yangi domainlar uchun input field'larni tozalash
            clearInputFieldsForNewDomains(newDomains);
            
            // Log detailed results
            if (data.errors && data.errors.length > 0) {
                console.log('Domain saqlash xatolari:', data.errors);
            }
            console.log('Saqlangan domainlar:', data.saved_domains);
            
        } else {
            showNotification('Xatolik: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Domain saqlash xatosi:', error);
        showNotification('Domain saqlash xatosi: ' + error.message, 'error');
    })
    .finally(() => {
        // Reset button state
        prepareButton.textContent = originalText;
        prepareButton.disabled = false;
    });
}

function renderDomains() {
    const domainsList = document.getElementById('domainsList');
    
    if (domains.length === 0) {
        domainsList.innerHTML = '<p class="no-items">Domainlar mavjud emas</p>';
        return;
    }
    
    domainsList.innerHTML = domains.map((domain, index) => `
        <div class="domain-item fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="domain-info">
                <div class="domain-icon">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" 
                         alt="${domain} icon" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3VjIwQzIgMjAuNTUyMyAyLjQ0NzcyIDIxIDMgMjFIMjFDMjEuNTUyMyAyMSAyMiAyMC41NTIzIDIyIDIwVjdMMTIgMloiIHN0cm9rZT0iIzAwZmYwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTkgMjFWMTRMMTUgMTBWMjEiIHN0cm9rZT0iIzAwZmYwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'"
                         class="favicon">
                </div>
                <h3>${domain}</h3>
            </div>
            <div class="domain-actions">
                <button class="btn btn-small btn-secondary" onclick="editDomain(${index})">
                    ✏️ Tahrirlash
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteDomain(${index})">
                    🗑️ O'chirish
                </button>
            </div>
        </div>
    `).join('');
    
    // Yangi domainlar uchun input field'lar tozalanganini ko'rsatish
    const newDomains = domains.filter(domain => {
        const hasInputs = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'].some(toolType => {
            const inputKey = `tool_inputs_${domain}_${toolType}`;
            const savedInputs = localStorage.getItem(inputKey);
            return savedInputs && Object.keys(JSON.parse(savedInputs || '{}')).length > 0;
        });
        return !hasInputs;
    });
    
    if (newDomains.length > 0) {
        console.log(`Yangi domainlar (input field'lar tozalangan): ${newDomains.join(', ')}`);
    }
}

function editDomain(index) {
    const domain = domains[index];
    
    // Create compact professional edit modal with tools
    const modal = document.createElement('div');
    modal.className = 'edit-modal-compact';
    modal.innerHTML = `
        <div class="edit-modal-content-compact">
            <div class="edit-modal-header-compact">
                <div class="edit-modal-title-section-compact">
                    <div class="edit-modal-icon-compact">
                        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" 
                             alt="Domain Icon" 
                             class="domain-favicon-compact"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                        <span class="icon-emoji-compact" style="display: none;">🌐</span>
                    </div>
                    <div class="edit-modal-text-section">
                        <h2 class="edit-modal-title-compact">Domain Tahrirlash</h2>
                        <p class="edit-modal-subtitle-compact">${domain}</p>
                    </div>
                </div>
                <button class="edit-modal-close-compact" onclick="closeEditModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="edit-modal-body-compact">
                <div class="input-field-group-compact">
                    <label for="editDomainInput" class="input-label-compact">
                        Yangi domain nomi
                    </label>
                    <div class="input-wrapper-compact">
                        <input type="text" 
                               id="editDomainInput" 
                               class="input-field-compact" 
                               value="${domain}" 
                               placeholder="example.com"
                               required>
                    </div>
                </div>
                
                <div class="tools-preview-section">
                    <h3 class="tools-preview-title">Mavjud Tool'lar</h3>
                    <div class="tools-preview-list" id="toolsPreviewList">
                        <div class="tool-preview-item loading">
                            <div class="tool-preview-icon">⏳</div>
                            <div class="tool-preview-info">
                                <div class="tool-preview-name">Tool'lar yuklanmoqda...</div>
                                <div class="tool-preview-command">Biroz kuting...</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="edit-modal-actions-compact">
                    <button class="btn btn-secondary" onclick="closeEditModal()">
                        Bekor qilish
                    </button>
                    <button class="btn btn-primary" onclick="saveEditedDomain(${index}, '${domain}')">
                        Saqlash
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
    
    // Load tools preview
    loadToolsPreview(domain);
    
    // Focus on input
    const editInput = document.getElementById('editDomainInput');
    editInput.focus();
    editInput.select();
    
    // Add keyboard shortcuts
    editInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveEditedDomain(index, domain);
        } else if (e.key === 'Escape') {
            closeEditModal();
        }
    });
    
    // Domain o'zgartirilganda - faqat bazadan o'qish
    let debounceTimer;
    editInput.addEventListener('input', function() {
        const newDomain = this.value.trim();
        if (newDomain && isValidDomain(newDomain)) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                // Faqat bazadan o'qish - sodda va ishonchli
                loadToolsPreview(newDomain);
            }, 500);
        }
    });
    
    showNotification(`${domain} tahrirlanmoqda...`, 'info');
}

function closeEditModal() {
    const modal = document.querySelector('.edit-modal-compact');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

function loadToolsPreview(domain) {
    const toolsPreviewList = document.getElementById('toolsPreviewList');
    if (!toolsPreviewList) return;
    
    // Show loading state
    toolsPreviewList.innerHTML = `
        <div class="tool-preview-item loading">
            <div class="tool-preview-info">
                <div class="tool-preview-name">Tool'lar yuklanmoqda...</div>
                <div class="tool-preview-command">Biroz kuting...</div>
            </div>
        </div>
    `;
    
    // Saqlangan parametrlarni localStorage dan yuklash
    loadSavedToolParams(domain);
    
    // Fetch domain tools preview from backend
    fetch(`/scaner/get-domain-tools-preview/?domain_name=${encodeURIComponent(domain)}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.tools_preview) {
            // Bazadan kelgan tool buyruqlarini ko'rsatish
            console.log('Backend response:', data);
            renderToolsPreviewFromDatabase(data.tools_preview, domain, data.saved_commands);
        } else {
            // Fallback - eski usul bilan tool'larni yuklash
            fetch('/scaner/get-tools/', {
                method: 'GET',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(toolsData => {
                if (toolsData.success && toolsData.tools) {
                    if (toolsData.tools_data) {
                        window.toolsData = toolsData.tools_data;
                        console.log('Tools data yuklandi:', window.toolsData);
                    } else {
                        console.log('Tools data mavjud emas');
                    }
                    renderToolsPreview(toolsData.tools, domain);
                } else {
                    showToolsError('Tool\'lar yuklanmadi');
                }
            })
            .catch(error => {
                console.error('Tools yuklash xatosi:', error);
                showToolsError(error.message);
            });
        }
    })
    .catch(error => {
        console.error('Domain tools preview xatosi:', error);
        showToolsError(error.message);
    });
}

function renderToolsPreviewFromDatabase(toolsPreview, domain, savedCommands) {
    const toolsPreviewList = document.getElementById('toolsPreviewList');
    if (!toolsPreviewList) return;
    
    console.log('Tools Preview:', toolsPreview);
    console.log('Saved Commands:', savedCommands);
    console.log('Domain:', domain);
    
    const toolsHtml = toolsPreview.map(tool => {
        let command = '';
        
        // Bazadan kelgan tool buyruqlarini tekshirish
        if (savedCommands && Array.isArray(savedCommands)) {
            console.log(`Looking for ${tool.tool_type} in savedCommands:`, savedCommands);
            for (const commandItem of savedCommands) {
                console.log(`Checking commandItem:`, commandItem);
                if (commandItem[tool.tool_type]) {
                    // Bazadan kelgan to'liq buyruqni olish
                    command = commandItem[tool.tool_type];
                    console.log(`Found command for ${tool.tool_type}:`, command);
                    break;
                }
            }
        }
        
        // Agar bazada buyruq topilmasa, default buyruq yaratish
        if (!command) {
            switch (tool.tool_type) {
                case 'nmap':
                    command = `nmap ${domain}`;
                    break;
                case 'sqlmap':
                    command = `sqlmap -u https://${domain}`;
                    break;
                case 'xsstrike':
                    command = `xsstrike -u https://${domain}`;
                    break;
                case 'gobuster':
                    command = `gobuster dir -u https://${domain} -w wordlist.txt`;
                    break;
                default:
                    command = `${tool.name} ${domain}`;
            }
            console.log(`Using default command for ${tool.tool_type}:`, command);
        }
        
        // Saqlangan parametrlarni localStorage dan olish va buyruqga qo'shish
        const savedParams = getToolParamsFromStorage(domain, tool.tool_type);
        if (savedParams.length > 0) {
            const baseCommand = getBaseCommand(tool.tool_type, domain);
            if (command === baseCommand) {
                command = `${baseCommand} ${savedParams.join(' ')}`;
                console.log(`Updated command with saved params for ${tool.tool_type}:`, command);
            }
        }
        
        return `
            <div class="tool-preview-item" data-tool-type="${tool.tool_type}">
                <div class="tool-preview-info">
                    <div class="tool-preview-name">
                        <span class="tool-name-text">${tool.name}</span>
                        <button class="tool-params-btn" onclick="toggleToolParams('${tool.tool_type}', '${domain}')">
                            parametrlari
                        </button>
                    </div>
                    <div class="tool-preview-command">${command}</div>
                </div>
            </div>
        `;
    }).join('');
    
    toolsPreviewList.innerHTML = toolsHtml;
}

function showToolsError(message) {
    const toolsPreviewList = document.getElementById('toolsPreviewList');
    if (!toolsPreviewList) return;
    
    toolsPreviewList.innerHTML = `
        <div class="tool-preview-item error">
            <div class="tool-preview-info">
                <div class="tool-preview-name">Xatolik</div>
                <div class="tool-preview-command">${message}</div>
            </div>
        </div>
    `;
}

function renderToolsPreview(tools, domain) {
    const toolsPreviewList = document.getElementById('toolsPreviewList');
    if (!toolsPreviewList) return;
    
    const toolsHtml = tools.map(tool => {
        let command = '';
        
        // Tool turiga qarab command ni belgilash
        if (tool.base_command) {
            command = tool.base_command;
        } else {
            switch (tool.tool_type) {
                case 'nmap':
                    command = `nmap ${domain}`;
                    break;
                case 'sqlmap':
                    command = `sqlmap -u https://${domain}`;
                    break;
                case 'xsstrike':
                    command = `xsstrike -u https://${domain}`;
                    break;
                case 'gobuster':
                    command = `gobuster dir -u https://${domain} -w wordlist.txt`;
                    break;
                default:
                    command = `${tool.name} ${domain}`;
            }
        }
        
        // localStorage dan saqlangan parametrlarni olish
        const savedParams = getToolParamsFromStorage(domain, tool.tool_type);
        const finalCommand = savedParams.length > 0 ? `${command} ${savedParams.join(' ')}` : command;
        
        return `
            <div class="tool-preview-item" data-tool-type="${tool.tool_type}">
                <div class="tool-preview-info">
                    <div class="tool-preview-name">
                        <span class="tool-name-text">${tool.name}</span>
                        <button class="tool-params-btn" onclick="toggleToolParams('${tool.tool_type}', '${domain}')">
                            parametrlari
                        </button>
                    </div>
                    <div class="tool-preview-command">${finalCommand}</div>
                </div>
            </div>
        `;
    }).join('');
    
    toolsPreviewList.innerHTML = toolsHtml;
}

function toggleToolParams(toolType, domain) {
    // Check if params are already shown anywhere on the page
    const existingParams = document.querySelector('.tool-params-dropdown');
    if (existingParams) {
        existingParams.style.opacity = '0';
        existingParams.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            existingParams.remove();
        }, 300);
        return;
    }
    
    // Get tool parameters and inputs based on tool type
    const params = getToolParameters(toolType);
    const inputs = getToolInputs(toolType);
    
    // Saqlangan parametrlarni localStorage dan olish
    const savedParams = getToolParamsFromStorage(domain, toolType);
    const savedInputs = getToolInputsFromStorage(domain, toolType);
    
    // Create params dropdown
    const paramsDropdown = document.createElement('div');
    paramsDropdown.className = 'tool-params-dropdown';
    paramsDropdown.dataset.toolType = toolType;
    paramsDropdown.dataset.domain = domain;
    paramsDropdown.innerHTML = `
        <div class="tool-params-header">
            <h4>${getToolDisplayName(toolType)} parametrlari</h4>
            <button class="tool-params-close" onclick="closeToolParams()">×</button>
        </div>
        <div class="tool-params-command-preview">
            <div class="command-preview-label">Buyruq:</div>
            <div class="command-preview-text" id="commandPreview">${getCommandWithSavedParams(toolType, domain)}</div>
        </div>
        <div class="tool-params-content">
            <!-- Checkbox parametrlar -->
            <div class="params-section">
                <h5 class="section-title">Bayroq parametrlar</h5>
                ${params.map(param => {
                    const isChecked = savedParams.includes(param.value);
                    return `
                        <div class="tool-param-item">
                            <label class="tool-param-checkbox">
                                <input type="checkbox" 
                                       value="${param.value}" 
                                       data-param="${param.name}"
                                       ${isChecked ? 'checked' : ''}
                                       onchange="updateToolCommandInPopup('${toolType}', '${domain}')">
                                <span class="checkmark"></span>
                                <div class="param-info">
                                    <div class="param-name">${param.name}</div>
                                    <div class="param-description">${param.description}</div>
                                </div>
                            </label>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Input parametrlar -->
            ${inputs.length > 0 ? `
            <div class="inputs-section">
                <h5 class="section-title">Kiritiladigan parametrlar</h5>
                ${inputs.map(input => {
                    const savedValue = savedInputs[input.key] || input.default || '';
                    return `
                        <div class="tool-input-item">
                            <div class="input-header">
                                <div class="input-key">${input.key}</div>
                                <div class="input-description">${input.description}</div>
                            </div>
                            ${input.type === 'range' ? `
                                <div class="range-input-container">
                                    <input type="range" 
                                           class="tool-input-field range-input" 
                                           value="${savedValue}"
                                           min="${input.min || 0}"
                                           max="${input.max || 100}"
                                           step="${input.step || 1}"
                                           data-input-key="${input.key}"
                                           oninput="updateRangeValue(this, '${toolType}', '${domain}')"
                                           onchange="updateToolCommandInPopup('${toolType}', '${domain}')">
                                    <div class="range-value-display">${savedValue}</div>
                                </div>
                            ` : input.type === 'number' ? `
                                <input type="number" 
                                       class="tool-input-field" 
                                       placeholder="${input.placeholder}"
                                       value="${savedValue}"
                                       min="${input.min || ''}"
                                       max="${input.max || ''}"
                                       data-input-key="${input.key}"
                                       oninput="validateInputField(this)"
                                       onchange="updateToolCommandInPopup('${toolType}', '${domain}')">
                            ` : `
                                <input type="text" 
                                       class="tool-input-field" 
                                       placeholder="${input.placeholder}"
                                       value="${savedValue}"
                                       data-input-key="${input.key}"
                                       oninput="validateInputField(this)"
                                       onchange="updateToolCommandInPopup('${toolType}', '${domain}')">
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
            ` : ''}
        </div>
    `;
    
    // Add to body for fixed positioning
    document.body.appendChild(paramsDropdown);
    
    // Show with animation
    setTimeout(() => {
        paramsDropdown.style.opacity = '1';
        paramsDropdown.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
    
    // Close on backdrop click
    paramsDropdown.addEventListener('click', function(e) {
        if (e.target === this) {
            closeToolParams();
        }
    });
}

function getToolParameters(toolType) {
    console.log(`getToolParameters called for ${toolType}`);
    console.log('window.toolsData:', window.toolsData);
    
    // Global tools data ni ishlatish - views.py dagi to'liq parametrlar
    if (window.toolsData && window.toolsData[toolType] && window.toolsData[toolType].parameters) {
        console.log(`Using full parameters for ${toolType}:`, window.toolsData[toolType].parameters);
        const params = window.toolsData[toolType].parameters.map(param => ({
            name: param.flag,
            value: param.flag,
            description: param.description,
            type: 'checkbox'
        }));
        console.log(`Mapped parameters for ${toolType}:`, params);
        return params;
    }
    
    // Fallback - agar tools data mavjud bo'lmasa
    const fallbackParams = {
        'nmap': [
            { name: '-sS', value: '-sS', description: 'TCP SYN scan (stealth)', type: 'checkbox' },
            { name: '-sV', value: '-sV', description: 'Version detection', type: 'checkbox' },
            { name: '-O', value: '-O', description: 'OS detection', type: 'checkbox' }
        ],
        'sqlmap': [
            { name: '--dbs', value: '--dbs', description: 'Enumerate databases', type: 'checkbox' },
            { name: '--tables', value: '--tables', description: 'Enumerate tables', type: 'checkbox' },
            { name: '--dump', value: '--dump', description: 'Dump database', type: 'checkbox' }
        ],
        'xsstrike': [
            { name: '--crawl', value: '--crawl', description: 'Crawl website', type: 'checkbox' },
            { name: '--blind', value: '--blind', description: 'Blind XSS detection', type: 'checkbox' }
        ],
        'gobuster': [
            { name: 'dir', value: 'dir', description: 'Directory enumeration', type: 'checkbox' },
            { name: '-x php', value: '-x php', description: 'File extensions', type: 'checkbox' }
        ]
    };
    
    console.log(`Using fallback parameters for ${toolType}:`, fallbackParams[toolType] || []);
    return fallbackParams[toolType] || [];
}

function getToolInputs(toolType) {
    console.log(`getToolInputs called for ${toolType}`);
    
    // Global tools data dan input'larni olish
    if (window.toolsData && window.toolsData[toolType] && window.toolsData[toolType].inputs) {
        console.log(`Using full inputs for ${toolType}:`, window.toolsData[toolType].inputs);
        return window.toolsData[toolType].inputs;
    }
    
    // Fallback - agar tools data mavjud bo'lmasa
    const fallbackInputs = {
        'nmap': [
            { key: '-p', description: 'Port range', placeholder: '80,443,8080', type: 'text', default: '' },
            { key: '--script', description: 'NSE script', placeholder: 'vuln,auth', type: 'text', default: '' }
        ],
        'sqlmap': [
            { key: '--level', description: 'Test level (1-5)', placeholder: '1-5', type: 'number', default: '1', min: 1, max: 5 },
            { key: '--risk', description: 'Risk level (1-3)', placeholder: '1-3', type: 'number', default: '1', min: 1, max: 3 }
        ],
        'xsstrike': [
            { key: '--threads', description: 'Number of threads', placeholder: '10', type: 'number', default: '10', min: 1, max: 50 }
        ],
        'gobuster': [
            { key: '-t', description: 'Number of threads', placeholder: '10', type: 'number', default: '10', min: 1, max: 100 },
            { key: '-x', description: 'File extensions', placeholder: 'php,html,txt', type: 'text', default: 'php,html,txt' }
        ]
    };
    
    console.log(`Using fallback inputs for ${toolType}:`, fallbackInputs[toolType] || []);
    return fallbackInputs[toolType] || [];
}

function getToolDisplayName(toolType) {
    const names = {
        'nmap': 'Nmap',
        'sqlmap': 'SQLMap',
        'xsstrike': 'XSStrike',
        'gobuster': 'Gobuster'
    };
    
    return names[toolType] || toolType;
}

function closeToolParams() {
    const existingParams = document.querySelector('.tool-params-dropdown');
    if (existingParams) {
        // Popup yopilishidan oldin input'larni ham saqlash
        const toolType = existingParams.dataset.toolType;
        const domain = existingParams.dataset.domain;
        
        if (toolType && domain) {
            // Input'larni localStorage ga saqlash (faqat bo'sh bo'lmagan qiymatlar)
            const inputFields = existingParams.querySelectorAll('.tool-input-field');
            const inputsToSave = {};
            inputFields.forEach(input => {
                const value = input.value.trim();
                const key = input.dataset.inputKey;
                if (value) {
                    inputsToSave[key] = value;
                }
            });
            saveToolInputsToStorage(domain, toolType, inputsToSave);
            
            // Checkbox parametrlarni ham saqlash
            const checkboxes = existingParams.querySelectorAll('input[type="checkbox"]:checked');
            const selectedParams = Array.from(checkboxes).map(cb => cb.value);
            saveToolParamsToStorage(domain, toolType, selectedParams);
            
            // Backend ga saqlash
            saveToolCommandsToBackend(domain, toolType);
        }
        
        existingParams.style.opacity = '0';
        existingParams.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            existingParams.remove();
        }, 300);
    }
}

// Debug funksiyasi - localStorage ni tozalash
function clearNmapDefaults() {
    // Barcha domainlar uchun Nmap input'larini tozalash
    const domains = JSON.parse(localStorage.getItem('domains') || '[]');
    domains.forEach(domain => {
        const key = `tool_inputs_${domain}_nmap`;
        const savedInputs = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Agar -p yoki --script da default qiymatlar bo'lsa, ularni o'chirish
        if (savedInputs['-p'] === '80,443,8080') {
            delete savedInputs['-p'];
        }
        if (savedInputs['--script'] === 'vuln') {
            delete savedInputs['--script'];
        }
        
        // Yangilangan qiymatlarni saqlash
        localStorage.setItem(key, JSON.stringify(savedInputs));
        console.log(`Cleared defaults for ${domain}:`, savedInputs);
    });
    
    console.log('Nmap default qiymatlar tozalandi');
    showNotification('Nmap default qiymatlar tozalandi', 'success');
}

// Yangi domainlar uchun input field'larni tozalash
function clearInputFieldsForNewDomains(newDomains) {
    const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
    
    newDomains.forEach(domain => {
        tools.forEach(toolType => {
            // Input field'larni tozalash
            const inputKey = `tool_inputs_${domain}_${toolType}`;
            localStorage.removeItem(inputKey);
            console.log(`Cleared input fields for ${domain} - ${toolType}`);
            
            // Checkbox parametrlarni ham tozalash (faqat yangi domain uchun)
            const paramKey = `tool_params_${domain}_${toolType}`;
            localStorage.removeItem(paramKey);
            console.log(`Cleared parameters for ${domain} - ${toolType}`);
        });
    });
    
    console.log(`Input fields cleared for ${newDomains.length} new domains`);
}

function getBaseCommand(toolType, domain) {
    switch (toolType) {
        case 'nmap':
            return `nmap ${domain}`;
        case 'sqlmap':
            return `sqlmap -u https://${domain}`;
        case 'xsstrike':
            return `xsstrike -u https://${domain}`;
        case 'gobuster':
            return `gobuster dir -u https://${domain} -w wordlist.txt`;
        default:
            return `${toolType} ${domain}`;
    }
}

function getCommandWithSavedParams(toolType, domain) {
    const baseCommand = getBaseCommand(toolType, domain);
    
    // localStorage dan saqlangan checkbox parametrlarni olish
    const savedParams = getToolParamsFromStorage(domain, toolType);
    
    // localStorage dan saqlangan input parametrlarni olish
    const savedInputs = getToolInputsFromStorage(domain, toolType);
    
    // Yakuniy buyruqni yaratish
    let finalCommand = baseCommand;
    
    // Checkbox parametrlarni qo'shish
    if (savedParams.length > 0) {
        finalCommand += ` ${savedParams.join(' ')}`;
    }
    
    // Input parametrlarni qo'shish
    const inputParams = [];
    Object.keys(savedInputs).forEach(key => {
        const value = savedInputs[key];
        if (value && value.trim()) {
            inputParams.push(`${key} ${value.trim()}`);
        }
    });
    
    if (inputParams.length > 0) {
        finalCommand += ` ${inputParams.join(' ')}`;
    }
    
    return finalCommand;
}

function updateToolCommand(toolType, domain) {
    const toolItem = document.querySelector(`[data-tool-type="${toolType}"]`);
    if (!toolItem) return;
    
    const commandDiv = toolItem.querySelector('.tool-preview-command');
    
    // getCommandWithSavedParams funksiyasini ishlatish (input'larni ham hisobga oladi)
    const finalCommand = getCommandWithSavedParams(toolType, domain);
    
    commandDiv.textContent = finalCommand;
}

function updateToolCommandInPopup(toolType, domain) {
    // Update popup command preview
    const commandPreview = document.getElementById('commandPreview');
    if (commandPreview) {
        const baseCommand = getBaseCommand(toolType, domain);
        
        // Checkbox parametrlarni olish
        const checkboxes = document.querySelectorAll('.tool-params-dropdown input[type="checkbox"]:checked');
        const selectedParams = Array.from(checkboxes).map(cb => cb.value).join(' ');
        
        // Input parametrlarni olish
        const inputFields = document.querySelectorAll('.tool-params-dropdown .tool-input-field');
        const inputParams = [];
        inputFields.forEach(input => {
            const value = input.value.trim();
            const key = input.dataset.inputKey;
            if (value) {
                inputParams.push(`${key} ${value}`);
            }
        });
        
        // Yakuniy buyruqni yaratish
        let finalCommand = baseCommand;
        if (selectedParams) {
            finalCommand += ` ${selectedParams}`;
        }
        if (inputParams.length > 0) {
            finalCommand += ` ${inputParams.join(' ')}`;
        }
        
        commandPreview.textContent = finalCommand;
        
        // Tanlangan parametrlarni global o'zgaruvchiga saqlash
        selectedToolParams[toolType] = Array.from(checkboxes).map(cb => cb.value);
        
        // Input'larni localStorage ga saqlash
        const inputsToSave = {};
        inputFields.forEach(input => {
            const value = input.value.trim();
            const key = input.dataset.inputKey;
            if (value) {
                inputsToSave[key] = value;
            }
        });
        saveToolInputsToStorage(domain, toolType, inputsToSave);
        
        // Parametrlarni localStorage ga ham saqlash
        saveToolParamsToStorage(domain, toolType, selectedToolParams[toolType]);
    }
    
    // Also update the main tool command
    updateToolCommand(toolType, domain);
    
    // Backend ga tool commands ni saqlash
    saveToolCommandsToBackend(domain, toolType);
}

function saveEditedDomain(index, originalDomain) {
    const editInput = document.getElementById('editDomainInput');
    const newDomain = editInput.value.trim();

    if (!newDomain) {
        showNotification('Iltimos, yangi domain nomini kiriting', 'warning');
        return;
    }

    if (!isValidDomain(newDomain)) {
        showNotification('Yangi domain nomi noto\'g\'ri formatda', 'error');
        return;
    }

    if (newDomain === originalDomain) {
        showNotification('O\'zgarish qilinmadi', 'warning');
        return;
    }

    // Show loading state
    const saveButton = document.querySelector('.edit-modal-compact .btn-primary');
    const originalText = saveButton.textContent;
    saveButton.textContent = '⏳ Saqlanmoqda...';
    saveButton.disabled = true;

    // Send update request to backend
    fetch('/scaner/update-domain/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            old_domain: originalDomain,
            new_domain: newDomain
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // localStorage dan eski domain parametrlarini yangi domain ga ko'chirish
            const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
            tools.forEach(toolType => {
                const oldKey = `tool_params_${originalDomain}_${toolType}`;
                const newKey = `tool_params_${newDomain}_${toolType}`;
                const oldParams = localStorage.getItem(oldKey);
                if (oldParams) {
                    localStorage.setItem(newKey, oldParams);
                    localStorage.removeItem(oldKey);
                    console.log(`Moved localStorage from ${oldKey} to ${newKey}`);
                }
            });
            
            // Update the domain in the array
            domains[index] = newDomain;
            
            // Close modal
            closeEditModal();
            
            // Re-render domains list
            renderDomains();
            
            showNotification(data.message, 'success');
            console.log('Domain updated successfully:', data);
            
        } else {
            showNotification('Xatolik: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Domain update xatosi:', error);
        showNotification('Domain update xatosi: ' + error.message, 'error');
    })
    .finally(() => {
        // Reset button state
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    });
}

function deleteDomain(index) {
    const domain = domains[index];
    
    // Create custom confirmation modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h3>⚠️ Domain o'chirish</h3>
            </div>
            <div class="custom-modal-body">
                <p>Haqiqatdan <strong>${domain}</strong> o'chirasimi?</p>
            </div>
            <div class="custom-modal-actions">
                <button class="btn btn-secondary" onclick="closeCustomModal()">Yo'q</button>
                <button class="btn btn-danger" onclick="confirmDeleteDomain(${index})">Ha, o'chir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
}

function closeCustomModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

function confirmDeleteDomain(index) {
    const domain = domains[index];
    
    // Show loading state
    const deleteButton = document.querySelector('.custom-modal .btn-danger');
    const originalText = deleteButton.textContent;
    deleteButton.textContent = '⏳ O\'chirilmoqda...';
    deleteButton.disabled = true;
    
    // Send delete request to backend
    fetch('/scaner/delete-domain/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            domain_name: domain
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove domain from array
            domains.splice(index, 1);
            
            // localStorage dan domain parametrlarini tozalash
            const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
            tools.forEach(toolType => {
                const key = `tool_params_${domain}_${toolType}`;
                localStorage.removeItem(key);
                console.log(`Cleared localStorage for ${key}`);
            });
            
            // Close modal
            closeCustomModal();
            
            // Re-render domains list
            renderDomains();
            
            // Show success notification
            showNotification(data.message, 'success');
            
            // If no domains left, show input section again
            if (domains.length === 0) {
                const inputSection = document.querySelector('.input-section');
                inputSection.style.display = 'block';
                
                const domainsSection = document.getElementById('domainsSection');
                domainsSection.style.display = 'none';
            }
            
        } else {
            showNotification('Xatolik: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Domain o\'chirish xatosi:', error);
        showNotification('Domain o\'chirish xatosi: ' + error.message, 'error');
    })
    .finally(() => {
        // Reset button state
        deleteButton.textContent = originalText;
        deleteButton.disabled = false;
    });
}

function startScan() {
    if (domains.length === 0) {
        showNotification('Iltimos, kamida bitta domain qo\'shing', 'warning');
        return;
    }
    
    console.log('Starting scan for domains:', domains);
    
    // Show loading state with professional animation
    const scanButton = document.querySelector('.btn-success');
    const originalText = scanButton.textContent;
    scanButton.textContent = '⏳ Tahlil qilinmoqda...';
    scanButton.disabled = true;
    scanButton.classList.add('loading');
    
    // Add loading animation to all domain items
    document.querySelectorAll('.domain-item').forEach(item => {
        item.classList.add('scanning');
    });
    
    // Send request with JSON data
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
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Backend dan kelgan xabarni ko'rsatish
            const message = data.message || 'Tahlil muvaffaqiyatli bajarildi!';
            showNotification(message, 'success');
            
            // Tahlil tugagandan so'ng history sahifasiga o'tish
            setTimeout(() => {
                // History sahifasiga o'tish va yangi tahlillarni eski tahlillarga qo'shish
                // Yangi tahlillarda yangi domainlar ko'rinadi, eski tahlillarda esa avvalgi tahlillar
                window.location.href = '/scaner/history/';
            }, 2000);
        } else {
            throw new Error(data.error || 'Noma\'lum xatolik');
        }
    })
    .catch(error => {
        console.error('Scan error:', error);
        showNotification('Tahlil xatosi: ' + error.message, 'error');
        
        // Reset button and domain items
        scanButton.textContent = originalText;
        scanButton.disabled = false;
        scanButton.classList.remove('loading');
        
        document.querySelectorAll('.domain-item').forEach(item => {
            item.classList.remove('scanning');
        });
    });
}

function resetDomains() {
    console.log('resetDomains function called'); // Debug log
    
    // Custom modal stil bilan alert (O'chirish tugmasidagi stil bilan bir xil)
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h3>⚠️ Qayta boshlash</h3>
            </div>
            <div class="custom-modal-body">
                <p>Haqiqatdan <strong>barcha domainlarni o'chirishni</strong> xohlaysizmi?</p>
            </div>
            <div class="custom-modal-actions">
                <button class="btn btn-secondary" onclick="closeResetModal()">Yo'q</button>
                <button class="btn btn-danger" onclick="confirmResetDomains()">Ha, o'chir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
}

function closeResetModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

function confirmResetDomains() {
    console.log('User confirmed - proceeding with reset'); // Debug log
    
    // Show loading state
    const resetButton = document.querySelector('.custom-modal .btn-danger');
    const originalText = resetButton.textContent;
    resetButton.textContent = '⏳ O\'chirilmoqda...';
    resetButton.disabled = true;
    
    // Send clear all request to backend
    fetch('/scaner/clear-all-domains/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Ha - barcha domainlarni o'chir
            domains = [];
            document.getElementById('domainsInput').value = '';
            
            // localStorage dan barcha domain parametrlarini tozalash
            const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('tool_params_')) {
                    localStorage.removeItem(key);
                    console.log(`Cleared localStorage for ${key}`);
                }
            }
            
            // Show input section again
            const inputSection = document.querySelector('.input-section');
            inputSection.style.display = 'block';
            
            // Hide domains section
            const domainsSection = document.getElementById('domainsSection');
            domainsSection.style.display = 'none';
            
            // Reset all elements to their original state
            inputSection.className = 'input-section card';
            domainsSection.className = 'domains-section card';
            
            // Reset all domain items
            const domainItems = document.querySelectorAll('.domain-item');
            domainItems.forEach(item => {
                item.className = 'domain-item fade-in';
            });
            
            // Reset all buttons - preserve their original classes
            const allButtons = document.querySelectorAll('.btn');
            allButtons.forEach(btn => {
                // Don't change button classes - just remove any inline styles
                btn.removeAttribute('style');
            });
            
            showNotification(data.message, 'success');
            console.log('Reset completed successfully'); // Debug log
            
        } else {
            showNotification('Xatolik: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Barcha domainlarni o\'chirish xatosi:', error);
        showNotification('Barcha domainlarni o\'chirish xatosi: ' + error.message, 'error');
    })
    .finally(() => {
        // Reset button state
        resetButton.textContent = originalText;
        resetButton.disabled = false;
    
        // Close modal
        closeResetModal();
    });
}

function addMoreDomains() {
    // Show input section again without hiding domains section
    const inputSection = document.querySelector('.input-section');
    inputSection.style.display = 'block';
    inputSection.classList.add('fade-in');
    
    setTimeout(() => {
        inputSection.classList.remove('fade-in');
        
        // Focus on input
        const domainsInput = document.getElementById('domainsInput');
        domainsInput.focus();
        
        // Scroll to input section
        inputSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 600);
}

function isValidDomain(domain) {
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainPattern.test(domain);
}

function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// Professional notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            border: 1px solid;
        }
        
        .notification-info {
            background: rgba(59, 130, 246, 0.1);
            border-color: #3b82f6;
            color: #3b82f6;
        }
        
        .notification-success {
            background: rgba(16, 185, 129, 0.1);
            border-color: #10b981;
            color: #10b981;
        }
        
        .notification-warning {
            background: rgba(245, 158, 11, 0.1);
            border-color: #f59e0b;
            color: #f59e0b;
        }
        
        .notification-error {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
            color: #ef4444;
        }
        
        .notification-icon {
            font-size: 20px;
        }
        
        .notification-message {
            flex-grow: 1;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .notification-close:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .scanning {
            position: relative;
            overflow: hidden;
        }
        
        .scanning::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
            animation: scanning 2s ease-in-out infinite;
        }
        
        @keyframes scanning {
            0% { left: -100%; }
            100% { left: 100%; }
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || icons.info;
}

// Professional effects and animations
function addProfessionalEffects() {
    // Add smooth entrance animations
    const elements = document.querySelectorAll('.input-section, .domains-section, .results-section');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Add hover effects to form inputs
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .loading {
            position: relative;
            overflow: hidden;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid #10b981;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    if (!document.querySelector('#professional-effects-styles')) {
        style.id = 'professional-effects-styles';
        document.head.appendChild(style);
    }
}

// Keyboard shortcuts with professional feedback
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to start scan
    if (e.ctrlKey && e.key === 'Enter') {
        if (domains.length > 0) {
            startScan();
        } else {
            prepareDomains();
        }
    }
    
    // Escape to reset
    if (e.key === 'Escape') {
        resetDomains();
    }
    
    // Show keyboard shortcut hint
    if (e.ctrlKey || e.key === 'Escape') {
        showNotification('Klaviatura qisqartmalari: Ctrl+Enter (tahlil), Escape (qayta boshlash)', 'info');
    }
}); 

// Check for edited domains when page loads
function checkForEditedDomains() {
    // Check for edited domains from localStorage
    const editedDomainData = localStorage.getItem('editedDomain');
    if (editedDomainData) {
        try {
            const { domain: editedDomain, timestamp } = JSON.parse(editedDomainData);
            const editingDomainData = localStorage.getItem('editingDomain');
            
            if (editingDomainData) {
                const { index, domain: originalDomain } = JSON.parse(editingDomainData);
                
                // Check if this edit is recent (within last 10 seconds)
                if (Date.now() - timestamp < 10000) {
                    // Update the domain in the domains array
                    if (domains[index] === originalDomain) {
                        domains[index] = editedDomain;
                        renderDomains();
                        showNotification(`${originalDomain} muvaffaqiyatli ${editedDomain} ga o'zgartirildi!`, 'success');
                    }
                }
            }
            
            // Clean up localStorage
            localStorage.removeItem('editedDomain');
            localStorage.removeItem('editingDomain');
        } catch (error) {
            console.error('Error processing edited domain:', error);
            localStorage.removeItem('editedDomain');
            localStorage.removeItem('editingDomain');
        }
    }
    
    // Check for existing domains in textarea and auto-prepare them
    const domainsInput = document.getElementById('domainsInput');
    if (domainsInput && domainsInput.value.trim()) {
        const existingDomains = domainsInput.value.trim().split('\n').filter(domain => domain.trim());
        if (existingDomains.length > 0) {
            // Auto-prepare domains
            domains = existingDomains;
            renderDomains();
            
            // Hide input section and show domains section
            const inputSection = document.querySelector('.input-section');
            inputSection.style.display = 'none';
            
            const domainsSection = document.getElementById('domainsSection');
            domainsSection.style.display = 'block';
            
            showNotification(`${existingDomains.length} ta domain avtomatik ravishda tayyorlandi!`, 'success');
        }
    }
} 

// Custom confirmation modal function
function showCustomConfirm(title, message, onConfirm, onCancel) {
    // Remove existing modals
    const existingModals = document.querySelectorAll('.custom-confirm-modal');
    existingModals.forEach(modal => modal.remove());
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="custom-confirm-content">
            <div class="custom-confirm-header">
                <h3 class="custom-confirm-title">${title}</h3>
                <button class="custom-confirm-close" onclick="this.closest('.custom-confirm-modal').remove()">×</button>
            </div>
            <div class="custom-confirm-body">
                <p class="custom-confirm-message">${message}</p>
            </div>
            <div class="custom-confirm-actions">
                <button class="btn btn-danger custom-confirm-btn" onclick="confirmAction(this)">
                    Ha, o'chirish
                </button>
                <button class="btn btn-secondary custom-confirm-btn" onclick="cancelAction(this)">
                    Yo'q, bekor qilish
                </button>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Store callbacks in modal data
    modal.dataset.onConfirm = 'true';
    modal.dataset.onCancel = 'true';
    
    // Add event listeners
    modal.querySelector('.btn-danger').addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    
    modal.querySelector('.btn-secondary').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    });
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add styles for modal
    const style = document.createElement('style');
    style.textContent = `
        .custom-confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-confirm-modal.show {
            opacity: 1;
        }
        
        .custom-confirm-content {
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 2px solid #333;
            border-radius: 20px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }
        
        .custom-confirm-modal.show .custom-confirm-content {
            transform: scale(1) translateY(0);
        }
        
        .custom-confirm-header {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #444;
        }
        
        .custom-confirm-title {
            color: white;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .custom-confirm-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.2s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .custom-confirm-close:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: scale(1.1);
        }
        
        .custom-confirm-body {
            padding: 2rem;
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
        }
        
        .custom-confirm-message {
            color: #e5e5e5;
            font-size: 1.1rem;
            line-height: 1.6;
            margin: 0;
            text-align: center;
        }
        
        .custom-confirm-actions {
            padding: 1.5rem 2rem;
            background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
            display: flex;
            gap: 1rem;
            justify-content: center;
            border-top: 1px solid #444;
        }
        
        .custom-confirm-btn {
            padding: 1rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 12px;
            transition: all 0.2s ease;
            min-width: 140px;
        }
        
        .custom-confirm-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border: 2px solid #dc2626;
            color: white;
        }
        
        .btn-danger:hover {
            background: linear-gradient(135deg, #b91c1c, #991b1b);
            border-color: #b91c1c;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #6b7280, #4b5563);
            border: 2px solid #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: linear-gradient(135deg, #4b5563, #374151);
            border-color: #4b5563;
        }
        
        @media (max-width: 768px) {
            .custom-confirm-content {
                width: 95%;
                margin: 1rem;
            }
            
            .custom-confirm-actions {
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .custom-confirm-btn {
                min-width: auto;
                width: 100%;
            }
        }
    `;
    
    if (!document.querySelector('#custom-confirm-styles')) {
        style.id = 'custom-confirm-styles';
        document.head.appendChild(style);
    }
} 

function saveDefaultToolCommands(domain) {
    console.log(`saveDefaultToolCommands called for domain: ${domain}`);
    
    // Har bir tool uchun default buyruqlarni bazaga saqlash
    const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
    
    // Barcha tool buyruqlarini bir vaqtda saqlash uchun array yaratish
    const allToolCommands = [];
    
    tools.forEach(toolType => {
        const baseCommand = getBaseCommand(toolType, domain);
        allToolCommands.push({ [toolType]: baseCommand });
        console.log(`Prepared command for ${toolType}: ${baseCommand}`);
        
        // localStorage dan eski parametrlarni tozalash (default buyruqlar uchun)
        const key = `tool_params_${domain}_${toolType}`;
        localStorage.removeItem(key);
        console.log(`Cleared localStorage for ${key}`);
    });
    
    console.log(`All tool commands prepared:`, allToolCommands);
    
    // KeshDomain.tool_commands maydoniga to'liq buyruqlarni saqlash
    console.log(`Sending tool commands to backend for domain: ${domain}`);
    fetch('/scaner/update-tool-commands/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            domain_name: domain,
            tool_commands: allToolCommands
        })
    })
    .then(response => {
        console.log(`Backend response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log(`${domain} uchun barcha tool buyruqlari saqlandi:`, allToolCommands);
            console.log(`Backend response:`, data);
        } else {
            console.error(`${domain} uchun tool buyruqlari saqlash xatosi:`, data.error);
        }
    })
    .catch(error => {
        console.error(`${domain} uchun tool buyruqlari saqlash xatosi:`, error);
    });
    
    // Har bir tool uchun DomainToolConfiguration ham saqlash (backup uchun)
    console.log(`Saving individual tool configurations for domain: ${domain}`);
    tools.forEach(toolType => {
        const baseCommand = getBaseCommand(toolType, domain);
        console.log(`Saving config for ${toolType}: ${baseCommand}`);
        
        fetch('/scaner/save-domain-tool-config/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                domain_name: domain,
                tool_type: toolType,
                base_command: baseCommand,
                selected_parameters: []
            })
        })
        .then(response => {
            console.log(`Config save response status for ${toolType}: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log(`${domain} uchun ${toolType} konfiguratsiyasi saqlandi`);
            } else {
                console.error(`${domain} uchun ${toolType} konfiguratsiyasi saqlash xatosi:`, data.error);
            }
        })
        .catch(error => {
            console.error(`${domain} uchun ${toolType} konfiguratsiyasi saqlash xatosi:`, error);
        });
    });
}

function saveToolCommandsToBackend(domain, toolType) {
    // Tool commands ni backend formatiga o'tkazish - input'larni ham hisobga olgan holda
    const finalCommand = getCommandWithSavedParams(toolType, domain);
    
    // localStorage dan saqlangan checkbox parametrlarni olish
    const selectedParams = getToolParamsFromStorage(domain, toolType);
    
    // localStorage dan saqlangan input parametrlarni olish
    const selectedInputs = getToolInputsFromStorage(domain, toolType);
    
    // Avval DomainToolConfiguration ni yangilash
    fetch('/scaner/save-domain-tool-config/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            domain_name: domain,
            tool_type: toolType,
            base_command: getBaseCommand(toolType, domain),
            selected_parameters: selectedParams,
            selected_inputs: selectedInputs  // Input'larni ham yuborish
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Tool konfiguratsiyasi saqlandi:', data.message);
            
            // Keyin KeshDomain.tool_commands ni ham yangilash
            return fetch('/scaner/update-tool-commands/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    domain_name: domain,
                    tool_commands: [{ [toolType]: finalCommand }]
                })
            });
        } else {
            throw new Error(data.error);
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Tool commands saqlandi:', data.message);
            // showNotification o'chirildi - checkbox/input o'zgarishida xabar chiqmasin
        } else {
            console.error('Tool commands saqlash xatosi:', data.error);
            showNotification('Parametrlar saqlanmadi: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Tool commands saqlash xatosi:', error);
        showNotification('Parametrlar saqlanmadi: ' + error.message, 'error');
    });
} 

// Range input va validation funksiyalari
function updateRangeValue(rangeInput, toolType, domain) {
    const value = rangeInput.value;
    const displayElement = rangeInput.parentElement.querySelector('.range-value-display');
    if (displayElement) {
        displayElement.textContent = value;
    }
    
    // Real-time validation
    validateRangeInput(rangeInput);
    
    // localStorage ga saqlash
    const inputKey = rangeInput.dataset.inputKey;
    const savedInputs = getToolInputsFromStorage(domain, toolType);
    savedInputs[inputKey] = value;
    saveToolInputsToStorage(domain, toolType, savedInputs);
}

function validateRangeInput(rangeInput) {
    const value = parseInt(rangeInput.value);
    const min = parseInt(rangeInput.min);
    const max = parseInt(rangeInput.max);
    
    if (value < min || value > max) {
        rangeInput.classList.add('invalid');
        showFieldError(rangeInput, `Qiymat ${min}-${max} orasida bo'lishi kerak`);
    } else {
        rangeInput.classList.remove('invalid');
        hideFieldError(rangeInput);
    }
}

function validateInputField(input) {
    const value = input.value.trim();
    const type = input.type;
    const min = input.min;
    const max = input.max;
    const required = input.hasAttribute('required');
    
    // Required validation
    if (required && !value) {
        input.classList.add('invalid');
        showFieldError(input, 'Bu maydon majburiy');
        return false;
    }
    
    // Type-specific validation
    if (type === 'number' && value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            input.classList.add('invalid');
            showFieldError(input, 'Raqam kiriting');
            return false;
        }
        if (min && numValue < parseFloat(min)) {
            input.classList.add('invalid');
            showFieldError(input, `Minimal qiymat: ${min}`);
            return false;
        }
        if (max && numValue > parseFloat(max)) {
            input.classList.add('invalid');
            showFieldError(input, `Maksimal qiymat: ${max}`);
            return false;
        }
    }
    
    // URL validation for text inputs (if placeholder suggests URL)
    if (type === 'text' && value && input.placeholder.includes('http')) {
        try {
            new URL(value);
        } catch {
            input.classList.add('invalid');
            showFieldError(input, 'Noto\'g\'ri URL format');
            return false;
        }
    }
    
    // If all validations pass
    input.classList.remove('invalid');
    input.classList.add('valid');
    hideFieldError(input);
    return true;
}

function showFieldError(input, message) {
    // Remove existing error
    hideFieldError(input);
    
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #e74c3c;
        font-size: 12px;
        margin-top: 4px;
        animation: fadeIn 0.3s ease-in;
    `;
    
    // Insert after input
    input.parentElement.appendChild(errorDiv);
}

function hideFieldError(input) {
    const errorDiv = input.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
} 

 
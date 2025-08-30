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
            
            // Har bir domain uchun tool buyruqlari allaqachon backend da saqlangan
            console.log('Tool buyruqlari allaqachon backend da saqlangan');
            
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
                <button class="btn btn-small btn-info progress-btn" onclick="showDomainProgress(${index})" style="display: none;">
                    🔍 Jarayonda...
                </button>
                <button class="btn btn-small btn-secondary edit-btn" onclick="editDomain(${index})">
                    ✏️ Tahrirlash
                </button>
                <button class="btn btn-small btn-danger delete-btn" onclick="deleteDomain(${index})">
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
    
    // Create compact edit modal with icon and domain name only
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="edit-modal-body-compact">
                <div class="input-field-group-compact">
                    <div class="input-wrapper-compact">
                        <input type="text" 
                               id="editDomainInput" 
                               class="input-field-compact" 
                               value="${domain}" 
                               placeholder="example.com"
                               required>
                    </div>
                </div>
                
                <div class="tools-preview-section-compact">
                    <h3 class="tools-preview-title-compact">Mavjud Tool'lar</h3>
                    <div class="tools-preview-list-compact" id="toolsPreviewList">
                        <div class="tool-preview-item-compact loading">
                            <div class="tool-preview-icon-compact">⏳</div>
                            <div class="tool-preview-info-compact">
                                <div class="tool-preview-name-compact">Tool'lar yuklanmoqda...</div>
                                <div class="tool-preview-command-compact">Biroz kuting...</div>
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
        <div class="tool-preview-item-compact loading">
            <div class="tool-preview-info-compact">
                <div class="tool-preview-name-compact">Tool'lar yuklanmoqda...</div>
                <div class="tool-preview-command-compact">Biroz kuting...</div>
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
    modal.className = 'custom-modal delete-modal';
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
    const scanButton = document.getElementById('scanButton');
    const originalText = scanButton.textContent;
    scanButton.textContent = '⏸️ Tahlilni to\'xtatish';
    scanButton.disabled = false;
    scanButton.classList.remove('btn-success', 'loading');
    scanButton.classList.add('btn-danger');
    scanButton.onclick = stopScan; // Tugma funksiyasini o'zgartirish
    
    // Add loading animation to all domain items
    document.querySelectorAll('.domain-item').forEach(item => {
        item.classList.add('scanning');
    });
    
    // Show progress buttons for all domains and hide edit/delete buttons
    document.querySelectorAll('.progress-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });
    
    // Hide edit and delete buttons for all domains
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.style.display = 'none';
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
            
            // Save tool results to localStorage for each domain
            if (data.results) {
                data.results.forEach(result => {
                    if (result.tool_results) {
                        Object.entries(result.tool_results).forEach(([toolName, toolResult]) => {
                            const resultsKey = `tool_results_${result.domain}_${toolName}`;
                            localStorage.setItem(resultsKey, JSON.stringify(toolResult));
                            console.log(`Saved tool results for ${result.domain} - ${toolName}:`, toolResult);
                        });
                    }
                });
            }
            
            // Hide progress buttons for all domains
            document.querySelectorAll('.progress-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            
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
        resetScanButton(scanButton, originalText);
        document.querySelectorAll('.domain-item').forEach(item => {
            item.classList.remove('scanning');
        });
        
        // Hide progress buttons for all domains
        document.querySelectorAll('.progress-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    });
}

function stopScan() {
    console.log('Stopping scan...');
    
    // Show confirmation modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal delete-modal';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h3>⚠️ Tahlilni to\'xtatish</h3>
            </div>
            <div class="custom-modal-body">
                <p>Haqiqatdan <strong>tahlilni to\'xtatishni</strong> xohlaysizmi?</p>
                <p><small>Jarayonda bo\'lgan tahlillar to\'xtatiladi</small></p>
            </div>
            <div class="custom-modal-actions">
                <button class="btn btn-secondary" onclick="closeStopModal()">Yo\'q</button>
                <button class="btn btn-danger" onclick="confirmStopScan()">Ha, to\'xtat</button>
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

function closeStopModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        modal.remove();
    }
}

function confirmStopScan() {
    console.log('Scan stopped by user');
    
    // Close modal
    closeStopModal();
    
    // Call backend API to stop all tools
    fetch('/scaner/stop-all-tools/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Barcha tool\'lar to\'xtatildi', 'success');
        } else {
            showNotification('Tool\'larni to\'xtatishda xatolik: ' + (data.error || 'Noma\'lum xatolik'), 'error');
        }
    })
    .catch(error => {
        console.error('Stop tools error:', error);
        showNotification('Tool\'larni to\'xtatishda xatolik yuz berdi', 'error');
    });
    
    // Reset button to original state
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.textContent = 'Tahlilni boshlash';
        scanButton.classList.remove('btn-danger');
        scanButton.classList.add('btn-success');
        scanButton.onclick = startScan;
        scanButton.id = ''; // ID ni tozalaymiz
    }
    
    // Remove scanning state from domain items
        document.querySelectorAll('.domain-item').forEach(item => {
            item.classList.remove('scanning');
        });
    
    // Hide progress buttons for all domains
    document.querySelectorAll('.progress-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Show edit and delete buttons for all domains
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });
    
    showNotification('Tahlil to\'xtatildi', 'warning');
}

function stopTool(toolType, domain) {
    console.log(`Stopping ${toolType} for domain: ${domain}`);
    
    // Call backend API to stop specific tool
    fetch('/scaner/stop-tool/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            tool_type: toolType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`${toolType} tool to\'xtatildi`, 'success');
            
            // Update UI to show tool is stopped
            const toolElement = document.querySelector(`[data-tool="${toolType}"][data-domain="${domain}"]`);
            if (toolElement) {
                toolElement.classList.remove('running');
                toolElement.classList.add('stopped');
                const statusElement = toolElement.querySelector('.tool-status');
                if (statusElement) {
                    statusElement.textContent = 'To\'xtatildi';
                    statusElement.className = 'tool-status stopped';
                }
            }
        } else {
            showNotification(`${toolType} tool\'ni to\'xtatishda xatolik: ` + (data.error || 'Noma\'lum xatolik'), 'error');
        }
    })
    .catch(error => {
        console.error(`Stop ${toolType} tool error:`, error);
        showNotification(`${toolType} tool\'ni to\'xtatishda xatolik yuz berdi`, 'error');
    });
}

function stopIndividualTool(toolName, domain) {
    console.log(`Stopping individual tool: ${toolName} for domain: ${domain}`);
    
    // Call backend API to stop specific tool
    fetch('/scaner/stop-tool/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            tool_type: toolName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`${toolName} tool to\'xtatildi`, 'success');
            
            // Update UI to show tool is stopped - use unique ID for each tool
            const stopBtn = document.getElementById(`stopToolBtn_${toolName}_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`);
            if (stopBtn) {
                stopBtn.textContent = '✅ To\'xtatildi';
                stopBtn.disabled = true;
                stopBtn.classList.remove('btn-danger');
                stopBtn.classList.add('btn-success');
            }
            
            // Close the streaming connection
            if (window.currentEventSource) {
                window.currentEventSource.close();
                window.currentEventSource = null;
            }
            
            // Update status
            updateToolStatus('stopped', 'To\'xtatildi');
            
        } else {
            showNotification(`${toolName} tool\'ni to\'xtatishda xatolik: ` + (data.error || 'Noma\'lum xatolik'), 'error');
        }
    })
    .catch(error => {
        console.error(`Stop ${toolName} tool error:`, error);
        showNotification(`${toolName} tool\'ni to\'xtatishda xatolik yuz berdi`, 'error');
    });
}

function resetScanButton(scanButton, originalText) {
    scanButton.textContent = originalText;
    scanButton.disabled = false;
    scanButton.classList.remove('btn-danger', 'loading');
    scanButton.classList.add('btn-success');
    scanButton.onclick = startScan;
    scanButton.id = ''; // ID ni tozalaymiz
    
    // Hide progress buttons for all domains
    document.querySelectorAll('.progress-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Show edit and delete buttons for all domains
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });
}

function showDomainProgress(index) {
    console.log(`showDomainProgress called with index: ${index}`);
    const domain = domains[index];
    console.log(`Domain: ${domain}`);
    
    // Get available tools for this domain
    const availableTools = getAvailableToolsForDomain(domain);
    console.log(`Available tools:`, availableTools);
    
    // Create progress modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h3>🔍 Domain Jarayoni</h3>
            </div>
            <div class="custom-modal-body">
                <div class="domain-progress-info">
                    <div class="domain-progress-header">
                        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" 
                             alt="${domain} icon" 
                             class="domain-favicon-progress"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                        <span class="icon-emoji-progress" style="display: none;">🌐</span>
                        <h4>${domain}</h4>
                    </div>
                    
                    <div class="tools-progress">
                        <h5>Mavjud Tool'lar:</h5>
                        <div id="availableToolsList">
                            <!-- Available tools will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="custom-modal-actions">
                <button class="btn btn-primary" onclick="closeProgressModal()">Yopish</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Modal created and appended to body');
    
    // Populate available tools
    populateAvailableTools(availableTools);
    
    // Show modal with animation
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        modal.style.display = 'flex';
        console.log('Modal animation started');
    }, 10);
}

function closeProgressModal() {
    const modal = document.querySelector('.custom-modal');
    if (modal) {
        // Cleanup tool streaming before closing
        cleanupToolStreaming();
        modal.remove();
    }
}

function getAvailableToolsForDomain(domain) {
    console.log(`Getting available tools for domain: ${domain}`);
    
    // Get available tools from localStorage or default tools
    const availableTools = [];
    
    // Check for saved tool parameters - faqat asosiy 4 ta tool
    const tools = ['sqlmap', 'nmap', 'xsstrike', 'gobuster'];
    tools.forEach(toolType => {
        const savedParams = getToolParamsFromStorage(domain, toolType);
        console.log(`${toolType} saved params:`, savedParams);
        
        if (savedParams && savedParams.length > 0) {
            availableTools.push({
                name: toolType,
                displayName: getToolDisplayName(toolType),
                icon: getToolIcon(toolType),
                hasParameters: true
            });
        } else {
            // Add default tools even if no parameters
            availableTools.push({
                name: toolType,
                displayName: getToolDisplayName(toolType),
                icon: getToolIcon(toolType),
                hasParameters: false
            });
        }
    });
    
    console.log('Final available tools:', availableTools);
    return availableTools;
}

function getToolDisplayName(toolType) {
    const displayNames = {
        'nmap': 'Nmap',
        'sqlmap': 'SQLMap',
        'xsstrike': 'XSStrike',
        'gobuster': 'Gobuster'
    };
    return displayNames[toolType] || toolType;
}

function getToolIcon(toolType) {
    const icons = {
        'nmap': '🔍',
        'sqlmap': '💉',
        'xsstrike': '🕷️',
        'gobuster': '📁'
    };
    return icons[toolType] || '⚙️';
}

function renderAvailableTools(tools) {
    if (!tools || tools.length === 0) {
        return '<p class="no-tools">Hech qanday tool mavjud emas</p>';
    }
    
    let html = '';
    tools.forEach((tool, index) => {
        html += `
            <div class="tool-row">
                <div class="tool-name-section">
                    <span class="tool-name">${tool.displayName}</span>
                </div>
                <div class="tool-action-section">
                    <button class="btn btn-small btn-info" onclick="showToolDetails('${tool.name}', ${index})">
                        📊 Logni kuzatish
                    </button>
                </div>
            </div>
        `;
    });
    
    return html;
}

function renderToolStatuses(tools) {
    if (!tools || tools.length === 0) {
        return '<p class="no-tools">Tool holati mavjud emas</p>';
    }
    
    let html = '';
    tools.forEach(tool => {
        html += `
            <div class="tool-progress-item">
                <span class="tool-name">${tool.icon} ${tool.displayName}</span>
                <span class="tool-status pending">Kutilmoqda</span>
            </div>
        `;
    });
    
    return html;
}

function populateAvailableTools(tools) {
    console.log('populateAvailableTools called with:', tools);
    const availableToolsList = document.getElementById('availableToolsList');
    console.log('availableToolsList element:', availableToolsList);
    
    if (availableToolsList) {
        const html = renderAvailableTools(tools);
        console.log('Rendered HTML:', html);
        availableToolsList.innerHTML = html;
    } else {
        console.error('availableToolsList element not found!');
    }
}

function populateToolStatuses(tools) {
    console.log('populateToolStatuses called with:', tools);
    const toolStatusesList = document.getElementById('toolStatusesList');
    console.log('toolStatusesList element:', toolStatusesList);
    
    if (toolStatusesList) {
        const html = renderToolStatuses(tools);
        console.log('Rendered HTML:', html);
        toolStatusesList.innerHTML = html;
    } else {
        console.error('toolStatusesList element not found!');
    }
}

function showToolDetails(toolName, toolIndex) {
    console.log(`showToolDetails called for tool: ${toolName}, index: ${toolIndex}`);
    
    // Get current domain from the modal
    const modal = document.querySelector('.custom-modal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    const domainName = modal.querySelector('h4').textContent;
    console.log(`Domain: ${domainName}`);
    
    // Check if tool is already running
    if (window.currentEventSource && window.currentToolResultsWindow) {
        console.log(`Tool ${toolName} already running, just updating display`);
        // Update tool name in existing window
        updateToolWindowTitle(toolName);
        return;
    }
    
    // Create or update tool results section for real-time output
    createToolResultsSection(toolName, domainName);
    
    // Start real-time streaming using new endpoint
    startToolStreamingRealtime(domainName, toolName);
    
    // Highlight the selected tool
    highlightSelectedTool(toolIndex);
}

function updateToolWindowTitle(toolName) {
    if (window.currentToolResultsWindow) {
        const titleElement = window.currentToolResultsWindow.querySelector('.log-modal-header h3');
        
        if (titleElement) {
            // Extract domain from current title if it exists
            const currentTitle = titleElement.textContent;
            const domainMatch = currentTitle.match(/natijalari - (.+)$/);
            const domain = domainMatch ? domainMatch[1] : '';
            
            titleElement.textContent = `${getToolDisplayName(toolName)} natijalari - ${domain}`;
        }
    }
}

function createToolResultsSection(toolName, domain) {
    // Check if tool results window already exists
    if (window.currentToolResultsWindow) {
        console.log('Tool results window already exists, updating title');
        updateToolWindowTitle(toolName);
        return;
    }
    
    // Yangi log modal oynasini yaratish - header va footer yo'q
    const logModal = document.createElement('div');
    logModal.className = 'log-modal';
    logModal.innerHTML = `
        <div class="log-modal-content">
            <button class="log-modal-close" onclick="closeLogModal()">&times;</button>
            <div class="log-modal-body">
                <div class="log-modal-header">
                    <h3>${toolName} natijalari - ${domain}</h3>
                    <button class="btn btn-danger btn-small" onclick="stopIndividualTool('${toolName}', '${domain}')" id="stopToolBtn_${toolName}_${domain.replace(/[^a-zA-Z0-9]/g, '_')}">
                        ⏹️ To'xtatish
                    </button>
                </div>
                <div class="log-iframe-container">
                    <iframe class="log-iframe" id="toolOutputLog"></iframe>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(logModal);
    
    // Iframe style ni to'g'ridan-to'g'ri o'zgartirish
    const iframe = logModal.querySelector('.log-iframe');
    if (iframe) {
        iframe.style.backgroundColor = '#808C80';
    }
    
    // Show modal with animation
    setTimeout(() => {
        logModal.style.opacity = '1';
        logModal.style.transform = 'scale(1)';
    }, 10);
    
    // Store reference for cleanup
    window.currentToolResultsWindow = logModal;
}

function closeLogModal() {
    if (window.currentToolResultsWindow) {
        // Cleanup streaming
        cleanupToolStreaming();
        
        // Remove modal
        window.currentToolResultsWindow.remove();
        window.currentToolResultsWindow = null;
    }
    
    // "Jarayon" modal oynasini yopmaslik - faqat log modal yopiladi
    // Progress modal ochiq qoladi
}

function startToolStreaming(domain, toolName) {
    // Check if already streaming
    if (window.currentEventSource) {
        console.log(`Already streaming for ${toolName}, stopping previous stream`);
        cleanupToolStreaming();
    }
    
    console.log(`Starting real-time streaming for ${toolName} on ${domain}`);
    
    // Update status
    updateToolStatus('connecting', 'Ulanish ochilmoqda...');
    
    // Create EventSource for Server-Sent Events
    const eventSource = new EventSource(`/scaner/stream-tool-output/${domain}/${toolName}/`);
    
    eventSource.onopen = function(event) {
        updateToolStatus('connected', 'Ulangan');
        appendToolOutput(`${toolName} ga ulanish muvaffaqiyatli ochildi`, 'success');
    };
    
    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received streaming data:', data);
            
            if (data.error) {
                appendToolOutput(`❌ Xatolik: ${data.error}`, 'error');
                updateToolStatus('error', 'Xatolik');
                eventSource.close();
            } else if (data.status === 'starting') {
                appendToolOutput(`🚀 ${data.message}`, 'info');
                updateToolStatus('running', 'Ishga tushirilmoqda...');
            } else if (data.status === 'completed') {
                appendToolOutput(`✅ ${data.message}`, 'success');
                updateToolStatus('completed', 'Tugallandi');
                eventSource.close();
            } else if (data.output) {
                appendToolOutput(data.output, 'output');
                updateToolStatus('running', 'Ishlayapti...');
            } else if (data.interactive) {
                appendToolOutput(`🤖 ${data.interactive}`, 'info');
            }
        } catch (e) {
            console.error('Error parsing streaming data:', e);
            appendToolOutput(`❌ Ma'lumotlarni o'qishda xatolik: ${e.message}`, 'error');
            updateToolStatus('error', 'Xatolik');
        }
    };
    
    eventSource.onerror = function(event) {
        console.error('EventSource error:', event);
        appendToolOutput('❌ Ulanish xatolik yuz berdi', 'error');
        updateToolStatus('error', 'Ulanish xatolik');
        eventSource.close();
    };
    
    // Store eventSource for cleanup
    window.currentEventSource = eventSource;
}

function closeToolResultsWindow() {
    if (window.currentToolResultsWindow) {
        // Cleanup streaming
        cleanupToolStreaming();
        
        // Remove window
        window.currentToolResultsWindow.remove();
        window.currentToolResultsWindow = null;
    }
}

function updateToolStatus(status, message = '') {
    const statusIndicator = document.getElementById('toolStatus');
    if (statusIndicator) {
        statusIndicator.textContent = message || status;
        statusIndicator.className = `status-indicator ${status}`;
    }
}

function appendToolOutput(text, type = 'output') {
    const outputLog = document.getElementById('toolOutputLog');
    if (!outputLog) return;
    
    // Format based on type
    let formattedText = '';
    switch (type) {
        case 'error':
            formattedText = `❌ ${text}\n`;
            break;
        case 'success':
            formattedText = `✅ ${text}\n`;
            break;
        case 'info':
            formattedText = `ℹ️ ${text}\n`;
            break;
        case 'output':
            formattedText = `${text}\n`;
            break;
        default:
            formattedText = `${text}\n`;
    }
    
    // Append to output log
    outputLog.value += formattedText;
    
    // Auto-scroll to bottom
    outputLog.scrollTop = outputLog.scrollHeight;
}

function clearToolOutput() {
    const outputLog = document.getElementById('toolOutputLog');
    if (outputLog) {
        outputLog.value = '';
    }
}

// Cleanup function for when modal is closed
function cleanupToolStreaming() {
    if (window.currentEventSource) {
        window.currentEventSource.close();
        window.currentEventSource = null;
    }
    
    if (window.currentStreamingIframe) {
        window.currentStreamingIframe.remove();
        window.currentStreamingIframe = null;
    }
}

function getToolResults(domain, toolName) {
    // Try to get real results from localStorage
    const resultsKey = `tool_results_${domain}_${toolName}`;
    const savedResults = localStorage.getItem(resultsKey);
    
    if (savedResults) {
        try {
            return JSON.parse(savedResults);
        } catch (e) {
            console.error('Error parsing saved results:', e);
        }
    }
    
    // Return simulated results if no real data
    return getSimulatedToolResults(toolName);
}

function getSimulatedToolResults(toolName) {
    const simulatedResults = {
        'nmap': {
            status: 'completed',
            output: `Starting Nmap 7.97 ( https://nmap.org ) at 2025-08-25 11:31 +0500
Nmap scan report for example.com (93.184.216.34)
Host is up (0.16s latency).
rDNS record for 93.184.216.34: example.com

PORT      STATE  SERVICE
22/tcp    open   ssh
80/tcp    open   http
443/tcp   open   https
3306/tcp  open   mysql

Nmap done: 1 IP address (1 host up) scanned in 16.02 seconds`,
            command_used: `nmap example.com`,
            timestamp: new Date().toISOString()
        },
        'sqlmap': {
            status: 'completed',
            output: `[*] starting @ 11:31:46 /2025-08-25/
[11:31:46] [INFO] testing connection to the target URL
[11:31:46] [INFO] checking if the target is protected by some kind of WAF/IPS
[11:31:46] [INFO] testing for SQL injection on GET parameter 'id'
[11:31:46] [INFO] testing 'AND boolean-based blind - Parameter: id'
[11:31:46] [INFO] testing 'MySQL >= 5.0 AND error-based - Parameter: id'
[11:31:46] [INFO] testing 'PostgreSQL AND error-based - Parameter: id'
[11:31:46] [INFO] no parameter was found to be injectable`,
            command_used: `sqlmap -u https://example.com`,
            timestamp: new Date().toISOString()
        },
        'xsstrike': {
            status: 'completed',
            output: `XSStrike v3.1.5

[~] Checking for DOM vulnerabilities
[-] No parameters to test.
[~] Testing for XSS vulnerabilities
[-] No XSS vulnerabilities found.`,
            command_used: `xsstrike -u https://example.com`,
            timestamp: new Date().toISOString()
        },
        'gobuster': {
            status: 'completed',
            output: `===============================================================
Gobuster v3.7
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:            https://example.com
[+] Method:         GET
[+] Threads:        10
[+] Wordlist:       tools/gobuster/common-files.txt
[+] Negative Status codes:   404
[+] User Agent:     gobuster/3.7
[+] Timeout:        10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/login                (Status: 200) [Size: 5058]
/register             (Status: 200) [Size: 5555]
/admin                (Status: 301) [Size: 236]
/robots.txt           (Status: 200) [Size: 24]
===============================================================
Finished
===============================================================`,
            command_used: `gobuster dir -u https://example.com -w wordlist.txt`,
            timestamp: new Date().toISOString()
        }
    };
    
    return simulatedResults[toolName] || {
        status: 'unknown',
        output: 'Tool natijalari mavjud emas',
        command_used: 'N/A',
        timestamp: new Date().toISOString()
    };
}

function updateToolResults(toolName, results) {
    const toolResultsList = document.getElementById('toolResultsList');
    if (!toolResultsList) {
        console.error('toolResultsList element not found!');
        return;
    }
    
    const toolDisplayName = getToolDisplayName(toolName);
    const toolIcon = getToolIcon(toolName);
    
    const html = `
        <div class="tool-result-detail">
            <div class="tool-result-header">
                <h6>${toolIcon} ${toolDisplayName} Natijalari</h6>
                <span class="tool-result-status ${results.status}">${getStatusText(results.status)}</span>
            </div>
            <div class="tool-result-content">
                <div class="tool-result-info">
                    <p><strong>Buyruq:</strong> <code>${results.command_used}</code></p>
                    <p><strong>Vaqt:</strong> ${new Date(results.timestamp).toLocaleString('uz-UZ')}</p>
                </div>
                <div class="tool-result-output">
                    <h6>Natija:</h6>
                    <pre class="tool-output-log">${results.output}</pre>
                </div>
            </div>
        </div>
    `;
    
    toolResultsList.innerHTML = html;
}

function getStatusText(status) {
    const statusTexts = {
        'completed': '✅ Tugallandi',
        'failed': '❌ Xatolik',
        'running': '⏳ Jarayonda',
        'pending': '⏳ Kutilmoqda',
        'unknown': '❓ Noma\'lum'
    };
    return statusTexts[status] || status;
}

function highlightSelectedTool(toolIndex) {
    // Remove previous highlights
    document.querySelectorAll('.tool-info-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Highlight selected tool
    const toolItems = document.querySelectorAll('.tool-info-item');
    if (toolItems[toolIndex]) {
        toolItems[toolIndex].classList.add('selected');
    }
}

function simulateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const toolStatuses = document.querySelectorAll('.tool-status');
    
    if (!progressFill) {
        console.error('Progress fill element not found!');
        return;
    }
    
    console.log('Starting progress simulation...');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = progress + '%';
        if (progressPercentage) {
            progressPercentage.textContent = Math.round(progress) + '%';
        }
        
        console.log(`Progress: ${Math.round(progress)}%`);
        
        // Update tool statuses
        if (progress > 25 && toolStatuses[0]) {
            toolStatuses[0].textContent = '✅ Tugallandi';
            toolStatuses[0].className = 'tool-status completed';
            console.log('Tool 1 completed');
        }
        if (progress > 50 && toolStatuses[1]) {
            toolStatuses[1].textContent = '✅ Tugallandi';
            toolStatuses[1].className = 'tool-status completed';
            console.log('Tool 2 completed');
        }
        if (progress > 75 && toolStatuses[2]) {
            toolStatuses[2].textContent = '✅ Tugallandi';
            toolStatuses[2].className = 'tool-status completed';
            console.log('Tool 3 completed');
            console.log('Tool 3 completed');
        }
        if (progress > 90 && toolStatuses[3]) {
            toolStatuses[3].textContent = '✅ Tugallandi';
            toolStatuses[3].className = 'tool-status completed';
            console.log('Tool 4 completed');
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            console.log('Progress simulation completed');
        }
    }, 500);
}

function resetDomains() {
    console.log('resetDomains function called'); // Debug log
    
    // Custom modal stil bilan alert (O'chirish tugmasidagi stil bilan bir xil)
    const modal = document.createElement('div');
    modal.className = 'custom-modal delete-modal';
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
    
    // Clear the input field before showing
    const domainsInput = document.getElementById('domainsInput');
    if (domainsInput) {
        domainsInput.value = '';
    }
    
    setTimeout(() => {
        inputSection.classList.remove('fade-in');
        
        // Focus on input
        if (domainsInput) {
        domainsInput.focus();
        }
        
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

function createToolResultsSectionOld(domainName, toolName) {
    // Check if already exists
    if (document.getElementById('toolResultsSection')) {
        document.getElementById('toolResultsSection').remove();
    }
    
    const toolResultsSection = document.createElement('div');
    toolResultsSection.id = 'toolResultsSection';
    toolResultsSection.className = 'tool-results-section';
    
    toolResultsSection.innerHTML = `
        <div class="tool-results-header">
            <h3>${toolName ? toolName.toUpperCase() : 'TOOL'} Natijalari - ${domainName}</h3>
            <div class="tool-status">
                <span>Holat:</span>
                <span id="toolStatus" class="status-indicator">Tayyor</span>
            </div>
            <button class="btn btn-small" onclick="closeToolResultsSection()">Yopish</button>
        </div>
        
        <div class="tool-output-container">
            <div class="tool-output-header">
                <span>Natija:</span>
                <button class="btn btn-small" onclick="clearToolOutput()">Tozalash</button>
            </div>
            <textarea id="toolOutputLog" class="tool-output-log" readonly placeholder="Tool natijasi shu yerda ko'rsatiladi..."></textarea>
        </div>
        
        <div class="tool-actions">
            <button class="btn btn-primary" onclick="startToolStreaming('${domainName}', '${toolName || 'unknown'}')">
                🔍 Natijani ko'rish
            </button>
        </div>
    `;
    
    // Add to page
    const scanContainer = document.querySelector('.scan-container');
    scanContainer.appendChild(toolResultsSection);
    
    // Store reference
    window.currentToolResultsSection = toolResultsSection;
} 

function closeToolResultsSection() {
    if (window.currentToolResultsSection) {
        // Cleanup streaming
        cleanupToolStreaming();
        
        // Remove section
        window.currentToolResultsSection.remove();
        window.currentToolResultsSection = null;
    }
}

function closeToolResultsWindow() {
    if (window.currentToolResultsWindow) {
        // Cleanup streaming
        cleanupToolStreaming();
        
        // Remove window
        window.currentToolResultsWindow.remove();
        window.currentToolResultsWindow = null;
    }
}

function startToolStreamingRealtime(domain, toolName) {
    console.log(`Starting real-time streaming for ${toolName} on ${domain}`);
    
    // Get iframe and set source directly
    const toolOutputLog = document.getElementById('toolOutputLog');
    if (toolOutputLog) {
        console.log('Iframe topildi, src o\'rnatilmoqda...');
        
        // Set iframe source directly
        toolOutputLog.src = `/scaner/stream-log-file/${domain}/${toolName}/`;
        
        // Store iframe reference for cleanup
        window.currentStreamingIframe = toolOutputLog;
        
        console.log(`Iframe src o'rnatildi: ${toolOutputLog.src}`);
    } else {
        console.error('toolOutputLog elementi topilmadi!');
        console.log('Mavjud elementlar:', document.querySelectorAll('iframe'));
    }
}

 
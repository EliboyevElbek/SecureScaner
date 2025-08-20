// Scan Page JavaScript - Professional Design

let domains = [];
let selectedToolParams = {}; // Tanlangan tool parametrlarini saqlash uchun

document.addEventListener('DOMContentLoaded', function() {
    console.log('Scan page loaded');
    
    // Add professional animations
    addProfessionalEffects();
    
    // Check for edited domains when page loads
    checkForEditedDomains();
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
    
    // Update tools preview when domain changes
    editInput.addEventListener('input', function() {
        const newDomain = this.value.trim();
        if (newDomain && isValidDomain(newDomain)) {
            loadToolsPreview(newDomain);
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
    
    // Agar domain bo'sh yoki juda qisqa bo'lsa, tool'larni ko'rsatmaslik
    if (!domain || domain.trim().length < 3) {
        toolsPreviewList.innerHTML = `
            <div class="tool-preview-item info">
                <div class="tool-preview-info">
                    <div class="tool-preview-name">Ma'lumot</div>
                    <div class="tool-preview-command">Domain nomini to'liq kiriting</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Show loading state
    toolsPreviewList.innerHTML = `
        <div class="tool-preview-item loading">
            <div class="tool-preview-info">
                <div class="tool-preview-name">Tool'lar yuklanmoqda...</div>
                <div class="tool-preview-command">Biroz kuting...</div>
            </div>
        </div>
    `;
    
    // Fetch tools from backend with domain-specific commands
    fetch(`/scaner/get-tools-for-domain/?domain=${encodeURIComponent(domain)}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.tools) {
            // Tools data ni global o'zgaruvchiga saqlash
            if (data.tools_data) {
                window.toolsData = data.tools_data;
            }
            // Domain uchun saqlangan tool buyruqlarini olish
            if (data.domain_tool_commands) {
                window.domainToolCommands = data.domain_tool_commands;
            }
            renderToolsPreview(data.tools, domain);
        } else {
            toolsPreviewList.innerHTML = `
                <div class="tool-preview-item error">
                    <div class="tool-preview-info">
                        <div class="tool-preview-name">Xatolik</div>
                        <div class="tool-preview-command">Tool'lar yuklanmadi</div>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Tools yuklash xatosi:', error);
        toolsPreviewList.innerHTML = `
            <div class="tool-preview-item error">
                <div class="tool-preview-info">
                    <div class="tool-preview-name">Xatolik</div>
                    <div class="tool-preview-command">${error.message}</div>
                </div>
            </div>
        `;
    });
}

function renderToolsPreview(tools, domain) {
    const toolsPreviewList = document.getElementById('toolsPreviewList');
    if (!toolsPreviewList) return;
    
    const toolsHtml = tools.map(tool => {
        let command = '';
        
        // Avval bazadan saqlangan tool buyruqlarini tekshirish
        if (window.domainToolCommands && window.domainToolCommands.length > 0) {
            // Bazadan tool buyruqlarini topish
            const savedCommand = window.domainToolCommands.find(cmd => {
                if (typeof cmd === 'object' && cmd[tool.tool_type]) {
                    return true;
                }
                return false;
            });
            
            if (savedCommand && savedCommand[tool.tool_type]) {
                command = savedCommand[tool.tool_type];
            } else {
                // Agar bazada saqlanmagan bo'lsa, default buyruqni ishlatish
                command = getDefaultCommand(tool.tool_type, domain);
            }
        } else {
            // Bazada saqlanmagan bo'lsa, default buyruqni ishlatish
            command = getDefaultCommand(tool.tool_type, domain);
        }
        
        // Avval tanlangan parametrlarni olish (agar mavjud bo'lsa)
        let savedParams = selectedToolParams[tool.tool_type] || [];
        
        // Agar avval tanlangan parametrlar mavjud bo'lmasa, bazadan saqlangan buyruqdan parametrlarni ajratib olish
        if (savedParams.length === 0 && command !== getDefaultCommand(tool.tool_type, domain)) {
            // Bazadan saqlangan buyruqdan parametrlarni ajratib olish
            const baseCommand = getDefaultCommand(tool.tool_type, domain);
            if (command.startsWith(baseCommand)) {
                const extraParams = command.substring(baseCommand.length).trim();
                if (extraParams) {
                    savedParams = extraParams.split(' ');
                    // selectedToolParams ni yangilash
                    if (!selectedToolParams[tool.tool_type]) {
                        selectedToolParams[tool.tool_type] = [];
                    }
                    selectedToolParams[tool.tool_type] = savedParams;
                }
            }
        }
        
        // Agar command allaqachon parametrlar bilan kelgan bo'lsa, ularni qo'shmaslik
        let finalCommand = command;
        if (savedParams.length > 0) {
            // Bazadan saqlangan buyruqda allaqachon parametrlar bor-yo'qligini tekshirish
            const baseCommand = getDefaultCommand(tool.tool_type, domain);
            if (command === baseCommand) {
                // Agar command default buyruq bo'lsa, parametrlarni qo'shish
                finalCommand = `${command} ${savedParams.join(' ')}`;
            } else {
                // Agar command allaqachon parametrlar bilan kelgan bo'lsa, faqat command ni ishlatish
                finalCommand = command;
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
    
    // Get tool parameters based on tool type
    const params = getToolParameters(toolType);
    
    // Create params dropdown
    const paramsDropdown = document.createElement('div');
    paramsDropdown.className = 'tool-params-dropdown';
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
            ${params.map(param => {
                const isChecked = (selectedToolParams[toolType] || []).includes(param.value);
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
    // Global tools data ni ishlatish
    if (window.toolsData && window.toolsData[toolType]) {
        return window.toolsData[toolType].parameters.map(param => ({
            name: param.flag,
            value: param.flag,
            description: param.description
        }));
    }
    
    // Fallback - agar tools data mavjud bo'lmasa
    const fallbackParams = {
        'nmap': [
            { name: '-sS', value: '-sS', description: 'TCP SYN scan (stealth)' },
            { name: '-sV', value: '-sV', description: 'Version detection' },
            { name: '-O', value: '-O', description: 'OS detection' }
        ],
        'sqlmap': [
            { name: '--dbs', value: '--dbs', description: 'Enumerate databases' },
            { name: '--tables', value: '--tables', description: 'Enumerate tables' },
            { name: '--dump', value: '--dump', description: 'Dump database' }
        ],
        'xsstrike': [
            { name: '--crawl', value: '--crawl', description: 'Crawl website' },
            { name: '--blind', value: '--blind', description: 'Blind XSS detection' }
        ],
        'gobuster': [
            { name: 'dir', value: 'dir', description: 'Directory enumeration' },
            { name: '-x php', value: '-x php', description: 'File extensions' }
        ]
    };
    
    return fallbackParams[toolType] || [];
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
        existingParams.style.opacity = '0';
        existingParams.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            existingParams.remove();
        }, 300);
    }
}

function updateToolCommandsForNewDomain(oldDomain, newDomain) {
    // Update tool commands in global variable
    if (selectedToolParams) {
        // Update domain in all tool commands
        Object.keys(selectedToolParams).forEach(toolType => {
            if (selectedToolParams[toolType] && selectedToolParams[toolType].length > 0) {
                // Update domain in tool commands
                selectedToolParams[toolType] = selectedToolParams[toolType].map(param => {
                    // Replace old domain with new domain in parameter values
                    return param.replace(oldDomain, newDomain);
                });
            }
        });
    }
    
    // Avval tanlangan parametrlarni saqlash uchun global o'zgaruvchiga qo'shish
    if (window.domainToolCommands && window.domainToolCommands.length > 0) {
        window.domainToolCommands.forEach(cmd => {
            if (typeof cmd === 'object') {
                Object.keys(cmd).forEach(toolType => {
                    if (!selectedToolParams[toolType]) {
                        selectedToolParams[toolType] = [];
                    }
                    
                    // Bazadan saqlangan buyruqdan parametrlarni ajratib olish
                    const baseCommand = getDefaultCommand(toolType, newDomain);
                    const savedCommand = cmd[toolType];
                    
                    if (savedCommand && savedCommand.startsWith(baseCommand)) {
                        const extraParams = savedCommand.substring(baseCommand.length).trim();
                        if (extraParams) {
                            const params = extraParams.split(' ');
                            // Avval tanlangan parametrlarni qo'shish
                            params.forEach(param => {
                                if (!selectedToolParams[toolType].includes(param)) {
                                    selectedToolParams[toolType].push(param);
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    
    // Avtomatik saqlashni to'xtatish - faqat "Saqlash" tugmasi bosilganda saqlansin
    // saveToolCommandsToBackend(newDomain);
}

function saveToolCommandsToBackend(domain) {
    // Prepare tool commands data
    const toolCommands = [];
    
    // Barcha tool turlarini olish (mavjud tool'lardan yoki global toolsData dan)
    let allToolTypes = ['nmap', 'sqlmap', 'xsstrike', 'gobuster']; // Default tool types
    
    // Agar global toolsData mavjud bo'lsa, undan tool turlarini olish
    if (window.toolsData) {
        allToolTypes = Object.keys(window.toolsData);
    }
    
    // Barcha tool'lar uchun buyruqlarni yaratish
    allToolTypes.forEach(toolType => {
        // Avval tanlangan parametrlarni olish
        const savedParams = selectedToolParams[toolType] || [];
        
        if (savedParams.length > 0) {
            // Agar parametrlar tanlangan bo'lsa, ularni qo'shish
            const baseCommand = getDefaultCommand(toolType, domain);
            const finalCommand = `${baseCommand} ${savedParams.join(' ')}`;
                toolCommands.push({[toolType]: finalCommand});
            } else {
            // Agar parametrlar tanlanmagan bo'lsa, default buyruqni saqlash
            const baseCommand = getDefaultCommand(toolType, domain);
                toolCommands.push({[toolType]: baseCommand});
            }
        });
    
    // Send to backend
    fetch('/scaner/save-tool-commands/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            domain_name: domain,
            tool_commands: toolCommands
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Tool commands saved successfully:', data);
            
            // Tool buyruqlarini saqlagandan keyin bazadan yangi ma'lumotlarni o'qish
            // Bu global o'zgaruvchini yangilaydi
            if (window.domainToolCommands) {
                // Bazadan yangi tool buyruqlarini olish
                fetch(`/scaner/get-tools-for-domain/?domain=${encodeURIComponent(domain)}`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': getCSRFToken()
                    }
                })
                .then(response => response.json())
                .then(toolData => {
                    if (toolData.success && toolData.domain_tool_commands) {
                        // Global o'zgaruvchini yangilash
                        window.domainToolCommands = toolData.domain_tool_commands;
                        console.log('Updated tool commands from database:', window.domainToolCommands);
                    }
                })
                .catch(error => {
                    console.error('Error updating tool commands from database:', error);
                });
            }
        } else {
            console.error('Error saving tool commands:', data.error);
        }
    })
    .catch(error => {
        console.error('Error saving tool commands:', error);
    });
}

function getBaseCommand(toolType, domain) {
    // Avval bazadan saqlangan tool buyruqlarini tekshirish
    if (window.domainToolCommands && window.domainToolCommands.length > 0) {
        // Bazadan tool buyruqlarini topish
        const savedCommand = window.domainToolCommands.find(cmd => {
            if (typeof cmd === 'object' && cmd[toolType]) {
                return true;
            }
            return false;
        });
        
        if (savedCommand && savedCommand[toolType]) {
            return savedCommand[toolType];
        }
    }
    
    // Agar bazada saqlanmagan bo'lsa, default buyruqni ishlatish
    return getDefaultCommand(toolType, domain);
}

function getCommandWithSavedParams(toolType, domain) {
    const baseCommand = getBaseCommand(toolType, domain);
    const savedParams = selectedToolParams[toolType] || [];
    return savedParams.length > 0 ? `${baseCommand} ${savedParams.join(' ')}` : baseCommand;
}

function updateToolCommand(toolType, domain) {
    const toolItem = document.querySelector(`[data-tool-type="${toolType}"]`);
    if (!toolItem) return;
    
    const commandDiv = toolItem.querySelector('.tool-preview-command');
    
    // Saqlangan parametrlarni ishlatish
    const savedParams = selectedToolParams[toolType] || [];
    const baseCommand = getBaseCommand(toolType, domain);
    const finalCommand = savedParams.length > 0 ? `${baseCommand} ${savedParams.join(' ')}` : baseCommand;
    
    commandDiv.textContent = finalCommand;
}

function updateToolCommandInPopup(toolType, domain) {
    // Update popup command preview
    const commandPreview = document.getElementById('commandPreview');
    if (commandPreview) {
        const baseCommand = getBaseCommand(toolType, domain);
        const checkboxes = document.querySelectorAll('.tool-params-dropdown input[type="checkbox"]:checked');
        const selectedParams = Array.from(checkboxes).map(cb => cb.value).join(' ');
        const finalCommand = selectedParams ? `${baseCommand} ${selectedParams}` : baseCommand;
        commandPreview.textContent = finalCommand;
        
        // Tanlangan parametrlarni global o'zgaruvchiga saqlash
        selectedToolParams[toolType] = Array.from(checkboxes).map(cb => cb.value);
    }
    
    // Also update the main tool command
    updateToolCommand(toolType, domain);
    
    // Avtomatik saqlashni to'xtatish - faqat "Saqlash" tugmasi bosilganda saqlansin
    // saveToolCommandsToBackend(domain);
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

    // Domain nomida yoki tool buyruqlarida o'zgarish bor-yo'qligini tekshirish
    let hasChanges = false;
    
    // Domain nomida o'zgarish bor-yo'qligini tekshirish
    if (newDomain !== originalDomain) {
        hasChanges = true;
    }
    
    // Tool buyruqlarida o'zgarish bor-yo'qligini tekshirish
    // Avval tanlangan parametrlarni tekshirish
    if (selectedToolParams) {
        Object.keys(selectedToolParams).forEach(toolType => {
            if (selectedToolParams[toolType] && selectedToolParams[toolType].length > 0) {
                hasChanges = true;
            }
        });
    }
    
    // Agar domain nomida o'zgarish bo'lmasa, lekin tool buyruqlarida o'zgarish bo'lsa ham saqlash kerak
    if (!hasChanges && newDomain === originalDomain) {
        // Tool buyruqlarida o'zgarish bor-yo'qligini qaytadan tekshirish
        if (selectedToolParams) {
            Object.keys(selectedToolParams).forEach(toolType => {
                if (selectedToolParams[toolType] && selectedToolParams[toolType].length > 0) {
                    hasChanges = true;
                }
            });
        }
    }
    
    if (!hasChanges) {
        showNotification('O\'zgarish qilinmadi', 'warning');
        return;
    }

    // Show loading state
    const saveButton = document.querySelector('.edit-modal-compact .btn-primary');
    const originalText = saveButton.textContent;
    saveButton.textContent = '⏳ Saqlanmoqda...';
    saveButton.disabled = true;

    // Agar faqat tool buyruqlarida o'zgarish bo'lsa, domain nomini o'zgartirmaslik
    if (newDomain === originalDomain) {
        // Faqat tool buyruqlarini saqlash
        saveToolCommandsToBackend(originalDomain);
        
        // Close modal
        closeEditModal();
        
        // Re-render domains list
        renderDomains();
        
        showNotification('Tool buyruqlari muvaffaqiyatli saqlandi!', 'success');
        console.log('Tool commands saved successfully');
        return;
    }
    
    // Domain nomini ham o'zgartirish kerak bo'lsa
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
            // Update the domain in the array
            domains[index] = newDomain;
            
            // Update tool commands for the new domain
            updateToolCommandsForNewDomain(originalDomain, newDomain);
            
            // Barcha tool buyruqlarini bazaga saqlash
            saveToolCommandsToBackend(newDomain);
            
            // Domain o'zgartirilgandan keyin yangi domain uchun endpoint chaqirish
            loadToolsPreview(newDomain);
            
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
            
            // Redirect to scan results or show results
            setTimeout(() => {
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

// Default tool buyruqlarini qaytarish uchun funksiya
function getDefaultCommand(toolType, domain) {
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
// Tool Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Matrix rain effect for tool detail page
    createMatrixRain();
    
    // Animate stats on scroll
    animateStatsOnScroll();
    
    // Initialize copy buttons
    initializeCopyButtons();
    
    // Initialize input fields
    initializeInputFields();
    
    // Initialize command builder
    initializeCommandBuilder();
});

// Copy to clipboard functionality
function copyToClipboard(imgElement) {
    const commandElement = imgElement.previousElementSibling;
    const commandText = commandElement.textContent;
    
    // Create temporary textarea for copying
    const textarea = document.createElement('textarea');
    textarea.value = commandText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification('Buyruq nusxalandi!', 'success');
        
        // Change icon temporarily to show success
        const originalSrc = imgElement.src;
        imgElement.style.filter = 'brightness(1.5) saturate(2)';
        imgElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            imgElement.style.filter = 'brightness(0.8)';
            imgElement.style.transform = 'scale(1)';
        }, 2000);
        
    } catch (err) {
        showCopyNotification('Nusxalashda xatolik yuz berdi', 'error');
    }
    
    document.body.removeChild(textarea);
}

// Initialize copy icons with event listeners
function initializeCopyButtons() {
    const copyIcons = document.querySelectorAll('.copy-icon');
    
    copyIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            copyToClipboard(this);
        });
    });
}

// Show copy notification
function showCopyNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `copy-notification copy-notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(45deg, #00ff00, #00cc00)' : 'linear-gradient(45deg, #ff0000, #cc0000)'};
        color: #000;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 255, 0, 0.3);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 600;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Create matrix rain effect
function createMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.1;
    `;
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");
    
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 35);
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Animate stats on scroll
function animateStatsOnScroll() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                
                // Animate number counting
                animateNumber(target, finalValue);
                observer.unobserve(target);
            }
        });
    });
    
    stats.forEach(stat => observer.observe(stat));
}

// Animate number counting
function animateNumber(element, finalValue) {
    let current = 0;
    const increment = Math.ceil(parseInt(finalValue) / 50);
    const timer = setInterval(() => {
        current += increment;
        
        if (current >= parseInt(finalValue)) {
            element.textContent = finalValue;
            clearInterval(timer);
        } else {
            element.textContent = current;
        }
    }, 50);
}

// Add CSS for copy notification
const copyNotificationStyles = `
    .copy-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    }
    
    .copy-notification.show {
        transform: translateX(0);
    }
`;

// Inject copy notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = copyNotificationStyles;
document.head.appendChild(styleSheet);

// Initialize input fields with validation and real-time updates
function initializeInputFields() {
    const inputFields = document.querySelectorAll('.input-field');
    
    inputFields.forEach(input => {
        // Add input event listener for real-time validation
        input.addEventListener('input', function() {
            validateInputField(this);
            updateCommandPreview();
        });
        
        // Add focus and blur effects
        input.addEventListener('focus', function() {
            this.parentElement.style.borderColor = '#00ff00';
            this.parentElement.style.boxShadow = '0 8px 25px rgba(0, 255, 0, 0.2)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.borderColor = '#444';
            this.parentElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            validateInputField(this);
        });
        
        // Initialize validation
        validateInputField(input);
    });
}

// Validate individual input field
function validateInputField(input) {
    const paramKey = input.dataset.paramKey;
    const value = input.value.trim();
    const type = input.type;
    
    // Remove previous validation classes
    input.classList.remove('valid', 'invalid');
    
    // Check if required field is empty
    if (input.hasAttribute('required') && !value) {
        input.classList.add('invalid');
        showFieldError(input, 'Bu maydon majburiy');
        return false;
    }
    
    // Type-specific validation
    if (type === 'number') {
        const numValue = parseFloat(value);
        const min = input.getAttribute('min');
        const max = input.getAttribute('max');
        
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
    
    if (type === 'url' && value) {
        try {
            new URL(value);
        } catch (e) {
            input.classList.add('invalid');
            showFieldError(input, 'Noto\'g\'ri URL format');
            return false;
        }
    }
    
    // If validation passes
    if (value) {
        input.classList.add('valid');
        hideFieldError(input);
    }
    
    return true;
}

// Show field error message
function showFieldError(input, message) {
    // Remove existing error message
    hideFieldError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ff4444;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 68, 68, 0.1);
        border-radius: 4px;
        border-left: 3px solid #ff4444;
    `;
    
    input.parentElement.appendChild(errorDiv);
}

// Hide field error message
function hideFieldError(input) {
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Initialize command builder functionality
function initializeCommandBuilder() {
    // Create command preview section if it doesn't exist
    if (!document.querySelector('.command-preview-section')) {
        createCommandPreviewSection();
    }
    
    // Update command preview initially
    updateCommandPreview();
}

// Create command preview section
function createCommandPreviewSection() {
    const inputsSection = document.querySelector('.inputs-section');
    if (!inputsSection) return;
    
    const previewSection = document.createElement('div');
    previewSection.className = 'command-preview-section';
    previewSection.innerHTML = `
        <h2 class="section-title">Buyruq ko\'rinishi</h2>
        <div class="command-preview-container">
            <div class="command-preview-box">
                <code id="command-preview" class="command-preview-text"></code>
                <button class="copy-command-btn" onclick="copyCommandToClipboard()">
                    <img src="/static/images/copying.png" alt="Nusxalash" class="copy-icon">
                </button>
            </div>
        </div>
    `;
    
    inputsSection.parentNode.insertBefore(previewSection, inputsSection.nextSibling);
}

// Update command preview based on input values
function updateCommandPreview() {
    const previewElement = document.getElementById('command-preview');
    if (!previewElement) return;
    
    const toolName = getToolNameFromPage();
    const command = buildCommandFromInputs(toolName);
    
    previewElement.textContent = command;
}

// Get tool name from page
function getToolNameFromPage() {
    const title = document.querySelector('.tool-detail-title');
    if (title) {
        return title.textContent.toLowerCase();
    }
    return '';
}

// Build command from input values
function buildCommandFromInputs(toolName) {
    let command = toolName;
    
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach(input => {
        const value = input.value.trim();
        const paramKey = input.dataset.paramKey;
        
        if (value) {
            if (paramKey.startsWith('-')) {
                command += ` ${paramKey} ${value}`;
            } else {
                command += ` ${paramKey} ${value}`;
            }
        }
    });
    
    return command;
}

// Copy command to clipboard
function copyCommandToClipboard() {
    const previewElement = document.getElementById('command-preview');
    if (!previewElement) return;
    
    const commandText = previewElement.textContent;
    
    // Create temporary textarea for copying
    const textarea = document.createElement('textarea');
    textarea.value = commandText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification('Buyruq nusxalandi!', 'success');
        
        // Visual feedback
        const copyBtn = document.querySelector('.copy-command-btn');
        if (copyBtn) {
            copyBtn.style.transform = 'scale(1.1)';
            copyBtn.style.filter = 'brightness(1.5)';
            
            setTimeout(() => {
                copyBtn.style.transform = 'scale(1)';
                copyBtn.style.filter = 'brightness(1)';
            }, 1000);
        }
        
    } catch (err) {
        showCopyNotification('Nusxalashda xatolik yuz berdi', 'error');
    }
    
    document.body.removeChild(textarea);
}

// Tool Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Matrix rain effect for tool detail page
    createMatrixRain();
    
    // Animate stats on scroll
    animateStatsOnScroll();
    
    // Initialize copy buttons
    initializeCopyButtons();
});

// Copy to clipboard functionality
function copyToClipboard(button) {
    const commandElement = button.previousElementSibling;
    const commandText = commandElement.textContent;
    
    // Create temporary textarea for copying
    const textarea = document.createElement('textarea');
    textarea.value = commandText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification('Buyruq nusxalandi!', 'success');
        
        // Change button text temporarily
        const originalText = button.textContent;
        button.textContent = 'Nusxalandi!';
        button.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(45deg, #00ff00, #00ffff)';
        }, 2000);
        
    } catch (err) {
        showCopyNotification('Nusxalashda xatolik yuz berdi', 'error');
    }
    
    document.body.removeChild(textarea);
}

// Initialize copy buttons with event listeners
function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
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

// Base JavaScript - Professional Hacker Theme

document.addEventListener('DOMContentLoaded', function() {
    console.log('SiteScaner loaded with professional hacker theme');
    
    // Initialize all effects
    initMatrixRain();
    initGlitchEffects();
    initTypingEffects();
    initButtonEffects();
    initKeyboardNavigation();
    initScrollEffects();
    initParticleEffects();
});

// Enhanced Matrix Rain Effect
function initMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.15;
    `;
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const matrix = "01";
    const matrixArray = matrix.split("");
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * canvas.height;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = `${fontSize}px 'Orbitron', monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            // Add glow effect
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 5;
            ctx.fillText(text, x, y);
            ctx.shadowBlur = 0;
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 40);
}

// Enhanced Glitch Effects
function initGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch, .nav-logo, .hero-title');
    
    glitchElements.forEach(element => {
        setInterval(() => {
            if (Math.random() < 0.03) { // 3% chance every 3 seconds
                element.classList.add('glitch-active');
                setTimeout(() => {
                    element.classList.remove('glitch-active');
                }, 300);
            }
        }, 3000);
    });
}

// Enhanced Typing Effects
function initTypingEffects() {
    const typingElements = document.querySelectorAll('.subtitle, .hero-subtitle');
    
    typingElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.borderRight = '2px solid #00ff00';
        element.style.animation = 'blink 1s infinite';
        
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                element.style.borderRight = 'none';
                element.style.animation = 'none';
            }
        }
        
        // Start typing after a delay
        setTimeout(typeWriter, 1500);
    });
}

// Enhanced Button Effects
function initButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        // Hover effects
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.boxShadow = '0 0 25px rgba(0, 255, 0, 0.6)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.2)';
        });
        
        // Click effects
        button.addEventListener('click', function(e) {
            createRippleEffect(this, e);
        });
    });
}

// Ripple Effect
function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(0, 255, 0, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Enhanced Keyboard Navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+H for home
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/';
        }
        
        // Ctrl+S for scan
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            window.location.href = '/scaner/';
        }
        
        // Ctrl+T for history
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            window.location.href = '/scaner/history/';
        }
        
        // Escape to clear notifications
        if (e.key === 'Escape') {
            clearAllNotifications();
        }
    });
}

// Scroll Effects
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    document.querySelectorAll('.feature-card, .stat-item, .cta-section').forEach(el => {
        observer.observe(el);
    });
}

// Particle Effects
function initParticleEffects() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -2;
        opacity: 0.1;
    `;
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.fillStyle = `rgba(0, 255, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

// Enhanced Loading Animations
function showLoading(element) {
    element.classList.add('loading');
    element.style.position = 'relative';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-ring"></div>
        <div class="spinner-text">Yuklanmoqda...</div>
    `;
    
    element.appendChild(spinner);
}

function hideLoading(element) {
    element.classList.remove('loading');
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Enhanced Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: #00ff00;
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #00ff00;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
    `;
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #00ff00;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;
    
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function removeNotification(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function clearAllNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
        removeNotification(notification);
    });
}

// Add enhanced CSS animations
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
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
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes blink {
        0%, 50% { border-color: #00ff00; }
        51%, 100% { border-color: transparent; }
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .glitch-active {
        animation: glitch 0.3s ease-in-out;
    }
    
    .loading-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }
    
    .spinner-ring {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 255, 0, 0.3);
        border-top: 3px solid #00ff00;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .spinner-text {
        color: #00ff00;
        font-size: 12px;
        font-family: 'Orbitron', monospace;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-icon {
        font-size: 16px;
    }
    
    .notification-message {
        flex-grow: 1;
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(enhancedStyle);

// Global functions
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.clearAllNotifications = clearAllNotifications; 
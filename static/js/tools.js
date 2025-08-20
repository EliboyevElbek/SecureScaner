// Tools Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Tool card hover effects
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Tool button interactions
    const toolButtons = document.querySelectorAll('.tool-btn');
    
    toolButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Button click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Button functionality - only primary button now
            if (this.classList.contains('primary')) {
                showToolDetails(this);
            }
        });
    });

    // Matrix rain effect for tools page
    createMatrixRain();
    
    // Animate stats on scroll
    animateStatsOnScroll();
});

// Show tool details modal
function showToolDetails(button) {
    const toolCard = button.closest('.tool-card');
    const toolName = toolCard.querySelector('.tool-name').textContent;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'tool-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${toolName} - Batafsil ma'lumot</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Bu tool haqida batafsil ma'lumot va foydalanish ko'rsatmalari.</p>
                <div class="tool-info-grid">
                    <div class="info-item">
                        <strong>Versiya:</strong> Latest
                    </div>
                    <div class="info-item">
                        <strong>Platforma:</strong> Cross-platform
                    </div>
                    <div class="info-item">
                        <strong>Litsenziya:</strong> Open Source
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn">Yuklab olish</button>
                <button class="modal-btn secondary">Hujjatlar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
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
    const increment = finalValue === '24/7' ? 1 : Math.ceil(parseInt(finalValue) / 50);
    const timer = setInterval(() => {
        current += increment;
        
        if (finalValue === '24/7') {
            if (current >= 24) {
                element.textContent = '24/7';
                clearInterval(timer);
            } else {
                element.textContent = current + '/7';
            }
        } else {
            if (current >= parseInt(finalValue)) {
                element.textContent = finalValue;
                clearInterval(timer);
            } else {
                element.textContent = current;
            }
        }
    }, 50);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #00ff00, #00ffff);
        color: #000;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 255, 0, 0.3);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 600;
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

// Add CSS for modal
const modalStyles = `
    .tool-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .tool-modal.show {
        opacity: 1;
    }
    
    .modal-content {
        background: linear-gradient(145deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.95));
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 20px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        transform: scale(0.8);
        transition: transform 0.3s ease;
    }
    
    .tool-modal.show .modal-content {
        transform: scale(1);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        padding-bottom: 1rem;
    }
    
    .modal-header h2 {
        color: #00ff00;
        margin: 0;
    }
    
    .modal-close {
        background: none;
        border: none;
        color: #00ff00;
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    
    .modal-close:hover {
        background: rgba(0, 255, 0, 0.1);
        transform: rotate(90deg);
    }
    
    .modal-body {
        margin-bottom: 1.5rem;
        color: #b0b0b0;
        line-height: 1.6;
    }
    
    .tool-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .info-item {
        padding: 0.5rem;
        background: rgba(0, 255, 0, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(0, 255, 0, 0.1);
    }
    
    .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .modal-btn {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        background: linear-gradient(45deg, #00ff00, #00ffff);
        color: #000;
    }
    
    .modal-btn.secondary {
        background: transparent;
        color: #00ff00;
        border: 2px solid #00ff00;
    }
    
    .modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 255, 0, 0.3);
    }
`;

// Inject modal styles
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

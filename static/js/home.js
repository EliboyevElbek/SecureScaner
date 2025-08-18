// Home Page JavaScript Functionality - Professional Design

document.addEventListener('DOMContentLoaded', function() {
    // Matrix rain ni typing tugagandan keyin boshlash, shuning uchun bu yerda o'chirildi
    // initMatrixRain();
    
    // Add staggered animation to feature cards with Intersection Observer
    const featureCards = document.querySelectorAll('.feature-card');
    
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                featureObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    featureCards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        featureObserver.observe(card);
    });

    // Add counter animation to stats with optimized performance
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateCounter(element, target, duration = 2500) {
        let start = 0;
        const increment = target / (duration / 16);
        
        function updateCounter() {
            start += increment;
            if (start < target) {
                if (target.toString().includes('+')) {
                    element.textContent = Math.floor(start) + '+';
                } else if (target.toString().includes('%')) {
                    element.textContent = Math.floor(start) + '%';
                } else if (target.toString().includes('s')) {
                    element.textContent = Math.floor(start) + 's';
                } else {
                    element.textContent = Math.floor(start);
                }
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }
        
        updateCounter();
    }

    // Intersection Observer for stats animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const text = statNumber.textContent;
                
                if (text.includes('+')) {
                    animateCounter(statNumber, parseInt(text), 2500);
                } else if (text.includes('%')) {
                    animateCounter(statNumber, 99.9, 2500);
                } else if (text.includes('s')) {
                    animateCounter(statNumber, 5, 2500);
                } else {
                    animateCounter(statNumber, parseInt(text), 2500);
                }
                
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // Observe stats section
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Optimized parallax effect with requestAnimationFrame
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        
        if (hero) {
            const rate = scrolled * -0.2;
            hero.style.transform = `translateY(${rate}px)`;
        }
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        
        // Matrix rain ni typing bilan birga boshlash
        initMatrixRain();
        
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }

    // Add scroll-triggered animations
    const scrollElements = document.querySelectorAll('.scroll-animate');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    scrollElements.forEach(element => {
        scrollObserver.observe(element);
    });

    // Performance optimization: Limit DOM queries and use will-change
    const animatedElements = document.querySelectorAll('.feature-card, .stat-item, .cta-section');
    animatedElements.forEach(element => {
        element.style.willChange = 'transform, opacity';
    });
});

// Matrix Rain Effect - MORE INTENSE FOR HOME PAGE
function initMatrixRain() {
    const matrixContainer = document.querySelector('.matrix-rain');
    if (!matrixContainer) return;
    
    const columns = Math.min(Math.floor(window.innerWidth / 25), 60); // 80 dan 60 ga kamaytirildi, 25px oraliq
    const characters = '01'; // Faqat 0 va 1
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = (i * (100 / columns)) + '%';
        
        let columnText = '';
        for (let j = 0; j < 35; j++) { // 25 dan 35 ga oshirildi
            columnText += characters[Math.floor(Math.random() * characters.length)] + '\n';
        }
        column.textContent = columnText;

        const animationDuration = 8 + Math.random() * 12; // 8-20 soniya
        const animationDelay = Math.random() * 0.1; // 0-3 dan 0-0.1 ga kamaytirildi (maksimal 100ms)

        column.style.animationDuration = animationDuration + 's';
        column.style.animationDelay = animationDelay + 's';
        
        matrixContainer.appendChild(column);
    }
}

// Add professional effects and animations
function addProfessionalEffects() {
    // Add entrance animations
    const elements = document.querySelectorAll('.feature-card, .stat-item, .cta-section');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Add hover effects to cards
    const cards = document.querySelectorAll('.feature-card, .stat-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        });
    });

    // Add pulse animation to CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        setInterval(() => {
            ctaButton.style.transform = 'scale(1.05)';
            setTimeout(() => {
                ctaButton.style.transform = 'scale(1)';
            }, 200);
        }, 3000);
    }
}

// Initialize professional effects
document.addEventListener('DOMContentLoaded', function() {
    addProfessionalEffects();
}); 
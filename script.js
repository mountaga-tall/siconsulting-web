document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation des icônes Lucide
    lucide.createIcons();

    // Année dynamique dans le footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // 2. Halo lumineux suivant le curseur
    const cursorGlow = document.getElementById('cursorGlow');
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
    });

    // 3. Navbar sticky au défilement & Menu Mobile
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // 4. Révélation fluide au scroll (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(el => revealObserver.observe(el));

    // 5. Compteurs animés (Stats Hero)
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 1800;
        const stepTime = Math.max(Math.floor(duration / target), 20);
        let current = 0;

        const timer = setInterval(() => {
            current += 1;
            counter.textContent = current;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            }
        }, stepTime);
    });

    // 6. Effet 3D Tilt sur les cartes produits
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // 7. Pré-remplissage intelligent du formulaire depuis les cartes
    const productSelect = document.getElementById('productSelect');
    document.querySelectorAll('.select-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const productName = card.getAttribute('data-product');
            productSelect.value = productName;
            document.getElementById('devis').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 8. Envoi de la demande de devis vers WhatsApp
    // IMPORTANT : Remplacez le numéro ci-dessous par le numéro WhatsApp officiel de SI Consulting SARL (format international sans +)
    const WHATSAPP_NUMBER = "2250700000000"; 

    document.getElementById('quoteForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const country = document.getElementById('country').value.trim();
        const product = productSelect.value;
        const message = document.getElementById('message').value.trim();

        const text = `*NOUVELLE DEMANDE DE DEVIS - SI CONSULTING*%0A` +
                     `-----------------------------------%0A` +
                     `*Client :* ${encodeURIComponent(name)}%0A` +
                     `*Téléphone :* ${encodeURIComponent(phone)}%0A` +
                     `*Pays :* ${encodeURIComponent(country)}%0A` +
                     `*Solution :* ${encodeURIComponent(product)}%0A` +
                     `*Détails :* ${encodeURIComponent(message || 'Demande de catalogue / tarifs')}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    });

    // 9. Canvas Particules Dorées & Émeraudes (Rappel des braises du logo)
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.2 + 0.5;
            this.speedY = -(Math.random() * 0.45 + 0.15);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.color = Math.random() > 0.35 ? 'rgba(245, 158, 11, 0.55)' : 'rgba(16, 185, 129, 0.5)';
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 65; i++) particles.push(new Particle());

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
});

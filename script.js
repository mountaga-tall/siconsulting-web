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

    // 4. Révélation fluide au scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

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

    // 7. Onglets Fiches Techniques
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    // 8. Pré-remplissage intelligent du formulaire depuis les cartes et onglets
    const productSelect = document.getElementById('productSelect');

    document.querySelectorAll('.select-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            productSelect.value = card.getAttribute('data-product');
            document.getElementById('devis').scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.select-product-direct').forEach(btn => {
        btn.addEventListener('click', () => {
            productSelect.value = btn.getAttribute('data-product');
            document.getElementById('devis').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 9. Envoi de la demande de devis via WhatsApp ou Email
    function getFormData() {
        return {
            whatsappNumber: document.getElementById('whatsappLine').value,
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            country: document.getElementById('country').value.trim(),
            product: productSelect.value,
            message: document.getElementById('message').value.trim() || 'Demande de catalogue / tarifs'
        };
    }

    document.getElementById('quoteForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getFormData();

        const text = `*NOUVELLE DEMANDE DE DEVIS - SI CONSULTING*%0A` +
                     `-----------------------------------%0A` +
                     `*Client :* ${encodeURIComponent(data.name)}%0A` +
                     `*Téléphone :* ${encodeURIComponent(data.phone)}%0A` +
                     `*Pays :* ${encodeURIComponent(data.country)}%0A` +
                     `*Solution :* ${encodeURIComponent(data.product)}%0A` +
                     `*Détails :* ${encodeURIComponent(data.message)}`;

        window.open(`https://wa.me/${data.whatsappNumber}?text=${text}`, '_blank');
    });

    document.getElementById('emailSubmitBtn').addEventListener('click', () => {
        const form = document.getElementById('quoteForm');
        if (!form.reportValidity()) return;

        const data = getFormData();
        const subject = encodeURIComponent(`Demande de devis - ${data.product} (${data.name})`);
        const body = encodeURIComponent(
            `Bonjour SI Consulting SARL,\n\n` +
            `Client / Société : ${data.name}\n` +
            `Téléphone : ${data.phone}\n` +
            `Pays : ${data.country}\n` +
            `Solution recherchée : ${data.product}\n` +
            `Détails : ${data.message}\n\n` +
            `Cordialement.`
        );

        window.location.href = `mailto:info@siconsulting.com?subject=${subject}&body=${body}`;
    });

    // 10. Canvas Particules Dorées & Émeraudes
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

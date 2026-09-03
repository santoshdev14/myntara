import './style.css';
import { initBackgroundScene, initHeroGlobe } from './scene3d';
import { gsap } from 'gsap';

// Initialize 3D WebGL components
document.addEventListener('DOMContentLoaded', () => {
  // Init background star constellation
  initBackgroundScene();
  
  // Init hero digital rotating globe
  initHeroGlobe();
  
  // Init UX details (card tilt, nav events, forms, scroll anims)
  initNavbarScroll();
  initMobileNav();
  init3DTiltEffects();
  initContactFormValidation();
  initScrollAnimations();
});

/* =========================================================================
   1. STICKY NAVBAR & ACTIVE NAVIGATION LINK HIGHLIGHTING
   ========================================================================= */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  const updateActiveSection = () => {
    // Add scrolled class for glassmorphic elevation shadow
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Determine current section in viewport to highlight corresponding link
    let currentSectionId = 'hero';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });

    drawerLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection();
}

/* =========================================================================
   2. MOBILE NAVIGATION DRAWER & MENU TOGGLE
   ========================================================================= */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const closeBtn = document.getElementById('mobile-close');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-backdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link, .drawer-btn');

  if (!toggleBtn || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const toggleDrawer = () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  toggleBtn.addEventListener('click', toggleDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Close drawer when link inside drawer is clicked
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  // Handle escape key to close drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* =========================================================================
   3. CUSTOM 3D CARD TILT & REFLECTION GLARE EFFECTS
   ========================================================================= */
function init3DTiltEffects() {
  const cards = document.querySelectorAll('[data-tilt]');
  
  cards.forEach(card => {
    // Inject custom glow/glare element inside cards dynamically
    const glare = document.createElement('div');
    glare.className = 'card-glare-overlay';
    
    // Style the glare dynamically so it sits on top with absolute positioning
    Object.assign(glare.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      borderRadius: 'inherit',
      background: 'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 80%)',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      zIndex: '2'
    });
    
    card.style.position = 'relative';
    card.appendChild(glare);

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // Mouse relative X inside card
      const y = e.clientY - rect.top;  // Mouse relative Y inside card
      
      const width = rect.width;
      const height = rect.height;
      
      // Calculate rotation angles based on offset from center (-10 to 10 deg range)
      const rotateX = -((y / height) - 0.5) * 12; 
      const rotateY = ((x / width) - 0.5) * 12;

      // Apply transform & rotation using native inline CSS
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      
      // Track glare highlight angle relative to cursor
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(circle at ${(x / width) * 100}% ${(y / height) * 100}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`;
    });

    card.addEventListener('mouseleave', () => {
      // Smooth reset back to initial positions
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      glare.style.opacity = '0';
    });
  });
}

/* =========================================================================
   4. CONTACT FORM VALIDATION & HIGH-TECH SUCCESS LOADER
   ========================================================================= */
function initContactFormValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = [
    { id: 'name', errorId: 'name-error', validate: val => val.trim() !== '', msg: 'Please enter your name.' },
    { id: 'email', errorId: 'email-error', validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), msg: 'Please enter a valid email address.' },
    { id: 'subject', errorId: 'subject-error', validate: val => val.trim() !== '', msg: 'Please enter a subject.' },
    { id: 'message', errorId: 'message-error', validate: val => val.trim().length >= 10, msg: 'Message must be at least 10 characters long.' }
  ];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    // Reset error classes and text messages
    fields.forEach(field => {
      const input = document.getElementById(field.id);
      const errorSpan = document.getElementById(field.errorId);
      input.classList.remove('invalid-input');
      errorSpan.textContent = '';
      
      if (!field.validate(input.value)) {
        input.classList.add('invalid-input');
        errorSpan.textContent = field.msg;
        isValid = false;
      }
    });

    if (isValid) {
      const submitBtn = document.getElementById('submit-btn');
      const statusDiv = document.getElementById('form-status');
      
      // Animate submit button as sending
      const btnText = submitBtn.querySelector('span');
      btnText.textContent = 'Sending Message...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Simulate API submit delay
      setTimeout(() => {
        btnText.textContent = 'Send Message';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';

        statusDiv.className = 'form-status success';
        statusDiv.textContent = 'Thank you! Your message has been sent successfully.';
        
        form.reset();

        // Clear success notification after 5 seconds
        setTimeout(() => {
          statusDiv.textContent = '';
        }, 5000);
      }, 800);
    }
  });

  // Dynamic input listener to clear error messages while typing
  fields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorSpan = document.getElementById(field.errorId);
    
    input.addEventListener('input', () => {
      if (field.validate(input.value)) {
        input.classList.remove('invalid-input');
        errorSpan.textContent = '';
      }
    });
  });
}

/* =========================================================================
   5. GSAP SCROLL-TRIGGERED INTRO ANIMATIONS
   ========================================================================= */
function initScrollAnimations() {
  // Title reveal animation on load
  gsap.fromTo('.animate-title', 
    { opacity: 0, y: 30 }, 
    { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.2 }
  );

  // Subtitle fade in
  gsap.fromTo('.hero-subtitle', 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.4 }
  );

  // Tags and buttons fade in
  gsap.fromTo('.hero-tags, .hero-ctas', 
    { opacity: 0, y: 15 }, 
    { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', stagger: 0.15, delay: 0.6 }
  );
  
  // Three.js Canvas container fade in
  gsap.fromTo('.hero-3d-container', 
    { opacity: 0, scale: 0.95 }, 
    { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out', delay: 0.8 }
  );
}

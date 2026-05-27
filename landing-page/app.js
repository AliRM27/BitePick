document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. Theme Switcher (Dark-First Default)
     ========================================================================== */
  const themeToggle = document.getElementById('theme-toggle');
  
  // Set theme helper
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cupmap-theme', theme);
  };

  // Initial state check
  const savedTheme = localStorage.getItem('cupmap-theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (systemPrefersLight) {
    // If system is explicitly light, follow it, otherwise default to dark
    setTheme('light');
  } else {
    setTheme('dark');
  }

  // Toggle action
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    });
  }

  /* ==========================================================================
     2. Mobile Navigation Menu
     ========================================================================== */
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      
      // Toggle menu icon state (hamburger vs close icon)
      const isActive = navLinks.classList.contains('active');
      mobileMenuToggle.innerHTML = isActive 
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`;
    });
    
    // Close mobile menu when clicking on links
    const linkItems = navLinks.querySelectorAll('a');
    linkItems.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`;
      });
    });
  }

  /* ==========================================================================
     3. Rotating Tagline Carousel
     ========================================================================== */
  const taglineSlides = document.querySelectorAll('.tagline-slide');
  if (taglineSlides.length > 0) {
    let currentSlide = 0;
    
    const showNextSlide = () => {
      taglineSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % taglineSlides.length;
      taglineSlides[currentSlide].classList.add('active');
    };
    
    // Switch slides every 3 seconds
    setInterval(showNextSlide, 3200);
  }

  /* ==========================================================================
     4. App Simulator Widget Logic (Interactive Phone UI)
     ========================================================================== */
  // Mock Data
  const mockDatabase = {
    food: [
      { name: "Taco Fiesta 🌮", rating: 4.8, reviews: 142, desc: "Crispy, savory street tacos and freshly crushed guacamole.", time: "2 min away", mode: "Walking" },
      { name: "Ramen Ichiban 🍜", rating: 4.9, reviews: 312, desc: "Slow-simmered rich tonkotsu broth, house-pulled noodles, and soy-marinated egg.", time: "5 min away", mode: "Driving" },
      { name: "Pizza Paradiso 🍕", rating: 4.7, reviews: 250, desc: "Wood-fired artisanal pizzas topped with locally sourced ingredients.", time: "8 min away", mode: "Driving" },
      { name: "Burger Bistro 🍔", rating: 4.6, reviews: 180, desc: "Gourmet grass-fed beef burgers topped with caramelized onions and truffle aioli.", time: "4 min away", mode: "Walking" },
      { name: "Sushi Zen 🍣", rating: 4.9, reviews: 420, desc: "Ultra-fresh hand-cut sashimi and creative signature rolls by chef selection.", time: "6 min away", mode: "Driving" }
    ],
    coffee: [
      { name: "Daily Grind ☕", rating: 4.7, reviews: 88, desc: "Micro-lot specialty pour-overs, single-origin espressos, and freshly baked pastries.", time: "3 min away", mode: "Walking" },
      { name: "Caffeine Lab 🧪", rating: 4.8, reviews: 165, desc: "Cold brews infused with nitrogen on tap and house syrups.", time: "5 min away", mode: "Walking" },
      { name: "Cozy Cup 🥐", rating: 4.9, reviews: 110, desc: "Quiet atmosphere, artisanal espresso macchiatos, and warm flaky croissants.", time: "7 min away", mode: "Walking" },
      { name: "Bean & Brew 🔋", rating: 4.5, reviews: 95, desc: "Rapid service, bold custom signature roasts, and organic matcha green tea.", time: "2 min away", mode: "Walking" }
    ]
  };

  // Selectors
  const simCatPills = document.querySelectorAll('.sim-cat-pill');
  const simRadiusOpts = document.querySelectorAll('.sim-radius-opt');
  const simRadiusValueText = document.getElementById('sim-radius-value');
  const simPickBtn = document.getElementById('sim-pick-btn');
  const simBtnText = document.getElementById('sim-btn-text');
  const simLoader = document.getElementById('sim-loader');
  
  const simResultOverlay = document.getElementById('sim-result-overlay');
  const simBackBtn = document.getElementById('sim-back-btn');
  const simCardTitle = document.getElementById('sim-card-title');
  const simCardReviews = document.getElementById('sim-card-reviews');
  const simCardDesc = document.getElementById('sim-card-desc');
  const simCardMeta = document.getElementById('sim-card-meta');
  const simStarsContainer = document.getElementById('sim-stars-container');

  let selectedCategory = 'coffee'; // matches default active pill in html
  let selectedRadius = 1000;

  // Category selection handler
  simCatPills.forEach(pill => {
    pill.addEventListener('click', () => {
      simCatPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedCategory = pill.dataset.cat;
    });
  });

  // Radius selection handler
  simRadiusOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      simRadiusOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedRadius = parseInt(opt.dataset.meters);
      
      const label = opt.textContent;
      if (simRadiusValueText) {
        simRadiusValueText.textContent = label;
      }
    });
  });

  // "Pick for me" button handler
  if (simPickBtn) {
    simPickBtn.addEventListener('click', () => {
      // 1. Show loading state
      simPickBtn.disabled = true;
      if (simBtnText) simBtnText.textContent = 'Finding your spot...';
      if (simLoader) simLoader.style.display = 'block';

      // 2. Simulate network wait
      setTimeout(() => {
        // Pick random entry from category
        const options = mockDatabase[selectedCategory];
        const randomPick = options[Math.floor(Math.random() * options.length)];
        
        // 3. Inject data to Result Overlay
        if (simCardTitle) simCardTitle.textContent = randomPick.name;
        if (simCardReviews) simCardReviews.textContent = `${randomPick.rating} (${randomPick.reviews} reviews)`;
        if (simCardDesc) simCardDesc.textContent = randomPick.desc;
        if (simCardMeta) simCardMeta.textContent = `${randomPick.mode} • ${randomPick.time} (${selectedRadius >= 3000 ? 'Expanded Area' : 'Nearby'})`;
        
        // Fill stars
        if (simStarsContainer) {
          simStarsContainer.innerHTML = '';
          const fullStars = Math.floor(randomPick.rating);
          for (let i = 0; i < 5; i++) {
            const star = document.createElement('span');
            star.innerHTML = i < fullStars ? '★' : '☆';
            simStarsContainer.appendChild(star);
          }
        }

        // Reset button loading state
        simPickBtn.disabled = false;
        if (simBtnText) simBtnText.textContent = 'Pick for me';
        if (simLoader) simLoader.style.display = 'none';

        // 4. Reveal overlay
        if (simResultOverlay) {
          simResultOverlay.classList.add('active');
        }
      }, 1200);
    });
  }

  // Back button handler from overlay
  if (simBackBtn) {
    simBackBtn.addEventListener('click', () => {
      if (simResultOverlay) {
        simResultOverlay.classList.remove('active');
      }
    });
  }

});


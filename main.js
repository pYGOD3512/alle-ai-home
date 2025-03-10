import './style.css'
import $ from 'jquery'
import AOS from 'aos'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Initialize AOS
AOS.init({
  duration: 1000,
  once: true,
  offset: 100
})

// Initialize Three.js
const container = document.getElementById('threejs-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

// Create renderer with smaller size
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Add orbit controls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.enableZoom = false; // Disable zooming for better UX

// Function to create circular sprites
function createCircularSprite(imagePath) {
  // Create a canvas to draw the circular image
  const canvas = document.createElement('canvas');
  canvas.classList.add('solar-ai')
  const size = 400; // Canvas size (power of 2 for textures)
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Load the image
  const img = new Image();
  img.onload = () => {
    // Draw circular clipping path
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Draw image with white circular background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // Calculate dimensions to maintain aspect ratio
    const aspectRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (aspectRatio > 1) {
      drawHeight = size;
      drawWidth = size * aspectRatio;
      offsetX = (size - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = size;
      drawHeight = size / aspectRatio;
      offsetX = 0;
      offsetY = (size - drawHeight) / 2;
    }
    
    // Draw the image centered
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Update the texture
    texture.needsUpdate = true;
  };
  img.src = imagePath;
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  
  return { sprite, texture };
}

// Function to create orbit line
function createOrbitLine(radius, yFactor = 0.8) {
  const points = [];
  const segments = 128; // More segments for smoother curves
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * yFactor,
        0
      )
    );
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color: 0xcccccc, 
    transparent: true, 
    opacity: 0.15 // More subtle orbit lines
  });
  return new THREE.Line(geometry, material);
}

// Load central logo texture
const centralLogoTexture = new THREE.TextureLoader().load('/logos/logo-desktop-mini-dark.png');
const centralLogoMaterial = new THREE.SpriteMaterial({ map: centralLogoTexture });
const centralLogo = new THREE.Sprite(centralLogoMaterial);
centralLogo.scale.set(3, 3, 3); // Increased from 2, 2, 2
scene.add(centralLogo);

// Create orbiting logos with visible orbits
const logos = [
  '/logos/amazon.png',
  '/logos/anthropic.png',
  '/logos/claude-3.png',
  '/logos/dall-e.png',
  '/logos/deepseek.png',
  '/logos/gemini.png',
  '/logos/grok.png',
  '/logos/mistral.png',
  '/logos/stability-ai.png',
  '/logos/meta-ai.png',
  '/logos/qwen-ai.png',
  '/logos/yi.png',
];

// Function to create orbiting logos with circular masks
const orbitingLogos = logos.map((logo, index) => {
  const { sprite, texture } = createCircularSprite(logo);
  sprite.scale.set(1.8, 1.8, 1.8); // Increased from 1.0, 1.0, 1.0
  
  // Calculate shell parameters
  const shellIndex = Math.floor(index / 3); // 3 logos per shell
  const logoInShell = index % 3;
  
  // Increasing radius for each shell
  const radius = 4.5 + (shellIndex * 2.2); // Increased from 3 + (shellIndex * 1.5)
  
  // Distribute logos evenly in shell
  const angle = (logoInShell / 3) * Math.PI * 2;
  
  // Create unique rotation angles for each shell
  const xRotation = shellIndex * Math.PI / 3; // 60-degree tilt between shells
  const yRotation = shellIndex * Math.PI / 4; // 45-degree Y rotation between shells
  const zRotation = shellIndex * Math.PI / 6; // 30-degree Z rotation for more complexity
  
  // Create and add orbit line with multiple rotations
  const orbitLine = createOrbitLine(radius, 0.8); // Slightly elliptical
  orbitLine.rotation.x = xRotation;
  orbitLine.rotation.y = yRotation;
  orbitLine.rotation.z = zRotation;
  scene.add(orbitLine);
  
  // Create a group for each logo to handle complex rotation
  const group = new THREE.Group();
  group.add(sprite);
  group.rotation.x = xRotation;
  group.rotation.y = yRotation;
  group.rotation.z = zRotation;
  scene.add(group);
  
  // Position sprite on its orbit
  sprite.position.set(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * 0.8, // Elliptical orbit
    0
  );
  
  return {
    sprite,
    texture,
    group,
    orbitSpeed: 0.0004 * (1 / (shellIndex + 1)), // Outer shells move slower
    radius,
    shellIndex,
    angleInShell: angle,
    xRotation,
    yRotation,
    zRotation
  };
});

// Animation loop with more complex movement
function animate() {
  requestAnimationFrame(animate);
  
  orbitingLogos.forEach((logo) => {
    const time = Date.now();
    
    // Calculate complex orbital motion
    const angle = logo.angleInShell + time * logo.orbitSpeed;
    const verticalOffset = Math.sin(time * 0.001 + logo.shellIndex) * 0.2; // Subtle vertical wobble
    
    // Update position with elliptical orbit and vertical motion
    logo.sprite.position.set(
      Math.cos(angle) * logo.radius,
      (Math.sin(angle) * logo.radius * 0.8) + verticalOffset,
      0
    );
    
    // Add subtle rotation to the entire shell
    logo.group.rotation.x = logo.xRotation + Math.sin(time * 0.0002) * 0.1;
    logo.group.rotation.y = logo.yRotation + time * 0.0001;
    logo.group.rotation.z = logo.zRotation + Math.cos(time * 0.0003) * 0.1;
  });
  
  controls.update();
  renderer.render(scene, camera);
}

// Adjust camera position for the larger scene
camera.position.set(16, 10, 16); // Increased from 12, 8, 12
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Add CSS to make the container smaller
const style = document.createElement('style');
style.textContent = `
  #threejs-container {
    width: 300px;
    height: 30rem;
    margin: 0 auto;
  }
  
  @media (max-width: 768px) {
    #threejs-container {
      width: 250px;
      height: 250px;
    }
  }
`;
document.head.appendChild(style);

// Start the animation
animate();

// Initialize Swiper
const swiper = new Swiper('.testimonials-slider', {
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
})

$(document).ready(function() {
  // Smooth scrolling for navigation links
  $('nav a').on('click', function(e) {
    e.preventDefault()
    const target = $(this).attr('href')
    $('html, body').animate({
      scrollTop: $(target).offset().top - 80
    }, 800)
  })

  // Mobile menu toggle
  $('.menu-toggle').on('click', function() {
    $('.nav-center, .nav-right').toggleClass('active')
  })

  // Navbar background change on scroll
  $(window).scroll(function() {
    if ($(window).scrollTop() > 50) {
      $('nav').addClass('scrolled')
    } else {
      $('nav').removeClass('scrolled')
    }
  })

  // Form submission
  $('#demo-form').on('submit', function(e) {
    e.preventDefault()
    const email = $(this).find('input[type="email"]').val()
    alert('Thank you! We will contact you at: ' + email)
    $(this).find('input[type="email"]').val('')
  })

  // Close mobile menu on link click
  $('.nav-center a, .nav-right button').on('click', function() {
    if ($(window).width() < 768) {
      $('.nav-center, .nav-right').removeClass('active')
    }
  })
})

// Remove the video modal event listeners and related code
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the image modal after DOM content is loaded
  setTimeout(initImageModal, 1000);
});

class FeaturePreview {
  constructor(element, images) {
    this.element = element;
    this.images = images;
    this.currentIndex = 0;
    this.currentTheme = 'light';
    this.autoPlayInterval = null;
    this.isRTL = this.element.closest('.feature-block').matches(':nth-child(even)');
    this.featureType = this.element.closest('.feature-block').dataset.featureType || '';
    
    this.init();
  }

  init() {
    this.carouselContainer = this.element.querySelector('.carousel-container');
    this.loadImages();
    
    this.themeToggle = this.element.querySelector('.theme-toggle');
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    this.startAutoPlay();
    
    this.element.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.element.addEventListener('mouseleave', () => this.startAutoPlay());
  }

  loadImages() {
    this.carouselContainer.innerHTML = '';
    const currentImages = this.images[this.currentTheme];
    
    currentImages.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Feature Preview';
      img.loading = 'lazy';
      img.classList.add('clickable-preview');
      img.dataset.index = index;
      img.dataset.theme = this.currentTheme;
      img.dataset.featureType = this.featureType;
      
      // Add click event listener directly to each image
      img.addEventListener('click', function() {
        const featureType = this.dataset.featureType;
        const index = parseInt(this.dataset.index || 0);
        const theme = this.dataset.theme || 'light';
        
        if (!featurePreviews[featureType]) {
          console.error(`Feature type "${featureType}" not found in featurePreviews`);
          return;
        }
        
        const images = featurePreviews[featureType][theme];
        const captions = featurePreviews[featureType].captions || [];
        
        // Find the modal elements
        const modal = document.querySelector('.feature-modal');
        if (modal && typeof openModal === 'function') {
          openModal(images, index, captions);
        } else {
          console.error('Modal elements or openModal function not found');
        }
      });
      
      this.carouselContainer.appendChild(img);
    });
    
    // Immediately update carousel to maintain current position
    this.updateCarousel();
  }

  updateCarousel() {
    const offset = this.currentIndex * 100;
    // Apply transform based on direction
    this.carouselContainer.style.transform = this.isRTL ? 
      `translateX(${offset}%)` : 
      `translateX(-${offset}%)`;
  }

  toggleTheme() {
    // Keep track of current theme and position
    const previousTheme = this.currentTheme;
    const previousImages = this.images[previousTheme];
    
    // Switch theme
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.element.dataset.theme = this.currentTheme;
    this.themeToggle.dataset.theme = this.currentTheme;
    this.loadImages();
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images[this.currentTheme].length;
      this.updateCarousel();
    }, 3000);
  }

  stopAutoPlay() {
    clearInterval(this.autoPlayInterval);
  }
}

// Add a modal to the DOM
function createImageModal() {
  const modalHTML = `
    <div class="feature-modal">
      <span class="modal-close">&times;</span>
      <div class="modal-content">
        <img src="" class="modal-image" />
        <p class="modal-caption"></p>
        <div class="modal-navigation">
          <span class="modal-counter">1/1</span>
        </div>
      </div>
      <div class="modal-side-nav">
        <button type="button" class="modal-side-prev">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button type="button" class="modal-side-next">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="modal-thumbnails"></div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  return {
    modal: document.querySelector('.feature-modal'),
    close: document.querySelector('.modal-close'),
    image: document.querySelector('.modal-image'),
    caption: document.querySelector('.modal-caption'),
    counter: document.querySelector('.modal-counter'),
    sidePrev: document.querySelector('.modal-side-prev'),
    sideNext: document.querySelector('.modal-side-next'),
    thumbnails: document.querySelector('.modal-thumbnails')
  };
}

// Function to close the modal
function closeModal() {
  const modal = document.querySelector('.feature-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Remove swipe detection
    removeSwipeDetection();
  }
}

// Function to go to the next image
function goToNext() {
  if (currentIndex < currentImages.length - 1) {
    currentIndex++;
  } else {
    currentIndex = 0; // Loop back to the first image
  }
  updateModalContent();
}

// Function to go to the previous image
function goToPrevious() {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = currentImages.length - 1; // Loop to the last image
  }
  updateModalContent();
}

// Initialize the image modal functionality
function initImageModal() {
  // Create modal elements
  const modal = createImageModal();
  
  // Current state for the modal - make these globally accessible
  window.currentImages = [];
  window.currentIndex = 0;
  window.currentCaptions = [];
  
  // Function to update modal content
  window.updateModalContent = function() {
    modal.image.src = currentImages[currentIndex];
    modal.caption.textContent = currentCaptions[currentIndex] || '';
    modal.counter.textContent = `${currentIndex + 1}/${currentImages.length}`;
    
    // Position the modal content in the current viewport
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Center the modal content in the current viewport
    modal.modal.style.top = `${scrollTop}px`;
    modal.content = modal.modal.querySelector('.modal-content');
    modal.content.style.maxHeight = `${viewportHeight * 0.9}px`;
    
    // Update thumbnails to highlight current image
    const thumbnailElements = modal.thumbnails.querySelectorAll('.modal-thumbnail');
    thumbnailElements.forEach((thumb, idx) => {
      if (idx === currentIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  };
  
  // Function to generate thumbnails
  function generateThumbnails() {
    modal.thumbnails.innerHTML = '';
    
    currentImages.forEach((src, idx) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'modal-thumbnail';
      if (idx === currentIndex) thumbnail.classList.add('active');
      
      const thumbImg = document.createElement('img');
      thumbImg.src = src;
      thumbImg.alt = currentCaptions[idx] || `Image ${idx + 1}`;
      
      thumbnail.appendChild(thumbImg);
      thumbnail.addEventListener('click', function() {
        currentIndex = idx;
        updateModalContent();
      });
      
      modal.thumbnails.appendChild(thumbnail);
    });
  }
  
  // Make openModal function globally available
  window.openModal = function(images, index, captions) {
    currentImages = images;
    currentIndex = index;
    currentCaptions = captions || [];
    
    generateThumbnails();
    updateModalContent();
    modal.modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Add swipe detection for mobile
    setupSwipeDetection();
  };
  
  // Setup swipe detection for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }
  
  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }
  
  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left, go to next
      goToNext();
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe right, go to previous
      goToPrevious();
    }
  }
  
  window.setupSwipeDetection = function() {
    modal.modal.addEventListener('touchstart', handleTouchStart, false);
    modal.modal.addEventListener('touchend', handleTouchEnd, false);
  };
  
  window.removeSwipeDetection = function() {
    modal.modal.removeEventListener('touchstart', handleTouchStart);
    modal.modal.removeEventListener('touchend', handleTouchEnd);
  };
  
  // Event listeners for modal controls
  modal.close.addEventListener('click', function() {
    closeModal();
  });
  
  modal.sidePrev.addEventListener('click', function() {
    goToPrevious();
  });
  
  modal.sideNext.addEventListener('click', function() {
    goToNext();
  });
  
  // Close modal when clicking outside the image
  modal.modal.addEventListener('click', function(e) {
    if (e.target === modal.modal) {
      closeModal();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!modal.modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Initialize feature previews with image paths and feature types
const featurePreviews = {
  chat: {
    light: [
      '/images/chat/light-1.png',
      '/images/chat/light-2.png',
      '/images/chat/light-3.png'
    ],
    dark: [
      '/images/chat/dark-1.png',
      '/images/chat/dark-2.png',
      '/images/chat/dark-3.png'
    ],
    captions: [
      'Get summarized insights from all models',
      'Combine model response for accuracy',
      'Chat with multiple AI models simultaneously',
    ]
  },
  image: {
    light: [
      '/images/image/light-1.png',
      '/images/image/light-2.png',
    ],
    dark: [
      '/images/image/dark-1.png',
      '/images/image/dark-2.png',
    ],
    captions: [
      'Generate images with multiple AI models',
      'Generate images with multiple AI models',
    ]
  },
  audio: {
    light: [
      '/images/audio/light-1.png',
    ],
    dark: [
      '/images/audio/dark-1.png',
    ],
    captions: [
      'Convert text to speech with natural-sounding voices'
    ]
  },
  video: {
    light: [
      '/images/video/light-1.png',
    ],
    dark: [
      '/images/video/dark-1.png',
    ],
    captions: [
      'Create videos from text prompts with AI'
    ]
  },
};

// Initialize all feature previews
document.querySelectorAll('.feature-preview').forEach((element, index) => {
  const featureType = ['chat', 'image', 'audio', 'video'][index];
  element.closest('.feature-block').dataset.featureType = featureType;
  new FeaturePreview(element, featurePreviews[featureType]);
});

// Create a completely separate video modal
function createDemoVideoModal() {
  // Check if modal already exists to prevent duplicates
  if (document.querySelector('.demo-video-modal')) {
    return document.querySelector('.demo-video-modal');
  }
  
  const videoModalHTML = `
    <div class="demo-video-modal">
      <span class="demo-video-close">&times;</span>
      <div class="demo-video-content">
        <div class="demo-video-container">
          <iframe id="demo-youtube-frame"
            width="560"
            height="315"
            src=""
            title="Alle-AI Demo Video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
      </div>
      <div class="demo-video-side-nav">
        <div class="demo-video-caption">Alle-AI Demo Video</div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', videoModalHTML);
  
  return document.querySelector('.demo-video-modal');
}

// Setup video modal functionality
function setupDemoVideoModal() {
  const videoModal = createDemoVideoModal();
  const videoFrame = document.getElementById('demo-youtube-frame');
  const closeButton = videoModal.querySelector('.demo-video-close');
  const videoUrl = 'https://www.youtube.com/embed/8jI8x8_Vh5U?autoplay=1';
  
  // Function to open video modal
  function openDemoVideo() {
    console.log('Opening video modal');
    
    // Position the modal at the current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    videoModal.style.top = `${scrollTop}px`;
    videoModal.style.left = '0';
    
    // Set the height based on viewport
    const viewportHeight = window.innerHeight;
    videoModal.style.height = `${viewportHeight}px`;
    
    // Load the video and show the modal
    videoFrame.src = videoUrl;
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
  
  // Function to close video modal
  function closeDemoVideo() {
    console.log('Closing video modal');
    videoModal.classList.remove('active');
    setTimeout(() => {
      videoFrame.src = ''; // Stop video when closing, with a slight delay
    }, 300);
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  // Event listeners
  closeButton.addEventListener('click', closeDemoVideo);
  
  // Close modal when clicking outside the video
  videoModal.addEventListener('click', function(e) {
    if (e.target === videoModal) {
      closeDemoVideo();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (videoModal.classList.contains('active') && e.key === 'Escape') {
      closeDemoVideo();
    }
  });
  
  return openDemoVideo;
}

// Initialize the demo video button
document.addEventListener('DOMContentLoaded', function() {
  // This is a separate event listener that won't interfere with the image modal
  const demoButton = document.querySelector('.secondary-button');
  if (demoButton) {
    const openDemoVideo = setupDemoVideoModal();
    demoButton.addEventListener('click', function(e) {
      e.preventDefault();
      openDemoVideo();
    });
  }
});

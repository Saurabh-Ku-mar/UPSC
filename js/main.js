/**
 * Main JavaScript File
 * - Template Loading (Header & Footer)
 * - Login State Management
 * - Global Utilities
 * 
 * This script runs on every page and provides:
 * 1. Dynamic header/footer injection
 * 2. localStorage-based login state
 * 3. User welcome/logout UI
 * 4. Image lazy loading
 * 5. Global utilities and helpers
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
  templatePath: 'templates/',
  headerFile: 'header.html',
  footerFile: 'footer.html',
  storageKey: 'user_logged_in',
  userDataKey: 'user_data',
  headerSelector: '#app-header',
  footerSelector: '#app-footer',
  mainContentSelector: '#main-content',
};

// ============================================
// Template Loading System
// ============================================

/**
 * Fetches and injects header and footer templates
 * Called on every page load
 */
async function loadTemplates() {
  try {
    // Fetch header
    const headerResponse = await fetch(`${CONFIG.templatePath}${CONFIG.headerFile}`);
    if (headerResponse.ok) {
      const headerHTML = await headerResponse.text();
      document.querySelector(CONFIG.headerSelector).innerHTML = headerHTML;
      attachHeaderEventListeners();
    } else {
      console.error('Failed to load header template:', headerResponse.status);
    }

    // Fetch footer
    const footerResponse = await fetch(`${CONFIG.templatePath}${CONFIG.footerFile}`);
    if (footerResponse.ok) {
      const footerHTML = await footerResponse.text();
      document.querySelector(CONFIG.footerSelector).innerHTML = footerHTML;
    } else {
      console.error('Failed to load footer template:', footerResponse.status);
    }
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

/**
 * Attaches event listeners to dynamically loaded header elements
 */
function attachHeaderEventListeners() {
  // Login button click handler
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'login.html';
    });
  }

  // Logout button click handler
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Mobile menu toggle (if applicable)
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const nav = document.querySelector('nav');
      if (nav) {
        nav.classList.toggle('active');
      }
    });
  }
}

// ============================================
// Login State Management
// ============================================

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return localStorage.getItem(CONFIG.storageKey) === 'true';
}

/**
 * Get current user data
 */
function getUserData() {
  const data = localStorage.getItem(CONFIG.userDataKey);
  return data ? JSON.parse(data) : null;
}

/**
 * Login user - Save to localStorage
 * @param {Object} userData - User data object { email, username, etc }
 */
function login(userData = {}) {
  localStorage.setItem(CONFIG.storageKey, 'true');
  localStorage.setItem(
    CONFIG.userDataKey,
    JSON.stringify({
      ...userData,
      loginTime: new Date().toISOString(),
    })
  );

  // Dispatch custom event so other scripts can react
  window.dispatchEvent(new CustomEvent('user:login', { detail: userData }));

  // Update UI
  updateAuthUI();
}

/**
 * Logout user - Remove from localStorage
 */
function logout() {
  localStorage.removeItem(CONFIG.storageKey);
  localStorage.removeItem(CONFIG.userDataKey);

  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('user:logout'));

  // Update UI
  updateAuthUI();

  // Redirect to home
  window.location.href = '/';
}

/**
 * Update authentication UI based on login state
 * Shows login button when logged out
 * Shows welcome message + logout when logged in
 */
function updateAuthUI() {
  const authContainer = document.querySelector('.auth-container');
  if (!authContainer) return;

  if (isLoggedIn()) {
    const userData = getUserData();
    const username = userData?.email || userData?.username || 'User';

    authContainer.innerHTML = `
      <div class="user-welcome">
        <p>Welcome, <strong>${escapeHTML(username)}</strong></p>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="login-btn">Login</a>
    `;
  }
}

// ============================================
// Image Lazy Loading
// ============================================

/**
 * Setup lazy loading for images with data-src attribute
 * Fallback for browsers that don't support native lazy loading
 */
function setupLazyLoading() {
  // Check if IntersectionObserver is supported
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback: Load all images immediately for older browsers
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add event delegation to document
 * Usage: delegate(document, '.btn', 'click', handler)
 */
function delegate(parent, selector, eventType, handler) {
  parent.addEventListener(eventType, (e) => {
    if (e.target.closest(selector)) {
      handler.call(e.target.closest(selector), e);
    }
  });
}

/**
 * Store data in localStorage with expiration
 */
function setStorageWithExpiry(key, value, expiryMinutes = 60) {
  const expiryTime = new Date().getTime() + expiryMinutes * 60 * 1000;
  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      expiry: expiryTime,
    })
  );
}

/**
 * Get data from localStorage and check expiration
 */
function getStorageWithExpiry(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;

  const data = JSON.parse(item);
  if (new Date().getTime() > data.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return data.value;
}

/**
 * Show loading state on buttons
 */
function setButtonLoading(button, isLoading = true) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Submit';
  }
}

/**
 * Reset button to normal state
 */
function resetButtonLoading(button) {
  setButtonLoading(button, false);
}

/**
 * Show toast/notification message
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  // Add basic toast styles if not already defined
  if (!document.querySelector('style[data-toast]')) {
    const style = document.createElement('style');
    style.dataset.toast = 'true';
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 4px;
        background-color: #333;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease-in-out;
      }
      .toast-info { background-color: #2196F3; }
      .toast-success { background-color: #4CAF50; }
      .toast-warning { background-color: #ff9800; }
      .toast-error { background-color: #f44336; }
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-in-out reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get URL query parameter
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Redirect to URL with optional delay
 */
function redirect(url, delayMs = 0) {
  if (delayMs > 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delayMs);
  } else {
    window.location.href = url;
  }
}

// ============================================
// DOM Ready - Initialize Everything
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Load header and footer templates
    await loadTemplates();

    // 2. Setup lazy loading for images
    setupLazyLoading();

    // 3. Update auth UI based on current login state
    updateAuthUI();

    // 4. Initialize MutationObserver to watch for dynamically added images
    const observer = new MutationObserver(() => {
      setupLazyLoading();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Dispatch event to signal that main.js is ready
    window.dispatchEvent(new CustomEvent('app:ready'));
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});

// ============================================
// Export Functions for Global Use
// ============================================

// Make functions available globally for inline event handlers
window.login = login;
window.logout = logout;
window.updateAuthUI = updateAuthUI;
window.showToast = showToast;
window.isValidEmail = isValidEmail;
window.getQueryParam = getQueryParam;
window.redirect = redirect;
window.setButtonLoading = setButtonLoading;
window.resetButtonLoading = resetButtonLoading;

// Log initialization
console.log('[v0] main.js loaded and initialized');

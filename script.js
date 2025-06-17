// DOM Elements
const guideSections = document.getElementById('guide-sections');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.querySelector('.theme-icon');

// Sample data (will be replaced by fetch)
let guideData = [];

// Initialize the application
async function init() {
  // Set up event listeners
  themeToggle.addEventListener('click', toggleTheme);
  
  // Load saved theme preference
  loadThemePreference();
  
  // Load and render guide data
  try {
    await loadGuideData();
    renderGuideSections();
  } catch (error) {
    console.error('Error loading guide data:', error);
    guideSections.innerHTML = `
      <div class="error">
        <p>Failed to load guide content. Please try refreshing the page.</p>
        <button onclick="window.location.reload()">Refresh</button>
      </div>`;
  }
}

// Load guide data from JSON file
async function loadGuideData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error('Failed to load data');
    }
    guideData = await response.json();
  } catch (error) {
    console.warn('Using fallback data due to:', error);
    // Fallback to inline data if fetch fails
    guideData = [
      {
        "title": "Getting Started & Delivery Day",
        "summary": "Your Tesla delivery day is exciting—make sure it goes smoothly.",
        "details": "### Delivery Day Checklist\n- Inspect exterior and interior\n- Check all features and functions\n- Complete paperwork\n- Set up your Tesla account",
        "resources": []
      },
      // More fallback sections...
    ];
  }
}

// Render guide sections as accordion cards
function renderGuideSections() {
  if (!guideData || !guideData.length) {
    guideSections.innerHTML = '<div class="error">No guide content available.</div>';
    return;
  }

  guideSections.innerHTML = guideData.map((section, index) => {
    const isFirst = index === 0;
    const expanded = 'false'; // All sections start closed
    const expandedClass = ''; // No expanded class by default
    
    // Parse markdown for details (using marked.js)
    const detailsHtml = marked.parse(section.details || '');
    
    // Format resources if available
    let resourcesHtml = '';
    if (section.resources && section.resources.length) {
      resourcesHtml = `
        <div class="resources">
          <h3>Resources</h3>
          <ul>
            ${section.resources.map(resource => `
              <li class="resource-item">
                <a href="${resource.source}" target="_blank" rel="noopener noreferrer">
                  ${resource.label}
                  <span class="resource-type">${resource.type}</span>
                </a>
                ${resource.why_useful ? `
                  <div class="tooltip" role="tooltip">
                    <span class="tooltip-text">${resource.why_useful}</span>
                  </div>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>`;
    }

    return `
      <section class="card" data-expanded="false" data-title="${escapeHtml(section.title)}">
        <h2>
          <button 
            id="section-${index}" 
            aria-expanded="${expanded}" 
            aria-controls="content-${index}"
            class="accordion-trigger"
          >
            ${escapeHtml(section.title)}
            <span class="icon" aria-hidden="true">▼</span>
          </button>
        </h2>
        <div 
          id="content-${index}" 
          class="content" 
          role="region" 
          aria-labelledby="section-${index}"
          ${isFirst ? '' : 'hidden'}
        >
          <p class="summary">${escapeHtml(section.summary)}</p>
          <div class="details">${detailsHtml}</div>
          ${resourcesHtml}
        </div>
      </section>`;
  }).join('');

  // Add event listeners to accordion buttons
  setupAccordion();
}

// Set up accordion functionality
function setupAccordion() {
  const buttons = document.querySelectorAll('.accordion-trigger');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      const content = document.getElementById(button.getAttribute('aria-controls'));
      
      // Close all sections first
      closeAllSections();
      
      // If clicking on a closed section, open it
      if (!isExpanded) {
        button.setAttribute('aria-expanded', 'true');
        content.removeAttribute('hidden');
        content.parentElement.setAttribute('data-expanded', 'true');
        
        // Scroll the section into view if needed
        setTimeout(() => {
          button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
    
    // Add keyboard navigation
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const buttonsArray = Array.from(buttons);
        const currentIndex = buttonsArray.indexOf(button);
        let nextIndex;
        
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % buttonsArray.length;
        } else {
          nextIndex = (currentIndex - 1 + buttonsArray.length) % buttonsArray.length;
        }
        
        buttonsArray[nextIndex].focus();
      }
    });
  });
}

// Close all accordion sections
function closeAllSections() {
  const buttons = document.querySelectorAll('.accordion-trigger');
  buttons.forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    const content = document.getElementById(button.getAttribute('aria-controls'));
    content.setAttribute('hidden', '');
    content.parentElement.setAttribute('data-expanded', 'false');
  });
}

// Toggle between light and dark theme
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  
  if (isDark) {
    html.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme preference from localStorage
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
  }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
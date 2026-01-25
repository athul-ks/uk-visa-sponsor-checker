// Global variable to store sponsors data
let sponsorsData = null;

// Selectors for LinkedIn (subject to change as LinkedIn updates their UI)
// We try multiple common selectors
const JOB_CARD_SELECTOR = '.job-card-container, .jobs-search-results__list-item';
const COMPANY_NAME_SELECTOR = '.job-card-container__primary-description, .job-card-container__company-name, .artdeco-entity-lockup__subtitle';
const JOB_DETAILS_COMPANY_SELECTOR = '.job-details-jobs-unified-top-card__company-name';

/**
 * Loads the sponsors JSON data from the extension package
 */
async function loadSponsorsData() {
    try {
        const url = chrome.runtime.getURL('sponsors.json');
        const response = await fetch(url);
        sponsorsData = await response.json();
        console.log(`[VisaChecker] Loaded ${Object.keys(sponsorsData).length} sponsors.`);

        // Initial run
        scanPage();
    } catch (error) {
        console.error('[VisaChecker] Failed to load sponsors data:', error);
    }
}

/**
 * Creates the badge DOM element
 * @param {string} originalName 
 * @returns {HTMLElement}
 */
function createBadge(originalName) {
    const badge = document.createElement('span');
    badge.className = 'visa-sponsor-badge';
    badge.textContent = '✓ UK Visa Sponsor';
    badge.setAttribute('data-original-name', `Registered as: ${originalName}`);
    return badge;
}

/**
 * Scan a single element (job card or details header)
 * @param {HTMLElement} element 
 */
function processElement(element) {
    if (element.dataset.visaChecked === 'true') return;

    // Find company name node
    // This logic attempts to find the closest text node that looks like a company name
    let companyNameNode = element.querySelector(COMPANY_NAME_SELECTOR);

    // Fallback logic for different views
    if (!companyNameNode && element.matches(JOB_DETAILS_COMPANY_SELECTOR)) {
        companyNameNode = element;
    }

    if (!companyNameNode) return;

    const companyName = companyNameNode.textContent.trim();
    if (!companyName) return;

    // Perform check
    const match = fuzzyMatch(companyName, sponsorsData);

    if (match) {
        // Avoid duplicate badges
        if (!companyNameNode.querySelector('.visa-sponsor-badge')) {
            const badge = createBadge(match);
            companyNameNode.appendChild(badge);
        }
    }

    // Mark as checked to avoid re-processing immediately
    element.dataset.visaChecked = 'true';
}

/**
 * Scans the entire page for job cards and the main details view
 */
function scanPage() {
    if (!sponsorsData) return;

    // 1. Scan job cards in the list
    const cards = document.querySelectorAll(JOB_CARD_SELECTOR);
    cards.forEach(processElement);

    // 2. Scan the main job details pane (if open)
    const detailsCompany = document.querySelector(JOB_DETAILS_COMPANY_SELECTOR);
    if (detailsCompany) processElement(detailsCompany);
}

// Debounce function to limit how often we scan on scroll
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Observer to handle infinite scroll and page navigation (SPA)
const observer = new MutationObserver(debounce(() => {
    scanPage();
}, 500));

// Start
loadSponsorsData();

// Begin observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

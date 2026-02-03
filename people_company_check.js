(function () {
    console.log('[PeopleChecker] Script Loaded (v7 - Flex Column Fix)');

    // Global variable to store sponsors data within this IIFE
    let companySponsorsData = null;

    /**
     * Creates the "UK Visa Sponsor" badge DOM element
     */
    function createSponsorBadge(originalName) {
        const badge = document.createElement('div'); // Using DIV for block display
        badge.className = 'visa-sponsor-badge';
        badge.textContent = '✓ Visa Sponsor';
        badge.title = `Registered as: ${originalName}`;

        // CSS for a clean "Tag" look
        badge.style.fontSize = '10px';
        badge.style.marginTop = '4px'; // Spacing between button and badge
        badge.style.backgroundColor = '#e8f0fe'; // Light blue background (subtle)
        badge.style.color = '#0a66c2'; // LinkedIn Blue text
        badge.style.border = '1px solid #0a66c2'; // Thin border
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '12px'; // Pill shape
        badge.style.fontWeight = '600';
        badge.style.lineHeight = '1';
        badge.style.textAlign = 'center';
        badge.style.whiteSpace = 'nowrap';
        badge.style.cursor = 'help';
        badge.style.width = 'fit-content';

        return badge;
    }

    /**
     * Recursively find text content that looks like "Role at Company"
     */
    function findSubtitleElement(root) {
        const queue = [root];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.innerText || node.textContent;
                // Matches " at ", " @ ", or "@Company"
                if (text && (text.includes(' at ') || text.includes(' @ ') || text.includes('@')) && text.length < 150 && text.length > 3) {
                    const hasHugeChildren = Array.from(node.children).some(c => c.textContent.length > text.length * 0.9);
                    if (!hasHugeChildren) {
                        return { text: text, element: node };
                    }
                }
                for (const child of node.children) queue.push(child);
            }
        }
        return null;
    }

    async function loadSponsorsDataForPeople() {
        try {
            const url = chrome.runtime.getURL('sponsors.json');
            const response = await fetch(url);
            companySponsorsData = await response.json();
            console.log(`[PeopleChecker] Loaded ${Object.keys(companySponsorsData).length} sponsors.`);
            runDiagnostics();
        } catch (error) {
            console.error('[PeopleChecker] Failed to load sponsors data:', error);
        }
    }

    function runDiagnostics() {
        if (!companySponsorsData) return;

        // Generic selector for People Cards
        const cards = document.querySelectorAll('div[role="listitem"], .reusable-search__result-container, .entity-result__item, li.artdeco-list__item');

        console.log(`[PeopleChecker] Found ${cards.length} cards.`);

        cards.forEach(card => {
            if (card.dataset.processed) return;

            // 1. Find company name
            const subtitleObj = findSubtitleElement(card);

            if (subtitleObj) {
                const { text: textToCheck, element: targetElement } = subtitleObj;
                const companyMatch = textToCheck.match(/(?:\s+at\s+|\s+@\s*|@)([^•\n]+)/i);

                if (companyMatch && companyMatch[1]) {
                    let companyName = companyMatch[1].trim();
                    companyName = companyName.split(/[•\n]/)[0].trim();

                    if (typeof fuzzyMatch !== 'undefined') {
                        const match = fuzzyMatch(companyName, companySponsorsData);
                        if (match) {
                            console.log(`[PeopleChecker] MATCH: "${companyName}" -> "${match}"`);

                            // 2. Find the Action Button (Connect / Follow / Message)
                            // We include <a> tags because "Connect" is often a link
                            const actionButton = Array.from(card.querySelectorAll('button, a')).find(b => {
                                const t = b.innerText.trim();
                                // Check exact matches to avoid false positives
                                return ['Connect', 'Follow', 'Message', 'Pending'].includes(t);
                            });

                            if (actionButton) {
                                // 3. The Strategy: Find the parent and force it to stack vertically
                                const buttonContainer = actionButton.parentElement;

                                // Prevent duplicates
                                if (!buttonContainer.querySelector('.visa-sponsor-badge')) {

                                    // FORCE FLEX COLUMN
                                    // This forces the button and our new badge to stack vertically
                                    buttonContainer.style.display = 'flex';
                                    buttonContainer.style.flexDirection = 'column';
                                    buttonContainer.style.alignItems = 'center';
                                    buttonContainer.style.justifyContent = 'center';

                                    // Ensure it doesn't try to use "display: contents" which breaks layout
                                    buttonContainer.style.setProperty('display', 'flex', 'important');

                                    const badge = createSponsorBadge(match);
                                    buttonContainer.appendChild(badge);
                                }
                            } else {
                                // Fallback: If no button found, place next to company name
                                if (!targetElement.querySelector('.visa-sponsor-badge')) {
                                    const badge = createSponsorBadge(match);
                                    badge.style.display = 'inline-flex';
                                    badge.style.marginLeft = '8px';
                                    badge.style.marginTop = '0';
                                    targetElement.appendChild(badge);
                                }
                            }
                        }
                    }
                }
            }
            card.dataset.processed = "true";
        });
    }

    // Run immediately
    loadSponsorsDataForPeople();

    let debounceTimer = null;
    const peopleDiagnosticObserver = new MutationObserver((mutations) => {
        if (!companySponsorsData) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log('[PeopleChecker] DOM settled. Scanning...');
            runDiagnostics();
        }, 1000);
    });

    peopleDiagnosticObserver.observe(document.body, { childList: true, subtree: true });

})();
/**
 * Calcs Levenshtein distance between two strings
 * @param {string} a 
 * @param {string} b 
 * @returns {number}
 */
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Clean company name similar to the python script
 * @param {string} name 
 * @returns {string}
 */
function cleanCompanyName(name) {
    if (!name) return "";
    let clean = name.toLowerCase();

    // Remove matches in parentheses
    clean = clean.replace(/\(.*?\)/g, "");

    // Common suffixes
    const suffixes = [
        " limited", " ltd", " plc", " llp", " inc", " corp", " corporation",
        " gmbh", " s.a.", " s.r.l.", " b.v.", " n.v.", " sa", " sarl"
    ];

    suffixes.forEach(suffix => {
        if (clean.endsWith(suffix)) {
            clean = clean.slice(0, -suffix.length);
        }
    });

    // Remove special chars and normalize spaces
    clean = clean.replace(/[^a-z0-9\s]/g, "");
    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
}

/**
 * Fuzzy match a company name against the sponsors list
 * @param {string} companyName - The name from LinkedIn
 * @param {Object} sponsors - The generic dictionary {cleaned_name: original_name}
 * @returns {string|null} - Original sponsor name if matched, else null
 */
function fuzzyMatch(companyName, sponsors) {
    const cleanedLinkdedInName = cleanCompanyName(companyName);

    // 1. Exact match (O(1))
    if (sponsors.hasOwnProperty(cleanedLinkdedInName)) {
        return sponsors[cleanedLinkdedInName];
    }

    // 2. Fuzzy match
    // This part can be heavy if sponsors list is huge (100k+).
    // We optimization by checking length difference first.

    // Threshold: allow 1 error for short names provided length > 3, 2 for longer
    const maxDistance = cleanedLinkdedInName.length > 5 ? 2 : 1;
    if (cleanedLinkdedInName.length < 3) return null; // Too short to fuzzy match safely

    // Loop through keys - this iterates 100k keys. 
    // Optimization: keys are strings. 
    // We could potentially optimize this by restricting to keys starting with the same letter, 
    // but the python script didn't group them. 
    // For now, we will iterate. If performance is bad, we can restructure the JSON.

    for (const sponsorKey in sponsors) {
        // Optimization: length check
        if (Math.abs(sponsorKey.length - cleanedLinkdedInName.length) > maxDistance) continue;

        // Optimization: start/end char check (heuristic)
        // if (sponsorKey[0] !== cleanedLinkdedInName[0]) continue; 

        if (levenshteinDistance(cleanedLinkdedInName, sponsorKey) <= maxDistance) {
            return sponsors[sponsorKey];
        }
    }

    return null;
}

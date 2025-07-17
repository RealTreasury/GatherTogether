// Username validation utility for preventing inappropriate content

const UsernameValidator = {
    // Common inappropriate words and variants (this is a basic list - expand as needed)
    blockedWords: [
        // Profanity (basic examples - you'd want a more comprehensive list)
        'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb',
        // Inappropriate references
        'sex', 'porn', 'nude', 'naked', 'drug', 'weed', 'cocaine',
        // Hate speech indicators
        'hate', 'nazi', 'racist', 'fascist',
        // Religious mockery (appropriate for LCMS context)
        'satan', 'devil', 'godless', 'atheist',
        // Generic inappropriate
        'kill', 'die', 'murder', 'suicide', 'bomb', 'terrorist',
        // Common gaming/internet slang that might be inappropriate
        'noob', 'scrub', 'trash', 'garbage', 'suck', 'sucks'
    ],

    // L33t speak and common character substitutions
    characterSubstitutions: {
        '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't',
        '@': 'a', '$': 's', '+': 't', '!': 'i', '8': 'b', '6': 'g',
        '9': 'g', '2': 'z', '<': 'c', '|': 'l', '(': 'c', ')': 'c'
    },

    // Positive/appropriate alternative suggestions
    positiveAlternatives: [
        'GatheringFriend', 'FaithfulYouth', 'EndureWarrior', 'LCMSYouth',
        'BlessedTeen', 'ChristFollower', 'PrayerWarrior', 'GodsChild',
        'YoungBeliever', 'FaithWalker', 'GraceFilled', 'HopeBearer',
        'LightShiner', 'PeaceMaker', 'JoyBringer', 'LoveWalker',
        'TruthSeeker', 'GiftedYouth', 'BraveHeart', 'KindSpirit',
        'WisdomSeeker', 'GentleWarrior', 'HumbleServant', 'CourageousOne'
    ],

    // Normalize text for comparison (remove spaces, convert l33t speak, etc.)
    normalizeText: (text) => {
        if (!text) return '';
        let normalized = text.toLowerCase().trim();
        normalized = normalized.replace(/[\s\.\-_]/g, '');
        for (const [char, replacement] of Object.entries(UsernameValidator.characterSubstitutions)) {
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            normalized = normalized.replace(new RegExp(escaped, 'g'), replacement);
        }
        normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
        return normalized;
    },

    // Check if username contains inappropriate content
    isInappropriate: (username) => {
        if (!username || typeof username !== 'string') return true;
        const normalized = UsernameValidator.normalizeText(username);
        if (normalized.length < 2 || normalized.length > 20) return true;
        for (const blocked of UsernameValidator.blockedWords) {
            if (normalized.includes(blocked)) return true;
        }
        if (UsernameValidator.hasSuspiciousPatterns(normalized)) return true;
        if (/(.)\1{4,}/.test(username)) return true;
        if (/^\d+$/.test(username.trim())) return true;
        const testPatterns = ['test', 'user', 'admin', 'guest', 'anonymous', 'asdf', 'qwerty'];
        if (testPatterns.some(pattern => normalized.includes(pattern))) return true;
        return false;
    },

    // Check for suspicious patterns that might indicate inappropriate content
    hasSuspiciousPatterns: (text) => {
        if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(text)) return true;
        if (/[aeiou]{5,}/.test(text)) return true;
        if (/[xyz]{3,}/.test(text)) return true;
        if (/[qx]{2,}/.test(text)) return true;
        if (/[A-Z]{1}[a-z]{1,2}[A-Z]{1}[a-z]{1,2}[A-Z]/.test(text)) return true;
        return false;
    },

    // Get a clean, appropriate username
    getCleanUsername: (username) => {
        if (!username || typeof username !== 'string') {
            return UsernameValidator.getRandomPositiveAlternative();
        }
        const trimmed = username.trim();
        if (!UsernameValidator.isInappropriate(trimmed)) return trimmed;
        let cleaned = trimmed.replace(/[^a-zA-Z0-9\s]/g, '');
        cleaned = cleaned.replace(/\s+/g, ' ');
        cleaned = cleaned.substring(0, 20);
        if (cleaned.length >= 2 && !UsernameValidator.isInappropriate(cleaned)) {
            return cleaned;
        }
        return UsernameValidator.getRandomPositiveAlternative();
    },

    // Get a random positive alternative username
    getRandomPositiveAlternative: () => {
        const alternatives = UsernameValidator.positiveAlternatives;
        const randomIndex = Math.floor(Math.random() * alternatives.length);
        const baseName = alternatives[randomIndex];
        const randomNum = Math.floor(Math.random() * 999) + 1;
        return `${baseName}${randomNum}`;
    },

    // Validate and provide feedback
    validateWithFeedback: (username) => {
        if (!username || typeof username !== 'string') {
            return {
                isValid: false,
                cleanUsername: UsernameValidator.getRandomPositiveAlternative(),
                message: 'Please enter a username'
            };
        }
        const trimmed = username.trim();
        if (trimmed.length < 2) {
            return {
                isValid: false,
                cleanUsername: UsernameValidator.getRandomPositiveAlternative(),
                message: 'Username must be at least 2 characters long'
            };
        }
        if (trimmed.length > 20) {
            return {
                isValid: false,
                cleanUsername: trimmed.substring(0, 20),
                message: 'Username must be 20 characters or less'
            };
        }
        if (UsernameValidator.isInappropriate(trimmed)) {
            return {
                isValid: false,
                cleanUsername: UsernameValidator.getRandomPositiveAlternative(),
                message: 'Please choose a more appropriate username'
            };
        }
        return {
            isValid: true,
            cleanUsername: trimmed,
            message: 'Username looks good!'
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsernameValidator;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.UsernameValidator = UsernameValidator;
}

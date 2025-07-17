// Bible verse management with potential API connectivity

const VERSES = [
    {
        text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        reference: "John 3:16",
        theme: "salvation"
    },
    {
        text: "I can do all things through Christ who strengthens me.",
        reference: "Philippians 4:13",
        theme: "strength"
    },
    {
        text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        reference: "Proverbs 3:5-6",
        theme: "trust"
    },
    {
        text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        reference: "Joshua 1:9",
        theme: "courage"
    },
    {
        text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
        reference: "Romans 8:28",
        theme: "hope"
    },
    {
        text: "Cast all your anxiety on him because he cares for you.",
        reference: "1 Peter 5:7",
        theme: "peace"
    },
    {
        text: "The Lord is my shepherd, I lack nothing.",
        reference: "Psalm 23:1",
        theme: "provision"
    },
    {
        text: "Come to me, all you who are weary and burdened, and I will give you rest.",
        reference: "Matthew 11:28",
        theme: "rest"
    },
    {
        text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
        reference: "Isaiah 40:31",
        theme: "renewal"
    },
    {
        text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
        reference: "1 Corinthians 13:4",
        theme: "love"
    },
    {
        text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
        reference: "2 Corinthians 5:17",
        theme: "transformation"
    },
    {
        text: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
        reference: "Matthew 5:16",
        theme: "witness"
    }
];

const VerseManager = {
    currentVerse: null,
    favoriteVerses: new Set(),

    // Initialize verse manager
    init: () => {
        VerseManager.loadFavorites();
        VerseManager.displayHourlyVerse();
    },

    // Display verse based on current hour
    displayHourlyVerse: () => {
        const hour = new Date().getHours();
        const verseIndex = hour % VERSES.length;
        VerseManager.displayVerse(VERSES[verseIndex]);
    },

    // Display a specific verse
    displayVerse: (verse) => {
        VerseManager.currentVerse = verse;
        
        const verseTexts = document.querySelectorAll('.verse-text');
        const verseReferences = document.querySelectorAll('.verse-reference');

        verseTexts.forEach(el => { el.textContent = verse.text; });
        verseReferences.forEach(el => { el.textContent = verse.reference; });
    },

    // Get random verse
    getRandomVerse: () => {
        const randomIndex = Math.floor(Math.random() * VERSES.length);
        return VERSES[randomIndex];
    },

    // Get verse by theme
    getVerseByTheme: (theme) => {
        const themeVerses = VERSES.filter(v => v.theme === theme);
        if (themeVerses.length === 0) return VerseManager.getRandomVerse();
        
        const randomIndex = Math.floor(Math.random() * themeVerses.length);
        return themeVerses[randomIndex];
    },

    // Refresh to new verse
    refresh: async () => {
        try {
            const verse = await VerseManager.fetchFromAPI('endure');
            VerseManager.displayVerse(verse);
            Utils.showNotification('New verse loaded!');
        } catch (err) {
            console.warn('Verse API failed, using local verse', err);
            const fallback = VerseManager.getVerseByTheme('endure');
            VerseManager.displayVerse(fallback);
            Utils.showNotification('Loaded fallback verse');
        }
    },

    // Toggle favorite status
    favorite: () => {
        if (!VerseManager.currentVerse) return;
        
        const reference = VerseManager.currentVerse.reference;
        
        if (VerseManager.favoriteVerses.has(reference)) {
            VerseManager.favoriteVerses.delete(reference);
            Utils.showNotification('Removed from favorites');
        } else {
            VerseManager.favoriteVerses.add(reference);
            Utils.showNotification('Added to favorites!');
        }
        
        VerseManager.saveFavorites();
    },

    // Get favorite verses
    getFavorites: () => {
        return VERSES.filter(v => VerseManager.favoriteVerses.has(v.reference));
    },

    // Save favorites to storage
    saveFavorites: () => {
        Storage.save(Storage.KEYS.FAVORITE_VERSES, [...VerseManager.favoriteVerses]);
    },

    // Load favorites from storage
    loadFavorites: () => {
        const saved = Storage.load(Storage.KEYS.FAVORITE_VERSES, []);
        VerseManager.favoriteVerses = new Set(saved);
    },

    // Fetch a verse from an external API
    fetchFromAPI: async (query) => {
        const endpoint = `https://bible-api.com/search?query=${encodeURIComponent(query)}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        if (data.verses && data.verses.length > 0) {
            const pick = data.verses[Math.floor(Math.random() * data.verses.length)];
            return {
                text: pick.text.trim(),
                reference: `${pick.book_name} ${pick.chapter}:${pick.verse}`,
                theme: 'endure'
            };
        }
        throw new Error('No verses found');
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.VerseManager = VerseManager;
}

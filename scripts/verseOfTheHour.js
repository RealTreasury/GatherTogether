const verses = [
    'For God so loved the world... - John 3:16',
    'I can do all things through Christ... - Philippians 4:13',
    'Trust in the Lord with all your heart... - Proverbs 3:5',
    'Be strong and courageous... - Joshua 1:9'
];

export function initVerseOfTheHour() {
    const verseText = document.getElementById('verse-text');
    if (!verseText) return;

    const hour = new Date().getHours();
    const index = hour % verses.length;
    verseText.textContent = verses[index];
}

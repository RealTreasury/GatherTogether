const ChallengeSuggest = {
    overlay: null,
    keyHandler: null,

    init() {
        const btn = document.getElementById('suggest-challenge-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                ChallengeSuggest.openForm();
            });
        }
    },

    openForm() {
        // Create overlay using existing sublist styles for consistency
        const overlay = document.createElement('div');
        overlay.className = 'sublist-overlay';
        overlay.innerHTML = `
            <div class="sublist-content relative">
                <button class="sublist-close" aria-label="Close">&times;</button>
                <h3 class="text-xl font-bold mb-4">Suggest a Challenge</h3>
                <textarea class="challenge-suggest-input" placeholder="Your challenge idea..." rows="4"></textarea>
                <button class="btn-secondary" id="challenge-submit-btn">Submit</button>
            </div>
        `;

        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('sublist-close') || e.target === overlay) {
                ChallengeSuggest.closeForm();
            }
        });

        overlay.querySelector('#challenge-submit-btn').addEventListener('click', ChallengeSuggest.submit);

        ChallengeSuggest.overlay = overlay;
        document.body.appendChild(overlay);

        ChallengeSuggest.keyHandler = (e) => {
            if (e.key === 'Escape') {
                ChallengeSuggest.closeForm();
            }
        };
        document.addEventListener('keydown', ChallengeSuggest.keyHandler);
    },

    closeForm() {
        if (ChallengeSuggest.overlay) {
            ChallengeSuggest.overlay.remove();
            ChallengeSuggest.overlay = null;
        }
        if (ChallengeSuggest.keyHandler) {
            document.removeEventListener('keydown', ChallengeSuggest.keyHandler);
            ChallengeSuggest.keyHandler = null;
        }
    },

    async submit() {
        if (!ChallengeSuggest.overlay) return;
        const textarea = ChallengeSuggest.overlay.querySelector('.challenge-suggest-input');
        if (!textarea) return;
        const text = textarea.value.trim();
        if (text === '') {
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Please enter a challenge idea', 'error');
            }
            return;
        }

        try {
            if (!window.firestoreModules || !window.firebaseDB) {
                throw new Error('Firebase not available');
            }
            const { collection, addDoc } = window.firestoreModules;
            const col = collection(window.firebaseDB, 'challengeSuggestions');
            await addDoc(col, {
                text,
                timestamp: new Date().toISOString(),
                userId: window.Utils && Utils.getUserId ? Utils.getUserId() : null
            });
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Suggestion submitted!');
            }
            ChallengeSuggest.closeForm();
        } catch (err) {
            console.error('Failed to submit challenge suggestion:', err);
            if (window.Utils && Utils.showNotification) {
                Utils.showNotification('Failed to submit suggestion', 'error');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ChallengeSuggest.init());

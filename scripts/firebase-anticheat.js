// Fixed firebase-anticheat.js - Handle permissions and undefined users

class FirebaseAntiCheat {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.permissionError = false;
    }

    async init(firebaseApp) {
        try {
            if (!window.firestoreModules || typeof window.firestoreModules.getFirestore === 'undefined') {
                console.warn('Firebase Firestore not available for anti-cheat');
                return false;
            }
            const { getFirestore } = window.firestoreModules;
            this.db = getFirestore(firebaseApp);
            this.initialized = true;
            return true;
        } catch (err) {
            console.error('Failed to initialize FirebaseAntiCheat:', err);
            this.initialized = false;
            return false;
        }
    }

    isAvailable() {
        return this.initialized && this.db !== null && !this.permissionError;
    }

    async markUserFlagged(userId, reason) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }
        
        // Validate userId
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.warn('Invalid userId provided to markUserFlagged:', userId);
            return false;
        }

        try {
            const { collection, addDoc } = window.firestoreModules;
            const ref = collection(this.db, 'flagged_users');
            await addDoc(ref, {
                userId: userId.trim(),
                reason: reason || 'Unknown reason',
                flaggedAt: new Date().toISOString()
            });
            return true;
        } catch (err) {
            console.error('Failed to mark user flagged in Firestore:', err);
            if (err.code === 'permission-denied') {
                this.permissionError = true;
                console.warn('Firestore permissions insufficient for anti-cheat operations');
            }
            throw err;
        }
    }

    async fetchFlaggedUsers() {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }
        try {
            const { collection, getDocs } = window.firestoreModules;
            const ref = collection(this.db, 'flagged_users');
            const snapshot = await getDocs(ref);
            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.userId && typeof data.userId === 'string') {
                    results.push(data);
                }
            });
            return results;
        } catch (err) {
            console.error('Failed to fetch flagged users from Firestore:', err);
            if (err.code === 'permission-denied') {
                this.permissionError = true;
                console.warn('Firestore permissions insufficient for reading flagged users');
                return []; // Return empty array instead of throwing
            }
            throw err;
        }
    }

    async isUserFlagged(userId) {
        if (!this.isAvailable()) {
            return false;
        }
        
        // Validate userId before querying
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.warn('Invalid userId provided to isUserFlagged:', userId);
            return false;
        }

        try {
            const { collection, query, where, getDocs } = window.firestoreModules;
            const ref = collection(this.db, 'flagged_users');
            const q = query(ref, where('userId', '==', userId.trim()));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (err) {
            console.error('Failed to check flagged user in Firestore:', err);
            if (err.code === 'permission-denied') {
                this.permissionError = true;
                console.warn('Firestore permissions insufficient for checking flagged users');
            }
            return false; // Return false instead of throwing to prevent app crashes
        }
    }
}

window.FirebaseAntiCheat = FirebaseAntiCheat;

// Firestore integration for anti-cheat flagged users

class FirebaseAntiCheat {
    constructor() {
        this.db = null;
        this.initialized = false;
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
        return this.initialized && this.db !== null;
    }

    async markUserFlagged(userId, reason) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }
        try {
            const { collection, addDoc } = window.firestoreModules;
            const ref = collection(this.db, 'flagged_users');
            await addDoc(ref, {
                userId: userId,
                reason: reason,
                flaggedAt: new Date().toISOString()
            });
            return true;
        } catch (err) {
            console.error('Failed to mark user flagged in Firestore:', err);
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
                results.push(doc.data());
            });
            return results;
        } catch (err) {
            console.error('Failed to fetch flagged users from Firestore:', err);
            throw err;
        }
    }

    async isUserFlagged(userId) {
        if (!this.isAvailable()) return false;
        try {
            const { collection, query, where, getDocs } = window.firestoreModules;
            const ref = collection(this.db, 'flagged_users');
            const q = query(ref, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (err) {
            console.error('Failed to check flagged user in Firestore:', err);
            return false;
        }
    }
}

window.FirebaseAntiCheat = FirebaseAntiCheat;

// Firebase Firestore integration for leaderboard functionality

class FirebaseLeaderboard {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.listeners = [];
    }

    // Initialize Firebase connection
    async init(firebaseApp) {
        try {
            if (!window.firestoreModules || typeof window.firestoreModules.getFirestore === 'undefined') {
                console.warn('Firebase Firestore not available');
                return false;
            }

            const { getFirestore } = window.firestoreModules;
            this.db = getFirestore(firebaseApp);
            this.initialized = true;
            console.log('Firebase Leaderboard initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase Leaderboard:', error);
            this.initialized = false;
            return false;
        }
    }

    // Check if Firebase is available and initialized
    isAvailable() {
        return this.initialized && this.db !== null;
    }

    // Check if a username is available (not used by another user)
    async isUsernameAvailable(username, currentUserId) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, query, where, getDocs } = window.firestoreModules;
            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(leaderboardRef, where('username', '==', username));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return true;

            let available = true;
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (!data) return;
                if (!currentUserId || data.userId !== currentUserId) {
                    available = false;
                }
            });
            return available;
        } catch (error) {
            console.error('Failed to check username availability:', error);
            throw error;
        }
    }

    // Basic username validation/sanitization
    validateUsername(username) {
        // Use advanced validator if available
        if (window.UsernameValidator &&
            typeof window.UsernameValidator.getCleanUsername === 'function') {
            return window.UsernameValidator.getCleanUsername(username);
        }

        // Fallback simple sanitization
        if (!username || typeof username !== 'string') {
            return 'Anonymous';
        }
        // Strip any HTML and limit length
        return username
            .replace(/<[^>]*>/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .substring(0, 30) || 'Anonymous';
    }

    // Add validation to Firebase operations
    async submitScore(userId, username, score) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, addDoc, updateDoc, doc, query, where, getDocs } = window.firestoreModules;

            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(leaderboardRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            // Validate username before saving
            const cleanUsername = this.validateUsername(username);

            // Check for duplicate username
            const available = await this.isUsernameAvailable(cleanUsername, userId);
            if (!available) {
                const err = new Error('Username already taken');
                err.code = 'USERNAME_TAKEN';
                throw err;
            }

            if (!snapshot.empty) {
                // Update existing entry
                const docRef = snapshot.docs[0];
                await updateDoc(doc(this.db, 'leaderboard', docRef.id), {
                    username: cleanUsername,
                    score: score,
                    lastUpdated: new Date().toISOString()
                });
                console.log('Score updated in Firebase for user:', userId);
            } else {
                // Create new entry
                await addDoc(leaderboardRef, {
                    userId: userId,
                    username: cleanUsername,
                    score: score,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
                console.log('New score added to Firebase for user:', userId);
            }

            return true;
        } catch (error) {
            console.error('Failed to submit score to Firebase:', error);
            throw error;
        }
    }

    // Get top scores from Firebase
    async getTopScores(limit = 10) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, query, orderBy, limit: firestoreLimit, getDocs } = window.firestoreModules;

            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(
                leaderboardRef, 
                orderBy('score', 'desc'), 
                firestoreLimit(limit)
            );

            const snapshot = await getDocs(q);
            const scores = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                scores.push({
                    id: data.userId || doc.id, // Include userId or fallback to doc ID
                    userId: data.userId || doc.id, // Explicit userId field
                    username: data.username,
                    score: data.score,
                    lastUpdated: data.lastUpdated
                });
            });

            console.log(`Retrieved ${scores.length} scores from Firebase`);
            return scores;
        } catch (error) {
            console.error('Failed to get scores from Firebase:', error);
            throw error;
        }
    }

    // Set up real-time listener for leaderboard changes
    subscribeToLeaderboard(callback, limit = 10) {
        if (!this.isAvailable()) {
            console.warn('Firebase not available for real-time updates');
            return null;
        }

        try {
            const { collection, query, orderBy, limit: firestoreLimit, onSnapshot } = window.firestoreModules;

            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(
                leaderboardRef, 
                orderBy('score', 'desc'), 
                firestoreLimit(limit)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const scores = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    scores.push({
                        id: data.userId || doc.id, // Include userId or fallback to doc ID
                        userId: data.userId || doc.id, // Explicit userId field
                        username: data.username,
                        score: data.score,
                        lastUpdated: data.lastUpdated
                    });
                });

                console.log('Real-time leaderboard update received:', scores.length, 'entries');
                callback(scores);
            }, (error) => {
                console.error('Real-time listener error:', error);
                // Fallback to periodic polling if real-time fails
                setTimeout(() => this.pollLeaderboard(callback, limit), 5000);
            });

            this.listeners.push(unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Failed to set up real-time listener:', error);
            return null;
        }
    }

    // Fallback polling method if real-time fails
    async pollLeaderboard(callback, limit = 10) {
        try {
            const scores = await this.getTopScores(limit);
            callback(scores);
        } catch (error) {
            console.error('Failed to poll leaderboard:', error);
        }
    }

    // Clean up listeners
    unsubscribeAll() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
        console.log('All Firebase listeners unsubscribed');
    }

    // Get user's current score
    async getUserScore(userId) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, query, where, getDocs } = window.firestoreModules;

            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(leaderboardRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                return {
                    id: data.userId || doc.id,
                    userId: data.userId || doc.id,
                    username: data.username,
                    score: data.score,
                    lastUpdated: data.lastUpdated
                };
            }

            return null;
        } catch (error) {
            console.error('Failed to get user score from Firebase:', error);
            throw error;
        }
    }

    // Delete user's score (for testing/admin purposes)
    async deleteUserScore(userId) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, query, where, getDocs, deleteDoc, doc } = window.firestoreModules;
            
            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(leaderboardRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                await deleteDoc(doc(this.db, 'leaderboard', snapshot.docs[0].id));
                console.log('User score deleted from Firebase:', userId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to delete user score from Firebase:', error);
            throw error;
        }
    }
}

// Create global instance
window.FirebaseLeaderboard = FirebaseLeaderboard;


const ServerStatus = {
    check: async () => {
        console.log('Firebase-only mode - no server check needed');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ServerStatus.check();
});

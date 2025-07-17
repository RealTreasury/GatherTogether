(function() {
    window.Leaderboard = window.Leaderboard || {};

    const allowedPattern = /^[A-Za-z0-9 _-]+$/;

    window.Leaderboard.validateAndCleanUsername = function(username) {
        const trimmed = (username || '').trim().slice(0, 20);
        const clean = trimmed.replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 20);
        const isValid = clean.length > 0 && allowedPattern.test(trimmed) && trimmed.length <= 20;
        let message = '';
        if (!isValid) {
            message = 'Only letters, numbers, spaces, hyphens and underscores allowed. 20 character max.';
        }
        return { isValid, cleanUsername: clean, message };
    };

    window.Leaderboard.validateUsernameInput = function(evt) {
        const input = evt.target || document.getElementById('username');
        const feedback = document.getElementById('username-feedback');
        const { isValid, cleanUsername, message } = window.Leaderboard.validateAndCleanUsername(input.value);
        if (!isValid) {
            input.classList.add('border-red-500');
            if (feedback) {
                feedback.textContent = message;
                feedback.style.display = 'block';
            }
        } else {
            input.classList.remove('border-red-500');
            if (feedback) {
                feedback.textContent = '';
                feedback.style.display = 'none';
            }
        }
        return { isValid, cleanUsername, message };
    };
})();

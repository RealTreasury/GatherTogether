const UsernameFeedback = {
    init: () => {
        const input = document.getElementById('username');
        if (!input || !window.UsernameValidator) return;

        let feedback = document.getElementById('username-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'username-feedback';
            input.insertAdjacentElement('afterend', feedback);
        }
        feedback.classList.add('hide');

        const applyResult = async () => {
            const result = window.UsernameValidator.validateWithFeedback(input.value);
            let message = result.message;
            let status = 'success';
            let isValid = result.isValid;

            if (isValid && window.Leaderboard &&
                window.Leaderboard.firebaseLeaderboard &&
                typeof window.Leaderboard.firebaseLeaderboard.isAvailable === 'function' &&
                window.Leaderboard.firebaseLeaderboard.isAvailable()) {
                try {
                    const available = await window.Leaderboard.firebaseLeaderboard.isUsernameAvailable(
                        input.value.trim(),
                        window.Utils && typeof Utils.getUserId === 'function' ? Utils.getUserId() : undefined
                    );
                    if (!available) {
                        message = 'Username already taken';
                        status = 'error';
                        isValid = false;
                    }
                } catch (err) {
                    console.error('Username availability check failed:', err);
                }
            } else if (!isValid) {
                status = result.message === 'Please choose a more appropriate username'
                    ? 'warning'
                    : 'error';
            } else {
                status = 'success';
            }

            feedback.textContent = message;
            if (!isValid && result.cleanUsername && result.cleanUsername !== input.value.trim()) {
                feedback.textContent += ` Using: "${result.cleanUsername}"`;
            }
            feedback.classList.remove('success', 'error', 'warning', 'hide');
            input.classList.remove('valid', 'invalid');
            if (isValid) {
                feedback.classList.add('show', 'success');
                input.classList.add('valid');
            } else {
                feedback.classList.add('show', status === 'warning' ? 'warning' : 'error');
                input.classList.add('invalid');
            }
        };

        const handler = (event) => applyResult();

        const debounced = window.Utils && Utils.debounce ? Utils.debounce(handler, 300) : handler;
        input.addEventListener('input', debounced);
        input.addEventListener('blur', applyResult);

        applyResult();
    }
};

document.addEventListener('DOMContentLoaded', UsernameFeedback.init);

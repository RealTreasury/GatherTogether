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

        const applyResult = () => {
            const result = window.UsernameValidator.validateWithFeedback(input.value);
            feedback.textContent = result.message;
            if (!result.isValid && result.cleanUsername && result.cleanUsername !== input.value.trim()) {
                feedback.textContent += ` Using: "${result.cleanUsername}"`;
            }
            feedback.classList.remove('success', 'error', 'warning', 'hide');
            input.classList.remove('valid', 'invalid');
            if (result.isValid) {
                feedback.classList.add('show', 'success');
                input.classList.add('valid');
            } else {
                const blocked = result.message === 'Please choose a more appropriate username';
                feedback.classList.add('show', blocked ? 'warning' : 'error');
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

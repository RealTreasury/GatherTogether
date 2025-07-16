// Polls and Q&A functionality with local storage

const SAMPLE_POLLS = [
    {
        id: 'youth-gathering-excitement',
        question: 'How excited are you for the Youth Gathering?',
        options: [
            { id: 'very-excited', text: 'Very excited! 🎉', votes: 0 },
            { id: 'excited', text: 'Excited 😊', votes: 0 },
            { id: 'somewhat', text: 'Somewhat excited 😐', votes: 0 },
            { id: 'not-sure', text: 'Not sure yet 🤔', votes: 0 }
        ],
        allowMultiple: false,
        active: true
    },
    {
        id: 'favorite-activity',
        question: 'What are you most looking forward to?',
        options: [
            { id: 'worship', text: 'Worship services 🙏', votes: 0 },
            { id: 'sessions', text: 'Learning sessions 📚', votes: 0 },
            { id: 'friends', text: 'Meeting new friends 👥', votes: 0 },
            { id: 'service', text: 'Service opportunities 🤝', votes: 0 },
            { id: 'activities', text: 'Fun activities 🎮', votes: 0 }
        ],
        allowMultiple: true,
        active: true
    }
];

const PollManager = {
    polls: [],
    userResponses: new Map(),

    // Initialize polls
    init: async () => {
        await PollManager.loadPolls();
        PollManager.loadResponses();
        PollManager.renderPolls();
    },

    // Load polls from the API (fallback to sample data on failure)
    loadPolls: async () => {
        try {
            const res = await fetch('/api/polls');
            if (!res.ok) throw new Error('Failed to fetch polls');
            PollManager.polls = await res.json();
        } catch (err) {
            console.warn('Using sample polls due to error:', err);
            PollManager.polls = [...SAMPLE_POLLS];
        }
    },

    // Render all polls
    renderPolls: () => {
        const container = document.getElementById('polls-container');
        if (!container) return;

        if (PollManager.polls.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🚀</div>
                    <h3 class="text-xl font-semibold mb-2">Coming Soon!</h3>
                    <p class="text-gray-600">Live polls and Q&A features will be available during the gathering.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = PollManager.polls
            .filter(poll => poll.active)
            .map(poll => PollManager.renderPoll(poll))
            .join('');
    },

    // Render individual poll
    renderPoll: (poll) => {
        const userResponse = PollManager.userResponses.get(poll.id) || [];
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

        return `
            <div class="poll-container">
                <h3 class="text-xl font-semibold mb-4">${poll.question}</h3>
                <div class="space-y-2">
                    ${poll.options.map(option => {
                        const isSelected = userResponse.includes(option.id);
                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                        
                        return `
                            <div class="poll-option ${isSelected ? 'selected' : ''}" 
                                 onclick="PollManager.vote('${poll.id}', '${option.id}', ${poll.allowMultiple})">
                                <div class="flex justify-between items-center">
                                    <span>${option.text}</span>
                                    <span class="text-sm text-gray-500">${percentage}% (${option.votes})</span>
                                </div>
                                ${percentage > 0 ? `<div class="poll-bar" style="width: ${percentage}%"></div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-4 text-sm text-gray-500">
                    ${poll.allowMultiple ? 'You can select multiple options' : 'Select one option'}
                    • Total votes: ${totalVotes}
                </div>
            </div>
        `;
    },

    // Handle voting by sending the selection to the API
    vote: async (pollId, optionId, allowMultiple) => {
        const poll = PollManager.polls.find(p => p.id === pollId);
        if (!poll) return;

        let userResponse = PollManager.userResponses.get(pollId) || [];
        let shouldSend = false;

        if (allowMultiple) {
            if (userResponse.includes(optionId)) {
                // Toggle off locally (cannot remove vote server-side)
                userResponse = userResponse.filter(id => id !== optionId);
            } else {
                userResponse.push(optionId);
                shouldSend = true;
            }
        } else {
            if (!userResponse.includes(optionId)) {
                userResponse = [optionId];
                shouldSend = true;
            } else {
                userResponse = [];
            }
        }

        PollManager.userResponses.set(pollId, userResponse);
        PollManager.saveResponses();

        if (shouldSend) {
            try {
                const userId = Utils.getUserId();
                await fetch(`/api/polls/${pollId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ optionId, userId })
                });
                await PollManager.loadPolls();
            } catch (err) {
                console.error('Failed to submit vote:', err);
            }
        }

        PollManager.renderPolls();
    },

    // Add new poll (for future admin functionality)
    addPoll: (poll) => {
        poll.id = poll.id || Utils.generateId();
        PollManager.polls.push(poll);
        PollManager.renderPolls();
    },

    // Save user responses
    saveResponses: () => {
        const responses = Object.fromEntries(PollManager.userResponses);
        Storage.save(Storage.KEYS.POLL_RESPONSES, responses);
    },

    // Load user responses
    loadResponses: () => {
        const saved = Storage.load(Storage.KEYS.POLL_RESPONSES, {});
        PollManager.userResponses = new Map(Object.entries(saved));
    },

    // Get poll results
    getResults: (pollId) => {
        const poll = PollManager.polls.find(p => p.id === pollId);
        if (!poll) return null;

        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        
        return {
            ...poll,
            totalVotes,
            results: poll.options.map(option => ({
                ...option,
                percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
            }))
        };
    },

    // Future: Submit Q&A question
    submitQuestion: (question) => {
        // This would submit to a server or queue for moderation
        const qa = {
            id: Utils.generateId(),
            question,
            timestamp: new Date().toISOString(),
            upvotes: 0,
            answered: false
        };
        
        Utils.showNotification('Question submitted for review!');
        return qa;
    }
};

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
        // No Socket.IO setup needed for static hosting
    },

    // Load polls (using sample data only)
    loadPolls: async () => {
        console.log('Using sample polls (Firebase-only mode)');
        PollManager.polls = [...SAMPLE_POLLS];
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

    // Handle voting (local only for static hosting)
    vote: async (pollId, optionId, allowMultiple) => {
        const poll = PollManager.polls.find(p => p.id === pollId);
        if (!poll) return;

        let userResponse = PollManager.userResponses.get(pollId) || [];
        
        if (allowMultiple) {
            if (userResponse.includes(optionId)) {
                // Toggle off
                userResponse = userResponse.filter(id => id !== optionId);
                // Decrease vote count
                const option = poll.options.find(o => o.id === optionId);
                if (option && option.votes > 0) option.votes--;
            } else {
                // Toggle on
                userResponse.push(optionId);
                // Increase vote count
                const option = poll.options.find(o => o.id === optionId);
                if (option) option.votes++;
            }
        } else {
            // Remove previous vote
            if (userResponse.length > 0) {
                const prevOptionId = userResponse[0];
                const prevOption = poll.options.find(o => o.id === prevOptionId);
                if (prevOption && prevOption.votes > 0) prevOption.votes--;
            }
            
            if (!userResponse.includes(optionId)) {
                userResponse = [optionId];
                // Add new vote
                const option = poll.options.find(o => o.id === optionId);
                if (option) option.votes++;
            } else {
                userResponse = [];
            }
        }

        PollManager.userResponses.set(pollId, userResponse);
        PollManager.saveResponses();
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

    setupSocket: () => {
        // Socket.IO disabled for static hosting
        console.log('Real-time updates via Socket.IO disabled (static hosting)');
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

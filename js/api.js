const API_URL = 'http://localhost:8000';

const api = {
    async register(data) {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
        }
    },

    async sendAiMessage(message, history, lang = 'ru') {
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history, lang })
            });
            return await response.json();
        } catch (error) {
            console.error('AI error:', error);
        }
    },

    async findMatches(telegramId) {
        try {
            const response = await fetch(`${API_URL}/matches/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Matches error:', error);
        }
    },

    async createSubscription(telegramId, plan) {
        try {
            const response = await fetch(`${API_URL}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, plan })
            });
            return await response.json();
        } catch (error) {
            console.error('Subscription error:', error);
        }
    },

    async setLanguage(telegramId, language) {
        try {
            const response = await fetch(`${API_URL}/language`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    language: language
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Language error:', error);
        }

    },

    async updateLocation(telegramId, lat, lng) {
        try {
            const response = await fetch(`${API_URL}/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    lat: lat,
                    lng: lng
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Location error:', error);
        }
    },

    async getConversations(telegramId) {
        try {
            const response = await fetch(`${API_URL}/conversations/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Conversations error:', error);
        }
    },

    async sendLike(fromId, toId, likeType) {
        try {
            const response = await fetch(`${API_URL}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_telegram_id: fromId,
                    to_user_id: toId,
                    like_type: likeType
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Like error:', error);
        }
    }
};



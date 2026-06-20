const API_URL = 'https://secret-match-production.up.railway.app';

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

    async getProfile(telegramId) {
        try {
            const response = await fetch(`${API_URL}/profile/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Get profile error:', error);
        }
    },
    async sendAiMessage(message, history) {
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });
            return await response.json();
        } catch (error) {
            console.error('AI chat error:', error);
        }
    },

    async findMatches(telegramId) {
        try {
            const response = await fetch(`${API_URL}/matches/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Find matches error:', error);
        }
    },
    async uploadPhoto(telegramId, file) {
        try {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('telegram_id', telegramId);
            const response = await fetch(`${API_URL}/upload/photo`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload error:', error);
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
    },
    async addFavorite(fromId, toId) {
        try {
            const response = await fetch(`${API_URL}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_telegram_id: fromId,
                    to_user_id: toId
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Favorite error:', error);
        }
    },

    async getFavorites(telegramId) {
        try {
            const response = await fetch(`${API_URL}/favorites/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Get favorites error:', error);
        }
    },
    async getConversations(telegramId) {
        try {
            const response = await fetch(`${API_URL}/conversations/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Get conversations error:', error);
        }
    },

    async getProfileMedia(telegramId) {
        try {
            const response = await fetch(`${API_URL}/media/${telegramId}`);
            return await response.json();
        } catch (error) {
            console.error('Get media error:', error);
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
    async getUserById(userId) {
        try {
            const response = await fetch(`${API_URL}/user/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Get user error:', error);
        }
    },

    async getMessages(telegramId, targetUserId) {
        try {
            const response = await fetch(
                `${API_URL}/messages/${telegramId}/${targetUserId}`
            );
            return await response.json();
        } catch (error) {
            console.error('Get messages error:', error);
        }
    },
    async sendMessage(telegramId, targetUserId, text) {
        try {
            const response = await fetch(`${API_URL}/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_telegram_id: telegramId,
                    to_user_id: targetUserId,
                    text: text
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Send message error:', error);
        }
    },

    async uploadChatMedia(telegramId, targetUserId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('from_telegram_id', telegramId);
            formData.append('to_user_id', targetUserId);
            const response = await fetch(`${API_URL}/messages/media`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Upload chat media error:', error);
        }
    },
    async blockUser(telegramId, targetUserId) {
        try {
            const response = await fetch(`${API_URL}/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_telegram_id: telegramId,
                    to_user_id: targetUserId
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Block error:', error);
        }
    }
};


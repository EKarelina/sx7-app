// Состояние
const state = {
    currentTab: 'tab-search',
    telegramUser: null,
    currentProfile: null,
    cards: [],
    currentCardIndex: 0,
    favorites: [],
    messages: []
};

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        state.telegramUser = tg.initDataUnsafe?.user || null;
    }

    // Инициализируем видео
    initVideo();

    // Загружаем данные
    await loadProfile();
    await loadCards();
    await loadMessages();
    await loadFavorites();
});
// ===== ВИДЕО =====
function initVideo() {
    const womanVideo = document.getElementById('video-woman');
    const manVideo = document.getElementById('video-man');

    if (womanVideo) {
        womanVideo.classList.add('active');
        setInterval(() => {
            if (womanVideo.classList.contains('active')) {
                womanVideo.classList.remove('active');
                manVideo.classList.add('active');
            } else {
                manVideo.classList.remove('active');
                womanVideo.classList.add('active');
            }
        }, 8000);
    }
}
// ===== НАВИГАЦИЯ =====
function showTab(tabId) {
    // Скрываем все табы
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });

    // Убираем активный класс с кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показываем нужный таб
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
        state.currentTab = tabId;
    }

    // Активируем кнопку навигации
    const navMap = {
        'tab-search': 'nav-search',
        'tab-favorites': 'nav-favorites',
        'tab-messages': 'nav-messages',
        'tab-profile': 'nav-profile'
    };

    const navBtn = document.getElementById(navMap[tabId]);
    if (navBtn) navBtn.classList.add('active');
}
// ===== ПРОФИЛЬ =====
async function loadProfile() {
    try {
        const telegramId = state.telegramUser?.id || 'test';
        const profile = await api.getProfile(telegramId);

        if (profile) {
            state.currentProfile = profile;

            // Обновляем UI
            document.getElementById('profile-nickname').textContent =
                profile.nickname || 'Пользователь';
            document.getElementById('profile-city').textContent =
                profile.city || 'Город не указан';

            // Обновляем подписку
            updateSubscriptionCard(profile.subscription_type);
        }
    } catch (error) {
        console.log('Профиль не найден');
    }
}
function updateSubscriptionCard(type) {
    const card = document.getElementById('subscription-card');
    if (!card) return;

    const plans = {
        premium: { icon: '💎', name: 'Premium', color: 'var(--neon-blue)' },
        vip: { icon: '👑', name: 'VIP', color: 'var(--neon-purple)' },
        elite: { icon: '💫', name: 'Elite', color: 'var(--neon-pink)' }
    };

    if (type && plans[type]) {
        const plan = plans[type];
        card.innerHTML = `
            <span class="sub-icon">${plan.icon}</span>
            <div class="sub-info">
                <h3>${plan.name} подписка</h3>
                <p>Полный доступ активен ✅</p>
            </div>
        `;
    }
}
// ===== КАРТОЧКИ АНКЕТ =====
async function loadCards() {
    try {
        const telegramId = state.telegramUser?.id || 'test';
        const matches = await api.findMatches(telegramId);

        if (matches && matches.length > 0) {
            state.cards = matches;
            renderCards();
        } else {
            showEmptyCards();
        }
    } catch (error) {
        // Демо карточки
        showDemoCards();
    }
}
function showDemoCards() {
    state.cards = [
        {
            nickname: 'Анна',
            age: 26,
            city: 'Москва',
            score: 95,
            gender: 'female',
            relationship_format: 'ЖМЖ',
            emoji: '👩'
        },
        {
            nickname: 'Максим',
            age: 31,
            city: 'Москва',
            score: 87,
            gender: 'male',
            relationship_format: 'МЖМ',
            emoji: '👨'
        },
        {
            nickname: 'Екатерина',
            age: 28,
            city: 'СПб',
            score: 82,
            gender: 'female',
            relationship_format: 'Свингеры',
            emoji: '👩'
        }
    ];
    renderCards();
}

function renderCards() {
    const stack = document.getElementById('cards-stack');
    stack.innerHTML = '';

    const visibleCards = state.cards.slice(
        state.currentCardIndex,
        state.currentCardIndex + 3
    );

    visibleCards.reverse().forEach((card, index) => {
        const cardEl = createCardElement(card, index);
        stack.appendChild(cardEl);
    });

    // Добавляем свайп на верхнюю карточку
    const topCard = stack.querySelector('.profile-card.top');
    if (topCard) addSwipeListeners(topCard);
}

function createCardElement(card, index) {
    const div = document.createElement('div');
    div.className = `profile-card ${index === 0 ? 'top' : ''}`;

    div.innerHTML = `
        <div class="card-overlay like">ЛАЙК 👍</div>
        <div class="card-overlay dislike">ПАСС 👎</div>
        <div class="card-media">
            ${card.photo_url
            ? `<img src="${card.photo_url}" alt="${card.nickname}">`
            : `<span>${card.emoji || '👤'}</span>`
        }
        </div>
        
        <div class="card-info">
            <div class="card-name">${card.nickname}, ${card.age}</div>
            <div class="card-details">📍 ${card.city}</div>
            <div class="card-tags">
                ${card.relationship_format
            ? `<span class="card-tag">🔥 ${card.relationship_format}</span>`
            : ''
        }
                ${card.meeting_format
            ? `<span class="card-tag">✨ ${card.meeting_format}</span>`
            : ''
        }
            </div>
        </div>

        ${card.score
            ? `<div class="card-match">${card.score}% совпадение</div>`
            : ''
        }
    `;

    return div;
}

function showEmptyCards() {
    const stack = document.getElementById('cards-stack');
    stack.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">✨</div>
            <p>Пока никого нет</p>
            <span>Возвращайся позже!</span>
        </div>
    `;
}

// ===== СВАЙПЫ =====
function addSwipeListeners(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    card.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        card.style.transform =
            `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;

        // Показываем оверлей
        const likeOverlay = card.querySelector('.card-overlay.like');
        const dislikeOverlay = card.querySelector('.card-overlay.dislike');

        if (currentX > 50) {
            likeOverlay.style.opacity = Math.min(currentX / 100, 1);
            dislikeOverlay.style.opacity = 0;
        } else if (currentX < -50) {
            dislikeOverlay.style.opacity = Math.min(-currentX / 100, 1);
            likeOverlay.style.opacity = 0;
        } else {
            likeOverlay.style.opacity = 0;
            dislikeOverlay.style.opacity = 0;
        }
    });
    card.addEventListener('touchend', () => {
        isDragging = false;

        if (currentX > 100) {
            swipeRight(card);
        } else if (currentX < -100) {
            swipeLeft(card);
        } else {
            // Возвращаем карточку
            card.style.transform = '';
        }
        currentX = 0;
    });
}

function swipeRight(card) {
    card.classList.add('swipe-right');
    setTimeout(() => {
        nextCard();
        handleLike();
    }, 400);
}

function swipeLeft(card) {
    card.classList.add('swipe-left');
    setTimeout(() => {
        nextCard();
        handleDislike();
    }, 400);
}

function nextCard() {
    state.currentCardIndex++;
    if (state.currentCardIndex >= state.cards.length) {
        showEmptyCards();
    } else {
        renderCards();
    }
}

// ===== ЛАЙКИ =====
async function handleLike() {
    const card = state.cards[state.currentCardIndex - 1];
    if (!card) return;

    try {
        const result = await api.sendLike(
            state.telegramUser?.id,
            card.user_id,
            'like'
        );

        // Проверяем матч
        if (result?.is_match) {
            showMatchPopup(card);
        }
    } catch (error) {
        console.log('Лайк отправлен (демо)');
    }

    if (state.currentCardIndex <= state.cards.length) {
        nextCard();
    }
}

async function handleDislike() {
    try {
        await api.sendLike(
            state.telegramUser?.id,
            state.cards[state.currentCardIndex - 1]?.user_id,
            'dislike'
        );
    } catch (error) {
        console.log('Дизлайк (демо)');
    }

    if (state.currentCardIndex <= state.cards.length) {
        nextCard();
    }
}
async function handleFavorite() {
    const card = state.cards[state.currentCardIndex];
    if (!card) return;

    try {
        await api.addFavorite(
            state.telegramUser?.id,
            card.user_id
        );

        // Показываем уведомление
        showNotification('❤️ Добавлено в избранное!');
    } catch (error) {
        showNotification('❤️ Добавлено в избранное!');
    }
}

// ===== МАТЧ ПОПАП =====
function showMatchPopup(card) {
    const popup = document.createElement('div');
    popup.className = 'match-popup';
    popup.innerHTML = `
        <div class="particles" id="match-particles"></div>
        <h1>✨ Match!</h1>
        <p style="color: var(--text-sub); letter-spacing: 2px;">
            Вы понравились друг другу
        </p>
        <div class="match-avatars">
            <div class="match-avatar">
                ${card.emoji || '👤'}
            </div>
            <div style="font-size: 32px;">❤️</div>
            <div class="match-avatar">
                👤
            </div>
        </div>
        <p style="color: var(--text-sub); font-size: 13px; letter-spacing: 2px;">
            ${card.nickname}
        </p>
        <button class="btn-primary" onclick="openChat('${card.user_id}')">
            написать 💌
        </button>
        <button class="btn-secondary" onclick="closeMatchPopup()">
            продолжить поиск
        </button>
    `;
    document.body.appendChild(popup);
    createMatchParticles();
}

function closeMatchPopup() {
    const popup = document.querySelector('.match-popup');
    if (popup) popup.remove();
}

function createMatchParticles() {
    const container = document.getElementById('match-particles');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${2 + Math.random() * 4}s`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(particle);
    }
}

// ===== ИЗБРАННОЕ =====
async function loadFavorites() {
    try {
        const telegramId = state.telegramUser?.id;
        const favorites = await api.getFavorites(telegramId);

        if (favorites && favorites.length > 0) {
            renderFavorites(favorites);
        }
    } catch (error) {
        console.log('Избранное пусто');
    }
}

function renderFavorites(favorites) {
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = favorites.map(f => `
        <div class="favorite-card" onclick="openProfile('${f.user_id}')">
            <div class="favorite-card-media">
                ${f.photo_url
            ? `<img src="${f.photo_url}">`
            : f.emoji || '👤'
        }
            </div>
            <div class="favorite-card-info">
                <div class="favorite-card-name">${f.nickname}, ${f.age}</div>
                <div class="favorite-card-details">📍 ${f.city}</div>
            </div>
        </div>
    `).join('') + `
        <div class="add-media-btn" style="display:none"></div>
    `;
}
// ===== СООБЩЕНИЯ =====
async function loadMessages() {
    try {
        const telegramId = state.telegramUser?.id;
        const messages = await api.getConversations(telegramId);

        if (messages && messages.length > 0) {
            renderMessages(messages);
            updateMessagesBadge(
                messages.filter(m => m.unread_count > 0).length
            );
        }
    } catch (error) {
        console.log('Сообщений нет');
    }
}

function renderMessages(messages) {
    const list = document.getElementById('messages-list');
    list.innerHTML = messages.map(m => `
        <div class="message-item ${m.unread_count > 0 ? 'unread' : ''}" 
             onclick="openChat('${m.user_id}')">
            <div class="message-avatar">
                ${m.photo_url
            ? `<img src="${m.photo_url}">`
            : m.emoji || '👤'
        }
    </div>
            <div class="message-content">
                <div class="message-name">${m.nickname}</div>
                <div class="message-preview">${m.last_message || '...'}</div>
            </div>
            <div class="message-meta">
                <div class="message-time">${formatTime(m.last_time)}</div>
                ${m.unread_count > 0
            ? `<div class="message-unread-count">${m.unread_count}</div>`
            : ''
        }
            </div>
        </div>
    `).join('');
}

function updateMessagesBadge(count) {
    const badge = document.getElementById('messages-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return `${Math.floor(diff / 86400000)} д`;
}

// ===== ЧАТ =====
function openChat(userId) {
    closeMatchPopup();
    // Сохраняем id собеседника
    localStorage.setItem('chat_user_id', userId);
    // Переходим на страницу чата
    window.location.href = `chat.html?user_id=${userId}`;
}

function openProfile(userId) {
    window.location.href = `profile.html?user_id=${userId}`;
}

// ===== ПРОФИЛЬ =====
function editProfile() {
    window.location.href = 'index.html?edit=true';
}
function addMedia() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                await api.uploadPhoto(
                    state.telegramUser?.id,
                    file
                );
                showNotification('📸 Медиа добавлено!');
                await loadProfileMedia();
            } catch (error) {
                showNotification('❌ Ошибка загрузки');
            }
        }
    };
    input.click();
}
async function loadProfileMedia() {
    try {
        const telegramId = state.telegramUser?.id;
        const media = await api.getProfileMedia(telegramId);
        renderProfileMedia(media);
    } catch (error) {
        console.log('Медиа не загружено');
    }
}

function renderProfileMedia(media) {
    const grid = document.getElementById('profile-media-grid');
    if (!grid) return;

    const mediaHtml = media.map(m => `
        <div class="media-item">
            ${m.media_type === 'video'
            ? `<video src="${m.file_url}" autoplay muted loop></video>`
            : `<img src="${m.file_url}" alt="фото">`
        }
        </div>
    `).join('');

    grid.innerHTML = mediaHtml + `
        <div class="add-media-btn" onclick="addMedia()">
            <span>+</span>
            <p>Добавить</p>
        </div>
    `;
}
// ===== ПРЕМИУМ =====
function showPremium() {
    window.location.href = 'index.html#screen-premium';
}

// ===== ВЫХОД =====
function logout() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'Выход',
            message: 'Ты уверен что хочешь выйти?',
            buttons: [
                { id: 'logout', type: 'destructive', text: 'Выйти' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, (buttonId) => {
            if (buttonId === 'logout') {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    } else {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
// ===== УВЕДОМЛЕНИЯ =====
function showNotification(text) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--black-card);
        border: 1px solid var(--border-neon);
        color: var(--text);
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        letter-spacing: 1px;
        z-index: 300;
        box-shadow: var(--glow-blue);
        animation: fadeInOut 2s ease forwards;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
}
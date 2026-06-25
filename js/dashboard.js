const dashState = {
    currentTab: 'tab-map',
    telegramUser: null,
    profile: null,
    cards: [],
    currentCardIndex: 0,
    map: null,
    userMarker: null,
    lang: localStorage.getItem('sx7_lang') || 'ru'
};

document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        dashState.telegramUser = tg.initDataUnsafe?.user || null;
    }

    await loadProfile();
    await loadCards();

    if (dashState.telegramUser?.id) {
        await loadMessages();
    }

    // Инициализируем карту с задержкой
    setTimeout(() => {
        initMap();
        setTimeout(() => {
            if (dashState.map) {
                dashState.map.invalidateSize();
            }
        }, 500);
    }, 300);
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.style.display = 'none';
    });

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });

    const tab = document.getElementById(tabId);
    if (tab) {
        tab.style.display = 'block';
        dashState.currentTab = tabId;
    }

    const navMap = {
        'tab-map': 'nav-map',
        'tab-search': 'nav-search',
        'tab-stories': 'nav-stories',
        'tab-messages': 'nav-messages',
        'tab-profile': 'nav-profile'
    };

    const navBtn = document.getElementById(navMap[tabId]);
    if (navBtn) navBtn.classList.add('active');

    if (tabId === 'tab-map') {
        if (!dashState.map) {
            setTimeout(() => initMap(), 100);
        } else {
            setTimeout(() => dashState.map.invalidateSize(), 100);
        }
    }
}

function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    if (dashState.map) return;

    dashState.map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([55.7558, 37.6173], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(dashState.map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                dashState.map.setView([lat, lng], 14);

                const userIcon = L.divIcon({
                    html: '<div class="user-marker">😈</div>',
                    className: '',
                    iconSize: [40, 40]
                });

                dashState.userMarker = L.marker([lat, lng], { icon: userIcon })
                    .addTo(dashState.map)
                    .bindPopup('ты 😈');

                addNearbyUsers(lat, lng);
            },
            () => {
                addDemoUsers();
            }
        );
    } else {
        addDemoUsers();
    }
}

function addNearbyUsers(lat, lng) {
    const demoUsers = [
        { nick: 'a*****a', emoji: '👩', lat: lat + 0.005, lng: lng + 0.003, type: 'INFP' },
        { nick: 'd*****k', emoji: '👨', lat: lat - 0.003, lng: lng + 0.007, type: 'ENFJ' },
        { nick: 'v*****a', emoji: '👩', lat: lat + 0.008, lng: lng - 0.004, type: 'INTP' },
        { nick: 'm*****x', emoji: '👨', lat: lat - 0.006, lng: lng - 0.002, type: 'ENTP' },
    ];

    demoUsers.forEach(user => {
        const icon = L.divIcon({
            html: `<div class="other-marker">${user.emoji}</div>`,
            className: '',
            iconSize: [36, 36]
        });

        L.marker([user.lat, user.lng], { icon })
            .addTo(dashState.map)
            .bindPopup(`
                <div style="text-align:center;color:#fff;background:#111;padding:8px;border-radius:8px;">
                    <div style="font-size:24px">${user.emoji}</div>
                    <div style="font-weight:700">${user.nick}</div>
                    <div style="color:#39FF14;font-size:12px">${user.type}</div>
                </div>
            `);
    });
}

function addDemoUsers() {
    const center = [55.7558, 37.6173];
    dashState.map.setView(center, 13);
    addNearbyUsers(center[0], center[1]);
}

function centerMap() {
    if (dashState.userMarker) {
        dashState.map.setView(dashState.userMarker.getLatLng(), 14);
    }
}

async function loadProfile() {
    try {
        const profile = await api.getProfile(dashState.telegramUser?.id);
        if (profile) {
            dashState.profile = profile;
            const nick = document.getElementById('profile-nick');
            const city = document.getElementById('profile-city');
            if (nick) nick.textContent = profile.nickname || 'аноним';
            if (city) city.textContent = profile.city || 'город не указан';
        }
    } catch (error) {
        console.log('Profile load error');
    }
}

function editProfile() {
    window.location.href = 'index.html';
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
                await api.uploadPhoto(dashState.telegramUser?.id, file);
                showNotification('📸 добавлено!');
            } catch (error) {
                showNotification('❌ ошибка загрузки');
            }
        }
    };
    input.click();
}

function showPremium() {
    window.location.href = 'index.html';
}

function logout() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'выйти?',
            message: 'точно хочешь выйти?',
            buttons: [
                { id: 'logout', type: 'destructive', text: 'выйти' },
                { id: 'cancel', type: 'cancel', text: 'отмена' }
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

async function loadCards() {
    try {
        const matches = await api.findMatches(dashState.telegramUser?.id);
        if (matches && matches.length > 0) {
            dashState.cards = matches;
            renderCards();
        } else {
            showDemoCards();
        }
    } catch (error) {
        showDemoCards();
    }
}

function showDemoCards() {
    dashState.cards = [
        { nickname: 'anna', age: 23, city: 'москва', score: 94, emoji: '👩', philosophy: 'альтушка', mbti: 'INFP' },
        { nickname: 'dmitry', age: 25, city: 'москва', score: 87, emoji: '👨', philosophy: 'нефор', mbti: 'ENFJ' },
        { nickname: 'vera', age: 21, city: 'спб', score: 81, emoji: '👩', philosophy: 'дарк', mbti: 'INTP' }
    ];
    renderCards();
}

function renderCards() {
    const stack = document.getElementById('cards-stack');
    if (!stack) return;

    stack.innerHTML = '';

    const visible = dashState.cards.slice(
        dashState.currentCardIndex,
        dashState.currentCardIndex + 3
    );

    if (visible.length === 0) {
        stack.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">😈</div>
                <p>пока всё</p>
                <span>возвращайся позже!</span>
            </div>
        `;
        return;
    }

    visible.reverse().forEach((card, index) => {
        const el = createCard(card, index === visible.length - 1);
        stack.appendChild(el);
    });

    const topCard = stack.querySelector('.profile-card.top');
    if (topCard) addSwipe(topCard);
}

function createCard(card, isTop) {
    const div = document.createElement('div');
    div.className = `profile-card ${isTop ? 'top' : ''}`;

    div.innerHTML = `
        <div class="card-overlay-like">ЛАЙК 👍</div>
        <div class="card-overlay-dislike">ПАСС 👎</div>
        <div class="card-media">
            ${card.photo_url
            ? `<img src="${card.photo_url}" alt="${card.nickname}">`
            : card.emoji || '👤'
        }
        </div>
        <div class="card-info">
            <div class="card-name">${card.nickname}, ${card.age || '?'}</div>
            <div class="card-details">📍 ${card.city || '?'}</div>
            <div class="card-tags">
                ${card.philosophy ? `<span class="card-tag">${card.philosophy}</span>` : ''}
                ${card.mbti ? `<span class="card-tag">${card.mbti}</span>` : ''}
            </div>
        </div>
        ${card.score ? `<div class="card-match">${card.score}% мэтч</div>` : ''}
    `;

    return div;
}

function addSwipe(card) {
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
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;

        const likeOverlay = card.querySelector('.card-overlay-like');
        const dislikeOverlay = card.querySelector('.card-overlay-dislike');

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
            card.style.transform = '';
        }
        currentX = 0;
    });
}

function swipeRight(card) {
    card.classList.add('swipe-right');
    setTimeout(() => {
        dashState.currentCardIndex++;
        handleLike();
    }, 400);
}

function swipeLeft(card) {
    card.classList.add('swipe-left');
    setTimeout(() => {
        dashState.currentCardIndex++;
        handleDislike();
    }, 400);
}

async function handleLike() {
    const card = dashState.cards[dashState.currentCardIndex - 1];
    if (!card) return;

    try {
        const result = await api.sendLike(
            dashState.telegramUser?.id,
            card.user_id,
            'like'
        );
        if (result?.is_match) showMatchPopup(card);
    } catch (error) {
        console.log('Like demo');
    }

    renderCards();
}

async function handleDislike() {
    renderCards();
}

async function handleSuper() {
    const card = dashState.cards[dashState.currentCardIndex];
    if (!card) return;
    showNotification('❤️ супер лайк!');
    dashState.currentCardIndex++;
    renderCards();
}

async function handleLike() {
    const card = dashState.cards[dashState.currentCardIndex - 1];
    if (!card) return;

    try {
        const result = await api.sendLike(
            dashState.telegramUser?.id,
            card.user_id,
            'like'
        );
        if (result?.is_match) showMatchPopup(card);
    } catch (error) {
        console.log('Like demo');
    }

    renderCards();
}

async function handleDislike() {
    renderCards();
}

async function handleSuper() {
    const card = dashState.cards[dashState.currentCardIndex];
    if (!card) return;
    showNotification('❤️ супер лайк!');
    dashState.currentCardIndex++;
    renderCards();
}

function openChat(userId) {
    closeMatchPopup();
    window.location.href = `chat.html?user_id=${userId}`;
}

async function loadMessages() {
    try {
        const conversations = await api.getConversations(
            dashState.telegramUser?.id
        );

        if (conversations && conversations.length > 0) {
            renderMessages(conversations);
            const unread = conversations.filter(c => c.unread_count > 0).length;
            updateBadge(unread);
        }
    } catch (error) {
        console.log('Messages load error');
    }
}

function renderMessages(conversations) {
    const list = document.getElementById('messages-list');
    if (!list) return;

    if (!conversations.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💌</div>
                <p>пока пусто</p>
                <span>найди своих и начни общаться!</span>
            </div>
        `;
        return;
    }

    list.innerHTML = conversations.map(c => `
        <div class="message-item ${c.unread_count > 0 ? 'unread' : ''}"
             onclick="openChat('${c.user_id}')">
            <div class="message-avatar">${c.emoji || '👤'}</div>
            <div class="message-content">
                <div class="message-name">${c.nickname}</div>
                <div class="message-preview">${c.last_message || '...'}</div>
            </div>
            <div class="message-meta">
                <div class="message-time">${formatTime(c.last_time)}</div>
                ${c.unread_count > 0
            ? `<div class="message-unread">${c.unread_count}</div>`
            : ''
        }
            </div>
        </div>
    `).join('');
}

function updateBadge(count) {
    const badge = document.getElementById('msg-badge');
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

function addStory() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async (e) => {
        if (e.target.files[0]) {
            showNotification('📸 история добавлена!');
        }
    };
    input.click();
}

function showFilters() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'фильтры',
            message: 'скоро будет! 😈',
            buttons: [{ type: 'ok', text: 'ок' }]
        });
    } else {
        showNotification('скоро будет! 😈');
    }
}

function showNotification(text) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = text;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2000);
}


function openProfile(userId) {
    showNotification('👀 профиль скоро!');
}



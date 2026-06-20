// Состояние
const state = {
    currentScreen: 'screen-landing',
    currentSlide: 1,
    totalSlides: 4,
    currentVideo: 'woman',
    selectedGender: null,
    selectedLooking: null,
    selectedMeeting: null,
    selectedRelation: null,
    selectedPlan: null,
    aiHistory: [],
    telegramUser: null,
    photoFile: null
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        state.telegramUser = tg.initDataUnsafe?.user || null;
    }

    // Запускаем частицы
    createParticles();
    // Запускаем видео
    initVideo();

    // Показываем презентацию
    document.getElementById('presentation').style.display = 'block';
});

// ===== ВИДЕО =====
function initVideo() {
    const womanVideo = document.getElementById('video-woman');
    const manVideo = document.getElementById('video-man');

    // Показываем первое видео
    womanVideo.classList.add('active');

    // Переключаем видео каждые 8 секунд
    setInterval(() => {
        if (state.currentVideo === 'woman') {
            womanVideo.classList.remove('active');
            manVideo.classList.add('active');
            state.currentVideo = 'man';
        } else {
            manVideo.classList.remove('active');
            womanVideo.classList.add('active');
            state.currentVideo = 'woman';
        }
    }, 8000);
}
// ===== ПРЕЗЕНТАЦИЯ =====
function nextSlide() {
    const current = document.getElementById(`slide-${state.currentSlide}`);
    current.classList.remove('active');

    state.currentSlide++;

    if (state.currentSlide <= state.totalSlides) {
        const next = document.getElementById(`slide-${state.currentSlide}`);
        next.classList.add('active');
    }
}

function startApp() {
    // Скрываем презентацию
    const presentation = document.getElementById('presentation');
    presentation.style.opacity = '0';
    presentation.style.transition = 'opacity 1s ease';

    setTimeout(() => {
        presentation.style.display = 'none';
        showScreen('screen-landing');
    }, 1000);
}
// ===== ЧАСТИЦЫ =====
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${3 + Math.random() * 7}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.width = `${1 + Math.random() * 3}px`;
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ===== НАВИГАЦИЯ =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
        state.currentScreen = screenId;
        window.scrollTo(0, 0);
    }
}
// ===== ФОРМА =====
function selectGender(value, btn) {
    state.selectedGender = value;
    document.querySelectorAll('#screen-register .form-group:nth-child(4) .radio-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function selectLooking(value, btn) {
    state.selectedLooking = value;
    document.querySelectorAll('#screen-register .form-group:nth-child(5) .radio-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function selectMeeting(value, btn) {
    state.selectedMeeting = value;
    document.querySelectorAll('#screen-register .form-group:nth-child(6) .radio-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function selectRelation(value, btn) {
    state.selectedRelation = value;
    document.querySelectorAll('#screen-register .form-group:nth-child(7) .radio-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function selectPlan(value, planEl) {
    state.selectedPlan = value;
    document.querySelectorAll('.plan')
        .forEach(p => p.classList.remove('selected'));
    planEl.classList.add('selected');

    const prices = {
        premium: '2 990 ₽/месяц',
        vip: '7 990 ₽/месяц',
        elite: '19 990 ₽/месяц'
    };

    document.getElementById('pay-btn').textContent =
        `оформить ${value.toUpperCase()} — ${prices[value]} 💎`;
}

// ===== ФОТО =====
function uploadPhoto() {
    document.getElementById('photo-input').click();
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        state.photoFile = input.files[0];
        const reader = new FileReader();
        const isVideo = input.files[0].type.startsWith('video');

        reader.onload = (e) => {
            const preview = document.getElementById('photo-preview');
            if (isVideo) {
                preview.innerHTML = `
                    <video src="${e.target.result}" 
                           class="photo-preview-img" 
                           autoplay muted loop></video>
                `;
            } else {
                preview.innerHTML = `
                    <img src="${e.target.result}" 
                         class="photo-preview-img">
                `;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}
// ===== ОТПРАВКА АНКЕТЫ =====
async function submitProfile() {
    const nickname = document.getElementById('nickname').value.trim();
    const age = document.getElementById('age').value;
    const city = document.getElementById('city').value.trim();

    if (!nickname || !age || !city) {
        alert('Заполни все поля!');
        return;
    }

    if (age < 18) {
        alert('Тебе должно быть 18+!');
        return;
    }

    const profileData = {
        telegram_id: state.telegramUser?.id || 'test',
        nickname,
        age: parseInt(age),
        city,
        gender: state.selectedGender,
        looking_for: state.selectedLooking,
        meeting_format: state.selectedMeeting,
        relationship_format: state.selectedRelation
    };

    const btn = document.querySelector('#screen-register .btn-primary');
    btn.textContent = 'создаём профиль...';
    btn.disabled = true;

    try {
        await api.register(profileData);
        if (state.photoFile) {
            await api.uploadPhoto(profileData.telegram_id, state.photoFile);
        }
        await showPreviewMatches();
    } catch (error) {
        showPreviewDemo();
    } finally {
        btn.textContent = 'создать профиль 🔥';
        btn.disabled = false;
    }
}

// ===== ПРЕВЬЮ =====
function showPreviewDemo() {
    const cards = document.getElementById('preview-cards');

    const demoProfiles = [
        { emoji: '👩', name: 'A*****a', age: 26, city: 'Москва', match: 95 },
        { emoji: '👨', name: 'M*****s', age: 31, city: 'Москва', match: 89 },
        { emoji: '👩', name: 'E*****a', age: 28, city: 'Москва', match: 82 },
    ];

    cards.innerHTML = demoProfiles.map(p => `
        <div class="preview-card">
            <span class="preview-match">${p.match}% совпадение</span>
            <div class="preview-card-avatar">${p.emoji}</div>
            <div class="preview-card-info">
                <div class="preview-card-name">${p.name}, ${p.age}</div>
                <div class="preview-card-details">${p.city}</div>
            </div>
            <div class="preview-card-lock">🔒</div>
        </div>
    `).join('');

    showScreen('screen-preview');
}

async function showPreviewMatches() {
    try {
        const matches = await api.findMatches(
            state.telegramUser?.id || 'test'
        );
        const cards = document.getElementById('preview-cards');

        if (matches && matches.length > 0) {
            cards.innerHTML = matches.slice(0, 3).map(m => `
                <div class="preview-card">
                    <span class="preview-match">${m.score}% совпадение</span>
                    <div class="preview-card-avatar">👤</div>
                    <div class="preview-card-info">
                        <div class="preview-card-name">***</div>
                        <div class="preview-card-details">${m.city || '***'}</div>
                    </div>
                    <div class="preview-card-lock">🔒</div>
                </div>
            `).join('');
        } else {
            showPreviewDemo();
            return;
        }

        showScreen('screen-preview');
    } catch {
        showPreviewDemo();
    }
}
// ===== ЧАТ СО SCARLETT =====
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (!message) return;

    input.value = '';

    addMessage(message, 'user');
    showTyping();

    try {
        const result = await api.sendAiMessage(message, state.aiHistory);
        hideTyping();

        if (result?.response) {
            state.aiHistory = result.history || state.aiHistory;
            addMessage(result.response, 'bot');

            if (result.show_preview) {
                setTimeout(() => showPreviewDemo(), 1500);
            }
        }
    } catch (error) {
        hideTyping();
        addMessage(
            'Расскажи подробнее... я слушаю 😏🖤',
            'bot'
        );
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function addMessage(text, sender) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    div.innerHTML = `<div class="message-bubble">${text}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message bot-message';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
}

// ===== ОПЛАТА =====
async function handlePayment() {
    if (!state.selectedPlan) {
        alert('Выбери план!');
        return;
    }

    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'Оформление подписки',
            message: `Ты выбрал план ${state.selectedPlan.toUpperCase()}. Перейти к оплате?`,
            buttons: [
                { id: 'pay', type: 'default', text: 'Оплатить' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, async (buttonId) => {
            if (buttonId === 'pay') {
                await api.createSubscription(
                    state.telegramUser?.id,
                    state.selectedPlan
                );
                showScreen('screen-register');
            }
        });
    } else {
        alert('Оплата доступна только в Telegram!');
    }
}
// ===== ЛОГИН =====
function loginWithTelegram() {
    const tg = window.Telegram?.WebApp;
    if (tg && state.telegramUser) {
        showScreen('screen-onboarding');
    } else {
        showScreen('screen-onboarding');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        state.telegramUser = tg.initDataUnsafe?.user || null;
    }

    createParticles();

    // Восстанавливаем язык
    const savedLang = localStorage.getItem('sx7_lang') || 'ru'
    state.currentLang = savedLang
    if (savedLang === 'en') {
        switchAppLang('en')
    }

    document.getElementById('presentation').style.display = 'block';
});

// Состояние
const state = {
    currentSlide: 1,
    totalSlides: 4,
    selectedOptions: {},
    telegramUser: null,
    photoFile: null,
    selectedPlan: null,
    aiHistory: [],
    currentLang: 'ru'
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        state.telegramUser = tg.initDataUnsafe?.user || null;
    }

    createParticles();
    document.getElementById('presentation').style.display = 'block';
});
// ===== ЧАСТИЦЫ =====
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDuration = `${3 + Math.random() * 7}s`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(p);
    }
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
    const presentation = document.getElementById('presentation');
    presentation.style.opacity = '0';
    presentation.style.transition = 'opacity 1s ease';

    setTimeout(() => {
        presentation.style.display = 'none';
        document.getElementById('app').style.display = 'block';
        showScreen('screen-landing');
    }, 1000);
}

// ===== НАВИГАЦИЯ =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.style.display = 'none';
    });

    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

// ===== ФОРМА =====
function selectOption(type, value, btn) {
    state.selectedOptions[type] = value;

    const group = btn.parentElement;
    group.querySelectorAll('.radio-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
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
                preview.innerHTML = `<video src="${e.target.result}" class="photo-preview-img" autoplay muted loop></video>`;
            } else {
                preview.innerHTML = `<img src="${e.target.result}" class="photo-preview-img">`;
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
        alert('заполни все поля 😅');
        return;
    }

    if (age < 18) {
        alert('тебе должно быть 18+ 🙅');
        return;
    }

    const profileData = {
        telegram_id: state.telegramUser?.id || 'test',
        nickname,
        age: parseInt(age),
        city,
        ...state.selectedOptions
    };

    const btn = document.querySelector('#screen-register .btn-primary');
    btn.textContent = 'ищем твоих...';
    btn.disabled = true;

    try {
        await api.register(profileData);
        showPreviewDemo();
    } catch (error) {
        showPreviewDemo();
    } finally {
        btn.textContent = 'погнали 🔥';
        btn.disabled = false;
    }
}

// ===== ПРЕВЬЮ =====
function showPreviewDemo() {
    const cards = document.getElementById('preview-cards');

    const demos = [
        { emoji: '👩', name: 'a*****a', type: 'INFP • альтушка', match: 94 },
        { emoji: '👨', name: 'd*****k', type: 'ENFJ • нефор', match: 87 },
        { emoji: '👩', name: 'v*****a', type: 'INTP • дарк', match: 81 },
    ];

    cards.innerHTML = demos.map(p => `
        <div class="preview-card" style="position:relative;">
            <span style="position:absolute;top:12px;left:12px;
                background:linear-gradient(135deg,#39FF14,#BF00FF);
                padding:4px 10px;border-radius:20px;
                font-size:11px;font-weight:700;color:#080808;">
                ${p.match}% мэтч
            </span>
            <div class="preview-card-avatar" style="filter:blur(6px)">
                ${p.emoji}
            </div>
            <div style="flex:1;filter:blur(4px)">
                <div style="font-weight:700">${p.name}</div>
                <div style="font-size:12px;color:#39FF14">${p.type}</div>
            </div>
            <div style="font-size:20px">🔒</div>
        </div>
    `).join('');

    showScreen('screen-preview');
}

// ===== ЧАТ С ИИ =====
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addMessage(message, 'user');
    showTyping();

    try {
        const result = await api.sendAiMessage(message, state.aiHistory, state.currentLang || 'ru');
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
        addMessage('кайф 😈 а ещё что?', 'bot');
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') sendMessage();
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

// ===== ПЛАН =====
function selectPlan(value, planEl) {
    state.selectedPlan = value;
    document.querySelectorAll('.plan').forEach(p => p.classList.remove('selected'));
    planEl.classList.add('selected');

    const prices = {
        sinner: '299 ₽/мес',
        deadly: '690 ₽/мес',
        cardinal: '990 ₽/мес'
    };

    document.getElementById('pay-btn').textContent =
        `оформить ${value} — ${prices[value]} 😈`;
}

// ===== ОПЛАТА =====
async function handlePayment() {
    if (!state.selectedPlan) {
        alert('выбери план 😅');
        return;
    }

    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'Sx7 ' + state.selectedPlan,
            message: 'подтвердить оплату?',
            buttons: [
                { id: 'pay', type: 'default', text: 'да погнали 🔥' },
                { id: 'cancel', type: 'cancel', text: 'потом' }
            ]
        }, async (buttonId) => {
            if (buttonId === 'pay') {
                await api.createSubscription(
                    state.telegramUser?.id,
                    state.selectedPlan
                );
                alert('🔥 подписка активирована!');
                showScreen('screen-register');
            }
        });
    } else {
        alert('оплата только в Telegram!');
    }
}

// ===== ЛОГИН =====
function loginWithTelegram() {
    showScreen('screen-onboarding');
}

// ===== ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА ФОРМЫ =====
const formTexts = {
    ru: {
        title: "расскажи о себе 🖤",
        nickname: "ник",
        nickplaceholder: "как тебя называть?",
        age: "возраст",
        ageplaceholder: "сколько тебе?",
        city: "город",
        cityplaceholder: "откуда ты?",
        philosophy: "философия",
        philosophyplaceholder: "или напиши своё... 🖤",
        looking: "кого ищешь",
        format: "что ищешь",
        vibe: "на чём торчишь",
        photo: "фото",
        submit: "погнали 🔥",
        options: {
            philosophy: ["нефор", "альтушка", "е-гёрл", "дарк", "эстет", "рандом 😅"],
            looking: ["мальчика", "девочку", "всех 👀", "группу 😈"],
            format: ["потусить 🤙", "что-то большее 👀", "приключение 🌙", "своих людей 🖤"],
            vibe: ["музыка 🎵", "адреналин ⚡", "эстетика 🖤", "люди 👥", "всё сразу 😈"]
        }
    },

    en: {
        title: "tell us about yourself 🖤",
        nickname: "nick",
        nickplaceholder: "what should we call you?",
        age: "age",
        ageplaceholder: "how old are you?",
        city: "city",
        cityplaceholder: "where are you from?",
        philosophy: "philosophy",
        philosophyplaceholder: "or write your own... 🖤",
        looking: "looking for",
        format: "what you want",
        vibe: "what you're into",
        photo: "photo",
        submit: "let's go 🔥",
        options: {
            philosophy: ["alt", "e-girl", "dark", "aesthetic", "indie", "random 😅"],
            looking: ["a boy", "a girl", "everyone 👀", "a group 😈"],
            format: ["just hang 🤙", "something more 👀", "adventure 🌙", "my people 🖤"],
            vibe: ["music 🎵", "adrenaline ⚡", "aesthetics 🖤", "people 👥", "everything 😈"]
        }
    }
}

function switchFormLang(lang) {
    const texts = formTexts[lang];

    // Заголовок
    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = texts.title;

    // Лейблы
    const labelNick = document.getElementById('label-nick');
    if (labelNick) labelNick.textContent = texts.nickname;

    const labelAge = document.getElementById('label-age');
    if (labelAge) labelAge.textContent = texts.age;

    const labelCity = document.getElementById('label-city');
    if (labelCity) labelCity.textContent = texts.city;

    const labelPhilosophy = document.getElementById('label-philosophy');
    if (labelPhilosophy) labelPhilosophy.textContent = texts.philosophy;

    const labelLooking = document.getElementById('label-looking');
    if (labelLooking) labelLooking.textContent = texts.looking;

    const labelFormat = document.getElementById('label-format');
    if (labelFormat) labelFormat.textContent = texts.format;

    const labelVibe = document.getElementById('label-vibe');
    if (labelVibe) labelVibe.textContent = texts.vibe;

    const labelPhoto = document.getElementById('label-photo');
    if (labelPhoto) labelPhoto.textContent = texts.photo;

    // Плейсхолдеры
    document.getElementById('nickname').placeholder = texts.nickplaceholder;
    document.getElementById('age').placeholder = texts.ageplaceholder;
    document.getElementById('city').placeholder = texts.cityplaceholder;
    document.getElementById('philosophy-custom').placeholder = texts.philosophyplaceholder;

    // Кнопки философии
    const philBtns = document.querySelectorAll('#group-philosophy .radio-btn');
    texts.options.philosophy.forEach((text, i) => {
        if (philBtns[i]) {
            philBtns[i].textContent = text;
            philBtns[i].onclick = function () {
                selectOption('philosophy', text, this);
            };
        }
    });

    // Кнопки кого ищешь
    const lookBtns = document.querySelectorAll('#group-looking .radio-btn');
    texts.options.looking.forEach((text, i) => {
        if (lookBtns[i]) {
            lookBtns[i].textContent = text;
            lookBtns[i].onclick = function () {
                selectOption('looking', text, this);
            };
        }
    });

    // Кнопки что ищешь
    const formatBtns = document.querySelectorAll('#group-format .radio-btn');
    texts.options.format.forEach((text, i) => {
        if (formatBtns[i]) {
            formatBtns[i].textContent = text;
            formatBtns[i].onclick = function () {
                selectOption('format', text, this);
            };
        }
    });

    // Кнопки вайб
    const vibeBtns = document.querySelectorAll('#group-vibe .radio-btn');
    texts.options.vibe.forEach((text, i) => {
        if (vibeBtns[i]) {
            vibeBtns[i].textContent = text;
            vibeBtns[i].onclick = function () {
                selectOption('vibe', text, this);
            };
        }
    });

    // Кнопка отправки
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.textContent = texts.submit;

    // Активная кнопка языка
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const activeLangBtn = document.getElementById(`form-lang-${lang}`);
    if (activeLangBtn) activeLangBtn.classList.add('active');

    state.selectedOptions.lang = lang;
}


// ===== ЯЗЫК ПРИЛОЖЕНИЯ =====
const appLang = {
    ru: {
        landingSub: "найди своих 🖤",
        previewCount: "уже здесь",
        btnEnter: "войти 😈",
        btnHaveAccount: "уже есть аккаунт",
        onboardingTitle: "как начнём? 😈",
        onboardingSub: "выбери путь",
        aiTitle: "поговори с ИИ",
        aiDesc: "расскажи кто ты — найдём твоих людей",
        formTitle: "заполни анкету",
        formDesc: "подробно о себе и своих предпочтениях",
        chatPlaceholder: "пиши...",
        firstMessage: "ну чё 😈 давно тебя ждали... расскажи кто ты на самом деле 🖤"
    },
    en: {
        landingSub: "find your people 🖤",
        previewCount: "already here",
        btnEnter: "enter 😈",
        btnHaveAccount: "already have account",
        onboardingTitle: "how to start? 😈",
        onboardingSub: "choose your path",
        aiTitle: "talk to AI",
        aiDesc: "tell who you are — we'll find your people",
        formTitle: "fill the form",
        formDesc: "tell us about yourself in detail",
        chatPlaceholder: "type...",
        firstMessage: "yoo 😈 we've been waiting... tell me who you really are 🖤"
    }
}

function switchAppLang(lang) {
    state.currentLang = lang
    const t = appLang[lang]

    // Лендинг
    const landingSub = document.getElementById('landing-sub')
    if (landingSub) landingSub.textContent = t.landingSub

    // Кнопки лендинга
    const btns = document.querySelectorAll('.landing-btns .btn-primary')
    if (btns[0]) btns[0].textContent = t.btnEnter

    const btnSecondary = document.querySelector('.landing-btns .btn-secondary')
    if (btnSecondary) btnSecondary.textContent = t.btnHaveAccount

    // Онбординг
    const onboardingTitle = document.querySelector('.onboarding h2')
    if (onboardingTitle) onboardingTitle.textContent = t.onboardingTitle

    const onboardingSub = document.querySelector('.onboarding .sub')
    if (onboardingSub) onboardingSub.textContent = t.onboardingSub

    // Карточки онбординга
    const choiceCards = document.querySelectorAll('.choice-card h3')
    if (choiceCards[0]) choiceCards[0].textContent = t.aiTitle
    if (choiceCards[1]) choiceCards[1].textContent = t.formTitle

    const choiceDescs = document.querySelectorAll('.choice-card p')
    if (choiceDescs[0]) choiceDescs[0].textContent = t.aiDesc
    if (choiceDescs[1]) choiceDescs[1].textContent = t.formDesc
    // Чат
    const chatInput = document.getElementById('user-input')
    if (chatInput) chatInput.placeholder = t.chatPlaceholder

    // Первое сообщение в чате
    const firstMsg = document.querySelector('.bot-message .message-bubble')
    if (firstMsg) firstMsg.textContent = t.firstMessage

    // Переключаем кнопки языка
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll(`[id$="-${lang}"]`).forEach(b => b.classList.add('active'))

    // Переключаем язык формы
    switchFormLang(lang)

    // Сохраняем
    state.selectedOptions.lang = lang
    localStorage.setItem('sx7_lang', lang)
}
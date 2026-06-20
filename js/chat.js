const chatState = {
    telegramUser: null,
    targetUserId: null,
    targetProfile: null,
    messages: [],
    isPremium: false,
    pollingInterval: null
};

document.addEventListener('DOMContentLoaded', async () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        chatState.telegramUser = tg.initDataUnsafe?.user || null;
    }

    // Получаем id собеседника из URL
    const params = new URLSearchParams(window.location.search);
    chatState.targetUserId = params.get('user_id');

    // Инициализируем видео
    initChatVideo();

    // Загружаем профиль собеседника
    await loadTargetProfile();
    // Проверяем подписку
    await checkPremium();

    // Загружаем сообщения
    await loadMessages();

    // Запускаем polling новых сообщений
    startPolling();
});

function initChatVideo() {
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
async function loadTargetProfile() {
    try {
        const profile = await api.getUserById(chatState.targetUserId);
        if (profile) {
            chatState.targetProfile = profile;
            document.getElementById('chat-username').textContent =
                profile.nickname || 'Пользователь';
        }
    } catch (error) {
        document.getElementById('chat-username').textContent = 'Пользователь';
    }
}

async function checkPremium() {
    try {
        const myProfile = await api.getProfile(chatState.telegramUser?.id);
        chatState.isPremium = myProfile?.is_premium || false;

        if (!chatState.isPremium) {
            document.getElementById('premium-block').classList.remove('hidden');
            document.getElementById('chat-input-area').classList.add('hidden');
        }
    } catch (error) {
        console.log('Проверка подписки не удалась');
    }
}
async function loadMessages() {
    try {
        const messages = await api.getMessages(
            chatState.telegramUser?.id,
            chatState.targetUserId
        );

        if (messages && messages.length > 0) {
            chatState.messages = messages;
            renderMessages(messages);
        }
    } catch (error) {
        console.log('Сообщений нет');
    }
}

function renderMessages(messages) {
    const container = document.getElementById('chat-messages');

    messages.forEach(msg => {
        const isSent = msg.sender_telegram_id == chatState.telegramUser?.id;
        addMessageToUI(msg.text, isSent, msg.created_at, msg.media_type, msg.media_url);
    });

    scrollToBottom();
}

function addMessageToUI(text, isSent, time, mediaType, mediaUrl) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-message ${isSent ? 'sent' : 'received'}`;

    let mediaHtml = '';
    if (mediaType && mediaUrl) {
        if (mediaType === 'video') {
            mediaHtml = `
                <div class="chat-message-media">
                    <video src="${mediaUrl}" controls></video>
                </div>
            `;
        } else {
            mediaHtml = `
                <div class="chat-message-media">
                    <img src="${mediaUrl}" alt="фото">
                </div>
            `;
        }
    }
    div.innerHTML = `
        ${mediaHtml}
        ${text ? `<div class="chat-message-bubble">${text}</div>` : ''}
        <div class="chat-message-time">
            ${formatMessageTime(time)}
            ${isSent ? '<span class="chat-message-status">✓✓</span>' : ''}
        </div>
    `;

    container.appendChild(div);
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// ===== ОТПРАВКА =====
async function sendMessage() {
    if (!chatState.isPremium) {
        showPremium();
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text) return;

    input.value = '';

    // Добавляем в UI сразу
    addMessageToUI(text, true, new Date().toISOString());
    scrollToBottom();

    try {
        await api.sendMessage(
            chatState.telegramUser?.id,
            chatState.targetUserId,
            text
        );
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
// ===== МЕДИА =====
function sendMedia() {
    if (!chatState.isPremium) {
        showPremium();
        return;
    }
    document.getElementById('media-input').click();
}

async function handleMediaUpload(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const isVideo = file.type.startsWith('video');

    try {
        const result = await api.uploadChatMedia(
            chatState.telegramUser?.id,
            chatState.targetUserId,
            file
        );

        if (result?.media_url) {
            addMessageToUI(
                '',
                true,
                new Date().toISOString(),
                isVideo ? 'video' : 'photo',
                result.media_url
            );
            scrollToBottom();
        }
    } catch (error) {
        console.error('Ошибка загрузки медиа:', error);
    }
}
// ===== POLLING =====
function startPolling() {
    chatState.pollingInterval = setInterval(async () => {
        try {
            const messages = await api.getMessages(
                chatState.telegramUser?.id,
                chatState.targetUserId
            );

            if (messages && messages.length > chatState.messages.length) {
                const newMessages = messages.slice(chatState.messages.length);
                newMessages.forEach(msg => {
                    const isSent = msg.sender_telegram_id == chatState.telegramUser?.id;
                    addMessageToUI(
                        msg.text,
                        isSent,
                        msg.created_at,
                        msg.media_type,
                        msg.media_url
                    );
                });
                chatState.messages = messages;
                scrollToBottom();
            }
        } catch (error) {
            console.log('Polling error');
        }
    }, 3000);
}
// ===== МЕНЮ =====
function showChatMenu() {
    const menu = document.getElementById('chat-menu');
    menu.classList.toggle('hidden');
}

function viewProfile() {
    document.getElementById('chat-menu').classList.add('hidden');
    window.location.href = `profile.html?user_id=${chatState.targetUserId}`;
}

async function addToFavorites() {
    document.getElementById('chat-menu').classList.add('hidden');
    try {
        await api.addFavorite(
            chatState.telegramUser?.id,
            chatState.targetUserId
        );
        showChatNotification('❤️ Добавлено в избранное!');
    } catch (error) {
        showChatNotification('❌ Ошибка');
    }
}
async function blockUser() {
    document.getElementById('chat-menu').classList.add('hidden');
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.showPopup({
            title: 'Блокировка',
            message: 'Заблокировать этого пользователя?',
            buttons: [
                { id: 'block', type: 'destructive', text: 'Заблокировать' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, async (buttonId) => {
            if (buttonId === 'block') {
                try {
                    await api.blockUser(
                        chatState.telegramUser?.id,
                        chatState.targetUserId
                    );
                    goBack();
                } catch (error) {
                    console.error('Block error:', error);
                }
            }
        });
    }
}
function openUserProfile() {
    window.location.href = `profile.html?user_id=${chatState.targetUserId}`;
}

// ===== НАВИГАЦИЯ =====
function goBack() {
    if (chatState.pollingInterval) {
        clearInterval(chatState.pollingInterval);
    }
    window.location.href = 'dashboard.html';
}

function showPremium() {
    const popup = document.createElement('div');
    popup.id = 'premium-popup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(5,5,8,0.95);
        z-index: 200;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
    `;
    popup.innerHTML = `
        <div style="font-size: 52px; margin-bottom: 24px; 
             filter: drop-shadow(0 0 20px var(--neon-blue))">💎</div>
        
        <h2 style="font-size: 24px; font-weight: 300; 
                   letter-spacing: 6px; text-transform: uppercase;
                   background: var(--gradient-neon);
                   -webkit-background-clip: text;
                   -webkit-text-fill-color: transparent;
                   margin-bottom: 12px;">
            Только для избранных
        </h2>
        
        <p style="color: var(--text-sub); font-size: 14px; 
                  letter-spacing: 2px; margin-bottom: 40px;">
            Оформи подписку чтобы начать общение
        </p>
         <div style="width: 100%; display: flex; 
                    flex-direction: column; gap: 12px;">
            
            <div onclick="selectAndPay('premium')" style="
                background: var(--black-card);
                border: 1px solid var(--border-neon);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                text-align: left;
                transition: all 0.3s;
            ">
                <div style="display: flex; 
                            justify-content: space-between; 
                            align-items: center;">
                    <div>
                        <div style="font-size: 16px; 
                                    letter-spacing: 2px;">
                            💎 Premium
                        </div>
                        <div style="color: var(--text-sub); 
                                    font-size: 12px; margin-top: 4px;">
                            Все фото • Чат • Приоритет
                        </div>
                    </div>
                    <div style="background: var(--gradient-neon);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                font-size: 18px; font-weight: 700;">
                        2 990 ₽
                    </div>
                </div>
            </div>
            <div onclick="selectAndPay('vip')" style="
                background: var(--black-card);
                border: 2px solid var(--neon-purple);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                text-align: left;
                box-shadow: var(--glow-purple);
                position: relative;
            ">
                <div style="position: absolute; top: -12px; left: 50%;
                            transform: translateX(-50%);
                            background: var(--gradient-neon);
                            padding: 4px 16px; border-radius: 20px;
                            font-size: 10px; font-weight: 700;
                            letter-spacing: 2px; white-space: nowrap;">
                    ПОПУЛЯРНЫЙ
                </div>
                <div style="display: flex; 
                            justify-content: space-between; 
                            align-items: center;">
                    <div>
                        <div style="font-size: 16px; 
                                    letter-spacing: 2px;">
                            👑 VIP
                        </div>
                          <div style="color: var(--text-sub); 
                                    font-size: 12px; margin-top: 4px;">
                            Всё + Групповые чаты • Топ
                        </div>
                    </div>
                    <div style="background: var(--gradient-neon);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                font-size: 18px; font-weight: 700;">
                        7 990 ₽
                    </div>
                </div>
            </div>

            <div onclick="selectAndPay('elite')" style="
                background: var(--black-card);
                border: 1px solid gold;
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                text-align: left;
            ">
                <div style="display: flex; 
                            justify-content: space-between; 
                            align-items: center;">
                    <div>
                        <div style="font-size: 16px; 
                                    letter-spacing: 2px;">
                            💫 Elite
                        </div>
                         <div style="color: var(--text-sub); 
                                    font-size: 12px; margin-top: 4px;">
                            Всё + Менеджер • Мероприятия
                        </div>
                    </div>
                    <div style="color: gold; font-size: 18px; 
                                font-weight: 700;">
                        19 990 ₽
                    </div>
                </div>
            </div>
        </div>

        <button onclick="closePremiumPopup()" style="
            background: transparent;
            border: none;
            color: var(--text-sub);
            font-size: 13px;
            letter-spacing: 2px;
            margin-top: 24px;
            cursor: pointer;
            text-transform: uppercase;
        ">
            позже
        </button>
    `;
    document.body.appendChild(popup);
}

async function selectAndPay(plan) {
    const tg = window.Telegram?.WebApp;

    const prices = {
        premium: '2 990 ₽',
        vip: '7 990 ₽',
        elite: '19 990 ₽'
    };

    if (tg) {
        tg.showPopup({
            title: `Подписка ${plan.toUpperCase()}`,
            message: `Оформить подписку за ${prices[plan]}/месяц?`,
            buttons: [
                { id: 'pay', type: 'default', text: 'Оплатить' },
                { id: 'cancel', type: 'cancel', text: 'Отмена' }
            ]
        }, async (buttonId) => {
            if (buttonId === 'pay') {
                await api.createSubscription(
                    chatState.telegramUser?.id,
                    plan
                );
                chatState.isPremium = true;
                closePremiumPopup();
                // Показываем инпут
                document.getElementById('premium-block')
                    .classList.add('hidden');
                document.getElementById('chat-input-area')
                    .classList.remove('hidden');

                showChatNotification('✅ Подписка активирована!');
            }
        });
    } else {
        // Для теста без Telegram
        chatState.isPremium = true;
        closePremiumPopup();
        document.getElementById('premium-block')
            .classList.add('hidden');
        document.getElementById('chat-input-area')
            .classList.remove('hidden');
        showChatNotification('✅ Подписка активирована!');
    }
}

function closePremiumPopup() {
    const popup = document.getElementById('premium-popup');
    if (popup) popup.remove();
}

// ===== УВЕДОМЛЕНИЯ =====
function showChatNotification(text) {
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50 %;
    transform: translateX(-50 %);
    background: var(--black - card);
    border: 1px solid var(--border - neon);
    color: var(--text);
    padding: 12px 24px;
    border - radius: 24px;
    font - size: 14px;
    letter - spacing: 1px;
    z - index: 300;
    box - shadow: var(--glow - blue);
    animation: fadeInOut 2s ease forwards;
    `;
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}
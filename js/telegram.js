const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const tgUser = tg?.initDataUnsafe?.user || {};
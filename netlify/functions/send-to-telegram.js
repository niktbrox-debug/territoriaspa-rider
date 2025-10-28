// Импортируем 'node-fetch' (он будет доступен на Netlify)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Основная функция-обработчик
exports.handler = async function(event, context) {
    // 1. Получаем секретные данные ИЗ НАСТРОЕК ХОСТИНГА (безопасно!)
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    // 2. Проверяем, что это POST запрос
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 3. Получаем сообщение, которое прислал наш сайт
        const body = JSON.parse(event.body);
        const message = body.message;

        if (!message) {
            throw new Error('Нет сообщения в теле запроса');
        }

        // 4. Готовим URL для API Telegram
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        // 5. Отправляем сообщение в твой чат
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML' // Можно использовать HTML или Markdown для форматирования
            })
        });

        const telegramResponse = await response.json();

        // 6. Проверяем, что Telegram принял сообщение
        if (!telegramResponse.ok) {
            // Если Telegram вернул ошибку, логируем ее
            console.error('Ошибка от Telegram:', telegramResponse.description);
            throw new Error(telegramResponse.description);
        }

        // 7. Отправляем на сайт ответ "Успех"
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        // 8. Если что-то пошло не так, отправляем на сайт ответ "Ошибка"
        console.error('Внутренняя ошибка сервера:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
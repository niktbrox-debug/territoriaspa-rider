const fetch = require('node-fetch');

// Основная функция-обработчик
exports.handler = async function(event, context) {
    // 1. Получаем секретные данные ИЗ НАСТРОЕК ХОСТИНГА
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_IDS_STRING = process.env.CHAT_ID; // "123,456,789"

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
        if (!CHAT_IDS_STRING) {
            throw new Error('CHAT_ID не найден в настройках');
        }

        // 4. ПРЕВРАЩАЕМ СТРОКУ ID В МАССИВ
        const chatIds = CHAT_IDS_STRING.split(','); // ['123', '456', '789']

        // 5. Готовим URL для API Telegram
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        // 6. Создаем массив "обещаний" отправить сообщение каждому
        const sendPromises = chatIds.map(chatId => {
            // Убираем случайные пробелы, если пользователь их оставил
            const trimmedChatId = chatId.trim(); 
            if (!trimmedChatId) {
                return Promise.resolve(); // Пропускаем пустые ID
            }

            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: trimmedChatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            }).then(response => response.json());
        });

        // 7. Отправляем всем ОДНОВРЕМЕННО
        const results = await Promise.allSettled(sendPromises);

        // (Необязательно) Логируем ошибки в Netlify, если кому-то не ушло
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Ошибка отправки для CHAT_ID ${chatIds[index]}:`, result.reason);
            } else if (result.value && !result.value.ok) {
                // Это самая частая ошибка - если пользователь не нажал /start
                console.error(`Ошибка от Telegram для CHAT_ID ${chatIds[index]}:`, result.value.description);
            } else if (result.value && result.value.ok) {
                console.log(`Успешно отправлено для CHAT_ID ${chatIds[index]}`);
            }
        });

        // 8. Отправляем на сайт ответ "Успех"
        // (даже если кому-то одному не ушло, форма считается отправленной)
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        // 9. Если что-то пошло не так, отправляем на сайт ответ "Ошибка"
        console.error('Внутренняя ошибка сервера:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
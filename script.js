document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category-select');
    const form = document.getElementById('spa-form');
    const submitBtn = document.getElementById('submit-btn');
    const formMessage = document.getElementById('form-message');

    // Карта, какой блок вопросов показывать
    const questionBlocks = {
        'Массаж': ['q-massage', 'common-questions-1'],
        'Спа для тела': ['q-body-spa', 'common-questions-1'],
        'Спа для волос': ['q-hair-spa', 'common-questions-1'],
        'Спа для тела и волос': ['q-body-hair-spa', 'common-questions-1'],
        'Косметология': ['q-cosmetology', 'common-questions-2'],
        'Депиляции': ['q-depilation', 'common-questions-2'],
        'Уходы для волос': ['q-hair-care', 'common-questions-2']
    };

    categorySelect.addEventListener('change', () => {
        const selectedValue = categorySelect.value;
        
        // 1. Сначала скрыть все блоки
        document.querySelectorAll('.questions-block').forEach(block => {
            block.style.display = 'none';
        });

        // 2. Показать нужные блоки
        if (questionBlocks[selectedValue]) {
            questionBlocks[selectedValue].forEach(blockId => {
                document.getElementById(blockId).style.display = 'block';
            });
        }
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Остановить стандартную отправку формы

    // --- НОВЫЙ БЛОК: Улучшенная валидация телефона ---
    const phoneInput = document.getElementById('phone'); // Получаем элемент поля
    const phoneNumber = phoneInput.value.replace(/\D/g, ''); // Удаляем все не-цифры (пробелы, скобки, +)

    // Проверяем, что осталось минимум 10 цифр (для России/СНГ это обычно 10 или 11)
    if (phoneNumber.length < 10) { 
        formMessage.textContent = 'Ошибка! Пожалуйста, введите полный номер телефона (минимум 10 цифр).';
        formMessage.style.color = 'red';
        return; // Останавливаем дальнейшую отправку
    }
    // --- КОНЕЦ НОВОГО БЛОКА ---
    
    // ... остальной код (запуск спиннера, отправка запроса и т.д.) идет здесь
    
    // Запускаем спиннер, блокируем кнопку и очищаем сообщение об ошибке
    formMessage.textContent = 'Отправка...';
    formMessage.style.color = 'orange';
    submitButton.disabled = true;

    // ... далее идет остальной, старый код
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        formMessage.textContent = '';

        try {
            // 1. Собрать данные в красивое сообщение
            const message = buildMessage();

            // 2. Отправить на наш "сервер" (Netlify Function)
            const response = await fetch('/.netlify/functions/send-to-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error('Ошибка сети при отправке.');
            }

            const result = await response.json();

            if (result.success) {
    // Успех!
    formMessage.textContent = 'Спасибо! Ваша анкета успешно отправлена. Перенаправляем вас в наш Telegram-клуб...';
    formMessage.style.color = 'green';
    form.reset(); 
    document.querySelectorAll('.questions-block').forEach(block => {
        block.style.display = 'none';
    });

    // ----------------------------------------------------
    // НОВЫЙ КОД: Перенаправление
    // ВСТАВЬ СЮДА СВОЮ ССЫЛКУ!
    const telegramLink = 'https://t.me/+FKnM2bPTEnBhZDAy'; // <--- ПОМЕНЯЙ ЭТУ ССЫЛКУ!
    // ----------------------------------------------------

    // Ждем 3 секунды, чтобы пользователь успел прочитать "Спасибо"
    setTimeout(() => {
        window.location.href = telegramLink;
    }, 3000); 

} else {
// ...
                throw new Error(result.error || 'Неизвестная ошибка на сервере.');
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            formMessage.textContent = 'Ошибка! Не удалось отправить анкету. Попробуйте позже.';
            formMessage.style.color = 'red';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    });

    // Функция для сборки сообщения
    function buildMessage() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        let msg = "🎉 НОВАЯ АНКЕТА С САЙТА! 🎉\n\n";
        
        msg += `Имя: ${data.name}\n`;
        msg += `Телефон: ${data.phone}\n`;
        msg += `Услуга: ${data.category}\n`;
        msg += "------------------------------\n\n";

        // Добавляем ответы только из ВЫБРАННОЙ категории
        const selectedCategory = data.category;
        
        if (selectedCategory === 'Массаж') {
            msg += "=== Спа-массаж ===\n";
            msg += `Кожные заболевания: ${data.massage_skin_issues || 'Нет'}\n`;
            msg += `Интенсивность: ${data.massage_intensity || 'Не выбрано'}\n`;
            msg += `Особые зоны: ${data.massage_zones || 'Нет'}\n\n`;
        }
        else if (selectedCategory === 'Спа для тела') {
            msg += "=== Спа для тела ===\n";
            msg += `Кожные заболевания: ${data.body_spa_skin_issues || 'Нет'}\n`;
            msg += `Интенсивность: ${data.body_spa_intensity || 'Не выбрано'}\n`;
            msg += `Особые зоны: ${data.body_spa_zones || 'Нет'}\n\n`;
        }
        else if (selectedCategory === 'Спа для волос') {
            msg += "=== Спа для волос ===\n";
            msg += `Как часто моет: ${data.hair_spa_wash || 'Не выбрано'}\n`;
            msg += `Структура волос: ${data.hair_spa_structure || 'Не выбрано'}\n`;
            msg += `Длина волос: ${data.hair_spa_length || 'Не выбрано'}\n\n`;
        }
        else if (selectedCategory === 'Спа для тела и волос') {
            msg += "=== Cпа для тела ===\n";
            msg += `Кожные заболевания: ${data.body_hair_skin || 'Нет'}\n`;
            msg += `Интенсивность: ${data.body_hair_intensity || 'Не выбрано'}\n`;
            msg += `Особые зоны: ${data.body_hair_zones || 'Нет'}\n\n`;
            msg += "=== Cпа для волос ===\n";
            msg += `Как часто моет: ${data.body_hair_wash || 'Не выбрано'}\n`;
            msg += `Структура волос: ${data.body_hair_structure || 'Не выбрано'}\n`;
            msg += `Длина волос: ${data.body_hair_length || 'Не выбрано'}\n\n`;
        }
        else if (selectedCategory === 'Косметология') {
            msg += "=== Косметология ===\n";
            msg += `Тип кожи: ${data.cosmetology_skin_type || 'Не выбрано'}\n`;
            msg += `Инъекции: ${data.cosmetology_injections || 'Не выбрано'}\n`;
            msg += `Предпочтения: ${data.cosmetology_prefs || 'Нет'}\n\n`;
        }
        else if (selectedCategory === 'Депиляции') {
            msg += "=== Депиляции ===\n";
            // Собираем все выбранные чекбоксы
            const zones = Array.from(formData.getAll('depilation_zones')).join(', ');
            msg += `Зоны: ${zones || 'Не выбрано'}\n`;
            msg += `Аллергии: ${data.depilation_allergy || 'Нет'}\n`;
            msg += `Кожные заболевания: ${data.depilation_skin_issues || 'Нет'}\n\n`;
        }
        else if (selectedCategory === 'Уходы для волос') {
            msg += "=== Уходы для волос ===\n";
            msg += `Как часто моет: ${data.hair_care_wash || 'Не выбрано'}\n`;
            msg += `Структура волос: ${data.hair_care_structure || 'Не выбрано'}\n`;
            msg += `Длина волос: ${data.hair_care_length || 'Не выбрано'}\n`;
            msg += `Окрашивание: ${data.hair_care_color || 'Нет'}\n`;
            msg += `Горячие процедуры: ${data.hair_care_procedures || 'Не выбрано'}\n`;
            msg += `Домашний уход: ${data.hair_care_home || 'Нет'}\n`;
            msg += `Проблема: ${data.hair_care_problem || 'Нет'}\n\n`;
        }

        // Добавляем общие вопросы
        msg += "=== Общие вопросы ===\n";
        if (questionBlocks[selectedCategory].includes('common-questions-1')) {
            msg += `Рассказ мастера: ${data.master_actions || 'Не выбрано'}\n`;
            msg += `Чай: ${data.tea_type || 'Не выбрано'}\n`;
            msg += `Мед: ${data.tea_honey || 'Не выбрано'}\n`;
            msg += `К чаю: ${data.tea_snack || 'Не выбрано'}\n`;
            msg += `Дом. уход: ${data.home_care || 'Не выбрано'}\n`;
            msg += `Лояльность: ${data.loyalty || 'Не выбрано'}\n`;
        } else {
            msg += `Рассказ мастера: ${data.master_actions_2 || 'Не выбрано'}\n`;
            msg += `Напиток: ${data.drink_type || 'Не выбрано'}\n`;
            msg += `Дом. уход: ${data.home_care_2 || 'Не выбрано'}\n`;
            msg += `Лояльность: ${data.loyalty_2 || 'Не выбрано'}\n`;
        }
        
        msg += "\n------------------------------\n";
        msg += `Доп. пожелания: ${data.wishes || 'Нет'}\n`;

        return msg;
    }
});
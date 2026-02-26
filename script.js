document.addEventListener('DOMContentLoaded', () => {
    const categoryInput = document.getElementById('category-select');
    const form = document.getElementById('spa-form');
    const submitBtn = document.getElementById('submit-btn');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const successModal = document.getElementById('success-modal');
    const nameInput = document.getElementById('name');
    const greetingText = document.getElementById('greeting-text');

    // Категории, которые используют блок "напиток" вместо "чай"
    const drinkChoiceCategories = ['Косметология', 'Депиляции', 'Уходы для волос'];

    // Карта: какой блок вопросов показывать для каждой категории
    const questionBlocks = {
        'Массаж':              ['q-massage',       'common-questions'],
        'Спа для тела':        ['q-body-spa',       'common-questions'],
        'Спа для волос':       ['q-hair-spa',       'common-questions'],
        'Спа для тела и волос':['q-body-hair-spa',  'common-questions'],
        'Косметология':        ['q-cosmetology',    'common-questions'],
        'Депиляции':           ['q-depilation',     'common-questions'],
        'Уходы для волос':     ['q-hair-care',      'common-questions'],
    };

    // ── Приветствие по имени ──
    const defaultGreeting = 'Позвольте нам узнать вас немного лучше,<br>чтобы ваш визит был по-настоящему особенным';

    nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        const newText = name
            ? `Добро пожаловать, <em>${name}</em>.<br>Мы сделаем ваш визит по-настоящему особенным`
            : defaultGreeting;

        greetingText.classList.add('updating');
        setTimeout(() => {
            greetingText.innerHTML = newText;
            greetingText.classList.remove('updating');
        }, 200);
    });

    // ── Карточки услуг ──
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceError = document.getElementById('service-error');

    function selectCategory(value) {
        // Обновить скрытый input
        categoryInput.value = value;
        serviceError.textContent = '';

        // Подсветить выбранную карточку
        serviceCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.value === value);
        });

        // Скрыть все блоки
        document.querySelectorAll('.questions-block').forEach(block => {
            block.classList.remove('visible');
            block.style.display = 'none';
        });

        if (!questionBlocks[value]) return;

        // Переключить подблок напитка
        const isTeaCategory = !drinkChoiceCategories.includes(value);
        document.getElementById('drink-tea-block').style.display = isTeaCategory ? 'block' : 'none';
        document.getElementById('drink-choice-block').style.display = isTeaCategory ? 'none' : 'block';

        // Показать нужные блоки с анимацией
        questionBlocks[value].forEach(blockId => {
            const block = document.getElementById(blockId);
            block.style.display = 'block';
            requestAnimationFrame(() => block.classList.add('visible'));
        });

        // Плавно прокрутить к вопросам
        setTimeout(() => {
            const firstBlock = document.getElementById(questionBlocks[value][0]);
            firstBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    serviceCards.forEach(card => {
        card.addEventListener('click', () => selectCategory(card.dataset.value));
    });

    // Валидация телефона
    function validatePhone(value) {
        // Принимаем форматы: +7..., 8..., 7... — всего 11 цифр для РФ/СНГ
        const digits = value.replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 12;
    }

    phoneInput.addEventListener('input', () => {
        if (phoneError.textContent && validatePhone(phoneInput.value)) {
            phoneError.textContent = '';
            phoneInput.classList.remove('input-error');
        }
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валидация категории
        if (!categoryInput.value) {
            serviceError.textContent = 'Пожалуйста, выберите услугу';
            document.getElementById('service-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Валидация телефона
        if (!validatePhone(phoneInput.value)) {
            phoneError.textContent = 'Введите корректный номер телефона (не менее 10 цифр)';
            phoneInput.classList.add('input-error');
            phoneInput.focus();
            return;
        }
        phoneError.textContent = '';
        phoneInput.classList.remove('input-error');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            const message = buildMessage();

            const response = await fetch('/.netlify/functions/send-to-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Ошибка сети при отправке.');
            }

            const result = await response.json();

            if (result.success) {
                // Показать модальное окно успеха
                successModal.style.display = 'flex';
                form.reset();
                categoryInput.value = '';
                serviceCards.forEach(c => c.classList.remove('selected'));
                document.querySelectorAll('.questions-block').forEach(block => {
                    block.classList.remove('visible');
                    block.style.display = 'none';
                });
                greetingText.innerHTML = defaultGreeting;

                setTimeout(() => {
                    window.location.href = 'https://t.me/+FKnM2bPTEnBhZDAy';
                }, 3000);
            } else {
                throw new Error(result.error || 'Неизвестная ошибка на сервере.');
            }

        } catch (error) {
            console.error('Ошибка отправки:', error);
            alert('Ошибка! Не удалось отправить анкету. Попробуйте позже.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    });

    // Сборка сообщения для Telegram (HTML-форматирование)
    function buildMessage() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const selected = data.category;

        let msg = '🎉 <b>НОВАЯ АНКЕТА С САЙТА!</b> 🎉\n\n';
        msg += `👤 <b>Имя:</b> ${data.name}\n`;
        msg += `📞 <b>Телефон:</b> ${data.phone}\n`;
        msg += `💆 <b>Услуга:</b> ${selected}\n`;
        msg += '──────────────────────\n\n';

        if (selected === 'Массаж') {
            msg += '💆 <b>Спа-массаж</b>\n';
            msg += `• Кожные заболевания: ${data.massage_skin_issues || 'Нет'}\n`;
            msg += `• Интенсивность: ${data.massage_intensity || 'Не выбрано'}\n`;
            msg += `• Особые зоны: ${data.massage_zones || 'Нет'}\n\n`;
        } else if (selected === 'Спа для тела') {
            msg += '🛁 <b>Спа для тела</b>\n';
            msg += `• Кожные заболевания: ${data.body_spa_skin_issues || 'Нет'}\n`;
            msg += `• Интенсивность: ${data.body_spa_intensity || 'Не выбрано'}\n`;
            msg += `• Особые зоны: ${data.body_spa_zones || 'Нет'}\n\n`;
        } else if (selected === 'Спа для волос') {
            msg += '💇 <b>Спа для волос</b>\n';
            msg += `• Частота мытья: ${data.hair_spa_wash || 'Не выбрано'}\n`;
            msg += `• Структура волос: ${data.hair_spa_structure || 'Не выбрано'}\n`;
            msg += `• Длина волос: ${data.hair_spa_length || 'Не выбрано'}\n\n`;
        } else if (selected === 'Спа для тела и волос') {
            msg += '🛁 <b>Спа для тела</b>\n';
            msg += `• Кожные заболевания: ${data.body_hair_skin || 'Нет'}\n`;
            msg += `• Интенсивность: ${data.body_hair_intensity || 'Не выбрано'}\n`;
            msg += `• Особые зоны: ${data.body_hair_zones || 'Нет'}\n\n`;
            msg += '💇 <b>Спа для волос</b>\n';
            msg += `• Частота мытья: ${data.body_hair_wash || 'Не выбрано'}\n`;
            msg += `• Структура волос: ${data.body_hair_structure || 'Не выбрано'}\n`;
            msg += `• Длина волос: ${data.body_hair_length || 'Не выбрано'}\n\n`;
        } else if (selected === 'Косметология') {
            msg += '✨ <b>Косметология</b>\n';
            msg += `• Тип кожи: ${data.cosmetology_skin_type || 'Не выбрано'}\n`;
            msg += `• Инъекции: ${data.cosmetology_injections || 'Не выбрано'}\n`;
            msg += `• Предпочтения: ${data.cosmetology_prefs || 'Нет'}\n\n`;
        } else if (selected === 'Депиляции') {
            const zones = Array.from(formData.getAll('depilation_zones')).join(', ');
            msg += '🌿 <b>Депиляции</b>\n';
            msg += `• Зоны: ${zones || 'Не выбрано'}\n`;
            msg += `• Аллергии: ${data.depilation_allergy || 'Нет'}\n`;
            msg += `• Кожные заболевания: ${data.depilation_skin_issues || 'Нет'}\n\n`;
        } else if (selected === 'Уходы для волос') {
            msg += '💇 <b>Уходы для волос</b>\n';
            msg += `• Частота мытья: ${data.hair_care_wash || 'Не выбрано'}\n`;
            msg += `• Структура волос: ${data.hair_care_structure || 'Не выбрано'}\n`;
            msg += `• Длина волос: ${data.hair_care_length || 'Не выбрано'}\n`;
            msg += `• Окрашивание: ${data.hair_care_color || 'Нет'}\n`;
            msg += `• Горячие процедуры: ${data.hair_care_procedures || 'Не выбрано'}\n`;
            msg += `• Домашний уход: ${data.hair_care_home || 'Нет'}\n`;
            msg += `• Проблема: ${data.hair_care_problem || 'Нет'}\n\n`;
        }

        // Общие вопросы
        msg += '📋 <b>Общие вопросы</b>\n';
        msg += `• Рассказ мастера: ${data.master_actions || 'Не выбрано'}\n`;

        if (!drinkChoiceCategories.includes(selected)) {
            msg += `• Чай: ${data.tea_type || 'Не выбрано'}\n`;
            msg += `• Мёд: ${data.tea_honey || 'Не выбрано'}\n`;
            msg += `• К чаю: ${data.tea_snack || 'Не выбрано'}\n`;
        } else {
            msg += `• Напиток: ${data.drink_type || 'Не выбрано'}\n`;
        }

        msg += `• Домашний уход: ${data.home_care || 'Не выбрано'}\n`;
        msg += `• Программа лояльности: ${data.loyalty || 'Не выбрано'}\n`;

        msg += '\n──────────────────────\n';
        msg += `📝 <b>Доп. пожелания:</b> ${data.wishes || 'Нет'}\n`;

        return msg;
    }
});

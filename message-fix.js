// Файл исправлений для системы сообщений фракций
// Подключается к игре для тестирования исправлений

(function() {
    console.log('[MESSAGE-FIX] Загрузка исправлений для системы сообщений фракций');

    // Сохраняем оригинальные функции
    const originalGetSourceContent = window.getSourceContent;
    const originalGetInitialMessageContent = window.getInitialMessageContent;
    const originalAcceptQuest = window.acceptQuest;

    // Функция для отображения единой ленты сообщений и заданий фракций
window.getFactionUnifiedContent = function(factionId, itemId) {
    const factionData = window.getFactionDataByFactionId(factionId);

    console.log('[MESSAGE-FIX] Создаем единую ленту для фракции', factionId);

    // Получаем сообщения фракции
    const factionMessages = window.sourceQuests.messageHistory[factionId] || [];
    const factionMessageEntries = factionMessages.filter(msg => msg.type === 'faction_message');

    // Получаем задания фракции
    const acceptedQuest = factionId ? window.sourceQuests.activeQuests[factionId] : null;
    const allPendingQuests = Object.entries(window.sourceQuests.activeQuests || {})
        .filter(([fid, quest]) => quest && quest.accepted === false)
        .map(([fid, quest]) => ({ factionId: fid, ...quest }));

    // Создаем единый массив элементов для отображения
    const unifiedItems = [];

    // Добавляем сообщения фракции
    factionMessageEntries.forEach(messageEntry => {
        unifiedItems.push({
            type: 'message',
            data: messageEntry,
            timestamp: new Date(messageEntry.timestamp)
        });
    });

    // Добавляем принятое задание
    if (acceptedQuest && acceptedQuest.accepted) {
        unifiedItems.push({
            type: 'accepted_quest',
            data: acceptedQuest,
            timestamp: new Date(acceptedQuest.acceptedAt || Date.now())
        });
    }

    // Добавляем непринятые задания
    allPendingQuests.forEach(quest => {
        unifiedItems.push({
            type: 'pending_quest',
            data: quest,
            timestamp: new Date(quest.timestamp || Date.now())
        });
    });

    // Сортируем по времени (новые сверху)
    unifiedItems.sort((a, b) => b.timestamp - a.timestamp);

    console.log('[MESSAGE-FIX] Всего элементов для отображения:', unifiedItems.length);

    // Создаем HTML для каждого типа элемента
    const itemsHtml = unifiedItems.map(item => {
        if (item.type === 'message') {
            const message = item.data.data.message;
            return `
                <div class="unified-item message-item" style="margin-bottom: 15px; padding: 12px; border: 1px solid #555; border-radius: 8px; background: linear-gradient(135deg, rgba(70,70,70,0.8), rgba(40,40,40,0.8));">
                    <div class="item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="item-icon" style="font-size: 16px;">💬</div>
                        <div class="item-sender" style="font-weight: bold; color: #FFD700; font-size: 14px;">${factionData.name}</div>
                        <div class="item-time" style="font-size: 10px; color: #ccc;">${item.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <div class="item-type" style="font-size: 11px; color: #aaa; margin-bottom: 8px; text-transform: uppercase;">${getMessageTypeLabel(message.type)}</div>
                    <div class="item-content" style="line-height: 1.5; color: #fff;">
                        ${message.text}
                    </div>
                </div>
            `;
        } else if (item.type === 'accepted_quest') {
            return `
                <div class="unified-item quest-item accepted" style="margin-bottom: 15px; padding: 12px; border: 2px solid #4CAF50; border-radius: 8px; background: linear-gradient(135deg, rgba(76,175,80,0.1), rgba(56,142,60,0.1));">
                    <div class="item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="item-icon" style="font-size: 16px;">✅</div>
                        <div class="item-title" style="font-weight: bold; color: #4CAF50; font-size: 14px;">${item.data.title}</div>
                        <div class="item-time" style="font-size: 10px; color: #ccc;">${item.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <div class="item-content" style="line-height: 1.5; color: #fff; margin-bottom: 8px;">
                        ${item.data.description}
                    </div>
                    <div class="quest-progress" style="margin-top: 10px;">
                        <div class="quest-progress-bar" style="background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                            <div style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="color: #fff; font-size: 10px; margin-top: 4px; text-align: center;">
                            📋 0/1 (Активное задание)
                        </div>
                    </div>
                </div>
            `;
        } else if (item.type === 'pending_quest') {
            const questFactionData = window.getFactionDataByFactionId(item.data.factionId);
            return `
                <div class="unified-item quest-item pending" style="margin-bottom: 15px; padding: 12px; border: 2px solid #FF9800; border-radius: 8px; background: linear-gradient(135deg, rgba(255,152,0,0.1), rgba(245,124,0,0.1));">
                    <div class="item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="item-icon" style="font-size: 16px;">❓</div>
                        <div class="item-sender" style="font-weight: bold; color: #FF9800; font-size: 14px;">${questFactionData.name}</div>
                        <div class="item-time" style="font-size: 10px; color: #ccc;">${item.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <div class="item-title" style="font-weight: bold; color: #fff; font-size: 14px; margin-bottom: 8px;">${item.data.title}</div>
                    <div class="item-content" style="line-height: 1.5; color: #fff; margin-bottom: 12px;">
                        ${item.data.description}
                    </div>
                    <div class="quest-actions" style="display: flex; gap: 8px; justify-content: center;">
                        <button onclick="window.acceptQuest('${itemId}', '${item.data.id}')" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Принять</button>
                        <button onclick="window.declineQuest('${itemId}', '${item.data.id}')" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Отклонить</button>
                    </div>
                </div>
            `;
        }
    }).join('');

    return `
        <div class="faction-unified-feed">
            <div class="feed-header" style="text-align: center; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,193,7,0.1)); border-radius: 10px; border: 1px solid #FFD700;">
                <strong style="font-size: 16px;">📡 ${factionData.name} - Единая лента</strong>
                <br><span style="font-size: 12px; color: #ccc;">Сообщения и задания фракции</span>
            </div>
            <div class="feed-container" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                ${itemsHtml || '<div style="text-align: center; padding: 20px; color: #666;">Нет новых сообщений или заданий</div>'}
            </div>
        </div>
    `;
};

    // Получить метку типа сообщения
    function getMessageTypeLabel(type) {
        const labels = {
            'useful': 'Полезная информация',
            'useless': 'Пустая болтовня',
            'warning': 'Предупреждение',
            'propaganda': 'Пропаганда',
            'mysterious': 'Таинственное'
        };
        return labels[type] || 'Сообщение';
    }

    // Получить данные фракции по factionId
    window.getFactionDataByFactionId = function(factionId) {
        const factions = {
            'hq': { name: 'Штаб', greeting: 'Внимание! Говорит командование.', style: 'military' },
            'rebels': { name: 'Повстанцы', greeting: 'Братья и сестры по борьбе!', style: 'rebel' },
            'free': { name: 'Свобода', greeting: 'Друзья свободных людей!', style: 'free' },
            'marauders': { name: 'Мародеры', greeting: 'Эй, приятель!', style: 'raider' },
            'mystery': { name: 'Тайна', greeting: 'Шепот из тьмы...', style: 'mystery' },
            'treasures': { name: 'Сокровища', greeting: 'Карта сокровищ...', style: 'treasure' }
        };
        return factions[factionId] || { name: 'Неизвестно', greeting: 'Внимание!', style: 'default' };
    };

    // Получить factionId по sourceType
    window.getFactionIdFromSourceType = function(sourceType) {
        const mapping = {
            'radio': 'hq',
            'gps': 'rebels',
            'laptop': 'free',
            'phone': 'marauders',
            'transmitter': 'mystery',
            'map': 'treasures'
        };
        return mapping[sourceType];
    };

    // Исправленная функция getSourceContent с приоритетом сообщений фракций
    window.getSourceContent = function(itemId) {
        console.log('[MESSAGE-FIX] Исправленная getSourceContent вызвана для itemId:', itemId);

        // Получить фракцию
        const factionData = window.getFactionDataByFactionId(window.getFactionIdFromSourceType(itemId));
        const factionId = window.getFactionIdFromSourceType(itemId);
        console.log('[MESSAGE-FIX] factionData:', factionData, 'factionId:', factionId);

        // ПРОВЕРКА НА НОВЫЕ СООБЩЕНИЯ ФРАКЦИИ И ЗАДАНИЯ - имеет наивысший приоритет
        if (factionId && window.sourceQuests) {
            console.log('[MESSAGE-FIX] Создаем единую ленту для фракции', factionId);

            // Используем новую единую ленту сообщений и заданий
            return window.getFactionUnifiedContent(factionId, itemId);
        }

        // Если сообщений фракции нет, используем оригинальную логику
        if (originalGetSourceContent) {
            return originalGetSourceContent(itemId);
        }

        return '<div class="message-content"><div class="message-text">Ожидание контента...</div></div>';
    };

    // Исправленная функция принятия заданий с защитой от повторных вызовов
    window.acceptQuest = function(sourceType, questId) {
        console.log('[MESSAGE-FIX] Исправленная acceptQuest вызвана:', sourceType, questId);

        // Защита от повторных вызовов
        const processingKey = `${sourceType}_${questId}`;
        if (!window.sourceQuests._processingQuests) {
            window.sourceQuests._processingQuests = new Set();
        }

        if (window.sourceQuests._processingQuests.has(processingKey)) {
            console.log('[MESSAGE-FIX] Задание уже обрабатывается:', questId);
            return false;
        }

        window.sourceQuests._processingQuests.add(processingKey);

        // Вызываем оригинальную функцию
        let result = false;
        if (originalAcceptQuest) {
            result = originalAcceptQuest(sourceType, questId);
        }

        // Обновляем UI после принятия задания
        if (result) {
            setTimeout(() => {
                // Обновляем отображение после принятия
                const factionId = window.getFactionIdFromSourceType(sourceType);
                if (factionId) {
                    // Обновляем активные задания
                    window.updateQuestsDisplay(sourceType);
                    // Обновляем информационную панель
                    window.updateActiveInfoSource(sourceType);
                }
            }, 100);
        }

        // Удаляем из списка обрабатываемых через небольшую задержку
        setTimeout(() => {
            window.sourceQuests._processingQuests.delete(processingKey);
        }, 500);

        return result;
    };

    // Функция отклонения заданий
    window.declineQuest = function(sourceType, questId) {
        console.log('[MESSAGE-FIX] declineQuest вызвана:', sourceType, questId);

        // Защита от повторных вызовов
        const processingKey = `decline_${sourceType}_${questId}`;
        if (!window.sourceQuests._processingQuests) {
            window.sourceQuests._processingQuests = new Set();
        }

        if (window.sourceQuests._processingQuests.has(processingKey)) {
            console.log('[MESSAGE-FIX] Задание уже отклоняется:', questId);
            return false;
        }

        window.sourceQuests._processingQuests.add(processingKey);

        try {
            // Находим задание и удаляем его
            const factionId = window.getFactionIdFromSourceType(sourceType);
            if (window.sourceQuests.activeQuests[factionId] && window.sourceQuests.activeQuests[factionId].id === questId) {
                delete window.sourceQuests.activeQuests[factionId];
                console.log('[MESSAGE-FIX] Задание отклонено и удалено:', questId);

                // Добавляем сообщение об отклонении в историю
                if (window.sourceQuests.addMessageToHistory) {
                    window.sourceQuests.addMessageToHistory(factionId, 'declined_quest', {
                        questId: questId,
                        declinedAt: new Date()
                    });
                }

                // Обновляем UI после отклонения задания
                setTimeout(() => {
                    window.updateQuestsDisplay(sourceType);
                    window.updateActiveInfoSource(sourceType);
                }, 100);

                return true;
            } else {
                console.warn('[MESSAGE-FIX] Задание не найдено для отклонения:', questId);
                return false;
            }
        } finally {
            // Удаляем из списка обрабатываемых
            setTimeout(() => {
                window.sourceQuests._processingQuests.delete(processingKey);
            }, 500);
        }
    };

    // Функция для тестирования исправлений
    window.testMessageFix = function() {
        console.log('[MESSAGE-FIX] === ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ===');

        // Проверяем наличие необходимых функций
        console.log('[MESSAGE-FIX] getSourceContent доступна:', typeof window.getSourceContent);
        console.log('[MESSAGE-FIX] acceptQuest доступна:', typeof window.acceptQuest);

        // Проверяем состояние системы заданий
        if (window.sourceQuests) {
            console.log('[MESSAGE-FIX] sourceQuests доступна');
            console.log('[MESSAGE-FIX] Активные задания:', Object.keys(window.sourceQuests.activeQuests || {}));
            console.log('[MESSAGE-FIX] История сообщений:', Object.keys(window.sourceQuests.messageHistory || {}));
        } else {
            console.log('[MESSAGE-FIX] sourceQuests НЕ доступна');
        }

        console.log('[MESSAGE-FIX] === ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
    };

    // Тест отображения списка сообщений
    window.testMessageListDisplay = function() {
        console.log('[TEST] Тестирование отображения списка сообщений фракций');

        // Создаем тестовые сообщения для разных фракций
        const testMessages = {
            'mystery': [
                { text: 'Тени шепчут о приближающейся буре...', type: 'mysterious' },
                { text: '*зловещий шепот* Они идут через сны...', type: 'warning' },
                { text: 'Мутанты становятся сильнее с каждой ночью', type: 'mysterious' }
            ],
            'marauders': [
                { text: 'Продаю отличное оружие! 300 патронов за автомат', type: 'trade_offers' },
                { text: 'Ха! Мы только что ограбили караван Штаба!', type: 'boasts' },
                { text: 'Кто следующий на очереди? Мы ищем новые цели!', type: 'boasts' }
            ],
            'hq': [
                { text: 'Внимание! Обнаружены подозрительные передвижения', type: 'warning' },
                { text: 'Командование требует строгого соблюдения протоколов', type: 'propaganda' },
                { text: 'Усилить патрулирование периметра!', type: 'propaganda' }
            ]
        };

        // Добавляем тестовые сообщения в историю
        Object.keys(testMessages).forEach(factionId => {
            testMessages[factionId].forEach((message, index) => {
                const messageEntry = {
                    id: `${factionId}_${Date.now()}_${index}`,
                    type: 'faction_message',
                    timestamp: new Date(Date.now() - (index * 60000)), // Разные времена
                    data: { message: message }
                };

                if (!window.sourceQuests.messageHistory[factionId]) {
                    window.sourceQuests.messageHistory[factionId] = [];
                }
                window.sourceQuests.messageHistory[factionId].push(messageEntry);
            });
            console.log(`[TEST] Добавлено ${testMessages[factionId].length} тестовых сообщений для ${factionId}`);
        });

        // Проверяем отображение для mystery (активный источник)
        if (window.getFactionMessagesContent) {
            const mysteryMessages = window.sourceQuests.messageHistory['mystery'] || [];
            const factionMessagesFiltered = mysteryMessages.filter(msg => msg.type === 'faction_message');

            if (factionMessagesFiltered.length > 0) {
                const html = window.getFactionMessagesContent('mystery', factionMessagesFiltered);
                console.log('[TEST] Сгенерирован HTML для списка сообщений:');
                console.log(html);

                // Показываем результат в консоли
                console.log('[TEST] Количество сообщений для mystery:', factionMessagesFiltered.length);
                factionMessagesFiltered.forEach((msg, index) => {
                    console.log(`[TEST] Сообщение ${index + 1}:`, msg.data.message.text);
                });
            } else {
                console.log('[TEST] Нет сообщений для mystery');
            }
        } else {
            console.log('[TEST] Функция getFactionMessagesContent не найдена');
        }

        console.log('[TEST] Тест списка сообщений завершен');
    };

    console.log('[MESSAGE-FIX] Исправления загружены успешно');
    console.log('[MESSAGE-FIX] Для тестирования выполните: window.testMessageFix()');
    console.log('[MESSAGE-FIX] Для тестирования списка сообщений: window.testMessageListDisplay()');

})();

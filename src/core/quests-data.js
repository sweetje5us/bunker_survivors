// Quests Data Module - простая версия для браузера
// Этот файл содержит все данные о заданиях и функции для работы с ними

(function(window) {
    'use strict';

    console.log('[Quest Data] Loading quests data module...');

    // Типы заданий
    const QUEST_TYPES = {
        RECRUIT: 'recruit',
        EXILE: 'exile',
        KILL_ENEMY: 'kill_enemy',
        TALK_MARAUDER: 'talk_marauder',
        GET_ITEM: 'get_item',
        COLLECT_RESOURCE: 'collect_resource',
        LET_ENEMY_IN: 'let_enemy_in',
        ATTACK_BUNKER: 'attack_bunker',
        ACCEPT_RESIDENT: 'accept_resident',
        REFUSE_RESIDENT: 'refuse_resident',
        SELL_ITEM: 'sell_item',
        BUY_ITEM: 'buy_item',
        BUILD_ROOM: 'build_room',
        DESTROY_ROOM: 'destroy_room',
        SACRIFICE: 'sacrifice',
        INSANITY: 'insanity',
        PRODUCE_RESOURCE: 'produce_resource',
        FIND_SIDEQUEST: 'find_sidequest'
    };

    // Грейды заданий
    const QUEST_GRADES = {
        COMMON: 'common',
        RARE: 'rare',
        EPIC: 'epic',
        LEGENDARY: 'legendary'
    };

    // Типы наград
    const REWARD_TYPES = {
        EXPERIENCE: 'experience',
        REPUTATION: 'reputation',
        ITEM: 'item',
        RESOURCE: 'resource'
    };

    // Фракции
    const FACTIONS = {
        HQ: 'hq',
        REBELS: 'rebels',
        MARAUDERS: 'marauders',
        FREE: 'free',
        MYSTERY: 'mystery'
    };

    // Функции для работы с грейдами
    const QuestUtils = {
        getGradeColor: function(grade) {
            const colors = {
                common: '#8B8B8B',
                rare: '#0077FF',
                epic: '#9933FF',
                legendary: '#FFD700'
            };
            return colors[grade] || '#8B8B8B';
        },

        getGradeLabel: function(grade) {
            const labels = {
                common: 'Обычное',
                rare: 'Редкое',
                epic: 'Эпическое',
                legendary: 'Легендарное'
            };
            return labels[grade] || 'Обычное';
        }
    };

    // Генерация заданий для фракции
    function generateFactionQuests(factionId) {
        const quests = [];

        // Задания для Штаба (hq)
        if (factionId === FACTIONS.HQ) {
            quests.push(
                {
                    id: 'hq_1',
                    title: 'Принять жителей',
                    description: 'Принять 3 новых жителей в бункер',
                    type: QUEST_TYPES.RECRUIT,
                    target: 3,
                    difficulty: 1,
                    grade: QUEST_GRADES.COMMON,
                    rarity: 30,
                    reward: { type: REWARD_TYPES.EXPERIENCE, value: 100 },
                    penalty: { type: 'none' },
                    faction: factionId
                },
                {
                    id: 'hq_2',
                    title: 'Изгнать нарушителей',
                    description: 'Изгнать 2 жителей из бункера',
                    type: QUEST_TYPES.EXILE,
                    target: 2,
                    difficulty: 2,
                    grade: QUEST_GRADES.RARE,
                    rarity: 20,
                    reward: { type: REWARD_TYPES.REPUTATION, value: 50 },
                    penalty: { type: 'money', value: 200 },
                    faction: factionId
                },
                {
                    id: 'hq_3',
                    title: 'Убить мародеров',
                    description: 'Убить 5 мародеров',
                    type: QUEST_TYPES.KILL_ENEMY,
                    target: 5,
                    difficulty: 3,
                    grade: QUEST_GRADES.EPIC,
                    rarity: 10,
                    reward: { type: REWARD_TYPES.ITEM, value: 'ammo' },
                    penalty: { type: 'reputation', value: 30 },
                    faction: factionId
                }
            );
        }

        // Задания для Повстанцев (rebels)
        if (factionId === FACTIONS.REBELS) {
            quests.push(
                {
                    id: 'rebels_1',
                    title: 'Собрать ресурсы',
                    description: 'Собрать 100 единиц дерева',
                    type: QUEST_TYPES.COLLECT_RESOURCE,
                    target: 100,
                    difficulty: 1,
                    grade: QUEST_GRADES.COMMON,
                    rarity: 35,
                    reward: { type: REWARD_TYPES.RESOURCE, value: 'wood' },
                    penalty: { type: 'none' },
                    faction: factionId
                },
                {
                    id: 'rebels_2',
                    title: 'Построить комнату',
                    description: 'Построить комнату для отдыха',
                    type: QUEST_TYPES.BUILD_ROOM,
                    target: 1,
                    difficulty: 2,
                    grade: QUEST_GRADES.RARE,
                    rarity: 25,
                    reward: { type: REWARD_TYPES.EXPERIENCE, value: 150 },
                    penalty: { type: 'money', value: 150 },
                    faction: factionId
                }
            );
        }

        // Задания для Мародеров (marauders)
        if (factionId === FACTIONS.MARAUDERS) {
            quests.push(
                {
                    id: 'marauders_1',
                    title: 'Поговорить с мародером',
                    description: 'Поговорить с мародером',
                    type: QUEST_TYPES.TALK_MARAUDER,
                    target: 1,
                    difficulty: 1,
                    grade: QUEST_GRADES.COMMON,
                    rarity: 40,
                    reward: { type: REWARD_TYPES.REPUTATION, value: 25 },
                    penalty: { type: 'none' },
                    faction: factionId
                },
                {
                    id: 'marauders_2',
                    title: 'Получить предмет',
                    description: 'Получить предмет от жителя',
                    type: QUEST_TYPES.GET_ITEM,
                    target: 1,
                    difficulty: 2,
                    grade: QUEST_GRADES.RARE,
                    rarity: 30,
                    reward: { type: REWARD_TYPES.ITEM, value: 'medicine' },
                    penalty: { type: 'reputation', value: 20 },
                    faction: factionId
                }
            );
        }

        // Задания для Свободы (free)
        if (factionId === FACTIONS.FREE) {
            quests.push(
                {
                    id: 'free_1',
                    title: 'Произвести ресурсы',
                    description: 'Произвести 50 единиц еды',
                    type: QUEST_TYPES.PRODUCE_RESOURCE,
                    target: 50,
                    difficulty: 2,
                    grade: QUEST_GRADES.RARE,
                    rarity: 25,
                    reward: { type: REWARD_TYPES.RESOURCE, value: 'food' },
                    penalty: { type: 'none' },
                    faction: factionId
                },
                {
                    id: 'free_2',
                    title: 'Найти побочный предмет',
                    description: 'Найти побочный предмет',
                    type: QUEST_TYPES.FIND_SIDEQUEST,
                    target: 1,
                    difficulty: 3,
                    grade: QUEST_GRADES.EPIC,
                    rarity: 15,
                    reward: { type: REWARD_TYPES.EXPERIENCE, value: 200 },
                    penalty: { type: 'money', value: 100 },
                    faction: factionId
                }
            );
        }

        // Задания для Тайны (mystery)
        if (factionId === FACTIONS.MYSTERY) {
            quests.push(
                {
                    id: 'mystery_1',
                    title: 'Впустить врага',
                    description: 'Впустить врага в бункер',
                    type: QUEST_TYPES.LET_ENEMY_IN,
                    target: 1,
                    difficulty: 4,
                    grade: QUEST_GRADES.LEGENDARY,
                    rarity: 5,
                    reward: { type: REWARD_TYPES.REPUTATION, value: 100 },
                    penalty: { type: 'reputation', value: 100 },
                    faction: factionId
                },
                {
                    id: 'mystery_2',
                    title: 'Довести до безумия',
                    description: 'Довести жителя до безумия',
                    type: QUEST_TYPES.INSANITY,
                    target: 1,
                    difficulty: 3,
                    grade: QUEST_GRADES.EPIC,
                    rarity: 12,
                    reward: { type: REWARD_TYPES.EXPERIENCE, value: 250 },
                    penalty: { type: 'reputation', value: 50 },
                    faction: factionId
                }
            );
        }

        return quests;
    }

    // Класс менеджера заданий
    function QuestManager() {
        this.quests = [];
        this.gameSeed = Date.now();

        // Генерируем задания для всех фракций
        Object.values(FACTIONS).forEach(factionId => {
            const factionQuests = generateFactionQuests(factionId);
            this.quests = this.quests.concat(factionQuests);
        });

        console.log('[QuestManager] Generated', this.quests.length, 'quests');
    }

    QuestManager.prototype = {
        seededRandom: function(min, max) {
            const x = Math.sin(this.gameSeed++) * 10000;
            return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
        },

        getRandomQuest: function(factionId) {
            const factionQuests = this.quests.filter(q => q.faction === factionId);
            if (factionQuests.length === 0) return null;

            const randomIndex = this.seededRandom(0, factionQuests.length - 1);
            return factionQuests[randomIndex];
        },

        getQuestById: function(id) {
            return this.quests.find(q => q.id === id);
        },

        getQuestsByFaction: function(factionId) {
            return this.quests.filter(q => q.faction === factionId);
        },

        getQuestsByGrade: function(grade) {
            return this.quests.filter(q => q.grade === grade);
        }
    };

    // Создаем единственный экземпляр менеджера
    const questManagerInstance = new QuestManager();

    // Экспортируем в глобальную область видимости
    window.QuestManager = QuestManager;
    window.QuestUtils = QuestUtils;
    window.QUEST_DATABASE = questManagerInstance.quests;
    window.questManager = questManagerInstance;

    console.log('[Quest Data] Module loaded successfully with', questManagerInstance.quests.length, 'quests');

})(window);

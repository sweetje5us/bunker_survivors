// Faction messages reference for Bunker Survivors
// JavaScript version for browser

// Import data from TypeScript file (does not work directly in browser,
// so we copy necessary data)

// Protection from redeclaration
if (typeof window.FACTION_MESSAGE_TYPES === 'undefined') {
  window.FACTION_MESSAGE_TYPES = {
    USEFUL: 'useful',
    USELESS: 'useless',
    WARNING: 'warning',
    PROPAGANDA: 'propaganda',
    MYSTERIOUS: 'mysterious'
  };
}

// Protection from redeclaration
if (typeof window.FACTION_MESSAGE_FREQUENCIES === 'undefined') {
  window.FACTION_MESSAGE_FREQUENCIES = {
    RARE: 'rare',
    COMMON: 'common',
    FREQUENT: 'frequent'
  };
}

// Protection from redeclaration
if (typeof window.FACTION_MESSAGE_IMPORTANCES === 'undefined') {
  window.FACTION_MESSAGE_IMPORTANCES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };
}

// Message categories for each faction
// Protection from redeclaration
if (typeof window.MESSAGE_CATEGORIES === 'undefined') {
  window.MESSAGE_CATEGORIES = {
    hq: [
      'announcements',      // Официальные объявления
      'orders',            // Приказы и распоряжения
      'reports',           // Доклады о ситуации
      'propaganda',        // Пропаганда дисциплины
      'surveillance',      // Сообщения о контроле
      'punishments'        // Информация о наказаниях
    ],
    rebels: [
      'coordinates',       // Координаты и места встреч
      'attacks',           // Планы нападений
      'ideology',          // Идеологические сообщения
      'recruitment',       // Призывы к присоединению
      'intelligence',      // Разведданные
      'prayers'            // Религиозные обращения
    ],
    free: [
      'news',              // Новости и информация
      'advertisements',    // Реклама и спам
      'freedom_calls',     // Призывы к свободе
      'diplomacy',         // Дипломатические предложения
      'anecdotes',         // Анекдоты и развлечения
      'advice'             // Советы по выживанию
    ],
    mystery: [
      'signals',           // Таинственные сигналы
      'thoughts',          // Мысли существ
      'warnings',          // Предупреждения
      'prophecies',        // Пророчества
      'visions',           // Видения
      'mutations'          // Мутации
    ],
    marauders: [
      'trade_offers',      // Предложения торговли
      'boasts',            // Хвастовство
      'threats',           // Угрозы
      'raid_plans',        // Планы набегов
      'loot_reports',      // Отчеты о добыче
      'insults'            // Оскорбления
    ]
  };
}

// Basic messages structure for demonstration
// Protection from redeclaration
if (typeof window.FACTION_MESSAGES_DATA === 'undefined') {
  window.FACTION_MESSAGES_DATA = {
  hq: {
    announcements: [
      { id: 'hq_ann_001', text: 'Внимание! Все граждане обязаны соблюдать комендантский час с 22:00 до 06:00. Нарушители будут наказаны.', type: 'useful', frequency: 'common', importance: 'high', category: 'announcements', effects: { moraleChange: -2 } },
      { id: 'hq_ann_002', text: 'Объявляется набор добровольцев в патрульные отряды. Служба - это честь и долг каждого гражданина.', type: 'useful', frequency: 'rare', importance: 'medium', category: 'announcements', effects: { moraleChange: 1 } },
      { id: 'hq_ann_003', text: 'Распределение пайков будет производиться строго по спискам. Очереди и беспорядок недопустимы.', type: 'useful', frequency: 'common', importance: 'high', category: 'announcements' },
      { id: 'hq_ann_004', text: 'Все граждане в возрасте от 16 до 60 лет обязаны пройти медицинское обследование в указанные сроки.', type: 'useful', frequency: 'common', importance: 'medium', category: 'announcements' },
      { id: 'hq_ann_005', text: 'Введен режим экономии электроэнергии. Использование приборов ограничено до минимума.', type: 'useful', frequency: 'rare', importance: 'high', category: 'announcements', effects: { moraleChange: -1 } }
    ],
    orders: [
      { id: 'hq_ord_001', text: 'Приказ № 47: Все граждане обязаны явиться на перекличку в 14:00. Опоздавшие будут наказаны.', type: 'useful', frequency: 'common', importance: 'high', category: 'orders', effects: { moraleChange: -1 } },
      { id: 'hq_ord_002', text: 'Распоряжение: Немедленно прекратить все несанкционированные собрания. Любые групповые обсуждения запрещены.', type: 'useful', frequency: 'rare', importance: 'high', category: 'orders', effects: { moraleChange: -2 } }
    ],
    propaganda: [
      { id: 'hq_prp_001', text: 'Дисциплина - это оружие победы! Только через порядок мы сможем выжить!', type: 'propaganda', frequency: 'frequent', importance: 'low', category: 'propaganda', effects: { moraleChange: 1 } },
      { id: 'hq_prp_002', text: 'Помните: каждый гражданин - это винтик в великой машине выживания!', type: 'propaganda', frequency: 'frequent', importance: 'low', category: 'propaganda' }
    ]
  },
  rebels: {
    coordinates: [
      { id: 'rebels_coord_001', text: 'Встречаемся в квадрате 7-9 у старого склада. Приходите с оружием. Пароль: "Свобода или смерть".', type: 'useful', frequency: 'rare', importance: 'medium', category: 'coordinates', effects: { moraleChange: 1 } },
      { id: 'rebels_coord_002', text: 'Новый пункт сбора: развалины завода в квадрате 12-15. Приносите припасы и боеприпасы.', type: 'useful', frequency: 'common', importance: 'medium', category: 'coordinates' }
    ],
    ideology: [
      { id: 'rebels_ideo_001', text: 'Штаб - это тюрьма для душ! Мы боремся не за выживание, а за настоящую свободу!', type: 'propaganda', frequency: 'frequent', importance: 'low', category: 'ideology', effects: { moraleChange: 2 } },
      { id: 'rebels_ideo_002', text: 'Каждый день под гнетом Штаба - это предательство своих детей! Встаньте и сражайтесь!', type: 'propaganda', frequency: 'common', importance: 'medium', category: 'ideology', effects: { moraleChange: 1 } }
    ]
  },
  free: {
    news: [
      { id: 'free_news_001', text: 'Новости: В квадрате 12-8 найден новый источник воды. Все фракции приглашаются для мирного сотрудничества.', type: 'useful', frequency: 'common', importance: 'medium', category: 'news', effects: { resourceHint: 'Источник воды в квадрате 12-8' } },
      { id: 'free_news_002', text: 'Обновление погоды: Завтра ожидается солнечная погода. Идеальное время для разведки и сбора ресурсов.', type: 'useful', frequency: 'frequent', importance: 'low', category: 'news' }
    ],
    anecdotes: [
      { id: 'free_ane_001', text: 'Анекдот дня: Почему мутант не пошел в бар? Потому что у него не было рук для стакана! 😄', type: 'useless', frequency: 'frequent', importance: 'low', category: 'anecdotes' },
      { id: 'free_ane_002', text: 'Шутка: Встречаются два выживших. Один говорит: "Я нашел консервную банку!" Другой: "И что в ней?" "Сплошная радиация!"', type: 'useless', frequency: 'frequent', importance: 'low', category: 'anecdotes' }
    ]
  },
  mystery: {
    signals: [
      { id: 'mystery_sig_001', text: 'Шшшш... *статика* ...мы наблюдаем... *треск* ...ваши страхи становятся реальностью...', type: 'mysterious', frequency: 'rare', importance: 'high', category: 'signals', effects: { moraleChange: -3 } },
      { id: 'mystery_sig_002', text: '*искаженный шепот* Они просыпаются... древние существа под землей... *вопль*', type: 'mysterious', frequency: 'rare', importance: 'high', category: 'signals', effects: { moraleChange: -4, enemyWarning: 'Древние существа просыпаются' } }
    ],
    warnings: [
      { id: 'mystery_war_001', text: 'Осторожно... *шепот* ...луна в крови... мутации ускоряются... бегите...', type: 'warning', frequency: 'rare', importance: 'high', category: 'warnings', effects: { moraleChange: -3, enemyWarning: 'Ускорение мутаций' } },
      { id: 'mystery_war_002', text: '*зловещий шепот* Они идут... через тени... через сны... проснитесь!', type: 'warning', frequency: 'rare', importance: 'high', category: 'warnings', effects: { moraleChange: -4 } }
    ]
  },
  marauders: {
    trade_offers: [
      { id: 'marauders_trade_001', text: 'Эй, слабаки! У меня есть отличные патроны за еду. 200 штук за 50 порций. Скидка для тех, кто быстро решит!', type: 'useful', frequency: 'common', importance: 'medium', category: 'trade_offers' },
      { id: 'marauders_trade_002', text: 'Продаю оружие! Автомат за 300 патронов. Или меняю на вашего самого жирного жителя. Выбор за вами!', type: 'useful', frequency: 'rare', importance: 'high', category: 'trade_offers' }
    ],
    boasts: [
      { id: 'marauders_boast_001', text: 'Ха! Мы только что ограбили караван Штаба! 500 патронов и куча еды! Кто следующий на очереди?', type: 'useless', frequency: 'frequent', importance: 'low', category: 'boasts' },
      { id: 'marauders_boast_002', text: 'Видели бы вы рожи тех солдатиков, когда мы их окружили! Бегали как крысы! Мы - короли пустоши!', type: 'useless', frequency: 'common', importance: 'low', category: 'boasts' }
    ],
    threats: [
      { id: 'marauders_threat_001', text: 'Слушайте внимательно, крысы! Следующий караван, который увидим - наш! Не вздумайте сопротивляться!', type: 'warning', frequency: 'rare', importance: 'high', category: 'threats', effects: { moraleChange: -2, enemyWarning: 'Угроза караванам' } },
      { id: 'marauders_threat_002', text: 'Ваш бункер следующий в списке! Лучше сами отдайте припасы, чем мы их заберем силой!', type: 'warning', frequency: 'rare', importance: 'high', category: 'threats', effects: { moraleChange: -3, enemyWarning: 'Угроза бункеру' } }
    ]
  }
  };
}

// Функция для получения случайного сообщения от фракции
function getRandomFactionMessage(factionId, type) {
  if (!window.FACTION_MESSAGES_DATA[factionId]) {
    return null;
  }

  let messages = [];
  const factionData = window.FACTION_MESSAGES_DATA[factionId];

  // Собираем все сообщения фракции
  Object.values(factionData).forEach(categoryMessages => {
    messages = messages.concat(categoryMessages);
  });

  // Фильтруем по типу, если указан
  if (type) {
    messages = messages.filter(msg => msg.type === type);
  }

  if (messages.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Функция для получения сообщений по категории
function getFactionMessagesByCategory(factionId, category) {
  if (!window.FACTION_MESSAGES_DATA[factionId] || !window.FACTION_MESSAGES_DATA[factionId][category]) {
    return [];
  }
  return window.FACTION_MESSAGES_DATA[factionId][category];
}

// Функция для получения сообщений по типу
function getFactionMessagesByType(factionId, type) {
  if (!window.FACTION_MESSAGES_DATA[factionId]) {
    return [];
  }

  let messages = [];
  const factionData = window.FACTION_MESSAGES_DATA[factionId];

  Object.values(factionData).forEach(categoryMessages => {
    messages = messages.concat(categoryMessages.filter(msg => msg.type === type));
  });

  return messages;
}

// Функция для получения статистики сообщений
function getFactionMessageStats() {
  const stats = {};
  Object.keys(window.FACTION_MESSAGES_DATA).forEach(factionId => {
    const factionData = window.FACTION_MESSAGES_DATA[factionId];
    let total = 0;
    const byType = {};
    const byCategory = {};

    Object.entries(factionData).forEach(([category, messages]) => {
      byCategory[category] = messages.length;
      total += messages.length;

      messages.forEach(msg => {
        byType[msg.type] = (byType[msg.type] || 0) + 1;
      });
    });

    stats[factionId] = { total, byType, byCategory };
  });

  return stats;
}

// Export functions globally
window.FactionMessages = {
  getRandomFactionMessage,
  getFactionMessagesByCategory,
  getFactionMessagesByType,
  getFactionMessageStats,
  MESSAGE_TYPES: window.FACTION_MESSAGE_TYPES,
  FREQUENCIES: window.FACTION_MESSAGE_FREQUENCIES,
  IMPORTANCES: window.FACTION_MESSAGE_IMPORTANCES
};

console.log('[Faction Messages] JavaScript version loaded, available', Object.keys(window.FACTION_MESSAGES_DATA).length, 'factions');

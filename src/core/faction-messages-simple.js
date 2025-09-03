// Simplified faction messages for Bunker Survivors
// Basic JavaScript version for browser

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

// Basic message categories
if (typeof window.MESSAGE_CATEGORIES === 'undefined') {
  window.MESSAGE_CATEGORIES = {
    hq: ['announcements', 'orders', 'reports', 'propaganda', 'surveillance'],
    rebels: ['coordination', 'attacks', 'recruitment', 'intelligence', 'ideology'],
    free: ['freedom', 'news', 'advertisements', 'anecdotes', 'freedom_calls'],
    marauders: ['trade_offers', 'boasts', 'threats', 'insults'],
    mystery: ['warnings', 'signals', 'thoughts', 'visions']
  };
}

// Basic faction messages data
if (typeof window.FACTION_MESSAGES_DATA === 'undefined') {
  window.FACTION_MESSAGES_DATA = {
    hq: {
      announcements: [
        { id: 'hq_001', text: 'Attention! All citizens must observe curfew from 22:00 to 06:00.', type: 'useful', frequency: 'common', importance: 'high' },
        { id: 'hq_002', text: 'New patrol units are being formed. Service is honor and duty.', type: 'useful', frequency: 'rare', importance: 'medium' }
      ],
      orders: [
        { id: 'hq_003', text: 'All units report to sector Alpha for briefing.', type: 'useful', frequency: 'common', importance: 'high' },
        { id: 'hq_004', text: 'Increase surveillance in residential areas.', type: 'useful', frequency: 'common', importance: 'medium' }
      ],
      reports: [
        { id: 'hq_005', text: 'Sector 7 cleared of hostile elements.', type: 'useful', frequency: 'common', importance: 'medium' },
        { id: 'hq_006', text: 'Resource convoy arrived safely at base.', type: 'useful', frequency: 'common', importance: 'low' }
      ],
      propaganda: [
        { id: 'hq_007', text: 'Unity is our strength! Together we will rebuild civilization.', type: 'propaganda', frequency: 'common', importance: 'medium' },
        { id: 'hq_008', text: 'The bunker protects us all. Trust in the system.', type: 'propaganda', frequency: 'common', importance: 'medium' }
      ],
      surveillance: [
        { id: 'hq_009', text: 'All communications are monitored for your safety.', type: 'warning', frequency: 'rare', importance: 'high' },
        { id: 'hq_010', text: 'Report any suspicious activity immediately.', type: 'warning', frequency: 'common', importance: 'high' }
      ]
    },
    rebels: {
      coordination: [
        { id: 'rebels_001', text: 'Meeting point changed to sector 7. Be careful.', type: 'useful', frequency: 'common', importance: 'high' },
        { id: 'rebels_002', text: 'New resistance cell formed. Contact established.', type: 'useful', frequency: 'rare', importance: 'medium' }
      ],
      attacks: [
        { id: 'rebels_003', text: 'HQ patrol eliminated. Weapons secured.', type: 'useful', frequency: 'rare', importance: 'high' },
        { id: 'rebels_004', text: 'Supply depot hit. Resources distributed to cells.', type: 'useful', frequency: 'rare', importance: 'medium' }
      ],
      recruitment: [
        { id: 'rebels_005', text: 'Join the resistance! Freedom fighters needed.', type: 'propaganda', frequency: 'common', importance: 'medium' },
        { id: 'rebels_006', text: 'New recruits trained. Cell strength growing.', type: 'useful', frequency: 'rare', importance: 'low' }
      ],
      intelligence: [
        { id: 'rebels_007', text: 'HQ plans discovered. Prepare for counter-operation.', type: 'useful', frequency: 'rare', importance: 'high' },
        { id: 'rebels_008', text: 'Informant reports new security measures.', type: 'useful', frequency: 'common', importance: 'medium' }
      ],
      ideology: [
        { id: 'rebels_009', text: 'Freedom cannot be taken away. It must be fought for.', type: 'propaganda', frequency: 'common', importance: 'medium' },
        { id: 'rebels_010', text: 'The people will rise. The system will fall.', type: 'propaganda', frequency: 'common', importance: 'medium' }
      ]
    },
    free: {
      freedom: [
        { id: 'free_001', text: 'Freedom is our right! Join the movement for equality.', type: 'propaganda', frequency: 'common', importance: 'medium' },
        { id: 'free_002', text: 'New ideas for peaceful coexistence. Let us discuss.', type: 'useful', frequency: 'rare', importance: 'low' }
      ],
      news: [
        { id: 'free_003', text: 'Independent news: HQ forces expanding control.', type: 'useful', frequency: 'common', importance: 'medium' },
        { id: 'free_004', text: 'Weather report: Clear skies, good for travel.', type: 'useful', frequency: 'common', importance: 'low' }
      ],
      advertisements: [
        { id: 'free_005', text: 'Trade fair in sector 3. All welcome to participate.', type: 'useful', frequency: 'common', importance: 'low' },
        { id: 'free_006', text: 'Looking for skilled craftsmen. Good pay guaranteed.', type: 'useful', frequency: 'common', importance: 'low' }
      ],
      anecdotes: [
        { id: 'free_007', text: 'Funny story: A rebel walked into a bar...', type: 'useless', frequency: 'common', importance: 'low' },
        { id: 'free_008', text: 'Joke of the day: Why did the mutant cross the road?', type: 'useless', frequency: 'common', importance: 'low' }
      ],
      freedom_calls: [
        { id: 'free_009', text: 'Stand up for your rights! Unity in diversity.', type: 'propaganda', frequency: 'common', importance: 'medium' },
        { id: 'free_010', text: 'Together we are stronger. Join the free movement.', type: 'propaganda', frequency: 'common', importance: 'medium' }
      ]
    },
    marauders: {
      trade_offers: [
        { id: 'marauders_001', text: 'Selling weapons! Assault rifle for 300 ammo.', type: 'useful', frequency: 'common', importance: 'medium' },
        { id: 'marauders_002', text: 'Just robbed HQ caravan! 500 ammo and food captured.', type: 'mysterious', frequency: 'rare', importance: 'low' }
      ],
      boasts: [
        { id: 'marauders_003', text: 'We are the strongest! No one dares challenge us.', type: 'propaganda', frequency: 'common', importance: 'low' },
        { id: 'marauders_004', text: 'Another victory! Our territory expands.', type: 'propaganda', frequency: 'common', importance: 'low' }
      ],
      threats: [
        { id: 'marauders_005', text: 'Pay tribute or face our wrath!', type: 'warning', frequency: 'common', importance: 'high' },
        { id: 'marauders_006', text: 'Cross our territory and you will regret it.', type: 'warning', frequency: 'common', importance: 'high' }
      ],
      insults: [
        { id: 'marauders_007', text: 'HQ soldiers are weak! We could take them anytime.', type: 'useless', frequency: 'common', importance: 'low' },
        { id: 'marauders_008', text: 'Those rebels think they are tough. They are nothing!', type: 'useless', frequency: 'common', importance: 'low' }
      ]
    },
    mystery: {
      warnings: [
        { id: 'mystery_001', text: '*whisper* They are coming... through shadows... through dreams... wake up!', type: 'mysterious', frequency: 'rare', importance: 'high' },
        { id: 'mystery_002', text: 'The mutants are getting stronger. Ancient evil awakens.', type: 'warning', frequency: 'common', importance: 'medium' }
      ],
      signals: [
        { id: 'mystery_003', text: '*static* ...help... trapped... sector... *static*', type: 'mysterious', frequency: 'rare', importance: 'high' },
        { id: 'mystery_004', text: 'Unknown frequency detected. Source unclear.', type: 'mysterious', frequency: 'rare', importance: 'medium' }
      ],
      thoughts: [
        { id: 'mystery_005', text: 'The walls whisper secrets. Do you hear them?', type: 'mysterious', frequency: 'rare', importance: 'low' },
        { id: 'mystery_006', text: 'Time flows differently here. Reality bends.', type: 'mysterious', frequency: 'rare', importance: 'low' }
      ],
      visions: [
        { id: 'mystery_007', text: 'I see... a great storm coming... prepare...', type: 'mysterious', frequency: 'rare', importance: 'high' },
        { id: 'mystery_008', text: 'The future is uncertain. Many paths ahead.', type: 'mysterious', frequency: 'rare', importance: 'medium' }
      ]
    }
  };
}

// Utility functions
function getRandomFactionMessage(factionId) {
  const factionData = window.FACTION_MESSAGES_DATA[factionId];
  if (!factionData) return null;

  const categories = Object.keys(factionData);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const messages = factionData[randomCategory];

  if (!messages || messages.length === 0) return null;

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  return {
    text: randomMessage.text,
    type: randomMessage.type,
    factionId: factionId
  };
}

function getFactionMessagesByCategory(factionId, category) {
  const factionData = window.FACTION_MESSAGES_DATA[factionId];
  if (!factionData || !factionData[category]) return [];
  return factionData[category];
}

function getFactionMessagesByType(factionId, type) {
  const factionData = window.FACTION_MESSAGES_DATA[factionId];
  if (!factionData) return [];

  const result = [];
  Object.keys(factionData).forEach(category => {
    factionData[category].forEach(message => {
      if (message.type === type) {
        result.push(message);
      }
    });
  });

  return result;
}

function getFactionMessageStats() {
  const stats = {};

  Object.keys(window.FACTION_MESSAGES_DATA).forEach(factionId => {
    const factionData = window.FACTION_MESSAGES_DATA[factionId];
    let total = 0;
    const byType = {};
    const byCategory = {};

    Object.keys(factionData).forEach(category => {
      const messages = factionData[category];
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

console.log('[Faction Messages] Simplified version loaded, available', Object.keys(window.FACTION_MESSAGES_DATA).length, 'factions');

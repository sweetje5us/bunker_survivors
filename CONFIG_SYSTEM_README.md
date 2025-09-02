# ⚙️ Система конфигурации игры

## Обзор

Система конфигурации позволяет легко настраивать все параметры игры через JSON файл, что значительно упрощает балансировку и настройку различных уровней сложности.

## ⚠️ **ВАЖНО ДЛЯ БАЛАНСИРОВКИ**

**Для изменения баланса игры используйте ТОЛЬКО файл `src/config/game-config.json`!**

- ✅ **JSON файл** - основной источник настроек для балансировки
- ❌ **TypeScript файлы** - только для fallback при ошибках
- 🔄 **Перезапуск** - обязателен после изменения JSON

## 📁 Структура файлов

```
src/config/
├── game-config.json          # Основной конфигурационный файл
├── game-config.types.ts      # TypeScript интерфейсы
└── config-manager.ts         # Менеджер конфигурации
```

## 🎮 Уровни сложности

### Доступные сложности:
- **easy** - Легкий (для новичков)
- **normal** - Обычный (стандартная сложность)
- **hard** - Сложный (для ветеранов)
- **nightmare** - Кошмар (экстремальная сложность)

## 🔧 Основные разделы конфигурации

### 1. **Опыт (Experience)**
```json
{
  "experience": {
    "baseLevelExperience": 100,        // Опыт для каждого уровня
    "enemyKillRewards": {              // Опыт за убийство врагов
      "МАРОДЕР": 10,
      "ЗОМБИ": 15,
      "МУТАНТ": 30,
      "СОЛДАТ": 50
    },
    "dailyReward": 50,                 // Опыт за прожитый день
    "abilityPointsPerLevel": 3         // Очки способностей за уровень
  }
}
```

### 2. **Потребление ресурсов (Resource Consumption)**
```json
{
  "resourceConsumption": {
    "food": {
      "easy": {
        "intervalHours": 2,            // Каждые 2 часа
        "baseConsumption": 1,          // Базовое потребление
        "multiplier": 0.8              // Множитель сложности
      }
    },
    "water": {
      "easy": {
        "intervalHours": 2,
        "baseConsumption": 1,
        "multiplier": 0.8
      }
    }
  }
}
```

### 3. **Начальные ресурсы (Initial Resources)**
```json
{
  "initialResources": {
    "easy": {
      "happiness": 75,                 // Счастье
      "defense": 75,                   // Защита
      "ammo": 150,                     // Патроны
      "comfort": 150,                  // Комфорт
      "moral": 75,                     // Мораль
      "food": 150,                     // Еда
      "water": 150,                    // Вода
      "money": 300,                    // Деньги
      "wood": 100,                     // Дерево
      "metal": 50,                     // Металл
      "coal": 20,                      // Уголь
      "nails": 40,                     // Гвозди
      "paper": 30,                     // Бумага
      "glass": 10                      // Стекло
    }
  }
}
```

### 4. **Урон врагов (Enemy Damage)**
```json
{
  "enemyDamage": {
    "baseDamage": {                    // Базовый урон врагов
      "МАРОДЕР": 1,
      "ЗОМБИ": 2,
      "МУТАНТ": 3,
      "СОЛДАТ": 4
    },
    "defenseDamage": {                 // Урон по защите
      "easy": {
        "multiplier": 0.5,             // Множитель урона
        "intervalHours": 4             // Интервал атак (часы)
      }
    },
    "firstEnemyDelay": {               // Задержка первого врага
      "easy": 8,
      "normal": 6,
      "hard": 4,
      "nightmare": 2
    },
    "subsequentEnemyInterval": {       // Интервал между врагами
      "easy": 4,
      "normal": 3,
      "hard": 2,
      "nightmare": 1
    }
  }
}
```

### 5. **Здоровье врагов (Enemy Health)**
```json
{
  "enemyHealth": {
    "МАРОДЕР": 2,
    "ЗОМБИ": 3,
    "МУТАНТ": 6,
    "СОЛДАТ": 10
  }
}
```

### 6. **Урон оружия (Weapon Damage)**
```json
{
  "weaponDamage": {
    "melee": 1,
    "pistol": 1,
    "shotgun": 2,
    "ar": 1,
    "sniper": 3
  }
}
```

### 7. **Цикл день/ночь (Day/Night Cycle)**
```json
{
  "dayNightCycle": {
    "dayDurationHours": 16,           // Длительность дня (часы)
    "nightDurationHours": 8,          // Длительность ночи (часы)
    "dayStartHour": 6,                // Час начала дня
    "nightStartHour": 22              // Час начала ночи
  }
}
```

### 8. **Система посетителей (Visitor System)**
```json
{
  "visitorSystem": {
    "maxQueueSize": 10,               // Максимальный размер очереди
    "initialVisitors": 3,             // Начальное количество посетителей
    "arrivalInterval": {               // Интервал прибытия
      "easy": "2-4",
      "normal": "3-6",
      "hard": "4-8",
      "nightmare": "5-10"
    }
  }
}
```

### 9. **Вместимость бункера (Bunker Capacity)**
```json
{
  "bunkerCapacity": {
    "baseCapacity": 10,               // Базовая вместимость
    "capacityPerRoom": {              // Вместимость комнат
      "Спальня": 2,
      "Столовая": 1,
      "Туалет": 1,
      "Госпиталь": 1
    }
  }
}
```

### 10. **Эффекты навыков (Skill Effects)**
```json
{
  "skillEffects": {
    "cooking": {
      "foodBonus": 1,                 // Бонус к еде
      "maxLevel": 2                    // Максимальный уровень
    },
    "plumbing": {
      "waterBonus": 1,                // Бонус к воде
      "maxLevel": 2
    },
    "hunting": {
      "foodBonusPercent": 5,          // Процентный бонус к еде
      "maxLevel": 10
    },
    "scouting": {
      "lootBonusPercent": 5,          // Процентный бонус к добыче
      "maxLevel": 10
    }
  }
}
```

### 11. **Боевая система (Combat System)**
```json
{
  "combatSystem": {
    "soldierShotsPerHour": {
      "base": 2,                      // Базовые выстрелы в час
      "skillBonus": 1,                // Бонус от навыков
      "maxShots": 8                   // Максимальное количество выстрелов
    },
    "attackCooldown": {
      "base": 1000,                   // Базовое время перезарядки (мс)
      "skillReduction": 200           // Сокращение от навыков (мс)
    }
  }
}
```

### 12. **Система морали (Morale System)**
```json
{
  "moraleSystem": {
    "baseDecay": 1,                   // Базовое снижение морали
    "positiveEvents": {               // Положительные события
      "visitorAccepted": 5,
      "enemyKilled": 2,
      "roomBuilt": 3
    },
    "negativeEvents": {               // Отрицательные события
      "visitorRejected": -3,
      "residentDied": -10,
      "resourceShortage": -5
    }
  }
}
```

### 13. **Система безумия (Insanity System)**
```json
{
  "insanitySystem": {
    "baseChance": 0.01,               // Базовый шанс безумия
    "triggers": {                     // Триггеры безумия
      "lowMorale": 0.05,
      "resourceShortage": 0.03,
      "enemyAttack": 0.02
    },
    "recoveryChance": 0.005           // Шанс восстановления
  }
}
```

## 🚀 Использование в коде

### Инициализация
```typescript
import { ConfigManager } from '../config/config-manager';

export class GameScene extends Phaser.Scene {
  private configManager: ConfigManager = ConfigManager.getInstance();
  
  async init(data: { difficulty?: Difficulty }): Promise<void> {
    // Загружаем конфигурацию
    await this.configManager.loadConfig();
    this.configManager.setDifficulty(this.difficulty);
  }
}
```

### Получение значений
```typescript
// Опыт за врага
const xp = this.configManager.getEnemyKillReward('ЗОМБИ');

// Начальные ресурсы
const resources = this.configManager.getInitialResources();

// Множитель потребления
const foodMultiplier = this.configManager.getResourceConsumptionMultiplier('food');

// Интервал атак врагов
const attackInterval = this.configManager.getDefenseDamageInterval();
```

## 🔄 Изменение конфигурации

### 1. **Редактирование JSON файла (ОСНОВНОЙ СПОСОБ)**
**Для балансировки игры используйте ТОЛЬКО `src/config/game-config.json`!**

```bash
# Откройте файл в любом текстовом редакторе
src/config/game-config.json
```

**Примеры изменений:**
```json
// Увеличить опыт за зомби
"enemyKillRewards": {
  "ЗОМБИ": 5  // Было 3, стало 5
}

// Уменьшить интервал атак на сложном уровне
"defenseDamage": {
  "hard": {
    "intervalHours": 0.5  // Было 1, стало 0.5
  }
}

// Изменить начальные ресурсы для легкого уровня
"initialResources": {
  "easy": {
    "ammo": 200,  // Было 150, стало 200
    "money": 400  // Было 300, стало 400
  }
}
```

**ВАЖНО:** После изменения JSON файла перезапустите игру!

### 2. **Добавление новых параметров**
1. Добавьте параметр в JSON файл
2. Добавьте соответствующий интерфейс в `game-config.types.ts`
3. Добавьте методы в `ConfigManager`

### 3. **Пример изменения баланса**
```json
// Увеличить опыт за зомби
"enemyKillRewards": {
  "ЗОМБИ": 5  // Было 3, стало 5
}

// Уменьшить интервал атак на сложном уровне
"defenseDamage": {
  "hard": {
    "intervalHours": 0.5  // Было 1, стало 0.5
  }
}
```

## 🧪 Тестирование конфигурации

### 1. **Проверка загрузки**
```typescript
if (this.configManager.isConfigLoaded()) {
  console.log('Конфигурация загружена успешно');
}
```

### 2. **Проверка сложности**
```typescript
const currentDifficulty = this.configManager.getCurrentDifficulty();
const difficultyInfo = this.configManager.getDifficultyInfo(currentDifficulty);
console.log(`Текущая сложность: ${difficultyInfo.name}`);
```

### 3. **Проверка доступных сложностей**
```typescript
const difficulties = this.configManager.getAvailableDifficulties();
console.log('Доступные сложности:', difficulties);
```

### 4. **Проверка источника конфигурации**
```typescript
// Проверяем, загружена ли конфигурация из JSON
if (this.configManager.isConfigFromJSON()) {
  console.log('✅ Конфигурация загружена из JSON файла');
} else {
  console.log('⚠️ Используются дефолтные значения (fallback)');
}

// Получаем информацию об источнике
const source = this.configManager.getConfigSource();
console.log(`Источник конфигурации: ${source}`);
```

## ⚠️ Важные замечания

### 1. **Fallback значения**
Все методы имеют fallback значения на случай ошибки загрузки конфигурации.

### 2. **Валидация**
Конфигурация автоматически валидируется при загрузке.

### 3. **Производительность**
Конфигурация загружается один раз при инициализации сцены.

### 4. **Совместимость**
Старый код продолжает работать благодаря fallback значениям.

## 🔮 Будущие расширения

### Возможные дополнения:
- **Динамическая загрузка** конфигурации во время игры
- **Сохранение пользовательских** настроек
- **Валидация схемы** конфигурации
- **Горячая перезагрузка** настроек
- **Визуальный редактор** конфигурации

## 📞 Поддержка

При возникновении проблем:
1. Проверьте синтаксис JSON файла
2. Убедитесь, что все обязательные поля присутствуют
3. Проверьте консоль на наличие ошибок загрузки
4. Используйте fallback значения для отладки

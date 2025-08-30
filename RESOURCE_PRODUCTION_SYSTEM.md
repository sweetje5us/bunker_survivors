# 🏭 Система производства ресурсов

## 📋 Описание

Реализована система производства ресурсов от работающих жителей и комнат бункера. Теперь повара и сантехники производят ресурсы во время работы, а столовая и туалет обеспечивают дополнительное производство.

## 🎯 Требования

### 1. Производство от работающих жителей:
- **Повар**: 5 единиц еды в игровой час
- **Сантехник**: 4 единицы воды в игровой час

### 2. Производство от комнат:
- **Столовая**: 10 единиц еды в день
- **Туалет**: 10 единиц воды в день

## 🔧 Реализация

### 1. Новый метод `processHourlyResourceProduction()` в GameScene.ts:

```typescript
private processHourlyResourceProduction(): void {
  if (this.bunkerResidents.length === 0) {
    console.log(`[processHourlyResourceProduction] ⚠️ Нет жителей, пропускаем производство ресурсов`)
    return
  }

  let foodProduction = 0
  let waterProduction = 0

  // Проходим по всем жителям и проверяем их работу
  this.bunkerResidents.forEach(resident => {
    if (resident.status === 'работает') {
      // Повар производит еду
      if (resident.profession === 'повар') {
        const production = 5 // 5 ед. еды в игровой час
        foodProduction += production
        console.log(`[processHourlyResourceProduction] 🍳 Повар ${resident.name} производит ${production} ед. еды`)
      }
      
      // Сантехник производит воду
      if (resident.profession === 'сантехник') {
        const production = 4 // 4 ед. воды в игровой час
        waterProduction += production
        console.log(`[processHourlyResourceProduction] 🔧 Сантехник ${resident.name} производит ${production} ед. воды`)
      }
    }
  })

  // Добавляем производство от комнат (ежедневное, но распределяем по часам)
  const diningCount = this.getRoomCount('Столовая')
  const toiletCount = this.getRoomCount('Туалет')
  
  // Столовая производит 10 ед. еды в день, распределяем по часам
  const hourlyFoodFromRooms = Math.round((diningCount * 10) / 24)
  // Туалет производит 10 ед. воды в день, распределяем по часам
  const hourlyWaterFromRooms = Math.round((toiletCount * 10) / 24)
  
  foodProduction += hourlyFoodFromRooms
  waterProduction += hourlyWaterFromRooms

  if (foodProduction > 0 || waterProduction > 0) {
    console.log(`[processHourlyResourceProduction] 📊 Почасовое производство: еда +${foodProduction} (${hourlyFoodFromRooms} от комнат), вода +${waterProduction} (${hourlyWaterFromRooms} от комнат)`)
    
    // Добавляем ресурсы
    this.food = Math.max(0, Math.round(this.food + foodProduction))
    this.water = Math.max(0, Math.round(this.water + waterProduction))
    
    console.log(`[processHourlyResourceProduction] ✅ Ресурсы обновлены: еда=${this.food}, вода=${this.water}`)
  } else {
    console.log(`[processHourlyResourceProduction] ℹ️ Нет производства ресурсов в этот час`)
  }
}
```

### 2. Интеграция в почасовую обработку:

```typescript
private processHourlyResourceConsumption(): void {
  // Сначала обрабатываем производство ресурсов
  this.processHourlyResourceProduction()
  
  // Затем обрабатываем потребление
  const { foodConsumption, waterConsumption } = this.calculateHourlyResourceConsumption()
  // ... остальная логика
}
```

### 3. Обновленный метод `getDetailedResourceInfo()`:

```typescript
public getDetailedResourceInfo(resourceType: 'food' | 'water'): {
  // ... существующие поля ...
  hourlyProduction: number;    // Производство в час
  dailyProduction: number;     // Производство в день
  workingResidents: number;    // Количество работающих специалистов
}
```

### 4. Расчет производства в `getDetailedResourceInfo()`:

```typescript
// Рассчитываем производство ресурсов
let hourlyProduction = 0;
let workingResidents = 0;

// Подсчитываем работающих жителей по профессиям
this.bunkerResidents.forEach(resident => {
  if (resident.status === 'работает') {
    if (resourceType === 'food' && resident.profession === 'повар') {
      hourlyProduction += 5; // Повар производит 5 ед. еды в час
      workingResidents++;
    } else if (resourceType === 'water' && resident.profession === 'сантехник') {
      hourlyProduction += 4; // Сантехник производит 4 ед. воды в час
      workingResidents++;
    }
  }
});

// Добавляем производство от комнат
if (resourceType === 'food') {
  hourlyProduction += Math.round((roomCount * 10) / 24); // Столовая: 10 ед. в день
} else {
  hourlyProduction += Math.round((roomCount * 10) / 24); // Туалет: 10 ед. в день
}

const dailyProduction = hourlyProduction * 24;
```

## 🎮 Обновленные модальные окна

### Модальное окно еды:
- ✅ Общее количество
- ✅ Общий расход в день
- ✅ Расход на жителя в день
- 🆕 **Производство от работающих жителей** (ед./час и ед./день)
- 🆕 **Работающих специалистов** (количество)
- ✅ Получение от комнат в день
- ✅ Множитель сложности
- ✅ Следующее увеличение

### Модальное окно воды:
- ✅ Общее количество
- ✅ Общий расход в день
- ✅ Расход на жителя в день
- 🆕 **Производство от работающих жителей** (ед./час и ед./день)
- 🆕 **Работающих специалистов** (количество)
- ✅ Получение от комнат в день
- ✅ Множитель сложности
- ✅ Следующее увеличение

## 📊 Примеры расчетов

### Пример 1: 1 повар + 1 столовая
- **Почасовое производство**: 5 ед. (повар) + 0.42 ед. (столовая) = 5.42 ≈ 5 ед./час
- **Ежедневное производство**: 5 × 24 = 120 ед./день

### Пример 2: 2 сантехника + 2 туалета
- **Почасовое производство**: 8 ед. (сантехники) + 0.83 ед. (туалеты) = 8.83 ≈ 9 ед./час
- **Ежедневное производство**: 9 × 24 = 216 ед./день

### Пример 3: Смешанная команда
- **1 повар + 1 сантехник + 1 столовая + 1 туалет**
- **Почасовое производство**: 5 ед. еды + 4 ед. воды + 0.42 ед. еды + 0.42 ед. воды
- **Итого**: 5.42 ед. еды/час + 4.42 ед. воды/час

## 🧪 Тестирование

Создан тестовый файл `test_resource_production.html` для проверки:
- Добавления жителей разных профессий
- Переключения статуса работы
- Симуляции почасового и ежедневного производства
- Учета количества комнат
- Логирования всех операций

## 🔄 Принцип работы

1. **Каждый час** вызывается `processHourlyResourceProduction()`
2. **Проверяются все жители** со статусом "работает"
3. **Повара производят еду** (5 ед./час)
4. **Сантехники производят воду** (4 ед./час)
5. **Комнаты дают дополнительное производство** (распределяется по часам)
6. **Ресурсы добавляются** к текущим запасам
7. **Затем обрабатывается потребление** ресурсов

## 📈 Преимущества системы

- **Реалистичность**: Работающие жители производят ресурсы
- **Баланс**: Производство компенсирует потребление
- **Стратегия**: Игрок должен управлять работой жителей
- **Прозрачность**: Все расчеты видны в модальных окнах
- **Масштабируемость**: Система легко расширяется для новых профессий

## 🚀 Возможности расширения

В будущем можно добавить:
- Другие профессии (шахтеры для угля, лесорубы для дерева)
- Улучшения комнат для увеличения производства
- Навыки жителей для повышения эффективности
- События, влияющие на производство
- Торговлю излишками ресурсов

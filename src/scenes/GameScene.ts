import Phaser from 'phaser'
import { t } from '../core/i18n'
import { onResize, isPortrait } from '../core/responsive'
import { THEME, applyPanelBackground, uiScale, fs } from '../core/theme'
import type { Difficulty } from './DifficultyScene'

import { SimpleBunkerView, RoomState } from '../core/bunkerView'
import { createCharacterSprite, pickSkinForGender, ensureCharacterAnimations, pickClothingSetForGender, pickHairForGender, ensureSpecialistAnimations, getSpecialistSpriteKey, isSpecialistSprite } from '../core/characters'
import { ITEMS_DATABASE, Item } from '../core/items'
import { ConfigManager } from '../config/config-manager'
import { getSidequestItemManager, SidequestItem } from '../core/sidequest-items'
import { FactionManager, FactionId } from '../core/factions'
import { QuestManager, QuestUtils } from '../core/quests'

type Phase = 'day' | 'night'

type MobilePanel = 'bunker' | 'info' | 'people' | 'resources'

type EntranceState = 'normal' | 'broken' | 'accept' | 'deny'

type WeatherState = 'clear' | 'rain' | 'lighting' | 'acid_fog'

export class GameScene extends Phaser.Scene {
  private difficulty: Difficulty = 'normal'
  private dayNumber = 1
  private phase: Phase = 'day'
  private readonly DAY_DURATION_MS = 3 * 60 * 1000
  private readonly NIGHT_DURATION_MS = 2 * 60 * 1000
  private configManager: ConfigManager = ConfigManager.getInstance()
  private questManager: QuestManager = QuestManager.getInstance()
  private dayCycleStartAt = 0
  private phaseEndsAt = 0
  private clockEvent?: Phaser.Time.TimerEvent
  private midnightHandled = false

  private topBar?: Phaser.GameObjects.Container
  private dayText?: Phaser.GameObjects.Text
  private resourcesText?: Phaser.GameObjects.Text
  private abilitiesBtn?: Phaser.GameObjects.Text
  private pauseBtn?: Phaser.GameObjects.Text
  private populationBtn?: Phaser.GameObjects.Text
  private happinessBtn?: Phaser.GameObjects.Text
  // private defenseBtn?: Phaser.GameObjects.Text // Убираем кнопку defence
  private ammoBtn?: Phaser.GameObjects.Text
  private comfortBtn?: Phaser.GameObjects.Text
  private foodBtn?: Phaser.GameObjects.Text
  private waterBtn?: Phaser.GameObjects.Text
  private moneyBtn?: Phaser.GameObjects.Text
  private inventoryBtn?: Phaser.GameObjects.Text
  private enemyCountText?: Phaser.GameObjects.Text

  // Шкала опыта бункера
  private experienceBg?: Phaser.GameObjects.Rectangle
  private experienceFg?: Phaser.GameObjects.Rectangle
  private levelText?: Phaser.GameObjects.Text
  private xpText?: Phaser.GameObjects.Text
  private bunkerLevel = 1
  private bunkerExperience = 0
  private maxExperienceForLevel = 100
  private abilityPoints = 0
  private inventoryRows = 1

  // HTML UI Overlay
  private uiOverlay: any = null
  private uiUpdateInterval?: Phaser.Time.TimerEvent

  private surfaceArea?: Phaser.GameObjects.Container
  private personArea?: Phaser.GameObjects.Container
  private peopleArea?: Phaser.GameObjects.Container
  private resourcesArea?: Phaser.GameObjects.Container
  private personTop?: Phaser.GameObjects.Container
  private personBottom?: Phaser.GameObjects.Container
  private personEntranceImage?: Phaser.GameObjects.Image
  private acceptBtnObj?: Phaser.GameObjects.Sprite
  private denyBtnObj?: Phaser.GameObjects.Sprite
  // private defendBtnObj?: Phaser.GameObjects.Text // Убираем кнопку defence
  private personPreview?: Phaser.GameObjects.Rectangle
  private personPreviewSprite?: Phaser.GameObjects.Sprite
  private personPreviewShirt?: Phaser.GameObjects.Sprite
  private personPreviewPants?: Phaser.GameObjects.Sprite
  private personPreviewFootwear?: Phaser.GameObjects.Sprite
  private personPreviewHair?: Phaser.GameObjects.Sprite
  private personPreviewInventory?: Phaser.GameObjects.Container
  private gunSprite?: Phaser.GameObjects.Image
  private gunAnimTimer?: Phaser.Time.TimerEvent
  private autoFireTimer?: Phaser.Time.TimerEvent
  private clickTimer?: Phaser.Time.TimerEvent
  private isAutoFiring = false
  private isClickMode = false
  private pointerDownTime = 0
  private enemyHpBg?: Phaser.GameObjects.Rectangle
  private enemyHpFg?: Phaser.GameObjects.Rectangle
  private currentWeapon: 'melee' | 'pistol' | 'shotgun' | 'ar' | 'sniper' = 'pistol'
  private lastHourTick: number = -1
  private sessionSeed: number = 0
  private personCache: Map<number, { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; inventory: Array<{ id: string; quantity: number }> }> = new Map()
  
  // Системы фракций и побочных предметов
  private factionManager?: FactionManager
  private truthfulFaction?: FactionId
  // Инвентарь бункера - хранит все предметы, добавленные жителями
  private bunkerInventory: Array<{ id: string; quantity: number } | undefined> = []

  // Активный квестовый предмет для источника информации
  private activeQuestItem: { id: string; name: string; spritePath: string; infoSource: string; quantity: number } | null = null

  // Drag and drop состояние
  private draggedItem: { id: string; quantity: number; fromSlot: number } | null = null
  private dragGhost?: Phaser.GameObjects.Image
  private noSpaceLabel?: Phaser.GameObjects.Text
  private personNameText?: Phaser.GameObjects.Text
  private personDetailsText?: Phaser.GameObjects.Text
  private personSkillText?: Phaser.GameObjects.Text
  private itemTooltipText?: Phaser.GameObjects.Text
  private bunkerArea?: Phaser.GameObjects.Container
  private simpleBunker?: SimpleBunkerView

  private visitorsRemaining = 3
  private readonly MAX_QUEUE_SIZE = 10 // Максимальное количество персонажей в очереди
  private surfaceQueue?: Phaser.GameObjects.Container
  private queueItems: { id: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; exiting?: boolean }[] = []
  private nextVisitorId = 1
  private arrivalEvent?: Phaser.Time.TimerEvent
  private initialQueueSeeded = false
  private lastSurfaceRect?: Phaser.Geom.Rectangle
  // Enemies
  private surfaceEnemyQueue?: Phaser.GameObjects.Container
  private enemyQueueItems: { id: number; rect: Phaser.GameObjects.Rectangle; type: string; exiting?: boolean; blockedFromEntry?: boolean; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite }[] = []
  private nextEnemyId = 1
  private enemyArrivalEvent?: Phaser.Time.TimerEvent
  private _previewBusy: boolean = false
  private _previewCurrentId: number | null = null
  private _previewCurrentIsEnemy: boolean = false
  private lastPersonRect?: Phaser.Geom.Rectangle

  // Состояние двери для превью входа
  private entranceState: EntranceState = 'normal'
  private entranceStateTimer?: Phaser.Time.TimerEvent

  // Состояние погоды для поверхности
  private weatherState: WeatherState = 'clear'
  private surfaceBackground?: Phaser.GameObjects.Image
  private weatherTimer?: Phaser.Time.TimerEvent

  // Плавный переход дня/ночи
  private isTransitioning = false
  
  // Люди в бункере
  private bunkerResidents: Array<{
    id: number
    name: string
    gender: string
    age: number
    profession: string
    skills: Array<{ text: string; positive: boolean }>
    itemsText: string
    inventory: Array<{ id: string; quantity: number }>
    admittedAt: number
    status?: string
    // Потребности 0..100 (100 = полно/здоров/энергичен)
    hunger?: number
    thirst?: number
    energy?: number
    health?: number
    patient?: boolean
    insane?: boolean // Флаг безумия жителя
    insaneSince?: number // Время с которого житель сошел с ума
    intent?: string // Поведение: 'peaceful' (мирное) или 'hostile' (агрессивное)
    skinColor?: number // Цвет кожи
    shirtType?: number // Тип рубашки
    pantsType?: number // Тип штанов
    footwearType?: number // Тип обуви
    hairType?: number // Тип волос
  }> = []
  
  // Враги в бункере (отдельная система)
  private bunkerEnemies: Array<{
    id: number
    name: string
    gender: string
    age: number
    profession: string
    skills: Array<{ text: string; positive: boolean }>
    itemsText: string
    admittedAt: number
    status?: string
    currentRoom: string
    intent: string
    hunger?: number
    thirst?: number
    energy?: number
    health?: number
    isEnemy: boolean
    enemyType: string
    marauderKind?: number
    zombieKind?: string
    mutantKind?: number
    insane?: boolean // Флаг безумия для бывших жителей
    insaneSince?: number // Время с которого стал безумным
    insaneKind?: number // Тип спрайта для безумных
    skinColor?: number // Цвет кожи для правильного спрайта
    shirtType?: number // Тип рубашки
    pantsType?: number // Тип штанов
    footwearType?: number // Тип обуви
    hairType?: number // Тип волос
  }> = []
  
  private mobileActive: MobilePanel = 'info'
  private mobileTabs?: Phaser.GameObjects.Container
  
  // Базовые ресурсы
  private happiness = 50
  private defense = 50
  private ammo = 100
  private comfort = 100
  private moral = 0 // Будет установлено из конфигурации
  private food = 100
  private water = 100
  private money = 200
  private wood = 50
  private metal = 25
  private coal = 10
  private nails = 20
  private paper = 15
  private glass = 5

  // Потребление ресурсов
  private foodConsumptionMultiplier = 1
  private waterConsumptionMultiplier = 1

  
  private hasSkill(skills: Array<{ text: string; positive: boolean }> | undefined, name: string): boolean {
    if (!Array.isArray(skills)) return false
    return skills.some(s => s && typeof s.text === 'string' && s.text.toLowerCase() === name.toLowerCase())
  }

  /**
   * Получает уровень способности по ID
   */
  private getAbilityLevel(abilityId: string): number {
    // Проверяем, доступна ли функция получения данных о способностях
    if (typeof window !== 'undefined' && (window as any).getAbilitiesData) {
      try {
        const abilitiesData = (window as any).getAbilitiesData()
        if (abilitiesData) {
          // Ищем способность во всех категориях
          for (const category of Object.values(abilitiesData) as any[]) {
            if (Array.isArray(category)) {
              const ability = category.find((a: any) => a.id === abilityId)
              if (ability) {
                return ability.currentLevel || 0
              }
            }
          }
        }
      } catch (error) {
        console.warn(`[getAbilityLevel] Ошибка при получении уровня способности ${abilityId}:`, error)
      }
    }
    return 0
  }

  /**
   * Get current moral value
   */
  private getCurrentMoral(): number {
    // Всегда возвращаем локальное значение морали из GameScene
    const moralValue = this.moral;

    return moralValue
  }

  /**
   * Рассчитывает множители потребления ресурсов на основе количества дней и сложности
   */
  private calculateResourceConsumptionMultipliers(): void {
    try {
      // Получаем настройки потребления из конфигурации
      const foodConfig = this.configManager.getResourceConsumption('food')
      const waterConfig = this.configManager.getResourceConsumption('water')
      
      // Применяем множители из конфигурации
      this.foodConsumptionMultiplier = foodConfig.multiplier
      this.waterConsumptionMultiplier = waterConfig.multiplier
      
      console.log(`[calculateResourceConsumptionMultipliers] Сложность: ${this.difficulty}, Множители из конфигурации: еда=${this.foodConsumptionMultiplier}, вода=${this.waterConsumptionMultiplier}`)
    } catch (error) {
      console.error('[GameScene] Ошибка получения множителей потребления из конфигурации:', error)
      // Fallback к старым значениям
      const daysPassed = Math.max(0, this.dayNumber - 1)
      
      switch (this.difficulty) {
        case 'easy':
          this.foodConsumptionMultiplier = 1 + Math.floor(daysPassed / 10)
          this.waterConsumptionMultiplier = 1 + Math.floor(daysPassed / 10)
          break
        case 'normal':
          this.foodConsumptionMultiplier = 1 + Math.floor(daysPassed / 7)
          this.waterConsumptionMultiplier = 1 + Math.floor(daysPassed / 7)
          break
        case 'hard':
          this.foodConsumptionMultiplier = 1 + Math.floor(daysPassed / 7) * 2
          this.waterConsumptionMultiplier = 1 + Math.floor(daysPassed / 7) * 2
          break
        default:
          this.foodConsumptionMultiplier = 1
          this.waterConsumptionMultiplier = 1
      }
      
      console.log(`[calculateResourceConsumptionMultipliers] Fallback: День ${this.dayNumber}, Сложность: ${this.difficulty}, Множители: еда=${this.foodConsumptionMultiplier}, вода=${this.waterConsumptionMultiplier}`)
    }
  }

  /**
   * Рассчитывает почасовое потребление ресурсов
   */
  private calculateHourlyResourceConsumption(): { foodConsumption: number; waterConsumption: number } {
    const residentCount = this.bunkerResidents.length
    const foodConsumption = Math.round(residentCount * 1 * this.foodConsumptionMultiplier)
    const waterConsumption = Math.round(residentCount * 1 * this.waterConsumptionMultiplier)
    
    return { foodConsumption, waterConsumption }
  }

  /**
   * Обрабатывает почасовое производство ресурсов от работающих жителей
   */
  private processHourlyResourceProduction(): void {
    if (this.bunkerResidents.length === 0) {

      return
    }

    // Отладочная информация о статусах жителей

    let foodProduction = 0
    let waterProduction = 0
    let engineerProduction: { [key: string]: number } = {}

    // Проходим по всем жителям и проверяем их работу
    this.bunkerResidents.forEach(resident => {
      // Проверяем, работает ли житель (статус может быть "работает" или "работает в [комнате]")
      if (resident.status && resident.status.startsWith('работает')) {
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
        
        // Инженер производит случайные ресурсы
        if (resident.profession === 'инженер') {
          const production = 2 // 2 ед. случайного ресурса в игровой час
          const engineerResources = ['wood', 'metal', 'coal', 'nails', 'paper', 'glass']
          const randomResource = engineerResources[Math.floor(Math.random() * engineerResources.length)]
          
          if (!engineerProduction[randomResource]) {
            engineerProduction[randomResource] = 0
          }
          engineerProduction[randomResource] += production
          
          console.log(`[processHourlyResourceProduction] 🔨 Инженер ${resident.name} производит ${production} ед. ${randomResource}`)
        }
        
        // Солдат стреляет по врагам
        if (resident.profession === 'солдат') {
          console.log(`[processHourlyResourceProduction] 🎯 Солдат ${resident.name} стреляет по врагам`)
          const success = this.soldierAutoFireWeapon(resident.id)
          if (!success) {
            console.log(`[processHourlyResourceProduction] ❌ Солдат ${resident.name} не смог стрелять (нет патронов или погиб)`)
          }
        }
        
        // Химик производит опыт
        if (resident.profession === 'химик') {
          const experienceProduction = 2 // 2 ед. опыта в игровой час
          this.addBunkerExperience(experienceProduction)
          console.log(`[processHourlyResourceProduction] 🧪 Химик ${resident.name} производит ${experienceProduction} ед. опыта`)
        }
        
        // Ученый производит опыт
        if (resident.profession === 'ученый') {
          const experienceProduction = 2 // 2 ед. опыта в игровой час
          this.addBunkerExperience(experienceProduction)
          console.log(`[processHourlyResourceProduction] 🔬 Ученый ${resident.name} производит ${experienceProduction} ед. опыта`)
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

    // Проверяем, есть ли производство ресурсов
    const hasEngineerProduction = Object.keys(engineerProduction).length > 0
    
    if (foodProduction > 0 || waterProduction > 0 || hasEngineerProduction) {
      console.log(`[processHourlyResourceProduction] 📊 Почасовое производство: еда +${foodProduction} (${hourlyFoodFromRooms} от комнат), вода +${waterProduction} (${hourlyWaterFromRooms} от комнат)`)
      
      // Добавляем ресурсы
      this.food = Math.max(0, Math.round(this.food + foodProduction))
      this.water = Math.max(0, Math.round(this.water + waterProduction))
      
      // Добавляем ресурсы инженера
      Object.entries(engineerProduction).forEach(([resource, amount]) => {
        console.log(`[processHourlyResourceProduction] 🔨 Добавляем ${amount} ед. ${resource}`)
        switch (resource) {
          case 'wood':
            this.wood = Math.max(0, Math.round(this.wood + amount))
            break
          case 'metal':
            this.metal = Math.max(0, Math.round(this.metal + amount))
            break
          case 'coal':
            this.coal = Math.max(0, Math.round(this.coal + amount))
            break
          case 'nails':
            this.nails = Math.max(0, Math.round(this.nails + amount))
            break
          case 'paper':
            this.paper = Math.max(0, Math.round(this.paper + amount))
            break
          case 'glass':
            this.glass = Math.max(0, Math.round(this.glass + amount))
            break
        }
      })
      
      // Показываем индикаторы изменений от производства ПОСЛЕ обновления ресурсов
      console.log(`[processHourlyResourceProduction] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
      
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        if (foodProduction > 0) {
          // Показываем положительные изменения (производство)
          console.log(`[processHourlyResourceProduction] 🎯 Показываем индикатор для еды: +${foodProduction}`);
          (window as any).forceCheckResourceChange('food', foodProduction, false);
        }
        if (waterProduction > 0) {
          // Показываем положительные изменения (производство)
          console.log(`[processHourlyResourceProduction] 🎯 Показываем индикатор для воды: +${waterProduction}`);
          (window as any).forceCheckResourceChange('water', waterProduction, false);
        }
        
        // Показываем индикаторы для ресурсов инженера
        Object.entries(engineerProduction).forEach(([resource, amount]) => {
          console.log(`[processHourlyResourceProduction] 🎯 Показываем индикатор для ${resource}: +${amount}`);
          (window as any).forceCheckResourceChange(resource, amount, false);
        })
      } else {
        console.warn(`[processHourlyResourceProduction] ❌ forceCheckResourceChange недоступен`);
      }
      
      console.log(`[processHourlyResourceProduction] ✅ Ресурсы обновлены: еда=${this.food}, вода=${this.water}, дерево=${this.wood}, металл=${this.metal}, уголь=${this.coal}, гвозди=${this.nails}, бумага=${this.paper}, стекло=${this.glass}`)
    } else {
      console.log(`[processHourlyResourceProduction] ℹ️ Нет производства ресурсов в этот час`)
    }
  }

  /**
   * Обрабатывает почасовое потребление ресурсов и наносит урон при нехватке
   */
  private processHourlyResourceConsumption(): void {
    // Сначала обрабатываем производство ресурсов
    this.processHourlyResourceProduction()
    
    const { foodConsumption, waterConsumption } = this.calculateHourlyResourceConsumption()
    

    
    // Проверяем, есть ли жители для потребления ресурсов
    if (this.bunkerResidents.length === 0) {

      return
    }
    
    // Расходуем ресурсы
    const oldFood = this.food
    const oldWater = this.water
    
    // Рассчитываем потребление с учетом доступных ресурсов
    const actualFoodConsumption = Math.min(foodConsumption, this.food)
    const actualWaterConsumption = Math.min(waterConsumption, this.water)
    
    // Обновляем ресурсы (не уходим в отрицательные значения) и округляем до целых чисел
    this.food = Math.max(0, Math.round(this.food - foodConsumption))
    this.water = Math.max(0, Math.round(this.water - waterConsumption))
    
    // Показываем индикаторы изменений от потребления ПОСЛЕ обновления ресурсов
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      // Показываем отрицательные изменения (потребление)
      (window as any).forceCheckResourceChange('food', -foodConsumption, true);
      (window as any).forceCheckResourceChange('water', -waterConsumption, true);
    }
    
    // Проверяем нехватку ресурсов и наносим урон
    const foodShortage = foodConsumption - actualFoodConsumption
    const waterShortage = waterConsumption - actualWaterConsumption
    
    if (foodShortage > 0) {
      console.log(`[processHourlyResourceConsumption] ⚠️ Обнаружена нехватка еды: ${foodShortage} ед.! Обрабатываем урон от голода...`)
      this.handleResourceShortage(oldFood, -foodShortage, 'food', 'голод')
    } else {
      console.log(`[processHourlyResourceConsumption] ✅ Еды достаточно: ${this.food}`)
    }
    
    if (waterShortage > 0) {
      console.log(`[processHourlyResourceConsumption] ⚠️ Обнаружена нехватка воды: ${waterShortage} ед.! Обрабатываем урон от жажды...`)
      this.handleResourceShortage(oldWater, -waterShortage, 'water', 'жажда')
    } else {
      console.log(`[processHourlyResourceConsumption] ✅ Воды достаточно: ${this.water}`)
    }
    
    // Обновляем UI
    this.updateAllResources()
    
    // Логируем финальное состояние ресурсов
  }

  /**
   * Обрабатывает нехватку ресурса и наносит урон жителям
   */
  private handleResourceShortage(oldAmount: number, newAmount: number, resourceType: 'food' | 'water', damageReason: string): void {

    
    if (newAmount >= 0) {

      return // Ресурса достаточно
    }
    
    const shortage = Math.abs(newAmount) // Количество недостающих единиц
    const residentCount = this.bunkerResidents.length
    
    if (residentCount === 0) {
      return
    }
    
    // Рассчитываем урон в зависимости от сложности
    let damagePercent: number
    switch (this.difficulty) {
      case 'easy':
        damagePercent = 10
        break
      case 'normal':
        damagePercent = 25
        break
      case 'hard':
        damagePercent = 50
        break
      default:
        damagePercent = 25
    }
    
    // Наносим урон случайным жителям (по 1 жителю на каждую единицу разницы)
    const residentsToDamage = Math.min(shortage, residentCount)
    const shuffledResidents = [...this.bunkerResidents].sort(() => Math.random() - 0.5)
    
    console.log(`[handleResourceShortage] Будет нанесен урон ${residentsToDamage} жителям от ${damageReason} (${damagePercent}% урона)`)
    console.log(`[handleResourceShortage] Доступные жители: ${this.bunkerResidents.map(r => `${r.name}(здоровье:${r.health ?? 100}%)`).join(', ')}`)
    
    for (let i = 0; i < residentsToDamage; i++) {
      const resident = shuffledResidents[i]
      if (!resident) {
        console.log(`[handleResourceShortage] Пропускаем жителя ${i}: не найден`)
        continue
      }
      
      // Получаем текущее здоровье жителя (по умолчанию 100 если не установлено)
      const currentHealth = resident.health ?? 100
      
      // Проверяем, что житель жив и не находится в критическом состоянии
      if (currentHealth <= 0) {
        console.log(`[handleResourceShortage] Пропускаем ${resident.name}: уже мертв (здоровье: ${currentHealth}%)`)
        continue
      }
      
      // Жители с критически низким здоровьем (≤1%) имеют высокий шанс смерти
      if (currentHealth <= 1) {
        const criticalDeathChance = 0.8 // 80% шанс смерти для жителей с 1% здоровья
        const willDieFromCritical = Math.random() < criticalDeathChance
        
        if (willDieFromCritical) {
          console.log(`[handleResourceShortage] 💀 ${resident.name} умирает от ${damageReason} из-за критически низкого здоровья (${currentHealth}%)!`)
          this.showToast(`💀 ${resident.name} умирает от ${damageReason} из-за крайней слабости!`)
          this.removeDeadResident(resident.id, damageReason)
          continue // Переходим к следующему жителю
        } else {
          console.log(`[handleResourceShortage] 🍀 ${resident.name} с критически низким здоровьем (${currentHealth}%) чудом выживает от ${damageReason}!`)
          this.showToast(`🍀 ${resident.name} чудом выживает от ${damageReason}!`)
        }
      }
      
      const damage = Math.floor(currentHealth * (damagePercent / 100))
      const newHealth = Math.max(0, currentHealth - damage)
      
      console.log(`[handleResourceShortage] ${resident.name} (ID: ${resident.id}) получает урон от ${damageReason}: ${currentHealth}% → ${newHealth}% (-${damage}%)`)
      
      // Проверяем, может ли житель умереть от недостатка здоровья
      if (damage > currentHealth) {
        const deathChance = 0.5 // 50% шанс смерти
        const willDie = Math.random() < deathChance
        
        if (willDie) {
          console.log(`[handleResourceShortage] 💀 ${resident.name} умирает от ${damageReason} (недостаточно здоровья + случайность)!`)
          this.showToast(`💀 ${resident.name} умирает от ${damageReason}!`)
          this.removeDeadResident(resident.id, damageReason)
          continue // Переходим к следующему жителю
        } else {
          console.log(`[handleResourceShortage] 🍀 ${resident.name} выживает от ${damageReason} благодаря удаче!`)
          this.showToast(`🍀 ${resident.name} чудом выживает от ${damageReason}!`)
          // Устанавливаем здоровье в 1% вместо 0
          this.updateResidentHealth(resident.id, 1)
          
          // Отнимаем 10% счастья за выживание
          this.applyHappinessPenalty(resident.id, damageReason)
        }
      } else {
        // Используем правильный метод для обновления здоровья
        this.updateResidentHealth(resident.id, newHealth)
        
        // Показываем уведомление
        this.showToast(`💀 ${resident.name} страдает от ${damageReason}!`)
        
        // Отнимаем 10% счастья за получение урона
        this.applyHappinessPenalty(resident.id, damageReason)
        
        // Проверяем смерть жителя
        if (newHealth <= 0) {
          console.log(`[handleResourceShortage] 💀 Житель ${resident.name} умирает от ${damageReason}!`)
          this.removeDeadResident(resident.id, damageReason)
        }
      }
      
      // Дополнительная проверка: жители с очень низким здоровьем (≤10%) имеют шанс умереть от голода/жажды
      if (currentHealth <= 10 && currentHealth > 0) {
        const lowHealthDeathChance = 0.3 // 30% шанс смерти для жителей с низким здоровьем
        const willDieFromLowHealth = Math.random() < lowHealthDeathChance
        
        if (willDieFromLowHealth) {
          console.log(`[handleResourceShortage] 💀 ${resident.name} умирает от ${damageReason} из-за критически низкого здоровья (${currentHealth}%)!`)
          this.showToast(`💀 ${resident.name} умирает от ${damageReason} из-за слабости!`)
          this.removeDeadResident(resident.id, damageReason)
          continue // Переходим к следующему жителю
        }
      }
    }
  }

  /**
   * Check if resident should go insane based on moral level
   */
  private shouldResidentGoInsane(): boolean {
    const moral = this.getCurrentMoral();
    let insanityChance = 0;

    if (moral <= 0) {
      return true; // 100% шанс при морали 0%
    } else if (moral < 25) {
      insanityChance = 0.15; // 15% шанс при морали < 25%
    } else if (moral <= 35) {
      insanityChance = 0.05; // 5% шанс при морали 25-35%
    } else {
      // мораль > 35, шанс безумия = 0
    }

    return Math.random() < insanityChance;
  }

  /**
   * Make resident insane
   */
  private makeResidentInsane(residentId: number): void {
    const resident = this.bunkerResidents.find(r => r.id === residentId);
    if (!resident) {
      console.log(`[GameScene] makeResidentInsane: житель с ID ${residentId} не найден!`)
      return;
    }

    if (!resident.insane) {
      console.log(`[GameScene] makeResidentInsane: делаем жителя ${resident.name} (${resident.profession}) безумным`)

      resident.insane = true;
      resident.insaneSince = this.time.now;
      resident.status = 'безумен';
      resident.intent = 'hostile'; // Безумный житель ведет себя как враг

      console.log(`[GameScene] Resident ${resident.name} (${resident.profession}) went insane!`);
      console.log(`[GameScene] Установлены параметры: insane=${resident.insane}, intent=${resident.intent}`);

      // Показать уведомление
      this.showToast(`🚨 ${resident.name} сошел с ума и стал враждебным!`);

      // Обновляем bunkerView - житель остается в списке, но теперь агрессивный
      console.log(`[GameScene] Вызываем syncResidents для обновления bunkerView`)
      this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length);

      // При морали 0% - начать бой между жителями
      const currentMoral = this.getCurrentMoral();
      if (currentMoral <= 0) {
        console.log(`[GameScene] Мораль <= 0 (${currentMoral}), запускаем бой между жителями`)
        this.startResidentFight();
      } else {
        console.log(`[GameScene] Мораль > 0 (${currentMoral}), бой не запускается`)
      }
    } else {
      console.log(`[GameScene] makeResidentInsane: житель ${resident.name} уже безумный`)
    }
  }

  /**
   * Start fight between insane residents
   */
  private startResidentFight(): void {
    console.log('[GameScene] Starting resident fight due to 0% moral!');
    this.showToast('🚨 БУНТ В БУНКЕРЕ! Безумные жители дерутся!');

    // Найти всех безумных жителей (с hostile intent)
    const insaneResidents = this.bunkerResidents.filter(r => r.insane && r.intent === 'hostile');

    if (insaneResidents.length >= 2) {
      // Начать бой между двумя случайными безумными жителями
      this.processResidentFight(insaneResidents);
    }
  }

  /**
   * Process fight between insane residents
   */
  private processResidentFight(insaneResidents: any[]): void {
    if (insaneResidents.length < 2) {
      console.log('[GameScene] Not enough insane residents to fight');
      return;
    }

    console.log(`[GameScene] Starting fight between ${insaneResidents.length} insane residents`);

    // Безумные жители уже помечены как агрессивные и будут автоматически
    // искать цели среди других жителей через систему боя bunkerView

    // Просто проверяем условия окончания боя через некоторое время
    this.time.delayedCall(5000, () => {
      this.checkResidentFightEnd();
    });
  }

  /**
   * Check if resident fight should end
   */
  private checkResidentFightEnd(): void {
    const moral = this.getCurrentMoral();
    const remainingInsane = this.bunkerResidents.filter(r => r.insane && r.intent === 'hostile');

    // Бой заканчивается если:
    // - Остался только один безумный житель
    // - Мораль повысилась выше 25%
    // - Мораль стала выше 0% (но ниже 25%)
    if (remainingInsane.length <= 1 || moral > 25) {
      console.log('[GameScene] Resident fight ended');
      this.showToast('🎯 Драка прекратилась!');
      return;
    }

    // Если мораль все еще 0% и есть безумные жители - продолжаем бой
    if (moral <= 0 && remainingInsane.length >= 2) {
      this.time.delayedCall(5000, () => {
        this.checkResidentFightEnd();
      });
    }
  }

  /**
   * Calculate resident power for fights
   */
  private calculateResidentPower(resident: any): number {
    let power = resident.health || 100;

    // Бонусы от навыков
    if (this.hasSkill(resident.skills, 'герой')) power += 20;
    if (this.hasSkill(resident.skills, 'лидер')) power += 15;
    if (this.hasSkill(resident.skills, 'солдат')) power += 10;

    // Штрафы от навыков
    if (this.hasSkill(resident.skills, 'трус')) power -= 15;
    if (this.hasSkill(resident.skills, 'группа инвалидности')) power -= 20;
    if (this.hasSkill(resident.skills, 'неизлечимая болезнь')) power -= 25;

    return Math.max(1, power);
  }

  /**
   * Check residents for insanity based on moral
   */
  private checkResidentsForInsanity(): void {
    const moral = this.getCurrentMoral();


    // Инициализируем intent для существующих жителей
    this.bunkerResidents.forEach(resident => {
      if (!resident.intent) {
        resident.intent = resident.insane ? 'hostile' : 'peaceful';
      }
    });

    // При морали 0% - все жители сходят с ума
    if (moral <= 0) {
      this.bunkerResidents.forEach(resident => {
        if (!resident.insane) {
          this.makeResidentInsane(resident.id);
        }
      });
      return;
    }

    // Для каждого жителя проверить шанс сойти с ума
    this.bunkerResidents.forEach(resident => {
      if (!resident.insane && this.shouldResidentGoInsane()) {
        this.makeResidentInsane(resident.id);
      }
    });

    // Также проверим, нужно ли остановить бой при повышении морали
    if (moral > 25) {
      const insaneResidents = this.bunkerResidents.filter(r => r.insane && r.intent === 'hostile');
      if (insaneResidents.length > 0) {
        // Moral improved, stopping insane fights
      }
    }
    

  }

  /**
   * Restore sanity when moral improves
   */
  private restoreSanity(): void {
    const moral = this.getCurrentMoral();


    if (moral > 35) {
      // Находим всех безумных жителей
      const insaneResidents = this.bunkerResidents.filter(r => r.insane);

      insaneResidents.forEach(insaneResident => {
        insaneResident.insane = false;
        insaneResident.insaneSince = undefined;
        insaneResident.intent = 'peaceful'; // Возвращаем мирное поведение
        insaneResident.status = 'отдыхает';

        console.log(`[GameScene] Resident ${insaneResident.name} regained sanity!`);
        this.showToast(`🧠 ${insaneResident.name} пришел в себя!`);
      });

      // Обновляем bunkerView если были изменения
      if (insaneResidents.length > 0) {
        this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length);
      }
    }
    
          console.log(`[restoreSanity] Проверка завершена`)
    }

  /**
   * Calculate moral change based on resident decision
   */
  private calculateMoralChange(personData: { allSkills: Array<{ text: string; positive: boolean }> }, accepted: boolean): number {
    let moralChange = 0;

    // Base moral change
    if (accepted) {
      moralChange += 1; // +1% for accepting
    } else {
      moralChange -= 1; // -1% for rejecting
    }

    // Special skill modifiers
    if (this.hasSkill(personData.allSkills, 'лидер') && accepted) {
      moralChange += 10; // +10% for accepting leader
    }

    if (this.hasSkill(personData.allSkills, 'герой') && accepted) {
      moralChange += 10; // +10% for accepting hero
    }

    if (this.hasSkill(personData.allSkills, 'слепой')) {
      if (accepted) {
        moralChange += 5; // +5% for accepting blind person
      } else {
        moralChange -= 10; // -10% for rejecting blind person
      }
    }

    if (this.hasSkill(personData.allSkills, 'группа инвалидности')) {
      if (accepted) {
        moralChange += 5; // +5% for accepting disabled person
      } else {
        moralChange -= 10; // -10% for rejecting disabled person
      }
    }

    if (this.hasSkill(personData.allSkills, 'неизлечимая болезнь')) {
      if (accepted) {
        moralChange += 5; // +5% for accepting sick person
      } else {
        moralChange -= 10; // -10% for rejecting sick person
      }
    }

    return moralChange;
  }

  /**
   * Apply moral change
   */
  private applyMoralChange(delta: number, reason: string): void {
    const oldMoral = this.moral;
    const maxMorale = this.configManager.getMaxMorale();
    
    // Применяем изменение морали с учетом ограничений
    this.moral = Math.max(0, Math.min(maxMorale, Math.round(this.moral + delta)));
    
    console.log(`[GameScene] Moral change: ${delta > 0 ? '+' : ''}${delta}% (${reason}) → ${oldMoral}% → ${this.moral}%`);
    
    // Обновляем UI если мораль изменилась
    if (this.moral !== oldMoral) {
      // Показываем индикатор изменения морали
      console.log(`[applyMoralChange] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
      
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        const moraleChange = this.moral - oldMoral;
        console.log(`[applyMoralChange] 🎯 Показываем индикатор для морали: ${moraleChange > 0 ? '+' : ''}${moraleChange}%`);
        (window as any).forceCheckResourceChange('moral', moraleChange, false, true);
      } else {
        console.warn(`[applyMoralChange] ❌ forceCheckResourceChange недоступен`);
      }
      
      this.updateAllResources();
    }
  }

  private computeSoldierShotsPerHour(skills: Array<{ text: string; positive: boolean }> | undefined): number {
    // База 1 выстрел/час
    let shots = 1
    console.log(`[computeSoldierShotsPerHour] 🎯 Базовая стрельба: ${shots} выстрелов`)
    
    if (!Array.isArray(skills)) {
      console.log(`[computeSoldierShotsPerHour] ❌ Навыки не найдены, возвращаем базовое значение: ${shots}`)
      return shots
    }
    
    console.log(`[computeSoldierShotsPerHour] 🎯 Навыки солдата: ${skills.map(s => s.text).join(', ')}`)
    
    // трудолюбивый: +1
    if (this.hasSkill(skills, 'трудолюбивый')) {
      shots += 1
      console.log(`[computeSoldierShotsPerHour] ✅ Трудолюбивый: +1 выстрел, итого: ${shots}`)
    }
    // гений: +2
    if (this.hasSkill(skills, 'гений')) {
      shots += 2
      console.log(`[computeSoldierShotsPerHour] ✅ Гений: +2 выстрела, итого: ${shots}`)
    }
    // выгоревший: 30% не работает в этот час
    if (this.hasSkill(skills, 'выгоревший')) {
      const random = Math.random()
      console.log(`[computeSoldierShotsPerHour] 🔥 Выгоревший: случайное число ${random.toFixed(3)} (порог 0.3)`)
      if (random < 0.3) {
        console.log(`[computeSoldierShotsPerHour] ❌ Выгоревший не работает в этот час`)
        return 0
      }
    }
    // группа инвалидности: -33%
    if (this.hasSkill(skills, 'группа инвалидности')) {
      const oldShots = shots
      shots = Math.max(0, Math.floor(shots * (2 / 3)))
      console.log(`[computeSoldierShotsPerHour] ♿ Группа инвалидности: ${oldShots} → ${shots} выстрелов`)
    }
    // лентяй: 60% отдыхает
    if (this.hasSkill(skills, 'лентяй')) {
      const random = Math.random()
      console.log(`[computeSoldierShotsPerHour] 😴 Лентяй: случайное число ${random.toFixed(3)} (порог 0.6)`)
      if (random < 0.6) {
        console.log(`[computeSoldierShotsPerHour] ❌ Лентяй отдыхает в этот час`)
        return 0
      }
    }
    
    const finalShots = Math.max(0, shots)
    console.log(`[computeSoldierShotsPerHour] ✅ Финальное количество выстрелов: ${finalShots}`)
    return finalShots
  }
  private getBunkerCapacity(): number {
    // 1 "Спальня" = 4 места. Считаем из текущего bunkerView
    const bv: any = this.simpleBunker
    if (!bv || !(bv as any).roomNames) return 0
    const rooms: string[] = (bv as any).roomNames || []
    const restCount = rooms.filter(n => n === 'Спальня').length
    return restCount * 4
  }

  private playPistolOnce(): void {
    console.log(`[playPistolOnce] 🎯 Начинаем анимацию пистолета`)
    if (!this.gunSprite) {
      console.log(`[playPistolOnce] ❌ gunSprite не найден`)
      return
    }
    console.log(`[playPistolOnce] ✅ gunSprite найден, запускаем анимацию`)
    this.gunAnimTimer?.remove(false)
    const seq: Array<{ key: string; d: number }> = [
      { key: 'pistol_f00', d: 300 },
      { key: 'pistol_f01', d: 20 },
      { key: 'pistol_f02', d: 20 },
      { key: 'pistol_f03', d: 20 },
      { key: 'pistol_f04', d: 30 },
      { key: 'pistol_f05', d: 30 },
      { key: 'pistol_f06', d: 50 },
      { key: 'pistol_f07', d: 50 },
      { key: 'pistol_f08', d: 50 },
      { key: 'pistol_f09', d: 100 },
      { key: 'pistol_f10', d: 100 },
      { key: 'pistol_f11', d: 50 }
    ]
    let i = 0
    const step = () => {
      if (!this.gunSprite) return
      const f = seq[i]
      this.gunSprite.setTexture(f.key)
      i += 1
      if (i >= seq.length) {
        // Вернуть на начальную текстуру текущего оружия
        this.gunSprite.setTexture(this.getWeaponInitialTexture())
        return
      }
      this.gunAnimTimer = this.time.delayedCall(seq[i].d, step)
    }
    step()
  }

  private playShotgunOnce(): void {
    if (!this.gunSprite) return
    this.gunAnimTimer?.remove(false)
    const seq: Array<{ key: string; d: number }> = [
      { key: 'shotgun_f00', d: 400 },
      { key: 'shotgun_f01', d: 20 },
      { key: 'shotgun_f02', d: 20 },
      { key: 'shotgun_f03', d: 40 },
      { key: 'shotgun_f04', d: 50 },
      { key: 'shotgun_f05', d: 60 },
      { key: 'shotgun_f06', d: 50 },
      { key: 'shotgun_f07', d: 40 },
      { key: 'shotgun_f08', d: 50 },
      { key: 'shotgun_f09', d: 50 },
      { key: 'shotgun_f10', d: 50 },
      { key: 'shotgun_f11', d: 50 },
      { key: 'shotgun_f12', d: 50 },
      { key: 'shotgun_f13', d: 50 }
    ]
    let i = 0
    const step = () => {
      if (!this.gunSprite) return
      const f = seq[i]
      this.gunSprite.setTexture(f.key)
      i += 1
      if (i >= seq.length) {
        // Вернуть на начальную текстуру текущего оружия
        this.gunSprite.setTexture(this.getWeaponInitialTexture())
        return
      }
      this.gunAnimTimer = this.time.delayedCall(seq[i].d, step)
    }
    step()
  }

  private playAssaultRifleOnce(): void {
    if (!this.gunSprite) return
    this.gunAnimTimer?.remove(false)
    const seq: Array<{ key: string; d: number }> = [
      { key: 'assault_rifle_f00', d: 400 },
      { key: 'assault_rifle_f01', d: 20 },
      { key: 'assault_rifle_f02', d: 20 },
      { key: 'assault_rifle_f03', d: 20 },
      { key: 'assault_rifle_f04', d: 20 },
      { key: 'assault_rifle_f05', d: 20 },
      { key: 'assault_rifle_f06', d: 20 },
      { key: 'assault_rifle_f07', d: 20 },
      { key: 'assault_rifle_f08', d: 20 },
      { key: 'assault_rifle_f09', d: 40 },
      { key: 'assault_rifle_f10', d: 40 },
      { key: 'assault_rifle_f11', d: 40 },
      { key: 'assault_rifle_f12', d: 50 },
      { key: 'assault_rifle_f13', d: 70 },
      { key: 'assault_rifle_f14', d: 70 },
      { key: 'assault_rifle_f15', d: 50 }
    ]
    let i = 0
    const step = () => {
      if (!this.gunSprite) return
      const f = seq[i]
      this.gunSprite.setTexture(f.key)
      i += 1
      if (i >= seq.length) {
        // Вернуть на начальную текстуру текущего оружия
        this.gunSprite.setTexture(this.getWeaponInitialTexture())
        return
      }
      this.gunAnimTimer = this.time.delayedCall(seq[i].d, step)
    }
    step()
  }

  private playSniperRifleOnce(): void {
    if (!this.gunSprite) return
    this.gunAnimTimer?.remove(false)
    const seq: Array<{ key: string; d: number }> = [
      { key: 'sniper_rifle_f00', d: 400 },
      { key: 'sniper_rifle_f01', d: 20 },
      { key: 'sniper_rifle_f02', d: 20 },
      { key: 'sniper_rifle_f03', d: 20 },
      { key: 'sniper_rifle_f04', d: 20 },
      { key: 'sniper_rifle_f05', d: 30 },
      { key: 'sniper_rifle_f06', d: 30 },
      { key: 'sniper_rifle_f07', d: 30 },
      { key: 'sniper_rifle_f08', d: 30 },
      { key: 'sniper_rifle_f09', d: 40 },
      { key: 'sniper_rifle_f10', d: 40 },
      { key: 'sniper_rifle_f11', d: 80 },
      { key: 'sniper_rifle_f12', d: 80 },
      { key: 'sniper_rifle_f13', d: 80 },
      { key: 'sniper_rifle_f14', d: 80 },
      { key: 'sniper_rifle_f15', d: 80 },
      { key: 'sniper_rifle_f16', d: 80 },
      { key: 'sniper_rifle_f17', d: 40 },
      { key: 'sniper_rifle_f18', d: 40 },
      { key: 'sniper_rifle_f19', d: 40 },
      { key: 'sniper_rifle_f20', d: 40 },
      { key: 'sniper_rifle_f21', d: 40 },
      { key: 'sniper_rifle_f22', d: 40 },
      { key: 'sniper_rifle_f23', d: 40 },
      { key: 'sniper_rifle_f24', d: 40 },
      { key: 'sniper_rifle_f25', d: 40 },
      { key: 'sniper_rifle_f26', d: 40 },
      { key: 'sniper_rifle_f27', d: 40 }
    ]
    let i = 0
    const step = () => {
      if (!this.gunSprite) return
      const f = seq[i]
      this.gunSprite.setTexture(f.key)
      i += 1
      if (i >= seq.length) {
        // Вернуть на начальную текстуру текущего оружия
        this.gunSprite.setTexture(this.getWeaponInitialTexture())
        return
      }
      this.gunAnimTimer = this.time.delayedCall(seq[i].d, step)
    }
    step()
  }

  private getWeaponInitialTexture(): string {
    switch (this.currentWeapon) {
      case 'pistol': return 'pistol_f00'
      case 'shotgun': return 'shotgun_f00'
      case 'ar': return 'assault_rifle_f00'
      case 'sniper': return 'sniper_rifle_f00'
      case 'melee': return 'pistol_f00' // По умолчанию для melee
      default: return 'pistol_f00'
    }
  }

  private getWeaponDisplaySize(): { width: number; height: number } {
    switch (this.currentWeapon) {
      case 'pistol':
        // 64x32 -> сохраняем пропорции (64:32 = 2:1)
        // Масштабируем по высоте до 64, ширина = 64 * 2 = 128
        return { width: 128, height: 64 }
      case 'shotgun':
        // 160x32 -> сохраняем пропорции (160:32 = 5:1)
        // Масштабируем по высоте до 64, ширина = 64 * 5 = 320
        return { width: 320, height: 64 }
      case 'ar':
        // 128x48 -> сохраняем пропорции (128:48 ≈ 2.67:1)
        // Масштабируем по высоте до 72, ширина = 72 * 2.67 ≈ 192
        return { width: 192, height: 72 }
      case 'sniper':
        // 128x32 -> сохраняем пропорции (128:32 = 4:1)
        // Масштабируем по высоте до 64, ширина = 64 * 4 = 256
        return { width: 256, height: 64 }
      case 'melee':
        return { width: 320, height: 64 }
      default:
        return { width: 320, height: 64 }
    }
  }

  public setCurrentWeapon(weapon: 'melee' | 'pistol' | 'shotgun' | 'ar' | 'sniper'): void {
    // Останавливаем все связанные с AR взаимодействия при смене оружия
    if (weapon !== 'ar') {
      if (this.isAutoFiring) {
        this.stopAutoFire()
      }
      if (this.clickTimer) {
        this.clickTimer.remove(false)
        this.clickTimer = undefined
      }
      this.isClickMode = false
    }

    this.currentWeapon = weapon
    console.log(`[GameScene] Weapon changed to: ${weapon}`)

    // Обновляем текстуру и размер оружия, если оно уже создано
    if (this.gunSprite) {
      const newTexture = this.getWeaponInitialTexture()
      const newSize = this.getWeaponDisplaySize()

      this.gunSprite.setTexture(newTexture)
      this.gunSprite.setDisplaySize(newSize.width, newSize.height)

      console.log(`[GameScene] Updated weapon sprite: texture=${newTexture}, size=${newSize.width}x${newSize.height}`)
    }
  }

  public getCurrentWeapon(): 'melee' | 'pistol' | 'shotgun' | 'ar' | 'sniper' {
    return this.currentWeapon
  }

  private startAutoFire(): void {
    if (this.isAutoFiring) return

    this.isAutoFiring = true
    console.log('[GameScene] Started auto-fire for assault rifle')

    // Запускаем автоматический огонь - 3 выстрела в секунду
    this.autoFireTimer = this.time.addEvent({
      delay: 333, // 1000ms / 3 выстрела = 333ms между выстрелами
      callback: () => {
        if (this.isAutoFiring && this.currentWeapon === 'ar') {
          this.fireWeaponOnce()
        }
      },
      loop: true
    })
  }

  private stopAutoFire(): void {
    if (!this.isAutoFiring) return

    this.isAutoFiring = false
    console.log('[GameScene] Stopped auto-fire for assault rifle')

    if (this.autoFireTimer) {
      this.autoFireTimer.remove(false)
      this.autoFireTimer = undefined
    }
  }

  private ensureMarauderAnimations(): void {
    const A = this.anims
    const mkLoop = (key: string, sheet: string, frames: number, rate: number) => { 
      if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end: frames - 1 }), frameRate: rate, repeat: -1 }) 
    }
    const mkOnce = (key: string, sheet: string, frames: number, rate: number) => { 
      if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end: frames - 1 }), frameRate: rate, repeat: 0 }) 
    }
    
    // Мародер 1
    mkOnce('r1_attack', 'raider1_attack', 12, 10)  // Shot.png - 12 кадров
    mkLoop('r1_walk', 'raider1_walk', 8, 10)       // Walk.png - 8 кадров
    mkLoop('r1_idle', 'raider1_idle', 6, 6)        // Idle.png - 6 кадров
    mkOnce('r1_hurt', 'raider1_hurt', 2, 10)       // Hurt.png - 2 кадра
    mkOnce('r1_dead', 'raider1_dead', 4, 8)        // Dead.png - 4 кадра
    
    // Мародер 2
    mkOnce('r2_attack', 'raider2_attack', 4, 10)   // Shot_1.png - 4 кадра
    mkLoop('r2_walk', 'raider2_walk', 7, 10)       // Walk.png - 7 кадров
    mkLoop('r2_idle', 'raider2_idle', 8, 6)        // Idle.png - 8 кадров
    mkOnce('r2_hurt', 'raider2_hurt', 3, 10)       // Hurt.png - 3 кадра
    mkOnce('r2_dead', 'raider2_dead', 5, 8)        // Dead.png - 5 кадров
    
    // Мародер 3
    mkOnce('r3_attack', 'raider3_attack', 5, 10)   // Attack_1.png - 5 кадров
    mkLoop('r3_walk', 'raider3_walk', 7, 10)       // Walk.png - 7 кадров
    mkLoop('r3_idle', 'raider3_idle', 5, 6)        // Idle_2.png - 5 кадров
    mkOnce('r3_hurt', 'raider3_hurt', 2, 10)       // Hurt.png - 2 кадра
    mkOnce('r3_dead', 'raider3_dead', 4, 8)        // Dead.png - 4 кадра
  }

  public ensureZombieAnimations(): void {
    const A = this.anims
    const mk = (key: string, sheet: string, frames: number, frameRate: number) => {
      if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end: frames - 1 }), frameRate, repeat: -1 })
    }
    // Wild
    mk('z_wild_walk', 'zombie_wild_walk', 10, 10)
    mk('z_wild_idle', 'zombie_wild_idle', 9, 6)
    if (!A.exists('z_wild_dead')) A.create({ key: 'z_wild_dead', frames: A.generateFrameNumbers('zombie_wild_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_wild_hurt')) A.create({ key: 'z_wild_hurt', frames: A.generateFrameNumbers('zombie_wild_hurt', { start: 0, end: 4 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_wild_attack')) A.create({ key: 'z_wild_attack', frames: A.generateFrameNumbers('zombie_wild_attack1', { start: 0, end: 3 }), frameRate: 10, repeat: 0 })
    // Man
    mk('z_man_walk', 'zombie_man_walk', 8, 10)
    mk('z_man_idle', 'zombie_man_idle', 8, 6)
    if (!A.exists('z_man_dead')) A.create({ key: 'z_man_dead', frames: A.generateFrameNumbers('zombie_man_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_man_hurt')) A.create({ key: 'z_man_hurt', frames: A.generateFrameNumbers('zombie_man_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_man_attack')) A.create({ key: 'z_man_attack', frames: A.generateFrameNumbers('zombie_man_attack', { start: 0, end: 10 }), frameRate: 10, repeat: 0 })
    // Woman
    mk('z_woman_walk', 'zombie_woman_walk', 7, 10)
    mk('z_woman_idle', 'zombie_woman_idle', 5, 6)
    if (!A.exists('z_woman_dead')) A.create({ key: 'z_woman_dead', frames: A.generateFrameNumbers('zombie_woman_dead', { start: 0, end: 4 }), frameRate: 8, repeat: 0 })
    if (!A.exists('z_woman_hurt')) A.create({ key: 'z_woman_hurt', frames: A.generateFrameNumbers('zombie_woman_hurt', { start: 0, end: 2 }), frameRate: 10, repeat: 0 })
    if (!A.exists('z_woman_attack')) A.create({ key: 'z_woman_attack', frames: A.generateFrameNumbers('zombie_woman_attack1', { start: 0, end: 3 }), frameRate: 10, repeat: 0 })
  }

  public ensureMutantAnimations(): void {
    const A = this.anims
    const mkLoop = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: -1 }) }
    const mkOnce = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: 0 }) }
    // m1
    mkLoop('m1_walk', 'mutant1_walk', 9, 10); mkLoop('m1_idle', 'mutant1_idle', 5, 6)
    mkOnce('m1_dead', 'mutant1_dead', 4, 8); mkOnce('m1_hurt', 'mutant1_hurt', 3, 10); mkOnce('m1_attack', 'mutant1_attack', 4, 10)
    // m2
    mkLoop('m2_walk', 'mutant2_walk', 9, 10); mkLoop('m2_idle', 'mutant2_idle', 5, 6)
    mkOnce('m2_dead', 'mutant2_dead', 4, 8); mkOnce('m2_hurt', 'mutant2_hurt', 3, 10); mkOnce('m2_attack', 'mutant2_attack', 4, 10)
    // m3
    mkLoop('m3_walk', 'mutant3_walk', 9, 10); mkLoop('m3_idle', 'mutant3_idle', 5, 6)
    mkOnce('m3_dead', 'mutant3_dead', 4, 8); mkOnce('m3_hurt', 'mutant3_hurt', 3, 10); mkOnce('m3_attack', 'mutant3_attack', 3, 10)
    // m4
    mkLoop('m4_walk', 'mutant4_walk', 9, 10); mkLoop('m4_idle', 'mutant4_idle', 5, 6)
    mkOnce('m4_dead', 'mutant4_dead', 4, 8); mkOnce('m4_hurt', 'mutant4_hurt', 3, 10); mkOnce('m4_attack', 'mutant4_attack', 4, 10)
  }

  public ensureSoldierAnimations(): void {
    const A = this.anims
    const mkLoop = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: -1 }) }
    const mkOnce = (key: string, sheet: string, end: number, rate: number) => { if (!A.exists(key)) A.create({ key, frames: A.generateFrameNumbers(sheet, { start: 0, end }), frameRate: rate, repeat: 0 }) }
    mkLoop('sold_walk', 'soldier_walk', 6, 10)    // Walk (7 кадров: 0-6)
    mkLoop('sold_idle', 'soldier_idle', 6, 6)     // Idle (7 кадров: 0-6) 
    mkOnce('sold_dead', 'soldier_dead', 3, 8)     // Dead (4 кадра: 0-3)
    mkOnce('sold_hurt', 'soldier_hurt', 2, 10)    // Hurt (3 кадра: 0-2)
    mkOnce('sold_attack', 'soldier_attack', 3, 10) // Shot_1 (4 кадра: 0-3)
  }

  private pickEnemyType(): 'МАРОДЕР' | 'ЗОМБИ' | 'МУТАНТ' | 'СОЛДАТ' {
    const day = Math.max(0, this.dayNumber - 1)
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const diff = this.difficulty
    // Базовые веса по сложности
    let base = { M: 0.5, Z: 0.3, Mu: 0.15, S: 0.05 }
    if (diff === 'easy') base = { M: 0.65, Z: 0.25, Mu: 0.08, S: 0.02 }
    if (diff === 'hard') base = { M: 0.35, Z: 0.35, Mu: 0.2, S: 0.1 }
    // Рост сложности с днём: постепенно уменьшаем мародёров и увеличиваем остальных
    const t = clamp01(day / 12)
    const wM = lerp(base.M, base.M * 0.4, t)
    const wZ = lerp(base.Z, base.Z + 0.1, t)
    const wMu = lerp(base.Mu, base.Mu + 0.1, t)
    const wS = lerp(base.S, base.S + 0.05, t)
    const sum = wM + wZ + wMu + wS
    const r = Math.random() * sum
    if (r < wM) return 'МАРОДЕР'
    if (r < wM + wZ) return 'ЗОМБИ'
    if (r < wM + wZ + wMu) return 'МУТАНТ'
    return 'СОЛДАТ'
  }

  private playEnemyAttackAnimation(enemy: any, sprite?: Phaser.GameObjects.Sprite, shirt?: Phaser.GameObjects.Sprite, pants?: Phaser.GameObjects.Sprite, footwear?: Phaser.GameObjects.Sprite, hair?: Phaser.GameObjects.Sprite): void {
    try {
      if (enemy.type === 'МАРОДЕР') {
        // Мародёр: используем префикс r + номер + _attack
        if (sprite) {
          this.ensureMarauderAnimations()
          const kind = enemy.marauderKind || 1
          try { sprite.anims.play(`r${kind}_attack`, true) } catch {}
          // Возврат к idle через 1 секунду
          this.time.delayedCall(1000, () => {
            if (sprite && sprite.active) {
              try { sprite.anims.play(`r${kind}_idle`, true) } catch {}
            }
          })
        }
      } else if (enemy.type === 'ЗОМБИ') {
        // Зомби: используем префикс z_ + вид + _attack
        if (sprite) {
          const kind = enemy.zombieKind || 'wild'
          try { sprite.anims.play(`z_${kind}_attack`, true) } catch {}
          // Возврат к idle через 1 секунду
          this.time.delayedCall(1000, () => {
            if (sprite && sprite.active) {
              try { sprite.anims.play(`z_${kind}_idle`, true) } catch {}
            }
          })
        }
      } else if (enemy.type === 'МУТАНТ') {
        // Мутант: используем префикс m + номер + _attack
        if (sprite) {
          const kind = enemy.mutantKind || '1'
          try { sprite.anims.play(`m${kind}_attack`, true) } catch {}
          // Возврат к idle через 1 секунду
          this.time.delayedCall(1000, () => {
            if (sprite && sprite.active) {
              try { sprite.anims.play(`m${kind}_idle`, true) } catch {}
            }
          })
        }
      } else if (enemy.type === 'СОЛДАТ') {
        // Солдат: используем sold_attack
        if (sprite) {
          this.ensureSoldierAnimations()
          try { sprite.anims.play('sold_attack', true) } catch {}
          // Возврат к idle через 1 секунду
          this.time.delayedCall(1000, () => {
            if (sprite && sprite.active) {
              try { sprite.anims.play('sold_idle', true) } catch {}
            }
          })
        }
      }
    } catch (err) {
      console.warn('[playEnemyAttackAnimation] Error:', err)
    }
  }

  private fireWeaponOnce(skipAmmoConsumption: boolean = false): void {
    // Требуется враг
    if (this.enemyQueueItems.length === 0) return
    // Тратим патрон (кроме melee), если не пропускаем расход
    if (this.currentWeapon !== 'melee' && !skipAmmoConsumption) {
      if (this.ammo <= 0) { this.showToast('Нет патронов'); return }
      
      const oldAmmo = this.ammo;
      this.ammo = Math.max(0, Math.round(this.ammo - 1));
      
      // Показываем индикатор изменения патронов
      console.log(`[fireWeaponOnce] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
      
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        const ammoChange = this.ammo - oldAmmo;
        console.log(`[fireWeaponOnce] 🎯 Показываем индикатор для патронов: ${ammoChange > 0 ? '+' : ''}${ammoChange} ед`);
        (window as any).forceCheckResourceChange('ammo', ammoChange, false);
      } else {
        console.warn(`[fireWeaponOnce] ❌ forceCheckResourceChange недоступен`);
      }
      
      this.updateAllResources();
    }
    // Анимация выстрела в зависимости от текущего оружия
    console.log(`[fireWeaponOnce] 🎯 Запускаем анимацию оружия: ${this.currentWeapon}`)
    switch (this.currentWeapon) {
      case 'pistol': this.playPistolOnce(); break
      case 'shotgun': this.playShotgunOnce(); break
      case 'ar': this.playAssaultRifleOnce(); break
      case 'sniper': this.playSniperRifleOnce(); break
      case 'melee': console.log(`[fireWeaponOnce] ℹ️ Нет анимации для melee`); break
    }

    // Урон по первому врагу в очереди
    const enemy = this.enemyQueueItems[0] as any
    if (enemy) {
      // Инициализация HP/MaxHP, если нет — используем новую шкалу
      if (enemy.maxHp == null) { enemy.maxHp = (this as any).hpByType ? (this as any).hpByType(enemy.type) : 3; enemy.hp = enemy.maxHp }
      // Урон оружия
      let dmg = 1
      switch (this.currentWeapon) {
        case 'melee': dmg = 1; break
        case 'pistol': dmg = 1; break
        case 'shotgun': dmg = 2; break
        case 'ar': dmg = 1; break
        case 'sniper': dmg = 3; break
      }
      enemy.hp = Math.max(0, (enemy.hp ?? enemy.maxHp) - dmg)
      // Обновим HP-бар (layoutPersonArea вызывает это при следующем layout)
      if (enemy.hp <= 0) {
        // Начисляем опыт за убийство врага
        const experienceReward = this.getEnemyExperienceReward(enemy.type)
        this.awardExperience(`убийство ${enemy.type}`, experienceReward)
        
        // Смерть: сыграть анимацию death/dead, затем увести и только потом показать следующего
        const it = this.enemyQueueItems.shift()!
        it.exiting = true
        // Проиграть death в превью, если сейчас показываем этого врага
        try {
          const samePreviewEnemy = (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === it.id
          if (samePreviewEnemy) {
            if (this.personPreviewSprite && this.personPreviewSprite.visible) {
              if ((it as any).zombieKind) {
                const kind = (it as any).zombieKind
                if (kind === 'wild') this.personPreviewSprite.anims.play('z_wild_dead', true)
                else if (kind === 'man') this.personPreviewSprite.anims.play('z_man_dead', true)
                else this.personPreviewSprite.anims.play('z_woman_dead', true)
              } else if ((it as any).mutantKind) {
                const k = (it as any).mutantKind
                this.personPreviewSprite.anims.play(`m${k}_dead`, true)
              } else if (it.type === 'СОЛДАТ') {
                this.ensureSoldierAnimations(); this.personPreviewSprite.anims.play('sold_dead', true)
              }
            }
            // Мародёр в превью — новая система спрайтов
            if (it.type === 'МАРОДЕР') {
              this.ensureMarauderAnimations()
              const kind = (it as any).marauderKind || 1
              if (this.personPreviewSprite) {
                try { this.personPreviewSprite.anims.play(`r${kind}_dead`, true) } catch {}
              }
            }
          }
        } catch {}
        try {
          if (it.type === 'МАРОДЕР') {
            // Новая система: используем спрайты мародеров r1/r2/r3
            this.ensureMarauderAnimations()
            const kind = (it as any).marauderKind || 1
            if ((it as any).sprite) {
              try { (it as any).sprite.anims.play(`r${kind}_dead`, true) } catch {}
            }
          } else if (it.type === 'ЗОМБИ' && (it as any).sprite) {
            const spr = (it as any).sprite as Phaser.GameObjects.Sprite
            if ((it as any).zombieKind === 'wild') spr.anims.play('z_wild_dead', true)
            else if ((it as any).zombieKind === 'man') spr.anims.play('z_man_dead', true)
            else spr.anims.play('z_woman_dead', true)
          } else if (it.type === 'МУТАНТ' && (it as any).sprite) {
            const k = (it as any).mutantKind; (it as any).sprite.anims.play(`m${k}_dead`, true)
          } else if (it.type === 'СОЛДАТ' && (it as any).sprite) {
            (it as any).sprite.anims.play('sold_dead', true)
          }
        } catch {}
        // Ждем завершения анимации смерти, затем сразу уничтожаем
        ;(this as any)._previewBusy = true
        this.time.delayedCall(500, () => {
          // Сразу уничтожаем объекты без анимации отправки влево
          it.rect.destroy(); it.sprite?.destroy(); it.shirt?.destroy(); it.pants?.destroy(); it.footwear?.destroy(); it.hair?.destroy()
          if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect, true) // smooth=true
          ;(this as any)._previewBusy = false
          
          // Если остались враги, новый первый враг уже достиг позиции (они стояли в очереди)
          if (this.enemyQueueItems.length > 0) {
            const newFirst = this.enemyQueueItems[0]
            if (newFirst) {
              (newFirst as any).arrivedAtPosition = true
            }
          }
          
          this.updatePersonInfoFromQueue()
          if (this.enemyQueueItems.length === 0) { this.enemyHpBg?.setVisible(false); this.enemyHpFg?.setVisible(false) }
        })
      } else {
        // Hurt/Hit: краткая анимация урона
        try {
          const samePreviewEnemy = (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === enemy.id
          if (enemy.type === 'МАРОДЕР') {
            // Новая система: используем спрайты мародеров r1/r2/r3
            this.ensureMarauderAnimations()
            const kind = enemy.marauderKind || 1
            if (enemy.sprite) {
              try { enemy.sprite.anims.play(`r${kind}_hurt`, true) } catch {}
            }
            // В превью
            if (samePreviewEnemy && this.personPreviewSprite) {
              try { this.personPreviewSprite.anims.play(`r${kind}_hurt`, true) } catch {}
            }
            // Возврат к idle через 250мс
            this.time.delayedCall(250, () => {
              if (enemy.sprite) {
                try { enemy.sprite.anims.play(`r${kind}_idle`, true) } catch {}
              }
              if (samePreviewEnemy && this.personPreviewSprite) {
                try { this.personPreviewSprite.anims.play(`r${kind}_idle`, true) } catch {}
              }
            })
          } else if (enemy.type === 'ЗОМБИ' && enemy.sprite) {
            if (enemy.zombieKind === 'wild') enemy.sprite.anims.play('z_wild_hurt', true)
            else if (enemy.zombieKind === 'man') enemy.sprite.anims.play('z_man_hurt', true)
            else enemy.sprite.anims.play('z_woman_hurt', true)
            if (samePreviewEnemy && this.personPreviewSprite) {
              if (enemy.zombieKind === 'wild') this.personPreviewSprite.anims.play('z_wild_hurt', true)
              else if (enemy.zombieKind === 'man') this.personPreviewSprite.anims.play('z_man_hurt', true)
              else this.personPreviewSprite.anims.play('z_woman_hurt', true)
            }
            this.time.delayedCall(250, () => {
              if (enemy.zombieKind === 'wild') enemy.sprite.anims.play('z_wild_idle', true)
              else if (enemy.zombieKind === 'man') enemy.sprite.anims.play('z_man_idle', true)
              else enemy.sprite.anims.play('z_woman_idle', true)
              if (samePreviewEnemy && this.personPreviewSprite) {
                if (enemy.zombieKind === 'wild') this.personPreviewSprite.anims.play('z_wild_idle', true)
                else if (enemy.zombieKind === 'man') this.personPreviewSprite.anims.play('z_man_idle', true)
                else this.personPreviewSprite.anims.play('z_woman_idle', true)
              }
            })
          } else if (enemy.type === 'МУТАНТ' && enemy.sprite) {
            const k = enemy.mutantKind; enemy.sprite.anims.play(`m${k}_hurt`, true); this.time.delayedCall(250, () => { enemy.sprite.anims.play(`m${k}_idle`, true) })
            if (samePreviewEnemy && this.personPreviewSprite) { this.personPreviewSprite.anims.play(`m${enemy.mutantKind}_hurt`, true); this.time.delayedCall(250, () => { this.personPreviewSprite?.anims?.play(`m${enemy.mutantKind}_idle`, true) }) }
          } else if (enemy.type === 'СОЛДАТ' && enemy.sprite) {
            enemy.sprite.anims.play('sold_hurt', true); this.time.delayedCall(250, () => { enemy.sprite.anims.play('sold_idle', true) })
            if (samePreviewEnemy && this.personPreviewSprite) { this.ensureSoldierAnimations(); this.personPreviewSprite.anims.play('sold_hurt', true); this.time.delayedCall(250, () => { this.personPreviewSprite?.anims?.play('sold_idle', true) }) }
          }
        } catch {}
      }
      // Перерисуем панель для обновления полоски HP
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    }
  }

  // Восстановление защиты при отсутствии врагов
  private processDefenseRegeneration(hour: number): void {
    // Проверяем, включена ли регенерация и есть ли враги
    if (!this.configManager.isDefenseRegenerationEnabled() || this.enemyQueueItems.length > 0) {
      return
    }

    // Получаем параметры регенерации из конфигурации
    const regenerationPerHour = this.configManager.getDefenseRegenerationPerHour()
    const maxDefense = this.configManager.getMaxDefense()

    // Восстанавливаем защиту
    if (this.defense < maxDefense) {
      const oldDefense = this.defense
      this.defense = Math.min(maxDefense, Math.round(this.defense + regenerationPerHour))
      const restored = this.defense - oldDefense
      
      if (restored > 0) {
        // Показываем индикатор изменения защиты
        console.log(`[processDefenseRegeneration] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
        
        if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
          console.log(`[processDefenseRegeneration] 🎯 Показываем индикатор для защиты: +${restored}%`);
          (window as any).forceCheckResourceChange('defense', restored, false, true);
        } else {
          console.warn(`[processDefenseRegeneration] ❌ forceCheckResourceChange недоступен`);
        }
        
        console.log(`[processDefenseRegeneration] Час ${hour}: Восстановлена защита: ${oldDefense}% → ${this.defense}% (+${restored}%)`)
        
        // Обновляем UI
        this.updateAllResources()
        this.updateEntranceBackground()
      }
    }
  }

  // Обновление комфорта в зависимости от уровня защиты
  private updateComfortBasedOnDefense(): void {
    // Проверяем, включена ли зависимость комфорта от защиты
    if (!this.configManager.isComfortDefenseDependencyEnabled()) {
      return
    }

    const oldComfort = this.comfort
    const baseComfort = this.configManager.getBaseComfort()
    const thresholds = this.configManager.getComfortDefenseThresholds()

    // Определяем уровень защиты и применяем соответствующий бонус/штраф
    let comfortModifier = 0
    if (this.defense >= thresholds.high.min) {
      comfortModifier = thresholds.high.bonus
      console.log(`[updateComfortBasedOnDefense] Высокая защита (${this.defense}%): бонус к комфорту +${comfortModifier}%`)
    } else if (this.defense >= thresholds.medium.min) {
      comfortModifier = thresholds.medium.bonus
      console.log(`[updateComfortBasedOnDefense] Средняя защита (${this.defense}%): комфорт без изменений`)
    } else if (this.defense >= thresholds.low.min) {
      comfortModifier = thresholds.low.penalty
      console.log(`[updateComfortBasedOnDefense] Низкая защита (${this.defense}%): штраф к комфорту ${comfortModifier}%`)
    } else {
      comfortModifier = thresholds.critical.penalty
      console.log(`[updateComfortBasedOnDefense] Критическая защита (${this.defense}%): критический штраф к комфорту ${comfortModifier}%`)
    }

    // Применяем модификатор к базовому комфорту и округляем
    this.comfort = Math.max(0, Math.min(100, Math.round(baseComfort + comfortModifier)))
    
    if (this.comfort !== oldComfort) {
      // Показываем индикатор изменения комфорта
      console.log(`[updateComfortBasedOnDefense] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
      
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        const comfortChange = this.comfort - oldComfort;
        console.log(`[updateComfortBasedOnDefense] 🎯 Показываем индикатор для комфорта: ${comfortChange > 0 ? '+' : ''}${comfortChange}%`);
        (window as any).forceCheckResourceChange('comfort', comfortChange, false, true);
      } else {
        console.warn(`[updateComfortBasedOnDefense] ❌ forceCheckResourceChange недоступен`);
      }
      
      console.log(`[updateComfortBasedOnDefense] Комфорт обновлен: ${oldComfort}% → ${this.comfort}% (модификатор: ${comfortModifier}%)`)
      this.updateAllResources()
    }
  }

  // Обновление счастья в зависимости от уровня комфорта
  private updateHappinessBasedOnComfort(): void {
    // Проверяем, включена ли зависимость счастья от комфорта
    if (!this.configManager.isHappinessComfortDependencyEnabled()) {
      return
    }

    const oldHappiness = this.happiness
    const thresholds = this.configManager.getHappinessComfortThresholds()

    // Определяем уровень комфорта и применяем соответствующий бонус/штраф
    let happinessModifier = 0
    if (this.comfort >= thresholds.high.min) {
      happinessModifier = thresholds.high.bonus
      console.log(`[updateHappinessBasedOnComfort] Высокий комфорт (${this.comfort}%): бонус к счастью +${happinessModifier}%`)
    } else if (this.comfort >= thresholds.medium.min) {
      happinessModifier = thresholds.medium.bonus
      console.log(`[updateHappinessBasedOnComfort] Средний комфорт (${this.comfort}%): счастье без изменений`)
    } else if (this.comfort >= thresholds.low.min) {
      happinessModifier = thresholds.low.penalty
      console.log(`[updateHappinessBasedOnComfort] Низкий комфорт (${this.comfort}%): штраф к счастью ${happinessModifier}%`)
    } else {
      happinessModifier = thresholds.critical.penalty
      console.log(`[updateHappinessBasedOnComfort] Критический комфорт (${this.comfort}%): критический штраф к счастью ${happinessModifier}%`)
    }

    // Применяем модификатор к текущему счастью и округляем
    this.happiness = Math.max(0, Math.min(100, Math.round(this.happiness + happinessModifier)))
    
    if (this.happiness !== oldHappiness) {
      // Показываем индикатор изменения счастья
      console.log(`[updateHappinessBasedOnComfort] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
      
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        const happinessChange = this.happiness - oldHappiness;
        console.log(`[updateHappinessBasedOnComfort] 🎯 Показываем индикатор для счастья: ${happinessChange > 0 ? '+' : ''}${happinessChange}%`);
        (window as any).forceCheckResourceChange('happiness', happinessChange, false, true);
      } else {
        console.warn(`[updateHappinessBasedOnComfort] ❌ forceCheckResourceChange недоступен`);
      }
      
      console.log(`[updateHappinessBasedOnComfort] Счастье обновлено: ${oldHappiness}% → ${this.happiness}% (модификатор: ${happinessModifier}%)`)
      this.updateAllResources()
    }
  }

  // Обновление морали от комфорта
  private updateMoraleFromComfort(): void {
    const oldMorale = this.moral
    const recovery = this.configManager.getMoraleComfortRecovery(this.comfort)
    
    if (recovery > 0) {
      const maxMorale = this.configManager.getMaxMorale()
      this.moral = Math.min(maxMorale, Math.round(this.moral + recovery))
      
      if (this.moral !== oldMorale) {
            // Показываем индикатор изменения морали
    console.log(`[updateMoraleFromComfort] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      const moraleChange = this.moral - oldMorale;
      console.log(`[updateMoraleFromComfort] 🎯 Показываем индикатор для морали: ${moraleChange > 0 ? '+' : ''}${moraleChange}%`);
      (window as any).forceCheckResourceChange('moral', moraleChange, false, true);
    } else {
      console.warn(`[updateMoraleFromComfort] ❌ forceCheckResourceChange недоступен`);
    }
        
        console.log(`[updateMoraleFromComfort] Мораль восстановлена от комфорта: ${oldMorale}% → ${this.moral}% (+${recovery}%)`)
        this.updateAllResources()
      }
    }
    
    // Логируем текущее состояние морали
    console.log(`[updateMoraleFromComfort] Текущая мораль: ${this.moral}%, комфорт: ${this.comfort}%, восстановление: +${recovery}/час`)
  }

  // Вражеский урон по ресурсу "Защита" раз в час
  private processEnemyDefenseDamage(hour: number): void {
    console.log(`[processEnemyDefenseDamage] Час ${hour}: Начинаем обработку, врагов в очереди: ${this.enemyQueueItems.length}`)
    
    // Обрабатываем восстановление защиты если нет врагов
    this.processDefenseRegeneration(hour)
    
    // Обновляем комфорт в зависимости от защиты
    this.updateComfortBasedOnDefense()
    
      // Обновляем счастье в зависимости от комфорта
  this.updateHappinessBasedOnComfort()
  
  // Восстанавливаем мораль от комфорта
  this.updateMoraleFromComfort()
  
  // Обрабатываем атаки врагов только если они есть
  if (this.enemyQueueItems.length > 0) {
      // Логируем текущий баланс бункера каждый час
      const balanceInfo = this.getBunkerBalanceInfo()
      console.log(`[processEnemyDefenseDamage] Час ${hour}: Жители: ${balanceInfo.residents}, Враги: ${balanceInfo.enemies}, Статус: ${balanceInfo.balanceStatus}`)
      const damageByType = (type: string): number => {
        switch (type) {
          case 'МАРОДЕР': return 1
          case 'ЗОМБИ': return 2
          case 'МУТАНТ': return 5
          case 'СОЛДАТ': return 10
          default: return 1
        }
      }
      // Первый враг бьёт каждый час
      const first = this.enemyQueueItems[0]
      if (first) {
        const d = damageByType((first as any).type || first.type)
        this.defense = Math.max(0, Math.round(this.defense - d))
        this.updateResourcesText()
        // Обновляем фон двери при изменении защиты
        this.updateEntranceBackground()

        // Проверяем: если защита упала до 0, враг заходит в бункер
        // Но только если он не заблокирован
        if (this.defense <= 0 && !(first as any).blockedFromEntry) {
          // Дополнительная проверка: может ли враг войти в бункер
          if (this.bunkerEnemies.length >= this.bunkerResidents.length) {
            console.log(`[processEnemyDefenseDamage] Защита упала до 0, но враг ${first.type} не может войти: врагов (${this.bunkerEnemies.length}) >= жителей (${this.bunkerResidents.length})`)
            
            // Показываем уведомление
            if (typeof window !== 'undefined' && (window as any).showToast) {
              (window as any).showToast(`Враг ${first.type} не может войти: бункер переполнен врагами!`);
            }
            
            // Помечаем врага как заблокированного
            (first as any).blockedFromEntry = true
            
            // Враг остается в очереди, но не может войти
            // Восстанавливаем немного защиты, чтобы враг не мог войти
            this.defense = Math.max(1, this.defense)
            this.updateResourcesText()
            this.updateEntranceBackground()
          } else {
            this.enemyEntersBunker(first)
          }
        }
        
        // Атака: проиграть attack в превью и на поверхности, если есть
        try {
          // Превью
          if (this.personPreviewSprite && (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === first.id) {
            // Играть правильную анимацию атаки в зависимости от типа врага
            this.playEnemyAttackAnimation(first, this.personPreviewSprite, this.personPreviewShirt, this.personPreviewPants, this.personPreviewFootwear, this.personPreviewHair)
          }
          // Поверхность — первый враг
          const any = first as any
          this.playEnemyAttackAnimation(first, any.sprite, any.shirt, any.pants, any.footwear, any.hair)
        } catch {}
      }
      // Остальные враги: урон раз в 12/6/2 часа по сложности
      const cadence = this.difficulty === 'normal' ? 6 : this.difficulty === 'easy' ? 12 : 2
      for (let i = 1; i < this.enemyQueueItems.length; i++) {
        if (hour % cadence !== 0) break
        const it = this.enemyQueueItems[i] as any
        
        // Пропускаем заблокированных врагов
        if ((it as any).blockedFromEntry) {
          console.log(`[processEnemyDefenseDamage] Враг ${it.type} заблокирован, пропускаем атаку`)
          continue
        }
        
        const d = damageByType(it.type)
        this.defense = Math.max(0, Math.round(this.defense - d))
        // Обновляем фон двери при изменении защиты
        this.updateEntranceBackground()

        // Также проигрываем анимацию атаки для врагов в очереди
        try {
          this.playEnemyAttackAnimation(it, it.sprite, it.shirt, it.pants, it.footwear, it.hair)
        } catch {}
      }
      this.updateResourcesText()
    } else {
      console.log(`[processEnemyDefenseDamage] Час ${hour}: Нет врагов для атаки, пропускаем обработку атак`)
    }
    
    // Разблокируем врагов если есть место
    this.unblockEnemiesIfPossible()
    
    // Обрабатываем здоровье жителей и врагов каждый час (ВСЕГДА, независимо от врагов)
    console.log(`[processEnemyDefenseDamage] Час ${hour}: Вызываем processResidentHealthHourly`)
    this.processResidentHealthHourly(hour)
    
    // Обрабатываем лечение от докторов каждый час
    console.log(`[processEnemyDefenseDamage] Час ${hour}: Вызываем processDoctorHealing`)
    this.processDoctorHealing(hour)
    
    // Обрабатываем почасовое потребление ресурсов
    console.log(`[processEnemyDefenseDamage] Час ${hour}: Вызываем processHourlyResourceConsumption`)
    this.processHourlyResourceConsumption()
    
    console.log(`[processEnemyDefenseDamage] Час ${hour}: Обработка завершена`)
  }

  private enemyEntersBunker(enemy: any): void {
    // Проверяем, может ли враг войти в бункер
    if (this.bunkerEnemies.length >= this.bunkerResidents.length) {
      console.log(`[enemyEntersBunker] Враг ${enemy.type} не может войти в бункер: врагов (${this.bunkerEnemies.length}) >= жителей (${this.bunkerResidents.length})`)
      
      // Показываем уведомление
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`Враг ${enemy.type} не может войти: бункер переполнен врагами!`);
      }
      
      // Помечаем врага как заблокированного
      (enemy as any).blockedFromEntry = true
      
      // Враг остается в очереди, но не может войти
      // Просто прерываем выполнение метода
      return
    }
    
    // Помечаем врага как входящего в бункер
    enemy.enteringBunker = true
    
    // Проверяем нужно ли показать анимацию превью
    const wasCurrentEnemy = (this as any)._previewCurrentIsEnemy && (this as any)._previewCurrentId === enemy.id
    
    // Анимация в блоке превью: поднятие вверх и исчезновение
    if (this.personPreviewSprite && wasCurrentEnemy) {
      ;(this as any)._previewBusy = true
      this.tweens.add({
        targets: this.personPreviewSprite,
        y: "-= 40",
        alpha: 0,
        duration: 800,
        ease: 'Sine.easeIn',
        onComplete: () => {
          // Не уничтожаем спрайт превью: просто скрываем и сбрасываем параметры,
          // чтобы следующий враг мог корректно отрисоваться
          if (this.personPreviewSprite) {
            this.personPreviewSprite.setAlpha(1)
            this.personPreviewSprite.setVisible(false)
            // Вернем позицию вниз (откат по y), чтобы следующий вход начинался корректно
            try { this.personPreviewSprite.y += 40 } catch {}
          }
          
          // Сбрасываем флаги превью только ПОСЛЕ уничтожения спрайта
          ;(this as any)._previewCurrentIsEnemy = false
          ;(this as any)._previewCurrentId = null
          ;(this as any)._previewBusy = false
          
          // Удаляем врага из очереди только после анимации превью
          const enemyIndex = this.enemyQueueItems.indexOf(enemy)
          if (enemyIndex !== -1) {
            this.enemyQueueItems.splice(enemyIndex, 1)
          }
          
          // Если остались враги, новый первый враг уже достиг позиции
          if (this.enemyQueueItems.length > 0) {
            const newFirst = this.enemyQueueItems[0]
            if (newFirst) {
              (newFirst as any).arrivedAtPosition = true
            }
          }
          
          // Сразу обновляем превью для следующего врага
          this.updatePersonInfoFromQueue()
          
          // Проверяем возможность возобновления прихода персонажей
          this.checkAndResumeArrivals()
        }
      })
    } else {
      // Если превью не отображается, сразу удаляем из очереди
      const enemyIndex = this.enemyQueueItems.indexOf(enemy)
      if (enemyIndex !== -1) {
        this.enemyQueueItems.splice(enemyIndex, 1)
      }
      
      // Сбрасываем флаги превью если это был текущий враг
      if (wasCurrentEnemy) {
        ;(this as any)._previewCurrentIsEnemy = false
        ;(this as any)._previewCurrentId = null
      }
      
      // Проверяем возможность возобновления прихода персонажей
      this.checkAndResumeArrivals()
    }
    
    // Анимация в блоке поверхности: выход за правую границу экрана
    const enemyAny = enemy as any
    const surfaceTargets: any[] = [enemy.rect]
    if (enemyAny.sprite) surfaceTargets.push(enemyAny.sprite)
    if (enemyAny.shirt) surfaceTargets.push(enemyAny.shirt)
    if (enemyAny.pants) surfaceTargets.push(enemyAny.pants)
    if (enemyAny.footwear) surfaceTargets.push(enemyAny.footwear)
    if (enemyAny.hair) surfaceTargets.push(enemyAny.hair)
    
    // Проигрываем walk анимацию во время входа в бункер
    if (enemyAny.sprite) {
      try {
        if (enemy.type === 'МАРОДЕР') {
          this.ensureMarauderAnimations()
          const kind = enemyAny.marauderKind || 1
          enemyAny.sprite.anims.play(`r${kind}_walk`, true)
        } else if (enemy.type === 'ЗОМБИ') {
          this.ensureZombieAnimations()
          const kind = enemyAny.zombieKind || 'wild'
          enemyAny.sprite.anims.play(`z_${kind}_walk`, true)
        } else if (enemy.type === 'МУТАНТ') {
          this.ensureMutantAnimations()
          const k = enemyAny.mutantKind || 1
          enemyAny.sprite.anims.play(`m${k}_walk`, true)
        } else if (enemy.type === 'СОЛДАТ') {
          this.ensureSoldierAnimations()
          enemyAny.sprite.anims.play('sold_walk', true)
        }
      } catch {}
    }
    
    // Анимация движения вправо за границу экрана
    const surfaceRect = this.lastSurfaceRect
    const targetX = surfaceRect ? surfaceRect.width + 60 : 400
    
    this.tweens.add({
      targets: surfaceTargets,
      x: targetX,
      duration: 1200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Уничтожаем графические объекты врага на поверхности
        enemy.rect.destroy()
        enemyAny.sprite?.destroy()
        enemyAny.shirt?.destroy()
        enemyAny.pants?.destroy()
        enemyAny.footwear?.destroy()
        enemyAny.hair?.destroy()
        
        // Добавляем врага в бункер
        this.spawnEnemyInBunker(enemy)
        
        // Обновляем очередь на поверхности
        if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect, true)
        
        // Обновляем превью для следующего врага (если превью не было анимировано)
        if (!wasCurrentEnemy) {
          this.updatePersonInfoFromQueue()
        }
        
        if (this.enemyQueueItems.length === 0) {
          this.enemyHpBg?.setVisible(false)
          this.enemyHpFg?.setVisible(false)
        }
        
        // Проверяем возможность возобновления прихода персонажей
        this.checkAndResumeArrivals()
      }
    })
    
    // Уведомление о проникновении
    this.showToast(`${enemy.type} проник в бункер!`)
  }

  private spawnEnemyInBunker(enemy: any): void {
    // Дополнительная проверка безопасности перед добавлением врага
    if (this.bunkerEnemies.length >= this.bunkerResidents.length) {
      console.log(`[spawnEnemyInBunker] КРИТИЧЕСКАЯ ОШИБКА: Попытка добавить врага ${enemy.type} когда врагов (${this.bunkerEnemies.length}) >= жителей (${this.bunkerResidents.length})`)
      return // Не добавляем врага
    }
    
    // Создаем запись о враге как о "жителе" бункера, но с пометкой что это враг
    const enemyResident = {
      id: enemy.id,
      name: `${enemy.type}_${enemy.id}`, // Уникальное имя врага
      gender: 'М', // Пока все враги мужского пола
      age: 25, // Возраст врага не важен
      profession: enemy.type, // Профессия = тип врага
      skills: [] as { text: string; positive: boolean; }[], // Враги пока без навыков
      itemsText: '', // У врагов нет предметов
      admittedAt: this.dayNumber, // День проникновения
      status: 'ищет жертву', // Начальный статус врага
      currentRoom: 'Вход', // Спавним в комнате "Вход"
      intent: 'hostile', // Пометка что это враг
      hunger: 100,
      thirst: 100,
      energy: 100,
      health: 100,
      isEnemy: true, // Флаг что это враг, а не житель
      enemyType: enemy.type, // Сохраняем тип врага
      marauderKind: (enemy as any).marauderKind, // Для мародеров
      zombieKind: (enemy as any).zombieKind, // Для зомби
      mutantKind: (enemy as any).mutantKind, // Для мутантов
      // Другие данные врага при необходимости
    }
    
    // Добавляем врага в отдельный список врагов
    this.bunkerEnemies.push(enemyResident)
    console.log(`[GameScene] Враг ${enemy.type} (ID: ${enemy.id}) добавлен в bunkerEnemies, общее количество врагов: ${this.bunkerEnemies.length}, время=${Date.now()}`)

    // Обновляем визуальное отображение бункера (жители + враги)
    console.log(`[GameScene] Вызываем syncResidents для врага ${enemy.type} (ID: ${enemy.id}), время=${Date.now()}`)
    this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)

    // Обновляем счетчик населения
    this.updateAllResources()

    console.log(`[GameScene] Враг ${enemy.type} (ID: ${enemy.id}) полностью обработан, время=${Date.now()}`)
    
    // Логируем обновленный баланс бункера
    const balanceInfo = this.getBunkerBalanceInfo()
    console.log(`[spawnEnemyInBunker] Обновленный баланс: Жители: ${balanceInfo.residents}, Враги: ${balanceInfo.enemies}, Статус: ${balanceInfo.balanceStatus}`)
  }

  constructor() {
    super('Game')
  }

  async init(data: { difficulty?: Difficulty }): Promise<void> {
    if (data?.difficulty) this.difficulty = data.difficulty
    
    // Загружаем конфигурацию
    await this.configManager.loadConfig()
    this.configManager.setDifficulty(this.difficulty)
    
    // Устанавливаем конфигурацию в window для доступа из HTML
    if (typeof window !== 'undefined') {
      window.gameConfig = this.configManager.getConfig()
      console.log('[GameScene] window.gameConfig установлен для доступа из HTML')
    }
    
    console.log(`[GameScene] Инициализация с сложностью: ${this.difficulty}`)
    
    // Инициализируем ресурсы ИЗ КОНФИГУРАЦИИ сразу после загрузки
    this.initResourcesBasedOnDifficulty()
    
    // Рассчитываем множители потребления ресурсов при инициализации
    this.calculateResourceConsumptionMultipliers()
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1b1e')

    // Ресурсы уже инициализированы в init() из конфигурации
    // Случайный сессионный сид для разнообразия генерации персонажей
    this.sessionSeed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
    console.log('[GameScene] sessionSeed:', this.sessionSeed, 'difficulty:', this.difficulty)
    
    // Инициализация системы фракций и побочных предметов
    this.initializeFactionSystem()
    this.initializeSidequestSystem()
    
    // Демонстрация системы электростанций (можно удалить после тестирования)
    this.time.delayedCall(5000, () => {
      console.log('=== Демонстрация системы электростанций ===')
      console.log('💡 Подсказка: Стройте комнаты и электростанции чтобы увидеть как работает система питания!')

      // Объясняем систему иконок
      console.log('[Icons] Система иконок состояния комнат:')
      console.log('🚪/🚫 - Доступность | ⚙️/🚧 - Работоспособность | 💡/🌑 - Свет | ⚡/🔌 - Энергия | ✅/⚠️ - Безопасность')
      console.log('Иконки отображаются в заголовке каждой комнаты!')

      console.log('[Power System] Стартовые комнаты (Вход, Спальня, Столовая, Туалет) всегда имеют питание')
      console.log('[Power System] Новые комнаты нуждаются в станциях: 1 станция = питание для 3 комнат + себя')
      console.log('[Power System] Попробуйте построить комнаты без станций, а потом добавить станцию!')
    })

    // Система погоды готова к использованию через публичные методы

    // Top bar - бункерный дизайн в стиле HTML прототипа
    this.topBar = this.add.container(0, 0)
    const s = uiScale(this)

    // Основной темный фон
    const barBg = this.add.rectangle(0, 0, 100, Math.round(60 * s), 0x1a1a1a).setOrigin(0)
    barBg.setStrokeStyle(3, 0x333333, 1)

    // Верхняя коричневая полоса акцента
    const topAccent = this.add.rectangle(0, 0, 100, 3, 0x8B4513).setOrigin(0)

    // Нижняя коричневая полоса акцента
    const bottomAccent = this.add.rectangle(0, Math.round(57 * s), 100, 3, 0x654321).setOrigin(0)

    // Дополнительные декоративные элементы для стиля
    const innerBorder = this.add.rectangle(2, 2, 96, Math.round(56 * s), 0x000000, 0).setOrigin(0)
    innerBorder.setStrokeStyle(1, 0x4a4a4a, 1)

    this.dayText = this.add.text(18, Math.round(6 * s), `${t('day')}: ${this.dayNumber} • ${t(this.phase === 'day' ? 'dayPhase' : 'nightPhase')}`, {
      fontFamily: THEME.fonts.heading,
      fontSize: fs(this, 12),
      color: '#D4AF37', // Золотой цвет как в HTML
      stroke: '#654321',
      strokeThickness: 1
    })
    this.resourcesText = this.add.text(16, Math.round(28 * s), '', {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: THEME.colors.textMuted
    })
    // Инициализируем строку ресурсов после создания контейнеров, чтобы избежать нулевых ссылок
    this.time.delayedCall(0, () => this.updateAllResources())

    // Инициализируем HTML UI overlay
    this.initUIOverlay()
    // Кнопки ресурсов в стиле HTML прототипа
    const buttonStyle = {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 10),
      color: '#e0e0e0',
      backgroundColor: '#2a2a2a',
      padding: { x: 6, y: 4 }
    }

    // Кнопка населения (десктоп). Кликабельно только на десктопе; на мобильном переключает вкладку PEOPLE
    this.populationBtn = this.add.text(16, Math.round(28 * s), '', buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.populationBtn.setStroke('#555555', 1)
    this.populationBtn.on('pointerdown', () => this.openResidentsOverlay())

    // Кнопки ресурсов
    this.happinessBtn = this.add.text(0, Math.round(28 * s), '', { ...buttonStyle, color: '#81c784' }).setOrigin(0).setInteractive({ useHandCursor: true })
    this.happinessBtn.setStroke('#555555', 1)
    this.happinessBtn.on('pointerdown', () => this.openResourceOverlay('СЧАСТЬЕ'))

    this.ammoBtn = this.add.text(0, Math.round(28 * s), '', { ...buttonStyle, color: '#90caf9' }).setOrigin(0).setInteractive({ useHandCursor: true })
    this.ammoBtn.setStroke('#555555', 1)
    this.ammoBtn.on('pointerdown', () => this.openResourceOverlay('ПАТРОНЫ'))

    this.comfortBtn = this.add.text(0, Math.round(28 * s), '', { ...buttonStyle, color: '#ce93d8' }).setOrigin(0).setInteractive({ useHandCursor: true })
    this.comfortBtn.setStroke('#555555', 1)
    this.comfortBtn.on('pointerdown', () => this.openResourceOverlay('КОМФОРТ'))

    // Еда, Вода, Деньги как отдельные кнопки
    this.foodBtn = this.add.text(0, Math.round(28 * s), '', buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.foodBtn.setStroke('#555555', 1)
    this.foodBtn.on('pointerdown', () => this.openResourceOverlay(t('food').toUpperCase()))

    this.waterBtn = this.add.text(0, Math.round(28 * s), '', buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.waterBtn.setStroke('#555555', 1)
    this.waterBtn.on('pointerdown', () => this.openResourceOverlay(t('water').toUpperCase()))

    this.moneyBtn = this.add.text(0, Math.round(28 * s), '', buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.moneyBtn.setStroke('#555555', 1)
    this.moneyBtn.on('pointerdown', () => this.openResourceOverlay(t('money').toUpperCase()))

    this.abilitiesBtn = this.add.text(0, Math.round(8 * s), `[ ${t('abilities')} ]`, buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.abilitiesBtn.setStroke('#555555', 1)
    this.abilitiesBtn.on('pointerdown', () => {
      this.showToast(t('abilitiesWip'))
    })
    this.pauseBtn = this.add.text(0, Math.round(8 * s), `[ ${t('pause')} ]`, buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.pauseBtn.setStroke('#555555', 1)
    this.pauseBtn.on('pointerdown', () => this.togglePause())

    // Кнопка инвентаря
    this.inventoryBtn = this.add.text(0, Math.round(8 * s), '[ 📦 ]', buttonStyle).setOrigin(0).setInteractive({ useHandCursor: true })
    this.inventoryBtn.setStroke('#555555', 1)
    this.inventoryBtn.on('pointerdown', () => this.showToast('Инвентарь (WIP)'))

    // Счетчик врагов в бункере
    this.enemyCountText = this.add.text(0, Math.round(28 * s), '', buttonStyle).setOrigin(0)
    this.enemyCountText.setStroke('#555555', 1)

    // Шкала опыта бункера (стиль как в HTML - progress-bar)
    this.experienceBg = this.add.rectangle(0, Math.round(45 * s), 200, 12, 0x333333).setOrigin(0)
    this.experienceBg.setStrokeStyle(2, 0x555555, 1)
    this.experienceFg = this.add.rectangle(0, Math.round(45 * s), 0, 12, 0x4CAF50).setOrigin(0)
    this.levelText = this.add.text(0, Math.round(32 * s), `УР.${this.bunkerLevel}`, {
      fontFamily: THEME.fonts.heading,
      fontSize: fs(this, 10),
      color: '#D4AF37',
      stroke: '#654321',
      strokeThickness: 1
    })

    this.xpText = this.add.text(0, Math.round(32 * s), `XP: ${this.bunkerExperience}/${this.maxExperienceForLevel}`, {
      fontFamily: THEME.fonts.body,
      fontSize: fs(this, 8),
      color: '#e0e0e0'
    })

    this.topBar.add([barBg, topAccent, bottomAccent, innerBorder, this.dayText, this.populationBtn!, this.happinessBtn!, this.ammoBtn!, this.comfortBtn!, this.foodBtn!, this.waterBtn!, this.moneyBtn!, this.resourcesText, this.abilitiesBtn, this.pauseBtn, this.inventoryBtn!, this.enemyCountText!, this.experienceBg!, this.experienceFg!, this.levelText!, this.xpText!])
    this.topBar.setDepth(1000)

    // Areas containers
    this.surfaceArea = this.add.container(0, 0)
    this.personArea = this.add.container(0, 0)
    this.peopleArea = this.add.container(0, 0)
    this.resourcesArea = this.add.container(0, 0)
    this.bunkerArea = this.add.container(0, 0)
    // Set explicit depths - все области на одном уровне, но топ-бар выше
    this.surfaceArea.setDepth(2)
    this.personArea.setDepth(4000) // Очень высокий depth для области превью персонажей
    this.peopleArea.setDepth(2)
    this.resourcesArea.setDepth(2)
    this.bunkerArea.setDepth(2)

    // Placeholders content
    this.buildSurfacePlaceholders()
    this.buildPersonPlaceholders()
    this.buildBunkerPlaceholders()

    // Запускаем цикл дня/ночи по времени
    this.startDayPhase(true)
    // Периодическое обновление часов и смены фазы — каждые 150мс
    this.clockEvent = this.time.addEvent({ delay: 150, loop: true, callback: () => this.tickClockAndPhase() })
    // Чистка по выключению сцены
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.clockEvent?.remove(false))

    // Resize handling
    onResize(this, () => this.layout())
    this.layout()
    
    // Принудительно применяем лэйаут для корректной инициализации позиций превью и кнопок
    this.time.delayedCall(0, () => this.layout())
    this.time.delayedCall(50, () => this.layout())

    // Initialize modals after bunker is fully set up (with delay to ensure proper initialization)
    this.time.delayedCall(100, () => {
      console.log('[GameScene] Initializing modals after bunker setup');
      this.initializeModals();
    });
  }

  /**
   * Инициализация системы фракций
   */
  private initializeFactionSystem(): void {
    try {
      // Создаем менеджер фракций
      this.factionManager = FactionManager.getInstance()
      
      // Выбираем случайную правдивую фракцию (исключая Mystery)
      const availableFactions: FactionId[] = ['hq', 'rebels', 'marauders', 'free']
      const randomIndex = Math.floor(Math.random() * availableFactions.length)
      this.truthfulFaction = availableFactions[randomIndex]
      
      // Устанавливаем правдивую фракцию в менеджере
      this.factionManager.setTruthfulFaction(this.truthfulFaction)
      
      console.log(`[GameScene] 🎯 Система фракций инициализирована. Правдивая фракция: ${this.truthfulFaction}`)
      console.log(`[GameScene] 📋 Доступные фракции:`, this.factionManager.getAllFactions().map(f => f.id))
    } catch (error) {
      console.error('[GameScene] Ошибка инициализации системы фракций:', error)
    }
  }

  /**
   * Инициализация системы побочных предметов
   */
  private initializeSidequestSystem(): void {
    try {
      // Инициализируем менеджер побочных предметов с сидом
      const sidequestManager = getSidequestItemManager(this.sessionSeed)
      
      console.log(`[GameScene] 📦 Система побочных предметов инициализирована`)
      console.log(`[GameScene] 📊 Загружено предметов: ${sidequestManager.getAllItems().length}`)
      
      // Логируем количество предметов по темам
      const themes = ['faction_lies', 'faction_truth', 'faction_neutral', 'world_history', 'enemy_origins']
      themes.forEach(theme => {
        const count = sidequestManager.getItemsByTheme(theme as any).length
        console.log(`[GameScene] - ${theme}: ${count} предметов`)
      })
    } catch (error) {
      console.error('[GameScene] Ошибка инициализации системы побочных предметов:', error)
    }
  }

  private initResourcesBasedOnDifficulty(): void {
    try {
      const initialResources = this.configManager.getInitialResources()
      
      console.log(`[GameScene] 📊 Получены ресурсы из конфигурации для сложности ${this.difficulty}:`, initialResources)
      
      this.happiness = Math.round(initialResources.happiness)
      this.defense = Math.round(initialResources.defense)
      this.ammo = Math.round(initialResources.ammo)
      this.comfort = Math.round(initialResources.comfort)
      this.moral = Math.round(initialResources.moral)
      this.food = Math.round(initialResources.food)
      this.water = Math.round(initialResources.water)
      this.money = Math.round(initialResources.money)
      this.wood = Math.round(initialResources.wood)
      this.metal = Math.round(initialResources.metal)
      this.coal = Math.round(initialResources.coal)
      this.nails = Math.round(initialResources.nails)
      this.paper = Math.round(initialResources.paper)
      this.glass = Math.round(initialResources.glass)
      
      console.log(`[GameScene] ✅ Ресурсы инициализированы из конфигурации для сложности ${this.difficulty}`)
      console.log(`[GameScene] 📊 Текущие значения: счастье=${this.happiness}%, защита=${this.defense}%, патроны=${this.ammo}, комфорт=${this.comfort}%, мораль=${this.moral}%, еда=${this.food}, вода=${this.water}, деньги=${this.money}`)
      console.log(`[GameScene] 🎯 Мораль инициализирована: ${this.moral}% (максимум: ${this.configManager.getMaxMorale()}%)`)
    } catch (error) {
      console.error('[GameScene] ❌ Ошибка инициализации ресурсов из конфигурации:', error)
      console.log('[GameScene] 🔄 Используем fallback значения...')
      
      // Fallback к старым значениям (используем значения для easy сложности)
      this.happiness = 100
      this.defense = 100
      this.ammo = 200
      this.comfort = 100
      this.moral = 100
      this.food = 150
      this.water = 150
      this.money = 500
      this.wood = 100
      this.metal = 100
      this.coal = 100
      this.nails = 100
      this.paper = 100
      this.glass = 100
      
      console.log(`[GameScene] ⚠️ Fallback значения установлены для сложности ${this.difficulty}`)
    }
    
    // Множители потребления ресурсов рассчитываются отдельно в init()
  }

  // ======== Daily resources processing ========
  private getRoomCount(roomName: string): number {
    const bv: any = this.simpleBunker
    if (!bv || !(bv as any).roomNames) return 0
    const rooms: string[] = (bv as any).roomNames || []
    return rooms.filter(n => n === roomName).length
  }

  private processDailyResources(): void {
    const residents = this.bunkerResidents.length
    const diningCount = this.getRoomCount('Столовая')
    const toiletCount = this.getRoomCount('Туалет')

    // Accumulation
    const foodGain = diningCount * 2
    const waterGain = toiletCount * 2
    // Consumption (per resident)
    const foodUse = residents * 1
    const waterUse = residents * 1

    this.food = Math.max(0, Math.round(this.food + foodGain - foodUse))
    this.water = Math.max(0, Math.round(this.water + waterGain - waterUse))

    // Happiness dynamics
    const deltaH = this.computeDailyHappinessDelta(residents)
    this.happiness = Math.max(0, Math.min(100, Math.round(this.happiness + deltaH)))

    // Восстановление разума при улучшении морали
    this.restoreSanity()

    this.updateAllResources()
  }

  private computeDailyHappinessDelta(residents: number): number {
    if (residents === 0) return 0

    let delta = 0
    // Food satisfaction
    if (this.food >= residents) delta += 2
    else delta -= Math.min(5, residents - this.food)
    // Water satisfaction
    if (this.water >= residents) delta += 2
    else delta -= Math.min(5, residents - this.water)
    // Comfort
    if (this.comfort >= 70) delta += 1
    else if (this.comfort < 40) delta -= 2
    // Defense
    if (this.defense >= 70) delta += 1
    else if (this.defense < 30) delta -= 2
    // Money buffer
    if (this.money >= 200) delta += 1
    else if (this.money < 50) delta -= 1

    return Phaser.Math.Clamp(delta, -10, 6)
  }

  private updateWeatherBackground(): void {
    // Если surfaceArea не существует, выходим
    if (!this.surfaceArea) return

    // Проверяем, существует ли surfaceBackground и добавлен ли он в сцену
    if (!this.surfaceBackground || !this.surfaceBackground.scene) {
      // Создаем новый фон
      this.surfaceBackground = this.add.image(0, 0, 'surface_day').setOrigin(0, 0)
      this.surfaceBackground.setDepth(-1)

      // Добавляем в surfaceArea
      this.surfaceArea.add(this.surfaceBackground)
      // Опускаем на задний план
      this.surfaceArea.sendToBack(this.surfaceBackground)
    }

    let textureKey: string

    // Определяем текстуру в зависимости от времени суток и погоды
    switch (this.weatherState) {
      case 'rain':
        textureKey = this.phase === 'day' ? 'surface_day_rain' : 'surface_night'
        break
      case 'lighting':
        // Молния показывается только днем
        textureKey = 'surface_day_rain_lighting'
        break
      case 'acid_fog':
        // Кислотный туман только днем
        textureKey = 'surface_day_acid_fog'
        break
      default: // clear
        textureKey = this.phase === 'day' ? 'surface_day' : 'surface_night'
        break
    }

    // Обновляем текстуру изображения
    try {
      this.surfaceBackground.setTexture(textureKey)
    } catch (error) {
      console.warn('Failed to set weather background texture:', error)
    }
  }

  private setWeatherState(state: WeatherState, duration?: number): void {
    // Очищаем предыдущий таймер если он был
    if (this.weatherTimer) {
      this.weatherTimer.destroy()
      this.weatherTimer = undefined
    }

    this.weatherState = state
    this.updateWeatherBackground()

    // Если указано время, устанавливаем таймер для возврата к ясной погоде
    if (duration && duration > 0) {
      this.weatherTimer = this.time.delayedCall(duration, () => {
        this.setWeatherState('clear')
      })
    }
  }

  private startDayNightTransition(): void {
    if (this.isTransitioning) return

    this.isTransitioning = true

    // Создаем временное изображение для перехода поверхности
    const transitionBg = this.add.image(0, 0, 'surface_day').setOrigin(0, 0)
    transitionBg.setDepth(-1)
    transitionBg.setAlpha(0)

    if (this.surfaceArea) {
      this.surfaceArea.add(transitionBg)
      // Опускаем на задний план
      this.surfaceArea.sendToBack(transitionBg)
    }

    // Определяем целевую текстуру для поверхности
    const targetSurfaceTexture = this.phase === 'day' ? 'surface_night' : 'surface_day'

    // Устанавливаем правильную текстуру для перехода поверхности
    transitionBg.setTexture(targetSurfaceTexture)

    // Определяем целевую фазу для двери
    const targetPhase = this.phase === 'day' ? 'night' : 'day'

    // Сохраняем текущую текстуру двери для плавного перехода
    const currentEntranceTexture = this.personEntranceImage?.texture?.key || ''
    const targetEntranceTexture = this.getEntranceTextureForPhase(targetPhase)

    // Плавный переход в течение 3 секунд
    this.tweens.add({
      targets: transitionBg,
      alpha: 1,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // После завершения перехода
        this.isTransitioning = false

        // Меняем основное изображение поверхности
        if (this.surfaceBackground) {
          this.surfaceBackground.setTexture(targetSurfaceTexture)
        }

        // Меняем фон двери на новый
        this.updateEntranceBackgroundForPhase(targetPhase)

        // Удаляем временное изображение
        transitionBg.destroy()
      }
    })

    // Если текстура двери меняется, добавляем плавный переход для двери
    if (this.personEntranceImage && currentEntranceTexture !== targetEntranceTexture) {
      // Создаем временное изображение для перехода двери
      const entranceTransition = this.add.image(0, 0, targetEntranceTexture).setOrigin(0.5)
      entranceTransition.setAlpha(0)

      if (this.personArea) {
        this.personArea.add(entranceTransition)
        // Помещаем под основное изображение двери
        this.personArea.sendToBack(entranceTransition)

        // Позиционируем как основное изображение двери
        if (this.personEntranceImage) {
          entranceTransition.setPosition(this.personEntranceImage.x, this.personEntranceImage.y)
          entranceTransition.setScale(this.personEntranceImage.scaleX, this.personEntranceImage.scaleY)
        }

        // Плавный переход для двери
        this.tweens.add({
          targets: entranceTransition,
          alpha: 1,
          duration: 3000,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            // Меняем основное изображение двери
            if (this.personEntranceImage) {
              this.personEntranceImage.setTexture(targetEntranceTexture)
            }
            // Удаляем временное изображение
            entranceTransition.destroy()
          }
        })
      }
    }
  }

  private buildSurfacePlaceholders(): void {
    if (!this.surfaceArea) return

    // Очищаем все содержимое области поверхности
    this.surfaceArea.removeAll(true)

    const surfaceLabel = this.add.text(8, 8, t('surface').toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#b71c1c' })
    surfaceLabel.name = 'surfaceLabel'

    // Создаем очереди для персонажей и врагов
    this.surfaceQueue = this.add.container(0, 0)
    this.surfaceEnemyQueue = this.add.container(0, 0)

    // Добавляем элементы в область поверхности (без фона - он создается в updateWeatherBackground)
    this.surfaceArea.add([surfaceLabel, this.surfaceQueue, this.surfaceEnemyQueue])

    // Создаем и добавляем фон
    this.updateWeatherBackground()
  }

  private buildPersonPlaceholders(): void {
    if (!this.personArea) return
    this.personArea.removeAll(true)

    // Верхняя часть: вход в бункер + Accept / Deny
    this.personTop = this.add.container(0, 0)
    this.personTop.setDepth(2000) // Высокий z-index для контейнера
    // Фоновая подложка для обеспечения валидной области контейнера (перехватывает размеры)
    const topBg = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0)
    this.personTop.add(topBg)
    const entranceImg = this.add.image(0, 0, 'entrance_day').setOrigin(0.5)
    this.personEntranceImage = entranceImg
    // Устанавливаем начальное состояние фона
    this.updateEntranceBackground()
    // Превью текущего персонажа (спрайт + рамка)
    this.personPreviewSprite = this.add.sprite(0, 0, undefined as unknown as string)
    this.personPreviewSprite.setOrigin(0.5, 1)
    this.personPreviewSprite.setVisible(false)
    this.personTop.add(this.personPreviewSprite)
    this.personPreviewShirt = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewPants = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewFootwear = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personPreviewHair = this.add.sprite(0, 0, undefined as unknown as string).setOrigin(0.5, 1).setVisible(false)
    this.personTop.add(this.personPreviewShirt)
    this.personTop.add(this.personPreviewPants)
    this.personTop.add(this.personPreviewFootwear)
    this.personTop.add(this.personPreviewHair)
    this.personPreview = this.add.rectangle(0, 0, 56, 72, 0x000000, 0).setOrigin(0.5, 1)
    // Скрываем отладочную рамку превью
    this.personPreview.setVisible(false)
    console.log('[DEBUG] Создана рамка превью:', this.personPreview)
    this.personTop.add(this.personPreview)
    this.acceptBtnObj = this.add.sprite(0, 0, 'button_green').setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.denyBtnObj = this.add.sprite(0, 0, 'button_red').setOrigin(0.5).setInteractive({ useHandCursor: true })
    
    // Устанавливаем первый кадр (состояние покоя)
    this.acceptBtnObj.setFrame(0)
    this.denyBtnObj.setFrame(0)
    
    // Изначально скрываем все кнопки
    this.acceptBtnObj.setVisible(false)
    this.denyBtnObj.setVisible(false)
    this.acceptBtnObj.on('pointerdown', () => {
      // Воспроизводим анимацию нажатия
      if (this.acceptBtnObj) {
        this.acceptBtnObj.play('button_green_press')
        // Сбрасываем анимацию после завершения
        this.acceptBtnObj.once('animationcomplete', () => {
          this.acceptBtnObj?.setFrame(0) // Возвращаемся к первому кадру
        })
      }
      // Вызываем функцию принятия
      this.decideCurrent(true)
    })
    this.denyBtnObj.on('pointerdown', () => {
      // Воспроизводим анимацию нажатия
      if (this.denyBtnObj) {
        this.denyBtnObj.play('button_red_press')
        // Сбрасываем анимацию после завершения
        this.denyBtnObj.once('animationcomplete', () => {
          this.denyBtnObj?.setFrame(0) // Возвращаемся к первому кадру
        })
      }
      // Вызываем функцию отказа
      this.decideCurrent(false)
    })
    this.personTop.add([entranceImg, this.acceptBtnObj, this.denyBtnObj])
    // Надпись "нет мест"
    this.noSpaceLabel = this.add.text(0, 0, 'НЕТ МЕСТ', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373' }).setOrigin(0.5)
    this.noSpaceLabel.setVisible(false)
    this.personTop.add(this.noSpaceLabel)

    // Нижняя часть: детали персонажа
    this.personBottom = this.add.container(0, 0)
    this.personNameText = this.add.text(0, 0, `${t('name')}: ???`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })
    this.personDetailsText = this.add.text(0, 0, `${t('age')}: ??\nПОЛ: ??\n${t('specialty')}: ??\n${t('inventory')}: ??`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })
    this.personSkillText = this.add.text(0, 0, `${t('skill')}: ???`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.textMuted })

    // Создаем сетку инвентаря 3x1 для превью персонажа
    this.personPreviewInventory = this.add.container(0, 0)
    const inventorySlots: Phaser.GameObjects.Container[] = []
    for (let i = 0; i < 3; i++) {
      const slot = this.add.container(0, 0)
      const bg = this.add.rectangle(0, 0, 56, 56, 0x333333, 0.8).setOrigin(0.5)
      const itemSprite = this.add.sprite(0, 0, undefined as unknown as string).setVisible(false)
      const quantityText = this.add.text(20, 20, '', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#ffffff' }).setOrigin(0.5)
      slot.add([bg, itemSprite, quantityText])

      // Добавляем обработчик клика на фон слота (не на контейнер)
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.showItemTooltip(i)
      })

      inventorySlots.push(slot)
    }
    this.personPreviewInventory.add(inventorySlots)
    this.personPreviewInventory.setVisible(false)

    // Создаем текст для подсказки предмета
    console.log(`[buildPersonPlaceholders] Создаем текст подсказки предмета`)
    this.itemTooltipText = this.add.text(0, 0, '', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#ffff88', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5)
    this.itemTooltipText.setVisible(false)
    console.log(`[buildPersonPlaceholders] Текст подсказки создан успешно`)

    // Изначально скрываем детали персонажа
    this.personNameText.setVisible(false)
    this.personDetailsText.setVisible(false)
    this.personSkillText.setVisible(false)
    this.personPreviewInventory.setVisible(false)
    this.personBottom.add([this.personNameText, this.personDetailsText, this.personSkillText, this.personPreviewInventory, this.itemTooltipText])

    this.personArea.add([this.personTop, this.personBottom])
    this.updatePersonInfoFromQueue()
  }

  private updateEntranceBackground(): void {
    if (!this.personEntranceImage) return

    let textureKey: string

    // Определяем текстуру в зависимости от состояния и времени суток
    switch (this.entranceState) {
      case 'broken':
        textureKey = this.phase === 'day' ? 'entrance_day_broken' : 'entrance_night_broken'
        break
      case 'accept':
        // Состояние accept: если защита сломана, используем специальный спрайт
        if (this.defense <= 0) {
          textureKey = 'entrance_day_broken_accept'
        } else {
          textureKey = 'entrance_day_accept'
        }
        break
      case 'deny':
        // Состояние deny: если защита сломана, используем специальный спрайт
        if (this.defense <= 0) {
          textureKey = 'entrance_day_broken_deny'
        } else {
          textureKey = 'entrance_day_deny'
        }
        break
      default: // normal
        // Проверяем защиту: если <= 0, показываем сломанное состояние
        if (this.defense <= 0) {
          textureKey = this.phase === 'day' ? 'entrance_day_broken' : 'entrance_night_broken'
        } else {
          textureKey = this.phase === 'day' ? 'entrance_day' : 'entrance_night'
        }
        break
    }

    // Обновляем текстуру изображения
    this.personEntranceImage.setTexture(textureKey)
  }

  private getEntranceTextureForPhase(phase: Phase): string {
    let textureKey: string

    // Определяем текстуру в зависимости от состояния и указанной фазы (для плавного перехода)
    switch (this.entranceState) {
      case 'broken':
        textureKey = phase === 'day' ? 'entrance_day_broken' : 'entrance_night_broken'
        break
      case 'accept':
        // Состояние accept: если защита сломана, используем специальный спрайт
        if (this.defense <= 0) {
          textureKey = 'entrance_day_broken_accept'
        } else {
          textureKey = 'entrance_day_accept'
        }
        break
      case 'deny':
        // Состояние deny: если защита сломана, используем специальный спрайт
        if (this.defense <= 0) {
          textureKey = 'entrance_day_broken_deny'
        } else {
          textureKey = 'entrance_day_deny'
        }
        break
      default: // normal
        // Проверяем защиту: если <= 0, показываем сломанное состояние
        if (this.defense <= 0) {
          textureKey = phase === 'day' ? 'entrance_day_broken' : 'entrance_night_broken'
        } else {
          textureKey = phase === 'day' ? 'entrance_day' : 'entrance_night'
        }
        break
    }

    return textureKey
  }

  private updateEntranceBackgroundForPhase(phase: Phase): void {
    if (!this.personEntranceImage) return

    const textureKey = this.getEntranceTextureForPhase(phase)

    // Обновляем текстуру изображения
    this.personEntranceImage.setTexture(textureKey)
  }

  private setEntranceState(state: EntranceState, duration?: number): void {
    this.entranceState = state
    this.updateEntranceBackground()

    // Очищаем предыдущий таймер если он был
    if (this.entranceStateTimer) {
      this.entranceStateTimer.destroy()
      this.entranceStateTimer = undefined
    }

    // Если указано время, устанавливаем таймер для возврата к нормальному состоянию
    if (duration && duration > 0) {
      this.entranceStateTimer = this.time.delayedCall(duration, () => {
        this.setEntranceState('normal')
      })
    }
  }

  private buildBunkerPlaceholders(): void {
    if (!this.bunkerArea) return
    
    // Сохраняем simpleBunker если он уже существует и временно отсоединяем его корневой контейнер,
    // чтобы не уничтожить при очистке bunkerArea
    const existingBunker = this.simpleBunker
    const existingRoot = existingBunker ? (existingBunker as any).getRootContainer?.() : undefined
    if (existingRoot && existingRoot.parentContainer === this.bunkerArea) {
      // Отсоединяем без уничтожения
      this.bunkerArea.remove(existingRoot, false)
    }
    
    // Чистим только вспомогательные элементы области бункера, НЕ уничтожая отсоединенный simpleBunker
    this.bunkerArea.removeAll(true)
    
    // Создаём маску для ограничения содержимого bunkerArea
    const bunkerMask = this.add.graphics()
    bunkerMask.setVisible(false) // Маска невидима
    this.bunkerArea.setMask(bunkerMask.createGeometryMask())
    this.bunkerArea.setData('mask', bunkerMask)
    
    const label = this.add.text(8, 6, t('bunkerView').toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#b71c1c' })
    label.name = 'bunkerLabel'
    this.bunkerArea.add([label])
    
    // Используем существующий simpleBunker или создаем новый
    if (existingBunker && existingRoot) {
      this.simpleBunker = existingBunker
      // Возвращаем ранее отсоединенный корневой контейнер
      this.bunkerArea.add(existingRoot)
    } else {
    this.simpleBunker = new SimpleBunkerView(this, this.bunkerArea)
    }

    // Инициализируем количество рядов инвентаря на основе количества складов
    this.time.delayedCall(200, () => {
      if (this.simpleBunker) {
        const storageCount = this.simpleBunker.getStorageRoomCount?.() || 0;
        console.log(`[GameScene] Initial storage room count: ${storageCount}`);
        this.updateInventoryRows(storageCount);
      }
    });
    
    // В контейнерах Phaser порядок определяется позицией в списке, depth внутри контейнера не влияет.
    // Поднимем заголовок в конец списка, чтобы он был поверх картинок комнат.
    this.bunkerArea.bringToTop(label)
  }

  private buildMobileTabs(x: number, y: number): void {
    if (this.mobileTabs) this.mobileTabs.destroy()
    const c = this.add.container(x, y)
    const makeBtn = (label: string, active: boolean, onClick: () => void, offsetX: number) => {
      const bg = this.add.rectangle(offsetX, 0, 96, 28, active ? 0x2a2d33 : 0x1a1d22).setOrigin(0, 0.5)
      bg.setStrokeStyle(1, active ? 0x4fc3f7 : 0x2a2d33)
      const text = this.add.text(offsetX + 8, 0, label, { fontFamily: THEME.fonts.body, fontSize: '10px', color: active ? '#ffffff' : THEME.colors.textMuted }).setOrigin(0, 0.5)
      const hit = this.add.rectangle(offsetX, 0, 96, 28, 0x000000, 0.001).setOrigin(0, 0.5)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', onClick)
      c.add([bg, text, hit])
    }
    makeBtn('INFO', this.mobileActive === 'info', () => { this.mobileActive = 'info'; this.layout() }, 0)
    makeBtn('BUNKER', this.mobileActive === 'bunker', () => { this.mobileActive = 'bunker'; this.layout() }, 104)
    makeBtn('PEOPLE', this.mobileActive === 'people', () => { this.mobileActive = 'people'; this.layout() }, 208)
    makeBtn('RESOURCES', this.mobileActive === 'resources', () => { this.mobileActive = 'resources'; this.layout() }, 312)
    this.mobileTabs = c
    this.mobileTabs.setDepth(900)
  }

  private layout(): void {
    const { width, height } = this.scale
    const portrait = isPortrait(this)
    const s = uiScale(this)

    // Layout top bar
    const barHeight = Math.round(60 * s)
    if (this.topBar) {
      const bg = this.topBar.getAt(0) as Phaser.GameObjects.Rectangle
      const topAccent = this.topBar.getAt(1) as Phaser.GameObjects.Rectangle
      const bottomAccent = this.topBar.getAt(2) as Phaser.GameObjects.Rectangle
      const innerBorder = this.topBar.getAt(3) as Phaser.GameObjects.Rectangle

      bg.width = width
      bg.height = barHeight
      topAccent.width = width
      bottomAccent.width = width
      bottomAccent.y = barHeight - 3
      innerBorder.width = width - 4
      innerBorder.height = barHeight - 4

      this.topBar.setPosition(0, 0)

      // Используем новый метод позиционирования
      this.arrangeTopBarRow()
    }

    // Areas rectangles
    const outer = 16
    const gap = 12

    let surfaceRect: Phaser.Geom.Rectangle
    let bunkerRect: Phaser.Geom.Rectangle
    let infoRect: Phaser.Geom.Rectangle
    let peopleRect: Phaser.Geom.Rectangle
    let resourcesRect: Phaser.Geom.Rectangle

    if (portrait) {
      const usableH = height - barHeight - outer * 2 - gap - 30
      const surfaceH = Math.max(180, Math.floor(usableH * 0.5))
      const bottomH = usableH - surfaceH
      const fullW = width - outer * 2
      surfaceRect = new Phaser.Geom.Rectangle(outer, barHeight + outer, fullW, surfaceH)
      const tabsY = surfaceRect.y + surfaceRect.height + 6
      this.buildMobileTabs(outer, tabsY)
      const bottomY = tabsY + 24 + 6
      bunkerRect = new Phaser.Geom.Rectangle(outer, bottomY, fullW, bottomH)
      infoRect = bunkerRect
      peopleRect = bunkerRect
      resourcesRect = bunkerRect
    } else {
      const contentH = height - barHeight - outer * 2
      const leftW = Math.max(420, Math.floor(width * 0.58))
      const rightW = width - outer * 2 - leftW - gap
      const leftX = outer
      const topY = barHeight + outer
      const surfaceH = Math.floor((contentH - gap) / 2)
      const bunkerH = contentH - surfaceH - gap
      surfaceRect = new Phaser.Geom.Rectangle(leftX, topY, leftW, surfaceH)
      bunkerRect = new Phaser.Geom.Rectangle(leftX, surfaceRect.bottom + gap, leftW, bunkerH)
      infoRect = new Phaser.Geom.Rectangle(surfaceRect.right + gap, topY, rightW, contentH)
      peopleRect = infoRect
      resourcesRect = infoRect
      if (this.mobileTabs) { this.mobileTabs.destroy(); this.mobileTabs = undefined }
    }

    const isDay = this.phase === 'day'
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t(isDay ? 'dayPhase' : 'nightPhase')} • ${this.getClockText()}`)

    // Surface
    this.surfaceArea?.setVisible(true)
    this.layoutContainer(this.surfaceArea!, surfaceRect)

    // Обновляем состояние погоды (это также создаст фон, если его нет)
    this.updateWeatherBackground()

    // Обновляем размеры и позицию фона поверхности
    if (this.surfaceBackground && this.surfaceBackground.scene) {
      this.surfaceBackground.setDisplaySize(surfaceRect.width, surfaceRect.height)
      // Позиция относительно контейнера, а не глобальных координат
      this.surfaceBackground.setPosition(0, 0)
    }

    // Поднимем элементы над фоном
    const surfLabel = this.surfaceArea?.list.find(g => g.name === 'surfaceLabel')
    if (surfLabel) this.surfaceArea?.bringToTop(surfLabel)
    if (this.surfaceQueue) this.surfaceArea?.bringToTop(this.surfaceQueue)
    if (this.surfaceEnemyQueue) this.surfaceArea?.bringToTop(this.surfaceEnemyQueue)
    // Враги должны быть поверх людей
    if (this.surfaceEnemyQueue) this.surfaceArea?.bringToTop(this.surfaceEnemyQueue)
    this.layoutQueue(surfaceRect)
    this.layoutEnemyQueue(surfaceRect)

    // Bunker
    const showBunker = !portrait || (portrait && this.mobileActive === 'bunker')
    this.bunkerArea?.setVisible(showBunker)
    if (showBunker) {
      this.layoutContainer(this.bunkerArea!, bunkerRect)
      this.simpleBunker?.layout(new Phaser.Geom.Rectangle(0, 0, Math.max(1, bunkerRect.width - 2), Math.max(1, bunkerRect.height - 2)))
      // Синхронизация количества визуальных жителей
      // Используем syncResidentsWithoutDuplicates чтобы не создавать дубликаты
      if (this.simpleBunker && typeof (this.simpleBunker as any).syncResidentsWithoutDuplicates === 'function') {
        (this.simpleBunker as any).syncResidentsWithoutDuplicates(this.bunkerResidents.length + this.bunkerEnemies.length)
      } else {
        this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)
      }
    }

    // Info
    const showInfo = !portrait || (portrait && this.mobileActive === 'info')
    this.personArea?.setVisible(showInfo)
    if (showInfo) {
      this.layoutContainer(this.personArea!, infoRect)
      this.layoutPersonArea(infoRect)
      this.lastPersonRect = infoRect
      // Обновим превью сразу при первом лэйауте
      this.updatePersonInfoFromQueue()
    }

    // People panel (mobile dedicated tab)
    const showPeople = portrait && this.mobileActive === 'people'
    this.peopleArea?.setVisible(showPeople)
    if (showPeople) {
      this.layoutContainer(this.peopleArea!, peopleRect)
      this.buildPeoplePanel(peopleRect)
    }

    // Resources panel (mobile dedicated tab)
    const showResources = portrait && this.mobileActive === 'resources'
    this.resourcesArea?.setVisible(showResources)
    if (showResources) {
      this.layoutContainer(this.resourcesArea!, resourcesRect)
      this.buildResourcesPanel(resourcesRect)
    }
  }

  private layoutPersonArea(rect: Phaser.Geom.Rectangle): void {
    if (!this.personArea || !this.personTop || !this.personBottom) return
    const s = uiScale(this)
    const pad = 8
    const topH = Math.floor(rect.height * 0.5)
    const botH = rect.height - topH

    // Верхняя часть
    this.personTop.setPosition(0, 0)
    // Entrance image fit (contain)
    if (this.personEntranceImage) {
      const img = this.personEntranceImage
      const texW = img.texture.getSourceImage().width || 576
      const texH = img.texture.getSourceImage().height || 324
      const scale = Math.min(Math.max(1, rect.width) / texW, Math.max(1, topH - pad * 2) / texH)
      img.setScale(scale)
      img.setPosition(rect.width / 2, topH / 2)
    }
    // Accept / Deny кнопки
    const btnFont = fs(this, 12)
    const isNight = this.phase === 'night'
    const hasEnemies = this.enemyQueueItems.length > 0
    const hasVisitors = this.queueItems.length > 0
    const capacity = this.getBunkerCapacity()
    const hasCapacity = this.bunkerResidents.length < capacity
    const showAccept = !isNight && !hasEnemies && hasVisitors && hasCapacity
    const showDeny = !isNight && !hasEnemies && hasVisitors
    const showDefense = hasEnemies

    if (this.acceptBtnObj && this.denyBtnObj) {
      this.acceptBtnObj.setVisible(showAccept)
      this.denyBtnObj.setVisible(showDeny)
      
      // Позиционирование Accept/Deny (всегда, независимо от видимости)
      // Устанавливаем размер спрайтов кнопок
      const buttonScale = parseInt(btnFont, 10) / 12 // Масштабируем относительно базового размера 12px
      this.acceptBtnObj.setScale(buttonScale)
      this.denyBtnObj.setScale(buttonScale)
      const space = 24 * s
      const y = topH - pad - this.acceptBtnObj.height / 2
      const totalW = this.acceptBtnObj.width + this.denyBtnObj.width + space
      const startX = rect.width / 2 - totalW / 2
      this.acceptBtnObj.setPosition(startX + this.acceptBtnObj.width / 2, y)
      this.denyBtnObj.setPosition(startX + this.acceptBtnObj.width + space + this.denyBtnObj.width / 2, y)
      // Origin уже установлен в 0.5 при создании
    }

    // Оружие (только ночью, левый нижний угол personTop)
    const wantGun = hasEnemies
    if (wantGun) {
      if (!this.gunSprite) {
        // Получаем начальную текстуру в зависимости от текущего оружия
        const initialTexture = this.getWeaponInitialTexture()
        this.gunSprite = this.add.image(0, 0, initialTexture).setOrigin(0, 1)
        this.gunSprite.setInteractive({ useHandCursor: true })

        // Обработчик нажатия для всех оружий
        this.gunSprite.on('pointerdown', () => {
          if (this.currentWeapon === 'ar') {
            // Для штурмовой винтовки - начинаем отсчет времени для определения клика или удерживания
            this.pointerDownTime = this.time.now
            this.isClickMode = true

            // Запускаем таймер для определения типа взаимодействия (200мс)
            this.clickTimer = this.time.delayedCall(200, () => {
              if (this.isClickMode && this.currentWeapon === 'ar') {
                // Если кнопка все еще удерживается через 200мс - переключаемся в режим автоматического огня
                this.isClickMode = false
                this.startAutoFire()
              }
            })
          } else {
            // Для других оружий - одиночный выстрел
            this.fireWeaponOnce()
          }
        })

        // Обработчик отпускания для всех оружий
        this.gunSprite.on('pointerup', () => {
          if (this.currentWeapon === 'ar') {
            // Останавливаем таймер клика
            if (this.clickTimer) {
              this.clickTimer.remove(false)
              this.clickTimer = undefined
            }

            // Если был быстрый клик - делаем одиночный выстрел
            if (this.isClickMode) {
              this.isClickMode = false
              this.fireWeaponOnce()
            } else {
              // Если был режим автоматического огня - останавливаем его
              this.stopAutoFire()
            }
          }
        })

        // Также останавливаем огонь при уходе курсора с оружия
        this.gunSprite.on('pointerout', () => {
          if (this.currentWeapon === 'ar') {
            // Останавливаем таймер клика
            if (this.clickTimer) {
              this.clickTimer.remove(false)
              this.clickTimer = undefined
            }

            // Останавливаем автоматический огонь
            if (!this.isClickMode) {
              this.stopAutoFire()
            }
            this.isClickMode = false
          }
        })

        this.personTop?.add(this.gunSprite)
      }

      // Обновляем размер спрайта в зависимости от текущего оружия
      const displaySize = this.getWeaponDisplaySize()
      this.gunSprite.setDisplaySize(displaySize.width, displaySize.height)
      const gx = pad
      const gy = topH - pad
      this.gunSprite.setPosition(gx, gy)
      this.gunSprite.setVisible(true)
    } else {
      // Скрываем, но оставляем объект, чтобы появлялся снова при новых врагах
      if (this.gunSprite) {
        // Останавливаем все взаимодействия с AR при скрытии оружия
        if (this.isAutoFiring) {
          this.stopAutoFire()
        }
        if (this.clickTimer) {
          this.clickTimer.remove(false)
          this.clickTimer = undefined
        }
        this.isClickMode = false

        this.gunSprite.setVisible(false)
      }
    }

    // Превью текущего персонажа или врага
    if (this.personPreview) {
      const showPreview = hasEnemies || (!isNight && hasVisitors)
      this.personPreview.setVisible(showPreview)
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(showPreview)
      if (showPreview) {
        const s = uiScale(this)
        const baseW = 48, baseH = 64
        let pw = Math.round(baseW * s)
        let ph = Math.round(baseH * s)
        // Вписываем по высоте в доступную область: topH - высота кнопок - отступы
        const btnH = (this.acceptBtnObj ? this.acceptBtnObj.height : 16)
        const availableH = Math.max(16, topH - pad - btnH - 8)
        const aspect = baseW / baseH
        if (ph > availableH) {
          ph = Math.floor(availableH)
          pw = Math.max(8, Math.floor(ph * aspect))
        }
        // Подгон по ширине, чтобы не выходил за края
        if (pw > rect.width - pad * 2) {
          pw = Math.floor(rect.width - pad * 2)
          ph = Math.max(8, Math.floor(pw / aspect))
        }
        this.personPreview.setSize(pw, ph)
        this.personPreview.setOrigin(0.5, 1)
        // Центр контейнера по X, дно над кнопками
        const bottom = topH - pad - btnH - 6
        let x = Math.round(rect.width / 2)
        let y = Math.round(bottom)
        // Кламп внутри границ верхнего блока
        const minX = Math.ceil(pw / 2)
        const maxX = Math.floor(rect.width - pw / 2)
        if (x < minX) x = minX
        if (x > maxX) x = maxX
        if (y > topH - pad) y = topH - pad
        if (y < ph) y = ph
        this.personPreview.setPosition(x, y)
        if (this.personPreviewSprite) {
          // Подгоняем спрайт под рамку и позицию
          this.personPreviewSprite.setVisible(true)
          this.personPreviewSprite.setPosition(x, y)
          const scaleX = (pw / 80) * 2.25
          const scaleY = (ph / 64) * 2.25
          this.personPreviewSprite.setScale(scaleX, scaleY)
          this.personPreviewShirt?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewPants?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewFootwear?.setPosition(x, y).setScale(scaleX, scaleY)
          this.personPreviewHair?.setPosition(x, y).setScale(scaleX, scaleY)
          if (this.personTop) {
            if (this.personPreviewSprite.parentContainer !== this.personTop) this.personTop.add(this.personPreviewSprite)
            this.personTop.bringToTop(this.personPreviewSprite)
            if (this.personPreviewShirt) this.personTop.bringToTop(this.personPreviewShirt)
            if (this.personPreviewPants) this.personTop.bringToTop(this.personPreviewPants)
            if (this.personPreviewFootwear) this.personTop.bringToTop(this.personPreviewFootwear)
            if (this.personPreviewHair) this.personTop.bringToTop(this.personPreviewHair)
          }
        }
        // Убедимся, что превью — дочерний элемент personTop и на верхнем слое
        if (this.personTop && this.personPreview) {
          if (this.personPreview.parentContainer !== this.personTop) {
            this.personTop.add(this.personPreview)
          }
          // Красную плашку поднимаем только если показываем врага без спрайта (устанавливается ниже)
        }
        // Полоса HP врага над превью, если есть враги
        const hasEnemiesNow = this.enemyQueueItems.length > 0
        if (hasEnemiesNow) {
          const firstEnemy: any = this.enemyQueueItems[0]
          const maxHp = firstEnemy?.maxHp ?? 0
          const hp = firstEnemy?.hp ?? 0
          const topY = y - ph
          const barW = Math.max(24, Math.floor(pw * 0.8))
          const barH = 6
          const bx = Math.round(x - barW / 2)
          const by = Math.round(topY - 8)
          if (!this.enemyHpBg) {
            this.enemyHpBg = this.add.rectangle(bx, by, barW, barH, 0x111214, 0.9).setOrigin(0, 0)
            this.personTop.add(this.enemyHpBg)
          }
          if (!this.enemyHpFg) {
            this.enemyHpFg = this.add.rectangle(bx, by, barW, barH, 0xe53935, 0.95).setOrigin(0, 0)
            this.personTop.add(this.enemyHpFg)
          }
          this.enemyHpBg.setVisible(true)
          this.enemyHpFg.setVisible(true)
          this.enemyHpBg.setPosition(bx, by); this.enemyHpBg.setSize(barW, barH)
          const frac = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 1
          this.enemyHpFg.setPosition(bx, by); this.enemyHpFg.setSize(Math.max(0, Math.floor(barW * frac)), barH)
          this.personTop.bringToTop(this.enemyHpBg)
          this.personTop.bringToTop(this.enemyHpFg)
        } else {
          // Нет врагов — скрываем только HP-бар, не трогаем слои превью жителей
          this.enemyHpBg?.setVisible(false)
          this.enemyHpFg?.setVisible(false)
          // Не сбрасываем fill/visibility превью здесь, это делает updatePersonInfoFromQueue
        }
      }
    }

    // Плашка нет мест
    if (this.noSpaceLabel) {
      const showNoSpace = !isNight && !hasEnemies && hasVisitors && !hasCapacity
      this.noSpaceLabel.setVisible(showNoSpace)
      if (showNoSpace) {
        const msg = (t('НЕТ МЕСТ') ?? 'НЕТ МЕСТ') + ` (${this.bunkerResidents.length}/${capacity})`
        this.noSpaceLabel.setText(msg)
        const y = topH - pad - parseInt(btnFont, 10) / 2
        this.noSpaceLabel.setPosition(rect.width / 2, y-20)
      }
    }

    // Нижняя часть
    this.personBottom.setPosition(0, topH)
    if (this.personNameText && this.personDetailsText && this.personSkillText) {
      const showPersonDetails = hasVisitors || hasEnemies

      this.personNameText.setVisible(showPersonDetails)
      this.personDetailsText.setVisible(showPersonDetails)
      this.personSkillText.setVisible(showPersonDetails)

      // Инвентарь показываем только когда есть конкретный житель для показа
      const hasCurrentPerson = this.queueItems.length > 0 || this.enemyQueueItems.length > 0
      if (this.personPreviewInventory) {
        this.personPreviewInventory.setVisible(showPersonDetails && !isNight && hasCurrentPerson)
      }
      const nameFont = fs(this, 12)
      const detailsFont = fs(this, 11)
      this.personNameText.setFontSize(nameFont)
      this.personNameText.setPosition(pad, pad)
      this.personDetailsText.setFontSize(detailsFont)
      this.personDetailsText.setPosition(pad, pad + this.personNameText.height + 6)
      this.personDetailsText.setWordWrapWidth(Math.max(1, rect.width - pad * 2))
      this.personSkillText.setFontSize(detailsFont)
      this.personSkillText.setPosition(pad, this.personDetailsText.y + this.personDetailsText.height + 6)
      this.personSkillText.setWordWrapWidth(Math.max(1, rect.width - pad * 2))

      // Позиционирование инвентаря
      if (this.personPreviewInventory) {
        const minSpacing = 30 // Еще большее расстояние между элементами (margin-top)
        const inventoryHeight = 64 // Высота одного слота (увеличена в 2 раза)
        const skillTextBottom = this.personSkillText.y + this.personSkillText.height
        const availableHeight = rect.height - pad - skillTextBottom - minSpacing

        // Проверяем, есть ли достаточно места для инвентаря (минимум 64px высоты)
        if (availableHeight >= inventoryHeight) {
          // Инвентарь помещается, устанавливаем позицию ниже текста навыков с margin-top
          const inventoryY = skillTextBottom + minSpacing

          // Центрируем инвентарь по ширине контейнера
          const slotSize = 56 // Увеличенный размер слота (в 2 раза)
          const slotSpacing = 6 // Увеличенное расстояние между слотами
          const totalSlotsWidth = 3 * slotSize + 2 * slotSpacing // Ширина всех слотов с отступами
          const containerWidth = rect.width - pad * 2
          const startX = pad + (containerWidth - totalSlotsWidth) / 2 // Центрируем по ширине

          this.personPreviewInventory.setPosition(startX, inventoryY)
          this.personPreviewInventory.setVisible(true)

          // Позиционирование слотов инвентаря в одну строку
          const inventorySlots = this.personPreviewInventory.list as Phaser.GameObjects.Container[]

          inventorySlots.forEach((slot, index) => {
            if (index < 3) {
              // Позиционируем слот в центрированной строке
              const slotX = index * (slotSize + slotSpacing)
              const slotY = 0

              slot.setPosition(slotX, slotY)
              slot.setVisible(true)

              // Устанавливаем правильный размер слота
              const children = slot.list as Phaser.GameObjects.GameObject[]
              const bg = children[0] as Phaser.GameObjects.Rectangle
              if (bg) {
                bg.setSize(slotSize, slotSize)
              }
            } else {
              // Скрываем лишние слоты
              slot.setVisible(false)
            }
          })
        } else {
          // Инвентарь не помещается, скрываем его
          this.personPreviewInventory.setVisible(false)
        }
      }

      // Позиционирование текста подсказки предмета
      if (this.itemTooltipText) {
        console.log(`[layoutPersonArea] Позиционируем текст подсказки`)
        this.itemTooltipText.setVisible(false) // Скрываем по умолчанию
        console.log(`[layoutPersonArea] Текст подсказки скрыт, позиция: x=${this.itemTooltipText.x}, y=${this.itemTooltipText.y}`)
      } else {
        console.log(`[layoutPersonArea] itemTooltipText не найден`)
      }
    }

    // Рамка превью скрыта, не отображаем отладочную информацию
  }

  // ======== Очередь посетителей на поверхности ========
  private seedInitialVisitors(count: number): void {
    for (let i = 0; i < count; i++) {
      // Имитируем прибытие жителя с анимацией через maybeArriveVisitor
      // но с задержкой, чтобы каждый житель появился с интервалом
      this.time.delayedCall(i * 8000, () => {
        if (this.queueItems.length < count) {
          // Используем обычную логику прибытия с анимацией
          this.maybeArriveVisitor()
        }
      })
    }
  }

  private maybeArriveVisitor(): void {
    if (this.phase !== 'day') return
    // Если есть враги — люди не приходят
    if (this.enemyQueueItems.length > 0) return
    
    // Проверяем размер очереди жителей
    if (this.queueItems.length >= this.MAX_QUEUE_SIZE) {
      console.log(`[maybeArriveVisitor] Очередь жителей заполнена (${this.queueItems.length}/${this.MAX_QUEUE_SIZE}), новых жителей не добавляем`)
      return
    }
    
    console.log(`[maybeArriveVisitor] Приходит житель. Сложность: ${this.difficulty}, День: ${this.dayNumber}, Комфорт: ${this.comfort}%, Размер очереди жителей: ${this.queueItems.length + 1}/${this.MAX_QUEUE_SIZE}`)
    
    // Приходит обычный житель
    const v = this.enqueueVisitor(true)
    if (!this.lastSurfaceRect || !v) return
    const rect = this.lastSurfaceRect
    const positions = this.getQueuePositions(this.queueItems.length, rect)
    const idx = this.queueItems.length - 1
    const target = positions[idx]
    const startX = -40
    v.rect.setPosition(startX, target.y)
    if (v.sprite) {
      v.sprite.setPosition(startX, target.y)
      const textureKey = v.sprite.texture?.key || ''
      if (isSpecialistSprite(textureKey)) {
        // Спрайт специализации: смотрит вправо по умолчанию, движется направо к входу
        v.sprite.setFlipX(false)
        const data = this.getPersonData(v.id)
        const profession = data.profession.toLowerCase()
        try { v.sprite.anims.play(`${profession}_walk`, true) } catch {}
      } else {
        // Старые спрайты: бежит направо к входу
      v.sprite.setFlipX(true)
        try { v.sprite.anims.play(`${textureKey}_run`, true) } catch {}
      }
    }
    if (v.shirt) { v.shirt.setPosition(startX, target.y); v.shirt.setFlipX(true); try { v.shirt.anims.play(`${v.shirt.texture.key}_run`, true) } catch {} }
    if (v.pants) { v.pants.setPosition(startX, target.y); v.pants.setFlipX(true); try { v.pants.anims.play(`${v.pants.texture.key}_run`, true) } catch {} }
    if (v.footwear) { v.footwear.setPosition(startX, target.y); v.footwear.setFlipX(true); try { v.footwear.anims.play(`${v.footwear.texture.key}_run`, true) } catch {} }
    if (v.hair) { v.hair.setPosition(startX, target.y); v.hair.setFlipX(true); try { v.hair.anims.play(`${v.hair.texture.key}_run`, true) } catch {} }
    this.tweens.add({ targets: [v.rect, v.sprite!, v.shirt!, v.pants!, v.footwear!, v.hair!], x: target.x, duration: 6000, ease: 'Sine.easeOut', onComplete: () => {
      if (v.sprite) {
        // Определяем тип по изначальному specialistSpriteKey, а не по текущей текстуре анимации
        const data = this.getPersonData(v.id)
        const profession = data.profession.toLowerCase()
        const specialistSpriteKey = getSpecialistSpriteKey(profession)
        
        if (specialistSpriteKey) {
          // Для спрайтов специализаций используем имя профессии
          try { v.sprite.anims.play(`${profession}_idle`, true) } catch {}
        } else {
          // Для старых спрайтов используем texture key (но для них нужен базовый ключ)
        const skin = v.sprite.texture.key
        try { v.sprite.anims.play(`${skin}_idle`, true) } catch {}
        }
      }
      if (v.shirt) { try { v.shirt.anims.play(`${v.shirt.texture.key}_idle`, true) } catch {} }
      if (v.pants) { try { v.pants.anims.play(`${v.pants.texture.key}_idle`, true) } catch {} }
      if (v.footwear) { try { v.footwear.anims.play(`${v.footwear.texture.key}_idle`, true) } catch {} }
      if (v.hair) { try { v.hair.anims.play(`${v.hair.texture.key}_idle`, true) } catch {} }
      
      // Обновляем превью только после завершения анимации прибытия
      this.updatePersonInfoFromQueue()
    } })
  }

  private computeVisitorArrivalDelay(): number {
    let base = 5000
    switch (this.difficulty) {
      case 'easy':
        base = 3000 // Жители приходят чаще на легкой сложности
        break
      case 'normal':
        base = 5000 // Стандартный интервал
        break
      case 'hard':
        base = 8000 // Жители приходят реже на сложной сложности
        break
      default:
        base = 5000
    }
    
    // Влияние комфорта на интервал прихода жителей
    // Чем выше комфорт, тем чаще приходят жители
    const comfortFactor = Math.max(0.3, 1 - (this.comfort / 100) * 0.4)
    base *= comfortFactor
    
    // Влияние количества дней на интервал прихода жителей
    // С каждым днем жители приходят реже
    const dayFactor = Math.max(0.5, 1 + (this.dayNumber - 1) * 0.1)
    base *= dayFactor
    
    const jitter = Phaser.Math.Clamp(Phaser.Math.FloatBetween(0.6, 1.5), 0.6, 1.5)
    const minDelay = 1800
    const delay = Math.max(minDelay, Math.floor(base * jitter))
    
    console.log(`[computeVisitorArrivalDelay] Сложность: ${this.difficulty}, День: ${this.dayNumber}, Комфорт: ${this.comfort}%, Базовая задержка: ${base}ms, Финальная задержка: ${delay}ms`)
    
    return delay
  }



  /**
   * Проверяет возможность возобновления логики прихода персонажей
   * Вызывается когда персонаж покидает очередь
   */
  private checkAndResumeArrivals(): void {
    // Проверяем очереди отдельно для жителей и врагов
    
    // Для жителей (только днем)
    if (this.phase === 'day' && this.queueItems.length < this.MAX_QUEUE_SIZE && !this.arrivalEvent) {
      console.log(`[checkAndResumeArrivals] Очередь жителей освободилась (${this.queueItems.length}/${this.MAX_QUEUE_SIZE}), планируем новое прибытие`)
      this.scheduleVisitorArrival()
    }
    
    // Для врагов (только ночью)
    if (this.phase === 'night' && this.enemyQueueItems.length < this.MAX_QUEUE_SIZE && !this.enemyArrivalEvent) {
      console.log(`[checkAndResumeArrivals] Очередь врагов освободилась (${this.enemyQueueItems.length}/${this.MAX_QUEUE_SIZE}), планируем новое прибытие`)
      this.scheduleEnemyArrival()
    }
  }

  /**
   * Получает информацию о балансе врагов и жителей в бункере
   */
  public getBunkerBalanceInfo(): { residents: number; enemies: number; canEnemiesEnter: boolean; balanceStatus: string } {
    const residents = this.bunkerResidents.length
    const enemies = this.bunkerEnemies.length
    const canEnemiesEnter = enemies < residents
    
    let balanceStatus = 'Сбалансирован'
    if (enemies === 0) {
      balanceStatus = 'Безопасен'
    } else if (enemies < residents) {
      balanceStatus = 'Под контролем'
    } else if (enemies === residents) {
      balanceStatus = 'Критический баланс'
    } else {
      balanceStatus = 'Переполнен врагами!'
    }
    
    return {
      residents,
      enemies,
      canEnemiesEnter,
      balanceStatus
    }
  }

  /**
   * Разблокирует врагов в очереди, если появилось место в бункере
   */
  private unblockEnemiesIfPossible(): void {
    if (this.bunkerEnemies.length < this.bunkerResidents.length) {
      let unblockedCount = 0
      
      // Проходим по всем врагам в очереди и разблокируем их
      this.enemyQueueItems.forEach(enemy => {
        if (enemy.blockedFromEntry) {
          enemy.blockedFromEntry = false
          unblockedCount++
          console.log(`[unblockEnemiesIfPossible] Враг ${enemy.type} разблокирован`)
        }
      })
      
      if (unblockedCount > 0) {
        console.log(`[unblockEnemiesIfPossible] Разблокировано ${unblockedCount} врагов`)
        this.showToast(`Враги в очереди разблокированы!`)
      }
    }
  }

  /**
   * Удаляет врага из бункера при смерти
   */
  public removeEnemyFromBunker(id: number, reason?: string): void {
    const idx = this.bunkerEnemies.findIndex(e => e.id === id)
    if (idx >= 0) {
      const [enemy] = this.bunkerEnemies.splice(idx, 1)
      console.log(`[GameScene] Удаляем мертвого врага ${enemy.name} (ID: ${enemy.id}) из bunkerEnemies: ${reason}`)
      
      // Синхронизируем с SimpleBunkerView - удаляем агента врага
      if (this.simpleBunker) {
        try {
          this.simpleBunker.removeEnemyAgent(id)
          console.log(`[removeEnemyFromBunker] Агент врага ${enemy.name} удален из SimpleBunkerView`)
        } catch (error) {
          console.error(`[removeEnemyFromBunker] Ошибка при удалении агента врага из SimpleBunkerView:`, error)
        }
      }
      
      // Обновляем визуальное отображение бункера
      this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)
      
      // Обновляем счетчик населения
      this.updateAllResources()
      
      // Начисляем опыт за убийство врага внутри бункера
      const experienceReward = this.getEnemyExperienceReward(enemy.enemyType)
      this.awardExperience(`убийство ${enemy.enemyType} в бункере`, experienceReward)
      
      // Показываем уведомление о смерти врага
      this.showToast(`💀 Враг ${enemy.enemyType} уничтожен: ${reason}`)
      
      // Проверяем возможность разблокировки врагов в очереди
      this.unblockEnemiesIfPossible()
    }
  }

  // scheduleVisitorArrival уже определён выше (динамический, с джиттером)
  
  // Обрабатываем здоровье жителей и врагов каждый час
  private processResidentHealthHourly(hour: number): void {
    console.log(`[processResidentHealthHourly] Час ${hour}: Начинаем обработку здоровья ${this.bunkerResidents.length} жителей`)
    
    if (this.bunkerResidents.length === 0) {
      console.log(`[processResidentHealthHourly] Час ${hour}: Нет жителей для обработки`)
      return
    }
    
    // Обрабатываем здоровье жителей
    this.bunkerResidents.forEach(resident => {
      // Логируем только если есть изменения здоровья
      const hasIncurableDisease = this.hasSkill(resident.skills, 'неизлечимая болезнь')
      const hasInfected = this.hasSkill(resident.skills, 'зараженный')
      const hasStrongImmunity = this.hasSkill(resident.skills, 'крепкий иммунитет')
      const isSleeping = this.simpleBunker ? 
        (this.simpleBunker.getResidentAgentById(resident.id)?.sleeping || false) : false
      
      if (hasIncurableDisease || hasInfected || hasStrongImmunity || isSleeping) {
        console.log(`[processResidentHealthHourly] Час ${hour}: ${resident.name} (${resident.profession}) - Здоровье: ${resident.health || 100}%, Навыки: ${resident.skills.map(s => s.text).join(', ')}, Спит: ${isSleeping}`)
        console.log(`[processResidentHealthHourly] Навыки: ${resident.skills.map(s => `${s.text}(${s.positive ? '+' : '-'})`).join(', ')}`)
      }
      
      // Проверяем навыки жителя (переменные уже объявлены выше)
      
      // Жители с неизлечимой болезнью теряют 1% здоровья каждый час
      if (hasIncurableDisease) {
        const oldHealth = resident.health || 100
        resident.health = Math.max(0, oldHealth - 1)
        
                         if (oldHealth !== resident.health) {
                   console.log(`[processResidentHealthHourly] 🦠 ${resident.name} теряет здоровье от неизлечимой болезни: ${oldHealth}% → ${resident.health}%`)
                   
                   // Синхронизируем здоровье с bunkerView агентом
                   if (this.simpleBunker) {
                     const residentAgent = this.simpleBunker.getResidentAgentById(resident.id)
                     if (residentAgent) {
                       residentAgent.health = resident.health
                     }
                   }
                 }
        
        // Если здоровье упало до 0, житель умирает
        if (resident.health <= 0) {
          console.log(`[processResidentHealthHourly] 💀 Житель ${resident.name} умирает от неизлечимой болезни!`)
          this.removeDeadResident(resident.id, 'неизлечимая болезнь')
          return
        }
      }
      
      // Жители с заражением теряют 1% здоровья каждый час
      if (hasInfected) {
        const oldHealth = resident.health || 100
        resident.health = Math.max(0, oldHealth - 1)
        
                         if (oldHealth !== resident.health) {
                   console.log(`[processResidentHealthHourly] 🦠 ${resident.name} теряет здоровье от заражения: ${oldHealth}% → ${resident.health}%`)
                   
                   // Синхронизируем здоровье с bunkerView агентом
                   if (this.simpleBunker) {
                     const residentAgent = this.simpleBunker.getResidentAgentById(resident.id)
                     if (residentAgent) {
                       residentAgent.health = resident.health
                     }
                   }
                 }
        
        // Если здоровье упало до 0, житель умирает
        if (resident.health <= 0) {
          console.log(`[processResidentHealthHourly] 💀 Житель ${resident.name} умирает от заражения!`)
          this.removeDeadResident(resident.id, 'заражение')
          return
        }
      }
      
      // Жители с крепким иммунитетом восстанавливают 1% здоровья каждый час (если здоровье неполное)
      if (hasStrongImmunity && (resident.health || 100) < 100) {
        const oldHealth = resident.health || 100
        resident.health = Math.min(100, oldHealth + 1)
        
        if (oldHealth !== resident.health) {
          console.log(`[processResidentHealthHourly] 🛡️ ${resident.name} восстанавливает здоровье от крепкого иммунитета: ${oldHealth}% → ${resident.health}%`)
          
          // Синхронизируем здоровье с bunkerView агентом
          if (this.simpleBunker) {
            const residentAgent = this.simpleBunker.getResidentAgentById(resident.id)
            if (residentAgent) {
              residentAgent.health = resident.health
            }
          }
        }
      }
      
      // Жители восстанавливают 1% здоровья каждый час во сне (если нет неизлечимой болезни и заражения)
      if (!hasIncurableDisease && !hasInfected) {
        // Проверяем, спит ли житель (через bunkerView)
        if (this.simpleBunker) {
          const residentAgent = this.simpleBunker.getResidentAgentById(resident.id)
          if (residentAgent && residentAgent.sleeping) {
            const oldHealth = resident.health || 100
            resident.health = Math.min(100, oldHealth + 1)
            
                                 if (oldHealth !== resident.health) {
                       console.log(`[processResidentHealthHourly] 😴 ${resident.name} восстанавливает здоровье во сне: ${oldHealth}% → ${resident.health}%`)
                       
                       // Синхронизируем здоровье с bunkerView агентом
                       if (this.simpleBunker) {
                         const residentAgent = this.simpleBunker.getResidentAgentById(resident.id)
                         if (residentAgent) {
                           residentAgent.health = resident.health
                         }
                       }
                     }
          }
        }
      }
      
      // Обновляем UI если открыто модальное окно с деталями жителя
      this.updateResidentDetailsUI(resident.id)
      
      // Логируем финальное состояние здоровья для жителей с особыми навыками
      if (hasIncurableDisease || hasInfected || hasStrongImmunity || isSleeping) {
        console.log(`[processResidentHealthHourly] Финальное здоровье ${resident.name}: ${resident.health || 100}%`)
      }
    })
    
    // Обрабатываем здоровье врагов (если у них есть навыки в будущем)
    this.bunkerEnemies.forEach(enemy => {
      // Пока у врагов нет навыков, но можно добавить в будущем
      // Например, зомби могут регенерировать здоровье, а мутанты - терять
      
      // Обновляем UI если открыто модальное окно с деталями врага
      // (пока не реализовано, но можно добавить)
    })
    
    console.log(`[processResidentHealthHourly] Час ${hour}: Обработка здоровья завершена`)
    
    // Проверяем, что жители действительно изменились
    this.bunkerResidents.forEach(resident => {
      if (resident.health !== undefined && resident.health !== 100) {
        console.log(`[processResidentHealthHourly] Житель ${resident.name} имеет здоровье: ${resident.health}%`)
      }
    })
  }

  // Обрабатываем лечение от докторов каждый час
  private processDoctorHealing(hour: number): void {
    console.log(`[processDoctorHealing] Час ${hour}: Начинаем обработку лечения от докторов`)
    
    if (this.bunkerResidents.length === 0) {
      console.log(`[processDoctorHealing] Час ${hour}: Нет жителей для лечения`)
      return
    }
    
    // Находим всех докторов в бункере
    const doctors = this.bunkerResidents.filter(resident => 
      resident.profession === 'доктор' || resident.profession === 'врач'
    )
    
    if (doctors.length === 0) {
      console.log(`[processDoctorHealing] Час ${hour}: Нет докторов в бункере`)
      return
    }
    
    console.log(`[processDoctorHealing] Час ${hour}: Найдено ${doctors.length} докторов`)
    
    // Находим жителей, которые могут быть вылечены (неполное здоровье, но не неизлечимо больные и не зараженные)
    const healableResidents = this.bunkerResidents.filter(resident => {
      const hasIncurableDisease = this.hasSkill(resident.skills, 'неизлечимая болезнь')
      const hasInfected = this.hasSkill(resident.skills, 'зараженный')
      const hasIncompleteHealth = (resident.health || 100) < 100
      
      return !hasIncurableDisease && !hasInfected && hasIncompleteHealth
    })
    
    if (healableResidents.length === 0) {
      console.log(`[processDoctorHealing] Час ${hour}: Нет жителей для лечения`)
      return
    }
    
    console.log(`[processDoctorHealing] Час ${hour}: Найдено ${healableResidents.length} жителей для лечения`)
    
    // Каждый доктор может вылечить одного жителя в час
    doctors.forEach((doctor, doctorIndex) => {
      // Проверяем, работает ли доктор в данный момент
      const isDoctorWorking = this.simpleBunker ? 
        (this.simpleBunker.getResidentAgentById(doctor.id)?.scheduleState === 'work') : false
      
      if (isDoctorWorking) {
        console.log(`[processDoctorHealing] Час ${hour}: Доктор ${doctor.name} работает и может лечить`)
        
        // Ищем жителя для лечения (приоритет тем, у кого меньше здоровья)
        healableResidents.sort((a, b) => (a.health || 100) - (b.health || 100))
        
        // Берем первого жителя с наименьшим здоровьем
        const patientToHeal = healableResidents[0]
        
        if (patientToHeal) {
          const oldHealth = patientToHeal.health || 100
          patientToHeal.health = Math.min(100, oldHealth + 1)
          
          console.log(`[processDoctorHealing] Час ${hour}: Доктор ${doctor.name} лечит ${patientToHeal.name}: ${oldHealth}% → ${patientToHeal.health}%`)
          
          // Синхронизируем здоровье с bunkerView агентом
          if (this.simpleBunker) {
            const residentAgent = this.simpleBunker.getResidentAgentById(patientToHeal.id)
            if (residentAgent) {
              residentAgent.health = patientToHeal.health
            }
          }
          
          // Обновляем UI если открыто модальное окно
          this.updateResidentDetailsUI(patientToHeal.id)
          
          // Убираем вылеченного жителя из списка для лечения
          const patientIndex = healableResidents.indexOf(patientToHeal)
          if (patientIndex > -1) {
            healableResidents.splice(patientIndex, 1)
          }
        }
      } else {
        console.log(`[processDoctorHealing] Час ${hour}: Доктор ${doctor.name} не работает (scheduleState: ${this.simpleBunker ? this.simpleBunker.getResidentAgentById(doctor.id)?.scheduleState : 'неизвестно'})`)
      }
    })
    
    console.log(`[processDoctorHealing] Час ${hour}: Обработка лечения завершена`)
  }

  private enqueueVisitor(createOnly = false): { id: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite } | null {
    if (!this.surfaceQueue) return null
    const id = this.nextVisitorId++
    console.log('[enqueueVisitor] id=', id, 'day=', this.dayNumber, 'clock=', this.getClockText())
    
    // Показываем уведомление о прибытии посетителя
    const data = this.getPersonData(id)
    this.showToast(`Прибыл посетитель: ${data.name} (${data.profession})`)
    const box = this.add.rectangle(0, 0, 84, 108, 0x000000, 0).setOrigin(0, 1)
    box.setStrokeStyle(2, 0x4fc3f7, 1.0)
    box.setVisible(true)
    // Создаем спрайт по специализации или оставляем рамку
    const profession = data.profession.toLowerCase()
    const specialistSpriteKey = getSpecialistSpriteKey(profession)
    
    let sprite = undefined
    let shirt = undefined 
    let pants = undefined
    let footwear = undefined
    let hair = undefined
    
    if (specialistSpriteKey) {
      // Создаем спрайт для специализации
      ensureSpecialistAnimations(this, profession)
      sprite = this.add.sprite(0, 0, specialistSpriteKey, 0).setOrigin(0, 1)
      sprite.setDepth(100) // Устанавливаем depth для спрайтов в очереди
      sprite.anims.play(`${profession}_idle`)
      // Масштабируем спрайт 128x128 под размер рамки (28x36), увеличенный в 3 раза
      const scaleX = (28 / 128) * 4
      const scaleY = (36 / 128) * 4
      sprite.setScale(scaleX, scaleY)
      this.surfaceQueue.add(sprite)
      // Скрываем рамку когда показываем спрайт
    box.setVisible(false)
    }
    const item = { id, rect: box, sprite, shirt, pants, footwear, hair }
    this.queueItems.push(item)
    this.surfaceQueue.add(box)
    if (!createOnly && this.lastSurfaceRect) this.layoutQueue(this.lastSurfaceRect)
    // updatePersonInfoFromQueue будет вызван после завершения анимации прибытия
    return item
  }

  private getQueuePositions(n: number, surfaceRect: Phaser.Geom.Rectangle): { x: number; y: number }[] {
    const pad = 10
    const gap = 24 // Увеличено в 3 раза (8 * 3)
    const w = 84  // Увеличено в 3 раза (28 * 3)
    const h = 108 // Увеличено в 3 раза (36 * 3)
    const rightmostX = surfaceRect.width - pad - w
    const y = surfaceRect.height - pad
    const pos: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const x = rightmostX - i * (w + gap)
      pos.push({ x, y })
    }
    return pos
  }

  private layoutQueue(surfaceRect: Phaser.Geom.Rectangle, smooth = false): void {
    this.lastSurfaceRect = surfaceRect
    if (!this.surfaceQueue) return
    const positions = this.getQueuePositions(this.queueItems.length, surfaceRect)
    this.queueItems.forEach((item, i) => {
      if (item.exiting) return
      const p = positions[i]
      
      if (smooth) {
        // Плавное перемещение с анимацией
        this.smoothMoveVisitorToPosition(item, p)
      } else {
        // Мгновенное перемещение (как раньше)
      item.rect.setPosition(p.x, p.y)
      if (item.sprite) {
        item.sprite.setPosition(p.x, p.y)
        // Определяем тип спрайта и устанавливаем правильную ориентацию
                const textureKey = item.sprite.texture?.key || ''
        const data = this.getPersonData(item.id)
        const profession = data.profession.toLowerCase()
        
                        if (isSpecialistSprite(textureKey)) {
          // Все спрайты специализаций в очереди должны смотреть вправо к входу
          item.sprite.setFlipX(false)
          // Проигрываем анимацию idle для специализации
          try { item.sprite.anims.play(`${profession}_idle`, true) } catch {}
        } else {
          // Старые спрайты: стоят лицом к входу (вправо)
        item.sprite.setFlipX(true)
          if (textureKey) {
            try { item.sprite.anims.play(`${textureKey}_idle`, true) } catch {}
          }
        }
      }
      if (item.shirt) { item.shirt.setPosition(p.x, p.y); item.shirt.setFlipX(true); try { item.shirt.anims.play(`${item.shirt.texture.key}_idle`, true) } catch {} }
      if (item.pants) { item.pants.setPosition(p.x, p.y); item.pants.setFlipX(true); try { item.pants.anims.play(`${item.pants.texture.key}_idle`, true) } catch {} }
      if (item.footwear) { item.footwear.setPosition(p.x, p.y); item.footwear.setFlipX(true); try { item.footwear.anims.play(`${item.footwear.texture.key}_idle`, true) } catch {} }
      if (item.hair) { item.hair.setPosition(p.x, p.y); item.hair.setFlipX(true); try { item.hair.anims.play(`${item.hair.texture.key}_idle`, true) } catch {} }
      if (item.shirt) { item.shirt.setPosition(p.x, p.y); item.shirt.setFlipX(true); try { item.shirt.anims.play(`${item.shirt.texture.key}_idle`, true) } catch {} }
      if (item.pants) { item.pants.setPosition(p.x, p.y); item.pants.setFlipX(true); try { item.pants.anims.play(`${item.pants.texture.key}_idle`, true) } catch {} }
      if (item.footwear) { item.footwear.setPosition(p.x, p.y); item.footwear.setFlipX(true); try { item.footwear.anims.play(`${item.footwear.texture.key}_idle`, true) } catch {} }
      }
    })
  }

  private smoothMoveVisitorToPosition(item: any, targetPos: { x: number; y: number }): void {
    const currentX = item.rect.x
    const currentY = item.rect.y
    const distance = Math.abs(targetPos.x - currentX)
    
    // Если расстояние маленькое, делаем мгновенное перемещение
    if (distance < 10) {
      item.rect.setPosition(targetPos.x, targetPos.y)
      if (item.sprite) item.sprite.setPosition(targetPos.x, targetPos.y)
      if (item.shirt) item.shirt.setPosition(targetPos.x, targetPos.y)
      if (item.pants) item.pants.setPosition(targetPos.x, targetPos.y)
      if (item.footwear) item.footwear.setPosition(targetPos.x, targetPos.y)
      if (item.hair) item.hair.setPosition(targetPos.x, targetPos.y)
      return
    }
    
    // Определяем направление движения
    const movingLeft = targetPos.x < currentX
    
    // Запускаем walk анимацию
    if (item.sprite) {
      try {
        const data = this.getPersonData(item.id)
        const profession = data.profession.toLowerCase()
        const specialistSpriteKey = getSpecialistSpriteKey(profession)
        
        if (specialistSpriteKey) {
          // Для спрайтов специализаций
          ensureSpecialistAnimations(this, profession)
          item.sprite.anims.play(`${profession}_walk`, true)
        } else {
          // Для старых многослойных спрайтов
          const textureKey = item.sprite.texture?.key || ''
          if (textureKey) {
            try { item.sprite.anims.play(`${textureKey}_walk`, true) } catch {}
          }
        }
        
        // Поворачиваем спрайт в направлении движения
        item.sprite.setFlipX(movingLeft)
      } catch {}
    }
    
    // Анимации для слоев одежды (старая система)
    if (item.shirt) {
      try { item.shirt.anims.play(`${item.shirt.texture.key}_walk`, true) } catch {}
      item.shirt.setFlipX(movingLeft)
    }
    if (item.pants) {
      try { item.pants.anims.play(`${item.pants.texture.key}_walk`, true) } catch {}
      item.pants.setFlipX(movingLeft)
    }
    if (item.footwear) {
      try { item.footwear.anims.play(`${item.footwear.texture.key}_walk`, true) } catch {}
      item.footwear.setFlipX(movingLeft)
    }
    if (item.hair) {
      try { item.hair.anims.play(`${item.hair.texture.key}_walk`, true) } catch {}
      item.hair.setFlipX(movingLeft)
    }
    
    // Анимируем перемещение
    const duration = Math.min(4800, distance * 16) // Скорость зависит от расстояния, очень медленно
    const targets = [item.rect]
    if (item.sprite) targets.push(item.sprite)
    if (item.shirt) targets.push(item.shirt)
    if (item.pants) targets.push(item.pants)
    if (item.footwear) targets.push(item.footwear)
    if (item.hair) targets.push(item.hair)
    
    this.tweens.add({
      targets,
      x: targetPos.x,
      y: targetPos.y,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // Возвращаемся к idle анимации
        if (item.sprite) {
          try {
            const data = this.getPersonData(item.id)
            const profession = data.profession.toLowerCase()
            const specialistSpriteKey = getSpecialistSpriteKey(profession)
            
            if (specialistSpriteKey) {
              // Для спрайтов специализаций
              item.sprite.anims.play(`${profession}_idle`, true)
              item.sprite.setFlipX(false) // Специализации смотрят вправо к входу
            } else {
              // Для старых многослойных спрайтов
              const textureKey = item.sprite.texture?.key || ''
              if (textureKey) {
                try { item.sprite.anims.play(`${textureKey}_idle`, true) } catch {}
              }
              item.sprite.setFlipX(true) // Старые спрайты смотрят влево к входу
            }
          } catch {}
        }
        
        // Анимации и ориентация для слоев одежды (старая система)
        if (item.shirt) {
          try { item.shirt.anims.play(`${item.shirt.texture.key}_idle`, true) } catch {}
          item.shirt.setFlipX(true) // Смотрят влево к входу
        }
        if (item.pants) {
          try { item.pants.anims.play(`${item.pants.texture.key}_idle`, true) } catch {}
          item.pants.setFlipX(true)
        }
        if (item.footwear) {
          try { item.footwear.anims.play(`${item.footwear.texture.key}_idle`, true) } catch {}
          item.footwear.setFlipX(true)
        }
        if (item.hair) {
          try { item.hair.anims.play(`${item.hair.texture.key}_idle`, true) } catch {}
          item.hair.setFlipX(true)
        }
      }
    })
  }

  // ======== Очередь врагов ========
  private getEnemyQueuePositions(n: number, surfaceRect: Phaser.Geom.Rectangle): { x: number; y: number }[] {
    const pad = 10
    const gap = 24 // Увеличено в 3 раза (8 * 3)
    const w = 84  // Увеличено в 3 раза (28 * 3)
    const rightmostX = surfaceRect.width - pad - w
    // Располагем на том же уровне пола, что и люди
    const y = surfaceRect.height - pad
    const pos: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) pos.push({ x: rightmostX - i * (w + gap), y })
    return pos
  }

  private layoutEnemyQueue(surfaceRect: Phaser.Geom.Rectangle, smooth = false): void {
    if (!this.surfaceEnemyQueue) return
    const positions = this.getEnemyQueuePositions(this.enemyQueueItems.length, surfaceRect)
    this.enemyQueueItems.forEach((item, i) => {
      if (item.exiting) return
      const p = positions[i]
      
      if (smooth) {
        // Плавное перемещение с анимацией
        this.smoothMoveEnemyToPosition(item, p)
      } else {
        // Мгновенное перемещение (как раньше)
      item.rect.setPosition(p.x, p.y)
      if (item.type === 'МАРОДЕР') {
          // Новая система: одиночный спрайт мародера, без отражения, idle
          const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
          if (spr) {
            spr.setPosition(p.x, p.y)
            try {
              const kind = (item as any).marauderKind || 1
              spr.anims.play(`r${kind}_idle`, true)
            } catch {}
          }
          // Гарантированно удалить слои одежды, если остались
          if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
          if (item.pants) { item.pants.destroy(); item.pants = undefined }
          if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
          if (item.hair) { item.hair.destroy(); item.hair = undefined }
        } else if (item.type === 'ЗОМБИ') {
          // Позиционируем одиночный спрайт зомби, без отражения, idle
          const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
          if (spr) {
            spr.setPosition(p.x, p.y)
            try {
              const kind = (item as any).zombieKind
              if (kind === 'wild') spr.anims.play('z_wild_idle', true)
              else if (kind === 'man') spr.anims.play('z_man_idle', true)
              else spr.anims.play('z_woman_idle', true)
            } catch {}
          }
          // Гарантированно удалить слои одежды, если остались от мародёра
          if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
          if (item.pants) { item.pants.destroy(); item.pants = undefined }
          if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
          if (item.hair) { item.hair.destroy(); item.hair = undefined }
        } else if (item.type === 'МУТАНТ') {
          const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
          if (spr) {
            spr.setPosition(p.x, p.y)
            try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_idle`, true) } catch {}
          }
          // убрать лишние слои на всякий случай
          if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
          if (item.pants) { item.pants.destroy(); item.pants = undefined }
          if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
          if (item.hair) { item.hair.destroy(); item.hair = undefined }
        } else if (item.type === 'СОЛДАТ') {
          const spr = (item as any).sprite as Phaser.GameObjects.Sprite | undefined
          if (spr) { spr.setPosition(p.x, p.y); try { spr.anims.play('sold_idle', true) } catch {} }
          if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
          if (item.pants) { item.pants.destroy(); item.pants = undefined }
          if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
          if (item.hair) { item.hair.destroy(); item.hair = undefined }
      } else {
          // Страховка: очистить лишние слои
          if (item.sprite && !(item as any).zombieKind) { item.sprite.destroy(); item.sprite = undefined }
        if (item.shirt) { item.shirt.destroy(); item.shirt = undefined }
        if (item.pants) { item.pants.destroy(); item.pants = undefined }
        if (item.footwear) { item.footwear.destroy(); item.footwear = undefined }
        if (item.hair) { item.hair.destroy(); item.hair = undefined }
        }
      }
    })
  }

  private smoothMoveEnemyToPosition(item: any, targetPos: { x: number; y: number }): void {
    const currentX = item.rect.x
    const currentY = item.rect.y
    const distance = Math.abs(targetPos.x - currentX)
    
    // Если расстояние маленькое, делаем мгновенное перемещение
    if (distance < 10) {
      item.rect.setPosition(targetPos.x, targetPos.y)
      if (item.sprite) item.sprite.setPosition(targetPos.x, targetPos.y)
      return
    }
    
    // Определяем направление движения
    const movingLeft = targetPos.x < currentX
    
    // Запускаем walk анимацию в зависимости от типа врага
    if (item.sprite) {
      try {
        if (item.type === 'МАРОДЕР') {
          this.ensureMarauderAnimations()
          const kind = item.marauderKind || 1
          item.sprite.anims.play(`r${kind}_walk`, true)
        } else if (item.type === 'ЗОМБИ') {
          this.ensureZombieAnimations()
          const kind = item.zombieKind || 'wild'
          item.sprite.anims.play(`z_${kind}_walk`, true)
        } else if (item.type === 'МУТАНТ') {
          this.ensureMutantAnimations()
          const k = item.mutantKind || 1
          item.sprite.anims.play(`m${k}_walk`, true)
        } else if (item.type === 'СОЛДАТ') {
          this.ensureSoldierAnimations()
          item.sprite.anims.play('sold_walk', true)
        }
        
        // Поворачиваем спрайт в направлении движения
        item.sprite.setFlipX(movingLeft)
      } catch {}
    }
    
    // Анимируем перемещение
    const duration = Math.min(4800, distance * 16) // Скорость зависит от расстояния, очень медленно
    const targets = [item.rect]
    if (item.sprite) targets.push(item.sprite)
    
    this.tweens.add({
      targets,
      x: targetPos.x,
      y: targetPos.y,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // Возвращаемся к idle анимации
        if (item.sprite) {
          try {
            if (item.type === 'МАРОДЕР') {
              const kind = item.marauderKind || 1
              item.sprite.anims.play(`r${kind}_idle`, true)
            } else if (item.type === 'ЗОМБИ') {
              const kind = item.zombieKind || 'wild'
              item.sprite.anims.play(`z_${kind}_idle`, true)
            } else if (item.type === 'МУТАНТ') {
              const k = item.mutantKind || 1
              item.sprite.anims.play(`m${k}_idle`, true)
            } else if (item.type === 'СОЛДАТ') {
              item.sprite.anims.play('sold_idle', true)
            }
            
            // Сбрасываем поворот спрайта (враги смотрят вправо по умолчанию)
            item.sprite.setFlipX(false)
          } catch {}
        }
      }
    })
  }

  private enqueueEnemy(createOnly = false): { id: number; rect: Phaser.GameObjects.Rectangle; type: string } | null {
    if (!this.surfaceEnemyQueue) return null
    const id = this.nextEnemyId++
    const type = this.pickEnemyType()
    
    // Показываем уведомление о появлении врага в очереди
    this.showToast(`Враг ${type} появился в очереди`)
    const box = this.add.rectangle(0, 0, 84, 108, 0x000000, 0).setOrigin(0, 1)
    // Убираем красную рамку для врагов - делаем невидимой
    box.setVisible(false)
    const item: any = { id, rect: box, type }
    // Инициализация HP сразу, чтобы шкала была полной при первом показе
    // Настройка HP по типу и сложности: соответствие количеству попаданий разным оружием
    const hpByType = (tp: string): number => {
      // Базовые уроны оружия соответствуют fireWeaponOnce: pistol=1, shotgun=2, ar=1, sniper=3
      // Цель: примерные диапазоны выстрелов из ТЗ. Возьмём среднее значение диапазона и конвертируем в HP относительно урона пистолета (=1)
      switch (tp) {
        case 'МАРОДЕР':
          // 1–2 пули pistol → среднее ~1.5
          return 2
        case 'ЗОМБИ':
          // 2–4 pistol → среднее ~3
          return 3
        case 'МУТАНТ':
          // 4–8 pistol → среднее ~6
          return 6
        case 'СОЛДАТ':
          // 8–12 pistol → среднее ~10
          return 10
        default:
          return 2
      }
    }
    item.maxHp = hpByType(type)
    item.hp = item.maxHp
    if (type === 'МАРОДЕР') {
      // Создаем спрайт мародера - случайный выбор из 3 типов
      this.ensureMarauderAnimations()
      const kinds = [1, 2, 3] as const
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      let sprite: Phaser.GameObjects.Sprite
      if (kind === 1) sprite = this.add.sprite(0, 0, 'raider1_idle', 0)
      else if (kind === 2) sprite = this.add.sprite(0, 0, 'raider2_idle', 0)
      else sprite = this.add.sprite(0, 0, 'raider3_idle', 0)
      sprite.setOrigin(0, 1)
      sprite.setDepth(100) // Устанавливаем depth для спрайтов врагов
      // Масштаб из 128x128 в 28x36, увеличенный в 4.5 раза (1.5 * 3)
      sprite.setScale((28 / 128) * 4.5, (36 / 128) * 4.5)
      // Без отражения — мародеры смотрят вправо по умолчанию
      if (kind === 1) { try { sprite.anims.play('r1_idle', true) } catch {} }
      else if (kind === 2) { try { sprite.anims.play('r2_idle', true) } catch {} }
      else { try { sprite.anims.play('r3_idle', true) } catch {} }
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
      ;(item as any).marauderKind = kind
      // Очищаем слои одежды (не используются для спрайтов мародеров)
      item.shirt = undefined
      item.pants = undefined
      item.footwear = undefined
      item.hair = undefined
    } else if (type === 'ЗОМБИ') {
      this.ensureZombieAnimations()
      const kinds = ['wild','man','woman'] as const
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      let sprite: Phaser.GameObjects.Sprite
      if (kind === 'wild') sprite = this.add.sprite(0, 0, 'zombie_wild_idle', 0)
      else if (kind === 'man') sprite = this.add.sprite(0, 0, 'zombie_man_idle', 0)
      else sprite = this.add.sprite(0, 0, 'zombie_woman_idle', 0)
      sprite.setOrigin(0, 1)
      // Масштаб из 96x96 в 28x36, увеличенный в 4.5 раза (1.5 * 3)
      sprite.setScale((28 / 96) * 4.5, (36 / 96) * 4.5)
      // Без отражения — зомби смотрят вправо по умолчанию
      if (kind === 'wild') { try { sprite.anims.play('z_wild_idle', true) } catch {} }
      if (kind === 'man') { try { sprite.anims.play('z_man_idle', true) } catch {} }
      if (kind === 'woman') { try { sprite.anims.play('z_woman_idle', true) } catch {} }
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
      ;(item as any).zombieKind = kind
    } else if (type === 'МУТАНТ') {
      this.ensureMutantAnimations()
      const kinds = [1,2,3,4] as const
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      const sprite = this.add.sprite(0, 0, `mutant${kind}_idle`, 0).setOrigin(0, 1)
      // Масштаб под 28x36 с увеличением в 4.8 раза (1.6 * 3)
      sprite.setScale((28 / 128) * 4.8, (36 / 128) * 4.8)
      try { sprite.anims.play(`m${kind}_idle`, true) } catch {}
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
      ;(item as any).mutantKind = kind
    } else if (type === 'СОЛДАТ') {
      this.ensureSoldierAnimations()
      const sprite = this.add.sprite(0, 0, 'soldier_idle', 0).setOrigin(0, 1)
      sprite.setScale((28 / 128) * 4.8, (36 / 128) * 4.8)
      try { sprite.anims.play('sold_idle', true) } catch {}
      this.surfaceEnemyQueue.add(sprite)
      ;(item as any).sprite = sprite
    }
    this.enemyQueueItems.push(item)
    this.surfaceEnemyQueue.add(box)
    if (!createOnly && this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect)
    // updatePersonInfoFromQueue будет вызван после завершения анимации прибытия
    return item
  }

  private maybeArriveEnemy(): void {
    if (this.phase !== 'night') return
    
    // Проверяем размер очереди врагов
    if (this.enemyQueueItems.length >= this.MAX_QUEUE_SIZE) {
      console.log(`[maybeArriveEnemy] Очередь врагов заполнена (${this.enemyQueueItems.length}/${this.MAX_QUEUE_SIZE}), новых врагов не добавляем`)
      return
    }
    
    console.log(`[maybeArriveEnemy] Приходит враг. Размер очереди врагов: ${this.enemyQueueItems.length + 1}/${this.MAX_QUEUE_SIZE}`)
    
    const v = this.enqueueEnemy(true)
    if (!this.lastSurfaceRect || !v) return
    const rect = this.lastSurfaceRect
    const positions = this.getEnemyQueuePositions(this.enemyQueueItems.length, rect)
    const idx = this.enemyQueueItems.length - 1
    const target = positions[idx]
    const startX = -40 // приходят с левой границы
    v.rect.setPosition(startX, target.y)
    const item: any = v
          const tweenTargets: any[] = [v.rect]
      if (item.type === 'МАРОДЕР' && item.sprite) {
        // Мародеры с новыми спрайтами - двигаем rect и sprite
        item.sprite.setPosition(startX, target.y)
        try {
          const kind = item.marauderKind || 1
          item.sprite.anims.play(`r${kind}_walk`, true)
        } catch {}
        tweenTargets.push(item.sprite)
      } else if (item.type === 'ЗОМБИ' && item.sprite) {
      // Зомби не отражаем, просто двигаем и играем walk
      item.sprite.setPosition(startX, target.y)
      try {
        if (item.zombieKind === 'wild') item.sprite.anims.play('z_wild_walk', true)
        else if (item.zombieKind === 'man') item.sprite.anims.play('z_man_walk', true)
        else item.sprite.anims.play('z_woman_walk', true)
      } catch {}
      tweenTargets.push(item.sprite)
    } else if (item.type === 'МУТАНТ' && (item as any).sprite) {
      const spr = (item as any).sprite as Phaser.GameObjects.Sprite
      spr.setPosition(startX, target.y)
      try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_walk`, true) } catch {}
      tweenTargets.push(spr)
    } else if (item.type === 'СОЛДАТ' && (item as any).sprite) {
      const spr = (item as any).sprite as Phaser.GameObjects.Sprite
      spr.setPosition(startX, target.y)
      try { spr.anims.play('sold_walk', true) } catch {}
      tweenTargets.push(spr)
    }
    this.tweens.add({ targets: tweenTargets, x: target.x, duration: 6000, ease: 'Sine.easeOut', onComplete: () => {
      if (item.type === 'МАРОДЕР' && item.sprite) {
        // Мародеры переходят к idle после прибытия
        try {
          const kind = item.marauderKind || 1
          item.sprite.anims.play(`r${kind}_idle`, true)
        } catch {}
      } else if (item.type === 'ЗОМБИ' && item.sprite) {
        try {
          if (item.zombieKind === 'wild') item.sprite.anims.play('z_wild_idle', true)
          else if (item.zombieKind === 'man') item.sprite.anims.play('z_man_idle', true)
          else item.sprite.anims.play('z_woman_idle', true)
        } catch {}
      } else if (item.type === 'МУТАНТ' && (item as any).sprite) {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite
        try { const k = (item as any).mutantKind; spr.anims.play(`m${k}_idle`, true) } catch {}
      } else if (item.type === 'СОЛДАТ' && (item as any).sprite) {
        const spr = (item as any).sprite as Phaser.GameObjects.Sprite
        try { spr.anims.play('sold_idle', true) } catch {}
      }
      // Обновим лэйаут очереди и правую панель, чтобы гарантировать корректную видимость оружия/HP
      if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect)
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      
      // Отмечаем что первый враг достиг позиции
      if (item === this.enemyQueueItems[0]) {
        (item as any).arrivedAtPosition = true
        
        // Показываем уведомление о прибытии врага
        this.showToast(`Прибыл враг: ${item.type}`)
      }
      
      // Обновляем превью только после завершения анимации прибытия
      this.updatePersonInfoFromQueue()
    } })
  }

  private decideCurrent(accepted: boolean): void {
    if (this.queueItems.length === 0) {
      this.showToast(t('noVisitors') ?? 'No visitors')
      return
    }
    // Обслуживаем крайнего правого (первого у входа)
    const first = this.queueItems.shift()!
    first.exiting = true
    const rect = first.rect
    const sprite = first.sprite
    const sr = this.lastSurfaceRect!
    
    if (accepted) {
      const capacity = this.getBunkerCapacity()
      const canAccept = this.bunkerResidents.length < capacity
      if (canAccept) {
        const personData = this.getPersonData(first.id)
        console.log(`[decideCurrent] Принимаем жителя ${personData.name} (${personData.profession}) с навыками: ${personData.allSkills.map(s => `${s.text}(${s.positive ? '+' : '-'})`).join(', ')}`)
        
        // Специальное логирование для докторов
        if (personData.profession === 'доктор' || personData.profession === 'врач') {
          console.log(`[decideCurrent] 🏥 Принимаем доктора ${personData.name}! Теперь жители будут получать лечение каждый час во время работы доктора`)
        }
        
        this.addResidentToBunker(first.id, personData)

        // Применяем изменение морали за принятие жителя
        const moralChange = this.calculateMoralChange(personData, true);
        this.applyMoralChange(moralChange, `принят ${personData.name} (${personData.profession})`);

        // Показываем уведомление о принятии жителя
        this.showToast(`Принят житель: ${personData.name} (${personData.profession})`)

        // Устанавливаем состояние accept на 1 секунду
        this.setEntranceState('accept', 1000)

        // Перенос предметов из инвентаря персонажа в инвентарь бункера
        // (включая базовые ресурсы в специальные ячейки)
        this.transferPersonInventoryToBunker(personData)
        // 1) Превью: приподнять и скрыть (спрайт или рамку)
        ;(this as any)._previewBusy = true
        if (this.personPreviewSprite && this.personPreviewSprite.visible) {
          // Анимация поднятия для спрайта
          this.tweens.add({ targets: this.personPreviewSprite, y: "+= -24", alpha: 0, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
            this.personPreviewSprite?.setAlpha(1)
            this.personPreviewSprite?.setVisible(false)
            ;(this as any)._previewBusy = false
            this.updatePersonInfoFromQueue()
          } })
        } else if (this.personPreview && this.personPreview.visible) {
          // Анимация поднятия для рамки
          this.tweens.add({ targets: this.personPreview, y: "+= -24", alpha: 0, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
            this.personPreview?.setAlpha(1)
            this.personPreview?.setVisible(false)
            ;(this as any)._previewBusy = false
            this.updatePersonInfoFromQueue()
          } })
        } else {
          // Если ничего не видно, сразу обновляем очередь
          ;(this as any)._previewBusy = false
          this.updatePersonInfoFromQueue()
        }
        // 2) Очередь на поверхности: уход вправо (rect + спрайт специализации если есть)
        const targetX = sr.width + 60
        const outTargets: any[] = [rect]
        if (sprite) outTargets.push(sprite)
        this.tweens.add({ targets: outTargets, x: targetX, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
          rect.destroy()
          sprite?.destroy()
          this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)
          
          // Проверяем возможность возобновления прихода персонажей
          this.checkAndResumeArrivals()
        } })
      } else {
        // Покажем плашку "нет мест" и оставим человека в очереди (не выкидываем)

        // Применяем изменение морали за отказ (нет мест)
        const personData = this.getPersonData(first.id)
        console.log(`[decideCurrent] Нет мест для жителя ${personData.name} (${personData.profession}) с навыками: ${personData.allSkills.map(s => `${s.text}(${s.positive ? '+' : '-'})`).join(', ')}`)
        
        // Специальное логирование для докторов без мест
        if (personData.profession === 'доктор' || personData.profession === 'врач') {
          console.log(`[decideCurrent] 🏥 Нет мест для доктора ${personData.name}! Жители не будут получать лечение`)
        }
        
        const moralChange = this.calculateMoralChange(personData, false);
        this.applyMoralChange(moralChange, `нет мест для ${personData.name} (${personData.profession})`);

        // Показываем уведомление о том, что нет мест
        this.showToast(`Нет мест в бункере! ${personData.name} остается в очереди`)

        this.updatePersonInfoFromQueue()
        // Мест нет — уходит влево (как отказ)
        // Убираем выкидывание: возвращаем кандидата в очередь, чтобы игрок мог дождаться мест
        // Для простоты — возвращаем в начало очереди визуально справа
        const item = { id: first.id, rect }
        this.queueItems.unshift(item)
        // Плавное перемещение очереди после возврата жителя
        this.layoutQueue(sr, true) // smooth=true
      }
    } else {
      // Отказ: анимация выхода влево для превью + очереди

              // Применяем изменение морали за отказ
        const personData = this.getPersonData(first.id)
        console.log(`[decideCurrent] Отказываем жителю ${personData.name} (${personData.profession}) с навыками: ${personData.allSkills.map(s => `${s.text}(${s.positive ? '+' : '-'})`).join(', ')}`)
        
        // Специальное логирование для отказа докторам
        if (personData.profession === 'доктор' || personData.profession === 'врач') {
          console.log(`[decideCurrent] 🏥 Отказываем доктору ${personData.name}! Жители не будут получать лечение`)
        }
        
        const moralChange = this.calculateMoralChange(personData, false);
        this.applyMoralChange(moralChange, `отказан ${personData.name} (${personData.profession})`);

      // Показываем уведомление об отказе в жителе
      this.showToast(`Отказано в жителе: ${personData.name} (${personData.profession})`)

      // Устанавливаем состояние deny на 1 секунду
      this.setEntranceState('deny', 1000)

      ;(this as any)._previewBusy = true
      // 1) Превью: уход влево с исчезновением (спрайт или рамка)
      if (this.personPreviewSprite && this.personPreviewSprite.visible) {
        // Анимация выхода для спрайта
        // Поворачиваем лицом в сторону движения (влево)
        this.personPreviewSprite.setFlipX(true)
        this.tweens.add({ targets: this.personPreviewSprite, x: -60, alpha: 0, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
          this.personPreviewSprite?.setAlpha(1)
          this.personPreviewSprite?.setVisible(false)
          ;(this as any)._previewBusy = false
          this.updatePersonInfoFromQueue()
        } })
      } else if (this.personPreview && this.personPreview.visible) {
        // Анимация выхода для рамки
        this.tweens.add({ targets: this.personPreview, x: -60, alpha: 0, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
          this.personPreview?.setAlpha(1)
          this.personPreview?.setVisible(false)
          ;(this as any)._previewBusy = false
          this.updatePersonInfoFromQueue()
        } })
      } else {
        ;(this as any)._previewBusy = false
      }
      // 2) Очередь: уходят влево (rect + спрайт специализации если есть)
      const leftTargets: any[] = [rect]
      if (sprite) leftTargets.push(sprite)
      this.tweens.add({ targets: leftTargets, x: -60, duration: 600, ease: 'Sine.easeIn', onComplete: () => {
        rect.destroy()
        sprite?.destroy()
        if (!(this as any)._previewBusy) this.updatePersonInfoFromQueue()
        
        // Проверяем возможность возобновления прихода персонажей
        this.checkAndResumeArrivals()
      }})
    }
    // Плавное перемещение очереди после принятия/отклонения жителя
    this.layoutQueue(sr, true) // smooth=true
    // Обновление превью выполняется по завершению анимации превью/очереди
  }

  private disperseQueue(): void {
    const sr = this.lastSurfaceRect
    this.queueItems.forEach((it, idx) => {
      const targets: any[] = [it.rect]
      if (it.sprite) targets.push(it.sprite)
      if (it.shirt) targets.push(it.shirt)
      if (it.pants) targets.push(it.pants)
      if (it.footwear) targets.push(it.footwear)
      if (it.hair) targets.push(it.hair)
      this.tweens.add({ targets, x: -60 - idx * 20, duration: 500 + idx * 120, ease: 'Sine.easeIn', onComplete: () => {
        it.rect.destroy()
        it.sprite?.destroy()
        it.shirt?.destroy()
        it.pants?.destroy()
        it.footwear?.destroy()
        it.hair?.destroy()
        // Обновляем только когда последний элемент уходит
        if (idx === this.queueItems.length - 1) {
          this.updatePersonInfoFromQueue()
        }
      }})
    })
    this.queueItems = []

    // Обновляем сразу после очистки массива
    this.updatePersonInfoFromQueue()
    
    // Проверяем возможность возобновления прихода персонажей
    this.checkAndResumeArrivals()

    // Также очищаем блок превью при наступлении ночи
    this.dispersePreviewCitizens()
  }

  private dispersePreviewCitizens(): void {
    // Проверяем, есть ли жители в блоке превью
    if (!this._previewCurrentIsEnemy && this._previewCurrentId !== null) {
      console.log('[dispersePreviewCitizens] Очищаем блок превью от жителей при наступлении ночи')

      // Скрываем превью жителя с анимацией
      if (this.personPreviewSprite && this.personPreviewSprite.visible) {
        const riseAndFade = (targets: any[], toY: number, onDone?: () => void) => {
          this.tweens.add({ targets, y: toY, alpha: 0, duration: 500, ease: 'Sine.easeIn', onComplete: onDone })
        }

        const currentY = this.personPreviewSprite.y
        const fadeTargets = [this.personPreviewSprite]

        // Добавляем слои одежды если они видны
        if (this.personPreviewShirt?.visible) fadeTargets.push(this.personPreviewShirt)
        if (this.personPreviewPants?.visible) fadeTargets.push(this.personPreviewPants)
        if (this.personPreviewFootwear?.visible) fadeTargets.push(this.personPreviewFootwear)
        if (this.personPreviewHair?.visible) fadeTargets.push(this.personPreviewHair)

        riseAndFade(fadeTargets, currentY - 30, () => {
          // После анимации скрываем все элементы превью
          this.hideCitizenPreview()

          // После скрытия жителей сразу проверяем, есть ли враги для показа
          this.time.delayedCall(100, () => {
            if (this.enemyQueueItems.length > 0) {
              const firstEnemy = this.enemyQueueItems[0]
              const enemyArrived = (firstEnemy as any).arrivedAtPosition || false
              if (enemyArrived) {
                console.log('[dispersePreviewCitizens] После очистки жителей показываем врага')
                this.updatePersonInfoFromQueue()
              }
            }
          })
        })
      } else {
        // Если нет анимации, просто скрываем
        this.hideCitizenPreview()

        // После скрытия жителей сразу проверяем, есть ли враги для показа
        this.time.delayedCall(100, () => {
          if (this.enemyQueueItems.length > 0) {
            const firstEnemy = this.enemyQueueItems[0]
            const enemyArrived = (firstEnemy as any).arrivedAtPosition || false
            if (enemyArrived) {
              console.log('[dispersePreviewCitizens] После очистки жителей показываем врага')
              this.updatePersonInfoFromQueue()
            }
          }
        })
      }
    }
  }

  private clearInventorySlots(): void {
    if (!this.personPreviewInventory) return

    const inventorySlots = this.personPreviewInventory.list as Phaser.GameObjects.Container[]
    inventorySlots.forEach(slot => {
      const children = slot.list as Phaser.GameObjects.GameObject[]
      const bg = children[0] as Phaser.GameObjects.Rectangle
      const itemSprite = children[1] as Phaser.GameObjects.Sprite
      const quantityText = children[2] as Phaser.GameObjects.Text

      // Скрываем и очищаем спрайт предмета
      itemSprite.setVisible(false)
      itemSprite.setTexture('')
      itemSprite.setScale(1.2, 1.2) // Устанавливаем масштаб по умолчанию для слотов

      // Очищаем и скрываем текст количества
      quantityText.setText('')
      quantityText.setPosition(20, 20) // Сбрасываем позицию для больших слотов
      quantityText.setVisible(false)

      // Восстанавливаем фон слота (серый для пустых слотов)
      bg.setFillStyle(0x333333, 0.8)
      bg.setSize(56, 56) // Размер по умолчанию для новых слотов

      // Отключаем интерактивность
      bg.disableInteractive()
    })
    this.personPreviewInventory.setVisible(false)

    console.log('[clearInventorySlots] Инвентарь очищен')
  }

  private showItemTooltip(slotIndex: number): void {
    console.log(`[showItemTooltip] Вызван для слота ${slotIndex}`)

    if (!this.personPreviewInventory) {
      console.log(`[showItemTooltip] Отсутствует personPreviewInventory`)
      return
    }

    // Получаем ID текущего персонажа из очереди
    const currentPerson = this.queueItems.length > 0 ? this.queueItems[0] : null
    if (!currentPerson) {
      console.log(`[showItemTooltip] Нет текущего персонажа в очереди`)
      return
    }

    // Получаем данные персонажа
    const personData = this.getPersonData(currentPerson.id)
    if (!personData.inventory || slotIndex >= personData.inventory.length) return

    const invItem = personData.inventory[slotIndex]
    if (!invItem) return

    const data = this.getItemById(invItem.id)
    if (!data) return

    // Вычисляем экранные координаты под выбранным слотом
    const inventorySlots = this.personPreviewInventory.list as Phaser.GameObjects.Container[]
    const slot = inventorySlots[slotIndex]
    if (!slot) return

    // Мировые координаты слота (используем его границы)
    const bounds = slot.getBounds()
    const worldX = bounds.centerX
    const worldY = bounds.bottom + 8

    // Мировые -> экранные (учитываем зум камеры и CSS-скейл канваса)
    const cam = this.cameras.main
    const rect = this.game.canvas.getBoundingClientRect()
    const internalW = this.scale.width
    const internalH = this.scale.height
    const ratioX = rect.width / internalW
    const ratioY = rect.height / internalH
    const screenX = ((worldX - cam.scrollX) * cam.zoom) * ratioX + rect.left
    const screenY = ((worldY - cam.scrollY) * cam.zoom) * ratioY + rect.top

    // Создаем/обновляем DOM tooltip
    let tooltip = document.getElementById('resident-inventory-tooltip') as HTMLDivElement | null
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.id = 'resident-inventory-tooltip'
      tooltip.style.position = 'fixed'
      tooltip.style.zIndex = '10000'
      tooltip.style.maxWidth = '260px'
      tooltip.style.background = 'rgba(20,20,20,0.95)'
      tooltip.style.color = '#fff'
      tooltip.style.border = '1px solid #555'
      tooltip.style.borderRadius = '6px'
      tooltip.style.padding = '10px'
      tooltip.style.fontSize = '12px'
      tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.6)'
      document.body.appendChild(tooltip)
    }

    const typeText = (data as any).typeDisplay || (data.category || 'tool')
    const priceText = typeof data.price === 'number' ? data.price : 0
    const shortText = (data as any).shortDescription || data.description || ''

    tooltip.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center;">
        <img src="${data.spritePath}" alt="${data.name}" style="width:32px;height:32px;object-fit:contain;image-rendering:pixelated;"/>
        <div>
          <div style="font-weight:600; margin-bottom:2px;">${data.name}</div>
          <div style="opacity:0.8;">${shortText}</div>
        </div>
      </div>
      <div style="margin-top:6px; display:flex; justify-content:space-between;">
        <span>Тип: <b>${typeText}</b></span>
        <span>Цена: <b>${priceText}</b></span>
      </div>
    `

    // Позиция на экране с учётом границ окна
    const width = 260
    const height = 110
    let left = screenX
    let top = screenY
    if (left + width > window.innerWidth) left = Math.max(10, window.innerWidth - width - 10)
    if (top + height > window.innerHeight) top = Math.max(10, window.innerHeight - height - 10)
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`

    // Автоскрытие
    window.clearTimeout((tooltip as any)._hideTimer)
    ;(tooltip as any)._hideTimer = window.setTimeout(() => {
      if (tooltip && tooltip.parentElement) tooltip.parentElement.removeChild(tooltip)
    }, 2500)
  }

  private hideCitizenPreview(): void {
    // Скрываем все элементы превью жителя
    if (this.personPreviewSprite) {
      this.personPreviewSprite.setVisible(false)
      this.personPreviewSprite.setAlpha(1) // Восстанавливаем прозрачность для следующих использований
    }
    if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
    if (this.personPreviewPants) this.personPreviewPants.setVisible(false)
    if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
    if (this.personPreviewHair) this.personPreviewHair.setVisible(false)

    // Очищаем инвентарь
    this.clearInventorySlots()

    // Сбрасываем флаги
    this._previewCurrentIsEnemy = false
    this._previewCurrentId = null

    // Обновляем текстовую информацию
    if (this.personNameText) this.personNameText.setText(`${t('name')}: —`)
    if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: —\nПОЛ: —\n${t('specialty')}: —`)
    if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)

    // Скрываем текстовые элементы
    if (this.personNameText) this.personNameText.setVisible(false)
    if (this.personDetailsText) this.personDetailsText.setVisible(false)
    if (this.personSkillText) this.personSkillText.setVisible(false)

    console.log('[hideCitizenPreview] Блок превью очищен от жителей')
  }

  private updatePersonInfoFromQueue(): void {
    // Не обновляем превью пока идет анимация
    if ((this as any)._previewBusy) return
    
    const slideInFromLeft = (targets: any[], toX: number, toY: number, onDone?: () => void) => {
      // старт за пределами слева
      targets.forEach((t: any) => { if (t && typeof t.setPosition === 'function') t.setPosition(-60, toY) })
      this.tweens.add({ targets, x: toX, y: toY, duration: 900, ease: 'Sine.easeOut', onComplete: onDone })
    }
    const riseAndFade = (targets: any[], toY: number, onDone?: () => void) => {
      this.tweens.add({ targets, y: toY, alpha: 0, duration: 500, ease: 'Sine.easeIn', onComplete: onDone })
    }
    // Приоритет: если ночью есть враги — показываем информацию о врагах
    const isNight = this.phase === 'night'
    if (isNight && this.enemyQueueItems.length > 0) {
      const e = this.enemyQueueItems[0]

      // Проверяем: завершена ли анимация прибытия первого врага
      const firstEnemyArrived = (e as any).arrivedAtPosition || false

      // Если враг еще не прибыл, но у нас есть жители в превью - сразу очищаем их
      if (!firstEnemyArrived && this._previewCurrentId !== null && !this._previewCurrentIsEnemy) {
        console.log('[updatePersonInfoFromQueue] Ночь наступила, очищаем превью от жителей до прибытия врага')
        this.hideCitizenPreview()
        return
      }

      if (!firstEnemyArrived) {
        // Первый враг еще движется к первому месту, не показываем его в превью
        return
      }

      // если это тот же враг, не проигрывать вход повторно
      if (this._previewCurrentIsEnemy && this._previewCurrentId === e.id) {
        // обновим только тексты и выходим
        if (this.personNameText) this.personNameText.setText(`ВРАГ: ID-${e.id}`)
        if (this.personDetailsText) this.personDetailsText.setText(`ТИП: ${e.type}`)
        if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
        // Инвентарь не показываем для врагов
        if (this.personPreviewInventory) this.personPreviewInventory.setVisible(false)
        return
      }

      // Очищаем инвентарь и скрываем все элементы жителя при переключении к врагу
      if (!this._previewCurrentIsEnemy && this._previewCurrentId !== null) {
        // Скрываем все элементы жителя
        if (this.personPreviewSprite) this.personPreviewSprite.setVisible(false)
        if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
        if (this.personPreviewPants) this.personPreviewPants.setVisible(false)
        if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
        if (this.personPreviewHair) this.personPreviewHair.setVisible(false)
        if (this.personPreview) this.personPreview.setVisible(false)

        // Очищаем инвентарь
        this.clearInventorySlots()
      }

      this._previewCurrentIsEnemy = true
      this._previewCurrentId = e.id
      if (this.personNameText) this.personNameText.setText(`ВРАГ: ID-${e.id}`)
      if (this.personDetailsText) this.personDetailsText.setText(`ТИП: ${e.type}`)
      if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
      // Инвентарь не показываем для врагов
      if (this.personPreviewInventory) this.personPreviewInventory.setVisible(false)

      // Скрываем все слои превью перед показом врага
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(false)
      if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
      if (this.personPreviewPants) this.personPreviewPants.setVisible(false)
      if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
      if (this.personPreviewHair) this.personPreviewHair.setVisible(false)
      if (this.personPreview) this.personPreview.setVisible(false)

      // Превью врага: мародёр — слои персонажа, иначе — красный прямоугольник
      if (this.personPreview && this.personPreviewSprite) {
        if (e.type === 'МАРОДЕР') {
          // Новая система: показываем спрайт мародера в превью
          const e0: any = e
          const isMarauder = e0?.type === 'МАРОДЕР' && !!e0.sprite && !!e0.marauderKind
          const hide = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; s.setVisible(false); }
          if (isMarauder && this.personPreviewSprite) {
            // Используем единый спрайт превью как отображение мародера
            this.personPreviewShirt?.setVisible(false)
            this.personPreviewPants?.setVisible(false)
            this.personPreviewFootwear?.setVisible(false)
            this.personPreviewHair?.setVisible(false)
            const kind = e0.marauderKind || 1
            const texKey = `raider${kind}_idle`
            this.ensureMarauderAnimations()
            this.personPreviewSprite.setTexture(texKey)
            try { this.personPreviewSprite.anims.play(`r${kind}_idle`, true) } catch {}
            this.personPreviewSprite.setVisible(true)
            this.personPreviewSprite.setAlpha(1) // Сбрасываем прозрачность
          this.personPreview.setFillStyle(0x000000, 0)
        } else {
            // Fallback: показать красный прямоугольник, спрятать все слои превью
            hide(this.personPreviewShirt)
            hide(this.personPreviewPants)
            hide(this.personPreviewFootwear)
            hide(this.personPreviewHair)
            hide(this.personPreviewSprite)
            this.personPreview.setFillStyle(0xb71c1c, 0.9)
          }
        } else {
          // Для зомби/мутанта — показать их спрайт в превью; для прочих без спрайтов — красный блок
          const e0: any = e
          const isZombie = e0?.type === 'ЗОМБИ' && !!e0.sprite && !!e0.zombieKind
          const isMutant = e0?.type === 'МУТАНТ' && !!e0.sprite && !!e0.mutantKind
          const isSoldier = e0?.type === 'СОЛДАТ' && !!e0.sprite
          const hide = (s?: Phaser.GameObjects.Sprite) => { if (!s) return; s.setVisible(false); }
                      if ((isZombie || isMutant || isSoldier) && this.personPreviewSprite) {
              // Используем единый спрайт превью как отображение зомби
          this.personPreviewShirt?.setVisible(false)
          this.personPreviewPants?.setVisible(false)
          this.personPreviewFootwear?.setVisible(false)
          this.personPreviewHair?.setVisible(false)
              if (isZombie) {
                const kind = e0.zombieKind
                const texKey = kind === 'wild' ? 'zombie_wild_idle' : kind === 'man' ? 'zombie_man_idle' : 'zombie_woman_idle'
                this.personPreviewSprite.setTexture(texKey)
                try {
                  if (kind === 'wild') this.personPreviewSprite.anims.play('z_wild_idle', true)
                  else if (kind === 'man') this.personPreviewSprite.anims.play('z_man_idle', true)
                  else this.personPreviewSprite.anims.play('z_woman_idle', true)
                } catch {}
              } else if (isMutant) {
                const k = e0.mutantKind
                const texKey = `mutant${k}_idle`
                this.personPreviewSprite.setTexture(texKey)
                try { this.personPreviewSprite.anims.play(`m${k}_idle`, true) } catch {}
              } else if (isSoldier) {
                // Солдат
                this.ensureSoldierAnimations()
                this.personPreviewSprite.setTexture('soldier_idle')
                try { this.personPreviewSprite.anims.play('sold_idle', true) } catch {}
              }
              this.personPreviewSprite.setVisible(true)
              this.personPreviewSprite.setAlpha(1) // Сбрасываем прозрачность
              this.personPreview.setFillStyle(0x000000, 0)
            } else {
            // Показать красный прямоугольник, спрятать все слои превью
            hide(this.personPreviewShirt)
            hide(this.personPreviewPants)
            hide(this.personPreviewFootwear)
            hide(this.personPreviewHair)
            hide(this.personPreviewSprite)
          this.personPreview.setFillStyle(0xb71c1c, 0.9)
          }
        }
      }
      this.updateUIVisibility()

      // При появлении врагов убедимся, что панель перерисована (например, вернуть видимость оружия)
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      
      // Анимация входа для превью врага (аналогично жителям)
      if (this.lastPersonRect && this.personPreviewSprite && this.personPreviewSprite.visible) {
        // Анимация входа для спрайта врага
        const toX = this.personPreviewSprite.x
        const toY = this.personPreviewSprite.y
        // Начинаем слева за границей экрана
        this.personPreviewSprite.setPosition(-60, toY)
        // Поворачиваем лицом в сторону движения (вправо)
        this.personPreviewSprite.setFlipX(false)
        // Проигрываем анимацию ходьбы при входе в зависимости от типа врага
        const enemyFirst = this.enemyQueueItems[0]
        if (enemyFirst?.type === 'МАРОДЕР') {
          const kind = (enemyFirst as any).marauderKind || 1
          this.personPreviewSprite.anims.play(`r${kind}_walk`, true)
        } else if (enemyFirst?.type === 'ЗОМБИ') {
          const kind = (enemyFirst as any).zombieKind || 'wild'
          this.personPreviewSprite.anims.play(`z_${kind}_walk`, true)
        } else if (enemyFirst?.type === 'МУТАНТ') {
          const k = (enemyFirst as any).mutantKind || 1
          this.personPreviewSprite.anims.play(`m${k}_walk`, true)
        } else if (enemyFirst?.type === 'СОЛДАТ') {
          this.personPreviewSprite.anims.play('sold_walk', true)
        }
        // Анимируем въезд спрайта слева
        this.tweens.add({
          targets: this.personPreviewSprite,
          x: toX,
          duration: 900,
          ease: 'Sine.easeOut',
          onComplete: () => {
            // Переключаемся на idle после входа
            const enemyFirst = this.enemyQueueItems[0]
            if (enemyFirst?.type === 'МАРОДЕР') {
              const kind = (enemyFirst as any).marauderKind || 1
              this.personPreviewSprite?.anims.play(`r${kind}_idle`, true)
            } else if (enemyFirst?.type === 'ЗОМБИ') {
              const kind = (enemyFirst as any).zombieKind || 'wild'
              this.personPreviewSprite?.anims.play(`z_${kind}_idle`, true)
            } else if (enemyFirst?.type === 'МУТАНТ') {
              const k = (enemyFirst as any).mutantKind || 1
              this.personPreviewSprite?.anims.play(`m${k}_idle`, true)
            } else if (enemyFirst?.type === 'СОЛДАТ') {
              this.personPreviewSprite?.anims.play('sold_idle', true)
            }
          }
        })
      }
      
      return
    }
    // Переходим к показу жителей
    const first = this.queueItems[0]
    if (!first) {
      // Нет ни врагов, ни жителей - сбрасываем все флаги и очищаем инвентарь
      this._previewCurrentIsEnemy = false
      this._previewCurrentId = null
      if (this.personNameText) this.personNameText.setText(`${t('name')}: —`)
      if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: —\nПОЛ: —\n${t('specialty')}: —`)
      if (this.personSkillText) this.personSkillText.setText(`${t('skill')}: —`)
      if (this.personPreview) this.personPreview.setVisible(false)
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(false)
      this.personPreviewShirt?.setVisible(false)
      this.personPreviewPants?.setVisible(false)
      this.personPreviewFootwear?.setVisible(false)
      this.personPreviewHair?.setVisible(false)

      // Полностью очищаем инвентарь при пустой очереди
      this.clearInventorySlots()

      this.updateUIVisibility()
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      return
    }
    // Если тот же человек — не переигрывать вход
    if (!this._previewCurrentIsEnemy && this._previewCurrentId === first.id) {
      const dataSame = this.getPersonData(first.id)
      if (this.personNameText) this.personNameText.setText(`${t('name')}: ${dataSame.name}`)
      if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: ${dataSame.age}\nПОЛ: ${dataSame.gender}\n${t('specialty')}: ${dataSame.profession}`)
      if (this.personSkillText) {
        const skills = (dataSame as any).allSkills as Array<{ text: string; positive: boolean }> | undefined
        const firstSkill = Array.isArray(skills) && skills.length > 0 ? skills[0] : undefined
        const txt = firstSkill && typeof firstSkill.text === 'string' && firstSkill.text.length > 0 ? firstSkill.text : '—'
        this.personSkillText.setText(`${t('skill')}: ${txt}`)
        const col = firstSkill && typeof firstSkill.positive === 'boolean' ? (firstSkill.positive ? '#81c784' : '#e57373') : THEME.colors.text
        this.personSkillText.setColor(col)
      }
      return
    }
    // Очищаем инвентарь и скрываем все элементы врага при переключении к жителю
    if (this._previewCurrentIsEnemy && this._previewCurrentId !== null) {
      // Скрываем все элементы врага
      if (this.personPreviewSprite) this.personPreviewSprite.setVisible(false)
      if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
      if (this.personPreviewPants) this.personPreviewPants.setVisible(false)
      if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
      if (this.personPreviewHair) this.personPreviewHair.setVisible(false)
      if (this.personPreview) this.personPreview.setVisible(false)

      // Очищаем инвентарь
      this.clearInventorySlots()
    }

    // Устанавливаем нового жителя (сбрасываем флаги врагов)
    this._previewCurrentIsEnemy = false
    this._previewCurrentId = first.id
    const data = this.getPersonData(first.id)
    if (this.personNameText) this.personNameText.setText(`${t('name')}: ${data.name}`)
    if (this.personDetailsText) this.personDetailsText.setText(`${t('age')}: ${data.age}\nПОЛ: ${data.gender}\n${t('specialty')}: ${data.profession}`)
    if (this.personSkillText) {
      const skills = (data as any).allSkills as Array<{ text: string; positive: boolean }> | undefined
      const firstSkill = Array.isArray(skills) && skills.length > 0 ? skills[0] : undefined
      const txt = firstSkill && typeof firstSkill.text === 'string' && firstSkill.text.length > 0 ? firstSkill.text : '—'
      this.personSkillText.setText(`${t('skill')}: ${txt}`)
      const col = firstSkill && typeof firstSkill.positive === 'boolean' ? (firstSkill.positive ? '#81c784' : '#e57373') : THEME.colors.text
      this.personSkillText.setColor(col)
    }
    // Показываем инвентарь в превью
    if (this.personPreviewInventory && data.inventory) {
      const inventorySlots = this.personPreviewInventory.list as Phaser.GameObjects.Container[]
      // Скрываем все слоты и очищаем содержимое
      inventorySlots.forEach(slot => {
        const children = slot.list as Phaser.GameObjects.GameObject[]
        const bg = children[0] as Phaser.GameObjects.Rectangle
        const itemSprite = children[1] as Phaser.GameObjects.Sprite
        const quantityText = children[2] as Phaser.GameObjects.Text

        // Скрываем спрайт предмета
        itemSprite.setVisible(false)
        itemSprite.setTexture('') // Очищаем текстуру
        itemSprite.setScale(1.2, 1.2) // Устанавливаем правильный масштаб

        // Очищаем и скрываем текст количества
        quantityText.setText('')
        quantityText.setPosition(20, 20) // Сбрасываем позицию
        quantityText.setVisible(false)

        // Восстанавливаем фон слота
        bg.setFillStyle(0x333333, 0.8)
        bg.setSize(56, 56) // Восстанавливаем размер по умолчанию

        // Отключаем интерактивность перед заполнением
        bg.disableInteractive()
      })

      // Показываем предметы из инвентаря
      data.inventory.forEach((item: { id: string; quantity: number }, index: number) => {
        if (index < 3 && inventorySlots[index]) {
          const slot = inventorySlots[index]
          const children = slot.list as Phaser.GameObjects.GameObject[]
          const bg = children[0] as Phaser.GameObjects.Rectangle
          const itemSprite = children[1] as Phaser.GameObjects.Sprite
          const quantityText = children[2] as Phaser.GameObjects.Text

          const itemData = this.getItemById(item.id)
          if (itemData) {
            // Показываем спрайт предмета
            // Извлекаем имя файла без пути и расширения
            const textureKey = itemData.spritePath.split('/').pop()?.replace('.png', '') || item.id
            try {
              itemSprite.setTexture(textureKey)
              // Устанавливаем масштаб для предмета в слоте (увеличиваем в 2 раза)
              itemSprite.setScale(1.2, 1.2) // Масштаб 120% для хорошей видимости в 56x56 слоте
              itemSprite.setVisible(true)
            } catch (error) {
              console.warn(`[updatePersonInfoFromQueue] Не удалось загрузить текстуру для ${item.id}:`, error)
              // Показываем запасной текст
              itemSprite.setVisible(false)
            }

            // Показываем количество если > 1
            if (item.quantity > 1) {
              quantityText.setText(item.quantity.toString())
              quantityText.setPosition(20, 20) // Позиция для больших слотов
              quantityText.setVisible(true)
            }

            // Подсвечиваем слот в зависимости от категории предмета
            let highlightColor = 0x555555 // Серый для обычных предметов
            let highlightAlpha = 0.9

            if (itemData.category === 'quest') {
              // Желтый/золотой цвет для квестовых предметов
              highlightColor = 0xffd700
              highlightAlpha = 0.95
              console.log(`[InventorySlot] Квестовый предмет подсвечен золотым: ${item.id}`)
            } else if (itemData.category === 'sidequest') {
              // Синий/фиолетовый цвет для побочных предметов
              highlightColor = 0x9c27b0
              highlightAlpha = 0.95
              console.log(`[InventorySlot] Побочный предмет подсвечен фиолетовым: ${item.id}`)
            }

            bg.setFillStyle(highlightColor, highlightAlpha)

            // Включаем интерактивность для слота с предметом
            console.log(`[InventorySlot] Устанавливаем интерактивность для слота ${index} с предметом ${item.id}`)
            bg.setInteractive({ useHandCursor: true })
            bg.on('pointerdown', () => {
              console.log(`[InventorySlot] Клик по слоту ${index}, предмет: ${item.id}`)
              this.showItemTooltip(index)
            })
          }
        }
      })

      this.personPreviewInventory.setVisible(true)
    }

    // Проверяем специализацию и отображаем соответствующий спрайт или рамку
    const profession = data.profession.toLowerCase()
    const specialistSpriteKey = getSpecialistSpriteKey(profession)
    
    console.log('[DEBUG] Профессия:', profession, 'Ключ спрайта:', specialistSpriteKey)
    
    if (specialistSpriteKey && this.personPreviewSprite) {
      // Отображаем спрайт специализации
      console.log('[DEBUG] Показываем спрайт специализации для жителя:', profession, specialistSpriteKey)
      ensureSpecialistAnimations(this, profession)
      this.personPreviewSprite.setTexture(specialistSpriteKey)
      this.personPreviewSprite.anims.play(`${profession}_idle`)
      this.personPreviewSprite.setVisible(true)
      this.personPreviewSprite.setAlpha(1)
      
      // Масштабируем спрайт 128x128 под размер рамки (56x72)
      const scaleX = 56 / 128
      const scaleY = 72 / 128
      this.personPreviewSprite.setScale(scaleX, scaleY)
      
      // Скрываем рамку когда показываем спрайт
      if (this.personPreview) this.personPreview.setVisible(false)
      
      // Скрываем слои одежды для специализации
      if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
      if (this.personPreviewPants) this.personPreviewPants.setVisible(false) 
      if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
      if (this.personPreviewHair) this.personPreviewHair.setVisible(false)
    } else {
            // Скрываем рамку для остальных профессий
    if (this.personPreview) {
        this.personPreview.setVisible(false)
    }
      // Убираем отображение спрайтов для посетителей - показываем только рамку
    if (this.personPreviewSprite) {
        this.personPreviewSprite.setVisible(false)
      }
      // Скрываем все слои одежды
      if (this.personPreviewShirt) this.personPreviewShirt.setVisible(false)
      if (this.personPreviewPants) this.personPreviewPants.setVisible(false) 
      if (this.personPreviewFootwear) this.personPreviewFootwear.setVisible(false)
      if (this.personPreviewHair) this.personPreviewHair.setVisible(false)
    }
    this.updateUIVisibility()
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    // Анимация входа для превью жителя (спрайт или рамка)
    if (this.lastPersonRect) {
      if (specialistSpriteKey && this.personPreviewSprite && this.personPreviewSprite.visible) {
        // Анимация входа для спрайта специализации
        const sr = this.lastPersonRect
        const toX = this.personPreviewSprite.x
        const toY = this.personPreviewSprite.y
        // Начинаем слева за границей экрана
        this.personPreviewSprite.setPosition(-60, toY)
        // Поворачиваем лицом в сторону движения (вправо)
        this.personPreviewSprite.setFlipX(false)
        // Проигрываем анимацию ходьбы при входе
        this.personPreviewSprite.anims.play(`${profession}_walk`)
        // Анимируем въезд спрайта слева
        this.tweens.add({
          targets: this.personPreviewSprite,
          x: toX,
          duration: 900,
          ease: 'Sine.easeOut',
          onComplete: () => {
            // Переключаемся на idle после входа
            this.personPreviewSprite?.anims.play(`${profession}_idle`)
          }
        })
      }
      // Рамка скрыта, анимация не нужна
    }
  }

  private updateUIVisibility(): void {
    const isNight = this.phase === 'night'
    const hasEnemies = this.enemyQueueItems.length > 0
    const hasVisitors = this.queueItems.length > 0
    const showDecision = !isNight && !hasEnemies && hasVisitors
    const showDefense = isNight && hasEnemies
    const showPersonDetails = hasVisitors || hasEnemies
    const capacity = this.getBunkerCapacity()
    const hasCapacity = this.bunkerResidents.length < capacity
    const showAccept = !isNight && !hasEnemies && hasVisitors && hasCapacity
    const showDeny = !isNight && !hasEnemies && hasVisitors

    // Принудительно обновляем видимость кнопок
    if (this.acceptBtnObj) this.acceptBtnObj.setVisible(showAccept)
    if (this.denyBtnObj) this.denyBtnObj.setVisible(showDeny)
    
    // Принудительно обновляем видимость деталей
    if (this.personNameText) this.personNameText.setVisible(showPersonDetails)
    if (this.personDetailsText) this.personDetailsText.setVisible(showPersonDetails)
    if (this.personSkillText) this.personSkillText.setVisible(showPersonDetails)
  }

  private generatePersonInventory(profession: string): Array<{ id: string; quantity: number }> {
    const inventory: Array<{ id: string; quantity: number }> = []

    // Добавляем обязательные ресурсы для определенных профессий
    if (profession === 'бездомный') {
      // Бездомные всегда приносят критически важные ресурсы: вода или еда (10-25)
      const criticalResources = ['water', 'food']
      const randomResource = criticalResources[Math.floor(Math.random() * criticalResources.length)]
      const quantity = Math.floor(Math.random() * 16) + 10 // 10-25
      inventory.push({ id: randomResource, quantity })
      console.log(`[generatePersonInventory] 🏠 Бездомный принес ${randomResource}: ${quantity} ед.`)
    }
    
    if (profession === 'безработный') {
      // Безработные всегда приносят деньги (1-20)
      const moneyQuantity = Math.floor(Math.random() * 20) + 1 // 1-20
      inventory.push({ id: 'money', quantity: moneyQuantity })
      console.log(`[generatePersonInventory] 💼 Безработный принес деньги: ${moneyQuantity} ед.`)
    }
    
    if (['солдат', 'охотник', 'разведчик'].includes(profession)) {
      // Солдаты, охотники, разведчики всегда приносят патроны (1-50)
      const ammoQuantity = Math.floor(Math.random() * 50) + 1 // 1-50
      inventory.push({ id: 'ammo', quantity: ammoQuantity })
      console.log(`[generatePersonInventory] 🎯 ${profession} принес патроны: ${ammoQuantity} ед.`)
    }

    // Определяем количество дополнительных предметов (0-3)
    const itemCount = Math.floor(Math.random() * 4) // 0-3 предмета

    // Список доступных предметов для генерации
    const availableItems = [
      // Ресурсы (могут быть в количестве 1-25)
      'food', 'water', 'ammo', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass', 'money',
      // Оборудование (только 1 шт)
      'backpack', 'compass', 'map', 'flashlight', 'bottle', 'lighter', 'matches',
      'multi_tool', 'laptop', 'radio', 'gps',
      // Одежда (только 1 шт)
      'shirt', 'shirt2', 'pants', 'pants3', 'jacket1', 'jacket2', 'boots', 'hat', 'cap',
      // Медицина (только 1 шт)
      'medicine', 'medicine2', 'med_backpack'
    ]

    // Квестовые предметы - только 1 в инвентаре жителя
    const questItems = ['laptop', 'radio', 'gps', 'phone', 'transmitter', 'map']
    let questItemAdded = false

    // Бездомные получают на 50% больше предметов
    const isHomeless = profession === 'бездомный'
    const bonusMultiplier = isHomeless ? 1.5 : 1

    for (let i = 0; i < itemCount; i++) {
      let randomItem: string

      // Если уже добавлен квестовый предмет, не добавляем больше
      if (questItemAdded) {
        // Фильтруем список, исключая квестовые предметы
        const nonQuestItems = availableItems.filter(item => !questItems.includes(item))
        randomItem = nonQuestItems[Math.floor(Math.random() * nonQuestItems.length)]
      } else {
        // С шансом 15% выбираем квестовый предмет вместо обычного
        const isQuestRoll = Math.random() < 0.15
        if (isQuestRoll) {
          randomItem = questItems[Math.floor(Math.random() * questItems.length)]
          questItemAdded = true
        } else {
          const nonQuestItems = availableItems.filter(item => !questItems.includes(item))
          randomItem = nonQuestItems[Math.floor(Math.random() * nonQuestItems.length)]
        }
      }

      const itemData = this.getItemById(randomItem)

      if (itemData) {
        const isStackable = ['food', 'water', 'ammo', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass', 'money'].includes(randomItem)
        const quantity = isStackable
          ? Math.floor(Math.random() * 25) + 1 * bonusMultiplier // 1-25 * bonusMultiplier
          : Math.floor(1 * bonusMultiplier) // 1 * bonusMultiplier

        // Проверяем, есть ли уже такой предмет в инвентаре
        const existingItem = inventory.find(item => item.id === randomItem)
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          inventory.push({ id: randomItem, quantity: Math.floor(quantity) })
        }
      }
    }

    // Добавляем побочные квестовые предметы
    this.addSidequestItemsToInventory(inventory, profession)

    return inventory
  }

  /**
   * Добавляет побочные квестовые предметы в инвентарь персонажа
   */
  private addSidequestItemsToInventory(inventory: Array<{ id: string; quantity: number }>, profession: string): void {
    if (!this.truthfulFaction) {
      console.warn('[addSidequestItemsToInventory] Правдивая фракция не установлена')
      return
    }

    try {
      // Проверяем, есть ли уже квестовый предмет в инвентаре
      const hasQuestItem = inventory.some(item => {
        const itemData = this.getItemById(item.id)
        return itemData?.category === 'quest' || itemData?.category === 'sidequest'
      })

      // Если уже есть квестовый предмет, не добавляем побочный
      if (hasQuestItem) {
        console.log(`[addSidequestItemsToInventory] ${profession} уже имеет квестовый предмет, пропускаем побочный`)
        return
      }

      const sidequestManager = getSidequestItemManager(this.sessionSeed)

      // Определяем фракцию персонажа на основе профессии (опционально)
      const characterFaction = this.getCharacterFactionByProfession(profession)

      // Шанс получить побочный предмет (снижен до 15% для всех персонажей)
      const sidequestChance = 0.15

      if (Math.random() < sidequestChance) {
        // Получаем случайный побочный предмет
        const sidequestItem = sidequestManager.getRandomItemForInventory(
          this.truthfulFaction,
          characterFaction
        )

        if (sidequestItem) {
          // Добавляем побочный предмет как обычный предмет с количеством 1
          inventory.push({ id: sidequestItem.id, quantity: 1 })

          console.log(`[addSidequestItemsToInventory] 📜 ${profession} принес побочный предмет: ${sidequestItem.name} (тема: ${sidequestItem.theme}, фракция: ${sidequestItem.targetFaction || 'нейтральный'})`)
        }
      }
    } catch (error) {
      console.error('[addSidequestItemsToInventory] Ошибка добавления побочных предметов:', error)
    }
  }

  /**
   * Определяет фракцию персонажа на основе его профессии
   */
  private getCharacterFactionByProfession(profession: string): FactionId | undefined {
    // Простая логика связи профессий с фракциями
    // Можно расширить в будущем для более сложной системы
    
    switch (profession) {
      case 'солдат':
      case 'разведчик':
        return 'hq' // Штаб
        
      case 'охотник':
      case 'химик':
        return 'rebels' // Повстанцы (могут быть связаны с природой и химией)
        
      case 'бездомный':
        return 'marauders' // Мародеры (маргинальные элементы)
        
      case 'ученый':
      case 'инженер':
      case 'доктор':
        return 'free' // Свободные (интеллектуалы, ценящие знания)
        
      default:
        return undefined // Нейтральные персонажи
    }
  }

  private generateInventoryText(inventory: Array<{ id: string; quantity: number }>): string {
    if (inventory.length === 0) {
      return 'пусто'
    }

    return inventory.map(item => {
      const itemData = this.getItemById(item.id)
      const name = itemData ? itemData.name : item.id
      return `${name} x${item.quantity}`
    }).join(', ')
  }

  private generatePersonData(seed: number): { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; inventory: Array<{ id: string; quantity: number }> } {
    let s = (seed ^ this.sessionSeed) >>> 0
    const rng = (min: number, max: number) => {
      // Xorshift32
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
      const n = (s & 0xffffffff) / 0x100000000
      return Math.floor(min + n * (max - min + 1))
    }
    const pick = <T>(arr: T[]) => arr[rng(0, arr.length - 1)]
    const genders = ['М', 'Ж']
    const maleNames = ['Алексей', 'Иван', 'Сергей', 'Дмитрий', 'Максим', 'Никита', 'Павел', 'Егор', 'Олег', 'Антон']
    const femaleNames = ['Анна', 'Екатерина', 'Мария', 'Алина', 'Ольга', 'Наталья', 'София', 'Виктория', 'Дарья', 'Юлия']
    const professions = ['доктор','повар','сантехник','ученый','инженер','химик','разведчик','охотник','безработный','бездомный','солдат']
    const skillsPos = ['трудолюбивый','гений','лидер','везунчик','крепкий иммунитет','герой']
    const skillsNeg = ['лентяй','выгоревший','слепой','группа инвалидности','шпион','страдает бессоницей','сова','неудачник','зараженный','неизлечимая болезнь','трус']

    // Равновероятный выбор пола (недетерминированный, чтобы избежать смещения)
    let gender = Math.random() < 0.5 ? 'Ж' : 'М'
    if (gender !== 'М' && gender !== 'Ж') gender = 'М'
    let name = gender === 'М' ? pick(maleNames) : pick(femaleNames)
    if (!name) name = gender === 'М' ? 'Иван' : 'Анна'
    let age = rng(18, 80)
    if (age < 18 || age > 80) age = 18 + Math.abs(age % 63)
    // 50% безработный, иначе равновероятно из остальных
    let profession: string | undefined
    const roll = Math.random()
    if (roll < 0.5) {
      profession = 'безработный'
    } else {
      const pool = professions.filter(p => p !== 'безработный')
      // Выбор из пула без привязки к xorshift
      const idx = Math.floor(Math.random() * pool.length)
      profession = pool[Math.min(pool.length - 1, Math.max(0, idx))]
    }
    console.log('[generatePersonData] roll=', roll.toFixed(3), 'profession=', profession)
    if (!profession) profession = 'безработный'
    
    // Генерируем навыки (1..3) — используем независимую от xorshift случайность для разнообразия
    const randInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1))
    let numSkills = randInt(1, 3)
    if (numSkills < 1) numSkills = 1
    const allSkills: Array<{ text: string; positive: boolean }> = []
    const usedSkills = new Set<string>()
    const getUniqueSkill = (pool: string[]): string => {
      let guard = 0
      let skillText = pool[0]
      while (guard++ < 50) {
        const idx = randInt(0, pool.length - 1)
        skillText = pool[idx]
        if (!usedSkills.has(skillText)) break
      }
      usedSkills.add(skillText)
      return skillText
    }
    for (let i = 0; i < numSkills; i++) {
      // 50/50 базово, меняем полярность для разнообразия
      let isPositive = Math.random() < 0.5
      if (i > 0 && allSkills[i - 1]?.positive === isPositive) isPositive = !isPositive
      const pool = isPositive ? skillsPos : skillsNeg
      let skillText = getUniqueSkill(pool)
      if (!skillText || typeof skillText !== 'string') skillText = isPositive ? skillsPos[0] : skillsNeg[0]
      allSkills.push({ text: String(skillText), positive: isPositive })
    }
    if (allSkills.length === 0) allSkills.push({ text: 'лидер', positive: true })
    // Открытый навык — первый из списка
    const openSkill = allSkills[0]
    
    // Генерируем инвентарь персонажа
    const inventory = this.generatePersonInventory(profession)

    // Формируем текстовое описание инвентаря
    const inventoryText = this.generateInventoryText(inventory)
    const itemsText = inventoryText !== 'пусто' ? inventoryText : 'пусто'

    return { name, gender, age, profession, openSkill, allSkills, itemsText, inventory }
  }

  private getPersonData(id: number): { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; inventory: Array<{ id: string; quantity: number }> } {
    const cached = this.personCache.get(id)
    if (cached) return cached
    const data = this.generatePersonData(id)
    this.personCache.set(id, data)
    return data
  }

  private addResidentToBunker(id: number, personData: { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; inventory: Array<{ id: string; quantity: number }> }): void {
    console.log(`[addResidentToBunker] Добавляем жителя ${personData.name} (${personData.profession}) с навыками: ${personData.allSkills.map(s => `${s.text}(${s.positive ? '+' : '-'})`).join(', ')}`)
    
    this.bunkerResidents.push({
      id,
      name: personData.name,
      gender: personData.gender,
      age: personData.age,
      profession: personData.profession,
      skills: personData.allSkills,
      itemsText: personData.itemsText,
      inventory: personData.inventory || [],
      admittedAt: this.time.now,
      status: 'отдыхает',
      hunger: 100,
      thirst: 100,
      energy: 100,
      health: 100,
      patient: false,
      insane: false,
      insaneSince: undefined,
      intent: 'peaceful' // Мирное поведение по умолчанию
    })

    console.log(`[addResidentToBunker] Житель ${personData.name} добавлен с ID ${id}, здоровье: 100%`)

    // Проверяем предметы жителя и разблокируем фракции
    if (personData.inventory && personData.inventory.length > 0) {
      personData.inventory.forEach(item => {
        if (this.factionManager?.unlockFactionByItem(item.id)) {
          console.log(`[addResidentToBunker] Разблокирована фракция для предмета ${item.id} от жителя ${personData.name}`)
        }
      });
    }

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('recruit');
    this.updateFactionQuestProgress('accept_profession', personData.profession);
    this.updateFactionQuestProgress('accept_gender', personData.gender);

    // Проверяем навыки жителя
    if (personData.allSkills && personData.allSkills.length > 0) {
      personData.allSkills.forEach((skill: any) => {
        if (skill.positive) {
          this.updateFactionQuestProgress('accept_skill', skill.text);
        }
      });
    }

    // Специальное логирование для докторов
    if (personData.profession === 'доктор' || personData.profession === 'врач') {
      console.log(`[addResidentToBunker] 🏥 Доктор ${personData.name} добавлен в бункер! Теперь может лечить жителей каждый час во время работы`)
    }
    
    // Обновляем ресурсы
    this.updateAllResources()
    
    // Синхронизируем с bunkerView для создания визуального жителя
    // Важно: передаем общее количество жителей + врагов для правильной синхронизации
    // Но НЕ создаем дубликатов существующих агентов
    // Используем специальный флаг для предотвращения дублирования
    if (this.simpleBunker && typeof (this.simpleBunker as any).syncResidentsWithoutDuplicates === 'function') {
      (this.simpleBunker as any).syncResidentsWithoutDuplicates(this.bunkerResidents.length + this.bunkerEnemies.length)
    } else {
      this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)
    }
    
    // Обновляем видимость/лейаут приёмной панели
    this.updateUIVisibility()
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  // Механика смерти/удаления жителя (освобождает место)
  public removeResidentFromBunker(id: number, reason?: string): void {
    const idx = this.bunkerResidents.findIndex(r => r.id === id)
    if (idx >= 0) {
      const [r] = this.bunkerResidents.splice(idx, 1)
      // Можно в будущем логировать причину/статистику
      this.updateAllResources()
      // После изменения состава жителей: обновляем видимость/лейаут приёмной панели
      this.updateUIVisibility()
      if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
      this.simpleBunker?.syncResidents(this.bunkerResidents.length + this.bunkerEnemies.length)
      if (reason) this.showToast(`${r.name} удалён: ${reason}`)
      
      // Проверяем возможность разблокировки врагов в очереди
      this.unblockEnemiesIfPossible()
    }
  }

  // Функция для удаления мертвого жителя (вызывается из bunkerView)
  public removeDeadResident(id: number, reason?: string): void {
    const idx = this.bunkerResidents.findIndex(r => r.id === id)
    if (idx >= 0) {
      const [r] = this.bunkerResidents.splice(idx, 1)
      console.log(`[GameScene] Удаляем мертвого жителя ${r.name} (ID: ${r.id}) из bunkerResidents по причине: ${reason}`)

      // Синхронизируем с SimpleBunkerView - вызываем анимацию смерти
      if (this.simpleBunker) {
        try {
          console.log(`[removeDeadResident] Ищем агента жителя ${r.name} (ID: ${id}) в SimpleBunkerView`)
          
          // Находим агента жителя
          const agent = this.simpleBunker.getResidentAgentById(id)
          console.log(`[removeDeadResident] Результат поиска агента:`, agent ? `найден (ID: ${agent.id})` : 'НЕ найден')
          
          if (agent) {
            console.log(`[removeDeadResident] Агент найден, проверяем его состояние:`, {
              id: agent.id,
              profession: agent.profession,
              sprite: !!agent.sprite,
              anims: !!(agent.sprite && agent.sprite.anims)
            })
            
            // Вызываем анимацию смерти (она сама удалит агента через 1000ms)
            console.log(`[removeDeadResident] Вызываем setDeadAnimation для агента ${agent.id}`)
            this.simpleBunker.setDeadAnimation(agent)
            console.log(`[removeDeadResident] Анимация смерти запущена для жителя ${r.name}`)
          } else {
            // Если агент не найден, сразу удаляем
            console.log(`[removeDeadResident] Агент жителя ${r.name} не найден, удаляем напрямую`)
            this.simpleBunker.removeResidentAgent(id)
          }
        } catch (error) {
          console.error(`[removeDeadResident] Ошибка при работе с SimpleBunkerView:`, error)
        }
      } else {
        console.warn(`[removeDeadResident] SimpleBunkerView не инициализирован`)
      }

      // Обновляем UI
      this.updateAllResources()
      this.onBunkerChanged()

      // Показываем уведомление о смерти в зависимости от причины
      let deathMessage = ''
      if (reason === 'убит в драке между жителями') {
        deathMessage = `${r.name} убит в драке между жителями!`
      } else if (reason === 'неизлечимая болезнь') {
        deathMessage = `${r.name} умер от неизлечимой болезни!`
      } else if (reason === 'заражение') {
        deathMessage = `${r.name} умер от заражения!`
      } else if (reason === 'голод') {
        deathMessage = `${r.name} умер от голода!`
      } else if (reason === 'жажда') {
        deathMessage = `${r.name} умер от жажды!`
      } else {
        deathMessage = `${r.name} погиб в бою с врагами!`
      }
      this.showToast(`💀 ${deathMessage}`)
      
      // Проверяем возможность разблокировки врагов в очереди
      this.unblockEnemiesIfPossible()
    }
  }



  private transferPersonInventoryToBunker(personData: { name: string; gender: string; age: number; profession: string; openSkill: { text: string; positive: boolean }; allSkills: Array<{ text: string; positive: boolean }>; itemsText: string; inventory: Array<{ id: string; quantity: number }> }): void {
    if (!personData.inventory || personData.inventory.length === 0) {
      return
    }

    let inventoryChanged = false
    let resourceItems = 0
    let regularItems = 0

    // Обрабатываем каждый предмет из инвентаря персонажа
    for (const personItem of personData.inventory) {
      const itemData = this.getItemById(personItem.id)
      if (!itemData) {
        console.warn(`[transferPersonInventoryToBunker] Предмет ${personItem.id} не найден в справочнике`)
        continue
      }

      // Проверяем, является ли предмет базовым ресурсом
      const isBasicResource = ['food', 'water', 'ammo', 'money', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass'].includes(personItem.id)

      if (isBasicResource) {
        // Для базовых ресурсов обновляем их количество в специальных ячейках
        if (typeof window !== 'undefined' && window.addResource) {
          window.addResource(personItem.id, personItem.quantity)
          resourceItems++
        }
      } else {
        // Для остальных предметов добавляем в обычный инвентарь с проверкой лимитов
        const added = this.addItemToBunkerInventory(personItem.id, personItem.quantity)
        if (added) {
          regularItems++
          inventoryChanged = true
        } else {
          console.log(`[transferPersonInventoryToBunker] Не удалось добавить предмет ${personItem.id} - нет свободных слотов`)
          // Можно добавить уведомление игроку если нужно
        }
      }
    }

    // Обновляем обычный инвентарь если были добавлены предметы
    if (inventoryChanged) {
      // Фильтруем только существующие предметы (на случай если какие-то предметы были удалены из справочника)
      this.bunkerInventory = this.bunkerInventory.filter(item => {
        return item && item.id && this.getItemById(item.id) !== undefined
      })

      // Обновляем все модальные окна инвентаря
      if (typeof window.populateInventoryModal === 'function') {
        // Используем полный bunkerInventory вместо getDefaultInventory для точной синхронизации
        window.populateInventoryModal(this.bunkerInventory, this.inventoryRows)
      }
    }

    // Показываем уведомление с учетом ресурсов и предметов
    let message = ''
    if (resourceItems > 0 && regularItems > 0) {
      message = `Получено ${resourceItems} ресурсов и ${regularItems} предметов от ${personData.name}`
    } else if (resourceItems > 0) {
      message = `Получено ${resourceItems} ресурсов от ${personData.name}`
    } else if (regularItems > 0) {
      message = `Получено ${regularItems} предметов от ${personData.name}`
    }

    if (message) {
      this.showToast(message)
    }
  }

  // Функции для drag and drop инвентаря
  public swapInventoryItems(slot1: number, slot2: number): boolean {
    if (slot1 === slot2 || slot1 < 0 || slot2 < 0) return false

    const totalSlots = 6 * this.inventoryRows
    if (slot1 >= totalSlots || slot2 >= totalSlots) return false

    // Расширяем массив до максимального индекса, используя undefined для пустых слотов
    while (this.bunkerInventory.length <= Math.max(slot1, slot2)) {
      this.bunkerInventory.push(undefined)
    }

    // Меняем местами предметы
    const temp = this.bunkerInventory[slot1]
    this.bunkerInventory[slot1] = this.bunkerInventory[slot2]
    this.bunkerInventory[slot2] = temp

    this.cleanupEmptySlots()
    return true
  }

  public moveInventoryItem(fromSlot: number, toSlot: number): boolean {
    if (fromSlot === toSlot || fromSlot < 0 || toSlot < 0) return false

    const totalSlots = 6 * this.inventoryRows
    if (fromSlot >= totalSlots || toSlot >= totalSlots) return false

    // Если целевая ячейка пуста, просто перемещаем предмет
    if (toSlot >= this.bunkerInventory.length || !this.bunkerInventory[toSlot] || this.bunkerInventory[toSlot].id === '') {
      if (fromSlot < this.bunkerInventory.length && this.bunkerInventory[fromSlot]) {
        const item = this.bunkerInventory[fromSlot]
        this.bunkerInventory.splice(fromSlot, 1)
        // Добавляем undefined слоты до целевой позиции
        while (this.bunkerInventory.length < toSlot) {
          this.bunkerInventory.push(undefined)
        }
        this.bunkerInventory[toSlot] = item
        this.cleanupEmptySlots()
        return true
      }
      return false
    }

    // Если в целевой ячейке есть предмет, меняем их местами
    if (fromSlot < this.bunkerInventory.length) {
      const fromItem = this.bunkerInventory[fromSlot]
      const toItem = this.bunkerInventory[toSlot]

      // Меняем местами
      this.bunkerInventory[fromSlot] = toItem
      this.bunkerInventory[toSlot] = fromItem

      this.cleanupEmptySlots()
      return true
    }

    return false
  }

  private cleanupEmptySlots(): void {
    // Удаляем пустые слоты в конце массива
    while (this.bunkerInventory.length > 0 &&
          (!this.bunkerInventory[this.bunkerInventory.length - 1] ||
           (this.bunkerInventory[this.bunkerInventory.length - 1] &&
            (this.bunkerInventory[this.bunkerInventory.length - 1]!.id === '' ||
             this.bunkerInventory[this.bunkerInventory.length - 1]!.quantity === 0)))) {
      this.bunkerInventory.pop()
    }
  }



  // Обновление статуса жителя из bunkerView
  public _updateResidentStatus(id: number, status: string): void {
    const r = this.bunkerResidents.find(x => x.id === id)
    if (!r) return
    r.status = status
    // Если открыт оверлей деталей — можно в будущем обновлять его вживую
  }

  private layoutContainer(container: Phaser.GameObjects.Container, rect: Phaser.Geom.Rectangle): void {
    container.setPosition(rect.x, rect.y)
    const existingBg = container.list.find(g => g.name === 'panelBg') as Phaser.GameObjects.Rectangle | undefined
    if (existingBg) existingBg.destroy()
    applyPanelBackground(this, rect, container)
    
    // Обновляем маску для bunkerArea
    if (container === this.bunkerArea) {
      const mask = container.getData('mask') as Phaser.GameObjects.Graphics
      if (mask) {
        mask.clear()
        mask.fillStyle(0xffffff)
        // Маска должна быть в мировых координатах относительно сцены
        mask.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    }
  }

  /**
   * УНИВЕРСАЛЬНЫЙ метод для обновления всех ресурсов
   * Обеспечивает полную синхронизацию между Phaser UI и HTML overlay
   * ВСЕ обновления ресурсов должны проходить через эту функцию!
   */
  private updateAllResources(): void {
    // Получаем округленные данные ресурсов
    const roundedResources = this.getResourcesData();
    
    // Обновляем Phaser UI с округленными значениями
    this.updateResourcesTextWithData(roundedResources);
    
    // Обновляем HTML overlay с теми же округленными значениями
    this.updateUIOverlayWithData(roundedResources);
    
    // Логируем для отладки

  }

  /**
   * Обновляет HTML overlay с переданными данными ресурсов
   * Используется для синхронизации с Phaser UI
   */
  private updateUIOverlayWithData(resources: { [key: string]: number }): void {
    if (!this.uiOverlay || typeof window.updateGameUI !== 'function') return;

    try {
      const gameData = {
        day: this.dayNumber,
        phase: this.phase,
        time: this.getClockText(),
        population: this.bunkerResidents.length,
        capacity: this.getBunkerCapacity(),
        happiness: resources.happiness || Math.floor(this.happiness),
        defense: resources.defense || Math.floor(this.defense),
        comfort: resources.comfort || Math.floor(this.comfort),
        moral: resources.moral || Math.floor(this.moral),
        enemies: this.bunkerEnemies.length,
        bunkerLevel: this.bunkerLevel,
        bunkerExperience: Math.floor(this.bunkerExperience),
        maxExperience: Math.floor(this.maxExperienceForLevel),
        abilityPoints: this.abilityPoints,
        ...resources // Включаем все ресурсы
      };


      window.updateGameUI(gameData);

      // Также обновляем ресурсы в инвентаре
      if (typeof window.updateAllResourceDisplays === 'function') {
        window.updateAllResourceDisplays();
      }
    } catch (error) {
      console.error('[GameScene] Error updating UI overlay with data:', error);
    }
  }

  /**
   * Обновляет Phaser UI с переданными данными ресурсов
   * Используется для синхронизации с HTML overlay
   */
  private updateResourcesTextWithData(resources: { [key: string]: number }): void {
    const population = this.bunkerResidents.length
    const enemyCount = this.bunkerEnemies.length
    const compact = isPortrait(this) || this.scale.width < 700
    const capacity = this.getBunkerCapacity()

    // Обновляем UI с округленными значениями из resources
    if (compact) {
      this.populationBtn?.setText(`👥 ${population}/${capacity}`)
      this.happinessBtn?.setText(`😊 ${resources.happiness || Math.floor(this.happiness)}%`)
      this.ammoBtn?.setText(`🔫 ${resources.ammo || Math.floor(this.ammo)}`)
      this.comfortBtn?.setText(`🛋️ ${resources.comfort || Math.floor(this.comfort)}%`)
      this.foodBtn?.setText(`🍖 ${resources.food || Math.floor(this.food)}`)
      this.waterBtn?.setText(`💧 ${resources.water || Math.floor(this.water)}`)
      this.moneyBtn?.setText(`💰 ${resources.money || Math.floor(this.money)}`)
      this.enemyCountText?.setText(`👹 ${enemyCount}`)
      this.resourcesText?.setText('')
    } else {
      this.populationBtn?.setText(`${t('population').toUpperCase()}: ${population}/${capacity}`)
      this.happinessBtn?.setText(`Happiness: ${resources.happiness || Math.floor(this.happiness)}%`)
      this.ammoBtn?.setText(`Ammo: ${resources.ammo || Math.floor(this.ammo)}`)
      this.comfortBtn?.setText(`Comfort: ${resources.comfort || Math.floor(this.comfort)}%`)
      this.foodBtn?.setText(`${t('food')}: ${resources.food || Math.floor(this.food)}`)
      this.waterBtn?.setText(`${t('water')}: ${resources.water || Math.floor(this.water)}`)
      this.moneyBtn?.setText(`${t('money')}: ${resources.money || Math.floor(this.money)}`)
      this.enemyCountText?.setText(`Enemies: ${enemyCount}`)
      this.resourcesText?.setText('')
    }

    // Обновляем уровень и шкалу опыта
    if (this.levelText) {
      this.levelText.setText(`Bunker Level: ${this.bunkerLevel}`)
    }
    if (this.xpText) {
      this.xpText.setText(`XP: ${Math.floor(this.bunkerExperience)}/${Math.floor(this.maxExperienceForLevel)}`)
    }
    if (this.experienceFg && this.experienceBg) {
      const progress = this.maxExperienceForLevel > 0 ? (this.bunkerExperience / this.maxExperienceForLevel) : 0
      this.experienceFg.setSize(Math.max(0, this.experienceBg.width * progress), this.experienceFg.height)
    }

    this.arrangeTopBarRow()
  }

  /**
   * Устаревший метод для обратной совместимости
   * Теперь вызывает updateAllResources для полной синхронизации
   */
  private updateResourcesText(): void {
    // Вызываем универсальный метод для полной синхронизации
    this.updateAllResources();
  }



  // Балансные ставки расхода потребностей по сложности (единиц в час)
  public getNeedsRates(): { hunger: number; thirst: number; energyWork: number; energyIdle: number } {
    switch (this.difficulty) {
      case 'easy':
        return { hunger: 2, thirst: 3, energyWork: 10, energyIdle: 3 }
      case 'hard':
        return { hunger: 4, thirst: 6, energyWork: 14, energyIdle: 5 }
      default:
        return { hunger: 3, thirst: 5, energyWork: 12, energyIdle: 4 }
    }
  }

  /**
   * Получает информацию о текущем потреблении ресурсов
   */
  public getResourceConsumptionInfo(): { 
    foodConsumption: number; 
    waterConsumption: number; 
    foodMultiplier: number; 
    waterMultiplier: number;
    nextIncreaseDay: number;
    difficulty: string;
    dayNumber: number;
  } {
    const { foodConsumption, waterConsumption } = this.calculateHourlyResourceConsumption()
    
    // Рассчитываем день следующего увеличения потребления
    let nextIncreaseDay: number
    switch (this.difficulty) {
      case 'easy':
        nextIncreaseDay = Math.ceil(this.dayNumber / 10) * 10
        break
      case 'normal':
        nextIncreaseDay = Math.ceil(this.dayNumber / 7) * 7
        break
      case 'hard':
        nextIncreaseDay = Math.ceil(this.dayNumber / 7) * 7
        break
      default:
        nextIncreaseDay = Math.ceil(this.dayNumber / 7) * 7
    }
    
    return {
      foodConsumption,
      waterConsumption,
      foodMultiplier: this.foodConsumptionMultiplier,
      waterMultiplier: this.waterConsumptionMultiplier,
      nextIncreaseDay,
      difficulty: this.difficulty,
      dayNumber: this.dayNumber
    }
  }

  /**
   * Получает расширенную информацию о ресурсах для модальных окон
   */
  public getDetailedResourceInfo(resourceType: 'food' | 'water' | 'wood' | 'metal' | 'coal' | 'nails' | 'paper' | 'glass'): {
    currentAmount: number;
    dailyConsumption: number;
    dailyGain: number;
    consumptionPerResident: number;
    multiplier: number;
    difficulty: string;
    dayNumber: number;
    nextIncreaseDay: number;
    roomCount: number;
    roomType: string;
    intervalHours: number;
    hourlyProduction: number;
    dailyProduction: number;
    workingResidents: number;
  } {
    const consumptionInfo = this.getResourceConsumptionInfo();
    const residentCount = this.bunkerResidents.length;
    
    // Определяем тип комнаты и количество
    let roomType: string;
    let roomCount: number;
    
    if (resourceType === 'food') {
      roomType = 'Столовая';
      roomCount = this.getRoomCount('Столовая');
    } else if (resourceType === 'water') {
      roomType = 'Туалет';
      roomCount = this.getRoomCount('Туалет');
    } else {
      // Для ресурсов инженера нет комнат
      roomType = 'Нет';
      roomCount = 0;
    }
    
    // Рассчитываем ежедневные значения
    let intervalHours: number;
    let dailyConsumption: number;
    let consumptionPerResident: number;
    let dailyGain: number;
    
    if (resourceType === 'food' || resourceType === 'water') {
      // Для еды и воды используем существующую логику
      const configManager = this.configManager;
      intervalHours = configManager.getResourceConsumptionInterval(resourceType);
      
      // Количество потреблений в день
      const consumptionsPerDay = 24 / intervalHours;
      
      // Ежедневное потребление = почасовое потребление × количество потреблений в день
      dailyConsumption = Math.round(consumptionInfo[`${resourceType}Consumption`] * consumptionsPerDay);
      
      dailyGain = roomCount * 2; // Каждая комната дает 2 единицы в день
      
      // Расход на жителя в день = базовое потребление × множитель × количество потреблений в день
      const baseConsumption = 1; // Из конфигурации
      consumptionPerResident = Math.round(baseConsumption * consumptionInfo[`${resourceType}Multiplier`] * consumptionsPerDay);
    } else {
      // Для ресурсов инженера нет потребления
      intervalHours = 24; // Не потребляются
      dailyConsumption = 0;
      consumptionPerResident = 0;
      dailyGain = 0;
    }
    
    // Рассчитываем производство ресурсов
    let hourlyProduction = 0;
    let workingResidents = 0;
    
    // Отладочная информация о статусах жителей
    console.log(`[getDetailedResourceInfo] 📊 Статусы жителей для ${resourceType}:`)
    this.bunkerResidents.forEach(resident => {
      console.log(`  - ${resident.name} (${resident.profession}): статус="${resident.status}"`)
    })
    
    // Подсчитываем работающих жителей по профессиям
    this.bunkerResidents.forEach(resident => {
      // Проверяем, работает ли житель (статус может быть "работает" или "работает в [комнате]")
      if (resident.status && resident.status.startsWith('работает')) {
        if (resourceType === 'food' && resident.profession === 'повар') {
          hourlyProduction += 5; // Повар производит 5 ед. еды в час
          workingResidents++;
          console.log(`[getDetailedResourceInfo] ✅ ${resident.name} (повар) работает и производит еду`)
        } else if (resourceType === 'water' && resident.profession === 'сантехник') {
          hourlyProduction += 4; // Сантехник производит 4 ед. воды в час
          workingResidents++;
          console.log(`[getDetailedResourceInfo] ✅ ${resident.name} (сантехник) работает и производит воду`)
        } else if (['wood', 'metal', 'coal', 'nails', 'paper', 'glass'].includes(resourceType) && resident.profession === 'инженер') {
          // Инженер производит случайные ресурсы, но для расчета берем среднее значение
          // 2 ед. в час, но только 1/6 времени на каждый ресурс (6 типов ресурсов)
          hourlyProduction += 2 / 6; // Среднее производство конкретного ресурса
          workingResidents++;
          console.log(`[getDetailedResourceInfo] ✅ ${resident.name} (инженер) работает и производит ${resourceType}`)
        }
      } else {
        if (resourceType === 'food' && resident.profession === 'повар') {
          console.log(`[getDetailedResourceInfo] ⚠️ ${resident.name} (повар) не работает, статус: "${resident.status}"`)
        } else if (resourceType === 'water' && resident.profession === 'сантехник') {
          console.log(`[getDetailedResourceInfo] ⚠️ ${resident.name} (сантехник) не работает, статус: "${resident.status}"`)
        } else if (['wood', 'metal', 'coal', 'nails', 'paper', 'glass'].includes(resourceType) && resident.profession === 'инженер') {
          console.log(`[getDetailedResourceInfo] ⚠️ ${resident.name} (инженер) не работает, статус: "${resident.status}"`)
        }
      }
    });
    
    // Добавляем производство от комнат (только для еды и воды)
    if (resourceType === 'food') {
      hourlyProduction += Math.round((roomCount * 10) / 24); // Столовая: 10 ед. в день
    } else if (resourceType === 'water') {
      hourlyProduction += Math.round((roomCount * 10) / 24); // Туалет: 10 ед. в день
    }
    
    const dailyProduction = Math.round(hourlyProduction * 24);
    
    // Получаем текущее количество ресурса
    let currentAmount: number;
    switch (resourceType) {
      case 'food':
        currentAmount = this.food;
        break;
      case 'water':
        currentAmount = this.water;
        break;
      case 'wood':
        currentAmount = this.wood;
        break;
      case 'metal':
        currentAmount = this.metal;
        break;
      case 'coal':
        currentAmount = this.coal;
        break;
      case 'nails':
        currentAmount = this.nails;
        break;
      case 'paper':
        currentAmount = this.paper;
        break;
      case 'glass':
        currentAmount = this.glass;
        break;
      default:
        currentAmount = 0;
    }
    
    // Отладочная информация
    console.log(`[getDetailedResourceInfo] ${resourceType}:`, {
      intervalHours,
      dailyConsumption,
      dailyGain,
      consumptionPerResident,
      hourlyProduction,
      dailyProduction,
      workingResidents,
      currentAmount
    });
    
    return {
      currentAmount,
      dailyConsumption,
      dailyGain,
      consumptionPerResident,
      multiplier: resourceType === 'food' || resourceType === 'water' ? consumptionInfo[`${resourceType}Multiplier`] : 1,
      difficulty: consumptionInfo.difficulty,
      dayNumber: consumptionInfo.dayNumber,
      nextIncreaseDay: consumptionInfo.nextIncreaseDay,
      roomCount,
      roomType,
      intervalHours,
      hourlyProduction: Math.round(hourlyProduction * 100) / 100, // Округляем до 2 знаков
      dailyProduction,
      workingResidents
    };
  }

  /**
   * Обрабатывает возвращение жителя с поверхности и дает ресурсы
   */
  public handleSurfaceReturn(agent: any, hoursAway: number): void {
    const profession = (agent.profession || '').toLowerCase()
    const residentName = this.getResidentName(agent) || 'Неизвестный'
    console.log(`[handleSurfaceReturn] ${profession} ${residentName} вернулся после ${hoursAway} часов на поверхности`)
    
    if (profession === 'охотник') {
      this.handleHunterReturn(agent, hoursAway)
    } else if (profession === 'разведчик') {
      this.handleScoutReturn(agent, hoursAway)
    }
  }

  /**
   * Обрабатывает возвращение охотника с ресурсами
   */
  private handleHunterReturn(agent: any, hoursAway: number): void {
    // Множитель удачи (в будущем будет зависеть от навыков)
    const luckMultiplier = this.getLuckMultiplier(agent)
    
    // Получаем имя охотника из данных жителя
    const hunterName = this.getResidentName(agent) || 'Неизвестный'
    
    // Охотник приносит 1-2 типа ресурсов из: вода, еда, деньги, патроны
    const hunterResources = ['water', 'food', 'money', 'ammo']
    const numResourceTypes = Math.floor(Math.random() * 2) + 1 // 1-2 типа
    const selectedResources = this.getRandomItems(hunterResources, numResourceTypes)
    
    let totalResources = 0
    const resourceDetails: string[] = []
    
    selectedResources.forEach(resourceType => {
      // Количество ресурса зависит от времени на поверхности (2-5 ед. за час)
      const baseAmount = Math.floor(Math.random() * 4) + 2 // 2-5 ед. за час
      const amount = Math.round(baseAmount * hoursAway * luckMultiplier)
      
      switch (resourceType) {
        case 'water':
          this.water = Math.max(0, Math.round(this.water + amount))
          resourceDetails.push(`${amount} ед. воды`)
          break
        case 'food':
          this.food = Math.max(0, Math.round(this.food + amount))
          resourceDetails.push(`${amount} ед. еды`)
          break
        case 'money':
          this.money = Math.max(0, Math.round(this.money + amount))
          resourceDetails.push(`${amount} монет`)
          break
        case 'ammo':
          this.ammo = Math.max(0, Math.round(this.ammo + amount))
          resourceDetails.push(`${amount} патронов`)
          break
      }
      
      totalResources += amount
      console.log(`[handleHunterReturn] Охотник ${hunterName} принес ${amount} ед. ${resourceType} (время на поверхности: ${hoursAway} часов)`)
      
      // Показываем индикатор изменения ресурса
      if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
        (window as any).forceCheckResourceChange(resourceType, amount, false)
      }
    })
    
    const detailsText = resourceDetails.join(', ')
    this.showToast(`Охотник ${hunterName} принес: ${detailsText} (всего: ${totalResources} ед.)`)
  }

  /**
   * Обрабатывает возвращение разведчика с ресурсами и предметами
   */
  private handleScoutReturn(agent: any, hoursAway: number): void {
    // Множитель удачи (в будущем будет зависеть от навыков)
    const luckMultiplier = this.getLuckMultiplier(agent)
    
    // Получаем имя разведчика из данных жителя
    const scoutName = this.getResidentName(agent) || 'Неизвестный'
    
    // Разведчик приносит 1 тип ресурса из: дерево, металл, гвозди, уголь, бумага, стекло
    const scoutResources = ['wood', 'metal', 'nails', 'coal', 'paper', 'glass']
    const selectedResource = scoutResources[Math.floor(Math.random() * scoutResources.length)]
    
    // Количество ресурса зависит от времени на поверхности (2-4 ед. за час)
    const baseAmount = Math.floor(Math.random() * 3) + 2 // 2-4 ед. за час
    const resourceAmount = Math.round(baseAmount * hoursAway * luckMultiplier)
    
    // Добавляем ресурс
    let resourceName = ''
    switch (selectedResource) {
      case 'wood':
        this.wood = Math.max(0, Math.round(this.wood + resourceAmount))
        resourceName = 'дерева'
        break
      case 'metal':
        this.metal = Math.max(0, Math.round(this.metal + resourceAmount))
        resourceName = 'металла'
        break
      case 'nails':
        this.nails = Math.max(0, Math.round(this.nails + resourceAmount))
        resourceName = 'гвоздей'
        break
      case 'coal':
        this.coal = Math.max(0, Math.round(this.coal + resourceAmount))
        resourceName = 'угля'
        break
      case 'paper':
        this.paper = Math.max(0, Math.round(this.paper + resourceAmount))
        resourceName = 'бумаги'
        break
      case 'glass':
        this.glass = Math.max(0, Math.round(this.glass + resourceAmount))
        resourceName = 'стекла'
        break
    }
    
    console.log(`[handleScoutReturn] Разведчик ${scoutName} принес ${resourceAmount} ед. ${selectedResource} (время на поверхности: ${hoursAway} часов)`)
    
    // Показываем индикатор изменения ресурса
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      (window as any).forceCheckResourceChange(selectedResource, resourceAmount, false)
    }
    
    // Разведчик также приносит 1 случайный нестакающийся предмет
    const randomItem = this.getRandomNonStackableItem()
    if (randomItem) {
      // Добавляем предмет в инвентарь бункера
      const added = this.addItemToBunkerInventory(randomItem.id, 1)
      if (added) {
        console.log(`[handleScoutReturn] Разведчик ${scoutName} принес предмет: ${randomItem.name}`)
        this.showToast(`Разведчик ${scoutName} принес: ${resourceAmount} ед. ${resourceName} и ${randomItem.name}`)
      } else {
        this.showToast(`Разведчик ${scoutName} принес: ${resourceAmount} ед. ${resourceName}`)
      }
    } else {
      this.showToast(`Разведчик ${scoutName} принес: ${resourceAmount} ед. ${resourceName}`)
    }
  }

  /**
   * Получает имя жителя по агенту
   */
  private getResidentName(agent: any): string | null {
    // Ищем жителя в списке bunkerResidents по ID агента
    const resident = this.bunkerResidents.find(r => r.id === agent.id)
    return resident ? resident.name : null
  }

  /**
   * Получает множитель удачи для жителя (в будущем будет зависеть от навыков)
   */
  private getLuckMultiplier(agent: any): number {
    // Пока возвращаем базовый множитель 1.0
    // В будущем здесь будет проверка навыков: везунчик (x2), неудачник (x0.5)
    return 1.0
  }

  /**
   * Получает случайные элементы из массива
   */
  private getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  /**
   * Получает случайный нестакающийся предмет из списка предметов
   */
  private getRandomNonStackableItem(): any {
    // Используем реальные предметы из игры (нестакающиеся - только 1 шт)
    const nonStackableItems = [
      'backpack', 'compass', 'map', 'flashlight', 'bottle', 'lighter', 'matches',
      'multi_tool', 'laptop', 'phone', 'radio', 'gps', 'transmitter',
      'shirt', 'shirt2', 'pants', 'pants3', 'jacket1', 'jacket2', 'boots', 'hat', 'cap',
      'medicine', 'medicine2', 'med_backpack', 'book1', 'book2', 'battery'
    ]
    
    const randomItemId = nonStackableItems[Math.floor(Math.random() * nonStackableItems.length)]
    const itemData = this.getItemById(randomItemId)
    
    return itemData ? { id: randomItemId, name: itemData.name, category: itemData.category } : null
  }

  /**
   * Добавляет предмет в инвентарь бункера
   */
  public addItemToBunkerInventory(itemId: string, quantity: number = 1): boolean {
    // Проверяем, что предмет существует
    const itemData = this.getItemById(itemId)
    if (!itemData) {
      console.warn(`[addItemToBunkerInventory] Предмет ${itemId} не найден в справочнике`)
      return false
    }

    // Ищем существующий предмет в инвентаре
    const existingItemIndex = this.bunkerInventory.findIndex(item => item && item.id === itemId)

    if (existingItemIndex !== -1 && this.bunkerInventory[existingItemIndex]) {
      // Если предмет уже есть, увеличиваем количество
      this.bunkerInventory[existingItemIndex].quantity += quantity

    } else {
      // Если предмета нет, ищем свободную позицию в видимых слотах
      const totalSlots = 6 * this.inventoryRows; // Рассчитываем общее количество видимых слотов
      let freeSlotIndex = -1;

      // Сначала ищем пустую позицию среди видимых слотов
      for (let i = 0; i < totalSlots && freeSlotIndex === -1; i++) {
        if (!this.bunkerInventory[i] || !this.bunkerInventory[i]!.id || this.bunkerInventory[i]!.id === '') {
          freeSlotIndex = i;
        }
      }

      // Если не нашли свободную позицию среди видимых слотов, предмет не добавляется
      if (freeSlotIndex === -1) {
        console.log(`[addItemToBunkerInventory] Нет свободного слота для добавления предмета ${itemId}. Предмет не добавлен.`);
        return false;
      }

      // Убеждаемся, что массив достаточно большой
      while (this.bunkerInventory.length <= freeSlotIndex) {
        this.bunkerInventory.push(undefined);
      }

      // Добавляем предмет на найденную позицию
      this.bunkerInventory[freeSlotIndex] = { id: itemId, quantity: quantity };

    }

    // Обновляем модальное окно инвентаря (только если модальное окно открыто)
    if (typeof window !== 'undefined' && (window as any).populateInventoryModal) {
      const inventoryModal = document.getElementById('inventory-modal');
      if (inventoryModal && inventoryModal.style.display !== 'none') {
        setTimeout(() => {
          try {
            const inventory = this.getDefaultInventory();
            ;(window as any).populateInventoryModal(inventory, this.inventoryRows);
          } catch (error) {
            // Игнорируем ошибки обновления UI
          }
        }, 50);
      }
    }


    return true
  }

  /**
   * Устанавливает предмет в конкретный слот инвентаря
   */
  public setInventoryItem(slotIndex: number, itemData: { id: string; quantity: number }): boolean {
    console.log(`[setInventoryItem] НАЧАЛО: установка ${itemData.id} x${itemData.quantity} в слот ${slotIndex}`);
    this.logInventoryState("ДО setInventoryItem");
    this.logActiveQuestItem("ДО setInventoryItem");

    // Проверяем, что предмет существует
    const itemInfo = this.getItemById(itemData.id)
    if (!itemInfo) {
      console.warn(`[setInventoryItem] Предмет ${itemData.id} не найден в справочнике`)
      return false
    }

    // Убеждаемся, что массив достаточно большой
    while (this.bunkerInventory.length <= slotIndex) {
      this.bunkerInventory.push(undefined)
    }

    // Сохраняем предмет, который был в целевом слоте (если он был)
    const existingItem = this.bunkerInventory[slotIndex]

    // Устанавливаем новый предмет в указанный слот
    this.bunkerInventory[slotIndex] = { id: itemData.id, quantity: itemData.quantity }

    // Проверяем, нужно ли разблокировать фракцию для этого предмета
    if (this.factionManager?.unlockFactionByItem(itemData.id)) {
      console.log(`[setInventoryItem] Разблокирована фракция для предмета ${itemData.id}`)
    }

    // Если в слоте был другой предмет, нужно его куда-то переместить
    if (existingItem && existingItem.id && existingItem.id !== itemData.id) {


      // Сдвигаем все предметы вправо от целевого слота, чтобы освободить место
      console.log(`[setInventoryItem] Сдвигаем предметы вправо от слота ${slotIndex} для размещения ${itemData.id}`);
      for (let i = this.bunkerInventory.length; i > slotIndex; i--) {
        this.bunkerInventory[i] = this.bunkerInventory[i - 1];
      }

      // Помещаем старый предмет в целевой слот
      this.bunkerInventory[slotIndex] = existingItem;

    }

    // Обновляем модальное окно инвентаря
    if (typeof window !== 'undefined' && (window as any).populateInventoryModal) {
      setTimeout(() => {
        // Используем полный bunkerInventory вместо getDefaultInventory для точной синхронизации
        ;(window as any).populateInventoryModal(this.bunkerInventory, this.inventoryRows)
      }, 50)
    }

    console.log(`[setInventoryItem] КОНЕЦ: предмет ${itemData.id} успешно установлен в слот ${slotIndex}`);
    this.logInventoryState("ПОСЛЕ setInventoryItem");
    this.logActiveQuestItem("ПОСЛЕ setInventoryItem");

    return true
  }

  /**
   * Удаляет предмет из конкретного слота инвентаря
   */
  public removeInventoryItem(slotIndex: number): { id: string; quantity: number } | null {
    console.log(`[removeInventoryItem] НАЧАЛО: удаление предмета из слота ${slotIndex}`);
    this.logInventoryState("ДО removeInventoryItem");
    this.logActiveQuestItem("ДО removeInventoryItem");

    if (slotIndex < 0 || slotIndex >= this.bunkerInventory.length) {
      console.log(`[removeInventoryItem] ОШИБКА: некорректный индекс слота ${slotIndex}`);
      return null
    }

    const removedItem = this.bunkerInventory[slotIndex]
    console.log(`[removeInventoryItem] Найден предмет в слоте ${slotIndex}:`, removedItem);

    if (removedItem && removedItem.id) {
      // Удаляем предмет из слота
      console.log(`[removeInventoryItem] Удаляю предмет ${removedItem.id} x${removedItem.quantity} из слота ${slotIndex}`);
      this.bunkerInventory[slotIndex] = undefined

      // Сдвигаем все последующие предметы влево, чтобы заполнить пустоту
      // Это обеспечит плотный массив без пустых слотов в середине
      console.log(`[removeInventoryItem] Сдвигаем предметы влево после удаления из слота ${slotIndex}`);
      for (let i = slotIndex; i < this.bunkerInventory.length - 1; i++) {
        this.bunkerInventory[i] = this.bunkerInventory[i + 1];
      }
      // Очищаем последний элемент массива
      this.bunkerInventory[this.bunkerInventory.length - 1] = undefined;

      // Уменьшаем размер массива, если последний элемент пустой
      while (this.bunkerInventory.length > 0 && !this.bunkerInventory[this.bunkerInventory.length - 1]) {
        this.bunkerInventory.pop();
      }

      // Обновляем модальное окно инвентаря (только если модальное окно открыто)
      if (typeof window !== 'undefined' && (window as any).populateInventoryModal) {
        const inventoryModal = document.getElementById('inventory-modal');
        if (inventoryModal && inventoryModal.style.display !== 'none') {
          setTimeout(() => {
            try {
              // Используем полный bunkerInventory вместо getDefaultInventory для точной синхронизации
              ;(window as any).populateInventoryModal(this.bunkerInventory, this.inventoryRows);
            } catch (error) {
              // Игнорируем ошибки обновления UI
            }
          }, 50)
        }
      }

      console.log(`[removeInventoryItem] КОНЕЦ: предмет ${removedItem.id} x${removedItem.quantity} успешно удален из слота ${slotIndex}`);
      this.logInventoryState("ПОСЛЕ removeInventoryItem");
      this.logActiveQuestItem("ПОСЛЕ removeInventoryItem");

      return removedItem
    }

    console.log(`[removeInventoryItem] КОНЕЦ: предмет не найден в слоте ${slotIndex}`);
    return null
  }

  /**
   * Получает предмет из конкретного слота инвентаря
   */
  public getInventoryItem(slotIndex: number): { id: string; quantity: number } | null {
    if (slotIndex < 0 || slotIndex >= this.bunkerInventory.length) {
      return null
    }

    return this.bunkerInventory[slotIndex] || null
  }

  /**
   * Получает информацию о качестве торговли на основе морали
   */
  public getTradingQualityInfo(): { 
    morale: number;
    tradingType: 'discount' | 'markup';
    value: number;
    description: string;
  } {
    const tradingInfo = this.configManager.getMoraleTradingQuality(this.moral)
    
    let description = ''
    if (tradingInfo.type === 'discount') {
      description = `Скидка ${tradingInfo.value}% на покупки`
    } else {
      description = `Наценка ${tradingInfo.value}% на покупки`
    }
    
    return {
      morale: this.moral,
      tradingType: tradingInfo.type,
      value: tradingInfo.value,
      description: description
    }
  }

  /**
   * Получает детальную информацию о показателе счастья
   */
  public getHappinessInfo(): {
    currentLevel: number;
    dependencies: string[];
    effects: string[];
    recoveryRate: number;
    description: string;
  } {
    return {
      currentLevel: this.happiness,
      dependencies: [
        'Комфорт (основной фактор)',
        'Наличие работы у жителей',
        'Здоровье жителей',
        'Отсутствие врагов в бункере',
        'Достаток еды и воды'
      ],
      effects: [
        'Эффективность работы жителей',
        'Сопротивление безумию',
        'Качество производимых ресурсов',
        'Скорость восстановления здоровья'
      ],
      recoveryRate: this.comfort > 80 ? 2 : this.comfort > 50 ? 1 : 0,
      description: 'Счастье жителей - центральный показатель мотивации. Влияет на производительность и лояльность.'
    }
  }

  /**
   * Получает детальную информацию о показателе защиты
   */
  public getDefenseInfo(): {
    currentLevel: number;
    recoveryRate: number;
    dependencies: string[];
    effects: string[];
    description: string;
  } {
    const baseRegeneration = this.configManager.getDefenseRegenerationPerHour()
    const isRegenerationEnabled = this.configManager.isDefenseRegenerationEnabled()
    
    return {
      currentLevel: this.defense,
      recoveryRate: isRegenerationEnabled ? baseRegeneration : 0,
      dependencies: [
        'Атаки врагов (снижают защиту)',
        'Количество жителей-солдат',
        'Наличие укреплений',
        'Качество оружия'
      ],
      effects: [
        'Комфорт жителей',
        'Скорость появления врагов',
        'Эффективность оружия',
        'Стоимость ремонта'
      ],
      description: 'Защита бункера включает укрепления, вооружение и подготовку жителей к обороне.'
    }
  }

  /**
   * Получает детальную информацию о показателе комфорта
   */
  public getComfortInfo(): {
    currentLevel: number;
    dependencies: string[];
    effects: string[];
    description: string;
  } {
    return {
      currentLevel: this.comfort,
      dependencies: [
        'Уровень защиты (основной фактор)',
        'Качество помещений',
        'Наличие удобств',
        'Освещение',
        'Отсутствие повреждений'
      ],
      effects: [
        'Счастье жителей',
        'Частоту появления новых жителей',
        'Скорость восстановления морали',
        'Эффективность работы'
      ],
      description: 'Комфорт влияет на мораль и здоровье жителей. Хорошие условия жизни повышают производительность.'
    }
  }

  /**
   * Получает детальную информацию о показателе морали
   */
  public getMoralInfo(): {
    currentLevel: number;
    recoveryRate: number;
    dependencies: string[];
    effects: string[];
    description: string;
  } {
    const comfortRecovery = this.configManager.getMoraleComfortRecovery(this.comfort)
    
    return {
      currentLevel: this.moral,
      recoveryRate: comfortRecovery,
      dependencies: [
        'Комфорт (основной фактор восстановления)',
        'События в игре',
        'Принятие/отклонение посетителей',
        'Убийство врагов',
        'Строительство комнат'
      ],
      effects: [
        'Качество торговли',
        'Риск безумия жителей',
        'Эффективность групповых действий',
        'Общую атмосферу в бункере'
      ],
      description: 'Мораль отражает общее настроение и сплоченность жителей бункера.'
    }
  }

  /**
   * Тестовый метод для проверки системы урона от нехватки ресурсов
   * Вызывается из консоли: gameScene.testResourceDamage('food', 5)
   */
  public testResourceDamage(resourceType: 'food' | 'water', shortage: number): void {
    console.log(`🧪 Тестирование системы урона: ${resourceType}, нехватка: ${shortage} ед.`)
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Симулируем нехватку ресурса
    const damageReason = resourceType === 'food' ? 'голод' : 'жажда'
    this.handleResourceShortage(100, -shortage, resourceType, damageReason)
    
    console.log('✅ Тест завершен')
  }

  /**
   * Тестовый метод для симуляции почасового потребления с нехваткой ресурсов
   * Вызывается из консоли: gameScene.testHourlyConsumption()
   */
  public testHourlyConsumption(): void {
    console.log('🧪 Тестирование почасового потребления с нехваткой ресурсов...')
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Устанавливаем ресурсы в 0 для тестирования нехватки
    const oldFood = this.food
    const oldWater = this.water
    
    this.food = 0
    this.water = 0
    
    console.log(`[testHourlyConsumption] Установили ресурсы: еда=${this.food}, вода=${this.water}`)
    
    // Вызываем почасовое потребление
    this.processHourlyResourceConsumption()
    
    // Восстанавливаем ресурсы
    this.food = oldFood
    this.water = oldWater
    
    console.log(`[testHourlyConsumption] Восстановили ресурсы: еда=${this.food}, вода=${this.water}`)
    console.log('✅ Тест завершен')
  }

  /**
   * Тестовый метод для проверки системы смерти от голода/жажды
   * Вызывается из консоли: gameScene.testDeathSystem()
   */
  public testDeathSystem(): void {
    console.log('🧪 Тестирование системы смерти от голода/жажды...')
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Находим жителя с высоким здоровьем для тестирования
    const healthyResident = this.bunkerResidents.find(r => (r.health ?? 100) > 50)
    if (!healthyResident) {
      console.log('❌ Нет жителей с достаточным здоровьем для тестирования')
      return
    }
    
    console.log(`[testDeathSystem] Тестируем на жителе: ${healthyResident.name} (здоровье: ${healthyResident.health ?? 100}%)`)
    
    // Симулируем нехватку ресурса, которая заведомо превысит здоровье жителя
    const damageReason = 'голод'
    this.handleResourceShortage(100, -200, 'food', damageReason)
    
    console.log('✅ Тест системы смерти завершен')
  }

  /**
   * Тестовый метод для проверки синхронизации удаления жителей
   * Вызывается из консоли: gameScene.testResidentRemoval()
   */
  public testResidentRemoval(): void {
    console.log('🧪 Тестирование синхронизации удаления жителей...')
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Находим первого жителя для тестирования
    const testResident = this.bunkerResidents[0]
    console.log(`[testResidentRemoval] Тестируем удаление жителя: ${testResident.name} (ID: ${testResident.id})`)
    
    // Проверяем, есть ли агент в SimpleBunkerView
    if (this.simpleBunker) {
      const agent = this.simpleBunker.getResidentAgentById(testResident.id)
      if (agent) {
        console.log(`[testResidentRemoval] Агент найден в SimpleBunkerView: ${agent.id}`)
      } else {
        console.log(`[testResidentRemoval] Агент НЕ найден в SimpleBunkerView`)
      }
    }
    
    // Удаляем жителя
    this.removeDeadResident(testResident.id, 'тестирование')
    
    // Проверяем, что агент удален
    if (this.simpleBunker) {
      const agent = this.simpleBunker.getResidentAgentById(testResident.id)
      if (agent) {
        console.log(`❌ ОШИБКА: Агент все еще существует в SimpleBunkerView после удаления!`)
      } else {
        console.log(`✅ Агент успешно удален из SimpleBunkerView`)
      }
    }
    
    console.log('✅ Тест синхронизации удаления завершен')
  }

  /**
   * Тестовый метод для проверки анимации смерти
   * Вызывается из консоли: gameScene.testDeathAnimation()
   */
  public testDeathAnimation(): void {
    console.log('🧪 Тестирование анимации смерти...')
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Находим первого жителя для тестирования
    const testResident = this.bunkerResidents[0]
    console.log(`[testDeathAnimation] Тестируем анимацию смерти для жителя: ${testResident.name} (ID: ${testResident.id})`)
    
    // Проверяем, есть ли агент в SimpleBunkerView
    if (this.simpleBunker) {
      const agent = this.simpleBunker.getResidentAgentById(testResident.id)
      if (agent) {
        console.log(`[testDeathAnimation] Агент найден в SimpleBunkerView: ${agent.id}`)
        
        // Проверяем доступные анимации
        if (agent.sprite && agent.sprite.anims) {
          const availableAnims = (this.scene as any).anims?.names || []
          const deadAnims = availableAnims.filter((name: string) => name.includes('dead'))
          console.log(`[testDeathAnimation] Доступные анимации смерти: ${deadAnims.join(', ')}`)
        }
      } else {
        console.log(`[testDeathAnimation] Агент НЕ найден в SimpleBunkerView`)
        return
      }
    }
    
    // Симулируем смерть от голода (это вызовет анимацию смерти)
    this.removeDeadResident(testResident.id, 'голод')
    
    console.log('✅ Тест анимации смерти завершен')
    console.log('💡 Проверьте, что житель проиграл анимацию смерти перед исчезновением')
  }

  /**
   * Тестовый метод для проверки быстрой анимации смерти (с таймером 2 секунды)
   * Вызывается из консоли: gameScene.testQuickDeathAnimation()
   */
  public testQuickDeathAnimation(): void {
    console.log('🧪 Тестирование быстрой анимации смерти (2 секунды)...')
    
    if (this.bunkerResidents.length === 0) {
      console.log('❌ Нет жителей для тестирования')
      return
    }
    
    // Находим первого жителя для тестирования
    const testResident = this.bunkerResidents[0]
    console.log(`[testQuickDeathAnimation] Тестируем быструю анимацию смерти для жителя: ${testResident.name} (ID: ${testResident.id})`)
    
    // Проверяем, есть ли агент в SimpleBunkerView
    if (this.simpleBunker) {
      const agent = this.simpleBunker.getResidentAgentById(testResident.id)
      if (agent) {
        console.log(`[testQuickDeathAnimation] Агент найден в SimpleBunkerView: ${agent.id}`)
        
        // Симулируем смерть от голода
        this.removeDeadResident(testResident.id, 'голод')
        
        console.log('✅ Тест быстрой анимации смерти завершен')
        console.log('💡 Житель должен исчезнуть через 1 секунду')
      } else {
        console.log(`[testQuickDeathAnimation] Агент НЕ найден в SimpleBunkerView`)
      }
    }
  }

  /**
   * Применяет штраф к счастью жителя за получение урона от нехватки ресурсов
   */
  private applyHappinessPenalty(residentId: number, damageReason: string): void {
    const resident = this.bunkerResidents.find(r => r.id === residentId)
    if (!resident) return
    
    // Отнимаем 10% от текущего счастья (если есть)
    if (resident.hunger !== undefined) {
      const oldHunger = resident.hunger
      resident.hunger = Math.max(0, resident.hunger - 10)
      console.log(`[applyHappinessPenalty] ${resident.name} теряет счастье от ${damageReason}: голод ${oldHunger}% → ${resident.hunger}% (-10%)`)
    }
    
    // Также уменьшаем общее счастье бункера
    const oldHappiness = this.happiness
    this.happiness = Math.max(0, Math.round(this.happiness - 2))
    console.log(`[applyHappinessPenalty] Общее счастье бункера уменьшено от ${damageReason}: ${oldHappiness}% → ${this.happiness}% (-2%)`)
    
    // Показываем уведомление о снижении счастья
    this.showToast(`😢 ${resident.name} расстроен от ${damageReason}!`)
  }

  // Синхронизация потребностей жителя из bunkerView
  public _updateResidentNeeds(id: number, needs: { hunger?: number; thirst?: number; energy?: number; health?: number; patient?: boolean }): void {
    const r = this.bunkerResidents.find(x => x.id === id)
    if (!r) return
    if (typeof needs.hunger === 'number') r.hunger = Math.max(0, Math.min(100, Math.floor(needs.hunger)))
    if (typeof needs.thirst === 'number') r.thirst = Math.max(0, Math.min(100, Math.floor(needs.thirst)))
    if (typeof needs.energy === 'number') r.energy = Math.max(0, Math.min(100, Math.floor(needs.energy)))
         if (typeof needs.health === 'number') r.health = Math.max(0, Math.min(100, Math.floor(needs.health)))
     if (typeof needs.patient === 'boolean') r.patient = needs.patient
     
     // Обновляем UI если открыто модальное окно с деталями жителя
     this.updateResidentDetailsUI(id)
   }
   
     // Обновление UI деталей жителя при изменении здоровья
  private updateResidentDetailsUI(residentId: number): void {
    // Проверяем, открыто ли модальное окно с деталями жителя
    if (typeof window !== 'undefined' && (window as any).updateResidentHealthInModal) {
      (window as any).updateResidentHealthInModal(residentId)
    }
  }
  
  // Метод для обновления здоровья жителя в bunkerResidents
  public updateResidentHealth(residentId: number, newHealth: number): void {
    const resident = this.bunkerResidents.find(r => r.id === residentId);
    if (resident) {
      const oldHealth = resident.health;
      resident.health = Math.max(0, Math.min(100, newHealth));
      
      if (oldHealth !== resident.health) {
        console.log(`[updateResidentHealth] ${resident.name} (ID: ${residentId}): ${oldHealth || 100}% → ${resident.health}%`)
      }
      
      // Синхронизируем здоровье с bunkerView агентами
      if (this.simpleBunker) {
        const residentAgent = this.simpleBunker.getResidentAgentById(residentId);
        if (residentAgent) {
          residentAgent.health = resident.health;
        }
      }
      
      // Обновляем UI если открыто модальное окно
      this.updateResidentDetailsUI(residentId);
    }
  }
  
  // Метод для синхронизации здоровья из bunkerView в GameScene
  public syncResidentHealthFromBunkerView(residentId: number, bunkerViewHealth: number): void {
    const resident = this.bunkerResidents.find(r => r.id === residentId);
    if (resident) {
      const oldHealth = resident.health;
      resident.health = Math.max(0, Math.min(100, bunkerViewHealth));
      
      if (oldHealth !== resident.health) {
        console.log(`[syncResidentHealthFromBunkerView] ${resident.name} (ID: ${residentId}): ${oldHealth || 100}% → ${resident.health}%`)
      }
      
      // Обновляем UI если открыто модальное окно
      this.updateResidentDetailsUI(residentId);
    }
  }

  // Методы для вызова из bunkerView (работники)
  public addFood(amount: number): void {
    this.food = Math.max(0, this.food + Math.max(0, Math.floor(amount)));

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('collect_resource', 'food', amount);

    // Показываем индикатор изменения
    console.log(`[addFood] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);

    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addFood] 🎯 Показываем индикатор для еды: +${amount} ед`);
      (window as any).forceCheckResourceChange('food', amount, false);
    } else {
      console.warn(`[addFood] ❌ forceCheckResourceChange недоступен`);
    }

    this.updateAllResources()
  }
  
  public addWater(amount: number): void {
    this.water = Math.max(0, this.water + Math.max(0, Math.floor(amount)));

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('collect_resource', 'water', amount);

    // Показываем индикатор изменения
    console.log(`[addWater] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);

    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addWater] 🎯 Показываем индикатор для воды: +${amount} ед`);
      (window as any).forceCheckResourceChange('water', amount, false);
    } else {
      console.warn(`[addWater] ❌ forceCheckResourceChange недоступен`);
    }

    this.updateAllResources()
  }
  
  public addWood(amount: number): void {
    this.wood = Math.max(0, this.wood + Math.max(0, Math.floor(amount)));

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('collect_resource', 'wood', amount);

    // Показываем индикатор изменения
    console.log(`[addWood] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);

    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addWood] 🎯 Показываем индикатор для дерева: +${amount} ед`);
      (window as any).forceCheckResourceChange('wood', amount, false);
    } else {
      console.warn(`[addWood] ❌ forceCheckResourceChange недоступен`);
    }

    this.updateAllResources()
  }
  
  public addMetal(amount: number): void {
    this.metal = Math.max(0, this.metal + Math.max(0, Math.floor(amount)));

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('collect_resource', 'metal', amount);

    // Показываем индикатор изменения
    console.log(`[addMetal] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);

    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addMetal] 🎯 Показываем индикатор для металла: +${amount} ед`);
      (window as any).forceCheckResourceChange('metal', amount, false);
    } else {
      console.warn(`[addMetal] ❌ forceCheckResourceChange недоступен`);
    }

    this.updateAllResources()
  }
  
  public addCoal(amount: number): void {
    this.coal = Math.max(0, this.coal + Math.max(0, Math.floor(amount)));

    // Обновляем прогресс заданий фракций
    this.updateFactionQuestProgress('collect_resource', 'coal', amount);

    // Показываем индикатор изменения
    console.log(`[addCoal] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);

    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addCoal] 🎯 Показываем индикатор для угля: +${amount} ед`);
      (window as any).forceCheckResourceChange('coal', amount, false);
    } else {
      console.warn(`[addCoal] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }
  
  public addNails(amount: number): void { 
    this.nails = Math.max(0, this.nails + Math.max(0, Math.floor(amount))); 
    
    // Показываем индикатор изменения
    console.log(`[addNails] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addNails] 🎯 Показываем индикатор для гвоздей: +${amount} ед`);
      (window as any).forceCheckResourceChange('nails', amount, false);
    } else {
      console.warn(`[addNails] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }
  
  public addPaper(amount: number): void { 
    this.paper = Math.max(0, this.paper + Math.max(0, Math.floor(amount))); 
    
    // Показываем индикатор изменения
    console.log(`[addPaper] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addPaper] 🎯 Показываем индикатор для бумаги: +${amount} ед`);
      (window as any).forceCheckResourceChange('paper', amount, false);
    } else {
      console.warn(`[addPaper] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }
  
  public addGlass(amount: number): void { 
    this.glass = Math.max(0, this.glass + Math.max(0, Math.floor(amount))); 
    
    // Показываем индикатор изменения
    console.log(`[addGlass] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addGlass] 🎯 Показываем индикатор для стекла: +${amount} ед`);
      (window as any).forceCheckResourceChange('glass', amount, false);
    } else {
      console.warn(`[addGlass] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }

  // Метод для добавления денег с индикатором
  public addMoney(amount: number): void { 
    this.money = Math.max(0, this.money + Math.max(0, Math.floor(amount))); 
    
    // Показываем индикатор изменения
    console.log(`[addMoney] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addMoney] 🎯 Показываем индикатор для денег: +${amount} ед`);
      (window as any).forceCheckResourceChange('money', amount, false);
    } else {
      console.warn(`[addMoney] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }

  // Метод для добавления патронов с индикатором
  public addAmmo(amount: number): void { 
    this.ammo = Math.max(0, this.ammo + Math.max(0, Math.floor(amount))); 
    
    // Показываем индикатор изменения
    console.log(`[addAmmo] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
    
    if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
      console.log(`[addAmmo] 🎯 Показываем индикатор для патронов: +${amount} ед`);
      (window as any).forceCheckResourceChange('ammo', amount, false);
    } else {
      console.warn(`[addAmmo] ❌ forceCheckResourceChange недоступен`);
    }
    
    this.updateAllResources() 
  }

  // Методы управления опытом бункера
  public addBunkerExperience(amount: number): void {
    this.bunkerExperience += Math.max(0, Math.floor(amount))
    this.checkLevelUp()
    this.updateAllResources()
    
    // Обновляем UI overlay при изменении опыта
    this.updateUIOverlay()
  }

  // Универсальная функция начисления опыта
  public awardExperience(source: string, amount: number): void {
    console.log(`[GameScene] Награждаем ${amount} опыта за: ${source}`)
    this.addBunkerExperience(amount)
  }

  // Получаем количество опыта за убийство врага определенного типа
  private getEnemyExperienceReward(enemyType: string): number {
    try {
      return this.configManager.getEnemyKillReward(enemyType as any)
    } catch (error) {
      console.error('[GameScene] Ошибка получения опыта за врага из конфигурации:', error)
      // Fallback к старым значениям
      switch (enemyType) {
        case 'МАРОДЕР':
          return 1 // Самый слабый враг
        case 'ЗОМБИ':
          return 3 // Средний враг
        case 'МУТАНТ':
          return 6 // Сильный враг
        case 'СОЛДАТ':
          return 10 // Самый сильный враг
        default:
          return 2 // По умолчанию
      }
    }
  }

  // Добавляем очки способностей
  private addAbilityPoints(amount: number): void {
    this.abilityPoints += amount
    console.log(`[GameScene] Добавлено ${amount} очков способностей. Всего: ${this.abilityPoints}`)
    
    // Обновляем UI overlay если он доступен
    if (window.updateGameUI) {
      // Получаем текущие данные и обновляем очки способностей
      const currentData = {
        bunkerLevel: this.bunkerLevel,
        bunkerExperience: this.bunkerExperience,
        maxExperience: this.maxExperienceForLevel,
        abilityPoints: this.abilityPoints
      }
      window.updateGameUI(currentData)
    }
    
    // Также обновляем очки способностей в index.html
    if ((window as any).updateAbilityPointsFromGame) {
      (window as any).updateAbilityPointsFromGame(this.abilityPoints)
    }
  }

  // Показываем визуальный эффект повышения уровня
  private showLevelUpEffect(): void {
    // Создаем вспышку на экране
    const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0.3)
    flash.setOrigin(0, 0)
    flash.setDepth(1000)
    
    // Анимация вспышки
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy()
      }
    })
    
    // Добавляем текст "Повышение!" с нужным шрифтом и цветом
    const levelUpText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Повышение!', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P, monospace',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    })
    levelUpText.setOrigin(0.5)
    levelUpText.setDepth(1001)
    
    // Анимация текста
    this.tweens.add({
      targets: levelUpText,
      scale: 1.5,
      duration: 500,
      yoyo: true,
      repeat: 1,
      ease: 'Power2',
      onComplete: () => {
        levelUpText.destroy()
      }
    })
  }

  private checkLevelUp(): void {
    while (this.bunkerExperience >= this.maxExperienceForLevel) {
      this.bunkerExperience -= this.maxExperienceForLevel
      this.bunkerLevel++
      
      try {
        // Получаем базовый опыт для уровня из конфигурации
        this.maxExperienceForLevel = this.configManager.getBaseLevelExperience()
        
        // Получаем базовое количество очков способностей за уровень из конфигурации
        const baseAbilityPoints = this.configManager.getAbilityPointsPerLevel()
        
        // Получаем бонус к очкам способностей от морали
        const moraleBonus = this.configManager.getMoraleLevelUpBonus(this.moral)
        const totalAbilityPoints = baseAbilityPoints + moraleBonus
        
        // Добавляем очки способностей с учетом бонуса морали
        this.addAbilityPoints(totalAbilityPoints)
        
        // Показываем уведомление с информацией о бонусе
        if (moraleBonus > 0) {
          this.showToast(`🎉 Бункер повышен до уровня ${this.bunkerLevel}! +${totalAbilityPoints} очка способностей (базовые ${baseAbilityPoints} + бонус морали ${moraleBonus})`)
        } else {
          this.showToast(`🎉 Бункер повышен до уровня ${this.bunkerLevel}! +${totalAbilityPoints} очка способностей`)
        }
        
        console.log(`[checkLevelUp] Уровень повышен! Новый уровень: ${this.bunkerLevel}, Очки способностей: базовые ${baseAbilityPoints} + бонус морали ${moraleBonus} = ${totalAbilityPoints}`)
      } catch (error) {
        console.error('[GameScene] Ошибка получения настроек уровня из конфигурации:', error)
        // Fallback к старым значениям
        this.maxExperienceForLevel = 100
        this.addAbilityPoints(3)
        this.showToast(`🎉 Бункер повышен до уровня ${this.bunkerLevel}! +3 очка способностей`)
      }
      
      // Показываем визуальный эффект повышения уровня
      this.showLevelUpEffect()
    }
  }
  public killOneEnemyFromQueue(): void {
    if (this.enemyQueueItems.length === 0) return
    const it = this.enemyQueueItems.shift()!
    
    // Начисляем опыт за убийство врага в очереди
    const experienceReward = this.getEnemyExperienceReward(it.type)
    this.awardExperience(`убийство ${it.type} в очереди`, experienceReward)
    
    // Показываем уведомление о том, что враг убит
    this.showToast(`Враг ${it.type} убит!`)
    
    it.exiting = true
    const tweenTargets: any[] = [it.rect]
    if (it.sprite) tweenTargets.push(it.sprite)
    if (it.shirt) tweenTargets.push(it.shirt)
    if (it.pants) tweenTargets.push(it.pants)
    if (it.footwear) tweenTargets.push(it.footwear)
    if (it.hair) tweenTargets.push(it.hair)
    this.tweens.add({ targets: tweenTargets, x: -60, duration: 300, ease: 'Sine.easeIn', onComplete: () => {
      it.rect.destroy()
      it.sprite?.destroy()
      it.shirt?.destroy()
      it.pants?.destroy()
      it.footwear?.destroy()
      it.hair?.destroy()
      // Обновление панели (скрыть HP и оружие, если врагов больше нет)
      if (this.enemyQueueItems.length === 0) {
        this.enemyHpBg?.setVisible(false)
        this.enemyHpFg?.setVisible(false)
        if (this.gunSprite) this.gunSprite.setVisible(false)
      } else {
        // Если остались враги, новый первый враг уже достиг позиции (они стояли в очереди)
        const newFirst = this.enemyQueueItems[0]
        if (newFirst) {
          (newFirst as any).arrivedAtPosition = true
        }
      }
      
      // Проверяем возможность возобновления прихода персонажей
      this.checkAndResumeArrivals()
    } })
    if (this.lastSurfaceRect) this.layoutEnemyQueue(this.lastSurfaceRect, true) // smooth=true
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  // Автоматический выстрел солдата раз в час. Возвращает false, если нет патронов и стрелять нельзя
  public soldierAutoFireWeapon(soldierId?: number): boolean {
    console.log(`[soldierAutoFireWeapon] 🎯 Начинаем автоматический выстрел солдата ID: ${soldierId}`)
    console.log(`[soldierAutoFireWeapon] 🎯 Врагов в очереди: ${this.enemyQueueItems.length}`)
    
    // Если врагов нет — солдат на посту, но не стреляет
    if (this.enemyQueueItems.length === 0) {
      console.log(`[soldierAutoFireWeapon] ❌ Нет врагов, солдат не стреляет`)
      return true
    }
    
    // Навыки солдата
    const soldier = soldierId != null ? this.bunkerResidents.find(r => r.id === soldierId) : undefined
    console.log(`[soldierAutoFireWeapon] 🎯 Солдат найден: ${soldier ? soldier.name : 'НЕ НАЙДЕН'}`)
    
    const skills = soldier?.skills
    const shots = this.computeSoldierShotsPerHour(skills)
    console.log(`[soldierAutoFireWeapon] 🎯 Количество выстрелов в час: ${shots}`)
    
    if (shots <= 0) {
      console.log(`[soldierAutoFireWeapon] ❌ Количество выстрелов <= 0, солдат не стреляет`)
      return true
    }
    // Неудачник: шанс 10% умереть при работе
    if (this.hasSkill(skills, 'неудачник') && Math.random() < 0.1 && soldier) {
      this.removeResidentFromBunker(soldier.id, 'погиб при исполнении')
      this.showToast(`${soldier.name} погиб при службе`)
      return false
    }
    // Выполняем shots раз выстрел с модификаторами патронов
    console.log(`[soldierAutoFireWeapon] 🎯 Начинаем цикл выстрелов: ${shots} выстрелов`)
    for (let i = 0; i < shots; i++) {
      console.log(`[soldierAutoFireWeapon] 🎯 Выстрел ${i + 1}/${shots}`)
      
      // Для автоматических выстрелов солдат: базовый расход 1 патрон, навык "слепой" увеличивает расход
      // Везунчик: 10% не тратит патрон
      const luckyChance = this.hasSkill(skills, 'везунчик') ? 0.1 : 0
      
      // Способность "Осечка": +5% за уровень к шансу не тратить патрон
      const misfireLevel = this.getAbilityLevel('def_misfire')
      const misfireChance = misfireLevel * 0.05 // 5% за уровень
      
      // Общий шанс не тратить патрон
      const totalFreeShotChance = luckyChance + misfireChance
      const freeShot = totalFreeShotChance > 0 && Math.random() < totalFreeShotChance
      
      // Слепой: тратит в 2 раза больше патронов (2 вместо 1)
      const extraAmmo = this.hasSkill(skills, 'слепой') ? 1 : 0
      const baseAmmoCost = 1
      const totalAmmoCost = freeShot ? 0 : (baseAmmoCost + extraAmmo)
      
      console.log(`[soldierAutoFireWeapon] 🎯 Навыки: слепой=${extraAmmo > 0}, везунчик=${luckyChance > 0}, осечка=${misfireLevel} уровней, бесплатный выстрел=${freeShot}`)
      console.log(`[soldierAutoFireWeapon] 🎯 Расход патронов: база=${baseAmmoCost}, слепой=+${extraAmmo}, итого=${totalAmmoCost}`)
      
      if (this.currentWeapon !== 'melee') {
        if (this.ammo < totalAmmoCost) return false
        
        const oldAmmo = this.ammo;
        this.ammo = Math.max(0, Math.round(this.ammo - totalAmmoCost));
        
        // Показываем индикатор изменения патронов
        console.log(`[soldierAutoFireWeapon] 🔍 Проверяем доступность forceCheckResourceChange:`, typeof window !== 'undefined' && (window as any).forceCheckResourceChange);
        
        if (typeof window !== 'undefined' && (window as any).forceCheckResourceChange) {
          const ammoChange = this.ammo - oldAmmo;
          console.log(`[soldierAutoFireWeapon] 🎯 Показываем индикатор для патронов: ${ammoChange > 0 ? '+' : ''}${ammoChange} ед`);
          (window as any).forceCheckResourceChange('ammo', ammoChange, false);
        } else {
          console.warn(`[soldierAutoFireWeapon] ❌ forceCheckResourceChange недоступен`);
        }
        
        this.updateAllResources()
      }
      // Выстрел (пропускаем расход патронов, так как уже потратили их выше)
      console.log(`[soldierAutoFireWeapon] 🎯 Вызываем fireWeaponOnce(skipAmmoConsumption=true)`)
      this.fireWeaponOnce(true)
      if (this.enemyQueueItems.length === 0) {
        console.log(`[soldierAutoFireWeapon] ❌ Врагов больше нет, прерываем стрельбу`)
        break
      }
    }
    console.log(`[soldierAutoFireWeapon] ✅ Завершили автоматическую стрельбу солдата`)
    return true
  }

  private arrangeTopBarRow(): void {
    if (!this.topBar) return
    const s = uiScale(this)
    const baseY = Math.round(28 * s)
    const topY = Math.round(8 * s)
    const portrait = isPortrait(this)

    if (portrait) {
      // Мобильная версия - компактное расположение
      const compact = this.scale.width < 700
      const iconSize = compact ? fs(this, 8) : fs(this, 10)

      // Верхний ряд: день/время, кнопки управления
      let leftX = 16
      if (this.dayText) {
        this.dayText.setFontSize(compact ? fs(this, 10) : fs(this, 12))
        this.dayText.setPosition(leftX, topY)
        leftX += this.dayText.width + 12
      }

      let rightX = this.scale.width - 16
      if (this.inventoryBtn) {
        this.inventoryBtn.setFontSize(iconSize)
        this.inventoryBtn.setPosition(rightX - this.inventoryBtn.width, topY)
        rightX = this.inventoryBtn.x - 8
      }
      if (this.pauseBtn) {
        this.pauseBtn.setFontSize(iconSize)
        this.pauseBtn.setPosition(rightX - this.pauseBtn.width, topY)
        rightX = this.pauseBtn.x - 8
      }
      if (this.abilitiesBtn) {
        this.abilitiesBtn.setFontSize(iconSize)
        this.abilitiesBtn.setPosition(rightX - this.abilitiesBtn.width, topY)
      }

      // Нижний ряд: ресурсы и счетчики
      let resourceX = 16
      if (this.populationBtn) {
        this.populationBtn.setFontSize(iconSize)
        this.populationBtn.setPosition(resourceX, baseY)
        resourceX += this.populationBtn.width + 8
      }
      if (this.happinessBtn) {
        this.happinessBtn.setFontSize(iconSize)
        this.happinessBtn.setPosition(resourceX, baseY)
        resourceX += this.happinessBtn.width + 8
      }
      if (this.ammoBtn) {
        this.ammoBtn.setFontSize(iconSize)
        this.ammoBtn.setPosition(resourceX, baseY)
        resourceX += this.ammoBtn.width + 8
      }
      if (this.comfortBtn) {
        this.comfortBtn.setFontSize(iconSize)
        this.comfortBtn.setPosition(resourceX, baseY)
        resourceX += this.comfortBtn.width + 8
      }
      if (this.foodBtn) {
        this.foodBtn.setFontSize(iconSize)
        this.foodBtn.setPosition(resourceX, baseY)
        resourceX += this.foodBtn.width + 8
      }
      if (this.waterBtn) {
        this.waterBtn.setFontSize(iconSize)
        this.waterBtn.setPosition(resourceX, baseY)
        resourceX += this.waterBtn.width + 8
      }
      if (this.moneyBtn) {
        this.moneyBtn.setFontSize(iconSize)
        this.moneyBtn.setPosition(resourceX, baseY)
        resourceX += this.moneyBtn.width + 8
      }
      if (this.enemyCountText) {
        this.enemyCountText.setFontSize(iconSize)
        this.enemyCountText.setPosition(resourceX, baseY)
        resourceX += this.enemyCountText.width + 8
      }

      // Шкала опыта внизу
      const expY = Math.round(47 * s)
      const expWidth = Math.min(300, this.scale.width - 32)
      if (this.levelText) {
        this.levelText.setFontSize(fs(this, 8))
        this.levelText.setPosition(16, Math.round(38 * s))
      }
      if (this.xpText) {
        this.xpText.setFontSize(fs(this, 8))
        this.xpText.setPosition(80, Math.round(38 * s))
      }
      if (this.experienceBg) {
        this.experienceBg.setPosition(16, expY)
        this.experienceBg.setSize(expWidth, 12)
      }
      if (this.experienceFg) {
        this.experienceFg.setPosition(16, expY)
        const progress = this.maxExperienceForLevel > 0 ? (this.bunkerExperience / this.maxExperienceForLevel) : 0
        this.experienceFg.setSize(Math.max(0, expWidth * progress), 12)
      }
    } else {
      // Десктоп версия - расширенное расположение
      let cursorX = 16
      // Левый блок: день/время, население и основные ресурсы
      if (this.dayText) {
        this.dayText.setFontSize(fs(this, 14))
        this.dayText.setPosition(cursorX, topY)
        cursorX += this.dayText.width + 20
      }

      if (this.populationBtn) {
        this.populationBtn.setPosition(cursorX, baseY)
        cursorX += this.populationBtn.width + 12
      }
      if (this.happinessBtn) {
        this.happinessBtn.setPosition(cursorX, baseY)
        cursorX += this.happinessBtn.width + 12
      }
      if (this.ammoBtn) {
        this.ammoBtn.setPosition(cursorX, baseY)
        cursorX += this.ammoBtn.width + 12
      }
      if (this.comfortBtn) {
        this.comfortBtn.setPosition(cursorX, baseY)
        cursorX += this.comfortBtn.width + 12
      }
      if (this.foodBtn) {
        this.foodBtn.setPosition(cursorX, baseY)
        cursorX += this.foodBtn.width + 12
      }
      if (this.waterBtn) {
        this.waterBtn.setPosition(cursorX, baseY)
        cursorX += this.waterBtn.width + 12
      }
      if (this.moneyBtn) {
        this.moneyBtn.setPosition(cursorX, baseY)
        cursorX += this.moneyBtn.width + 12
      }
      if (this.enemyCountText) {
        this.enemyCountText.setPosition(cursorX, baseY)
        cursorX += this.enemyCountText.width + 12
      }

      // Шкала опыта в центре
      const centerX = this.scale.width / 2
      const expWidth = Math.min(400, this.scale.width * 0.4)
      const expY = Math.round(47 * s)
      if (this.levelText) {
        this.levelText.setPosition(centerX - expWidth/2 - 60, Math.round(38 * s))
      }
      if (this.xpText) {
        this.xpText.setPosition(centerX - expWidth/2 + 20, Math.round(38 * s))
      }
      if (this.experienceBg) {
        this.experienceBg.setPosition(centerX - expWidth/2, expY)
        this.experienceBg.setSize(expWidth, 12)
      }
      if (this.experienceFg) {
        this.experienceFg.setPosition(centerX - expWidth/2, expY)
        const progress = this.maxExperienceForLevel > 0 ? (this.bunkerExperience / this.maxExperienceForLevel) : 0
        this.experienceFg.setSize(Math.max(0, expWidth * progress), 12)
      }

      // Правый блок: кнопки управления
      let rightX = this.scale.width - 16
      if (this.inventoryBtn) {
        this.inventoryBtn.setPosition(rightX - this.inventoryBtn.width, topY)
        rightX = this.inventoryBtn.x - 16
      }
      if (this.pauseBtn) {
        this.pauseBtn.setPosition(rightX - this.pauseBtn.width, topY)
        rightX = this.pauseBtn.x - 16
      }
      if (this.abilitiesBtn) {
        this.abilitiesBtn.setPosition(rightX - this.abilitiesBtn.width, topY)
      }
    }
  }

  // Вызывается при изменении структуры бункера (например, построена новая комната)
  public onBunkerChanged(): void {
    // Обновим ресурсы/вместимость
    this.updateAllResources()
    // Пересчёт видимости кнопок Accept/Deny и плашки «нет мест»
    this.updateUIVisibility()
    // Перелэйаутим правую панель с учётом нового capacity
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
    // Обновим текущее превью/тексты (на случай, если «нет мест» было показано)
    this.updatePersonInfoFromQueue()
  }

  private buildPeoplePanel(rect: Phaser.Geom.Rectangle): void {
    if (!this.peopleArea) return
    this.peopleArea.removeAll(true)
    // Заголовок
    const title = this.add.text(8, 6, `${t('population').toUpperCase()} • ${this.bunkerResidents.length}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    this.peopleArea.add(title)
    // Список
    let y = 32
    const lineH = 22
    const maxLines = Math.floor((rect.height - y - 8) / lineH)
    for (let i = 0; i < Math.min(this.bunkerResidents.length, maxLines); i++) {
      const r = this.bunkerResidents[i]
      const line = this.add.text(12, y, `${r.name} • ${r.profession}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text })
      const hit = this.add.rectangle(8, y - 2, rect.width - 16, lineH, 0x000000, 0.001).setOrigin(0, 0)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.showResidentDetailsInPeople(r, rect))
      this.peopleArea.add(line)
      this.peopleArea.add(hit)
      y += lineH
    }
  }

  private showResidentDetailsInPeople(r: any, rect: Phaser.Geom.Rectangle): void {
    if (!this.peopleArea) return
    this.peopleArea.removeAll(true)
    const title = this.add.text(8, 6, r.name.toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    const back = this.add.text(rect.width - 8, 6, '< BACK', { fontFamily: THEME.fonts.body, fontSize: '10px', color: '#8bc34a' }).setOrigin(1, 0)
    back.setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.buildPeoplePanel(rect))
    const skillsStr = (Array.isArray(r.skills) ? r.skills : []).map((s: any) => `• ${s?.text ?? '—'}`).join('\n')
    const details = this.add.text(12, 36, `ВОЗРАСТ: ${r.age}\nПОЛ: ${r.gender}\nПРОФЕССИЯ: ${r.profession}\nПРЕДМЕТЫ: ${r.itemsText}\n\nНАВЫКИ:\n${skillsStr}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: rect.width - 24 } })
    this.peopleArea.add([title, back, details])
  }

  private buildResourcesPanel(rect: Phaser.Geom.Rectangle): void {
    if (!this.resourcesArea) return
    this.resourcesArea.removeAll(true)
    const title = this.add.text(8, 6, 'РЕСУРСЫ', { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' })
    const body = this.add.text(12, 36, 'Окно ресурсов (WIP)\nСчастье, Защита, Патроны, Комфорт, Еда, Вода, Деньги', { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: rect.width - 24 } })
    this.resourcesArea.add([title, body])
  }

  private openResourceOverlay(kind: string): void {
    if (isPortrait(this)) {
      this.mobileActive = 'resources'
      this.layout()
      return
    }
    const overlay = this.add.container(0, 0)
    overlay.name = 'resourceOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(520, Math.floor(w * 0.55))
    const panelH = Math.min(420, Math.floor(h * 0.6))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, `${kind.toUpperCase()}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const close = this.add.text(panelW - 12, 12, 'X', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(1, 0)
    close.setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    const body = this.add.text(12, 44, 'Здесь будет управление ресурсом (WIP)', { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: panelW - 24 } }).setOrigin(0, 0)
    panel.add([panelBg, title, close, body])
    overlay.add([bg, panel])
  }

  // Десктопный оверлей со списком жителей (при клике по кнопке населения в топ-баре)
  private openResidentsOverlay(): void {
    // Если мобильный режим — переключаем вкладку PEOPLE
    if (isPortrait(this)) {
      this.mobileActive = 'people'
      this.layout()
      return
    }
    const overlay = this.add.container(0, 0)
    overlay.name = 'residentsOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(560, Math.floor(w * 0.6))
    const panelH = Math.min(520, Math.floor(h * 0.7))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, `${t('population').toUpperCase()} • ${this.bunkerResidents.length}`, { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const close = this.add.text(panelW - 12, 12, 'X', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#e57373', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(1, 0)
    close.setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    panel.add([panelBg, title, close])
    let y = 48
    const lineH = 26
    const listH = panelH - 60
    const max = Math.floor(listH / lineH)
    for (let i = 0; i < Math.min(this.bunkerResidents.length, max); i++) {
      const r = this.bunkerResidents[i]
      const text = this.add.text(12, y, `${r.name} • ${r.profession}`, { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text }).setOrigin(0, 0)
      const hit = this.add.rectangle(8, y - 2, panelW - 16, lineH, 0x000000, 0.001).setOrigin(0, 0)
      hit.setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => { overlay.destroy(); this.openResidentDetailOverlay(r) })
      panel.add([text, hit])
      y += lineH
    }
    overlay.add([bg, panel])
  }

  private openResidentDetailOverlay(r: any): void {
    const overlay = this.add.container(0, 0)
    overlay.name = 'residentDetailOverlay'
    overlay.setDepth(2500)
    const w = this.scale.width
    const h = this.scale.height
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0)
    const panelW = Math.min(560, Math.floor(w * 0.6))
    const panelH = Math.min(520, Math.floor(h * 0.7))
    const panelX = Math.floor((w - panelW) / 2)
    const panelY = Math.floor((h - panelH) / 2)
    const panel = this.add.container(panelX, panelY)
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    panelBg.setStrokeStyle(2, 0x4fc3f7, 1)
    const title = this.add.text(panelW / 2, 14, r.name.toUpperCase(), { fontFamily: THEME.fonts.heading, fontSize: '14px', color: '#4fc3f7' }).setOrigin(0.5, 0)
    const back = this.add.text(12, 12, '< BACK', { fontFamily: THEME.fonts.body, fontSize: '10px', color: '#8bc34a', backgroundColor: '#1a1d22', padding: { x: 4, y: 2 } }).setOrigin(0, 0)
    back.setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => { overlay.destroy(); this.openResidentsOverlay() })
    const skillsStr = (Array.isArray(r.skills) ? r.skills : []).map((s: any) => `• ${s?.text ?? '—'}`).join('\n')
    const statusLine = r.status ? `\nСТАТУС: ${r.status}` : ''
    const needH = (n: number|undefined) => (n==null? '—' : `${n}%`)
    const details = this.add.text(12, 44, `ВОЗРАСТ: ${r.age}\nПОЛ: ${r.gender}\nПРОФЕССИЯ: ${r.profession}${statusLine}\nРЕСУРСЫ: ${r.itemsText}\n\нНАВЫКИ:\n${skillsStr}\n\nПОТРЕБНОСТИ:\nГОЛОД: ${needH(r.hunger)}  ЖАЖДА: ${needH(r.thirst)}\nЭНЕРГИЯ: ${needH(r.energy)}  ЗДОРОВЬЕ: ${needH(r.health)}${r.patient? ' (пациент)' : ''}`.replace('\н', '\n'), { fontFamily: THEME.fonts.body, fontSize: '10px', color: THEME.colors.text, wordWrap: { width: panelW - 24 } }).setOrigin(0, 0)
    panel.add([panelBg, title, back, details])
    overlay.add([bg, panel])
  }

  private togglePause(): void {
    if (this.scene.isPaused()) {
      this.scene.resume()
      this.pauseBtn?.setText(`[ ${t('pause')} ]`)
      this.showToast(t('resume'))
    } else {
      this.scene.pause()
      this.pauseBtn?.setText(`[ ${t('resume')} ]`)
      this.showToast(t('paused'))
    }
  }

  private nextCandidate(): void {
    // Переход дня/ночи теперь по таймеру. Кнопки лишь переключают кандидата
    this.showToast(t('next'))
    this.buildPersonPlaceholders()
    this.layout()
  }

  private startNewDay(): void {
    this.dayNumber += 1
    this.phase = 'day'
    
    try {
      // Получаем начальное количество посетителей из конфигурации
      this.visitorsRemaining = this.configManager.getInitialVisitors()
      
      // Получаем опыт за прожитый день из конфигурации
      const dailyReward = this.configManager.getDailyReward()
      this.awardExperience('прожитый день', dailyReward)
    } catch (error) {
      console.error('[GameScene] Ошибка получения настроек дня из конфигурации:', error)
      // Fallback к старым значениям
      this.visitorsRemaining = 3
      this.awardExperience('прожитый день', 25)
    }
    
    // Рассчитываем множители потребления ресурсов на основе нового дня
    this.calculateResourceConsumptionMultipliers()
    
    this.buildSurfacePlaceholders()
    this.buildPersonPlaceholders()
    this.buildBunkerPlaceholders()
    this.layout()
    this.showToast(`Наступил новый день: ${this.dayNumber}`)
  }

  private startDayPhase(resetCycleStart: boolean): void {
    // Начинаем цикл с 06:00. dayCycleStartAt = now - смещение, соответствующее 06:00 в пределах суток
    if (resetCycleStart) {
      // Для старта: пусть within=0 => 06:00
      this.dayCycleStartAt = this.time.now
    }
    this.phase = 'day'
    this.phaseEndsAt = this.dayCycleStartAt + this.DAY_DURATION_MS
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t('dayPhase')} • ${this.getClockText()}`)
    this.showToast(`Наступил день ${this.dayNumber}`)
    // Обновляем фон двери при смене фазы
    this.updateEntranceBackground()
    // Обновляем фон погоды при смене фазы
    this.updateWeatherBackground()
    // Если первый день — создаём 3 посетителей
    if (this.dayNumber === 1 && !this.initialQueueSeeded) {
      this.initialQueueSeeded = true
      // Задержка перед появлением первых посетителей
      this.time.delayedCall(2000, () => {
        this.seedInitialVisitors(3)
      })
    }
    // Запускаем прибытие людей периодически днём
    this.arrivalEvent?.remove(false)
    this.scheduleVisitorArrival()
    // Останавливаем ночную волну врагов
    this.enemyArrivalEvent?.remove(false)
    // Обновляем интерфейс при смене фазы
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  private startNightPhase(): void {
    this.phase = 'night'
    this.phaseEndsAt = this.dayCycleStartAt + this.DAY_DURATION_MS + this.NIGHT_DURATION_MS
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t('nightPhase')} • ${this.getClockText()}`)
    this.showToast(`Наступила ночь ${this.dayNumber}`)
    // Обновляем фон двери при смене фазы
    this.updateEntranceBackground()
    // Обновляем фон погоды при смене фазы
    this.updateWeatherBackground()
    // Ночью очередь людей расходится
    this.arrivalEvent?.remove(false)
    this.disperseQueue()
    // Запускаем волну врагов с динамическим интервалом
    this.scheduleEnemyArrival()
    // Сразу создадим первого врага, чтобы отобразить кнопку DEFENSE
    this.maybeArriveEnemy()
    // Обновляем интерфейс при смене фазы
    if (this.lastPersonRect) this.layoutPersonArea(this.lastPersonRect)
  }

  private getClockText(): string {
    const cycle = this.DAY_DURATION_MS + this.NIGHT_DURATION_MS
    if (this.dayCycleStartAt === 0) return '06:00'
    const now = this.time.now
    let elapsed = now - this.dayCycleStartAt
    if (elapsed < 0) elapsed = 0
    const within = elapsed % cycle
    // День: 06:00 -> 22:00 (16ч) за DAY_DURATION_MS
    // Ночь: 22:00 -> 06:00 (8ч) за NIGHT_DURATION_MS
    const secondsInHour = 3600
    const baseDayStartSec = 6 * secondsInHour
    const daySpanSec = 16 * secondsInHour
    const nightSpanSec = 8 * secondsInHour
    let totalSec: number
    if (within < this.DAY_DURATION_MS) {
      const k = within / this.DAY_DURATION_MS
      totalSec = baseDayStartSec + Math.floor(k * daySpanSec)
    } else {
      const nightElapsed = within - this.DAY_DURATION_MS
      const k = nightElapsed / this.NIGHT_DURATION_MS
      totalSec = (22 * secondsInHour) + Math.floor(k * nightSpanSec)
    }
    totalSec = totalSec % (24 * secondsInHour)
    const hh = Math.floor(totalSec / secondsInHour)
    const mm = Math.floor((totalSec % secondsInHour) / 60)
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return `${pad(hh)}:${pad(mm)}`
  }

  private tickClockAndPhase(): void {
    if (!this.topBar) return
    if (this.dayCycleStartAt === 0) this.dayCycleStartAt = this.time.now
    const isDay = this.phase === 'day'
    this.dayText?.setText(`${t('day')}: ${this.dayNumber} • ${t(isDay ? 'dayPhase' : 'nightPhase')} • ${this.getClockText()}`)
    // Смена фазы по времени часов: в 22:00 — ночь, в 06:00 — день
    const clock = this.getClockText()

    // Проверка генерации сообщений фракций
    this.checkFactionMessages()

    // Плавный переход за 30 секунд до смены фазы
    if (clock === '21:30' && this.phase === 'day' && !this.isTransitioning) {
      console.log('🌙 Начинается закат - плавный переход к ночи через 30 секунд')
      this.startDayNightTransition()
    }
    if (clock === '05:30' && this.phase === 'night' && !this.isTransitioning) {
      console.log('🌅 Начинается рассвет - плавный переход к дню через 30 секунд')
      this.startDayNightTransition()
    }

    if (clock === '22:00' && this.phase !== 'night') {
      this.sendResidentsToRestRooms()
      this.startNightPhase()
      this.layout()
    }
    if (clock === '06:00' && this.phase !== 'day') {
      this.startDayPhase(false)
      this.layout()
    }

    // Новый день наступает в 00:00 (счётчик дня +1), но фаза остаётся ночной до 06:00
    if (clock === '00:00') {
      console.log(`[tickClockAndPhase] Час 00:00, midnightHandled: ${this.midnightHandled}`)
      if (!this.midnightHandled) {
        console.log(`[tickClockAndPhase] Выполняем обработку полночи`)
        // Суточная экономика в полночь
        this.processDailyResources()

        // Генерация заданий для фракций каждый новый день
        console.log(`[tickClockAndPhase] Вызываем generateDailyFactionQuests`)
        try {
          this.generateDailyFactionQuests()
          console.log(`[tickClockAndPhase] generateDailyFactionQuests выполнен успешно`)
        } catch (error) {
          console.error(`[tickClockAndPhase] Ошибка в generateDailyFactionQuests:`, error)
        }

        this.dayNumber += 1
        this.showToast(`Наступил новый день: ${this.dayNumber}`)

        // Очищаем сообщения фракций за предыдущий день
        this.clearFactionDailyMessages();

        this.midnightHandled = true
        // Ночью при новом дне — враги продолжают стоять, люди не приходят
        if (this.phase === 'night') this.scheduleEnemyArrival()
      } else {
        console.log(`[tickClockAndPhase] Полночь уже обработана`)
      }
    } else {
      if (this.midnightHandled) {
        console.log(`[tickClockAndPhase] Сбрасываем midnightHandled для следующего дня`)
        this.midnightHandled = false
      }
    }

    // Ежечасная обработка работы жителей (06..21 — день, 22..05 — ночь)
    const hh = parseInt(clock.slice(0, 2), 10)
    const isDayHour = hh >= 6 && hh < 22
    if (this.lastHourTick !== hh) {
      console.log(`[tickClockAndPhase] Смена часа: ${this.lastHourTick} → ${hh}`)
      ;(this.simpleBunker as any)?.onHourTick?.(hh, isDayHour)
      this.lastHourTick = hh
      
      // Обрабатываем здоровье жителей и врагов каждый час
      console.log(`[tickClockAndPhase] Час ${hh}: Вызываем processEnemyDefenseDamage`)
      this.processEnemyDefenseDamage(hh)

      // Проверка жителей на безумие каждый час
      this.checkResidentsForInsanity()
      
      // Рассчитываем множители потребления ресурсов на основе количества дней и сложности
      this.calculateResourceConsumptionMultipliers()
    }
  }

  private sendResidentsToRestRooms(): void {
    // Сообщаем bunkerView, что ночь — отправить жителей в комнаты отдыха
    try {
      (this.simpleBunker as any)?.sendResidentsToRestRooms?.()
    } catch {}
  }

  private computeEnemyArrivalDelay(): number {
    let base = 8000
    switch (this.difficulty) {
      case 'easy':
        base = 12000 // Враги приходят реже на легкой сложности
        break
      case 'normal':
        base = 8000 // Стандартный интервал
        break
      case 'hard':
        base = 5000 // Враги приходят чаще на сложной сложности
        break
      default:
        base = 8000
    }
    
    // Влияние комфорта на интервал прихода врагов
    // Чем выше комфорт, тем реже приходят враги
    const comfortFactor = Math.max(0.5, 1 + (this.comfort / 100) * 0.5)
    base *= comfortFactor
    
    // Влияние количества дней на интервал прихода врагов
    // С каждым днем враги приходят чаще
    const daysPassed = Math.max(0, this.dayNumber - 1)
    const dayFactor = Math.pow(0.92, daysPassed) // Более агрессивное увеличение частоты
    base *= dayFactor
    
    const minDelay = 2200
    const delay = Math.max(minDelay, Math.floor(base))
    
    console.log(`[computeEnemyArrivalDelay] Сложность: ${this.difficulty}, День: ${this.dayNumber}, Комфорт: ${this.comfort}%, Базовая задержка: ${base}ms, Финальная задержка: ${delay}ms`)
    
    return delay
  }

  private scheduleEnemyArrival(): void {
    this.enemyArrivalEvent?.remove(false)
    const delay = this.computeEnemyArrivalDelay()
    this.enemyArrivalEvent = this.time.addEvent({ delay, loop: true, callback: () => this.maybeArriveEnemy() })
  }

  private scheduleVisitorArrival(): void {
    this.arrivalEvent?.remove(false)
    const delay = this.computeVisitorArrivalDelay()
    this.arrivalEvent = this.time.delayedCall(delay, () => {
      this.maybeArriveVisitor()
      if (this.phase === 'day') this.scheduleVisitorArrival()
    })
  }

  // Очистка привязана к событию SHUTDOWN

  /**
   * Генерация ежедневных заданий для фракций
   */
  private generateDailyFactionQuests(): void {
    console.log(`[generateDailyFactionQuests] ===== НАЧАЛО ГЕНЕРАЦИИ ЗАДАНИЙ =====`)
    console.log(`[generateDailyFactionQuests] Генерация заданий для дня ${this.dayNumber}`);

    const unlockedFactions = this.factionManager?.getUnlockedFactions() || [];
    console.log(`[generateDailyFactionQuests] Найдено разблокированных фракций: ${unlockedFactions.length}`, unlockedFactions.map(f => f.name));

    if (unlockedFactions.length === 0) {
      console.log('[generateDailyFactionQuests] Нет разблокированных фракций');
      return;
    }

    // Генерируем 1-2 задания в день
    const questCount = Math.random() < 0.6 ? 1 : 2; // 60% шанс на 1 задание, 40% на 2

    for (let i = 0; i < questCount; i++) {
      let factionId: FactionId;
      let randomFaction;
      let activeSourceType: string | null = null;
      let activeFactionId: FactionId | null = null;

      // Если есть активный источник информации, приоритетно генерируем задание для его фракции
      if ((window as any).activeQuestItem && (window as any).activeQuestItem.id) {
        activeSourceType = (window as any).activeQuestItem.id;
        // Конвертируем sourceType в factionId
        const sourceTypeToFactionId: Record<string, FactionId> = {
          'radio': 'hq' as FactionId,
          'gps': 'rebels' as FactionId,
          'laptop': 'free' as FactionId,  // исправлено с 'freedom' на 'free'
          'phone': 'marauders' as FactionId,
          'transmitter': 'mystery' as FactionId,
          'map': 'treasures' as FactionId
        };

        activeFactionId = activeSourceType ? sourceTypeToFactionId[activeSourceType] : null;
        if (activeFactionId && unlockedFactions.some(f => f.id === activeFactionId)) {
          // Генерируем задание для фракции активного источника
          randomFaction = unlockedFactions.find(f => f.id === activeFactionId);
          factionId = activeFactionId;
          console.log(`[generateDailyFactionQuests] Приоритет: генерируем задание для активного источника ${activeSourceType} (фракция ${factionId})`);
        } else {
          // Выбираем случайную разблокированную фракцию
          randomFaction = unlockedFactions[Math.floor(Math.random() * unlockedFactions.length)];
          factionId = randomFaction!.id as FactionId;
        }
      } else {
        // Выбираем случайную разблокированную фракцию
        randomFaction = unlockedFactions[Math.floor(Math.random() * unlockedFactions.length)];
        factionId = randomFaction!.id as FactionId;
      }

      // Проверяем, есть ли уже задание для этой фракции
      const existingQuest = (window as any).sourceQuests?.activeQuests?.[factionId];
      if (existingQuest) {
        if (existingQuest.accepted) {
          console.log(`[generateDailyFactionQuests] Пропускаем генерацию для ${factionId} - уже есть принятое задание: ${existingQuest.title}`);
        } else {
          console.log(`[generateDailyFactionQuests] Пропускаем генерацию для ${factionId} - уже есть непринятое задание: ${existingQuest.title}`);
        }
        
        // Если это был приоритетный активный источник, пробуем другую фракцию
        if (activeSourceType && factionId === activeFactionId) {
          console.log(`[generateDailyFactionQuests] Активный источник ${activeSourceType} уже имеет задание, выбираем другую фракцию`);
          // Выбираем случайную разблокированную фракцию, отличную от активной
          const otherFactions = unlockedFactions.filter(f => f.id !== activeFactionId);
          if (otherFactions.length > 0) {
            randomFaction = otherFactions[Math.floor(Math.random() * otherFactions.length)];
            factionId = randomFaction!.id as FactionId;
            console.log(`[generateDailyFactionQuests] Выбрана альтернативная фракция: ${factionId}`);
            
            // Проверяем новую фракцию
            const newExistingQuest = (window as any).sourceQuests?.activeQuests?.[factionId];
            if (newExistingQuest) {
              console.log(`[generateDailyFactionQuests] Альтернативная фракция ${factionId} тоже имеет задание, пропускаем`);
              continue;
            }
          } else {
            console.log(`[generateDailyFactionQuests] Нет других доступных фракций, пропускаем генерацию`);
            continue;
          }
        } else {
          continue; // Пропускаем генерацию для этой фракции
        }
      }

      // Получаем случайное задание для фракции
      const quest = this.questManager.getRandomQuest(factionId);

      if (quest) {
        // Отправляем задание в UI через sourceQuests
        if (typeof window !== 'undefined' && (window as any).sourceQuests) {
          // Создаем объект активного задания
          const activeQuest = {
            ...quest,
            progress: 0,
            accepted: false,
            acceptedAt: new Date()
          };

          // Сохраняем задание в sourceQuests (только если нет принятого задания)
          (window as any).sourceQuests.activeQuests[factionId] = activeQuest;
          console.log(`[generateDailyFactionQuests] Сохранено задание для фракции ${factionId}:`, activeQuest);

          // Обновляем UI для активного источника информации
          if (typeof window !== 'undefined' && (window as any).updateQuestsDisplay) {
            console.log(`[generateDailyFactionQuests] Обновляем UI для фракции ${factionId}`);

            // Если есть активный источник информации, обновляем его
            if ((window as any).activeQuestItem && (window as any).activeQuestItem.id) {
              const activeSource = (window as any).activeQuestItem.id;
              console.log(`[generateDailyFactionQuests] Обновляем UI для активного источника: ${activeSource}`);
              (window as any).updateQuestsDisplay(activeSource);

              // Также обновляем showInfoSourcePanel, чтобы показать новое задание в блоке сообщений
              console.log(`[generateDailyFactionQuests] Обновляем панель информации для активного источника`);
              (window as any).showInfoSourcePanel((window as any).activeQuestItem);
            } else {
              // Если нет активного источника, обновляем для сгенерированной фракции
              console.log(`[generateDailyFactionQuests] Нет активного источника, обновляем для ${factionId}`);
              (window as any).updateQuestsDisplay(factionId);
            }
          } else {
            console.log(`[generateDailyFactionQuests] Функция updateQuestsDisplay не найдена`);
          }

          console.log(`[generateDailyFactionQuests] Сгенерировано задание для ${randomFaction!.name}: ${quest.title}`);
          this.showToast(`Новое задание от ${randomFaction!.name}: ${quest.title}`);
        }
      }
    }
  }

  /**
   * Обновляет прогресс заданий фракций
   */
  private updateFactionQuestProgress(action: string, ...params: any[]): void {
    if (typeof window === 'undefined' || !(window as any).sourceQuests) return;

    const sourceQuests = (window as any).sourceQuests;
    const activeQuests = sourceQuests.activeQuests;

    // Проходим по всем активным заданиям
    for (const [factionType, quest] of Object.entries(activeQuests) as [string, any][]) {
      if (!quest || !quest.accepted) continue;

      let progressIncrement = 0;

      switch (quest.type) {
        case 'recruit':
          if (action === 'recruit') {
            progressIncrement = 1;
          }
          break;

        case 'exile':
          if (action === 'exile') {
            progressIncrement = 1;
          }
          break;

        case 'kill_enemy':
          if (action === 'kill_enemy') {
            const enemyType = params[0];
            if (quest.target === enemyType || quest.target === 'any') {
              progressIncrement = 1;
            }
          }
          break;

        case 'get_item':
          if (action === 'get_item') {
            const itemId = params[0];
            if (quest.target === itemId) {
              progressIncrement = 1;
            }
          }
          break;

        case 'collect_resource':
          if (action === 'collect_resource') {
            const resourceType = params[0];
            const amount = params[1] || 1;
            if (quest.target === resourceType) {
              progressIncrement = amount;
            }
          }
          break;

        case 'build_room':
          if (action === 'build_room') {
            const roomType = params[0];
            if (quest.target === roomType) {
              progressIncrement = 1;
            }
          }
          break;

        case 'destroy_room':
          if (action === 'destroy_room') {
            const roomType = params[0];
            if (quest.target === roomType) {
              progressIncrement = 1;
            }
          }
          break;

        case 'sacrifice':
          if (action === 'sacrifice') {
            progressIncrement = 1;
          }
          break;

        case 'insanity':
          if (action === 'insanity') {
            progressIncrement = 1;
          }
          break;

        case 'produce_resource':
          if (action === 'produce_resource') {
            const resourceType = params[0];
            const amount = params[1] || 1;
            if (quest.target === resourceType) {
              progressIncrement = amount;
            }
          }
          break;

        case 'trade':
          if (action === 'trade') {
            progressIncrement = 1;
          }
          break;

        case 'refuse_profession':
          if (action === 'refuse_profession') {
            const profession = params[0];
            if (quest.target === profession) {
              progressIncrement = 1;
            }
          }
          break;

        case 'refuse_gender':
          if (action === 'refuse_gender') {
            const gender = params[0];
            if (quest.target === gender) {
              progressIncrement = 1;
            }
          }
          break;

        case 'refuse_skill':
          if (action === 'refuse_skill') {
            const skill = params[0];
            if (quest.target === skill) {
              progressIncrement = 1;
            }
          }
          break;

        case 'accept_profession':
          if (action === 'accept_profession') {
            const profession = params[0];
            if (quest.target === profession) {
              progressIncrement = 1;
            }
          }
          break;

        case 'accept_gender':
          if (action === 'accept_gender') {
            const gender = params[0];
            if (quest.target === gender) {
              progressIncrement = 1;
            }
          }
          break;

        case 'accept_skill':
          if (action === 'accept_skill') {
            const skill = params[0];
            if (quest.target === skill) {
              progressIncrement = 1;
            }
          }
          break;

        case 'find_sidequest':
          if (action === 'find_sidequest') {
            const itemId = params[0];
            if (quest.target === itemId) {
              progressIncrement = 1;
            }
          }
          break;

        case 'attack_bunker':
          if (action === 'attack_bunker') {
            const factionTarget = params[0];
            if (quest.target === factionTarget) {
              progressIncrement = 1;
            }
          }
          break;

        case 'let_enemy_in':
          if (action === 'let_enemy_in') {
            progressIncrement = 1;
          }
          break;
      }

      if (progressIncrement > 0) {
        sourceQuests.updateQuestProgress(factionType, progressIncrement);

        // Проверяем, выполнено ли задание
        if (sourceQuests.isQuestCompleted(factionType)) {
          this.showToast(`Задание выполнено!`);
          // Здесь можно добавить награду за выполнение задания
        }
      }
    }
  }

  /**
   * Обработка убийства врага для трекинга заданий
   */
  public onEnemyKilled(enemyType: string): void {
    console.log(`[onEnemyKilled] Враг убит: ${enemyType}`);
    this.updateFactionQuestProgress('kill_enemy', enemyType);
  }

  /**
   * Обработка изгнания жителя для трекинга заданий
   */
  public onResidentExiled(): void {
    console.log(`[onResidentExiled] Житель изгнан`);
    this.updateFactionQuestProgress('exile');
  }

  /**
   * Обработка постройки комнаты для трекинга заданий
   */
  public onRoomBuilt(roomType: string): void {
    console.log(`[onRoomBuilt] Построена комната: ${roomType}`);
    this.updateFactionQuestProgress('build_room', roomType);
  }

  /**
   * Обработка разрушения комнаты для трекинга заданий
   */
  public onRoomDestroyed(roomType: string): void {
    console.log(`[onRoomDestroyed] Разрушена комната: ${roomType}`);
    this.updateFactionQuestProgress('destroy_room', roomType);
  }

  /**
   * Обработка получения предмета для трекинга заданий
   */
  public onItemObtained(itemId: string): void {
    console.log(`[onItemObtained] Получен предмет: ${itemId}`);
    this.updateFactionQuestProgress('get_item', itemId);
  }

  /**
   * Обработка жертвы жителя для трекинга заданий
   */
  public onResidentSacrificed(): void {
    console.log(`[onResidentSacrificed] Жертвоприношение`);
    this.updateFactionQuestProgress('sacrifice');
  }

  /**
   * Обработка доведения жителя до безумия для трекинга заданий
   */
  public onResidentInsane(): void {
    console.log(`[onResidentInsane] Житель доведен до безумия`);
    this.updateFactionQuestProgress('insanity');
  }

  /**
   * Обработка торговли для трекинга заданий
   */
  public onTradeCompleted(): void {
    console.log(`[onTradeCompleted] Торговля завершена`);
    this.updateFactionQuestProgress('trade');
  }

  /**
   * Обработка открытия фракции для генерации заданий
   */
  public onFactionUnlocked(factionId: string): void {
    console.log(`[onFactionUnlocked] Разблокирована фракция: ${factionId}`);
    // Можно добавить специальную логику для новых фракций
  }

  /**
   * Отладочная функция для тестирования системы заданий
   */
  public debugQuestSystem(): void {
    console.log('[DEBUG] === СИСТЕМА ЗАДАНИЙ ===');
    console.log('[DEBUG] Текущий день:', this.dayNumber);
    console.log('[DEBUG] Разблокированные фракции:', this.factionManager?.getUnlockedFactions().map(f => f.name) || []);

    if (typeof window !== 'undefined' && (window as any).sourceQuests) {
      const sourceQuests = (window as any).sourceQuests;
      const activeQuests = sourceQuests.activeQuests;
      console.log('[DEBUG] Активные задания:', Object.keys(activeQuests).length);

      Object.entries(activeQuests).forEach(([factionType, quest]: [string, any]) => {
        if (quest && quest.accepted) {
          console.log(`[DEBUG] ${factionType}: ${quest.title} (${quest.progress}/${quest.target})`);
        }
      });
    }

    // Тестируем генерацию заданий
    console.log('[DEBUG] Генерация тестового задания...');
    this.generateDailyFactionQuests();

    this.showToast('Система заданий протестирована (смотри консоль)');
  }

  private showToast(text: string): void {
    // Используем HTML уведомления вместо Phaser
    if (typeof window !== 'undefined' && (window as any).addGameNotification) {
      const currentDay = this.dayNumber;
      (window as any).addGameNotification(text, 'info', currentDay);
    } else {
      // Fallback к Phaser уведомлениям если HTML недоступен
      const toast = this.add.text(this.scale.width / 2, 64, text, {
        fontFamily: THEME.fonts.body,
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#424242'
      }).setOrigin(0.5)
      this.tweens.add({ targets: toast, alpha: 0, duration: 1200, ease: 'Sine.easeOut', onComplete: () => toast.destroy() })
    }
  }



  // ========= HTML UI Overlay Methods =========

  private async initUIOverlay(): Promise<void> {
    try {
      // Initialize UI overlay - script should already be loaded from HTML
      if (typeof window.initGameUI === 'function') {
        console.log('[GameScene] UI manager доступен, инициализируем overlay...');
        this.initializeOverlay();
      } else {
        console.warn('[GameScene] UI manager not available, retrying в 100ms...');
        // Retry after 100ms in case script is still loading
        setTimeout(() => this.initUIOverlay(), 100);
      }
    } catch (error) {
      console.error('[GameScene] Failed to initialize UI overlay:', error);
    }
  }

  private initializeOverlay(): void {
    try {
      // Check if UI overlay container exists and initialize UI manager
      const overlayContainer = document.getElementById('game-ui-overlay');
      if (overlayContainer && typeof window.initGameUI === 'function') {
        this.uiOverlay = window.initGameUI();
        console.log('[GameScene] HTML UI overlay initialized');

        // Проверяем готовность функций индикаторов
        this.checkIndicatorsReady();

        // Hide old Phaser UI elements
        this.hidePhaserUI();

        // Start periodic updates to overlay
        this.uiUpdateInterval = this.time.addEvent({
          delay: 200, // Update every 200ms
          loop: true,
          callback: () => this.updateUIOverlay()
        });

        // Initialize modals with sample data (will be called later with proper bunker state)
        // this.initializeModals();
      } else {
        console.warn('[GameScene] UI overlay container not found or UI manager not available');
      }
    } catch (error) {
      console.error('[GameScene] Failed to initialize overlay:', error);
    }
  }

  // Проверяем готовность функций индикаторов
  private checkIndicatorsReady(): void {
    const maxAttempts = 50; // 5 секунд максимум
    let attempts = 0;
    
    console.log('[GameScene] 🔍 Начинаем проверку готовности функций индикаторов...');
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      const hasForceCheck = typeof (window as any).forceCheckResourceChange === 'function';
      const hasShowIndicator = typeof (window as any).showResourceChangeIndicator === 'function';
      
      if (hasForceCheck && hasShowIndicator) {
        console.log('[GameScene] ✅ Функции индикаторов готовы!');
        console.log('[GameScene] 📊 forceCheckResourceChange:', typeof (window as any).forceCheckResourceChange);
        console.log('[GameScene] 📊 showResourceChangeIndicator:', typeof (window as any).showResourceChangeIndicator);
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        console.error('[GameScene] ❌ Функции индикаторов не стали доступны за 5 секунд');
        console.error('[GameScene] 📊 forceCheckResourceChange:', typeof (window as any).forceCheckResourceChange);
        console.error('[GameScene] 📊 showResourceChangeIndicator:', typeof (window as any).showResourceChangeIndicator);
        clearInterval(checkInterval);
      } else {
        console.log(`[GameScene] 🔍 Ожидаем функции индикаторов... попытка ${attempts}/${maxAttempts}`);
        console.log(`[GameScene] 📊 forceCheckResourceChange: ${hasForceCheck ? '✅' : '❌'}`);
        console.log(`[GameScene] 📊 showResourceChangeIndicator: ${hasShowIndicator ? '✅' : '❌'}`);
      }
    }, 100);
  }

  private updateUIOverlay(): void {
    if (!this.uiOverlay || typeof window.updateGameUI !== 'function') return;

    try {
      const resources = this.getResourcesData();
      const gameData = {
        day: this.dayNumber,
        phase: this.phase,
        time: this.getClockText(),
        population: this.bunkerResidents.length,
        capacity: this.getBunkerCapacity(),
        happiness: Math.floor(this.happiness),
        defense: Math.floor(this.defense),
        comfort: Math.floor(this.comfort),
        moral: Math.floor(this.moral),        // Добавляем мораль напрямую
        enemies: this.bunkerEnemies.length,
        bunkerLevel: this.bunkerLevel,
        bunkerExperience: Math.floor(this.bunkerExperience),
        maxExperience: Math.floor(this.maxExperienceForLevel),
        abilityPoints: this.abilityPoints,
        ...resources // Включаем все ресурсы
      };


      window.updateGameUI(gameData);

      // Также обновляем ресурсы в инвентаре
      if (typeof window.updateAllResourceDisplays === 'function') {
        window.updateAllResourceDisplays();
      }
    } catch (error) {
      console.error('[GameScene] Error updating UI overlay:', error);
    }
  }

  private updateResourcesTextOverlay(): void {
    // Update HTML overlay with resource data
    this.updateUIOverlay();
  }

  private hidePhaserUI(): void {
    // Hide top bar container
    if (this.topBar) {
      this.topBar.setVisible(false);
    }

    // Hide individual UI elements
    const elementsToHide = [
      this.dayText, this.populationBtn, this.happinessBtn,
      this.ammoBtn, this.comfortBtn, this.foodBtn, this.waterBtn, this.moneyBtn,
      this.abilitiesBtn, this.pauseBtn, this.inventoryBtn, this.enemyCountText,
      this.resourcesText, this.experienceBg, this.experienceFg, this.levelText, this.xpText
    ];

    elementsToHide.forEach(element => {
      if (element) {
        element.setVisible(false);
      }
    });

    console.log('[GameScene] Old Phaser UI elements hidden');
  }

  private showPhaserUI(): void {
    // Show top bar container
    if (this.topBar) {
      this.topBar.setVisible(true);
    }

    // Show individual UI elements (fallback method)
    const elementsToShow = [
      this.dayText, this.populationBtn, this.happinessBtn,
      this.ammoBtn, this.comfortBtn, this.foodBtn, this.waterBtn, this.moneyBtn,
      this.abilitiesBtn, this.pauseBtn, this.inventoryBtn, this.enemyCountText,
      this.resourcesText, this.experienceBg, this.experienceFg, this.levelText, this.xpText
    ];

    elementsToShow.forEach(element => {
      if (element) {
        element.setVisible(true);
      }
    });

    console.log('[GameScene] Old Phaser UI elements shown (fallback)');
  }

  private getDefaultInventory(): { id: string; quantity: number }[] {
    // Возвращаем только предметы инвентаря, исключая ресурсы
    const resourceIds = ['food', 'water', 'money', 'ammo', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass'];
    return this.bunkerInventory.filter(item =>
      item !== undefined && !resourceIds.includes(item.id)
    ) as { id: string; quantity: number }[];
  }

  /**
   * Логирует содержимое инвентаря для отладки
   */
  private logInventoryState(context: string = ""): void {
    console.log(`[INVENTORY ${context}] Полный инвентарь bunkerInventory:`);
    this.bunkerInventory.forEach((item, index) => {
      if (item && item.id) {
        console.log(`  [${index}] ${item.id} x${item.quantity}`);
      } else {
        console.log(`  [${index}] пустой слот`);
      }
    });

    const defaultInventory = this.getDefaultInventory();
    console.log(`[INVENTORY ${context}] Фильтрованный инвентарь getDefaultInventory (${defaultInventory.length} предметов):`);
    defaultInventory.forEach((item, index) => {
      console.log(`  [${index}] ${item.id} x${item.quantity}`);
    });
  }

  /**
   * Логирует активный квестовый предмет
   */
  private logActiveQuestItem(context: string = ""): void {
    if (this.activeQuestItem) {
      console.log(`[QUEST_SLOT ${context}] Активный предмет: ${this.activeQuestItem.id} x${this.activeQuestItem.quantity} (${this.activeQuestItem.name})`);
    } else {
      console.log(`[QUEST_SLOT ${context}] Слот пустой`);
    }
  }

  private getResourcesData(): { [key: string]: number } {
    // Возвращаем данные ресурсов для UI как целые числа
    return {
      food: Math.floor(this.food),
      water: Math.floor(this.water),
      money: Math.floor(this.money),
      ammo: Math.floor(this.ammo),
      comfort: Math.floor(this.comfort),
      moral: Math.floor(this.moral),        // Добавляем мораль
      wood: Math.floor(this.wood),
      metal: Math.floor(this.metal),
      coal: Math.floor(this.coal),
      nails: Math.floor(this.nails),
      paper: Math.floor(this.paper),
      glass: Math.floor(this.glass)
    };
  }

  private initializeModals(): void {
    // Initialize inventory with real items from database
    if (typeof window.populateInventoryModal === 'function') {
      const initialInventory = this.getDefaultInventory();

      // Если bunkerView доступен, используем актуальное количество складов
      if (this.simpleBunker && this.simpleBunker.getStorageRoomCount) {
        const storageCount = this.simpleBunker.getStorageRoomCount();
        const correctRows = Math.max(1, storageCount + 1);
        if (correctRows !== this.inventoryRows) {
          console.log(`[GameScene] Correcting inventory rows from ${this.inventoryRows} to ${correctRows} based on ${storageCount} storage rooms`);
          this.inventoryRows = correctRows;
        }
      }

      console.log(`[GameScene] Initializing inventory with ${this.inventoryRows} rows and ${initialInventory.length} items`);
      // Используем только существующие предметы, без заглушек
      const existingItems = initialInventory.filter(item => {
        const itemData = this.getItemById(item.id);
        return itemData !== undefined;
      });
      window.populateInventoryModal(existingItems, this.inventoryRows);
    }

    // Initialize resources in inventory modal
    if (typeof window.updateAllResourceDisplays === 'function') {
      window.updateAllResourceDisplays();
    }

    // Initialize abilities with sample data
    if (typeof window.populateAbilitiesModal === 'function') {
      window.populateAbilitiesModal([]);
    }

    // Debug: Log current residents data
    console.log('[GameScene] Current bunker residents:', this.bunkerResidents);
    console.log('[GameScene] Residents count:', this.bunkerResidents.length);

    // Make sure game object is available globally
    if (typeof window !== 'undefined') {
      window.game = this.game;
      console.log('[GameScene] window.game set globally');
    }

    console.log('[GameScene] Modals initialized with sample data');
  }

  // Public method to get current residents data for HTML UI
  // Методы управления погодой
  public setWeather(weather: WeatherState, duration?: number): void {
    this.setWeatherState(weather, duration)
  }

  public getCurrentWeather(): WeatherState {
    return this.weatherState
  }

  public startRain(duration?: number): void {
    this.setWeatherState('rain', duration)
  }

  public startLightingStorm(): void {
    // Сначала показываем молнию на короткое время
    this.setWeatherState('lighting', 200) // 0.2 секунды молния
    // Затем дождь на 10 секунд
    this.time.delayedCall(200, () => {
      this.setWeatherState('rain', 10000)
    })
  }

  public startAcidFog(duration?: number): void {
    this.setWeatherState('acid_fog', duration)
  }

  public clearWeather(): void {
    this.setWeatherState('clear')
  }

  public getCurrentResidentsData(): any[] {
    console.log('[GameScene] getCurrentResidentsData called, residents count:', this.bunkerResidents.length);

    return this.bunkerResidents.map((resident, index) => ({
      id: resident.id,
      index: index,
      name: resident.name,
      age: resident.age,
      gender: resident.gender,
      profession: resident.profession,
      status: resident.status || 'Отдыхает',
      hunger: resident.hunger || 100,
      thirst: resident.thirst || 100,
      energy: resident.energy || 100,
      health: resident.health || 100,
      skills: resident.skills || [],
      itemsText: resident.itemsText || 'Нет предметов',
      admittedAt: resident.admittedAt,
      patient: resident.patient || false,
      isEnemy: false
    }));
  }

  // Public method to get updated resident data by ID
  public expandInventory(): void {
    this.inventoryRows++;
    // Re-initialize inventory with new row count
    this.initializeModals();
  }

  // Public methods for active quest item management
  // ===== СИСТЕМА СООБЩЕНИЙ ФРАКЦИЙ =====

  /**
   * Запуск планировщика сообщений фракций для активного источника информации
   */
  private startFactionMessageScheduler(itemId: string): void {
    // Маппинг предметов на фракции
    const itemToFactionMap: { [key: string]: FactionId } = {
      'radio': 'hq',
      'gps': 'rebels',
      'laptop': 'free',
      'phone': 'marauders',
      'transmitter': 'mystery'
    };

    const factionId = itemToFactionMap[itemId];
    if (!factionId) {
      console.log(`[Faction Messages] Предмет ${itemId} не соответствует фракции`);
      return;
    }

    // Проверяем, доступна ли фракция
    if (this.factionManager) {
      const faction = this.factionManager.getFaction(factionId);
      if (!faction || !faction.isUnlocked) {
        console.log(`[Faction Messages] Фракция ${factionId} не разблокирована`);
        return;
      }
    }

    console.log(`[Faction Messages] Запуск планировщика для фракции ${factionId} (предмет: ${itemId})`);

    // Вызываем глобальную функцию для запуска планировщика
    if (typeof (window as any).sourceQuests?.messageScheduler?.start === 'function') {
      // Передаем текущее внутриигровое время
      const gameTime = this.time.now;
      (window as any).sourceQuests.messageScheduler.start(factionId, gameTime);
    }
  }

  /**
   * Остановка планировщика сообщений фракций
   */
  private stopFactionMessageScheduler(): void {
    console.log(`[Faction Messages] Остановка всех планировщиков сообщений фракций`);

    if (typeof (window as any).stopAllFactionMessageSchedulers === 'function') {
      (window as any).stopAllFactionMessageSchedulers();
    }
  }

  /**
   * Проверка необходимости генерации сообщений фракций
   */
  private checkFactionMessages(): void {
    // Используем внутриигровое время
    const gameTimeMs = this.time.now;

    // Получаем текущий игровой час
    const totalSec = Math.floor((this.time.now - this.dayCycleStartAt) / 1000)
    const secondsInHour = 60 * 60
    const gameHour = Math.floor(totalSec / secondsInHour) % 24;

    // Вызываем проверку планировщика сообщений
    if (typeof (window as any).sourceQuests?.messageScheduler?.checkAndGenerateMessages === 'function') {
      (window as any).sourceQuests.messageScheduler.checkAndGenerateMessages(gameTimeMs, gameHour);
    } else {
      console.log('[Faction Messages] checkAndGenerateMessages не найдена');
    }
  }

  /**
   * Очистка сообщений фракций за текущий день
   */
  private clearFactionDailyMessages(): void {
    console.log(`[Faction Messages] Очистка сообщений фракций за день ${this.dayNumber - 1}`);

    if (typeof (window as any).clearFactionDailyMessages === 'function') {
      (window as any).clearFactionDailyMessages();
    }
  }

  public setActiveQuestItem(itemId: string): boolean {
    console.log(`[setActiveQuestItem] НАЧАЛО: установка предмета ${itemId} в слот источника`);
    this.logInventoryState("ДО setActiveQuestItem");
    this.logActiveQuestItem("ДО setActiveQuestItem");

    const itemData = this.getItemById(itemId);
    if (!itemData || (itemData.category !== 'quest' && itemData.category !== 'sidequest')) {
      console.log(`[setActiveQuestItem] ОШИБКА: предмет ${itemId} не найден или не является квестовым`);
      return false;
    }

    // Предотвращаем дублирование вызовов
    if (this.activeQuestItem && this.activeQuestItem.id === itemId) {
      console.log(`[setActiveQuestItem] Предмет ${itemId} уже активен, пропускаем`);
      return true; // Уже установлен этот предмет
    }

    // Останавливаем планировщик предыдущей фракции, если предмет меняется
    if (this.activeQuestItem && this.activeQuestItem.id !== itemId) {
      this.stopFactionMessageScheduler();
    }

    // Определяем источник информации на основе предмета
    let infoSource = '';
    switch (itemId) {
      case 'laptop':
        infoSource = 'Свободный интернет - доступ к глобальной сети и свежим новостям';
        break;
      case 'gps':
        infoSource = 'GPS-навигатор - координаты повстанцев и скрытые локации';
        break;
      case 'radio':
        infoSource = 'Радио - частота штаба с официальными сообщениями';
        break;
      case 'phone':
        infoSource = 'Телефон - прослушивание переговоров мародеров';
        break;
      case 'transmitter':
        infoSource = 'Передатчик - доступ к таинственным каналам связи';
        break;
      case 'map':
        infoSource = 'Карта - навигация и разведка территорий';
        break;
      default:
        infoSource = 'Неизвестный источник информации';
    }

    // Получаем количество предмета из инвентаря (предмет еще не удален)
    let itemQuantity = 1;
    const inventoryItem = this.bunkerInventory.find(item => item && item.id === itemId);
    if (inventoryItem) {
      itemQuantity = inventoryItem.quantity;
    }

    console.log(`[setActiveQuestItem] Устанавливаю предмет ${itemId} (${itemData.name}) x${itemQuantity} как активный`);
    this.activeQuestItem = {
      id: itemId,
      name: itemData.name,
      spritePath: itemData.spritePath,
      infoSource: infoSource,
      quantity: itemQuantity
    };

    // Обновляем UI модального окна инвентаря
    this.updateActiveQuestItemUI();

    // Обновляем блок источника информации в правом нижнем углу
    if (typeof (window as any).updateActiveInfoSource === 'function') {
      (window as any).updateActiveInfoSource(this.activeQuestItem);
    }

    // Запускаем планировщик сообщений фракций
    this.startFactionMessageScheduler(itemId);

    console.log(`[setActiveQuestItem] КОНЕЦ: предмет ${itemId} успешно установлен в слот источника`);
    this.logInventoryState("ПОСЛЕ setActiveQuestItem");
    this.logActiveQuestItem("ПОСЛЕ setActiveQuestItem");

    return true;
  }

  public getActiveQuestItem(): { id: string; name: string; spritePath: string; infoSource: string; quantity: number } | null {
    return this.activeQuestItem;
  }

  public clearActiveQuestItem(): void {
    console.log(`[clearActiveQuestItem] НАЧАЛО: очистка слота источника`);
    this.logInventoryState("ДО clearActiveQuestItem");
    this.logActiveQuestItem("ДО clearActiveQuestItem");

    this.activeQuestItem = null;
    this.updateActiveQuestItemUI();

    // Скрываем блок источника информации в правом нижнем углу
    if (typeof (window as any).hideInfoSourcePanel === 'function') {
      (window as any).hideInfoSourcePanel();
    }

    console.log(`[clearActiveQuestItem] КОНЕЦ: слот источника очищен`);
    this.logInventoryState("ПОСЛЕ clearActiveQuestItem");
    this.logActiveQuestItem("ПОСЛЕ clearActiveQuestItem");
  }

  private updateActiveQuestItemUI(): void {
    // Обновляем UI через глобальные функции, если модальное окно открыто
    // Проверяем, что функция доступна перед вызовом
    if (typeof (window as any).updateActiveQuestSlot === 'function') {
      try {
        // Проверяем, что модальное окно инвентаря открыто, чтобы не вызывать лишние обновления
        const inventoryModal = document.getElementById('inventory-modal');
        if (inventoryModal && inventoryModal.style.display !== 'none') {
          (window as any).updateActiveQuestSlot(this.activeQuestItem);

          // Принудительно обновляем инвентарь после изменения активного предмета
          // Это критично для поддержания синхронизации между UI и GameScene
          setTimeout(() => {
            if (typeof (window as any).populateInventoryModal === 'function' &&
                typeof (window as any).populateInventoryModalLocked !== 'undefined') {
              if (!(window as any).populateInventoryModalLocked) {
                (window as any).populateInventoryModalLocked = true;
                (window as any).populateInventoryModal(this.bunkerInventory, this.inventoryRows);
                setTimeout(() => { (window as any).populateInventoryModalLocked = false; }, 100);
              }
            }
          }, 50);
        }
      } catch (error) {
        // Игнорируем ошибки при обновлении UI, чтобы не ломать игру
      }
    }
  }

  // Public method to get item by ID from the database
  public getItemById(id: string): Item | undefined {
    
    // Сначала ищем в основной базе предметов
    let result = ITEMS_DATABASE.find(item => item.id === id);
    
    // Если не найден, ищем в побочных предметах
    if (!result) {
      try {
        const sidequestManager = getSidequestItemManager(this.sessionSeed)
        const sidequestItem = sidequestManager.getItemById(id)
        
        if (sidequestItem) {
          // Преобразуем SidequestItem в Item для совместимости
          result = {
            id: sidequestItem.id,
            name: sidequestItem.name,
            spritePath: sidequestItem.spritePath,
            description: sidequestItem.description,
            price: sidequestItem.price,
            category: 'sidequest' as any,
            // Дополнительные поля для UI
            shortDescription: sidequestItem.description,
            fullDescription: sidequestItem.fullDescription,
            typeDisplay: 'информационный',
            iconPath: sidequestItem.spritePath,
            stackable: false
          }

        }
      } catch (error) {
        console.error('[getItemById] Ошибка поиска в побочных предметах:', error)
      }
    }
    

    return result;
  }

  // Public method to update inventory rows based on storage room count
  public updateInventoryRows(storageCount: number): void {
    // Каждый склад дает +1 ряд инвентаря, минимум 1 ряд
    const newRows = Math.max(1, storageCount + 1);

    if (newRows !== this.inventoryRows) {
      this.inventoryRows = newRows;

      // Re-initialize inventory with new row count
      this.initializeModals();

      // Если модальное окно инвентаря открыто, обновляем его немедленно
      const inventoryModal = document.getElementById('inventory-modal');
      if (inventoryModal && inventoryModal.style.display !== 'none') {
        this.time.delayedCall(100, () => {
          if (typeof window.populateInventoryModal === 'function') {
            try {
              const defaultInventory = this.getDefaultInventory();
              // Используем только существующие предметы, без заглушек
              const existingItems = defaultInventory.filter(item => {
                const itemData = this.getItemById(item.id);
                return itemData !== undefined;
              });
              window.populateInventoryModal(existingItems, this.inventoryRows);
            } catch (error) {
              // Игнорируем ошибки обновления UI
            }
          }
        });
      }

      // Также обновляем глобальное состояние инвентаря с задержкой
      this.time.delayedCall(200, () => {
        if (typeof window.populateInventoryModal === 'function') {
          const inventoryModal = document.getElementById('inventory-modal');
          if (inventoryModal && inventoryModal.style.display !== 'none') {
            try {
              const defaultInventory = this.getDefaultInventory();
              // Используем только существующие предметы, без заглушек
              const existingItems = defaultInventory.filter(item => {
                const itemData = this.getItemById(item.id);
                return itemData !== undefined;
              });
              window.populateInventoryModal(existingItems, this.inventoryRows);
            } catch (error) {
              // Игнорируем ошибки обновления UI
            }
          }
        }
      });

      // Принудительно обновляем интерфейс инвентаря если модальное окно открыто
      const inventoryModal2 = document.getElementById('inventory-modal');
      if (inventoryModal2 && inventoryModal2.style.display !== 'none' && typeof window.populateInventoryModal === 'function') {
        this.time.delayedCall(100, () => {
          if (typeof window.populateInventoryModal === 'function') {
            try {
              const defaultInventory = this.getDefaultInventory();
              // Используем только существующие предметы, без заглушек
              const existingItems = defaultInventory.filter(item => {
                const itemData = this.getItemById(item.id);
                return itemData !== undefined;
              });
              window.populateInventoryModal(existingItems, this.inventoryRows);
            } catch (error) {
              // Игнорируем ошибки обновления UI
            }
          }
        });
      }
    } else {
      // Даже если нет изменений, обновим интерфейс если модальное окно открыто
      const inventoryModal = document.getElementById('inventory-modal');
      if (inventoryModal && inventoryModal.style.display !== 'none') {
        this.time.delayedCall(100, () => {
          if (typeof window.populateInventoryModal === 'function') {
            try {
              const defaultInventory = this.getDefaultInventory();
              // Используем только существующие предметы, без заглушек
              const existingItems = defaultInventory.filter(item => {
                const itemData = this.getItemById(item.id);
                return itemData !== undefined;
              });
              window.populateInventoryModal(existingItems, this.inventoryRows);
            } catch (error) {
              // Игнорируем ошибки обновления UI
            }
          }
        });
      }
    }
  }

  public openRoomSelection(): void {
    if (window.populateRoomSelectionModal && window.openModal) {
      // Передаем this (GameScene) в populateRoomSelectionModal
      window.populateRoomSelectionModal(this);
      window.openModal('room-selection-modal');
    }
  }

  public getResidentById(id: number): any {
    // First check bunkerResidents
    const resident = this.bunkerResidents.find((r: any) => r.id === id);
    if (resident) {
      return {
        id: resident.id,
        name: resident.name,
        age: resident.age,
        gender: resident.gender,
        profession: resident.profession,
        status: resident.status || 'Отдыхает',
        hunger: resident.hunger || 100,
        thirst: resident.thirst || 100,
        energy: resident.energy || 100,
        health: resident.health || 100,
        skills: resident.skills || [],
        itemsText: resident.itemsText || 'Нет предметов',
        admittedAt: resident.admittedAt,
        patient: resident.patient || false,
        isEnemy: false
      };
    }

    // If not found in bunkerResidents, check bunkerView agents for real-time health
    if (this.simpleBunker && typeof this.simpleBunker.getResidentAgentById === 'function') {
      const agent = this.simpleBunker.getResidentAgentById(id);
      if (agent) {
        console.log('[GameScene] Found agent in bunkerView with health:', agent.health);
        return {
          id: agent.id,
          name: agent.name || 'Неизвестен',
          age: agent.age || 25,
          gender: agent.gender || 'М',
          profession: agent.profession || 'неизвестно',
          status: agent.status || 'Отдыхает',
          hunger: agent.hunger || 100,
          thirst: agent.thirst || 100,
          energy: agent.energy || 100,
          health: agent.health || 100,
          skills: agent.skills || [],
          itemsText: agent.itemsText || 'Нет предметов',
          admittedAt: agent.admittedAt || 1,
          patient: agent.patient || false,
          isEnemy: false
        };
      }
    }


    return null;
  }

  public onResidentPositionChanged(residentId: number, roomIndex: number, x: number, y: number): void {
    const resident = this.bunkerResidents.find((r: any) => r.id === residentId);
    if (resident) {
      // Здесь можно добавить дополнительную логику для обработки перемещения жителя
      // Например, обновление статистики или проверку специальных условий
    }
  }

  // Cleanup - called when scene is destroyed
  onDestroy(): void {
    if (this.uiUpdateInterval && typeof this.uiUpdateInterval.remove === 'function') {
      this.uiUpdateInterval.remove(false);
    }

    if (typeof window.showGameUI === 'function') {
      window.showGameUI(false);
    }
  }
}



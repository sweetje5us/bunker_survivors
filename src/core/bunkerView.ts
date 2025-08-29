import Phaser from 'phaser'
import { ensureCharacterAnimations, pickSkinForGender, pickClothingSetForGender, pickHairForGender, ensureSpecialistAnimations, getSpecialistSpriteKey, isSpecialistSprite } from './characters'

// Объявление типов для window
declare global {
  interface Window {
    openRoomSelection?: () => void;
  }
}

// Интерфейс для состояний комнаты
export interface RoomState {
  // Флаг доступности (по умолчанию true, нельзя изменить для "Вход")
  accessible: boolean
  // Флаг возможности разрушения (по умолчанию true кроме "Вход", нельзя изменить для "Вход")
  destructible: boolean
  // Флаг энергии (по умолчанию true, нельзя изменить для "Вход")
  powered: boolean
  // Флаг света (по умолчанию true, нельзя изменить для "Вход")
  lit: boolean
  // Флаг пожара для особых событий (по умолчанию false, нельзя изменить для "Вход")
  onFire: boolean
  // Флаг потопа для особых событий (по умолчанию false, нельзя изменить для "Вход")
  flooded: boolean
  // Флаг опасности (по умолчанию false, можно изменить для всех)
  dangerous: boolean
  // Флаг возможности работы (по умолчанию true, нельзя изменить для "Вход", зависит от других флагов)
  workable: boolean
  // Состояния событий (по умолчанию пустое, нельзя изменить для "Вход")
  eventStates: Set<string>
}

export class SimpleBunkerView {
  private scene: Phaser.Scene
  private parent: Phaser.GameObjects.Container
  private root: Phaser.GameObjects.Container
  private content: Phaser.GameObjects.Container
  private overlay: Phaser.GameObjects.Container
  private darknessContainer: Phaser.GameObjects.Container
  private panel: Phaser.GameObjects.Graphics
  private labels: Phaser.GameObjects.Text[] = []
  private detailsPanels: Map<number, Phaser.GameObjects.Container> = new Map()
  private lastFocusedIndex: number | null = null
  private viewport: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(0, 0, 1, 1)
  private roomRects: Phaser.Geom.Rectangle[] = []
  private roomNames: string[] = []
  private roomStates: Map<number, RoomState> = new Map()
  private roomDarknessOverlays: Map<number, Phaser.GameObjects.Rectangle> = new Map()
  private elevatorRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(0, 0, 1, 1)
  private extraElevators: Phaser.Geom.Rectangle[] = []
  private mode: 'overview' | 'focus' = 'overview'
  private focusedIndex: number | null = null
  private isPanning = false
  private recentlyFinishedPanning = false
  private panStart?: Phaser.Math.Vector2
  private contentStart?: Phaser.Math.Vector2
  
  // Фиксированные масштабы для предотвращения автоматического изменения
  private fixedFocusScale: number = 1
  private fixedOverviewScale: number = 0.5
  private readonly overviewMinScale = 0.5
  private debugAnim: boolean = false
  private lastInsanityCheck: number = 0
  private lastStuckCheck: number = 0
  
  // Режимы редактирования
  private isAddingRoom = false
  private isRemovingRoom = false
  private selectedRoomType: string | null = null
  private roomHitAreas: Phaser.GameObjects.Rectangle[] = []
  private originalRoomColors: Map<number, number> = new Map() // Храним оригинальные цвета рамок
  private addButton?: Phaser.GameObjects.Text
  private removeButton?: Phaser.GameObjects.Text
  private peopleButton?: Phaser.GameObjects.Text
  private currentDialog?: Phaser.GameObjects.Container

  // Drag n Drop для жителей
  private draggedResident: any = null
  private dragOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2()
  private isDraggingResident = false
  private dragStartTime = 0
  private lastDragEndTime: Map<number, number> = new Map() // Время последнего перетаскивания по ID жителя
  private residentsBeingDragged: Set<number> = new Set() // ID жителей, которые сейчас перетаскиваются
  private availableRoomTypes = [
    // Базовые типы со старта
    'Вход',
    'Спальня',
    'Столовая',
    'Туалет',
    // Новые типы
    'Госпиталь',
    'Кухня',
    'Склад',
    'Лифт',
    'Оружейная',
    'Серверная',
    'Рынок',
    'Классная комната'
  ]
  private residentAgents: Array<{
    id?: number;
    rect: Phaser.GameObjects.Rectangle;
    sprite?: Phaser.GameObjects.Sprite;
    shirt?: Phaser.GameObjects.Sprite;
    pants?: Phaser.GameObjects.Sprite;
    footwear?: Phaser.GameObjects.Sprite;
    hair?: Phaser.GameObjects.Sprite;
    target?: Phaser.Math.Vector2;
    roomIndex?: number;
    sleeping?: boolean;
    path?: Phaser.Math.Vector2[];
    dwellUntil?: number;
    goingToRest?: boolean;
    skinKey?: string;
    // Работа/навыки
    profession?: string;
    skills?: Array<{ text: string; positive: boolean }>;
    workAtNight?: boolean; // навык "сова"
    isLazyToday?: boolean;
    working?: boolean;
    away?: boolean; // ушел на поверхность (разведчик/охотник)
    intention?: 'work' | 'eat' | 'drink' | 'rest' | 'sleep' | 'hospital' | 'wander';
    workRoomIndex?: number;
    stayInRoomName?: string;
    targetRoomIndex?: number; // Целевая комната для движения
    settled?: boolean;
    assignedRoomIndex?: number;
    assignedSlotIndex?: number;
    assignedRole?: 'chemist' | 'scientist';
    assignedUnlimited?: boolean;
    schedType?: 'normal' | 'owl' | 'insomnia';
    insomniaOffsetHour?: number;
    scheduleState?: 'sleep' | 'work' | 'rest';
    // FX
    sleepFx?: Phaser.GameObjects.Text;
    sleepFxTween?: Phaser.Tweens.Tween;
    workFx?: Phaser.GameObjects.Text;
    workFxTween?: Phaser.Tweens.Tween;
    workPulseTween?: Phaser.Tweens.Tween;
    animLock?: 'work' | 'sleep' | 'walk' | 'idle' | 'attack' | 'hurt' | 'dead' | null;
    sleepPulseTween?: Phaser.Tweens.Tween;
    // Debug
    debugText?: Phaser.GameObjects.Text;
    lastAnimLock?: 'work' | 'sleep' | 'walk' | 'idle' | null;
    lastDebugTs?: number;
    // Enemy fields
    isEnemy?: boolean;
    enemyType?: string;
    marauderKind?: number;
    zombieKind?: string;
    mutantKind?: number;
    // Enemy AI
    enemyTargetId?: number;
    health?: number;
    lastAttackTime?: number;
    lastTargetReconsiderTime?: number; // Время последнего пересмотра цели
    healthBar?: Phaser.GameObjects.Container;
    
    // Combat system for residents
    attackDamage?: number;
    attackRange?: number;
    attackCooldown?: number;
    isAggressive?: boolean; // Для солдат, охотников, разведчиков, героев
    isCoward?: boolean; // Навык "трус"
    combatTarget?: number; // ID врага для атаки
    lastResidentAttackTime?: number;
  }> = []

  private roomOccupancy: Map<number, { chemistId?: number; scientistId?: number; usedSlots: Set<number>; workers?: Record<string, number> }> = new Map()
  private sleepOccupancy: Map<number, Set<number>> = new Map()

  public getRootContainer(): Phaser.GameObjects.Container {
    return this.root
  }

  // Public method to get resident agent by ID for HTML UI integration
  public getResidentAgentById(id: number): any {
    const agent = this.residentAgents.find(a => a.id === id);
    return agent || null;
  }

  /**
   * Удаляет агента жителя по ID
   * Вызывается при смерти жителя для синхронизации с GameScene
   */
  public removeResidentAgent(id: number): void {
    console.log(`[SimpleBunkerView] removeResidentAgent вызван для ID: ${id}`);
    
    const agentIndex = this.residentAgents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      console.log(`[SimpleBunkerView] Агент жителя с ID ${id} не найден`);
      return;
    }

    const agent = this.residentAgents[agentIndex];
    console.log(`[SimpleBunkerView] Удаляем агента жителя: ${agent.profession || 'неизвестно'} (ID: ${id})`);

    // Удаляем все спрайты агента
    if (agent.sprite) {
      console.log(`[SimpleBunkerView] Уничтожаем спрайт агента ${id}`);
      agent.sprite.destroy();
    }
    if (agent.shirt) {
      agent.shirt.destroy();
    }
    if (agent.pants) {
      agent.pants.destroy();
    }
    if (agent.footwear) {
      agent.footwear.destroy();
    }
    if (agent.hair) {
      agent.hair.destroy();
    }
    if (agent.rect) {
      agent.rect.destroy();
    }

    // Удаляем все эффекты
    if (agent.sleepFx) {
      agent.sleepFx.destroy();
    }
    if (agent.workFx) {
      agent.workFx.destroy();
    }
    if (agent.healthBar) {
      agent.healthBar.destroy();
    }

    // Удаляем из массива
    this.residentAgents.splice(agentIndex, 1);

    console.log(`[SimpleBunkerView] Агент жителя ${id} успешно удален. Осталось агентов: ${this.residentAgents.length}`);
  }

  /**
   * Удаляет агента врага по ID
   * Вызывается при смерти врага для синхронизации с GameScene
   */
  public removeEnemyAgent(id: number): void {
    const agentIndex = this.residentAgents.findIndex(a => a.id === id && a.isEnemy);
    if (agentIndex === -1) {
      console.log(`[SimpleBunkerView] Агент врага с ID ${id} не найден`);
      return;
    }

    const agent = this.residentAgents[agentIndex];
    console.log(`[SimpleBunkerView] Удаляем агента врага: ${agent.id} (ID: ${id})`);

    // Удаляем все спрайты агента
    if (agent.sprite) {
      agent.sprite.destroy();
    }
    if (agent.shirt) {
      agent.shirt.destroy();
    }
    if (agent.pants) {
      agent.pants.destroy();
    }
    if (agent.footwear) {
      agent.footwear.destroy();
    }
    if (agent.hair) {
      agent.hair.destroy();
    }
    if (agent.rect) {
      agent.rect.destroy();
    }

    // Удаляем все эффекты
    if (agent.sleepFx) {
      agent.sleepFx.destroy();
    }
    if (agent.workFx) {
      agent.workFx.destroy();
    }
    if (agent.healthBar) {
      agent.healthBar.destroy();
    }

    // Удаляем из массива
    this.residentAgents.splice(agentIndex, 1);

    console.log(`[SimpleBunkerView] Агент врага ${id} успешно удален. Осталось агентов: ${this.residentAgents.length}`);
  }

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.scene = scene
    this.parent = parent
    this.root = scene.add.container(0, 0)
    this.content = scene.add.container(0, 0)
    this.darknessContainer = scene.add.container(0, 0)
    this.panel = scene.add.graphics()
    this.overlay = scene.add.container(0, 0)

    // Добавляем обработчик для отслеживания готовности данных о способностях
    this.setupAbilityDataListener()
    const label = scene.add.text(0, 0, 'Entrance', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '12px',
      color: '#e0e0e0'
    }).setOrigin(0, 0)
    this.labels = [label]
    this.content.add([this.panel])
    this.root.add([this.content, this.darknessContainer, this.overlay])
    this.parent.add(this.root)
    this.root.setDepth(1)
    this.content.setDepth(10)        // персонажи и фон комнат
    this.darknessContainer.setDepth(50)  // затемнение поверх персонажей
    this.overlay.setDepth(100)       // UI элементы поверх всего
    
    // Создаём случайную структуру бункера
    this.generateRandomBunkerLayout()
    


    // Interactions: toggle zoom on click, pan in overview
    this.root.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains)
    
    // Для мобильного: включаем поддержку touch событий
    this.scene.input.addPointer(2) // Добавляем дополнительные указатели для мультитач

    // Используем события на document уровне для гарантированного перехвата
    this.setupDocumentEvents()
    
    // Для мобильного: улучшаем обработку touch событий
    this.scene.input.setDefaultCursor('grab')

    this.root.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Проверяем, не кликаем ли мы по HTML UI элементам
      const target = p.event.target as HTMLElement
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' ||
                     target.closest('.resource-item') || target.closest('.btn') ||
                     target.closest('[onclick]'))) {
        console.log('[bunkerView] Click on HTML element, ignoring pan')
        return
      }

      // Начинаем перемещение только в режиме overview
      // Подготавливаем к возможному перемещению или клику
      this.isPanning = false // Начинаем с false, активируем только при движении в режиме overview
      ;(p as any)._dragged = false
      this.panStart = new Phaser.Math.Vector2(p.x, p.y)
      this.contentStart = new Phaser.Math.Vector2(this.content.x, this.content.y)

    })

    this.root.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.panStart || !this.contentStart) return
      
      const dx = p.x - this.panStart.x
      const dy = p.y - this.panStart.y
      
      // Отмечаем, что было движение, если расстояние больше порога
      // Для мобильного используем больший порог
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const panThreshold = isMobile ? 8 : 4 // Больший порог для мобильного
      
      if (Math.abs(dx) + Math.abs(dy) > panThreshold) {
        if (!this.isPanning) {
          this.isPanning = true
          this.disableHTMLEvents() // Отключаем HTML overlay только при реальном движении

        }
        
        // Выполняем перемещение
        (p as any)._dragged = true
        
        const newX = this.contentStart.x + dx
        const newY = this.contentStart.y + dy
        this.content.setPosition(newX, newY)
        // Синхронизируем затемнение при панорамировании
        this.darknessContainer.setPosition(newX, newY)
        // Перерисуем overlay, чтобы шапки/кнопки следовали за комнатами при панорамировании
        this.updateLabels()
      }
    })
    this.root.on('pointerup', (p: Phaser.Input.Pointer) => {
      // Сохраняем позицию контента до восстановления HTML
      const contentX = this.content.x
      const contentY = this.content.y

      // Восстанавливаем pointer-events на HTML overlay только если было перемещение
      if (this.isPanning) {
        this.enableHTMLEvents()
      }

      // Восстанавливаем позицию контента после восстановления HTML
      if (this.content.x !== contentX || this.content.y !== contentY) {
        console.log('[bunkerView] Content position changed during pointerup, restoring:', contentX, contentY)
        this.content.setPosition(contentX, contentY)
        this.darknessContainer.setPosition(contentX, contentY)
      }

      // Проверяем, не кликнули ли мы по HTML UI элементам
      const target = p.event.target as HTMLElement
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' ||
                     target.closest('.resource-item') || target.closest('.btn') ||
                     target.closest('[onclick]'))) {
        console.log('[bunkerView] Click on HTML element, ignoring room click')
        this.isPanning = false
        return
      }

      // Определяем тип события: если не было перемещения, то это клик
      if (!this.isPanning) {
        // Определяем, в какую комнату кликнули (в локальных координатах content)
        const m = this.content.getWorldTransformMatrix()
        const tmp = new Phaser.Math.Vector2()
        m.applyInverse(p.x, p.y, tmp)
        const lx = tmp.x
        const ly = tmp.y

        let hitIndex: number | null = null
        // Проверяем клик только если не в режиме добавления или удаления комнат
        if (!this.isAddingRoom && !this.isRemovingRoom) {
          for (let i = 0; i < this.roomRects.length; i++) {
            const rr = this.roomRects[i]
            if (Phaser.Geom.Rectangle.Contains(rr, lx, ly)) {
              hitIndex = i
              break
            }
          }
        }

        if (hitIndex !== null) {
          if (this.mode === 'overview') {
            this.focusedIndex = hitIndex
            this.mode = 'focus'
          } else {
            if (this.focusedIndex === hitIndex) {
              this.mode = 'overview'
              this.focusedIndex = null
            } else {
              this.focusedIndex = hitIndex
              this.mode = 'focus'
            }
          }
        } else {
          if (this.mode === 'focus') {
            this.mode = 'overview'
            this.focusedIndex = null
          }
        }

        this.layout(this.viewport)
      }
      
      // Сбрасываем флаги только если не было перемещения
      if (!this.isPanning) {
        this.panStart = undefined
        this.contentStart = undefined
      }
      this.isPanning = false
    })
    this.scene.events.on('update', this.updateResidents, this)
  }

  // Вызывается раз в игровой час из сцены
  public onHourTick(hour: number, isDay: boolean): void {
    // Расписание: только для профессий ученый, химик, безработный, бездомный
    const isSleepRoom = (idx: number) => this.roomNames[idx] === 'Спальня'
    const findRoomIndex = (name: string): number | null => {
      for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i] === name) return i
      return null
    }
    for (const agent of this.residentAgents) {
      // Безумные жители не подчиняются обычному расписанию
      if ((agent as any).intent === 'hostile' && agent.isAggressive) continue

      const prof = (agent.profession || '').toLowerCase()
      if (!['ученый', 'химик', 'безработный', 'бездомный', 'сантехник', 'повар', 'инженер', 'солдат', 'доктор', 'врач', 'охотник', 'разведчик'].includes(prof)) continue
      const type = agent.schedType || 'normal'
      let desired: 'sleep' | 'work' | 'rest' = 'rest'
      const workerProf = ['ученый','химик','сантехник','повар','инженер','солдат','доктор','врач','охотник','разведчик'].includes(prof)
      const surfaceProf = prof === 'охотник' || prof === 'разведчик'
      if (type === 'normal') {
        if (hour >= 0 && hour <= 7) desired = 'sleep'
        else if (hour >= 9 && hour <= 18) desired = workerProf ? 'work' : 'rest'
        else desired = 'rest'
      } else if (type === 'owl') {
        if (hour >= 8 && hour <= 21) desired = 'sleep'
        else if (hour >= 0 && hour <= 6) desired = workerProf ? 'work' : 'rest'
        else desired = 'rest'
        } else {
        // insomnia: 8ч work, 4ч sleep, 12ч rest, циклом, со случайным сдвигом
        const off = agent.insomniaOffsetHour || 0
        const t = (hour - off + 24) % 24
        if (t < 8) desired = workerProf ? 'work' : 'rest'
        else if (t < 12) desired = 'sleep'
        else desired = 'rest'
      }
      if (agent.scheduleState === desired) continue
      agent.scheduleState = desired
      // Переход в состояние
      if (desired === 'sleep') {
        // Освобождаем лабораторную бронь
        this.releaseRoomAssignment(agent)
        // Выбираем ближайшую комнату отдыха с доступным слотом (максимум 4 на комнату)
        const restIdxs: number[] = []
        for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i] === 'Спальня') restIdxs.push(i)
        restIdxs.sort((a, b) => {
          const ra = this.roomRects[a], rb = this.roomRects[b]
          const dax = (ra.x + ra.width / 2) - agent.rect.x
          const day = (ra.y + ra.height / 2) - agent.rect.y
          const dbx = (rb.x + rb.width / 2) - agent.rect.x
          const dby = (rb.y + rb.height / 2) - agent.rect.y
          return (dax * dax + day * day) - (dbx * dbx + dby * dby)
        })
        for (const idx of restIdxs) {
          const slots = this.ensureSleepEntry(idx)
          if (slots.size >= 4) continue
          // точки для сна — первые 4
          const pts = this.getRoomStopPoints(idx).slice(0, 4)
          let chosen = -1
          for (let s = 0; s < pts.length; s++) { if (!slots.has(s)) { chosen = s; break } }
          if (chosen < 0) continue
          const target = pts[chosen]
          this.buildPathTo(agent, idx, target, false)
          ;(agent as any).sleepAssignedRoomIndex = idx
          ;(agent as any).sleepAssignedSlotIndex = chosen
          slots.add(chosen)
          agent.sleeping = true
          agent.dwellUntil = Number.MAX_SAFE_INTEGER
          break
        }
      } else if (desired === 'work') {
        if (prof === 'ученый' || prof === 'химик') {
          const role: 'chemist' | 'scientist' = (prof === 'химик') ? 'chemist' : 'scientist'
          const ok = this.tryAssignAndPathToLab(agent, role)
          if (ok) { agent.dwellUntil = Number.MAX_SAFE_INTEGER; agent.settled = false }
        } else if (['сантехник','повар','инженер','солдат','доктор','врач'].includes(prof)) {
          const ok = this.tryAssignAndPathToWorkRoom(agent)
          if (ok) { agent.dwellUntil = Number.MAX_SAFE_INTEGER }
        } else if (prof === 'охотник' || prof === 'разведчик') {
          // Идут к входу, затем исчезают (ушли на поверхность)
          const entranceIdx = this.roomNames.indexOf('Вход')
          if (entranceIdx >= 0) {
            const r = this.roomRects[entranceIdx]
            const margin = 4
            const dst = new Phaser.Math.Vector2(r.x + r.width / 2, r.y + r.height - margin)
            this.buildPathTo(agent, entranceIdx, dst, false)
            agent.dwellUntil = Number.MAX_SAFE_INTEGER
            ;(agent as any)._surfacePending = true
          }
        }
      } else {
        // rest — освободить бронь, разрешить блуждание
        this.releaseRoomAssignment(agent)
        agent.sleeping = false
        // освободить слот сна, если был
        if ((agent as any).sleepAssignedRoomIndex != null && (agent as any).sleepAssignedSlotIndex != null) {
          const ridx = (agent as any).sleepAssignedRoomIndex as number
          const sidx = (agent as any).sleepAssignedSlotIndex as number
          const slots = this.ensureSleepEntry(ridx)
          slots.delete(sidx)
          ;(agent as any).sleepAssignedRoomIndex = undefined
          ;(agent as any).sleepAssignedSlotIndex = undefined
        }
        agent.dwellUntil = undefined
      }
      // Пушим статус немедленно после смены расписания
      this.pushAgentStatus(agent)
    }
    
    // Дополнительная проверка: жители должны замечать врагов даже после смены режима
    this.checkResidentsCombatAwareness()
    
    // Каждый час проверяем боевой режим для жителей и врагов
    this.checkCombatStatus()
    
    // Дополнительная проверка: жители должны замечать врагов даже после смены режима
    this.checkResidentsCombatAwareness()
  }
  
  /**
   * Проверяет боевой статус всех агентов каждый час
   */
  private checkCombatStatus(): void {
    console.log(`[bunkerView] Проверка боевого статуса агентов...`)
    
    // Проверяем, есть ли вообще враги в бункере
    const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
    
    // Проверяем жителей в боевом режиме
    for (const agent of this.residentAgents) {
      if (!agent || agent.isEnemy || (agent.isCoward && !((agent as any).intent === 'hostile'))) continue

      // Пропускаем мертвых жителей (animLock === 'dead')
      if (agent.animLock === 'dead') {
        console.log(`[checkCombatStatus] Пропускаем мертвого жителя ${agent.profession} (ID: ${agent.id}) - animLock=dead`)
        continue
      }

      // Если житель в боевом режиме, проверяем его цель
      if (agent.animLock === 'attack' || (agent as any).combatTarget || (agent as any).enemyTargetId) {
        let targetStillValid = false

        // Проверяем, есть ли цель среди врагов (обычное поведение)
        const targetEnemy = this.residentAgents.find(a => 
          a && a.isEnemy && a.id === (agent as any).combatTarget && (a.health || 0) > 0
        )
        
        if (targetEnemy) {
          targetStillValid = true
        } else if ((agent as any).intent === 'hostile' && agent.isAggressive && !agent.isEnemy) {
          // Безумный житель - проверяем цель среди жителей
          const targetResident = this.residentAgents.find(a =>
            a && !a.isEnemy && a.id === (agent as any).enemyTargetId && (a.health || 0) > 0
          )

          if (targetResident) {
            targetStillValid = true
          }
        }

        if (!targetStillValid) {
          console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) освобожден от боевого режима - цель мертва или недоступна`)
          
          // Очищаем боевой режим
          ;(agent as any).combatTarget = undefined
          ;(agent as any).enemyTargetId = undefined

          // Определяем, что делать дальше в зависимости от типа жителя
          if ((agent as any).intent === 'hostile' && agent.isAggressive) {
            // Безумный житель - ищем новую цель среди жителей (исключаем мертвых)
            const otherResidents = this.residentAgents.filter(a =>
              a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0 && a.animLock !== 'dead'
            )

            if (otherResidents.length > 0) {
              // Выбираем случайного жителя как новую цель
              const newTarget = otherResidents[Math.floor(Math.random() * otherResidents.length)]
              ;(agent as any).enemyTargetId = newTarget.id
              console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) переключается на новую цель: ${newTarget.profession} (ID: ${newTarget.id})`)
              // Не сбрасываем animLock - безумный житель остается в боевом режиме
            } else {
              // Нет других жителей - безумный житель успокаивается
              console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) успокаивается - нет целей`)
              agent.animLock = null
              agent.target = undefined
              agent.path = undefined
              agent.dwellUntil = undefined
              this.pickNewTarget(agent)
            }
          } else {
            // Обычный житель - возвращаем к нормальной жизни только если нет врагов
          if (enemies.length === 0) {
            console.log(`[bunkerView] Нет врагов в бункере - возвращаем жителя ${agent.profession} (ID: ${agent.id}) к работе`)
            
            // Сбрасываем все боевые состояния
            agent.animLock = null
            agent.target = undefined
            agent.path = undefined
            agent.dwellUntil = undefined
            
            // Возвращаем к работе или нормальной жизни
            if (agent.profession === 'солдат' || agent.profession === 'охотник' || agent.profession === 'разведчик') {
              // Агрессивные профессии идут к входу для патрулирования
              const entranceIdx = this.roomNames.indexOf('Вход')
              if (entranceIdx >= 0) {
                const r = this.roomRects[entranceIdx]
                const margin = 4
                const dst = new Phaser.Math.Vector2(r.x + r.width / 2, r.y + r.height - margin)
                this.buildPathTo(agent, entranceIdx, dst, false)
                agent.animLock = 'walk'
                console.log(`[bunkerView] ${agent.profession} (ID: ${agent.id}) идет к входу для патрулирования`)
              }
            } else if (agent.profession === 'химик' || agent.profession === 'ученый') {
              // Лабораторные работники возвращаются к работе
              console.log(`[bunkerView] Лабораторный работник ${agent.profession} (ID: ${agent.id}) возвращается к работе`)
              agent.animLock = 'idle'
              // Попытка назначить лабораторию
              const role = agent.profession === 'химик' ? 'chemist' : 'scientist'
              this.tryAssignAndPathToLab(agent, role)
            } else if (agent.profession === 'сантехник' || agent.profession === 'повар' || agent.profession === 'инженер') {
              // Рабочие возвращаются к работе
              console.log(`[bunkerView] Рабочий ${agent.profession} (ID: ${agent.id}) возвращается к работе`)
              agent.animLock = 'idle'
              // Попытка назначить рабочую комнату
              this.tryAssignAndPathToWorkRoom(agent)
            } else {
              // Обычные жители возвращаются к нормальной жизни
              console.log(`[bunkerView] Обычный житель ${agent.profession} (ID: ${agent.id}) возвращается к нормальной жизни`)
              agent.animLock = null
              this.pickNewTarget(agent)
            }
          } else {
            // Есть враги - житель должен искать новую цель
            console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) ищет новую цель - в бункере есть враги`)
            // Не меняем animLock - житель останется в боевом режиме
          }
          }
        }
      } else if ((agent as any).intent === 'hostile' && agent.isAggressive && !agent.isEnemy) {
        // Безумный житель не в боевом режиме - проверяем, нужно ли его активировать
        const otherResidents = this.residentAgents.filter(a =>
          a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0
        )

        if (otherResidents.length > 0) {
          // Есть потенциальные цели - переводим в боевой режим
          const target = otherResidents[Math.floor(Math.random() * otherResidents.length)]
          ;(agent as any).enemyTargetId = target.id
          agent.animLock = 'attack'
          console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) активирован и выбирает цель: ${target.profession} (ID: ${target.id})`)
        } else {
          // Нет других жителей - безумный житель успокаивается
          agent.animLock = null
          agent.target = undefined
          agent.path = undefined
          agent.dwellUntil = undefined
          this.pickNewTarget(agent)
          console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) успокаивается - нет целей`)
        }
      }
    }
    
    // Проверяем врагов без целей
    for (const agent of this.residentAgents) {
      if (!agent || !agent.isEnemy) continue
      
      // Если у врага нет цели или цель мертва, ищем новую
      if (!agent.enemyTargetId || !agent.target) {
        const livingResidents = this.residentAgents.filter(a => 
          a && !a.isEnemy && (a.health || 0) > 0 && !(a as any).away
        )
        
        if (livingResidents.length > 0) {
          // Выбираем ближайшего жителя как цель
          let bestTarget = livingResidents[0]
          let bestDistance = Number.POSITIVE_INFINITY

          for (const resident of livingResidents) {
            const distance = Phaser.Math.Distance.Between(
              agent.rect.x, agent.rect.y,
              resident.rect.x, resident.rect.y
            )
            if (distance < bestDistance) {
              bestDistance = distance
              bestTarget = resident
            }
          }

          console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) получает новую цель: ${bestTarget.profession} (ID: ${bestTarget.id})`)
          agent.enemyTargetId = bestTarget.id

          // ВАЖНО: Сбрасываем текущий путь и заставляем врага двигаться к новой цели
          agent.target = undefined
          agent.path = undefined
          agent.animLock = 'walk'

          // Определяем комнату цели
          let targetRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
              targetRoomIndex = i
              break
            }
          }

          // Определяем текущую комнату врага
          let enemyRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
              enemyRoomIndex = i
              break
            }
          }

          // Если комнаты разные, строим путь через buildPathTo
          if (targetRoomIndex >= 0 && enemyRoomIndex >= 0 && targetRoomIndex !== enemyRoomIndex) {
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) строит путь через комнаты: ${enemyRoomIndex} -> ${targetRoomIndex}`)
            this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
          } else {
            // В той же комнате - просто устанавливаем прямую цель
            agent.target = new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y)
          }
        } else {
          console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) не может найти живых целей, ищем выход из комнаты`)
          
          // Определяем текущую комнату врага
          let currentRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
              currentRoomIndex = i
              break
            }
          }
          
          if (currentRoomIndex >= 0 && currentRoomIndex !== 0) { // Не выходим из входа
            // Ищем ближайшую комнату для выхода (обычно вход или соседняя комната)
            let exitRoomIndex = 0 // По умолчанию идем к входу
            let bestDistance = Number.POSITIVE_INFINITY
            
            for (let i = 0; i < this.roomRects.length; i++) {
              if (i !== currentRoomIndex) {
                const room = this.roomRects[i]
                const roomCenterX = room.x + room.width / 2
                const roomCenterY = room.y + room.height - 4
                const distance = Math.hypot(agent.rect.x - roomCenterX, agent.rect.y - roomCenterY)
                
                if (distance < bestDistance) {
                  bestDistance = distance
                  exitRoomIndex = i
                }
              }
            }
            
            // Строим путь к выходу
            const exitRoom = this.roomRects[exitRoomIndex]
            const exitX = exitRoom.x + exitRoom.width / 2
            const exitY = exitRoom.y + exitRoom.height - 4
            
            this.buildPathTo(agent, exitRoomIndex, new Phaser.Math.Vector2(exitX, exitY), false)
            agent.animLock = 'walk'
            agent.target = undefined
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) идет к выходу в комнату ${exitRoomIndex}`)
          } else {
            // Враг остается в текущей комнате
            agent.animLock = 'idle'
          }
        }
      } else {
        // Проверяем, не мертва ли текущая цель
        const currentTarget = this.residentAgents.find(a => 
          a && !a.isEnemy && a.id === agent.enemyTargetId && (a.health || 0) > 0
        )
        
        if (!currentTarget) {
          console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) теряет цель - она мертва, ищем новую`)
          agent.enemyTargetId = undefined
          agent.target = undefined
          agent.path = []
          agent.animLock = 'idle'
        }
      }
    }
    
    // Дополнительная проверка: враги, которые застряли в комнатах без движения
    for (const agent of this.residentAgents) {
      if (!agent || !agent.isEnemy) continue
      
      // Если враг стоит на месте без цели и анимации
      if (agent.animLock === 'idle' && !agent.target && !agent.path) {
        const livingResidents = this.residentAgents.filter(a => 
          a && !a.isEnemy && (a.health || 0) > 0 && !(a as any).away
        )
        
        if (livingResidents.length > 0) {
          console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) застрял без цели, ищем новую`)
          
          // Выбираем ближайшего жителя как цель
          let bestTarget = livingResidents[0]
          let bestDistance = Number.POSITIVE_INFINITY
          
          for (const resident of livingResidents) {
            const distance = Phaser.Math.Distance.Between(
              agent.rect.x, agent.rect.y,
              resident.rect.x, resident.rect.y
            )
            if (distance < bestDistance) {
              bestDistance = distance
              bestTarget = resident
            }
          }
          
          agent.enemyTargetId = bestTarget.id
          
          // Строим путь к цели
          let targetRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
              targetRoomIndex = i
              break
            }
          }
          
          if (targetRoomIndex >= 0) {
            this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
            agent.animLock = 'walk'
            agent.target = undefined // Очищаем прямой target, чтобы враг использовал path
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) получил новую цель и идет к ней`)
          }
        } else {
          // Нет живых целей - ищем выход из комнаты
          console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) не может найти живых целей, ищем выход из комнаты`)
          
          // Определяем текущую комнату врага
          let currentRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
              currentRoomIndex = i
              break
            }
          }
          
          if (currentRoomIndex >= 0 && currentRoomIndex !== 0) { // Не выходим из входа
            // Ищем ближайшую комнату для выхода (обычно вход или соседняя комната)
            let exitRoomIndex = 0 // По умолчанию идем к входу
            let bestDistance = Number.POSITIVE_INFINITY
            
            for (let i = 0; i < this.roomRects.length; i++) {
              if (i !== currentRoomIndex) {
                const room = this.roomRects[i]
                const roomCenterX = room.x + room.width / 2
                const roomCenterY = room.y + room.height - 4
                const distance = Math.hypot(agent.rect.x - roomCenterX, agent.rect.y - roomCenterY)
                
                if (distance < bestDistance) {
                  bestDistance = distance
                  exitRoomIndex = i
                }
              }
            }
            
            // Строим путь к выходу
            const exitRoom = this.roomRects[exitRoomIndex]
            const exitX = exitRoom.x + exitRoom.width / 2
            const exitY = exitRoom.y + exitRoom.height - 4
            
            this.buildPathTo(agent, exitRoomIndex, new Phaser.Math.Vector2(exitX, exitY), false)
            agent.animLock = 'walk'
            agent.target = undefined
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) идет к выходу в комнату ${exitRoomIndex}`)
          }
        }
      }
    }
    
    // Дополнительная проверка: враги, которые застревают в движении
    for (const agent of this.residentAgents) {
      if (!agent || !agent.isEnemy) continue
      
      // Если враг в режиме ходьбы, но не имеет пути и цели
      if (agent.animLock === 'walk' && !agent.path && !agent.target) {
        console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в движении, восстанавливаем путь`)
        
        // Если есть цель, строим путь к ней заново
        if (agent.enemyTargetId) {
          const target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
          if (target && target.rect) {
            let targetRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                targetRoomIndex = i
                break
              }
            }
            
            if (targetRoomIndex >= 0) {
              this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
              agent.animLock = 'walk'
              agent.target = undefined
              console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) путь восстановлен к цели`)
            }
          }
        } else {
          // Нет цели - ищем новую
          const livingResidents = this.residentAgents.filter(a => 
            a && !a.isEnemy && (a.health || 0) > 0 && !(a as any).away
          )
          
          if (livingResidents.length > 0) {
            const bestTarget = livingResidents[0]
            agent.enemyTargetId = bestTarget.id
            
            let targetRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
                targetRoomIndex = i
                break
              }
            }
            
            if (targetRoomIndex >= 0) {
              this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
              agent.animLock = 'walk'
              agent.target = undefined
              console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) получил новую цель и восстановил путь`)
            }
          }
        }
      }
    }
    
    // Дополнительная проверка: враги, которые застревают в движении
    for (const agent of this.residentAgents) {
      if (!agent || !agent.isEnemy) continue
      
      // Если враг в режиме ходьбы, но не имеет пути и цели
      if (agent.animLock === 'walk' && !agent.path && !agent.target && agent.enemyTargetId) {
        console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в движении, восстанавливаем путь`)
        
        // Ищем цель заново
        const target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
        if (target && target.rect) {
          // Определяем комнату цели
          let targetRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
              targetRoomIndex = i
              break
            }
          }
          
          if (targetRoomIndex >= 0) {
            // Строим путь заново
            this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
            agent.animLock = 'walk'
            agent.target = undefined
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) путь восстановлен к цели`)
          }
        }
      }
    }
  }

  private computeWorkerYield(agent: any, base: number): number {
    let res = base
    const skills = agent.skills || []
    if (skills.some((s: any) => s.text === 'гений')) res += 3
    if (skills.some((s: any) => s.text === 'трудолюбивый')) res += Phaser.Math.Between(1, 3)
    if (skills.some((s: any) => s.text === 'выгоревший') && Math.random() < 0.3) res = 0
    if (skills.some((s: any) => s.text === 'слепой')) res = Math.floor(res * 0.5)
    if (skills.some((s: any) => s.text === 'группа инвалидности')) res = Math.floor(res * (2 / 3))
    if (skills.some((s: any) => s.text === 'неудачник') && Math.random() < 0.5) res = Math.max(0, res - 1)
    return Math.max(0, res)
  }

  private generateRandomBunkerLayout(): void {
    // Определяем 4 комнаты
    this.roomNames = ['Вход', 'Спальня', 'Столовая', 'Туалет']
    
    // Создаём прямоугольники для комнат
    this.roomRects = this.roomNames.map(() => new Phaser.Geom.Rectangle(0, 0, 1, 1))
    
    // Инициализируем состояния для всех комнат
    this.roomNames.forEach((roomName, index) => {
      this.roomStates.set(index, this.createDefaultRoomState(roomName, index))
      // Инициализируем визуальные эффекты для комнаты
      this.updateRoomVisuals(index)
    })
    
    // Пересчитываем распределение энергии после инициализации
    this.updatePowerDistribution()
    
    // Создаём массив для случайного порядка комнат (кроме входа, который всегда слева)
    const roomOrder = ['Вход', ...this.shuffleArray(['Спальня', 'Столовая', 'Туалет'])]
    
    // Генерируем случайную структуру
    this.generateRoomPositions(roomOrder)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private generateRoomPositions(roomOrder: string[]): void {
    const baseRoomWidth = 120
    const baseRoomHeight = 90
    
    // Вход всегда слева
    const entranceIndex = roomOrder.indexOf('Вход')
    this.roomRects[entranceIndex].setTo(0, 0, baseRoomWidth, baseRoomHeight)
    
    // Остальные комнаты
    const remainingRooms = roomOrder.filter(name => name !== 'Вход')
    
    // Генерируем правильную структуру примыкания
    this.generateConnectedLayout(remainingRooms, baseRoomWidth, baseRoomHeight)
  }

  private generateConnectedLayout(remainingRooms: string[], roomWidth: number, roomHeight: number): void {
    const gap = 4
    
    // Лифт всегда справа от входа, вертикальный (узкий)
    const elevatorWidth = Math.floor(roomWidth / 3)
    const elevatorHeight = roomHeight * 2
    this.elevatorRect.setTo(roomWidth + gap, 0, elevatorWidth, elevatorHeight)
    
    // Создаём сетку этажей и размещаем комнаты логично
    this.generateFloorBasedLayout(remainingRooms, roomWidth, roomHeight, gap, elevatorWidth)
  }

  private generateFloorBasedLayout(remainingRooms: string[], roomWidth: number, roomHeight: number, gap: number, elevatorWidth: number): void {
    // Позиция лифта
    const elevatorX = roomWidth + gap
    
    // Случайно выбираем одну из логичных планировок
    const layoutType = Math.floor(Math.random() * 3)
    
    switch (layoutType) {
      case 0:
        this.generateLinearLayout(remainingRooms, roomWidth, roomHeight, gap, elevatorX, elevatorWidth)
        break
      case 1:
        this.generateTwoFloorLayout(remainingRooms, roomWidth, roomHeight, gap, elevatorX, elevatorWidth)
        break
      case 2:
        this.generateExtendedLayout(remainingRooms, roomWidth, roomHeight, gap, elevatorX, elevatorWidth)
        break
    }
  }

  private generateLinearLayout(remainingRooms: string[], roomWidth: number, roomHeight: number, gap: number, elevatorX: number, elevatorWidth: number): void {
    // Планировка: [Вход] | [Комната1] [Комната2] [Туалет] (все на 1 этаже)
    // Туалет должен быть в конце - не сквозной
    const y = 0
    
    // Сортируем комнаты так, чтобы туалет был в конце
    const sortedRooms = this.sortRoomsForLayout(remainingRooms)
    
    for (let i = 0; i < sortedRooms.length; i++) {
      const roomName = sortedRooms[i]
      const roomIndex = this.roomNames.indexOf(roomName)
      const x = elevatorX + elevatorWidth + gap + i * (roomWidth + gap)
      
      this.roomRects[roomIndex].setTo(x, y, roomWidth, roomHeight)
    }
  }

  private generateTwoFloorLayout(remainingRooms: string[], roomWidth: number, roomHeight: number, gap: number, elevatorX: number, elevatorWidth: number): void {
    // Планировка: [Вход] | [Комната1]
    //                   | [Комната2] [Туалет] (туалет в конце)
    
    const sortedRooms = this.sortRoomsForLayout(remainingRooms)
    
    // Первая комната на 1 этаже справа от лифта
    const room1Index = this.roomNames.indexOf(sortedRooms[0])
    this.roomRects[room1Index].setTo(elevatorX + elevatorWidth + gap, 0, roomWidth, roomHeight)
    
    // Остальные комнаты на 2 этаже (туалет в конце)
    for (let i = 1; i < sortedRooms.length; i++) {
      const roomName = sortedRooms[i]
      const roomIndex = this.roomNames.indexOf(roomName)
      const x = elevatorX + elevatorWidth + gap + (i - 1) * (roomWidth + gap)
      const y = roomHeight + gap
      
      this.roomRects[roomIndex].setTo(x, y, roomWidth, roomHeight)
    }
  }

  private generateExtendedLayout(remainingRooms: string[], roomWidth: number, roomHeight: number, gap: number, elevatorX: number, elevatorWidth: number): void {
    // Планировка: [Вход] | [Комната1] [Комната2/Туалет]
    //                   | [Комната3/Туалет]
    
    const sortedRooms = this.sortRoomsForLayout(remainingRooms)
    
    // Если туалет среди комнат, размещаем его в тупиковой позиции
    const toiletIndex = sortedRooms.findIndex(room => room === 'Туалет')
    
    if (toiletIndex !== -1) {
      // Туалет размещаем на 2 этаже (тупик)
      const toiletRoomIndex = this.roomNames.indexOf('Туалет')
      this.roomRects[toiletRoomIndex].setTo(elevatorX + elevatorWidth + gap, roomHeight + gap, roomWidth, roomHeight)
      
      // Остальные комнаты на 1 этаже
      const otherRooms = sortedRooms.filter(room => room !== 'Туалет')
      for (let i = 0; i < otherRooms.length; i++) {
        const roomName = otherRooms[i]
        const roomIndex = this.roomNames.indexOf(roomName)
        const x = elevatorX + elevatorWidth + gap + i * (roomWidth + gap)
        this.roomRects[roomIndex].setTo(x, 0, roomWidth, roomHeight)
      }
    } else {
      // Если туалета нет, размещаем как обычно
      for (let i = 0; i < sortedRooms.length; i++) {
        const roomName = sortedRooms[i]
        const roomIndex = this.roomNames.indexOf(roomName)
        if (i < 2) {
          // Первые две комнаты на 1 этаже
          const x = elevatorX + elevatorWidth + gap + i * (roomWidth + gap)
          this.roomRects[roomIndex].setTo(x, 0, roomWidth, roomHeight)
        } else {
          // Третья комната на 2 этаже
          this.roomRects[roomIndex].setTo(elevatorX + elevatorWidth + gap, roomHeight + gap, roomWidth, roomHeight)
        }
      }
    }
  }

  private sortRoomsForLayout(rooms: string[]): string[] {
    // Туалет должен быть в конце (тупиковая комната)
    const toiletIndex = rooms.indexOf('Туалет')
    if (toiletIndex !== -1) {
      const otherRooms = rooms.filter(room => room !== 'Туалет')
      return [...otherRooms, 'Туалет']
    }
    return [...rooms]
  }

  public layout(viewRect: Phaser.Geom.Rectangle): void {
    this.root.setPosition(0, 0)
    this.viewport = viewRect

    const padding = 12
    const availW = Math.max(1, viewRect.width)
    const availH = Math.max(1, viewRect.height)

    // Отрисовываем всё (используем базовые координаты без перезаписи размеров)
    this.drawBunker()

    // Обновляем подсветки комнат при изменении layout
    this.updateRoomHighlights()
    
    // Обновляем hit area
    const hit = this.root.input?.hitArea as Phaser.Geom.Rectangle | undefined
    if (hit) {
      hit.width = availW
      hit.height = availH
    }
    
    // Применяем масштаб и позицию: строго два режима
    const pad = 16
    const targetFrac = this.scene.scale.height >= this.scene.scale.width ? 0.9 : 0.7

    // Вычисляем масштаб фокуса относительно выбранной комнаты (по ширине, с учетом высоты)
    const getFocusScale = (rect: Phaser.Geom.Rectangle): number => {
      const sByW = (availW * targetFrac) / rect.width
      const sByH = (availH - pad * 2) / rect.height
      return Math.min(sByW, sByH)
    }

    // Масштаб, чтобы уместить весь бункер целиком
    const allRects = [...this.roomRects, this.elevatorRect, ...this.extraElevators]
    const minX = Math.min(...allRects.map(r => r.x))
    const maxX = Math.max(...allRects.map(r => r.x + r.width))
    const minY = Math.min(...allRects.map(r => r.y))
    const maxY = Math.max(...allRects.map(r => r.y + r.height))
    const totalWidth = Math.max(1, maxX - minX)
    const totalHeight = Math.max(1, maxY - minY)
    const fitAllScale = Math.min((availW - pad * 2) / totalWidth, (availH - pad * 2) / totalHeight)

    if (this.mode === 'focus' && this.focusedIndex !== null) {
      const fr = this.roomRects[this.focusedIndex]
      // Используем фиксированный фокусный масштаб или вычисляем новый, если это первая фокусировка
      if (this.fixedFocusScale === 1) {
        this.fixedFocusScale = getFocusScale(fr)
      }
      const sFocus = this.fixedFocusScale
      
      // Дополнительная защита: если масштаб уже установлен и мы в режиме фокуса, не меняем его
      if (this.content.scale === sFocus && this.mode === 'focus') {
        return
      }
      
      const rcx = fr.x + fr.width / 2
      const rcy = fr.y + fr.height / 2
      const posX = Math.round(availW / 2 - rcx * sFocus)
      const posY = Math.round(availH / 2 - rcy * sFocus)

      // Проверяем, активно ли перемещение - если да, не центрируем
      if (this.isPanning) {
        console.log('[bunkerView] Layout called during panning, skipping focus centering')
        // Не меняем позицию и масштаб во время активного перемещения
        return
      }

      this.content.setScale(sFocus)
      this.content.setPosition(posX, posY)
      // Синхронизируем затемнение с основным контентом
      this.darknessContainer.setScale(sFocus)
      this.darknessContainer.setPosition(posX, posY)
    } else {
      // Обзор: используем фиксированный масштаб обзора
      if (this.fixedOverviewScale === 0.5) {
        const baseFocusRect = this.roomRects[this.focusedIndex ?? 0] ?? this.roomRects[0]
        const sFocusBase = baseFocusRect ? getFocusScale(baseFocusRect) : 1
        this.fixedOverviewScale = sFocusBase * 0.5
      }
      const sOverview = this.fixedOverviewScale
      
      // Дополнительная защита: если масштаб уже установлен и мы в режиме обзора, не меняем его
      if (this.content.scale === sOverview && this.mode === 'overview') {
        return
      }
      
      // Центрируем по текущему размеру бункера, но с фиксированным масштабом
      const centerX = minX + totalWidth / 2
      const centerY = minY + totalHeight / 2
      const posX = Math.round(availW / 2 - centerX * sOverview)
      const posY = Math.round(availH / 2 - centerY * sOverview)

          // Проверяем, активно ли перемещение - если да, не центрируем
    if (this.isPanning) {
      console.log('[bunkerView] Layout called during panning, skipping centering')
      // Не меняем позицию и масштаб во время активного перемещения
      return
    }

    // Дополнительная проверка: если недавно завершилось перемещение, не центрируем
    if (this.recentlyFinishedPanning) {
      console.log('[bunkerView] Layout called after recent panning, skipping centering')
      this.recentlyFinishedPanning = false
      return
    }

      this.content.setScale(sOverview)
      this.content.setPosition(posX, posY)
      // Синхронизируем затемнение с основным контентом
      this.darknessContainer.setScale(sOverview)
      this.darknessContainer.setPosition(posX, posY)
    }

    // После трансформа — гарантируем, что жители остаются в content и на верхних слоях
    // Для стабильности: сначала добавляем в content в фиксированном порядке, потом выставляем порядок
    for (const a of this.residentAgents) {
      if (a.sprite && a.sprite.scene && a.sprite.parentContainer !== this.content) this.content.add(a.sprite)
      if (a.pants && a.pants.scene && a.pants.parentContainer !== this.content) this.content.add(a.pants)
      if (a.footwear && a.footwear.scene && a.footwear.parentContainer !== this.content) this.content.add(a.footwear)
      if (a.shirt && a.shirt.scene && a.shirt.parentContainer !== this.content) this.content.add(a.shirt)
      if (a.hair && a.hair.scene && a.hair.parentContainer !== this.content) this.content.add(a.hair)
      if (a.rect.scene && a.rect.parentContainer !== this.content) this.content.add(a.rect)
    }
    
    // ВАЖНО: Проверяем жителей на поверхности, чтобы убедиться что они все еще существуют
    const gameScene = this.scene as any
    if (gameScene.surfaceQueue) {
      for (const item of gameScene.surfaceQueue.list) {
        if (item && typeof item === 'object' && 'onSurface' in item && item.onSurface) {
          // Это житель на поверхности
          const surfaceResident = item as any
          if (surfaceResident.sprite && surfaceResident.sprite.scene) {
            // Проверяем, что спрайт все еще в surfaceArea
            if (gameScene.surfaceArea && !gameScene.surfaceArea.list.includes(surfaceResident.sprite)) {
              console.log(`[bunkerView] layout: Восстанавливаем спрайт жителя на поверхности ${surfaceResident.profession}`)
              gameScene.surfaceArea.add(surfaceResident.sprite)
            }
          }
        }
      }
    }
    // Устанавливаем фиксированные значения depth для правильного порядка отрисовки
    // console.log(`[Depth] Обновляем depth для ${this.residentAgents.length} персонажей`)
    for (let i = 0; i < this.residentAgents.length; i++) {
      const a = this.residentAgents[i]
      if (a.sprite) {
        a.sprite.setDepth(100)
        const sameContainer = a.sprite.parentContainer === this.content
        // console.log(`[Depth] Персонаж ${i}: sprite depth=${a.sprite.depth}, в content=${sameContainer}, container=${a.sprite.parentContainer?.name || 'none'}`)
      }
      if (a.shirt) a.shirt.setDepth(200)
      if (a.hair) a.hair.setDepth(300)
      if (a.footwear) a.footwear.setDepth(400)
      if (a.pants) a.pants.setDepth(500)
      a.rect.setDepth(50)
    }
    
    // Затемнение находится в отдельном контейнере поверх персонажей
    console.log(`[Darkness] Проверяем затемнение (в отдельном контейнере) для ${this.roomDarknessOverlays.size} эффектов`)
    this.roomDarknessOverlays.forEach((overlay, roomIndex) => {
      if (overlay && overlay.scene) {
        // Затемнение уже в правильном контейнере (darknessContainer), просто проверяем
        console.log(`[Darkness] Комната ${roomIndex}: depth=${overlay.depth}, в darknessContainer=${overlay.parentContainer === this.darknessContainer}`)
      }
    })

    // После применения трансформа к контенту — рендерим оверлейные лейблы/кнопки в экранных координатах
    // Если фокус сменился — закрыть все панели деталей
    if (this.lastFocusedIndex !== this.focusedIndex) {
      this.closeAllDetails()
      this.lastFocusedIndex = this.focusedIndex
    }
    
    // Проверяем, активно ли перемещение - если да, не обновляем лейблы
    if (!this.isPanning) {
      this.updateLabels()
    } else {
      console.log('[bunkerView] updateLabels called during panning, skipping')
    }
    
    // Обновляем прозрачность затемнения при смене режима/фокуса
    this.updateAllDarknessTransparency()
  }

  // Убираем рескейл прямоугольников. Комнаты и лифт хранятся в базовых единицах (120x90),
  // отображение масштабируется через content.setScale в двух фиксированных режимах.

  private drawBunker(): void {
    console.log(`[Darkness] drawBunker вызван`)
    
    // Проверяем, активно ли перемещение - если да, не перерисовываем
    if (this.isPanning) {
      console.log('[bunkerView] drawBunker called during panning, skipping redraw')
      return
    }
    
    this.panel.clear()
    
    // Сначала чистим старые images (если есть), оставляем panel (границы), панели деталей и прямоугольники затемнения
    const toRemove: Phaser.GameObjects.GameObject[] = []
    let darknessFound = 0
    for (const obj of this.content.list) {
      const n = (obj as any).name
      if (n === 'darkness') {
        darknessFound++
      }
      // Не удаляем панели деталей, жителей, ВРАГОВ и прямоугольники затемнения
      if (obj !== this.panel && n !== 'detailsPanel' && n !== 'resident' && n !== 'enemy' && n !== 'dbg' && n !== 'darkness') {
        toRemove.push(obj)
      }
    }
    console.log(`[Darkness] При очистке найдено прямоугольников затемнения: ${darknessFound}, к удалению объектов: ${toRemove.length}`)
    toRemove.forEach(o => o.destroy())
    
    // Рендер комнат как изображений (жители и их слои не трогаем)
    for (let i = 0; i < this.roomRects.length; i++) {
      const rect = this.roomRects[i]
      const name = this.roomNames[i]
      const key = this.roomTextureKey(name)
      if (key) {
        const img = this.scene.add.image(rect.x, rect.y, key).setOrigin(0)
        this.fitImageToRect(img, rect)
        this.content.add(img)
      } else {
        // Фолбэк — заливка
        this.panel.fillStyle(0x1f242b, 1)
        this.panel.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    }
    // Лифты
    const drawLift = (rect: Phaser.Geom.Rectangle) => {
      const img = this.scene.add.image(rect.x, rect.y, 'room_elevator').setOrigin(0)
      this.fitImageToRect(img, rect)
      this.content.add(img)
    }
    drawLift(this.elevatorRect)
    for (const lift of this.extraElevators) drawLift(lift)
    
    // Очищаем старые эффекты затемнения и пересоздаем их
    this.clearAllDarknessEffects()
    this.refreshAllDarknessEffects()
    
    // Обводка для наглядности
    this.panel.lineStyle(1, 0x4fc3f7, 0.6)
    for (const roomRect of this.roomRects) this.panel.strokeRect(roomRect.x, roomRect.y, roomRect.width, roomRect.height)
    this.panel.strokeRect(this.elevatorRect.x, this.elevatorRect.y, this.elevatorRect.width, this.elevatorRect.height)
    for (const lift of this.extraElevators) this.panel.strokeRect(lift.x, lift.y, lift.width, lift.height)
    
    // Жители поверх комнат и лифтов (фиксированный порядок слоёв)
    this.residentAgents.forEach(a => {
      if (a.sprite) this.content.bringToTop(a.sprite) // 1 кожа
      if (a.shirt) this.content.bringToTop(a.shirt)   // 2 верх
      if (a.hair) this.content.bringToTop(a.hair)     // 3 волосы
      if (a.footwear) this.content.bringToTop(a.footwear) // 4 ботинки
      if (a.pants) this.content.bringToTop(a.pants)   // 5 низ
      if (a.rect.scene) this.content.bringToTop(a.rect)
      
      // Восстанавливаем шкалу здоровья агента
      this.drawHealthBar(a)
    })
  }

  private roomTextureKey(name: string): string | null {
    switch (name) {
      case 'Туалет': return 'room_bathroom'
      case 'Спальня': return 'room_bedroom'
      case 'Столовая': return 'room_dining'
      case 'Серверная': return 'room_computer'
      case 'Госпиталь': return 'room_hospital'
      case 'Склад': return 'room_storage'
      case 'Лаборатория': return 'room_lab'
      case 'Техническая': return 'room_tech'
      case 'Станция': return 'room_station'
      case 'Вход': return 'room_entrance_in'
      default: return null
    }
  }

  // Метод для подсчета количества складов
  public getStorageRoomCount(): number {
    let storageCount = 0;
    for (let i = 0; i < this.roomNames.length; i++) {
      if (this.roomNames[i] === 'Склад') {
        storageCount++;
      }
    }
    return storageCount;
  }

  // Метод для уведомления об изменении количества складов
  public notifyStorageRoomChange(): void {
    const storageCount = this.getStorageRoomCount();
    console.log(`[bunkerView] Storage rooms count changed: ${storageCount} (triggering inventory update)`);

    // Показываем уведомление об изменении инвентаря
    if (storageCount > 0) {
      this.showNotification(`Инвентарь расширен до ${storageCount + 1} строк`, 'success');
    } else {
      this.showNotification(`Инвентарь сокращен до 1 строки`, 'warning');
    }

    // Уведомляем игровую сцену об изменении
    if (window.game && window.game.scene) {
      const gameScene = window.game.scene.getScene('Game') as any;
      if (gameScene && gameScene.updateInventoryRows) {
        console.log(`[bunkerView] Calling gameScene.updateInventoryRows(${storageCount})`);
        gameScene.updateInventoryRows(storageCount);
      } else {
        console.warn(`[bunkerView] gameScene.updateInventoryRows not found`);
      }
    } else {
      console.warn(`[bunkerView] window.game or window.game.scene not available`);
    }
  }

  private fitImageToRect(img: Phaser.GameObjects.Image, rect: Phaser.Geom.Rectangle): void {
    img.setDisplaySize(rect.width, rect.height)
  }

  private fitLabelToRoom(label: Phaser.GameObjects.Text, rect: Phaser.Geom.Rectangle): void {
    const padding = 4
    const maxW = Math.max(1, rect.width - padding * 2)
    const maxH = Math.max(1, rect.height - padding * 2)
    // Без переноса: подгоняем размер шрифта под ширину контейнера
    label.setWordWrapWidth(0)
    label.setAlign('left')
    let fontSize = Math.floor(Math.min(maxH * 0.35, 16)) // стартовая оценка
    const minSize = 6
    const fullText = label.text
    while (fontSize >= minSize) {
      label.setStyle({ fontSize: `${fontSize}px` })
      const b = label.getBounds()
      if (b.width <= maxW && b.height <= maxH) break
      fontSize -= 1
    }
    // Если даже на минимальном размере ширина больше — обрежем с многоточием
    if (fontSize < minSize) {
      fontSize = minSize
      label.setStyle({ fontSize: `${fontSize}px` })
      let text = fullText
      while (text.length > 1 && label.getBounds().width > maxW) {
        text = text.slice(0, -1)
        label.setText(text + '…')
      }
    }
    // Позиционируем внутри комнаты
    label.setPosition(rect.x + padding, rect.y + padding)
  }

  private computeRoomsFontSize(padding: number): number {
    // Подбираем единый размер шрифта так, чтобы все названия влезли во все комнаты
    // Берём минимальные внутренние размеры среди всех комнат
    let minInnerW = Infinity
    let minInnerH = Infinity
    const pad2 = padding * 2
    for (const rect of this.roomRects) {
      minInnerW = Math.min(minInnerW, Math.max(1, rect.width - pad2))
      minInnerH = Math.min(minInnerH, Math.max(1, rect.height - pad2))
    }
    // Тестируем шрифт от 16 вниз до 6, пока все названия умещаются в min box
    let fontSize = 16
    const minSize = 6
    while (fontSize >= minSize) {
      let allFit = true
      for (const name of this.roomNames) {
        const tmp = this.scene.add.text(0, 0, name, {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: `${fontSize}px`,
          color: '#ffffff'
        }).setOrigin(0)
        const b = tmp.getBounds()
        tmp.destroy()
        if (b.width > minInnerW || b.height > minInnerH) {
          allFit = false
          break
        }
      }
      if (allFit) break
      fontSize -= 1
    }
    return Math.max(minSize, fontSize)
  }

  private updateLabels(): void {
    // Убираем блокировку - заголовки должны двигаться с комнатами
    // Проверяем только для критических операций, но не для обычного обновления позиций
    
    // Очистить overlay (сохранить открытые панели деталей)
    for (const child of [...this.overlay.list]) {
      const nm = (child as any).name
      if (nm !== 'detailsPanel' && nm !== 'fx' && nm !== 'dbg') child.destroy()
    }
    // Удаляем старые лейблы
    for (const label of this.labels) {
      label.destroy()
    }
    this.labels = []

    // Очищаем кликабельные области комнат (они будут пересозданы)
    this.clearRoomHitAreas()
    
    // Удаляем старую кнопку добавления
    if (this.addButton) {
      this.addButton.destroy()
      this.addButton = undefined
    }
    
    // Универсальный размер шрифта для всех комнат + кнопки «i» в правом краю шапки комнаты (только в фокусе)
    const pad = 4
    const roomsFontPx = this.computeRoomsFontSize(pad)
    const mContent = this.content.getWorldTransformMatrix()
    const mRoot = this.root.getWorldTransformMatrix()
    for (let i = 0; i < this.roomRects.length; i++) {
      const r = this.roomRects[i]
      const roomName = this.roomNames[i]
      // Преобразуем координаты комнаты: content local -> world -> root local (overlay)
      const tlWorld = new Phaser.Math.Vector2(r.x, r.y)
      const brWorld = new Phaser.Math.Vector2(r.x + r.width, r.y + r.height)
      mContent.transformPoint(tlWorld.x, tlWorld.y, tlWorld)
      mContent.transformPoint(brWorld.x, brWorld.y, brWorld)
      const tlLocal = new Phaser.Math.Vector2()
      const brLocal = new Phaser.Math.Vector2()
      mRoot.applyInverse(tlWorld.x, tlWorld.y, tlLocal)
      mRoot.applyInverse(brWorld.x, brWorld.y, brLocal)
      const scrX = tlLocal.x
      const scrY = tlLocal.y
      const scrW = Math.max(1, brLocal.x - tlLocal.x)

      // Шапка
      const bg = this.scene.add.rectangle(
        scrX + scrW / 2,
        scrY + pad + roomsFontPx / 2,
        scrW,
        roomsFontPx + pad * 2,
        0x000000,
        0.45
      )
      this.overlay.add(bg)

      // Получаем состояние комнаты и генерируем иконки
      const roomState = this.roomStates.get(i) || this.createDefaultRoomState(roomName)
      const statusIcons = this.generateRoomStatusIcons(roomState)
      
      // Создаем текст с названием комнаты и иконками состояния
      const roomText = `${roomName} ${statusIcons}`
      
      const label = this.scene.add.text(0, 0, roomText, {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: `${roomsFontPx}px`,
        color: '#e0e0e0',
        align: 'left'
      }).setOrigin(0, 0)
      // Без переноса и обрезки — размер подобран глобально под все комнаты
      label.setWordWrapWidth(0)
      label.setShadow(1, 1, '#000000', 2, true, true)
      label.setPosition(scrX + pad, scrY + pad)
      this.overlay.add(label)
      this.labels.push(label)

      // Кнопка «i» справа в шапке комнаты, видна только если есть фокус на этой комнате
      if (this.mode === 'focus' && this.focusedIndex === i) {
        const btnSize = Math.max(10, Math.min(16, Math.floor(roomsFontPx * 0.75)))
        const btnX = scrX + scrW - pad - btnSize / 2
        const btnY = scrY + pad + (roomsFontPx + pad) / 2
        const btn = this.scene.add.container(btnX, btnY)
        const btnBg = this.scene.add.rectangle(0, 0, btnSize, btnSize, 0x2a2d33, 0.95)
        btnBg.setStrokeStyle(1, 0x4fc3f7, 1)
        const btnTxt = this.scene.add.text(0, 0, 'i', {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: `${Math.max(8, Math.floor(btnSize * 0.6))}px`,
          color: '#ffffff'
        }).setOrigin(0.5)
        btn.add([btnBg, btnTxt])
        const hit = this.scene.add.rectangle(btnX, btnY, btnSize, btnSize, 0x000000, 0.001)
        hit.setInteractive({ useHandCursor: true })
        hit.on('pointerdown', () => this.toggleRoomDetailsPanel(i))
        this.overlay.add(btn)
        this.overlay.add(hit)
      }

      // Кликабельные области для удаления создаются в recreateRoomHitAreas

      // Если панель деталей открыта — обновим её позицию, чтобы была закреплена к правому краю шапки
      const opened = this.detailsPanels.get(i)
      if (opened && opened.scene) {
        const headerH = roomsFontPx + pad * 2
        const panelW = Math.min(200, Math.max(140, scrW * 0.7))
        const panelX = scrX + scrW - panelW - pad
        const panelY = scrY + headerH
        opened.setPosition(panelX, panelY)
      }
    }
    
    // Лифт — в экранных координатах
    const tlE = new Phaser.Math.Vector2(this.elevatorRect.x, this.elevatorRect.y)
    const brE = new Phaser.Math.Vector2(this.elevatorRect.x + this.elevatorRect.width, this.elevatorRect.y + this.elevatorRect.height)
    mContent.transformPoint(tlE.x, tlE.y, tlE)
    mContent.transformPoint(brE.x, brE.y, brE)
    const tlELocal = new Phaser.Math.Vector2()
    const brELocal = new Phaser.Math.Vector2()
    mRoot.applyInverse(tlE.x, tlE.y, tlELocal)
    mRoot.applyInverse(brE.x, brE.y, brELocal)
    const eScrX = tlELocal.x, eScrY = tlELocal.y, eScrW = Math.max(1, brELocal.x - tlELocal.x)
    const liftBgHeight = Math.max(roomsFontPx + pad * 2, 12)
    const liftBg = this.scene.add.rectangle(eScrX + eScrW / 2, eScrY + pad + liftBgHeight / 2 - pad, eScrW, liftBgHeight, 0x000000, 0.45)
    this.overlay.add(liftBg)
    const elevatorLabel = this.scene.add.text(eScrX + pad, eScrY + pad, 'ЛИФТ', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: `${Math.max(6, roomsFontPx - 2)}px`,
      color: '#90a4ae'
    }).setOrigin(0, 0)
    elevatorLabel.setShadow(1, 1, '#000000', 2, true, true)
    this.overlay.add(elevatorLabel)
    
    // Если мы в режиме удаления, обновляем все подсветки и кликабельные области
    if (this.isRemovingRoom && this.mode === 'overview') {
      console.log('[bunkerView] In removal mode and overview, calling updateRoomHighlights')
      this.updateRoomHighlights()
    }

    // Кнопка добавления комнат (только в overview режиме)
    if (this.mode === 'overview') {
      this.createAddButton()
      this.createPeopleButton()
    }

    // Обновляем видимость кнопки удаления в зависимости от способности
    // Делаем это после создания основных кнопок
    this.updateRemoveButtonVisibility()
  }

  private createAddButton(): void {
    if (this.addButton) return // Уже создана
    
    // Размещаем кнопку "+" в правом верхнем углу viewport
    const buttonSize = 32
    const margin = 16
    
    this.addButton = this.scene.add.text(
      this.viewport.width - buttonSize - margin, 
      margin, 
      '+', 
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '24px',
        color: '#4fc3f7',
        backgroundColor: '#1a1d22',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5)
    
    this.addButton.setInteractive({ useHandCursor: true })
    this.addButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Предотвращаем всплытие события
      pointer.event.preventDefault()
      pointer.event.stopPropagation()
      pointer.event.stopImmediatePropagation()
      
      // Выходим из режима удаления при добавлении комнаты
      if (this.isRemovingRoom) {
        this.toggleRemoveMode()
      }
      
      // Небольшая задержка для предотвращения случайного выбора комнаты
      setTimeout(() => {
        this.openRoomSelectionModal()
      }, 100)
    })

    // Добавляем кнопку к parent, чтобы она была поверх всего
    this.parent.add(this.addButton)
  }

  private createRemoveButton(): void {
    if (this.removeButton) return // Уже создана

    // Проверяем, что способность "Демонтаж" изучена
    if (!this.isDemolitionAbilityLearned()) {
      console.log('[bunkerView] Demolition ability not learned, skipping remove button creation')
      return
    }

    // Проверяем, что viewport корректно инициализирован
    if (!this.viewport || this.viewport.width <= 0) {
      console.warn('[bunkerView] Viewport not initialized, cannot create remove button')
      return
    }

    const buttonSize = 32
    const margin = 16
    const spacing = 8

    const buttonX = this.viewport.width - buttonSize * 3 - margin - spacing * 2
    const buttonY = margin

    // Проверяем, что позиция корректна
    if (buttonX < 0 || buttonY < 0) {
      console.warn('[bunkerView] Invalid button position:', buttonX, buttonY)
      return
    }

    this.removeButton = this.scene.add.text(
      buttonX,
      buttonY,
      '×',
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '24px',
        color: '#f44336',
        backgroundColor: '#1a1d22',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5)

    this.removeButton.setInteractive({ useHandCursor: true })
    this.removeButton.on('pointerdown', () => this.toggleRemoveMode())

    // Добавляем кнопку к parent, чтобы она была поверх всего
    this.parent.add(this.removeButton)
  }

  private toggleRemoveMode(): void {
    this.isRemovingRoom = !this.isRemovingRoom
    this.isAddingRoom = false // Отключаем режим добавления

    console.log('[bunkerView] Remove mode toggled to:', this.isRemovingRoom)

    if (this.isRemovingRoom) {
      this.removeButton?.setColor('#ff5722') // Более яркий красный
      this.addButton?.setColor('#666') // Делаем кнопку добавления неактивной
      this.updateRoomHighlights() // Используем updateRoomHighlights вместо прямого вызова
    } else {
      this.removeButton?.setColor('#f44336') // Обычный красный
      this.addButton?.setColor('#4fc3f7') // Возвращаем обычный цвет кнопки добавления
      this.clearRoomHighlights()
      this.clearRoomHitAreas()
      // Закрываем диалог подтверждения при выходе из режима
      if (this.currentDialog) {
        this.currentDialog.destroy()
        this.currentDialog = undefined
      }
    }
  }

  private highlightRemovableRooms(): void {
    console.log('[bunkerView] Highlighting removable rooms by changing border colors')

    // Перерисовываем panel с красными рамками для удаляемых комнат
    this.panel.clear()

    // Рисуем комнаты заново
    for (let i = 0; i < this.roomRects.length; i++) {
      const rect = this.roomRects[i]
      const name = this.roomNames[i]
      const key = this.roomTextureKey(name)
      if (key) {
        const img = this.scene.add.image(rect.x, rect.y, key).setOrigin(0)
        this.fitImageToRect(img, rect)
        this.content.add(img)
      } else {
        // Фолбэк — заливка
        this.panel.fillStyle(0x1f242b, 1)
        this.panel.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    }

    // Рисуем рамки с красным цветом для удаляемых комнат
    this.roomRects.forEach((roomRect, index) => {
      if (this.canRemoveRoom(index)) {
        console.log(`[bunkerView] Highlighting room ${index} (${this.roomNames[index]}) with red border`)
        // Сохраняем оригинальный цвет
        this.originalRoomColors.set(index, 0x4fc3f7) // Синий цвет по умолчанию
        // Рисуем красную рамку
        this.panel.lineStyle(3, 0xff5722, 1) // Красный контур
        this.panel.strokeRect(roomRect.x, roomRect.y, roomRect.width, roomRect.height)
      } else {
        // Обычная рамка для остальных комнат
        this.panel.lineStyle(1, 0x4fc3f7, 0.6) // Синий контур
        this.panel.strokeRect(roomRect.x, roomRect.y, roomRect.width, roomRect.height)
      }
    })

    // Рисуем рамки лифтов
    this.panel.lineStyle(1, 0x4fc3f7, 0.6)
    this.panel.strokeRect(this.elevatorRect.x, this.elevatorRect.y, this.elevatorRect.width, this.elevatorRect.height)
    for (const lift of this.extraElevators) {
      this.panel.strokeRect(lift.x, lift.y, lift.width, lift.height)
    }

    console.log('[bunkerView] Highlighted', this.roomRects.filter((_, index) => this.canRemoveRoom(index)).length, 'removable rooms with red borders')
  }

  private updateRoomHighlights(): void {
    if (this.isRemovingRoom) {
      console.log('[bunkerView] Updating room highlights and hit areas')
      this.highlightRemovableRooms() // Подсвечиваем рамки красным
      this.clearRoomHitAreas()
      this.recreateRoomHitAreas() // Создаем кликабельные области
      console.log('[bunkerView] Room highlights and hit areas updated')
    }
  }

  private clearRoomHighlights(): void {
    console.log('[bunkerView] Clearing room highlights - restoring original border colors')

    // Восстанавливаем оригинальные цвета рамок в panel
    this.panel.clear()

    // Рисуем комнаты заново
    for (let i = 0; i < this.roomRects.length; i++) {
      const rect = this.roomRects[i]
      const name = this.roomNames[i]
      const key = this.roomTextureKey(name)
      if (key) {
        const img = this.scene.add.image(rect.x, rect.y, key).setOrigin(0)
        this.fitImageToRect(img, rect)
        this.content.add(img)
      } else {
        // Фолбэк — заливка
        this.panel.fillStyle(0x1f242b, 1)
        this.panel.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    }

    // Рисуем обычные рамки (синие)
    this.panel.lineStyle(1, 0x4fc3f7, 0.6)
    for (const roomRect of this.roomRects) {
      this.panel.strokeRect(roomRect.x, roomRect.y, roomRect.width, roomRect.height)
    }
    this.panel.strokeRect(this.elevatorRect.x, this.elevatorRect.y, this.elevatorRect.width, this.elevatorRect.height)
    for (const lift of this.extraElevators) {
      this.panel.strokeRect(lift.x, lift.y, lift.width, lift.height)
    }

    // Очищаем сохраненные цвета
    this.originalRoomColors.clear()

    console.log('[bunkerView] Room highlights cleared - borders restored to original colors')
  }

  private clearRoomHitAreas(): void {
    if (this.roomHitAreas) {
      this.roomHitAreas.forEach(hitArea => hitArea.destroy())
      this.roomHitAreas = []
    }
  }

  private recreateRoomHitAreas(): void {
    console.log('[bunkerView] Recreating room hit areas for removal mode')

    // Очищаем существующие кликабельные области
    this.clearRoomHitAreas()

    const pad = 4
    const roomsFontPx = this.computeRoomsFontSize(pad)
    const mContent = this.content.getWorldTransformMatrix()
    const mRoot = this.root.getWorldTransformMatrix()

    for (let i = 0; i < this.roomRects.length; i++) {
      if (!this.canRemoveRoom(i)) continue

      const r = this.roomRects[i]
      const roomName = this.roomNames[i]

      // Используем тот же метод преобразования, что и для рамок
      const mContent = this.content.getWorldTransformMatrix()
      const mRoot = this.root.getWorldTransformMatrix()

      // Преобразуем координаты комнаты: content local -> world -> root local
      const tlWorld = new Phaser.Math.Vector2(r.x, r.y)
      const brWorld = new Phaser.Math.Vector2(r.x + r.width, r.y + r.height)
      mContent.transformPoint(tlWorld.x, tlWorld.y, tlWorld)
      mContent.transformPoint(brWorld.x, brWorld.y, brWorld)
      const tlLocal = new Phaser.Math.Vector2()
      const brLocal = new Phaser.Math.Vector2()
      mRoot.applyInverse(tlWorld.x, tlWorld.y, tlLocal)
      mRoot.applyInverse(brWorld.x, brWorld.y, brLocal)
      const scrX = tlLocal.x
      const scrY = tlLocal.y
      const scrW = Math.max(1, brLocal.x - tlLocal.x)
      const scrH = Math.max(1, brLocal.y - tlLocal.y)

      console.log(`[bunkerView] Hit area for room ${i} (${roomName}): pos(${scrX + scrW / 2}, ${scrY + scrH / 2}), size(${scrW}, ${scrH})`)

      // Проверяем, что размеры корректные
      if (scrW <= 0 || scrH <= 0) {
        console.warn(`[bunkerView] Invalid hit area size for room ${i} (${roomName}): ${scrW}x${scrH}`)
        continue
      }

      // Создаем кликабельную область для всей комнаты
      const roomHitArea = this.scene.add.rectangle(
        scrX + scrW / 2,
        scrY + scrH / 2,
        scrW,
        scrH,
        0x000000,
        0.001
      )
      roomHitArea.setInteractive({ useHandCursor: true })
      roomHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        console.log(`[bunkerView] Hit area clicked for room ${i} (${roomName})`)
        // Предотвращаем распространение события дальше
        pointer.event.stopPropagation()
        pointer.event.stopImmediatePropagation()
        this.toggleRoomDetailsPanel(i)
      })
      // Добавляем в начало overlay для большего приоритета
      this.overlay.addAt(roomHitArea, 0)
      this.roomHitAreas.push(roomHitArea)

      console.log(`[bunkerView] Created interactive hit area for room ${i} (${roomName})`)
    }

    console.log('[bunkerView] Recreated', this.roomHitAreas.length, 'room hit areas')

    // Проверяем, что кликабельные области действительно добавлены
    this.roomHitAreas.forEach((hitArea, index) => {
      console.log(`[bunkerView] Hit area ${index}: visible=${hitArea.visible}, interactive=${hitArea.input?.enabled}`)
    })
  }

  private isDemolitionAbilityLearned(): boolean {
    // Проверяем, доступны ли данные о способностях
    if (typeof window.getAbilitiesData === 'function') {
      try {
        const abilitiesData = window.getAbilitiesData()
        // console.log('[bunkerView] Checking demolition ability, abilities data:', abilitiesData)

        if (abilitiesData && abilitiesData.abilitiesData) {
          // Ищем способность "bunk_demolition" во всех категориях
          for (const category of Object.values(abilitiesData.abilitiesData)) {
            if (Array.isArray(category)) {
              const demolitionAbility = category.find(ability => ability.id === 'bunk_demolition')
              if (demolitionAbility) {
                const isLearned = demolitionAbility.currentLevel > 0
                // console.log('[bunkerView] Demolition ability found, currentLevel:', demolitionAbility.currentLevel, 'isLearned:', isLearned)
                return isLearned
              }
            }
          }
        }

        // Альтернативная проверка через learnedAbilities
        if (abilitiesData && abilitiesData.learnedAbilities) {
          if (Array.isArray(abilitiesData.learnedAbilities)) {
            if (typeof abilitiesData.learnedAbilities[0] === 'string') {
              const isLearned = abilitiesData.learnedAbilities.includes('bunk_demolition')
              console.log('[bunkerView] Demolition ability in learnedAbilities (strings):', isLearned)
              return isLearned
            } else if (typeof abilitiesData.learnedAbilities[0] === 'object') {
              const isLearned = abilitiesData.learnedAbilities.some((ability: any) =>
                ability.id === 'bunk_demolition' && ability.currentLevel > 0
              )
              console.log('[bunkerView] Demolition ability in learnedAbilities (objects):', isLearned)
              return isLearned
            }
          }
        }
      } catch (error) {
        console.warn('[bunkerView] Error checking demolition ability:', error)
      }
    } else {
      console.log('[bunkerView] getAbilitiesData function not available')
    }

    console.log('[bunkerView] Demolition ability not found or not learned')
    return false
  }

  private updateRemoveButtonVisibility(): void {
    // console.log('[bunkerView] Updating remove button visibility')

    const shouldShowRemoveButton = this.isDemolitionAbilityLearned()
    const removeButtonExists = !!this.removeButton

    // console.log('[bunkerView] Should show remove button:', shouldShowRemoveButton, 'exists:', removeButtonExists)

    if (shouldShowRemoveButton && !removeButtonExists) {
      // Нужно создать кнопку удаления
      console.log('[bunkerView] Creating remove button')
      this.createRemoveButton()
    } else if (!shouldShowRemoveButton && removeButtonExists) {
      // Нужно удалить кнопку удаления
      console.log('[bunkerView] Destroying remove button')
      if (this.removeButton) {
        this.removeButton.destroy()
        this.removeButton = undefined
      }
      // Выходим из режима удаления если он был активен
      if (this.isRemovingRoom) {
        this.toggleRemoveMode()
      }
    } else {
      // console.log('[bunkerView] Remove button visibility is correct, no changes needed')
    }
  }

  private setupAbilityDataListener(): void {
    console.log('[bunkerView] Setting up ability data listener')

    // Проверяем данные о способностях каждые 100мс в течение 5 секунд после старта
    let attempts = 0
    const maxAttempts = 50 // 5 секунд

    const checkInterval = setInterval(() => {
      attempts++

      if (attempts > maxAttempts) {
        console.log('[bunkerView] Stopped checking for ability data after', maxAttempts, 'attempts')
        clearInterval(checkInterval)
        return
      }

      if (this.isDemolitionAbilityLearned()) {
        // console.log('[bunkerView] Ability data is ready, updating remove button visibility')
        this.updateRemoveButtonVisibility()
        clearInterval(checkInterval)
      } else if (attempts % 10 === 0) { // Логируем каждые 10 попыток
        console.log('[bunkerView] Still waiting for ability data, attempt', attempts)
      }
    }, 100)

    // Также проверяем сразу, на случай если данные уже готовы
    setTimeout(() => {
      if (this.isDemolitionAbilityLearned()) {
        console.log('[bunkerView] Ability data was ready immediately')
        this.updateRemoveButtonVisibility()
        clearInterval(checkInterval)
      }
    }, 10)
  }

  private canRemoveRoom(roomIndex: number): boolean {
    const roomName = this.roomNames[roomIndex]

    // Нельзя удалять комнату "Вход"
    if (roomName === 'Вход') {
      return false
    }

    // Нельзя удалять первый лифт
    if (roomName === 'Лифт' && this.isFirstElevator(roomIndex)) {
      return false
    }

    // Проверяем, есть ли в комнате жители или враги
    const hasResidents = this.residentAgents.some(agent =>
      agent.roomIndex === roomIndex && agent.isEnemy !== true
    )
    const hasEnemies = this.residentAgents.some(agent =>
      agent.roomIndex === roomIndex && agent.isEnemy === true
    )

    if (hasResidents || hasEnemies) {
      return false
    }

    return true
  }

  private isFirstElevator(roomIndex: number): boolean {
    // Находим все лифты
    const elevatorIndices: number[] = []
    this.roomNames.forEach((name, index) => {
      if (name === 'Лифт') {
        elevatorIndices.push(index)
      }
    })

    // Сортируем по индексу и проверяем, является ли этот лифт первым
    elevatorIndices.sort((a, b) => a - b)
    return elevatorIndices[0] === roomIndex
  }

  private removeRoom(roomIndex: number): void {
    console.log('[bunkerView] Removing room:', this.roomNames[roomIndex], 'at index:', roomIndex)

    // Сохраняем имя комнаты перед удалением (важно для проверки типа комнаты)
    const roomName = this.roomNames[roomIndex]

    // Обновляем пути жителей, которые могли идти к этой комнате
    this.handleResidentsAfterRoomRemoval(roomIndex)

    // Удаляем комнату из массивов
    this.roomNames.splice(roomIndex, 1)
    this.roomRects.splice(roomIndex, 1)
    this.roomStates.delete(roomIndex)

    // Перестраиваем индексы для оставшихся комнат
    this.rebuildRoomStatesAfterRemoval(roomIndex)

    // Очищаем подсветки и кликабельные области
    this.clearRoomHighlights()
    this.clearRoomHitAreas()

    // Перерисовываем бункер (это также обновит метки)
    this.drawBunker()

    // Дополнительно обновляем метки, чтобы гарантированно удалить старые
    this.updateLabels()

    // Обновляем рамки подсветки для оставшихся комнат
    this.updateRoomHighlights()

    // Обновляем видимость кнопки удаления
    this.updateRemoveButtonVisibility()

    // Проверяем, была ли удалена комната склада
    const wasStorageRoom = roomName === 'Склад'

    // Выходим из режима удаления
    this.toggleRemoveMode()

    // Если была удалена комната склада, уведомляем об изменении
    if (wasStorageRoom) {
      console.log(`[bunkerView] Storage room removed, calling notifyStorageRoomChange`);
      this.notifyStorageRoomChange()
    }

    console.log('[bunkerView] Room removed successfully')
    
    // Показываем уведомление об удалении комнаты
    this.showNotification(`Уничтожена комната: ${roomName}`, 'warning')

    // Сообщаем сцене, что структура бункера изменилась (вместимость/UI)
    try {
    const gameScene = this.scene as any
      if (gameScene && typeof gameScene.onBunkerChanged === 'function') {
        gameScene.onBunkerChanged()
      }
    } catch {}
  }

  private handleResidentsAfterRoomRemoval(removedRoomIndex: number): void {
    console.log('[bunkerView] Handling residents after room removal:', removedRoomIndex)

    this.residentAgents.forEach(agent => {
      if (!agent) return

      // Если житель был в удаляемой комнате - перемещаем в ближайшую доступную
      if (agent.roomIndex === removedRoomIndex) {
        console.log('[bunkerView] Resident was in removed room, finding new room')
        const newRoomIndex = this.findNearestAvailableRoom(agent.rect.x, agent.rect.y)
        if (newRoomIndex !== null) {
          agent.roomIndex = newRoomIndex
          console.log('[bunkerView] Moved resident to room:', newRoomIndex)
        }
      }

      // Если житель шел к удаляемой комнате - отменяем путь
      if (agent.targetRoomIndex === removedRoomIndex) {
        console.log('[bunkerView] Resident was going to removed room, canceling path')
        agent.path = []
        agent.targetRoomIndex = undefined
        agent.intention = 'wander' // Переключаем на блуждание
      }
    })
  }

  private rebuildRoomStatesAfterRemoval(removedIndex: number): void {
    console.log('[bunkerView] Rebuilding room states after removal')

    // Создаем новый Map с обновленными индексами
    const newRoomStates = new Map<number, any>()

    this.roomStates.forEach((state, index) => {
      if (index > removedIndex) {
        // Сдвигаем индексы вниз
        newRoomStates.set(index - 1, state)
      } else if (index < removedIndex) {
        // Оставляем без изменений
        newRoomStates.set(index, state)
      }
      // Пропускаем удаленный индекс
    })

    this.roomStates = newRoomStates

    // Обновляем roomIndex у всех агентов
    this.residentAgents.forEach(agent => {
      if (!agent || agent.roomIndex === undefined) return

      if (agent.roomIndex > removedIndex) {
        agent.roomIndex = agent.roomIndex - 1
      } else if (agent.roomIndex === removedIndex) {
        // Находим ближайшую комнату
        const newRoomIndex = this.findNearestAvailableRoom(agent.rect.x, agent.rect.y)
        agent.roomIndex = newRoomIndex || 0
      }
    })
  }

  private findNearestAvailableRoom(x: number, y: number): number | null {
    let nearestIndex: number | null = null
    let minDistance = Number.MAX_SAFE_INTEGER

    this.roomRects.forEach((rect, index) => {
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      const distance = Phaser.Math.Distance.Between(x, y, centerX, centerY)

      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = index
      }
    })

    return nearestIndex
  }

  private showRemoveConfirmation(roomIndex: number): void {
    const roomName = this.roomNames[roomIndex]
    console.log('[bunkerView] Showing remove confirmation for room:', roomName)

    // Создаем простое диалоговое окно подтверждения
    const dialogWidth = 300
    const dialogHeight = 120
    const dialogX = this.viewport.width / 2 - dialogWidth / 2
    const dialogY = this.viewport.height / 2 - dialogHeight / 2

    // Создаем контейнер для диалога
    const dialog = this.scene.add.container(dialogX, dialogY)
    dialog.setDepth(1000) // Поверх всего

    // Фон диалога
    const background = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x1a1d22, 0.95)
    background.setStrokeStyle(2, 0x4fc3f7, 1)
    background.setOrigin(0)

    // Заголовок
    const title = this.scene.add.text(dialogWidth / 2, 20, 'Подтверждение удаления', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '12px',
      color: '#ff5722',
      align: 'center'
    }).setOrigin(0.5)

    // Сообщение
    const message = this.scene.add.text(dialogWidth / 2, 45, `Удалить комнату "${roomName}"?`, {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: dialogWidth - 20 }
    }).setOrigin(0.5)

    // Кнопки
    const confirmButton = this.scene.add.text(dialogWidth / 2 - 50, 80, 'Да', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#ff5722',
      backgroundColor: '#2a2d35',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5)

    const cancelButton = this.scene.add.text(dialogWidth / 2 + 50, 80, 'Нет', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#4fc3f7',
      backgroundColor: '#2a2d35',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5)

    // Добавляем интерактивность
    confirmButton.setInteractive({ useHandCursor: true })
    cancelButton.setInteractive({ useHandCursor: true })

    // Обработчики кликов
    confirmButton.on('pointerdown', () => {
      console.log('[bunkerView] Confirmed room removal:', roomName)
      this.removeRoom(roomIndex)
      dialog.destroy()
    })

    cancelButton.on('pointerdown', () => {
      console.log('[bunkerView] Cancelled room removal:', roomName)
      dialog.destroy()
    })

    // Добавляем элементы в диалог
    dialog.add([background, title, message, confirmButton, cancelButton])

    // Сохраняем ссылку на диалог для возможного удаления
    this.currentDialog = dialog
  }

  private showToast(message: string): void {
    console.log('[bunkerView] Showing toast:', message)

    // Простое уведомление в углу экрана
    const toastY = this.viewport.height - 50
    const toast = this.scene.add.text(20, toastY, message, {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#ff9800',
      backgroundColor: '#1a1d22',
      padding: { x: 8, y: 4 }
    }).setOrigin(0)

    toast.setDepth(500)

    // Анимация исчезновения
    this.scene.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => toast.destroy()
    })
  }

  private createPeopleButton(): void {
    if (this.peopleButton) return // Уже создана
    
    const buttonSize = 32
    const margin = 16
    const spacing = 8
    
    this.peopleButton = this.scene.add.text(
      this.viewport.width - buttonSize * 2 - margin - spacing, 
      margin, 
      'ЛЮДИ', 
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '10px',
        color: '#8bc34a',
        backgroundColor: '#1a1d22',
        padding: { x: 6, y: 4 }
      }
    ).setOrigin(0.5)
    
    this.peopleButton.setInteractive({ useHandCursor: true })
    this.peopleButton.on('pointerdown', () => this.showResidentsList())
    
    // Добавляем кнопку к parent, чтобы она была поверх всего
    this.parent.add(this.peopleButton)
  }

  private openRoomSelectionModal(): void {
    // Вызываем HTML модальное окно через GameScene
    if (window.openRoomSelection) {
      window.openRoomSelection();
    }
  }

  public setSelectedRoomType(roomType: string): void {
    console.log('[bunkerView] setSelectedRoomType called with:', roomType);
    console.log('[bunkerView] Available room types:', this.availableRoomTypes);
    console.log('[bunkerView] Is room type valid?', this.availableRoomTypes.includes(roomType));
    
    // Сохраняем выбранный тип комнаты
    this.selectedRoomType = roomType;
    console.log('[bunkerView] selectedRoomType set to:', this.selectedRoomType);
    
    // Переводим в режим размещения комнаты
    this.isAddingRoom = true;
    console.log('[bunkerView] isAddingRoom set to:', this.isAddingRoom);
    
    // Показываем доступные позиции для размещения
    const availablePositions = this.findAvailablePositions(roomType);
    console.log('[bunkerView] Available positions found:', availablePositions.length);
    
    if (availablePositions.length > 0) {
      console.log('[bunkerView] Calling showAvailablePositions');
      this.showAvailablePositions(availablePositions, roomType);
    } else {
      console.log('[bunkerView] No available positions for room type:', roomType);
    }
  }

  private showResidentsList(): void {
    // Получаем список жителей из GameScene
    const gameScene = this.scene as any
    if (!gameScene.bunkerResidents) return
    
    const residents = gameScene.bunkerResidents
    
    // Создаем панель со списком
    this.createResidentsPanel(residents)
  }

  private createResidentsPanel(residents: any[]): void {
    // Удаляем предыдущую панель, если есть
    this.clearResidentsPanel()
    
    const panelW = Math.min(400, this.viewport.width * 0.8)
    const panelH = Math.min(500, this.viewport.height * 0.8)
    const panelX = (this.viewport.width - panelW) / 2
    const panelY = (this.viewport.height - panelH) / 2
    
    // Основная панель
    const panel = this.scene.add.container(panelX, panelY)
    panel.name = 'residentsPanel'
    
    // Фон панели
    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    bg.setStrokeStyle(2, 0x4fc3f7, 1)
    
    // Заголовок
    const title = this.scene.add.text(panelW / 2, 20, `ЖИТЕЛИ БУНКЕРА (${residents.length})`, {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '12px',
      color: '#4fc3f7',
      align: 'center'
    }).setOrigin(0.5, 0)
    
    // Кнопка закрытия
    const closeBtn = this.scene.add.text(panelW - 20, 20, 'X', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '12px',
      color: '#e57373',
      backgroundColor: '#1a1d22',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    
    closeBtn.on('pointerdown', () => this.clearResidentsPanel())
    
    panel.add([bg, title, closeBtn])
    
    // Список жителей
    let yPos = 60
    const itemHeight = 40
    const maxVisible = Math.floor((panelH - 80) / itemHeight)
    
    for (let i = 0; i < Math.min(residents.length, maxVisible); i++) {
      const resident = residents[i]
      const item = this.createResidentItem(resident, panelW - 20, yPos, i)
      panel.add(item)
      yPos += itemHeight
    }
    
    this.parent.add(panel)
  }

  private createResidentItem(resident: any, width: number, y: number, index: number): Phaser.GameObjects.Container {
    const item = this.scene.add.container(10, y)
    
    // Фон элемента
    const itemBg = this.scene.add.rectangle(0, 0, width, 35, 0x1a1d22, 0.8).setOrigin(0)
    itemBg.setStrokeStyle(1, 0x2a2d33, 0.8)
    
    // Текст
    const text = this.scene.add.text(8, 8, `${resident.name} • ${resident.profession}`, {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#e0e0e0'
    }).setOrigin(0, 0)
    
    // Делаем элемент интерактивным
    const hitArea = this.scene.add.rectangle(0, 0, width, 35, 0x000000, 0).setOrigin(0)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.on('pointerdown', () => this.showResidentDetails(resident))
    
    item.add([itemBg, text, hitArea])
    return item
  }

  private showResidentDetails(resident: any): void {
    // Создаем детальную панель для конкретного жителя
    this.clearResidentsPanel()
    
    const panelW = Math.min(350, this.viewport.width * 0.7)
    const panelH = Math.min(400, this.viewport.height * 0.7)
    const panelX = (this.viewport.width - panelW) / 2
    const panelY = (this.viewport.height - panelH) / 2
    
    const panel = this.scene.add.container(panelX, panelY)
    panel.name = 'residentsPanel'
    
    // Фон
    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.95).setOrigin(0)
    bg.setStrokeStyle(2, 0x4fc3f7, 1)
    
    // Заголовок
    const title = this.scene.add.text(panelW / 2, 20, resident.name.toUpperCase(), {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '14px',
      color: '#4fc3f7',
      align: 'center'
    }).setOrigin(0.5, 0)
    
    // Кнопка "Назад"
    const backBtn = this.scene.add.text(20, 20, '< НАЗАД', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#8bc34a',
      backgroundColor: '#1a1d22',
      padding: { x: 4, y: 2 }
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    
    backBtn.on('pointerdown', () => {
      this.clearResidentsPanel()
      const gameScene = this.scene as any
      this.createResidentsPanel(gameScene.bunkerResidents || [])
    })
    
    // Детали жителя
    const details = [
      `ВОЗРАСТ: ${resident.age}`,
      `ПОЛ: ${resident.gender}`,
      `ПРОФЕССИЯ: ${resident.profession}`,
      `ПРЕДМЕТЫ: ${resident.itemsText}`,
      ``,
      `НАВЫКИ:`
    ]
    
    resident.skills.forEach((skill: any) => {
      const color = skill.positive ? '#81c784' : '#e57373'
      details.push(`• ${skill.text}`)
    })
    
    const detailsText = this.scene.add.text(20, 60, details.join('\n'), {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      color: '#e0e0e0',
      wordWrap: { width: panelW - 40 },
      lineSpacing: 8
    }).setOrigin(0, 0)
    
    // Кнопка закрытия
    const closeBtn = this.scene.add.text(panelW - 20, 20, 'X', {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '12px',
      color: '#e57373',
      backgroundColor: '#1a1d22',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    
    closeBtn.on('pointerdown', () => this.clearResidentsPanel())
    
    panel.add([bg, title, backBtn, detailsText, closeBtn])
    this.parent.add(panel)
  }

  private clearResidentsPanel(): void {
    const existing = this.parent.list.find((obj: any) => obj.name === 'residentsPanel')
    if (existing) {
      existing.destroy()
    }
  }

  private showRoomSelectionMenu(): void {
    // Простое меню выбора типа комнаты
    const menuY = 60
    const items: Phaser.GameObjects.Text[] = []
    
    for (let i = 0; i < this.availableRoomTypes.length; i++) {
      const roomType = this.availableRoomTypes[i]
      const item = this.scene.add.text(
        this.viewport.width - 200, 
        menuY + i * 30, 
        roomType, 
        {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: '10px',
          color: '#e0e0e0',
          backgroundColor: '#2a2d33',
          padding: { x: 8, y: 4 }
        }
      ).setOrigin(0)
      
      item.setInteractive({ useHandCursor: true })
      item.on('pointerdown', () => {
        this.selectRoomTypeForPlacement(roomType)
        // Удаляем меню
        items.forEach(menuItem => menuItem.destroy())
      })
      
      this.parent.add(item)
      items.push(item)
    }
    
    // Кнопка отмены
    const cancelItem = this.scene.add.text(
      this.viewport.width - 200, 
      menuY + this.availableRoomTypes.length * 30, 
      'Отмена', 
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '10px',
        color: '#e57373',
        backgroundColor: '#2a2d33',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0)
    
    cancelItem.setInteractive({ useHandCursor: true })
    cancelItem.on('pointerdown', () => {
      items.forEach(menuItem => menuItem.destroy())
      cancelItem.destroy()
    })
    
    this.parent.add(cancelItem)
    items.push(cancelItem)
  }

  private selectRoomTypeForPlacement(roomType: string): void {
    // Включаем режим добавления комнаты
    this.isAddingRoom = true
    
    // Находим доступные места для размещения
    const availablePositions = this.findAvailablePositions(roomType)
    
    if (availablePositions.length === 0) {
      // Показываем сообщение об отсутствии места
      const message = this.scene.add.text(
        this.viewport.width / 2, 
        this.viewport.height / 2, 
        'Нет места для новой комнаты!', 
        {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: '12px',
          color: '#e57373',
          backgroundColor: '#1a1d22',
          padding: { x: 16, y: 8 }
        }
      ).setOrigin(0.5)
      
      this.parent.add(message)
      
      // Удаляем сообщение через 2 секунды
      this.scene.time.delayedCall(2000, () => {
        message.destroy()
      })
      
      this.isAddingRoom = false
      return
    }
    
    // Показываем доступные места
    this.showAvailablePositions(availablePositions, roomType)
  }

  private findAvailablePositions(roomType: string): Array<{x: number, y: number, roomWidth: number, roomHeight: number}> {
    const positions: Array<{x: number, y: number, roomWidth: number, roomHeight: number}> = []
    const gap = 4
    
    // Правильные размеры новой комнаты (берём из существующих комнат, исключая лифт)
    let newRoomWidth = 120
    let newRoomHeight = 90
    
    if (this.roomRects.length > 0) {
      // Берём размеры первой комнаты (она точно не лифт)
      newRoomWidth = this.roomRects[0].width
      newRoomHeight = this.roomRects[0].height
    }
    
    if (roomType === 'Лифт') {
      // Ограничение: всего не более 3 лифтов (включая стартовый)
      const totalLiftsNow = 1 + this.extraElevators.length
      if (totalLiftsNow >= 3) {
        return positions
      }
      // Размеры лифта
      const ew = Math.max(1, Math.floor(newRoomWidth / 3))
      const eh = newRoomHeight * 2
      // Разрешаем добавлять лифт ТОЛЬКО под существующим лифтом (стекование)
      const allLifts = [this.elevatorRect, ...this.extraElevators]
      for (const lift of allLifts) {
        const belowLift = { x: lift.x, y: lift.y + lift.height + gap, roomWidth: lift.width, roomHeight: eh }
        if (this.isLiftPositionValid(belowLift)) positions.push(belowLift)
      }
    } else {
      // Обычные комнаты: примыкание только справа к комнатам и к лифту (1/2 этаж)
      for (let i = 0; i < this.roomRects.length; i++) {
        const room = this.roomRects[i]
        const rightPos = { x: room.x + room.width + gap, y: room.y, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
        if (this.isPositionValid(rightPos)) positions.push(rightPos)
      }
      // Справа от основного лифта
      const elevatorRightPos = { x: this.elevatorRect.x + this.elevatorRect.width + gap, y: this.elevatorRect.y, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
      if (this.isPositionValid(elevatorRightPos)) positions.push(elevatorRightPos)
      // Справа от лифта на втором этаже
      const elevatorRightPos2 = { x: this.elevatorRect.x + this.elevatorRect.width + gap, y: this.elevatorRect.y + newRoomHeight + gap, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
      if (this.isPositionValid(elevatorRightPos2)) positions.push(elevatorRightPos2)
      // Слева от основного лифта (комната может примыкать к лифту слева)
      const elevatorLeftPos = { x: this.elevatorRect.x - gap - newRoomWidth, y: this.elevatorRect.y, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
      if (this.isPositionValid(elevatorLeftPos)) positions.push(elevatorLeftPos)
      const elevatorLeftPos2 = { x: this.elevatorRect.x - gap - newRoomWidth, y: this.elevatorRect.y + newRoomHeight + gap, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
      if (this.isPositionValid(elevatorLeftPos2)) positions.push(elevatorLeftPos2)
      // Справа от дополнительных лифтов (оба этажа)
      for (const lift of this.extraElevators) {
        const r1 = { x: lift.x + lift.width + gap, y: lift.y, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
        const r2 = { x: lift.x + lift.width + gap, y: lift.y + newRoomHeight + gap, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
        if (this.isPositionValid(r1)) positions.push(r1)
        if (this.isPositionValid(r2)) positions.push(r2)
        // Слева от дополнительного лифта (оба этажа)
        const l1 = { x: lift.x - gap - newRoomWidth, y: lift.y, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
        const l2 = { x: lift.x - gap - newRoomWidth, y: lift.y + newRoomHeight + gap, roomWidth: newRoomWidth, roomHeight: newRoomHeight }
        if (this.isPositionValid(l1)) positions.push(l1)
        if (this.isPositionValid(l2)) positions.push(l2)
      }
    }
    
    return positions
  }

  private isLiftPositionValid(pos: {x: number, y: number, roomWidth: number, roomHeight: number}): boolean {
    // Лифт не должен пересекаться ни с комнатами, ни с другими лифтами
    const newRect = new Phaser.Geom.Rectangle(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
    for (const roomRect of this.roomRects) {
      if (Phaser.Geom.Rectangle.Overlaps(newRect, roomRect)) return false
    }
    if (Phaser.Geom.Rectangle.Overlaps(newRect, this.elevatorRect)) return false
    for (const lift of this.extraElevators) {
      if (Phaser.Geom.Rectangle.Overlaps(newRect, lift)) return false
    }
    // Нельзя размещать левее входа
    const entranceIndex = this.roomNames.indexOf('Вход')
    if (entranceIndex >= 0) {
      const entrance = this.roomRects[entranceIndex]
      if (pos.x < entrance.x) return false
    }
    return true
  }

  private isPositionValid(pos: {x: number, y: number, roomWidth: number, roomHeight: number}): boolean {
    const newRect = new Phaser.Geom.Rectangle(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
    
    // Пересечение с комнатами — запрещаем
    for (const roomRect of this.roomRects) {
      if (Phaser.Geom.Rectangle.Overlaps(newRect, roomRect)) return false
    }
    // Пересечение с основным лифтом — запрещаем
    if (Phaser.Geom.Rectangle.Overlaps(newRect, this.elevatorRect)) return false
    // Пересечение с дополнительными лифтами — запрещаем
    for (const lift of this.extraElevators) {
      if (Phaser.Geom.Rectangle.Overlaps(newRect, lift)) return false
    }

    // Если рядом уже примыкает лифт к комнате, не предлагать место поверх лифта:
    // Для каждой комнаты проверяем, не перекрываем ли мы существующий лифт слева/справа на том же этаже
    for (const lift of [this.elevatorRect, ...this.extraElevators]) {
      if (Phaser.Geom.Rectangle.Overlaps(newRect, lift)) return false
    }

    // Не левее входа
    const entranceIndex = this.roomNames.indexOf('Вход')
    if (entranceIndex >= 0) {
      const entrance = this.roomRects[entranceIndex]
      if (pos.x < entrance.x) return false
    }
    // Ограничение расширения влево: только на одну комнату левее основного лифта
    const GAP_TOL = 4
    const leftLimit = this.elevatorRect.x - pos.roomWidth - GAP_TOL
    if (pos.x < leftLimit) return false
    return true
  }

  private showAvailablePositions(positions: Array<{x: number, y: number, roomWidth: number, roomHeight: number}>, roomType: string): void {
    const allIndicators: Phaser.GameObjects.GameObject[] = []
    
    // Показываем доступные позиции как полупрозрачные прямоугольники
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      
      const indicator = this.scene.add.graphics()
      indicator.fillStyle(0x4fc3f7, 0.3)
      indicator.fillRect(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
      indicator.lineStyle(2, 0x4fc3f7, 0.8)
      indicator.strokeRect(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
      
      // Добавляем номер позиции
      const numberLabel = this.scene.add.text(
        pos.x + pos.roomWidth / 2,
        pos.y + pos.roomHeight / 2,
        (i + 1).toString(),
        {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: '20px',
          color: '#4fc3f7'
        }
      ).setOrigin(0.5)
      
      // Делаем индикатор интерактивным
      const hitArea = this.scene.add.rectangle(
        pos.x + pos.roomWidth / 2,
        pos.y + pos.roomHeight / 2,
        pos.roomWidth,
        pos.roomHeight,
        0x000000,
        0.001
      )
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on('pointerdown', () => {
        this.placeNewRoom(pos, roomType)
        this.clearAllIndicators(allIndicators)
        this.clearCancelButton()
      })
      
      this.content.add([indicator, numberLabel, hitArea])
      allIndicators.push(indicator, numberLabel, hitArea)
    }
    
    // Добавляем кнопку отмены
    const cancelButton = this.scene.add.text(
      this.viewport.width / 2,
      this.viewport.height - 60,
      'ОТМЕНА',
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '12px',
        color: '#e57373',
        backgroundColor: '#1a1d22',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5)
    
    cancelButton.setInteractive({ useHandCursor: true })
    cancelButton.on('pointerdown', () => {
      this.isAddingRoom = false
      this.clearAllIndicators(allIndicators)
      cancelButton.destroy()
    })
    
    this.parent.add(cancelButton)
    
    // Добавляем инструкцию
    const instruction = this.scene.add.text(
      this.viewport.width / 2,
      this.viewport.height - 30,
      'Выберите место для размещения комнаты',
      {
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '10px',
        color: '#e0e0e0',
        backgroundColor: '#1a1d22',
        padding: { x: 8, y: 4 }
      }
    ).setOrigin(0.5)
    
    this.parent.add(instruction)
    allIndicators.push(instruction)
  }

  private getRoomScreenRect(index: number): { x: number; y: number; w: number; h: number } | null {
    const r = this.roomRects[index]
    if (!r) return null
    const mContent = this.content.getWorldTransformMatrix()
    const mRoot = this.root.getWorldTransformMatrix()
    const tlWorld = new Phaser.Math.Vector2(r.x, r.y)
    const brWorld = new Phaser.Math.Vector2(r.x + r.width, r.y + r.height)
    mContent.transformPoint(tlWorld.x, tlWorld.y, tlWorld)
    mContent.transformPoint(brWorld.x, brWorld.y, brWorld)
    const tlLocal = new Phaser.Math.Vector2()
    const brLocal = new Phaser.Math.Vector2()
    mRoot.applyInverse(tlWorld.x, tlWorld.y, tlLocal)
    mRoot.applyInverse(brWorld.x, brWorld.y, brLocal)
    return { x: tlLocal.x, y: tlLocal.y, w: Math.max(1, brLocal.x - tlLocal.x), h: Math.max(1, brLocal.y - tlLocal.y) }
  }

  private clearAllIndicators(indicators: Phaser.GameObjects.GameObject[]): void {
    indicators.forEach(obj => {
      if (obj.scene) {
        obj.destroy()
      }
    })
  }

  private clearCancelButton(): void {
    // Ищем и удаляем кнопку отмены
    const children = this.parent.list as Phaser.GameObjects.GameObject[]
    for (const child of children) {
      if (child instanceof Phaser.GameObjects.Text && child.text === 'ОТМЕНА') {
        child.destroy()
        break
      }
    }
  }

  private placeNewRoom(pos: {x: number, y: number, roomWidth: number, roomHeight: number}, roomType: string): void {
    // Добавляем новый объект в зависимости от типа
    if (roomType === 'Лифт') {
      // Для лифта используем размеры из рассчитанной позиции без дополнительного пересчёта
      const newLift = new Phaser.Geom.Rectangle(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
      this.extraElevators.push(newLift)
    } else {
      const newRect = new Phaser.Geom.Rectangle(pos.x, pos.y, pos.roomWidth, pos.roomHeight)
      this.roomRects.push(newRect)
      this.roomNames.push(roomType)
      
      // Инициализируем состояние для новой комнаты
      const roomIndex = this.roomRects.length - 1
      this.roomStates.set(roomIndex, this.createDefaultRoomState(roomType, roomIndex))
      
      // Пересчитываем распределение энергии после добавления комнаты
      this.updatePowerDistribution()
    }
    
    // Отключаем режим добавления
    this.isAddingRoom = false
    
    // Сохраняем текущую позицию и масштаб перед перерасчётом layout
    const currentX = this.content.x
    const currentY = this.content.y
    const currentScale = this.content.scale

    // НЕ вызываем layout при добавлении комнаты - это может изменить масштаб
    // Вместо этого просто обновляем UI элементы, которые зависят от количества комнат
    
    // Обновляем заголовки комнат без изменения масштаба
    this.updateLabels()
    
    // Обновляем затемнение для новой комнаты
    this.updateAllDarknessTransparency()
    
    console.log(`Добавлена комната: ${roomType} в позицию (${pos.x}, ${pos.y})`)

    // Показываем уведомление о добавлении комнаты
    this.showNotification(`Построена комната: ${roomType}`, 'success')

    // Сообщаем сцене, что структура бункера изменилась (вместимость/UI)
    try {
      const gameScene = this.scene as any
      if (gameScene && typeof gameScene.onBunkerChanged === 'function') {
        gameScene.onBunkerChanged()
      }
    } catch {}

    // Проверяем, была ли добавлена комната склада
    if (roomType === 'Склад') {
      this.notifyStorageRoomChange()
    }

    // Обновим UI ресурсов/вместимости в GameScene сразу после добавления комнаты
    try {
      (this.scene as any).updateResourcesText?.()
      ;(this.scene as any).onBunkerChanged?.()
    } catch {}
  }

  private toggleRoomDetailsPanel(index: number): void {
    // Проверяем режимы редактирования
    if (this.isRemovingRoom) {
      if (this.canRemoveRoom(index)) {
        this.showRemoveConfirmation(index)
      } else {
        console.log('[bunkerView] Cannot remove room:', this.roomNames[index])
        // Можно добавить уведомление пользователю
        this.showToast(`Невозможно удалить комнату "${this.roomNames[index]}"`)
      }
      return
    }

    if (this.isAddingRoom) {
      // В режиме добавления не показываем детали комнат
      return
    }

    const exists = this.detailsPanels.get(index)
    if (exists && exists.scene) {
      exists.destroy()
      this.detailsPanels.delete(index)
      return
    }
    const rect = this.roomRects[index]
    if (!rect) return
    const pad = 4
    const fontPx = this.computeRoomsFontSize(pad)
    const headerH = Math.max(16, Math.floor(fontPx + pad * 2))
    // Экранный прямоугольник комнаты
    const mContent = this.content.getWorldTransformMatrix()
    const mRoot = this.root.getWorldTransformMatrix()
    const tlWorld = new Phaser.Math.Vector2(rect.x, rect.y)
    const brWorld = new Phaser.Math.Vector2(rect.x + rect.width, rect.y + rect.height)
    mContent.transformPoint(tlWorld.x, tlWorld.y, tlWorld)
    mContent.transformPoint(brWorld.x, brWorld.y, brWorld)
    const tlLocal = new Phaser.Math.Vector2()
    const brLocal = new Phaser.Math.Vector2()
    mRoot.applyInverse(tlWorld.x, tlWorld.y, tlLocal)
    mRoot.applyInverse(brWorld.x, brWorld.y, brLocal)
    const scrX = tlLocal.x
    const scrY = tlLocal.y
    const scrW = Math.max(1, brLocal.x - tlLocal.x)
    const panelW = Math.min(200, Math.max(140, scrW * 0.7))
    const panelX = scrX + scrW - panelW - pad
    const panelY = scrY + headerH
    const panelH = Math.max(48, (brLocal.y - tlLocal.y) - headerH - pad)
    const container = this.scene.add.container(panelX, panelY)
    ;(container as any).name = 'detailsPanel'
    // Стиль окна: пиксельная рамка, тёмный фон, маленький заголовок
    const bg = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0e1116, 0.92).setOrigin(0)
    bg.setStrokeStyle(2, 0x263238, 1)
    const border = this.scene.add.rectangle(0, 0, panelW - 4, panelH - 4, 0x000000, 0).setOrigin(0)
    border.setStrokeStyle(1, 0x4fc3f7, 0.9)
    const baseInfo = this.generateRoomDetailsText(index)
    // Подбираем компактный размер шрифта под размеры панели
    let infoFont = Math.min(10, Math.floor(panelH * 0.22))
    const minInfoFont = 6
    let text = this.scene.add.text(pad, pad, baseInfo, {
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: `${infoFont}px`,
      color: '#e0e0e0',
      wordWrap: { width: panelW - pad * 2, useAdvancedWrap: true },
      align: 'left'
    }).setOrigin(0)
    while (infoFont > minInfoFont) {
      const b = text.getBounds()
      if (b.width <= panelW - pad * 2 && b.height <= panelH - pad * 2) break
      infoFont -= 1
      text.setStyle({ fontSize: `${infoFont}px` })
    }
    container.add([bg, border, text])
    this.overlay.add(container)
    this.detailsPanels.set(index, container)
  }

  private closeAllDetails(): void {
    this.detailsPanels.forEach((c) => { if (c.scene) c.destroy() })
    this.detailsPanels.clear()
  }
  
  /**
   * Очищает все эффекты затемнения
   */
  private clearAllDarknessEffects(): void {
    const count = this.roomDarknessOverlays.size
    console.log(`[Darkness] Очистка всех эффектов затемнения, было: ${count}`)
    
    this.roomDarknessOverlays.forEach((overlay, roomIndex) => {
      if (overlay && overlay.scene) {
        console.log(`[Darkness] Удаляем эффект затемнения для комнаты ${roomIndex}`)
        overlay.destroy()
      }
    })
    this.roomDarknessOverlays.clear()
    
    console.log(`[Darkness] Очистка завершена`)
  }

  // === Room States API ===
  
  /**
   * Создает дефолтное состояние для комнаты
   */
  private createDefaultRoomState(roomName: string, roomIndex?: number): RoomState {
    const isEntrance = roomName === 'Вход'
    const isStarter = roomIndex !== undefined ? this.isStarterRoom(roomIndex) : false
    const isPowerStation = roomName === 'Станция'
    
    // Определяем должна ли комната иметь питание по умолчанию
    // Только стартовые комнаты имеют питание изначально
    // Станции получат питание после пересчета системы
    const shouldHavePower = isStarter
    
    const state = {
      accessible: true,
      destructible: !isEntrance, // Вход нельзя разрушить
      powered: shouldHavePower,   // Только стартовые комнаты имеют питание изначально
      lit: shouldHavePower,       // Только стартовые комнаты имеют свет изначально
      onFire: false,
      flooded: false,
      dangerous: false,
      workable: true, // Будет пересчитан ниже
      eventStates: new Set<string>()
    }
    // Вычисляем workable на основе других флагов
    state.workable = this.calculateWorkableState(state, roomName)
    return state
  }
  
  /**
   * Вычисляет возможность работы в комнате на основе состояний
   */
  private calculateWorkableState(state: RoomState, roomName: string): boolean {
    const isEntrance = roomName === 'Вход'
    
    // Для входа всегда можно работать (особая логика)
    if (isEntrance) {
      return true
    }
    
    // Проверяем все условия, при которых работа невозможна
    if (!state.accessible) return false  // Нет доступа
    if (!state.lit) return false         // Нет света
    if (!state.powered) return false     // Нет энергии
    if (state.onFire) return false       // Пожар
    if (state.flooded) return false      // Потоп
    if (state.dangerous) return false    // Опасность
    
    return true // Можно работать
  }
  
  /**
   * Проверяет, является ли комната стартовой (не требует электростанцию)
   * Стартовыми считаются только первые 4 комнаты по индексу (0, 1, 2, 3)
   */
  private isStarterRoom(roomIndex: number): boolean {
    return roomIndex < 4
  }
  
  /**
   * Подсчитывает количество электростанций в бункере
   */
  private countPowerStations(): number {
    return this.roomNames.filter(name => name === 'Станция').length
  }
  
  /**
   * Подсчитывает количество новых комнат (не стартовых)
   */
  private countNewRooms(): number {
    return this.roomNames.filter((name, index) => !this.isStarterRoom(index) && name !== 'Станция').length
  }
  
  /**
   * Вычисляет максимальное количество комнат, которые могут иметь питание
   */
  private calculateMaxPoweredRooms(): number {
    const powerStations = this.countPowerStations()
    // Каждая электростанция питает себя + 3 новые комнаты
    return powerStations * 4
  }
  
  /**
   * Определяет должна ли комната иметь энергию и свет на основе системы электростанций
   */
  private shouldRoomHavePower(roomIndex: number): boolean {
    const roomName = this.roomNames[roomIndex]
    
    // Стартовые комнаты всегда имеют питание
    if (this.isStarterRoom(roomIndex)) {
      return true
    }
    
    // Электростанции всегда питают себя
    if (roomName === 'Станция') {
      return true
    }
    
    // Для новых комнат проверяем доступность мощности
    const powerStations = this.countPowerStations()
    const maxPoweredRooms = powerStations * 4 // станции + 3 новые комнаты каждая
    
    // Получаем список всех новых комнат и электростанций (исключая стартовые)
    const newRoomsAndStations: number[] = []
    for (let i = 0; i < this.roomNames.length; i++) {
      if (!this.isStarterRoom(i)) {
        newRoomsAndStations.push(i)
      }
    }
    
    // Сортируем по индексу (порядок строительства) - сначала построенные получают питание
    newRoomsAndStations.sort((a, b) => a - b)
    
    // Проверяем попадает ли текущая комната в лимит питания
    const indexInNewRooms = newRoomsAndStations.indexOf(roomIndex)
    return indexInNewRooms !== -1 && indexInNewRooms < maxPoweredRooms
  }
  
  /**
   * Обновляет энергию и свет всех комнат на основе системы электростанций
   */
  private updatePowerDistribution(): void {
    console.log('[Power System] Пересчет распределения энергии...')
    
    const powerStations = this.countPowerStations()
    const newRooms = this.countNewRooms()
    const maxPoweredRooms = this.calculateMaxPoweredRooms()
    
    console.log(`[Power System] Электростанций: ${powerStations}, Новых комнат: ${newRooms}, Макс. питаемых: ${maxPoweredRooms}`)
    console.log(`[Power System] Комнаты в бункере:`, this.roomNames)
    
    // Проходим по всем комнатам и обновляем их энергию/свет
    for (let i = 0; i < this.roomNames.length; i++) {
      const roomName = this.roomNames[i]
      const currentState = this.roomStates.get(i) || this.createDefaultRoomState(roomName, i)
      
      // Определяем должна ли комната иметь питание
      const shouldHavePower = this.shouldRoomHavePower(i)
      
      console.log(`[Power System] Комната "${roomName}" (${i}): стартовая=${this.isStarterRoom(i)}, станция=${roomName === 'Станция'}, должна_иметь_питание=${shouldHavePower}, текущее=${currentState.powered}`)
      
      // Обновляем состояние только если оно изменилось
      if (currentState.powered !== shouldHavePower || currentState.lit !== shouldHavePower) {
        console.log(`[Power System] ИЗМЕНЕНИЕ: Комната "${roomName}" (${i}): питание ${currentState.powered} -> ${shouldHavePower}`)
        
        // Обновляем состояние (через API чтобы сработали все механизмы)
        this.setRoomState(i, { 
          powered: shouldHavePower, 
          lit: shouldHavePower 
        })
      }
    }
    
    console.log('[Power System] Пересчет завершен')
  }
  
  /**
   * Получает состояние комнаты по индексу
   */
  public getRoomState(roomIndex: number): RoomState | null {
    return this.roomStates.get(roomIndex) || null
  }
  
  /**
   * Устанавливает состояние комнаты с проверкой ограничений
   */
  public setRoomState(roomIndex: number, state: Partial<RoomState>): boolean {
    if (roomIndex < 0 || roomIndex >= this.roomNames.length) {
      return false
    }
    
    const roomName = this.roomNames[roomIndex]
    const isEntrance = roomName === 'Вход'
    const currentState = this.roomStates.get(roomIndex) || this.createDefaultRoomState(roomName, roomIndex)
    
    // Проверяем ограничения для комнаты "Вход"
    if (isEntrance) {
      // Для входа можно изменить dangerous, и энергию/свет через систему электростанций
      const newState: RoomState = {
        accessible: currentState.accessible, // Нельзя изменить
        destructible: currentState.destructible, // Нельзя изменить  
        powered: state.powered !== undefined ? state.powered : currentState.powered, // Можно изменить для системы электростанций
        lit: state.lit !== undefined ? state.lit : currentState.lit, // Можно изменить для системы электростанций
        onFire: currentState.onFire, // Нельзя изменить
        flooded: currentState.flooded, // Нельзя изменить
        dangerous: state.dangerous !== undefined ? state.dangerous : currentState.dangerous, // Можно изменить
        workable: true, // Будет пересчитан ниже
        eventStates: currentState.eventStates // Нельзя изменить
      }
      // Пересчитываем workable для входа (всегда true)
      newState.workable = this.calculateWorkableState(newState, roomName)
      this.roomStates.set(roomIndex, newState)
    } else {
      // Для остальных комнат можно изменять все флаги (кроме workable - он вычисляется)
      const newState: RoomState = {
        accessible: state.accessible !== undefined ? state.accessible : currentState.accessible,
        destructible: state.destructible !== undefined ? state.destructible : currentState.destructible,
        powered: state.powered !== undefined ? state.powered : currentState.powered,
        lit: state.lit !== undefined ? state.lit : currentState.lit,
        onFire: state.onFire !== undefined ? state.onFire : currentState.onFire,
        flooded: state.flooded !== undefined ? state.flooded : currentState.flooded,
        dangerous: state.dangerous !== undefined ? state.dangerous : currentState.dangerous,
        workable: true, // Будет пересчитан ниже
        eventStates: state.eventStates !== undefined ? new Set(state.eventStates) : currentState.eventStates
      }
      // Пересчитываем workable на основе других флагов
      newState.workable = this.calculateWorkableState(newState, roomName)
      this.roomStates.set(roomIndex, newState)
    }
    
    // Можно добавить визуальные эффекты в зависимости от состояния
    this.updateRoomVisuals(roomIndex)
    
    return true
  }
  
  /**
   * Добавляет состояние события к комнате
   */
  public addRoomEventState(roomIndex: number, eventKey: string): boolean {
    const roomName = this.roomNames[roomIndex]
    if (roomName === 'Вход') {
      return false // Нельзя добавлять события к входу
    }
    
    const state = this.roomStates.get(roomIndex) || this.createDefaultRoomState(roomName)
    state.eventStates.add(eventKey)
    this.roomStates.set(roomIndex, state)
    this.updateRoomVisuals(roomIndex)
    return true
  }
  
  /**
   * Удаляет состояние события из комнаты
   */
  public removeRoomEventState(roomIndex: number, eventKey: string): boolean {
    const state = this.roomStates.get(roomIndex)
    if (!state) return false
    
    const result = state.eventStates.delete(eventKey)
    if (result) {
      this.updateRoomVisuals(roomIndex)
    }
    return result
  }
  
  /**
   * Проверяет есть ли состояние события у комнаты
   */
  public hasRoomEventState(roomIndex: number, eventKey: string): boolean {
    const state = this.roomStates.get(roomIndex)
    return state ? state.eventStates.has(eventKey) : false
  }
  
  /**
   * Получает индекс комнаты по имени
   */
  public getRoomIndexByName(roomName: string): number {
    return this.roomNames.indexOf(roomName)
  }

  // Функция для показа уведомлений через HTML
  private showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (typeof window !== 'undefined' && (window as any).addGameNotification) {
      // Получаем текущий день из GameScene
      let currentDay = 1
      try {
        if (this.scene && (this.scene as any).dayNumber) {
          currentDay = (this.scene as any).dayNumber
        }
      } catch (error) {
        console.warn('[bunkerView] Could not get current day:', error)
      }
      
      (window as any).addGameNotification(message, type, currentDay)
    }
  }
  
  /**
   * Получает состояние комнаты по имени
   */
  public getRoomStateByName(roomName: string): RoomState | null {
    const index = this.getRoomIndexByName(roomName)
    return index >= 0 ? this.getRoomState(index) : null
  }
  
  /**
   * Устанавливает состояние комнаты по имени
   */
  public setRoomStateByName(roomName: string, state: Partial<RoomState>): boolean {
    const index = this.getRoomIndexByName(roomName)
    return index >= 0 ? this.setRoomState(index, state) : false
  }
  
  /**
   * Добавляет состояние события к комнате по имени
   */
  public addRoomEventStateByName(roomName: string, eventKey: string): boolean {
    const index = this.getRoomIndexByName(roomName)
    return index >= 0 ? this.addRoomEventState(index, eventKey) : false
  }
  
  /**
   * Удаляет состояние события из комнаты по имени
   */
  public removeRoomEventStateByName(roomName: string, eventKey: string): boolean {
    const index = this.getRoomIndexByName(roomName)
    return index >= 0 ? this.removeRoomEventState(index, eventKey) : false
  }
  
  /**
   * Проверяет есть ли состояние события у комнаты по имени
   */
  public hasRoomEventStateByName(roomName: string, eventKey: string): boolean {
    const index = this.getRoomIndexByName(roomName)
    return index >= 0 ? this.hasRoomEventState(index, eventKey) : false
  }
  
  /**
   * Генерирует текст с детальной информацией о комнате
   */
  private generateRoomDetailsText(roomIndex: number): string {
    const roomName = this.roomNames[roomIndex] || 'Неизвестно'
    const state = this.roomStates.get(roomIndex)
    
    if (!state) {
      return `Комната: ${roomName}\nИнформация недоступна`
    }
    
    let info = `Комната: ${roomName}\n`
    
    // Основные состояния
    info += `\n=== СОСТОЯНИЕ ===\n`
    info += `Доступ: ${state.accessible ? '✓ Есть' : '✗ Нет'}\n`
    info += `Энергия: ${state.powered ? '✓ Есть' : '✗ Нет'}\n`
    info += `Свет: ${state.lit ? '✓ Есть' : '✗ Нет'}\n`
    info += `Работоспособна: ${state.workable ? '✓ Да' : '✗ Нет'}\n`
    info += `Разрушаемая: ${state.destructible ? '✓ Да' : '✗ Нет'}\n`
    
    // Чрезвычайные ситуации
    const hasEmergency = state.onFire || state.flooded || state.dangerous
    if (hasEmergency) {
      info += `\n=== ОПАСНОСТЬ ===\n`
      if (state.onFire) info += `🔥 ПОЖАР!\n`
      if (state.flooded) info += `💧 ПОТОП!\n`
      if (state.dangerous) info += `⚠️ ОПАСНО!\n`
    }
    
    // События
    if (state.eventStates.size > 0) {
      info += `\n=== СОБЫТИЯ ===\n`
      const events = Array.from(state.eventStates)
      events.forEach(event => {
        info += `• ${event}\n`
      })
    }
    
    // Общее состояние
    const overallStatus = this.getRoomOverallStatus(state)
    info += `\n=== ИТОГ ===\n`
    info += `Статус: ${overallStatus}`
    
    return info
  }
  
  /**
   * Определяет общий статус комнаты на основе состояний
   */
  private getRoomOverallStatus(state: RoomState): string {
    if (state.onFire) return '🔥 КРИТИЧНО'
    if (state.flooded) return '💧 КРИТИЧНО'
    if (state.dangerous) return '⚠️ ОПАСНО'
    if (!state.accessible) return '🚫 НЕДОСТУПНА'
    if (!state.workable) return '🚧 НЕ РАБОТАЕТ'
    if (!state.powered) return '⚡ БЕЗ ЭНЕРГИИ'
    if (!state.lit) return '🌑 БЕЗ СВЕТА'
    if (state.eventStates.size > 0) return '📋 СОБЫТИЯ'
    return '✅ В НОРМЕ'
  }
  
  /**
   * Генерирует строку иконок для состояния комнаты
   */
  private generateRoomStatusIcons(state: RoomState): string {
    let icons = ''
    
    // Доступность
    icons += state.accessible ? '🚪' : '🚫'
    
    // Работоспособность
    icons += state.workable ? '⚙️' : '🚧'
    
    // Свет
    icons += state.lit ? '💡' : '🌑'
    
    // Энергия
    icons += state.powered ? '⚡' : '🔌'
    
    // Опасность
    icons += state.dangerous ? '⚠️' : '✅'
    
    return icons
  }

  /**
   * Обновляет визуальные эффекты комнаты в зависимости от состояния
   */
  private updateRoomVisuals(roomIndex: number): void {
    const state = this.roomStates.get(roomIndex)
    if (!state || roomIndex >= this.roomRects.length) return
    
    // Обновляем панель деталей если она открыта для этой комнаты
    this.updateRoomDetailsPanel(roomIndex)
    
    // Обновляем эффект затемнения
    this.updateRoomDarknessEffect(roomIndex, state)
    
    // Обновляем лейблы комнат с иконками состояния
    this.updateLabels()
    
    // Логирование изменений состояния
    console.log(`[Room ${roomIndex} (${this.roomNames[roomIndex]})] State updated:`, {
      accessible: state.accessible,
      destructible: state.destructible,
      powered: state.powered,
      lit: state.lit,
      onFire: state.onFire,
      flooded: state.flooded,
      dangerous: state.dangerous,
      workable: state.workable,
      events: Array.from(state.eventStates)
    })
  }
  
  /**
   * Обновляет эффект затемнения комнаты
   */
  private updateRoomDarknessEffect(roomIndex: number, state: RoomState): void {
    const rect = this.roomRects[roomIndex]
    if (!rect) return
    
    const shouldBeDark = !state.lit
    const existingOverlay = this.roomDarknessOverlays.get(roomIndex)
    
    console.log(`[Darkness] Комната ${this.roomNames[roomIndex]} (${roomIndex}): lit=${state.lit}, shouldBeDark=${shouldBeDark}, hasOverlay=${!!existingOverlay}`)
    
    if (shouldBeDark) {
      if (!existingOverlay || !existingOverlay.scene) {
        // Создаем новый прямоугольник затемнения
        const overlay = this.scene.add.rectangle(
          rect.x, rect.y, rect.width, rect.height, 0x000000, 1.0
        ).setOrigin(0)
        
        // Устанавливаем специальное имя чтобы не удалялся при перерисовке
        ;(overlay as any).name = 'darkness'
        
        // Устанавливаем прозрачность в зависимости от режима просмотра
        const isFocused = this.mode === 'focus' && this.focusedIndex === roomIndex
        overlay.setAlpha(isFocused ? 0.6 : 1.0) // Полупрозрачный в фокусе, непрозрачный в обзоре
        
        // Добавляем в отдельный контейнер для затемнения (поверх персонажей)
        this.darknessContainer.add(overlay)
        
        // Высокий z-index чтобы перекрыть персонажей
        overlay.setDepth(1000)
        
        // Сохраняем ссылку
        this.roomDarknessOverlays.set(roomIndex, overlay)
        
        console.log(`[Darkness] СОЗДАН эффект затемнения для комнаты ${roomIndex}, depth=${overlay.depth}, в darknessContainer=${overlay.parentContainer === this.darknessContainer}, alpha=${overlay.alpha}`)
      } else {
        // Обновляем позицию, размер и прозрачность существующего оверлея
        existingOverlay.setPosition(rect.x, rect.y)
        existingOverlay.setDisplaySize(rect.width, rect.height)
        existingOverlay.setDepth(1000)  // Принудительно обновляем depth
        
        const isFocused = this.mode === 'focus' && this.focusedIndex === roomIndex
        existingOverlay.setAlpha(isFocused ? 0.6 : 1.0)
        
        console.log(`[Darkness] ОБНОВЛЕН эффект затемнения для комнаты ${roomIndex}, depth=${existingOverlay.depth}, в darknessContainer=${existingOverlay.parentContainer === this.darknessContainer}, alpha=${existingOverlay.alpha}`)
      }
    } else {
      if (existingOverlay && existingOverlay.scene) {
        // Удаляем эффект затемнения
        existingOverlay.destroy()
        this.roomDarknessOverlays.delete(roomIndex)
        console.log(`[Darkness] Удален эффект затемнения для комнаты ${roomIndex}`)
      }
    }
  }
  
  /**
   * Обновляет текст в панели деталей комнаты если она открыта
   */
  private updateRoomDetailsPanel(roomIndex: number): void {
    const panel = this.detailsPanels.get(roomIndex)
    if (!panel || !panel.scene) return
    
    // Ищем текстовый объект в панели деталей
    const textObj = panel.list.find(child => child instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text
    if (textObj) {
      const newInfo = this.generateRoomDetailsText(roomIndex)
      textObj.setText(newInfo)
    }
  }
  
  /**
   * Обновляет прозрачность всех эффектов затемнения
   */
  private updateAllDarknessTransparency(): void {
    console.log(`[Darkness] Обновление прозрачности, режим: ${this.mode}, фокус: ${this.focusedIndex}, оверлеев: ${this.roomDarknessOverlays.size}`)
    this.roomDarknessOverlays.forEach((overlay, roomIndex) => {
      if (overlay && overlay.scene) {
        const isFocused = this.mode === 'focus' && this.focusedIndex === roomIndex
        const newAlpha = isFocused ? 0.6 : 1.0
        console.log(`[Darkness] Комната ${roomIndex}: фокус=${isFocused}, alpha=${newAlpha}`)
        overlay.setAlpha(newAlpha)
      } else {
        console.log(`[Darkness] Комната ${roomIndex}: оверлей отсутствует или удален`)
      }
    })
  }
  
  /**
   * Пересоздает все эффекты затемнения после перерисовки
   */
  private refreshAllDarknessEffects(): void {
    console.log(`[Darkness] Пересоздание всех эффектов затемнения, комнат: ${this.roomNames.length}`)
    
    // Проходим по всем комнатам и обновляем затемнение
    for (let i = 0; i < this.roomNames.length; i++) {
      const state = this.roomStates.get(i)
      if (state) {
        console.log(`[Darkness] Обрабатываем комнату ${i} (${this.roomNames[i]}): lit=${state.lit}`)
        this.updateRoomDarknessEffect(i, state)
      }
    }
    
    console.log(`[Darkness] Итого активных эффектов затемнения: ${this.roomDarknessOverlays.size}`)
  }

  // === Residents API ===
  
  // Генерирует уникальный ID для врага, избегая конфликтов с жителями
  private generateUniqueEnemyId(): number {
    // Начинаем с большого числа, чтобы избежать конфликтов с ID жителей
    let newId = 1000
    
    // Проверяем, не занят ли ID
    while (this.residentAgents.some(agent => agent && agent.id === newId)) {
      newId++
    }
    
    return newId
  }
  
  public syncResidents(expectedCount: number): void {
    console.log(`[bunkerView] syncResidents НАЧАЛО: ожидается=${expectedCount}, текущее время=${Date.now()}`)
    
    // Вызываем основную логику синхронизации
    this.syncResidentsInternal(expectedCount, false)
  }

  public syncResidentsWithoutDuplicates(expectedCount: number): void {
    console.log(`[bunkerView] syncResidentsWithoutDuplicates НАЧАЛО: ожидается=${expectedCount}, предотвращаем дубликаты, текущее время=${Date.now()}`)
    
    // Вызываем основную логику синхронизации с флагом предотвращения дубликатов
    this.syncResidentsInternal(expectedCount, true)
  }

  private syncResidentsInternal(expectedCount: number, preventDuplicates: boolean): void {
    console.log(`[bunkerView] syncResidentsInternal: ожидается=${expectedCount}, preventDuplicates=${preventDuplicates}, текущее время=${Date.now()}`)

    // Получаем объединенный массив жителей и врагов
      const game: any = this.scene
    
    // СИНХРОНИЗАЦИЯ: синхронизируем здоровье между game.bunkerEnemies и residentAgents
    if (game.bunkerEnemies) {
      // Сначала собираем всех живых врагов-агентов для быстрого поиска
      const liveEnemyAgents = new Map()
      for (const agent of this.residentAgents) {
        if (agent && agent.isEnemy && (agent.health || 0) > 0) {
          liveEnemyAgents.set(agent.id, agent)
        }
      }

      // Собираем всех мертвых врагов-агентов для быстрого поиска
      const deadEnemyAgents = new Map()
      for (const agent of this.residentAgents) {
        if (agent && agent.isEnemy && (agent.health || 0) <= 0) {
          deadEnemyAgents.set(agent.id, agent)
        }
      }

      // Обрабатываем каждый враг в game.bunkerEnemies
      for (const gameEnemy of game.bunkerEnemies) {
        if (gameEnemy) {
          const liveAgent = liveEnemyAgents.get(gameEnemy.id)
          const deadAgent = deadEnemyAgents.get(gameEnemy.id)

          if (liveAgent) {
            // Враг живой - синхронизируем здоровье
            gameEnemy.health = liveAgent.health || 0
            console.log(`[bunkerView] Синхронизировали живого врага ${gameEnemy.enemyType} (ID: ${gameEnemy.id}), здоровье: ${gameEnemy.health}`)
          } else if (deadAgent) {
            // Враг мертвый - помечаем как мертвого в game.bunkerEnemies
            gameEnemy.health = 0
            console.log(`[bunkerView] Помечаем мертвого врага в game.bunkerEnemies: ${gameEnemy.enemyType} (ID: ${gameEnemy.id})`)
        } else {
            // Врага нет среди агентов - это новый враг, оставляем как есть
            console.log(`[bunkerView] Новый враг в game.bunkerEnemies: ${gameEnemy.enemyType} (ID: ${gameEnemy.id}), здоровье: ${gameEnemy.health}`)
          }
        }
      }

      console.log(`[bunkerView] Синхронизация завершена, в game.bunkerEnemies: ${game.bunkerEnemies.length} врагов`)
    }

    // ПОЛНОЕ ОЧИЩЕНИЕ: обновляем game.bunkerEnemies и получаем только новых живых врагов
    let livingEnemies = []
    if (game.bunkerEnemies) {
      // Фильтруем только живых врагов без дубликатов
      const seenEnemyIds = new Set()
      const uniqueLivingEnemies = []

      for (const enemy of game.bunkerEnemies) {
        if (enemy && (enemy.health || 0) > 0 && !seenEnemyIds.has(enemy.id)) {
          seenEnemyIds.add(enemy.id)
          uniqueLivingEnemies.push(enemy)
        } else if (enemy && (enemy.health || 0) <= 0) {
          console.log(`[bunkerView] Исключаем мертвого врага ${enemy.enemyType} (ID: ${enemy.id}) из обработки`)
        }
      }

      // ОБЯЗАТЕЛЬНО обновляем оригинальный массив!
      game.bunkerEnemies = uniqueLivingEnemies

      // Фильтруем только врагов, которых нет как агентов
      const existingEnemyIds = new Set()
      this.residentAgents.forEach(agent => {
        if (agent && agent.isEnemy && (agent.health || 0) > 0) {
          existingEnemyIds.add(agent.id)
        }
      })

      livingEnemies = uniqueLivingEnemies.filter((enemy: any) => !existingEnemyIds.has(enemy.id))

      console.log(`[bunkerView] Очистили game.bunkerEnemies: было ${game.bunkerEnemies.length} врагов, уникальных живых: ${uniqueLivingEnemies.length}, новых: ${livingEnemies.length}`)
    }
    
    // Получаем живых жителей
    const livingResidents = (game.bunkerResidents || []).filter((resident: any) => resident && resident.health > 0)

    // Получаем существующих врагов из bunkerEnemies (не только новых)
    const existingEnemies = (game.bunkerEnemies || []).filter((enemy: any) => enemy && enemy.health > 0)
    
    // Объединяем живых жителей и всех живых врагов
    const allUnits = [...livingResidents, ...existingEnemies]
    const livingUnits = allUnits.filter(unit => unit && unit.health > 0)

    // Проверяем соответствие ожиданиям
    const currentAgentCount = this.residentAgents.length
    const expectedTotalUnits = livingUnits.length

    console.log(`[bunkerView] syncResidents: ожидается=${expectedCount}, живых жителей=${livingResidents.length}, существующих врагов=${existingEnemies.length}, текущих агентов=${currentAgentCount}, ожидается всего=${expectedTotalUnits}`)

    if (expectedCount !== expectedTotalUnits) {
      console.log(`[bunkerView] ВНИМАНИЕ: несоответствие в подсчете! Ожидалось ${expectedCount}, будет ${expectedTotalUnits} агентов`)
      
      // Если ожидается меньше чем есть, это может быть ошибка - не удаляем живых врагов
      if (expectedCount < expectedTotalUnits) {
        console.warn(`[bunkerView] ПРЕДУПРЕЖДЕНИЕ: Ожидается ${expectedCount} агентов, но есть ${expectedTotalUnits} живых юнитов. Возможно, это ошибка в подсчете.`)
      }
    }
    
    // Очищаем существующих агентов, которые больше не нужны
    for (let i = this.residentAgents.length - 1; i >= 0; i--) {
      const agent = this.residentAgents[i]
      if (agent) {
        if (agent.isEnemy) {
          // Для врагов: удаляем только если они мертвы
          if ((agent.health || 0) <= 0) {
            console.log(`[bunkerView] Удаляем мертвого врага: ID=${agent.id}, тип=${agent.enemyType}`)
            // Очищаем графические объекты напрямую
            if (agent.rect) agent.rect.destroy()
            if (agent.sprite) agent.sprite.destroy()
            if (agent.healthBar) agent.healthBar.destroy()
            // Очищаем таймер атаки если есть
            if ((agent as any).attackTimer) {
              clearTimeout((agent as any).attackTimer)
              ;(agent as any).attackTimer = null
            }
            this.residentAgents.splice(i, 1)
          } else {
            // Враг жив - НЕ удаляем его!
            console.log(`[bunkerView] Враг ${agent.enemyType} (ID: ${agent.id}) жив (здоровье: ${agent.health}), сохраняем`)
          }
        } else {
          // Для жителей: проверяем, существует ли в живых юнитах
          const stillExists = livingUnits.some(unit => !unit.isEnemy && unit.id === agent.id)
          if (!stillExists) {
            console.log(`[bunkerView] Удаляем несуществующего жителя: ID=${agent.id}, тип=${agent.profession}`)
            // Очищаем графические объекты напрямую
            if (agent.rect) agent.rect.destroy()
            if (agent.sprite) agent.sprite.destroy()
            if (agent.shirt) agent.shirt.destroy()
            if (agent.pants) agent.pants.destroy()
            if (agent.footwear) agent.footwear.destroy()
            if (agent.hair) agent.hair.destroy()
            if (agent.healthBar) agent.healthBar.destroy()
            // Очищаем таймер атаки если есть
            if ((agent as any).attackTimer) {
              clearTimeout((agent as any).attackTimer)
              ;(agent as any).attackTimer = null
            }
            this.residentAgents.splice(i, 1)
          }
        }
      }
    }
    
            // Создаем агентов только для живых юнитов
    for (let i = 0; i < livingUnits.length; i++) {
      const res = livingUnits[i]

      // Для жителей проверяем, не существует ли уже агент
      if (!res.isEnemy) {
        const existingAgent = this.residentAgents.find(a => a && !a.isEnemy && a.id === res.id)
        if (existingAgent) {
          // Обновляем данные существующего агента
          console.log(`[bunkerView] Обновляем данные агента для жителя ${res.profession} (ID: ${res.id})`)
          ;(existingAgent as any).intent = res.intent
          ;(existingAgent as any).insane = res.insane

          // Если житель стал безумным, устанавливаем агрессивность
          if (res.intent === 'hostile' && !existingAgent.isAggressive) {
            existingAgent.isAggressive = true
            existingAgent.isCoward = false // Безумие преодолевает трусость
            console.log(`[bunkerView] Житель ${res.profession} (ID: ${res.id}) стал безумным - устанавливаем агрессивность`)

            // Немедленно проверяем боевой статус для активации безумного жителя
            setTimeout(() => {
              this.checkCombatStatus()
            }, 100)
          }

          // Если житель выздоровел, снимаем агрессивность
          if (res.intent !== 'hostile' && (existingAgent as any).intent === 'hostile') {
            ;(existingAgent as any).intent = res.intent
            if (!existingAgent.profession || !['солдат', 'охотник', 'разведчик'].includes(existingAgent.profession)) {
              existingAgent.isAggressive = false
            }
            console.log(`[bunkerView] Житель ${res.profession} (ID: ${res.id}) выздоровел - снимаем агрессивность`)
          }

          // ВАЖНО: НЕ создаем нового агента для существующего жителя
          continue
        }
      } else {
        // Для врагов проверяем, не существует ли уже агент с таким же ID
        const existingEnemyAgent = this.residentAgents.find(a =>
          a && a.isEnemy && a.id === res.id
        )
        if (existingEnemyAgent) {
          console.log(`[bunkerView] Агент для врага ${res.enemyType} (ID: ${res.id}) уже существует, пропускаем создание`)
          continue
        }
      }
      
      // Дополнительная проверка для предотвращения дубликатов жителей
      if (preventDuplicates && !res.isEnemy) {
        const existingAgent = this.residentAgents.find(a => a && !a.isEnemy && a.id === res.id)
        if (existingAgent) {
          console.log(`[bunkerView] ПРЕДОТВРАЩАЕМ создание дубликата жителя ${res.profession} (ID: ${res.id}) - агент уже существует`)
          continue
        }
      }
      
      // Дополнительная проверка: не создаем агентов для жителей, которые уже имеют агентов
      if (!res.isEnemy) {
        const existingAgent = this.residentAgents.find(a => a && !a.isEnemy && a.id === res.id)
        if (existingAgent) {
          console.log(`[bunkerView] Житель ${res.profession} (ID: ${res.id}) уже имеет агента, пропускаем создание`)
          continue
        }
      }
      
      // Дополнительная проверка: не создаем агентов для жителей с одинаковыми ID
      if (!res.isEnemy) {
        const duplicateAgent = this.residentAgents.find(a => a && !a.isEnemy && a.id === res.id)
        if (duplicateAgent) {
          console.log(`[bunkerView] ОШИБКА: Дубликат жителя ${res.profession} (ID: ${res.id}) уже существует! Пропускаем создание`)
          continue
        }
      }
      
      console.log(`[bunkerView] Создаем агента для ${res.isEnemy ? 'врага' : 'жителя'}: ${res.isEnemy ? res.enemyType : res.profession} (ID: ${res.id})`)
      
      const rect = this.scene.add.rectangle(0, 0, 28, 36, 0x000000, 0).setOrigin(0.5, 1)
      rect.setStrokeStyle(2, 0x00ff00, 1.0)
      rect.setVisible(true)
      rect.setDepth(50)  // рамка отладки под спрайтами
      ;(rect as any).name = 'resident'
      this.content.add(rect)
      
      const gender = res.gender ?? (Math.random() < 0.5 ? 'М' : 'Ж')
      const skinKey = pickSkinForGender(gender, res.id ?? i + 1)
      const profession = res.profession?.toLowerCase() ?? ''
      
      let sprite = undefined
      let shirt = undefined
      let pants = undefined
      let footwear = undefined
      let hair = undefined
      
      // Специальная логика для врагов
      if (res.isEnemy) {
        console.log(`[bunkerView] Создаем агента-врага: тип=${res.enemyType}, marauderKind=${res.marauderKind}, zombieKind=${res.zombieKind}, mutantKind=${res.mutantKind}`)
        console.log(`[DEBUG] Враг ${res.enemyType} (ID: ${res.id}) будет создан как агент`)
        
        // Проверяем, не существует ли уже агент для этого врага
        const existingEnemyAgent = this.residentAgents.find(a => a && a.isEnemy && a.id === res.id)
        if (existingEnemyAgent) {
          console.log(`[bunkerView] Агент для врага ${res.enemyType} (ID: ${res.id}) уже существует, пропускаем создание`)
          continue
        }
        
        let enemySpriteKey = null
        let animationKey = null
        
        if (res.enemyType === 'МАРОДЕР') {
          const kind = res.marauderKind || 1
          enemySpriteKey = `raider${kind}_idle`
          animationKey = `r${kind}_idle`
          console.log(`[bunkerView] Мародер: kind=${kind}, enemySpriteKey=${enemySpriteKey}, animationKey=${animationKey}`)
          // Убеждаемся что анимации мародеров созданы
          const gameScene = this.scene as any
          if (gameScene.ensureMarauderAnimations) {
            gameScene.ensureMarauderAnimations()
          }
        } else if (res.enemyType === 'ЗОМБИ') {
          const kind = res.zombieKind || 'wild'
          enemySpriteKey = `zombie_${kind}_idle`
          animationKey = `z_${kind}_idle`
          console.log(`[bunkerView] Зомби: kind=${kind}, enemySpriteKey=${enemySpriteKey}, animationKey=${animationKey}`)
          // Убеждаемся что анимации зомби созданы
          const gameScene = this.scene as any
          if (gameScene.ensureZombieAnimations) {
            gameScene.ensureZombieAnimations()
          }
        } else if (res.enemyType === 'МУТАНТ') {
          const k = res.mutantKind || 1
          enemySpriteKey = `mutant${k}_idle`
          animationKey = `m${k}_idle`
          // Убеждаемся что анимации мутантов созданы
          const gameScene = this.scene as any
          if (gameScene.ensureMutantAnimations) {
            gameScene.ensureMutantAnimations()
          }
        } else if (res.enemyType === 'СОЛДАТ') {
          enemySpriteKey = 'soldier_idle'
          animationKey = 'sold_idle'
          // Убеждаемся что анимации солдат созданы
          const gameScene = this.scene as any
          if (gameScene.ensureSoldierAnimations) {
            gameScene.ensureSoldierAnimations()
          }
        }
        
        if (enemySpriteKey && animationKey) {
          // Проверяем что текстура существует
          if (this.scene.textures.exists(enemySpriteKey)) {
            sprite = this.scene.add.sprite(0, 0, enemySpriteKey, 0).setOrigin(0.5, 1)
            ;(sprite as any).name = 'enemy'
            sprite.setDepth(100)
            // Масштабируем спрайт врага
            const scaleX = (28 / 128) * 2.25
            const scaleY = (36 / 128) * 2.25
            sprite.setScale(scaleX, scaleY)
            try {
              sprite.anims.play(animationKey)
            } catch (e) {
              console.warn(`[bunkerView] Не удалось воспроизвести анимацию ${animationKey} для врага:`, e)
            }
            this.content.add(sprite)
            console.log(`[bunkerView] Спрайт врага добавлен в content: тип=${res.enemyType}, в контейнере=${this.content.list.includes(sprite)}`)
            // Скрываем рамку когда показываем спрайт врага
            rect.setVisible(false)
          } else {
            console.warn(`[bunkerView] Текстура ${enemySpriteKey} не найдена для врага ${res.enemyType}`)
            // Показываем рамку если нет спрайта
            rect.setVisible(true)
          }
        } else {
          console.warn(`[bunkerView] Не удалось определить спрайт для врага ${res.enemyType}`)
          // Показываем рамку если нет спрайта
          rect.setVisible(true)
        }
      } else {
        // Обычная логика для жителей
        const specialistSpriteKey = getSpecialistSpriteKey(profession)
        
        if (specialistSpriteKey) {
          // Создаем спрайт для специализации
          ensureSpecialistAnimations(this.scene, profession)
          sprite = this.scene.add.sprite(0, 0, specialistSpriteKey, 0).setOrigin(0.5, 1)
      ;(sprite as any).name = 'resident'
          // Устанавливаем правильный depth для спрайта специалиста
          sprite.setDepth(100)  // кожа
          // Масштабируем спрайт 128x128 под размер рамки (28x36)
          const scaleX = (28 / 128) * 2.25  // 2.25 - это масштаб который был для старых спрайтов
          const scaleY = (36 / 128) * 2.25
          sprite.setScale(scaleX, scaleY)
          sprite.anims.play(`${profession}_idle`)
      this.content.add(sprite)
          // Скрываем рамку когда показываем спрайт
          rect.setVisible(false)
        }
      }
      const agent = {
        id: res.id, // Всегда используем оригинальный ID для сохранения связи
        rect, sprite, shirt, pants, footwear, hair, skinKey,
        profession: res.profession,
        skills: res.skills ?? [],
        workAtNight: (res.skills ?? []).some((s: any) => s.text === 'сова'),
        intent: res.intent, // Поведение из GameScene
        insane: res.insane, // Статус безумия
        isEnemy: res.isEnemy,
        enemyType: res.enemyType,
        marauderKind: res.marauderKind,
        zombieKind: res.zombieKind,
        mutantKind: res.mutantKind,
        health: 100, // Базовое здоровье
        enemyTargetId: undefined,
        lastAttackTime: undefined,
        lastTargetReconsiderTime: undefined, // Время последнего пересмотра цели
        animLock: null,
        scheduleState: 'work' as 'sleep' | 'work' | 'rest',
        assignedRoomIndex: undefined,
        assignedSlotIndex: undefined,
        stayInRoomName: undefined,
        settled: false,
        path: undefined,
        target: undefined,
        dwellUntil: undefined,
        goingToRest: false,
        roomIndex: undefined
      } as {
        id?: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; skinKey: string;
        profession?: string; skills?: Array<{ text: string; positive: boolean }>; workAtNight?: boolean; isLazyToday?: boolean; working?: boolean; away?: boolean; target?: Phaser.Math.Vector2; roomIndex?: number; sleeping?: boolean; path?: Phaser.Math.Vector2[]; dwellUntil?: number; goingToRest?: boolean; stayInRoomName?: string; settled?: boolean; assignedRoomIndex?: number; assignedSlotIndex?: number; assignedRole?: 'chemist' | 'scientist'; schedType?: 'normal' | 'owl' | 'insomnia'; insomniaOffsetHour?: number; scheduleState?: 'sleep' | 'work' | 'rest';
        isEnemy?: boolean; enemyType?: string; marauderKind?: number; zombieKind?: string; mutantKind?: number; health?: number; lastAttackTime?: number; lastTargetReconsiderTime?: number; enemyTargetId?: number; animLock?: 'work' | 'sleep' | 'walk' | 'idle' | 'attack' | 'hurt' | 'dead' | null
      }

      // Добавляем обработчики drag n drop для жителей
      if (!agent.isEnemy && (agent.sprite || agent.rect)) {
        const interactiveSprite = agent.sprite || agent.rect

        interactiveSprite.setInteractive({ useHandCursor: true })

        interactiveSprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          // Проверяем, что это не двойной клик и не паннинг
          if (this.recentlyFinishedPanning) return

          // Запускаем таймер для определения долгого нажатия
          this.dragStartTime = Date.now()

          // Через 300мс начинаем перетаскивание (теперь работает для всех жителей, включая движущихся)
          setTimeout(() => {
            if (!this.isDraggingResident && Date.now() - this.dragStartTime >= 300) {
              this.startResidentDrag(agent, pointer)
            }
          }, 300)
        })

        interactiveSprite.on('pointerup', () => {
          // Отменяем перетаскивание если оно не началось
          this.dragStartTime = 0
        })
      }
      
      // Инициализация здоровья в зависимости от профессии и навыков
      if (agent.isEnemy) {
        // Враги имеют базовое здоровье
        agent.health = 80
      } else {
        // Жители: базовое здоровье + бонусы от профессии и навыков
        let baseHealth = 100
        
        // Бонусы от профессии
        if (agent.profession === 'солдат' || agent.profession === 'охотник') {
          baseHealth += 50 // +50 HP для солдат и охотников
        }
        
        // Бонусы от навыков
        const skills = agent.skills || []
        if (skills.some((s: { text: string; positive: boolean }) => s.text === 'герой')) {
          baseHealth += 20 // +20 HP для героев
        }
        if (skills.some(s => s.text === 'трус')) {
          baseHealth -= 30 // -30 HP для трусов
        }
        
        agent.health = baseHealth
        console.log(`[bunkerView] Агент ${agent.profession} (ID: ${agent.id}) создан с здоровьем: ${agent.health}`)
      }
      // Этап 1: химик сразу стремится в лабораторию и стоит там
      if (agent.profession === 'химик') {
        agent.stayInRoomName = 'Лаборатория'
        agent.settled = false
      }
      if (agent.profession === 'ученый') {
        agent.stayInRoomName = 'Лаборатория'
        agent.settled = false
      }
      // Тип расписания
      const hasOwl = (agent.skills || []).some((s: any) => s.text === 'сова')
      const hasInsomnia = (agent.skills || []).some((s: any) => s.text === 'бессонница')
      agent.schedType = hasInsomnia ? 'insomnia' : (hasOwl ? 'owl' : 'normal')
      if (agent.schedType === 'insomnia') agent.insomniaOffsetHour = Phaser.Math.Between(0, 23)
      this.residentAgents.push(agent)
      // Проверяем состояние спрайта после создания агента
      if (agent.sprite && agent.isEnemy) {
        console.log(`[bunkerView] Агент врага создан: idx=${i}, спрайт в content=${this.content.list.includes(agent.sprite)}, parentContainer=${agent.sprite.parentContainer?.name || 'none'}`)
      }
      
      // Позиционируем агента в комнате "Вход"
      this.assignRandomPosition(agent)
      
      // Если есть целевая комната для стояния (химик) — сразу сбросим цель, чтобы начать движение
      if (agent.stayInRoomName) { agent.target = undefined; agent.path = [] }
      
      // Отрисовываем шкалу здоровья для агента
      this.drawHealthBar(agent)
      
      // Инициализируем боевые параметры для жителей
      if (!agent.isEnemy) {
        this.initializeCombatStats(agent)
        
        // Проверяем, есть ли враги в бункере - если да, то новый житель должен перейти в боевой режим
        const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
        if (enemies.length > 0) {
          console.log(`[DEBUG] Новый житель ${agent.profession} (ID: ${agent.id}) обнаружен в бункере с врагами - переводим в боевой режим`)
          
          // Если житель агрессивный, он сразу ищет врагов
          if ((agent as any).isAggressive) {
            // Агрессивные жители ищут врагов по всему бункеру
            const targetEnemy = enemies[0] // Берем первого врага
            ;(agent as any).combatTarget = targetEnemy.id
            console.log(`[DEBUG] Агрессивный житель ${agent.profession} (ID: ${agent.id}) выбрал цель: враг ${targetEnemy.enemyType} (ID: ${targetEnemy.id})`)
          } else {
            // Обычные жители проверяют, есть ли враги в той же комнате
            const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
            const enemyInRoom = enemies.find(e => {
              const enemyRoom = this.findRoomIndexAt(e.rect.x, e.rect.y)
              return agentRoom === enemyRoom
            })
            
            if (enemyInRoom) {
              ;(agent as any).combatTarget = enemyInRoom.id
              console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) обнаружен врага в той же комнате - выбирает цель: ${enemyInRoom.enemyType} (ID: ${enemyInRoom.id})`)
            }
          }
          
          // Если есть цель для атаки, устанавливаем боевое состояние
          if ((agent as any).combatTarget) {
            agent.animLock = 'attack'
            console.log(`[DEBUG] Новый житель ${agent.profession} (ID: ${agent.id}) переведен в боевой режим с целью ${(agent as any).combatTarget}`)
          }
        } else if ((agent as any).isAggressive && (agent as any).intent === 'hostile' && !agent.isEnemy) {
          // Безумные жители ищут другие цели (других жителей)
          const otherResidents = this.residentAgents.filter(a =>
            a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0
          )

          if (otherResidents.length > 0) {
            // Выбираем случайного жителя в качестве цели
            const targetResident = otherResidents[Math.floor(Math.random() * otherResidents.length)]
            ;(agent as any).combatTarget = targetResident.id
            agent.animLock = 'attack'
            console.log(`[DEBUG] Безумный житель ${agent.profession} (ID: ${agent.id}) выбрал цель: житель ${targetResident.profession} (ID: ${targetResident.id})`)
          }
        }
      }
    }
    // Удаляем лишних агентов, если их больше чем ожидается
    // НО НЕ удаляем врагов без причины - они должны жить до своей смерти
    while (this.residentAgents.length > expectedTotalUnits) {
      const a = this.residentAgents.pop()!
      
      // НЕ удаляем врагов с обычными ID - они должны жить до своей смерти
      if (a.isEnemy) {
        console.warn(`[bunkerView] syncResidents пытается удалить врага ${a.enemyType} (ID: ${a.id}) - это ошибка! Возвращаем обратно`)
        this.residentAgents.push(a) // Возвращаем врага обратно
        break // Прерываем цикл удаления
      }
      
      console.log(`[bunkerView] Удаляем лишнего жителя ${a.profession} (ID: ${a.id}) - превышен лимит агентов`)
      
      // Очищаем графические объекты
      if (a.rect) a.rect.destroy()
      if (a.sprite) a.sprite.destroy()
      if (a.shirt) a.shirt?.destroy()
      if (a.pants) a.pants?.destroy()
      if (a.footwear) a.footwear?.destroy()
      if (a.hair) a.hair?.destroy()
      if (a.healthBar) a.healthBar.destroy()
      
      // Очищаем таймер атаки если есть
      if ((a as any).attackTimer) {
        clearTimeout((a as any).attackTimer)
        ;(a as any).attackTimer = null
      }
    }
    this.residentAgents.forEach(a => {
      // Устанавливаем правильный depth для новых персонажей
      if (a.sprite) {
        a.sprite.setDepth(100)  // кожа
      }
      if (a.shirt) a.shirt.setDepth(200)      // верх
      if (a.hair) a.hair.setDepth(300)        // волосы
      if (a.footwear) a.footwear.setDepth(400) // ботинки
      if (a.pants) a.pants.setDepth(500)      // низ
      a.rect.setDepth(50)                     // рамка отладки
    })
    
    // Логируем итоговое состояние после синхронизации
    const totalAgents = this.residentAgents.length
    const totalEnemies = this.residentAgents.filter(a => a && a.isEnemy).length
    const totalResidents = this.residentAgents.filter(a => a && !a.isEnemy).length
    console.log(`[DEBUG] syncResidents завершен: всего агентов=${totalAgents}, врагов=${totalEnemies}, жителей=${totalResidents}`)

    // Проверка дубликатов только для врагов по ID (простая версия)
    const enemyIds = new Set()
    for (let i = this.residentAgents.length - 1; i >= 0; i--) {
      const agent = this.residentAgents[i]
      if (agent && agent.isEnemy) {
        if (enemyIds.has(agent.id)) {
          console.log(`[bunkerView] Найден дубликат врага ${agent.enemyType} (ID: ${agent.id}), удаляем`)

          // Удаляем графические объекты
          if (agent.rect) agent.rect.destroy()
          if (agent.sprite) agent.sprite.destroy()
          if (agent.healthBar) agent.healthBar.destroy()

          // Удаляем из массива
          this.residentAgents.splice(i, 1)
        } else {
          enemyIds.add(agent.id)
        }
      }
    }
    
    // Проверяем состояние спрайтов врагов
    this.residentAgents.filter(a => a && a.isEnemy).forEach(enemy => {
      // console.log(`[DEBUG] Враг ${enemy.enemyType} (ID: ${enemy.id}) после syncResidents: sprite=${!!enemy.sprite}, sprite.anims=${!!enemy.sprite?.anims}`)
    })
    
    // Принудительная проверка: все жители должны замечать врагов после синхронизации
    const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
    if (enemies.length > 0) {
      console.log(`[bunkerView] После syncResidents обнаружено ${enemies.length} врагов - принудительно проверяем всех жителей`)
      
      for (const agent of this.residentAgents) {
        if (!agent || agent.isEnemy || (agent as any).away) continue
        
        // Пропускаем жителей, которые уже в боевом режиме
        if (agent.animLock === 'attack' || (agent as any).combatTarget) continue
        
        // Пропускаем трусов
        if ((agent as any).isCoward) continue
        
        // Принудительно проверяем обнаружение врагов
        this.checkEnemyDetectionInRoom(agent)
      }
    }

    console.log(`[bunkerView] syncResidentsInternal КОНЕЦ: создано агентов=${this.residentAgents.length}, время=${Date.now()}`)
  }



  private assignRandomPosition(agent: { rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; roomIndex?: number; target?: Phaser.Math.Vector2; path?: Phaser.Math.Vector2[]; dwellUntil?: number; goingToRest?: boolean }): void {
    if (this.roomRects.length === 0) return
    // Стартовая позиция: всегда комната "Вход"
    let entranceIdx = this.roomNames.indexOf('Вход')
    if (entranceIdx < 0) entranceIdx = 0
    agent.roomIndex = entranceIdx
    const r = this.roomRects[entranceIdx]
    const margin = 4
    const tx = Phaser.Math.RND.between(r.x + margin, r.x + r.width - margin)
    const ty = r.y + r.height - margin
    agent.target = new Phaser.Math.Vector2(tx, ty)
    agent.rect.setPosition(tx, ty)
    // Позиционируем спрайт если есть
    agent.sprite?.setPosition(tx, ty)
    agent.path = []
    agent.dwellUntil = undefined
  }

  private pickNewTarget(agent: { rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; roomIndex?: number; target?: Phaser.Math.Vector2; path?: Phaser.Math.Vector2[]; dwellUntil?: number; goingToRest?: boolean }): void {
    if (this.roomRects.length === 0) return
    // 70% — перемещение в пределах текущего этажа по горизонтали, 30% — смена этажа через лифт
    const wantOtherFloor = Math.random() < 0.3
    let destIndex = Phaser.Math.RND.between(0, this.roomRects.length - 1)
    // Избегаем выбора лифтов по имени и избегаем той же комнаты
    for (let guard = 0; guard < 20; guard++) {
      const nm = this.roomNames[destIndex] || ''
      if (!/лиф/gi.test(nm) && !/elev/i.test(nm) && destIndex !== agent.roomIndex) break
      destIndex = Phaser.Math.RND.between(0, this.roomRects.length - 1)
    }
    if (agent.roomIndex == null) agent.roomIndex = destIndex

    const dstRoom = this.roomRects[destIndex]
    const margin = 4
    const dstPoint = new Phaser.Math.Vector2(
      Phaser.Math.RND.between(dstRoom.x + margin, dstRoom.x + dstRoom.width - margin),
      dstRoom.y + dstRoom.height - margin
    )

    this.buildPathTo(agent, destIndex, dstPoint, wantOtherFloor)
  }

  private buildPathTo(agent: { rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; roomIndex?: number; target?: Phaser.Math.Vector2; path?: Phaser.Math.Vector2[] }, destIndex: number, dstPoint: Phaser.Math.Vector2, forceElevator: boolean): void {
    // Определяем текущую комнату по фактической позиции
    let curIndex = -1
    for (let i = 0; i < this.roomRects.length; i++) {
      if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) { curIndex = i; break }
    }
    if (curIndex < 0) {
      // Агент находится вне комнаты. Проверим, насколько далеко он находится от ближайшей комнаты
      const nearestRoomIndex = this.findNearestRoomForAgent(agent)
      if (nearestRoomIndex >= 0) {
        const nearestRoom = this.roomRects[nearestRoomIndex]
        const roomCenterX = nearestRoom.x + nearestRoom.width / 2
        const roomCenterY = nearestRoom.y + nearestRoom.height / 2
        const distanceToRoom = Math.sqrt(
          Math.pow(agent.rect.x - roomCenterX, 2) + Math.pow(agent.rect.y - roomCenterY, 2)
        )

        // Если агент находится слишком далеко от любой комнаты (> 100 пикселей), перемещаем его
        // НО только если он НЕ на поверхности (поверхность имеет свою логику движения)
        const isOnSurface = (agent as any).onSurface === true
        if (distanceToRoom > 100 && !isOnSurface) {
          const margin = 8
          agent.rect.x = nearestRoom.x + nearestRoom.width / 2
          agent.rect.y = nearestRoom.y + nearestRoom.height - margin

          if (agent.sprite) {
            agent.sprite.x = agent.rect.x
            agent.sprite.y = agent.rect.y
          }

          agent.roomIndex = nearestRoomIndex
          curIndex = nearestRoomIndex

          console.log(`[buildPathTo] Агент ${(agent as any).profession || 'враг'} (ID: ${(agent as any).id}) слишком далеко от комнат, перемещаем в комнату ${nearestRoomIndex}`)
        } else if (isOnSurface) {
          console.log(`[buildPathTo] Агент ${(agent as any).profession || 'враг'} (ID: ${(agent as any).id}) находится на поверхности, пропускаем перемещение в комнату`)
        } else {
          // Агент недалеко от комнаты, вероятно просто переходит между комнатами
          // Используем ближайшую комнату как текущую
          curIndex = nearestRoomIndex
          agent.roomIndex = nearestRoomIndex
        }
      } else {
        curIndex = agent.roomIndex ?? destIndex
      }
    }
    // Защита для жителей на поверхности - они не должны иметь комнаты
    if ((agent as any).onSurface === true) {
      console.log(`[buildPathTo] Житель ${(agent as any).profession} на поверхности - отменяем построение пути`)
      agent.path = undefined
      return
    }

    const curRoom = this.roomRects[curIndex]
    const dstRoom = this.roomRects[destIndex]
    const margin = 4

    agent.path = []

    const GAP_TOL = 6
    const floorY = (r: Phaser.Geom.Rectangle) => r.y + r.height - margin
    const sameFloor = Math.abs(curRoom.y - dstRoom.y) < 1e-3

    const roomsAreAdjacent = (a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): boolean => {
      if (Math.abs(a.y - b.y) > 1e-3) return false
      const rightToLeft = Math.abs((a.x + a.width) - b.x) <= GAP_TOL
      const leftToRight = Math.abs((b.x + b.width) - a.x) <= GAP_TOL
      return rightToLeft || leftToRight
    }

    // Вычисляем шаг между этажами по уникальным Y комнат
    const floorYs = Array.from(new Set(this.roomRects.map(rr => rr.y))).sort((a, b) => a - b)
    let floorStep = 0
    for (let i = 1; i < floorYs.length; i++) {
      const d = floorYs[i] - floorYs[i - 1]
      if (d > 0) { floorStep = floorStep === 0 ? d : Math.min(floorStep, d) }
    }

    const buildHorizontalChain = (fromIdx: number, toIdx: number): number[] | null => {
      const from = this.roomRects[fromIdx]
      const to = this.roomRects[toIdx]
      if (Math.abs(from.y - to.y) > 1e-3) return null
      // BFS по комнатам одного этажа
      const sameY = from.y
      const adj: number[][] = this.roomRects.map(() => [])
      for (let i = 0; i < this.roomRects.length; i++) {
        const a = this.roomRects[i]
        if (Math.abs(a.y - sameY) > 1e-3) continue
        for (let j = 0; j < this.roomRects.length; j++) {
          if (i === j) continue
          const b = this.roomRects[j]
          if (Math.abs(b.y - sameY) > 1e-3) continue
          if (roomsAreAdjacent(a, b)) adj[i].push(j)
        }
      }
      const queue: number[] = [fromIdx]
      const prev = new Map<number, number>()
      const seen = new Set<number>([fromIdx])
      while (queue.length) {
        const v = queue.shift()!
        if (v === toIdx) break
        for (const u of adj[v]) {
          if (seen.has(u)) continue
          seen.add(u)
          prev.set(u, v)
          queue.push(u)
        }
      }
      if (!seen.has(toIdx)) return null
      const path: number[] = []
      let cur = toIdx
      while (cur !== undefined) {
        path.push(cur)
        const p = prev.get(cur)
        if (p == null) break
        cur = p
      }
      path.reverse()
      return path
    }

    const isAdjacentToElevatorFor = (r: Phaser.Geom.Rectangle, lift: Phaser.Geom.Rectangle): { adjacent: boolean; doorX: number } => {
      const leftEdge = r.x
      const rightEdge = r.x + r.width
      const elevLeft = lift.x
      const elevRight = lift.x + lift.width
      // Примыкание по X с допуском
      const xTouchRight = Math.abs(rightEdge - elevLeft) <= GAP_TOL
      const xTouchLeft = Math.abs(leftEdge - elevRight) <= GAP_TOL
      if (!xTouchRight && !xTouchLeft) return { adjacent: false, doorX: rightEdge }
      // По Y: верхняя грань комнаты должна лежать в вертикальном диапазоне лифта (с допуском)
      const yOk = (r.y >= lift.y - GAP_TOL) && (r.y <= lift.y + lift.height - GAP_TOL)
      if (!yOk) return { adjacent: false, doorX: rightEdge }
      if (xTouchRight) {
        return { adjacent: true, doorX: rightEdge }
      }
      return { adjacent: true, doorX: leftEdge }
    }

    const chainToPoints = (chain: number[], targetPoint: Phaser.Math.Vector2): Phaser.Math.Vector2[] => {
      const pts: Phaser.Math.Vector2[] = []
      if (chain.length === 0) return pts
      const y = floorY(this.roomRects[chain[0]])
      for (let k = 0; k < chain.length - 1; k++) {
        const a = this.roomRects[chain[k]]
        const b = this.roomRects[chain[k + 1]]
        // граница между комнатами
        const borderX = (b.x > a.x) ? (a.x + a.width) : a.x
        pts.push(new Phaser.Math.Vector2(borderX, y))
      }
      // Внутрь целевой комнаты по X
      pts.push(new Phaser.Math.Vector2(targetPoint.x, y))
      if (Math.abs(targetPoint.y - y) > 0.1) pts.push(new Phaser.Math.Vector2(targetPoint.x, targetPoint.y))
      return pts
    }

    let pathPoints: Phaser.Math.Vector2[] = []

    if (!forceElevator && sameFloor) {
      const chain = buildHorizontalChain(curIndex, destIndex)
      if (chain) {
        pathPoints = chainToPoints(chain, dstPoint)
      }
    }

    // Группируем лифты по "шахтам" (одинаковый X-диапазон с допуском)
    const shafts: Array<{ centerX: number; segments: Phaser.Geom.Rectangle[] }> = []
    const allLiftSegs: Phaser.Geom.Rectangle[] = [this.elevatorRect, ...this.extraElevators]
    for (const seg of allLiftSegs) {
      let placed = false
      for (const shaft of shafts) {
        const any = shaft.segments[0]
        if (Math.abs(any.x - seg.x) <= GAP_TOL && Math.abs((any.x + any.width) - (seg.x + seg.width)) <= GAP_TOL) {
          shaft.segments.push(seg)
          placed = true
          break
        }
      }
      if (!placed) shafts.push({ centerX: seg.x + Math.floor(seg.width / 2), segments: [seg] })
    }

    const attemptPerShaft = (shaft: { centerX: number; segments: Phaser.Geom.Rectangle[] }): Phaser.Math.Vector2[] | null => {
      const curY = floorY(curRoom)
      const dstY = floorY(dstRoom)
      // Найти соответствующие сегменты шахты по вертикальному перекрытию с этажом комнаты
      const curSeg = shaft.segments.find(s => (curRoom.y >= s.y - GAP_TOL) && (curRoom.y <= s.y + s.height - GAP_TOL))
      const dstSeg = shaft.segments.find(s => (dstRoom.y >= s.y - GAP_TOL) && (dstRoom.y <= s.y + s.height - GAP_TOL))
      if (!curSeg || !dstSeg) return null
      // Комнаты, примыкающие к этим сегментам
      const curAdj: number[] = []
      for (let i = 0; i < this.roomRects.length; i++) {
        const r = this.roomRects[i]
        if (!((r.y >= curSeg.y - GAP_TOL) && (r.y <= curSeg.y + curSeg.height - GAP_TOL))) continue
        if (isAdjacentToElevatorFor(r, curSeg).adjacent) curAdj.push(i)
      }
      const dstAdj: number[] = []
      for (let i = 0; i < this.roomRects.length; i++) {
        const r = this.roomRects[i]
        if (!((r.y >= dstSeg.y - GAP_TOL) && (r.y <= dstSeg.y + dstSeg.height - GAP_TOL))) continue
        if (isAdjacentToElevatorFor(r, dstSeg).adjacent) dstAdj.push(i)
      }
      // Цепочка до любой комнаты у лифта на текущем этаже
      let toLiftChain: number[] | null = null
      let bestIdx: number | null = null
      for (const idx of curAdj) {
        const ch = buildHorizontalChain(curIndex, idx)
        if (ch) { toLiftChain = ch; bestIdx = idx; break }
      }
      if (!toLiftChain) {
        if (isAdjacentToElevatorFor(curRoom, curSeg).adjacent) { toLiftChain = [curIndex]; bestIdx = curIndex }
      }
      // Цепочка от лифта до целевой комнаты
      let fromLiftChain: number[] | null = null
      for (const idx of dstAdj) {
        const ch = buildHorizontalChain(idx, destIndex)
        if (ch) { fromLiftChain = ch; break }
      }
      if (!fromLiftChain) {
        if (isAdjacentToElevatorFor(dstRoom, dstSeg).adjacent) fromLiftChain = [destIndex]
      }
      if (toLiftChain && fromLiftChain) {
        const pts: Phaser.Math.Vector2[] = []
        const doorCur = isAdjacentToElevatorFor(this.roomRects[bestIdx!], curSeg).doorX
        pts.push(...chainToPoints(toLiftChain, new Phaser.Math.Vector2(doorCur, curY)))
        pts.push(new Phaser.Math.Vector2(shaft.centerX, curY))
        pts.push(new Phaser.Math.Vector2(shaft.centerX, dstY))
        const doorDst = isAdjacentToElevatorFor(this.roomRects[fromLiftChain[0]], dstSeg).doorX
        pts.push(new Phaser.Math.Vector2(doorDst, dstY))
        const rest = (fromLiftChain.length > 1) ? fromLiftChain : [fromLiftChain[0]]
        pts.push(...chainToPoints(rest, dstPoint))
        return pts
      }
      return null
    }

    if (pathPoints.length === 0) {
      // Пробуем все шахты
      let best: Phaser.Math.Vector2[] | null = null
      for (const shaft of shafts) {
        const pts = attemptPerShaft(shaft)
        if (pts && pts.length > 0) { if (!best || pts.length < best.length) best = pts }
      }
      if (best) pathPoints = best
    }

    if (pathPoints.length === 0) {
      // Не менять текущую цель, чтобы не идти по пустоте
      agent.path = []
      return
    }

    agent.path = pathPoints
    agent.target = agent.path.shift() || dstPoint
    // Спрайты не создаются, убираем флип анимации
  }

  private updateResidents(_time: number, delta: number): void {
    // Периодическая проверка застрявших агентов (каждые 15 секунд, редко)
    if (!this.lastStuckCheck || Date.now() - this.lastStuckCheck > 15000) {
      this.checkStuckAgents()
      this.lastStuckCheck = Date.now()
    }

    // Периодическая проверка безумных жителей (каждые 5 секунд)
    if (!this.lastInsanityCheck || Date.now() - this.lastInsanityCheck > 5000) {
      console.log(`[updateResidents] Вызываем checkInsaneResidents`)
      this.checkInsaneResidents()
      this.lastInsanityCheck = Date.now()
    }

    const speed = 36
    const step = (speed * delta) / 1000
    const isXInAnyElevator = (x: number): boolean => {
      if (x >= this.elevatorRect.x && x <= (this.elevatorRect.x + this.elevatorRect.width)) return true
      for (const lift of this.extraElevators) {
        if (x >= lift.x && x <= (lift.x + lift.width)) return true
      }
      return false
    }
    const ensureIdle = (agent: any) => {
      // Спрайты не создаются, убираем анимации
    }
    const isInsideRoom = (idx: number, x: number, y: number) => {
      const rr = this.roomRects[idx]
      return Phaser.Geom.Rectangle.Contains(rr, x, y)
    }
    const findRoomIndexAt = (x: number, y: number): number | null => {
      for (let i = 0; i < this.roomRects.length; i++) {
        if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], x, y)) return i
      }
      return null
    }
    const tryPathToRoomByName = (agent: any, roomName: string): boolean => {
      const indices: number[] = []
      for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i] === roomName) indices.push(i)
      if (indices.length === 0) return false
      // ближняя по расстоянию к текущей позиции
      indices.sort((a, b) => {
        const ra = this.roomRects[a], rb = this.roomRects[b]
        const dax = (ra.x + ra.width / 2) - agent.rect.x
        const day = (ra.y + ra.height / 2) - agent.rect.y
        const dbx = (rb.x + rb.width / 2) - agent.rect.x
        const dby = (rb.y + rb.height / 2) - agent.rect.y
        return (dax * dax + day * day) - (dbx * dbx + dby * dby)
      })
      for (const idx of indices) {
        const r = this.roomRects[idx]
        const margin = 4
        const centerX = r.x + margin + Math.floor((r.width - margin * 2) / 2)
        const dst = new Phaser.Math.Vector2(centerX, r.y + r.height - margin)
        const prevTarget = agent.target ? new Phaser.Math.Vector2(agent.target.x, agent.target.y) : undefined
        const prevPath = agent.path ? [...agent.path] : []
        this.buildPathTo(agent, idx, dst, false)
        const started = (agent.path && agent.path.length > 0) || (agent.target && (!prevTarget || agent.target.x !== prevTarget.x || agent.target.y !== prevTarget.y))
        if (started) return true
        agent.target = prevTarget; agent.path = prevPath
      }
      return false
    }

    // ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ: проверяем наличие врагов в бункере
    const hasEnemies = this.residentAgents.some(a => a && a.isEnemy && (a.health || 0) > 0)

    // Проверяем обнаружение врагов только для жителей, которые могут их обнаружить
    if (hasEnemies) {
      for (const agent of this.residentAgents) {
        if (!agent || agent.isEnemy || (agent as any).away || ((agent as any).isCoward && !((agent as any).intent === 'hostile'))) continue

        // Проверяем обнаружение врагов для жителей, которые не в боевом режиме
        if (!(agent.animLock === 'attack' || (agent as any).combatTarget)) {
          this.checkEnemyDetectionInRoom(agent)
        }
      }
    }

    for (const agent of this.residentAgents) {
      // Проверяем смерть жителя
      if (agent.health && agent.health <= 0) {
        console.log(`[bunkerView] Пропускаем мертвого жителя ${agent.profession} (ID: ${agent.id})`)
        continue
      }

      // Пропускаем мертвых жителей (animLock === 'dead')
      if (agent.animLock === 'dead') {
        console.log(`[bunkerView] Пропускаем мертвого жителя ${agent.profession} (ID: ${agent.id}) - animLock=dead`)
        continue
      }

      // Пропускаем жителей, которые находятся в режиме перетаскивания
      if (agent.id && this.residentsBeingDragged.has(agent.id)) {
        console.log(`[bunkerView] Пропускаем жителя ${agent.profession} (ID: ${agent.id}) - находится в режиме перетаскивания`)
        continue
      }

      // Пропускаем жителей, которые находятся на поверхности
      // Они имеют свою собственную логику движения (падение + движение влево)
      if ((agent as any).onSurface === true) {
        // console.log(`[bunkerView] Пропускаем жителя ${agent.profession} (ID: ${agent.id}) - находится на поверхности`)
        continue
      }
      
      // Обнаружение врагов уже обрабатывается в глобальной проверке выше
      // Никаких дополнительных действий не требуется
      
      // Определяем followingPath в начале цикла для каждого агента
      const followingPath = !!agent.target
      
      // Определяем moving в начале цикла для каждого агента
      let moving = false
      
      // Обрабатываем врага
      // if (agent.isEnemy) console.log(`[DEBUG] Обрабатываем врага ${agent.enemyType} (ID: ${agent.id}) в updateResidents`)
      // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}): followingPath=${followingPath}, moving=${moving}, animLock=${agent.animLock}, target=`, agent.target)
      if (agent.isEnemy) {
        // Дополнительная проверка: если враг застрял в движении, восстанавливаем путь
        if (agent.animLock === 'walk' && !agent.path && !agent.target) {
          console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в движении, восстанавливаем путь`)
          
          // Если есть цель, строим путь к ней заново
          if (agent.enemyTargetId) {
            const target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
            if (target && target.rect) {
              let targetRoomIndex = -1
              for (let i = 0; i < this.roomRects.length; i++) {
                if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                  targetRoomIndex = i
                  break
                }
              }
              
              if (targetRoomIndex >= 0) {
                this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
                agent.animLock = 'walk'
                agent.target = undefined
                console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) путь восстановлен к цели`)
              }
            }
          }
        }
        
        // Логика для врагов
        // ... (оставляем пустым пока)
      } else {
        // Обнаружение врагов уже обрабатывается выше в глобальной проверке
        // Никаких дополнительных действий не требуется
        
        // ПРИОРИТЕТ 2: РАБОТА - только если нет врагов или житель уже в боевом режиме
        if (agent.scheduleState === 'work' && ((agent.stayInRoomName && !agent.settled) || ['сантехник','повар','инженер','солдат','доктор','врач','охотник','разведчик'].includes((agent.profession||'').toLowerCase()))) {
        const profWork = (agent.profession || '').toLowerCase()
          
          // Специальная логика для охотников и разведчиков - уход на поверхность
          if (profWork === 'охотник' || profWork === 'разведчик') {
            // Проверяем, не ушли ли уже на поверхность
            if (!(agent as any).away && !(agent as any)._surfacePending) {
              // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: не уходим на поверхность если есть враги в бункере
              const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
              if (enemies.length > 0) {
                console.log(`[DEBUG] ${agent.profession} (ID: ${agent.id}) НЕ уходит на поверхность - есть враги в бункере`)
                continue // Переходим к следующему агенту, но НЕ уходим на поверхность
              }
              
              console.log(`[DEBUG] ${agent.profession} (ID: ${agent.id}) уходит на поверхность`)
              const entranceIdx = this.roomNames.indexOf('Вход')
              if (entranceIdx >= 0) {
                const r = this.roomRects[entranceIdx]
                const margin = 4
                const dst = new Phaser.Math.Vector2(r.x + r.width / 2, r.y + r.height - margin)
                this.buildPathTo(agent, entranceIdx, dst, false)
                ;(agent as any)._surfacePending = true
                continue // Переходим к следующему агенту
              }
            }
          }
          
        // Если уже назначена комната и персонаж фактически внутри и остановился — ничего не делаем (не перестраиваем путь)
        if (agent.assignedRoomIndex != null) {
          const rr = this.roomRects[agent.assignedRoomIndex]
          const inside = rr ? Phaser.Geom.Rectangle.Contains(rr, agent.rect.x, agent.rect.y) : false
          const arrived = (!agent.target && (!agent.path || agent.path.length === 0))
          if (inside && arrived) {
            agent.dwellUntil = Number.MAX_SAFE_INTEGER
            // Для химика/учёного считаем поселённым
            if (profWork === 'химик' || profWork === 'ученый' || profWork === 'учёный') agent.settled = true
          }
        }
        // уже внутри целевой комнаты?
        let insideIdx: number | null = null
        for (let i = 0; i < this.roomRects.length; i++) {
          if (this.roomNames[i] === agent.stayInRoomName && isInsideRoom(i, agent.rect.x, agent.rect.y)) { insideIdx = i; break }
        }
        if (insideIdx !== null) {
          // Считаем прибытие только если нет активного пути/цели (иначе продолжаем двигаться к центру)
          if ((!agent.path || agent.path.length === 0) && !agent.target) {
            agent.settled = true
            if (agent.scheduleState !== 'work') {
              ensureIdle(agent)
            }
          }
        } else if ((!agent.path || agent.path.length === 0) && (!agent.target || (Math.abs((agent.target.x ?? 0) - agent.rect.x) < 1 && Math.abs((agent.target.y ?? 0) - agent.rect.y) < 1))) {
          // построить путь к рабочей комнате по профессии (общее) либо в лабораторию для химика/учёного
          const prof = (agent.profession || '').toLowerCase()
          let ok = false
          // Если уже есть назначенная комната и мы к ней пришли — не переназначаем каждый тик
          if (agent.assignedRoomIndex != null) {
            const rr = this.roomRects[agent.assignedRoomIndex]
            const arrivedInside = rr ? Phaser.Geom.Rectangle.Contains(rr, agent.rect.x, agent.rect.y) : false
            if (arrivedInside) ok = true
          }
          if (prof === 'химик' || prof === 'ученый' || prof === 'учёный') {
            const role: 'chemist' | 'scientist' = (prof === 'химик') ? 'chemist' : 'scientist'
            ok = this.tryAssignAndPathToLab(agent, role)
          } else if (['сантехник','повар','инженер','солдат'].includes(prof)) {
            if (!ok) ok = this.tryAssignAndPathToWorkRoom(agent)
          } else if (prof === 'доктор' || prof === 'врач') {
            // Доктор работает в Госпиталь, 1 доктор на комнату
            const backup = agent.stayInRoomName
            agent.stayInRoomName = undefined
            const prevAssigned = agent.assignedRoomIndex
            // Переиспользуем универсальную логику: как инженер, но для Госпиталь
            const indices: number[] = []
            for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i] === 'Госпиталь') indices.push(i)
            indices.sort((a, b) => {
              const ra = this.roomRects[a], rb = this.roomRects[b]
              const dax = (ra.x + ra.width / 2) - agent.rect.x
              const day = (ra.y + ra.height / 2) - agent.rect.y
              const dbx = (rb.x + rb.width / 2) - agent.rect.x
              const dby = (rb.y + rb.height / 2) - agent.rect.y
              return (dax * dax + day * day) - (dbx * dbx + dby * dby)
            })
            for (const idx of indices) {
              const entry = this.ensureRoomEntry(idx)
              const key = 'доктор'
              const cur = (entry.workers?.[key] || 0)
              if (cur >= 1) continue
              const pts = this.getRoomStopPoints(idx)
              let chosenSlot = -1
              for (let s = 0; s < pts.length; s++) { if (!entry.usedSlots.has(s)) { chosenSlot = s; break } }
              if (chosenSlot === -1) continue
              const dst = pts[chosenSlot]
              const before: Phaser.Math.Vector2 | undefined = agent.target ? new Phaser.Math.Vector2(agent.target.x, agent.target.y) : undefined
              const prevPath = agent.path ? [...agent.path] : []
              this.buildPathTo(agent, idx, dst, false)
              const bx = before?.x, by = before?.y
              const started = (agent.path && agent.path.length > 0) || (!!agent.target && (bx === undefined || agent.target.x !== bx || agent.target.y !== by))
              if (started) {
                this.releaseRoomAssignment(agent)
                agent.assignedRoomIndex = idx
                agent.assignedSlotIndex = chosenSlot
                if (!entry.workers) entry.workers = {}
                if (!entry.workers[key]) entry.workers[key] = 0
                entry.workers[key] += 1
                entry.usedSlots.add(chosenSlot)
                ok = true
                break
              } else {
                agent.target = before; agent.path = prevPath
              }
            }
            agent.stayInRoomName = backup
            if (!ok && prevAssigned != null) agent.assignedRoomIndex = prevAssigned
          }
          if (!ok) { ensureIdle(agent) }
          }
        }
        
        // Проверяем обнаружение врагов перед работой
        if (!(agent as any).isCoward && !(agent as any).away) {
          this.checkEnemyDetectionInRoom(agent)
        }
      }
      // 2) Безработные/бездомные: бродят (только для НЕ врагов)
      if (!agent.isEnemy) {
        const profession = (agent.profession ?? '').toLowerCase()
        const isWanderer = (!profession || ['бездомный', 'безработный', 'бездельник'].includes(profession)) || agent.scheduleState === 'rest'
        
        // Проверяем обнаружение врагов перед блужданием
        if (isWanderer && !(agent as any).isCoward && !(agent as any).away) {
          this.checkEnemyDetectionInRoom(agent)
        }
        
        if (isWanderer && !agent.target && (!agent.path || agent.path.length === 0)) {
          // иногда стоим, иногда идём в случайную комнату (не лифт)
          if (!agent.dwellUntil || this.scene.time.now > agent.dwellUntil) {
            agent.dwellUntil = this.scene.time.now + Phaser.Math.Between(1500, 4000)
            // выбрать случайную достижимую комнату (для НЕ врагов)
            for (let guard = 0; guard < 10; guard++) {
              const destIdx = Phaser.Math.Between(0, this.roomRects.length - 1)
              const nm = this.roomNames[destIdx]
              if (/лиф/gi.test(nm) || /elev/i.test(nm)) continue
              const r = this.roomRects[destIdx]
              const margin = 4
              const points = this.getRoomStopPoints(destIdx)
              const dst = points[Phaser.Math.Between(0, points.length - 1)]
              const before: Phaser.Math.Vector2 | undefined = agent.target ? new Phaser.Math.Vector2(agent.target.x, agent.target.y) : undefined
              const prevPath = agent.path ? [...agent.path] : []
              this.buildPathTo(agent, destIdx, dst, false)
              const bx = before?.x
              const by = before?.y
              const started = (agent.path && agent.path.length > 0) || (!!agent.target && (bx === undefined || agent.target.x !== bx || agent.target.y !== by))
              if (started) break
              agent.target = before; agent.path = prevPath
            }
          }
        }
      }



      // 3) Движение по пути (если цель есть); иначе остаёмся на месте, но продолжаем отрисовку состояний
      
      // Проверяем обнаружение врагов во время движения (для жителей)
      if (!agent.isEnemy && !(agent as any).isCoward && !(agent as any).away) {
        this.checkEnemyDetectionInRoom(agent)
      }
      
      moving = false
      if (agent.target) {
      const dx = agent.target.x - agent.rect.x
      const dy = agent.target.y - agent.rect.y
      let nx = agent.rect.x
      let ny = agent.rect.y
        const inElevatorCol = isXInAnyElevator(agent.rect.x)
        if (inElevatorCol && Math.abs(dy) > 1) {
          // В лифте сначала выравниваемся по Y, чтобы не выходить между этажами
          const dirY = Math.sign(dy)
          ny = agent.rect.y + dirY * Math.min(Math.abs(dy), step)
        } else if (Math.abs(dx) > 1) {
          const dirX = Math.sign(dx)
          nx = agent.rect.x + dirX * Math.min(Math.abs(dx), step)
        } else if (Math.abs(dy) > 1) {
          if (inElevatorCol) {
          const dirY = Math.sign(dy)
          ny = agent.rect.y + dirY * Math.min(Math.abs(dy), step)
      }
        }
        moving = Math.abs(agent.rect.x - nx) > 0.1 || Math.abs(agent.rect.y - ny) > 0.1
        if (agent.isEnemy) {
          // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) в блоке движения: moving=${moving}, dx=${dx}, dy=${dy}, step=${step}`)
        }

        // Ослабляем ограничения движения - позволяем агентам свободно перемещаться
        // Только минимальная проверка для предотвращения выхода за пределы игрового поля
        if (nx < 10 || nx > 790 || ny < 10 || ny > 590) {
          // Агент пытается выйти за пределы игрового поля - корректируем
          nx = Math.max(20, Math.min(780, nx))
          ny = Math.max(20, Math.min(580, ny))
        }

        // Устанавливаем позицию для рамки и спрайта
      agent.rect.setPosition(nx, ny)
      agent.sprite?.setPosition(nx, ny)
        
        // Отзеркаливание в направлении движения
        if (agent.sprite && Math.abs(dx) > 0.1) {
          const profession = (agent as any).profession
          if (profession && getSpecialistSpriteKey(profession.toLowerCase())) {
            // Спрайты специализаций: false = вправо, true = влево
            agent.sprite.setFlipX(dx < 0)
          }
          // Для врагов также применяем отзеркаливание
          if (agent.isEnemy) {
            agent.sprite.setFlipX(dx < 0)
          }
        }
      }
      // Машина состояний анимаций: work=attack, sleep/elevator/stand=idle, move(outside elevator)=walk
      const inLiftNow = isXInAnyElevator(agent.rect.x)
      const atIdxNow = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
      const atNameNow = (atIdxNow != null) ? this.roomNames[atIdxNow] : undefined
      const nearInRect = (idx: number | null | undefined): boolean => {
        if (idx == null) return false
        const r = this.roomRects[idx]
        if (!r) return false
        const tol = 1
        return (
          agent.rect.x >= r.x - tol && agent.rect.x <= r.x + r.width + tol &&
          agent.rect.y >= r.y - tol && agent.rect.y <= r.y + r.height + tol
        )
      }
      const inRestByPos = atNameNow === 'Спальня'
      const inAssignedRest = nearInRect((agent as any).sleepAssignedRoomIndex as number | undefined)
      const isInRestRoom = inRestByPos || inAssignedRest
      // Для рабочих комнат учитываем профессию
      const profNow2 = (agent.profession || '').toLowerCase()
      const isInLab = atNameNow === 'Лаборатория'
        || (profNow2 === 'сантехник' && atNameNow === 'Туалет')
        || (profNow2 === 'повар' && atNameNow === 'Столовая')
        || (profNow2 === 'инженер' && atNameNow === 'Техническая')
        || (profNow2 === 'солдат' && atNameNow === 'Вход')
        || ((profNow2 === 'доктор' || profNow2 === 'врач') && atNameNow === 'Госпиталь')
      const profNow = (agent.profession || '').toLowerCase()
      const isLabWorkerNow = profNow === 'химик' || profNow === 'ученый' || profNow === 'учёный' || ['сантехник','повар','инженер','солдат','доктор','врач','охотник','разведчик'].includes(profNow)
      const hasArrived = !moving && !agent.target && (!agent.path || agent.path.length === 0)
      // Для всех рабочих профессий: считаем, что "в работе", только если реально внутри назначенной/целевой рабочей комнаты и остановился
      const inAssignedWork = ((): boolean => {
        if (agent.assignedRoomIndex == null) return false
        const r = this.roomRects[agent.assignedRoomIndex]
        if (!r) return false
        const tol = 1
        return (
          agent.rect.x >= r.x - tol && agent.rect.x <= r.x + r.width + tol &&
          agent.rect.y >= r.y - tol && agent.rect.y <= r.y + r.height + tol
        )
      })()
      const workingNow = agent.scheduleState === 'work' && isLabWorkerNow && ((isInLab || inAssignedWork)) && hasArrived && !agent.isEnemy
      const sleepingNow = agent.scheduleState === 'sleep' && isInRestRoom && hasArrived
      
      // Проверяем обнаружение врагов перед работой и сном (для жителей)
      if (!agent.isEnemy && !(agent as any).isCoward && !(agent as any).away) {
        this.checkEnemyDetectionInRoom(agent)
      }
      
      // Проверяем обнаружение врагов перед работой и сном (для жителей)
      if (!agent.isEnemy && !(agent as any).isCoward && !(agent as any).away) {
        this.checkEnemyDetectionInRoom(agent)
      }

      const playAll = (suffix: 'attack' | 'sleep' | 'walk' | 'idle' | 'hurt' | 'dead') => {
        // Проверяем приоритет анимаций - hurt и dead имеют максимальный приоритет
        if (agent.animLock === 'hurt' || agent.animLock === 'dead') {
          // Если установлен hurt или dead, используем их вместо переданного suffix
          suffix = agent.animLock
        }
        
        if (agent.sprite) {
          if (agent.isEnemy) {
            // Логика для врагов - используем правильные ключи анимаций
            let animationKey = null
            
            if (agent.enemyType === 'МАРОДЕР') {
              const kind = agent.marauderKind || 1
              animationKey = `r${kind}_${suffix}`
              // console.log(`[DEBUG] Мародер: enemyType=${agent.enemyType}, marauderKind=${agent.marauderKind}, kind=${kind}, suffix=${suffix}, animationKey=${animationKey}`)

              // Убеждаемся, что анимации мародеров созданы
              const gameScene = this.scene as any
              if (gameScene.ensureMarauderAnimations) {
                gameScene.ensureMarauderAnimations()
              }
            } else if (agent.enemyType === 'ЗОМБИ') {
              const kind = agent.zombieKind || 'wild'
              if (kind === 'wild') animationKey = `z_wild_${suffix}`
              else if (kind === 'man') animationKey = `z_man_${suffix}`
              else if (kind === 'woman') animationKey = `z_woman_${suffix}`
              else animationKey = `z_wild_${suffix}` // fallback
              // console.log(`[DEBUG] Зомби: enemyType=${agent.enemyType}, zombieKind=${agent.zombieKind}, kind=${kind}, suffix=${suffix}, animationKey=${animationKey}`)

              // Убеждаемся, что анимации зомби созданы
              const gameScene = this.scene as any
              if (gameScene.ensureZombieAnimations) {
                gameScene.ensureZombieAnimations()
              }
            } else if (agent.enemyType === 'МУТАНТ') {
              const k = agent.mutantKind || 1
              animationKey = `m${k}_${suffix}`
              // console.log(`[DEBUG] Мутант: enemyType=${agent.enemyType}, mutantKind=${agent.mutantKind}, k=${k}, suffix=${suffix}, animationKey=${animationKey}`)

              // Убеждаемся, что анимации мутантов созданы
              const gameScene = this.scene as any
              if (gameScene.ensureMutantAnimations) {
                // console.log(`[DEBUG] Вызываем ensureMutantAnimations для мутанта ${agent.enemyType} (ID: ${agent.id})`)
                gameScene.ensureMutantAnimations()
                // console.log(`[DEBUG] ensureMutantAnimations выполнен для мутанта ${agent.enemyType} (ID: ${agent.id})`)
              } else {
                console.warn(`[DEBUG] ensureMutantAnimations не найден в gameScene`)
              }
            } else if (agent.enemyType === 'СОЛДАТ') {
              animationKey = `sold_${suffix}`
              // console.log(`[DEBUG] Солдат: enemyType=${agent.enemyType}, suffix=${suffix}, animationKey=${animationKey}`)

              // Убеждаемся, что анимации солдат созданы
                const gameScene = this.scene as any
              if (gameScene.ensureSoldierAnimations) {
                  gameScene.ensureSoldierAnimations()
              }
                } else {
              console.log(`[DEBUG] Неизвестный тип врага: enemyType=${agent.enemyType}`)
            }
            
            if (animationKey) {
              // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) воспроизводит анимацию: ${animationKey}`) // Закомментируем существующий лог
              if (agent.sprite && agent.sprite.anims) {
                  // Для атаки воспроизводим только если не воспроизводится в данный момент
                if (suffix === 'attack') {
                  // Проверяем, воспроизводится ли уже анимация атаки
                  const currentAnimKey = agent.sprite.anims.currentAnim?.key
                  const isAttackAnim = currentAnimKey && (
                    currentAnimKey.includes('_attack') || 
                    currentAnimKey.includes('attack')
                  )
                  
                  if (!isAttackAnim || currentAnimKey !== animationKey) {
                    // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) переключает анимацию на: ${animationKey} (текущая: ${agent.sprite.anims.currentAnim?.key})`)
                    try {
                      agent.sprite.anims.play(animationKey, false) // Не зацикливаем анимацию атаки
                      // После завершения анимации атаки переключаемся на idle через таймер
                      const attackDuration = 1000 // 300ms - короткая длительность атаки
                      // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) запустил таймер атаки на ${attackDuration}ms`)
                      
                      // Очищаем предыдущий таймер если есть
                      if ((agent as any).attackTimer) {
                        clearTimeout((agent as any).attackTimer)
                      }
                      
                      ;(agent as any).attackTimer = setTimeout(() => {
                        // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) таймер атаки сработал, текущий animLock=${agent.animLock}`)
                        if (agent.animLock === 'attack') {
                          agent.animLock = 'idle'
                          // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) завершил атаку, переключается на idle`)
                          // Принудительно вызываем playAll для обновления анимации
                          playAll('idle')
                } else {
                          // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) animLock уже не attack, а=${agent.animLock}`)
                        }
                        ;(agent as any).attackTimer = null
                      }, attackDuration)
                  } catch (e) {
                      console.warn(`[playAll] Не удалось воспроизвести анимацию ${animationKey}:`, e)
                    }
                      } else {
                    // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) уже воспроизводит анимацию атаки: ${currentAnimKey}`)
                  }
                } else if (agent.sprite.anims.currentAnim?.key !== animationKey) {
                  // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) переключает анимацию на: ${animationKey} (текущая: ${agent.sprite.anims.currentAnim?.key})`)
                  try {
                    agent.sprite.anims.play(animationKey, true)
                  } catch (e) {
                    console.warn(`[playAll] Не удалось воспроизвести анимацию ${animationKey}:`, e)
                  }
                          } else {
                  // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) анимация ${animationKey} уже воспроизводится.`)
                          }
                        } else {
                console.warn(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не имеет спрайта или анимаций для ${animationKey}`)
              }
            } else {
              console.warn(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не найден ключ анимации для suffix=${suffix}. enemyType=${agent.enemyType}, animLock=${agent.animLock}, followingPath=${followingPath}, moving=${moving}`)
            }
          } else if (agent.profession) {
            // Логика для жителей - используем профессии
            const profession = agent.profession.toLowerCase()
            const specialistSpriteKey = getSpecialistSpriteKey(profession)
            if (specialistSpriteKey) {
              try {
                if (suffix === 'attack') {
                  // Для анимации атаки жителей используем специальную логику
                  const attackAnimationKey = `${profession}_attack`
                  // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) воспроизводит анимацию атаки: ${attackAnimationKey}`)
                  
                  // Проверяем, воспроизводится ли уже анимация атаки
                  const currentAnimKey = agent.sprite.anims.currentAnim?.key
                  const isAttackAnim = currentAnimKey && (
                    currentAnimKey.includes('_attack') || 
                    currentAnimKey.includes('attack')
                  )
                  
                  if (!isAttackAnim || currentAnimKey !== attackAnimationKey) {
                    agent.sprite.anims.play(attackAnimationKey, false) // Не зацикливаем анимацию атаки
                    
                    // После завершения анимации атаки переключаемся на idle через таймер
                    const attackDuration = 1000 // 300ms - короткая длительность атаки
                    // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) запустил таймер атаки на ${attackDuration}ms`)
                    
                    // Очищаем предыдущий таймер если есть
                    if ((agent as any).attackTimer) {
                      clearTimeout((agent as any).attackTimer)
                    }
                    
                    ;(agent as any).attackTimer = setTimeout(() => {
                      // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) таймер атаки сработал, текущий animLock=${agent.animLock}`)
                      if (agent.animLock === 'attack') {
                        agent.animLock = 'idle'
                        // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) завершил атаку, переключается на idle`)
                        // Принудительно вызываем playAll для обновления анимации
                        playAll('idle')
                      } else {
                        // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) animLock уже не attack, а=${agent.animLock}`)
                      }
                      ;(agent as any).attackTimer = null
                    }, attackDuration)
                  } else {
                    // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) уже воспроизводит анимацию атаки: ${currentAnimKey}`)
                  }
                } else {
                  // Для остальных анимаций используем стандартную логику
                agent.sprite.anims.play(`${profession}_${suffix}`, true)
                }
              } catch (e) {
                console.warn(`[playAll] Не удалось воспроизвести анимацию для жителя ${agent.profession}:`, e)
              }
            }
          }
        }
      }

      if (inLiftNow) {
        // if (agent.isEnemy) console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок inLiftNow`)
        
        if (agent.isEnemy) {
        // Враги проходят через лифт если у них есть путь к цели
          if (agent.path && agent.path.length > 0) {
          // Не сбрасываем animLock, позволяем врагу продолжать движение
          // НЕ вызываем playAll('idle') - это ломает анимацию
          } else if (agent.target) {
          // Не сбрасываем animLock, позволяем врагу продолжать движение
          } else if (agent.enemyTargetId) {
          // Не сбрасываем animLock, позволяем врагу продолжать поиск цели
          } else if ((agent as any).goingToLift) {
            // Враг шел к лифту и теперь в нем - переводим в режим выхода
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) дошел до лифта, переводим в режим выхода`)
            ;(agent as any).goingToLift = false
            
            // Выводим врага в целевую комнату
            const targetRoomIndex = (agent as any).targetAfterLift || 0
            const targetRoom = this.roomRects[targetRoomIndex]
            const exitX = targetRoom.x + targetRoom.width / 2
            const exitY = targetRoom.y + targetRoom.height - 4
            
            agent.target = new Phaser.Math.Vector2(exitX, exitY)
            agent.animLock = 'walk'
            agent.path = []
            
            // Устанавливаем флаг, что враг выходит из лифта
            ;(agent as any).exitingLift = true
            ;(agent as any).exitTargetRoom = targetRoomIndex
            
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) выходит из лифта в целевую комнату ${targetRoomIndex}`)
        } else {
            // Враг застрял в лифте - принудительно выводим его
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в лифте, принудительно выводим`)
            
            // Ищем ближайшую комнату для выхода
            let bestRoomIndex = 0
            let bestDistance = Number.POSITIVE_INFINITY
            
            for (let i = 0; i < this.roomRects.length; i++) {
              const room = this.roomRects[i]
              const roomCenterX = room.x + room.width / 2
              const roomCenterY = room.y + room.height - 4 // Позиция у двери
              const distance = Math.hypot(agent.rect.x - roomCenterX, agent.rect.y - roomCenterY)
              
              if (distance < bestDistance) {
                bestDistance = distance
                bestRoomIndex = i
              }
            }
            
            // Выводим врага в ближайшую комнату
            const exitRoom = this.roomRects[bestRoomIndex]
            const exitX = exitRoom.x + exitRoom.width / 2
            const exitY = exitRoom.y + exitRoom.height - 4
            
            agent.target = new Phaser.Math.Vector2(exitX, exitY)
            agent.animLock = 'walk'
            agent.path = []
            
            // Устанавливаем флаг, что враг выходит из лифта
            ;(agent as any).exitingLift = true
            ;(agent as any).exitTargetRoom = bestRoomIndex
            
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) выводится из лифта в комнату ${bestRoomIndex}`)
          }
        } else {
          // Жители в лифте - оставляем как есть (у них есть триггеры)
        agent.animLock = null
        playAll('idle')
        }
      } else if (agent.isEnemy) {
                     // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок логики врагов`)
        // Враги: преследование ближайшего жителя (приоритетнее любой другой логики)
                     // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) в блоке логики врагов: target=`, agent.target, `followingPath=${followingPath}, moving=${moving}`)
        
        // Проверяем, не вышел ли враг из лифта и нужно ли продолжить движение к цели
        if ((agent as any).exitingLift && !inLiftNow) {
          console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) вышел из лифта, продолжаем движение к цели`)
          ;(agent as any).exitingLift = false
          
          // Если есть цель, строим путь к ней
          if (agent.enemyTargetId) {
            const target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
            if (target && target.rect) {
              // Находим индекс комнаты цели
              let targetRoomIndex = -1
              for (let i = 0; i < this.roomRects.length; i++) {
                if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                  targetRoomIndex = i
                  break
                }
              }
              
              // Строим путь к цели через комнаты
              if (targetRoomIndex >= 0) {
                this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
                agent.animLock = 'walk'
                agent.target = undefined // Очищаем прямой target, чтобы враг использовал path
                console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) строит путь к цели после выхода из лифта: ${targetRoomIndex}`)
              }
            }
          }
        }
        
        // Дополнительная проверка: если враг застрял на выходе из лифта (близко к лифту, но не в нем)
        if (!inLiftNow && (agent as any).exitTargetRoom !== undefined) {
          const distanceToLift = Math.abs(agent.rect.x - (this.elevatorRect.x + this.elevatorRect.width / 2))
          if (distanceToLift < 20) { // Если враг близко к лифту
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) застрял на выходе из лифта, принудительно выводим`)
            
            // Принудительно выводим врага в целевую комнату
            const targetRoomIndex = (agent as any).exitTargetRoom || 0
            const targetRoom = this.roomRects[targetRoomIndex]
            const exitX = targetRoom.x + targetRoom.width / 2
            const exitY = targetRoom.y + targetRoom.height - 4
            
            agent.target = new Phaser.Math.Vector2(exitX, exitY)
            agent.animLock = 'walk'
            agent.path = []
            
            // Очищаем флаг
            ;(agent as any).exitTargetRoom = undefined
            
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) принудительно выводится в комнату ${targetRoomIndex}`)
          }
        }
        
        // Дополнительная проверка: если у врага нет цели или цель мертва, ищем новую
        if (!agent.enemyTargetId || !agent.target) {
          const livingResidents = this.residentAgents.filter(a => 
            a && !a.isEnemy && (a.health || 0) > 0 && !(a as any).away
          )
          
          if (livingResidents.length > 0) {
            // Выбираем ближайшего жителя как цель
            let bestTarget = livingResidents[0]
            let bestDistance = Number.POSITIVE_INFINITY
            
            for (const resident of livingResidents) {
              const distance = Phaser.Math.Distance.Between(
                agent.rect.x, agent.rect.y,
                resident.rect.x, resident.rect.y
              )
              if (distance < bestDistance) {
                bestDistance = distance
                bestTarget = resident
              }
            }
            
            // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) получает новую цель: ${bestTarget.profession} (ID: ${bestTarget.id})`)
            agent.enemyTargetId = bestTarget.id
            
            // Строим путь к цели
            let targetRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
                targetRoomIndex = i
                break
              }
            }
            
            if (targetRoomIndex >= 0) {
              this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
              agent.animLock = 'walk'
              agent.target = undefined // Очищаем прямой target, чтобы враг использовал path
            }
          } else {
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не может найти живых целей`)
            // Враг остается в текущей комнате
            agent.animLock = 'idle'
          }
        }
        
        const findNewTarget = () => {
          let bestId: number | undefined
          let bestDist = Number.POSITIVE_INFINITY
          let bestPriority = 0 // Приоритет: 0=обычный, 1=не в лифте, 2=в той же комнате
          
          // Определяем комнату врага
          let enemyRoomIndex = -1
          for (let i = 0; i < this.roomRects.length; i++) {
            if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
              enemyRoomIndex = i
              break
            }
          }
          
          for (const other of this.residentAgents) {
            if (!other || other === agent) continue
            if ((other as any).isEnemy) continue
            if (!other.rect || !other.rect.scene) continue
                         
                         // Исключаем охотников и разведчиков которые "на поверхности"
                         if ((other.profession === 'охотник' || other.profession === 'разведчик') && (other as any).away) {
                           continue
                         }
                         
            // Проверяем, не в лифте ли житель
            const isInLift = (() => {
              if (other.rect.x >= this.elevatorRect.x && other.rect.x <= (this.elevatorRect.x + this.elevatorRect.width)) return true
              for (const lift of this.extraElevators) {
                if (other.rect.x >= lift.x && other.rect.x <= (lift.x + lift.width)) return true
              }
              return false
            })()
            if (isInLift) {
              continue // Пропускаем жителей в лифтах
            }
            
            // Определяем комнату жителя
            let residentRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], other.rect.x, other.rect.y)) {
                residentRoomIndex = i
                break
              }
            }
            
            // Вычисляем приоритет
            let priority = 0
            if (residentRoomIndex === enemyRoomIndex) {
              priority = 2 // В той же комнате - высший приоритет
            } else if (!isInLift) {
              priority = 1 // Не в лифте - средний приоритет
                         }
                         
            const dx = other.rect.x - agent.rect.x
            const dy = other.rect.y - agent.rect.y
            const d2 = dx * dx + dy * dy
            
            // Выбираем цель с лучшим приоритетом или ближайшую при одинаковом приоритете
            if (priority > bestPriority || (priority === bestPriority && d2 < bestDist)) {
              bestPriority = priority
              bestDist = d2
              bestId = other.id
            }
          }
          
          // Если не нашли цель в той же комнате, ищем любую доступную
          if (bestId === undefined) {
            for (const other of this.residentAgents) {
              if (!other || other === agent) continue
              if ((other as any).isEnemy) continue
              if (!other.rect || !other.rect.scene) continue
              if ((other.profession === 'охотник' || other.profession === 'разведчик') && (other as any).away) continue
              
              const dx = other.rect.x - agent.rect.x
              const dy = other.rect.y - agent.rect.y
              const d2 = dx * dx + dy * dy
              if (d2 < bestDist) { 
                bestDist = d2; 
                bestId = other.id 
              }
            }
          }
          
          agent.enemyTargetId = bestId
          
          if (bestId !== undefined) {
            // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) выбрал новую цель: ID=${bestId}, приоритет=${bestPriority}`)
          }
        }
        let target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
        
        // Пересматриваем цель каждый час (3600000 мс) или если цель в лифте
        const currentTime = Date.now()
        const lastReconsiderTime = agent.lastTargetReconsiderTime || 0
        const shouldReconsiderTarget = !lastReconsiderTime || 
                                     (currentTime - lastReconsiderTime > 3600000) ||
                                     (agent.enemyTargetId && target && (() => {
                                       if (target.rect.x >= this.elevatorRect.x && target.rect.x <= (this.elevatorRect.x + this.elevatorRect.width)) return true
                                       for (const lift of this.extraElevators) {
                                         if (target.rect.x >= lift.x && target.rect.x <= (lift.x + lift.width)) return true
                                       }
                                       return false
                                     })())
        
        if (shouldReconsiderTarget) {
          // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) пересматривает цель (прошло ${Math.round((currentTime - lastReconsiderTime) / 1000)}с)`)
          agent.lastTargetReconsiderTime = currentTime
          findNewTarget()
          target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
        }
                    if (!target || !target.rect || !target.rect.scene) {
                      findNewTarget();
                       target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
                     }
                
                     // Дополнительная проверка: если цель не найдена, но есть другие жители, ищем новую цель
                     if (!target && agent.enemyTargetId === undefined) {
                      //  console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не имеет цели, ищем новую`)
                       findNewTarget();
                       target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
                     }
        if (target && target.rect) {
          const range = 10
          const dx = target.rect.x - agent.rect.x
          const dy = target.rect.y - agent.rect.y
          const dist = Math.hypot(dx, dy)
          if (agent.sprite) agent.sprite.setFlipX(dx < 0)
          
          // Дополнительная проверка: если враг застрял в движении, принудительно выводим его
          if (agent.animLock === 'walk' && !agent.path && !agent.target) {
            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в движении, принудительно выводим`)
            
            // Определяем текущую комнату врага
            let currentRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
                currentRoomIndex = i
                break
              }
            }
            
            if (currentRoomIndex >= 0) {
              // Строим путь к цели заново
              let targetRoomIndex = -1
              for (let i = 0; i < this.roomRects.length; i++) {
                if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                  targetRoomIndex = i
                  break
                }
              }
              
              if (targetRoomIndex >= 0) {
                this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
                agent.animLock = 'walk'
                agent.target = undefined
                // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) путь восстановлен к комнате ${targetRoomIndex}`)
              }
            }
          }
          
                            if (dist > range) {
            // Враг движется к цели - используем buildPathTo для правильной навигации через комнаты
            // Находим индекс комнаты цели
            let targetRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                targetRoomIndex = i
                break
              }
            }
            
            // Находим индекс текущей комнаты врага
            let enemyRoomIndex = -1
            for (let i = 0; i < this.roomRects.length; i++) {
              if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
                enemyRoomIndex = i
                break
              }
            }
            
            // Проверяем, находится ли враг в лифте
            const enemyInLift = (() => {
              if (agent.rect.x >= this.elevatorRect.x && agent.rect.x <= (this.elevatorRect.x + this.elevatorRect.width)) return true
              for (const lift of this.extraElevators) {
                if (agent.rect.x >= lift.x && agent.rect.x <= (lift.x + lift.width)) return true
              }
              return false
            })()
            
            // Если враг в лифте или в разных комнатах, используем buildPathTo для правильной навигации
            if (enemyInLift || (targetRoomIndex >= 0 && enemyRoomIndex >= 0 && targetRoomIndex !== enemyRoomIndex)) {
              // Строим путь к цели через комнаты и лифты
              const targetRoom = targetRoomIndex >= 0 ? targetRoomIndex : 0
              
              // Если враг в лифте, сначала выводим его в ближайшую комнату
              if (enemyInLift) {
                // Ищем ближайшую комнату для выхода из лифта
                let bestRoomIndex = 0
                let bestDistance = Number.POSITIVE_INFINITY
                
                for (let i = 0; i < this.roomRects.length; i++) {
                  const room = this.roomRects[i]
                  const roomCenterX = room.x + room.width / 2
                  const roomCenterY = room.y + room.height - 4 // Позиция у двери
                  const distance = Math.hypot(agent.rect.x - roomCenterX, agent.rect.y - roomCenterY)
                  
                  if (distance < bestDistance) {
                    bestDistance = distance
                    bestRoomIndex = i
                  }
                }
                
                // Сначала выводим врага из лифта в ближайшую комнату
                const exitRoom = this.roomRects[bestRoomIndex]
                const exitX = exitRoom.x + exitRoom.width / 2
                const exitY = exitRoom.y + exitRoom.height - 4
                
                agent.target = new Phaser.Math.Vector2(exitX, exitY)
              agent.animLock = 'walk'
                agent.path = []
                
                // Устанавливаем флаг, что враг выходит из лифта
                ;(agent as any).exitingLift = true
                ;(agent as any).exitTargetRoom = bestRoomIndex
                
                console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) выводится из лифта в комнату ${bestRoomIndex}`)
            } else {
                // Враг не в лифте, но в разных комнатах - строим путь через buildPathTo
                
                // Специальная логика для врагов в комнате "Вход" - принудительно ведем к лифту
                if (enemyRoomIndex === 0 && this.roomNames[0] === 'Вход') {
                  // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) в комнате "Вход", ведем к лифту`)
                  
                  // Ведем врага к лифту
                  const liftX = this.elevatorRect.x + this.elevatorRect.width / 2
                  const liftY = this.elevatorRect.y + this.elevatorRect.height - 4
                  
                  agent.target = new Phaser.Math.Vector2(liftX, liftY)
                  agent.animLock = 'walk'
                  agent.path = []
                  
                  // Устанавливаем флаг, что враг идет к лифту
                  ;(agent as any).goingToLift = true
                  ;(agent as any).targetAfterLift = targetRoom
                  
                  // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) идет к лифту для перехода в комнату ${targetRoom}`)
                } else {
                  // Обычная навигация через buildPathTo
                  this.buildPathTo(agent, targetRoom, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
                  agent.animLock = 'walk'
                  
                  // Очищаем прямой target, чтобы враг использовал path
                  agent.target = undefined
                  
                  // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) строит путь через комнаты: ${enemyRoomIndex} -> ${targetRoom}`)
                }
              }
            } else {
              // Если в той же комнате и не в лифте, идем напрямую
            agent.target = new Phaser.Math.Vector2(target.rect.x, target.rect.y)
              agent.animLock = 'walk'
              // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) идет напрямую к цели в той же комнате`)
            }
          } else {
            // Враг в радиусе атаки - используем attack анимацию и наносим урон
                    agent.animLock = 'attack'
                    // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) в радиусе атаки, устанавливаем animLock=attack и target=`, agent.target)
            
            // Наносим урон жителю каждые несколько кадров (чтобы не спамить)
            if (!agent.lastAttackTime || Date.now() - agent.lastAttackTime > 1000) { // Атака раз в секунду
              agent.lastAttackTime = Date.now()
              
              // Базовый урон от врагов
              let damage = 15
              
              // Бонусный урон от разных типов врагов
              if (agent.enemyType === 'МАРОДЕР') {
                damage += 10 // +10 урона от мародеров
              } else if (agent.enemyType === 'ЗОМБИ') {
                damage += 5 // +5 урона от зомби
              } else if (agent.enemyType === 'МУТАНТ') {
                damage += 20 // +20 урона от мутантов
              } else if (agent.enemyType === 'СОЛДАТ') {
                damage += 15 // +15 урона от вражеских солдат
              }
              
              // Наносим урон жителю
                             if (target.health) {
                 target.health -= damage
                 
                 // Синхронизируем здоровье с GameScene
                 if (!target.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
                   (this.scene as any).updateResidentHealth(target.id, target.health);
                 }
                 
                 console.log(`[bunkerView] Враг ${agent.enemyType} наносит ${damage} урона жителю ${target.profession}. Осталось здоровья: ${target.health}`)
                          
                          // Воспроизводим hurt анимацию при получении урона
                          this.setHurtAnimation(target)
                
                // Проверяем смерть жителя
                          if (target.health <= 0) {
                  console.log(`[bunkerView] Житель ${target.profession} (ID: ${target.id}) убит врагом ${agent.enemyType}!`)
                            
                            // Показываем уведомление о убийстве
                            this.showNotification(`${agent.enemyType} убил ${target.profession}`, 'error')
                            
                            // Воспроизводим dead анимацию перед уничтожением
                            this.setDeadAnimation(target)
                            // Сбрасываем цель врага, чтобы он нашел новую жертву
                            agent.enemyTargetId = undefined
                            agent.target = undefined
                            agent.animLock = 'idle'  // Враги всегда в режиме атаки, даже без цели
                            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) сбросил цель после убийства`)
                            
                            // Проверяем состояние спрайта после удаления жителя
                            console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) после убийства: sprite=${!!agent.sprite}, sprite.anims=${!!agent.sprite?.anims}`)
                            if (agent.sprite) {
                              console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) спрайт активен: x=${agent.sprite.x}, y=${agent.sprite.y}, visible=${agent.sprite.visible}`)
                  } else {
                              console.warn(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) СПРАЙТ ПОТЕРЯН после убийства!`)
                            }
                }
              }
            }
          }
        } else {
                  // Нет цели - проверяем, есть ли вообще живые жители для преследования
                  const hasLivingResidents = this.residentAgents.some(a => !a.isEnemy && a !== agent && a.rect && a.rect.scene)
                  if (hasLivingResidents) {
                    // Есть живые жители, но мы их не нашли - возможно, они только что появились
                    // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не имеет цели, но есть живые жители, ищем новую цель`)
                    findNewTarget()
                    const newTarget = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
                    if (newTarget && newTarget.rect) {
                      agent.target = new Phaser.Math.Vector2(newTarget.rect.x, newTarget.rect.y)
                      // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) нашел новую цель:`, agent.target)
                    } else {
          agent.target = undefined
                    }
                  } else {
                    // Нет живых жителей вообще
                    agent.target = undefined
                    agent.animLock = 'idle'  // Враги всегда в режиме атаки, даже если нет целей
                    console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не имеет цели - нет живых жителей`)
                  }
                }
                
                // Дополнительная проверка: если враг застрял в движении, принудительно выводим его
                if (agent.animLock === 'walk' && !agent.path && !agent.target && agent.enemyTargetId) {
                  console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) застрял в движении, принудительно выводим`)
                  
                  // Ищем цель заново
                  const target = this.residentAgents.find(a => a.id === agent.enemyTargetId && !a.isEnemy)
                  if (target && target.rect) {
                    // Определяем комнату цели
                    let targetRoomIndex = -1
                    for (let i = 0; i < this.roomRects.length; i++) {
                      if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], target.rect.x, target.rect.y)) {
                        targetRoomIndex = i
                        break
                      }
                    }
                    
                    if (targetRoomIndex >= 0) {
                      // Строим путь заново
                      this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(target.rect.x, target.rect.y), false)
                      agent.animLock = 'walk'
                      agent.target = undefined
                      console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) путь восстановлен к цели`)
                    }
                  }
                }
                const animationSuffix = agent.animLock === 'work' ? 'attack' : (agent.animLock || 'idle')
                // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) вызываем playAll с animLock=${agent.animLock}, suffix=${animationSuffix}`)
                playAll(animationSuffix) // Гарантируем воспроизведение анимации
      } else if (workingNow) {
        // Проверяем обнаружение врагов перед работой (для жителей)
        if (!agent.isEnemy && !(agent as any).isCoward && !(agent as any).away) {
          this.checkEnemyDetectionInRoom(agent)
        }
        
        // ПРИНУДИТЕЛЬНОЕ ПРОБУЖДЕНИЕ ОТ РАБОТЫ при появлении врагов
        if (!agent.isEnemy && !(agent as any).isCoward) {
          const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
          if (enemies.length > 0) {
            // Проверяем, нужно ли прекратить работу
            let shouldStopWork = false
            
            if ((agent as any).isAggressive) {
              // Агрессивные жители прекращают работу при любых врагах
              shouldStopWork = true
              console.log(`[DEBUG] Агрессивный житель ${agent.profession} (ID: ${agent.id}) прекращает работу - обнаружены враги!`)
            } else {
              // Обычные жители прекращают работу только если враг в той же комнате
              const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
              const enemyInRoom = enemies.some(e => {
                const enemyRoom = this.findRoomIndexAt(e.rect.x, e.rect.y)
                return agentRoom === enemyRoom
              })
              if (enemyInRoom) {
                shouldStopWork = true
                console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) прекращает работу - враг в комнате!`)
              }
            }
            
            if (shouldStopWork) {
              // Прекращаем работу и переходим к боевой логике
              agent.working = false
              agent.scheduleState = 'rest'
              agent.target = undefined
              agent.path = undefined
              agent.dwellUntil = undefined
              
              // Освобождаем рабочие назначения
              if (agent.assignedRoomIndex !== undefined) {
                this.releaseRoomAssignment(agent)
              }
              
              // Ищем ближайшего врага для атаки
              let bestEnemy = enemies[0]
              let bestDistance = Number.POSITIVE_INFINITY
              
              for (const enemy of enemies) {
                const distance = Phaser.Math.Distance.Between(
                  agent.rect.x, agent.rect.y,
                  enemy.rect.x, enemy.rect.y
                )
                if (distance < bestDistance) {
                  bestDistance = distance
                  bestEnemy = enemy
                }
              }
              
              // Инициализируем боевые параметры если нужно
              if (agent.health === undefined) {
                this.initializeCombatStats(agent)
              }
              
              // Устанавливаем цель атаки
              ;(agent as any).combatTarget = bestEnemy.id
              agent.animLock = 'walk'
              
              // Строим путь к врагу
              let targetRoomIndex = -1
              for (let i = 0; i < this.roomRects.length; i++) {
                if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestEnemy.rect.x, bestEnemy.rect.y)) {
                  targetRoomIndex = i
                  break
                }
              }
              
              if (targetRoomIndex >= 0) {
                this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestEnemy.rect.x, bestEnemy.rect.y), false)
                agent.target = undefined
                agent.dwellUntil = undefined
              }
              
              // Пропускаем обработку работы - житель теперь в бою
              continue
            }
          }
        }
        
        // if (agent.isEnemy) console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок workingNow`)

        if (agent.isEnemy) {
          // Для врагов используем idle анимацию
          agent.animLock = 'idle'
          playAll('idle')
        } else {
          // Для жителей work = attack анимация
          agent.animLock = 'attack'
          playAll('attack') // work использует attack анимацию для жителей
        }

        // Принудительная анимация атаки для работающих персонажей
        // Рабочее состояние: стоим на месте в назначенном слоте (включая солдат)
        if (agent.assignedRoomIndex != null) {
          const rr = this.roomRects[agent.assignedRoomIndex]
          if (rr) {
            const pts = this.getRoomStopPoints(agent.assignedRoomIndex)
            let sidx = (agent.assignedSlotIndex ?? 0)
            sidx = Math.min(pts.length - 1, Math.max(0, sidx))
            const p = pts[sidx]
            const margin = 4
            const cx = Phaser.Math.Clamp(p.x, rr.x + margin, rr.x + rr.width - margin)
            const cy = rr.y + rr.height - margin
            if (Math.abs(agent.rect.x - cx) > 0.1 || Math.abs(agent.rect.y - cy) > 0.1) {
              agent.rect.setPosition(cx, cy)
              // Позиционируем спрайт если есть
              agent.sprite?.setPosition(cx, cy)
            }
          }
        }
        // Блокируем любые остаточные движения
        agent.target = undefined
        agent.path = []
      } else if (sleepingNow) {
        // Проверяем обнаружение врагов перед сном (для жителей)
        if (!agent.isEnemy && !(agent as any).isCoward && !(agent as any).away) {
          this.checkEnemyDetectionInRoom(agent)
        }
        
        if (agent.isEnemy) console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок sleepingNow`)
        
        // Для жителей проверяем, нужно ли просыпаться для боя
        if (!agent.isEnemy && (!agent.isCoward || (agent as any).intent === 'hostile')) {
          const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
          if (enemies.length > 0) {
            // Проверяем, нужно ли просыпаться
            let shouldWakeUp = false
            
            if (agent.isAggressive) {
              // Агрессивные жители просыпаются при любых врагах
              shouldWakeUp = true
              console.log(`[DEBUG] Агрессивный житель ${agent.profession} (ID: ${agent.id}) просыпается - обнаружены враги!`)
            } else {
              // Обычные жители просыпаются если:
              // 1. Враг в той же комнате, ИЛИ
              // 2. Профессия безработный/бездомный (глобальное обнаружение)
              const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
              const profession = (agent.profession || '').toLowerCase()
              const isWanderer = ['бездомный', 'безработный', 'бездельник'].includes(profession)

              const enemyInRoom = enemies.some(e => {
                const enemyRoom = this.findRoomIndexAt(e.rect.x, e.rect.y)
                return agentRoom === enemyRoom
              })

              if (enemyInRoom || isWanderer) {
                shouldWakeUp = true
                const reason = enemyInRoom ? 'враг в комнате' : 'блуждающий тип профессии'
                console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) просыпается - ${reason}!`)
              }
            }
            
            if (shouldWakeUp) {
              // Просыпаемся и переходим к нормальному состоянию
              agent.sleeping = false
              agent.scheduleState = 'rest' // Переходим в состояние отдыха для нормального поведения

              // Сбрасываем сонные эффекты
              if (agent.sleepFx) {
                agent.sleepFx.destroy()
                agent.sleepFx = undefined
              }
              if (agent.sleepFxTween) {
                agent.sleepFxTween.stop()
                agent.sleepFxTween.destroy()
                agent.sleepFxTween = undefined
              }

              console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) проснулся из-за врагов и переходит к нормальному поведению`)
              continue // Переходим к следующей итерации цикла для обработки в нормальном состоянии
            }
          }
        }
        
        // Если не просыпаемся - продолжаем спать
        agent.animLock = null
        playAll('idle')
      } else if ((followingPath || moving) && !agent.isEnemy) {
        // Проверяем обнаружение врагов во время движения (для жителей)
        if (!(agent as any).isCoward && !(agent as any).away) {
          this.checkEnemyDetectionInRoom(agent)
        }
        
             if (agent.isEnemy) console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок движения для НЕ-врагов`)
             // console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) в блоке движения: followingPath=${followingPath}, moving=${moving}`)
        agent.animLock = null
        // Флип по направлению движения
        if (agent.sprite && agent.target) {
          const dx = agent.target.x - agent.rect.x
          agent.sprite.setFlipX(dx < 0)
        }
        playAll('walk')
      } else if (agent.isEnemy && (followingPath || moving)) {
            //  console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок движения для врагов`)
             // Враги в движении: используем walk анимацию (как у жителей)
               // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) движется: followingPath=${followingPath}, moving=${moving}, target=`, agent.target)
             agent.animLock = null
        // Флип по направлению движения
        if (agent.sprite && agent.target) {
          const dx = agent.target.x - agent.rect.x
          agent.sprite.setFlipX(dx < 0)
        }
            // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) вызываем playAll('walk')`)
        playAll('walk')
          }  else if (agent.isEnemy && agent.animLock === 'attack') {
            //  console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок атаки для врагов`)
             // Враги в атаке: используем attack анимацию
           // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) в атаке: вызываем playAll('attack')`)
             playAll('attack')
      } else if (agent.isEnemy) {
            //  console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в блок idle для врагов`)
        // Враги: если не движемся и не атакуют - используем idle
            // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) не движется: animLock=${agent.animLock}, followingPath=${followingPath}, moving=${moving}, target=`, agent.target)
             // console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попадает в блок idle - это НЕПРАВИЛЬНО!`)
          if (agent.animLock !== 'idle' && !followingPath && !moving && !agent.target) { // Убеждаемся, что нет движения и цели
          agent.animLock = 'idle'
          playAll('idle')
        }
      } else {
        if (agent.isEnemy) console.log(`[DEBUG] Враг ${agent.enemyType} (ID: ${agent.id}) попал в финальный блок else`)
        
        // Боевая логика для жителей
        if (!agent.isEnemy && (!agent.isCoward || (agent as any).intent === 'hostile')) {
          this.updateResidentCombat(agent)
        }
        
        // Если персонаж "на поверхности" (охотник/разведчик), он невидим и не анимируется
        if ((agent as any).away) {
          agent.rect.setVisible(false)
          agent.sprite?.setVisible(false)
          // Старые слои (не используются для специализаций)
          agent.shirt?.setVisible(false)
          agent.pants?.setVisible(false)
          agent.footwear?.setVisible(false)
          agent.hair?.setVisible(false)
        }
        
        // Проверяем, нужно ли воспроизводить анимацию атаки
        if (agent.animLock === 'attack') {
          // Если житель в состоянии атаки, воспроизводим анимацию атаки
          playAll('attack')
        } else if (!agent.animLock) {
          // Если нет блокировки анимации, воспроизводим idle
        agent.animLock = null
        playAll('idle')
        }
      }
      // достижение цели
      if (agent.target && Math.abs(agent.rect.x - agent.target.x) < 1 && Math.abs(agent.rect.y - agent.target.y) < 1) {
        if (agent.path && agent.path.length > 0) {
          agent.target = agent.path.shift()!
        } else {
          // Если пришли к дверному порогу лаборатории без активного пути — заставим зайти внутрь, выбрав внутреннюю точку
          agent.target = undefined
          // Финализируем бронь по прибытии
          if (agent.assignedRoomIndex != null && agent.assignedSlotIndex != null) {
            const entry = this.ensureRoomEntry(agent.assignedRoomIndex)
            if (agent.assignedRole === 'chemist') entry.chemistId = agent.id
            if (agent.assignedRole === 'scientist') entry.scientistId = agent.id
            entry.usedSlots.add(agent.assignedSlotIndex)
            // eslint-disable-next-line no-console
            // console.log('[LabArrive]', { id: agent.id, labIdx: agent.assignedRoomIndex, slot: agent.assignedSlotIndex })
            // Сразу лог текущей анимации
            // eslint-disable-next-line no-console
            // console.log('[LabArriveAnim]', { id: agent.id, anim: agent.sprite?.anims?.currentAnim?.key })
          }
          // Уход на поверхность: по прибытии к входу и наличии флага — исчезаем
          if ((agent as any)._surfacePending) {
            const entranceIdx = this.roomNames.indexOf('Вход')
            const atIdx = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
            if (entranceIdx >= 0 && atIdx === entranceIdx) {
                          // Спрятать рамку и спрайт при уходе на поверхность
            agent.rect.setVisible(false)
            if (agent.sprite) {
              agent.sprite.setVisible(false)
            }
            ;(agent as any).away = true
              ;(agent as any)._surfacePending = false
              this.showNotification(`${agent.profession} ушел на поверхность`, 'info')
            }
          }
        }
      }
      // Обновляем статус для UI
      this.pushAgentStatus(agent)
      // Возвращение с поверхности: если не рабочее время и агент away — появляемся в комнате вход
      const profp = (agent.profession || '').toLowerCase()
      if ((profp === 'охотник' || profp === 'разведчик') && (agent.scheduleState !== 'work') && (agent as any).away) {
        const entranceIdx = this.roomNames.indexOf('Вход')
        if (entranceIdx >= 0) {
          const r = this.roomRects[entranceIdx]
          const margin = 4
          const cx = r.x + r.width / 2
          const cy = r.y + r.height - margin
          // Показываем спрайт если есть, иначе показываем рамку
          if (agent.sprite) {
            agent.sprite.setVisible(true)
            agent.sprite.setPosition(cx, cy)
            // Скрываем рамку когда показываем спрайт
            agent.rect.setVisible(false)
          } else {
            agent.rect.setVisible(true)
            agent.rect.setPosition(cx, cy)
          }
          ;(agent as any).away = false
          this.showNotification(`${agent.profession} вернулся`, 'success')
          
          // Перерисовываем шкалу здоровья при возвращении с поверхности
          this.drawHealthBar(agent)
        }
      }
    }
  }

  public sendResidentsToRestRooms(): void {
    // Соберём индексы комнат отдыха
    const restIndices: number[] = []
    for (let i = 0; i < this.roomNames.length; i++) {
      if (this.roomNames[i] === 'Спальня') restIndices.push(i)
    }
    if (restIndices.length === 0) return
    // Распределим по 4 человека на комнату
    let roomPtr = 0
    let inRoomCount: Record<number, number> = {}
    restIndices.forEach(idx => { inRoomCount[idx] = 0 })
    for (const agent of this.residentAgents) {
       // Этап 1: НЕ трогаем врагов, работников лабораторий (химик/учёный) и тех, у кого есть фиксированная целевая комната
       if (agent.isEnemy) continue
       const prof = (agent.profession || '').toLowerCase()
       const isLabWorker = prof === 'химик' || prof === 'ученый'
       if (isLabWorker || agent.stayInRoomName || agent.assignedRole) continue
      agent.working = false
      agent.away = false
      let assigned = false
      for (let k = 0; k < restIndices.length; k++) {
        const idx = restIndices[(roomPtr + k) % restIndices.length]
        if (inRoomCount[idx] < 4) {
          inRoomCount[idx] += 1
          roomPtr = (roomPtr + k + 1) % restIndices.length
          const r = this.roomRects[idx]
          const margin = 4
          const dstPoint = new Phaser.Math.Vector2(
            Phaser.Math.RND.between(r.x + margin, r.x + r.width - margin),
            r.y + r.height - margin
          )
          this.buildPathTo(agent, idx, dstPoint, false)
          agent.goingToRest = true
          assigned = true
          break
        }
      }
      if (!assigned) {
        agent.dwellUntil = this.scene.time.now + Phaser.Math.Between(3000, 6000)
      }
    }
  }

  private ensureRoomEntry(idx: number): { chemistId?: number; scientistId?: number; usedSlots: Set<number>; workers: Record<string, number> } {
    let entry = this.roomOccupancy.get(idx)
    if (!entry) { entry = { usedSlots: new Set<number>(), workers: {} }; this.roomOccupancy.set(idx, entry) }
    if (!(entry as any).workers) (entry as any).workers = {}
    return entry as any
  }

  private getRoomStopPoints(idx: number): Phaser.Math.Vector2[] {
    const r = this.roomRects[idx]
    const margin = 4
    const y = r.y + r.height - margin
    const innerW = Math.max(1, r.width - margin * 2)
    const fractions = [0.2, 0.4, 0.6, 0.8, 0.5]
    const points: Phaser.Math.Vector2[] = []
    for (const f of fractions) {
      const x = r.x + margin + Math.floor(innerW * f)
      points.push(new Phaser.Math.Vector2(x, y))
    }
    return points
  }

  private releaseRoomAssignment(agent: any): void {
    if (agent.assignedRoomIndex == null) return
    const entry = this.roomOccupancy.get(agent.assignedRoomIndex)
    if (entry) {
      if (agent.assignedRole === 'chemist' && entry.chemistId === agent.id) entry.chemistId = undefined
      if (agent.assignedRole === 'scientist' && entry.scientistId === agent.id) entry.scientistId = undefined
      if (agent.assignedSlotIndex != null) entry.usedSlots.delete(agent.assignedSlotIndex)
      if (agent.profession) {
        const key = agent.profession.toLowerCase()
        if (!entry.workers) entry.workers = {}
        if (entry.workers[key]) entry.workers[key] = Math.max(0, entry.workers[key] - 1)
      }
    }
    agent.assignedRoomIndex = undefined
    agent.assignedSlotIndex = undefined
    agent.assignedRole = undefined
    agent.assignedUnlimited = undefined
  }

  private tryAssignAndPathToLab(agent: any, role: 'chemist' | 'scientist'): boolean {
    // Найдём все лаборатории
    const labIdxs: number[] = []
    for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i] === 'Лаборатория') labIdxs.push(i)
    if (labIdxs.length === 0) return false
    // Сортируем по расстоянию от текущей позиции
    labIdxs.sort((a, b) => {
      const ra = this.roomRects[a], rb = this.roomRects[b]
      const dax = (ra.x + ra.width / 2) - agent.rect.x
      const day = (ra.y + ra.height / 2) - agent.rect.y
      const dbx = (rb.x + rb.width / 2) - agent.rect.x
      const dby = (rb.y + rb.height / 2) - agent.rect.y
      return (dax * dax + day * day) - (dbx * dbx + dby * dby)
    })
    // Пробуем по очереди найти лабораторию, где свободен слот по роли и есть свободная точка
    for (const idx of labIdxs) {
      // eslint-disable-next-line no-console
      // console.log('[LabAssign:check]', { id: agent.id, role, labIdx: idx, roomName: this.roomNames[idx] })
      const entry = this.ensureRoomEntry(idx)
      // Ограничение: в одной лаборатории может быть только 1 учёный и 1 химик
      if (role === 'chemist' && entry.chemistId != null && entry.chemistId !== agent.id) continue
      if (role === 'scientist' && entry.scientistId != null && entry.scientistId !== agent.id) continue
      const points = this.getRoomStopPoints(idx)
      // Находим первый свободный слот
      let chosenSlot = -1
      for (let s = 0; s < points.length; s++) {
        if (!entry.usedSlots.has(s)) { chosenSlot = s; break }
      }
      if (chosenSlot === -1) continue
      const dst = points[chosenSlot]
      const before: Phaser.Math.Vector2 | undefined = agent.target ? new Phaser.Math.Vector2(agent.target.x, agent.target.y) : undefined
      const prevPath = agent.path ? [...agent.path] : []
      this.buildPathTo(agent, idx, dst, false)
      const bx = before?.x, by = before?.y
      const started = (agent.path && agent.path.length > 0) || (!!agent.target && (bx === undefined || agent.target.x !== bx || agent.target.y !== by))
      if (started) {
        // Освобождаем предыдущую бронь
        this.releaseRoomAssignment(agent)
        // Бронируем выбранную лабораторию и слот
        agent.assignedRoomIndex = idx
        agent.assignedSlotIndex = chosenSlot
        agent.assignedRole = role
        if (role === 'chemist') entry.chemistId = agent.id
        if (role === 'scientist') entry.scientistId = agent.id
        entry.usedSlots.add(chosenSlot)
        // eslint-disable-next-line no-console
        // console.log('[LabAssign:start]', { id: agent.id, role, labIdx: idx, slot: chosenSlot, target: { x: dst.x, y: dst.y } })
        return true
      } else {
        agent.target = before; agent.path = prevPath
      }
    }
    return false
  }

  // Универсальная бронь и построение пути в рабочую комнату по профессии
  private tryAssignAndPathToWorkRoom(agent: any): boolean {
    if (agent.isEnemy) return false
    const prof = (agent.profession || '').toLowerCase()
    let roomName: string | null = null
    let perRoomLimit = 1
    let unlimited = false
    if (prof === 'сантехник') roomName = 'Туалет'
    else if (prof === 'повар') roomName = 'Столовая'
    else if (prof === 'инженер') roomName = 'Техническая'
    else if (prof === 'солдат' || prof === 'охотник' || prof === 'разведчик') { roomName = 'Вход'; unlimited = true; perRoomLimit = Number.MAX_SAFE_INTEGER }
    if (!roomName) return false

    const indices: number[] = []
    for (let i = 0; i < this.roomNames.length; i++) if (this.roomNames[i].toLowerCase() === roomName.toLowerCase()) indices.push(i)
    if (indices.length === 0) return false
    // Сортируем по дистанции от текущей позиции
    indices.sort((a, b) => {
      const ra = this.roomRects[a], rb = this.roomRects[b]
      const dax = (ra.x + ra.width / 2) - agent.rect.x
      const day = (ra.y + ra.height / 2) - agent.rect.y
      const dbx = (rb.x + rb.width / 2) - agent.rect.x
      const dby = (rb.y + rb.height / 2) - agent.rect.y
      return (dax * dax + day * day) - (dbx * dbx + dby * dby)
    })
    for (const idx of indices) {
      const entry = this.ensureRoomEntry(idx)
      if (!entry.workers) entry.workers = {}
      const key = prof
      const cur = entry.workers[key] || 0
      if (!unlimited && cur >= perRoomLimit) continue
      const points = this.getRoomStopPoints(idx)
      // Берём первую свободную точку; для солдат разрешаем любую точку
      let chosenSlot = -1
      for (let s = 0; s < points.length; s++) {
        if (!entry.usedSlots.has(s)) { chosenSlot = s; break }
      }
      if (chosenSlot === -1 && !unlimited) continue
      const dst = (chosenSlot >= 0 ? points[chosenSlot] : points[0])
      const before: Phaser.Math.Vector2 | undefined = agent.target ? new Phaser.Math.Vector2(agent.target.x, agent.target.y) : undefined
      const prevPath = agent.path ? [...agent.path] : []
      this.buildPathTo(agent, idx, dst, false)
      const bx = before?.x, by = before?.y
      const started = (agent.path && agent.path.length > 0) || (!!agent.target && (bx === undefined || agent.target.x !== bx || agent.target.y !== by))
      if (started) {
        // Освободить прежнюю бронь и забронировать
        this.releaseRoomAssignment(agent)
        agent.assignedRoomIndex = idx
        agent.assignedSlotIndex = (chosenSlot >= 0 ? chosenSlot : undefined)
        agent.assignedUnlimited = unlimited
        if (!entry.workers[key]) entry.workers[key] = 0
        entry.workers[key] += 1
        if (chosenSlot >= 0) entry.usedSlots.add(chosenSlot)
        // eslint-disable-next-line no-console
        // console.log('[WorkAssign:start]', { id: agent.id, prof, roomIdx: idx, slot: chosenSlot, target: { x: dst.x, y: dst.y } })
        return true
      } else {
        agent.target = before; agent.path = prevPath
      }
    }
    return false
  }

  private ensureSleepEntry(idx: number): Set<number> {
    let s = this.sleepOccupancy.get(idx)
    if (!s) { s = new Set<number>(); this.sleepOccupancy.set(idx, s) }
    return s
  }

  private pushAgentStatus(agent: any): void {
    const sceneAny: any = this.scene as any
    if (agent.id == null) return
    // Вычислим комнату, в которой сейчас стоит агент
    let atIdx: number | null = null
    for (let i = 0; i < this.roomRects.length; i++) {
      if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) { atIdx = i; break }
    }
    const atName = (atIdx != null) ? this.roomNames[atIdx] : undefined
    let status = 'отдыхает'
    const prof = (agent.profession || '').toLowerCase()
    const isLabWorker = prof === 'химик' || prof === 'ученый' || prof === 'учёный'
    // Сон приоритетен
    if (agent.scheduleState === 'sleep' || (agent.sleeping && atName === 'Спальня')) {
      status = 'спит'
    } else if (agent.scheduleState === 'work') {
      // Работа: берём закреплённую или ожидаемую комнату
      let rn: string | undefined
      if (agent.assignedRoomIndex != null) rn = this.roomNames[agent.assignedRoomIndex]
      else if (agent.workRoomIndex != null) rn = this.roomNames[agent.workRoomIndex]
      else if (agent.stayInRoomName) rn = agent.stayInRoomName
      else if (isLabWorker) rn = 'Лаборатория'
      status = `работает в ${rn ?? '—'}`
    } else if (isLabWorker && (atName === 'Лаборатория' || agent.assignedRoomIndex != null)) {
      // Вне рабочего состояния, но стоит в лаборатории или закреплена — считаем, что работает
      const rn = (agent.assignedRoomIndex != null) ? this.roomNames[agent.assignedRoomIndex] : 'Лаборатория'
      status = `работает в ${rn}`
    }
    sceneAny._updateResidentStatus?.(agent.id, status)
    
    // Обновляем шкалу здоровья агента
    this.updateHealthBar(agent)
  }

  private updateSleepFx = (agent: any, visible: boolean) => {
    if (visible) {
      if (!agent.sleepFx || !agent.sleepFx.scene) {
        agent.sleepFx = this.scene.add.text(0, 0, 'Zzz', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#b3c2ff'
        }).setOrigin(0.5)
        ;(agent.sleepFx as any).name = 'fx'
        agent.sleepFx.setShadow(1, 1, '#000000', 2, true, true)
        this.overlay.add(agent.sleepFx)
        agent.sleepFx.setDepth(200)
        agent.sleepFxTween = this.scene.tweens.add({
          targets: agent.sleepFx,
          y: '-=4',
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
      const mContent = this.content.getWorldTransformMatrix()
      const mRoot = this.root.getWorldTransformMatrix()
      const world = new Phaser.Math.Vector2(agent.rect.x, agent.rect.y - 28)
      mContent.transformPoint(world.x, world.y, world)
      const local = new Phaser.Math.Vector2()
      mRoot.applyInverse(world.x, world.y, local)
      agent.sleepFx.setPosition(local.x, local.y)
      agent.sleepFx.setVisible(true)
    } else {
      if (agent.sleepFx) agent.sleepFx.setVisible(false)
    }
  }

  private updateWorkFx = (agent: any, visible: boolean) => {
    if (visible) {
      if (!agent.workFx || !agent.workFx.scene) {
        agent.workFx = this.scene.add.text(0, 0, '⚙', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#ffd54f'
        }).setOrigin(0.5)
        ;(agent.workFx as any).name = 'fx'
        agent.workFx.setShadow(1, 1, '#000000', 2, true, true)
        this.overlay.add(agent.workFx)
        agent.workFx.setDepth(200)
        agent.workFxTween = this.scene.tweens.add({
          targets: agent.workFx,
          y: '-=4',
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
      const mContent = this.content.getWorldTransformMatrix()
      const mRoot = this.root.getWorldTransformMatrix()
      const world = new Phaser.Math.Vector2(agent.rect.x, agent.rect.y - 28)
      mContent.transformPoint(world.x, world.y, world)
      const local = new Phaser.Math.Vector2()
      mRoot.applyInverse(world.x, world.y, local)
      agent.workFx.setPosition(local.x, local.y)
      agent.workFx.setVisible(true)
    } else {
      if (agent.workFx) agent.workFx.setVisible(false)
    }
  }

  public enableAnimationDebug(enabled: boolean): void {
    this.debugAnim = !!enabled
    // Очистим отладочные оверлеи, если выключили
    if (!this.debugAnim) {
      for (const agent of this.residentAgents) {
        if (agent.debugText && agent.debugText.scene) agent.debugText.destroy()
        agent.debugText = undefined
      }
    }
  }

  // Функция для нанесения урона врагу от жителя
  private damageEnemy(enemy: any, attacker: any): void {
    if (!enemy || !attacker || !enemy.health || !attacker.attackDamage) {
      return
    }
    
    // Наносим урон
    enemy.health -= attacker.attackDamage
    
    console.log(`[bunkerView] Житель ${attacker.profession} (ID: ${attacker.id}) наносит ${attacker.attackDamage} урона врагу ${enemy.enemyType} (ID: ${enemy.id}). Осталось здоровья: ${enemy.health}`)
    
    // Проверяем, умер ли враг
    if (enemy.health <= 0) {
      console.log(`[bunkerView] Враг ${enemy.enemyType} (ID: ${enemy.id}) убит жителем ${attacker.profession}!`)
      
      // Устанавливаем dead анимацию
      this.setDeadAnimation(enemy)
      
      // Сбрасываем цель атаки у жителя
      attacker.combatTarget = undefined
      attacker.animLock = 'idle'
    } else {
      // Враг жив - устанавливаем hurt анимацию
      this.setDeadAnimation(enemy)
    }
  }

  // Функция для нанесения урона жителю от врага
  private damageResident(resident: any, attacker: any): void {
    if (!resident || !attacker || !resident.health || !attacker.attackDamage) {
      return
    }
    
         // Наносим урон
     resident.health -= attacker.attackDamage
     
     // Синхронизируем здоровье с GameScene
     if (!resident.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
       (this.scene as any).updateResidentHealth(resident.id, resident.health);
     }
     
     const attackerType = attacker.isEnemy ? `враг ${attacker.enemyType}` : `житель ${attacker.profession}`
         console.log(`[bunkerView] ${attackerType} наносит ${attacker.attackDamage} урона жителю ${resident.profession}. Осталось здоровья: ${resident.health}`)
    
    // Проверяем, умер ли житель
    if (resident.health <= 0) {
      console.log(`[bunkerView] Житель ${resident.profession} (ID: ${resident.id}) умер от потери здоровья!`)
      
      // Устанавливаем dead анимацию
      this.setDeadAnimation(resident)
      
      // Сбрасываем цель атаки у атакующего
      attacker.combatTarget = undefined
      attacker.animLock = 'idle'

      // Уведомляем GameScene об смерти жителя
      this.notifyResidentDeath(resident.id)
    } else {
      // Житель жив - устанавливаем hurt анимацию
      this.setHurtAnimation(resident)
    }
  }

  // Функция для нанесения урона жителю от безумного жителя
  private damageResidentByInsane(resident: any, insaneAttacker: any): void {
    if (!resident || !insaneAttacker || !resident.health || !insaneAttacker.attackDamage) {
      return
    }

         // Наносим урон
     resident.health -= insaneAttacker.attackDamage
     
     // Синхронизируем здоровье с GameScene
     if (!resident.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
       (this.scene as any).updateResidentHealth(resident.id, resident.health);
     }
     
     console.log(`[bunkerView] Безумный житель ${insaneAttacker.profession} наносит ${insaneAttacker.attackDamage} урона жителю ${resident.profession}. Осталось здоровья: ${resident.health}`)

    // Проверяем, умер ли житель
    if (resident.health <= 0) {
      console.log(`[bunkerView] Житель ${resident.profession} (ID: ${resident.id}) убит безумным жителем ${insaneAttacker.profession}!`)

      // Устанавливаем dead анимацию
      this.setDeadAnimation(resident)

      // Сбрасываем цель атаки у безумного жителя
      ;(insaneAttacker as any).enemyTargetId = undefined
      insaneAttacker.animLock = 'idle'

      // Уведомляем GameScene об смерти жителя
      this.notifyResidentDeath(resident.id)
    } else {
      // Житель жив - устанавливаем hurt анимацию
      this.setHurtAnimation(resident)
    }
  }

  // Функция для уведомления GameScene о смерти жителя
  private notifyResidentDeath(residentId: number): void {
    const game: any = this.scene
    if (game && typeof game.removeResidentFromBunker === 'function') {
      game.removeResidentFromBunker(residentId, 'убит в драке между жителями')
    }
  }

  // Функция для отрисовки шкалы здоровья агента
  private drawHealthBar(agent: any): void {
    if (!agent.health || agent.health <= 0) return
    
    // Скрываем шкалу здоровья для охотников и разведчиков на поверхности
    if ((agent.profession === 'охотник' || agent.profession === 'разведчик') && (agent as any).away) {
      return
    }
    
    // Удаляем старую шкалу здоровья если есть
    if (agent.healthBar) {
      agent.healthBar.destroy()
      agent.healthBar = null
    }
    
    // Создаем новую шкалу здоровья
    const barWidth = 24
    const barHeight = 4
    const maxHealth = agent.isEnemy ? 80 : (agent.profession === 'солдат' || agent.profession === 'охотник' ? 150 : 100)
    const healthPercent = agent.health / maxHealth
    
    // Используем основной спрайт или rect как точку отсчета для позиции
    const mainSprite = agent.sprite || agent.rect
    const healthBar = this.scene.add.container(mainSprite.x, mainSprite.y - 20)
    
    // Фон шкалы (серый)
    const background = this.scene.add.graphics()
    background.fillStyle(0x666666, 0.8)
    background.fillRect(-barWidth/2, 0, barWidth, barHeight)
    healthBar.add(background)
    
    // Полоска здоровья (зеленая/желтая/красная)
    const healthGraphics = this.scene.add.graphics()
    if (healthPercent > 0.6) {
      healthGraphics.fillStyle(0x00ff00, 1) // Зеленый
    } else if (healthPercent > 0.3) {
      healthGraphics.fillStyle(0xffff00, 1) // Желтый
    } else {
      healthGraphics.fillStyle(0xff0000, 1) // Красный
    }
    // Ограничиваем размер полоски здоровья границами контейнера
    const healthWidth = Math.max(0, Math.min(barWidth, barWidth * healthPercent))
    healthGraphics.fillRect(-barWidth/2, 0, healthWidth, barHeight)
    healthBar.add(healthGraphics)
    
    // Рамка шкалы
    const border = this.scene.add.graphics()
    border.lineStyle(1, 0xffffff, 1)
    border.strokeRect(-barWidth/2, 0, barWidth, barHeight)
    healthBar.add(border)
    
    // Добавляем шкалу в правильный контейнер в зависимости от того, на поверхности ли житель
    const isOnSurface = (agent as any).onSurface
    const gameScene = this.scene as any
    if (isOnSurface && gameScene.surfaceQueue) {
      // Для жителей на поверхности добавляем шкалу в surfaceQueue
      gameScene.surfaceQueue.add(healthBar)
      console.log(`[bunkerView] Шкала здоровья добавлена в surfaceQueue для жителя на поверхности`)
    } else {
      // Для жителей в бункере добавляем шкалу в content
    this.content.add(healthBar)
    }
    healthBar.setDepth(150) // Выше спрайтов агентов
    
    // Сохраняем ссылку на шкалу здоровья
    agent.healthBar = healthBar
  }

  // Функция для обновления позиции шкалы здоровья агента
  private updateHealthBar(agent: any): void {
    if (!agent.healthBar || !agent.rect) return
    
    // Скрываем шкалу здоровья для охотников и разведчиков на поверхности
    if ((agent.profession === 'охотник' || agent.profession === 'разведчик') && (agent as any).away) {
        if (agent.healthBar) {
        agent.healthBar.setVisible(false)
        }
        return
    }
    
    // Проверяем правильность контейнера шкалы здоровья
    const isOnSurface = (agent as any).onSurface
    const gameScene = this.scene as any
    const currentParent = agent.healthBar.parentContainer
    const shouldBeInSurface = isOnSurface && gameScene.surfaceQueue
    const shouldBeInContent = !isOnSurface || !gameScene.surfaceQueue

    // Перемещаем шкалу здоровья в правильный контейнер если нужно
    if (shouldBeInSurface && currentParent !== gameScene.surfaceQueue) {
      if (currentParent) {
        currentParent.remove(agent.healthBar)
      }
      gameScene.surfaceQueue.add(agent.healthBar)
      console.log(`[bunkerView] Шкала здоровья перемещена в surfaceQueue для жителя на поверхности`)
    } else if (shouldBeInContent && currentParent !== this.content) {
      if (currentParent) {
        currentParent.remove(agent.healthBar)
      }
      this.content.add(agent.healthBar)
      console.log(`[bunkerView] Шкала здоровья перемещена в content для жителя в бункере`)
    }
    
    // Показываем шкалу здоровья если она была скрыта
    if (agent.healthBar && !agent.healthBar.visible) {
      agent.healthBar.setVisible(true)
      console.log(`[bunkerView] Шкала здоровья сделана видимой для жителя ${agent.profession}`)
    }
    
    // Проверяем смерть жителя
    if (agent.health <= 0) {
        console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) умер от потери здоровья!`)
      
      // Проверяем состояние врагов перед удалением жителя
      const enemies = this.residentAgents.filter(a => a && a.isEnemy)
      console.log(`[DEBUG] updateHealthBar: перед удалением жителя ${agent.profession} (ID: ${agent.id}): найдено врагов=${enemies.length}`)
      enemies.forEach(enemy => {
        // console.log(`[DEBUG] updateHealthBar: враг ${enemy.enemyType} (ID: ${enemy.id}): sprite=${!!enemy.sprite}, sprite.anims=${!!enemy.sprite?.anims}`)
      })
      
        this.removeDeadResident(agent)
        return
    }
    
    // Обновляем позицию шкалы здоровья относительно агента
    // Используем основной спрайт или rect как точку отсчета
    const mainSprite = agent.sprite || agent.rect
    const healthBarOffset = isOnSurface ? 25 : 20 // Разное расстояние для поверхности и бункера
    agent.healthBar.setPosition(mainSprite.x, mainSprite.y - healthBarOffset)
    
    // Обновляем цвет и размер полоски здоровья
    const maxHealth = agent.isEnemy ? 80 : (agent.profession === 'солдат' || agent.profession === 'охотник' ? 150 : 100)
    const healthPercent = agent.health / maxHealth
    
    // Находим графику здоровья в контейнере
    const healthGraphics = agent.healthBar.list[1] as Phaser.GameObjects.Graphics
    if (healthGraphics) {
      healthGraphics.clear()
      if (healthPercent > 0.6) {
        healthGraphics.fillStyle(0x00ff00, 1) // Зеленый
      } else if (healthPercent > 0.3) {
        healthGraphics.fillStyle(0xffff00, 1) // Желтый
      } else {
        healthGraphics.fillStyle(0xff0000, 1) // Красный
      }
             // Ограничиваем размер полоски здоровья границами контейнера
       const healthWidth = Math.max(0, Math.min(24, 24 * healthPercent))
       healthGraphics.fillRect(-12, 0, healthWidth, 4)
     }
     
     // Синхронизируем здоровье с GameScene
     if (!agent.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
       (this.scene as any).updateResidentHealth(agent.id, agent.health);
     }
   }

  // Функция для удаления мертвого жителя
  private removeDeadResident(agent: any): void {
    console.log(`[bunkerView] Удаляем мертвого жителя ${agent.profession} (ID: ${agent.id})`)

    // Удаляем агента из residentAgents
    const agentIndex = this.residentAgents.findIndex(a => a && a.id === agent.id)
    if (agentIndex >= 0) {
      const removedAgent = this.residentAgents.splice(agentIndex, 1)[0]
      console.log(`[DEBUG] Агент ${agent.profession} (ID: ${agent.id}) удален из residentAgents`)
      
      // Очищаем таймер атаки если есть
      if ((removedAgent as any).attackTimer) {
        clearTimeout((removedAgent as any).attackTimer)
        ;(removedAgent as any).attackTimer = null
      }
      
      // Уничтожаем графические объекты
      removedAgent.rect.destroy()
      removedAgent.sprite?.destroy()
      removedAgent.shirt?.destroy()
      removedAgent.pants?.destroy()
      removedAgent.footwear?.destroy()
      removedAgent.hair?.destroy()
      
      // Уничтожаем шкалу здоровья если есть
      if (removedAgent.healthBar) {
        removedAgent.healthBar.destroy()
        console.log(`[DEBUG] Шкала здоровья агента ${agent.profession} (ID: ${agent.id}) уничтожена`)
      }
      
      console.log(`[DEBUG] Графические объекты агента ${agent.profession} (ID: ${agent.id}) уничтожены`)
    } else {
      console.warn(`[DEBUG] Агент ${agent.profession} (ID: ${agent.id}) не найден в residentAgents`)
    }
    
    // НЕ уведомляем GameScene об удалении жителя, так как это может вызвать циклический вызов
    // GameScene уже знает о смерти жителя и сам управляет процессом
    
    // Проверяем состояние врагов после удаления жителя
    const remainingEnemies = this.residentAgents.filter(a => a && a.isEnemy)
    console.log(`[DEBUG] После удаления жителя ${agent.profession} (ID: ${agent.id}): найдено врагов=${remainingEnemies.length}`)
    remainingEnemies.forEach(enemy => {
      console.log(`[DEBUG] Враг ${enemy.enemyType} (ID: ${enemy.id}): sprite=${!!enemy.sprite}, sprite.anims=${!!enemy.sprite?.anims}`)
    })
  }

  // Функция для установки hurt анимации при получении урона
  public setHurtAnimation(agent: any): void {
    console.log(`[DEBUG] setHurtAnimation вызвана для ${agent.isEnemy ? 'врага' : 'жителя'} ${agent.profession || agent.enemyType} (ID: ${agent.id})`)
    
    if (!agent || !agent.sprite || !agent.sprite.anims) {
      console.warn(`[setHurtAnimation] Агент не имеет спрайта или анимаций: agent=${!!agent}, sprite=${!!agent?.sprite}, anims=${!!agent?.sprite?.anims}`)
      return
    }
    
    // Устанавливаем hurt анимацию с высоким приоритетом
    agent.animLock = 'hurt'
    console.log(`[DEBUG] Установлен animLock=hurt для агента ${agent.profession || agent.enemyType} (ID: ${agent.id})`)
    
    // Определяем ключ анимации в зависимости от типа агента
    let animationKey = null
    
      if (agent.isEnemy) {
      // Для врагов
      if (agent.enemyType === 'МАРОДЕР') {
        const kind = agent.marauderKind || 1
        animationKey = `r${kind}_hurt`
      } else if (agent.enemyType === 'ЗОМБИ') {
        const kind = agent.zombieKind || 'wild'
        animationKey = `z_${kind}_hurt`
      } else if (agent.enemyType === 'МУТАНТ') {
        const k = agent.mutantKind || 1
        animationKey = `m${k}_hurt`
      } else if (agent.enemyType === 'СОЛДАТ') {
        animationKey = 'sold_hurt'
      }
      } else {
      // Для жителей - используем специализированные анимации
      if (agent.profession) {
        const prof = agent.profession.toLowerCase()
        // Проверяем существование анимации для специализации
        if (this.scene.anims.exists(`${prof}_hurt`)) {
          animationKey = `${prof}_hurt`
          console.log(`[DEBUG] Найдена hurt анимация для специализации: ${animationKey}`)
        } else {
          // Fallback на базовые анимации
          if (this.scene.anims.exists('unemployed_hurt')) {
            animationKey = 'unemployed_hurt'
            console.log(`[DEBUG] Используем fallback hurt анимацию: unemployed_hurt`)
          } else {
            console.warn(`[setHurtAnimation] Не найдена ни специализированная, ни fallback hurt анимация для ${prof}`)
            agent.animLock = 'idle'
            return
          }
        }
      }
    }
    
    if (animationKey && this.scene.anims.exists(animationKey)) {
      try {
        agent.sprite.anims.play(animationKey, false)
        console.log(`[DEBUG] Воспроизводится hurt анимация: ${animationKey} для ${agent.isEnemy ? 'врага' : 'жителя'} ${agent.profession || agent.enemyType}`)
        
        // Через 500ms возвращаемся к idle анимации
        setTimeout(() => {
          if (agent.animLock === 'hurt') {
            agent.animLock = 'idle'
            // Вместо this.playAll('idle') просто устанавливаем анимацию напрямую
            if (agent.sprite && agent.sprite.anims) {
              try {
                // Определяем ключ анимации для idle
                let idleAnimationKey = null
                if (agent.isEnemy) {
                  // Для врагов
                  if (agent.enemyType === 'МАРОДЕР') {
                    const kind = agent.marauderKind || 1
                    idleAnimationKey = `r${kind}_idle`
                  } else if (agent.enemyType === 'ЗОМБИ') {
                    const kind = agent.zombieKind || 'wild'
                    idleAnimationKey = `z_${kind}_idle`
                  } else if (agent.enemyType === 'МУТАНТ') {
                    const k = agent.mutantKind || 1
                    idleAnimationKey = `m${k}_idle`
                  } else if (agent.enemyType === 'СОЛДАТ') {
                    idleAnimationKey = 'sold_idle'
                  }
                } else {
                  // Для жителей
                  if (agent.profession) {
                    const prof = agent.profession.toLowerCase()
                    idleAnimationKey = `${prof}_idle`
                  }
                }
                
                if (idleAnimationKey && this.scene.anims.exists(idleAnimationKey)) {
                  agent.sprite.anims.play(idleAnimationKey, true)
                }
              } catch (e) {
                console.warn(`[setHurtAnimation] Не удалось воспроизвести idle анимацию после hurt:`, e)
              }
            }
          }
        }, 500)
      } catch (e) {
        console.warn(`[setHurtAnimation] Не удалось воспроизвести hurt анимацию ${animationKey}:`, e)
        agent.animLock = 'idle'
      }
    } else {
      console.warn(`[setHurtAnimation] Анимация ${animationKey} не найдена для hurt анимации`)
      agent.animLock = 'idle'
    }
  }

  // Функция для установки dead анимации перед уничтожением
  public setDeadAnimation(agent: any): void {
    console.log(`[DEBUG] setDeadAnimation вызвана для ${agent.isEnemy ? 'врага' : 'жителя'} ${agent.profession || agent.enemyType} (ID: ${agent.id})`)
    
    if (!agent || !agent.sprite || !agent.sprite.anims) {
      console.warn(`[setDeadAnimation] Агент не имеет спрайта или анимаций: agent=${!!agent}, sprite=${!!agent?.sprite}, anims=${!!agent?.sprite?.anims}`)
      return
    }
    
    // Устанавливаем dead анимацию с максимальным приоритетом
    agent.animLock = 'dead'
    console.log(`[DEBUG] Установлен animLock=dead для агента ${agent.profession || agent.enemyType} (ID: ${agent.id})`)
    
    // Определяем ключ анимации в зависимости от типа агента
    let animationKey = null
    
    if (agent.isEnemy) {
      // Для врагов
      if (agent.enemyType === 'МАРОДЕР') {
        const kind = agent.marauderKind || 1
        animationKey = `r${kind}_dead`
      } else if (agent.enemyType === 'ЗОМБИ') {
        const kind = agent.zombieKind || 'wild'
        animationKey = `z_${kind}_dead`
      } else if (agent.enemyType === 'МУТАНТ') {
        const k = agent.mutantKind || 1
        animationKey = `m${k}_dead`
      } else if (agent.enemyType === 'СОЛДАТ') {
        animationKey = 'sold_dead'
      }
    } else {
      // Для жителей - используем специализированные анимации
      if (agent.profession) {
        const prof = agent.profession.toLowerCase()
        // Проверяем существование анимации для специализации
        if (this.scene.anims.exists(`${prof}_dead`)) {
          animationKey = `${prof}_dead`
          console.log(`[DEBUG] Найдена dead анимация для специализации: ${animationKey}`)
        } else {
          // Fallback на базовые анимации - проверяем несколько вариантов
          const fallbackAnimations = [
            'unemployed_dead',
            'civilian_dead', 
            'worker_dead',
            'dead'
          ]
          
          for (const fallbackAnim of fallbackAnimations) {
            if (this.scene.anims.exists(fallbackAnim)) {
              animationKey = fallbackAnim
              console.log(`[DEBUG] Используем fallback dead анимацию: ${fallbackAnim}`)
              break
            }
          }
          
          if (!animationKey) {
            console.warn(`[setDeadAnimation] Не найдена ни специализированная, ни fallback dead анимация для ${prof}`)
            // Если анимация не найдена, сразу уничтожаем
            this.removeResidentAgent(agent.id)
            return
          }
        }
      }
    }
    
    if (animationKey && this.scene.anims.exists(animationKey)) {
      try {
        agent.sprite.anims.play(animationKey, false)
        console.log(`[DEBUG] Воспроизводится dead анимация: ${animationKey} для ${agent.isEnemy ? 'врага' : 'жителя'} ${agent.profession || agent.enemyType}`)
        
        // Через 1000ms уничтожаем агента
        console.log(`[setDeadAnimation] Устанавливаем таймер на 1000ms для удаления агента ${agent.id}`)
        setTimeout(() => {
          console.log(`[setDeadAnimation] Таймер истек для агента ${agent.id}, animLock=${agent.animLock}`)
          
          // Проверяем, что агент все еще существует в массиве
          const agentStillExists = this.residentAgents.some(a => a && a.id === agent.id)
          if (!agentStillExists) {
            console.log(`[setDeadAnimation] Агент ${agent.id} уже удален из массива, пропускаем удаление`)
            return
          }
          
          if (agent.animLock === 'dead') {
            console.log(`[setDeadAnimation] Таймер истек, удаляем агента ${agent.id}`)
            if (agent.isEnemy) {
              this.removeDeadEnemy(agent)
            } else {
              // Для жителей используем публичный метод removeResidentAgent
              this.removeResidentAgent(agent.id)
            }
          } else {
            console.log(`[setDeadAnimation] Агент ${agent.id} больше не мертв (animLock=${agent.animLock}), пропускаем удаление`)
          }
        }, 1000)
      } catch (e) {
        console.warn(`[setDeadAnimation] Не удалось воспроизвести dead анимацию ${animationKey}:`, e)
        // Если анимация не работает, сразу уничтожаем
        if (agent.isEnemy) {
          this.removeDeadEnemy(agent)
        } else {
          this.removeResidentAgent(agent.id)
        }
      }
    } else {
      console.warn(`[setDeadAnimation] Анимация ${animationKey} не найдена для dead анимации`)
      // Если анимация не найдена, сразу уничтожаем
      if (agent.isEnemy) {
        this.removeDeadEnemy(agent)
      } else {
        this.removeResidentAgent(agent.id)
      }
    }
  }

  // Функция для удаления мертвого врага
  private removeDeadEnemy(enemy: any): void {
    if (!enemy) return
    
    console.log(`[bunkerView] Удаляем мертвого врага ${enemy.enemyType} (ID: ${enemy.id})`)
    
    // Уничтожаем спрайт и другие графические объекты
    if (enemy.sprite) {
      enemy.sprite.destroy()
    }
    if (enemy.healthBar) {
      enemy.healthBar.destroy()
    }
    
    // Удаляем из списка агентов
    const index = this.residentAgents.findIndex(a => a && a.id === enemy.id)
    if (index !== -1) {
      this.residentAgents.splice(index, 1)
      console.log(`[DEBUG] Враг ${enemy.enemyType} (ID: ${enemy.id}) удален из residentAgents`)
    }
    
    // Сбрасываем цели атаки у жителей, которые атаковали этого врага
    this.residentAgents.forEach(agent => {
      if (agent && agent.combatTarget === enemy.id) {
        agent.combatTarget = undefined
        agent.animLock = 'idle'
        console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) сбросил цель атаки`)
      }
    })
    
    // Уведомляем GameScene об удалении врага из бункера
    const gameScene = this.scene as any
    if (gameScene.removeEnemyFromBunker) {
      gameScene.removeEnemyFromBunker(enemy.id, 'убит жителями')
    }
  }

  // Функция для инициализации боевых параметров жителя
  private initializeCombatStats(agent: any): void {
    if (!agent || agent.isEnemy) return
    
    // Базовые параметры для всех жителей
         agent.health = 100
     agent.attackDamage = 15
     
     // Синхронизируем здоровье с GameScene
     if (!agent.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
       (this.scene as any).updateResidentHealth(agent.id, agent.health);
     }
     
     agent.attackRange = 50
     agent.attackCooldown = 1000 // 1 секунда
    agent.lastResidentAttackTime = 0
    
    // Определяем агрессивность по специальности
    if (agent.profession === 'солдат' || agent.profession === 'охотник' || agent.profession === 'разведчик') {
      agent.isAggressive = true
      console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) помечен как агрессивный`)
    }
    
    // Проверяем навык "герой"
    if (agent.skills && agent.skills.some((skill: any) => skill.text === 'герой')) {
      agent.isAggressive = true
      console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) имеет навык "герой" - помечен как агрессивный`)
    }
    
    // Проверяем навык "трус"
    if (agent.skills && agent.skills.some((skill: any) => skill.text === 'трус')) {
      agent.isCoward = true
      console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) имеет навык "трус" - не будет вступать в бой`)
    }

    // Проверяем intent для установки агрессивности (безумные жители)
    if ((agent as any).intent === 'hostile' && !agent.isEnemy) {
      agent.isAggressive = true
      agent.isCoward = false // Безумие преодолевает трусость
      console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) имеет hostile intent - помечен как агрессивный (безумный)`)
    }
  }

  private updateResidentCombat(agent: any): void {
    if (!agent || agent.isEnemy || (agent.isCoward && !((agent as any).intent === 'hostile'))) return

    // console.log(`[updateResidentCombat] Обрабатываем жителя ${agent.profession} (ID: ${agent.id}), intent=${(agent as any).intent}, animLock=${agent.animLock}`)
    
    // Инициализируем боевые параметры если нужно
    if (agent.health === undefined) {
      this.initializeCombatStats(agent)
    }
    
    // Если житель агрессивный и на поверхности - возвращаемся
    if (agent.isAggressive && agent.away) {
      // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: возвращаемся только если есть враги в бункере
      const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
      if (enemies.length === 0) {
        // console.log(`[DEBUG] Агрессивный житель ${agent.profession} (ID: ${agent.id}) остается на поверхности - нет врагов`)
        return
      }
      
      console.log(`[DEBUG] Агрессивный житель ${agent.profession} (ID: ${agent.id}) возвращается с поверхности для боя`)
      agent.away = false
      
      // Для охотников и разведчиков: показываем спрайт, но скрываем рамку
      if (agent.profession === 'охотник' || agent.profession === 'разведчик') {
        if (agent.sprite) {
          agent.sprite.setVisible(true)
          agent.rect.setVisible(false) // Скрываем рамку для охотников/разведчиков
        } else {
          agent.rect.setVisible(true) // Показываем рамку только если нет спрайта
        }
      } else {
        // Для остальных жителей: показываем и рамку, и спрайт
      agent.rect.setVisible(true)
      agent.sprite?.setVisible(true)
      }
      
      // Возвращаемся к входу
      const entranceIdx = this.roomNames.indexOf('Вход')
      if (entranceIdx >= 0) {
        this.buildPathTo(agent, entranceIdx, new Phaser.Math.Vector2(144, 86), false)
        agent.animLock = 'walk'
      }
      return
    }
    
    // Определяем поведение в зависимости от intent
    let targets: any[] = []
    let targetType = 'enemy'

    // Сначала проверяем обычных врагов
    const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
    if (enemies.length > 0) {
      targets = enemies
      targetType = 'enemy'
    }

    // Если житель безумный, он может атаковать других жителей даже при наличии врагов
    if ((agent as any).intent === 'hostile' && agent.isAggressive && !agent.isEnemy) {
      // Безумные жители ищут другие цели (других жителей)
      const otherResidents = this.residentAgents.filter(a =>
        a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0
      )
      if (otherResidents.length > 0) {
        targets = otherResidents
        targetType = 'resident'
      }
    }

    if (targets.length === 0) {
      // Нет целей - возвращаемся к обычному режиму
      if (agent.combatTarget || (targetType === 'resident' && (agent as any).enemyTargetId)) {
        agent.combatTarget = undefined
        ;(agent as any).enemyTargetId = undefined
        agent.animLock = 'idle'
        agent.target = undefined
        agent.path = undefined
        agent.dwellUntil = undefined

        // Показываем рамку для охотников/разведчиков при возвращении к обычному режиму
        if (agent.profession === 'охотник' || agent.profession === 'разведчик') {
          agent.rect.setVisible(true)
        }

        console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) возвращается к обычному режиму - нет целей`)
      }
      return
    }
    
    // Определяем цель атаки
    let target = null
    if (targetType === 'resident' && (agent as any).enemyTargetId) {
      // Для безумных жителей используем enemyTargetId
      target = this.residentAgents.find(a =>
        a && !a.isEnemy && a.id === (agent as any).enemyTargetId && (a.health || 0) > 0
      )
      if (!target) {
        ;(agent as any).enemyTargetId = undefined
      }
    } else if (agent.combatTarget) {
      // Для обычных жителей используем combatTarget
      target = targets.find(t => t.id === agent.combatTarget)
      if (!target || (target.health || 0) <= 0) {
        agent.combatTarget = undefined
        target = null
      }
    }
    
    // Если нет цели - выбираем новую
    if (!target && targets.length > 0) {
      if (targetType === 'enemy') {
        // Логика для выбора вражеских целей
      if (agent.isAggressive) {
        // Агрессивные жители ищут врагов по всему бункеру
          target = targets[0] // Берем первую цель
      } else {
          // Обычные жители атакуют только цели в той же комнате
        const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
          target = targets.find(t => {
            const targetRoom = this.findRoomIndexAt(t.rect.x, t.rect.y)
            return agentRoom === targetRoom
          })
        }

        if (target) {
          agent.combatTarget = target.id
          console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) выбрал цель: враг ${target.enemyType} (ID: ${target.id})`)
        }
      } else if (targetType === 'resident' && (agent as any).intent === 'hostile') {
        // Безумные жители выбирают другие цели (жителей) случайно
        target = targets[Math.floor(Math.random() * targets.length)]
        if (target) {
          ;(agent as any).enemyTargetId = target.id
          console.log(`[DEBUG] Безумный житель ${agent.profession} (ID: ${agent.id}) выбрал цель: житель ${target.profession} (ID: ${target.id})`)
        }
      }
    }
    
    // Если есть цель - атакуем
    if (target && (agent.combatTarget || (targetType === 'resident' && (agent as any).enemyTargetId))) {
      // Скрываем зеленую рамку для охотников/разведчиков в бою
      if (agent.profession === 'охотник' || agent.profession === 'разведчик') {
        agent.rect.setVisible(false)
      }

      const distance = Phaser.Math.Distance.Between(
        agent.rect.x, agent.rect.y,
        target.rect.x, target.rect.y
      )

      if (distance <= agent.attackRange) {
        // В радиусе атаки
        const now = Date.now()
        if (now - agent.lastResidentAttackTime >= agent.attackCooldown) {
          // Атакуем
          agent.animLock = 'attack'
          agent.lastResidentAttackTime = now

          // Наносим урон
          if (targetType === 'enemy') {
            this.damageEnemy(target, agent)
            console.log(`[DEBUG] Житель ${agent.profession} (ID: ${agent.id}) атакует врага ${target.enemyType} (ID: ${target.id})`)
          } else if (targetType === 'resident') {
            // Атака безумного жителя на обычного жителя
            this.damageResidentByInsane(target, agent)
            console.log(`[DEBUG] Безумный житель ${agent.profession} (ID: ${agent.id}) атакует жителя ${target.profession} (ID: ${target.id})`)
          }
        }
      } else {
        // Двигаемся к цели
        if (agent.isAggressive || this.findRoomIndexAt(agent.rect.x, agent.rect.y) === this.findRoomIndexAt(target.rect.x, target.rect.y)) {
          agent.target = new Phaser.Math.Vector2(target.rect.x, target.rect.y)
          agent.animLock = 'walk'
        }
      }
    } else {
      // Нет цели атаки - возвращаем обычную логику отображения
      if (agent.profession === 'охотник' || agent.profession === 'разведчик') {
        if (agent.sprite && agent.sprite.visible) {
          agent.rect.setVisible(false) // Скрываем рамку если есть спрайт
        } else {
          agent.rect.setVisible(true) // Показываем рамку если нет спрайта
        }
      }
    }
  }

  /**
   * Проверяет и активирует безумных жителей
   */
  private checkInsaneResidents(): void {
    console.log(`[checkInsaneResidents] Начинаем проверку безумных жителей`)

    for (const agent of this.residentAgents) {
      if (!agent || agent.isEnemy || (agent.isCoward && !((agent as any).intent === 'hostile'))) continue

      // Пропускаем мертвых жителей (animLock === 'dead')
      if (agent.animLock === 'dead') {
        console.log(`[checkInsaneResidents] Пропускаем мертвого жителя ${agent.profession} (ID: ${agent.id}) - animLock=dead`)
        continue
      }

      // Проверяем безумных жителей
      if ((agent as any).intent === 'hostile' && agent.isAggressive) {
        console.log(`[checkInsaneResidents] Найден безумный житель ${agent.profession} (ID: ${agent.id}), animLock=${agent.animLock}, combatTarget=${(agent as any).combatTarget}`)

        // Проверяем, не застрял ли безумный житель
        const isStuck = agent.animLock === null || agent.animLock === 'idle'
        const hasNoTarget = !(agent as any).enemyTargetId && !agent.target && (!agent.path || agent.path.length === 0)

        if (isStuck || hasNoTarget) {
          console.log(`[checkInsaneResidents] Безумный житель ${agent.profession} (ID: ${agent.id}) застрял! Восстанавливаем активность`)
          this.restoreInsaneResidentActivity(agent)
        }

        // Используем ту же логику, что и у врагов
        this.handleInsaneResidentCombat(agent)
      }
    }
  }

  /**
   * Восстанавливает активность застрявшего врага
   */
  private restoreEnemyActivity(agent: any): void {
    console.log(`[restoreEnemyActivity] Восстанавливаем активность врага ${agent.enemyType} (ID: ${agent.id})`)

    // Сбрасываем все текущие состояния
    agent.animLock = null
    agent.target = undefined
    agent.path = undefined
    agent.dwellUntil = undefined
    agent.combatTarget = undefined

    // Ищем ближайшую цель для атаки (жителей) - исключаем мертвых
    const livingResidents = this.residentAgents.filter(a =>
      a && !a.isEnemy && (a.health || 0) > 0 && a.animLock !== 'dead'
    )

    if (livingResidents.length > 0) {
      // Находим ближайшую цель
      let bestTarget = livingResidents[0]
      let bestDistance = Number.POSITIVE_INFINITY

      for (const resident of livingResidents) {
        const distance = Phaser.Math.Distance.Between(
          agent.rect.x, agent.rect.y,
          resident.rect.x, resident.rect.y
        )
        if (distance < bestDistance) {
          bestDistance = distance
          bestTarget = resident
        }
      }

      console.log(`[restoreEnemyActivity] Назначаем цель: ${bestTarget.profession} (ID: ${bestTarget.id}) для врага ${agent.enemyType} (ID: ${agent.id})`)

      // Устанавливаем цель и начинаем движение
      agent.combatTarget = bestTarget.id

      // Определяем комнату цели
      let targetRoomIndex = -1
      for (let i = 0; i < this.roomRects.length; i++) {
        if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
          targetRoomIndex = i
          break
        }
      }

      // Строим путь к цели
      if (targetRoomIndex >= 0) {
        this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
        agent.animLock = 'walk'
        console.log(`[restoreEnemyActivity] Путь построен, начинаем движение`)
      } else {
        // В той же комнате - просто устанавливаем прямую цель
        agent.target = new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y)
        agent.animLock = 'walk'
        console.log(`[restoreEnemyActivity] Цель в той же комнате, устанавливаем прямую цель`)
      }
    } else {
      // Нет целей - враг ждет
      console.log(`[restoreEnemyActivity] Нет доступных целей для врага ${agent.enemyType} (ID: ${agent.id}), ждем`)
    }
  }

  /**
   * Восстанавливает активность застрявшего безумного жителя
   */
  private restoreInsaneResidentActivity(agent: any): void {
    console.log(`[restoreInsaneResidentActivity] Восстанавливаем активность безумного жителя ${agent.profession} (ID: ${agent.id})`)

    // Сбрасываем все текущие состояния
    agent.animLock = null
    agent.target = undefined
    agent.path = undefined
    agent.dwellUntil = undefined
    agent.combatTarget = undefined
    ;(agent as any).enemyTargetId = undefined

    // Ищем ближайшую цель для атаки - исключаем мертвых
    const livingResidents = this.residentAgents.filter(a =>
      a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0 && a.animLock !== 'dead'
    )

    if (livingResidents.length > 0) {
      // Находим ближайшую цель
      let bestTarget = livingResidents[0]
      let bestDistance = Number.POSITIVE_INFINITY

      for (const resident of livingResidents) {
        const distance = Phaser.Math.Distance.Between(
          agent.rect.x, agent.rect.y,
          resident.rect.x, resident.rect.y
        )
        if (distance < bestDistance) {
          bestDistance = distance
          bestTarget = resident
        }
      }

      console.log(`[restoreInsaneResidentActivity] Назначаем цель: ${bestTarget.profession} (ID: ${bestTarget.id}) для ${agent.profession} (ID: ${agent.id})`)

      // Устанавливаем цель и начинаем движение
      ;(agent as any).enemyTargetId = bestTarget.id

      // Определяем комнату цели
      let targetRoomIndex = -1
      for (let i = 0; i < this.roomRects.length; i++) {
        if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
          targetRoomIndex = i
          break
        }
      }

      // Строим путь к цели
      if (targetRoomIndex >= 0) {
        this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
        agent.animLock = 'walk'
        console.log(`[restoreInsaneResidentActivity] Путь построен, начинаем движение`)
      } else {
        // В той же комнате - просто устанавливаем прямую цель
        agent.target = new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y)
        agent.animLock = 'walk'
        console.log(`[restoreInsaneResidentActivity] Цель в той же комнате, устанавливаем прямую цель`)
      }
    } else {
      // Нет целей - принудительно заставляем искать новые цели позже
      console.log(`[restoreInsaneResidentActivity] Нет доступных целей для ${agent.profession} (ID: ${agent.id}), ждем следующей проверки`)
      // Не устанавливаем animLock, чтобы агент остался в состоянии ожидания
    }
  }

  /**
   * Обрабатывает бой безумного жителя (использует логику врагов)
   */
  private handleInsaneResidentCombat(agent: any): void {
    // Если у безумного жителя нет цели или цель мертва, ищем новую
    if (!(agent as any).enemyTargetId || !agent.target) {
      const livingResidents = this.residentAgents.filter(a =>
        a && !a.isEnemy && a.id !== agent.id && (a.health || 0) > 0 && a.animLock !== 'dead'
      )

      if (livingResidents.length > 0) {
        // Выбираем ближайшего жителя как цель (как у врагов)
        let bestTarget = livingResidents[0]
        let bestDistance = Number.POSITIVE_INFINITY

        for (const resident of livingResidents) {
          const distance = Phaser.Math.Distance.Between(
            agent.rect.x, agent.rect.y,
            resident.rect.x, resident.rect.y
          )
          if (distance < bestDistance) {
            bestDistance = distance
            bestTarget = resident
          }
        }

        console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) получает цель: ${bestTarget.profession} (ID: ${bestTarget.id})`)
        ;(agent as any).enemyTargetId = bestTarget.id

        // Сбрасываем текущий путь и заставляем двигаться к цели (как у врагов)
        agent.target = undefined
        agent.path = undefined
        agent.animLock = 'walk'

        // Определяем комнату цели
        let targetRoomIndex = -1
        for (let i = 0; i < this.roomRects.length; i++) {
          if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], bestTarget.rect.x, bestTarget.rect.y)) {
            targetRoomIndex = i
            break
          }
        }

        // Определяем текущую комнату безумного жителя
        let agentRoomIndex = -1
        for (let i = 0; i < this.roomRects.length; i++) {
          if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], agent.rect.x, agent.rect.y)) {
            agentRoomIndex = i
            break
          }
        }

        // Строим путь к цели
        if (targetRoomIndex >= 0) {
          this.buildPathTo(agent, targetRoomIndex, new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y), false)
          agent.animLock = 'walk'
          agent.target = undefined
          console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) путь построен к цели`)
        } else {
          // В той же комнате - просто устанавливаем прямую цель
          agent.target = new Phaser.Math.Vector2(bestTarget.rect.x, bestTarget.rect.y)
        }
      } else {
        // Нет целей - безумный житель ждет следующей проверки
        // НЕ вызываем pickNewTarget, чтобы не переводить в обычное блуждание
        console.log(`[bunkerView] Безумный житель ${agent.profession} (ID: ${agent.id}) ждет целей - нет доступных жителей`)
        // Оставляем animLock как есть, чтобы агент не начал блуждать
      }
    } else {
      // У безумного жителя есть цель - проверяем, жива ли она
      const target = this.residentAgents.find(a =>
        a && !a.isEnemy && a.id === (agent as any).enemyTargetId && (a.health || 0) > 0
      )

      if (!target) {
        console.log(`[bunkerView] Цель безумного жителя ${agent.profession} (ID: ${agent.id}) мертва, ищем новую`)
        ;(agent as any).enemyTargetId = undefined
        agent.target = undefined
        agent.path = undefined
        agent.animLock = 'idle'
      }
    }
  }

  /**
   * Проверяет и исправляет положение застрявших агентов
   */
  private checkStuckAgents(): void {
    console.log(`[checkStuckAgents] Проверяем застрявших агентов`)

    for (const agent of this.residentAgents) {
      if (!agent) continue

      // Пропускаем мертвых жителей (animLock === 'dead')
      if (agent.animLock === 'dead') {
        console.log(`[checkStuckAgents] Пропускаем мертвого жителя ${agent.profession} (ID: ${agent.id}) - animLock=dead`)
        continue
      }

      // Проверяем, не застрял ли агент (не движется и нет целей)
      const isStuck = agent.animLock === null || agent.animLock === 'idle'
      const hasNoTarget = !agent.target && (!agent.path || agent.path.length === 0) &&
                         !(agent as any).combatTarget && !(agent as any).enemyTargetId

      // Проверяем, был ли житель недавно перетащен (защита от телепортации)
      const lastDragTime = agent.id ? this.lastDragEndTime.get(agent.id) || 0 : 0
      const timeSinceDrag = Date.now() - lastDragTime
      const wasRecentlyDragged = timeSinceDrag < 5000 // 5 секунд защиты

      if (isStuck && hasNoTarget && !wasRecentlyDragged) {
        console.log(`[checkStuckAgents] Агент ${(agent as any).profession || 'враг'} (ID: ${(agent as any).id}) застрял без цели!`)

        // Разные стратегии восстановления в зависимости от типа агента
        if (agent.isEnemy) {
          // Для врагов - восстанавливаем активность как у врагов
          this.restoreEnemyActivity(agent)
        } else if ((agent as any).intent === 'hostile') {
          // Для безумных жителей - используем специальную функцию восстановления
          this.restoreInsaneResidentActivity(agent)
        } else {
          // Для обычных жителей - возвращаем к нормальному поведению
          console.log(`[checkStuckAgents] Обычный житель ${agent.profession} (ID: ${agent.id}) застрял, возвращаем к блужданию`)
          agent.animLock = null
          this.pickNewTarget(agent)
        }
      } else if (wasRecentlyDragged && isStuck && hasNoTarget) {
        console.log(`[checkStuckAgents] Житель ${agent.profession} (ID: ${agent.id}) недавно перетащен (${Math.round(timeSinceDrag/1000)}сек назад), пропускаем`)
      }

      // Дополнительная проверка: агент вне комнаты без цели
      const currentRoomIndex = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
      const isAgentInElevator = agent.rect.x >= this.elevatorRect.x &&
                                agent.rect.x <= (this.elevatorRect.x + this.elevatorRect.width)

      // Проверяем, находится ли агент на поверхности
      const isOnSurface = (agent as any).onSurface === true

      if (currentRoomIndex === null && !isAgentInElevator && hasNoTarget && !isOnSurface) {
        // Агент застрял вне комнаты (только для агентов НЕ на поверхности)
        const nearestRoomIndex = this.findNearestRoomForAgent(agent)
        if (nearestRoomIndex >= 0) {
          console.log(`[checkStuckAgents] Агент ${(agent as any).profession || 'враг'} (ID: ${(agent as any).id}) застрял вне комнаты, перемещаем`)

          // Перемещаем агента в ближайшую комнату
          const nearestRoom = this.roomRects[nearestRoomIndex]
          const margin = 8
          agent.rect.x = nearestRoom.x + nearestRoom.width / 2
          agent.rect.y = nearestRoom.y + nearestRoom.height - margin

          if (agent.sprite) {
            agent.sprite.x = agent.rect.x
            agent.sprite.y = agent.rect.y
          }

          agent.roomIndex = nearestRoomIndex

          // После перемещения даем агенту новую цель
          if (agent.isEnemy) {
            this.restoreEnemyActivity(agent)
          } else if ((agent as any).intent === 'hostile') {
            this.restoreInsaneResidentActivity(agent)
          } else {
            this.pickNewTarget(agent)
          }
        }
      }
    }
  }

  /**
   * Находит ближайшую комнату для застрявшего агента
   */
  private findNearestRoomForAgent(agent: any): number {
    if (this.roomRects.length === 0) return -1

    // Проверяем, находится ли агент близко к лифту
    const distanceToElevator = Math.abs(agent.rect.x - (this.elevatorRect.x + this.elevatorRect.width / 2))
    const isNearElevator = distanceToElevator < 50 // 50 пикселей - расстояние, на котором агент считается "у лифта"

    let nearestIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < this.roomRects.length; i++) {
      const room = this.roomRects[i]
      // Вычисляем расстояние от агента до центра комнаты
      const roomCenterX = room.x + room.width / 2
      const roomCenterY = room.y + room.height / 2
      let distance = Phaser.Math.Distance.Between(agent.rect.x, agent.rect.y, roomCenterX, roomCenterY)

      // Если агент находится у лифта, предпочитаем комнаты на том же этаже
      if (isNearElevator && Math.abs(room.y - agent.rect.y) < 10) {
        // Уменьшаем расстояние для комнат на том же этаже
        distance *= 0.5
      }

      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    return nearestIndex
  }

  // Функция для поиска индекса комнаты по координатам
  private findRoomIndexAt(x: number, y: number): number | null {
    for (let i = 0; i < this.roomRects.length; i++) {
      if (Phaser.Geom.Rectangle.Contains(this.roomRects[i], x, y)) {
        return i
      }
    }
    return null
  }

  // Функция для обновления боевого поведения жителей
  
  /**
   * Проверяет, что жители замечают врагов даже после смены режима
   */
  private checkResidentsCombatAwareness(): void {
    // Проверяем, есть ли враги в бункере
    const enemies = this.residentAgents.filter(a => a && a.isEnemy && (a.health || 0) > 0)
    if (enemies.length === 0) return
    
    // Проверяем всех жителей
    for (const agent of this.residentAgents) {
      if (!agent || agent.isEnemy || (agent as any).away) continue
      
      // Пропускаем мертвых жителей
      if (agent.animLock === 'dead') continue
      
      // Пропускаем жителей, которые уже в боевом режиме
      if (agent.animLock === 'attack' || (agent as any).combatTarget) continue
      
      // Проверяем, есть ли враги в той же комнате
      const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
      if (agentRoom === null) continue
      
      const enemiesInRoom = enemies.filter(e => {
        const enemyRoom = this.findRoomIndexAt(e.rect.x, e.rect.y)
        return enemyRoom === agentRoom
      })
      
      if (enemiesInRoom.length > 0) {
        // Есть враги в комнате - житель должен вступить в бой
        const targetEnemy = enemiesInRoom[0]
        
        // Инициализируем боевые параметры если нужно
        if (agent.health === undefined) {
          this.initializeCombatStats(agent)
        }
        
        // Устанавливаем цель атаки
        ;(agent as any).combatTarget = targetEnemy.id
        agent.animLock = 'attack'
        
        console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) обнаружен враг в комнате, вступает в бой`)
      }
    }
  }
  
  /**
   * Проверяет обнаружение врагов при входе жителя в комнату
   */
  private checkEnemyDetectionInRoom(agent: any): void {
    // НЕ ОБРАБАТЫВАЕМ жителей, которые уже в боевом режиме
    if (agent.animLock === 'attack' || (agent as any).combatTarget) return

    // Пропускаем мертвых жителей
    if (agent.animLock === 'dead') return

    // Трусы вообще не реагируют на врагов
    if ((agent as any).isCoward) return

    // Проверяем наличие врагов
    const allEnemies = this.residentAgents.filter(a =>
      a && a.isEnemy && (a.health || 0) > 0
    )

    if (allEnemies.length === 0) return

    // Ищем ближайшего врага
    let bestEnemy = allEnemies[0]
    let bestDistance = Number.POSITIVE_INFINITY

    for (const enemy of allEnemies) {
      const distance = Phaser.Math.Distance.Between(
        agent.rect.x, agent.rect.y,
        enemy.rect.x, enemy.rect.y
      )
      if (distance < bestDistance) {
        bestDistance = distance
        bestEnemy = enemy
      }
    }

    // Определяем радиус обнаружения в зависимости от типа жителя
    const profession = (agent.profession ?? '').toLowerCase()
    const isWanderer = (!profession || ['бездомный', 'безработный', 'бездельник'].includes(profession))
    const isAggressive = (agent as any).isAggressive

    let detectionRadius = 150 // Базовый радиус для всех жителей

    if (isAggressive) {
      detectionRadius = 300 // Агрессивные жители видят дальше
    } else if (isWanderer) {
      detectionRadius = 200 // Бездомные и безработные тоже видят дальше
    }

    // Если враг достаточно близко, вступаем в бой
    if (bestDistance < detectionRadius) {
      console.log(`[bunkerView] Житель ${agent.profession} (ID: ${agent.id}) обнаружил врага ${bestEnemy.enemyType} (ID: ${bestEnemy.id}) на расстоянии ${Math.round(bestDistance)}px, вступает в бой`)

      // Инициализируем боевые параметры если нужно
      if (agent.health === undefined) {
        this.initializeCombatStats(agent)
      }

      // Устанавливаем цель атаки
      ;(agent as any).combatTarget = bestEnemy.id

      // Определяем, в той же комнате враг или нет
      const agentRoom = this.findRoomIndexAt(agent.rect.x, agent.rect.y)
      const enemyRoom = this.findRoomIndexAt(bestEnemy.rect.x, bestEnemy.rect.y)

      if (agentRoom === enemyRoom) {
        // Враг в той же комнате - атакуем сразу
        agent.animLock = 'attack'
      } else {
        // Враг в другой комнате - идем к нему
        agent.animLock = 'walk'
        if (enemyRoom !== null && enemyRoom >= 0) {
          this.buildPathTo(agent, enemyRoom, new Phaser.Math.Vector2(bestEnemy.rect.x, bestEnemy.rect.y), false)
          // НЕ сбрасываем target и dwellUntil - это может сломать нормальное поведение
        }
      }
    }

  }

  // Временное отключение pointer-events на HTML overlay для перемещения
  private disableHTMLEvents(): void {
    const overlay = document.getElementById('game-ui-overlay')
    if (overlay) {
      // Сохраняем оригинальные стили
      this.originalPointerEvents = overlay.style.pointerEvents || 'none'
      this.originalDisplay = overlay.style.display || 'block'

      // Полностью скрываем HTML overlay во время перемещения
      overlay.style.display = 'none'

      console.log('[bunkerView] Hidden HTML overlay completely for panning')
    }
  }

  // Восстановление pointer-events на HTML overlay
  private enableHTMLEvents(): void {
    const overlay = document.getElementById('game-ui-overlay')
    if (overlay && this.originalPointerEvents !== undefined && this.originalDisplay !== undefined) {
      // Сохраняем текущую позицию контента перед восстановлением HTML
      const currentContentX = this.content.x
      const currentContentY = this.content.y

      // Восстанавливаем display стиль
      overlay.style.display = this.originalDisplay

      // Восстанавливаем pointer-events на overlay
      overlay.style.pointerEvents = this.originalPointerEvents

      // Восстанавливаем позицию контента, если она изменилась
      if (this.content.x !== currentContentX || this.content.y !== currentContentY) {
        console.log('[bunkerView] Content position changed during HTML restore, restoring:', currentContentX, currentContentY)
        this.content.setPosition(currentContentX, currentContentY)
        this.darknessContainer.setPosition(currentContentX, currentContentY)
      }

      console.log('[bunkerView] Restored HTML overlay display and pointer events')
    }
    this.isPanning = false
    this.recentlyFinishedPanning = true
    
    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
      this.recentlyFinishedPanning = false
    }, 100)
  }

  private originalPointerEvents: string = 'none'
  private originalDisplay: string = 'block'

  // Настройка событий на document уровне для гарантированного перехвата
  private setupDocumentEvents(): void {
    // Используем capture phase для перехвата всех pointer событий
    document.addEventListener('pointermove', this.handleDocumentPointerMove.bind(this), true)
    document.addEventListener('pointerup', this.handleDocumentPointerUp.bind(this), true)

    // Добавляем обработчики для drag n drop жителей
    document.addEventListener('pointermove', this.handleResidentDragMove.bind(this), true)
    document.addEventListener('pointerup', this.handleResidentDragEnd.bind(this), true)
    
    // Для мобильного: добавляем touch события для лучшей поддержки
    document.addEventListener('touchmove', this.handleDocumentTouchMove.bind(this), true)
    document.addEventListener('touchend', this.handleDocumentTouchEnd.bind(this), true)
    
    console.log('[bunkerView] Document events setup for guaranteed panning capture')
  }

  // Обработчик pointermove на document уровне
  private handleDocumentPointerMove(event: Event): void {
    // Проверяем, не происходит ли событие в модальном окне
    const target = event.target as HTMLElement
    if (target && (target.closest('.modal') || target.closest('#room-selection-modal'))) {
      // Событие происходит в модальном окне, не обрабатываем для bunkerView
      return
    }
    
    if (!this.panStart || !this.contentStart) return

    // Получаем координаты относительно Phaser canvas
    const canvas = this.scene.game.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    
    // PointerEvent содержит clientX/Y для всех типов событий
    const clientX = (event as PointerEvent).clientX
    const clientY = (event as PointerEvent).clientY
    
    const p = {
      x: clientX - rect.left,
      y: clientY - rect.top
    }

    const dx = p.x - this.panStart.x
    const dy = p.y - this.panStart.y
    
    // Проверяем минимальное расстояние для начала перемещения
    // Для мобильного используем больший порог
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const panThreshold = isMobile ? 8 : 4 // Больший порог для мобильного
    
    // Отладочная информация для мобильного
    if (isMobile) {
      console.log('[bunkerView] Mobile panning:', { dx, dy, threshold: panThreshold, isPanning: this.isPanning })
    }
    
    if (Math.abs(dx) + Math.abs(dy) > panThreshold) {
      // Активируем перемещение только при реальном движении
      if (!this.isPanning) {
        this.isPanning = true

      }
      
      ;(this as any)._dragged = true
      
      const newX = this.contentStart.x + dx
      const newY = this.contentStart.y + dy
      this.content.setPosition(newX, newY)
      // Синхронизируем затемнение при панорамировании
      this.darknessContainer.setPosition(newX, newY)
      
      // Обновляем заголовки комнат, чтобы они двигались вместе с контентом
      this.updateLabels()
    }

    // console.log('[bunkerView] Document pointermove handled:', p.x, p.y)
  }

  // Обработчик pointerup на document уровне
  private handleDocumentPointerUp(event: PointerEvent): void {
    // Проверяем, не происходит ли событие в модальном окне
    const target = event.target as HTMLElement
    if (target && (target.closest('.modal') || target.closest('#room-selection-modal'))) {
      // Событие происходит в модальном окне, не обрабатываем для bunkerView
      return
    }
    
    if (this.isPanning) {
      // Сохраняем позицию контента до восстановления HTML
      const contentX = this.content.x
      const contentY = this.content.y
      const contentScale = this.content.scale

      // Восстанавливаем pointer-events на HTML overlay
      this.enableHTMLEvents()

      // Восстанавливаем позицию контента после восстановления HTML
      if (this.content.x !== contentX || this.content.y !== contentY) {
        console.log('[bunkerView] Document pointerup: Content position changed, restoring:', contentX, contentY)
        this.content.setPosition(contentX, contentY)
        this.darknessContainer.setPosition(contentX, contentY)
      }

      // Восстанавливаем масштаб если он изменился
      if (this.content.scale !== contentScale) {
        console.log('[bunkerView] Document pointerup: Content scale changed, restoring:', contentScale)
        this.content.setScale(contentScale)
        this.darknessContainer.setScale(contentScale)
      }

      // Устанавливаем флаг недавно завершенного перемещения
      this.recentlyFinishedPanning = true
      
      // Сбрасываем флаг через небольшую задержку
      setTimeout(() => {
        this.recentlyFinishedPanning = false
      }, 200)

      console.log('[bunkerView] Document pointerup handled, panning ended')
    }
  }

  // Обработчик touchmove для мобильного
  private handleDocumentTouchMove(event: TouchEvent): void {
    // Проверяем, не происходит ли touch в модальном окне
    const target = event.target as HTMLElement
    if (target && (target.closest('.modal') || target.closest('#room-selection-modal'))) {
      // Touch происходит в модальном окне, не обрабатываем для bunkerView
      return
    }
    
    // Предотвращаем скролл страницы при панорамировании
    event.preventDefault()
    
    if (!this.panStart || !this.contentStart) return
    
    // Получаем координаты относительно Phaser canvas
    const canvas = this.scene.game.canvas as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    
    if (event.touches && event.touches.length > 0) {
      const touch = event.touches[0]
      const p = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
      
      const dx = p.x - this.panStart.x
      const dy = p.y - this.panStart.y
      
      // Для touch используем меньший порог
      const touchThreshold = 5
      
      if (Math.abs(dx) + Math.abs(dy) > touchThreshold) {
        if (!this.isPanning) {
          this.isPanning = true
          this.disableHTMLEvents()
        }
        
        const newX = this.contentStart.x + dx
        const newY = this.contentStart.y + dy
        this.content.setPosition(newX, newY)
        this.darknessContainer.setPosition(newX, newY)
        this.updateLabels()
      }
    }
  }

  // Обработчик touchend для мобильного
  private handleDocumentTouchEnd(event: TouchEvent): void {
    // Проверяем, не происходит ли touch в модальном окне
    const target = event.target as HTMLElement
    if (target && (target.closest('.modal') || target.closest('#room-selection-modal'))) {
      // Touch происходит в модальном окне, не обрабатываем для bunkerView
      return
    }
    
    if (this.isPanning) {
      this.enableHTMLEvents()
      this.isPanning = false
      this.panStart = undefined
      this.contentStart = undefined
    }
  }

  // Обработчики drag n drop для жителей
  private handleResidentDragMove(event: PointerEvent): void {
    if (!this.isDraggingResident) return

    // Проверяем, не происходит ли событие в модальном окне
    const target = event.target as HTMLElement
    if (target && (target.closest('.modal') || target.closest('#room-selection-modal'))) {
      return
    }

    // Создаем Phaser Pointer объект из DOM события
    const pointer = this.scene.input.activePointer
    pointer.x = event.clientX
    pointer.y = event.clientY

    this.updateResidentDrag(pointer)
  }

  private handleResidentDragEnd(event: PointerEvent): void {
    if (!this.isDraggingResident) return

    // Создаем Phaser Pointer объект из DOM события
    const pointer = this.scene.input.activePointer
    pointer.x = event.clientX
    pointer.y = event.clientY

    this.endResidentDrag(pointer)
  }

  // Drag n Drop функции для жителей
  private startResidentDrag(agent: any, pointer: Phaser.Input.Pointer): void {
    if (agent.isEnemy) return // Не позволяем перетаскивать врагов

    console.log(`[bunkerView] Начинаем перетаскивание жителя: ${agent.profession} (ID: ${agent.id})`)
    console.log(`[bunkerView] Текущая позиция жителя: (${agent.rect.x}, ${agent.rect.y})`)
    console.log(`[bunkerView] Житель в контейнере: ${agent.sprite ? agent.sprite.parentContainer?.name || 'unknown' : 'no sprite'}`)
    
    // ДЕТАЛЬНАЯ ДИАГНОСТИКА: Проверяем состояние спрайта ДО перетаскивания
    console.log(`[bunkerView] 🔍 ДИАГНОСТИКА ДРАГА: Состояние спрайта ДО перетаскивания:`)
    if (agent.sprite) {
      console.log(`[bunkerView] - Спрайт: scaleX=${agent.sprite.scaleX}, scaleY=${agent.sprite.scaleY}`)
      console.log(`[bunkerView] - Спрайт: originX=${agent.sprite.originX}, originY=${agent.sprite.originY}`)
      console.log(`[bunkerView] - Спрайт: texture.key=${agent.sprite.texture?.key || 'unknown'}`)
      console.log(`[bunkerView] - Спрайт: направление=${agent.sprite.scaleX < 0 ? 'ВЛЕВО' : 'ВПРАВО'}`)
      console.log(`[bunkerView] - Спрайт: УЖЕ ОТЗЕРКАЛЕН=${agent.sprite.scaleX < 0 ? 'ДА' : 'НЕТ'}`)
    }
    
    if (agent.shirt) {
      console.log(`[bunkerView] - Рубашка: scaleX=${agent.shirt.scaleX}, scaleY=${agent.shirt.scaleY}`)
    }
    if (agent.pants) {
      console.log(`[bunkerView] - Штаны: scaleX=${agent.pants.scaleX}, scaleY=${agent.pants.scaleY}`)
    }
    if (agent.footwear) {
      console.log(`[bunkerView] - Обувь: scaleX=${agent.footwear.scaleX}, scaleY=${agent.footwear.scaleY}`)
    }
    if (agent.hair) {
      console.log(`[bunkerView] - Волосы: scaleX=${agent.hair.scaleX}, scaleY=${agent.hair.scaleY}`)
    }
    
    console.log(`[bunkerView] 🔍 ДИАГНОСТИКА ДРАГА: Конец состояния ДО перетаскивания`)

    this.draggedResident = agent
    this.isDraggingResident = true
    this.dragStartTime = Date.now()

    // Добавляем жителя в множество перетаскиваемых
    if (agent.id) {
      this.residentsBeingDragged.add(agent.id)
    }

    // ПОЛНОСТЬЮ сбрасываем состояние движения и пути при начале перетаскивания
    agent.animLock = null
    agent.target = undefined
    agent.path = undefined
    agent.dwellUntil = undefined
    ;(agent as any).combatTarget = undefined
    ;(agent as any).enemyTargetId = undefined
    agent.lastTargetReconsiderTime = undefined

    // Также сбрасываем связанные состояния
    agent.goingToRest = false
    agent.working = false
    agent.sleeping = false

    // Сбрасываем флаг завершения перетаскивания
    ;(agent as any).dragEnded = false

    // Вычисляем смещение курсора относительно спрайта
    const sprite = agent.sprite || agent.rect
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)

    // Преобразуем мировые координаты в локальные координаты content
    const contentMatrix = this.content.getWorldTransformMatrix()
    const localPoint = new Phaser.Math.Vector2()
    contentMatrix.applyInverse(worldPoint.x, worldPoint.y, localPoint)

    this.dragOffset.set(
      localPoint.x - (sprite.x || 0),
      localPoint.y - (sprite.y || 0)
    )

          // Сохраняем оригинальные размеры при первом перетаскивании
      if (!agent.originalScale) {
        console.log(`[bunkerView] Сохраняем оригинальные размеры для жителя ${agent.profession}`)

        // В Phaser scale может быть числом или объектом Vector2
        const getScaleValue = (sprite: any) => {
          if (!sprite || !sprite.scale) return 1
          if (typeof sprite.scale === 'number') return sprite.scale
          if (sprite.scale.x !== undefined) return sprite.scale.x // Vector2
          return 1
        }

        // ВАЖНО: Сохраняем ТЕКУЩИЙ масштаб спрайта, а не "оригинальный"
        // Это может быть уже отзеркаленный спрайт, если житель двигался влево
        const currentSpriteScale = getScaleValue(agent.sprite)
        console.log(`[bunkerView] 🔍 ВАЖНО: Текущий масштаб спрайта при захвате: ${currentSpriteScale}`)
        console.log(`[bunkerView] 🔍 Это означает, что житель ${currentSpriteScale < 0 ? 'УЖЕ ОТЗЕРКАЛЕН' : 'НЕ ОТЗЕРКАЛЕН'} в бункере`)

        agent.originalScale = {
          sprite: currentSpriteScale, // Сохраняем ТЕКУЩИЙ масштаб
          shirt: getScaleValue(agent.shirt),
          pants: getScaleValue(agent.pants),
          footwear: getScaleValue(agent.footwear),
          hair: getScaleValue(agent.hair)
        }
      agent.originalOrigin = {
        sprite: agent.sprite && agent.sprite.origin ? { x: agent.sprite.origin.x || 0.5, y: agent.sprite.origin.y || 1 } : { x: 0.5, y: 1 },
        shirt: agent.shirt && agent.shirt.origin ? { x: agent.shirt.origin.x || 0.5, y: agent.shirt.origin.y || 1 } : { x: 0.5, y: 1 },
        pants: agent.pants && agent.pants.origin ? { x: agent.pants.origin.x || 0.5, y: agent.pants.origin.y || 1 } : { x: 0.5, y: 1 },
        footwear: agent.footwear && agent.footwear.origin ? { x: agent.footwear.origin.x || 0.5, y: agent.footwear.origin.y || 1 } : { x: 0.5, y: 1 },
        hair: agent.hair && agent.hair.origin ? { x: agent.hair.origin.x || 0.5, y: agent.hair.origin.y || 1 } : { x: 0.5, y: 1 }
      }

              const originalDirection = agent.originalScale.sprite < 0 ? 'влево' : 'вправо'
      console.log(`[bunkerView] Сохранены оригинальные размеры: sprite=${agent.originalScale.sprite} (направление: ${originalDirection}), origin=(${agent.originalOrigin.sprite.x}, ${agent.originalOrigin.sprite.y})`)
      console.log(`[bunkerView] ДЕТАЛЬНО: originalScale объект:`, agent.originalScale)
      console.log(`[bunkerView] ДЕТАЛЬНО: originalOrigin объект:`, agent.originalOrigin)
      
      // ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА: Анализируем сохраненные размеры
      console.log(`[bunkerView] 🔍 АНАЛИЗ СОХРАНЕННЫХ РАЗМЕРОВ:`)
      console.log(`[bunkerView] - originalScale.sprite=${agent.originalScale.sprite} (${agent.originalScale.sprite < 0 ? 'ОТРИЦАТЕЛЬНЫЙ' : 'ПОЛОЖИТЕЛЬНЫЙ'})`)
      console.log(`[bunkerView] - Это означает, что в бункере житель смотрел: ${originalDirection}`)
      console.log(`[bunkerView] - При размещении на поверхности НУЖНО: ${agent.originalScale.sprite < 0 ? 'НЕ зеркалить (directionScaleX=1)' : 'зеркалить (directionScaleX=-1)'}`)
      
      // ВАЖНОЕ УТОЧНЕНИЕ: Теперь мы сохраняем ТЕКУЩИЙ масштаб при захвате
      console.log(`[bunkerView] 🔍 ВАЖНОЕ УТОЧНЕНИЕ:`)
      console.log(`[bunkerView] - Мы сохранили ТЕКУЩИЙ масштаб при захвате: ${agent.originalScale.sprite}`)
      console.log(`[bunkerView] - Если житель двигался влево в бункере, он УЖЕ отзеркален`)
      console.log(`[bunkerView] - Если житель двигался вправо в бункере, он НЕ отзеркален`)
    } else {
      console.log(`[bunkerView] Оригинальные размеры уже сохранены для жителя ${agent.profession}`)
    }

    // Устанавливаем визуальную обратную связь
    if (agent.sprite) {
      agent.sprite.setTint(0x888888) // Затемняем спрайт
      agent.sprite.setDepth(9999999) // СУПЕР максимальный z-index для перетаскиваемого жителя
    }
    if (agent.shirt) agent.shirt.setDepth(10000000)
    if (agent.pants) agent.pants.setDepth(10000001)
    if (agent.footwear) agent.footwear.setDepth(10000002)
    if (agent.hair) agent.hair.setDepth(10000003)
    if (agent.healthBar) agent.healthBar.setDepth(10000004)
    if (agent.rect) {
      agent.rect.setStrokeStyle(2, 0xffff00, 1.0) // Желтая рамка
    }
  }

  private updateResidentDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.isDraggingResident || !this.draggedResident) return

    const sprite = this.draggedResident.sprite || this.draggedResident.rect
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)

    // Преобразуем мировые координаты в локальные координаты content
    const contentMatrix = this.content.getWorldTransformMatrix()
    const localPoint = new Phaser.Math.Vector2()
    contentMatrix.applyInverse(worldPoint.x, worldPoint.y, localPoint)

    // Устанавливаем новую позицию спрайта
    const newX = localPoint.x - this.dragOffset.x
    const newY = localPoint.y - this.dragOffset.y

    // Перемещаем физическую модель (rect) - ЭТО КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ!
    this.draggedResident.rect.setPosition(newX, newY)

    // Также перемещаем визуальные спрайты
    if (sprite !== this.draggedResident.rect) {
      sprite.setPosition(newX, newY)
    }

    // Также перемещаем связанные спрайты (одежда, волосы и т.д.)
    if (this.draggedResident.shirt) this.draggedResident.shirt.setPosition(newX, newY)
    if (this.draggedResident.pants) this.draggedResident.pants.setPosition(newX, newY)
    if (this.draggedResident.footwear) this.draggedResident.footwear.setPosition(newX, newY)
    if (this.draggedResident.hair) this.draggedResident.hair.setPosition(newX, newY)

    // Перемещаем шкалу здоровья вместе с жителем
    if (this.draggedResident.healthBar) {
      this.draggedResident.healthBar.setPosition(newX, newY - 20)
    }
  }

  private endResidentDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.isDraggingResident || !this.draggedResident) return

    // Защита от повторных вызовов
    if ((this.draggedResident as any).dragEnded) return
    ;(this.draggedResident as any).dragEnded = true

    console.log(`[bunkerView] Завершаем перетаскивание жителя: ${this.draggedResident.profession} (ID: ${this.draggedResident.id})`)

    const sprite = this.draggedResident.sprite || this.draggedResident.rect
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)

    // Получаем gameScene для доступа к поверхности
    const gameScene = this.scene as any
    const surfaceRect = gameScene?.lastSurfaceRect

    let localPoint: Phaser.Math.Vector2
    let isInSurfaceArea: boolean

    if (surfaceRect) {
      // Конвертируем мировые координаты в локальные координаты поверхности
      const surfaceLocalPoint = new Phaser.Math.Vector2()
      surfaceLocalPoint.x = worldPoint.x - surfaceRect.x
      surfaceLocalPoint.y = worldPoint.y - surfaceRect.y

      // Проверяем, находится ли точка в области поверхности
      isInSurfaceArea = (surfaceLocalPoint.x >= 0 &&
                        surfaceLocalPoint.x <= surfaceRect.width &&
                        surfaceLocalPoint.y >= 0 &&
                        surfaceLocalPoint.y <= surfaceRect.height)

      if (isInSurfaceArea) {
        // Используем локальные координаты поверхности
        localPoint = surfaceLocalPoint
        console.log(`[bunkerView] Точка отпускания на поверхности: (${localPoint.x}, ${localPoint.y})`)
        console.log(`[bunkerView] Мировые координаты: (${worldPoint.x}, ${worldPoint.y})`)
        console.log(`[bunkerView] Локальные координаты поверхности: (${surfaceLocalPoint.x}, ${surfaceLocalPoint.y})`)
        console.log(`[bunkerView] Размеры поверхности: ${surfaceRect.width} x ${surfaceRect.height}`)
      } else {
        // Конвертируем мировые координаты в локальные координаты content (бункера)
        const contentMatrix = this.content.getWorldTransformMatrix()
        localPoint = new Phaser.Math.Vector2()
        contentMatrix.applyInverse(worldPoint.x, worldPoint.y, localPoint)
        console.log(`[bunkerView] Точка отпускания в бункере: (${localPoint.x}, ${localPoint.y})`)
      }
    } else {
      // Конвертируем мировые координаты в локальные координаты content (бункера)
      const contentMatrix = this.content.getWorldTransformMatrix()
      localPoint = new Phaser.Math.Vector2()
      contentMatrix.applyInverse(worldPoint.x, worldPoint.y, localPoint)
      isInSurfaceArea = false
      console.log(`[bunkerView] Точка отпускания в бункере: (${localPoint.x}, ${localPoint.y})`)
    }

    if (isInSurfaceArea) {
      // Житель отпущен в области поверхности - применяем физику поверхности
      console.log(`[bunkerView] Житель отпущен в области поверхности`)
      this.handleSurfaceDrop(this.draggedResident, localPoint)
    } else {
      // Обычное поведение - проверяем комнаты бункера
      const targetRoomIndex = this.findRoomIndexAt(localPoint.x, localPoint.y)

      if (targetRoomIndex !== null && targetRoomIndex >= 0) {
        // Житель отпущен в комнате - перемещаем его туда
        this.moveResidentToRoom(this.draggedResident, targetRoomIndex, localPoint)
        console.log(`[bunkerView] Житель перемещен в комнату ${this.roomNames[targetRoomIndex]}`)
      } else {
        // Житель отпущен вне комнаты - возвращаем на исходную позицию
        console.log(`[bunkerView] Житель отпущен вне комнаты, возвращаем на место`)
        this.returnResidentToOriginalPosition(this.draggedResident)
      }
    }

          // Логируем текущий масштаб после всех операций
      if (this.draggedResident.sprite) {
        const finalDirection = this.draggedResident.sprite.scaleX < 0 ? 'влево' : 'вправо'
        console.log(`[bunkerView] Финальный масштаб жителя: ${this.draggedResident.sprite.scaleX} x ${this.draggedResident.sprite.scaleY} (направление: ${finalDirection})`)
      }

    // Сбрасываем визуальную обратную связь
    if (this.draggedResident.sprite) {
      this.draggedResident.sprite.clearTint()
      this.draggedResident.sprite.setDepth(100) // Возвращаем нормальный z-index
    }
    if (this.draggedResident.shirt) this.draggedResident.shirt.setDepth(101)
    if (this.draggedResident.pants) this.draggedResident.pants.setDepth(102)
    if (this.draggedResident.footwear) this.draggedResident.footwear.setDepth(103)
    if (this.draggedResident.hair) this.draggedResident.hair.setDepth(104)
    if (this.draggedResident.healthBar) this.draggedResident.healthBar.setDepth(105)
    if (this.draggedResident.rect) {
      this.draggedResident.rect.setStrokeStyle(2, 0x00ff00, 1.0) // Зеленая рамка
    }

    // Восстанавливаем оригинальные размеры и origin, если они были сохранены
    // НО только если житель НЕ на поверхности (для поверхности сохраняем специальный масштаб)
    const isOnSurface = (this.draggedResident as any).onSurface === true
    if (this.draggedResident.originalScale && this.draggedResident.originalOrigin && !isOnSurface) {
      console.log(`[bunkerView] Восстанавливаем оригинальные размеры для жителя ${this.draggedResident.profession}`)
      console.log(`[bunkerView] originalScale exists: ${!!this.draggedResident.originalScale}, originalOrigin exists: ${!!this.draggedResident.originalOrigin}`)
      console.log(`[bunkerView] originalScale.sprite: ${this.draggedResident.originalScale.sprite}, originalOrigin.sprite: ${this.draggedResident.originalOrigin.sprite ? 'exists' : 'null'}`)

      if (this.draggedResident.sprite && this.draggedResident.originalScale.sprite !== undefined && this.draggedResident.originalOrigin.sprite) {
        console.log(`[bunkerView] Восстанавливаю sprite: scale=${this.draggedResident.originalScale.sprite}, origin=(${this.draggedResident.originalOrigin.sprite.x}, ${this.draggedResident.originalOrigin.sprite.y})`)
        this.draggedResident.sprite.setScale(this.draggedResident.originalScale.sprite)
        this.draggedResident.sprite.setOrigin(
          this.draggedResident.originalOrigin.sprite.x,
          this.draggedResident.originalOrigin.sprite.y
        )
      }
      if (this.draggedResident.shirt && this.draggedResident.originalScale.shirt !== undefined && this.draggedResident.originalOrigin.shirt) {
        this.draggedResident.shirt.setScale(this.draggedResident.originalScale.shirt)
        this.draggedResident.shirt.setOrigin(
          this.draggedResident.originalOrigin.shirt.x,
          this.draggedResident.originalOrigin.shirt.y
        )
      }
      if (this.draggedResident.pants && this.draggedResident.originalScale.pants !== undefined && this.draggedResident.originalOrigin.pants) {
        this.draggedResident.pants.setScale(this.draggedResident.originalScale.pants)
        this.draggedResident.pants.setOrigin(
          this.draggedResident.originalOrigin.pants.x,
          this.draggedResident.originalOrigin.pants.y
        )
      }
      if (this.draggedResident.footwear && this.draggedResident.originalScale.footwear !== undefined && this.draggedResident.originalOrigin.footwear) {
        this.draggedResident.footwear.setScale(this.draggedResident.originalScale.footwear)
        this.draggedResident.footwear.setOrigin(
          this.draggedResident.originalOrigin.footwear.x,
          this.draggedResident.originalOrigin.footwear.y
        )
      }
      if (this.draggedResident.hair && this.draggedResident.originalScale.hair !== undefined && this.draggedResident.originalOrigin.hair) {
        this.draggedResident.hair.setScale(this.draggedResident.originalScale.hair)
        this.draggedResident.hair.setOrigin(
          this.draggedResident.originalOrigin.hair.x,
          this.draggedResident.originalOrigin.hair.y
        )
      }

      // Очищаем сохраненные оригинальные размеры
      this.draggedResident.originalScale = undefined
      this.draggedResident.originalOrigin = undefined
    } else if (isOnSurface) {
      console.log(`[bunkerView] Житель ${(this.draggedResident as any).profession} на поверхности - сохраняем масштаб поверхности`)
      // НЕ очищаем originalScale и originalOrigin для жителей на поверхности
    } else {
      console.log(`[bunkerView] Оригинальные размеры не сохранены для жителя ${(this.draggedResident as any).profession}, пропускаем восстановление`)
    }

    // Записываем время окончания перетаскивания для защиты от телепортации
    this.lastDragEndTime.set(this.draggedResident.id, Date.now())

    // Удаляем жителя из множества перетаскиваемых
    if (this.draggedResident.id) {
      this.residentsBeingDragged.delete(this.draggedResident.id)
    }

    // Сбрасываем флаг завершения перетаскивания для следующего раза
    ;(this.draggedResident as any).dragEnded = false

    // Очищаем состояние перетаскивания
    this.draggedResident = null
    this.isDraggingResident = false
    this.dragStartTime = 0
  }

  private moveResidentToRoom(agent: any, roomIndex: number, position: Phaser.Math.Vector2): void {
    if (roomIndex < 0) return
    const room = this.roomRects[roomIndex]
    if (!room) return

    // Устанавливаем новую позицию в центре комнаты
    const newX = room.x + room.width / 2
    const newY = room.y + room.height - 4 // Немного выше пола

    // Перемещаем физическую модель (rect) - КЛЮЧЕВОЕ!
    agent.rect.setPosition(newX, newY)

    // Также перемещаем визуальные спрайты
    if (agent.sprite) agent.sprite.setPosition(newX, newY)
    if (agent.shirt) agent.shirt.setPosition(newX, newY)
    if (agent.pants) agent.pants.setPosition(newX, newY)
    if (agent.footwear) agent.footwear.setPosition(newX, newY)
    if (agent.hair) agent.hair.setPosition(newX, newY)

    // Обновляем индекс комнаты агента
    agent.roomIndex = roomIndex

    // ПОЛНОСТЬЮ сбрасываем ВСЕ состояния движения и целей
    agent.path = undefined
    agent.target = undefined
    agent.animLock = null
    agent.dwellUntil = undefined
    ;(agent as any).combatTarget = undefined
    ;(agent as any).enemyTargetId = undefined
    agent.lastTargetReconsiderTime = undefined

    // Также сбрасываем связанные состояния
    agent.goingToRest = false
    agent.working = false
    agent.sleeping = false

    // Перемещаем шкалу здоровья на новое место
    if (agent.healthBar) {
      agent.healthBar.setPosition(newX, newY - 20)
    }

    // Уведомляем GameScene об изменении позиции жителя
    const gameScene = this.scene as any
    if (gameScene && typeof gameScene.onResidentPositionChanged === 'function') {
      gameScene.onResidentPositionChanged(agent.id, roomIndex, newX, newY)
    }

    // Устанавливаем защиту от автоматического назначения целей
    // В течение 3 секунд после перетаскивания не позволяем автоматически назначать цели
    agent.dwellUntil = Date.now() + 3000
    console.log(`[bunkerView] Установлена защита от автоматических целей для жителя ${agent.profession} (ID: ${agent.id}) на 3 секунды`)
  }

  private returnResidentToOriginalPosition(agent: any): void {
    console.log(`[bunkerView] Возвращаем жителя ${agent.profession} на исходную позицию`)
    console.log(`[bunkerView] Текущая позиция перед возвращением: (${agent.rect.x}, ${agent.rect.y})`)

    // Возвращаем агента к центру его текущей комнаты
    const currentRoomIndex = agent.roomIndex
    if (currentRoomIndex >= 0 && this.roomRects[currentRoomIndex]) {
      const room = this.roomRects[currentRoomIndex]
      const newX = room.x + room.width / 2
      const newY = room.y + room.height - 4

      // Перемещаем физическую модель (rect) - КЛЮЧЕВОЕ!
      agent.rect.setPosition(newX, newY)

      // Также перемещаем визуальные спрайты
      if (agent.sprite) agent.sprite.setPosition(newX, newY)
      if (agent.shirt) agent.shirt.setPosition(newX, newY)
      if (agent.pants) agent.pants.setPosition(newX, newY)
      if (agent.footwear) agent.footwear.setPosition(newX, newY)
      if (agent.hair) agent.hair.setPosition(newX, newY)

      // Перемещаем шкалу здоровья на новое место
      if (agent.healthBar) {
        agent.healthBar.setPosition(newX, newY - 20)
      }

      // ПОЛНОСТЬЮ сбрасываем ВСЕ состояния движения и целей при возврате
      agent.path = undefined
      agent.target = undefined
      agent.animLock = null
      agent.dwellUntil = undefined
      ;(agent as any).combatTarget = undefined
      ;(agent as any).enemyTargetId = undefined
      agent.lastTargetReconsiderTime = undefined

      // Также сбрасываем связанные состояния
      agent.goingToRest = false
      agent.working = false
      agent.sleeping = false

      // Устанавливаем защиту от автоматического назначения целей
      agent.dwellUntil = Date.now() + 3000
      console.log(`[bunkerView] Установлена защита от автоматических целей для жителя ${agent.profession} (ID: ${agent.id}) на 3 секунды`)
      console.log(`[bunkerView] Фактическая позиция после возвращения: (${agent.rect.x}, ${agent.rect.y})`)
    } else {
      console.log(`[bunkerView] Ошибка: комната с индексом ${currentRoomIndex} не найдена`)
    }
  }

  private isPointInSurfaceArea(x: number, y: number): boolean {
    // Получаем доступ к gameScene для определения области поверхности
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.lastSurfaceRect) {
      console.log(`[bunkerView] isPointInSurfaceArea: gameScene или lastSurfaceRect отсутствует`)
      return false
    }

    const surfaceRect = gameScene.lastSurfaceRect

    // Преобразуем локальные координаты content в глобальные координаты сцены
    const contentMatrix = this.content.getWorldTransformMatrix()
    const globalPoint = new Phaser.Math.Vector2()
    contentMatrix.transformPoint(x, y, globalPoint)

    // Проверяем, находится ли точка в области поверхности
    const isInside = (globalPoint.x >= surfaceRect.x &&
                     globalPoint.x <= surfaceRect.x + surfaceRect.width &&
                     globalPoint.y >= surfaceRect.y &&
                     globalPoint.y <= surfaceRect.y + surfaceRect.height)

    return isInside
  }

  private handleSurfaceDrop(agent: any, dropPoint: Phaser.Math.Vector2): void {
    console.log(`[bunkerView] Обрабатываем падение жителя ${agent.profession} (ID: ${agent.id}) на поверхность`)

    // Получаем доступ к gameScene
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.lastSurfaceRect) {
      console.log(`[bunkerView] Размеры поверхности не определены, возвращаем жителя`)
      this.returnResidentToOriginalPosition(agent)
      return
    }

    const surfaceRect = gameScene.lastSurfaceRect
    const pad = 10
    const groundLevel = surfaceRect.height - pad

    console.log(`[bunkerView] Координаты точки отпускания на поверхности: (${dropPoint.x}, ${dropPoint.y})`)
    console.log(`[bunkerView] Размеры блока поверхности: ${surfaceRect.width} x ${surfaceRect.height}`)
    console.log(`[bunkerView] Уровень пола: ${groundLevel}`)

    // Используем координаты точки отпускания напрямую (они уже в локальной системе поверхности)
    let startX = dropPoint.x
    let startY = dropPoint.y

    // Ограничиваем координаты в разумных пределах
    // X: ограничиваем в пределах блока поверхности
    const clampedX = Math.max(pad, Math.min(surfaceRect.width - pad, startX))
    // Y: ограничиваем только сверху, снизу можем быть выше блока (для падения)
    const clampedY = Math.min(surfaceRect.height + 100, startY) // Позволяем быть выше блока до 100 пикселей

    // Если координаты сильно отличаются, используем ограниченные
    if (Math.abs(startX - clampedX) > 50 || Math.abs(startY - clampedY) > 100) {
      console.log(`[bunkerView] Координаты сильно выходят за пределы, ограничиваем: (${startX}, ${startY}) -> (${clampedX}, ${clampedY})`)
      startX = clampedX
      startY = clampedY
    }

    console.log(`[bunkerView] Финальные координаты для размещения: (${startX}, ${startY})`)

    // Определяем высоту падения - ВНИМАНИЕ: падаем ВНИЗ (увеличиваем Y)
    let fallHeight = 0
    if (startY < groundLevel - 20) {
      // Точка отпускания значительно выше пола - будет падение вниз
      fallHeight = groundLevel - startY
      console.log(`[bunkerView] Будет падение вниз: точка отпускания=${startY}, пол=${groundLevel}, высота падения=${fallHeight}`)
    } else {
      // Точка отпускания на уровне пола или ниже - размещаем сразу на полу
      console.log(`[bunkerView] Размещение на уровне пола: точка отпускания=${startY}, пол=${groundLevel}`)
      startY = groundLevel
    }

    // Сохраняем урон от падения для применения ПОСЛЕ падения
    // УВЕЛИЧИВАЕМ УРОН В 4 РАЗА: убираем порог и уменьшаем делитель
    const fallDamage = Math.max(0, Math.floor(fallHeight / 3))
    ;(agent as any).pendingFallDamage = fallDamage

    if (fallDamage > 0) {
      console.log(`[bunkerView] Рассчитан УВЕЛИЧЕННЫЙ урон от падения: ${fallDamage} (высота: ${fallHeight}px, будет применен после приземления)`)
    }

    // Размещаем жителя на поверхности
    this.placeResidentOnSurface(agent, surfaceRect, dropPoint, startX, startY, groundLevel)
  }

  private placeResidentOnSurface(agent: any, surfaceRect: Phaser.Geom.Rectangle, dropPoint: Phaser.Math.Vector2, startX: number, startY: number, groundLevel: number): void {
    console.log(`[bunkerView] Размещаем жителя ${agent.profession} на поверхности`)

    const gameScene = this.scene as any

    // Пересоздаем спрайты жителя на поверхности, используя логику из очереди
    // ВАЖНО: используем startX, startY для правильного позиционирования
    this.recreateResidentSpritesForSurface(agent, new Phaser.Math.Vector2(startX, startY))

    // Размещаем жителя в точке отпускания
    agent.rect.setPosition(startX, startY)
    
    // Спрайты уже созданы в правильной позиции в recreateResidentSpritesForSurface
    // Устанавливаем позицию только для healthBar
    if (agent.healthBar) {
      agent.healthBar.setPosition(startX, startY - 25)
    }

    // Добавляем в очередь поверхности только rect и healthBar
    // Спрайты уже добавлены в bunkerView.content
    if (gameScene.surfaceQueue) {
      gameScene.surfaceQueue.add(agent.rect)
      if (agent.healthBar) gameScene.surfaceQueue.add(agent.healthBar)
    }

    // Помечаем как находящегося на поверхности
    ;(agent as any).onSurface = true

    // ВАЖНО: Удаляем жителя из бункера и снижаем мораль
    this.removeResidentFromBunkerAndLowerMoral(agent)

    // ВАЖНО: Запускаем атаку врагов на жителей на поверхности
    this.startEnemyAttackOnSurfaceResidents()

    // Запускаем анимацию падения до пола
    this.animateFallToGround(agent, startX, startY, groundLevel)

    console.log(`[bunkerView] Житель размещен на поверхности и начинает падение с (${startX}, ${startY}) на пол (${groundLevel})`)
    console.log(`[bunkerView] Флаг onSurface установлен = ${(agent as any).onSurface} для жителя ${(agent as any).profession}`)

    // Сохраняем позицию для отладки
    ;(agent as any).dropPosition = { x: startX, y: startY }
  }

  /**
   * Удаляет жителя из бункера и снижает мораль на 10%
   */
  private removeResidentFromBunkerAndLowerMoral(agent: any): void {
    console.log(`[bunkerView] Удаляем жителя ${agent.profession} из бункера и снижаем мораль`)
    
    // Снимаем все рабочие/исследовательские назначения и освобождаем слоты
    try {
      this.releaseRoomAssignment(agent)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[bunkerView] Не удалось освободить рабочие слоты при удалении жителя', e)
    }

    // Удаляем из слотов сна, если числится
    try {
      for (const [, sleepers] of this.sleepOccupancy) {
        if (agent?.id != null) sleepers.delete(agent.id)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[bunkerView] Не удалось снять жителя со слотов сна при удалении', e)
    }

    // Удаляем жителя из residentAgents (визуальные и ИИ-агенты)
    const agentIndex = this.residentAgents.findIndex(a => a === agent)
    if (agentIndex !== -1) {
      this.residentAgents.splice(agentIndex, 1)
      console.log(`[bunkerView] ✅ Житель ${agent.profession} удален из residentAgents`)
    } else {
      console.log(`[bunkerView] ⚠️ Житель ${agent.profession} не найден в residentAgents`)
    }
    
    // Сразу удаляем жителя из логического списка жителей бункера, чтобы освободить слот
    try {
    const gameScene = this.scene as any
      if (gameScene && typeof gameScene.removeResidentFromBunker === 'function' && agent?.id != null) {
        gameScene.removeResidentFromBunker(agent.id, 'вышел на поверхность')
        console.log(`[bunkerView] ✅ Житель (ID: ${agent.id}) удален из bunkerResidents в GameScene`)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[bunkerView] Не удалось удалить жителя из GameScene.bunkerResidents', e)
    }
    
    // Снижаем мораль на 10%
    const gameScene = this.scene as any
    if (gameScene && typeof gameScene.applyMoralChange === 'function') {
      gameScene.applyMoralChange(-10, `Житель ${agent.profession} покинул бункер`)
      console.log(`[bunkerView] ✅ Мораль снижена на 10% (житель ${agent.profession} покинул бункер)`)
    } else {
      console.log(`[bunkerView] ⚠️ Не удалось снизить мораль: gameScene.applyMoralChange не найден`)
    }
  }

  /**
   * Проверяет наличие жителей на поверхности для атаки врагов
   */
  private getSurfaceResidents(): any[] {
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.surfaceArea) return []
    
    const surfaceResidents: any[] = []
    
    // Ищем жителей в surfaceArea по спрайтам
    if (gameScene.surfaceArea && gameScene.surfaceArea.list) {
      console.log(`[bunkerView] getSurfaceResidents: проверяем ${gameScene.surfaceArea.list.length} объектов в surfaceArea`)
      
      for (const item of gameScene.surfaceArea.list) {
        if (item && typeof item === 'object') {
          // Проверяем, является ли это спрайтом жителя
          if (item.texture && item.texture.key && 
              (item.texture.key.includes('_idle') || 
               item.texture.key.includes('_walk') || 
               item.texture.key.includes('_hurt'))) {
            
            // Ищем объект агента, который содержит этот спрайт
            const agent = this.findAgentBySprite(item)
            if (agent && agent.onSurface && agent.health > 0) {
              console.log(`[bunkerView] - Найден житель на поверхности: ${agent.profession}, здоровье: ${agent.health}`)
              surfaceResidents.push(agent)
            }
          }
        }
      }
    }
    
    // Также проверяем в surfaceQueue на всякий случай
    if (gameScene.surfaceQueue && gameScene.surfaceQueue.list) {
      console.log(`[bunkerView] getSurfaceResidents: проверяем ${gameScene.surfaceQueue.list.length} объектов в surfaceQueue`)
      
      for (const item of gameScene.surfaceQueue.list) {
        if (item && typeof item === 'object' && 'onSurface' in item && item.onSurface) {
          // Это житель на поверхности
          const surfaceResident = item as any
          if (surfaceResident.sprite && surfaceResident.sprite.scene && surfaceResident.health > 0) {
            // Проверяем, не добавлен ли уже
            if (!surfaceResidents.find(r => r === surfaceResident)) {
              console.log(`[bunkerView] - Найден житель в surfaceQueue: ${surfaceResident.profession}, здоровье: ${surfaceResident.health}`)
              surfaceResidents.push(surfaceResident)
            }
          }
        }
      }
    }
    
    console.log(`[bunkerView] getSurfaceResidents: итого найдено ${surfaceResidents.length} жителей на поверхности`)
    
    return surfaceResidents
  }

  /**
   * Ищет агента по спрайту
   */
  private findAgentBySprite(sprite: any): any | null {
    // Ищем в residentAgents
    for (const agent of this.residentAgents) {
      if (agent.sprite === sprite) {
        return agent
      }
    }
    
    // Ищем в gameScene.surfaceQueue
    const gameScene = this.scene as any
    if (gameScene.surfaceQueue && gameScene.surfaceQueue.list) {
      for (const item of gameScene.surfaceQueue.list) {
        if (item && typeof item === 'object' && item.sprite === sprite) {
          return item
        }
      }
    }
    
    return null
  }

  /**
   * Запускает атаку врагов на жителей на поверхности
   */
  private startEnemyAttackOnSurfaceResidents(): void {
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.enemyQueueItems) {
      console.log(`[bunkerView] startEnemyAttackOnSurfaceResidents: gameScene или enemyQueueItems не найдены`)
      return
    }
    
    console.log(`[bunkerView] startEnemyAttackOnSurfaceResidents: найдено ${gameScene.enemyQueueItems.length} врагов в очереди`)
    
    const surfaceResidents = this.getSurfaceResidents()
    
    if (surfaceResidents.length === 0) {
      // Нет жителей на поверхности - враги действуют по обычной логике
      console.log(`[bunkerView] Нет жителей на поверхности - враги действуют по обычной логике`)
      
      // Дополнительная отладка
      console.log(`[bunkerView] Отладка: проверяем содержимое surfaceArea`)
      if (gameScene.surfaceArea && gameScene.surfaceArea.list) {
        for (let i = 0; i < gameScene.surfaceArea.list.length; i++) {
          const item = gameScene.surfaceArea.list[i]
          if (item && typeof item === 'object') {
            console.log(`[bunkerView] - surfaceArea[${i}]: ${item.constructor.name}, texture: ${item.texture?.key || 'нет'}`)
          }
        }
      }
      
      return
    }
    
    console.log(`[bunkerView] Запускаем атаку ${gameScene.enemyQueueItems.length} врагов на ${surfaceResidents.length} жителей на поверхности`)
    
    // Для каждого врага запускаем атаку на жителей
    for (const enemy of gameScene.enemyQueueItems) {
      if (enemy && enemy.health > 0 && !enemy.exiting) {
        console.log(`[bunkerView] Запускаем атаку врага ${enemy.type} на жителей`)
        this.startEnemyAttackOnResident(enemy, surfaceResidents)
      }
    }
  }

  /**
   * Запускает атаку конкретного врага на жителей
   */
  private startEnemyAttackOnResident(enemy: any, surfaceResidents: any[]): void {
    if (!enemy || enemy.health <= 0 || enemy.exiting) {
      console.log(`[bunkerView] startEnemyAttackOnResident: враг не подходит для атаки (здоровье: ${enemy?.health}, exiting: ${enemy?.exiting})`)
      return
    }
    
    console.log(`[bunkerView] startEnemyAttackOnResident: проверяем ${surfaceResidents.length} жителей для атаки врагом ${enemy.type}`)
    
    // Находим ближайшего жителя для атаки
    let nearestResident = null
    let minDistance = Infinity
    
    for (const resident of surfaceResidents) {
      if (!resident || resident.health <= 0) {
        console.log(`[bunkerView] - Житель ${resident?.profession} пропущен (здоровье: ${resident?.health})`)
        continue
      }
      
      if (!resident.rect) {
        console.log(`[bunkerView] - Житель ${resident.profession} пропущен (нет rect)`)
        continue
      }
      
      const distance = Phaser.Math.Distance.Between(
        enemy.rect.x, enemy.rect.y,
        resident.rect.x, resident.rect.y
      )
      
      console.log(`[bunkerView] - Расстояние до жителя ${resident.profession}: ${Math.round(distance)}`)
      
      if (distance < minDistance) {
        minDistance = distance
        nearestResident = resident
      }
    }
    
    if (nearestResident) {
      console.log(`[bunkerView] Враг ${enemy.type} атакует жителя ${nearestResident.profession} на расстоянии ${Math.round(minDistance)}`)
      
      // Запускаем атаку врага
      if (!(enemy as any).attackTimer) {
        console.log(`[bunkerView] Создаем таймер атаки для врага ${enemy.type}`)
        ;(enemy as any).attackTimer = setInterval(() => {
          if (enemy && enemy.health > 0 && nearestResident && nearestResident.health > 0) {
            console.log(`[bunkerView] Враг ${enemy.type} атакует жителя ${nearestResident.profession}`)
            this.handleEnemyAttackOnResident(enemy, nearestResident)
          } else {
            // Очищаем таймер если кто-то умер
            if ((enemy as any).attackTimer) {
              console.log(`[bunkerView] Очищаем таймер атаки для врага ${enemy.type}`)
              clearInterval((enemy as any).attackTimer)
              ;(enemy as any).attackTimer = null
            }
          }
        }, 3000) // Враги атакуют каждые 3 секунды
      } else {
        console.log(`[bunkerView] Таймер атаки для врага ${enemy.type} уже существует`)
      }
    } else {
      console.log(`[bunkerView] Не найден подходящий житель для атаки врагом ${enemy.type}`)
    }
  }

  /**
   * Пересоздает спрайты жителя для поверхности, используя логику из очереди жителей
   */
  private recreateResidentSpritesForSurface(agent: any, position: Phaser.Math.Vector2): void {
    console.log(`[bunkerView] Пересоздаем спрайты жителя ${agent.profession} для поверхности`)
    
    // Проверяем, что content существует
    if (!this.content) {
      console.log(`[bunkerView] ❌ ОШИБКА: this.content не существует!`)
      return
    }
    
    // Проверяем, что scene существует
    if (!this.scene) {
      console.log(`[bunkerView] ❌ ОШИБКА: this.scene не существует!`)
      return
    }
    
    console.log(`[bunkerView] content существует, количество объектов: ${this.content.list.length}`)
    console.log(`[bunkerView] scene существует: ${!!this.scene}`)

    // Удаляем старые спрайты из bunkerView
    if (agent.sprite) {
      this.content.remove(agent.sprite)
      agent.sprite.destroy()
      agent.sprite = null
    }
    if (agent.shirt) {
      this.content.remove(agent.shirt)
      agent.shirt.destroy()
      agent.shirt = null
    }
    if (agent.pants) {
      this.content.remove(agent.pants)
      agent.pants.destroy()
      agent.pants = null
    }
    if (agent.footwear) {
      this.content.remove(agent.footwear)
      agent.footwear.destroy()
      agent.footwear = null
    }
    if (agent.hair) {
      this.content.remove(agent.hair)
      agent.hair.destroy()
      agent.hair = null
    }

    // Получаем данные жителя
    if (!(agent as any).profession) {
      console.log(`[bunkerView] ❌ ОШИБКА: agent.profession не существует!`)
      console.log(`[bunkerView] agent объект:`, agent)
      return
    }
    
    const profession = (agent as any).profession.toLowerCase()
    console.log(`[bunkerView] Профессия жителя: ${profession}`)
    
    if (typeof getSpecialistSpriteKey !== 'function') {
      console.log(`[bunkerView] ❌ ОШИБКА: getSpecialistSpriteKey не импортирована!`)
      return
    }
    
    const specialistSpriteKey = getSpecialistSpriteKey(profession)
    console.log(`[bunkerView] Ключ спрайта специализации: ${specialistSpriteKey}`)
    
          // Создаем новые спрайты в bunkerView (не в surfaceArea)
      if (specialistSpriteKey) {
        console.log(`[bunkerView] Найден спрайт специализации: ${specialistSpriteKey}`)
        
        // Создаем спрайт для специализации
        if (typeof ensureSpecialistAnimations !== 'function') {
          console.log(`[bunkerView] ❌ ОШИБКА: ensureSpecialistAnimations не импортирована!`)
          return
        }
        
        ensureSpecialistAnimations(this.scene, profession)
        
        // Создаем основной спрайт
        if (typeof this.scene.add.sprite !== 'function') {
          console.log(`[bunkerView] ❌ ОШИБКА: this.scene.add.sprite не является функцией!`)
          return
        }
        
        try {
          agent.sprite = this.scene.add.sprite(position.x, position.y, specialistSpriteKey, 0)
          console.log(`[bunkerView] ✅ Спрайт создан успешно`)
        } catch (error) {
          console.log(`[bunkerView] ❌ ОШИБКА при создании спрайта:`, error)
          return
        }
        // ВАЖНО: Для поверхности используем правильный origin (0.5, 1) как у жителей в бункере
        agent.sprite.setOrigin(0.5, 1)
        agent.sprite.setDepth(100)
        
        // Устанавливаем масштаб как у жителей в очереди
        const scaleX = (28 / 128) * 4
        const scaleY = (36 / 128) * 4
        agent.sprite.setScale(scaleX, scaleY)
        
        // ВАЖНО: На поверхности жители должны смотреть влево для движения влево
        // Исходные спрайты смотрят вправо, поэтому зеркалим (flipX = true) для движения влево
        agent.sprite.setFlipX(true)
        
                  // Добавляем в gameScene.surfaceArea (это важно для отображения на поверхности!)
          const gameScene = this.scene as any
          if (gameScene.surfaceArea && typeof gameScene.surfaceArea.add === 'function') {
            try {
              gameScene.surfaceArea.add(agent.sprite)
              console.log(`[bunkerView] ✅ Спрайт добавлен в gameScene.surfaceArea`)
              
              // ВАЖНО: НЕ добавляем в bunkerView.content - это вызывает конфликт!
              // Вместо этого сохраняем ссылку на спрайт в agent для последующего восстановления
              ;(agent as any).surfaceSprite = agent.sprite
              console.log(`[bunkerView] ✅ Ссылка на спрайт поверхности сохранена в agent`)
            } catch (error) {
              console.log(`[bunkerView] ❌ ОШИБКА при добавлении спрайта в surfaceArea:`, error)
              return
            }
          } else {
            console.log(`[bunkerView] ❌ ОШИБКА: gameScene.surfaceArea не найден или add не является функцией!`)
            // Fallback: добавляем в bunkerView.content
            try {
              this.content.add(agent.sprite)
              console.log(`[bunkerView] ✅ Fallback: спрайт добавлен в bunkerView.content`)
            } catch (error) {
              console.log(`[bunkerView] ❌ ОШИБКА при fallback добавлении в content:`, error)
              return
            }
          }
        
        // Временно отключаем создание одежды и волос для отладки
        // TODO: Восстановить после исправления основных спрайтов
        
        // Сохраняем исходное направление для правильного зеркалирования
        ;(agent as any).originalSurfaceDirection = 1 // 1 = смотрит влево (зеркален, flipX = true)
        
        console.log(`[bunkerView] Спрайты жителя ${agent.profession} пересозданы для поверхности в surfaceArea`)
        console.log(`[bunkerView] Позиция спрайта: (${position.x}, ${position.y})`)
        console.log(`[bunkerView] Масштаб: ${scaleX} x ${scaleY}`)
        console.log(`[bunkerView] flipX: ${agent.sprite.flipX}`)
        console.log(`[bunkerView] Спрайт видим: ${agent.sprite.visible}`)
        console.log(`[bunkerView] Спрайт активен: ${agent.sprite.active}`)
      } else {
        console.log(`[bunkerView] Не удалось найти спрайт специализации для профессии: ${profession}`)
        console.log(`[bunkerView] Попробуем создать fallback спрайт`)
        
        // Fallback: создаем простой прямоугольник как спрайт
        if (typeof this.scene.add.rectangle !== 'function') {
          console.log(`[bunkerView] ❌ ОШИБКА: this.scene.add.rectangle не является функцией!`)
          return
        }
        
        try {
          agent.sprite = this.scene.add.rectangle(position.x, position.y, 28, 36, 0x00ff00, 0.8)
          // ВАЖНО: Для поверхности используем правильный origin (0.5, 1)
          agent.sprite.setOrigin(0.5, 1)
          agent.sprite.setDepth(100)
          
          // Добавляем в gameScene.surfaceArea
          const gameScene = this.scene as any
          if (gameScene.surfaceArea && typeof gameScene.surfaceArea.add === 'function') {
            gameScene.surfaceArea.add(agent.sprite)
            console.log(`[bunkerView] ✅ Fallback спрайт добавлен в gameScene.surfaceArea`)
            
            // ВАЖНО: НЕ добавляем в bunkerView.content - это вызывает конфликт!
            // Вместо этого сохраняем ссылку на спрайт в agent для последующего восстановления
            ;(agent as any).surfaceSprite = agent.sprite
            console.log(`[bunkerView] ✅ Ссылка на fallback спрайт поверхности сохранена в agent`)
          } else {
            // Fallback: добавляем в bunkerView.content
            this.content.add(agent.sprite)
            console.log(`[bunkerView] ✅ Fallback: спрайт добавлен в bunkerView.content`)
          }
          
          console.log(`[bunkerView] Создан fallback спрайт (зеленый прямоугольник)`)
        } catch (error) {
          console.log(`[bunkerView] ❌ ОШИБКА при создании fallback спрайта:`, error)
          return
        }

      }
  }









  private animateFallToGround(agent: any, startX: number, startY: number, groundLevel: number): void {
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.tweens) return

    // ВОССТАНАВЛИВАЕМ МАСШТАБ ПОВЕРХНОСТИ И НАПРАВЛЕНИЕ перед падением
    if ((agent as any).surfaceScaleX && (agent as any).surfaceScaleY) {
      const surfaceScaleX = (agent as any).surfaceScaleX
      const surfaceScaleY = (agent as any).surfaceScaleY
      // Используем сохраненное исходное направление для правильного зеркалирования
      const directionScaleX = (agent as any).originalSurfaceDirection || -1
      console.log(`[bunkerView] animateFallToGround: directionScaleX=${directionScaleX} для движения влево`)
      console.log(`[bunkerView] animateFallToGround: текущий scaleX спрайта=${agent.sprite?.scaleX}, будет установлен=${surfaceScaleX * directionScaleX}`)
      console.log(`[bunkerView] animateFallToGround: сохраненное исходное направление=${(agent as any).originalSurfaceDirection}`)

      console.log(`[bunkerView] Восстанавливаем масштаб для падения с направлением: ${surfaceScaleX} x ${surfaceScaleY} (${directionScaleX === -1 ? 'влево' : 'вправо'})`)

      if (agent.sprite) {
        const beforeScaleX = agent.sprite.scaleX
        agent.sprite.setOrigin(0.5, 1) // Устанавливаем правильный origin для падения
        agent.sprite.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
        const afterScaleX = agent.sprite.scaleX
        const fallDirection = agent.sprite.scaleX < 0 ? 'влево' : 'вправо'
        console.log(`[bunkerView] animateFallToGround: ДЕТАЛЬНО: scaleX ДО=${beforeScaleX}, ПОСЛЕ=${afterScaleX}, направление=${fallDirection}`)
        console.log(`[bunkerView] animateFallToGround: РЕЗУЛЬТАТ: scaleX=${agent.sprite.scaleX}, направление=${fallDirection}`)
        // Сбрасываем анимации во время падения
        if (agent.sprite.anims) {
          agent.sprite.anims.stop()
          console.log(`[bunkerView] Анимации сброшены для падения`)
        }
      }
      if (agent.shirt) {
        agent.shirt.setOrigin(0.5, 1)
        agent.shirt.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.pants) {
        agent.pants.setOrigin(0.5, 1)
        agent.pants.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.footwear) {
        agent.footwear.setOrigin(0.5, 1)
        agent.footwear.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.hair) {
        agent.hair.setOrigin(0.5, 1)
        agent.hair.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
    }

    // Проверяем, нужно ли падение - падаем вниз (от меньшего Y к большему Y)
    const fallDistance = groundLevel - startY
    if (fallDistance <= 20) {
      // Уже близко к земле или на земле, сразу размещаем на полу и запускаем движение влево
      console.log(`[bunkerView] Житель близко к земле (расстояние=${fallDistance}), размещаем на полу и запускаем движение влево`)

      // Размещаем на полу с правильным позиционированием
      agent.rect.setPosition(startX, groundLevel)
      if (agent.sprite) {
        agent.sprite.setOrigin(0.5, 1)
        agent.sprite.setPosition(startX, groundLevel)
      }
      if (agent.shirt) {
        agent.shirt.setOrigin(0.5, 1)
        agent.shirt.setPosition(startX, groundLevel)
      }
      if (agent.pants) {
        agent.pants.setOrigin(0.5, 1)
        agent.pants.setPosition(startX, groundLevel)
      }
      if (agent.footwear) {
        agent.footwear.setOrigin(0.5, 1)
        agent.footwear.setPosition(startX, groundLevel)
      }
      if (agent.hair) {
        agent.hair.setOrigin(0.5, 1)
        agent.hair.setPosition(startX, groundLevel)
      }

      // Обновляем шкалу здоровья и устанавливаем правильную позицию
      if (agent.healthBar) {
        this.drawHealthBar(agent)
        agent.healthBar.setPosition(startX, groundLevel - 20)
        console.log(`[bunkerView] Шкала здоровья repositioned при размещении на полу: (${agent.healthBar.x}, ${agent.healthBar.y})`)
      }

      this.startSurfaceMovement(agent)
      return
    }

    // Рассчитываем время падения в зависимости от высоты
    const fallDuration = Math.min(2000, Math.max(300, fallDistance * 10)) // 300мс минимум, 2000мс максимум

    console.log(`[bunkerView] Анимируем падение: расстояние=${fallDistance}, длительность=${fallDuration}мс`)
    console.log(`[bunkerView] Падение с (${startX}, ${startY}) на (${startX}, ${groundLevel})`)

    // Создаем tween для падения с ускорением
    const fallTween = gameScene.tweens.add({
      targets: [agent.rect, agent.sprite, agent.shirt, agent.pants, agent.footwear, agent.hair].filter(obj => obj),
      x: startX, // Сохраняем X-координату точки отпускания
      y: groundLevel, // Падаем к уровню пола
      duration: fallDuration,
      ease: 'Quad.easeIn', // Ускорение падения (как гравитация)
      onUpdate: () => {
        // Обновляем позицию шкалы здоровья во время падения
        if (agent.healthBar) {
          agent.healthBar.setPosition(agent.rect.x, agent.rect.y - 20)
        }
      },
      onComplete: () => {
        console.log(`[bunkerView] Падение завершено, применяем урон и запускаем движение влево`)
        console.log(`[bunkerView] Финальная позиция после падения: (${agent.rect.x}, ${agent.rect.y})`)

        // ПРИМЕНЯЕМ УРОН ОТ ПАДЕНИЯ ПОСЛЕ приземления
        const pendingDamage = (agent as any).pendingFallDamage || 0
        if (pendingDamage > 0) {
          agent.health = Math.max(0, agent.health - pendingDamage)
          console.log(`[bunkerView] Житель получил ${pendingDamage} урона от падения (здоровье: ${agent.health})`)

          // ВОСПРОИЗВОДИМ АНИМАЦИЮ HURT при получении урона
          this.playHurtAnimation(agent)

          // Обновляем шкалу здоровья и устанавливаем правильную позицию
          if (agent.healthBar) {
            this.drawHealthBar(agent)
            agent.healthBar.setPosition(agent.rect.x, agent.rect.y - 20)
            console.log(`[bunkerView] Шкала здоровья обновлена и repositioned: (${agent.healthBar.x}, ${agent.healthBar.y})`)
          }

          // Очищаем pending damage
          ;(agent as any).pendingFallDamage = 0
        }

        // Проверяем, не умер ли житель от падения
        if (agent.health <= 0) {
          console.log(`[bunkerView] Житель умер от падения!`)
          this.handleResidentDeath(agent)
          return
        }

        this.startSurfaceMovement(agent)
      }
    })

    // Сохраняем ссылку на tween для возможной отмены
    ;(agent as any).fallTween = fallTween
  }

  private startSurfaceMovement(agent: any): void {
    console.log(`[bunkerView] Запускаем движение жителя ${(agent as any).profession} по поверхности`)

    // Для новых спрайтов на поверхности используем setFlipX вместо scaleX
    if ((agent as any).onSurface && agent.sprite) {
      // НЕ перезаписываем flipX - он уже правильно установлен в recreateResidentSpritesForSurface
      // Спрайт уже смотрит влево (flipX = true) для движения влево
      
      // Устанавливаем правильный origin для движения
      agent.sprite.setOrigin(0.5, 1)
      
      console.log(`[bunkerView] startSurfaceMovement: Сохраняем текущее направление влево (flipX=${agent.sprite.flipX}) для движения`)
      console.log(`[bunkerView] startSurfaceMovement: Спрайт смотрит ${agent.sprite.flipX ? 'влево (зеркален)' : 'вправо (не зеркален)'}`)
        
        // ДИАГНОСТИКА ТЕКСТУРЫ: Проверяем, какая текстура отображается
        if (agent.sprite.texture) {
          console.log(`[bunkerView] 🔍 ДИАГНОСТИКА ТЕКСТУРЫ при движении:`)
          console.log(`[bunkerView] - Текущая текстура: ${agent.sprite.texture.key}`)
          console.log(`[bunkerView] - Размеры текстуры: ${agent.sprite.texture.source[0]?.width} x ${agent.sprite.texture.source[0]?.height}`)
          console.log(`[bunkerView] - Текущий кадр анимации: ${agent.sprite.anims.currentFrame?.textureKey || 'unknown'}`)
          console.log(`[bunkerView] - Анимация активна: ${agent.sprite.anims.isPlaying}`)
          console.log(`[bunkerView] - Текущий кадр: ${agent.sprite.anims.currentFrame?.index || 'unknown'}`)
        }
        
        // Запускаем анимацию ходьбы
        const profession = (agent as any).profession?.toLowerCase() || 'unemployed'
        if (agent.sprite.anims) {
          // УБЕДИМСЯ ЧТО АНИМАЦИИ СОЗДАНЫ для этой профессии
          const actualProfession = (agent as any).profession || 'безработный'
          console.log(`[bunkerView] Создаем анимации для профессии при движении: ${actualProfession}`)
          ensureSpecialistAnimations(this.scene, actualProfession)
          console.log(`[bunkerView] Убедились что анимации созданы для профессии при движении: ${actualProfession}`)

          // СБРАСЫВАЕМ ВСЕ СТАРЫЕ АНИМАЦИИ перед запуском новой
          agent.sprite.anims.stop()
          console.log(`[bunkerView] Сброшены все старые анимации перед запуском движения`)

          const walkAnim = `${profession}_walk`
          console.log(`[bunkerView] Ищем анимацию walk: ${walkAnim}`)
          
          // Проверяем анимацию в scene.anims (где она создается)
          const sceneHasWalk = this.scene.anims.exists(walkAnim)
          console.log(`[bunkerView] Анимация walk в scene.anims: ${sceneHasWalk}`)

                      if (sceneHasWalk) {
              // Используем scene.anims.play() для воспроизведения анимации
              this.scene.anims.play(walkAnim, agent.sprite)
              console.log(`[bunkerView] ✅ УСПЕШНО запущена анимация ходьбы: ${walkAnim}`)
              
              // ДИАГНОСТИКА АНИМАЦИИ: Проверяем детали анимации
              const anim = this.scene.anims.get(walkAnim)
              if (anim) {
                console.log(`[bunkerView] 🔍 ДИАГНОСТИКА АНИМАЦИИ ${walkAnim}:`)
                console.log(`[bunkerView] - Количество кадров: ${anim.frames.length}`)
                console.log(`[bunkerView] - Скорость: ${anim.frameRate}`)
                console.log(`[bunkerView] - Первый кадр: ${anim.frames[0]?.textureKey || 'unknown'}`)
                console.log(`[bunkerView] - Последний кадр: ${anim.frames[anim.frames.length-1]?.textureKey || 'unknown'}`)
                console.log(`[bunkerView] - Текущий кадр спрайта: ${agent.sprite.anims.currentFrame?.textureKey || 'unknown'}`)
              }
            } else {
            // Если анимация ходьбы не существует, попробуем idle
            const idleAnim = `${profession}_idle`
            console.log(`[bunkerView] Ищем анимацию idle: ${idleAnim}`)
            
            // Проверяем анимацию в scene.anims
            const sceneHasIdle = this.scene.anims.exists(idleAnim)
            console.log(`[bunkerView] Анимация idle в scene.anims: ${sceneHasIdle}`)

            if (sceneHasIdle) {
              // Используем scene.anims.play() для воспроизведения анимации
              this.scene.anims.play(idleAnim, agent.sprite)
              console.log(`[bunkerView] ✅ Запущена анимация idle (ходьба не найдена): ${idleAnim}`)
            } else {
              console.log(`[bunkerView] ❌ Ни анимация ходьбы, ни idle не найдены: ${walkAnim}, ${idleAnim}`)
              // Попробуем найти доступные анимации
              if (agent.sprite.anims && agent.sprite.anims.anims) {
                const allAnims = Array.from(agent.sprite.anims.anims.keys())
                console.log(`[bunkerView] Доступные анимации на спрайте:`, allAnims)

                // Попробуем запустить первую доступную анимацию
                if (allAnims.length > 0) {
                  const firstAnim = allAnims[0]
                  console.log(`[bunkerView] Пробуем запустить первую доступную анимацию: ${firstAnim}`)
                  // Используем scene.anims.play() для воспроизведения анимации
                  if (typeof firstAnim === 'string') {
                    this.scene.anims.play(firstAnim, agent.sprite)
                  }
                }
              }
            }
          }
        }
      }

    // Для старых спрайтов (не на поверхности) используем старую логику
    if (!(agent as any).onSurface) {
      // ВОССТАНАВЛИВАЕМ МАСШТАБ ПОВЕРХНОСТИ И НАПРАВЛЕНИЕ перед началом движения
      if ((agent as any).surfaceScaleX && (agent as any).surfaceScaleY) {
        const surfaceScaleX = (agent as any).surfaceScaleX
        const surfaceScaleY = (agent as any).surfaceScaleY
        // Используем сохраненное исходное направление для правильного зеркалирования
        const directionScaleX = (agent as any).originalSurfaceDirection || -1

        if (agent.sprite) {
          agent.sprite.setOrigin(0.5, 1) // Устанавливаем правильный origin для движения
          agent.sprite.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.shirt) {
        agent.shirt.setOrigin(0.5, 1)
        agent.shirt.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.pants) {
        agent.pants.setOrigin(0.5, 1)
        agent.pants.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.footwear) {
        agent.footwear.setOrigin(0.5, 1)
        agent.footwear.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
      }
      if (agent.hair) {
        agent.hair.setOrigin(0.5, 1)
        agent.hair.setScale(surfaceScaleX * directionScaleX, surfaceScaleY)
        }
      }
    }

    const gameScene = this.scene as any
    const surfaceRect = gameScene.lastSurfaceRect
    if (!surfaceRect) return

    const targetX = -50 // За левую границу

    console.log(`[bunkerView] Движение от X=${agent.rect.x} к targetX=${targetX}`)

    if (gameScene.tweens) {
      const tween = gameScene.tweens.add({
        targets: [agent.rect, agent.sprite, agent.shirt, agent.pants, agent.footwear, agent.hair].filter(obj => obj),
        x: targetX,
        duration: Math.abs(targetX - agent.rect.x) * 50, // 50мс на пиксель
        ease: 'Linear',
        onUpdate: () => {
          if (agent.healthBar) {
            agent.healthBar.setPosition(agent.rect.x, agent.rect.y - 20)
          }
          // Проверяем врагов на каждом шаге
          this.checkSurfaceEnemies(agent)
        },
        onComplete: () => {
          console.log(`[bunkerView] Житель ${(agent as any).profession} ушел за границу`)
          this.handleResidentDeath(agent)
        }
      })

      ;(agent as any).surfaceTween = tween
    }
  }

  private handleResidentDeath(agent: any): void {
    console.log(`[bunkerView] Житель ${(agent as any).profession} погиб на поверхности`)

    // Получаем ссылку на GameScene
    const gameScene = this.scene as any

    // Останавливаем все активные tween'ы
    if ((agent as any).surfaceTween) {
      ;(agent as any).surfaceTween.stop()
      ;(agent as any).surfaceTween = null
    }
    if ((agent as any).fallTween) {
      ;(agent as any).fallTween.stop()
      ;(agent as any).fallTween = null
    }

    // Останавливаем атаку
    if ((agent as any).surfaceAttackTimer) {
      clearInterval((agent as any).surfaceAttackTimer)
      ;(agent as any).surfaceAttackTimer = null
    }

    // Останавливаем атаки врагов на этого жителя
    if (gameScene && gameScene.enemyQueueItems) {
      for (const enemy of gameScene.enemyQueueItems) {
        if (enemy && (enemy as any).attackTimer) {
          clearInterval((enemy as any).attackTimer)
          ;(enemy as any).attackTimer = null
        }
      }
    }

    // Останавливаем все fallback таймеры
    if ((agent as any).hurtFallbackTimer) {
      clearTimeout((agent as any).hurtFallbackTimer)
      ;(agent as any).hurtFallbackTimer = null
    }
    if ((agent as any).deathFallbackTimer) {
      clearTimeout((agent as any).deathFallbackTimer)
      ;(agent as any).deathFallbackTimer = null
    }

    // ПОКАЗЫВАЕМ АНИМАЦИЮ СМЕРТИ перед удалением
    // Добавляем небольшую задержку, чтобы житель успел увидеть урон и анимацию hurt
    setTimeout(() => {
      this.playDeathAnimation(agent, () => {
        // Callback выполняется после завершения анимации смерти
        this.finalizeResidentDeath(agent, gameScene)
      })
    }, 1500) // 1.5 секунды задержки перед анимацией смерти
  }

  /**
   * Воспроизводит анимацию смерти для жителя
   */
  private playDeathAnimation(agent: any, onComplete: () => void): void {
    if (!agent || !agent.sprite) {
      console.log(`[bunkerView] Не удается воспроизвести анимацию смерти - нет спрайта`)
      onComplete()
      return
    }

    const profession = (agent as any).profession || 'безработный'
    const deadAnim = `${profession}_dead`
    
    console.log(`[bunkerView] Воспроизводим анимацию смерти: ${deadAnim}`)
    
    // Проверяем, существует ли анимация смерти в scene.anims
    if (this.scene.anims.exists(deadAnim)) {
      // Останавливаем текущую анимацию
      agent.sprite.anims.stop()
      
      // Воспроизводим анимацию смерти
      this.scene.anims.play(deadAnim, agent.sprite)
      console.log(`[bunkerView] ✅ Анимация смерти запущена: ${deadAnim}`)
      
      // Ждем завершения анимации смерти
      console.log(`[bunkerView] Ждем завершения анимации смерти: ${deadAnim}`)
      
      // Используем событие завершения анимации спрайта
      const onAnimationComplete = () => {
        console.log(`[bunkerView] ✅ Анимация смерти завершена по событию: ${deadAnim}`)
        onComplete()
      }
      
      // Подписываемся на событие завершения анимации
      agent.sprite.once('animationcomplete', onAnimationComplete)
      
      // Также устанавливаем таймер на случай, если событие не сработает
      const fallbackTimer = setTimeout(() => {
        console.log(`[bunkerView] ⚠️ Таймер fallback для анимации смерти: ${deadAnim}`)
        // Отписываемся от события
        agent.sprite.off('animationcomplete', onAnimationComplete)
        onComplete()
      }, 3000) // Максимум 3 секунды на анимацию смерти
      
      // Сохраняем ссылку на fallback таймер
      ;(agent as any).deathFallbackTimer = fallbackTimer
      
      // Очищаем таймер при завершении анимации
      agent.sprite.once('animationcomplete', () => {
        clearTimeout(fallbackTimer)
        ;(agent as any).deathFallbackTimer = null
      })
    } else {
      console.log(`[bunkerView] ❌ Анимация смерти не найдена: ${deadAnim}`)
      
      // Если анимация смерти не найдена, показываем fallback эффект
      this.playDeathFallback(agent, onComplete)
    }
  }

  /**
   * Fallback эффект смерти если нет анимации dead
   */
  private playDeathFallback(agent: any, onComplete: () => void): void {
    if (!agent || !agent.sprite) {
      onComplete()
      return
    }
    
    console.log(`[bunkerView] Показываем fallback эффект смерти`)
    
          // Создаем эффект затухания с покачиванием
      const gameScene = this.scene as any
      if (gameScene.tweens) {
        // Сначала покачиваем спрайт
        const shakeTween = gameScene.tweens.add({
          targets: [agent.sprite, agent.shirt, agent.pants, agent.footwear, agent.hair].filter(obj => obj),
          x: agent.sprite.x + 5,
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            // Затем затухаем
            const fadeTween = gameScene.tweens.add({
              targets: [agent.sprite, agent.shirt, agent.pants, agent.footwear, agent.hair].filter(obj => obj),
              alpha: 0,
              duration: 1500,
              ease: 'Power2',
              onComplete: () => {
                console.log(`[bunkerView] ✅ Fallback эффект смерти завершен`)
                onComplete()
              }
            })
            
            // Сохраняем ссылку на tween для возможной отмены
            ;(agent as any).deathFallbackTween = fadeTween
          }
        })
        
        // Сохраняем ссылку на tween для возможной отмены
        ;(agent as any).deathShakeTween = shakeTween
      } else {
        // Если нет tweens, просто ждем
        setTimeout(() => {
          console.log(`[bunkerView] ✅ Fallback эффект смерти завершен (таймер)`)
          onComplete()
        }, 2000) // Увеличено до 2 секунд
      }
  }

  /**
   * Определяет правильный масштаб по X для направления движения
   * @param agent - агент (житель/враг)
   * @param direction - направление движения ('left', 'right')
   * @returns масштаб по X (1 для вправо, -1 для влево)
   */
  private getDirectionScaleX(agent: any, direction: 'left' | 'right'): number {
    // Проверяем, есть ли сохраненное исходное направление
    const originalDirection = (agent as any).originalSurfaceDirection
    
    if (originalDirection !== undefined) {
      console.log(`[bunkerView] getDirectionScaleX: используем сохраненное исходное направление=${originalDirection}`)
      
      // Если у нас есть сохраненное направление, используем его
      if (direction === 'left') {
        // Для движения влево используем сохраненное направление
        return originalDirection
      } else if (direction === 'right') {
        // Для движения вправо инвертируем сохраненное направление
        return -originalDirection
      }
    }
    
    // Для новых спрайтов на поверхности используем setFlipX вместо scaleX
    if ((agent as any).onSurface && agent.sprite) {
      if (direction === 'left') {
        // Для движения влево спрайт должен смотреть влево
        // Исходные спрайты смотрят вправо, поэтому зеркалим (flipX = true)
        agent.sprite.setFlipX(true)
        return 1  // Положительный масштаб для правильного размера
      } else {
        // Для движения вправо спрайт должен смотреть вправо
        // Исходные спрайты уже смотрят вправо, поэтому не зеркалим (flipX = false)
        agent.sprite.setFlipX(false)
        return 1  // Положительный масштаб для правильного размера
      }
    }
    
    // Fallback: проверяем текущее направление спрайта
    const currentScaleX = agent.sprite?.scaleX || 1
    
    console.log(`[bunkerView] getDirectionScaleX: fallback - текущий scaleX=${currentScaleX}, нужное направление=${direction}`)
    
    // ЛОГИКА: для движения влево нужно, чтобы спрайт смотрел влево (scaleX < 0)
    // Если спрайт уже смотрит влево, НЕ зеркалим (возвращаем 1)
    // Если спрайт смотрит вправо, зеркалим (возвращаем -1)
    
    if (direction === 'left') {
      // Нужно движение влево
      if (currentScaleX < 0) {
        // Спрайт уже смотрит влево, НЕ зеркалим
        console.log(`[bunkerView] getDirectionScaleX: fallback - спрайт уже смотрит влево (scaleX=${currentScaleX}), НЕ зеркалим, возвращаем 1`)
        return 1
      } else {
        // Спрайт смотрит вправо, зеркалим для движения влево
        console.log(`[bunkerView] getDirectionScaleX: fallback - спрайт смотрит вправо (scaleX=${currentScaleX}), зеркалим для движения влево, возвращаем -1`)
        return -1
      }
    } else if (direction === 'right') {
      // Нужно движение вправо
      if (currentScaleX > 0) {
        // Спрайт уже смотрит вправо, НЕ зеркалим
        console.log(`[bunkerView] getDirectionScaleX: fallback - спрайт уже смотрит вправо (scaleX=${currentScaleX}), НЕ зеркалим, возвращаем 1`)
        return 1
      } else {
        // Спрайт смотрит влево, зеркалим для движения вправо
        console.log(`[bunkerView] getDirectionScaleX: fallback - спрайт смотрит влево (scaleX=${currentScaleX}), зеркалим для движения вправо, возвращаем -1`)
        return -1
      }
    }
    
    // По умолчанию не зеркалим
    console.log(`[bunkerView] getDirectionScaleX: fallback - неизвестное направление, возвращаем 1`)
    return 1
  }

  /**
   * Финальное удаление жителя после анимации смерти
   */
  private finalizeResidentDeath(agent: any, gameScene: any): void {
    console.log(`[bunkerView] Финальное удаление жителя ${(agent as any).profession}`)

    // Останавливаем все fallback таймеры
    if ((agent as any).hurtFallbackTimer) {
      clearTimeout((agent as any).hurtFallbackTimer)
      ;(agent as any).hurtFallbackTimer = null
    }
    if ((agent as any).deathFallbackTimer) {
      clearTimeout((agent as any).deathFallbackTimer)
      ;(agent as any).deathFallbackTimer = null
    }

    // Удаляем из очереди поверхности
    if (gameScene && gameScene.surfaceQueue) {
      gameScene.surfaceQueue.remove(agent.rect)
      if (agent.sprite) gameScene.surfaceQueue.remove(agent.sprite)
      if (agent.shirt) gameScene.surfaceQueue.remove(agent.shirt)
      if (agent.pants) gameScene.surfaceQueue.remove(agent.pants)
      if (agent.footwear) gameScene.surfaceQueue.remove(agent.footwear)
      if (agent.hair) gameScene.surfaceQueue.remove(agent.hair)
      if (agent.healthBar) gameScene.surfaceQueue.remove(agent.healthBar)
    }

    // Удаляем из массива residentAgents
    const index = this.residentAgents.indexOf(agent)
    if (index >= 0) {
      this.residentAgents.splice(index, 1)
    }

    // Уведомляем GameScene
    if (gameScene && typeof gameScene.removeResidentFromBunker === 'function') {
      gameScene.removeResidentFromBunker(agent.id, 'Изгнан на поверхность')
    }

    // Уничтожаем объекты
    if (agent.rect) agent.rect.destroy()
    if (agent.sprite) agent.sprite.destroy()
    if (agent.shirt) agent.shirt.destroy()
    if (agent.pants) agent.pants.destroy()
    if (agent.footwear) agent.footwear.destroy()
    if (agent.hair) agent.hair.destroy()
    if (agent.healthBar) agent.healthBar.destroy()
  }

  private checkSurfaceEnemies(resident: any): void {
    const gameScene = this.scene as any
    if (!gameScene || !gameScene.enemyQueueItems) return

    // Не атакуем во время падения
    if ((resident as any).fallTween && (resident as any).fallTween.isPlaying()) {
      return
    }

    // Находим врагов на поверхности
    const surfaceEnemies = gameScene.enemyQueueItems.filter((enemy: any) =>
      enemy && enemy.rect && !enemy.exiting && enemy.health > 0
    )

    if (surfaceEnemies.length === 0) {
      // Нет врагов - прекращаем атаку
      if ((resident as any).surfaceAttackTimer) {
        clearInterval((resident as any).surfaceAttackTimer)
        ;(resident as any).surfaceAttackTimer = null
      }
      return
    }

    // Есть враги - начинаем атаку
    if (!(resident as any).surfaceAttackTimer) {
      console.log(`[bunkerView] Житель ${resident.profession} начинает обороняться от ${surfaceEnemies.length} врагов`)

      ;(resident as any).surfaceAttackTimer = setInterval(() => {
        this.performSurfaceAttack(resident, surfaceEnemies)
      }, 2000) // Атака каждые 2 секунды
    }

    // Враги также атакуют жителей
    for (const enemy of surfaceEnemies) {
      if (enemy && enemy.health > 0 && !(enemy as any).attackTimer) {
        // Создаем таймер атаки для каждого врага
        ;(enemy as any).attackTimer = setInterval(() => {
          if (enemy && enemy.health > 0 && resident && resident.health > 0) {
            this.handleEnemyAttackOnResident(enemy, resident)
          } else {
            // Очищаем таймер если кто-то умер
            if ((enemy as any).attackTimer) {
              clearInterval((enemy as any).attackTimer)
              ;(enemy as any).attackTimer = null
            }
          }
        }, 3000) // Враги атакуют каждые 3 секунды
      }
    }
  }

  private performSurfaceAttack(attacker: any, enemies: any[]): void {
    if (!attacker || attacker.health <= 0) return

    // Находим ближайшего живого врага
    let nearestEnemy = null
    let minDistance = Infinity

    for (const enemy of enemies) {
      if (!enemy || !enemy.rect || enemy.health <= 0) continue

      const distance = Phaser.Math.Distance.Between(
        attacker.rect.x, attacker.rect.y,
        enemy.rect.x, enemy.rect.y
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestEnemy = enemy
      }
    }

    if (nearestEnemy) {
      // Наносим урон врагу
      const damage = attacker.attackDamage || 20
      nearestEnemy.health = Math.max(0, nearestEnemy.health - damage)

      console.log(`[bunkerView] Житель ${attacker.profession} атакует врага (${damage} урона, здоровье врага: ${nearestEnemy.health})`)

      // Обновляем шкалу здоровья врага
      if (nearestEnemy.healthBar) {
        const gameScene = this.scene as any
        if (gameScene.drawHealthBar) {
          gameScene.drawHealthBar(nearestEnemy)
        }
      }

      // Проверяем смерть врага
      if (nearestEnemy.health <= 0) {
        console.log(`[bunkerView] Враг убит жителем ${attacker.profession}`)
        this.handleEnemyDeath(nearestEnemy)
      }
    }
  }

  /**
   * Обрабатывает атаку врага на жителя на поверхности
   */
  private handleEnemyAttackOnResident(enemy: any, resident: any): void {
    if (!enemy || !resident || resident.health <= 0) return

         // Наносим урон жителю
     const damage = enemy.attackDamage || 15
     resident.health = Math.max(0, resident.health - damage)
     
     // Синхронизируем здоровье с GameScene
     if (!resident.isEnemy && this.scene && (this.scene as any).updateResidentHealth) {
       (this.scene as any).updateResidentHealth(resident.id, resident.health);
     }
     
     console.log(`[bunkerView] Враг атакует жителя ${resident.profession} (${damage} урона, здоровье: ${resident.health})`)

    // Воспроизводим анимацию hurt для жителя
    this.playHurtAnimation(resident)

    // Обновляем шкалу здоровья жителя
    if (resident.healthBar) {
      const gameScene = this.scene as any
      if (gameScene.drawHealthBar) {
        gameScene.drawHealthBar(resident)
      }
    }

    // Проверяем смерть жителя
    if (resident.health <= 0) {
      console.log(`[bunkerView] Житель ${resident.profession} убит врагом на поверхности`)
      this.handleResidentDeath(resident)
    }
  }

  private handleEnemyDeath(enemy: any): void {
    console.log(`[bunkerView] Враг убит на поверхности`)

    // Удаляем врага из очереди поверхности
    const gameScene = this.scene as any
    if (gameScene && gameScene.surfaceEnemyQueue) {
      gameScene.surfaceEnemyQueue.remove(enemy.rect)
      if (enemy.sprite) gameScene.surfaceEnemyQueue.remove(enemy.sprite)
      if (enemy.shirt) gameScene.surfaceEnemyQueue.remove(enemy.shirt)
      if (enemy.pants) gameScene.surfaceEnemyQueue.remove(enemy.pants)
      if (enemy.footwear) gameScene.surfaceEnemyQueue.remove(enemy.footwear)
      if (enemy.hair) gameScene.surfaceEnemyQueue.remove(enemy.hair)
      if (enemy.healthBar) gameScene.surfaceEnemyQueue.remove(enemy.healthBar)
    }

    // Удаляем врага из массива enemyQueueItems
    if (gameScene && gameScene.enemyQueueItems) {
      const index = gameScene.enemyQueueItems.indexOf(enemy)
      if (index >= 0) {
        gameScene.enemyQueueItems.splice(index, 1)
      }
    }

    // Уничтожаем объекты
    if (enemy.rect) enemy.rect.destroy()
    if (enemy.sprite) enemy.sprite.destroy()
    if (enemy.shirt) enemy.shirt.destroy()
    if (enemy.pants) enemy.pants.destroy()
    if (enemy.footwear) enemy.footwear.destroy()
    if (enemy.hair) enemy.hair.destroy()
    if (enemy.healthBar) enemy.healthBar.destroy()
  }

  /**
   * Воспроизводит анимацию hurt для жителя при получении урона
   */
  private playHurtAnimation(agent: any): void {
    if (!agent || !agent.sprite) {
      console.log(`[bunkerView] Не удается воспроизвести hurt анимацию - нет спрайта`)
      return
    }

    const profession = (agent as any).profession || 'безработный'
    const hurtAnim = `${profession}_hurt`
    
    console.log(`[bunkerView] Воспроизводим анимацию hurt: ${hurtAnim}`)
    
    // Проверяем, существует ли анимация hurt в scene.anims
    if (this.scene.anims.exists(hurtAnim)) {
      // Останавливаем текущую анимацию
      agent.sprite.anims.stop()
      
      // Воспроизводим анимацию hurt
      this.scene.anims.play(hurtAnim, agent.sprite)
      console.log(`[bunkerView] ✅ Анимация hurt запущена: ${hurtAnim}`)
      
      // Через некоторое время возвращаемся к анимации walk (если житель жив)
      if (agent.health > 0) {
        // Сохраняем ссылку на hurt fallback таймер
        ;(agent as any).hurtFallbackTimer = setTimeout(() => {
          if (agent && agent.health > 0 && (agent as any).onSurface) {
            const walkAnim = `${profession}_walk`
            if (this.scene.anims.exists(walkAnim)) {
              this.scene.anims.play(walkAnim, agent.sprite)
              console.log(`[bunkerView] ✅ Возвращаемся к анимации walk после hurt: ${walkAnim}`)
            }
          }
        }, 2000) // 2 секунды анимации hurt (увеличено для лучшей видимости)
      }
    } else {
      console.log(`[bunkerView] ❌ Анимация hurt не найдена: ${hurtAnim}`)
      
      // Если анимация hurt не найдена, показываем fallback эффект
      this.flashSprite(agent)
      
      // Через некоторое время возвращаемся к анимации walk (если житель жив)
      if (agent.health > 0) {
        // Сохраняем ссылку на hurt fallback таймер
        ;(agent as any).hurtFallbackTimer = setTimeout(() => {
          if (agent && agent.health > 0 && (agent as any).onSurface) {
            const walkAnim = `${profession}_walk`
            if (this.scene.anims.exists(walkAnim)) {
              this.scene.anims.play(walkAnim, agent.sprite)
              console.log(`[bunkerView] ✅ Возвращаемся к анимации walk после hurt fallback: ${walkAnim}`)
            }
          }
        }, 2000) // 2 секунды fallback эффекта
      }
    }
  }

  /**
   * Мигает спрайтом жителя при получении урона (fallback если нет анимации hurt)
   */
  private flashSprite(agent: any): void {
    if (!agent || !agent.sprite) return
    
    console.log(`[bunkerView] Мигаем спрайтом как fallback для hurt эффекта`)
    
    // Создаем эффект мигания
    const gameScene = this.scene as any
    if (gameScene.tweens) {
      const flashTween = gameScene.tweens.add({
        targets: [agent.sprite, agent.shirt, agent.pants, agent.footwear, agent.hair].filter(obj => obj),
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          // Возвращаем нормальную прозрачность
          if (agent.sprite) agent.sprite.setAlpha(1)
          if (agent.shirt) agent.shirt.setAlpha(1)
          if (agent.pants) agent.pants.setAlpha(1)
          if (agent.footwear) agent.footwear.setAlpha(1)
          if (agent.hair) agent.hair.setAlpha(1)
          
          console.log(`[bunkerView] ✅ Мигание завершено, возвращаемся к нормальному состоянию`)
        }
      })
      
      // Сохраняем ссылку на tween для возможной отмены
      ;(agent as any).flashTween = flashTween
    }
  }
}



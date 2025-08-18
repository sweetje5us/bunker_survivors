import Phaser from 'phaser'
import { ensureCharacterAnimations, pickSkinForGender, pickClothingSetForGender, pickHairForGender, ensureSpecialistAnimations, getSpecialistSpriteKey, isSpecialistSprite } from './characters'

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
  private panStart?: Phaser.Math.Vector2
  private contentStart?: Phaser.Math.Vector2
  private readonly overviewMinScale = 0.5
  private debugAnim: boolean = false
  
  // Режим добавления комнат
  private isAddingRoom = false
  private addButton?: Phaser.GameObjects.Text
  private peopleButton?: Phaser.GameObjects.Text
  private availableRoomTypes = [
    // Базовые типы со старта
    'Вход',
    'Спальня',
    'Столовая',
    'Туалет',
    // Новые типы
    'Техническая',
    'Серверная', 
    'Госпиталь',
    'Склад',
    'Лаборатория',
    'Станция',
    // Служебный тип
    'Лифт'
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
    animLock?: 'work' | 'sleep' | null;
    sleepPulseTween?: Phaser.Tweens.Tween;
    // Debug
    debugText?: Phaser.GameObjects.Text;
    lastAnimLock?: 'work' | 'sleep' | null;
    lastDebugTs?: number;
  }> = []

  private roomOccupancy: Map<number, { chemistId?: number; scientistId?: number; usedSlots: Set<number>; workers?: Record<string, number> }> = new Map()
  private sleepOccupancy: Map<number, Set<number>> = new Map()

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.scene = scene
    this.parent = parent
    this.root = scene.add.container(0, 0)
    this.content = scene.add.container(0, 0)
    this.darknessContainer = scene.add.container(0, 0)
    this.panel = scene.add.graphics()
    this.overlay = scene.add.container(0, 0)
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
    this.root.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isPanning = this.mode === 'overview'
      ;(p as any)._dragged = false
      this.panStart = new Phaser.Math.Vector2(p.x, p.y)
      this.contentStart = new Phaser.Math.Vector2(this.content.x, this.content.y)
    })
    this.root.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isPanning || !this.panStart || !this.contentStart) return
      const dx = p.x - this.panStart.x
      const dy = p.y - this.panStart.y
      if (Math.abs(dx) + Math.abs(dy) > 4) (p as any)._dragged = true
      const newX = this.contentStart.x + dx
      const newY = this.contentStart.y + dy
      this.content.setPosition(newX, newY)
      // Синхронизируем затемнение при панорамировании
      this.darknessContainer.setPosition(newX, newY)
      // Перерисуем overlay, чтобы шапки/кнопки следовали за комнатами при панорамировании
      this.updateLabels()
    })
    this.root.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!(p as any)._dragged) {
        // Определяем, в какую комнату кликнули (в локальных координатах content)
        const m = this.content.getWorldTransformMatrix()
        const tmp = new Phaser.Math.Vector2()
        m.applyInverse(p.x, p.y, tmp)
        const lx = tmp.x
        const ly = tmp.y

        let hitIndex: number | null = null
        // Проверяем клик только если не в режиме добавления комнат
        if (!this.isAddingRoom) {
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
      const sFocus = getFocusScale(fr)
      const rcx = fr.x + fr.width / 2
      const rcy = fr.y + fr.height / 2
      const posX = Math.round(availW / 2 - rcx * sFocus)
      const posY = Math.round(availH / 2 - rcy * sFocus)
      this.content.setScale(sFocus)
      this.content.setPosition(posX, posY)
      // Синхронизируем затемнение с основным контентом
      this.darknessContainer.setScale(sFocus)
      this.darknessContainer.setPosition(posX, posY)
    } else {
      // Обзор: масштаб не больше половины фокусного и не больше масштаба, умещающего всё
      const baseFocusRect = this.roomRects[this.focusedIndex ?? 0] ?? this.roomRects[0]
      const sFocusBase = baseFocusRect ? getFocusScale(baseFocusRect) : 1
      const sOverview = Math.min(sFocusBase * 0.5, fitAllScale)
      const centerX = minX + totalWidth / 2
      const centerY = minY + totalHeight / 2
      const posX = Math.round(availW / 2 - centerX * sOverview)
      const posY = Math.round(availH / 2 - centerY * sOverview)
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
    // Устанавливаем фиксированные значения depth для правильного порядка отрисовки
    console.log(`[Depth] Обновляем depth для ${this.residentAgents.length} персонажей`)
    for (let i = 0; i < this.residentAgents.length; i++) {
      const a = this.residentAgents[i]
      if (a.sprite) {
        a.sprite.setDepth(100)
        const sameContainer = a.sprite.parentContainer === this.content
        console.log(`[Depth] Персонаж ${i}: sprite depth=${a.sprite.depth}, в content=${sameContainer}, container=${a.sprite.parentContainer?.name || 'none'}`)
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
    this.updateLabels()
    
    // Обновляем прозрачность затемнения при смене режима/фокуса
    this.updateAllDarknessTransparency()
  }

  // Убираем рескейл прямоугольников. Комнаты и лифт хранятся в базовых единицах (120x90),
  // отображение масштабируется через content.setScale в двух фиксированных режимах.

  private drawBunker(): void {
    console.log(`[Darkness] drawBunker вызван`)
    this.panel.clear()
    
    // Сначала чистим старые images (если есть), оставляем panel (границы), панели деталей и прямоугольники затемнения
    const toRemove: Phaser.GameObjects.GameObject[] = []
    let darknessFound = 0
    for (const obj of this.content.list) {
      const n = (obj as any).name
      if (n === 'darkness') {
        darknessFound++
      }
      // Не удаляем панели деталей, жителей и прямоугольники затемнения
      if (obj !== this.panel && n !== 'detailsPanel' && n !== 'resident' && n !== 'dbg' && n !== 'darkness') {
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
    
    // Кнопка добавления комнат (только в overview режиме)
    if (this.mode === 'overview') {
      this.createAddButton()
      this.createPeopleButton()
    }
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
    this.addButton.on('pointerdown', () => this.showRoomSelectionMenu())
    
    // Добавляем кнопку к parent, чтобы она была поверх всего
    this.parent.add(this.addButton)
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
    
    // Полный перерасчёт layout для корректного масштабирования
    this.layout(this.viewport)
    
    console.log(`Добавлена комната: ${roomType} в позицию (${pos.x}, ${pos.y})`)
    // Обновим UI ресурсов/вместимости в GameScene сразу после добавления комнаты
    try {
      (this.scene as any).updateResourcesText?.()
      ;(this.scene as any).onBunkerChanged?.()
    } catch {}
  }

  private toggleRoomDetailsPanel(index: number): void {
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
  public syncResidents(expectedCount: number): void {
    while (this.residentAgents.length < expectedCount) {
      const rect = this.scene.add.rectangle(0, 0, 28, 36, 0x000000, 0).setOrigin(0.5, 1)
      rect.setStrokeStyle(2, 0x00ff00, 1.0)
      rect.setVisible(true)
      rect.setDepth(50)  // рамка отладки под спрайтами
      ;(rect as any).name = 'resident'
      this.content.add(rect)
      // Создаем спрайт по специализации или оставляем рамку
      const game: any = this.scene
      const idx = this.residentAgents.length
      const res = game.bunkerResidents?.[idx]
      const gender = res?.gender ?? (Math.random() < 0.5 ? 'М' : 'Ж')
      const skinKey = pickSkinForGender(gender, res?.id ?? idx + 1)
      const profession = res?.profession?.toLowerCase() ?? ''
      const specialistSpriteKey = getSpecialistSpriteKey(profession)
      
      let sprite = undefined
      let shirt = undefined
      let pants = undefined
      let footwear = undefined
      let hair = undefined
      
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
      const resident = (this.scene as any).bunkerResidents?.[idx]
      const agent = {
        id: resident?.id,
        rect, sprite, shirt, pants, footwear, hair, skinKey,
        profession: resident?.profession,
        skills: resident?.skills ?? [],
        workAtNight: (resident?.skills ?? []).some((s: any) => s.text === 'сова')
      } as {
        id?: number; rect: Phaser.GameObjects.Rectangle; sprite?: Phaser.GameObjects.Sprite; shirt?: Phaser.GameObjects.Sprite; pants?: Phaser.GameObjects.Sprite; footwear?: Phaser.GameObjects.Sprite; hair?: Phaser.GameObjects.Sprite; skinKey: string;
        profession?: string; skills?: Array<{ text: string; positive: boolean }>; workAtNight?: boolean; isLazyToday?: boolean; working?: boolean; away?: boolean; target?: Phaser.Math.Vector2; roomIndex?: number; sleeping?: boolean; path?: Phaser.Math.Vector2[]; dwellUntil?: number; goingToRest?: boolean; stayInRoomName?: string; settled?: boolean; assignedRoomIndex?: number; assignedSlotIndex?: number; assignedRole?: 'chemist' | 'scientist'; schedType?: 'normal' | 'owl' | 'insomnia'; insomniaOffsetHour?: number; scheduleState?: 'sleep' | 'work' | 'rest'
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
      this.assignRandomPosition(agent)
      // Если есть целевая комната для стояния (химик) — сразу сбросим цель, чтобы начать движение
      if (agent.stayInRoomName) { agent.target = undefined; agent.path = [] }
    }
    while (this.residentAgents.length > expectedCount) {
      const a = this.residentAgents.pop()!
      a.rect.destroy()
      // Уничтожаем спрайт специализации если есть
      a.sprite?.destroy()
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
    if (curIndex < 0) curIndex = agent.roomIndex ?? destIndex
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

    for (const agent of this.residentAgents) {
      // 1) Рабочие профессии: добраться до своей комнаты и стоять
      if (agent.scheduleState === 'work' && ((agent.stayInRoomName && !agent.settled) || ['сантехник','повар','инженер','солдат','доктор','врач','охотник','разведчик'].includes((agent.profession||'').toLowerCase()))) {
        const profWork = (agent.profession || '').toLowerCase()
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
      // 2) Безработные/бездомные: бродят
      const profession = (agent.profession ?? '').toLowerCase()
      const isWanderer = (!profession || ['бездомный', 'безработный', 'бездельник'].includes(profession)) || agent.scheduleState === 'rest'
      if (isWanderer && !agent.target && (!agent.path || agent.path.length === 0)) {
        // иногда стоим, иногда идём в случайную комнату (не лифт)
        if (!agent.dwellUntil || this.scene.time.now > agent.dwellUntil) {
          agent.dwellUntil = this.scene.time.now + Phaser.Math.Between(1500, 4000)
          // выбрать случайную достижимую комнату
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

      // 3) Движение по пути (если цель есть); иначе остаёмся на месте, но продолжаем отрисовку состояний
      let moving = false
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
      }
      }
      // Машина состояний анимаций: work=attack, sleep/elevator/stand=idle, move(outside elevator)=walk
      const inLiftNow = isXInAnyElevator(agent.rect.x)
      const atIdxNow = findRoomIndexAt(agent.rect.x, agent.rect.y)
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
      const workingNow = agent.scheduleState === 'work' && isLabWorkerNow && ((isInLab || inAssignedWork)) && hasArrived
      const sleepingNow = agent.scheduleState === 'sleep' && isInRestRoom && hasArrived

      const playAll = (suffix: 'attack' | 'sleep' | 'walk' | 'idle') => {
        // Проигрываем анимацию для спрайта специализации если есть
        if (agent.sprite && agent.profession) {
          const profession = agent.profession.toLowerCase()
          const specialistSpriteKey = getSpecialistSpriteKey(profession)
          if (specialistSpriteKey) {
            try {
              // Для специализаций используем наши анимации
              agent.sprite.anims.play(`${profession}_${suffix}`, true)
            } catch (e) {
              console.warn(`[playAll] Не удалось воспроизвести анимацию ${profession}_${suffix}:`, e)
            }
          }
        }
      }

      const followingPath = !!agent.target

      if (inLiftNow) {
        agent.animLock = null
        playAll('idle')
      } else if (workingNow) {
        agent.animLock = 'work'
        playAll('attack')
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
        agent.animLock = null
        playAll('idle')
      } else if (followingPath || moving) {
        agent.animLock = null
        playAll('walk')
      } else {
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
        agent.animLock = null
        playAll('idle')
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
            console.log('[LabArrive]', { id: agent.id, labIdx: agent.assignedRoomIndex, slot: agent.assignedSlotIndex })
            // Сразу лог текущей анимации
            // eslint-disable-next-line no-console
            console.log('[LabArriveAnim]', { id: agent.id, anim: agent.sprite?.anims?.currentAnim?.key })
          }
          // Уход на поверхность: по прибытии к входу и наличии флага — исчезаем
          if ((agent as any)._surfacePending) {
            const entranceIdx = this.roomNames.indexOf('Вход')
            const atIdx = findRoomIndexAt(agent.rect.x, agent.rect.y)
            if (entranceIdx >= 0 && atIdx === entranceIdx) {
                          // Спрятать рамку и спрайт при уходе на поверхность
            agent.rect.setVisible(false)
            if (agent.sprite) {
              agent.sprite.setVisible(false)
            }
            ;(agent as any).away = true
              ;(agent as any)._surfacePending = false
              try { (this.scene as any).announce?.(`${agent.profession} ушел на поверхность`) } catch {}
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
          try { (this.scene as any).announce?.(`${agent.profession} вернулся`) } catch {}
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
       // Этап 1: НЕ трогаем работников лабораторий (химик/учёный) и тех, у кого есть фиксированная целевая комната
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
      console.log('[LabAssign:check]', { id: agent.id, role, labIdx: idx, roomName: this.roomNames[idx] })
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
        console.log('[LabAssign:start]', { id: agent.id, role, labIdx: idx, slot: chosenSlot, target: { x: dst.x, y: dst.y } })
        return true
      } else {
        agent.target = before; agent.path = prevPath
      }
    }
    return false
  }

  // Универсальная бронь и построение пути в рабочую комнату по профессии
  private tryAssignAndPathToWorkRoom(agent: any): boolean {
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
        console.log('[WorkAssign:start]', { id: agent.id, prof, roomIdx: idx, slot: chosenSlot, target: { x: dst.x, y: dst.y } })
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
}



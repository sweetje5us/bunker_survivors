import Phaser from 'phaser'

export type GridPoint = { x: number; y: number }
export type RoomType = 'entrance' | 'canteen' | 'toilet' | 'rest'

export interface RoomNode {
  id: string
  type: 'room'
  roomType: RoomType
  grid: GridPoint
  title: string
}

export interface ElevatorNode {
  id: string
  type: 'elevator'
  grid: GridPoint
  heightFloors: number
}

export type BunkerNode = RoomNode | ElevatorNode

export interface BunkerMapData {
  nodes: BunkerNode[]
}

export function createInitialBunkerMap(): BunkerMapData {
  const rooms: RoomNode[] = [
    { id: 'room_entrance', type: 'room', roomType: 'entrance', grid: { x: 0, y: 0 }, title: 'Вход' },
    { id: 'room_canteen', type: 'room', roomType: 'canteen', grid: { x: 1, y: 0 }, title: 'Столовая' },
    { id: 'room_toilet', type: 'room', roomType: 'toilet', grid: { x: 2, y: 0 }, title: 'Туалет' },
    { id: 'room_rest', type: 'room', roomType: 'rest', grid: { x: 1, y: 1 }, title: 'Комната отдыха' }
  ]
  const elevators: ElevatorNode[] = [
    { id: 'elev_main', type: 'elevator', grid: { x: -1, y: 0 }, heightFloors: 2 }
  ]
  return { nodes: [...rooms, ...elevators] }
}

export class BunkerMapRenderer {
  private scene: Phaser.Scene
  private parent: Phaser.GameObjects.Container
  private viewport: Phaser.GameObjects.Container
  private content: Phaser.GameObjects.Container
  private maskGraphics?: Phaser.GameObjects.Graphics
  private maskObj?: Phaser.Display.Masks.GeometryMask

  private data: BunkerMapData
  private overview = true
  private focusedRoomId?: string
  private currentRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(0, 0, 10, 10)
  private isPanning = false
  private panStart?: Phaser.Math.Vector2
  private contentStart?: Phaser.Math.Vector2
  private debugGfx?: Phaser.GameObjects.Graphics
  private readonly debug = true

  private readonly cellWidth = 160
  private readonly cellHeight = 110
  private readonly gap = 20
  private readonly roomPadding = 10

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, data: BunkerMapData) {
    this.scene = scene
    this.parent = parent
    this.data = data
    this.viewport = this.scene.add.container(0, 0)
    this.content = this.scene.add.container(0, 0)
    this.parent.add(this.viewport)
    this.viewport.add(this.content)
    // Ensure bunker content renders above any background within same parent
    this.viewport.setDepth(1)
    this.content.setDepth(1)
    this.drawNodes()
    this.enableInteractions()
  }

  private drawNodes(): void {
    this.content.removeAll(true)
    this.data.nodes.forEach((node) => {
      if (node.type === 'room') {
        const { x, y } = this.gridToPx(node.grid)
        const w = this.cellWidth
        const h = this.cellHeight
        const container = this.scene.add.container(x, y)
        container.setName(node.id)
        const bg = this.scene.add.rectangle(0, 0, w, h, 0x1a1d22, 1).setOrigin(0)
        bg.setStrokeStyle(2, 0x2a2d33)
        const title = this.scene.add.text(this.roomPadding, this.roomPadding, node.title, {
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: '10px',
          color: '#e0e0e0'
        }).setOrigin(0)
        container.add([bg, title])
        container.setSize(w, h)
        container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains)
        container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if ((pointer as any)._dragged) return
          this.focusRoom(node.id)
        })
        this.content.add(container)
        container.setDepth(2)
      } else {
        const { x, y } = this.gridToPx(node.grid)
        const w = Math.max(24, Math.round(this.cellWidth * 0.25))
        const h = this.cellHeight * node.heightFloors + this.gap * (node.heightFloors - 1)
        const shaft = this.scene.add.rectangle(x, y, w, h, 0x2d2f36).setOrigin(0)
        shaft.setStrokeStyle(2, 0x3a3e46)
        this.content.add(shaft)
        shaft.setDepth(2)
      }
    })
  }

  private gridToPx(grid: GridPoint): { x: number; y: number } {
    const x = (this.cellWidth + this.gap) * grid.x
    const y = (this.cellHeight + this.gap) * grid.y
    return { x, y }
  }

  public layout(viewRect: Phaser.Geom.Rectangle): void {
    this.currentRect = viewRect
    // Mask to keep drawing inside the viewport rectangle
    if (this.maskGraphics) {
      this.maskGraphics.destroy()
      this.maskObj?.destroy()
      this.maskGraphics = undefined
      this.maskObj = undefined
    }
    this.viewport.setPosition(0, 0)
    this.viewport.setSize(viewRect.width, viewRect.height)
    // Create graphics for mask, attach to viewport so transforms align; do not render it
    this.maskGraphics = this.scene.add.graphics()
    this.maskGraphics.setVisible(false)
    this.maskGraphics.clear().fillStyle(0xffffff, 1).fillRect(0, 0, viewRect.width, viewRect.height)
    this.viewport.add(this.maskGraphics)
    this.maskObj = this.maskGraphics.createGeometryMask()
    // Mask only content; viewport remains unmasked as container shell
    this.content.setMask(this.maskObj)
    // Ensure full interactive area equals viewport size
    this.viewport.setInteractive(new Phaser.Geom.Rectangle(0, 0, viewRect.width, viewRect.height), Phaser.Geom.Rectangle.Contains)

    if (this.overview) this.fitAllInto(viewRect)
    else if (this.focusedRoomId) this.fitRoomInto(this.focusedRoomId, viewRect)
    if (this.debug) this.drawDebug(viewRect)
  }

  private getContentBoundsLocal(): Phaser.Geom.Rectangle {
    // Save
    const oldScaleX = this.content.scaleX
    const oldScaleY = this.content.scaleY
    const oldX = this.content.x
    const oldY = this.content.y
    // Reset
    this.content.setScale(1)
    this.content.setPosition(0, 0)
    // Compute bounds in world, then convert to content-local by subtracting content world position
    const m = this.content.getWorldTransformMatrix()
    const children = this.content.list as Phaser.GameObjects.GameObject[]
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    children.forEach((child) => {
      if ('getBounds' in child) {
        const b = (child as any).getBounds() as Phaser.Geom.Rectangle
        const lx = b.x - m.tx
        const ly = b.y - m.ty
        minX = Math.min(minX, lx)
        minY = Math.min(minY, ly)
        maxX = Math.max(maxX, lx + b.width)
        maxY = Math.max(maxY, ly + b.height)
      }
    })
    // Restore
    this.content.setScale(oldScaleX, oldScaleY)
    this.content.setPosition(oldX, oldY)
    if (!isFinite(minX)) return new Phaser.Geom.Rectangle(0, 0, 0, 0)
    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY)
  }

  private fitAllInto(rect: Phaser.Geom.Rectangle): void {
    const bounds = this.getContentBoundsLocal()
    const padding = 20
    const scaleX = (rect.width - padding * 2) / Math.max(bounds.width, 1)
    const scaleY = (rect.height - padding * 2) / Math.max(bounds.height, 1)
    const scale = Math.min(scaleX, scaleY)
    this.content.setScale(scale)
    // origin of viewport is 0,0 in bunkerArea coords
    const centerX = rect.width * 0.5 - (bounds.x + bounds.width * 0.5) * scale
    const centerY = rect.height * 0.5 - (bounds.y + bounds.height * 0.5) * scale
    this.content.setPosition(centerX, centerY)
  }

  private fitRoomInto(roomId: string, rect: Phaser.Geom.Rectangle): void {
    const room = this.content.getByName(roomId) as Phaser.GameObjects.Container | null
    if (!room) return
    // Similar conversion to local: compute room bounds in world and convert using content transform
    const m = this.content.getWorldTransformMatrix()
    const rb = room.getBounds()
    const targetBounds = new Phaser.Geom.Rectangle(rb.x - m.tx, rb.y - m.ty, rb.width, rb.height)
    const padding = 20
    const scaleX = (rect.width - padding * 2) / Math.max(targetBounds.width, 1)
    const scaleY = (rect.height - padding * 2) / Math.max(targetBounds.height, 1)
    const scale = Math.min(scaleX, scaleY)
    this.content.setScale(scale)
    const centerX = rect.width / 2 - (targetBounds.x + targetBounds.width / 2) * scale
    const centerY = rect.height / 2 - (targetBounds.y + targetBounds.height / 2) * scale
    this.content.setPosition(centerX, centerY)
  }

  private drawDebug(viewRect: Phaser.Geom.Rectangle): void {
    if (!this.debugGfx) this.debugGfx = this.scene.add.graphics()
    this.debugGfx.clear()
    // Draw viewport frame (yellow)
    this.debugGfx.lineStyle(1, 0xffd54f, 1)
    this.debugGfx.strokeRect(this.viewport.x, this.viewport.y, viewRect.width, viewRect.height)
    // Draw local content bounds (cyan)
    const b = this.getContentBoundsLocal()
    this.debugGfx.lineStyle(1, 0x00e5ff, 1)
    this.debugGfx.strokeRect(this.viewport.x + b.x, this.viewport.y + b.y, b.width, b.height)
    this.debugGfx.setDepth(10)
    // Attach to parent so it moves with bunkerArea
    this.parent.add(this.debugGfx)
  }

  public focusRoom(roomId: string): void {
    this.overview = false
    this.focusedRoomId = roomId
    this.animateTo(() => this.fitRoomInto(roomId, this.currentRect))
  }

  public setOverview(): void {
    this.overview = true
    this.focusedRoomId = undefined
    this.animateTo(() => this.fitAllInto(this.currentRect))
  }

  private animateTo(apply: () => void): void {
    const startScale = this.content.scaleX
    const startX = this.content.x
    const startY = this.content.y
    apply()
    const endScale = this.content.scaleX
    const endX = this.content.x
    const endY = this.content.y
    this.content.setScale(startScale)
    this.content.setPosition(startX, startY)
    this.scene.tweens.add({
      targets: this.content,
      scaleX: endScale,
      scaleY: endScale,
      x: endX,
      y: endY,
      duration: 400,
      ease: 'Sine.easeInOut'
    })
  }

  private enableInteractions(): void {
    this.viewport.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains)
    this.viewport.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isPanning = true
      ;(pointer as any)._dragged = false
      this.panStart = new Phaser.Math.Vector2(pointer.x, pointer.y)
      this.contentStart = new Phaser.Math.Vector2(this.content.x, this.content.y)
    })
    this.viewport.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!((pointer as any)._dragged)) {
        if (!this.overview && !this.focusedRoomId) this.setOverview()
      }
      this.isPanning = false
    })
    this.viewport.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPanning || !this.panStart || !this.contentStart) return
      const dx = pointer.x - this.panStart.x
      const dy = pointer.y - this.panStart.y
      if (Math.abs(dx) + Math.abs(dy) > 3) (pointer as any)._dragged = true
      this.content.setPosition(this.contentStart.x + dx, this.contentStart.y + dy)
    })
  }
}



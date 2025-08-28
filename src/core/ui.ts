import Phaser from 'phaser'
import { COLORS } from './constants'
import { THEME } from './theme'

export function createTextButton(
  scene: Phaser.Scene,
  label: string,
  x: number,
  y: number,
  onClick: () => void,
  width = 320,
  height = 56
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y)
  const bg = scene.add.rectangle(0, 0, width, height, COLORS.primary).setOrigin(0.5)
  const text = scene.add.text(0, 0, label, {
    fontFamily: THEME.fonts.body,
    fontSize: '16px',
    color: COLORS.text
  }).setOrigin(0.5)

  bg.setInteractive({ useHandCursor: true })
  bg.on('pointerover', () => bg.setFillStyle(COLORS.primaryHover))
  bg.on('pointerout', () => bg.setFillStyle(COLORS.primary))
  bg.on('pointerdown', () => onClick())

  container.add([bg, text])
  return container
}

export function createToggle(
  scene: Phaser.Scene,
  getLabel: () => string,
  x: number,
  y: number,
  onToggle: () => void
): Phaser.GameObjects.Text {
  const text = scene.add.text(x, y, getLabel(), {
    fontFamily: 'Arial, system-ui, sans-serif',
    fontSize: '18px',
    color: COLORS.muted
  })
  text.setInteractive({ useHandCursor: true })
  text.on('pointerdown', () => {
    onToggle()
    text.setText(getLabel())
  })
  return text
}

// Pixel panel container (emulates pixel-border box with inner padding)
export function createPixelPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 16
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)

  const outer = scene.add.rectangle(0, 0, width, height, 0x0f1012).setOrigin(0)
  outer.setStrokeStyle(4, 0x22252b)
  const mid = scene.add.rectangle(4, 4, width - 8, height - 8, 0x111214).setOrigin(0)
  mid.setStrokeStyle(4, 0x1a1d22)
  const inner = scene.add.rectangle(8, 8, width - 16, height - 16, 0x121418).setOrigin(0)
  inner.setStrokeStyle(2, 0x2a2d33)

  const topRed = scene.add.rectangle(8, 8, width - 16, 2, 0xb71c1c).setOrigin(0)
  const bottomRed = scene.add.rectangle(8, height - 10, width - 16, 2, 0xb71c1c).setOrigin(0)

  const content = scene.add.container(8 + padding, 8 + padding)
  content.name = 'content'

  root.add([outer, mid, inner, topRed, bottomRed, content])
  return root
}

export function getPanelContent(panel: Phaser.GameObjects.Container): Phaser.GameObjects.Container | undefined {
  return panel.list.find(g => g.name === 'content') as Phaser.GameObjects.Container | undefined
}

export function createRadiationBadge(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y)
  const ring = scene.add.circle(0, 0, 24, 0xffee58, 1)
  const inner = scene.add.circle(0, 0, 12, 0xffee58, 1)
  const core = scene.add.circle(0, 0, 6, 0x000000, 1)
  const spokes: Phaser.GameObjects.Rectangle[] = []
  for (let i = 0; i < 4; i++) {
    const r = scene.add.rectangle(0, 0, 2, 48, 0xffee58)
    r.setAngle(i * 45)
    spokes.push(r)
  }
  c.add([spokes[0], spokes[1], spokes[2], spokes[3], ring, inner, core])
  return c
}

export function createMenuButton(
  scene: Phaser.Scene,
  label: string,
  x: number,
  y: number,
  onClick: () => void,
  minWidth = 280,
  height = 40
): Phaser.GameObjects.Container {
  const group = scene.add.container(x, y)
  const leftBorder = scene.add.rectangle(0, 0, 4, height, 0x8b0000).setOrigin(0, 0.5)
  const bg = scene.add.rectangle(4, 0, minWidth, height, 0x1a1d22, 1).setOrigin(0, 0.5)
  bg.setStrokeStyle(1, 0x2a2d33)
  const caret = scene.add.text(14, 0, '>', { fontFamily: THEME.fonts.body, fontSize: '12px', color: '#00ff00' }).setOrigin(0, 0.5)
  const text = scene.add.text(34, 0, label, { fontFamily: THEME.fonts.body, fontSize: '14px', color: '#e0e0e0' }).setOrigin(0, 0.5)
  const hit = scene.add.rectangle(0, 0, Math.max(minWidth, text.width + 48), height, 0x000000, 0.001).setOrigin(0, 0.5)
  hit.setInteractive({ useHandCursor: true })
  hit.on('pointerover', () => {
    text.setColor('#ffffff')
    group.y -= 2
  })
  hit.on('pointerout', () => {
    text.setColor('#e0e0e0')
    group.y += 2
  })
  hit.on('pointerdown', onClick)
  group.add([bg, leftBorder, caret, text, hit])
  return group
}

export function createSovietTitle(
  scene: Phaser.Scene,
  title: string,
  x: number,
  y: number,
  fontSize = 48
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y)
  
  // Основной текст заголовка - используем шрифт "28 Days Later Cyr Regular"
  const mainText = scene.add.text(0, 0, title, {
    fontFamily: '"28 Days Later Cyr Regular", monospace',
    fontSize: `${fontSize}px`,
    color: COLORS.textAccent,
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5)
  
  // Тень текста
  const shadowText = scene.add.text(4, 4, title, {
    fontFamily: '"28 Days Later Cyr Regular", monospace',
    fontSize: `${fontSize}px`,
    color: '#000000'
  }).setOrigin(0.5)
  shadowText.setAlpha(0.7)
  
  // Декоративные линии под заголовком
  const lineLength = mainText.width + 40
  const topLine = scene.add.rectangle(0, fontSize/2 + 10, lineLength, 3, COLORS.panelBorder, 1).setOrigin(0.5)
  const bottomLine = scene.add.rectangle(0, fontSize/2 + 20, lineLength, 1, COLORS.panelBorder, 0.6).setOrigin(0.5)
  
  container.add([shadowText, mainText, topLine, bottomLine])
  return container
}

// Новые компоненты в советском стиле  
export function createSovietPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 20
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y)

  // Основной фон (темно-красный)
  const mainBg = scene.add.rectangle(0, 0, width, height, COLORS.bg, 0.95).setOrigin(0)
  
  // Золотая рамка
  const border = scene.add.rectangle(0, 0, width, height, COLORS.panelBorder, 0).setOrigin(0)
  border.setStrokeStyle(2, COLORS.panelBorder, 1)
  
  // Контейнер для контента
  const content = scene.add.container(padding, padding)
  content.name = 'content'

  root.add([mainBg, border, content])
  return root
}

export function createSovietButton(
  scene: Phaser.Scene,
  label: string,
  x: number,
  y: number,
  onClick: () => void,
  width = 300,
  height = 50
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y)
  
  // Фон кнопки (оранжевый)
  const bg = scene.add.rectangle(0, 0, width, height, COLORS.primary, 0.9).setOrigin(0.5)
  bg.setStrokeStyle(2, COLORS.panelBorder, 1)
  
  // Текст кнопки - возвращаем пиксельный шрифт
  const text = scene.add.text(0, 0, label, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '16px',
    color: COLORS.text,
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5)
  
  // Интерактивность
  bg.setInteractive({ useHandCursor: true })
  bg.on('pointerover', () => {
    bg.setFillStyle(COLORS.primaryHover, 0.9)
    text.setColor(COLORS.textAccent)
    container.y -= 2
  })
  bg.on('pointerout', () => {
    bg.setFillStyle(COLORS.primary, 0.9)
    text.setColor(COLORS.text)
    container.y += 2
  })
  bg.on('pointerdown', onClick)
  
  container.add([bg, text])
  return container
}



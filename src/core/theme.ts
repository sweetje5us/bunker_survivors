export const THEME = {
  fonts: {
    heading: '"Press Start 2P", system-ui, sans-serif',
    body: '"Press Start 2P", system-ui, sans-serif'
  },
  colors: {
    bg: '#0b0c0e',
    panel: 0x111214,
    panelHex: '#111214',
    border: 0x2a2d33,
    text: '#e0e0e0',
    textMuted: '#9ea7b3',
    accentRed: '#b71c1c',
    accentGreen: '#8bc34a',
    accentYellow: '#ffca28'
  }
}

export function applyPanelBackground(scene: Phaser.Scene, rect: Phaser.Geom.Rectangle, container: Phaser.GameObjects.Container): void {
  const existing = container.list.find(g => g.name === 'panelBg') as Phaser.GameObjects.Rectangle | undefined
  if (existing) existing.destroy()
  const bg = scene.add.rectangle(0, 0, rect.width, rect.height, 0x121418, 0.92).setOrigin(0)
  bg.setStrokeStyle(2, 0x2a2d33)
  bg.name = 'panelBg'
  container.addAt(bg, 0)
}

// Responsive helpers
const BASE_W = 1280
const BASE_H = 720

export function uiScale(scene: Phaser.Scene): number {
  const { width, height } = scene.scale
  const s = Math.min(width / BASE_W, height / BASE_H)
  return Math.max(0.6, Math.min(1.6, s))
}

export function fs(scene: Phaser.Scene, basePx: number): string {
  return Math.round(basePx * uiScale(scene)) + 'px'
}




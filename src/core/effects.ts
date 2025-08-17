import Phaser from 'phaser'

export function addScanlines(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  const key = 'scanline-texture'
  if (!scene.textures.exists(key)) {
    const cvs = scene.textures.createCanvas(key, 2, 2) as Phaser.Textures.CanvasTexture | null
    if (cvs) {
      const ctx = cvs.getContext()
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(0, 0, 2, 1)
      ctx.clearRect(0, 1, 2, 1)
      cvs.refresh()
    }
  }
  const scan = scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, key).setOrigin(0)
  scan.setScrollFactor(0, 0)
  scan.setDepth(1000)
  scene.tweens.add({
    targets: scan,
    tilePositionY: scene.scale.height,
    duration: 8000,
    repeat: -1,
    ease: 'Linear',
  })
  scene.scale.on('resize', (size: Phaser.Structs.Size) => {
    scan.setSize(size.width, size.height)
  })
  return scan
}

export function addEmergencyLights(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0)
  const light1 = scene.add.ellipse(24, 24, 64, 64, 0xb71c1c, 0.22)
  const light2 = scene.add.ellipse(scene.scale.width - 24, scene.scale.height - 24, 64, 64, 0xb71c1c, 0.22)
  light1.setBlendMode(Phaser.BlendModes.ADD)
  light2.setBlendMode(Phaser.BlendModes.ADD)
  container.add([light1, light2])
  scene.tweens.add({ targets: [light1, light2], alpha: 0.08, yoyo: true, duration: 1200, repeat: -1, ease: 'Sine.easeInOut' })
  scene.scale.on('resize', (size: Phaser.Structs.Size) => {
    light2.setPosition(size.width - 24, size.height - 24)
  })
  container.setDepth(900)
  return container
}

export function addGlitchTitle(
  scene: Phaser.Scene,
  title: string,
  x: number,
  y: number,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Container {
  const group = scene.add.container(x, y)
  const base = scene.add.text(0, 0, title, style).setOrigin(0.5)
  const cyan = scene.add.text(0, 0, title, { ...style, color: '#00ffff' }).setOrigin(0.5).setAlpha(0.8)
  const magenta = scene.add.text(0, 0, title, { ...style, color: '#ff00ff' }).setOrigin(0.5).setAlpha(0.8)
  cyan.setPosition(base.x - 1, base.y + 1)
  magenta.setPosition(base.x + 1, base.y - 1)
  group.add([cyan, magenta, base])
  scene.time.addEvent({
    delay: 2300,
    loop: true,
    callback: () => {
      const dx1 = Phaser.Math.Between(-2, 2)
      const dy1 = Phaser.Math.Between(-2, 2)
      const dx2 = Phaser.Math.Between(-2, 2)
      const dy2 = Phaser.Math.Between(-2, 2)
      cyan.setPosition(dx1, dy1)
      magenta.setPosition(dx2, dy2)
      scene.time.delayedCall(120, () => {
        cyan.setPosition(0, 0)
        magenta.setPosition(0, 0)
      })
    }
  })
  return group
}



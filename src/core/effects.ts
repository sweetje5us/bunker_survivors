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

// Новые эффекты для советского стиля
export function addSovietBackground(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0)
  
  // Градиентный фон от темно-красного к черному
  const bg = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x8B0000, 1).setOrigin(0)
  
  // Добавляем текстуру "глитчей" и повреждений
  const glitchTexture = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0).setOrigin(0)
  glitchTexture.setStrokeStyle(1, 0xFFD700, 0.1)
  
  // Создаем случайные "глитчи" по экрану (уменьшаем количество)
  for (let i = 0; i < 8; i++) {
    const x = Phaser.Math.Between(0, scene.scale.width)
    const y = Phaser.Math.Between(0, scene.scale.height)
    const width = Phaser.Math.Between(20, 80)
    const height = Phaser.Math.Between(2, 6)
    
    const glitch = scene.add.rectangle(x, y, width, height, 0xFFD700, 0.1).setOrigin(0)
    glitch.setStrokeStyle(1, 0xFFD700, 0.3)
    
    // Анимация мерцания глитчей
    scene.tweens.add({
      targets: glitch,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: Phaser.Math.Between(1500, 4000),
      delay: Phaser.Math.Between(0, 3000)
    })
    
    container.add(glitch)
  }
  
  container.add([bg, glitchTexture])
  container.setDepth(0)
  return container
}

export function addSovietDecorations(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0)
  
  // Добавляем только основные декоративные элементы
  const decorations = [
    { symbol: '☭', x: 60, y: 60, size: 28, color: 0xFFD700 },
    { symbol: '★', x: scene.scale.width - 60, y: 60, size: 20, color: 0xFFD700 }
  ]
  
  decorations.forEach(dec => {
    const decoration = scene.add.text(dec.x, dec.y, dec.symbol, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${dec.size}px`,
      color: `#${dec.color.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5)
    
    // Добавляем легкую анимацию вращения
    scene.tweens.add({
      targets: decoration,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: 'Linear'
    })
    
    container.add(decoration)
  })
  
  container.setDepth(100)
  return container
}

export function addSovietScanlines(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  const key = 'soviet-scanline-texture'
  if (!scene.textures.exists(key)) {
    const cvs = scene.textures.createCanvas(key, 2, 4) as Phaser.Textures.CanvasTexture | null
    if (cvs) {
      const ctx = cvs.getContext()
      // Создаем более тонкие и стилизованные линии
      ctx.fillStyle = 'rgba(255, 215, 0, 0.06)' // Золотые линии (более прозрачные)
      ctx.fillRect(0, 0, 2, 1)
      ctx.clearRect(0, 1, 2, 3)
      cvs.refresh()
    }
  }
  
  const scanlines = scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, key).setOrigin(0)
  scanlines.setScrollFactor(0, 0)
  scanlines.setDepth(200)
  
  // Более медленное движение линий
  scene.tweens.add({
    targets: scanlines,
    tilePositionY: scene.scale.height,
    duration: 15000,
    repeat: -1,
    ease: 'Linear',
  })
  
  scene.scale.on('resize', (size: Phaser.Structs.Size) => {
    scanlines.setSize(size.width, size.height)
  })
  
  return scanlines
}



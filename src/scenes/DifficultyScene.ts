import Phaser from 'phaser'
import { t } from '../core/i18n'

export type Difficulty = 'easy' | 'normal' | 'hard'

export class DifficultyScene extends Phaser.Scene {
  private titleContainer?: Phaser.GameObjects.Container
  private particles: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('Difficulty')
  }

  create(): void {
    const { width, height } = this.scale

    // Создаем анимированный фон
    this.createAnimatedBackground()
    
    // Добавляем scanlines
    this.createScanlines()
    
    // Добавляем шум
    this.createNoise()
    
    // Создаем частицы
    this.createParticles()
    
    // Создаем барьерную ленту
    this.createWarningTape()
    
    // Создаем заголовок
    this.createTitle()
    
    // Создаем кнопки сложности
    this.createDifficultyButtons()
    
    // Создаем кнопку возврата
    this.createBackButton()
  }

  private createAnimatedBackground(): void {
    const { width, height } = this.scale
    
    // Градиентный фон
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x000000, 0x000000, 0x8b0000, 0x8b0000, 0.1)
    bg.fillRect(0, 0, width, height)
    
    // Радиальные градиенты
    const radial1 = this.add.graphics()
    radial1.fillStyle(0x8b0000, 0.1)
    radial1.fillCircle(width * 0.2, height * 0.3, 200)
    
    const radial2 = this.add.graphics()
    radial2.fillStyle(0x8b0000, 0.1)
    radial2.fillCircle(width * 0.8, height * 0.7, 200)
  }

  private createScanlines(): void {
    const { width, height } = this.scale
    const scanlines = this.add.graphics()
    
    // Создаем scanlines
    for (let y = 0; y < height; y += 4) {
      scanlines.lineStyle(1, 0x00ff00, 0.03)
      scanlines.beginPath()
      scanlines.moveTo(0, y)
      scanlines.lineTo(width, y)
      scanlines.strokePath()
    }
    
    // Анимация scanlines
    this.tweens.add({
      targets: scanlines,
      y: height,
      duration: 900,
      repeat: -1,
      ease: 'Linear'
    })
  }

  private createNoise(): void {
    const { width, height } = this.scale
    const noise = this.add.graphics()
    
    // Создаем случайные точки для эффекта шума
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const alpha = Math.random() * 0.02
      
      noise.fillStyle(0xffffff, alpha)
      noise.fillRect(x, y, 1, 1)
    }
  }

  private createParticles(): void {
    const { width, height } = this.scale
    
    for (let i = 0; i < 20; i++) {
      const particle = this.add.rectangle(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 4 + 1,
        Math.random() * 4 + 1,
        0xff0000,
        0.3
      )
      
      this.particles.push(particle)
      
      // Анимация частиц
      this.tweens.add({
        targets: particle,
        y: -50,
        x: particle.x + Math.random() * 100,
        alpha: 0,
        duration: Math.random() * 4000 + 4000,
        delay: Math.random() * 6000,
        repeat: -1,
        ease: 'Linear'
      })
    }
  }

  private createWarningTape(): void {
    const { width, height } = this.scale
    const tape = this.add.graphics()
    
    // Создаем барьерную ленту
    for (let x = 0; x < width; x += 40) {
      tape.fillStyle(0xff0000, 0.6)
      tape.fillRect(x, height / 2 - 1, 20, 2)
      tape.fillStyle(0x000000, 0.6)
      tape.fillRect(x + 20, height / 2 - 1, 20, 2)
    }
  }

  private createTitle(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const titleY = height * 0.15
    
    this.titleContainer = this.add.container(centerX, titleY)
    
    // Основной заголовок "ВЫБОР СЛОЖНОСТИ"
    const mainTitle = this.add.text(0, 0, 'ВЫБОР СЛОЖНОСТИ', {
      fontFamily: '"28 Days Later Cyr Regular", monospace',
      fontSize: '40px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    this.titleContainer.add(mainTitle)
    
    // Анимация свечения для заголовка
    this.tweens.add({
      targets: mainTitle,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createDifficultyButtons(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const buttonStartY = height * 0.35
    const buttonSpacing = 80
    
    const difficulties = [
      { text: 'ЛЕГКИЙ', difficulty: 'easy', color: 0x00ff00 },
      { text: 'НОРМАЛЬНЫЙ', difficulty: 'normal', color: 0xffcc00 },
      { text: 'СЛОЖНЫЙ', difficulty: 'hard', color: 0xff0000 }
    ]
    
    difficulties.forEach((diff, index) => {
      const buttonContainer = this.createDifficultyButton(
        centerX,
        buttonStartY + index * buttonSpacing,
        diff.text,
        diff.difficulty as Difficulty,
        diff.color
      )
      
      // Анимация появления кнопки
      buttonContainer.setAlpha(0)
      buttonContainer.y -= 50
      
      this.tweens.add({
        targets: buttonContainer,
        alpha: 1,
        y: buttonContainer.y + 50,
        duration: 800,
        delay: index * 200,
        ease: 'Power2'
      })
    })
  }

  private createDifficultyButton(x: number, y: number, text: string, difficulty: Difficulty, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    // Фон кнопки
    const bg = this.add.rectangle(0, 0, 450, 60, 0x2a0a0a, 1)
    bg.setStrokeStyle(3, color)
    
    // Текст кнопки
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffcc00'
    }).setOrigin(0.5)
    
    // Иконка стрелки
    const arrow = this.add.text(-180, 0, '⏵', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffcc00'
    }).setOrigin(0.5)
    arrow.setAlpha(0)
    
    container.add([bg, buttonText, arrow])
    
    // Интерактивность
    bg.setInteractive({ useHandCursor: true })
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x3a1a1a)
      bg.setStrokeStyle(3, 0xffcc00)
      buttonText.setColor('#ffffff')
      arrow.setAlpha(1)
      container.y -= 2
    })
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a0a0a)
      bg.setStrokeStyle(3, color)
      buttonText.setColor('#ffcc00')
      arrow.setAlpha(0)
      container.y += 2
    })
    
    bg.on('pointerdown', () => this.startGame(difficulty))
    
    return container
  }

  private createBackButton(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const buttonY = height * 0.8
    
    const buttonContainer = this.createMenuButton(
      centerX,
      buttonY,
      'ВЕРНУТЬСЯ В ГЛАВНОЕ МЕНЮ',
      () => this.scene.start('MainMenu')
    )
    
    // Анимация появления кнопки
    buttonContainer.setAlpha(0)
    buttonContainer.y -= 50
    
    this.tweens.add({
      targets: buttonContainer,
      alpha: 1,
      y: buttonContainer.y + 50,
      duration: 800,
      delay: 1000,
      ease: 'Power2'
    })
  }

  private createMenuButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    // Фон кнопки
    const bg = this.add.rectangle(0, 0, 500, 60, 0x2a0a0a, 1)
    bg.setStrokeStyle(3, 0x8b0000)
    
    // Текст кнопки
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffcc00'
    }).setOrigin(0.5)
    
    // Иконка стрелки
    const arrow = this.add.text(-200, 0, '⏵', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffcc00'
    }).setOrigin(0.5)
    arrow.setAlpha(0)
    
    container.add([bg, buttonText, arrow])
    
    // Интерактивность
    bg.setInteractive({ useHandCursor: true })
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x3a1a1a)
      bg.setStrokeStyle(3, 0xffcc00)
      buttonText.setColor('#ffffff')
      arrow.setAlpha(1)
      container.y -= 2
    })
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a0a0a)
      bg.setStrokeStyle(3, 0x8b0000)
      buttonText.setColor('#ffcc00')
      arrow.setAlpha(0)
      container.y += 2
    })
    
    bg.on('pointerdown', onClick)
    
    return container
  }

  private startGame(level: Difficulty): void {
    this.scene.start('Game', { difficulty: level })
  }
}



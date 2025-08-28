import Phaser from 'phaser'
import { t, getLanguage, toggleLanguage } from '../core/i18n'
import { onResize, isPortrait } from '../core/responsive'

export class MainMenuScene extends Phaser.Scene {
  private titleContainer?: Phaser.GameObjects.Container
  private warningSign?: Phaser.GameObjects.Container
  private particles: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('MainMenu')
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
    
    // Создаем заголовок игры
    this.createGameTitle()
    
    // Создаем предупреждающий знак
    this.createWarningSign()
    
    // Создаем навигационное меню
    this.createNavigationMenu()

    // Обработчик ресайза
    this.scale.on('resize', this.handleResize, this)
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
    
    for (let i = 0; i < 30; i++) {
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

  private createGameTitle(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const titleY = height * 0.2
    
    this.titleContainer = this.add.container(centerX, titleY)
    
    // Основной заголовок "ВХОД ВОСПРЕЩЕН"
    const mainTitle = this.add.text(0, 0, 'ВХОД ВОСПРЕЩЕН', {
      fontFamily: '"28 Days Later Cyr Regular", monospace',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    // Подзаголовок "NO ENTRY"
    const subTitle = this.add.text(0, 80, 'NO ENTRY', {
      fontFamily: '"28 Days Later Cyr Regular", monospace',
      fontSize: '32px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)
    
    this.titleContainer.add([mainTitle, subTitle])
    
    // Анимация свечения для основного заголовка
    this.tweens.add({
      targets: mainTitle,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Анимация свечения для подзаголовка
    this.tweens.add({
      targets: subTitle,
      alpha: 0.7,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createWarningSign(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const warningY = height * 0.4
    
    this.warningSign = this.add.container(centerX, warningY)
    
    // Фон предупреждения
    const warningBg = this.add.rectangle(0, 0, 600, 60, 0x8b0000, 0.2)
    warningBg.setStrokeStyle(2, 0xff0000)
    
    // Текст предупреждения
    const warningText = this.add.text(0, 0, 'DANGER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ff6666'
    }).setOrigin(0.5)
    
    this.warningSign.add([warningBg, warningText])
    
    // Анимация мигания
    this.tweens.add({
      targets: this.warningSign,
      alpha: 0.3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    })
  }

  private createNavigationMenu(): void {
    const { width, height } = this.scale
    const centerX = width / 2
    const menuStartY = height * 0.55
    const buttonSpacing = 80
    
    const buttons = [
      { text: 'НАЧАТЬ ОБОРОНУ', action: () => this.scene.start('Difficulty') },
      { text: 'КОНФИГУРАЦИЯ', action: () => this.scene.start('Settings') },
      { text: 'ИНФОРМАЦИЯ', action: () => this.scene.start('About') },
      { text: 'ПОКИНУТЬ ПОСТ', action: () => this.quitGame() }
    ]
    
    buttons.forEach((button, index) => {
      const buttonContainer = this.createMenuButton(
        centerX,
        menuStartY + index * buttonSpacing,
        button.text,
        button.action
      )
      
      if (buttonContainer) {
        // Анимация появления кнопки
        buttonContainer.setAlpha(0)
        const originalY = buttonContainer.y
        buttonContainer.y -= 50
        
        this.tweens.add({
          targets: buttonContainer,
          alpha: 1,
          y: originalY,
          duration: 800,
          delay: index * 200,
          ease: 'Power2'
        })
      }
    })
  }

  private createMenuButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    // Фон кнопки
    const bg = this.add.rectangle(0, 0, 400, 60, 0x2a0a0a, 1)
    bg.setStrokeStyle(3, 0x8b0000)
    
    // Текст кнопки
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffcc00'
    }).setOrigin(0.5)
    
    // Иконка стрелки
    const arrow = this.add.text(-150, 0, '⏵', {
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

  private quitGame(): void {
    // Здесь можно добавить логику выхода из игры
    console.log('Выход из игры')
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    // Обновление позиций при ресайзе
    if (this.titleContainer) {
      this.titleContainer.setPosition(gameSize.width / 2, gameSize.height * 0.2)
    }
    
    if (this.warningSign) {
      this.warningSign.setPosition(gameSize.width / 2, gameSize.height * 0.4)
    }
  }

  updateTexts = (): void => {
    // Обновление текстов при смене языка
    // В данном случае тексты статичные, но можно добавить локализацию
  }
}



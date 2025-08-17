import Phaser from 'phaser'

export type ParallaxPhase = 'day' | 'night'

export class ParallaxBackground {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private dayGroup: Phaser.GameObjects.Container
  private nightGroup: Phaser.GameObjects.Container
  private numLayers: number
  private currentPhase: ParallaxPhase

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, rect: Phaser.Geom.Rectangle, numLayers = 5, initialPhase: ParallaxPhase = 'day') {
    this.scene = scene
    this.container = parent
    this.numLayers = numLayers
    this.currentPhase = initialPhase

    this.dayGroup = scene.add.container(0, 0)
    this.nightGroup = scene.add.container(0, 0)
    this.container.add([this.dayGroup, this.nightGroup])
    this.dayGroup.setDepth(-1)
    this.nightGroup.setDepth(-1)

    this.buildLayers(this.dayGroup, 'bg_day_', rect)
    this.buildLayers(this.nightGroup, 'bg_night_', rect)

    this.dayGroup.setAlpha(initialPhase === 'day' ? 1 : 0)
    this.nightGroup.setAlpha(initialPhase === 'night' ? 1 : 0)
  }

  private buildLayers(group: Phaser.GameObjects.Container, keyPrefix: string, rect: Phaser.Geom.Rectangle): void {
    // Do not destroy existing images to preserve references during phase switches
    // Only (re)create if group is empty
    if (group.length > 0) {
      this.layout(rect)
      return
    }
    for (let i = 1; i <= this.numLayers; i++) {
      const key = `${keyPrefix}${i}`
      const img = this.scene.add.image(0, 0, key).setOrigin(0.5, 1)
      group.add(img)
    }
    this.layout(rect)
  }

  public layout(rect: Phaser.Geom.Rectangle): void {
    const layoutGroup = (group: Phaser.GameObjects.Container) => {
      const children = group.list as Phaser.GameObjects.Image[]
      children.forEach((img, idx) => {
        const texture = this.scene.textures.get(img.texture.key).getSourceImage() as HTMLImageElement
        const scaleX = rect.width / texture.width
        const scaleY = rect.height / texture.height
        const scale = Math.max(scaleX, scaleY)
        img.setScale(scale)
        img.setPosition(rect.width / 2, rect.height)
        img.setAlpha(0.8 - idx * 0.1)
      })
    }
    layoutGroup(this.dayGroup)
    layoutGroup(this.nightGroup)
  }

  public setPhase(phase: ParallaxPhase, animate = true): void {
    if (this.currentPhase === phase) return
    this.currentPhase = phase
    const toNight = phase === 'night'
    // Ensure groups are visible before tween
    this.dayGroup.setVisible(true)
    this.nightGroup.setVisible(true)
    if (animate) {
      this.scene.tweens.add({ targets: this.dayGroup, alpha: toNight ? 0 : 1, duration: 1500, ease: 'Sine.easeInOut' })
      this.scene.tweens.add({ targets: this.nightGroup, alpha: toNight ? 1 : 0, duration: 1500, ease: 'Sine.easeInOut' })
    } else {
      this.dayGroup.setAlpha(toNight ? 0 : 1)
      this.nightGroup.setAlpha(toNight ? 1 : 0)
    }
    this.scene.time.delayedCall(1600, () => {
      this.dayGroup.setVisible(!toNight)
      this.nightGroup.setVisible(toNight)
    })
  }
}



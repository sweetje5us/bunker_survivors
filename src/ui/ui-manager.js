/**
 * Game UI Manager - manages HTML overlay for game UI
 */
class GameUIManager {
    constructor() {
        this.overlay = null;
        this.isInitialized = false;
        this.updateInterval = null;
        this.previousPopulation = 0; // Для отслеживания изменений населения
        this.gameData = {
            day: 1,
            phase: 'day',
            time: '06:00',
            population: 0,
            capacity: 0,
            happiness: 50,
            defense: 50,
            ammo: 100,
            comfort: 100,
            moral: 50,
            food: 100,
            water: 100,
            money: 200,
            wood: 50,
            metal: 25,
            coal: 10,
            nails: 20,
            paper: 15,
            glass: 5,
            enemies: 0,
            bunkerLevel: 1,
            bunkerExperience: 0,
            maxExperience: 100
        };
    }

    /**
     * Initialize the UI overlay
     */
    async init() {
        if (this.isInitialized) return;

            try {
      // Check if overlay container already exists
      let overlayContainer = document.getElementById('game-ui-overlay');

      if (!overlayContainer) {
        // Create container for overlay if it doesn't exist
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'game-ui-overlay';
        overlayContainer.style.position = 'fixed';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = 'auto';
        overlayContainer.style.zIndex = '10000';
        overlayContainer.style.pointerEvents = 'none';
        document.body.appendChild(overlayContainer);
      }

      // Load the HTML overlay content
      const response = await fetch('./src/ui/game-overlay.html');
      const html = await response.text();

      overlayContainer.innerHTML = html;
      this.overlay = overlayContainer;

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      this.isInitialized = true;
      console.log('[GameUIManager] UI overlay initialized successfully');

      // Start periodic updates
      this.startUpdates();

    } catch (error) {
      console.error('[GameUIManager] Failed to initialize UI overlay:', error);
    }
    }

    /**
     * Start periodic UI updates
     */
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 100); // Update every 100ms
    }

    /**
     * Stop periodic UI updates
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update UI with current game data
     */
    updateUI() {
        if (!this.isInitialized || !this.overlay) return;

        try {
            // Update game time
            const timeElement = this.overlay.querySelector('#game-time');
            if (timeElement) {
                timeElement.textContent = `Day ${this.gameData.day} • ${this.gameData.phase === 'day' ? 'Day Phase' : 'Night Phase'} • ${this.gameData.time}`;
            }

            // Update resources
            const resources = ['population', 'enemies', 'happiness', 'defense', 'ammo', 'comfort', 'moral', 'food', 'water', 'money', 'wood', 'metal', 'coal', 'nails', 'paper', 'glass'];
            resources.forEach(resource => {
                const element = this.overlay.querySelector(`#${resource}`);
                if (element) {
                    const value = this.gameData[resource];
                    switch (resource) {
                        case 'population':
                            this.updatePopulationDisplay(value, this.gameData.capacity);
                            break;
                        case 'happiness':
                        case 'defense':
                        case 'comfort':
                        case 'moral':
                        case 'enemies':
                        case 'food':
                        case 'water':
                        case 'money':
                        case 'wood':
                        case 'metal':
                        case 'coal':
                        case 'nails':
                        case 'paper':
                        case 'glass':
                            // Для ресурсов с иконками сохраняем HTML структуру
                            const existingIcon = element.querySelector('.resource-icon');
                            if (existingIcon) {
                                element.innerHTML = `${existingIcon.outerHTML} ${value}${resource === 'happiness' || resource === 'defense' || resource === 'comfort' || resource === 'moral' ? '%' : ''}`;
                            } else {
                                element.innerHTML = `${this.getResourceIcon(resource)} ${value}${resource === 'happiness' || resource === 'defense' || resource === 'comfort' || resource === 'moral' ? '%' : ''}`;
                            }
                            break;
                        default:
                            element.innerHTML = `${this.getResourceIcon(resource)} ${value}`;
                    }
                }
            });

            // Update experience
            const levelElement = this.overlay.querySelector('#level');
            if (levelElement) {
                levelElement.textContent = `Bunker Level: ${this.gameData.bunkerLevel}`;
            }

            const xpElement = this.overlay.querySelector('#xp');
            if (xpElement) {
                xpElement.textContent = `XP: ${this.gameData.bunkerExperience}/${this.gameData.maxExperience}`;
            }

            const xpFill = this.overlay.querySelector('#xp-fill');
            if (xpFill) {
                const progress = this.gameData.maxExperience > 0 ?
                    (this.gameData.bunkerExperience / this.gameData.maxExperience) * 100 : 0;
                xpFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
            }

        } catch (error) {
            console.error('[GameUIManager] Error updating UI:', error);
        }
    }

    /**
     * Update game data from Phaser
     */
    updateGameData(data) {
        this.gameData = { ...this.gameData, ...data };
        this.updateUI();
    }

    /**
     * Change moral value
     */
    changeMoral(delta) {
        const oldMoral = this.gameData.moral;
        this.gameData.moral = Math.max(0, Math.min(100, oldMoral + delta));
        console.log(`[GameUIManager] Moral changed: ${oldMoral}% → ${this.gameData.moral}% (delta: ${delta > 0 ? '+' : ''}${delta}%)`);
        console.log(`[GameUIManager] Stack trace:`, new Error().stack);

        // Update UI immediately
        this.updateUI();

        return this.gameData.moral;
    }

    /**
     * Get current moral value
     */
    getMoral() {
        return this.gameData.moral;
    }

    /**
     * Get resource icon
     */
    getResourceIcon(resource) {
        const icons = {
            happiness: `<img src="src/sprites/resources/happiness.png" alt="Счастье" class="resource-icon">`,
            defense: `<img src="src/sprites/resources/defence.png" alt="Защита" class="resource-icon">`,
            ammo: `<img src="src/sprites/resources/ammo.png" alt="Патроны" class="resource-icon">`,
            comfort: `<img src="src/sprites/resources/comfort.png" alt="Комфорт" class="resource-icon">`,
            moral: `<img src="src/sprites/resources/moral.png" alt="Мораль" class="resource-icon">`,
            food: `<img src="src/sprites/resources/food.png" alt="Еда" class="resource-icon">`,
            water: `<img src="src/sprites/resources/water.png" alt="Вода" class="resource-icon">`,
            money: `<img src="src/sprites/resources/money.png" alt="Деньги" class="resource-icon">`,
            wood: `<img src="src/sprites/resources/wood.png" alt="Дерево" class="resource-icon">`,
            metal: `<img src="src/sprites/resources/metal.png" alt="Металл" class="resource-icon">`,
            coal: `<img src="src/sprites/resources/coal.png" alt="Уголь" class="resource-icon">`,
            nails: `<img src="src/sprites/resources/nails.png" alt="Гвозди" class="resource-icon">`,
            paper: `<img src="src/sprites/resources/paper.png" alt="Бумага" class="resource-icon">`,
            glass: `<img src="src/sprites/resources/glass.png" alt="Стекло" class="resource-icon">`,
            enemies: `<img src="src/sprites/resources/enemies.png" alt="Враги" class="resource-icon">`
        };
        return icons[resource] || '';
    }

    /**
     * Update population display with animation
     */
    updatePopulationDisplay(population, capacity) {
        const skullElement = this.overlay.querySelector('#population-skull');
        const countElement = this.overlay.querySelector('#population-count');

        if (!skullElement || !countElement) return;

        // Обновляем текст количества людей
        countElement.textContent = `${population}/${capacity}`;

        // Определяем статус населения
        const wasAlive = this.previousPopulation > 0;
        const isAlive = population > 0;

        // Всегда устанавливаем финальный кадр (для начальной загрузки или если статус не изменился)
        this.setPopulationSkullFrame(isAlive ? 'alive' : 'dead');

        // Если статус изменился, запускаем анимацию
        if (wasAlive !== isAlive) {
            if (wasAlive && !isAlive) {
                // Люди умерли - анимация умирания
                this.animatePopulationSkull('dying');
            } else if (!wasAlive && isAlive) {
                // Люди оживили - анимация оживления
                this.animatePopulationSkull('reviving');
            }
        }

        // Обновляем previousPopulation
        this.previousPopulation = population;
    }

    /**
     * Animate population skull
     */
    animatePopulationSkull(animationType) {
        const skullElement = this.overlay.querySelector('#population-skull');
        if (!skullElement) return;

        // Убираем предыдущие классы анимации
        skullElement.classList.remove('skull-dying', 'skull-reviving');

        // Добавляем новый класс анимации
        const animationClass = animationType === 'dying' ? 'skull-dying' : 'skull-reviving';
        skullElement.classList.add(animationClass);

        // После завершения анимации устанавливаем финальный кадр
        setTimeout(() => {
            skullElement.classList.remove(animationClass);
            this.setPopulationSkullFrame(animationType === 'dying' ? 'dead' : 'alive');
        }, 1000);
    }

    /**
     * Set population skull frame
     */
    setPopulationSkullFrame(state) {
        const skullElement = this.overlay.querySelector('#population-skull');
        if (!skullElement) return;

        const frameSrc = state === 'alive'
            ? 'src/sprites/resources/people/skull001.png'
            : 'src/sprites/resources/people/skull007.png';

        skullElement.style.backgroundImage = `url('${frameSrc}')`;
    }

    /**
     * Show/hide UI
     */
    setVisible(visible) {
        if (!this.overlay) return;

        if (visible) {
            this.overlay.style.display = 'block';
        } else {
            this.overlay.style.display = 'none';
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        if (!this.overlay) return;

        const header = this.overlay.querySelector('#game-header');
        if (header) {
            if (loading) {
                header.classList.add('loading');
            } else {
                header.classList.remove('loading');
            }
        }
    }

    /**
     * Handle window resize
     */
    onResize() {
        // UI is responsive with CSS, but we can add additional logic here if needed
        this.updateUI();
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopUpdates();

        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        this.overlay = null;
        this.isInitialized = false;
        console.log('[GameUIManager] UI overlay destroyed');
    }
}

// Global instance
let gameUIManager = null;

/**
 * Initialize game UI
 */
function initGameUI() {
    if (!gameUIManager) {
        gameUIManager = new GameUIManager();
        gameUIManager.init().catch(error => {
            console.error('[GameUIManager] Failed to initialize:', error);
        });
    }
    return gameUIManager;
}

/**
 * Get game UI manager instance
 */
function getGameUIManager() {
    return gameUIManager;
}

/**
 * Update game UI data
 */
function updateGameUI(data) {
    if (gameUIManager) {
        gameUIManager.updateGameData(data);
    }
}

/**
 * Show/hide game UI
 */
function showGameUI(visible) {
    if (gameUIManager) {
        gameUIManager.setVisible(visible);
    }
}

/**
 * Set game UI loading state
 */
function setGameUILoading(loading) {
    if (gameUIManager) {
        gameUIManager.setLoading(loading);
    }
}

/**
 * Change moral value
 */
function changeMoral(delta) {
    if (gameUIManager) {
        return gameUIManager.changeMoral(delta);
    }
    return 50; // default value
}

/**
 * Get current moral value
 */
function getMoral() {
    if (gameUIManager) {
        return gameUIManager.getMoral();
    }
    return 50; // default value
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Make functions globally available
        window.initGameUI = initGameUI;
        window.getGameUIManager = getGameUIManager;
        window.updateGameUI = updateGameUI;
        window.showGameUI = showGameUI;
        window.setGameUILoading = setGameUILoading;
        window.changeMoral = changeMoral;
        window.getMoral = getMoral;
    });
}

export { GameUIManager, initGameUI, getGameUIManager, updateGameUI, showGameUI, setGameUILoading };

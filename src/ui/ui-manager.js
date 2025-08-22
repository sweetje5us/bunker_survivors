/**
 * Game UI Manager - manages HTML overlay for game UI
 */
class GameUIManager {
    constructor() {
        this.overlay = null;
        this.isInitialized = false;
        this.updateInterval = null;
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
            food: 100,
            water: 100,
            money: 200,
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
            const resources = ['population', 'happiness', 'defense', 'ammo', 'comfort', 'food', 'water', 'money', 'enemies'];
            resources.forEach(resource => {
                const element = this.overlay.querySelector(`#${resource}`);
                if (element) {
                    const value = this.gameData[resource];
                    switch (resource) {
                        case 'population':
                            element.textContent = `👥 ${value}/${this.gameData.capacity}`;
                            break;
                        case 'happiness':
                        case 'defense':
                        case 'comfort':
                            element.textContent = `${this.getResourceIcon(resource)} ${value}%`;
                            break;
                        case 'enemies':
                            element.textContent = `👹 ${value}`;
                            break;
                        default:
                            element.textContent = `${this.getResourceIcon(resource)} ${value}`;
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
     * Get resource icon
     */
    getResourceIcon(resource) {
        const icons = {
            happiness: '😊',
            defense: '🛡️',
            ammo: '🔫',
            comfort: '🛋️',
            food: '🍖',
            water: '💧',
            money: '💰'
        };
        return icons[resource] || '';
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

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Make functions globally available
        window.initGameUI = initGameUI;
        window.getGameUIManager = getGameUIManager;
        window.updateGameUI = updateGameUI;
        window.showGameUI = showGameUI;
        window.setGameUILoading = setGameUILoading;
    });
}

export { GameUIManager, initGameUI, getGameUIManager, updateGameUI, showGameUI, setGameUILoading };

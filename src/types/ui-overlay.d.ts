/**
 * Type definitions for HTML UI Overlay
 */

declare global {
  interface Window {
    // UI Manager functions
    initGameUI?: () => any;
    getGameUIManager?: () => any;
    updateGameUI?: (data: any) => void;
    showGameUI?: (visible: boolean) => void;
    setGameUILoading?: (loading: boolean) => void;

    // Modal functions
    openInventory?: () => void;
    openAbilities?: () => void;
    openRoomSelection?: () => void;
    togglePause?: () => void;
    openResidents?: () => void;
    openResource?: (resource: string) => void;
    openEnemies?: () => void;

    // Modal management
    closeModal?: (modalId: string) => void;
    openModal?: (modalId: string) => void;

    // Resource click handler
    handleResourceClick?: (resourceType: string) => void;

    // Modal population functions
    populatePopulationModal?: (residents: any[]) => void;
    populateResourceModal?: (resourceType: string, data: any) => void;
    populateInventoryModal?: (inventory: any[], inventoryRows?: number) => void;
    populateAbilitiesModal?: (abilities: any[]) => void;
    populateRoomSelectionModal?: (gameScene?: any) => void;
    learnAbility?: (abilityId: string) => void;
    expandInventory?: () => void;
    getAbilitiesData?: () => any;
    setAbilitiesData?: (data: any) => void;
    populateResidentDetailModal?: (resident: any) => void;

    // Resident data storage
    currentResidentsData?: any[];

    // Game scene methods
    getCurrentResidentsData?: () => any[];
    getResidentById?: (id: number) => any;

    // Game instance for UI bridge
    game?: Phaser.Game;
  }
}

export {};

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
    initializeInventoryDragAndDrop?: () => void;
    swapInventoryItems?: (fromSlot: number, toSlot: number) => boolean;
    moveInventoryItem?: (fromSlot: number, toSlot: number) => boolean;
    getInventoryItem?: (slot: number) => any;
    setInventoryItem?: (slot: number, item: any) => void;
    removeInventoryItem?: (slot: number) => any;

    // Resource functions
    updateResourceDisplay?: (resource: string, amount: number) => void;
    updateAllResourceDisplays?: () => void;
    addResource?: (resource: string, amount: number) => void;

    // Weapon functions
    currentWeapon?: string;
    weaponDropdownVisible?: boolean;
    syncWeaponWithGameScene?: (weaponType: string) => void;
    getCurrentWeaponFromGameScene?: () => string;
    forceWeaponSync?: () => void;
    toggleWeaponDropdown?: () => void;
    selectWeapon?: (weaponType: string) => void;
    getWeaponData?: (weaponType: string) => any;
    getWeaponDisplayName?: (weaponType: string) => string;
    isWeaponAvailable?: (weaponType: string) => boolean;
    updateWeaponDisplay?: (weaponType: string) => void;
    updateWeaponAvailability?: () => void;
    initializeWeaponSystem?: () => void;

    // Notification functions
    gameNotifications?: any;
    showToast?: (message: string, type?: string) => void;
    getCurrentGameDay?: () => number;
    getTagLabel?: (tag: string) => string;
    getTypeLabel?: (type: string) => string;
    markNotificationAsRead?: (id: string) => void;
    populateJournalModal?: () => void;
    initializeTagFilters?: () => void;
    getActiveTagFilters?: () => string[];
    getActiveTypeFilters?: () => string[];
    toggleTagFilter?: (tag: string) => void;
    markAllDayAsRead?: () => void;
    clearAllFilters?: () => void;
    addGameNotification?: (message: string, type?: string, day?: number, tags?: string[]) => void;

    // Item functions
    getItemById?: (id: string) => any;

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

    // BunkerView methods
    setSelectedRoomType?: (roomType: string) => void;

    // Game instance for UI bridge
    game?: Phaser.Game;
  }
}

export {};

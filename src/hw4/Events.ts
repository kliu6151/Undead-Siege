export enum BattlerEvent {
    BATTLER_KILLED = "BATTLER_KILLED",
    BATTLER_RESPAWN = "BATTLER_RESPAWN",
    
    BATTLER_CHANGE = "BATTLER_CHANGE",
    CONSUME = "CONSUME",
    HIT = "HIT",
    OVERLAP = "OVERLAP",
    ROLL = "ROLL",
}

export enum CheatEvent {
    UNLOCK_ALL_LEVELS = "UNLOCK_ALL_LEVELS",
    INFINITE_HEALTH = "INFINITE_HEALTH",
    END_DAY = "END_DAY",
    ADD_MAT = "ADD_MAT",

}

export enum ItemEvent {
    ITEM_REQUEST = "ITEM_REQUEST",

    LASERGUN_FIRED = "LASERGUN_FIRED",

    WEAPON_USED = "WEAPON_USED",
    CONSUMABLE_USED = "CONSUMABLE_USED",
    INVENTORY_CHANGED = "INVENTORY_CHANGED",

    MATERIAL_PICKED_UP = "MATERIAL_PICKED_UP",
    FUEL_PICKED_UP = "FUEL_PICKED_UP",
}

export enum HudEvent {
    HEALTH_CHANGE = "HEALTH_CHANGE"
}

export enum PlayerEvent {
    PLAYER_KILLED = "PLAYER_KILLED"
}

export enum InputEvent {
    PAUSED = "PAUSED",
    SET_TIMEOUT = "SET_TIMEOUT",
    RESUMED = "RESUMED",
}

export enum SceneEvent {
    LEVEL_START = "LEVEL_START",
    LEVEL_END = "LEVEL_END",
}
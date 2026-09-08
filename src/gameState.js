import { FOOD_DATABASE } from './constants.js';
import { updateUIBars, updateAnyExpression } from './utils.js';

export const GameState = {
    hunger: 26,
    thirst: 26,
    sleep: 76,
    health: 90,
    isEating: false,
    isSleeping: false,
    lastSavedTime: Date.now(),
    currentScene: 'MainScene',
    outfit: 'any_base',
    achievements: { unlocked: {}, counters: {} },
    loginDays: 1,
    lastLoginDate: ''
};

export let currentFoodIndex = 0;
export function setCurrentFoodIndex(index) {
    currentFoodIndex = index % FOOD_DATABASE.length;
}

let savePending = false;
export function throttledSave() {
    if (savePending) return;
    savePending = true;
    const done = () => {
        saveData();
        savePending = false;
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(done, { timeout: 5000 });
    } else {
        setTimeout(done, 1000);
    }
}

const memoryStore = {};
function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return memoryStore[key] ?? null;
    }
}

function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        memoryStore[key] = value;
    }
}

function saveData() {
    GameState.lastSavedTime = Date.now();
    safeSet('any_game_data', JSON.stringify({
        hunger: GameState.hunger,
        thirst: GameState.thirst,
        sleep: GameState.sleep,
        health: GameState.health,
        isSleeping: GameState.isSleeping,
        currentScene: GameState.currentScene,
        currentFoodIndex: currentFoodIndex,
        outfit: GameState.outfit,
        achievements: GameState.achievements,
        loginDays: GameState.loginDays,
        lastLoginDate: GameState.lastLoginDate,
        lastSavedTime: GameState.lastSavedTime
    }));
}

export function forceSave() {
    if (window.__suppressSave) return;
    saveData();
}

export function resetGameState() {
    GameState.hunger = 26;
    GameState.thirst = 26;
    GameState.sleep = 76;
    GameState.health = 90;
    GameState.isEating = false;
    GameState.isSleeping = false;
    GameState.currentScene = 'MainScene';
    GameState.outfit = 'any_base';
    GameState.achievements = { unlocked: {}, counters: {} };
    GameState.loginDays = 1;
    GameState.lastLoginDate = '';
    currentFoodIndex = 0;
}

export function loadData() {
    const saved = safeGet('any_game_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const elapsed = (now - (parsed.lastSavedTime || now)) / 1000;

        GameState.hunger = Math.max(0, parsed.hunger ?? 26);
        GameState.thirst = Math.max(0, parsed.thirst ?? 26);
        GameState.sleep = Math.max(0, parsed.sleep ?? 76);
        GameState.health = Math.max(0, parsed.health ?? 90);
        GameState.currentScene = parsed.currentScene || 'MainScene';
        GameState.isSleeping = parsed.isSleeping ?? false;
        currentFoodIndex = (parsed.currentFoodIndex ?? 0) % FOOD_DATABASE.length;
        GameState.outfit = parsed.outfit ?? 'any_base';
        GameState.lastSavedTime = parsed.lastSavedTime || now;

        GameState.achievements = {
            unlocked: parsed.achievements?.unlocked || {},
            counters: parsed.achievements?.counters || {}
        };

        const today = new Date().toDateString();
        GameState.loginDays = parsed.loginDays ?? 1;
        GameState.lastLoginDate = parsed.lastLoginDate || today;
        if (GameState.lastLoginDate !== today) {
            GameState.loginDays += 1;
            GameState.lastLoginDate = today;
        }

        // Decaimiento por tiempo offline
        const loss = elapsed / 60;
        GameState.hunger = Math.max(0, GameState.hunger - loss);
        GameState.thirst = Math.max(0, GameState.thirst - loss);
        if (GameState.isSleeping) {
            GameState.sleep = Math.min(100, GameState.sleep + elapsed / 15);
            GameState.health = Math.min(100, GameState.health + elapsed / 60);
        } else {
            GameState.sleep = Math.max(0, GameState.sleep - elapsed / 15);
        }
        GameState.health = Math.max(0, GameState.health - elapsed / 240);
    }
    updateUIBars();
}

export function updateStats(deltaSeconds) {
    const minutes = deltaSeconds / 60;
    if (!GameState.isEating) {
        if (!GameState.isSleeping) {
            GameState.hunger = Math.max(0, GameState.hunger - minutes);
            GameState.thirst = Math.max(0, GameState.thirst - minutes);
            GameState.sleep = Math.max(0, GameState.sleep - 4 * minutes);
            GameState.health = Math.max(0, GameState.health - 0.25 * minutes);
        } else {
            GameState.sleep = Math.min(100, GameState.sleep + 4 * minutes);
            GameState.health = Math.min(100, GameState.health + 1 * minutes);
        }
    }
}

window.addEventListener('pagehide', () => forceSave());
window.addEventListener('beforeunload', () => forceSave());
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') forceSave();
});
import { GameState, forceSave } from './gameState.js';

export const ACHIEVEMENTS = [
    { id: 'first_meal', icon: 'restaurant', title: 'Primer bocado', desc: 'Alimenta a Any por primera vez', track: 'feedCount', goal: 1 },
    { id: 'gourmet', icon: 'ramen_dining', title: 'Gourmet', desc: 'Alimenta a Any 20 veces', track: 'feedCount', goal: 20 },
    { id: 'chef', icon: 'soup_kitchen', title: 'Chef de lujo', desc: 'Alimenta a Any 100 veces', track: 'feedCount', goal: 100 },
    { id: 'first_nap', icon: 'bed', title: 'Dulces sueños', desc: 'Haz dormir a Any por primera vez', track: 'sleepCount', goal: 1 },
    { id: 'dormilon', icon: 'bedtime', title: 'Dormilón', desc: 'Haz dormir a Any 20 veces', track: 'sleepCount', goal: 20 },
    { id: 'hydrated', icon: 'water_drop', title: 'Hidratada', desc: 'Lleva la sed de Any al 100%', state: (g) => g.thirst >= 99.5 },
    { id: 'full_belly', icon: 'lunch_dining', title: 'Barriga llena', desc: 'Lleva el hambre de Any al 100%', state: (g) => g.hunger >= 99.5 },
    { id: 'healthy', icon: 'favorite', title: 'Sana y salva', desc: 'Lleva la salud de Any al 100%', state: (g) => g.health >= 99.5 },
    { id: 'balanced', icon: 'spa', title: 'Equilibrio total', desc: 'Las 4 stats por encima del 90%', state: (g) => g.hunger >= 90 && g.thirst >= 90 && g.sleep >= 90 && g.health >= 90 },
    { id: 'day2', icon: 'wb_sunny', title: 'Buenos días', desc: 'Vuelve a jugar mañana', track: 'loginDays', goal: 2 },
    { id: 'week', icon: 'calendar_month', title: 'Semana completa', desc: 'Juega 7 días', track: 'loginDays', goal: 7 },
    { id: 'friend', icon: 'volunteer_activism', title: 'Mejor amiga', desc: 'Juega 30 días', track: 'loginDays', goal: 30 }
];

export function getProgress() {
    if (!GameState.achievements) GameState.achievements = { unlocked: {}, counters: {} };
    return GameState.achievements;
}

export function bumpCounter(key, amount = 1) {
    const prog = getProgress();
    prog.counters[key] = (prog.counters[key] || 0) + amount;
    checkAchievements();
    forceSave();
}

export function checkAchievements() {
    const prog = getProgress();
    const counters = prog.counters;
    let changed = false;
    for (const a of ACHIEVEMENTS) {
        if (prog.unlocked[a.id]) continue;
        const done = a.state ? a.state(GameState) : (counters[a.track] || 0) >= a.goal;
        if (done) {
            prog.unlocked[a.id] = true;
            changed = true;
            queueToast(a);
        }
    }
    if (changed) forceSave();
}

let toastQueue = [];
let toastShowing = false;

function queueToast(achievement) {
    toastQueue.push(achievement);
    if (!toastShowing) showNextToast();
}

function showNextToast() {
    const el = document.getElementById('achievement-toast');
    const next = toastQueue.shift();
    if (!next || !el) {
        toastShowing = false;
        return;
    }
    toastShowing = true;
    try {
        window.game?.sound?.play('achievement_unlock');
    } catch (e) {}
    el.querySelector('.ach-toast-icon .material-symbols-rounded').textContent = next.icon;
    el.querySelector('.ach-toast-title').textContent = next.title;
    el.classList.remove('hidden');
    try { navigator.vibrate && navigator.vibrate(35); } catch (e) {}
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => {
            el.classList.add('hidden');
            showNextToast();
        }, 400);
    }, 3800);
}

export function buildAchievementsList() {
    const prog = getProgress();
    const container = document.getElementById('achievements-list');
    if (!container) return;
    container.innerHTML = '';
    const doneCount = Object.keys(prog.unlocked).length;
    const countEl = document.getElementById('achievements-count');
    if (countEl) countEl.textContent = `${doneCount} de ${ACHIEVEMENTS.length} desbloqueados`;

    ACHIEVEMENTS.forEach((a) => {
        const done = !!prog.unlocked[a.id];
        const counter = prog.counters[a.track] || 0;
        const showProgress = a.track && !a.state;
        const row = document.createElement('div');
        row.className = 'ach-row' + (done ? ' done' : '');
        row.innerHTML = `
            <div class="ach-row-icon"><span class="material-symbols-rounded">${a.icon}</span></div>
            <div class="ach-row-text">
                <div class="ach-row-title">${a.title}</div>
                <div class="ach-row-desc">${a.desc}</div>
                ${showProgress ? `<div class="ach-row-progress">${Math.min(counter, a.goal)} / ${a.goal}</div>` : ''}
            </div>
            <div class="ach-row-badge"><span class="material-symbols-rounded">${done ? 'check' : 'lock'}</span></div>`;
        container.appendChild(row);
    });
}

import { GameState, currentFoodIndex, forceSave, setCurrentFoodIndex, resetGameState } from '../gameState';
import { FOOD_DATABASE, CATEGORIES } from '../constants';
import type { Food, Category } from '../constants';
import { updateUIBars } from '../utils';
import { checkAchievements, buildAchievementsList } from '../achievements';
import { askTutorial } from '../tutorial';
import { OUTFITS } from '../scenes/SalonScene';
import type { SalonScene } from '../scenes/SalonScene';
import type { KitchenScene } from '../scenes/KitchenScene';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface SettingsAction {
    id: string;
    icon: string;
    title: string;
    sub: string;
    kind: 'normal' | 'install' | 'danger';
}

interface ActionEl {
    row: HTMLButtonElement;
    ctrl: Element | null;
    def: SettingsAction;
}

type StatKey = 'hunger' | 'thirst' | 'sleep' | 'health';

interface StatDef {
    key: StatKey;
    icon: string;
    name: string;
    cls: string;
}

interface StatEl {
    value: HTMLElement;
    fill: HTMLElement;
    label: HTMLElement;
}

let earlyPrompt: BeforeInstallPromptEvent | null = null;
window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    earlyPrompt = e as BeforeInstallPromptEvent;
});

export class UIManager {
    modalSettings: HTMLElement;
    modalFridge: HTMLElement;
    modalStats: HTMLElement;
    foodGrid: HTMLElement;
    deferredPrompt: BeforeInstallPromptEvent | null;
    isStandalone: boolean;
    isIOS: boolean;
    settingsActions!: SettingsAction[];
    actionEls!: Record<string, ActionEl>;
    iosPanel!: HTMLDivElement;
    statsList!: StatDef[];
    statEls!: Record<string, StatEl>;
    selectedCat!: string;
    catChips!: Record<string, HTMLButtonElement>;

    constructor() {
        this.modalSettings = document.getElementById('settings-modal')!;
        this.modalFridge = document.getElementById('fridge-modal')!;
        this.modalStats = document.getElementById('stats-modal')!;
        this.foodGrid = document.getElementById('food-grid')!;
        this.deferredPrompt = earlyPrompt;
        earlyPrompt = null;
        this.isStandalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
        this.isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        document.getElementById('btn-settings')!.addEventListener('click', () => this.openSettings());
        document.getElementById('settings-close')!.addEventListener('click', () => this.closeSettings());
        document.getElementById('fridge-close')!.addEventListener('click', () => this.closeFridge());
        document.getElementById('stats-close')!.addEventListener('click', () => this.closeStats());
        document.getElementById('achievements-close')!.addEventListener('click', () => this.closeAchievements());
        document.getElementById('outfit-close')!.addEventListener('click', () => this.closeOutfits());
        document.querySelectorAll('.status-pill').forEach((sq) => {
            sq.addEventListener('click', () => this.openStats());
        });

        this.buildSettings();
        this.buildStats();
        this.buildCategories();
        this.initInstall();

        window.uiManager = this;

        updateUIBars();
        setInterval(() => {
            updateUIBars();
            checkAchievements();
            window.refreshDock?.();
            if (!this.modalStats.classList.contains('hidden')) {
                this.refreshStats();
            }
        }, 500);
    }

    buildSettings(): void {
        this.settingsActions = [
            {
                id: 'achievements',
                icon: 'emoji_events',
                title: 'Logros',
                sub: 'Mira lo que has desbloqueado',
                kind: 'normal'
            },
            {
                id: 'tutorial',
                icon: 'school',
                title: 'Tutorial',
                sub: 'Ver de nuevo cómo cuidar a Any',
                kind: 'normal'
            },
            {
                id: 'install',
                icon: 'install_mobile',
                title: 'Instalar juego',
                sub: 'Juega sin internet y en pantalla completa',
                kind: 'install'
            },
            {
                id: 'reset',
                icon: 'delete_forever',
                title: 'Borrar progreso',
                sub: 'Reinicia hambre, sed, sueño y salud',
                kind: 'danger'
            }
        ];
        const container = document.getElementById('settings-actions')!;
        this.actionEls = {};
        this.settingsActions.forEach((action) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'settings-row' + (action.kind === 'danger' ? ' danger' : '');
            row.innerHTML = `
                <div class="settings-row-icon"><span class="material-symbols-rounded">${action.icon}</span></div>
                <div class="settings-row-text">
                    <div class="settings-row-title">${action.title}</div>
                    <div class="settings-row-sub">${action.sub}</div>
                </div>
                <div class="settings-row-ctrl"></div>`;
            row.addEventListener('click', () => this.handleAction(action.id));
            container.appendChild(row);
            this.actionEls[action.id] = { row, ctrl: row.querySelector('.settings-row-ctrl'), def: action };
        });
        this.iosPanel = document.createElement('div');
        this.iosPanel.className = 'ios-steps hidden';
        this.iosPanel.innerHTML = `
            <div class="ios-step"><span class="material-symbols-rounded">ios_share</span><p>Toca el botón <b>Compartir</b> en Safari</p></div>
            <div class="ios-step"><span class="material-symbols-rounded">arrow_downward</span><p>Desliza y elige <b>Añadir a pantalla de inicio</b></p></div>
            <div class="ios-step"><span class="material-symbols-rounded">check_circle</span><p>Listo, ábrela desde tu inicio</p></div>`;
        container.insertBefore(this.iosPanel, this.actionEls.reset.row);
    }

    handleAction(id: string): void {
        const action = this.settingsActions.find(a => a.id === id);
        if (!action) return;
        if (action.kind === 'install') {
            this.onInstallClick();
        } else if (action.kind === 'danger' && id === 'reset') {
            this.resetProgress();
        } else if (id === 'achievements') {
            this.openAchievements();
        } else if (id === 'tutorial') {
            this.closeAllModals();
            askTutorial();
        }
    }

    initInstall(): void {
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            this.deferredPrompt = e as BeforeInstallPromptEvent;
            this.updateInstallUI();
        });
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.isStandalone = true;
            this.updateInstallUI();
        });
        this.updateInstallUI();
    }

    updateInstallUI(): void {
        const el = this.actionEls.install;
        if (!el) return;
        const { row, ctrl, def } = el;
        const sub = row.querySelector('.settings-row-sub')!;
        ctrl!.innerHTML = '';
        row.classList.remove('installed');
        if (this.isStandalone) {
            row.classList.add('installed');
            sub.textContent = 'Ya tienes el juego en tu dispositivo';
            ctrl!.innerHTML = '<span class="install-badge">Instalado</span>';
        } else if (this.deferredPrompt) {
            sub.textContent = def.sub;
            ctrl!.innerHTML = '<span class="install-btn">Instalar</span>';
        } else if (this.isIOS) {
            sub.textContent = 'Disponible desde Safari';
            ctrl!.innerHTML = '<span class="install-btn">Cómo instalarlo</span>';
        } else {
            row.classList.add('installed');
            sub.textContent = 'Tu navegador no lo permite';
        }
    }

    async onInstallClick(): Promise<void> {
        const prompt = this.deferredPrompt;
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            this.deferredPrompt = null;
            if (outcome === 'accepted') {
                this.isStandalone = true;
            }
            this.updateInstallUI();
        } else if (this.isIOS) {
            this.iosPanel.classList.toggle('hidden');
        }
    }

    openSettings(): void {
        this.modalSettings.classList.remove('hidden');
        this.setModalOpen(true);
    }

    closeSettings(): void {
        this.modalSettings.classList.add('hidden');
        this.setModalOpen(false);
    }

    setModalOpen(open: boolean): void {
        const input = window.game?.input;
        if (input) input.enabled = !open;
    }

    closeAllModals(): void {
        this.modalSettings.classList.add('hidden');
        this.modalFridge.classList.add('hidden');
        this.modalStats.classList.add('hidden');
        document.getElementById('achievements-modal')!.classList.add('hidden');
        const outfitModal = document.getElementById('outfit-modal');
        if (outfitModal) outfitModal.classList.add('hidden');
        this.setModalOpen(false);
    }

    openFridge(): void {
        this.populateFoodGrid();
        this.modalFridge.classList.remove('hidden');
        this.setModalOpen(true);
    }

    closeFridge(): void {
        this.modalFridge.classList.add('hidden');
        this.setModalOpen(false);
    }

    buildStats(): void {
        this.statsList = [
            { key: 'hunger', icon: 'lunch_dining', name: 'Hambre', cls: 'hunger' },
            { key: 'thirst', icon: 'water_drop', name: 'Sed', cls: 'thirst' },
            { key: 'sleep', icon: 'bedtime', name: 'Sueño', cls: 'sleep' },
            { key: 'health', icon: 'favorite', name: 'Salud', cls: 'health' }
        ];
        const container = document.getElementById('stats-list')!;
        this.statEls = {};
        this.statsList.forEach((stat) => {
            const row = document.createElement('div');
            row.className = 'stat-row';
            row.innerHTML = `
                <div class="stat-row-icon ${stat.cls}"><span class="material-symbols-rounded">${stat.icon}</span></div>
                <div class="stat-row-body">
                    <div class="stat-row-head">
                        <span class="stat-row-name">${stat.name}</span>
                        <span class="stat-row-value">0%</span>
                    </div>
                    <div class="stat-row-track"><div class="stat-row-fill ${stat.cls}"></div></div>
                    <div class="stat-row-label">—</div>
                </div>`;
            container.appendChild(row);
            this.statEls[stat.key] = {
                value: row.querySelector('.stat-row-value') as HTMLElement,
                fill: row.querySelector('.stat-row-fill') as HTMLElement,
                label: row.querySelector('.stat-row-label') as HTMLElement
            };
        });
    }

    statLabelFor(v: number): { text: string; cls: string } {
        if (v >= 75) return { text: 'Llena', cls: 'ok' };
        if (v >= 45) return { text: 'OK', cls: 'mid' };
        if (v >= 25) return { text: 'Baja', cls: 'low' };
        return { text: 'Crítica', cls: 'crit' };
    }

    refreshStats(): void {
        this.statsList.forEach((stat) => {
            const value = Math.round(GameState[stat.key]);
            const el = this.statEls[stat.key];
            const label = this.statLabelFor(value);
            el.value.textContent = value + '%';
            el.fill.style.width = value + '%';
            el.label.textContent = label.text;
            el.label.className = 'stat-row-label ' + label.cls;
        });
    }

    openStats(): void {
        this.refreshStats();
        this.modalStats.classList.remove('hidden');
        this.setModalOpen(true);
    }

    closeStats(): void {
        this.modalStats.classList.add('hidden');
        this.setModalOpen(false);
    }

    openAchievements(): void {
        buildAchievementsList();
        document.getElementById('achievements-modal')!.classList.remove('hidden');
        this.setModalOpen(true);
    }

    closeAchievements(): void {
        document.getElementById('achievements-modal')!.classList.add('hidden');
        this.setModalOpen(false);
    }

    openOutfits(): void {
        this.buildOutfits();
        document.getElementById('outfit-modal')!.classList.remove('hidden');
        this.setModalOpen(true);
    }

    closeOutfits(): void {
        document.getElementById('outfit-modal')!.classList.add('hidden');
        this.setModalOpen(false);
    }

    buildOutfits(): void {
        const grid = document.getElementById('outfits-grid');
        if (!grid) return;
        grid.innerHTML = '';
        OUTFITS.forEach((outfit) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'outfit-item' + (outfit.id === GameState.outfit ? ' active' : '');
            item.innerHTML = `
                <div class="outfit-thumb" style="background-image:url('assets/any_sprites/${outfit.id}.webp');background-size:400% 300%;background-position:0 0"></div>
                <span class="outfit-name">${outfit.name}</span>
                <span class="outfit-check"><span class="material-symbols-rounded">check</span></span>`;
            item.addEventListener('click', () => {
                GameState.outfit = outfit.id;
                forceSave();
                const active = window.game?.scene?.getScenes(true)[0];
                if (active && active.scene.key === 'SalonScene') {
                    (active as SalonScene).applyOutfit(outfit.id);
                }
                this.closeOutfits();
            });
            grid.appendChild(item);
        });
    }

    populateFoodGrid(): void {
        this.foodGrid.innerHTML = '';
        const foods = this.selectedCat === 'all' ? FOOD_DATABASE : FOOD_DATABASE.filter((f) => f.cat === this.selectedCat);
        const byCat: Record<string, Food[]> = {};
        foods.forEach((food) => {
            if (!byCat[food.cat]) byCat[food.cat] = [];
            byCat[food.cat].push(food);
        });

        const current = FOOD_DATABASE[currentFoodIndex];
        const currentBox = document.getElementById('fridge-current');
        if (currentBox) {
            currentBox.innerHTML = `
                <img src="assets/comida/${current.id}.webp" alt="${current.name}">
                <div class="fridge-current-text"><b>${current.name}</b>En el plato ahora</div>
                <span class="fridge-current-badge">Servido</span>`;
        }

        const catInfo: Record<string, Category> = {};
        CATEGORIES.forEach((c) => { catInfo[c.id] = c; });
        const catIds = Object.keys(byCat);

        catIds.forEach((catId) => {
            const shelf = document.createElement('div');
            shelf.className = 'fridge-shelf';
            const info = catInfo[catId];
            const head = document.createElement('div');
            head.className = 'fridge-shelf-head';
            head.innerHTML = `
                <span class="material-symbols-rounded">${info ? info.icon : 'restaurant'}</span>
                <span>${info ? info.name : catId}</span>
                <span class="fridge-shelf-count">${byCat[catId].length}</span>`;
            shelf.appendChild(head);
            const grid = document.createElement('div');
            grid.className = 'fridge-grid';
            byCat[catId].forEach((food) => {
                const item = document.createElement('div');
                item.className = 'food-item' + (food === current ? ' selected' : '');
                const img = document.createElement('img');
                img.src = `assets/comida/${food.id}.webp`;
                img.alt = food.name;
                img.loading = 'lazy';
                img.decoding = 'async';
                const label = document.createElement('span');
                label.textContent = food.name;
                item.appendChild(img);
                item.appendChild(label);
                item.addEventListener('click', () => {
                    if (GameState.isEating || window.isDraggingFood) return;
                    const index = FOOD_DATABASE.indexOf(food);
                    setCurrentFoodIndex(index);
                    const activeScene = window.game?.scene?.getScenes(true)[0];
                    if (activeScene && activeScene.scene.key === 'KitchenScene') {
                        (activeScene as KitchenScene).updateFoodSprite();
                    }
                    this.closeFridge();
                });
                grid.appendChild(item);
            });
            shelf.appendChild(grid);
            this.foodGrid.appendChild(shelf);
        });
    }

    buildCategories(): void {
        this.selectedCat = 'all';
        const bar = document.getElementById('cat-bar')!;
        const chips: Category[] = [{ id: 'all', icon: 'restaurant', name: 'Todas' }, ...CATEGORIES];
        this.catChips = {};
        chips.forEach((cat) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'cat-chip' + (cat.id === 'all' ? ' active' : '');
            chip.innerHTML = `<span class="material-symbols-rounded">${cat.icon}</span><span>${cat.name}</span>`;
            chip.addEventListener('click', () => {
                this.selectedCat = cat.id;
                Object.values(this.catChips).forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                this.populateFoodGrid();
            });
            bar.appendChild(chip);
            this.catChips[cat.id] = chip;
        });
    }

    async resetProgress(): Promise<void> {
        if (!confirm('¿Borrar todo? Se perderán logros, ropa, tutorial y progreso. Se limpiará la caché del juego.')) return;
        this.closeAllModals();
        window.__suppressSave = true;
        resetGameState();
        try {
            ['any_game_data', 'any_tutorial_done'].forEach((k) => localStorage.removeItem(k));
        } catch (e) {}
        try {
            if (window.caches) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if (navigator.serviceWorker) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
            }
        } catch (e) {}
        window.location.reload();
    }
}
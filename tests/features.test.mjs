import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
});

const report = {};
process.on('uncaughtException', (err) => {
    fs.writeFileSync(fileURLToPath(new URL('./partial.json', import.meta.url)), JSON.stringify(report, null, 1));
    console.log('ERROR:', err.message.slice(0, 200));
    process.exit(1);
});

server.listen(8125, async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 160)));
    page.on('console', m => { if (m.type() === 'error') errors.push('[c] ' + m.text().slice(0, 120)); });

    const boot = async () => {
        await page.goto('http://localhost:8125/?renderer=canvas&t=' + Date.now(), { waitUntil: 'networkidle', timeout: 40000 });
        try {
            await page.waitForFunction(() => window.game && window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 30000 });
        } catch (e) {
            console.log('[boot-fail]', JSON.stringify(await page.evaluate(() => ({
                game: !!window.game,
                overlay: document.getElementById('boot-error').classList.contains('hidden') ? 'no' : document.getElementById('boot-error-msg').textContent,
                scenes: window.game ? window.game.scene.getScenes(true).map(s => s.scene.key) : [],
                askHidden: document.getElementById('tutorial-ask').classList.contains('hidden')
            })).catch(() => 'evaluate failed')));
            console.log('[boot-fail errors]', errors.slice(-10));
            throw e;
        }
        await page.waitForTimeout(500);
    };
    const askVisible = () => page.evaluate(() => !document.getElementById('tutorial-ask').classList.contains('hidden'));
    const cardState = () => page.evaluate(() => {
        const overlay = document.getElementById('tutorial-overlay');
        const next = document.getElementById('tutorial-next');
        const spot = document.getElementById('tutorial-spot');
        return {
            active: !overlay.classList.contains('hidden'),
            title: document.getElementById('tutorial-title').textContent,
            nextDisabled: next.disabled,
            compact: document.getElementById('tutorial-card').classList.contains('compact'),
            spotHidden: spot.classList.contains('hidden'),
            spotRect: spot.classList.contains('hidden') ? null : spot.getBoundingClientRect().toJSON(),
            hint: document.querySelector('.tutorial-hint').textContent
        };
    });
    const next = () => page.evaluate(() => { if (!document.getElementById('tutorial-next').disabled) document.getElementById('tutorial-next').click(); });
    const canvasToPage = (gx, gy) => page.evaluate(([gx, gy]) => {
        const canvas = document.querySelector('canvas');
        const r = canvas.getBoundingClientRect();
        const z = Math.max(r.width / 2560, r.height / 1440);
        return { x: r.x + r.width / 2 + (gx - 1280) * z, y: r.y + r.height / 2 + (gy - 720) * z };
    }, [gx, gy]);

    // ===== 1. CARTEL: aparece sin flag, "No" lo marca =====
    await boot();
    await page.waitForFunction(() => !document.getElementById('tutorial-ask').classList.contains('hidden'), { timeout: 10000 });
    report.askAppears = await askVisible();
    await page.click('#tutorial-no');
    await page.waitForTimeout(300);
    report.noHidesAsk = !(await askVisible());
    report.flagAfterNo = await page.evaluate(() => localStorage.getItem('any_tutorial_done'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    report.askDoesNotReappear = !(await askVisible());

    // ===== 2. BORRAR FLAG → reaparece =====
    await page.evaluate(() => localStorage.removeItem('any_tutorial_done'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.getElementById('tutorial-ask').classList.contains('hidden'), { timeout: 10000 });
    report.askReappearsAfterClear = true;

    // ===== 3. FLUJO COMPLETO DEL TUTORIAL =====
    await page.click('#tutorial-yes');
    await page.waitForFunction(() => !document.getElementById('tutorial-overlay').classList.contains('hidden'), { timeout: 5000 });
    await page.waitForTimeout(300);

    report.step1 = await cardState(); // intro: sin target, botón habilitado
    await next();
    await page.waitForTimeout(300);
    report.step2 = await cardState(); // stats: spotlight, disabled
    const pillRect = await page.evaluate(() => document.querySelector('.status-pill').getBoundingClientRect().toJSON());
    report.step2SpotlightOnPill = (() => {
        const s = report.step2.spotRect;
        return s && Math.abs(s.x - (pillRect.x - 10)) < 3 && Math.abs(s.y - (pillRect.y - 10)) < 3;
    })();
    await page.click('.status-pill'); // acción real → flag
    await page.waitForTimeout(400);
    report.step2AfterAction = await page.evaluate(() => ({
        modalOpen: !document.getElementById('stats-modal').classList.contains('hidden'),
        cardHiddenWhileModal: document.getElementById('tutorial-card').classList.contains('modal-open')
    }));
    await page.click('#stats-close');
    await page.waitForTimeout(200);
    report.step2CardBack = await page.evaluate(() => !document.getElementById('tutorial-card').classList.contains('modal-open'));
    await next();

    await page.waitForTimeout(300);
    report.step3 = await cardState(); // rooms: spotlight en el dock
    await page.evaluate(() => document.querySelectorAll('.dock-btn')[0].click()); // tocar dock → flag
    await page.waitForTimeout(400);
    report.step3AfterAction = await cardState();
    await next();

    await page.waitForTimeout(900);
    report.step4 = await cardState(); // fridge: goTo cocina, compact, disabled
    report.step4Scene = await page.evaluate(() => window.game.scene.getScenes(true)[0]?.scene.key || 'loading');
    await page.waitForFunction(() => { const s = window.game.scene.getScene('KitchenScene'); return !!(s && s.fridge && s.food); }, { timeout: 15000 });
    const fridgeInfo = await page.evaluate(() => {
        const s = window.game.scene.getScene('KitchenScene');
        const canvas = document.querySelector('canvas');
        const r = canvas.getBoundingClientRect();
        return {
            fridge: { x: s.fridge.x, y: s.fridge.y },
            rect: { x: r.x, y: r.y, w: r.width, h: r.height },
            scale: { w: s.scale.width, h: s.scale.height }
        };
    });
    const _z = Math.max(fridgeInfo.rect.w / 2560, fridgeInfo.rect.h / 1440);
    const fridgeP = {
        x: fridgeInfo.rect.x + fridgeInfo.rect.w / 2 + (fridgeInfo.fridge.x - 1280) * _z,
        y: fridgeInfo.rect.y + fridgeInfo.rect.h / 2 + (fridgeInfo.fridge.y - 720) * _z
    };
    await page.mouse.move(fridgeP.x, fridgeP.y);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForTimeout(500);
    report.step4FridgeClick = await page.evaluate(() => ({
        modalHidden: document.getElementById('fridge-modal').classList.contains('hidden'),
        pointer: { x: window.game.input.activePointer.x, y: window.game.input.activePointer.y },
        fridgeExists: !!window.game.scene.getScene('KitchenScene').fridge
    }));
    await page.waitForFunction(() => !document.getElementById('fridge-modal').classList.contains('hidden'), { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.click('.food-item'); // elige comida → flag
    await page.waitForTimeout(400);
    report.step4AfterAction = await cardState();
    await next();

    await page.waitForTimeout(300);
    report.step5 = await cardState(); // feed: drag real
    const coords = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const r = canvas.getBoundingClientRect();
        const s = window.game.scene.getScene('KitchenScene');
        return {
            canvas: { x: r.x, y: r.y, w: r.width, h: r.height },
            food: { x: s.food.x, y: s.food.y },
            foodVisible: s.food.visible,
            mouth: { x: s.mouthBox.x + s.mouthBox.width / 2, y: s.mouthBox.y + s.mouthBox.height / 2 }
        };
    });
    const toPage = (gx, gy) => {
        const z = Math.max(coords.canvas.w / 2560, coords.canvas.h / 1440);
        return { x: coords.canvas.x + coords.canvas.w / 2 + (gx - 1280) * z, y: coords.canvas.y + coords.canvas.h / 2 + (gy - 720) * z };
    };
    const foodP = toPage(coords.food.x, coords.food.y);
    const mouthP = toPage(coords.mouth.x, coords.mouth.y);
    await page.mouse.move(foodP.x, foodP.y);
    await page.mouse.down();
    await page.waitForTimeout(120);
    report.dragStart = await page.evaluate(() => ({
        isDragging: window.game.scene.getScene('KitchenScene').isDragging,
        pointerFood: window.game.input.activePointer.x
    }));
    await page.mouse.move(mouthP.x, mouthP.y, { steps: 6 });
    await page.waitForTimeout(150);
    report.dragNearMouth = await page.evaluate(() => window.game.scene.getScene('KitchenScene').nearMouth);
    await page.mouse.up();
    await page.waitForTimeout(800);
    report.step5AfterAction = await cardState();
    report.dragEnd = await page.evaluate(() => ({
        eating: window.game.scene.getScene('KitchenScene').isEating || window.game.scene.getScene('KitchenScene').scene.key,
        frame: window.game.scene.getScene('KitchenScene').any.frame.name
    }));
    await next();

    await page.waitForFunction(() => window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 15000 });
    await page.waitForTimeout(400);
    report.step6 = await cardState(); // sleep: goTo habitación, compact
    report.step6Scene = await page.evaluate(() => window.game.scene.getScenes(true)[0].scene.key);
    const lampP = await canvasToPage(1000, 1120);
    await page.mouse.move(lampP.x, lampP.y);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up(); // duerme → flag
    await page.waitForTimeout(600);
    report.lampDebug = await page.evaluate(() => {
        const s = window.game.scene.getScene('RoomScene');
        const canvas = document.querySelector('canvas');
        const r = canvas.getBoundingClientRect();
        const pt = document.elementFromPoint(r.x + 0.14 * r.width, r.y + 0.82 * r.height);
        return {
            lampExists: !!s.lamp,
            sleeping: null,
            lampGamePos: s.lamp ? [s.lamp.x, s.lamp.y] : null,
            pointer: [window.game.input.activePointer.x, window.game.input.activePointer.y],
            hitAtPoint: pt ? pt.tagName + '#' + pt.id + '.' + pt.className : null,
            canvasRect: [r.x, r.y, r.width, r.height]
        };
    });
    await page.evaluate(() => {
        window.__evCount = { mousemove: 0, mousedown: 0, mouseup: 0 };
        window.__evPos = [];
        const c = document.querySelector('canvas');
        ['mousemove', 'mousedown', 'mouseup'].forEach(t => c.addEventListener(t, (e) => { window.__evCount[t]++; if (window.__evPos.length < 6) window.__evPos.push(t + ':' + Math.round(e.clientX) + ',' + Math.round(e.clientY)); }, { capture: true }));
    });
    report.viewportInfo = await page.evaluate(() => ({
        inner: [window.innerWidth, window.innerHeight],
        scroll: [window.scrollX, window.scrollY]
    }));
    await page.mouse.move(lampP.x, lampP.y);
    await page.waitForTimeout(150);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForTimeout(600);
    report.lampEvents = await page.evaluate(() => ({ count: window.__evCount, pos: window.__evPos }));
    report.lampEmitTest = await page.evaluate(() => {
        const s = window.game.scene.getScene('RoomScene');
        const before = s.isToggling;
        s.lamp.emit('pointerup', window.game.input.mousePointer);
        return { before, handlerWorks: !before };
    });
    await page.waitForTimeout(600);
    report.step6AfterAction = await cardState();
    await next();

    await page.waitForTimeout(300);
    report.step7 = await cardState(); // done
    await next();
    await page.waitForTimeout(400);
    report.tutorialEnd = await page.evaluate(() => ({
        overlayHidden: document.getElementById('tutorial-overlay').classList.contains('hidden'),
        flag: localStorage.getItem('any_tutorial_done')
    }));

    // ===== 4. LOGROS: toast + modal + persistencia =====
    await page.waitForTimeout(1000);
    report.toastFirstMeal = await page.evaluate(() => {
        const el = document.getElementById('achievement-toast');
        return { shown: !el.classList.contains('hidden') || el.classList.contains('show'), title: el.querySelector('.ach-toast-title').textContent };
    });
    await page.waitForFunction(() => { const t = document.getElementById('achievement-toast'); return !t || t.classList.contains('hidden'); }, { timeout: 9000 }).catch(() => {});
    await page.click('#btn-settings');
    await page.waitForTimeout(300);
    const settingsRows = await page.evaluate(() => [...document.querySelectorAll('.settings-row-title')].map(e => e.textContent));
    report.settingsHasAchievements = settingsRows.includes('Logros');
    await page.evaluate(() => [...document.querySelectorAll('.settings-row')].find(r => r.querySelector('.settings-row-title').textContent === 'Logros').click());
    await page.waitForTimeout(400);
    report.achModal = await page.evaluate(() => ({
        open: !document.getElementById('achievements-modal').classList.contains('hidden'),
        count: document.getElementById('achievements-count').textContent,
        rows: document.querySelectorAll('.ach-row').length,
        doneTitles: [...document.querySelectorAll('.ach-row.done .ach-row-title')].map(e => e.textContent),
        firstRowProgress: document.querySelector('.ach-row .ach-row-progress') ? document.querySelector('.ach-row .ach-row-progress').textContent : null
    }));

    // persistencia tras recargar
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const t = document.getElementById('achievement-toast'); return !t || t.classList.contains('hidden'); }, { timeout: 9000 }).catch(() => {});
    await page.click('#btn-settings');
    await page.waitForTimeout(300);
    await page.evaluate(() => [...document.querySelectorAll('.settings-row')].find(r => r.querySelector('.settings-row-title').textContent === 'Logros').click());
    await page.waitForTimeout(400);
    report.achPersist = await page.evaluate(() => ({
        doneTitles: [...document.querySelectorAll('.ach-row.done .ach-row-title')].map(e => e.textContent),
        count: document.getElementById('achievements-count').textContent
    }));

    report.errors = errors;
    console.log('SMOKE FEATURES:', JSON.stringify(report, null, 1));
    browser.close();
    process.exit(0);
});
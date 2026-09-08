import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/blank') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html><body></body></html>'); return; }
    if (p === '/') p = '/index.html';
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
});
server.listen(8123, async () => {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text().slice(0, 150)); });
    page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));
    await page.goto('http://localhost:8123/blank', { waitUntil: 'load', timeout: 40000 });
    await page.evaluate(() => localStorage.setItem('any_tutorial_done', '1'));
    await page.goto('http://localhost:8123/?renderer=canvas', { waitUntil: 'networkidle', timeout: 40000 });
    try {
        await page.waitForFunction(() => window.game && window.game.scene && window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 30000 });
    } catch (e) {
        console.log('[state]', JSON.stringify(await page.evaluate(() => ({ game: !!window.game, overlay: !document.getElementById('boot-error').classList.contains('hidden'), msg: document.getElementById('boot-error-msg').textContent, scenes: window.game ? window.game.scene.getScenes(true).map(s => s.scene.key) : [] }))));
        throw e;
    }
    await page.evaluate(() => { window.game.scene.stop('RoomScene'); window.game.scene.start('KitchenScene'); });
    await page.waitForFunction(() => window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'KitchenScene', { timeout: 15000 });

    const coords = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const r = canvas.getBoundingClientRect();
        const s = window.game.scene.getScene('KitchenScene');
        const f = s.food, a = s.any;
        return {
            canvas: { x: r.x, y: r.y, w: r.width, h: r.height },
            food: { x: f.x, y: f.y },
            mouth: { x: s.mouthBox.x + s.mouthBox.width / 2, y: s.mouthBox.y + s.mouthBox.height / 2 },
            body: { x: a.x, y: a.y + a.displayHeight * 0.45 }
        };
    });
    const toPage = (gx, gy) => {
        const z = Math.max(coords.canvas.w / 2560, coords.canvas.h / 1440);
        return { x: coords.canvas.x + coords.canvas.w / 2 + (gx - 1280) * z, y: coords.canvas.y + coords.canvas.h / 2 + (gy - 720) * z };
    };
    const frame = () => page.evaluate(() => window.game.scene.getScene('KitchenScene').any.frame.name);
    const report = {};

    const foodP = toPage(coords.food.x, coords.food.y);
    await page.mouse.click(foodP.x, foodP.y);
    await page.waitForTimeout(400);
    report.tapNoDrag = await page.evaluate(() => ({
        frame: window.game.scene.getScene('KitchenScene').any.frame.name,
        eating: window.game.scene.getScene('KitchenScene').scene.key === 'KitchenScene' && window.game.scene.getScene('KitchenScene').food.visible,
        foodAt: [window.game.scene.getScene('KitchenScene').food.x, window.game.scene.getScene('KitchenScene').food.y]
    }));

    await page.mouse.move(foodP.x, foodP.y);
    await page.mouse.down();
    const mouthP = toPage(coords.mouth.x, coords.mouth.y);
    await page.mouse.move(mouthP.x, mouthP.y, { steps: 5 });
    await page.waitForTimeout(200);
    report.nearMouth = { frame: await frame() };

    const bodyP = toPage(coords.body.x, coords.body.y);
    await page.mouse.move(bodyP.x, bodyP.y, { steps: 5 });
    await page.waitForTimeout(200);
    report.onBodyAwayFromMouth = { frame: await frame() };

    await page.mouse.move(mouthP.x, mouthP.y, { steps: 5 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(300);
    report.droppedOnMouth = await page.evaluate(() => {
        const s = window.game.scene.getScene('KitchenScene');
        return { eating: s.isEating, frame: s.any.frame.name, hunger: Math.round(s.GameState ? null : 0) };
    });
    await page.waitForFunction(() => { const s = window.game.scene.getScene('KitchenScene'); return s && s.food.visible; }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    report.afterEating = await page.evaluate(() => {
        const s = window.game.scene.getScene('KitchenScene');
        return { frame: s.any.frame.name, foodVisible: s.food.visible };
    });

    const foodP2 = toPage(coords.food.x, coords.food.y);
    await page.mouse.move(foodP2.x, foodP2.y);
    await page.mouse.down();
    await page.mouse.move(bodyP.x, bodyP.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    report.droppedOnBody = await page.evaluate(() => {
        const s = window.game.scene.getScene('KitchenScene');
        return { eating: s.isEating, foodAt: [Math.round(s.food.x), Math.round(s.food.y)] };
    });

    const seed = async (stats) => {
        await page.goto('http://localhost:8123/blank', { waitUntil: 'load', timeout: 40000 });
        await page.evaluate((st) => {
            const data = JSON.stringify({ hunger: 26, thirst: 26, sleep: 76, health: 90, isSleeping: false, currentScene: 'KitchenScene', currentFoodIndex: 0, outfit: 'any_base', lastSavedTime: Date.now(), ...st });
            localStorage.setItem('any_game_data', data);
        }, stats);
        await page.goto('http://localhost:8123/?renderer=canvas', { waitUntil: 'networkidle', timeout: 40000 });
        await page.waitForFunction(() => window.game && window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'RoomScene', { timeout: 30000 });
        await page.evaluate(() => { window.game.scene.stop('RoomScene'); window.game.scene.start('KitchenScene'); });
        await page.waitForFunction(() => window.game.scene.getScenes(true)[0] && window.game.scene.getScenes(true)[0].scene.key === 'KitchenScene', { timeout: 15000 });
        await page.waitForFunction(() => window.game.scene.getScene('KitchenScene').food && window.game.scene.getScene('KitchenScene').food.visible, { timeout: 15000 });
    };
    const pickFood = async (name) => {
        await page.evaluate(() => window.uiManager.openFridge());
        const ok = await page.evaluate((n) => {
            const items = [...document.querySelectorAll('#food-grid .food-item')];
            const target = items.find((i) => i.querySelector('span').textContent === n);
            if (!target) return false;
            target.click();
            return true;
        }, name);
        if (!ok) throw new Error('food not found in grid: ' + name);
        await page.waitForFunction((n) => window.game.scene.getScene('KitchenScene').food.foodRef.name === n, name, { timeout: 10000 });
    };
    const dropAtMouth = async (checkNear) => {
        const c = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            const r = canvas.getBoundingClientRect();
            const s = window.game.scene.getScene('KitchenScene');
            const f = s.food, a = s.any;
            return {
                cx: r.x, cy: r.y, cw: r.width, ch: r.height,
                food: { x: f.x, y: f.y },
                mouth: { x: s.mouthBox.x + s.mouthBox.width / 2, y: s.mouthBox.y + s.mouthBox.height / 2 }
            };
        });
        const toPage = (gx, gy) => {
        const z = Math.max(c.cw / 2560, c.ch / 1440);
        return { x: c.cx + c.cw / 2 + (gx - 1280) * z, y: c.cy + c.ch / 2 + (gy - 720) * z };
    };
        const f = toPage(c.food.x, c.food.y);
        const m = toPage(c.mouth.x, c.mouth.y);
        await page.mouse.move(f.x, f.y);
        await page.mouse.down();
        await page.mouse.move((f.x + m.x) / 2, (f.y + m.y) / 2, { steps: 4 });
        await page.mouse.move(m.x, m.y, { steps: 4 });
        if (checkNear) await page.waitForTimeout(250);
        const nearFrame = await page.evaluate(() => window.game.scene.getScene('KitchenScene').any.frame.name);
        await page.mouse.up();
        await page.waitForTimeout(400);
        const afterDrop = await page.evaluate(() => {
            const s = window.game.scene.getScene('KitchenScene');
            return { frame: s.any.frame.name, foodVisible: s.food.visible };
        });
        return { nearFrame, afterDrop };
    };

    await seed({ hunger: 100, thirst: 100 });
    report.fullDual = await dropAtMouth(true);
    await pickFood('Manzana');
    report.fullDualManzana = await dropAtMouth(true);

    await seed({ hunger: 26, thirst: 100 });
    report.fullThirstAgua = await dropAtMouth(true);

    await seed({ hunger: 100, thirst: 50 });
    await pickFood('Manzana');
    report.partialDual = await dropAtMouth(true);
    await page.waitForFunction(() => window.game.scene.getScene('KitchenScene').food.visible, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    report.partialDual.thirstAfter = await page.evaluate(() => parseFloat(document.getElementById('fill-thirst').style.height) || 0);

    const ok = String(report.nearMouth.frame) === '1' && String(report.onBodyAwayFromMouth.frame) === '0' && report.droppedOnBody.foodAt[1] > 1000 && report.afterEating.foodVisible === true
        && String(report.fullDual.nearFrame) === '0' && String(report.fullDual.afterDrop.frame) === '0' && report.fullDual.afterDrop.foodVisible === true
        && String(report.fullDualManzana.nearFrame) === '0' && String(report.fullDualManzana.afterDrop.frame) === '0'
        && String(report.fullThirstAgua.nearFrame) === '0' && String(report.fullThirstAgua.afterDrop.frame) === '0'
        && String(report.partialDual.nearFrame) === '1' && report.partialDual.thirstAfter > 50;
    console.log(JSON.stringify(report, null, 1));
    console.log(ok ? 'KITCHEN TEST: PASS' : 'KITCHEN TEST: FAIL');
    await browser.close();
    server.close();
    process.exit(ok ? 0 : 1);
});

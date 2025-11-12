// --- Water ripple background effect ---
function spawnRipple() {
    const bg = document.getElementById('ripple-bg');
    if (!bg) return;
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const size = Math.random() * 80 + 80;
    const x = Math.random() * (window.innerWidth - size);
    const y = Math.random() * (window.innerHeight - size);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    bg.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}
function startRipples() {
    function loop() {
        spawnRipple();
        const next = Math.random() * 2000 + 1500;
        setTimeout(loop, next);
    }
    loop();
}
window.addEventListener('DOMContentLoaded', startRipples);

// --- Core Game Logic ---
const baseUpgrades = [
    { key: 'bucket', name: 'Bucket', desc: '+1/click', baseCost: 10, count: 0, type: 'click', increment: 1, costScale: 1.6 },
    { key: 'pump', name: 'Pump', desc: '+1/sec', baseCost: 25, count: 0, type: 'idle', increment: 1, costScale: 1.7 },
    { key: 'well', name: 'Well', desc: '+5/sec', baseCost: 100, count: 0, type: 'idle', increment: 5, costScale: 1.15 },
    { key: 'waterTower', name: 'Water Tower', desc: '+20/sec', baseCost: 500, count: 0, type: 'idle', increment: 20, costScale: 1.15 },
    { key: 'filtrationPlant', name: 'Filtration Plant', desc: '+100/sec', baseCost: 2500, count: 0, type: 'idle', increment: 100, costScale: 1.15 },
    { key: 'irrigationNetwork', name: 'Irrigation Network', desc: '+500/sec', baseCost: 10000, count: 0, type: 'idle', increment: 500, costScale: 1.15 },
    { key: 'reservoir', name: 'Reservoir', desc: '+2500/sec', baseCost: 50000, count: 0, type: 'idle', increment: 2500, costScale: 1.15 },
    { key: 'hydroelectricDam', name: 'Hydroelectric Dam', desc: '+10000/sec', baseCost: 250000, count: 0, type: 'idle', increment: 10000, costScale: 1.15 },
    { key: 'desalinationPlant', name: 'Desalination Plant', desc: '+50000/sec', baseCost: 1000000, count: 0, type: 'idle', increment: 50000, costScale: 1.15 },
    { key: 'orbitalCollector', name: 'Orbital Collector', desc: '+250000/sec', baseCost: 5000000, count: 0, type: 'idle', increment: 250000, costScale: 1.15 }
];

const gameState = {
    waterPoints: 0,
    perClick: 1,
    upgrades: [],
    difficulty: 'easy',
    activeEvents: []
};

const waterPointsEl = document.getElementById('water-points');
const waterDropletEl = document.getElementById('water-droplet');
const shopUpgradesEl = document.getElementById('shop-upgrades');
const waterPerSecondEl = document.getElementById('water-per-second');

// Difficulty multipliers
const difficultySettings = {
    easy: { costMult: 1.0, eventChance: 0 },
    medium: { costMult: 1.4, eventChance: 0 },
    hard: { costMult: 2.0, eventChance: 1 }
};

// Format numbers
function formatNumber(num) {
    return num.toLocaleString();
}

// Update UI
function updateUI() {
    waterPointsEl.textContent = formatNumber(gameState.waterPoints);
    gameState.upgrades.forEach((u) => {
        const costEl = document.getElementById(`${u.key}-cost`);
        const countEl = document.getElementById(`${u.key}-count`);
        const btnEl = document.getElementById(`buy-${u.key}`);
        if (costEl) costEl.textContent = formatNumber(u.cost);
        if (countEl) countEl.textContent = `Owned: ${u.count}`;
        if (btnEl) {
            if (gameState.waterPoints < u.cost) {
                btnEl.disabled = true;
                btnEl.classList.add('disabled');
            } else {
                btnEl.disabled = false;
                btnEl.classList.remove('disabled');
            }
        }
    });
    waterPerSecondEl.textContent = formatNumber(getPassiveIncome());
}

// Passive income
function getPassiveIncome() {
    return gameState.upgrades.filter(u => u.type === 'idle')
        .reduce((sum, u) => sum + u.count * u.increment, 0);
}

// Click handler
waterDropletEl.addEventListener('click', (e) => {
    e.preventDefault();
    gameState.waterPoints += gameState.perClick;
    updateUI();
});

// Create shop UI
function createShopUI() {
    shopUpgradesEl.innerHTML = '';
    gameState.upgrades.forEach((u) => {
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.id = `${u.key}-upgrade`;
        item.innerHTML = `
            <span><strong>${u.name}</strong> <span style="color: #1E90FF;">${u.desc}</span></span>
            <button id="buy-${u.key}">Buy (<span id="${u.key}-cost">${formatNumber(u.cost)}</span> drops)</button>
            <span id="${u.key}-count">Owned: ${u.count}</span>
        `;
        shopUpgradesEl.appendChild(item);
        setTimeout(() => {
            const btn = document.getElementById(`buy-${u.key}`);
            if (btn) btn.addEventListener('click', () => buyUpgrade(u.key));
        }, 0);
    });
}

// Buy upgrade
function buyUpgrade(key) {
    const u = gameState.upgrades.find(x => x.key === key);
    if (!u) return;
    if (gameState.waterPoints >= u.cost) {
        gameState.waterPoints -= u.cost;
        u.count++;
        if (u.type === 'click') gameState.perClick += u.increment;
        u.cost = Math.ceil(u.baseCost * Math.pow(u.costScale, u.count));
        updateUI();
    }
}

// Game loop
setInterval(() => {
    const passive = getPassiveIncome();
    if (passive > 0) gameState.waterPoints += passive;
    updateUI();
}, 1000);

// Difficulty setup
function startGame(mode) {
    const { costMult, eventChance } = difficultySettings[mode];
    gameState.difficulty = mode;
    gameState.upgrades = baseUpgrades.map(u => ({
        ...u,
        cost: Math.ceil(u.baseCost * costMult)
    }));
    document.getElementById('start-screen').style.display = 'none';
    createShopUI();
    updateUI();
    if (eventChance > 0) startEventSystem();
}

// Event system (Hard Mode)
function startEventSystem() {
    setInterval(() => {
        if (Math.random() < 0.3) triggerRandomEvent();
    }, Math.random() * 30000 + 30000); // every 30–60s
}

// Trigger random event
function triggerRandomEvent() {
    const events = [...positiveEvents, ...negativeEvents];
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    showEventBanner(event.name, event.desc);
    setTimeout(() => {
        if (event.revert) event.revert();
    }, event.duration || 15000);
}

// Visual feedback for events
function showEventBanner(title, desc) {
    let banner = document.createElement('div');
    banner.className = 'event-banner';
    banner.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}

// Events definitions
const positiveEvents = [
    {
        name: "Rainstorm!",
        desc: "Production doubles for 15 seconds.",
        duration: 15000,
        effect: () => gameState.perClick *= 2,
        revert: () => gameState.perClick /= 2
    },
    {
        name: "Charity Drive Success!",
        desc: "Upgrade costs reduced by 25% for 20 seconds.",
        duration: 20000,
        effect: () => gameState.upgrades.forEach(u => u.cost *= 0.75),
        revert: () => gameState.upgrades.forEach(u => u.cost /= 0.75)
    },
    {
        name: "Volunteer Surge!",
        desc: "Passive income triples for 10 seconds.",
        duration: 10000,
        effect: () => gameState.upgrades.forEach(u => { if (u.type === 'idle') u.increment *= 3; }),
        revert: () => gameState.upgrades.forEach(u => { if (u.type === 'idle') u.increment /= 3; })
    },
    {
        name: "Miracle Well Found!",
        desc: "Gain 5% of total lifetime drops instantly.",
        effect: () => gameState.waterPoints += gameState.waterPoints * 0.05
    }
];

const negativeEvents = [
    {
        name: "Drought",
        desc: "Passive income halved for 20 seconds.",
        duration: 20000,
        effect: () => gameState.upgrades.forEach(u => { if (u.type === 'idle') u.increment /= 2; }),
        revert: () => gameState.upgrades.forEach(u => { if (u.type === 'idle') u.increment *= 2; })
    },
    {
        name: "Broken Pump",
        desc: "One random idle upgrade loses 1 level temporarily.",
        duration: 15000,
        effect: () => {
            const idleUpgrades = gameState.upgrades.filter(u => u.type === 'idle' && u.count > 0);
            if (idleUpgrades.length === 0) return;
            const victim = idleUpgrades[Math.floor(Math.random() * idleUpgrades.length)];
            victim.count--;
            victim.tempLoss = true;
        },
        revert: () => {
            const lost = gameState.upgrades.find(u => u.tempLoss);
            if (lost) {
                lost.count++;
                delete lost.tempLoss;
            }
        }
    },
    {
        name: "Supply Shortage",
        desc: "All upgrade costs increase by 30% for 30 seconds.",
        duration: 30000,
        effect: () => gameState.upgrades.forEach(u => u.cost *= 1.3),
        revert: () => gameState.upgrades.forEach(u => u.cost /= 1.3)
    },
    {
        name: "Contaminated Source",
        desc: "Lose 10% of your current drops instantly.",
        effect: () => gameState.waterPoints *= 0.9
    }
];

// Start screen logic
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        startGame(mode);
    });
});

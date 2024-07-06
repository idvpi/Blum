// ==UserScript==
// @name         Blum Autoclicker
// @version      1.4
// @namespace    Violentmonkey Scripts
// @author       mudachyo
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Blum
// ==/UserScript==

let GAME_SETTINGS = {
    clickPercentage: Math.floor(Math.random() * 11) + 75, // Вероятность нажатия на элемент (цветок или бомбу) в процентах / Probability of clicking on an element (flower or bomb) in percentage
    minIceHits: Math.floor(Math.random() * 2) + 2, // Минимальное количество нажатий на заморозку / Minimum number of freeze hits
    minDelayMs: 2000, // Минимальная задержка между действиями в миллисекундах / Minimum delay between actions in milliseconds
    maxDelayMs: 5000, // Максимальная задержка между действиями в миллисекундах / Maximum delay between actions in milliseconds
};

let isGamePaused = false;

try {
    let gameStats = {
        score: 0,
        bombHits: 0,
        iceHits: 0,
        flowersClicked: 0,
        flowersSkipped: 0,
        bombsClicked: 0,
        bombsSkipped: 0,
        isGameOver: false,
    };

    const originalPush = Array.prototype.push;
    Array.prototype.push = function (...items) {
        if (!isGamePaused) {
            items.forEach(item => handleGameElement(item));
        }
        return originalPush.apply(this, items);
    };

    function handleGameElement(element) {
        if (!element || !element.item) return;

        const { type } = element.item;
        switch (type) {
            case "CLOVER":
                processFlower(element);
                break;
            case "BOMB":
                processBomb(element);
                break;
            case "FREEZE":
                processIce(element);
                break;
        }
    }

    function processFlower(element) {
        const shouldClick = Math.random() < (GAME_SETTINGS.clickPercentage / 100);
        if (shouldClick) {
            gameStats.score++;
            gameStats.flowersClicked++;
            clickElement(element);
        } else {
            gameStats.flowersSkipped++;
        }
    }

    function processBomb(element) {
        const shouldClick = Math.random() < (GAME_SETTINGS.clickPercentage / 100);
        if (shouldClick) {
            gameStats.score = 0;
            gameStats.bombsClicked++;
            clickElement(element);
        } else {
            gameStats.bombsSkipped++;
        }
    }

    function processIce(element) {
        if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
            clickElement(element);
            gameStats.iceHits++;
        }
    }

    function clickElement(element) {
        element.onClick(element);
        element.isExplosion = true;
        element.addedAt = performance.now();
    }

    function checkGameCompletion() {
        const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
        if (rewardElement && !gameStats.isGameOver) {
            gameStats.isGameOver = true;
            resetGameStats();
            resetGameSettings();
        }
    }

    function resetGameStats() {
        gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersClicked: 0,
            flowersSkipped: 0,
            bombsClicked: 0,
            bombsSkipped: 0,
            isGameOver: false,
        };
    }

    function resetGameSettings() {
        GAME_SETTINGS = {
            clickPercentage: Math.floor(Math.random() * 11) + 75,  // Вероятность нажатия на элемент (цветок или бомбу) в процентах / Probability of clicking on an element (flower or bomb) in percentage
            minIceHits: Math.floor(Math.random() * 2) + 2, // Минимальное количество нажатий на заморозку / Minimum number of freeze hits
            minDelayMs: 2000, // Минимальная задержка между действиями в миллисекундах / Minimum delay between actions in milliseconds
            maxDelayMs: 5000, // Максимальная задержка между действиями в миллисекундах / Maximum delay between actions in milliseconds
        };
    }

    function getRandomDelay() {
        return Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs) + GAME_SETTINGS.minDelayMs;
    }

    function getNewGameDelay() {
        return Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);
    }

    function checkAndClickPlayButton() {
        const playButton = document.querySelector('button.kit-button.is-large.is-primary');
        if (!isGamePaused && playButton && playButton.textContent.includes('Play')) {
            setTimeout(() => {
                playButton.click();
                gameStats.isGameOver = false;
            }, getNewGameDelay());
        }
    }

    function continuousPlayButtonCheck() {
        checkAndClickPlayButton();
        setTimeout(continuousPlayButtonCheck, 1000);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                checkGameCompletion();
            }
        }
    });

    const appElement = document.querySelector('#app');
    if (appElement) {
        observer.observe(appElement, { childList: true, subtree: true });
    }

    // continuousPlayButtonCheck();

    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.style.position = 'fixed';
    pauseButton.style.bottom = '20px';
    pauseButton.style.right = '20px';
    pauseButton.style.zIndex = '9999';
    pauseButton.style.padding = '4px 8px';
    pauseButton.style.backgroundColor = '#5d5abd';
    pauseButton.style.color = 'white';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '10px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.onclick = toggleGamePause;
    document.body.appendChild(pauseButton);

    function toggleGamePause() {
        isGamePaused = !isGamePaused;
        pauseButton.textContent = isGamePaused ? 'Resume' : 'Pause';
    }
} catch (e) {
}

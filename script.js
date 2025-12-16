document.addEventListener('DOMContentLoaded', function() {
    // ========== КОНСТАНТЫ И НАСТРОЙКИ ==========
    const GAME = {
        canvasWidth: 600,
        canvasHeight: 150,
        groundHeight: 10,
        groundY: 140,
        playerStartX: 50,
        playerWidth: 40,
        playerHeight: 40,
        playerJumpForce: 12,
        gravity: 0.6,
        initialSpeed: 5,
        speedIncrease: 0.001,
        cactusWidth: 20,
        minCactusHeight: 30,
        maxCactusHeight: 50,
        minCactusGap: 200,
        maxCactusGap: 400,
        cloudCount: 3
    };

    // ========== ПЕРЕМЕННЫЕ ИГРЫ ==========
    let canvas, ctx;
    let gameRunning = false;
    let gameSpeed = GAME.initialSpeed;
    let score = 0;
    let highScore = localStorage.getItem('dinoHighScore') || 0;
    let frames = 0;
    let gameLoopId = null;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // ========== ИГРОВЫЕ ОБЪЕКТЫ ==========
    let player = {
        x: GAME.playerStartX,
        y: GAME.groundY - GAME.playerHeight,
        width: GAME.playerWidth,
        height: GAME.playerHeight,
        velocityY: 0,
        isJumping: false,
        isDucking: false,
        duckHeight: 25
    };
    
    let obstacles = [];
    let clouds = [];
    
    // ========== ИЗОБРАЖЕНИЯ ==========
    let playerImg = new Image();
    let cactusImg = new Image();
    
    // ========== DOM ЭЛЕМЕНТЫ ==========
    let scoreElement, highScoreElement, speedElement;
    let startBtn, jumpBtn, resetBtn, restartBtn;
    let gameOverScreen, finalScoreElement;
    let canvasContainer;

    // ========== ИНИЦИАЛИЗАЦИЯ ИГРЫ ==========
    function init() {
        // Получаем элементы DOM
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        scoreElement = document.getElementById('score');
        highScoreElement = document.getElementById('highScore');
        speedElement = document.getElementById('speed');
        startBtn = document.getElementById('startBtn');
        jumpBtn = document.getElementById('jumpBtn');
        resetBtn = document.getElementById('resetBtn');
        restartBtn = document.getElementById('restartBtn');
        gameOverScreen = document.getElementById('gameOver');
        finalScoreElement = document.getElementById('finalScore');
        canvasContainer = document.querySelector('.game-area');
        
        // Настраиваем канвас
        canvas.width = GAME.canvasWidth;
        canvas.height = GAME.canvasHeight;
        
        // Загружаем картинку игрока
        playerImg.src = 'images/othcim.jpg';
        playerImg.onerror = function() {
            console.log("Изображение не найдено. Создаю стандартного динозаврика...");
            createDefaultPlayerImage();
        };
        
        // Создаем изображения
        createCactusImage();
        createClouds();
        
        // Устанавливаем начальные значения
        highScoreElement.textContent = highScore;
        speedElement.textContent = gameSpeed.toFixed(1) + 'x';
        
        // Настраиваем мобильное управление
        if (isMobile) {
            jumpBtn.style.display = 'block';
            jumpBtn.classList.add('jump-effect');
        }
        
        // Назначаем обработчики событий
        setupEventListeners();
        
        // Начинаем игровой цикл
        gameLoop();
        
        // Рисуем начальный экран
        drawStartScreen();
        
        // Показываем инструкцию
        setTimeout(() => {
            showMessage("Нажмите ПРОБЕЛ для начала игры");
        }, 500);
    }

    // ========== СОЗДАНИЕ ИЗОБРАЖЕНИЙ ==========
    function createDefaultPlayerImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.playerWidth;
        tempCanvas.height = GAME.playerHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Тело динозаврика (как в оригинале)
        tempCtx.fillStyle = '#535353';
        tempCtx.fillRect(5, 10, 30, 20);
        
        // Ноги
        tempCtx.fillRect(10, 30, 6, 10);
        tempCtx.fillRect(24, 30, 6, 10);
        
        // Голова и шея
        tempCtx.fillRect(30, 5, 8, 15);
        tempCtx.fillRect(35, 2, 10, 10);
        
        // Глаз
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(38, 4, 4, 4);
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(39, 5, 2, 2);
        
        // Хвост
        tempCtx.fillStyle = '#535353';
        tempCtx.fillRect(0, 15, 5, 4);
        tempCtx.fillRect(2, 19, 3, 2);
        
        playerImg.src = tempCanvas.toDataURL();
    }

    function createCactusImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.cactusWidth;
        tempCanvas.height = GAME.maxCactusHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Зеленый кактус
        tempCtx.fillStyle = '#0a0';
        tempCtx.fillRect(5, 0, 10, GAME.maxCactusHeight);
        
        // Полоски на кактусе
        tempCtx.fillStyle = '#080';
        tempCtx.fillRect(7, 5, 6, 3);
        tempCtx.fillRect(7, 15, 6, 3);
        tempCtx.fillRect(7, 25, 6, 3);
        
        // Шипы
        tempCtx.strokeStyle = '#060';
        tempCtx.lineWidth = 1;
        
        // Левые шипы
        tempCtx.beginPath();
        tempCtx.moveTo(5, 10);
        tempCtx.lineTo(2, 10);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(5, 20);
        tempCtx.lineTo(2, 20);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(5, 30);
        tempCtx.lineTo(2, 30);
        tempCtx.stroke();
        
        // Правые шипы
        tempCtx.beginPath();
        tempCtx.moveTo(15, 15);
        tempCtx.lineTo(18, 15);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(15, 25);
        tempCtx.lineTo(18, 25);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(15, 35);
        tempCtx.lineTo(18, 35);
        tempCtx.stroke();
        
        cactusImg.src = tempCanvas.toDataURL();
    }

    function createClouds() {
        clouds = [];
        for (let i = 0; i < GAME.cloudCount; i++) {
            clouds.push({
                x: Math.random() * GAME.canvasWidth,
                y: Math.random() * 50 + 20,
                width: Math.random() * 30 + 40,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    // ========== ОСНОВНЫЕ ФУНКЦИИ ИГРЫ ==========
    function startGame() {
        if (gameRunning) return;
        
        resetGame();
        gameRunning = true;
        startBtn.textContent = "ПАУЗА";
        gameOverScreen.style.display = 'none';
        
        // Эффект начала игры
        canvasContainer.classList.add('jump-effect');
        setTimeout(() => {
            canvasContainer.classList.remove('jump-effect');
        }, 300);
    }

    function togglePause() {
        if (!gameRunning) return;
        gameRunning = !gameRunning;
        startBtn.textContent = gameRunning ? "ПАУЗА" : "ПРОДОЛЖИТЬ";
        
        if (!gameRunning) {
            showMessage("Игра на паузе");
        }
    }

    function resetGame() {
        score = 0;
        gameSpeed = GAME.initialSpeed;
        obstacles = [];
        frames = 0;
        
        player.y = GAME.groundY - GAME.playerHeight;
        player.velocityY = 0;
        player.isJumping = false;
        player.isDucking = false;
        player.height = GAME.playerHeight;
        
        updateScore();
        speedElement.textContent = gameSpeed.toFixed(1) + 'x';
    }

    function gameOver() {
        gameRunning = false;
        startBtn.textContent = "НАЧАТЬ ЗАНОВО";
        
        // Обновляем рекорд
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('dinoHighScore', highScore);
            
            // Эффект нового рекорда
            highScoreElement.classList.add('new-high-score');
            setTimeout(() => {
                highScoreElement.classList.remove('new-high-score');
            }, 800);
            
            showMessage("🎉 Новый рекорд!");
        }
        
        // Показываем экран Game Over
        finalScoreElement.textContent = score;
        
        setTimeout(() => {
            gameOverScreen.style.display = 'block';
        }, 500);
    }

    // ========== ОБНОВЛЕНИЕ ИГРОВОГО СОСТОЯНИЯ ==========
    function update() {
        if (!gameRunning) return;
        
        frames++;
        
        // Увеличиваем скорость со временем
        gameSpeed += GAME.speedIncrease;
        if (frames % 10 === 0) {
            speedElement.textContent = gameSpeed.toFixed(1) + 'x';
            
            // Эффект увеличения скорости
            if (frames % 500 === 0) {
                speedElement.classList.add('speed-up');
                setTimeout(() => {
                    speedElement.classList.remove('speed-up');
                }, 500);
                showMessage("Скорость увеличена!");
            }
        }
        
        // Обновляем игрока
        updatePlayer();
        
        // Обновляем препятствия
        updateObstacles();
        
        // Обновляем облака
        updateClouds();
        
        // Увеличиваем счет
        score += 1;
        if (frames % 5 === 0) {
            updateScore();
        }
        
        // Проверяем столкновения
        checkCollisions();
    }

    function updatePlayer() {
        // Применяем гравитацию
        if (player.isJumping) {
            player.velocityY -= GAME.gravity;
            player.y -= player.velocityY;
            
            // Проверяем, достиг ли игрок земли
            if (player.y >= GAME.groundY - player.height) {
                player.y = GAME.groundY - player.height;
                player.isJumping = false;
                player.velocityY = 0;
            }
        }
    }

    function updateObstacles() {
        // Удаляем препятствия, которые ушли за экран
        obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
        
        // Двигаем препятствия
        for (let obstacle of obstacles) {
            obstacle.x -= gameSpeed;
            
            // Отмечаем пройденные препятствия
            if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
                obstacle.passed = true;
                score += 100;
                scoreElement.classList.add('score-increase');
                setTimeout(() => {
                    scoreElement.classList.remove('score-increase');
                }, 300);
            }
        }
        
        // Создаем новые препятствия
        if (frames % Math.floor((GAME.maxCactusGap - frames * 0.1) / gameSpeed) === 0) {
            createObstacle();
        }
    }

    function createObstacle() {
        const height = Math.floor(Math.random() * 
            (GAME.maxCactusHeight - GAME.minCactusHeight)) + 
            GAME.minCactusHeight;
        
        obstacles.push({
            x: GAME.canvasWidth,
            y: GAME.groundY - height,
            width: GAME.cactusWidth,
            height: height,
            passed: false
        });
    }

    function updateClouds() {
        for (let cloud of clouds) {
            cloud.x -= cloud.speed;
            
            // Если облако ушло за экран, перемещаем его в начало
            if (cloud.x + cloud.width < 0) {
                cloud.x = GAME.canvasWidth;
                cloud.y = Math.random() * 50 + 20;
            }
        }
    }

    function checkCollisions() {
        for (let obstacle of obstacles) {
            if (checkCollision(player, obstacle)) {
                gameOver();
                return;
            }
        }
    }

    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // ========== УПРАВЛЕНИЕ ==========
    function jump() {
        if (!gameRunning) {
            startGame();
            return;
        }
        
        if (!player.isJumping) {
            player.isJumping = true;
            player.velocityY = GAME.playerJumpForce;
            player.isDucking = false;
            player.height = GAME.playerHeight;
            
            // Эффект прыжка на мобильном
            if (isMobile) {
                jumpBtn.classList.add('jump-effect');
                setTimeout(() => {
                    jumpBtn.classList.remove('jump-effect');
                }, 300);
            }
        }
    }

    function duck(startDucking) {
        if (!gameRunning || player.isJumping) return;
        
        player.isDucking = startDucking;
        player.height = startDucking ? player.duckHeight : GAME.playerHeight;
        player.y = startDucking ? GAME.groundY - player.duckHeight : 
                                 GAME.groundY - GAME.playerHeight;
    }

    // ========== ОТРИСОВКА ==========
    function draw() {
        // Очищаем канвас
        ctx.clearRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
        
        // Рисуем фон (небо)
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
        
        // Рисуем облака
        drawClouds();
        
        // Рисуем землю
        drawGround();
        
        // Рисуем игрока
        drawPlayer();
        
        // Рисуем препятствия
        drawObstacles();
        
        // Рисуем счет
        drawScore();
        
        // Если игра не запущена, рисуем инструкцию
        if (!gameRunning && obstacles.length === 0) {
            drawStartScreen();
        }
    }

    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ДИНОЗАВРИК', GAME.canvasWidth / 2, 50);
        
        ctx.font = '16px Arial';
        ctx.fillText('Нажмите ПРОБЕЛ чтобы начать', GAME.canvasWidth / 2, 80);
        
        ctx.font = '14px Arial';
        ctx.fillText('ПРОБЕЛ или СТРЕЛКА ВВЕРХ - прыжок', GAME.canvasWidth / 2, 110);
        ctx.fillText('СТРЕЛКА ВНИЗ - пригнуться', GAME.canvasWidth / 2, 130);
    }

    function drawGround() {
        // Земля
        ctx.fillStyle = '#535353';
        ctx.fillRect(0, GAME.groundY, GAME.canvasWidth, GAME.groundHeight);
        
        // Линия горизонта
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, GAME.groundY);
        ctx.lineTo(GAME.canvasWidth, GAME.groundY);
        ctx.stroke();
        
        // Текстура земли
        ctx.fillStyle = '#666';
        for (let i = 0; i < GAME.canvasWidth; i += 20) {
            ctx.fillRect(i, GAME.groundY, 2, 3);
        }
    }

    function drawClouds() {
        for (let cloud of clouds) {
            ctx.fillStyle = '#f0f0f0';
            
            // Рисуем пушистое облако
            ctx.beginPath();
            ctx.arc(cloud.x + 10, cloud.y, 8, 0, Math.PI * 2);
            ctx.arc(cloud.x + 20, cloud.y - 5, 10, 0, Math.PI * 2);
            ctx.arc(cloud.x + 30, cloud.y, 8, 0, Math.PI * 2);
            ctx.arc(cloud.x + 20, cloud.y + 5, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPlayer() {
        // Рисуем картинку игрока
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        // Если игрок пригнулся, рисуем дополнительную линию
        if (player.isDucking) {
            ctx.fillStyle = '#535353';
            ctx.fillRect(player.x + 5, player.y + player.height - 5, player.width - 10, 3);
        }
        
        // Тень под игроком
        if (player.isJumping) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                player.x + player.width/2, 
                GAME.groundY, 
                player.width/2, 
                3, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    function drawObstacles() {
        for (let obstacle of obstacles) {
            // Рисуем кактус
            ctx.drawImage(cactusImg, 0, cactusImg.height - obstacle.height, 
                obstacle.width, obstacle.height,
                obstacle.x, obstacle.y, 
                obstacle.width, obstacle.height);
            
            // Тень под кактусом
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(
                obstacle.x + 2, 
                GAME.groundY, 
                obstacle.width - 4, 
                3
            );
        }
    }

    function drawScore() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 100, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`СЧЕТ: ${Math.floor(score/10)}`, 20, 30);
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateScore() {
        scoreElement.textContent = Math.floor(score / 10);
    }

    function showMessage(text) {
        // Создаем временное сообщение
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease;
            pointer-events: none;
        `;
        
        // Добавляем стиль для анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        
        message.textContent = text;
        document.body.appendChild(message);
        
        // Удаляем сообщение через 2 секунды
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }

    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function setupEventListeners() {
        // Клавиатура
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Кнопки
        startBtn.addEventListener('click', handleStartClick);
        jumpBtn.addEventListener('click', jump);
        resetBtn.addEventListener('click', handleResetClick);
        restartBtn.addEventListener('click', startGame);
        
        // Клик по канвасу
        canvas.addEventListener('click', handleCanvasClick);
        
        // Касания для мобильных
        canvas.addEventListener('touchstart', handleTouchStart);
        
        // Изменение размера окна
        window.addEventListener('resize', handleResize);
        
        // Предотвращаем контекстное меню на канвасе
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    function handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (!gameRunning && obstacles.length === 0) {
                    startGame();
                } else if (gameRunning) {
                    jump();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                jump();
                break;
            case 'ArrowDown':
                e.preventDefault();
                duck(true);
                break;
            case 'KeyP':
                if (gameRunning) {
                    togglePause();
                }
                break;
            case 'Escape':
                if (gameRunning) {
                    togglePause();
                }
                break;
        }
    }

    function handleKeyUp(e) {
        if (e.code === 'ArrowDown') {
            duck(false);
        }
    }

    function handleStartClick() {
        if (!gameRunning) {
            startGame();
        } else {
            togglePause();
        }
    }

    function handleResetClick() {
        resetGame();
        gameRunning = false;
        startBtn.textContent = "НАЧАТЬ ИГРУ";
        gameOverScreen.style.display = 'none';
        drawStartScreen();
        showMessage("Игра сброшена");
    }

    function handleCanvasClick() {
        if (!gameRunning) {
            startGame();
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            jump();
        }
    }

    function handleResize() {
        // Масштабируем канвас для мобильных устройств
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = GAME.canvasWidth / GAME.canvasHeight;
        const newWidth = Math.min(GAME.canvasWidth, containerWidth);
        const newHeight = newWidth / aspectRatio;
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    }

    // ========== ИГРОВОЙ ЦИКЛ ==========
    function gameLoop() {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ========== ЗАПУСК ИГРЫ ==========
    // Ждем загрузки изображений
    let imagesLoaded = 0;
    const totalImages = 2; // playerImg и cactusImg
    
    function checkAllImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            init();
        }
    }
    
    playerImg.onload = checkAllImagesLoaded;
    cactusImg.onload = checkAllImagesLoaded;
    
    // Таймаут на случай проблем с загрузкой
    setTimeout(() => {
        if (!gameLoopId) {
            console.log("Загрузка изображений...");
            init();
        }
    }, 2000);
    
    // Запускаем игру при полной загрузке страницы
    if (document.readyState === 'complete') {
        setTimeout(init, 100);
    }
});

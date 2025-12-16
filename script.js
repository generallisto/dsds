document.addEventListener('DOMContentLoaded', function() {
    // ========== НАСТРОЙКИ ИГРЫ ==========
    const GAME = {
        playerWidth: 120,           // Очень большой размер для 1920x1080
        playerHeight: 120,          // Очень большой размер
        playerJumpForce: 18,        // Высокий прыжок
        gravity: 0.9,
        initialSpeed: 10,
        speedIncrease: 0.0003,
        cactusWidth: 40,           // Большие кактусы
        minCactusHeight: 70,
        maxCactusHeight: 120,
        minCactusGap: 350,
        maxCactusGap: 550,
        groundHeight: 30,
        cloudCount: 5
    };

    // ========== ПЕРЕМЕННЫЕ ИГРЫ ==========
    let canvas, ctx;
    let gameRunning = false;
    let gameSpeed = GAME.initialSpeed;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
    let frames = 0;
    let fps = 60;
    let lastFpsUpdate = 0;
    let fpsFrameCount = 0;
    let gameLoopId = null;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // ========== ИГРОВЫЕ ОБЪЕКТЫ ==========
    let player = {
        x: 200,
        y: 0,
        width: GAME.playerWidth,
        height: GAME.playerHeight,
        velocityY: 0,
        isJumping: false,
        isDucking: false,
        duckHeight: GAME.playerHeight * 0.6,
        groundY: 0
    };
    
    let obstacles = [];
    let clouds = [];
    
    // ========== ИЗОБРАЖЕНИЯ ==========
    let playerImg = new Image();
    let cactusImg = new Image();
    
    // ========== DOM ЭЛЕМЕНТЫ ==========
    let scoreElement, highScoreElement, fpsElement;
    let jumpBtn, restartBtn, startBtn;
    let gameOverScreen, finalScoreElement;
    let startScreen;

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log("🚀 Инициализация игры...");
        
        // Получаем элементы
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        scoreElement = document.getElementById('score');
        highScoreElement = document.getElementById('highScore');
        fpsElement = document.getElementById('fps');
        jumpBtn = document.querySelector('.mobile-jump-btn');
        restartBtn = document.querySelector('.game-over button');
        startBtn = document.querySelector('.start-screen button');
        gameOverScreen = document.querySelector('.game-over');
        finalScoreElement = gameOverScreen.querySelector('p span');
        startScreen = document.querySelector('.start-screen');
        
        // Устанавливаем размеры канваса
        resizeCanvas();
        
        // Загружаем картинку игрока
        playerImg.src = 'images/othcim.jpg';
        playerImg.crossOrigin = "anonymous";
        playerImg.onload = function() {
            console.log("✅ Картинка игрока загружена");
            createCactusImage();
            startGameAfterLoad();
        };
        playerImg.onerror = function() {
            console.log("❌ Картинка не найдена, создаю динозаврика...");
            createDefaultPlayerImage();
            createCactusImage();
            startGameAfterLoad();
        };
        
        // Настраиваем управление
        setupControls();
        
        // Создаем облака
        createClouds();
        
        // Обновляем рекорд
        updateHighScore();
        
        // Показываем стартовый экран на ПК
        if (!isMobile) {
            startScreen.style.display = 'flex';
        }
        
        console.log("🎮 Игра готова!");
    }

    function startGameAfterLoad() {
        // Устанавливаем позицию земли
        player.groundY = canvas.height - GAME.groundHeight - player.height;
        player.y = player.groundY;
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Обновляем позицию земли
        if (player) {
            player.groundY = canvas.height - GAME.groundHeight - player.height;
            if (!player.isJumping) {
                player.y = player.groundY;
            }
        }
        
        console.log(`📐 Размер экрана: ${canvas.width}x${canvas.height}`);
    }

    // ========== СОЗДАНИЕ ИЗОБРАЖЕНИЙ ==========
    function createDefaultPlayerImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.playerWidth;
        tempCanvas.height = GAME.playerHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Очень большой динозаврик для 1920x1080
        tempCtx.fillStyle = '#535353';
        
        // Тело
        tempCtx.fillRect(20, 30, 80, 60);
        
        // Ноги
        tempCtx.fillRect(30, 90, 20, 30);
        tempCtx.fillRect(70, 90, 20, 30);
        
        // Голова и шея
        tempCtx.fillRect(90, 15, 25, 45);
        tempCtx.fillRect(105, 5, 30, 30);
        
        // Глаз
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(115, 12, 12, 12);
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(118, 15, 6, 6);
        
        // Хвост
        tempCtx.fillStyle = '#535353';
        tempCtx.fillRect(0, 45, 15, 12);
        tempCtx.fillRect(6, 57, 9, 6);
        
        // Улыбка
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 3;
        tempCtx.beginPath();
        tempCtx.arc(115, 35, 10, 0, Math.PI);
        tempCtx.stroke();
        
        playerImg.src = tempCanvas.toDataURL();
    }

    function createCactusImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.cactusWidth;
        tempCanvas.height = GAME.maxCactusHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Большой кактус
        tempCtx.fillStyle = '#0a0';
        tempCtx.fillRect(12, 0, 16, GAME.maxCactusHeight);
        
        // Полоски
        tempCtx.fillStyle = '#080';
        tempCtx.fillRect(14, 15, 12, 8);
        tempCtx.fillRect(14, 45, 12, 8);
        tempCtx.fillRect(14, 75, 12, 8);
        
        // Шипы
        tempCtx.strokeStyle = '#060';
        tempCtx.lineWidth = 2;
        
        // Левые шипы
        tempCtx.beginPath();
        tempCtx.moveTo(12, 30);
        tempCtx.lineTo(4, 30);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(12, 60);
        tempCtx.lineTo(4, 60);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(12, 90);
        tempCtx.lineTo(4, 90);
        tempCtx.stroke();
        
        // Правые шипы
        tempCtx.beginPath();
        tempCtx.moveTo(28, 45);
        tempCtx.lineTo(36, 45);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(28, 75);
        tempCtx.lineTo(36, 75);
        tempCtx.stroke();
        
        tempCtx.beginPath();
        tempCtx.moveTo(28, 105);
        tempCtx.lineTo(36, 105);
        tempCtx.stroke();
        
        cactusImg.src = tempCanvas.toDataURL();
    }

    function createClouds() {
        clouds = [];
        for (let i = 0; i < GAME.cloudCount; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 200 + 50,
                width: Math.random() * 100 + 100,
                speed: Math.random() * 1 + 0.5
            });
        }
    }

    // ========== УПРАВЛЕНИЕ ИГРОЙ ==========
    function startGame() {
        if (gameRunning) return;
        
        resetGame();
        gameRunning = true;
        gameOverScreen.style.display = 'none';
        startScreen.style.display = 'none';
        
        console.log("▶️ Игра начата!");
    }

    function resetGame() {
        score = 0;
        gameSpeed = GAME.initialSpeed;
        obstacles = [];
        frames = 0;
        fpsFrameCount = 0;
        lastFpsUpdate = Date.now();
        
        player.y = player.groundY;
        player.velocityY = 0;
        player.isJumping = false;
        player.isDucking = false;
        player.height = GAME.playerHeight;
        
        updateScore();
        updateFPS();
    }

    function gameOver() {
        gameRunning = false;
        gameOverScreen.style.display = 'flex';
        
        // Обновляем рекорд
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('dinoHighScore', highScore);
            updateHighScore();
            highScoreElement.classList.add('new-record');
            setTimeout(() => {
                highScoreElement.classList.remove('new-record');
            }, 3000);
        }
        
        // Показываем итоговый счет
        finalScoreElement.textContent = formatNumber(score);
        
        console.log("💀 Игра окончена! Счет:", score);
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========
    function update() {
        if (!gameRunning) return;
        
        frames++;
        fpsFrameCount++;
        
        // Обновляем FPS каждую секунду
        const now = Date.now();
        if (now - lastFpsUpdate >= 1000) {
            fps = Math.round((fpsFrameCount * 1000) / (now - lastFpsUpdate));
            fps = Math.min(fps, 3334444); // Ограничиваем максимальное значение
            updateFPS();
            fpsFrameCount = 0;
            lastFpsUpdate = now;
        }
        
        // Увеличиваем скорость
        gameSpeed += GAME.speedIncrease;
        
        // Обновляем игрока
        updatePlayer();
        
        // Обновляем препятствия
        updateObstacles();
        
        // Обновляем облака
        updateClouds();
        
        // Увеличиваем счет
        score += Math.max(1, Math.floor(gameSpeed / 2));
        updateScore();
        
        // Проверяем столкновения
        checkCollisions();
    }

    function updatePlayer() {
        if (player.isJumping) {
            player.velocityY -= GAME.gravity;
            player.y -= player.velocityY;
            
            if (player.y >= player.groundY) {
                player.y = player.groundY;
                player.isJumping = false;
                player.velocityY = 0;
            }
        }
    }

    function updateObstacles() {
        // Удаляем вышедшие за экран
        obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
        
        // Двигаем препятствия
        for (let obstacle of obstacles) {
            obstacle.x -= gameSpeed;
            
            // Отмечаем пройденные
            if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
                obstacle.passed = true;
                score += 150;
                scoreElement.classList.add('score-pop');
                setTimeout(() => {
                    scoreElement.classList.remove('score-pop');
                }, 400);
            }
        }
        
        // Создаем новые препятствия
        if (frames % Math.floor(GAME.maxCactusGap / (gameSpeed * 0.5)) === 0) {
            createObstacle();
        }
    }

    function createObstacle() {
        const height = Math.floor(Math.random() * 
            (GAME.maxCactusHeight - GAME.minCactusHeight)) + 
            GAME.minCactusHeight;
        
        obstacles.push({
            x: canvas.width,
            y: canvas.height - GAME.groundHeight - height,
            width: GAME.cactusWidth,
            height: height,
            passed: false
        });
    }

    function updateClouds() {
        for (let cloud of clouds) {
            cloud.x -= cloud.speed * 0.5;
            
            if (cloud.x + cloud.width < 0) {
                cloud.x = canvas.width;
                cloud.y = Math.random() * 200 + 50;
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
        }
    }

    function duck(startDucking) {
        if (!gameRunning || player.isJumping) return;
        
        player.isDucking = startDucking;
        player.height = startDucking ? player.duckHeight : GAME.playerHeight;
        player.y = startDucking ? 
            player.groundY + (GAME.playerHeight - player.duckHeight) : 
            player.groundY;
    }

    // ========== ОТРИСОВКА ==========
    function draw() {
        // Очищаем экран
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем фон
        drawBackground();
        
        // Рисуем облака
        drawClouds();
        
        // Рисуем землю
        drawGround();
        
        // Рисуем препятствия
        drawObstacles();
        
        // Рисуем игрока
        drawPlayer();
    }

    function drawBackground() {
        // Градиентное небо
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Солнце
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 100, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Лучи солнца
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            ctx.beginPath();
            ctx.moveTo(
                canvas.width - 100 + Math.cos(angle) * 70,
                100 + Math.sin(angle) * 70
            );
            ctx.lineTo(
                canvas.width - 100 + Math.cos(angle) * 100,
                100 + Math.sin(angle) * 100
            );
            ctx.stroke();
        }
    }

    function drawClouds() {
        for (let cloud of clouds) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            
            // Большие пушистые облака
            ctx.beginPath();
            ctx.arc(cloud.x + 30, cloud.y, 25, 0, Math.PI * 2);
            ctx.arc(cloud.x + 60, cloud.y - 15, 35, 0, Math.PI * 2);
            ctx.arc(cloud.x + 90, cloud.y, 25, 0, Math.PI * 2);
            ctx.arc(cloud.x + 60, cloud.y + 15, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGround() {
        // Земля
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, GAME.groundHeight);
        
        // Трава сверху
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, 5);
        
        // Текстура земли
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < canvas.width; i += 50) {
            ctx.fillRect(i, canvas.height - GAME.groundHeight + 5, 3, GAME.groundHeight - 5);
        }
    }

    function drawPlayer() {
        // Рисуем картинку игрока (очень большую)
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        // Тень под игроком
        if (player.isJumping) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                player.x + player.width/2,
                canvas.height - GAME.groundHeight,
                player.width/3,
                8,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Если пригнулся
        if (player.isDucking) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(
                player.x + 20,
                player.y + player.height - 15,
                player.width - 40,
                10
            );
        }
    }

    function drawObstacles() {
        for (let obstacle of obstacles) {
            // Рисуем кактус
            ctx.drawImage(
                cactusImg,
                0, cactusImg.height - obstacle.height,
                obstacle.width, obstacle.height,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
            );
            
            // Тень под кактусом
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(
                obstacle.x + 5,
                canvas.height - GAME.groundHeight,
                obstacle.width - 10,
                10
            );
            
            // Колючки эффект
            ctx.strokeStyle = '#060';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const y = obstacle.y + 20 + i * 30;
                if (y < obstacle.y + obstacle.height - 10) {
                    ctx.beginPath();
                    ctx.moveTo(obstacle.x, y);
                    ctx.lineTo(obstacle.x - 8, y);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(obstacle.x + obstacle.width, y + 15);
                    ctx.lineTo(obstacle.x + obstacle.width + 8, y + 15);
                    ctx.stroke();
                }
            }
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateScore() {
        scoreElement.textContent = formatNumber(score);
    }

    function updateHighScore() {
        highScoreElement.textContent = formatNumber(highScore);
    }

    function updateFPS() {
        fpsElement.textContent = formatNumber(fps);
        
        // Эффект при изменении FPS
        if (fps < 30) {
            fpsElement.style.color = '#ff4444';
        } else if (fps < 50) {
            fpsElement.style.color = '#ff9800';
        } else {
            fpsElement.style.color = '#4CAF50';
        }
    }

    function formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // ========== УПРАВЛЕНИЕ ==========
    function setupControls() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                case 'ArrowUp':
                    e.preventDefault();
                    jump();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    duck(true);
                    break;
                case 'Enter':
                    if (!gameRunning && gameOverScreen.style.display === 'flex') {
                        startGame();
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                duck(false);
            }
        });
        
        // Кнопки
        if (jumpBtn) {
            jumpBtn.addEventListener('click', jump);
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                jump();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', startGame);
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }
        
        // Клик по канвасу (старт на ПК)
        canvas.addEventListener('click', (e) => {
            if (!gameRunning && !isMobile) {
                startGame();
            }
        });
        
        // Изменение размера окна
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        
        // Предотвращаем контекстное меню
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Предотвращаем скролл на мобильных
        document.addEventListener('touchmove', (e) => {
            if (e.target === canvas || e.target === jumpBtn) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ========== ИГРОВОЙ ЦИКЛ ==========
    function gameLoop(timestamp) {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ========== ЗАПУСК ==========
    // Ждем полной загрузки страницы
    window.addEventListener('load', function() {
        setTimeout(init, 100);
    });
    
    // Аварийный запуск
    setTimeout(() => {
        if (!gameLoopId) {
            console.log("⚠️ Аварийный запуск игры...");
            init();
        }
    }, 2000);
});

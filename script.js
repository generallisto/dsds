document.addEventListener('DOMContentLoaded', function() {
    // ========== НАСТРОЙКИ ИГРЫ - ЕГИПЕТСКАЯ НОЧЬ ==========
    const GAME = {
        playerWidth: 80,
        playerHeight: 80,
        playerJumpForce: 12,        // Нормальная сила прыжка
        gravity: 0.5,              // Легкая гравитация
        initialSpeed: 3,           // ОЧЕНЬ МЕДЛЕННАЯ начальная скорость
        speedIncrease: 0.00001,    // ОЧЕНЬ МЕДЛЕННОЕ ускорение
        obstacleWidth: 25,
        minObstacleHeight: 30,     // ОЧЕНЬ НИЗКИЕ препятствия
        maxObstacleHeight: 45,     // ТОЛЬКО НИЗКИЕ!
        minObstacleGap: 600,       // ОГРОМНОЕ расстояние
        maxObstacleGap: 1000,      // ОЧЕНЬ БОЛЬШОЕ расстояние
        groundHeight: 40,
        starCount: 60,
        moonSize: 80
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
        x: 150,
        y: 0,
        width: GAME.playerWidth,
        height: GAME.playerHeight,
        velocityY: 0,
        isJumping: false,
        isDucking: false,
        duckHeight: GAME.playerHeight * 0.6,
        groundY: 0
    };
    
    let obstacles = [];            // Только НИЗКИЕ препятствия
    let stars = [];
    
    // ========== ИЗОБРАЖЕНИЯ ==========
    let playerImg = new Image();
    let obstacleImg = new Image();
    
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
        restartBtn = document.getElementById('restartBtn');
        startBtn = document.getElementById('startBtn');
        gameOverScreen = document.querySelector('.game-over');
        finalScoreElement = gameOverScreen.querySelector('p span');
        startScreen = document.querySelector('.start-screen');
        
        // Устанавливаем размеры канваса
        resizeCanvas();
        
        // Загружаем картинку игрока
        playerImg.src = 'images/othcim.jpg';
        playerImg.crossOrigin = "anonymous";
        
        playerImg.onload = function() {
            console.log("✅ Картинка загружена");
            createObstacleImage();
            startGameAfterLoad();
        };
        
        playerImg.onerror = function() {
            console.log("❌ Картинка не найдена, создаю динозаврика...");
            createDefaultPlayerImage();
            createObstacleImage();
            startGameAfterLoad();
        };
        
        // Настраиваем управление
        setupControls();
        
        // Создаем звезды
        createStars();
        
        // Обновляем рекорд
        updateHighScore();
        
        // На ПК показываем стартовый экран
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
        
        // Пересоздаем звезды
        createStars();
    }

    // ========== СОЗДАНИЕ ИЗОБРАЖЕНИЙ ==========
    function createDefaultPlayerImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.playerWidth;
        tempCanvas.height = GAME.playerHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Простой динозаврик
        tempCtx.fillStyle = '#8B4513';
        tempCtx.fillRect(20, 20, 40, 40);
        
        // Ноги
        tempCtx.fillRect(25, 60, 10, 20);
        tempCtx.fillRect(45, 60, 10, 20);
        
        // Голова
        tempCtx.fillRect(55, 15, 20, 25);
        
        // Глаз
        tempCtx.fillStyle = '#FFD700';
        tempCtx.fillRect(60, 20, 8, 8);
        
        playerImg.src = tempCanvas.toDataURL();
    }

    function createObstacleImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.obstacleWidth;
        tempCanvas.height = GAME.maxObstacleHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Простой камень/препятствие
        tempCtx.fillStyle = '#8B7355';
        tempCtx.fillRect(5, 10, 15, GAME.maxObstacleHeight - 10);
        
        // Верх
        tempCtx.fillStyle = '#D4AF37';
        tempCtx.fillRect(5, 5, 15, 5);
        
        obstacleImg.src = tempCanvas.toDataURL();
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < GAME.starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.3
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
        }
        
        // Показываем итоговый счет
        finalScoreElement.textContent = Math.floor(score);
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========
    function update() {
        if (!gameRunning) return;
        
        frames++;
        fpsFrameCount++;
        
        // Обновляем FPS
        const now = Date.now();
        if (now - lastFpsUpdate >= 1000) {
            fps = Math.round((fpsFrameCount * 1000) / (now - lastFpsUpdate));
            updateFPS();
            fpsFrameCount = 0;
            lastFpsUpdate = now;
        }
        
        // ОЧЕНЬ МЕДЛЕННО увеличиваем скорость
        if (frames % 300 === 0) {
            gameSpeed += GAME.speedIncrease;
        }
        
        // Обновляем игрока
        updatePlayer();
        
        // Обновляем препятствия (РЕДКО!)
        updateObstacles();
        
        // Увеличиваем счет
        score += 0.3;
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
                score += 20;
                scoreElement.classList.add('score-pop');
                setTimeout(() => scoreElement.classList.remove('score-pop'), 300);
            }
        }
        
        // Создаем новые препятствия ОЧЕНЬ РЕДКО
        if (frames % 200 === 0 && obstacles.length < 2) {
            const lastObstacle = obstacles[obstacles.length - 1];
            if (!lastObstacle || (canvas.width - lastObstacle.x) > GAME.minObstacleGap) {
                createObstacle();
            }
        }
    }

    function createObstacle() {
        // ТОЛЬКО НИЗКИЕ!
        const height = Math.floor(Math.random() * 
            (GAME.maxObstacleHeight - GAME.minObstacleHeight)) + 
            GAME.minObstacleHeight;
        
        obstacles.push({
            x: canvas.width,
            y: canvas.height - GAME.groundHeight - height,
            width: GAME.obstacleWidth,
            height: height,
            passed: false
        });
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
        
        // Рисуем фон (ночное небо Египта)
        drawNightSky();
        
        // Рисуем звезды
        drawStars();
        
        // Рисуем луну
        drawMoon();
        
        // Рисуем песок (оранжево-желтый)
        drawSand();
        
        // Рисуем препятствия
        drawObstacles();
        
        // Рисуем игрока
        drawPlayer();
    }

    function drawNightSky() {
        // Темно-синее ночное небо
        ctx.fillStyle = '#0c1445';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Немного градиента
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0c1445');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    }

    function drawStars() {
        for (let star of stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawMoon() {
        // Луна
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 80, GAME.moonSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Кратеры
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(canvas.width - 120, 60, 10, 0, Math.PI * 2);
        ctx.arc(canvas.width - 80, 100, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Свечение луны
        ctx.fillStyle = 'rgba(255, 248, 220, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 80, GAME.moonSize + 30, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSand() {
        // Оранжево-желтый египетский песок
        const sandGradient = ctx.createLinearGradient(0, canvas.height - GAME.groundHeight, 0, canvas.height);
        sandGradient.addColorStop(0, '#D4AF37');
        sandGradient.addColorStop(1, '#B8860B');
        
        ctx.fillStyle = sandGradient;
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, GAME.groundHeight);
        
        // Простые волны песка
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < canvas.width; i += 50) {
            const waveHeight = Math.sin(i * 0.02) * 5 + 5;
            ctx.fillRect(i, canvas.height - GAME.groundHeight, 40, waveHeight);
        }
    }

    function drawPlayer() {
        // Рисуем картинку игрока
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        // Простая тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(
            player.x + 10,
            canvas.height - GAME.groundHeight,
            player.width - 20,
            5
        );
    }

    function drawObstacles() {
        for (let obstacle of obstacles) {
            const actualHeight = Math.min(obstacle.height, GAME.maxObstacleHeight);
            ctx.drawImage(
                obstacleImg,
                0, obstacleImg.height - actualHeight,
                obstacle.width, actualHeight,
                obstacle.x, obstacle.y,
                obstacle.width, actualHeight
            );
            
            // Тень
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(
                obstacle.x + 5,
                canvas.height - GAME.groundHeight,
                obstacle.width - 10,
                4
            );
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateScore() {
        scoreElement.textContent = Math.floor(score);
    }

    function updateHighScore() {
        highScoreElement.textContent = Math.floor(highScore);
    }

    function updateFPS() {
        fpsElement.textContent = fps;
        
        // Цвет FPS
        if (fps < 30) {
            fpsElement.style.color = '#ff4444';
        } else if (fps < 50) {
            fpsElement.style.color = '#ff9800';
        } else {
            fpsElement.style.color = '#FF6B6B';
        }
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
        
        // Предотвращаем контекстное меню
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ========== ИГРОВОЙ ЦИКЛ ==========
    function gameLoop(timestamp) {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ========== ЗАПУСК ==========
    // Ждем загрузки
    window.addEventListener('load', function() {
        setTimeout(init, 100);
    });
    
    // Аварийный запуск
    setTimeout(() => {
        if (!gameLoopId) {
            console.log("⚠️ Запуск игры...");
            init();
        }
    }, 2000);
});

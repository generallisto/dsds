document.addEventListener('DOMContentLoaded', function() {
    // ========== НАСТРОЙКИ ИГРЫ ==========
    const GAME = {
        playerWidth: 60,
        playerHeight: 60,
        playerJumpForce: 12,
        gravity: 0.5,
        initialSpeed: 4,           // Нормальная скорость
        speedIncrease: 0.00001,    // Очень медленное ускорение
        obstacleWidth: 22,
        minObstacleHeight: 25,     // Низкие препятствия
        maxObstacleHeight: 40,     // Только низкие!
        minObstacleGap: 700,       // Большое расстояние
        maxObstacleGap: 900,       // Очень большое
        groundHeight: 40,
        starCount: 60,
        moonSize: 70
    };

    // ========== ПЕРЕМЕННЫЕ ==========
    let canvas, ctx;
    let gameRunning = false;
    let gameSpeed = GAME.initialSpeed;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
    let frames = 0;
    let gameLoopId = null;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let gameStarted = false;
    
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
    
    let obstacles = []; // ТОЛЬКО НИЗКИЕ ПРЕПЯТСТВИЯ
    let stars = [];
    
    // ========== ИЗОБРАЖЕНИЯ ==========
    let playerImg = new Image();
    let obstacleImg = new Image();
    
    // ========== DOM ЭЛЕМЕНТЫ ==========
    let scoreElement, highScoreElement;
    let jumpBtn, restartBtn, startBtn;
    let gameOverScreen, finalScoreElement;
    let startScreen;

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log("🎮 Инициализация игры...");
        
        // Получаем элементы DOM
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        scoreElement = document.getElementById('score');
        highScoreElement = document.getElementById('highScore');
        jumpBtn = document.querySelector('.mobile-jump-btn');
        restartBtn = document.getElementById('restartBtn');
        startBtn = document.getElementById('startBtn');
        gameOverScreen = document.querySelector('.game-over');
        finalScoreElement = gameOverScreen.querySelector('span');
        startScreen = document.querySelector('.start-screen');
        
        // Настраиваем размеры канваса
        resizeCanvas();
        
        // Загружаем картинку игрока
        playerImg.src = 'images/othcim.jpg';
        playerImg.onload = function() {
            console.log("✅ Картинка игрока загружена");
            createObstacleImage();
            startGameAfterLoad();
        };
        
        playerImg.onerror = function() {
            console.log("⚠️ Картинка не найдена, создаю динозаврика...");
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
        
        console.log("🎮 Игра готова к запуску!");
    }

    function startGameAfterLoad() {
        player.groundY = canvas.height - GAME.groundHeight - player.height;
        player.y = player.groundY;
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
        
        // Пересоздаем звезды при изменении размера
        createStars();
    }

    // ========== СОЗДАНИЕ ИЗОБРАЖЕНИЙ ==========
    function createDefaultPlayerImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.playerWidth;
        tempCanvas.height = GAME.playerHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Простой динозаврик для игры
        tempCtx.fillStyle = '#8B4513';
        
        // Тело
        tempCtx.fillRect(15, 15, 30, 30);
        
        // Ноги
        tempCtx.fillRect(20, 45, 8, 15);
        tempCtx.fillRect(32, 45, 8, 15);
        
        // Голова
        tempCtx.fillRect(40, 10, 15, 20);
        
        // Глаз
        tempCtx.fillStyle = '#FFD700';
        tempCtx.fillRect(45, 15, 6, 6);
        
        // Хвост
        tempCtx.fillStyle = '#8B4513';
        tempCtx.fillRect(5, 20, 10, 8);
        
        playerImg.src = tempCanvas.toDataURL();
    }

    function createObstacleImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.obstacleWidth;
        tempCanvas.height = GAME.maxObstacleHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Простой камень/препятствие
        tempCtx.fillStyle = '#8B7355';
        tempCtx.fillRect(5, 10, 12, GAME.maxObstacleHeight - 10);
        
        // Верхняя часть
        tempCtx.fillStyle = '#D4AF37';
        tempCtx.fillRect(5, 5, 12, 5);
        
        // Текстура
        tempCtx.fillStyle = '#A0522D';
        for (let i = 0; i < 3; i++) {
            tempCtx.fillRect(7, 15 + i * 10, 8, 3);
        }
        
        obstacleImg.src = tempCanvas.toDataURL();
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < GAME.starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.3,
                twinkle: Math.random() * 0.05 + 0.01
            });
        }
    }

    // ========== УПРАВЛЕНИЕ ИГРОЙ ==========
    function startGame() {
        if (gameRunning) return;
        
        gameStarted = true;
        resetGame();
        gameRunning = true;
        gameOverScreen.style.display = 'none';
        startScreen.style.display = 'none';
        
        console.log("▶️ Игра начата!");
    }

    function resetGame() {
        score = 0;
        gameSpeed = GAME.initialSpeed; // Сброс скорости
        obstacles = [];
        frames = 0;
        
        player.y = player.groundY;
        player.velocityY = 0;
        player.isJumping = false;
        player.isDucking = false;
        player.height = GAME.playerHeight;
        
        updateScore();
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
        finalScoreElement.textContent = Math.floor(score);
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========
    function update() {
        if (!gameRunning) return;
        
        frames++;
        
        // ОЧЕНЬ МЕДЛЕННО увеличиваем скорость
        if (frames % 300 === 0) { // Только каждый 300-й кадр
            gameSpeed += GAME.speedIncrease;
        }
        
        // Обновляем игрока
        updatePlayer();
        
        // Обновляем препятствия (МАЛО!)
        updateObstacles();
        
        // Увеличиваем счет
        score += 0.5;
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
        // Удаляем препятствия, которые ушли за экран
        obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
        
        // Двигаем препятствия
        for (let obstacle of obstacles) {
            obstacle.x -= gameSpeed;
            
            // Отмечаем пройденные препятствия
            if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
                obstacle.passed = true;
                score += 25;
                scoreElement.classList.add('score-pop');
                setTimeout(() => {
                    scoreElement.classList.remove('score-pop');
                }, 300);
            }
        }
        
        // Создаем новые препятствия ОЧЕНЬ РЕДКО!
        // Только если на экране меньше 2 препятствий
        if (frames % 250 === 0 && obstacles.length < 2) {
            // Проверяем, что последнее препятствие далеко
            const lastObstacle = obstacles[obstacles.length - 1];
            if (!lastObstacle || (canvas.width - lastObstacle.x) > GAME.minObstacleGap) {
                createObstacle();
            }
        }
    }

    function createObstacle() {
        // ТОЛЬКО НИЗКИЕ ПРЕПЯТСТВИЯ!
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
        
        // Рисуем египетскую ночь
        drawNightSky();
        
        // Рисуем звезды
        drawStars();
        
        // Рисуем луну
        drawMoon();
        
        // Рисуем песок
        drawSand();
        
        // Рисуем препятствия
        drawObstacles();
        
        // Рисуем игрока
        drawPlayer();
        
        // Если игра не запущена и не была начата, показываем стартовый экран
        if (!gameRunning && !gameStarted && !isMobile) {
            startScreen.style.display = 'flex';
        }
    }

    function drawNightSky() {
        // Темно-синее небо Египта
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        gradient.addColorStop(0, '#0c1445');
        gradient.addColorStop(1, '#1a1a2e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawStars() {
        for (let star of stars) {
            // Мерцание звезд
            const twinkle = Math.sin(frames * star.twinkle) * 0.3 + 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 220, ${star.brightness * twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawMoon() {
        // Большая луна
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 80, GAME.moonSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Кратеры
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(canvas.width - 120, 60, 12, 0, Math.PI * 2);
        ctx.arc(canvas.width - 80, 100, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Свечение
        ctx.fillStyle = 'rgba(255, 248, 220, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 80, GAME.moonSize + 40, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSand() {
        // Оранжево-желтый египетский песок
        const sandGradient = ctx.createLinearGradient(0, canvas.height - GAME.groundHeight, 0, canvas.height);
        sandGradient.addColorStop(0, '#D4AF37');
        sandGradient.addColorStop(1, '#B8860B');
        
        ctx.fillStyle = sandGradient;
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, GAME.groundHeight);
        
        // Простая текстура песка
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < canvas.width; i += 40) {
            const waveHeight = Math.sin(i * 0.01) * 4 + 4;
            ctx.fillRect(i, canvas.height - GAME.groundHeight, 30, waveHeight);
        }
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
            
            // Тень под препятствием
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(
                obstacle.x + 3,
                canvas.height - GAME.groundHeight,
                obstacle.width - 6,
                6
            );
        }
    }

    function drawPlayer() {
        // Рисуем картинку игрока
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        // Тень под игроком
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(
            player.x + 10,
            canvas.height - GAME.groundHeight,
            player.width - 20,
            8
        );
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateScore() {
        scoreElement.textContent = Math.floor(score);
    }

    function updateHighScore() {
        highScoreElement.textContent = Math.floor(highScore);
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
    function gameLoop() {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ========== ЗАПУСК ИГРЫ ==========
    // Ждем загрузки страницы
    window.addEventListener('load', function() {
        setTimeout(init, 100);
    });
    
    // Аварийный запуск через 2 секунды
    setTimeout(() => {
        if (!gameLoopId) {
            console.log("⚠️ Аварийный запуск игры...");
            init();
        }
    }, 2000);
});

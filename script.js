document.addEventListener('DOMContentLoaded', function() {
    // ========== НАСТРОЙКИ ИГРЫ ==========
    const GAME = {
        playerWidth: 100,           // Размер игрока
        playerHeight: 100,          // Размер игрока
        playerJumpForce: 16,        // Сила прыжка
        gravity: 0.8,
        initialSpeed: 6,           // Начальная скорость (медленнее)
        speedIncrease: 0.0001,     // Очень медленное ускорение
        cactusWidth: 30,           // Размер кактуса
        minCactusHeight: 50,
        maxCactusHeight: 90,
        minCactusGap: 450,         // Больше расстояние между кактусами
        maxCactusGap: 650,         // Еще больше расстояние
        groundHeight: 30,
        cloudCount: 3,
        starCount: 100,
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
    let isNight = false;  // Режим дня/ночи
    let nightTransition = 0; // Плавный переход дня в ночь
    
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
    
    let obstacles = [];
    let clouds = [];
    let stars = [];
    
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
        
        // Создаем облака и звезды
        createClouds();
        createStars();
        
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
        
        // Пересоздаем звезды при изменении размера
        createStars();
        
        console.log(`📐 Размер экрана: ${canvas.width}x${canvas.height}`);
    }

    // ========== СОЗДАНИЕ ИЗОБРАЖЕНИЙ ==========
    function createDefaultPlayerImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.playerWidth;
        tempCanvas.height = GAME.playerHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Динозаврик
        tempCtx.fillStyle = '#535353';
        
        // Тело
        tempCtx.fillRect(15, 25, 70, 50);
        
        // Ноги
        tempCtx.fillRect(25, 75, 15, 25);
        tempCtx.fillRect(60, 75, 15, 25);
        
        // Голова и шея
        tempCtx.fillRect(75, 12, 20, 38);
        tempCtx.fillRect(88, 5, 25, 25);
        
        // Глаз
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(95, 10, 10, 10);
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(97, 12, 6, 6);
        
        // Хвост
        tempCtx.fillStyle = '#535353';
        tempCtx.fillRect(0, 40, 12, 10);
        tempCtx.fillRect(5, 50, 7, 5);
        
        // Улыбка
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 2;
        tempCtx.beginPath();
        tempCtx.arc(95, 30, 8, 0, Math.PI);
        tempCtx.stroke();
        
        playerImg.src = tempCanvas.toDataURL();
    }

    function createCactusImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = GAME.cactusWidth;
        tempCanvas.height = GAME.maxCactusHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Кактус
        tempCtx.fillStyle = '#0a0';
        tempCtx.fillRect(10, 0, 10, GAME.maxCactusHeight);
        
        // Полоски
        tempCtx.fillStyle = '#080';
        tempCtx.fillRect(12, 15, 6, 5);
        tempCtx.fillRect(12, 40, 6, 5);
        tempCtx.fillRect(12, 65, 6, 5);
        
        cactusImg.src = tempCanvas.toDataURL();
    }

    function createClouds() {
        clouds = [];
        for (let i = 0; i < GAME.cloudCount; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 150 + 50,
                width: Math.random() * 80 + 60,
                speed: Math.random() * 0.5 + 0.3,
                opacity: Math.random() * 0.3 + 0.7
            });
        }
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < GAME.starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.05 + 0.02
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
        gameSpeed = GAME.initialSpeed; // Сбрасываем скорость
        obstacles = [];
        frames = 0;
        fpsFrameCount = 0;
        lastFpsUpdate = Date.now();
        isNight = false;
        nightTransition = 0;
        
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
            fps = Math.min(fps, 3334444);
            updateFPS();
            fpsFrameCount = 0;
            lastFpsUpdate = now;
        }
        
        // ОЧЕНЬ медленно увеличиваем скорость
        if (frames % 100 === 0) { // Только каждый 100-й кадр
            gameSpeed += GAME.speedIncrease;
        }
        
        // Переход дня в ночь по счету
        if (score > 500 && !isNight) {
            nightTransition = Math.min(nightTransition + 0.01, 1);
            if (nightTransition >= 1) {
                isNight = true;
            }
        }
        
        // Обновляем игрока
        updatePlayer();
        
        // Обновляем препятствия (реже)
        updateObstacles();
        
        // Обновляем облака
        updateClouds();
        
        // Увеличиваем счет
        score += 1; // Меньше очков за время
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
                score += 50; // Меньше бонуса за кактус
                scoreElement.classList.add('score-pop');
                setTimeout(() => {
                    scoreElement.classList.remove('score-pop');
                }, 400);
            }
        }
        
        // Создаем новые препятствия РЕЖЕ
        // Только каждый 120-й кадр И если прошло достаточно времени
        if (frames % 120 === 0 && obstacles.length < 3) {
            // Проверяем, что последний кактус далеко
            const lastObstacle = obstacles[obstacles.length - 1];
            if (!lastObstacle || (canvas.width - lastObstacle.x) > GAME.minCactusGap) {
                createObstacle();
            }
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
        
        console.log("🌵 Создан новый кактус. Всего кактусов:", obstacles.length);
    }

    function updateClouds() {
        for (let cloud of clouds) {
            cloud.x -= cloud.speed * 0.3;
            
            if (cloud.x + cloud.width < 0) {
                cloud.x = canvas.width;
                cloud.y = Math.random() * 150 + 50;
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
        
        // Рисуем фон (день/ночь)
        drawBackground();
        
        // Рисуем звезды (если ночь)
        if (isNight || nightTransition > 0) {
            drawStars();
        }
        
        // Рисуем луну (если ночь)
        if (isNight || nightTransition > 0) {
            drawMoon();
        }
        
        // Рисуем облака (прозрачнее ночью)
        drawClouds();
        
        // Рисуем землю (песок)
        drawGround();
        
        // Рисуем препятствия
        drawObstacles();
        
        // Рисуем игрока
        drawPlayer();
    }

    function drawBackground() {
        // Плавный переход от дня к ночи
        const dayColor = isNight ? 0 : 1 - nightTransition;
        const nightColor = isNight ? 1 : nightTransition;
        
        // Градиентное небо с переходом
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
        
        // Дневные цвета
        const dayTop = `rgba(${135 + 120 * nightColor}, ${206 - 106 * nightColor}, ${235 - 135 * nightColor}, 1)`;
        const dayBottom = `rgba(${224 - 124 * nightColor}, ${247 - 107 * nightColor}, ${255 - 155 * nightColor}, 1)`;
        
        // Ночные цвета
        const nightTop = `rgba(${15 + 120 * dayColor}, ${30 + 176 * dayColor}, ${100 + 135 * dayColor}, 1)`;
        const nightBottom = `rgba(${100 + 124 * dayColor}, ${140 + 107 * dayColor}, ${100 + 155 * dayColor}, 1)`;
        
        // Смешиваем цвета
        gradient.addColorStop(0, isNight ? nightTop : dayTop);
        gradient.addColorStop(1, isNight ? nightBottom : dayBottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Солнце/Луна
        if (!isNight && nightTransition < 0.5) {
            // Солнце (исчезает при переходе к ночи)
            const sunOpacity = Math.max(0, 1 - nightTransition * 2);
            if (sunOpacity > 0) {
                ctx.fillStyle = `rgba(255, 215, 0, ${sunOpacity})`;
                ctx.beginPath();
                ctx.arc(canvas.width - 100, 100, 50 * sunOpacity, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function drawStars() {
        const opacity = isNight ? 1 : nightTransition;
        
        for (let star of stars) {
            // Мерцание звезд
            const twinkle = Math.sin(frames * star.twinkleSpeed) * 0.3 + 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle * opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Большие звезды имеют лучи
            if (star.size > 1.5 && opacity > 0.5) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * twinkle * opacity})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    ctx.beginPath();
                    ctx.moveTo(
                        star.x + Math.cos(angle) * star.size,
                        star.y + Math.sin(angle) * star.size
                    );
                    ctx.lineTo(
                        star.x + Math.cos(angle) * (star.size * 3),
                        star.y + Math.sin(angle) * (star.size * 3)
                    );
                    ctx.stroke();
                }
            }
        }
    }

    function drawMoon() {
        const opacity = isNight ? 1 : nightTransition;
        if (opacity > 0) {
            // Луна
            ctx.fillStyle = `rgba(255, 255, 220, ${opacity})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 150, 120, GAME.moonSize * opacity, 0, Math.PI * 2);
            ctx.fill();
            
            // Кратеры на луне
            ctx.fillStyle = `rgba(200, 200, 200, ${0.5 * opacity})`;
            ctx.beginPath();
            ctx.arc(canvas.width - 170, 100, 12 * opacity, 0, Math.PI * 2);
            ctx.arc(canvas.width - 130, 150, 15 * opacity, 0, Math.PI * 2);
            ctx.arc(canvas.width - 150, 130, 8 * opacity, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawClouds() {
        const cloudOpacity = isNight ? 0.3 : 0.8;
        
        for (let cloud of clouds) {
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * cloudOpacity})`;
            
            // Пушистые облака
            ctx.beginPath();
            ctx.arc(cloud.x + 20, cloud.y, 20, 0, Math.PI * 2);
            ctx.arc(cloud.x + 40, cloud.y - 10, 25, 0, Math.PI * 2);
            ctx.arc(cloud.x + 60, cloud.y, 20, 0, Math.PI * 2);
            ctx.arc(cloud.x + 40, cloud.y + 10, 18, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGround() {
        // ЖЕЛТЫЙ ПЕСОК
        const sandColor = isNight ? '#8B7500' : '#F4A460'; // Темнее ночью
        
        // Основной песок
        ctx.fillStyle = sandColor;
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, GAME.groundHeight);
        
        // Текстура песка (волны)
        ctx.fillStyle = isNight ? '#DAA520' : '#DEB887'; // Светлее для текстуры
        for (let i = 0; i < canvas.width; i += 40) {
            const waveHeight = Math.sin((frames * 0.02) + (i * 0.01)) * 3 + 3;
            ctx.fillRect(
                i, 
                canvas.height - GAME.groundHeight, 
                30, 
                waveHeight
            );
        }
        
        // Тень от объектов на песке
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, canvas.height - GAME.groundHeight, canvas.width, 2);
    }

    function drawPlayer() {
        // Рисуем картинку игрока
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        
        // Тень под игроком
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width/2,
            canvas.height - GAME.groundHeight,
            player.width/4,
            6,
            0, 0, Math.PI * 2
        );
        ctx.fill();
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(
                obstacle.x + 5,
                canvas.height - GAME.groundHeight,
                obstacle.width - 10,
                8
            );
            
            // Колючки (только видны днем)
            if (!isNight || nightTransition < 0.5) {
                ctx.strokeStyle = '#060';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const y = obstacle.y + 15 + i * 25;
                    if (y < obstacle.y + obstacle.height - 10) {
                        ctx.beginPath();
                        ctx.moveTo(obstacle.x, y);
                        ctx.lineTo(obstacle.x - 6, y);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function updateScore() {
        scoreElement.textContent = formatNumber(score);
        
        // Индикатор ночного режима
        if (isNight || nightTransition > 0) {
            scoreElement.style.textShadow = '0 0 10px #87CEEB';
        } else {
            scoreElement.style.textShadow = '0 0 10px #4CAF50';
        }
    }

    function updateHighScore() {
        highScoreElement.textContent = formatNumber(highScore);
    }

    function updateFPS() {
        fpsElement.textContent = formatNumber(fps);
        
        // Цвет FPS в зависимости от значения
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
                case 'KeyN':
                    // Переключение дня/ночи (для теста)
                    isNight = !isNight;
                    nightTransition = isNight ? 1 : 0;
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

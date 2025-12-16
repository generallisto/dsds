document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const speedElement = document.getElementById('speed');
    const startBtn = document.getElementById('startBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const resetBtn = document.getElementById('resetBtn');
    const restartBtn = document.getElementById('restartBtn');
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');

    // Игровые переменные
    let gameRunning = false;
    let gameSpeed = 1.0;
    let score = 0;
    let highScore = localStorage.getItem('newYearDinoHighScore') || 0;
    let frames = 0;
    let snowflakes = [];
    let gifts = [];
    let obstacles = [];
    let gameLoopId;
    let lastObstacleTime = 0;
    let lastGiftTime = 0;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Устанавливаем рекорд при загрузке
    highScoreElement.textContent = highScore;
    
    // Загружаем изображение игрока из папки images
    const playerImg = new Image();
    playerImg.src = 'images/othcim.jpg';
    
    // Если изображение не загружено, используем запасной вариант
    playerImg.onerror = function() {
        console.log("Изображение 'images/othcim.jpg' не найдено. Используется запасной вариант.");
        createFallbackImage();
    };
    
    // Загружаем изображения для игры
    const treeImg = new Image();
    treeImg.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80">
            <rect x="27" y="60" width="6" height="20" fill="#8B4513"/>
            <polygon points="30,0 10,40 50,40" fill="#228B22"/>
            <polygon points="30,15 15,50 45,50" fill="#2E8B57"/>
            <polygon points="30,30 20,60 40,60" fill="#32CD32"/>
            <circle cx="25" cy="25" r="3" fill="#FFD700"/>
            <circle cx="35" cy="35" r="3" fill="#FF4500"/>
            <circle cx="20" cy="45" r="3" fill="#FF69B4"/>
            <circle cx="40" cy="50" r="3" fill="#1E90FF"/>
        </svg>
    `);
    
    const giftImg = new Image();
    giftImg.src = 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
            <rect x="10" y="20" width="30" height="20" fill="#e74c3c"/>
            <rect x="10" y="15" width="30" height="5" fill="#2ecc71"/>
            <rect x="22" y="5" width="6" height="15" fill="#f1c40f"/>
            <rect x="10" y="20" width="30" height="5" fill="#f1c40f"/>
            <rect x="15" y="25" width="5" height="5" fill="#3498db"/>
            <rect x="30" y="25" width="5" height="5" fill="#3498db"/>
            <rect x="22" y="30" width="6" height="5" fill="#9b59b6"/>
        </svg>
    `);
    
    // Создаем снежинки
    function createSnowflakes() {
        snowflakes = [];
        const snowflakeCount = isMobile ? 30 : 50;
        
        for (let i = 0; i < snowflakeCount; i++) {
            snowflakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 2,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    // Обновляем и рисуем снежинки
    function updateSnowflakes() {
        for (let i = 0; i < snowflakes.length; i++) {
            const flake = snowflakes[i];
            flake.y += flake.speed;
            flake.x += Math.sin(frames * 0.01 + i) * 0.5;
            
            if (flake.y > canvas.height) {
                flake.y = -10;
                flake.x = Math.random() * canvas.width;
            }
            
            // Рисуем снежинку
            ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Создаем запасное изображение игрока
    function createFallbackImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 60;
        tempCanvas.height = 60;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Тело динозаврика
        tempCtx.fillStyle = '#3498db';
        tempCtx.fillRect(0, 0, 60, 60);
        tempCtx.strokeStyle = '#2980b9';
        tempCtx.lineWidth = 3;
        tempCtx.strokeRect(2, 2, 56, 56);
        
        // Глаза
        tempCtx.fillStyle = 'white';
        tempCtx.beginPath();
        tempCtx.arc(20, 20, 8, 0, Math.PI * 2);
        tempCtx.arc(40, 20, 8, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = 'black';
        tempCtx.beginPath();
        tempCtx.arc(20, 20, 4, 0, Math.PI * 2);
        tempCtx.arc(40, 20, 4, 0, Math.PI * 2);
        tempCtx.fill();
        
        // Улыбка
        tempCtx.beginPath();
        tempCtx.arc(30, 30, 12, 0, Math.PI, false);
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 3;
        tempCtx.stroke();
        
        // Новогодняя шапка
        tempCtx.fillStyle = '#e74c3c';
        tempCtx.beginPath();
        tempCtx.moveTo(15, 5);
        tempCtx.lineTo(45, 5);
        tempCtx.lineTo(40, 15);
        tempCtx.lineTo(20, 15);
        tempCtx.closePath();
        tempCtx.fill();
        
        // Помпон
        tempCtx.fillStyle = '#FFD700';
        tempCtx.beginPath();
        tempCtx.arc(30, 5, 5, 0, Math.PI * 2);
        tempCtx.fill();
        
        // Текст
        tempCtx.fillStyle = 'white';
        tempCtx.font = 'bold 10px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.fillText('YOU', 30, 52);
        
        playerImg.src = tempCanvas.toDataURL();
    }
    
    // Позиция игрока
    const player = {
        x: 80,
        y: 0,
        width: 60,
        height: 60,
        velocityY: 0,
        gravity: 0.5,
        jumpForce: -12,
        isJumping: false,
        isDucking: false,
        groundY: canvas.height - 80,
        
        jump() {
            if (!this.isJumping) {
                this.velocityY = this.jumpForce;
                this.isJumping = true;
                // Анимация нажатия кнопки на мобильных
                if (isMobile) {
                    jumpBtn.classList.add('button-press');
                    setTimeout(() => jumpBtn.classList.remove('button-press'), 200);
                }
            }
        },
        
        duck(isDucking) {
            if (!this.isJumping) {
                this.isDucking = isDucking;
                this.height = isDucking ? 40 : 60;
                this.y = isDucking ? this.groundY + 20 : this.groundY - this.height;
            }
        },
        
        update() {
            this.velocityY += this.gravity;
            this.y += this.velocityY;
            
            if (this.y > this.groundY - this.height) {
                this.y = this.groundY - this.height;
                this.velocityY = 0;
                this.isJumping = false;
            }
        },
        
        draw() {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
            
            // Добавляем новогодний эффект
            if (frames % 20 < 10) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + 5, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        
        reset() {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.isDucking = false;
            this.height = 60;
        }
    };

    // Создание препятствия (ёлки)
    function createObstacle() {
        const height = Math.random() * 30 + 50;
        const width = height * 0.6;
        
        obstacles.push({
            x: canvas.width,
            y: canvas.height - 80 - height,
            width: width,
            height: height,
            passed: false
        });
    }
    
    // Создание подарка
    function createGift() {
        if (Math.random() > 0.3) return; // 30% шанс появления подарка
        
        gifts.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 150) + 50,
            width: 30,
            height: 30,
            collected: false
        });
    }

    // Обновление препятствий
    function updateObstacles() {
        const currentTime = Date.now();
        
        // Создаем новые препятствия с интервалом
        if (currentTime - lastObstacleTime > 2000 / gameSpeed) {
            createObstacle();
            lastObstacleTime = currentTime;
        }
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= 5 * gameSpeed;
            
            // Удаляем препятствия, которые ушли за экран
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                continue;
            }
            
            // Проверяем, прошли ли мы препятствие
            if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
                obstacles[i].passed = true;
                score += 10;
                updateScore();
            }
        }
    }
    
    // Обновление подарков
    function updateGifts() {
        const currentTime = Date.now();
        
        // Создаем новые подарки с интервалом
        if (currentTime - lastGiftTime > 3000 / gameSpeed) {
            createGift();
            lastGiftTime = currentTime;
        }
        
        for (let i = gifts.length - 1; i >= 0; i--) {
            gifts[i].x -= 5 * gameSpeed;
            
            // Удаляем подарки, которые ушли за экран
            if (gifts[i].x + gifts[i].width < 0) {
                gifts.splice(i, 1);
                continue;
            }
            
            // Проверяем сбор подарка
            if (!gifts[i].collected && checkCollision(player, gifts[i])) {
                gifts[i].collected = true;
                score += 50;
                updateScore();
                showNotification('+50 очков! 🎁');
                gifts.splice(i, 1);
            }
        }
    }

    // Отрисовка препятствий
    function drawObstacles() {
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            
            // Рисуем ёлку
            ctx.drawImage(treeImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Добавляем тень
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height, obstacle.width - 10, 10);
        }
    }
    
    // Отрисовка подарков
    function drawGifts() {
        for (let i = 0; i < gifts.length; i++) {
            const gift = gifts[i];
            
            // Анимация подарка (плавает вверх-вниз)
            const floatOffset = Math.sin(frames * 0.1 + i) * 5;
            
            // Рисуем подарок
            ctx.drawImage(giftImg, gift.x, gift.y + floatOffset, gift.width, gift.height);
            
            // Эффект свечения
            if (frames % 10 < 5) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
                ctx.drawImage(giftImg, gift.x, gift.y + floatOffset, gift.width, gift.height);
                ctx.shadowBlur = 0;
            }
        }
    }

    // Проверка столкновений
    function checkCollision(obj1, obj2) {
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }

    // Обновление счета
    function updateScore() {
        scoreElement.textContent = score;
        
        // Обновляем рекорд
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('newYearDinoHighScore', highScore);
            highScoreElement.classList.add('high-score-glow');
        }
        
        // Увеличиваем скорость каждые 50 очков
        const newSpeed = 1.0 + Math.floor(score / 50) * 0.2;
        if (newSpeed !== gameSpeed) {
            gameSpeed = newSpeed;
            speedElement.textContent = gameSpeed.toFixed(1) + 'x';
            showNotification(`Скорость: ${gameSpeed.toFixed(1)}x! ⚡`);
        }
    }

    // Сброс игры
    function resetGame() {
        score = 0;
        gameSpeed = 1.0;
        obstacles = [];
        gifts = [];
        frames = 0;
        player.reset();
        updateScore();
        speedElement.textContent = gameSpeed.toFixed(1) + 'x';
        gameOverScreen.style.display = 'none';
        highScoreElement.classList.remove('high-score-glow');
    }

    // Завершение игры
    function gameOver() {
        gameRunning = false;
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'block';
        
        // Останавливаем игровой цикл
        cancelAnimationFrame(gameLoopId);
    }

    // Отрисовка фона
    function drawBackground() {
        // Зимнее небо
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a1929');
        gradient.addColorStop(1, '#1a3a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height - 80);
        
        // Снежная земля
        ctx.fillStyle = '#f0f8ff';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        
        // Текстурный снег
        ctx.fillStyle = '#e6f7ff';
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.arc(i, canvas.height - 80, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Луна
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Кратеры на луне
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(canvas.width - 120, 70, 8, 0, Math.PI * 2);
        ctx.arc(canvas.width - 90, 100, 10, 0, Math.PI * 2);
        ctx.arc(canvas.width - 110, 110, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Звезды
        ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 23) % canvas.width;
            const y = (i * 17) % (canvas.height - 150);
            const size = Math.random() * 2 + 1;
            const opacity = Math.random() * 0.5 + 0.5;
            
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Мерцание звезд
            if (frames % (i + 10) < 5) {
                ctx.beginPath();
                ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    
    // Показ уведомления
    function showNotification(text) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        document.body.appendChild(notification);
        
        // Показываем уведомление
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Убираем уведомление через 2 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 2000);
    }
    
    // Создаем гирлянду
    function createChristmasLights() {
        const lightsContainer = document.createElement('div');
        lightsContainer.className = 'christmas-lights';
        
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const lightCount = 20;
        
        for (let i = 0; i < lightCount; i++) {
            const light = document.createElement('div');
            light.className = 'light';
            light.style.left = `${(i / lightCount) * 100}%`;
            light.style.backgroundColor = colors[i % colors.length];
            light.style.animationDelay = `${i * 0.2}s`;
            lightsContainer.appendChild(light);
        }
        
        document.querySelector('.game-container').appendChild(lightsContainer);
    }

    // Основной игровой цикл
    function gameLoop() {
        // Очищаем холст
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем снежинки
        updateSnowflakes();
        
        // Рисуем фон
        drawBackground();
        
        if (gameRunning) {
            // Обновляем и рисуем игрока
            player.update();
            
            // Обновляем препятствия и подарки
            updateObstacles();
            updateGifts();
            
            // Проверяем столкновения с препятствиями
            for (let i = 0; i < obstacles.length; i++) {
                if (checkCollision(player, obstacles[i])) {
                    gameOver();
                    break;
                }
            }
            
            // Увеличиваем счетчик кадров
            frames++;
        }
        
        // Рисуем игрока, препятствия и подарки
        player.draw();
        drawObstacles();
        drawGifts();
        
        // Рисуем счет в углу экрана
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 120, 40);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Очки: ${score}`, 20, 35);
        
        // Продолжаем цикл
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Обработчики событий
    function handleKeyDown(e) {
        if (!gameRunning && (e.code === 'Space' || e.code === 'ArrowUp')) {
            startGame();
            return;
        }
        
        if (!gameRunning) return;
        
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
                e.preventDefault();
                player.jump();
                break;
            case 'ArrowDown':
                e.preventDefault();
                player.duck(true);
                break;
        }
    }
    
    function handleKeyUp(e) {
        if (!gameRunning) return;
        
        if (e.code === 'ArrowDown') {
            player.duck(false);
        }
    }
    
    function startGame() {
        if (gameRunning) return;
        
        resetGame();
        gameRunning = true;
        startBtn.textContent = '⏸ ПАУЗА';
        showNotification('Удачи! 🎮');
        
        // Запускаем игровой цикл
        gameLoop();
    }
    
    function togglePause() {
        if (!gameRunning) return;
        
        gameRunning = false;
        startBtn.textContent = '▶ ПРОДОЛЖИТЬ';
        showNotification('Пауза ⏸');
    }
    
    function handleStartClick() {
        if (gameRunning) {
            togglePause();
        } else {
            startGame();
        }
    }

    // Инициализация игры
    function initGame() {
        // Создаем снежинки
        createSnowflakes();
        
        // Создаем гирлянду
        createChristmasLights();
        
        // Настраиваем кнопку прыжка для мобильных устройств
        if (isMobile) {
            jumpBtn.style.display = 'block';
            showNotification('Используйте кнопку ПРЫГНУТЬ');
        }
        
        // Устанавливаем начальные значения
        player.reset();
        updateScore();
        
        // Запускаем игровой цикл
        gameLoop();
        
        // Добавляем обработчики событий
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        startBtn.addEventListener('click', handleStartClick);
        jumpBtn.addEventListener('click', () => {
            if (gameRunning) player.jump();
        });
        resetBtn.addEventListener('click', resetGame);
        restartBtn.addEventListener('click', startGame);
        
        // Обработка касаний для мобильных
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameRunning) {
                startGame();
            } else {
                player.jump();
            }
        });
        
        // Обработка кликов по канвасу
        canvas.addEventListener('click', () => {
            if (!gameRunning) {
                startGame();
            }
        });
        
        // Адаптация размера канваса
        function resizeCanvas() {
            const container = canvas.parentElement;
            const containerWidth = container.clientWidth;
            
            // Сохраняем пропорции
            const aspectRatio = 800 / 350;
            const newWidth = Math.min(800, containerWidth - 40);
            const newHeight = newWidth / aspectRatio;
            
            canvas.style.width = newWidth + 'px';
            canvas.style.height = newHeight + 'px';
            
            // Обновляем внутренний размер
            canvas.width = 800;
            canvas.height = 350;
            
            // Пересоздаем снежинки
            createSnowflakes();
        }
        
        // Обработка изменения размера окна
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Показываем инструкцию при загрузке
        setTimeout(() => {
            showNotification('Нажмите ПРОБЕЛ или кнопку НАЧАТЬ ИГРУ');
        }, 1000);
    }
    
    // Запускаем игру после загрузки изображений
    const imagesToLoad = [playerImg, treeImg, giftImg];
    let loadedImages = 0;
    
    function checkAllImagesLoaded() {
        loadedImages++;
        if (loadedImages === imagesToLoad.length) {
            initGame();
        }
    }
    
    imagesToLoad.forEach(img => {
        if (img.complete) {
            checkAllImagesLoaded();
        } else {
            img.onload = checkAllImagesLoaded;
        }
    });
    
    // Запускаем игру даже если не все изображения загрузились
    setTimeout(() => {
        if (!gameLoopId) {
            initGame();
        }
    }, 2000);
});
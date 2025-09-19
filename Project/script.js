
let currentUser = null; // Текущий авторизованный пользователь
let score = 0; // Текущий счет игрока

function initializeGame() {
    // Инициализация словаря и элементов интерфейса
    let dictionary = [];
    const shapes = ['circle', 'square', 'triangle', 'rectangle', 'diamond', 'oval'];
    const shapeTranslations = {
        "circle": "Круг",
        "square": "Квадрат",
        "triangle": "Треугольник",
        "rectangle": "Прямоугольник",
        "diamond": "Ромб",
        "oval": "Овал"
    };
    
    // Загрузка словаря из файла
    fetch('slovar.txt')
        .then(response => response.text())
        .then(data => dictionary = data.split('\n').map(word => word.trim()))
        .catch(error => console.error('Ошибка загрузки словаря:', error));

    // Элементы управления
    const levelButtons = document.querySelectorAll(".level-btn"); // Кнопки уровней
    const typeButtons = document.querySelectorAll(".type-btn"); // Типы заданий
    const startButton = document.getElementById("start-btn"); // Кнопка старта
    const display = document.getElementById("display"); // Поле для отображения задания
    const userInput = document.getElementById("user-input"); // Поле ввода пользователя
    const submitButton = document.querySelector(".submit-btn"); // Кнопка отправки ответа
    const scoreDisplay = document.getElementById("score"); // Отображение счета
    const modal = document.getElementById("result-modal"); // Модальное окно результата
    const modalText = document.getElementById("result-text"); // Текст в модальном окне
    const closeModal = document.querySelector(".close"); // Кнопка закрытия модального окна


    let shapePicker = null; // Контейнер для выбора фигур
    let correctShapes = []; // Правильные фигуры
    let selectedShapes = []; // Выбранные игроком фигуры
    let selectedLevel = null; // Выбранный уровень
    let selectedType = null; // Выбранный тип задания
    let correctSequence = ""; // Правильная последовательность (для чисел и слов)
    let gameOver = false; // Флаг окончания раунда

    // Конфигурация уровней
    const levels = {
        1: { digits: 4, words: 1, shapes: 1, time: 10, multiplier: 1 },
        2: { digits: 6, words: 2, shapes: 2, time: 8, multiplier: 2 },
        3: { digits: 8, words: 3, shapes: 3, time: 6, multiplier: 3 },
        4: { digits: 10, words: 4, shapes: 4, time: 4, multiplier: 4 }
    };

    // Создание интерфейса выбора фигур
    function initShapePicker() {
        shapePicker = document.createElement('div');
        shapePicker.className = 'shape-picker';
        
        shapes.forEach(shape => {
            const div = document.createElement('div');
            div.className = `shape ${shape}`;
            
            div.addEventListener('click', () => {
                if (gameOver || !shapePicker.style.pointerEvents) return;
                
                const index = selectedShapes.indexOf(shape);
                if (index === -1) {
                    if (selectedShapes.length < levels[selectedLevel].shapes) {
                        selectedShapes.push(shape);
                    }
                } else {
                    selectedShapes.splice(index, 1);
                }
                updateShapeSelection();
            });
            
            shapePicker.appendChild(div);
        });
        
        document.querySelector('.input-container').prepend(shapePicker);
    }

    // Обновление визуального состояния выбранных фигур
    function updateShapeSelection() {
        shapePicker.querySelectorAll('.shape').forEach((s, i) => {
            s.classList.remove('selected');
            s.removeAttribute('data-order');
            
            const shape = shapes[i];
            const index = selectedShapes.indexOf(shape);
            
            if (index !== -1) {
                s.setAttribute('data-order', index + 1);
                s.classList.add('selected');
            }
        });
    }

    // Генерация задания в зависимости от типа
    function generateSequence() {
        display.innerHTML = '';
        const levelConfig = levels[selectedLevel];
        
        if (selectedType === 'shapes') {
            correctShapes = [];
            const shuffled = [...shapes].sort(() => 0.5 - Math.random());
            correctShapes = shuffled.slice(0, levelConfig.shapes);
            
            display.innerHTML = '';
            correctShapes.forEach(shape => {
                const div = document.createElement('div');
                div.className = `shape ${shape}`;
                display.appendChild(div);
            });
        } else {
            if (selectedType === "numbers") {
                correctSequence = Array.from({length: levelConfig.digits}, 
                    () => Math.floor(Math.random() * 10)).join("");
            } else if (selectedType === "words") {
                correctSequence = Array.from({length: levelConfig.words}, 
                    () => dictionary[Math.floor(Math.random() * dictionary.length)]).join(" ");
            }
            display.textContent = correctSequence;
        }
    }

    // Выбор уровня
    levelButtons.forEach(button => {
        button.addEventListener("click", () => {
            levelButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            selectedLevel = parseInt(button.dataset.level);
            typeButtons.forEach(btn => btn.disabled = false);
        });
    });

    // Выбор типа задания
    typeButtons.forEach(button => {
        button.addEventListener("click", () => {
            typeButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            selectedType = button.dataset.type;
            
            if (selectedType === 'shapes') {
                if (!shapePicker) initShapePicker();
                shapePicker.style.display = 'grid';
                userInput.style.display = 'none';
            } else {
                if (shapePicker) shapePicker.style.display = 'none';
                userInput.style.display = 'block';
            }
            
            startButton.disabled = false;
        });
    });

    // Начало игры
startButton.addEventListener("click", () => {
    gameOver = false;
    submitButton.disabled = false;
    score = 0;
    selectedShapes = [];
    
    if (shapePicker) {
        shapePicker.style.pointerEvents = 'none';
        shapePicker.querySelectorAll('.shape').forEach(s => {
            s.classList.remove('selected');
            s.removeAttribute('data-order');
        });
    }

    generateSequence();
    if (selectedType !== 'shapes') {
        userInput.disabled = true;
    }
    submitButton.disabled = true;

    setTimeout(() => {
        display.innerHTML = '';
        if (selectedType === 'shapes') {
            shapePicker.style.pointerEvents = 'auto';
        } else {
            userInput.disabled = false;
        }
        submitButton.disabled = false;
    }, levels[selectedLevel].time * 1000);
});


    // Проверка ответа
    submitButton.addEventListener("click", async () => {
        if (gameOver) return;
    
        let points = 100 * levels[selectedLevel].multiplier;
        let penalty = 0;
        let errorMessage = "";
        let penaltyDetails = "";
        let errors = [];
        let resultHtml = "";
    
        if (selectedType === 'shapes') { // Логика проверки фигур
    if (selectedShapes.length !== correctShapes.length) {
        points = 0;
        errors.push(`Выбрано ${selectedShapes.length} из ${correctShapes.length} фигур`);
    } 
    else if (selectedShapes.join() === correctShapes.join()) {
        points = 100 * levels[selectedLevel].multiplier;
    }
    else {
        const allCorrect = selectedShapes.every(shape => correctShapes.includes(shape));
        const orderCorrect = selectedShapes.join() === correctShapes.join();
        
        if (allCorrect && !orderCorrect) {
            points = Math.floor(100 * levels[selectedLevel].multiplier * 0.5);
            errors.push('Правильные фигуры, но неверный порядок');
        } else {
            points = 0;
            errors.push('Есть неверные фигуры');
        }
    }
    
    resultHtml = `
        Ваш выбор: ${selectedShapes.map(s => shapeTranslations[s]).join(', ')}<br>
        Правильная последовательность: ${correctShapes.map(s => shapeTranslations[s]).join(', ')}<br>
        Очки за раунд: ${points}<br>
    `;

            
        } else if (selectedType === "numbers") { // Логика проверки чисел
            let userAnswer = userInput.value.trim();
            
            if (userAnswer.length > levels[selectedLevel].digits) {
                userAnswer = userAnswer.slice(0, levels[selectedLevel].digits);
                errorMessage += `Введено больше цифр, чем требовалось. Лишние цифры были отброшены.<br>`;
            }
            
            if (userAnswer !== correctSequence) {
                let correctArray = correctSequence.split("");
                let userArray = userAnswer.split("");
                let minLength = Math.max(correctArray.length, userArray.length);
    
                for (let i = 0; i < minLength; i++) {
                    if (correctArray[i] !== userArray[i]) {
                        penalty += Math.floor(points / correctArray.length);
                        errors.push(`В ${i + 1}-й цифре должно было быть '${correctArray[i]}', но вы ввели '${userArray[i] || " ничего "}'. Штраф: -${Math.floor(points / correctArray.length)} очков.<br>`);
                    }
                }
                points -= penalty;
            }
            
            resultHtml = `
                Ваш ответ: ${userAnswer}<br>
                Правильный ответ: ${correctSequence}<br>
                Очки за раунд: ${Math.max(points, 0)}
            `;
            
        } else {
            // Логика для слов
            const userAnswer = userInput.value.trim();
            const userWords = userAnswer.split(" ").filter(word => word !== "");
            const correctWords = correctSequence.split(" ");
        
            if (userWords.length !== correctWords.length) {
                points = 0;
                errors.push(`Вы ввели ${userWords.length} слов, а должно быть ${correctWords.length}.`);
            }
        
            userWords.forEach(word => {
                if (!correctWords.includes(word)) {
                    errors.push(`Слово '${word}' не встречается в правильной последовательности.`);
                }
            });
        
            if (errors.length === 0) {
                let isSequenceCorrect = true;
                for (let i = 0; i < correctWords.length; i++) {
                    if (userWords[i] !== correctWords[i]) {
                        isSequenceCorrect = false;
                        errors.push(`Нарушена последовательность: '${userWords[i]}' вместо '${correctWords[i]}'`);
                        break;
                    }
                }
                points = isSequenceCorrect ? 100 * levels[selectedLevel].multiplier : Math.floor(100 * levels[selectedLevel].multiplier / 2);
            } else {
                points = 0;
            }
        
            resultHtml = `
                Ваш ответ: ${userAnswer}<br>
                Правильный ответ: ${correctSequence}<br>
                Очки за раунд: ${points}
            `;
        }
    
        score += Math.max(points, 0);
        loadUserResults()
        document.getElementById('score').textContent = score;
        // Сохранение результата в БД
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('https://localhost:7058/api/results/save', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ score: points })
                });
                if (!response.ok) {
                    console.error('Ошибка сохранения результата');
                } else {
                    console.log('Результат сохранен');
                }
            } catch (error) {
                console.error('Ошибка при отправке результата:', error);
            }
        }
    
        if (selectedType === "numbers") {
            if (penalty > 0) {
                resultHtml += `<br>Штрафные очки: ${penalty}<br><br>${penaltyDetails}`;
            
            } else {
            }
        }
    
        if (errors.length === 0) {
            resultHtml += "<br>Ошибок нет!";
        } else {
            resultHtml += "Ошибки:<br>" + errors.join("<br>");
        }
    
        modalText.innerHTML = resultHtml;
        modal.style.display = "block";
        gameOver = true;
        submitButton.disabled = true;
        
        if (selectedType !== 'shapes') {
            userInput.value = "";
        }
        loadUserResults();
    });
    
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
    
    userInput.addEventListener("input", () => {
        if (selectedType === "numbers" && /\D/.test(userInput.value)) {
            userInput.value = userInput.value.replace(/\D/g, "");
        } else if (selectedType === "words" && /\d/.test(userInput.value)) {
            userInput.value = userInput.value.replace(/\d/g, "");
        }
    
        if (selectedType === "numbers" && userInput.value.length > levels[selectedLevel].digits) {
            userInput.value = userInput.value.slice(0, levels[selectedLevel].digits);
        }
    });
    }

// При загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    
    // Инициализация игры
    initializeGame();
    await checkAuth(); // Проверка авторизации
    await loadLeaderboard(); // Загрузка таблицы лидеров
        setInterval(async () => { // Обновление таблицы лидеро
        await loadLeaderboard();
    }, 3000);
    
    // Проверка токена
    setInterval(checkAuth, 5 * 60 * 1000);

    if (token) {
        try {
            const response = await fetch('https://localhost:7058/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                currentUser = await response.json();
                updateAuthSection(currentUser);
                loadUserResults();
            }
        } catch (e) {
            console.error('Ошибка проверки токена:', e);
        }
    } else {
        updateAuthSection(null);
        loadUserResults();
    }

// Анимация облачка
function animateCloud() {
    const cloud = document.querySelector('.cloud-animation');
    if (cloud) {
        let position = -200;
        setInterval(() => {
            position = (position >= 200) ? -200 : position + 0.5;
            cloud.style.transform = `translateX(${position}%)`;
        }, 50);
    }
}
animateCloud();

// Закрытие по клику на крестик
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        hideModals();
    });
});
});

// Функция для инициализации обработчиков кнопок авторизации
function initAuthButtonHandlers(container) {
    container.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetModal = e.target.dataset.target;
            showModal(targetModal);
        });
    });
}

// Функция обновления блока авторизации
function updateAuthSection(user) {
    const authSection = document.querySelector('.auth-section');
    authSection.innerHTML = '';
    
    if (user) {
        // Для авторизованного пользователя
        const html = `
            <div class="guest-notice">
                <img src="img/user.png" class="notice-icon" alt="Пользователь">
                <h3>Добро пожаловать, ${user.firstName} ${user.lastName}</h3>
                <p>Ваш прогресс сохраняется. Хорошей игры!</p>
                <button class="auth-btn logout-btn">Выйти из аккаунта</button>
            </div>
        `;
        authSection.innerHTML = html;
        document.querySelector('.logout-btn').addEventListener('click', handleLogout);
    } else {
        // Для гостя
        const html = `
            <div class="guest-notice">
                <img src="img/guest.png" class="notice-icon" alt="Гость">
                <h3>Вы играете как <span class="highlight">Гость</span></h3>
                <p>Ваш прогресс не будет сохранен. Для сохранения результатов:</p>
                <div class="auth-buttons">
                    <button class="auth-btn login-btn" data-target="login-modal">Войти</button>
                    <button class="auth-btn register-btn" data-target="register-modal">Зарегистрироваться</button>
                </div>
            </div>
        `;
        authSection.innerHTML = html;
        // Инициализация обработчиков модальных окон
        initAuthButtonHandlers(authSection);
      
    }
    if (!user) {
        score = 0;
        document.getElementById('score').textContent = '0';
    }
}

// Обработчик выхода
async function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthSection(null);
    await checkAuth();
    await loadUserResults();
}

// Модальные окна и элементы
const authModals = {
    login: document.getElementById('login-modal'),
    register: document.getElementById('register-modal'),
    overlay: document.querySelector('.modal-overlay')
};

// Показать модальное окно
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.modal-overlay');
    modal.style.display = 'block';
    overlay.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
}

function hideModals(currentModal = null) {
    // Плавное скрытие только активного модального окна
    if (currentModal) {
        currentModal.classList.remove('active');
        authModals.overlay.classList.remove('active');
        setTimeout(() => {
            currentModal.style.display = 'none';
            authModals.overlay.style.display = 'none';
        }, 300);
    } else {
        // Скрытие всех модалок (при закрытии через оверлей/ESC)
        authModals.overlay.classList.remove('active');
        document.querySelectorAll('.modal-auth.active').forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                authModals.overlay.style.display = 'none';
            }, 300);
        });
    }
}

// Обработчики открытия модальных окон
document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetModal = e.target.dataset.target;
        showModal(targetModal);
    });
});

// Закрытие по клику на оверлей
authModals.overlay.addEventListener('click', hideModals);

// Закрытие по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModals();
});

// Переключение между модалками
document.querySelectorAll('.switch-auth a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const currentModal = e.target.closest('.modal-auth');
        const targetModal = e.target.dataset.target;
        hideModals(currentModal);
        setTimeout(() => {
            showModal(targetModal);
        }, 300);
    });
});

// Регистрация
document.querySelector('#register-modal form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = e.target.querySelector('input[placeholder="Имя"]').value.trim();
    const lastName = e.target.querySelector('input[placeholder="Фамилия"]').value.trim();
    const email = e.target.querySelector('input[type="email"]').value.trim();
    const password = e.target.querySelector('input[type="password"]').value.trim();
    const confirmPassword = e.target.querySelector('input[placeholder="Повторите пароль"]').value.trim();

    if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }
    
    if (password.length < 6) {
    alert("Пароль должен быть не менее 6 символов");
    return;
}

    try {
        // Регистрация
        const regResponse = await fetch('https://localhost:7058/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        if (!regResponse.ok) {
            let errorData;
            try {
                errorData = await regResponse.json();
            } catch {
                errorData = { message: "Неизвестная ошибка сервера" };
            }
            throw new Error(errorData.message || 'Ошибка регистрации');
        }

        // Авторизация
        await new Promise(resolve => setTimeout(resolve, 2000));
        const loginResponse = await fetch('https://localhost:7058/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.message || 'Ошибка входа');
        }

        const data = await loginResponse.json();
        localStorage.setItem('token', data.token);
        currentUser = { firstName, lastName, email };
        updateAuthSection(currentUser);
        hideModals();
        alert('Регистрация и вход выполнены успешно!');
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
});

// Авторизация
document.querySelector('#login-modal form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = e.target.querySelector('input[type="email"]').value.trim();
    const password = e.target.querySelector('input[type="password"]').value.trim();

    if (!email || !password) {
        alert('Введите email и пароль!');
        return;
    }

    try {
        const loginResponse = await fetch('https://localhost:7058/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.message || 'Ошибка входа');
        }

        const loginData = await loginResponse.json();
        localStorage.setItem('token', loginData.token);

        // Получаем данные пользователя
        const meResponse = await fetch('https://localhost:7058/api/auth/me', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        if (!meResponse.ok) {
            throw new Error('Не удалось получить данные пользователя');
        }

        const userData = await meResponse.json();
        currentUser = { firstName: userData.firstName, lastName: userData.lastName, email: userData.email };
        updateAuthSection(currentUser);
        await loadUserResults();
        hideModals();
        alert('Вход выполнен успешно!');
    } catch (error) {
        alert(`Ошибка входа: ${error.message}`);
    }
});

// Загрузка результатов пользовател
async function loadUserResults() {
    const scoreElement = document.getElementById('score');
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            scoreElement.textContent = score.toString();
            return;
        }

        const response = await fetch('https://localhost:7058/api/results/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            scoreElement.textContent = data.totalScore || '0';
        } else {
            scoreElement.textContent = '0';
        }
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
         scoreElement.textContent = score.toString();
    }
}

async function authFetch(url, options = {}) {
    const response = await fetch(url, options);  
    if (response.status === 401) {
        await handleLogout();
        window.location.reload();
    }
    return response;
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        updateAuthSection(null);
        await loadUserResults(); // Добавляем обновление счета
        return;
    }

    try {
        const response = await fetch('https://localhost:7058/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateAuthSection(currentUser);
            await loadUserResults(); // Добавляем ожидание
        } else {
            updateAuthSection(null);
            await loadUserResults();
        }
    } catch (error) {
        updateAuthSection(null);
        await loadUserResults();
    }
}

// Загрузка таблицы лидеров
async function loadLeaderboard() {
    try {
        const response = await fetch('https://localhost:7058/api/results/leaderboard');
        const data = await response.json();
        
        const tableBody = document.querySelector('.stats-table tbody');
        tableBody.innerHTML = ''; // Очищаем предыдущие данные

        data.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.totalScore}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Ошибка загрузки списка лидеров:', error);
        document.querySelector('.stats-table').innerHTML = '<p>Не удалось загрузить данные</p>';
    }
}
// Глобальные переменные
let currentRange = { min: 1, max: 10 };
let data = null;


document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    loadPresetRanges();
});


async function loadData() {
    try {
        const response = await fetch('data.json');
        data = await response.json();
        updateStats();
        updateHistory();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        data = {
            ranges: [],
            history: [],
            statistics: {
                totalRolls: 0,
                mostFrequentNumbers: [],
                lastRolls: []
            }
        };
    }
}


function setupEventListeners() {
    const generateBtn = document.getElementById('generateBtn');
    const minInput = document.getElementById('minRange');
    const maxInput = document.getElementById('maxRange');

    generateBtn.addEventListener('click', generateRandomNumber);
    
    minInput.addEventListener('input', validateRange);
    maxInput.addEventListener('input', validateRange);
    
    validateRange();
}


function validateRange() {
    const minInput = document.getElementById('minRange');
    const maxInput = document.getElementById('maxRange');
    const generateBtn = document.getElementById('generateBtn');
    const message = document.getElementById('message');

    const min = parseInt(minInput.value) || 0;
    const max = parseInt(maxInput.value) || 1;

    if (min >= max) {
        message.textContent = 'Минимальное число должно быть меньше максимального!';
        message.className = 'error';
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.5';
    } else {
        message.textContent = '';
        message.className = '';
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        currentRange = { min, max };
    }
}


function loadPresetRanges() {
    const presetButtons = document.getElementById('presetButtons');
    
    if (data && data.ranges) {
        data.ranges.forEach(range => {
            const button = document.createElement('button');
            button.className = 'preset-btn';
            button.textContent = `${range.name} (${range.min}-${range.max})`;
            button.title = range.description;
            
            button.addEventListener('click', () => {
                setRange(range.min, range.max);
                document.querySelectorAll('.preset-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            });
            
            presetButtons.appendChild(button);
        });
    }
}


function setRange(min, max) {
    document.getElementById('minRange').value = min;
    document.getElementById('maxRange').value = max;
    currentRange = { min, max };
    validateRange();
}


function generateRandomNumber() {
    const result = document.getElementById('result');
    const message = document.getElementById('message');
    
    if (currentRange.min >= currentRange.max) {
        message.textContent = 'Некорректный диапазон!';
        message.className = 'error';
        return;
    }

    result.textContent = '...';
    result.style.color = '#999';
    
    setTimeout(() => {
        const randomNumber = Math.floor(Math.random() * (currentRange.max - currentRange.min + 1)) + currentRange.min;
        
        result.textContent = randomNumber;
        result.style.color = '#667eea';
        
        result.style.transform = 'scale(1.1)';
        setTimeout(() => {
            result.style.transform = 'scale(1)';
        }, 200);
        
        saveResult(randomNumber);
        
        message.textContent = `Сгенерировано число ${randomNumber} в диапазоне ${currentRange.min}-${currentRange.max}`;
        message.className = 'success';
        
        setTimeout(() => {
            message.textContent = '';
            message.className = '';
        }, 3000);
        
    }, 500);
}

function saveResult(number) {
    if (!data) return;
    
    const result = {
        number: number,
        range: `${currentRange.min}-${currentRange.max}`,
        timestamp: new Date().toLocaleString('ru-RU'),
        date: new Date().toISOString()
    };
    
    data.history.unshift(result);
    
    if (data.history.length > 50) {
        data.history = data.history.slice(0, 50);
    }
    
    data.statistics.totalRolls++;
    
    data.statistics.lastRolls.unshift(number);
    if (data.statistics.lastRolls.length > 10) {
        data.statistics.lastRolls = data.statistics.lastRolls.slice(0, 10);
    }
    
    updateFrequencyStats(number);
    
    updateHistory();
    updateStats();
    
    saveToLocalStorage();
}

function updateFrequencyStats(number) {
    if (!data.statistics.mostFrequentNumbers) {
        data.statistics.mostFrequentNumbers = [];
    }
    
    let found = false;
    for (let item of data.statistics.mostFrequentNumbers) {
        if (item.number === number) {
            item.count++;
            found = true;
            break;
        }
    }
    
    if (!found) {
        data.statistics.mostFrequentNumbers.push({
            number: number,
            count: 1
        });
    }
    
    data.statistics.mostFrequentNumbers.sort((a, b) => b.count - a.count);
    
    data.statistics.mostFrequentNumbers = data.statistics.mostFrequentNumbers.slice(0, 5);
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    
    if (!data || !data.history) {
        historyList.innerHTML = '<p>История пуста</p>';
        return;
    }
    
    if (data.history.length === 0) {
        historyList.innerHTML = '<p>История пуста</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    data.history.slice(0, 10).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="history-number">${item.number}</span>
            <span class="history-range">${item.range}</span>
            <span class="history-time">${item.timestamp}</span>
        `;
        historyList.appendChild(historyItem);
    });
}

function updateStats() {
    const stats = document.getElementById('stats');
    
    if (!data || !data.statistics) {
        stats.innerHTML = '<p>Статистика недоступна</p>';
        return;
    }
    
    const totalRolls = data.statistics.totalRolls || 0;
    const lastRolls = data.statistics.lastRolls || [];
    const mostFrequent = data.statistics.mostFrequentNumbers || [];
    
    stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${totalRolls}</div>
            <div class="stat-label">Всего бросков</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${lastRolls.length > 0 ? lastRolls[0] : '-'}</div>
            <div class="stat-label">Последний бросок</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${mostFrequent.length > 0 ? mostFrequent[0].number : '-'}</div>
            <div class="stat-label">Самое частое число</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${lastRolls.length > 0 ? Math.round(lastRolls.reduce((a, b) => a + b, 0) / lastRolls.length) : '-'}</div>
            <div class="stat-label">Среднее (последние 10)</div>
        </div>
    `;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('randomizerData', JSON.stringify(data));
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('randomizerData');
        if (saved) {
            const savedData = JSON.parse(saved);
            if (savedData) {
                data = savedData;
                updateStats();
                updateHistory();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
    }
}

loadFromLocalStorage();

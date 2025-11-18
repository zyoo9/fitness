// 数据存储
let checkins = JSON.parse(localStorage.getItem('fitness_checkins') || '[]');
let bodyData = JSON.parse(localStorage.getItem('fitness_bodyData') || '[]');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 页面加载完成后隐藏加载动画
    setTimeout(() => {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }
    }, 1200);

    initTabs();
    initWeekSelector();
    initCheckin();
    initBodyData();
    updateBodyStats();
    renderWeightChart();
    initScrollAnimations();
    initNumberCounter();
});

// 标签页切换
function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab);
            
            // 移除所有active状态
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => {
                c.classList.remove('active');
            });
            
            // 添加新的active状态
            tab.classList.add('active');
            targetContent.classList.add('active');
            
            // 重新初始化滚动动画
            setTimeout(() => {
                initScrollAnimations();
                if (targetTab === 'body') {
                    initNumberCounter();
                }
            }, 100);
        });
    });
}

// 周次选择器
function initWeekSelector() {
    const weekSelect = document.getElementById('weekSelect');
    
    weekSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        document.querySelectorAll('.phase-content').forEach(phase => {
            phase.style.display = 'none';
        });
        
        if (value === '1-4') {
            document.getElementById('phase-1-4').style.display = 'block';
        } else if (value === '5-8') {
            document.getElementById('phase-5-8').style.display = 'block';
        } else if (value === '9-12') {
            document.getElementById('phase-9-12').style.display = 'block';
        }
    });
}

// 打卡功能
function initCheckin() {
    const addBtn = document.getElementById('addCheckinBtn');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    addBtn.addEventListener('click', () => openModal('checkinModal'));
    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    
    // 设置默认日期为今天
    document.getElementById('checkinDate').valueAsDate = new Date();
    
    renderCalendar();
    renderCheckinList();
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    document.getElementById('currentMonth').textContent = 
        `${currentYear}年 ${monthNames[currentMonth]}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    
    calendarGrid.innerHTML = '';
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day';
        dayHeader.style.fontWeight = '700';
        dayHeader.style.opacity = '0.5';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 检查是否是今天
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // 检查是否有打卡记录
        const hasCheckin = checkins.some(c => c.date === dateStr);
        if (hasCheckin) {
            dayElement.classList.add('has-checkin');
        }
        
        dayElement.addEventListener('click', () => {
            document.getElementById('checkinDate').value = dateStr;
            openModal('checkinModal');
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function renderCheckinList() {
    const checkinList = document.getElementById('checkinList');
    
    if (checkins.length === 0) {
        checkinList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">还没有训练记录，开始你的第一次打卡吧！</div>
            </div>
        `;
        return;
    }
    
    // 按日期排序（最新的在前）
    const sortedCheckins = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    checkinList.innerHTML = sortedCheckins.map((checkin, index) => `
        <div class="checkin-item">
            <div class="checkin-info">
                <div class="checkin-date">${formatDate(checkin.date)}</div>
                <div class="checkin-type">${checkin.type}</div>
                <div class="checkin-details">
                    ${checkin.duration ? `时长: ${checkin.duration}分钟` : ''}
                    ${checkin.notes ? ` | ${checkin.notes.substring(0, 50)}${checkin.notes.length > 50 ? '...' : ''}` : ''}
                </div>
            </div>
            <div class="checkin-actions">
                <button class="btn-delete" onclick="deleteCheckin(${index})">删除</button>
            </div>
        </div>
    `).join('');
}

function saveCheckin() {
    const date = document.getElementById('checkinDate').value;
    const type = document.getElementById('checkinType').value;
    const duration = document.getElementById('checkinDuration').value;
    const notes = document.getElementById('checkinNotes').value;
    
    if (!date || !type) {
        alert('请填写训练日期和类型');
        return;
    }
    
    const checkin = {
        date,
        type,
        duration: duration || null,
        notes: notes || '',
        createdAt: new Date().toISOString()
    };
    
    checkins.push(checkin);
    localStorage.setItem('fitness_checkins', JSON.stringify(checkins));
    
    closeModal('checkinModal');
    renderCalendar();
    renderCheckinList();
    
    // 重置表单
    document.getElementById('checkinDate').valueAsDate = new Date();
    document.getElementById('checkinType').value = '';
    document.getElementById('checkinDuration').value = '';
    document.getElementById('checkinNotes').value = '';
}

function deleteCheckin(index) {
    if (confirm('确定要删除这条记录吗？')) {
        const sortedCheckins = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
        const checkinToDelete = sortedCheckins[index];
        checkins = checkins.filter(c => c !== checkinToDelete);
        localStorage.setItem('fitness_checkins', JSON.stringify(checkins));
        renderCalendar();
        renderCheckinList();
    }
}

// 身体数据功能
function initBodyData() {
    const addBtn = document.getElementById('addBodyDataBtn');
    addBtn.addEventListener('click', () => {
        document.getElementById('bodyDate').valueAsDate = new Date();
        openModal('bodyDataModal');
    });
    
    renderBodyDataList();
}

function renderBodyDataList() {
    const bodyDataList = document.getElementById('bodyDataList');
    
    if (bodyData.length === 0) {
        bodyDataList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">还没有身体数据记录，开始记录你的身体变化吧！</div>
            </div>
        `;
        return;
    }
    
    // 按日期排序（最新的在前）
    const sortedData = [...bodyData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    bodyDataList.innerHTML = sortedData.map((data, index) => `
        <div class="body-data-item">
            <div class="body-data-info">
                <div class="body-data-date">${formatDate(data.date)}</div>
                <div class="body-data-values">
                    ${data.height ? `
                        <div class="body-data-value">
                            <div class="body-data-value-label">身高</div>
                            <div class="body-data-value-number">${data.height} cm</div>
                        </div>
                    ` : ''}
                    ${data.weight ? `
                        <div class="body-data-value">
                            <div class="body-data-value-label">体重</div>
                            <div class="body-data-value-number">${data.weight} kg</div>
                        </div>
                    ` : ''}
                    ${data.height && data.weight ? `
                        <div class="body-data-value">
                            <div class="body-data-value-label">BMI</div>
                            <div class="body-data-value-number">${calculateBMI(data.height, data.weight).toFixed(1)}</div>
                        </div>
                    ` : ''}
                </div>
                ${data.notes ? `<div style="margin-top: 10px; color: var(--text-secondary); font-size: 14px;">${data.notes}</div>` : ''}
            </div>
            <div class="checkin-actions">
                <button class="btn-delete" onclick="deleteBodyData(${index})">删除</button>
            </div>
        </div>
    `).join('');
}

function saveBodyData() {
    const date = document.getElementById('bodyDate').value;
    const height = document.getElementById('bodyHeight').value;
    const weight = document.getElementById('bodyWeight').value;
    const notes = document.getElementById('bodyNotes').value;
    
    if (!date || (!height && !weight)) {
        alert('请至少填写身高或体重');
        return;
    }
    
    const data = {
        date,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        notes: notes || '',
        createdAt: new Date().toISOString()
    };
    
    bodyData.push(data);
    localStorage.setItem('fitness_bodyData', JSON.stringify(bodyData));
    
    closeModal('bodyDataModal');
    updateBodyStats();
    renderBodyDataList();
    renderWeightChart();
    
    // 重置表单
    document.getElementById('bodyDate').valueAsDate = new Date();
    document.getElementById('bodyHeight').value = '';
    document.getElementById('bodyWeight').value = '';
    document.getElementById('bodyNotes').value = '';
}

function deleteBodyData(index) {
    if (confirm('确定要删除这条记录吗？')) {
        const sortedData = [...bodyData].sort((a, b) => new Date(b.date) - new Date(a.date));
        const dataToDelete = sortedData[index];
        bodyData = bodyData.filter(d => d !== dataToDelete);
        localStorage.setItem('fitness_bodyData', JSON.stringify(bodyData));
        updateBodyStats();
        renderBodyDataList();
        renderWeightChart();
    }
}

function updateBodyStats() {
    if (bodyData.length === 0) {
        document.getElementById('heightValue').textContent = '--';
        document.getElementById('weightValue').textContent = '--';
        document.getElementById('weightChange').textContent = '--';
        document.getElementById('bmiValue').textContent = '--';
        return;
    }
    
    // 获取最新的身高和体重
    const sortedData = [...bodyData].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestData = sortedData[0];
    const firstWeight = bodyData.find(d => d.weight)?.weight;
    const latestWeight = latestData.weight;
    
    if (latestData.height) {
        document.getElementById('heightValue').textContent = `${latestData.height} cm`;
    } else {
        document.getElementById('heightValue').textContent = '--';
    }
    
    if (latestWeight) {
        document.getElementById('weightValue').textContent = `${latestWeight} kg`;
        
        if (firstWeight && firstWeight !== latestWeight) {
            const change = latestWeight - firstWeight;
            const changeText = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
            document.getElementById('weightChange').textContent = `${changeText} kg`;
            document.getElementById('weightChange').style.color = change > 0 ? 'var(--accent-red)' : 'var(--accent-green)';
        } else {
            document.getElementById('weightChange').textContent = '--';
        }
    } else {
        document.getElementById('weightValue').textContent = '--';
        document.getElementById('weightChange').textContent = '--';
    }
    
    if (latestData.height && latestWeight) {
        const bmi = calculateBMI(latestData.height, latestWeight);
        document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    } else {
        document.getElementById('bmiValue').textContent = '--';
    }
}

function calculateBMI(height, weight) {
    return weight / Math.pow(height / 100, 2);
}

let weightChart = null;

function renderWeightChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    
    // 过滤出有体重数据的记录，按日期排序
    const weightRecords = bodyData
        .filter(d => d.weight)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (weightRecords.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📈</div>
                <div class="empty-state-text">记录体重数据后，这里会显示趋势图</div>
            </div>
        `;
        return;
    }
    
    const labels = weightRecords.map(d => formatDate(d.date, true));
    const weights = weightRecords.map(d => d.weight);
    
    if (weightChart) {
        weightChart.destroy();
    }
    
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '体重 (kg)',
                data: weights,
                borderColor: '#007aff',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#007aff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#98989d'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#98989d'
                    }
                }
            }
        }
    });
}


// 模态框功能
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 点击模态框外部关闭
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// 滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 为需要动画的元素添加观察
    document.querySelectorAll('.workout-card, .stat-card, .checkin-item, .body-data-item, .tip-card').forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });
}

// 数字计数动画
function initNumberCounter() {
    const statValues = document.querySelectorAll('.stat-value');
    
    const animateValue = (element, start, end, duration) => {
        if (!element || element.textContent === '--') return;
        
        const isNumber = /[\d.]+/.test(element.textContent);
        if (!isNumber) return;

        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;
        const range = endValue - startValue;
        const increment = range / (duration / 16);
        let current = startValue;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= endValue) || (increment < 0 && current <= endValue)) {
                current = endValue;
                clearInterval(timer);
            }
            
            const suffix = element.textContent.replace(/[\d.]+/, '');
            if (suffix.includes('cm')) {
                element.textContent = current.toFixed(1) + ' cm';
            } else if (suffix.includes('kg')) {
                element.textContent = current.toFixed(1) + ' kg';
            } else {
                element.textContent = current.toFixed(1);
            }
        }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const text = entry.target.textContent;
                const match = text.match(/([\d.]+)/);
                if (match) {
                    const value = parseFloat(match[1]);
                    animateValue(entry.target, 0, value, 1000);
                    entry.target.dataset.animated = 'true';
                }
            }
        });
    }, { threshold: 0.5 });

    statValues.forEach(stat => {
        observer.observe(stat);
    });
}

// 工具函数
function formatDate(dateStr, short = false) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (short) {
        return `${month}-${day}`;
    }
    
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];
    
    return `${year}年${month}月${day}日 星期${weekDay}`;
}


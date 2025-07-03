document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const lotteryBtn = document.getElementById('lotteryBtn');
    const testBtn = document.getElementById('testBtn');
    const courseLotteryBtn = document.getElementById('courseLotteryBtn');
    const lotteryModal = document.getElementById('lotteryModal');
    const closeLotteryBtn = document.getElementById('closeLottery');
    const spinBtn = document.getElementById('spinBtn');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const indicator = document.querySelector('.carousel-indicator');
    const result = document.getElementById('result');
    const historyList = document.getElementById('historyList');

    // 奖品列表 - 点击抽奖
    const prizes = [
        { name: 'LABUBU', probability: 0.001, stock: 1, won: 0 },  // 极低概率，库存1个
        { name: '小盲袋', probability: 0.24, stock: 240, won: 0 },
        { name: '扇子', probability: 0.25, stock: 500, won: 0 },
        { name: '学习袋', probability: 0.18, stock: 180, won: 0 },
        { name: '贴纸', probability: 0.15, stock: 300, won: 0 },
        { name: '奥特曼玩偶', probability: 0.002, stock: 2, won: 0 },  // 极低概率，库存2个
        { name: '再来一次', probability: 0.167, stock: -1, won: 0 }  // 无限库存
    ];

    // 开课抽奖专用奖品列表
    const coursePrizes = [
        { name: '特等奖：价值5000元AI学习机45天使用权+200元抵用券+labubu+学习袋', probability: 0.01, stock: 1, won: 0 },
        { name: '一等奖：价值5000元AI学习机30天使用权+100元抵用券+labubu+学习袋', probability: 0.01, stock: 1, won: 0 },
        { name: '二等奖：100元抵用券+学习袋+labubu', probability: 0.02, stock: 2, won: 0 },
        { name: '三等奖：100元抵用券+围棋套装+学习袋', probability: 0.04, stock: 4, won: 0 },
        { name: '四等奖：100元抵用券+学习袋', probability: 0.32, stock: -1, won: 0 },  // 无限库存
        { name: '再来一次', probability: 0.6, stock: -1, won: 0 }  // 无限库存
    ];

    let currentPrizeList = prizes;
    let isCourseLottery = false;
    let currentIndex = 0;
    let isSpinning = false;
    let carouselInterval;
    let consecutiveTryAgainCount = 0;
    let consecutiveFourthPrizeCount = 0;  // 新增：连续四等奖计数

    // 初始化轮播
    function initCarousel() {
        updateCarousel();
        updateIndicator();
    }

    // 更新轮播显示
    function updateCarousel() {
        carouselItems.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next');
            if (index === currentIndex) {
                item.classList.add('active');
            }
        });
    }

    // 更新指示器
    function updateIndicator() {
        const currentPrize = currentPrizeList[currentIndex];
        if (currentPrize && indicator) {
            indicator.textContent = currentPrize.name;
        }
    }

    // 下一个奖品
    function nextPrize() {
        currentIndex = (currentIndex + 1) % currentPrizeList.length;
        updateCarousel();
        updateIndicator();
    }

    // 根据概率选择奖品
    function selectPrize() {
        const random = Math.random();
        let cumulativeProbability = 0;
        let availablePrizes = [];
        
        // 首先筛选出有库存的奖品
        for (let i = 0; i < currentPrizeList.length; i++) {
            const prize = currentPrizeList[i];
            // 检查库存：stock为-1表示无限库存，stock>0表示有库存
            if (prize.stock === -1 || prize.stock > 0) {
                availablePrizes.push({...prize, originalIndex: i});
            }
        }
        
        // 如果没有可用奖品，返回"再来一次"
        if (availablePrizes.length === 0) {
            const tryAgainIndex = currentPrizeList.findIndex(prize => prize.name.includes('再来一次'));
            return tryAgainIndex !== -1 ? tryAgainIndex : currentPrizeList.length - 1;
        }
        
        // 重新计算概率分布
        const totalProbability = availablePrizes.reduce((sum, prize) => sum + prize.probability, 0);
        
        for (let i = 0; i < availablePrizes.length; i++) {
            const normalizedProbability = availablePrizes[i].probability / totalProbability;
            cumulativeProbability += normalizedProbability;
            
            if (random <= cumulativeProbability) {
                const selectedPrize = availablePrizes[i];

                // 检查是否是"再来一次"
                if (selectedPrize.name.includes('再来一次')) {
                    // 如果已经连续出现了2次"再来一次"，则重新抽奖
                    if (consecutiveTryAgainCount >= 2) {
                        // 从非"再来一次"且有库存的奖品中随机选择一个
                        const nonTryAgainPrizes = availablePrizes.filter(prize => 
                            !prize.name.includes('再来一次') && 
                            (prize.stock === -1 || prize.stock > 0)
                        );
                        if (nonTryAgainPrizes.length > 0) {
                            const randomIndex = Math.floor(Math.random() * nonTryAgainPrizes.length);
                            const selectedNonTryAgain = nonTryAgainPrizes[randomIndex];
                            consecutiveTryAgainCount = 0; // 重置计数
                            // 检查选中的奖品是否是四等奖
                            if (selectedNonTryAgain.name.includes('四等奖')) {
                                consecutiveFourthPrizeCount++;
                            } else {
                                consecutiveFourthPrizeCount = 0;
                            }
                            return selectedNonTryAgain.originalIndex;
                        }
                    }
                    consecutiveTryAgainCount++;
                    consecutiveFourthPrizeCount = 0; // 重置四等奖计数
                } else if (selectedPrize.name.includes('四等奖')) {
                    // 检查是否连续抽到四等奖（仅在开课抽奖时生效）
                    if (isCourseLottery && consecutiveFourthPrizeCount >= 2) {
                        // 从非四等奖且非"再来一次"的奖品中随机选择
                        const nonFourthPrizes = availablePrizes.filter(prize => 
                            !prize.name.includes('四等奖') && 
                            !prize.name.includes('再来一次') &&
                            (prize.stock === -1 || prize.stock > 0)
                        );
                        if (nonFourthPrizes.length > 0) {
                            const randomIndex = Math.floor(Math.random() * nonFourthPrizes.length);
                            const selectedNonFourth = nonFourthPrizes[randomIndex];
                            consecutiveFourthPrizeCount = 0; // 重置计数
                            consecutiveTryAgainCount = 0;
                            return selectedNonFourth.originalIndex;
                        }
                    }
                    consecutiveFourthPrizeCount++;
                    consecutiveTryAgainCount = 0; // 重置"再来一次"计数
                } else {
                    consecutiveTryAgainCount = 0; // 重置计数
                    consecutiveFourthPrizeCount = 0; // 重置四等奖计数
                }
                
                return selectedPrize.originalIndex;
            }
        }

        // 默认返回最后一个有库存的奖品
        const lastAvailablePrize = availablePrizes[availablePrizes.length - 1];
        if (lastAvailablePrize.name.includes('再来一次') && consecutiveTryAgainCount >= 2) {
            // 如果最后一个奖品是"再来一次"且已经连续2次，则返回倒数第二个有库存的奖品
            if (availablePrizes.length > 1) {
                consecutiveTryAgainCount = 0;
                const secondLastPrize = availablePrizes[availablePrizes.length - 2];
                if (secondLastPrize.name.includes('四等奖')) {
                    consecutiveFourthPrizeCount++;
                } else {
                    consecutiveFourthPrizeCount = 0;
                }
                return secondLastPrize.originalIndex;
            }
        }
        
        // 检查最后选中的奖品是否是四等奖
        if (lastAvailablePrize.name.includes('四等奖') && isCourseLottery && consecutiveFourthPrizeCount >= 2) {
            // 尝试选择其他奖品
            const nonFourthPrizes = availablePrizes.filter(prize => 
                !prize.name.includes('四等奖') && 
                (prize.stock === -1 || prize.stock > 0)
            );
            if (nonFourthPrizes.length > 0) {
                const randomIndex = Math.floor(Math.random() * nonFourthPrizes.length);
                const selectedNonFourth = nonFourthPrizes[randomIndex];
                consecutiveFourthPrizeCount = 0;
                if (selectedNonFourth.name.includes('再来一次')) {
                    consecutiveTryAgainCount++;
                } else {
                    consecutiveTryAgainCount = 0;
                }
                return selectedNonFourth.originalIndex;
            }
        }

        if (lastAvailablePrize.name.includes('再来一次')) {
            consecutiveTryAgainCount++;
            consecutiveFourthPrizeCount = 0;
        } else if (lastAvailablePrize.name.includes('四等奖')) {
            consecutiveFourthPrizeCount++;
            consecutiveTryAgainCount = 0;
        } else {
            consecutiveTryAgainCount = 0;
            consecutiveFourthPrizeCount = 0;
        }

        return lastAvailablePrize.originalIndex;
    }

    // 开始抽奖
    function startLottery() {
        if (isSpinning) return;

        isSpinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = '抽奖中...';
        result.textContent = '';

        // 快速轮播效果
        let spinCount = 0;
        const maxSpins = 20 + Math.floor(Math.random() * 10); // 20-30次轮播
        
        carouselInterval = setInterval(() => {
            nextPrize();
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(carouselInterval);

                // 选择最终奖品
                const finalPrizeIndex = selectPrize();
                currentIndex = finalPrizeIndex;
                updateCarousel();
                updateIndicator();

                // 显示结果
                setTimeout(() => {
                    const wonPrize = currentPrizeList[finalPrizeIndex];
                    showResult(wonPrize.name);

                    // 重置状态
                    isSpinning = false;
                    spinBtn.disabled = false;
                    spinBtn.textContent = isCourseLottery ? '开始开课抽奖' : '开始抽奖';

                    // 添加抽奖记录
                    addLotteryRecord(wonPrize.name);
                }, 500);
            }
        }, 100); // 每100ms切换一次
    }

    // 显示结果
    function showResult(prizeName) {
        if (result) {
            result.textContent = `恭喜您获得：${prizeName}`;
            
            // 根据奖品等级设置不同的背景色
            result.className = 'result';
            if (prizeName.includes('特等奖')) {
                result.classList.add('special-prize');
            } else if (prizeName.includes('一等奖')) {
                result.classList.add('first-prize');
            } else if (prizeName.includes('二等奖')) {
                result.classList.add('second-prize');
            } else if (prizeName.includes('再来一次')) {
                result.classList.add('try-again');
            }
        }
    }

    // 添加抽奖记录
    function addLotteryRecord(prizeName) {
        const record = {
            prize: prizeName,
            timestamp: Date.now(),
            type: isCourseLottery ? 'course' : 'normal'
        };

        // 根据抽奖类型选择不同的存储键
        const storageKey = isCourseLottery ? 'courseLotteryHistory' : 'normalLotteryHistory';
        let lotteryHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
        lotteryHistory.push(record);
        localStorage.setItem(storageKey, JSON.stringify(lotteryHistory));

        // 更新奖品库存
        updatePrizeStock(prizeName);

        // 刷新显示
        displayLotteryHistory();
    }

    // 显示抽奖历史
    function displayLotteryHistory() {
        if (!historyList) return;
    
        // 根据当前抽奖类型选择对应的记录
        const storageKey = isCourseLottery ? 'courseLotteryHistory' : 'normalLotteryHistory';
        const lotteryHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
        // 更新总次数显示
        const totalCountElement = document.getElementById('totalCount');
        if (totalCountElement) {
            const countText = isCourseLottery ? '抽奖总次数' : '抽奖总次数';
            totalCountElement.textContent = `${countText}: ${lotteryHistory.length}`;
        }
    
        if (lotteryHistory.length === 0) {
            const noHistoryText = isCourseLottery ? '暂无抽奖记录' : '暂无抽奖记录';
            historyList.innerHTML = `<div class="no-history">${noHistoryText}</div>`;
            return;
        }
        
        historyList.innerHTML = '';
        lotteryHistory.reverse().forEach((record, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(record.timestamp);
            const timeStr = date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
    
            // 根据奖品等级添加特殊样式
            if (record.prize.includes('特等奖')) {
                historyItem.classList.add('special');
            } else if (record.prize.includes('一等奖')) {
                historyItem.classList.add('first');
            } else if (record.prize.includes('二等奖')) {
                historyItem.classList.add('second');
            } else if (record.prize.includes('三等奖')) {
                historyItem.classList.add('third');
            } else if (record.prize.includes('四等奖')) {
                historyItem.classList.add('fourth');
            } else if (record.prize.includes('五等奖')) {
                historyItem.classList.add('fifth');
            }
    
            historyItem.innerHTML = `
                <div class="prize-name">${record.prize}</div>
                <div class="prize-time">${timeStr}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // 更新奖品库存
    function updatePrizeStock(prizeName) {
        // 找到对应的奖品并更新库存
        const prize = currentPrizeList.find(p => p.name === prizeName);
        if (prize) {
            prize.won = (prize.won || 0) + 1;
            // 只有非无限库存且库存大于0时才减少
            if (prize.stock !== -1 && prize.stock > 0) {
                prize.stock--;
            }
        }
        
        // 立即保存库存数据
        saveStockData();
        
        // 验证数据同步
        console.log(`更新奖品: ${prizeName}, 当前库存: ${prize ? prize.stock : '未找到'}, 已中奖: ${prize ? prize.won : '未找到'}`);
    }

    // 保存库存数据
    function saveStockData() {
        localStorage.setItem('normalPrizesStock', JSON.stringify(prizes));
        localStorage.setItem('coursePrizesStock', JSON.stringify(coursePrizes));
    }

    // 加载库存数据（修复版）
    function loadStockData() {
        const normalStock = localStorage.getItem('normalPrizesStock');
        const courseStock = localStorage.getItem('coursePrizesStock');
        
        if (normalStock) {
            try {
                const stockData = JSON.parse(normalStock);
                stockData.forEach((stockItem, index) => {
                    if (prizes[index] && stockItem) {
                        // 确保stock和won属性存在且为有效值
                        if (typeof stockItem.stock !== 'undefined') {
                            prizes[index].stock = stockItem.stock;
                        }
                        if (typeof stockItem.won !== 'undefined') {
                            prizes[index].won = stockItem.won;
                        }
                    }
                });
            } catch (e) {
                console.error('加载普通抽奖库存数据失败:', e);
                // 如果数据损坏，重新保存当前数据
                saveStockData();
            }
        } else {
            // 如果没有保存的数据，使用初始值并保存
            saveStockData();
        }
        
        if (courseStock) {
            try {
                const stockData = JSON.parse(courseStock);
                stockData.forEach((stockItem, index) => {
                    if (coursePrizes[index] && stockItem) {
                        // 确保stock和won属性存在且为有效值
                        if (typeof stockItem.stock !== 'undefined') {
                            coursePrizes[index].stock = stockItem.stock;
                        }
                        if (typeof stockItem.won !== 'undefined') {
                            coursePrizes[index].won = stockItem.won;
                        }
                    }
                });
            } catch (e) {
                console.error('加载开课抽奖库存数据失败:', e);
                // 如果数据损坏，重新保存当前数据
                saveStockData();
            }
        } else {
            // 如果没有保存的数据，使用初始值并保存
            saveStockData();
        }
    }

    // 事件监听器
    
    // 普通抽奖按钮
    if (lotteryBtn) {
        lotteryBtn.addEventListener('click', function() {
            isCourseLottery = false;
            currentPrizeList = prizes;

            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            lotteryModal.style.display = 'flex';
            initCarousel();
            result.textContent = '';
            spinBtn.disabled = false;
            spinBtn.textContent = '开始抽奖';

            const lotteryHeader = document.querySelector('.lottery-header h2');
            if (lotteryHeader) {
                lotteryHeader.textContent = '惠来围棋院抽奖';
            }

            updateCarousel();
            displayLotteryHistory();
        });
    }

    // 开课抽奖按钮
    if (courseLotteryBtn) {
        courseLotteryBtn.addEventListener('click', function() {
            isCourseLottery = true;
            currentPrizeList = coursePrizes;

            lotteryModal.style.display = 'flex';
            initCarousel();
            result.textContent = '';
            spinBtn.disabled = false;
            spinBtn.textContent = '开始开课抽奖';

            const lotteryHeader = document.querySelector('.lottery-header h2');
            if (lotteryHeader) {
                lotteryHeader.textContent = '开课抽奖';
            }

            displayLotteryHistory();
        });
    }

    // 关闭按钮事件
    if (closeLotteryBtn) {
        closeLotteryBtn.addEventListener('click', function() {
            lotteryModal.style.display = 'none';
            if (carouselInterval) {
                clearInterval(carouselInterval);
            }
            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.textContent = isCourseLottery ? '开始开课抽奖' : '开始抽奖';
        });
    }

    // 抽奖按钮事件
    if (spinBtn) {
        spinBtn.addEventListener('click', function() {
            if (!isSpinning) {
                startLottery();
            }
        });
    }

    // 点击模态框背景关闭
    if (lotteryModal) {
        lotteryModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                if (carouselInterval) {
                    clearInterval(carouselInterval);
                }
                isSpinning = false;
                spinBtn.disabled = false;
                spinBtn.textContent = isCourseLottery ? '开始开课抽奖' : '开始抽奖';
            }
        });
    }

    // 管理员功能
    let isAdminLoggedIn = false;
    const ADMIN_PASSWORD = '1234';

    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const adminPanelModal = document.getElementById('adminPanelModal');
    const closeAdmin = document.getElementById('closeAdmin');
    const closeAdminPanel = document.getElementById('closeAdminPanel');
    const adminPassword = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('loginBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const resetStockBtn = document.getElementById('resetStockBtn');
    const viewStockBtn = document.getElementById('viewStockBtn');
    const clearAllRecordsBtn = document.getElementById('clearAllRecordsBtn');
    const exportRecordsBtn = document.getElementById('exportRecordsBtn');
    const resetSystemBtn = document.getElementById('resetSystemBtn');

    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            adminModal.style.display = 'flex';
        });
    }

    if (closeAdmin) {
        closeAdmin.addEventListener('click', function() {
            adminModal.style.display = 'none';
            adminPassword.value = '';
        });
    }

    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', function() {
            adminPanelModal.style.display = 'none';
            isAdminLoggedIn = false;
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const password = adminPassword.value;
            const storedPassword = localStorage.getItem('adminPassword') || ADMIN_PASSWORD;
            
            if (password === storedPassword) {
                isAdminLoggedIn = true;
                adminModal.style.display = 'none';
                adminPanelModal.style.display = 'flex';
                adminPassword.value = '';
            } else {
                alert('密码错误！');
                adminPassword.value = '';
            }
        });
    }

    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }

    // 管理员功能按钮事件
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const newPassword = prompt('请输入新密码：');
            if (newPassword && newPassword.trim()) {
                localStorage.setItem('adminPassword', newPassword.trim());
                alert('密码修改成功！');
            }
        });
    }

    if (resetStockBtn) {
        resetStockBtn.addEventListener('click', function() {
            if (confirm('确定要重置所有库存吗？此操作不可撤销！')) {
                // 重置普通奖品库存为默认值
                prizes.forEach(prize => {
                    const defaultStock = defaultPrizesStock.find(p => p.name === prize.name);
                    if (defaultStock) {
                        prize.stock = defaultStock.stock;
                        prize.won = 0;
                    }
                });
                
                // 重置开课奖品库存为默认值
                coursePrizes.forEach(prize => {
                    const defaultStock = defaultCoursePrizesStock.find(p => p.name === prize.name);
                    if (defaultStock) {
                        prize.stock = defaultStock.stock;
                        prize.won = 0;
                    }
                });
                
                saveStockData();
                alert('库存重置成功！');
            }
        });
    }

    if (viewStockBtn) {
        viewStockBtn.addEventListener('click', function() {
            showStockStatus();
        });
    }

    if (clearAllRecordsBtn) {
        clearAllRecordsBtn.addEventListener('click', function() {
            if (confirm('确定要清空所有抽奖记录吗？此操作不可撤销！')) {
                localStorage.removeItem('normalLotteryHistory');
                localStorage.removeItem('courseLotteryHistory');
                displayLotteryHistory();
                alert('所有抽奖记录已清空！');
            }
        });
    }

    if (exportRecordsBtn) {
        exportRecordsBtn.addEventListener('click', function() {
            exportLotteryRecords();
        });
    }

    if (resetSystemBtn) {
        resetSystemBtn.addEventListener('click', function() {
            if (confirm('确定要重置整个系统吗？这将清空所有数据！此操作不可撤销！')) {
                // 清空所有本地存储数据
                localStorage.clear();
                alert('系统重置成功！页面将刷新。');
                location.reload();
            }
        });
    }

    // 显示库存状态（修复版）
    function showStockStatus() {
        // 先重新加载最新的库存数据
        loadStockData();
        
        // 隐藏管理员面板
        const adminPanelModal = document.getElementById('adminPanelModal');
        if (adminPanelModal) {
            adminPanelModal.style.display = 'none';
        }
        
        // 获取模态框元素
        const stockModal = document.getElementById('stockModal');
        const normalStockList = document.getElementById('normalStockList');
        const courseStockList = document.getElementById('courseStockList');
        const normalTotal = document.getElementById('normalTotal');
        const courseTotal = document.getElementById('courseTotal');
        const closeStockBtn = document.getElementById('closeStock');
        const saveStockBtn = document.getElementById('saveStockBtn');
        
        // 生成普通抽奖库存列表（可编辑）
        normalStockList.innerHTML = '';
        prizes.forEach((prize, index) => {
            const stockText = prize.stock === -1 ? '无限' : prize.stock;
            const wonCount = prize.won || 0;
            const stockClass = prize.stock === -1 ? 'unlimited' : 'limited';
            
            const stockItem = document.createElement('div');
            stockItem.className = 'stock-item';
            stockItem.innerHTML = `
                <span class="stock-item-name">${prize.name}</span>
                <div class="stock-item-info">
                    <div class="stock-input-group">
                        <span>库存:</span>
                        <input type="number" class="stock-input ${stockClass}" 
                               data-type="normal" data-index="${index}" 
                               value="${prize.stock === -1 ? '' : prize.stock}" 
                               ${prize.stock === -1 ? 'disabled' : ''}
                               min="0" step="1">
                        <button class="unlimited-btn ${prize.stock === -1 ? 'active' : ''}" 
                                data-type="normal" data-index="${index}">
                            ${prize.stock === -1 ? '有限' : '无限'}
                        </button>
                    </div>
                    <span>已中奖: <span class="stock-value won">${wonCount}次</span></span>
                </div>
            `;
            normalStockList.appendChild(stockItem);
        });
        
        // 生成开课抽奖库存列表（可编辑）
        courseStockList.innerHTML = '';
        coursePrizes.forEach((prize, index) => {
            const stockText = prize.stock === -1 ? '无限' : prize.stock;
            const wonCount = prize.won || 0;
            const stockClass = prize.stock === -1 ? 'unlimited' : 'limited';
            
            const stockItem = document.createElement('div');
            stockItem.className = 'stock-item';
            stockItem.innerHTML = `
                <span class="stock-item-name">${prize.name}</span>
                <div class="stock-item-info">
                    <div class="stock-input-group">
                        <span>库存:</span>
                        <input type="number" class="stock-input ${stockClass}" 
                               data-type="course" data-index="${index}" 
                               value="${prize.stock === -1 ? '' : prize.stock}" 
                               ${prize.stock === -1 ? 'disabled' : ''}
                               min="0" step="1">
                        <button class="unlimited-btn ${prize.stock === -1 ? 'active' : ''}" 
                                data-type="course" data-index="${index}">
                            ${prize.stock === -1 ? '有限' : '无限'}
                        </button>
                    </div>
                    <span>已中奖: <span class="stock-value won">${wonCount}次</span></span>
                </div>
            `;
            courseStockList.appendChild(stockItem);
        });
        
        // 更新统计信息
        const normalTotalCount = prizes.reduce((sum, prize) => sum + (prize.won || 0), 0);
        const courseTotalCount = coursePrizes.reduce((sum, prize) => sum + (prize.won || 0), 0);
        
        normalTotal.textContent = normalTotalCount;
        courseTotal.textContent = courseTotalCount;
        
        // 无限/有限按钮事件
        document.querySelectorAll('.unlimited-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const index = parseInt(this.dataset.index);
                const input = document.querySelector(`input[data-type="${type}"][data-index="${index}"]`);
                const isUnlimited = this.classList.contains('active');
                
                if (isUnlimited) {
                    // 切换为有限库存
                    this.classList.remove('active');
                    this.textContent = '无限';
                    input.disabled = false;
                    input.value = '10'; // 默认值
                    input.className = 'stock-input limited';
                } else {
                    // 切换为无限库存
                    this.classList.add('active');
                    this.textContent = '有限';
                    input.disabled = true;
                    input.value = '';
                    input.className = 'stock-input unlimited';
                }
            });
        });
        
        // 保存按钮事件
        saveStockBtn.onclick = function() {
            // 收集所有输入的库存数据
            const normalInputs = document.querySelectorAll('input[data-type="normal"]');
            const courseInputs = document.querySelectorAll('input[data-type="course"]');
            
            // 更新普通抽奖库存
            normalInputs.forEach(input => {
                const index = parseInt(input.dataset.index);
                if (input.disabled) {
                    prizes[index].stock = -1; // 无限库存
                } else {
                    const value = parseInt(input.value) || 0;
                    prizes[index].stock = Math.max(0, value); // 确保非负数
                }
            });
            
            // 更新开课抽奖库存
            courseInputs.forEach(input => {
                const index = parseInt(input.dataset.index);
                if (input.disabled) {
                    coursePrizes[index].stock = -1; // 无限库存
                } else {
                    const value = parseInt(input.value) || 0;
                    coursePrizes[index].stock = Math.max(0, value); // 确保非负数
                }
            });
            
            // 保存到本地存储
            saveStockData();
            
            // 重新显示库存状态
            showStockStatus();
            
            alert('库存修改已保存！');
        };
        
        // 显示模态框
        stockModal.style.display = 'block';
        
        // 关闭按钮事件
        closeStockBtn.onclick = function() {
            stockModal.style.display = 'none';
        };
        
        // 点击背景关闭
        stockModal.onclick = function(e) {
            if (e.target === stockModal) {
                stockModal.style.display = 'none';
            }
        };
    }

    // 导出抽奖记录
    function exportLotteryRecords() {
        const normalHistory = JSON.parse(localStorage.getItem('normalLotteryHistory') || '[]');
        const courseHistory = JSON.parse(localStorage.getItem('courseLotteryHistory') || '[]');
        
        let exportData = '抽奖记录导出\n\n';
        
        exportData += '=== 普通抽奖记录 ===\n';
        normalHistory.forEach(record => {
            const date = new Date(record.timestamp).toLocaleString('zh-CN');
            exportData += `${date} - ${record.prize}\n`;
        });
        
        exportData += '\n=== 开课抽奖记录 ===\n';
        courseHistory.forEach(record => {
            const date = new Date(record.timestamp).toLocaleString('zh-CN');
            exportData += `${date} - ${record.prize}\n`;
        });
        
        // 创建下载链接
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `抽奖记录_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 页面初始化
    // 刷新库存数据
    function refreshStockData() {
        loadStockData();
        alert('库存数据已刷新！');
    }
    
    // 添加库存数据加载
    loadStockData();
    
    isCourseLottery = false;
    currentPrizeList = prizes;
    displayLotteryHistory();
});

    // 默认库存配置
    const defaultPrizesStock = [
        { name: 'LABUBU', stock: 1 },
        { name: '小盲袋', stock: 240 },
        { name: '扇子', stock: 500 },
        { name: '学习袋', stock: 180 },
        { name: '贴纸', stock: 300 },
        { name: '奥特曼玩偶', stock: 2 },
        { name: '再来一次', stock: -1 }
    ];

    const defaultCoursePrizesStock = [
        { name: '特等奖：价值5000元AI学习机45天使用权+200元抵用券+labubu+学习袋', stock: 1 },
        { name: '一等奖：价值5000元AI学习机30天使用权+100元抵用券+labubu+学习袋', stock: 1 },
        { name: '二等奖：100元抵用券+学习袋+labubu', stock: 2 },
        { name: '三等奖：100元抵用券+围棋套装+学习袋', stock: 4 },
        { name: '四等奖：100元抵用券+学习袋', stock: -1 },
        { name: '再来一次', stock: -1 }
    ];

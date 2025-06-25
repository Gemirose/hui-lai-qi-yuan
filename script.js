document.addEventListener('DOMContentLoaded', function() {
    const lotteryBtn = document.getElementById('lotteryBtn');
    const testBtn = document.getElementById('testBtn');
    const lotteryModal = document.getElementById('lotteryModal');
    const closeLotteryBtn = document.getElementById('closeLottery');
    const spinBtn = document.getElementById('spinBtn');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const indicator = document.querySelector('.carousel-indicator');
    const result = document.getElementById('result');

    // 奖品列表
    const prizes = [
        { name: '特等奖：全能学习机两个月使用权', probability: 0.002 },
        { name: '一等奖：labubu', probability: 0.003 },
        { name: '二等奖：大娃娃', probability: 0.135 },
        { name: '三等奖：小娃娃', probability: 0.18 },
        { name: '四等奖：精美手账本', probability: 0.22 },
        { name: '五等奖：贴纸', probability: 0.31 },
        { name: '再来一次', probability: 0.15 }
    ];

    let currentIndex = 0;
    let isSpinning = false;
    let spinState = 'ready';
    let carouselInterval;

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
        const currentPrize = prizes[currentIndex];
        indicator.textContent = currentPrize.name;
    }

    // 下一个奖品
    function nextPrize() {
        currentIndex = (currentIndex + 1) % prizes.length;
        updateCarousel();
        updateIndicator();
    }

    // 开始快速轮播
    function startCarousel() {
        carouselInterval = setInterval(nextPrize, 100); // 每100ms切换一次
    }

    // 停止轮播
    function stopCarousel() {
        clearInterval(carouselInterval);
    }

    // 根据概率选择奖品
    function selectPrizeByProbability() {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < prizes.length; i++) {
            cumulativeProbability += prizes[i].probability;
            if (random <= cumulativeProbability) {
                return i;
            }
        }
        return prizes.length - 1; // 默认返回最后一个
    }

    // 抽奖按钮点击事件
    lotteryBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);

        lotteryModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        initCarousel();
        initHistory(); // 初始化历史记录
    });

    // 关闭抽奖界面
    closeLotteryBtn.addEventListener('click', function() {
        lotteryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        result.textContent = '';
        stopCarousel();
        currentIndex = 0;
        spinState = 'ready';
        spinBtn.textContent = '开始抽奖';
        spinBtn.disabled = false;
        initCarousel();
    });

    // 点击模态框背景关闭
    lotteryModal.addEventListener('click', function(e) {
        if (e.target === lotteryModal) {
            closeLotteryBtn.click();
        }
    });

    // 开始抽奖 - 二次点击停止
    spinBtn.addEventListener('click', function() {
        if (spinState === 'ready') {
            // 第一次点击：开始轮播
            spinState = 'spinning';
            this.textContent = '点击停止';
            result.textContent = '';
            startCarousel();
            
        } else if (spinState === 'spinning') {
            // 第二次点击：停止并显示结果
            spinState = 'waiting';
            this.disabled = true;
            this.textContent = '停止中...';
            
            // 选择最终奖品
            const finalPrizeIndex = selectPrizeByProbability();
            
            // 让轮播慢慢停在选中的奖品上
            setTimeout(() => {
                stopCarousel();
                currentIndex = finalPrizeIndex;
                updateCarousel();
                updateIndicator();
                
                setTimeout(() => {
                    const prize = prizes[finalPrizeIndex];
                    result.textContent = `🎉 恭喜您获得：${prize.name} 🎉`;
                    
                    // 添加到抽奖记录
                    addLotteryRecord(prize.name);
                    
                    this.disabled = false;
                    this.textContent = '再次抽奖';
                    spinState = 'ready';
                }, 500);
            }, 1000);
        }
    });

    const testModal = document.getElementById('testModal');
    const closeTestBtn = document.getElementById('closeTest');
    const questionContainer = document.getElementById('questionContainer');
    const testResult = document.getElementById('testResult');
    const questionNumber = document.getElementById('questionNumber');
    const totalQuestions = document.getElementById('totalQuestions');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const nextQuestion = document.getElementById('nextQuestion');
    const restartTest = document.getElementById('restartTest');

    // 围棋常识题库
    const questions = [
        {
            question: "围棋棋盘有多少个交叉点？",
            options: ["324个", "361个", "400个", "256个"],
            correct: 1
        },
        {
            question: "围棋中，黑棋和白棋哪个先下？",
            options: ["白棋先下", "黑棋先下", "随意选择", "猜拳决定"],
            correct: 1
        },
        {
            question: "围棋的基本规则是什么？",
            options: ["吃掉对方所有棋子", "围地多者获胜", "先连成五子", "占据中心位置"],
            correct: 1
        },
        {
            question: "围棋起源于哪个国家？",
            options: ["日本", "韩国", "中国", "印度"],
            correct: 2
        },
        {
            question: "围棋中'气'是指什么？",
            options: ["棋子的呼吸点", "棋手的心情", "比赛时间", "棋盘的角落"],
            correct: 0
        }
    ];

    let currentQuestionIndex = 0;
    let userAnswers = [];
    let score = 0;

    // 初始化测试
    function initTest() {
        currentQuestionIndex = 0;
        userAnswers = [];
        score = 0;
        totalQuestions.textContent = questions.length;
        showQuestion();
        questionContainer.style.display = 'block';
        testResult.style.display = 'none';
    }

    // 显示当前问题
    function showQuestion() {
        const question = questions[currentQuestionIndex];
        questionNumber.textContent = currentQuestionIndex + 1;
        questionText.textContent = question.question;
        
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => selectOption(index, button);
            optionsContainer.appendChild(button);
        });
        
        nextQuestion.style.display = 'none';
    }

    // 选择选项
    function selectOption(selectedIndex, selectedButton) {
        const question = questions[currentQuestionIndex];
        const options = optionsContainer.querySelectorAll('.option-btn');
        
        // 禁用所有选项
        options.forEach(btn => btn.disabled = true);
        
        // 只标记用户选择的答案，不显示正确答案
        selectedButton.classList.add('selected');
        
        // 记录答案
        userAnswers[currentQuestionIndex] = selectedIndex;
        if (selectedIndex === question.correct) {
            score++;
        }
        
        // 2秒后自动跳转到下一题或显示结果
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                showQuestion();
            } else {
                showResult();
            }
        }, 2000);
    }

    // 下一题或显示结果
    nextQuestion.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            showResult();
        }
    });

    // 显示测试结果
    function showResult() {
        questionContainer.style.display = 'none';
        testResult.style.display = 'block';
        
        // 生成98.90%到99.99%之间的随机百分比
        const randomPercentage = (Math.random() * (99.99 - 98.90) + 98.90).toFixed(2);
        const percentageElement = document.getElementById('percentageValue');
        if (percentageElement) {
            percentageElement.textContent = randomPercentage;
        }
    }

    // 重新开始测试
    restartTest.addEventListener('click', function() {
        initTest();
    });

    // 测试按钮点击事件
    testBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);

        testModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        initTest();
    });

    // 关闭测试界面
    closeTestBtn.addEventListener('click', function() {
        testModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // 点击模态框背景关闭
    testModal.addEventListener('click', function(e) {
        if (e.target === testModal) {
            closeTestBtn.click();
        }
    });

    // 添加键盘支持
    document.addEventListener('keydown', function(e) {
        if (e.key === '1') {
            lotteryBtn.click();
        } else if (e.key === '2') {
            testBtn.click();
        } else if (e.key === 'Escape' && lotteryModal.style.display === 'flex') {
            closeLotteryBtn.click();
        } else if (e.key === 'Escape' && testModal.style.display === 'flex') {
            closeTestBtn.click();
        } else if (e.key === ' ' && lotteryModal.style.display === 'flex') {
            e.preventDefault();
            spinBtn.click();
        }
    });

    // 添加鼠标跟踪效果
    document.addEventListener('mousemove', function(e) {
        const content = document.querySelector('.content');
        if (!content || lotteryModal.style.display === 'flex' || testModal.style.display === 'flex') return;
        
        const rect = content.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        content.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    // 鼠标离开时重置
    document.addEventListener('mouseleave', function() {
        const content = document.querySelector('.content');
        if (content && lotteryModal.style.display !== 'flex' && testModal.style.display !== 'flex') {
            content.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }
    });

    // 抽奖记录相关变量
    const totalCountElement = document.getElementById('totalCount');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // 抽奖记录数组
    let lotteryHistory = JSON.parse(localStorage.getItem('lotteryHistory')) || [];

    // 初始化记录显示
    function initHistory() {
        updateHistoryDisplay();
        updateTotalCount();
    }

    // 更新总次数显示
    function updateTotalCount() {
        if (totalCountElement) {
            totalCountElement.textContent = `总次数: ${lotteryHistory.length}`;
        }
    }

    // 更新历史记录显示
    function updateHistoryDisplay() {
        if (!historyList) return;
        
        if (lotteryHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">暂无抽奖记录</div>';
            return;
        }

        const historyHTML = lotteryHistory.map((record, index) => {
            const prizeClass = getPrizeClass(record.prize);
            const time = new Date(record.timestamp).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="history-item ${prizeClass}">
                    <div class="prize-info">
                        <div class="prize-name">${record.prize}</div>
                        <div class="prize-time">${time}</div>
                    </div>
                    <div class="prize-number">#${index + 1}</div>
                </div>
            `;
        }).join('');
        
        historyList.innerHTML = historyHTML;
    }

    // 根据奖品获取样式类名
    function getPrizeClass(prizeName) {
        if (prizeName.includes('特等奖')) return 'special';
        if (prizeName.includes('一等奖')) return 'first';
        if (prizeName.includes('二等奖')) return 'second';
        if (prizeName.includes('三等奖')) return 'third';
        if (prizeName.includes('四等奖')) return 'fourth';
        if (prizeName.includes('五等奖')) return 'fifth';
        return '';
    }

    // 添加抽奖记录
    function addLotteryRecord(prizeName) {
        const record = {
            prize: prizeName,
            timestamp: Date.now()
        };
        
        lotteryHistory.push(record);
        localStorage.setItem('lotteryHistory', JSON.stringify(lotteryHistory));
        updateHistoryDisplay();
        updateTotalCount();
    }

    // 清空记录
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('确定要清空所有抽奖记录吗？')) {
                lotteryHistory = [];
                localStorage.removeItem('lotteryHistory');
                updateHistoryDisplay();
                updateTotalCount();
            }
        });
    }

    // 初始化历史记录
    initHistory();

});
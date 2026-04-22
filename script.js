/**
 * 徐发富个人网站 - 折页效果
 * 中间重点显示，左右折叠效果
 * 限制只能逐页切换，不能跨页跳转
 * 只有中央页面允许交互，左右区域点击仅用于翻页
 * 只展示相邻的上一张和下一张，其他隐藏
 * 新增：停留3秒后文字逐行跳动阅读效果（根据文字长度动态调整阅读时间）
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取所有面板
    const panels = document.querySelectorAll('.panel');
    
    // 当前页面索引
    let currentPage = 0;
    const totalPages = panels.length;
    
    // 阅读效果相关变量
    let readingTimer = null;
    let currentReadingLine = null;
    let readingTimeout = null;
    const READING_DELAY = 3000; // 3秒后开始阅读效果
    
    // 阅读速度配置（毫秒/字符）
    const READING_SPEED = {
        BASE_TIME: 800,      // 基础阅读时间（毫秒）
        CHAR_TIME: 45,       // 每字符阅读时间（毫秒）
        MIN_TIME: 1000,      // 最短阅读时间（毫秒）
        MAX_TIME: 4000       // 最长阅读时间（毫秒）
    };
    
    // 初始化
    init();
    
    function init() {
        // 绑定键盘事件
        document.addEventListener('keydown', handleKeyboard);
        
        // 绑定触摸滑动事件
        initTouchEvents();
        
        // 绑定鼠标滚轮事件
        initWheelEvent();
        
        // 绑定全局点击事件（用于判断左右区域点击）
        initGlobalClickHandler();
        
        // 初始化页面状态
        updatePageStates();
        
        // 启动当前页面的阅读效果计时
        startReadingTimer();
    }
    
    /**
     * 计算阅读时间（根据文字长度）
     * 基于成年人平均阅读速度：300-400字/分钟 ≈ 5-7字/秒
     * 每字符约150-200毫秒，加上基础反应时间
     */
    function calculateReadingTime(text) {
        // 去除空白字符计算实际长度
        const charCount = text.replace(/\s/g, '').length;
        
        // 计算阅读时间：基础时间 + 字符数 × 每字符时间
        let readingTime = READING_SPEED.BASE_TIME + (charCount * READING_SPEED.CHAR_TIME);
        
        // 限制在最小和最大时间之间
        readingTime = Math.max(READING_SPEED.MIN_TIME, Math.min(READING_SPEED.MAX_TIME, readingTime));
        
        return readingTime;
    }
    
    /**
     * 启动阅读效果计时器
     */
    function startReadingTimer() {
        // 清除之前的计时器
        clearReadingEffects();
        
        // 设置新的计时器，3秒后开始阅读效果
        readingTimer = setTimeout(() => {
            startLineByLineReading();
        }, READING_DELAY);
    }
    
    /**
     * 清除所有阅读效果
     */
    function clearReadingEffects() {
        if (readingTimer) {
            clearTimeout(readingTimer);
            readingTimer = null;
        }
        
        if (readingTimeout) {
            clearTimeout(readingTimeout);
            readingTimeout = null;
        }
        
        // 移除所有阅读高亮
        document.querySelectorAll('.reading-line').forEach(el => {
            el.classList.remove('reading-line');
        });
        
        currentReadingLine = null;
    }
    
    /**
     * 开始逐行阅读效果（根据文字长度动态调整时间）
     */
    function startLineByLineReading() {
        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;
        
        // 获取当前页面所有可阅读的文字行
        const readableElements = activePanel.querySelectorAll('.exp-section li, .exp-section p, .skill-desc, .evaluation-content p, .project-desc, .award-name');
        
        if (readableElements.length === 0) return;
        
        let currentIndex = 0;
        
        // 递归函数：逐行高亮
        function readNextLine() {
            // 如果页面已经切换，停止阅读效果
            if (!activePanel.classList.contains('active')) {
                return;
            }
            
            // 移除之前的高亮
            if (currentReadingLine) {
                currentReadingLine.classList.remove('reading-line');
            }
            
            // 如果已经读完所有行，停止阅读效果
            if (currentIndex >= readableElements.length) {
                currentReadingLine = null;
                return;
            }
            
            // 高亮当前行
            const currentElement = readableElements[currentIndex];
            highlightLine(currentElement);
            currentIndex++;
            
            // 计算下一行的阅读时间（基于当前行文字长度）
            const text = currentElement.textContent || '';
            const nextLineDelay = calculateReadingTime(text);
            
            // 设置定时器阅读下一行
            readingTimeout = setTimeout(() => {
                readNextLine();
            }, nextLineDelay);
        }
        
        // 开始阅读第一行
        readNextLine();
        
        // 将控制函数存储到panel上，方便后续清理
        activePanel.dataset.readingActive = 'true';
    }
    
    /**
     * 高亮指定行
     */
    function highlightLine(element) {
        if (!element) return;
        
        element.classList.add('reading-line');
        currentReadingLine = element;
        
        // 将元素滚动到可视区域（如果需要）
        const panel = element.closest('.panel');
        if (panel) {
            const elementRect = element.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            
            // 如果元素在可视区域下方，滚动使其可见
            if (elementRect.bottom > panelRect.bottom - 50) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    /**
     * 更新所有页面状态
     * 根据当前页面设置 prev / active / next / hidden 类
     * 只显示相邻的上一张和下一张，其他隐藏
     */
    function updatePageStates() {
        panels.forEach((panel, index) => {
            // 清除所有状态类
            panel.classList.remove('prev', 'active', 'next', 'prev-prev', 'next-next', 'hidden');
            
            if (index === currentPage) {
                // 当前页面
                panel.classList.add('active');
            } else if (index === currentPage - 1) {
                // 上一张（左侧相邻）
                panel.classList.add('prev');
            } else if (index === currentPage + 1) {
                // 下一张（右侧相邻）
                panel.classList.add('next');
            } else if (index < currentPage - 1) {
                // 左侧非相邻页面 - 隐藏
                panel.classList.add('prev-prev');
            } else if (index > currentPage + 1) {
                // 右侧非相邻页面 - 隐藏
                panel.classList.add('next-next');
            }
        });
    }
    
    /**
     * 上一页
     */
    function goToPrevPage() {
        if (currentPage > 0) {
            // 清除当前页面的阅读效果
            clearCurrentPageReading();
            
            currentPage--;
            updatePageStates();
            
            // 启动新页面的阅读效果计时
            startReadingTimer();
        }
    }
    
    /**
     * 下一页
     */
    function goToNextPage() {
        if (currentPage < totalPages - 1) {
            // 清除当前页面的阅读效果
            clearCurrentPageReading();
            
            currentPage++;
            updatePageStates();
            
            // 启动新页面的阅读效果计时
            startReadingTimer();
        }
    }
    
    /**
     * 清除当前页面的阅读效果
     */
    function clearCurrentPageReading() {
        clearReadingEffects();
        
        // 清除所有页面的阅读标记
        panels.forEach(panel => {
            delete panel.dataset.readingActive;
        });
    }
    
    /**
     * 全局点击处理器
     * 判断点击位置：左侧区域点击上一页，右侧区域点击下一页，中央区域允许正常交互
     */
    function initGlobalClickHandler() {
        document.addEventListener('click', (e) => {
            // 如果点击的是链接、按钮或输入框，不处理（让元素自己的事件处理）
            if (e.target.tagName === 'A' || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'INPUT' ||
                e.target.closest('a') ||
                e.target.closest('button')) return;
            
            // 获取点击位置相对于视口的X坐标
            const clickX = e.clientX;
            const screenWidth = window.innerWidth;
            
            // 定义中央区域范围（激活面板的区域，约45vw宽度）
            // 中央区域：屏幕宽度的27.5% 到 72.5%（中间45%区域）
            const centerStart = screenWidth * 0.275;
            const centerEnd = screenWidth * 0.725;
            
            // 判断点击位置
            if (clickX < centerStart) {
                // 点击左侧区域 - 上一页
                e.preventDefault();
                e.stopPropagation();
                goToPrevPage();
            } else if (clickX > centerEnd) {
                // 点击右侧区域 - 下一页
                e.preventDefault();
                e.stopPropagation();
                goToNextPage();
            }
            // 点击中央区域不做处理，允许正常交互
        }, true); // 使用捕获阶段，确保在元素事件之前处理
    }
    
    /**
     * 键盘事件处理
     */
    function handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                goToPrevPage();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                goToNextPage();
                break;
            // 禁用Home和End键的跨页跳转
            case 'Home':
            case 'End':
                e.preventDefault();
                break;
        }
    }
    
    /**
     * 触摸滑动事件
     */
    function initTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    // 向右滑动 - 上一页
                    goToPrevPage();
                } else {
                    // 向左滑动 - 下一页
                    goToNextPage();
                }
            }
        }
    }
    
    /**
     * 鼠标滚轮事件
     */
    function initWheelEvent() {
        let wheelTimeout = null;
        let accumulatedDelta = 0;
        const threshold = 50;
        
        document.addEventListener('wheel', (e) => {
            // 如果当前焦点在可滚动元素内，不处理
            const activePanel = document.querySelector('.panel.active');
            if (activePanel) {
                const isScrollable = activePanel.scrollHeight > activePanel.clientHeight;
                const isAtTop = activePanel.scrollTop === 0;
                const isAtBottom = activePanel.scrollTop + activePanel.clientHeight >= activePanel.scrollHeight - 1;
                
                // 如果在顶部且向上滚动，或者在底部且向下滚动，则切换页面
                if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    // 继续处理页面切换
                } else if (isScrollable) {
                    // 允许正常滚动
                    return;
                }
            }
            
            e.preventDefault();
            
            accumulatedDelta += e.deltaY;
            
            if (wheelTimeout) {
                clearTimeout(wheelTimeout);
            }
            
            wheelTimeout = setTimeout(() => {
                if (Math.abs(accumulatedDelta) > threshold) {
                    if (accumulatedDelta > 0) {
                        goToNextPage();
                    } else {
                        goToPrevPage();
                    }
                }
                accumulatedDelta = 0;
            }, 50);
        }, { passive: false });
    }
});

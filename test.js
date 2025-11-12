window.addEventListener('DOMContentLoaded', () => {
    // 1. 初始元素获取与基础配置
    const blackMask = document.querySelector('.black-mask');
    const startText = document.querySelector('.start-text');
    const startgame = document.querySelector('.start-game');
    const targetSpot = document.querySelector('.target-spot');
    const gameContainer = document.querySelector('.game-container');
    const startPlayer = document.querySelector('.start-game .player'); // 开始界面的人物
    const gamePlayer = document.querySelector('.game-container .player'); // 游戏界面的人物
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const progressCircles = document.querySelectorAll('.circle');
    const quizModal = document.getElementById('quizModal');
    const quizOptions = document.querySelectorAll('.quiz-option');
    
    // 当前活动的玩家元素
    let player = startPlayer; // 默认使用开始界面的人物
    // 游戏状态变量
    let positionX = 50; // 小人水平位置（百分比）
    let positionY = 30; // 小人垂直位置（百分比，底部为基准）
    const groundHeight = 30; // 地面高度（与CSS一致）
    let isJumping = false; // 跳跃状态标记
    let jumpForce = 0; // 跳跃力度
    let collectedSpots = 0; // 收集的光点数量
    const maxSpots = 3; // 最大光点数量（对应3个进度圈）
    
    // 2. 页面初始化与游戏启动
    setTimeout(() => {
        blackMask.style.opacity = '0';
    }, 100);
    
    // 点击任意位置启动游戏
    document.addEventListener('click', () => {
        startText.style.opacity = '0';
        blackMask.style.opacity = '0';
        startgame.classList.add('active');
        
        // 创建流水声
        createWaterSound();
        
        // 生成固定目标光点并确保显示
        generateTargetSpot();
        targetSpot.style.display = 'block'; // 确保目标光点可见

        // 显示开始界面的人物
        startPlayer.style.display = 'block';
        startPlayer.style.left = `${positionX}%`;
        startPlayer.style.bottom = `${positionY}%`;

        // 移除黑幕（动画结束后）
        setTimeout(() => {
            blackMask.style.display = 'none';
        }, 2000);
    }, { once: true });
    


    // 3. 音频效果（流水声）
    let audioContext;
    function createWaterSound() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.1;
            gainNode.connect(audioContext.destination);
            
            // 基础频率振荡器
            const oscillator1 = audioContext.createOscillator();
            oscillator1.type = 'sine';
            oscillator1.frequency.value = 220;
            const modulator1 = audioContext.createOscillator();
            modulator1.type = 'sine';
            modulator1.frequency.value = 2;
            const modGain1 = audioContext.createGain();
            modGain1.gain.value = 5;
            
            modulator1.connect(modGain1);
            modGain1.connect(oscillator1.frequency);
            oscillator1.connect(gainNode);
            
            // 高频振荡器
            const oscillator2 = audioContext.createOscillator();
            oscillator2.type = 'sine';
            oscillator2.frequency.value = 440;
            const modulator2 = audioContext.createOscillator();
            modulator2.type = 'sine';
            modulator2.frequency.value = 3;
            const modGain2 = audioContext.createGain();
            modGain2.gain.value = 8;
            
            modulator2.connect(modGain2);
            modGain2.connect(oscillator2.frequency);
            oscillator2.connect(gainNode);
            
            // 启动音频
            oscillator1.start();
            modulator1.start();
            oscillator2.start();
            modulator2.start();
        } catch (e) {
            console.log('音频初始化失败:', e);
        }
    }
    
    

    // 4. 光点生成（仅在人物可跳到的范围内）
function generateLightSpots() {
    // 清除现有光点
    document.querySelectorAll('.light-spot').forEach(spot => spot.remove());
    
    // 计算人物可触及的完整范围
    const jumpMaxRise = 36; // 跳跃总高度(8+7+...+1)
    const verticalMin = groundHeight; // 地面高度(30%)
    const verticalMax = groundHeight + jumpMaxRise; // 最大跳跃高度(66%)
    const horizontalMin = 10; // 人物可移动的左边界
    const horizontalMax = 90; // 人物可移动的右边界
    
    // 为了让光点更分散，将范围划分为多个子区域
    // 水平方向分3个区域，垂直方向分3个区域，共9个区域
    const horizontalSegments = 3;
    const verticalSegments = 3;
    const horizontalStep = (horizontalMax - horizontalMin) / horizontalSegments;
    const verticalStep = (verticalMax - verticalMin) / verticalSegments;
    
    // 记录已使用的区域，避免光点集中在同一区域
    const usedSegments = new Set();
    
    for (let i = 0; i < maxSpots; i++) {
        const spot = document.createElement('div');
        spot.classList.add('light-spot');
        
        // 选择一个未使用的区域，确保分散
        let segmentKey;
        do {
            const hSegment = Math.floor(Math.random() * horizontalSegments);
            const vSegment = Math.floor(Math.random() * verticalSegments);
            segmentKey = `${hSegment}-${vSegment}`;
        } while (usedSegments.has(segmentKey) && usedSegments.size < horizontalSegments * verticalSegments);
        
        usedSegments.add(segmentKey);
        const [hSegment, vSegment] = segmentKey.split('-').map(Number);
        
        // 在选定的区域内生成随机位置
        const spotX = Math.floor(
            Math.random() * horizontalStep + horizontalMin + hSegment * horizontalStep
        );
        const spotY = Math.floor(
            Math.random() * verticalStep + verticalMin + vSegment * verticalStep
        );
        
        spot.style.left = `${spotX}%`;
        spot.style.bottom = `${spotY}%`;
        
        gameContainer.appendChild(spot);
    }
}
    
// 生成固定在人物初始头顶的目标光点（作为“终点”）
function generateTargetSpot() {
  // 人物初始位置（和你代码中positionX、positionY的初始值保持一致）
  const playerInitialX = 50; // 人物初始水平位置（百分比）
  const playerInitialY = 30; // 人物初始垂直位置（百分比，地面高度）
  
  // 光点相对于人物头顶的偏移量（可调整）
  const offsetX = 0; // 水平偏移（0=正上方）
  const offsetY = 15; // 垂直偏移（15=在人物头顶上方15%的位置，需要跳跃才能碰到）
  
  // 计算光点的固定位置（基于人物初始位置+偏移量）
  const spotX = playerInitialX + offsetX;
  const spotY = playerInitialY + offsetY;

  // 设置光点位置（固定不变）
  targetSpot.style.left = `${spotX}%`;
  targetSpot.style.bottom = `${spotY}%`;
}

    // 5. 碰撞检测（优化：扩大可收集范围，大致碰到即收集）
function checkCollision() {
        // 使用当前活动的player元素
        const playerRect = player.getBoundingClientRect();
        // 扩大小人的碰撞范围（向四周各扩展15px）
        const extendedPlayerRect = {
            left: playerRect.left - 15,
            right: playerRect.right + 15,
            top: playerRect.top - 15,
            bottom: playerRect.bottom + 15
        };
        
        // 只在游戏界面激活时检查与随机光点的碰撞
        if (gameContainer.classList.contains('active')) {
            document.querySelectorAll('.light-spot').forEach(spot => {
                const spotRect = spot.getBoundingClientRect();
                
                // 宽松的碰撞条件：扩展后的小人范围与光点有重叠即收集
                if (
                    extendedPlayerRect.left < spotRect.right &&
                    extendedPlayerRect.right > spotRect.left &&
                    extendedPlayerRect.top < spotRect.bottom &&
                    extendedPlayerRect.bottom > spotRect.top
                ) {
                    // 收集光点
                    spot.remove();
                    collectedSpots++;
                    
                    // 填充进度圈
                    if (collectedSpots <= maxSpots) {
                        progressCircles[collectedSpots - 1].classList.add('filled');
                    }
                    
                    // 集满3个光点，显示问答界面
                    if (collectedSpots === maxSpots) {
                        setTimeout(() => {
                            quizModal.classList.add('active');
                        }, 500);
                    }
                }
            });
        }
        
        // 检查与固定光点的碰撞
        if (targetSpot && targetSpot.style.display !== 'none') {
            const fixedLightRect = targetSpot.getBoundingClientRect();
            if (
                extendedPlayerRect.left < fixedLightRect.right &&
                extendedPlayerRect.right > fixedLightRect.left &&
                extendedPlayerRect.top < fixedLightRect.bottom &&
                extendedPlayerRect.bottom > fixedLightRect.top
            ) {
                // 碰到固定光点后：隐藏光点，显示游戏界面
                targetSpot.style.display = 'none';
                
                // 切换到游戏界面的人物
                player = gamePlayer;
                gamePlayer.style.display = 'block';
                gamePlayer.style.left = `${positionX}%`;
                gamePlayer.style.bottom = `${positionY}%`;
                
                // 激活游戏容器
                gameContainer.classList.add('active');
                
                // 生成游戏中的光点
                generateLightSpots();
                
                // 隐藏开始界面（缩短延迟时间）
                setTimeout(() => {
                    startgame.style.opacity = '0';
                    // 直接隐藏开始界面，不再有额外延迟
                    startgame.style.display = 'none';
                }, 100); // 从500ms减少到100ms
            }
        }
}

    // 6. 跳跃逻辑（超级玛丽式抛物线）
    function jump() {
        if (isJumping) return;
        
        isJumping = true;
        jumpForce = 8; // 跳跃高度
        
        const jumpInterval = setInterval(() => {
            // 上升阶段
            if (jumpForce > 0) {
                positionY += jumpForce;
                jumpForce -= 1; // 重力衰减
            } 
            // 下降阶段
            else if (positionY > groundHeight) {
                positionY -= 8;
            } 
            // 落地
            else {
                positionY = groundHeight;
                clearInterval(jumpInterval);
                isJumping = false;
            }
            
            // 更新当前活动小人的位置
            player.style.bottom = `${positionY}%`;
            // 跳跃过程中持续检测碰撞
            checkCollision();
        }, 30);
    }
    
    // 7. 操控逻辑（左右移动+跳跃）
    // 按钮控制
    leftBtn.addEventListener('click', () => {
        if (positionX > 10) {
            positionX -= 5;
            player.style.left = `${positionX}%`;
            checkCollision();
        }
    });
    
    rightBtn.addEventListener('click', () => {
        if (positionX < 90) {
            positionX += 5;
            player.style.left = `${positionX}%`;
            checkCollision();
        }
    });
    
    jumpBtn.addEventListener('click', jump);
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                if (positionX > 10) {
                    positionX -= 5;
                    player.style.left = `${positionX}%`;
                    checkCollision();
                }
                break;
            case 'ArrowRight':
                if (positionX < 90) {
                    positionX += 5;
                    player.style.left = `${positionX}%`;
                    checkCollision();
                }
                break;
            case 'ArrowUp':
                jump();
                break;
        }
    });
    
    // 触摸控制（左右滑动+上下滑动跳跃+点击跳跃）
    let touchStartX = 0;
    let touchStartY = 0; // 新增：记录触摸起始Y坐标

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY; // 记录起始Y坐标
    }, false);

    document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY; // 记录结束Y坐标
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY; // 计算Y轴滑动距离（负值=往上滑）

    // 优先判断上下滑动（往上滑触发跳跃）
    if (diffY < -30) { // 往上滑距离超过30px
        jump(); // 直接使用已定义的jump()函数
    } 
    // 左右滑动移动（与原逻辑保持一致）
    else if (diffX > 30 && positionX < 90) {
        positionX += 10;
        player.style.left = `${positionX}%`;
        checkCollision();
    } else if (diffX < -30 && positionX > 10) {
        positionX -= 10;
        player.style.left = `${positionX}%`;
        checkCollision();
    }
    // 点击（无明显滑动）也触发跳跃
    else if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) {
        jump(); // 直接使用已定义的jump()函数
    }
    
    // 重置起始坐标
    touchStartX = 0;
    touchStartY = 0;
}, false);
    
    // 8. 问答选项点击事件（可扩展后续逻辑）
    quizOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 此处可添加选项选择后的逻辑（如计分、跳转下一关等）
            quizModal.classList.remove('active');
            
            // 重置游戏状态，重新生成光点
            collectedSpots = 0;
            progressCircles.forEach(circle => circle.classList.remove('filled'));
            setTimeout(generateLightSpots, 1000);
        });
    });
});
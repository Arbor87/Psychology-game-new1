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
    const textContent = document.getElementById('textContent');
    const quizOptions = document.getElementById('quizOptions');
    const backButton = document.getElementById('backButton');
    const optionA = document.getElementById('optionA');
    const optionB = document.getElementById('optionB');
    
    // 第二个弹窗元素
    const quizModal2 = document.getElementById('quizModal2');
    const textContent2 = document.getElementById('textContent2');
    const quizOptions2 = document.getElementById('quizOptions2');
    const backButton2 = document.getElementById('backButton2');
    const optionA2 = document.getElementById('optionA2');
    const optionB2 = document.getElementById('optionB2');
    
    // 假结局弹窗元素
    const badEndingModal = document.getElementById('badEndingModal');
    const badEndingContent = document.getElementById('badEndingContent');
    const badEndingText = document.getElementById('badEndingText');
    const badEndingBackButton = document.getElementById('badEndingBackButton');
    
    // 游戏状态变量 - 用于跟踪当前是第几个弹窗
    let currentStage = 1; // 1: 第一个弹窗阶段, 2: 第二个弹窗阶段
    
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
    document.addEventListener('click', function startGame() {
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
        
        // 移除事件监听器，确保只触发一次
        document.removeEventListener('click', startGame);
    });
    


    // 3. 音频效果（流水声）
    let audioContext;
    function createWaterSound() {
        try {
            // 在移动设备上，音频上下文必须在用户交互后初始化
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 检查是否需要恢复音频上下文（某些浏览器可能会自动挂起）
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
            
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
            // 音频初始化失败不应阻止游戏继续运行
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
                    
                    // 集满3个光点，根据当前阶段显示对应的弹窗
                    if (collectedSpots === maxSpots) {
                        setTimeout(() => {
                            if (currentStage === 1) {
                                quizModal.classList.add('active');
                            } else if (currentStage === 2) {
                                quizModal2.classList.add('active');
                            }
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
    let touchStartY = 0;
    let touchStartTime = 0;

    // 改进的触摸开始处理
    document.addEventListener('touchstart', (e) => {
        // 防止默认行为，特别是在iOS上的滚动
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now(); // 记录触摸开始时间
    }, { passive: false });

    // 改进的触摸结束处理
    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const touchDuration = Date.now() - touchStartTime; // 计算触摸持续时间

        // 调整移动阈值，使其在移动设备上更加灵敏
        const movementThreshold = 20; // 降低阈值以提高灵敏度
        const tapThreshold = 200; // 点击持续时间阈值（毫秒）

        // 优先判断上下滑动（往上滑触发跳跃）
        if (diffY < -movementThreshold) {
            jump();
        } 
        // 左右滑动移动
        else if (diffX > movementThreshold && positionX < 90) {
            // 根据滑动距离调整移动速度，使控制更自然
            const moveAmount = Math.min(15, Math.abs(diffX) / 10);
            positionX += moveAmount;
            if (positionX > 90) positionX = 90; // 确保不超出边界
            player.style.left = `${positionX}%`;
            checkCollision();
        } else if (diffX < -movementThreshold && positionX > 10) {
            const moveAmount = Math.min(15, Math.abs(diffX) / 10);
            positionX -= moveAmount;
            if (positionX < 10) positionX = 10; // 确保不超出边界
            player.style.left = `${positionX}%`;
            checkCollision();
        }
        // 点击（短时间触摸）也触发跳跃
        else if (Math.abs(diffX) < movementThreshold && Math.abs(diffY) < movementThreshold && touchDuration < tapThreshold) {
            jump();
        }
        
        // 重置起始坐标和时间
        touchStartX = 0;
        touchStartY = 0;
        touchStartTime = 0;
    }, { passive: false });
    
    // 添加触摸移动事件监听，提供更实时的反馈
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 8. 文字界面和选项的交互逻辑
    // 获取quiz-content元素
    const quizContent = document.querySelector('#quizModal .quiz-content');
    const quizContent2 = document.querySelector('#quizModal2 .quiz-content');
    
    // 第一个弹窗 - 文字界面点击事件 - 显示选项
    quizContent.addEventListener('click', (e) => {
        // 避免点击选项或返回按钮时触发
        if (e.target === quizOptions || quizOptions.contains(e.target) || 
            e.target === backButton || backButton.contains(e.target)) {
            return;
        }
        
        textContent.style.opacity = '0.3'; // 文字透明度降低
        quizOptions.classList.add('active'); // 显示选项
        backButton.classList.add('active'); // 显示返回按钮
    });
    
    // 第二个弹窗 - 文字界面点击事件 - 显示选项
    quizContent2.addEventListener('click', (e) => {
        // 避免点击选项或返回按钮时触发
        if (e.target === quizOptions2 || quizOptions2.contains(e.target) || 
            e.target === backButton2 || backButton2.contains(e.target)) {
            return;
        }
        
        textContent2.style.opacity = '0.3'; // 文字透明度降低
        quizOptions2.classList.add('active'); // 显示选项
        backButton2.classList.add('active'); // 显示返回按钮
    });
    
    // 第一个弹窗 - 返回按钮点击事件 - 返回文字界面
    backButton.addEventListener('click', () => {
        textContent.style.opacity = '1'; // 文字恢复正常显示
        quizOptions.classList.remove('active'); // 隐藏选项
        backButton.classList.remove('active'); // 隐藏返回按钮
    });
    
    // 第二个弹窗 - 返回按钮点击事件 - 返回文字界面
    backButton2.addEventListener('click', () => {
        textContent2.style.opacity = '1'; // 文字恢复正常显示
        quizOptions2.classList.remove('active'); // 隐藏选项
        backButton2.classList.remove('active'); // 隐藏返回按钮
    });
    
    // 选项A2点击事件
optionA2.addEventListener('click', () => {
    handleOptionSelection('A', 2);
});

// 选项B2点击事件
optionB2.addEventListener('click', () => {
    // 点击B选项时，显示假结局弹窗
    quizModal2.classList.remove('active');
    setTimeout(() => {
        badEndingModal.classList.add('active');
        // 添加这一行，确保按钮可见
        badEndingBackButton.classList.add('active');
    }, 500);
});

// 假结局弹窗重新开始按钮点击事件
badEndingBackButton.addEventListener('click', () => {
    badEndingModal.classList.remove('active');
    
    // 隐藏所有弹窗和控件
    if (quizModal) quizModal.classList.remove('active');
    if (quizModal2) quizModal2.classList.remove('active');
    if (quizOptions) quizOptions.classList.remove('active');
    if (quizOptions2) quizOptions2.classList.remove('active');
    if (backButton) backButton.classList.remove('active');
    if (backButton2) backButton2.classList.remove('active');
    
    const controls = document.querySelector('.controls');
    if (controls) {
        controls.classList.remove('active');
        controls.style.display = 'none';
    }
    
    // 重置游戏状态
    collectedSpots = 0;
    isFirstQuizAnswered = false;
    isSecondQuizAnswered = false;
    
    // 重置进度圆圈
    progressCircles.forEach(circle => circle.classList.remove('filled'));
    
    // 显示开始界面
    setTimeout(() => {
        // 重置开始界面
        if (startText) startText.style.opacity = '1';
        if (blackMask) blackMask.style.display = 'block';
        if (startgame) {
            startgame.classList.remove('active');
            startgame.style.display = 'none';
            startgame.style.opacity = '1';
        }
        
        // 移除现有的游戏元素
        if (gameContainer) {
            gameContainer.classList.remove('active');
            // 清空游戏容器中的光点
            const lightSpots = gameContainer.querySelectorAll('.light-spot');
            lightSpots.forEach(spot => spot.remove());
        }
        
        // 重新绑定开始游戏事件
        document.addEventListener('click', function startGame() {
            if (startText) startText.style.opacity = '0';
            if (startgame) {
                startgame.classList.add('active');
                startgame.style.display = 'block';
            }
            if (targetSpot) targetSpot.style.display = 'block';
            if (startPlayer) {
                startPlayer.style.display = 'block';
                startPlayer.style.left = '50%';
                startPlayer.style.bottom = '30%';
            }
            if (blackMask) blackMask.style.display = 'none';
            document.removeEventListener('click', startGame);
        });
    }, 500);
});
    
    // 处理选项选择的函数
    function handleOptionSelection(option, stage) {
        console.log('玩家在第', stage, '阶段选择了选项:', option);
        
        // 关闭对应的问答界面
        if (stage === 1) {
            quizModal.classList.remove('active');
            
            // 重置文字界面和选项的状态
            setTimeout(() => {
                textContent.style.opacity = '1';
                quizOptions.classList.remove('active');
                backButton.classList.remove('active');
            }, 500);
            
            // 进入第二阶段
            currentStage = 2;
        } else if (stage === 2) {
            quizModal2.classList.remove('active');
            
            // 重置文字界面和选项的状态
            setTimeout(() => {
                textContent2.style.opacity = '1';
                quizOptions2.classList.remove('active');
                backButton2.classList.remove('active');
            }, 500);
            
            // 这里可以根据需要继续添加后续逻辑
        }
        
        // 重置游戏状态，重新生成光点
        collectedSpots = 0;
        progressCircles.forEach(circle => circle.classList.remove('filled'));
        setTimeout(generateLightSpots, 1000);
    }
    
    // 选项A点击事件
    optionA.addEventListener('click', () => {
        handleOptionSelection('A', 1);
    });
    
    // 选项B点击事件
    optionB.addEventListener('click', () => {
        handleOptionSelection('B', 1);
    })
});

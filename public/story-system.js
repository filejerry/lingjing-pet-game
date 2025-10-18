/**
 * 灵境斗宠录 - 前端剧情系统
 * 作者：树枝 (微信: wzq8083)
 * 
 * 前端剧情展示和交互系统
 */

class FrontendStorySystem {
    constructor() {
        this.currentStory = null;
        this.storyHistory = [];
        this.isStoryActive = false;
        this.storyContainer = null;
        this.typewriterSpeed = 50; // 打字机效果速度
        
        this.initializeStoryUI();
        this.setupEventListeners();
    }

    // 初始化剧情UI
    initializeStoryUI() {
        // 创建剧情容器
        this.storyContainer = document.createElement('div');
        this.storyContainer.id = 'story-container';
        this.storyContainer.className = 'story-container hidden';
        this.storyContainer.innerHTML = `
            <div class="story-overlay"></div>
            <div class="story-content">
                <div class="story-header">
                    <h2 class="story-title"></h2>
                    <button class="story-close" onclick="storySystem.hideStory()">×</button>
                </div>
                <div class="story-body">
                    <div class="story-text"></div>
                    <div class="story-choices"></div>
                    <div class="story-dialogue"></div>
                </div>
                <div class="story-footer">
                    <button class="story-continue" onclick="storySystem.continueStory()">继续</button>
                    <button class="story-skip" onclick="storySystem.skipStory()">跳过</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.storyContainer);
        this.addStoryStyles();
    }

    // 添加剧情样式
    addStoryStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .story-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .story-container.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .story-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .story-content {
                position: relative;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 2px solid #444;
                border-radius: 15px;
                max-width: 800px;
                max-height: 80vh;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                animation: storyAppear 0.5s ease-out;
            }

            @keyframes storyAppear {
                from {
                    transform: scale(0.8) translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }

            .story-header {
                background: linear-gradient(90deg, #333 0%, #555 100%);
                padding: 20px;
                border-bottom: 1px solid #666;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .story-title {
                color: #fff;
                margin: 0;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }

            .story-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 30px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .story-close:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: rotate(90deg);
            }

            .story-body {
                padding: 30px;
                max-height: 60vh;
                overflow-y: auto;
                color: #fff;
                line-height: 1.8;
            }

            .story-text {
                font-size: 18px;
                margin-bottom: 20px;
                text-align: justify;
            }

            .story-text p {
                margin-bottom: 15px;
                opacity: 0;
                animation: fadeInUp 0.8s ease-out forwards;
            }

            .story-text p:nth-child(1) { animation-delay: 0.2s; }
            .story-text p:nth-child(2) { animation-delay: 0.4s; }
            .story-text p:nth-child(3) { animation-delay: 0.6s; }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .story-dialogue {
                background: rgba(0, 0, 0, 0.3);
                border-left: 4px solid #4CAF50;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                font-style: italic;
            }

            .story-dialogue .speaker {
                color: #4CAF50;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .story-choices {
                margin: 20px 0;
            }

            .story-choice {
                display: block;
                width: 100%;
                padding: 15px;
                margin: 10px 0;
                background: linear-gradient(90deg, #444 0%, #555 100%);
                border: 1px solid #666;
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
                font-size: 16px;
            }

            .story-choice:hover {
                background: linear-gradient(90deg, #555 0%, #666 100%);
                border-color: #777;
                transform: translateX(5px);
            }

            .story-choice:active {
                transform: translateX(2px);
            }

            .story-footer {
                background: rgba(0, 0, 0, 0.2);
                padding: 20px;
                border-top: 1px solid #666;
                display: flex;
                justify-content: space-between;
            }

            .story-continue, .story-skip {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
            }

            .story-continue {
                background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
                color: white;
            }

            .story-continue:hover {
                background: linear-gradient(90deg, #45a049 0%, #3d8b40 100%);
                transform: translateY(-2px);
            }

            .story-skip {
                background: linear-gradient(90deg, #666 0%, #555 100%);
                color: white;
            }

            .story-skip:hover {
                background: linear-gradient(90deg, #555 0%, #444 100%);
            }

            /* 特殊效果 */
            .legendary-story .story-content {
                border: 2px solid #FFD700;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
            }

            .legendary-story .story-title {
                background: linear-gradient(90deg, #FFD700, #FFA500);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .epic-story .story-content {
                border: 2px solid #9C27B0;
                box-shadow: 0 0 30px rgba(156, 39, 176, 0.3);
            }

            .rare-story .story-content {
                border: 2px solid #2196F3;
                box-shadow: 0 0 30px rgba(33, 150, 243, 0.3);
            }

            /* 打字机效果 */
            .typewriter {
                overflow: hidden;
                border-right: 2px solid #4CAF50;
                white-space: nowrap;
                margin: 0 auto;
                animation: typing 3s steps(40, end), blink-caret 0.75s step-end infinite;
            }

            @keyframes typing {
                from { width: 0 }
                to { width: 100% }
            }

            @keyframes blink-caret {
                from, to { border-color: transparent }
                50% { border-color: #4CAF50; }
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .story-content {
                    width: 95%;
                    max-height: 90vh;
                }

                .story-title {
                    font-size: 20px;
                }

                .story-text {
                    font-size: 16px;
                }

                .story-footer {
                    flex-direction: column;
                    gap: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 监听游戏事件
        document.addEventListener('pet-evolution', (event) => {
            this.handleEvolutionStory(event.detail);
        });

        document.addEventListener('battle-end', (event) => {
            this.handleBattleStory(event.detail);
        });

        document.addEventListener('region-discovered', (event) => {
            this.handleExplorationStory(event.detail);
        });

        document.addEventListener('character-encounter', (event) => {
            this.handleCharacterStory(event.detail);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            if (this.isStoryActive) {
                switch (event.key) {
                    case 'Enter':
                    case ' ':
                        this.continueStory();
                        break;
                    case 'Escape':
                        this.hideStory();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                        const choiceIndex = parseInt(event.key) - 1;
                        this.selectChoice(choiceIndex);
                        break;
                }
            }
        });
    }

    // 显示剧情
    async showStory(storyData) {
        console.log('📖 显示剧情:', storyData.title);
        
        this.currentStory = storyData;
        this.isStoryActive = true;
        
        // 设置剧情等级样式
        this.storyContainer.className = `story-container ${this.getStoryRarityClass(storyData)}`;
        
        // 设置标题
        const titleElement = this.storyContainer.querySelector('.story-title');
        titleElement.textContent = storyData.title;
        
        // 显示容器
        this.storyContainer.classList.remove('hidden');
        
        // 开始播放剧情
        await this.playStoryScenes(storyData.scenes || []);
    }

    // 播放剧情场景
    async playStoryScenes(scenes) {
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            await this.playScene(scene);
            
            // 如果用户跳过了剧情，停止播放
            if (!this.isStoryActive) {
                break;
            }
        }
    }

    // 播放单个场景
    async playScene(scene) {
        const textElement = this.storyContainer.querySelector('.story-text');
        const dialogueElement = this.storyContainer.querySelector('.story-dialogue');
        const choicesElement = this.storyContainer.querySelector('.story-choices');
        
        // 清空之前的内容
        textElement.innerHTML = '';
        dialogueElement.innerHTML = '';
        choicesElement.innerHTML = '';
        
        switch (scene.type) {
            case 'description':
            case 'discovery':
            case 'atmosphere':
                await this.showText(scene.content, textElement);
                break;
                
            case 'dialogue':
                await this.showDialogue(scene, dialogueElement);
                break;
                
            case 'choice':
                await this.showChoices(scene, choicesElement);
                return; // 选择场景不自动继续
                
            case 'mystical_event':
                await this.showMysticalEvent(scene, textElement);
                break;
                
            default:
                await this.showText(scene.content || '...', textElement);
        }
        
        // 等待用户继续
        await this.waitForContinue();
    }

    // 显示文本（打字机效果）
    async showText(text, element) {
        element.innerHTML = '<p></p>';
        const p = element.querySelector('p');
        
        return new Promise((resolve) => {
            let i = 0;
            const timer = setInterval(() => {
                if (i < text.length) {
                    p.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, this.typewriterSpeed);
        });
    }

    // 显示对话
    async showDialogue(scene, element) {
        element.innerHTML = `
            <div class="speaker">${scene.speaker}：</div>
            <div class="dialogue-text"></div>
        `;
        
        const dialogueText = element.querySelector('.dialogue-text');
        await this.showText(scene.content, dialogueText);
    }

    // 显示选择
    async showChoices(scene, element) {
        element.innerHTML = `<p>${scene.prompt}</p>`;
        
        scene.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'story-choice';
            button.textContent = `${index + 1}. ${option.text}`;
            button.onclick = () => this.selectChoice(index, option);
            element.appendChild(button);
        });
    }

    // 显示神秘事件
    async showMysticalEvent(scene, element) {
        element.innerHTML = '<p class="mystical-event"></p>';
        const p = element.querySelector('p');
        p.style.color = '#FFD700';
        p.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
        
        await this.showText(scene.content, element);
    }

    // 选择选项
    selectChoice(index, option) {
        console.log(`选择了选项 ${index + 1}:`, option);
        
        // 处理选择结果
        if (option && option.effect) {
            this.applyChoiceEffect(option.effect);
        }
        
        // 继续剧情
        this.continueStory();
    }

    // 应用选择效果
    applyChoiceEffect(effect) {
        // 解析效果字符串，如 "bond+10", "power+15"
        const match = effect.match(/(\w+)([+-])(\d+)/);
        if (match) {
            const [, attribute, operator, value] = match;
            const numValue = parseInt(value);
            const change = operator === '+' ? numValue : -numValue;
            
            console.log(`属性变化: ${attribute} ${operator}${value}`);
            
            // 触发属性变化事件
            document.dispatchEvent(new CustomEvent('attribute-change', {
                detail: { attribute, change }
            }));
        }
    }

    // 等待用户继续
    waitForContinue() {
        return new Promise((resolve) => {
            this.continueCallback = resolve;
        });
    }

    // 继续剧情
    continueStory() {
        if (this.continueCallback) {
            this.continueCallback();
            this.continueCallback = null;
        }
    }

    // 跳过剧情
    skipStory() {
        this.isStoryActive = false;
        this.hideStory();
    }

    // 隐藏剧情
    hideStory() {
        this.isStoryActive = false;
        this.storyContainer.classList.add('hidden');
        this.currentStory = null;
        
        // 恢复游戏
        document.dispatchEvent(new CustomEvent('story-ended'));
    }

    // 获取剧情稀有度样式类
    getStoryRarityClass(storyData) {
        if (storyData.rarity === 'legendary' || storyData.type === 'epic_battle') {
            return 'legendary-story';
        } else if (storyData.rarity === 'epic' || storyData.type === 'character_encounter') {
            return 'epic-story';
        } else if (storyData.rarity === 'rare') {
            return 'rare-story';
        }
        return '';
    }

    // 处理进化剧情
    async handleEvolutionStory(data) {
        try {
            const response = await fetch('/api/story/evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const storyData = await response.json();
                await this.showStory(storyData);
            }
        } catch (error) {
            console.error('获取进化剧情失败:', error);
        }
    }

    // 处理战斗剧情
    async handleBattleStory(data) {
        try {
            const response = await fetch('/api/story/battle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const storyData = await response.json();
                await this.showStory(storyData);
            }
        } catch (error) {
            console.error('获取战斗剧情失败:', error);
        }
    }

    // 处理探索剧情
    async handleExplorationStory(data) {
        try {
            const response = await fetch('/api/story/exploration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const storyData = await response.json();
                await this.showStory(storyData);
            }
        } catch (error) {
            console.error('获取探索剧情失败:', error);
        }
    }

    // 处理角色剧情
    async handleCharacterStory(data) {
        try {
            const response = await fetch('/api/story/character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const storyData = await response.json();
                await this.showStory(storyData);
            }
        } catch (error) {
            console.error('获取角色剧情失败:', error);
        }
    }

    // 获取剧情历史
    getStoryHistory() {
        return this.storyHistory;
    }

    // 设置打字机速度
    setTypewriterSpeed(speed) {
        this.typewriterSpeed = speed;
    }
}

// 全局剧情系统实例
let storySystem = null;

// 初始化剧情系统
document.addEventListener('DOMContentLoaded', () => {
    storySystem = new FrontendStorySystem();
    console.log('📖 前端剧情系统已初始化');
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendStorySystem;
}
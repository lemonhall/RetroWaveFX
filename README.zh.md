# RetroWaveFX

一个使用 Web Audio API 程序化生成经典游戏音效（如 FC/NES 时代音效）的 JavaScript 库。

**➡️ 在线演示: [https://lemonhall.github.io/RetroWaveFX/](https://lemonhall.github.io/RetroWaveFX/) ⬅️**

## 目标

避免使用预录制的音频文件，通过代码直接合成和控制声音，为游戏音效提供灵活且轻量级的解决方案。

它预置了 **超过90种即用型经典游戏音效**。

## 当前状态

-   核心 `Audio` 对象，包含处理浏览器自动播放策略的初始化逻辑 (`initAudio`)。
-   **音效注册表:** 实现了一个注册表 (`soundEffects`) 来管理音效定义。
-   **元数据:** 每个音效包含元数据：`name` (名称), `description` (描述), 和 `emoji` (表情符号)。
-   **管理方法:** 添加了 `registerSound` (注册音效), `getAllSoundEffects` (获取所有音效信息), 和 `playSoundByName` (按名称播放音效) 等方法。
-   **示例音效:** 包含初始音效：`correct` (✅), `error` (❌), `laserShoot` (💥), `coinPickup` (💰)。
-   **测试页面:** 创建了 `index.html`，该页面动态生成每个已注册音效的 UI 按钮，方便测试和演示。

## 如何使用

1.  **引入库:** 在你的 HTML 文件中添加脚本引用：
    ```html
    <script src="src/RetroWaveFX.js"></script>
    ```
2.  **定义音效 (可选):** 虽然库已注册默认音效，你也可以添加自定义音效：
    ```javascript
    RetroWaveFX.Audio.registerSound('mySound', {
        description: '一个自定义音效。',
        emoji: '🎶'
    }, (audioCtx) => {
        // ... 使用 Web Audio API 生成声音的代码 ...
        const osc = audioCtx.createOscillator();
        // ... 设置振荡器、增益节点等 ...
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    });
    ```
3.  **触发初始化:** 库会在用户首次与 `document.body` 交互（点击、按键、触摸）时尝试初始化 `AudioContext`。
4.  **播放音效:** 通过注册的名称来播放音效：
    ```javascript
    // 播放拾取金币的音效
    RetroWaveFX.Audio.playSoundByName('coinPickup');
    ```

## 开发与测试

-   在浏览器中打开 `index.html` 文件或访问 **[在线演示](https://lemonhall.github.io/RetroWaveFX/)**。
-   该页面会自动将所有注册的音效显示为按钮。
-   **搜索:** 使用页面顶部的搜索框，可以通过名称、描述或分类来筛选音效。
-   点击按钮即可播放对应音效。鼠标悬停在按钮上可以查看音效描述。
-   检查浏览器的开发者控制台以查看相关日志（初始化、注册、播放错误等）。

**注意:** 大多数现代浏览器要求用户交互才能启动或恢复 `AudioContext`。库中包含的 `index.html` 和 body 事件监听器处理了这个问题。

## 未来计划

-   添加更多经典音效（跳跃、爆炸、获得能力等）。
-   为音效提供更灵活的参数配置。
-   探索使用噪声生成器制作爆炸等效果。
-   可能的模块化改造（例如 ES Modules）。
-   考虑增加对简单音乐序列播放的支持。

查看 [README.md](README.md) 获取英文版本。
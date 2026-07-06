# 🦢 Pixel Goose 3D

像素游戏风格的白色大鹅 3D 展示，基于 **Vue 3 + Vite + Three.js**。

一只用体素方块拼出的白色大鹅，配合像素化后处理（`RenderPixelatedPass`）呈现复古游戏质感，支持鼠标拖拽自由查看。

## 特性

- 🎮 **像素游戏风格**：使用 `RenderPixelatedPass` 做像素化后处理，棋盘格草地、漂浮的彩色方块，营造复古游戏氛围。
- 🦢 **体素大鹅**：纯代码用 `BoxGeometry` 拼装的白色大鹅（身体 / 长脖子 / 头 / 橙嘴 / 翅膀 / 脚蹼 / 尾巴）。
- 🖱 **鼠标交互**：拖拽旋转、滚轮缩放、右键平移（`OrbitControls`）。
- 🎵 **节奏待机动画**：脖子摆动、身体起伏、翅膀扇动、方块漂浮旋转。
- 🎛 **可调像素颗粒度** 与 **自动旋转** 开关。

## 快速开始

```bash
npm install
npm run dev      # 启动开发服务器 http://localhost:5173
```

## 构建

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
├── index.html
├── vite.config.js
├── package.json
└── src
    ├── main.js
    ├── App.vue                 # 界面与 HUD 控制面板
    ├── styles/global.css       # 全局像素风样式
    └── three
        ├── PixelGooseScene.js  # 场景 / 相机 / 灯光 / 后处理 / 动画循环
        └── buildGoose.js       # 体素大鹅模型
```

## 操作说明

| 操作 | 效果 |
| --- | --- |
| 鼠标左键拖拽 | 旋转视角 |
| 滚轮 | 缩放 |
| 鼠标右键拖拽 | 平移 |
| 面板滑块 | 调整像素颗粒大小 |
| 面板复选框 | 开关自动旋转 |

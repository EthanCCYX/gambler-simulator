# 🎲 赌徒模拟器 | Gambler Simulator

> 用交互式模拟揭示赌博的数学真相——为什么庄家永远赢，赌徒必然赔光？

An interactive probability simulator that exposes the mathematics behind gambling — why the house always wins, and why gamblers inevitably go broke.

**[🇨🇳 中文说明](#中文) · [🇺🇸 English](#english) · [🚀 立即体验](#快速开始)**

---

## 🇺🇸 English

### What is this?

**Gambler Simulator** is an interactive web-based probability education tool that lets you experience gambling mathematics firsthand. Instead of explaining probability theory with dry formulas, it lets you *watch* your money disappear in real-time as the Law of Large Numbers plays out.

### ✨ Features

| Feature | Description |
|---------|-------------|
| **Two Game Modes** | Classic 50% (fair dice, >3 wins) and Baccarat 48% (+5% house edge) |
| **Five Betting Strategies** | Fixed, Martingale (doubling down), Parlay, Percentage-based, Emotional Random |
| **Real-time 3D Dice** | CSS 3D animated dice with authentic dot patterns |
| **Live Balance Chart** | Canvas-drawn rolling balance curve with gradient fill |
| **Win Rate Tracker** | Bar chart showing actual vs theoretical probability |
| **50-Round Heatmap** | Color-coded history showing win/loss streaks |
| **Dynamic Conclusions** | Auto-calculated expected value, ROI, and mathematical commentary |
| **Danger Alerts** | Screen-edge red pulse when balance drops below 20% |
| **Casino Noir Aesthetic** | Dark theme with neon accents, Bloomberg-terminal vibes |

### 🎯 What You'll Learn

- **The Gambler's Fallacy**: "I've lost 5 times, the 6th must be a win!" — Wrong. Each round is independent.
- **The Law of Large Numbers**: The more you play, the closer your actual win rate gets to the theoretical probability.
- **House Edge = Slow Death**: Even a 49% win rate guarantees eventual loss — the house edge compounds silently.
- **Martingale is a Trap**: Doubling your bet after each loss only delays bankruptcy; when it hits, you lose everything at once.

### 🚀 Quick Start

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Local server
python3 -m http.server 8080
# Then visit http://localhost:8080
```

No build step, no dependencies, no `npm install`. Single HTML file + JS.

### 🛠️ Tech Stack

- **Vanilla JS** — zero framework, zero dependencies
- **Canvas 2D** — balance curve and win-rate chart
- **CSS 3D Transforms** — dice rolling animation
- **CSS Custom Properties** — theming with CSS variables
- **Google Fonts** — Share Tech Mono, Rajdhani, Inter

### 📁 File Structure

```
gambler-simulator/
├── index.html   # Main application (HTML + CSS)
├── app.js       # Core simulation logic
├── SPEC.md      # Design specification
└── README.md    # This file
```

### 📊 The Mathematics

#### Classic Mode (50% Win Rate)
```
Expected Value per round = Bet × (Win% − Loss%)
                       = Bet × (50% − 50%)
                       = 0

Over N rounds with initial balance B:
  Expected loss → 0 (but variance causes real losses)
  With house edge h: Expected loss = N × Bet × h
```

#### Baccarat Mode (48% + 5% House Edge)
```
Expected Value per round = Bet × (48% − 52%) × (1 − 5%)
                       = Bet × (−4%) × 95%
                       = −0.038 × Bet

Every $100 bet loses $3.80 on average.
After 100 rounds with $100 bets: Expected loss = $380
```

---

## 🇨🇳 中文

### 这是什么？

**赌徒模拟器**是一个交互式的概率教育工具，让你亲身感受赌博背后的数学原理。与其用枯燥的公式讲解概率论，不如让你亲眼看着钱在"大数定律"下一点点消失。

### ✨ 功能亮点

| 功能 | 说明 |
|------|------|
| **两种游戏模式** | 经典50%胜率（掷骰子）& 百家乐48%胜率+5%庄家抽水 |
| **五种下注策略** | 固定金额、倍投法（追输）、利润全押、本金比例、情绪化随机 |
| **实时3D骰子** | CSS 3D翻转动画，真实骰子点数 |
| **余额曲线图** | Canvas绘制，渐变填充，滚动更新 |
| **胜率走势图** | 实际胜率 vs 理论胜率，黄线标注理论值 |
| **50局热力图** | 颜色编码的历史记录，红绿显示连输连赢 |
| **动态数学结论** | 实时计算期望值、回报率、数学评注 |
| **危险警报** | 余额低于20%时屏幕边缘红色脉冲 |
| **Casino Noir风格** | 深色主题，霓虹点缀，彭博终端质感 |

### 🎯 你会学到什么

- **赌徒谬误**："连输5局了，第6局该赢了吧？"——错。每局相互独立，历史不改变未来概率。
- **大数定律**：玩得越久，实际胜率越接近理论概率。
- **庄家优势 = 慢性死亡**：即使49%胜率，长期也必然亏损——庄家抽成在悄悄累积。
- **倍投法是陷阱**：输了翻倍下注只是推迟破产，一次连输就全部清空。

### 🚀 快速开始

```bash
# 方式一：直接在浏览器打开
open index.html

# 方式二：本地服务器
python3 -m http.server 8080
# 访问 http://localhost:8080
```

零依赖，零构建步骤，零 `npm install`。一个 HTML + 一个 JS 文件，直接运行。

### 🛠️ 技术栈

- **原生 JavaScript** — 零框架，零依赖
- **Canvas 2D** — 余额曲线 & 胜率图
- **CSS 3D Transforms** — 骰子翻滚动画
- **CSS 变量** — 主题系统
- **Google Fonts** — Share Tech Mono, Rajdhani, Inter

### 📁 文件结构

```
gambler-simulator/
├── index.html   # 主应用（HTML + CSS）
├── app.js       # 核心模拟逻辑
├── SPEC.md      # 设计规格文档
└── README.md    # 本文件
```

### 📊 数学原理

#### 经典模式（50% 胜率）

```
每局期望收益 = 下注额 × (胜率 − 负率)
            = 下注额 × (50% − 50%)
            = 0

玩 N 局后：
  期望亏损 → 0（但方差导致实际亏损）
  有庄家抽成 h：期望亏损 = N × 下注额 × h
```

#### 百家乐模式（48% 胜率 + 5% 庄家抽水）

```
每局期望收益 = 下注额 × (48% − 52%) × (1 − 5%)
            = 下注额 × (−4%) × 95%
            = −0.038 × 下注额

每押注 $100，平均亏损 $3.80。
玩 100 局、每局 $100：期望亏损 = $380
```

---

## 📄 License

MIT — Free to use, modify, and share.

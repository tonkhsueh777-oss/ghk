# 《郑成功收复台湾》V2 视觉重构｜Codex 交接文件

> **For agentic workers:** REQUIRED SUB-SKILL: Use `build-web-apps:frontend-app-builder` for the visual implementation, and `superpowers:systematic-debugging` + `superpowers:verification-before-completion` for fixes/verification. Preserve the existing game engine and interaction behavior unless a UI integration bug requires a minimal fix.

## 1. 任务目标

在现有可玩的《郑成功收复台湾》网页游戏基础上，**只重做视觉框架与前端呈现，不重写核心玩法**。

目标不是再做一张静态效果图，而是：

- 保留当前已经可玩的游戏逻辑、AI、回合流程、卡牌、战场、事件、王牌、伏兵、调动等功能。
- 用 HTML + CSS + 现有 JS 做出更高级、更统一、更有游戏质感的 UI。
- 后续用户会提供关键美术图，例如：
  - 郑成功人物
  - 荷兰指挥官人物
  - 五大战场场景图
  - 公共事件横幅
  - 郑军 / 荷军 / 战术卡插画
- Codex 负责把这些图片接入网页，并自动适配裁切、缩放、文字安全区。
- **不要把复杂背景图直接压在文字下面。**
- 文字、数字、按钮标签必须保持清楚、可读、可修改，优先由 HTML/CSS 渲染，不烤死在图片里。

## 2. 当前项目

GitHub：

`https://github.com/tonkhsueh777-oss/ghk`

V2 预览页：

`v2-preview.html`

当前线上预览：

`https://tonkhsueh777-oss.github.io/ghk/v2-preview.html`

当前主要文件：

- `v2-preview.html`：V2 试玩页面结构
- `style.css`：原始主样式
- `v2-layout.css`：V2 桌面布局与视觉校准
- `v2-image-framework.css`：图片框架覆盖层
- `app.js`：UI 渲染、交互、按钮、战场与手牌 DOM
- `engine.js`：游戏核心逻辑
- `sprite-data-1.js` ~ `sprite-data-4.js`：旧素材加载
- `sprite-small.webp`：当前旧精灵图

### 重要限制

1. **不要重写 `engine.js`。**
2. 不要为了美化而改变胜负、回合、AI、战场触发、卡牌效果。
3. 不要把项目改成 React / Vue；继续沿用现有原生 HTML / CSS / JS。
4. 先做 `v2-preview.html`，不要覆盖正式 `index.html`，除非用户明确确认。
5. 每次改完必须保留可玩的状态。

## 3. 当前游戏架构

### 顶部

- 左：游戏标题《郑成功收复台湾》
- 中：4 步流程
  1. 进行行动
  2. 选择战场
  3. 执行
  4. 结束回合
- 右：
  - 怎么玩
  - 牌组一览
  - 重新开始

### 左侧玩家栏

包含：

- 玩家阵营
- 郑成功 / 荷兰角色图
- 阵营名称
- 阵营说明
- 已攻下战场 `0 / 3`
- 手牌 / 牌库 / 弃牌
- 王牌
- 战役奖励
- 伏兵

### 中央区域

顺序固定：

1. 回合信息
2. 系统提示条
3. 公共事件
4. 五大战场
5. 行动点 + 结束回合
6. 手牌
7. 四个操作按钮

### 五大战场

战场顺序每局随机。

战场包括：

- 鹿耳门
- 安平
- 北线尾
- 台南城
- 热兰遮城

每张战场卡目前显示：

- 大图
- 顺序号
- 战场名
- 战役点
- 地形 / 特殊效果
- 胜利奖励
- 当前状态
- 郑军战力
- 郑军单位
- 荷军战力
- 荷军单位

### 右侧 AI 栏

包含：

- AI 阵营
- AI 人物
- AI 已攻下战场
- 手牌 / 牌库 / 弃牌
- 王牌
- 伏兵
- 战斗 / 行动记录

### 手牌

- 开局 4 张
- 每回合抽 2 张
- 上限 6 张
- 6 张牌直接显示
- 四个操作按钮：
  - 打出这张牌
  - 设为伏兵
  - 调动部队
  - 弃牌换 1 张

### 重要游戏规则

- 先拿下 3 个战场获胜。
- 无人防守时，单方正面部队达到 3 支直接占领。
- 双方都有部队时，总正面部队达到 5 支触发正式决战。
- 伏兵不计入 3 / 5 支触发数。
- 第 3 / 6 / 9 回合翻公共事件。
- 最多 10 回合。
- 战场结算后永久锁定，不再使用。

## 4. 视觉方向

### 核心风格

用户希望视觉方向为：

- 明亮但不刺眼
- Q 版历史人物
- 国潮 + 海战 + 明郑 / 台湾历史元素
- 红 / 金 / 深蓝为主
- 有精致游戏 UI 质感
- 不要过度繁复
- 不要满屏装饰
- 不要让大背景抢走游戏信息

### 参考调性

人物 / 插画：

- Q 版、2.5D / 3D 卡通质感
- 大眼、精致、可爱但有武将气质
- 郑成功：红金甲胄、红羽、明郑视觉
- 荷兰指挥官：蓝金军装、欧洲 17 世纪军官风格

UI：

- 深蓝信息面板
- 红金强调
- 浅米 / 羊皮纸信息区
- 少量云纹 / 海浪 / 明郑图腾
- 边框必须规整、方正
- **不要做很多绕行、破边、卷曲、不规则的装饰边框**
- 大多数框应是完整矩形 / 轻圆角矩形
- 装饰只放在边角或标题位置

## 5. 最重要的文字规则

这是本次重构最高优先级。

### 必须做到

- 文字不能直接压在复杂图案上。
- 标题、说明、数字、状态、按钮文字，都必须有清楚的承载区。
- 背景图过花时，要使用：
  - 纯色 / 半透明深色底
  - 低纹理羊皮纸底
  - 局部渐层遮罩
- 文字区和插画区明确分开。

### 禁止

- 白字直接压在火焰、船只、人物脸、建筑上。
- 小字号压在高对比纹理上。
- 把文字烤进 UI 图片导致以后不能改。
- 背景图和文字图层同时抢视觉。

### 字体建议

- 主标题：偏宋 / 楷体气质，但必须清楚。
- UI 功能文字：无衬线中文字体。
- 数字：清晰、粗体。
- 不依赖用户本机特殊字体；必须有系统 fallback。

## 6. 新的视觉布局要求

### 整体

目标桌面基准：

`1535 × 1024`

允许响应式缩放，但不要为了适配把所有文字压小。

### 顶部

- 高度控制在约 72–82 px。
- 左侧 Logo / 标题必须明显。
- 中间 4 个流程步骤要清楚。
- 右侧 3 个按钮不要挤压。

### 左右侧栏

- 角色图是视觉重点。
- 人物图上方 / 下方不要堆很多文字。
- 人物与数值信息分层。
- 信息卡应保持低纹理深底。
- `0 / 3` 必须醒目。

### 回合区

- 大标题：“你的回合 / AI 回合”
- 小信息：“第 N / 10 回合”
- 模式说明
- 右侧提示
- 文字区域必须干净。

### 公共事件

分成两层：

- 场景横幅
- 文字承载区

如果使用场景图，文字区必须带深色渐层或独立面板。

### 五大战场

这是视觉焦点。

每张战场卡建议：

- 上部：约 45%～50% 大场景图
- 下部：干净信息区
- 卡名明显
- 战役点小徽章
- 状态说明
- 战力 / 单位信息清楚

不要让规则文字直接压在战场图上。

### 行动栏

必须突出：

- 行动点
- 结束回合

“结束回合”保持红色主按钮。

### 手牌区

- 6 张牌可同时看清
- 卡牌本身可以鲜艳
- 手牌区背景必须克制
- 四个按钮视觉等级清楚

## 7. 图片资源架构

后续用户只负责提供图片，Codex 负责接图。

建议统一：

```text
assets/
├── ui/
├── characters/
├── battlefields/
├── cards/
├── event/
└── reference/
```

### 人物

```text
assets/characters/
├── zheng_success.webp
└── dutch_commander.webp
```

### 战场

```text
assets/battlefields/
├── luermen.webp
├── anping.webp
├── beixianwei.webp
├── tainan.webp
└── zeelandia.webp
```

### 卡牌

```text
assets/cards/
├── zheng_card.webp
├── dutch_card.webp
└── tactic_card.webp
```

### 公共事件

```text
assets/event/
└── event_banner.webp
```

### UI

不要依赖大量切图。

优先使用 CSS 完成：

- 方正边框
- 深色信息面板
- 金色描边
- 红 / 蓝 / 金按钮
- hover / selected / disabled
- 渐层
- 阴影
- 文字安全区

只有真正需要美术质感的纹理 / 装饰才使用 WebP。

## 8. 图片接入策略

当前 `app.js` 仍使用 `sprite-small.webp`。

视觉重构时，把主要素材逐步改成独立文件读取。

### 角色

`playerHero` / `aiHero`

根据阵营加载：

- `assets/characters/zheng_success.webp`
- `assets/characters/dutch_commander.webp`

### 战场

根据 field id 加载：

- `luermen`
- `anping`
- `beixianwei`
- `tainan`
- `zeelandia`

### 手牌

暂时允许三张通用插画：

- 郑军
- 荷军
- 战术

不要要求用户一开始就补几十张牌图。

### fallback

如果某张新图还没提供：

- 不要让页面破图。
- 自动 fallback 到旧 `sprite-small.webp`。
- 新图到位后即可替换，无需改布局。

## 9. Codex 实施顺序

### Task 1：建立视觉重构安全分支 / 预览入口

**目标：** 任何时候不破坏正式版。

- 保留 `index.html`
- 继续在 `v2-preview.html` 开发
- 如有必要建立 `visual-v3` 分支
- 确认 V2 游戏当前可以完整启动

验收：

- 能选择阵营
- 能进入游戏
- 战场可点击
- 手牌可点击
- 结束回合正常

### Task 2：清理旧图片框架覆盖

检查：

- `style.css`
- `v2-layout.css`
- `v2-image-framework.css`
- 旧 SVG / WebP 覆盖规则

目标：

- 不再出现三层 CSS 相互抢 `background-image`
- 明确样式优先级
- 建议将 V2 视觉整理成：
  - `style.css`：原基础
  - `v2-layout.css`：布局
  - `v2-theme.css`：新视觉主题

不要继续叠第四、第五个 override 文件。

### Task 3：重做完整 UI 框架

使用 CSS 为主，重做：

- 顶部导航
- 左右侧栏
- 回合区
- 公共事件区
- 五大战场区
- 行动栏
- 手牌区
- 右侧日志

要求：

- 方正
- 高级
- 清楚
- 低纹理
- 红金深蓝
- 不过度装饰

### Task 4：重新设计文字层级

统一：

- H1 / 游戏标题
- 面板标题
- 战场名
- 说明字
- 状态字
- 数字
- 按钮
- 日志

检查所有文字背景的对比度。

最低要求：

- 正文不小于 12 px（桌面基准）
- 重要状态 ≥ 14 px
- 战场名 ≥ 18 px
- 主标题 ≥ 24 px
- 重要数值 ≥ 28 px

### Task 5：重做五大战场卡

保留现有 `renderFields()` 数据和逻辑。

只优化 DOM / CSS 视觉。

建议结构：

```text
battle-card
├── battlefield-visual
│   ├── image
│   └── order badge
└── battlefield-info
    ├── title + battle point
    ├── effect
    ├── reward
    ├── state
    ├── zheng force
    └── dutch force
```

图片和文字严格分区。

### Task 6：重做左右人物区

将人物与资料分开。

建议：

```text
hero-visual
hero-summary
info-stack
```

不要让姓名、描述、0/3 直接压在人物脸或复杂背景上。

### Task 7：独立图片资源加载

在 `app.js` 增加资源映射。

建议：

```js
const ASSET_MAP = {
  zheng: 'assets/characters/zheng_success.webp',
  dutch: 'assets/characters/dutch_commander.webp',
  event: 'assets/event/event_banner.webp',
  luermen: 'assets/battlefields/luermen.webp',
  anping: 'assets/battlefields/anping.webp',
  beixianwei: 'assets/battlefields/beixianwei.webp',
  tainan: 'assets/battlefields/tainan.webp',
  zeelandia: 'assets/battlefields/zeelandia.webp',
  zhengcard: 'assets/cards/zheng_card.webp',
  dutchcard: 'assets/cards/dutch_card.webp',
  tacticcard: 'assets/cards/tactic_card.webp'
};
```

要求：

- 图片 `object-fit: cover`
- 支持 `object-position`
- 缺图 fallback
- 不改变游戏逻辑

### Task 8：按钮和状态

按钮必须有：

- default
- hover
- active
- disabled
- selected（需要时）

主按钮：

- 红色：关键执行 / 结束回合
- 蓝色：辅助操作
- 金色：特殊 / 王牌

避免所有按钮都很亮。

### Task 9：视觉 QA

至少测试：

- 1535×1024
- 1366×768
- 1280×800

检查：

- 文字是否重叠
- 按钮是否超出
- 五张战场是否完整
- 六张手牌是否可见
- 左右人物是否被裁错
- 模态框是否被新主题破坏
- 选中态是否清楚
- disabled 是否清楚

### Task 10：游戏功能回归测试

视觉改完必须测试：

1. 选择郑军
2. 选择荷军
3. 选牌
4. 选战场
5. 打出牌
6. 布伏兵
7. 调动
8. 弃牌换牌
9. 发动王牌
10. 结束回合
11. AI 行动
12. 公共事件
13. 决战弹窗
14. 胜负弹窗
15. 重新开始

任何视觉重构都不能破坏上述功能。

## 10. 用户后续提供图片时的工作方式

用户不会写代码。

用户只会把图片上传到指定目录。

Codex 必须负责：

1. 检测新图片是否存在。
2. 自动映射到正确 UI。
3. 调整 CSS：
   - 裁切
   - object-position
   - 比例
   - 文字安全区
4. 确保文字不被图片干扰。
5. 不要求用户重新裁几十次，优先由 CSS 适配。

如果图片比例不理想：

- 先用 CSS `object-fit` / `object-position`
- 再考虑要求用户补图
- 不要第一反应就是要求重做素材

## 11. 不要做的事情

- 不要再生成一整张静态 UI 当网页。
- 不要把整个界面切成 20～30 张背景图再拼。
- 不要让 CSS 里出现很多互相覆盖的 `!important background-image`。
- 不要让大背景太花。
- 不要为了“高级感”塞满金龙、云纹、火焰、舰船。
- 不要重写游戏。
- 不要修改玩法数值。
- 不要改成另一个框架。
- 不要删除现有可用功能。
- 不要直接覆盖正式首页。

## 12. 最终视觉目标

视觉应该像：

**“一款正式发行的轻策略卡牌网页游戏”**

而不是：

- 海报
- 静态概念图
- 博物馆展板
- 满屏装饰的国潮宣传页

视觉优先级：

1. 可玩性
2. 信息可读
3. 操作清楚
4. 战场与人物质感
5. 装饰

## 13. 最终交付

Codex 完成后应交付：

- 更新后的 `v2-preview.html`
- `v2-layout.css`
- 新建或整理后的 `v2-theme.css`
- 必要的 `app.js` 资源加载调整
- 图片目录结构
- 本地可直接打开 / 本地服务器可试玩
- GitHub Pages 可预览版本
- 一份 `VISUAL_ASSET_GUIDE.md`
  - 告诉用户以后人物图、战场图、卡牌图分别放哪个目录
  - 文件名是什么
  - 推荐尺寸 / 比例
  - 不需要用户修改代码

## 14. 完成判定

只有以下全部满足，才能算完成：

- 游戏仍然可玩。
- V2 视觉明显完成一次真正重构。
- 不是只换背景色。
- 不是只套一张大图。
- 文字在所有主要区域清晰。
- 五大战场是中央视觉重点。
- 郑成功 / 荷兰人物区域有明确层级。
- 按钮清楚。
- 手牌清楚。
- 1366×768 不出现严重溢出。
- 用户只需要替换图片文件即可更新美术。
- 正式 `index.html` 未被意外覆盖。

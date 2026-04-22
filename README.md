# ComfyUI-Title-Memo

A lightweight ComfyUI canvas annotation node with rich styles, built-in presets, and customizable settings.
一个轻量级的 ComfyUI 画布注释节点，具有丰富的样式、内置预设和自定义设置功能，可直接在工作流画布上添加标题、备注与说明。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![ComfyUI](https://img.shields.io/badge/ComfyUI-Custom%20Node-orange.svg)

---

## ✨ 核心特性

- **零端口**：无输入/输出，纯装饰与信息注释节点
- **支持透明**：背景透明度为 0 时，与任何画布主题无缝融合；编辑状态下自动显示虚线轮廓提示边界
- **标题栏隐藏**：鼠标悬停时自动显示淡色边界线，离开后恢复隐藏
- **原生文本编辑**：支持中英文混排、IME 输入法、复制粘贴、文本选中
- **随画布缩放**：文字字号与内边距随画布缩放比例等比同步，任意缩放层级下文字与节点保持一致比例
- **双向自适应**：输入、删除文字，调整字号、行距或切换预设时，节点高度实时撑开或收缩以适配内容；宽度由用户手动拖拽控制，文字超出宽度时自动换行
- **边框与阴影联动**：共用一个拾色器，颜色同步；边框宽度为 0 时不绘制任何边框
- **样式完整序列化**：所有样式属性随工作流 JSON 保存与加载，重启不丢失
- **自定义预设持久化**：自定义预设存储于浏览器本地，刷新页面后保留

---

## 🖱️ 基本操作

| 操作 | 效果 |
|---|---|
| 单击节点 | 进入文字编辑模式 |
| 双击节点 | 打开样式编辑器 |
| 拖拽边缘 | 手动调整节点宽度与高度 |
| 鼠标滚轮 | 滚动长文本（不触发画布缩放）|
| 点击标题栏左侧圆点 | 折叠 / 展开节点 |

---

## 🎨 样式编辑器

双击节点文字区域即可打开，弹出位置在节点正下方居中，自动防止超出屏幕边界。

### 预设系统

**内置预设（一键应用）**

| 预设 | 说明 |
|---|---|
| 透明样式 | 全透明背景，无边框，白色文字，适合轻量注释 |
| 大标题 | 深蓝背景，蓝色发光边框与阴影，加粗大字（30px） |
| 小标题 | 深绿背景，绿色细边框与光晕，加粗中字（20px） |
| 备注 | 暖琥珀背景，金色边框，正常字重（12px），适合多行说明 |

**自定义预设**

在输入框中填写名称，点击「保存」将当前全部样式保存为自定义预设。自定义预设以标签形式显示，支持一键应用与单独删除，数据存储于浏览器本地，刷新不丢失。

---

## 🖼️ 样式预览 Demo Preview
<p align="center">
  <img src="[这里粘贴你刚刚复制的图片链接](https://github.com/xujianjian2004/ComfyUI-Title-Memo/blob/main/ComfyUI-Title-Memo%E6%A0%B7%E5%BC%8F%E4%B8%80%E8%A7%88%E8%A1%A8.png?raw=true)" width="800"/>
</p>

### 文字设置

**对齐方式**

三个快速切换按钮：← 左对齐 · ↔ 居中对齐 · → 右对齐。未激活状态显示箭头符号，激活状态显示中文标签，两种状态均清晰可辨。

**背景 / 文字 / 字重**

| 控件 | 说明 |
|---|---|
| 背景拾色器 | 控制节点底色（配合透明度使用）|
| 文字拾色器 | 控制文字颜色 |
| 细 / 中 / 粗 | 切换字体粗细（lighter / normal / bold）|

---

### 数值调节

| 参数 | 范围 | 说明 |
|---|---|---|
| 大小 | 8 – 200 px | 文字字号，修改后节点高度实时自适应 |
| 透明 | 0 – 100 % | 背景填充透明度（0% 即全透明）|
| 行距 | 0.8 – 3.0 | 行间距倍数，默认 1.5 |

---

### 边框 & 阴影

边框与阴影**共用一个拾色器**，调整颜色时两者同步联动。

| 参数 | 范围 | 说明 |
|---|---|---|
| 边框粗细 | 0 – 10 px | 0 px 即无边框 |
| 阴影模糊 | 0 – 30 | 发光 / 阴影扩散半径 |

---

### 圆角

| 参数 | 范围 | 说明 |
|---|---|---|
| 圆角 | 0 – 30 px | 节点与边框的圆角半径 |

---

### 选中状态视觉反馈

所有按钮（对齐、字重）选中时显示深绿色背景配金色边框，未选中时显示深灰色背景配细边框，状态清晰可辨。

---

## 🚀 安装

### 通过 ComfyUI Manager（推荐）

在 Manager 中搜索 **ComfyUI-Title-Memo**，点击安装后重启 ComfyUI。

### 手动安装

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/xujianjian2004/ComfyUI-Title-Memo.git
# 重启 ComfyUI
```

---

## 📁 项目结构

```
ComfyUI-Title-Memo/
├── __init__.py          # 节点注册 & WEB_DIRECTORY 导出
├── py/
│   └── title_memo.py    # Python 节点类（轻量后端）
├── js/
│   └── title-memo.js    # 全部前端逻辑与样式编辑器
├── LICENSE
├──pyproject.toml
├──requirements.txt
└── README.md
```

---

## 🛠 技术说明

- 遵循 [ComfyUI 自定义节点规范](https://docs.comfy.org/zh-CN/custom-nodes/overview)
- 文字区域为真实 DOM `<textarea>` 元素，叠加在 canvas 上方，享有完整的原生编辑能力
- 节点外观（背景、边框、阴影、圆角）通过 `onDrawBackground` 在 canvas 上绘制
- 文字字号与内边距随 `canvas.ds.scale` 等比缩放，确保在任意画布缩放级别下文字与节点等比一致
- 节点高度通过临时将 textarea 压缩至 1px 后读取 `scrollHeight` 动态计算，在输入、删除、改字号、改行距、切换预设时实时双向调整；宽度保持用户设定值，文字超出自动换行
- 样式状态通过 `onSerialize` / `onConfigure` 完整序列化至工作流 JSON
- 自定义预设存储于 `localStorage`，刷新页面后保留
- 内置 MutationObserver 自动清除 ComfyUI Vue 渲染产生的节点 Badge，保持界面整洁
- 通过覆盖 `ctx.fillText` 与 Canvas 裁剪区域，抑制 LiteGraph 默认的节点 ID / 类型文字

---

## 📄 许可证

MIT © 2026 WOS AI Studio. Powered by 穿山阅海

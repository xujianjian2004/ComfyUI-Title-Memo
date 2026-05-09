/**
 * ComfyUI-Title-Memo - 前端扩展主文件
 * ===================================
 *
 * 负责处理 Title Memo 节点的所有前端逻辑：
 * - 节点渲染（背景、边框、阴影、圆角）
 * - 文字编辑（textarea 交互）
 * - 样式编辑器（弹窗面板）
 * - 预设系统（内置预设 + 自定义预设）
 * - 序列化与反序列化
 * - Vue/Nodes2.0 兼容支持
 *
 * 作者: 穿山阅海
 * 版本: 2.0
 * COPYRIGHT © WOS AI STUDIO | 穿山阅海
 */

import { app } from "../../scripts/app.js";

// 节点类型常量（必须与 Python 端 NODE_CLASS_MAPPINGS 中的键一致）
const NODE_TYPE = "Title_Memo";
const NODE_TITLE = "Title Memo";

// 样式面板配置常量
const STYLE_PANEL_WIDTH = 300;        // 样式面板宽度（像素）
const STYLE_PANEL_BASE_FONT_SIZE = 12; // 样式面板基础字体大小
const STYLE_PANEL_OFFSET = 10;         // 样式面板与节点的偏移量

// 占位符配置
const PLACEHOLDER_TEXT = "单击输入，双击设置样式..."; // 占位符文本
const PLACEHOLDER_FONT_SIZE = 20;                     // 占位符字体大小

// 节点配置常量
const BORDER_RADIUS = 8;           // 默认圆角半径
const RESIZE_ZONE = 14;            // 右下角调整大小区域
const TITLE_BAR_DOT_SIZE = 12;     // 标题栏折叠点大小
const TEXT_AREA_MARGIN = 8;        // textarea 边距
const TEXT_AREA_MIN_HEIGHT = 20;   // textarea 最小高度

// Badge 清除延迟时间（毫秒）
const BADGE_REMOVE_DELAY_1 = 500;
const BADGE_REMOVE_DELAY_2 = 1500;
const BADGE_REMOVE_DELAY_3 = 3000;

/** 应用阴影到 Canvas 上下文 */
function applyShadow(ctx, color, blur, offsetX, offsetY) {
  ctx.shadowColor = color || "#000000";
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offsetX || 0;
  ctx.shadowOffsetY = offsetY || 0;
}

/** 重置 Canvas 阴影 */
function resetShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/** 绘制圆角矩形路径（不执行 fill/stroke） */
function traceRoundedRect(ctx, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}

/** 将文字样式应用到 textarea（兼容 Vue/Nodes2.0，app.canvas 不可用时安全降级） */
function applyTextareaStyles(node) {
  const ta = node._textarea;
  if (!ta) return;
  const p = node._memoProps;
  const scale = (app.canvas?.ds?.scale) || 1;

  if (ta.value === PLACEHOLDER_TEXT) {
    ta.style.fontSize   = (PLACEHOLDER_FONT_SIZE * scale) + "px";
    ta.style.lineHeight = "1.6";
    ta.style.textAlign  = "center";
    ta.style.padding    = (6 * scale) + "px " + (8 * scale) + "px";
    ta.style.fontWeight = "normal";
  } else {
    ta.style.fontSize   = (p.fontSize * scale) + "px";
    ta.style.lineHeight = String(p.lineHeight);
    ta.style.textAlign  = p.textAlign;
    ta.style.padding    = (p.padding * scale) + "px";
    ta.style.fontWeight = p.fontWeight;
    ta.style.color      = p.textColor;
  }
}

/** 默认样式（"透明注释"重置按钮使用；新节点默认应用"大标题"预设） */
const DEFAULT_PROPS = {
  text: PLACEHOLDER_TEXT,
  fontSize: 32,
  fontFamily: "Arial, sans-serif",
  textColor: "#ffffff",
  bgColor: "#333333",
  bgAlpha: 0,
  textAlign: "left",
  lineHeight: 1.5,
  fontWeight: "normal",
  padding: 12,
  borderEnabled: false,
  borderColor: "#00ffff",
  borderWidth: 0,
  borderRadius: 0,
  shadowColor: "#00ffff",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  width: 1000,
};

const PRESET_STORAGE_KEY = "tm-custom-presets";
const cleanupRefs = {};

/** 内置样式预设 */
const BUILTIN_PRESETS = {
  "大标题": {
    fontSize: 80, fontWeight: "bold", textAlign: "left",
    textColor: "#e8f4ff", bgColor: "#0d2845", bgAlpha: 0.95,
    lineHeight: 1.5, padding: 14,
    borderEnabled: true, borderColor: "#4a9eff", borderWidth: 2, borderRadius: 0,
    shadowColor: "#4a9eff", shadowBlur: 18, shadowOffsetX: 0, shadowOffsetY: 0,
    width: 1800,
  },
  "小标题": {
    fontSize: 60, fontWeight: "normal", textAlign: "left",
    textColor: "#c8f0d8", bgColor: "#0f2a1f", bgAlpha: 0.92,
    lineHeight: 1.5, padding: 10,
    borderEnabled: true, borderColor: "#4caf50", borderWidth: 1, borderRadius: 30,
    shadowColor: "#4caf50", shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 0,
    width: 1200,
  },
  "备注框": {
    fontSize: 12, fontWeight: "normal", textAlign: "left",
    textColor: "#d4c49a", bgColor: "#241c0e", bgAlpha: 0.88,
    lineHeight: 1.5, padding: 10,
    borderEnabled: true, borderColor: "#a08040", borderWidth: 2, borderRadius: 0,
    shadowColor: "#a08040", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    width: 400,
  },
};

/** 十六进制颜色 → RGBA 字符串 */
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) hex = '#333333';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = typeof alpha === 'number' ? Math.max(0, Math.min(1, alpha)) : 1;
  return `rgba(${r},${g},${b},${a})`;
}

/** 同步视觉样式到 Vue/Nodes2.0 DOM 节点（背景、边框、阴影、圆角） */
function updateVueNodeBackground(node) {
  if (!node || !node._memoProps) return;

  const p = node._memoProps;
  const isTransparent = node.collapsed || p.bgAlpha === 0;
  const newBgColor = isTransparent ? "transparent" : hexToRgba(p.bgColor, p.bgAlpha);

  if (typeof node.bgcolor !== 'undefined') node.bgcolor = newBgColor;
  if (typeof node.color !== 'undefined') node.color = isTransparent ? "transparent" : node.color;
  if (node._vueProps && typeof node._vueProps.bgcolor !== 'undefined') node._vueProps.bgcolor = newBgColor;

  if (node.widgets && Array.isArray(node.widgets)) {
    node.widgets.forEach(w => { if (w && w.element) w.element.style.backgroundColor = newBgColor; });
  }

  const hasBorder = !isTransparent && p.borderEnabled && p.borderWidth > 0;
  const borderCSS     = hasBorder ? `${p.borderWidth}px solid ${p.borderColor}` : "none";
  const boxShadowCSS  = (!isTransparent && p.shadowBlur > 0)
    ? `0 0 ${p.shadowBlur}px ${p.shadowColor}` : "none";
  const borderRadCSS  = (p.borderRadius !== undefined ? p.borderRadius : BORDER_RADIUS) + "px";

  const styleId = `tm-node-bg-${node.id}`;
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    [data-id="${node.id}"],
    [data-node-id="${node.id}"],
    #node-${node.id},
    .node-${node.id} {
      background: ${newBgColor} !important;
      background-color: ${newBgColor} !important;
      border: ${borderCSS} !important;
      box-shadow: ${boxShadowCSS} !important;
      border-radius: ${borderRadCSS} !important;
      overflow: visible !important;
    }
  `;

  const selectors = [
    `[data-id="${node.id}"]`,
    `[data-node-id="${node.id}"]`,
    `#node-${node.id}`,
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      el.style.setProperty("background",       newBgColor,   "important");
      el.style.setProperty("background-color", newBgColor,   "important");
      el.style.setProperty("border",           borderCSS,    "important");
      el.style.setProperty("box-shadow",       boxShadowCSS, "important");
      el.style.setProperty("border-radius",    borderRadCSS, "important");
      el.style.setProperty("overflow",         "visible",    "important");
    }
  }
}

/** 创建样式编辑器面板 */
function createStyleEditor(node) {
  const existing = document.getElementById("title-memo-style-editor");
  if (existing) existing.remove();

  const p = node._memoProps;

  function getCustomPresets() {
    try { return JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveCustomPresets(presets) {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }

  const panel = document.createElement("div");
  panel.id = "title-memo-style-editor";
  panel.className = "title-memo-style-panel";
  panel._attachedNode = node;
  panel._baseWidth = STYLE_PANEL_WIDTH;
  panel._baseFontSize = STYLE_PANEL_BASE_FONT_SIZE;

  panel.style.cssText = `
    position: fixed;
    width: 300px;
    background: rgba(30, 30, 30, 0.92);
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 0;
    z-index: 99999;
    color: #e0e6ed;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
  `;

  // Shared style helpers
  const SW = `width:22px;height:22px;border-radius:50%;cursor:pointer;flex-shrink:0;border:2px solid #555;position:relative;display:inline-flex;`;
  const IN = `position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;`;
  const sel = (active) => active
    ? "background:#1e5c30;border:1px solid #c8a020;font-weight:bold;"
    : "background:#444;border:1px solid #555;font-weight:normal;";
  const getBorderRadius = () => p.borderRadius !== undefined ? p.borderRadius : 0;

  panel.innerHTML = `
    <!-- ── 顶栏：标题 + 关闭 ── -->
    <div style="display:flex;align-items:center;padding:11px 8px 9px;border-bottom:1px solid #2e2e2e;flex-shrink:0;">
      <div style="width:20px;flex-shrink:0;"></div>
      <div style="flex:1;height:1px;background:linear-gradient(to right,transparent,#4a4a4a);"></div>
      <span style="flex-shrink:0;padding:0 10px;color:#888;font-size:14px;letter-spacing:2.5px;white-space:nowrap;font-weight:400;">样式设置</span>
      <div style="flex:1;height:1px;background:linear-gradient(to left,transparent,#4a4a4a);"></div>
      <button id="tm-close-btn" style="width:20px;height:20px;padding:0;background:transparent;border:none;color:#666;cursor:pointer;font-size:14px;line-height:1;border-radius:3px;flex-shrink:0;" title="关闭">×</button>
    </div>

    <div style="padding:10px;overflow-y:auto;flex:1;background:transparent;box-sizing:border-box;">

    <!-- ── 预设 ── -->
    <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #3a3a3a;">
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <button id="tm-reset-btn" style="flex:1;height:26px;padding:0;background:#444;border:1px solid #666;color:#ddd;cursor:pointer;border-radius:4px;font-size:11px;font-family:inherit;">透明注释</button>
        <button class="tm-builtin-preset" data-preset="大标题" style="flex:1;height:26px;padding:0;background:#1c3a5e;border:1px solid #2a5888;color:#e8f4fd;cursor:pointer;border-radius:4px;font-size:11px;font-family:inherit;">大标题</button>
        <button class="tm-builtin-preset" data-preset="小标题" style="flex:1;height:26px;padding:0;background:#1e3d2f;border:1px solid #2a5a40;color:#b8e8c8;cursor:pointer;border-radius:4px;font-size:11px;font-family:inherit;">小标题</button>
        <button class="tm-builtin-preset" data-preset="备注框" style="flex:1;height:26px;padding:0;background:#2e2416;border:1px solid #4a3a20;color:#e8d5a8;cursor:pointer;border-radius:4px;font-size:11px;font-family:inherit;">备注框</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <input type="text" id="tm-preset-name" placeholder="命名并保存当前样式…" style="flex:1;min-width:0;background:#2a2a2a;color:#e0e6ed;border:1px solid #444;border-radius:4px;font-size:11px;padding:0 8px;font-family:inherit;height:26px;box-sizing:border-box;">
        <button id="tm-preset-save" style="height:26px;padding:0 10px;background:#1e5c30;border:1px solid #2a7a40;color:#ddd;cursor:pointer;border-radius:4px;font-size:11px;font-family:inherit;flex-shrink:0;">保存</button>
      </div>
      <div id="tm-custom-presets-container" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
    </div>

    <!-- ── 对齐 ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">对齐</span>
      <div style="display:flex;gap:6px;flex:1;">
        <button class="tm-align" data-align="left"   data-label="左对齐"   data-arrow="←" style="flex:1;height:26px;padding:0;${sel(p.textAlign==='left')}color:#fff;cursor:pointer;border-radius:4px;font-size:${p.textAlign==='left'?'11px':'15px'};">${p.textAlign==='left'?'左对齐':'←'}</button>
        <button class="tm-align" data-align="center" data-label="居中对齐" data-arrow="↔" style="flex:1;height:26px;padding:0;${sel(p.textAlign==='center')}color:#fff;cursor:pointer;border-radius:4px;font-size:${p.textAlign==='center'?'11px':'15px'};">${p.textAlign==='center'?'居中对齐':'↔'}</button>
        <button class="tm-align" data-align="right"  data-label="右对齐"   data-arrow="→" style="flex:1;height:26px;padding:0;${sel(p.textAlign==='right')}color:#fff;cursor:pointer;border-radius:4px;font-size:${p.textAlign==='right'?'11px':'15px'};">${p.textAlign==='right'?'右对齐':'→'}</button>
      </div>
    </div>

    <!-- ── 背景 文字 字重 ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">背景</span>
      <label id="tm-bg-color-swatch" style="${SW}background:${p.bgColor};"><input type="color" id="tm-bg-color" value="${p.bgColor}" style="${IN}"></label>
      <span style="color:#fff;font-size:12px;min-width:28px;text-align:center;">文字</span>
      <label id="tm-text-color-swatch" style="${SW}background:${p.textColor};"><input type="color" id="tm-text-color" value="${p.textColor}" style="${IN}"></label>
      <span style="color:#fff;font-size:12px;min-width:28px;">字重</span>
      <div style="display:flex;gap:10px;">
        <button class="tm-weight" data-weight="lighter" style="width:28px;height:28px;padding:0;${sel(p.fontWeight==='lighter')}color:#fff;cursor:pointer;border-radius:50%;font-size:13px;">细</button>
        <button class="tm-weight" data-weight="normal"  style="width:28px;height:28px;padding:0;${sel(p.fontWeight==='normal')}color:#fff;cursor:pointer;border-radius:50%;font-size:13px;">中</button>
        <button class="tm-weight" data-weight="bold"    style="width:28px;height:28px;padding:0;${sel(p.fontWeight==='bold')}color:#fff;cursor:pointer;border-radius:50%;font-size:13px;">粗</button>
      </div>
    </div>

    <!-- ── 大小 ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">大小</span>
      <input type="range" id="tm-font-size" min="8" max="100" value="${p.fontSize}" style="flex:1;accent-color:#5c9478;">
      <span id="tm-fs-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${p.fontSize}px</span>
    </div>

    <!-- ── 透明 ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">透明</span>
      <input type="range" id="tm-bg-alpha" min="0" max="1" step="0.05" value="${p.bgAlpha}" style="flex:1;accent-color:#5c9478;">
      <span id="tm-bg-alpha-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${Math.round(p.bgAlpha*100)}%</span>
    </div>

    <!-- ── 行距 ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">行距</span>
      <input type="range" id="tm-line-height" min="0.8" max="3" step="0.1" value="${p.lineHeight}" style="flex:1;accent-color:#5c9478;">
      <span id="tm-line-height-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${p.lineHeight}</span>
    </div>

    <!-- ── 边框 & 阴影（共用拾色器，颜色联动） ── -->
    <div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">边框</span>
      <label id="tm-border-color-swatch" style="${SW}background:${p.borderColor};">
        <input type="color" id="tm-border-color" value="${p.borderColor}" style="${IN}">
      </label>
      <input type="range" id="tm-border-width" min="0" max="10" step="1" value="${p.borderWidth}" style="flex:1;min-width:0;accent-color:#5c9478;">
      <span id="tm-border-width-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${p.borderWidth}px</span>
      <span style="color:#fff;font-size:12px;padding-left:4px;">阴影</span>
      <input type="range" id="tm-shadow-blur" min="0" max="30" step="1" value="${p.shadowBlur}" style="flex:1;min-width:0;accent-color:#5c9478;">
      <span id="tm-shadow-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${p.shadowBlur}</span>
    </div>

    <!-- ── 圆角 ── -->
    <div style="margin-bottom:0;display:flex;align-items:center;gap:8px;">
      <span style="color:#fff;font-size:12px;min-width:36px;">圆角</span>
      <input type="range" id="tm-border-radius" min="0" max="30" step="1" value="${getBorderRadius()}" style="flex:1;accent-color:#5c9478;">
      <span id="tm-border-radius-val" style="color:#7ab898;font-size:12px;width:38px;text-align:right;flex-shrink:0;">${getBorderRadius()}px</span>
    </div>

    </div>

    <!-- ── 版权信息 ── -->
    <div style="padding:10px 10px;border-top:1px solid #2e2e2e;text-align:center;flex-shrink:0;">
      <span style="color:#666;font-size:10px;letter-spacing:0.5px;white-space:nowrap;">©2026 WOS AI Studio. Powered by 穿山阅海</span>
    </div>
  `;

  document.body.appendChild(panel);
  node._stylePanel = panel;
  updateStylePanelPosition(node);

  // Position sync
  const syncPosition = () => {
    if (panel.parentElement && node._stylePanel === panel) {
      updateStylePanelPosition(node);
      panel._animationFrameId = requestAnimationFrame(syncPosition);
    }
  };
  panel._animationFrameId = requestAnimationFrame(syncPosition);

  // refreshAllUI
  function refreshAllUI() {
    panel.querySelectorAll(".tm-align").forEach(b => {
      const on = b.dataset.align === p.textAlign;
      b.style.background = on ? "#1e5c30" : "#444";
      b.style.border = on ? "1px solid #c8a020" : "1px solid #555";
      b.style.fontWeight = on ? "bold" : "normal";
      b.textContent = on ? b.dataset.label : b.dataset.arrow;
      b.style.fontSize = on ? "11px" : "15px";
    });
    panel.querySelectorAll(".tm-weight").forEach(b => {
      const on = b.dataset.weight === p.fontWeight;
      b.style.background = on ? "#1e5c30" : "#444";
      b.style.border = on ? "1px solid #c8a020" : "1px solid #555";
      b.style.fontWeight = on ? "bold" : "normal";
    });
    panel.querySelector("#tm-bg-color").value = p.bgColor;
    panel.querySelector("#tm-bg-color-swatch").style.background = p.bgColor;
    panel.querySelector("#tm-text-color").value = p.textColor;
    panel.querySelector("#tm-text-color-swatch").style.background = p.textColor;
    panel.querySelector("#tm-font-size").value = p.fontSize;
    panel.querySelector("#tm-fs-val").textContent = p.fontSize + "px";
    panel.querySelector("#tm-bg-alpha").value = p.bgAlpha;
    panel.querySelector("#tm-bg-alpha-val").textContent = Math.round(p.bgAlpha * 100) + "%";
    panel.querySelector("#tm-line-height").value = p.lineHeight;
    panel.querySelector("#tm-line-height-val").textContent = p.lineHeight;
    panel.querySelector("#tm-border-color").value = p.borderColor;
    panel.querySelector("#tm-border-color-swatch").style.background = p.borderColor;
    panel.querySelector("#tm-border-width").value = p.borderWidth;
    panel.querySelector("#tm-border-width-val").textContent = p.borderWidth + "px";
    const brVal = p.borderRadius !== undefined ? p.borderRadius : 0;
    panel.querySelector("#tm-border-radius").value = brVal;
    panel.querySelector("#tm-border-radius-val").textContent = brVal + "px";
    panel.querySelector("#tm-shadow-blur").value = p.shadowBlur;
    panel.querySelector("#tm-shadow-val").textContent = p.shadowBlur;

    applyTextareaStyles(node);
    updateTextareaPosition(node);
    if (autoResizeNode(node)) updateTextareaPosition(node);
    updateVueNodeBackground(node);
    app.graph.setDirtyCanvas(true);
  }

  // 自定义预设按钮
  function buildCustomPresetButtons() {
    const container = panel.querySelector("#tm-custom-presets-container");
    container.innerHTML = "";
    const custom = getCustomPresets();
    Object.keys(custom).forEach(name => {
      const chip = document.createElement("div");
      chip.style.cssText = "display:inline-flex;align-items:center;background:#2a2a2a;border:1px solid #444;border-radius:4px;overflow:hidden;";
      const applyBtn = document.createElement("button");
      applyBtn.textContent = name;
      applyBtn.style.cssText = "padding:0 8px;height:22px;background:transparent;border:none;color:#ddd;cursor:pointer;font-size:11px;font-family:inherit;";
      applyBtn.addEventListener("click", () => {
        const props = getCustomPresets()[name];
        if (props) {
          Object.assign(p, props);
          if (props.width) node.size[0] = props.width;
          refreshAllUI();
        }
      });
      const delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.title = "删除";
      delBtn.style.cssText = "padding:0 5px;height:22px;background:transparent;border:none;border-left:1px solid #444;color:#888;cursor:pointer;font-size:12px;font-family:inherit;";
      delBtn.addEventListener("click", () => {
        const c = getCustomPresets(); delete c[name]; saveCustomPresets(c);
        buildCustomPresetButtons();
      });
      chip.appendChild(applyBtn); chip.appendChild(delBtn);
      container.appendChild(chip);
    });
  }
  buildCustomPresetButtons();

  // 内置预设
  panel.querySelectorAll(".tm-builtin-preset").forEach(btn => btn.addEventListener("click", () => {
    const props = BUILTIN_PRESETS[btn.dataset.preset];
    if (props) {
      Object.assign(p, props);
      if (props.width) { node.size[0] = props.width; }
      refreshAllUI();
    }
  }));

  panel.querySelector("#tm-preset-save").addEventListener("click", () => {
    const nameEl = panel.querySelector("#tm-preset-name");
    const name = nameEl.value.trim();
    if (!name) {
      nameEl.style.border = "1px solid #f55";
      setTimeout(() => nameEl.style.border = "1px solid #444", 1000);
      return;
    }
    const custom = getCustomPresets();
    const saved = { ...p }; delete saved.text;
    custom[name] = saved;
    saveCustomPresets(custom);
    nameEl.value = "";
    buildCustomPresetButtons();
    const btn = panel.querySelector("#tm-preset-save");
    btn.textContent = "已保存 ✓"; btn.style.background = "#2d5c42";
    setTimeout(() => { btn.textContent = "保存"; btn.style.background = "#1e5c30"; }, 1200);
  });

  // 关闭
  panel.querySelector("#tm-close-btn").addEventListener("click", () => {
    if (panel._animationFrameId) cancelAnimationFrame(panel._animationFrameId);
    panel.remove(); node._stylePanel = null;
  });
  panel.querySelector("#tm-close-btn").addEventListener("mouseenter", e => {
    e.target.style.color = "#fff"; e.target.style.background = "rgba(255,255,255,0.1)";
  });
  panel.querySelector("#tm-close-btn").addEventListener("mouseleave", e => {
    e.target.style.color = "#aaa"; e.target.style.background = "transparent";
  });

  // 透明注释（重置）
  panel.querySelector("#tm-reset-btn").addEventListener("click", () => {
    Object.assign(p, DEFAULT_PROPS);
    if (DEFAULT_PROPS.width) { node.size[0] = DEFAULT_PROPS.width; }
    refreshAllUI();
  });

  // 对齐
  panel.querySelectorAll(".tm-align").forEach(btn => btn.addEventListener("click", () => {
    p.textAlign = btn.dataset.align;
    panel.querySelectorAll(".tm-align").forEach(b => {
      b.style.background = "#444"; b.style.border = "1px solid #555"; b.style.fontWeight = "normal";
      b.textContent = b.dataset.arrow; b.style.fontSize = "15px";
    });
    btn.style.background = "#1e5c30"; btn.style.border = "1px solid #c8a020"; btn.style.fontWeight = "bold";
    btn.textContent = btn.dataset.label; btn.style.fontSize = "11px";
    applyTextareaStyles(node);
    app.graph.setDirtyCanvas(true);
  }));

  // 颜色
  panel.querySelector("#tm-bg-color").addEventListener("input", e => {
    p.bgColor = e.target.value;
    panel.querySelector("#tm-bg-color-swatch").style.background = p.bgColor;
    updateVueNodeBackground(node); app.graph.setDirtyCanvas(true);
  });
  panel.querySelector("#tm-text-color").addEventListener("input", e => {
    p.textColor = e.target.value;
    panel.querySelector("#tm-text-color-swatch").style.background = p.textColor;
    applyTextareaStyles(node);
  });

  // 滑块
  panel.querySelector("#tm-font-size").addEventListener("input", e => {
    p.fontSize = parseInt(e.target.value);
    panel.querySelector("#tm-fs-val").textContent = p.fontSize + "px";
    applyTextareaStyles(node);
    updateTextareaPosition(node);
    if (autoResizeNode(node)) updateTextareaPosition(node);
    app.graph.setDirtyCanvas(true);
  });
  panel.querySelector("#tm-bg-alpha").addEventListener("input", e => {
    p.bgAlpha = parseFloat(e.target.value);
    panel.querySelector("#tm-bg-alpha-val").textContent = Math.round(p.bgAlpha * 100) + "%";
    updateVueNodeBackground(node); app.graph.setDirtyCanvas(true);
  });
  panel.querySelector("#tm-line-height").addEventListener("input", e => {
    p.lineHeight = parseFloat(e.target.value);
    panel.querySelector("#tm-line-height-val").textContent = p.lineHeight;
    applyTextareaStyles(node);
    updateTextareaPosition(node);
    if (autoResizeNode(node)) updateTextareaPosition(node);
    app.graph.setDirtyCanvas(true);
  });

  // 字重
  panel.querySelectorAll(".tm-weight").forEach(btn => btn.addEventListener("click", () => {
    p.fontWeight = btn.dataset.weight;
    panel.querySelectorAll(".tm-weight").forEach(b => {
      b.style.background = "#444"; b.style.border = "1px solid #555"; b.style.fontWeight = "normal";
    });
    btn.style.background = "#1e5c30"; btn.style.border = "1px solid #c8a020"; btn.style.fontWeight = "bold";
    applyTextareaStyles(node);
    updateTextareaPosition(node);
    if (autoResizeNode(node)) updateTextareaPosition(node);
    app.graph.setDirtyCanvas(true);
  }));

  // 边框 & 阴影（颜色联动）
  panel.querySelector("#tm-border-color").addEventListener("input", e => {
    p.borderColor = e.target.value;
    p.shadowColor = e.target.value;
    p.borderEnabled = true;
    panel.querySelector("#tm-border-color-swatch").style.background = p.borderColor;
    updateVueNodeBackground(node);
    app.graph.setDirtyCanvas(true);
  });
  panel.querySelector("#tm-border-width").addEventListener("input", e => {
    p.borderWidth = parseInt(e.target.value);
    p.borderEnabled = p.borderWidth > 0;
    panel.querySelector("#tm-border-width-val").textContent = p.borderWidth + "px";
    updateVueNodeBackground(node);
    app.graph.setDirtyCanvas(true);
  });

  // 圆角
  panel.querySelector("#tm-border-radius").addEventListener("input", e => {
    p.borderRadius = parseInt(e.target.value);
    panel.querySelector("#tm-border-radius-val").textContent = p.borderRadius + "px";
    updateVueNodeBackground(node);
    app.graph.setDirtyCanvas(true);
  });

  // 阴影
  panel.querySelector("#tm-shadow-blur").addEventListener("input", e => {
    p.shadowBlur = parseInt(e.target.value);
    panel.querySelector("#tm-shadow-val").textContent = p.shadowBlur;
    updateVueNodeBackground(node);
    app.graph.setDirtyCanvas(true);
  });
}

/** 创建 textarea 元素（DOM 叠加在 canvas 上方，支持 IME / 复制粘贴 / 文本选中） */
function createTextarea(node) {
  if (node._textarea) return node._textarea;

  const p = node._memoProps;
  const ta = document.createElement("textarea");
  ta.className = "title-memo-textarea";
  ta.value = p.text;
  ta.spellcheck = false;

  ta.style.cssText = `
    position: fixed;
    box-sizing: border-box;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    -webkit-background-clip: none;
    background-clip: none;
    text-shadow: none;
    overflow: hidden;
    font-family: ${p.fontFamily};
    font-size: ${p.fontSize}px;
    line-height: ${p.lineHeight};
    font-weight: ${p.fontWeight};
    color: ${p.textColor};
    text-align: ${p.textAlign};
    padding: ${p.padding}px;
    word-break: break-word;
    white-space: pre-wrap;
    pointer-events: auto;
    z-index: 10;
    border-radius: 0;
    max-height: none;
  `;

  ta.addEventListener("input", () => {
    p.text = ta.value;
    updateTextareaPosition(node);
    if (autoResizeNode(node)) updateTextareaPosition(node);
    ta.scrollTop = 0;
    app.graph.setDirtyCanvas(true);
  });

  ta.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    e.preventDefault();
    window.getSelection().removeAllRanges();
    createStyleEditor(node);
  });

  ta.addEventListener("mousedown", (e) => {
    const rect = ta.getBoundingClientRect();

    // 右下角 resize 区域
    const distRight  = rect.right  - e.clientX;
    const distBottom = rect.bottom - e.clientY;
    if (distRight <= RESIZE_ZONE && distBottom <= RESIZE_ZONE) {
      ta.style.pointerEvents = "none";
      app.canvas.canvas.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: false, cancelable: true, view: window,
        clientX: e.clientX, clientY: e.clientY,
        button: e.button, buttons: e.buttons,
      }));
      const restore = () => {
        ta.style.pointerEvents = "auto";
        document.removeEventListener("mouseup", restore);
      };
      document.addEventListener("mouseup", restore);
      return;
    }

    // 关闭样式面板
    if (node._stylePanel) {
      if (node._stylePanel._animationFrameId) cancelAnimationFrame(node._stylePanel._animationFrameId);
      node._stylePanel.remove();
      node._stylePanel = null;
    }

    // 标题栏区域
    const nodeCanvas = app.canvas.canvas;
    const nodeRect = nodeCanvas.getBoundingClientRect();
    if (e.clientY - nodeRect.top < LiteGraph.NODE_TITLE_HEIGHT) return;

    // 文字区域点击判断
    const hasText = ta.value && ta.value.trim().length > 0;
    const clickedOnText = hasText && (
      e.offsetX >= p.padding &&
      e.offsetX <= ta.offsetWidth  - p.padding &&
      e.offsetY >= p.padding &&
      e.offsetY <= ta.offsetHeight - p.padding
    );
    if (clickedOnText) e.stopPropagation();
  });

  ta.addEventListener("focus", () => {
    if (ta.value === PLACEHOLDER_TEXT) {
      ta.value = "";
      p.text = "";
    }
    app.graph.setDirtyCanvas(true);
  });

  ta.addEventListener("blur", () => {
    if (ta.value.trim() === "") {
      ta.value = PLACEHOLDER_TEXT;
      p.text = PLACEHOLDER_TEXT;
    }
    app.graph.setDirtyCanvas(true);
  });

  ta.addEventListener("keydown", (e) => e.stopPropagation());

  ta.addEventListener("wheel", (e) => e.stopPropagation());

  ta.scrollTop = 0;
  ta.style.display = node.collapsed ? "none" : "block";

  node._textarea = ta;
  return ta;
}

/** 更新样式面板屏幕定位（跟随节点移动） */
function updateStylePanelPosition(node) {
  const panel = node._stylePanel;
  if (!panel) return;

  const canvas = app.canvas;
  if (!canvas) return;

  const canvasEl = canvas.canvas || canvas;
  const canvasRect = canvasEl.getBoundingClientRect();

  let scale = 1;
  let offset = [0, 0];

  if (canvas.ds) {
    scale = canvas.ds.scale;
    offset = canvas.ds.offset;
  } else if (canvas.viewTransform) {
    scale = canvas.viewTransform[0] || 1;
    offset = [canvas.viewTransform[4] || 0, canvas.viewTransform[5] || 0];
  } else if (canvas.getTransform) {
    const transform = canvas.getTransform();
    if (transform) { scale = transform[0] || 1; offset = [transform[4] || 0, transform[5] || 0]; }
  }

  const nodeX = canvasRect.left + (node.pos[0] + offset[0]) * scale;
  const nodeY = canvasRect.top  + (node.pos[1] + offset[1]) * scale;
  const nodeW = node.size[0] * scale;
  const nodeH = node.size[1] * scale;

  const panelW = panel._baseWidth;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const measuredH = panel.getBoundingClientRect().height || 350;

  // 定位：优先右侧，放不下则左侧
  const rightX = nodeX + nodeW + STYLE_PANEL_OFFSET;
  const canFitRight = rightX + panelW + 8 <= viewportW;
  const canFitLeft  = nodeX - panelW - STYLE_PANEL_OFFSET >= 8;

  if (canFitRight) {
    panel.style.left = rightX + "px";
  } else if (canFitLeft) {
    panel.style.left = (nodeX - panelW - STYLE_PANEL_OFFSET) + "px";
  } else {
    // 左右都放不下时，贴右边界
    panel.style.left = Math.max(8, viewportW - panelW - 8) + "px";
  }

  // 垂直方向：与节点顶边对齐，超出屏幕底部时上移
  const rawTop  = nodeY;
  const spaceDown = viewportH - rawTop - 8;
  panel.style.top = Math.max(8, Math.min(rawTop, viewportH - measuredH - 8)) + "px";
  panel.style.maxHeight = Math.max(150, spaceDown) + "px";

  panel.style.width  = panelW + "px";
  panel.style.height = "auto";
  panel.style.fontSize = panel._baseFontSize + "px";
  panel.style.overflowY = "auto";
}

/** 更新 textarea 位置（兼容 Vue/Nodes2.0 DOM 模式与经典 canvas 模式） */
function updateTextareaPosition(node) {
  const ta = node._textarea;
  if (!ta) return;

  const canvas = app.canvas;
  if (!canvas) return;

  const canvasEl = canvas.canvas || canvas;
  const canvasRect = canvasEl.getBoundingClientRect();

  let scale = 1;
  let offset = [0, 0];

  if (canvas.ds) {
    scale = canvas.ds.scale;
    offset = canvas.ds.offset;
  } else if (canvas.viewTransform) {
    scale = canvas.viewTransform[0] || 1;
    offset = [canvas.viewTransform[4] || 0, canvas.viewTransform[5] || 0];
  } else if (canvas.getTransform) {
    const transform = canvas.getTransform();
    if (transform) { scale = transform[0] || 1; offset = [transform[4] || 0, transform[5] || 0]; }
  }

  let x, y, w, h;

  const nodeEl = document.querySelector(`[data-id="${node.id}"], [data-node-id="${node.id}"], #node-${node.id}`);
  if (nodeEl) {
    const elRect = nodeEl.getBoundingClientRect();
    const titleBar = nodeEl.querySelector('.title, .litegraph_node_header');
    const titleBarHeight = titleBar ? titleBar.getBoundingClientRect().height : 0;

    const margin = TEXT_AREA_MARGIN;
    x = elRect.left + margin;
    y = elRect.top + titleBarHeight + margin;
    w = elRect.width - margin * 2;
    h = elRect.height - titleBarHeight - margin * 2;
  } else {

    const margin = TEXT_AREA_MARGIN * scale;
    x = canvasRect.left + (node.pos[0] + offset[0]) * scale + margin;
    y = canvasRect.top  + (node.pos[1] + offset[1]) * scale + margin;
    w = node.size[0] * scale - margin * 2;
    h = node.size[1] * scale - margin * 2;
  }

  if (h <= 0 || w <= 0) {
    ta.style.display = "none";
    return;
  }

  h = Math.max(h, TEXT_AREA_MIN_HEIGHT);

  ta.style.left     = x + "px";
  ta.style.top      = y + "px";
  ta.style.width    = w + "px";
  ta.style.height   = h + "px";
  ta.style.overflow = "hidden";

  applyTextareaStyles(node);
}

/** 节点高度自适应（临时压缩 textarea 至 1px 读取 scrollHeight） */
function autoResizeNode(node) {
  const ta = node._textarea;
  if (!ta || node.collapsed) return false;

  const canvas = app.canvas;
  if (!canvas) return false;

  let scale = 1;
  if (canvas.ds) {
    scale = canvas.ds.scale;
  } else if (canvas.viewTransform) {
    scale = canvas.viewTransform[0] || 1;
  } else if (canvas.getTransform) {
    const t = canvas.getTransform();
    if (t) scale = t[0] || 1;
  }

  const minNodeH = node.min_size ? node.min_size[1] : 50;

  const prevH = ta.style.height;
  ta.style.height = "1px";
  const contentH = ta.scrollHeight;
  ta.style.height = prevH;

  const margin = TEXT_AREA_MARGIN * scale;
  const requiredNodeH = Math.max(minNodeH, (contentH + margin * 2) / scale);

  if (Math.abs(requiredNodeH - node.size[1]) > 0.5) {
    node.size[1] = requiredNodeH;
    return true;
  }
  return false;
}

app.registerExtension({
  name: "Title_Memo",

  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    if (nodeData.name !== NODE_TYPE) return;

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

      this._memoProps = { ...DEFAULT_PROPS, ...BUILTIN_PRESETS["大标题"] };
      this.serialize_widgets = true;
      this.size = [BUILTIN_PRESETS["大标题"].width || 300, 60];
      this.resizable = true;
      this.min_size = [100, 50];
      this.title = NODE_TITLE;
      this._showTitle = false;
      updateVueNodeBackground(this);
      return r;
    };

    const onSerialize = nodeType.prototype.onSerialize;
    nodeType.prototype.onSerialize = function (data) {
      const r = onSerialize ? onSerialize.apply(this, arguments) : undefined;
      data._memoProps = { ...this._memoProps };
      return r;
    };

    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function (data) {
      const r = onConfigure ? onConfigure.apply(this, arguments) : undefined;
      if (data._memoProps) {
        this._memoProps = { ...DEFAULT_PROPS, ...data._memoProps };
        updateVueNodeBackground(this);
        if (this._textarea) {
          this._textarea.value = this._memoProps.text;
          this._textarea.scrollTop = 0;
          const _node = this;
          setTimeout(() => {
            updateTextareaPosition(_node);
            if (autoResizeNode(_node)) updateTextareaPosition(_node);
            app.graph.setDirtyCanvas(true);
          }, 100);
        }
      }
      return r;
    };

    nodeType.prototype.onMouseEnter = function () {
      this._showTitle = true;
      app.graph.setDirtyCanvas(true);
    };
    nodeType.prototype.onMouseLeave = function () {
      this._showTitle = false;
      app.graph.setDirtyCanvas(true);
    };

    const originalOnResize = nodeType.prototype.onResize;
    nodeType.prototype.onResize = function (size) {
      const result = originalOnResize ? originalOnResize.call(this, size) : undefined;
      if (this._textarea) {
        if (this.collapsed) {
          this._textarea.style.display = "none";
        } else {
          this._textarea.style.display = "block";
          updateTextareaPosition(this);
          this._textarea.style.overflowY = "hidden";
          this._textarea.style.overflowX = "hidden";
        }
      }
      if (this._stylePanel) {
        updateStylePanelPosition(this);
      }
      return result;
    };

    nodeType.prototype.collapse = function () {
      if (typeof LGraphNode.prototype.collapse === 'function') LGraphNode.prototype.collapse.call(this);
      if (this._textarea) this._textarea.style.display = "none";
      updateVueNodeBackground(this);
    };
    nodeType.prototype.expand = function () {
      if (typeof LGraphNode.prototype.expand === 'function') LGraphNode.prototype.expand.call(this);
      if (this._textarea) {
        this._textarea.style.display = "block";
        updateTextareaPosition(this);
      }
      updateVueNodeBackground(this);
    };

    const originalOnMouseDown = nodeType.prototype.onMouseDown;
    nodeType.prototype.onMouseDown = function (e, localPos, canvas) {
      const clickedOnTitle = localPos[1] < LiteGraph.NODE_TITLE_HEIGHT;

      if (this._stylePanel) {
        if (this._stylePanel._animationFrameId) cancelAnimationFrame(this._stylePanel._animationFrameId);
        this._stylePanel.remove();
        this._stylePanel = null;
      }

      if (clickedOnTitle && localPos[0] < 20) {
        this.collapsed = !this.collapsed;
        if (this._textarea) this._textarea.style.display = this.collapsed ? "none" : "block";
        app.graph.setDirtyCanvas(true);
        return true;
      }

      if (originalOnMouseDown) {
        const result = originalOnMouseDown.call(this, e, localPos, canvas);
        if (this._textarea) this._textarea.style.display = this.collapsed ? "none" : "block";
        return result;
      }
      return false;
    };

    const onDrawTitle = nodeType.prototype.onDrawTitle;
    nodeType.prototype.onDrawTitle = function (ctx) {
      if (!this._showTitle) return;
      if (onDrawTitle) return onDrawTitle.apply(this, arguments);
    };

    const onDrawNodeShape = nodeType.prototype.onDrawNodeShape;
    nodeType.prototype.onDrawNodeShape = function (ctx, size, fgcolor, bgcolor, selected, mouse_over) {
      if (selected || mouse_over) {
        if (onDrawNodeShape) return onDrawNodeShape.apply(this, arguments);
        ctx.strokeStyle = fgcolor || "#00ffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, size[0], size[1]);
      }
    };

    nodeType.prototype.onDrawBackground = function (ctx) {
      const p = this._memoProps;
      const size = this.size;
      const hasShadow = p.shadowBlur > 0;
      const userBorder = p.borderEnabled && p.borderWidth > 0;

      const radius = p.borderRadius !== undefined ? p.borderRadius : BORDER_RADIUS;

      // 背景填充
      if (!this.collapsed && p.bgAlpha > 0) {
        if (hasShadow && !userBorder) {
          applyShadow(ctx, p.shadowColor, p.shadowBlur, p.shadowOffsetX, p.shadowOffsetY);
        } else {
          resetShadow(ctx);
        }
        ctx.fillStyle = hexToRgba(p.bgColor, p.bgAlpha);
        traceRoundedRect(ctx, size[0], size[1], radius);
        ctx.fill();
        resetShadow(ctx);
      }

      // 透明背景编辑轮廓（虚线）
      const taFocused = this._textarea && document.activeElement === this._textarea;
      if (!this.collapsed && p.bgAlpha === 0 && taFocused) {
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        traceRoundedRect(ctx, size[0], size[1], radius);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 用户边框
      if (!this.collapsed && userBorder) {
        if (hasShadow) applyShadow(ctx, p.shadowColor, p.shadowBlur, p.shadowOffsetX, p.shadowOffsetY);
        ctx.strokeStyle = p.borderColor || "#00ffff";
        ctx.lineWidth = p.borderWidth;
        traceRoundedRect(ctx, size[0], size[1], radius);
        ctx.stroke();
        resetShadow(ctx);
      }

      // 悬停边界指示线
      if (!this.collapsed && this._showTitle && !userBorder) {
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        traceRoundedRect(ctx, size[0], size[1], radius);
        ctx.stroke();
      }
    };

    nodeType.title_mode = LiteGraph.NO_TITLE;
    nodeType.prototype.isVirtualNode = true;
    nodeType.prototype.getTitle = function () { return ""; };

    nodeType.prototype.onRemoved = function () {
      const styleEl = document.getElementById(`tm-node-bg-${this.id}`);
      if (styleEl) styleEl.remove();
      if (this._textarea) {
        this._textarea.remove();
        this._textarea = null;
      }
      if (this._stylePanel) {
        if (this._stylePanel._animationFrameId) cancelAnimationFrame(this._stylePanel._animationFrameId);
        this._stylePanel.remove();
        this._stylePanel = null;
      }

      const editor = document.getElementById("title-memo-style-editor");
      if (editor && editor._attachedNode === this) {
        if (editor._animationFrameId) cancelAnimationFrame(editor._animationFrameId);
        editor.remove();
      }
    };
  },

  async setup() {
    const canvasEl = app.canvas.canvas;
    const container = canvasEl.parentElement;

    cleanupRefs.origDrawNodeTitle = LGraphCanvas.prototype.drawNodeTitle;
    LGraphCanvas.prototype.drawNodeTitle = function (node, ctx) {
      if (node && node.type === NODE_TYPE) return;
      if (cleanupRefs.origDrawNodeTitle) return cleanupRefs.origDrawNodeTitle.apply(this, arguments);
    };

    if (!document.getElementById("tm-badge-css")) {
      const s = document.createElement("style");
      s.id = "tm-badge-css";
      s.textContent = `
        div.pointer-events-none.fixed.top-0.left-0.z-40[style*="--tb-x"] {
          display: none !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(s);
    }

    const removeDomBadges = () => {
      document.querySelectorAll("div.pointer-events-none.fixed.top-0.left-0.z-40").forEach(el => {
        if ((el.textContent || "").includes("Title-Memo")) el.remove();
      });
    };

    cleanupRefs.badgeObserver = new MutationObserver(() => removeDomBadges());
    cleanupRefs.badgeObserver.observe(document.body, { childList: true, subtree: false });
    removeDomBadges();
    setTimeout(removeDomBadges, BADGE_REMOVE_DELAY_1);
    setTimeout(removeDomBadges, BADGE_REMOVE_DELAY_2);
    setTimeout(() => {
      removeDomBadges();
      if (cleanupRefs.badgeObserver) cleanupRefs.badgeObserver.disconnect();
    }, BADGE_REMOVE_DELAY_3);

    cleanupRefs.origDrawNode = LGraphCanvas.prototype.drawNode;
    LGraphCanvas.prototype.drawNode = function (node, ctx) {
      if (node.type === NODE_TYPE) {
        node.color   = "transparent";
        node.bgcolor = "transparent";

        const _origFillText = ctx.fillText;
        ctx.fillText = function (text, x, y, maxWidth) {
          if (typeof text === "string" && /^#\d+\s/.test(text)) return;
          return _origFillText.apply(this, arguments);
        };

        const _p = node._memoProps || {};
        const _borderHalf = _p.borderEnabled ? Math.ceil((_p.borderWidth || 0) / 2) : 0;
        const shadowRoom = Math.max((_p.shadowBlur || 0) + _borderHalf + 5, 10);
        const borderTop = Math.max(_borderHalf, 10);
        ctx.save();
        ctx.beginPath();
        ctx.rect(-shadowRoom, -borderTop, node.size[0] + shadowRoom * 2, node.size[1] + shadowRoom + borderTop);
        ctx.clip();

        const result = cleanupRefs.origDrawNode.apply(this, arguments);

        ctx.restore();
        ctx.fillText = _origFillText;

        if (!node._textarea) {
          container.appendChild(createTextarea(node));
        }
        if (node._textarea) {
          if (node.collapsed) {
            node._textarea.style.display = "none";
          } else {
            node._textarea.style.display = "block";
            updateTextareaPosition(node);
          }
        }

        return result;
      }
      return cleanupRefs.origDrawNode.apply(this, arguments);
    };

    cleanupRefs.closeStylePanels = (e) => {
      if (!app.graph) return;
      app.graph._nodes.forEach(node => {
        if (node.type === NODE_TYPE && node._stylePanel) {
          const rect = node._stylePanel.getBoundingClientRect();
          const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top  && e.clientY <= rect.bottom;
          if (!inside) {
            if (node._stylePanel._animationFrameId) cancelAnimationFrame(node._stylePanel._animationFrameId);
            node._stylePanel.remove();
            node._stylePanel = null;
          }
        }
      });
    };
    document.addEventListener('mousedown', cleanupRefs.closeStylePanels, true);

    cleanupRefs.handleTitleBarClick = (e) => {
      if (!app.graph || !app.canvas) return;
      const nodeEl = e.target.closest('.litegraph.node');
      if (!nodeEl) return;
      const nodeId = parseInt(nodeEl.dataset?.nodeId) || parseInt(nodeEl.id?.replace('node-', ''));
      const node = app.graph._nodes.find(n => n.id === nodeId);
      if (!node || node.type !== NODE_TYPE) return;
      const titleBar = nodeEl.querySelector('.title');
      if (!titleBar) return;
      const titleRect = titleBar.getBoundingClientRect();
      const isOnTitleBar = e.clientX >= titleRect.left && e.clientX <= titleRect.right &&
                           e.clientY >= titleRect.top  && e.clientY <= titleRect.bottom;
      if (isOnTitleBar) {
        const isOnMinimizeDot = e.clientX >= titleRect.left &&
                                e.clientX <= titleRect.left + TITLE_BAR_DOT_SIZE * 2 &&
                                e.clientY >= titleRect.top  && e.clientY <= titleRect.bottom;
        if (isOnMinimizeDot) {
          node.collapsed = !node.collapsed;
          app.graph.setDirtyCanvas(true);
        }
      }
    };
    document.addEventListener('mousedown', cleanupRefs.handleTitleBarClick, true);

    cleanupRefs.origOnMouseWheel = LGraphCanvas.prototype.onMouseWheel;
    LGraphCanvas.prototype.onMouseWheel = function (e) {
      const result = cleanupRefs.origOnMouseWheel.apply(this, arguments);
      if (this.graph) {
        this.graph._nodes.forEach(node => {
          if (node.type === NODE_TYPE) {
            if (node._textarea) updateTextareaPosition(node);
            if (node._stylePanel) updateStylePanelPosition(node);
          }
        });
      }
      return result;
    };

    cleanupRefs.origOnMouseMove = LGraphCanvas.prototype.onMouseMove;
    LGraphCanvas.prototype.onMouseMove = function (e) {
      const result = cleanupRefs.origOnMouseMove.apply(this, arguments);
      if (this.dragging_canvas && this.graph) {
        this.graph._nodes.forEach(node => {
          if (node.type === NODE_TYPE && node._stylePanel) {
            updateStylePanelPosition(node);
          }
        });
      }
      return result;
    };

    cleanupRefs.origRemove = LGraph.prototype.remove;
    LGraph.prototype.remove = function (node) {
      if (node?.type === NODE_TYPE) {
        delete lastNodeState[node.id];
      }
      return cleanupRefs.origRemove.apply(this, arguments);
    };

    const lastNodeState = {};
    const checkNodeState = () => {
      if (app.graph) {
        app.graph._nodes.forEach(node => {
          if (node.type !== NODE_TYPE) return;
          const key = node.id;
          const hash = `${node.collapsed}|${node.pos[0]}|${node.pos[1]}|${node.size[0]}|${node.size[1]}`;
          if (lastNodeState[key] !== hash) {
            lastNodeState[key] = hash;
            if (node._textarea) {
              node._textarea.style.display = node.collapsed ? "none" : "block";
              if (!node.collapsed) updateTextareaPosition(node);
            }
            updateVueNodeBackground(node);
          }
        });
      }
      cleanupRefs.checkAnimationFrameId = requestAnimationFrame(checkNodeState);
    };
    checkNodeState();
  },

  async remove() {
    document.removeEventListener('mousedown', cleanupRefs.closeStylePanels, true);
    document.removeEventListener('mousedown', cleanupRefs.handleTitleBarClick, true);
    if (cleanupRefs.checkAnimationFrameId) cancelAnimationFrame(cleanupRefs.checkAnimationFrameId);
    if (cleanupRefs.badgeObserver) cleanupRefs.badgeObserver.disconnect();
    const styleEl = document.getElementById("tm-badge-css");
    if (styleEl) styleEl.remove();
    if (cleanupRefs.origDrawNodeTitle) LGraphCanvas.prototype.drawNodeTitle = cleanupRefs.origDrawNodeTitle;
    if (cleanupRefs.origDrawNode)      LGraphCanvas.prototype.drawNode      = cleanupRefs.origDrawNode;
    if (cleanupRefs.origOnMouseWheel)  LGraphCanvas.prototype.onMouseWheel  = cleanupRefs.origOnMouseWheel;
    if (cleanupRefs.origOnMouseMove)   LGraphCanvas.prototype.onMouseMove   = cleanupRefs.origOnMouseMove;
    if (cleanupRefs.origRemove)        LGraph.prototype.remove              = cleanupRefs.origRemove;
  },
});

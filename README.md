# Title2SVG

将 Markdown 标题转换为 SVG 思维导图的在线工具

## ✨ 功能特性

- 🎯 **实时预览** - 左侧编辑，右侧实时生成思维导图
- 📝 **智能编辑器** - 行号显示、滚动同步、快捷键支持
- 🎨 **主题切换** - 完整的亮色/暗色主题系统
- 🔍 **缩放拖拽** - 支持鼠标滚轮缩放、拖拽移动、键盘快捷键
- 📊 **SVG 导出** - 一键导出高质量 SVG 文件，自动时间戳命名
- 🔧 **多级标题** - 支持 `#` 到 `######` 的标题层级
- 🚀 **零依赖** - 纯 Vue3 实现，无外部依赖
- ⚡ **现代化 UI** - 响应式设计，优雅的交互体验

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 📋 使用方法

### 基础操作
1. **输入 Markdown 标题**：在左侧编辑器中输入标题
2. **实时预览**：右侧自动生成思维导图
3. **导出 SVG**：使用 `Ctrl+S`/`Cmd+S` 或点击按钮导出
4. **切换主题**：点击 🌙/☀️ 按钮切换主题

### 预览面板交互
- **滚轮缩放**：在预览面板使用鼠标滚轮缩放
- **拖拽移动**：按住左键拖拽移动视图
- **控制按钮**：
  - 🔍- / 🔍+ 缩放
  - 📐 适应屏幕
  - 🔄 重置缩放
  - 实时显示缩放百分比

### 快捷键支持
- **`Ctrl+S`/`Cmd+S`** - 导出 SVG
- **`Tab`** - 插入缩进
- **`+`/`-`** - 缩放
- **`0`** - 重置缩放
- **`F`** - 适应屏幕

## 📖 示例输入

```markdown
# git submodules
## 子模块
### 常用命令
### 克隆项目
## 项目改造
### 子模块关联改造
### 忽略子模块的更新
### router 改造
### vuex 改造
## 平时开发
## 子模块 lint 失效
## @vue/cli-service lint 命令
## githooks
### husky
### yorkie
## 改造 yorkie
```

## ⚙️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5.x
- **包管理器**: pnpm
- **Canvas API**: 用于思维导图渲染
- **SVG**: 导出格式
- **架构模式**: 函数式编程 + 组件化设计

## 🎯 核心功能详解

### 📝 智能编辑器
- **行号显示**: 左侧行号，支持 hover 高亮
- **滚动同步**: 行号与内容区域完美同步滚动
- **快捷键支持**:
  - `Ctrl+S`/`Cmd+S`: 快速导出
  - `Tab`: 智能缩进（2个空格）
- **实时统计**: 显示行数和字符数
- **主题切换**: 独立的编辑器主题系统

### 🎨 思维导图渲染
- **智能布局**: 根节点左侧，子节点右侧分支
- **节点样式**:
  - 1-2级标题: 带边框圆角矩形
  - 3级以上: 无边框文本
- **连接线**: 弯曲连接线，视觉层次清晰
- **居中显示**: 自动计算内容边界，画布居中显示
- **颜色系统**: 统一的颜色主题

### 🔍 缩放拖拽系统
- **鼠标交互**:
  - 滚轮缩放
  - 左键拖拽移动
- **智能限制**: 动态计算最小/最大缩放级别
- **按钮控制**:
  - 缩放按钮自动禁用（达到限制时）
  - 实时显示缩放百分比
  - 快速适应屏幕功能
- **键盘快捷键**: `+`/`-` 缩放，`0` 重置，`F` 适应屏幕

### 📊 SVG 导出
- **高质量导出**: 矢量格式，无损缩放
- **智能命名**: `流程图-YYYYMMDDHHMMSS.svg` 格式
- **完整保真**: 保持原始颜色、布局和样式
- **跨平台兼容**: 支持 Windows/Linux/Mac

### 🌙 主题系统
- **全局主题**: 整体应用的亮色/暗色主题
- **平滑过渡**: 所有 UI 元素的颜色过渡动画
- **一致性**: 编辑器、预览面板、控制按钮统一主题
- **本地存储**: 自动记住用户的主题偏好

## 📱 浏览器支持

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## 🔧 项目结构

```
title2svg/
├── index.html           # 入口 HTML
├── package.json         # 项目配置
├── vite.config.js       # Vite 配置
├── src/
│   ├── App.vue          # 主应用组件
│   ├── main.js          # 应用入口
│   ├── components/
│   │   └── MarkdownEditor.vue  # 编辑器组件
│   └── utils/
│       └── flowChart.js # 思维导图核心逻辑（函数式实现）
```

## 🏗️ 核心 API 说明

### 主要导出函数
```javascript
import { parseMarkdownTitles, renderFlowChart, exportToSVG } from './utils/flowChart.js'

// 解析 Markdown 标题并构建树结构
const titleTree = parseMarkdownTitles(markdownText)

// 在 Canvas 上渲染思维导图
renderFlowChart(canvasElement, titleTree)

// 导出为 SVG 格式
const svgContent = exportToSVG(titleTree)
```

### 内部辅助函数
```javascript
buildTitleTree(titles)           // 构建标题树结构
calculateLayout(tree, w, h)      // 计算节点布局
drawConnections(ctx, layout)     // 绘制连接线
drawNodes(ctx, layout)           // 绘制节点
estimateTextWidth(text, level)   // 精确计算文本宽度
```

## 🎨 设计理念

- **简洁优雅**: 现代化的 UI 设计，注重用户体验
- **功能完整**: 涵盖编辑、预览、导出的完整工作流
- **性能优化**: 实时渲染，流畅的交互体验
- **响应式**: 适配不同屏幕尺寸和设备
- **可扩展**: 清晰的代码结构，易于维护和扩展

## 📄 许可证

MIT License

---

**Made with ❤️ by Vue3 & Canvas API**
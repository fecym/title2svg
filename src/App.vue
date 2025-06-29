<template>
  <div class="app" :class="{ 'dark-theme': editorTheme === 'dark' }">
    <header class="header">
      <div class="header-left">
        <h1>Title2SVG</h1>
        <p>将 Markdown 标题转换为 SVG 流程图</p>
      </div>
      <div class="header-right">
        <div class="actions">
          <button @click="toggleTheme" class="theme-btn">
            {{ editorTheme === 'light' ? '🌙' : '☀️' }}
          </button>
          <button @click="exportSVG" class="export-btn">导出 SVG</button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="editor-panel">
        <MarkdownEditor
          v-model="markdownText"
          :theme="editorTheme"
          @export="exportSVG"
        />
      </div>

      <div class="preview-panel" tabindex="0">
        <div class="panel-header">
          <h3>流程图预览</h3>
          <div class="preview-controls">
            <button
              @click="zoomOut"
              class="control-btn"
              :disabled="zoomLevel <= minZoomLevel"
              :title="`缩小 (快捷键: -) 最小: ${Math.round(minZoomLevel * 100)}%`">
              🔍-
            </button>
            <span class="zoom-level" :title="`缩放范围: ${Math.round(minZoomLevel * 100)}% - ${Math.round(maxZoomLevel * 100)}%`">
              {{ Math.round(zoomLevel * 100) }}%
            </span>
            <button
              @click="zoomIn"
              class="control-btn"
              :disabled="zoomLevel >= maxZoomLevel"
              :title="`放大 (快捷键: +) 最大: ${Math.round(maxZoomLevel * 100)}%`">
              🔍+
            </button>
            <button @click="fitToScreen" class="control-btn" title="适应屏幕 (快捷键: F)">📐</button>
            <button @click="resetZoom" class="control-btn" title="重置缩放 (快捷键: 0)">🔄</button>
          </div>
        </div>
        <div class="canvas-container"
             @wheel="handleWheel"
             @mousedown="handleMouseDown"
             @mousemove="handleMouseMove"
             @mouseup="handleMouseUp"
             @mouseleave="handleMouseUp">
          <div class="canvas-wrapper"
            :style="{
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'center center'
            }">
            <canvas
              ref="canvasRef"
              @click="handleCanvasClick"
              class="preview-canvas"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { parseMarkdownTitles, renderFlowChart, exportToSVG } from './utils/flowChart.js'
import MarkdownEditor from './components/MarkdownEditor.vue'

const markdownText = ref(`# git submodules
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
## 改造 yorkie`)

const canvasRef = ref(null)
const editorTheme = ref('light')

// 缩放和拖拽相关状态
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

// 动态缩放限制
const minZoomLevel = ref(0.1)
const maxZoomLevel = ref(5)

// 解析并渲染流程图
const updateFlowChart = async () => {
  await nextTick()
  if (!canvasRef.value) return

  const titles = parseMarkdownTitles(markdownText.value)
  renderFlowChart(canvasRef.value, titles)

  // 更新动态缩放限制
  updateZoomLimits()
}

// 根据内容大小更新缩放限制
const updateZoomLimits = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  let container = canvas.parentElement
  if (container && container.classList.contains('canvas-wrapper')) {
    container = container.parentElement
  }

  const containerWidth = container.clientWidth - 40
  const containerHeight = container.clientHeight - 40
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height

  if (canvasWidth > 0 && canvasHeight > 0) {
    // 计算最小缩放级别，确保内容能完整显示在容器中
    const minScaleX = Math.max(0.05, containerWidth / canvasWidth)
    const minScaleY = Math.max(0.05, containerHeight / canvasHeight)
    const newMinZoom = Math.min(minScaleX, minScaleY, 0.5) // 最小不超过50%

    // 最大缩放级别根据内容复杂度调整
    const contentRatio = (canvasWidth * canvasHeight) / (containerWidth * containerHeight)
    const newMaxZoom = Math.max(2, Math.min(8, 4 / Math.sqrt(contentRatio)))

    // 如果当前缩放级别超出新的限制范围，自动调整
    if (zoomLevel.value < newMinZoom) {
      zoomLevel.value = newMinZoom
      panX.value = 0
      panY.value = 0
    } else if (zoomLevel.value > newMaxZoom) {
      zoomLevel.value = newMaxZoom
    }

    // 更新缩放限制
    minZoomLevel.value = newMinZoom
    maxZoomLevel.value = newMaxZoom

    // 如果内容相对于容器太小或太大，建议合适的缩放级别
    const idealScale = Math.min(minScaleX, minScaleY)
    if (idealScale < 0.8 && zoomLevel.value === 1) {
      // 内容比较大，建议缩小到适应屏幕
      zoomLevel.value = Math.max(idealScale, newMinZoom)
      panX.value = 0
      panY.value = 0
    }
  }
}

// 导出SVG
const exportSVG = () => {
  console.log('导出SVG功能被调用')
  if (!canvasRef.value) {
    console.log('Canvas引用不存在')
    return
  }

  const titles = parseMarkdownTitles(markdownText.value)
  const svgContent = exportToSVG(titles)

  // 生成包含时间戳的文件名
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const filename = `流程图-${year}${month}${day}${hour}${minute}${second}.svg`

  // 创建下载链接
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  console.log('SVG导出完成，文件名:', filename)
}

const handleCanvasClick = (event) => {
  // 可以添加点击交互功能
  console.log('Canvas clicked:', event)
}

const toggleTheme = () => {
  editorTheme.value = editorTheme.value === 'light' ? 'dark' : 'light'
}

// 缩放功能
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.25, maxZoomLevel.value)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.25, minZoomLevel.value)
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const fitToScreen = () => {
  if (!canvasRef.value) return

  // 找到canvas-container元素
  let container = canvasRef.value.parentElement // canvas-wrapper
  if (container && container.classList.contains('canvas-wrapper')) {
    container = container.parentElement // canvas-container
  }

  const containerWidth = container.clientWidth - 40
  const containerHeight = container.clientHeight - 40
  const canvasWidth = canvasRef.value.width
  const canvasHeight = canvasRef.value.height

  if (canvasWidth > 0 && canvasHeight > 0) {
    const scaleX = containerWidth / canvasWidth
    const scaleY = containerHeight / canvasHeight
    const fitScale = Math.min(scaleX, scaleY)

    // 适应屏幕时，在最小和最大缩放级别之间选择合适的值
    zoomLevel.value = Math.max(minZoomLevel.value, Math.min(fitScale, maxZoomLevel.value))
  }

  panX.value = 0
  panY.value = 0
}

// 鼠标滚轮缩放
const handleWheel = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(minZoomLevel.value, Math.min(maxZoomLevel.value, zoomLevel.value * delta))
  zoomLevel.value = newZoom
}

// 拖拽功能
const handleMouseDown = (event) => {
  if (event.button === 0) { // 左键
    isDragging.value = true
    lastMousePos.value = { x: event.clientX, y: event.clientY }
    event.target.closest('.canvas-container').classList.add('dragging')
    event.preventDefault()
  }
}

const handleMouseMove = (event) => {
  if (isDragging.value) {
    const deltaX = event.clientX - lastMousePos.value.x
    const deltaY = event.clientY - lastMousePos.value.y

    panX.value += deltaX / zoomLevel.value
    panY.value += deltaY / zoomLevel.value

    lastMousePos.value = { x: event.clientX, y: event.clientY }
    event.preventDefault()
  }
}

const handleMouseUp = (event) => {
  if (isDragging.value) {
    isDragging.value = false
    const container = event.target.closest('.canvas-container')
    if (container) {
      container.classList.remove('dragging')
    }
  }
}

// 监听markdown变化，实时更新预览
watch(markdownText, () => {
  updateFlowChart()
}, { immediate: true })

// 键盘快捷键支持
const handleKeydown = (event) => {
  // 只在预览面板有焦点时响应
  if (event.target.closest('.preview-panel')) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomIn()
    } else if (event.key === '-') {
      event.preventDefault()
      zoomOut()
    } else if (event.key === '0') {
      event.preventDefault()
      resetZoom()
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault()
      fitToScreen()
    }
  }
}

onMounted(() => {
  updateFlowChart()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.app.dark-theme {
  background: #1a1a1a;
}

.header {
  background: #fff;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.dark-theme .header {
  background: #2d2d2d;
  border-bottom-color: #404040;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.header-left h1 {
  color: #333;
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.dark-theme .header-left h1 {
  color: #fff;
}

.header-left p {
  color: #666;
  margin: 0;
  font-size: 14px;
  transition: color 0.3s ease;
}

.dark-theme .header-left p {
  color: #aaa;
}

.header-right {
  display: flex;
  align-items: center;
}

.actions {
  display: flex;
  gap: 12px;
}

.export-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.export-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.export-btn:active {
  transform: translateY(0);
}

.theme-btn {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.dark-theme .theme-btn {
  background: #404040;
  color: #fff;
  border-color: #555;
}

.dark-theme .theme-btn:hover {
  background: #505050;
  border-color: #666;
}

.main {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  outline: none;
}

.preview-panel:focus {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 2px rgba(0, 123, 255, 0.2);
}

.dark-theme .preview-panel {
  background: #2d2d2d;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.dark-theme .preview-panel:focus {
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(0, 123, 255, 0.3);
}

.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 58px;
  box-sizing: border-box;
}

.dark-theme .panel-header {
  background: #404040;
  border-bottom-color: #555;
}

.panel-header h3 {
  color: #333;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  transition: color 0.3s ease;
}

.dark-theme .panel-header h3 {
  color: #fff;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  min-width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa !important;
  border-color: #dee2e6 !important;
  transform: none !important;
}

.dark-theme .control-btn {
  background: #404040;
  color: #fff;
  border-color: #555;
}

.dark-theme .control-btn:hover:not(:disabled) {
  background: #505050;
  border-color: #666;
}

.dark-theme .control-btn:disabled {
  background: #2a2a2a !important;
  border-color: #404040 !important;
  color: #666 !important;
}

.zoom-level {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
  transition: color 0.3s ease;
}

.dark-theme .zoom-level {
  color: #aaa;
}

.markdown-editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 20px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: #fff;
}

.canvas-container {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: background-color 0.3s ease;
  position: relative;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas-container.dragging {
  cursor: grabbing;
}

.dark-theme .canvas-container {
  background: #1e1e1e;
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s ease;
  transform-origin: center center;
}

.preview-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: block;
}

.dark-theme .preview-canvas {
  border-color: #555;
  background: #1a1a1a;
}
</style>
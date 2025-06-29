<template>
  <div class="markdown-editor-container" :class="{ 'dark-theme': theme === 'dark' }">
    <div class="editor-header">
      <h3>Markdown 编辑器</h3>
      <div class="editor-stats">
        <span>{{ lineCount }} 行</span>
        <span>{{ wordCount }} 字</span>
      </div>
    </div>
    <div class="editor-wrapper">
      <div class="line-numbers" ref="lineNumbersRef">
        <div v-for="n in lineCount" :key="n" class="line-number">{{ n }}</div>
      </div>
      <textarea
        :value="modelValue"
        @input="handleInput"
        @scroll="syncScroll"
        class="markdown-textarea"
        placeholder="请输入 Markdown 标题，例如：
# 主标题
## 二级标题
### 三级标题
#### 四级标题

支持的功能：
- 自动语法高亮
- 行号显示
- 实时预览
- 快捷键支持 (Ctrl+S/Cmd+S 导出)"
        @keydown="handleKeydown"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'light' // 'light' | 'dark'
  }
})

const emit = defineEmits(['update:modelValue', 'export'])

const lineNumbersRef = ref(null)

// 统计信息
const lineCount = computed(() => {
  return Math.max(1, props.modelValue.split('\n').length)
})

const wordCount = computed(() => {
  return props.modelValue.replace(/\s+/g, '').length
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleKeydown = (event) => {
  // Ctrl+S 或 Cmd+S 导出 (支持 Windows/Linux 和 Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    console.log('快捷键导出被触发:', event.ctrlKey ? 'Ctrl+S' : 'Cmd+S')
    emit('export')
    return
  }

  // Tab 键插入缩进
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value

    // 插入两个空格作为缩进
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    emit('update:modelValue', newValue)

    // 恢复光标位置
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }
}

// 同步滚动行号
const syncScroll = (event) => {
  if (lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = event.target.scrollTop
  }
}
</script>

<style scoped>
.markdown-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.dark-theme {
  background: #1e1e1e;
}

.editor-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  height: 58px;
  box-sizing: border-box;
}

.dark-theme .editor-header {
  background: #404040;
  border-bottom-color: #555;
}

.editor-header h3 {
  color: #333;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  transition: color 0.3s ease;
}

.dark-theme .editor-header h3 {
  color: #fff;
}

.editor-stats {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 12px;
  transition: color 0.3s ease;
}

.dark-theme .editor-stats {
  color: #aaa;
}

.editor-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  overflow: hidden;
  /* padding-bottom: 20px; */
  box-sizing: border-box;
  /* background-color: #f8f9fa; */
}

.line-numbers {
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 20px 12px 20px 16px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  min-width: 50px;
  text-align: right;
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.dark-theme .line-numbers {
  background: #252525;
  border-right-color: #404040;
  color: #888;
}

.line-number {
  height: 22.4px; /* 与 textarea 行高匹配 */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  transition: all 0.2s ease;
  border-radius: 3px;
  margin: 1px 2px;
}

.line-number:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.dark-theme .line-number:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

/* 隐藏行号区域的滚动条 */
.line-numbers::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.markdown-textarea {
  flex: 1;
  border: none;
  outline: none;
  padding: 20px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: #fff;
  color: #333;
  overflow-y: auto;
  white-space: pre;
  word-wrap: break-word;
}

.dark-theme .markdown-textarea {
  background: #1e1e1e;
  color: #d4d4d4;
}

.markdown-textarea::placeholder {
  color: #999;
  line-height: 1.6;
}

.dark-theme .markdown-textarea::placeholder {
  color: #666;
}

.markdown-textarea::-webkit-scrollbar {
  width: 8px;
}

.markdown-textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dark-theme .markdown-textarea::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.markdown-textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dark-theme .markdown-textarea::-webkit-scrollbar-thumb {
  background: #555;
}

.markdown-textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dark-theme .markdown-textarea::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
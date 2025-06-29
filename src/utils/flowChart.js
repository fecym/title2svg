// 解析 Markdown 标题
export function parseMarkdownTitles(markdown) {
  const lines = markdown.split('\n').filter(line => line.trim())
  const titles = []

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      titles.push({ level, text })
    }
  })

  return buildTitleTree(titles)
}

// 构建标题树结构
function buildTitleTree(titles) {
  const root = { level: 0, text: '', children: [] }
  const stack = [root]

  titles.forEach(title => {
    // 找到合适的父节点
    while (stack.length > 1 && stack[stack.length - 1].level >= title.level) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    const node = { ...title, children: [] }
    parent.children.push(node)
    stack.push(node)
  })

  return root.children
}

// 在 Canvas 上渲染流程图
export function renderFlowChart(canvas, titleTree) {
  const ctx = canvas.getContext('2d')

  // 设置 Canvas 大小 - 需要找到实际的容器元素
  let container = canvas.parentElement
  // 如果有canvas-wrapper包装，需要再向上找一层
  if (container && container.classList.contains('canvas-wrapper')) {
    container = container.parentElement
  }

  canvas.width = container.clientWidth - 40
  canvas.height = container.clientHeight - 40

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!titleTree || titleTree.length === 0) {
    return
  }

  // 计算节点布局
  const layout = calculateLayout(titleTree, canvas.width, canvas.height)

  // 绘制连接线
  drawConnections(ctx, layout)

  // 绘制节点
  drawNodes(ctx, layout)
}

// 计算思维导图布局 - 子级相对父级居中分布
function calculateLayout(titleTree, canvasWidth, canvasHeight) {
  const layout = []

  if (!titleTree || titleTree.length === 0) return layout

  // 第一步：计算每个节点及其子树的总高度
  function calculateSubtreeHeight(node) {
    if (!node.children || node.children.length === 0) {
      return 50 // 单个节点的基础高度
    }

    let totalHeight = 0
    node.children.forEach(child => {
      totalHeight += calculateSubtreeHeight(child)
    })

    return Math.max(50, totalHeight) // 至少保持自身高度
  }

     // 第二步：分配位置，子级相对父级居中
   function layoutNode(node, level, startX, centerY, parentInfo = null) {
     const hasBox = level <= 1
     const textWidth = estimateTextWidth(node.text, level)
     // 增加边距：有框节点左右各15px，无框节点左右各8px
     const padding = hasBox ? 30 : 16  // 增加padding让节点更舒适
     const minWidth = level === 0 ? 80 : 50
     const nodeWidth = hasBox ? Math.max(minWidth, textWidth + padding) : textWidth + padding
     const nodeHeight = hasBox ? 33 : 28

    // 计算子树总高度
    const subtreeHeight = calculateSubtreeHeight(node)

    // 当前节点的Y位置（在子树的中心）
    const nodeY = centerY - nodeHeight / 2

    const nodeLayout = {
      ...node,
      x: startX,
      y: nodeY,
      width: nodeWidth,
      height: nodeHeight,
      level: level,
      hasBox,
      subtreeHeight,
      parentX: parentInfo?.x,
      parentY: parentInfo?.y,
      parentWidth: parentInfo?.width,
      parentHeight: parentInfo?.height
    }

    layout.push(nodeLayout)

    // 处理子节点
    if (node.children && node.children.length > 0) {
      const childSpacing = hasBox ? 95 : 118
      const childStartX = startX + nodeWidth + childSpacing

      // 计算子节点的起始Y位置（相对于当前节点居中）
      let totalChildrenHeight = 0
      node.children.forEach(child => {
        totalChildrenHeight += calculateSubtreeHeight(child)
      })

      let currentChildY = centerY - totalChildrenHeight / 2

      node.children.forEach(child => {
        const childSubtreeHeight = calculateSubtreeHeight(child)
        const childCenterY = currentChildY + childSubtreeHeight / 2

        layoutNode(child, level + 1, childStartX, childCenterY, {
          x: startX,
          y: nodeY,
          width: nodeWidth,
          height: nodeHeight
        })

        currentChildY += childSubtreeHeight
      })
    }
  }

  // 根节点放在左侧，垂直居中
  const rootNode = titleTree[0]
  const rootSubtreeHeight = calculateSubtreeHeight(rootNode)
  const rootCenterY = canvasHeight / 2

  layoutNode(rootNode, 0, 60, rootCenterY)

  // 计算内容的实际边界，用于居中
  if (layout.length > 0) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    layout.forEach(node => {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x + node.width)
      minY = Math.min(minY, node.y)
      maxY = Math.max(maxY, node.y + node.height)
    })

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // 计算居中偏移
    const paddingX = 40 // 左右边距
    const paddingY = 40 // 上下边距
    const availableWidth = canvasWidth - paddingX * 2
    const availableHeight = canvasHeight - paddingY * 2

    const offsetX = (availableWidth - contentWidth) / 2 + paddingX - minX
    const offsetY = (availableHeight - contentHeight) / 2 + paddingY - minY

    // 应用居中偏移到所有节点
    layout.forEach(node => {
      node.x += offsetX
      node.y += offsetY
      // 同时更新父节点位置信息
      if (node.parentX !== undefined) {
        node.parentX += offsetX
        node.parentY += offsetY
      }
    })
  }

  return layout
}

// 绘制思维导图连接线 - 使用弯曲路径，完全匹配参考SVG
function drawConnections(ctx, layout) {
  ctx.strokeStyle = '#746e6a'
  ctx.lineWidth = 1
  ctx.lineCap = 'round'

  layout.forEach(node => {
    if (node.parentX !== undefined) {
      // 绘制弯曲连接线，从父节点中心开始
      const startX = node.parentX + node.parentWidth
      const startY = node.parentY + (node.parentHeight || 40) / 2  // 从父节点中心开始
      const endX = node.x
      const endY = node.y + node.height / 2

      // 计算弯曲路径的中间控制点
      const spacing = node.hasBox ? 95 : 118 // 根据节点类型调整间距
      const midX = startX + spacing / 2
      const cornerRadius = 8

      ctx.beginPath()
      ctx.moveTo(startX, startY)

      // 水平线到转折点
      ctx.lineTo(midX - cornerRadius, startY)

      // 绘制圆角转折
      if (Math.abs(endY - startY) > cornerRadius) {
        if (endY > startY) {
          // 向下弯曲
          ctx.quadraticCurveTo(midX, startY, midX, startY + cornerRadius)
          ctx.lineTo(midX, endY - cornerRadius)
          ctx.quadraticCurveTo(midX, endY, midX + cornerRadius, endY)
        } else {
          // 向上弯曲
          ctx.quadraticCurveTo(midX, startY, midX, startY - cornerRadius)
          ctx.lineTo(midX, endY + cornerRadius)
          ctx.quadraticCurveTo(midX, endY, midX + cornerRadius, endY)
        }
      } else {
        // 如果高度差很小，直接连接
        ctx.lineTo(midX, startY)
        ctx.lineTo(midX + cornerRadius, endY)
      }

      // 最后连接到目标节点
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
  })
}

// 绘制思维导图节点 - 完全按照参考SVG的样式
function drawNodes(ctx, layout) {
  layout.forEach(node => {
    if (node.hasBox) {
      // 有边框的节点（根节点和一级节点）
      ctx.fillStyle = getNodeColor(node.level)
      ctx.strokeStyle = getNodeBorderColor(node.level)
      ctx.lineWidth = 1

      // 绘制圆角矩形
      drawRoundedRect(ctx, node.x, node.y, node.width, node.height, 6)
      ctx.fill()
      ctx.stroke()
    }

    // 绘制文本 - 不再截断，因为宽度已经正确计算
    const textColor = node.level === 0 ? '#4e4e4e' : (node.level === 1 ? '#595959' : '#606060')
    const fontSize = node.level === 0 ? 16 : (node.level === 1 ? 15 : 12)

    ctx.fillStyle = textColor
    ctx.font = `${fontSize}px Arial, 黑体, sans-serif`
    ctx.textAlign = node.hasBox ? 'center' : 'left'
    ctx.textBaseline = 'middle'

    const textX = node.hasBox ? node.x + node.width / 2 : node.x + 5
    const textY = node.y + node.height / 2

    // 直接绘制完整文本，不再截断
    ctx.fillText(node.text, textX, textY)
  })
}

// 创建一个隐藏的canvas用于精确测量文本宽度
let measureCanvas = null
let measureCtx = null

function getMeasureContext() {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
    measureCtx = measureCanvas.getContext('2d')
  }
  return measureCtx
}

// 精确计算文本宽度 - 使用Canvas measureText API
function estimateTextWidth(text, level) {
  const ctx = getMeasureContext()
  const fontSize = level === 0 ? 16 : (level === 1 ? 15 : 12)
  ctx.font = `${fontSize}px Arial, 黑体, sans-serif`
  return ctx.measureText(text).width
}

// 绘制圆角矩形 - 使用参考SVG中的6px圆角
function drawRoundedRect(ctx, x, y, width, height, radius = 6) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// 获取节点颜色 - 按照参考SVG的样式
function getNodeColor(level) {
  // 统一使用白色背景，完全匹配参考图
  return '#ffffff'
}

// 获取节点边框颜色 - 使用参考SVG中的边框色
function getNodeBorderColor(level) {
  // 根节点使用稍深的边框色
  if (level === 0) {
    return '#b2afad'
  }
  // 其他节点使用参考SVG中的淡灰色边框
  return '#d1cecd'
}

// 文本截断
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }

  let truncated = text
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
  }

  return truncated + '...'
}

// 导出为 SVG
export function exportToSVG(titleTree) {
  if (!titleTree || titleTree.length === 0) {
    return '<svg></svg>'
  }

  // 计算布局（使用固定尺寸）
  const svgWidth = 1200
  const svgHeight = 800
  const layout = calculateLayout(titleTree, svgWidth, svgHeight)

  // 计算实际需要的SVG尺寸
  const maxX = Math.max(...layout.map(node => node.x + node.width)) + 40
  const maxY = Math.max(...layout.map(node => node.y + node.height)) + 40

    let svg = `<svg width="${maxX}" height="${maxY}" xmlns="http://www.w3.org/2000/svg">
  <g>`

             // 添加弯曲连接线 - 从父节点中心开始
  layout.forEach(node => {
    if (node.parentX !== undefined) {
      const startX = node.parentX + node.parentWidth
      const startY = node.parentY + (node.parentHeight || 40) / 2  // 从父节点中心开始
      const endX = node.x
      const endY = node.y + node.height / 2
      const spacing = node.hasBox ? 95 : 118
      const midX = startX + spacing / 2
      const cornerRadius = 8

      let pathData = `M ${startX} ${startY} L ${midX - cornerRadius} ${startY}`

      if (Math.abs(endY - startY) > cornerRadius) {
        if (endY > startY) {
          pathData += ` A ${cornerRadius} ${cornerRadius} 0 0 1 ${midX} ${startY + cornerRadius}`
          pathData += ` L ${midX} ${endY - cornerRadius}`
          pathData += ` A ${cornerRadius} ${cornerRadius} 0 0 0 ${midX + cornerRadius} ${endY}`
        } else {
          pathData += ` A ${cornerRadius} ${cornerRadius} 0 0 0 ${midX} ${startY - cornerRadius}`
          pathData += ` L ${midX} ${endY + cornerRadius}`
          pathData += ` A ${cornerRadius} ${cornerRadius} 0 0 1 ${midX + cornerRadius} ${endY}`
        }
      } else {
        pathData += ` L ${midX} ${startY} L ${midX + cornerRadius} ${endY}`
      }

      pathData += ` L ${endX} ${endY}`

      svg += `
    <path d="${pathData}" stroke="#746e6a" fill="none" stroke-width="1"/>`
    }
  })

             // 添加节点 - 完全按照参考SVG的方式
  layout.forEach(node => {
    const textColor = node.level === 0 ? '#4e4e4e' : (node.level === 1 ? '#595959' : '#606060')
    const fontSize = node.level === 0 ? '16' : (node.level === 1 ? '15' : '12')

    if (node.hasBox) {
      // 有边框的节点
      const fillColor = getNodeColor(node.level)
      const strokeColor = getNodeBorderColor(node.level)

      svg += `
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"
          rx="6" ry="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
    <text x="${node.x + node.width / 2}" y="${node.y + node.height / 2}"
          font-family="Arial, 黑体, sans-serif" font-size="${fontSize}px"
          text-anchor="middle" dominant-baseline="middle" fill="${textColor}">
      ${escapeXml(node.text)}
    </text>`
    } else {
      // 无边框的节点（只显示文本）
      svg += `
    <text x="${node.x + 5}" y="${node.y + node.height / 2}"
          font-family="Arial, 黑体, sans-serif" font-size="${fontSize}px"
          text-anchor="start" dominant-baseline="middle" fill="${textColor}">
      ${escapeXml(node.text)}
    </text>`
    }
  })

  svg += `
  </g>
</svg>`

  return svg
}

// XML 转义
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
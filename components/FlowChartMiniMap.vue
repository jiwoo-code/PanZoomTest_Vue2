<template>
  <div class="minimap" :class="positionClass">
    <!-- 미니맵 위치 선택 -->
    <div class="minimap-controls">
      <select v-model="currentPosition" @change="handlePositionChange">
        <option value="top-left">좌측 상단</option>
        <option value="top-right">우측 상단</option>
        <option value="bottom-left">좌측 하단</option>
        <option value="bottom-right">우측 하단</option>
      </select>
    </div>
    
    <!-- 미니맵 캔버스 -->
    <div class="minimap-content" @click="handleMinimapClick">
      <canvas 
        ref="minimapCanvas" 
        :width="canvasWidth" 
        :height="canvasHeight"
        class="minimap-canvas"
      ></canvas>
      
      <!-- 뷰포트 표시 영역 -->
      <div 
        class="viewport-indicator"
        :style="viewportIndicatorStyle"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowChartMiniMap',
  props: {
    nodes: {
      type: Array,
      required: true
    },
    links: {
      type: Array,
      required: true
    },
    viewport: {
      type: Object,
      required: true
    },
    position: {
      type: String,
      default: 'top-left'
    }
  },
  data() {
    return {
      currentPosition: 'top-left',
      canvasWidth: 200,
      canvasHeight: 150,
      scale: 0.1, // 미니맵 스케일
      padding: 10
    }
  },
  computed: {
    // 미니맵 위치별 CSS 클래스
    positionClass() {
      return `minimap-${this.currentPosition}`
    },
    
    // 뷰포트 표시기 스타일 (미니맵의 사각 테두리 크기와 위치 계산 코드)
    viewportIndicatorStyle() {
      if (this.nodes.length === 0) return {}
      
      // 전체 노드 영역 계산
      const bounds = this.calculateBounds()
      
      // 미니맵에서의 뷰포트 위치 계산
      const minimapViewport = this.calculateMinimapViewport(bounds)
      
      return {
        left: `${minimapViewport.x}px`,
        top: `${minimapViewport.y}px`,
        width: `${minimapViewport.width}px`,
        height: `${minimapViewport.height}px`
      }
    }
  },
  watch: {
    nodes: {
      handler() {
        this.drawMinimap()
      },
      deep: true
    },
    links: {
      handler() {
        this.drawMinimap()
      },
      deep: true
    },
    viewport: {
      handler() {
        this.drawMinimap()
      },
      deep: true
    },
    position: {
      handler(newPosition) {
        this.currentPosition = newPosition
      },
      immediate: true
    }
  },
  mounted() {
    this.drawMinimap()
  },
  methods: {
    // 미니맵 그리기
    drawMinimap() {
      const canvas = this.$refs.minimapCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      
      if (this.nodes.length === 0) return
      
      // 전체 영역 계산
      const bounds = this.calculateBounds()
      
      // 스케일 계산 (미니맵에 맞게 조정)
      const scaleX = (this.canvasWidth - this.padding * 2) / (bounds.maxX - bounds.minX)
      const scaleY = (this.canvasHeight - this.padding * 2) / (bounds.maxY - bounds.minY)
      this.scale = Math.min(scaleX, scaleY, 0.2) // 최대 20% 스케일
      
      // 노드 그리기
      this.drawNodes(ctx, bounds)
      
      // 링크 그리기
      this.drawLinks(ctx, bounds)
    },
    
    // 전체 영역 계산
    calculateBounds() {
      if (this.nodes.length === 0) {
        return { minX: 0, minY: 0, maxX: 100, maxY: 100 }
      }
      
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      
      this.nodes.forEach(node => {
        minX = Math.min(minX, node.x)
        minY = Math.min(minY, node.y)
        maxX = Math.max(maxX, node.x + node.width)
        maxY = Math.max(maxY, node.y + node.height)
      })
      
      return { minX, minY, maxX, maxY }
    },
    
    // 노드 그리기
    drawNodes(ctx, bounds) {
      this.nodes.forEach(node => {
        const x = (node.x - bounds.minX) * this.scale + this.padding
        const y = (node.y - bounds.minY) * this.scale + this.padding
        const width = node.width * this.scale
        const height = node.height * this.scale
        
        // 노드 타입별 색상
        let color = '#4CAF50' // 기본값
        if (node.type === 'compounded_loss') {
          color = '#FF9800'
        } else if (node.type === 'leaf') {
          color = '#2196F3'
        }
        
        ctx.fillStyle = color
        ctx.fillRect(x, y, width, height)
        
        // 테두리
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, width, height)
      })
    },
    
    // 링크 그리기 (가로/세로 직선만 사용, 라운드 처리)
    drawLinks(ctx, bounds) {
      this.links.forEach(link => {
        const fromNode = this.nodes.find(n => n.id === link.from)
        const toNode = this.nodes.find(n => n.id === link.to)
        
        if (!fromNode || !toNode) return
        
        const fromX = (fromNode.x + fromNode.width / 2 - bounds.minX) * this.scale + this.padding
        const fromY = (fromNode.y + fromNode.height / 2 - bounds.minY) * this.scale + this.padding
        const toX = (toNode.x + toNode.width / 2 - bounds.minX) * this.scale + this.padding
        const toY = (toNode.y + toNode.height / 2 - bounds.minY) * this.scale + this.padding
        
        // 링크 색상
        ctx.strokeStyle = link.condition === 'true' ? '#d32f2f' : '#1976d2'
        ctx.lineWidth = 1
        
        // 가로/세로 직선으로만 연결 (대각선 방지, 라운드 처리)
        const dx = Math.abs(toX - fromX)
        const dy = Math.abs(toY - fromY)
        const radius = 2 // 미니맵용 작은 라운드 반지름 (3에서 2로 줄임)
        
        // 라운드 처리 임계값 (거리가 이 값보다 작으면 라운드 처리 안함)
        const roundThreshold = 6 // 미니맵용 작은 임계값
        
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        
        if (dx > dy) {
          // 수평 거리가 더 큰 경우: 수평 -> 수직 -> 수평
          const midX = (fromX + toX) / 2
          
          // 수직 거리가 임계값보다 작으면 라운드 처리 안함
          if (dy < roundThreshold) {
            ctx.lineTo(toX, toY)
          } else {
            // 시작점과 끝점의 실제 방향에 따라 라운드 처리 방향 결정
            if (fromX < toX) {
              // 왼쪽에서 오른쪽으로 (ㄱ 모양)
              if (fromY < toY) {
                // 위에서 아래로
                ctx.lineTo(midX - radius, fromY)
                ctx.quadraticCurveTo(midX, fromY, midX, fromY + radius)
                ctx.lineTo(midX, toY - radius)
                ctx.quadraticCurveTo(midX, toY, midX + radius, toY)
                ctx.lineTo(toX, toY)
              } else {
                // 아래에서 위로
                ctx.lineTo(midX - radius, fromY)
                ctx.quadraticCurveTo(midX, fromY, midX, fromY - radius)
                ctx.lineTo(midX, toY + radius)
                ctx.quadraticCurveTo(midX, toY, midX + radius, toY)
                ctx.lineTo(toX, toY)
              }
            } else {
              // 오른쪽에서 왼쪽으로 (거울 ㄱ 모양)
              if (fromY < toY) {
                // 위에서 아래로
                ctx.lineTo(midX + radius, fromY)
                ctx.quadraticCurveTo(midX, fromY, midX, fromY + radius)
                ctx.lineTo(midX, toY - radius)
                ctx.quadraticCurveTo(midX, toY, midX - radius, toY)
                ctx.lineTo(toX, toY)
              } else {
                // 아래에서 위로
                ctx.lineTo(midX + radius, fromY)
                ctx.quadraticCurveTo(midX, fromY, midX, fromY - radius)
                ctx.lineTo(midX, toY + radius)
                ctx.quadraticCurveTo(midX, toY, midX - radius, toY)
                ctx.lineTo(toX, toY)
              }
            }
          }
        } else {
          // 수직 거리가 더 큰 경우: 수직 -> 수평 -> 수직
          const midY = (fromY + toY) / 2
          
          // 수평 거리가 임계값보다 작으면 라운드 처리 안함
          if (dx < roundThreshold) {
            ctx.lineTo(toX, toY)
          } else {
            // 시작점과 끝점의 실제 방향에 따라 라운드 처리 방향 결정
            if (fromY < toY) {
              // 위에서 아래로 (ㄴ 모양)
              if (fromX < toX) {
                // 왼쪽에서 오른쪽으로
                ctx.lineTo(fromX, midY - radius)
                ctx.quadraticCurveTo(fromX, midY, fromX + radius, midY)
                ctx.lineTo(toX - radius, midY)
                ctx.quadraticCurveTo(toX, midY, toX, midY + radius)
                ctx.lineTo(toX, toY)
              } else {
                // 오른쪽에서 왼쪽으로
                ctx.lineTo(fromX, midY - radius)
                ctx.quadraticCurveTo(fromX, midY, fromX - radius, midY)
                ctx.lineTo(toX + radius, midY)
                ctx.quadraticCurveTo(toX, midY, toX, midY + radius)
                ctx.lineTo(toX, toY)
              }
            } else {
              // 아래에서 위로 (거울 ㄴ 모양)
              if (fromX < toX) {
                // 왼쪽에서 오른쪽으로
                ctx.lineTo(fromX, midY + radius)
                ctx.quadraticCurveTo(fromX, midY, fromX + radius, midY)
                ctx.lineTo(toX - radius, midY)
                ctx.quadraticCurveTo(toX, midY, toX, midY - radius)
                ctx.lineTo(toX, toY)
              } else {
                // 오른쪽에서 왼쪽으로
                ctx.lineTo(fromX, midY + radius)
                ctx.quadraticCurveTo(fromX, midY, fromX - radius, midY)
                ctx.lineTo(toX + radius, midY)
                ctx.quadraticCurveTo(toX, midY, toX, midY - radius)
                ctx.lineTo(toX, toY)
              }
            }
          }
        }
        
        ctx.stroke()
      })
    },
    
         // 미니맵에서의 뷰포트 계산 (미니맵의 사각 테두리 크기와 위치 계산 코드)
    calculateMinimapViewport(bounds) {
      // 실제 뷰포트 영역을 미니맵 좌표로 변환
      // 뷰포트의 실제 크기 계산 (미니맵 캔버스 크기 / 줌 스케일)
      const viewportWidth = this.canvasWidth / this.viewport.scale
      const viewportHeight = this.canvasHeight / this.viewport.scale
      
      // 뷰포트의 중심점 계산 (panzoom 상태 고려)
      // viewport.x, viewport.y는 실제 화면에서의 오프셋이므로 미니맵 좌표로 변환
      const viewportCenterX = -this.viewport.x / this.viewport.scale
      const viewportCenterY = -this.viewport.y / this.viewport.scale
      
      // 미니맵에서의 뷰포트 위치 계산
      // 뷰포트의 왼쪽 상단 모서리 위치 계산
      const minimapX = (viewportCenterX - viewportWidth / 2 - bounds.minX) * this.scale + this.padding
      const minimapY = (viewportCenterY - viewportHeight / 2 - bounds.minY) * this.scale + this.padding
      const minimapWidth = viewportWidth * this.scale
      const minimapHeight = viewportHeight * this.scale
      
      // 뷰포트가 미니맵 영역을 벗어나지 않도록 제한
      const maxX = this.canvasWidth - this.padding
      const maxY = this.canvasHeight - this.padding
      const minSize = 10 // 최소 뷰포트 크기
      
      let finalX = Math.max(0, Math.min(maxX - minSize, minimapX))
      let finalY = Math.max(0, Math.min(maxY - minSize, minimapY))
      let finalWidth = Math.max(minSize, Math.min(maxX - finalX, minimapWidth))
      let finalHeight = Math.max(minSize, Math.min(maxY - finalY, minimapHeight))
      
      return {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight
      }
    },
    
    // 미니맵 클릭 처리 (미니맵 클릭 시 클릭한 부분이 사용자에게 보여지는 화면으로 보이도록 하는 좌표 계산 코드)
    handleMinimapClick(event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top
      
      if (this.nodes.length === 0) return
      
      // 전체 영역 계산
      const bounds = this.calculateBounds()
      
      // 클릭한 미니맵 좌표를 실제 좌표로 변환
      const actualX = (clickX - this.padding) / this.scale + bounds.minX
      const actualY = (clickY - this.padding) / this.scale + bounds.minY
      
      // 뷰포트 중심을 클릭한 위치로 이동
      // 실제 화면 크기를 고려하여 정확한 위치 계산
      const viewportWidth = this.canvasWidth / this.viewport.scale
      const viewportHeight = this.canvasHeight / this.viewport.scale
      
      // 클릭한 위치가 뷰포트의 중심이 되도록 계산
      // 실제 화면 크기 대신 미니맵 캔버스 크기를 기준으로 계산
      const targetViewportX = actualX - viewportWidth / 2
      const targetViewportY = actualY - viewportHeight / 2
      
      // 부모 컴포넌트에 클릭 이벤트 전달
      this.$emit('click', targetViewportX, targetViewportY)
    },
    
    // 위치 변경 처리
    handlePositionChange() {
      this.$emit('positionChange', this.currentPosition)
    }
  }
}
</script>

<style scoped>
.minimap {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 미니맵 위치별 스타일 */
.minimap-top-left {
  top: 10px;
  left: 10px;
}

.minimap-top-right {
  top: 10px;
  right: 10px;
}

.minimap-bottom-left {
  bottom: 10px;
  left: 10px;
}

.minimap-bottom-right {
  bottom: 10px;
  right: 10px;
}

.minimap-controls {
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.minimap-controls select {
  width: 100%;
  padding: 2px;
  font-size: 10px;
  border: 1px solid #ddd;
  border-radius: 2px;
}

.minimap-content {
  position: relative;
  cursor: crosshair;
}

.minimap-canvas {
  display: block;
  background: #f8f9fa;
}

.viewport-indicator {
  position: absolute;
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: none;
}
</style> 
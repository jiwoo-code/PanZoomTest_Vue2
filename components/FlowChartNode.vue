<template>
  <div 
    ref="nodeElement"
    class="flowchart-node"
    :class="nodeTypeClass"
    :style="nodeStyle"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <div class="node-content">
      <div class="node-name">{{ node.name }}</div>
      <div class="node-type">{{ nodeTypeLabel }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowChartNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      originalX: 0,
      originalY: 0,
      dragStartTime: 0,
      hasMoved: false
    }
  },
  computed: {
    // 노드 스타일
    nodeStyle() {
      return {
        left: `${this.node.x}px`,
        top: `${this.node.y}px`,
        width: `${this.node.width}px`,
        height: `${this.node.height}px`
      }
    },
    
    // 노드 타입별 CSS 클래스
    nodeTypeClass() {
      return {
        'node-branch': this.node.type === 'branch',
        'node-compounded-loss': this.node.type === 'compounded_loss',
        'node-leaf': this.node.type === 'leaf'
      }
    },
    
    // 노드 타입 라벨
    nodeTypeLabel() {
      const labels = {
        branch: '분기',
        compounded_loss: '복합 손실',
        leaf: '리프'
      }
      return labels[this.node.type] || this.node.type
    }
  },
  methods: {
    // 마우스 다운 이벤트 (드래그 시작)
    handleMouseDown(event) {
      // 우클릭 방지
      if (event.button !== 0) return
      
      event.stopPropagation()
      
      this.isDragging = false // 초기에는 드래그가 아님
      this.dragStartX = event.clientX
      this.dragStartY = event.clientY
      this.originalX = this.node.x
      this.originalY = this.node.y
      this.dragStartTime = Date.now() // 드래그 시작 시간 기록
      this.hasMoved = false // 드래그 시작 시 이동 여부 초기화
      
      // 드래그 시작 이벤트 발생
      this.$emit('dragStart', this.node.id, event)
      
      // 전역 마우스 이벤트 리스너 추가
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
    },
    
    // 마우스 이동 이벤트 (드래그 중)
    handleMouseMove(event) {
      const currentTime = Date.now()
      const timeDiff = currentTime - this.dragStartTime
      
      // 드래그 시작 후 500ms 이내에 5px 이상 이동하면 드래그로 간주
      if (timeDiff < 500 && (Math.abs(event.clientX - this.dragStartX) > 5 || Math.abs(event.clientY - this.dragStartY) > 5)) {
        this.isDragging = true
        this.hasMoved = true
      }
      
      if (this.isDragging) {
        // 드래그 이동 이벤트 발생 (이벤트 객체 전달하여 부모에서 줌 상태 고려)
        this.$emit('dragMove', this.node.id, event)
      }
    },
    
    // 마우스 업 이벤트 (드래그 종료)
    handleMouseUp(event) {
      // 전역 이벤트 리스너 제거 (드래그 여부와 관계없이 항상 정리)
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
      
      // 드래그 중이었다면 드래그 종료 이벤트 발생
      if (this.isDragging) {
        this.$emit('dragEnd', this.node.id)
      }
      
      // 드래그 상태 초기화
      this.isDragging = false
    },
    
    // 클릭 이벤트 (드래그가 아닌 클릭일 때만)
    handleClick(event) {
      // 드래그 중이 아니고, 실제로 이동하지 않았을 때만 클릭 이벤트 발생
      if (!this.isDragging && !this.hasMoved) {
        this.$emit('click', this.node)
      }
    }
  }
}
</script>

<style scoped>
.flowchart-node {
  position: absolute;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.flowchart-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.flowchart-node:active {
  cursor: grabbing;
}

/* 노드 타입별 배경색 */
.node-branch {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-color: #2E7D32;
}

.node-compounded-loss {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  border-color: #E65100;
}

.node-leaf {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-color: #0D47A1;
}

.node-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px;
  color: white;
  text-align: center;
}

.node-name {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 2px;
  line-height: 1.2;
}

.node-type {
  font-size: 10px;
  opacity: 0.9;
  line-height: 1.1;
}
</style> 
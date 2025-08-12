<template>
  <div class="flowchart">
    <div 
      ref="container" 
      class="flowchart-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    >
      <!-- 컨테이너 영역 (노드들을 감싸는 영역) -->
      <div 
        ref="nodeContainer" 
        class="node-container"
        :style="containerStyle"
      >
        <!-- 노드들 -->
        <FlowChartNode
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          @click="handleNodeClick"
          @dragStart="handleNodeDragStart"
          @dragMove="handleNodeDragMove"
          @dragEnd="handleNodeDragEnd"
        />
        
        <!-- 링크들 -->
        <FlowChartLink
          v-for="link in links"
          :key="link.id"
          :link="link"
          :nodes="nodes"
        />
      </div>
    </div>
  </div>
</template>

<script>
import FlowChartNode from './FlowChartNode.vue'
import FlowChartLink from './FlowChartLink.vue'

export default {
  name: 'FlowChart',
  components: {
    FlowChartNode,
    FlowChartLink
  },
  props: {
    nodes: {
      type: Array,
      required: true
    },
    links: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      // panzoom 상태
      panzoom: {
        x: 0,
        y: 0,
        scale: 1
      },
      
      // 마우스 상태
      mouse: {
        isDown: false,
        isDragging: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0
      },
      
      // 노드 드래그 상태
      nodeDrag: {
        isDragging: false,
        nodeId: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
      },
      
      // 컨테이너 크기
      containerBounds: {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      }
    }
  },
  computed: {
    // 컨테이너 스타일 (노드의 이동에 따른 크기 변경)
    containerStyle() {
      return {
        transform: `translate(${this.panzoom.x}px, ${this.panzoom.y}px) scale(${this.panzoom.scale})`,
        width: `${this.containerBounds.maxX - this.containerBounds.minX + 200}px`,
        height: `${this.containerBounds.maxY - this.containerBounds.minY + 200}px`,
        left: `${-this.containerBounds.minX + 100}px`,
        top: `${-this.containerBounds.minY + 100}px`
      }
    }
  },
  watch: {
    // 노드 변경 시 컨테이너 크기 재계산
    nodes: {
      handler() {
        this.updateContainerBounds()
      },
      deep: true
    }
  },
  mounted() {
    this.updateContainerBounds()
    this.$emit('panzoomChange', this.panzoom)
  },
  methods: {
    // 컨테이너 크기 업데이트 (노드의 이동에 따른 컨테이너 크기 변경하는 코드)
    updateContainerBounds() {
      if (this.nodes.length === 0) {
        this.containerBounds = { minX: 0, minY: 0, maxX: 200, maxY: 200 }
        return
      }
      
      // 모든 노드의 위치를 고려하여 컨테이너의 최소/최대 경계 계산
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      
      this.nodes.forEach(node => {
        const nodeLeft = node.x
        const nodeTop = node.y
        const nodeRight = node.x + node.width
        const nodeBottom = node.y + node.height
        
        minX = Math.min(minX, nodeLeft)
        minY = Math.min(minY, nodeTop)
        maxX = Math.max(maxX, nodeRight)
        maxY = Math.max(maxY, nodeBottom)
      })
      
      // 여백 추가 (더 큰 여백으로 안전장치)
      const padding = 100
      this.containerBounds = {
        minX: minX - padding,
        minY: minY - padding,
        maxX: maxX + padding,
        maxY: maxY + padding
      }
      
      // 노드들이 컨테이너 밖으로 나가지 않도록 강제 조정
      this.nodes.forEach(node => {
        const nodeRight = node.x + node.width
        const nodeBottom = node.y + node.height
        
        if (node.x < this.containerBounds.minX) {
          node.x = this.containerBounds.minX
        }
        if (node.y < this.containerBounds.minY) {
          node.y = this.containerBounds.minY
        }
        if (nodeRight > this.containerBounds.maxX) {
          node.x = this.containerBounds.maxX - node.width
        }
        if (nodeBottom > this.containerBounds.maxY) {
          node.y = this.containerBounds.maxY - node.height
        }
      })
    },
    
    // 마우스 이벤트 핸들러들
    handleMouseDown(event) {
      // 노드 드래그 중이면 컨테이너 이동 방지
      if (this.nodeDrag.isDragging) return
      
      // 노드 외부 클릭 시 상세 정보 닫기
      if (event.target === this.$refs.container || event.target === this.$refs.nodeContainer) {
        this.$emit('closeDetailPanel')
      }
      
      this.mouse.isDown = true
      this.mouse.isDragging = false
      this.mouse.startX = event.clientX
      this.mouse.startY = event.clientY
      this.mouse.lastX = event.clientX
      this.mouse.lastY = event.clientY
    },
    
    handleMouseMove(event) {
      if (!this.mouse.isDown) return
      
      const deltaX = event.clientX - this.mouse.lastX
      const deltaY = event.clientY - this.mouse.lastY
      
      // 드래그 시작 판정 (5px 이상 이동)
      if (!this.mouse.isDragging && 
          (Math.abs(event.clientX - this.mouse.startX) > 5 || 
           Math.abs(event.clientY - this.mouse.startY) > 5)) {
        this.mouse.isDragging = true
      }
      
      // 컨테이너 이동 (노드 드래그 중이 아닐 때만)
      if (this.mouse.isDragging && !this.nodeDrag.isDragging) {
        this.panzoom.x += deltaX
        this.panzoom.y += deltaY
        this.$emit('panzoomChange', this.panzoom)
      }
      
      this.mouse.lastX = event.clientX
      this.mouse.lastY = event.clientY
    },
    
    handleMouseUp() {
      this.mouse.isDown = false
      this.mouse.isDragging = false
    },
    
    // 휠 이벤트 (줌 인/아웃)
    handleWheel(event) {
      event.preventDefault()
      
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(3, this.panzoom.scale * delta))
      
      // 마우스 포인트를 기준으로 줌 (수정된 계산)
      const rect = this.$refs.container.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // 현재 마우스 위치의 월드 좌표 계산
      const worldMouseX = (mouseX - this.panzoom.x) / this.panzoom.scale
      const worldMouseY = (mouseY - this.panzoom.y) / this.panzoom.scale
      
      // 새로운 스케일에서 마우스 위치를 유지하도록 panzoom 조정
      this.panzoom.x = mouseX - worldMouseX * newScale
      this.panzoom.y = mouseY - worldMouseY * newScale
      this.panzoom.scale = newScale
      
      this.$emit('panzoomChange', this.panzoom)
    },
    
    // 노드 클릭
    handleNodeClick(node) {
      this.$emit('nodeClick', node)
    },
    
    // 노드 드래그 시작
    handleNodeDragStart(nodeId, event) {
      this.nodeDrag.isDragging = true
      this.nodeDrag.nodeId = nodeId
      this.nodeDrag.startX = event.clientX
      this.nodeDrag.startY = event.clientY
      
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        // 줌 상태를 고려한 오프셋 계산
        const rect = this.$refs.container.getBoundingClientRect()
        const worldStartX = (event.clientX - rect.left - this.panzoom.x) / this.panzoom.scale
        const worldStartY = (event.clientY - rect.top - this.panzoom.y) / this.panzoom.scale
        
        this.nodeDrag.offsetX = worldStartX - node.x
        this.nodeDrag.offsetY = worldStartY - node.y
      }
    },
    
    // 노드 드래그 이동
    handleNodeDragMove(nodeId, event) {
      if (!this.nodeDrag.isDragging || this.nodeDrag.nodeId !== nodeId) return
      
      // 줌 상태를 고려한 새로운 위치 계산
      const rect = this.$refs.container.getBoundingClientRect()
      const worldX = (event.clientX - rect.left - this.panzoom.x) / this.panzoom.scale
      const worldY = (event.clientY - rect.top - this.panzoom.y) / this.panzoom.scale
      
      let newX = worldX - this.nodeDrag.offsetX
      let newY = worldY - this.nodeDrag.offsetY
      
      // 노드가 컨테이너 경계를 벗어나지 않도록 제한
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        // 컨테이너 경계 계산
        const containerLeft = this.containerBounds.minX
        const containerTop = this.containerBounds.minY
        const containerRight = this.containerBounds.maxX - node.width
        const containerBottom = this.containerBounds.maxY - node.height
        
        // 위치 제한 (절대 벗어나지 않도록)
        newX = Math.max(containerLeft, Math.min(containerRight, newX))
        newY = Math.max(containerTop, Math.min(containerBottom, newY))
        
        // 추가 안전장치: 노드가 컨테이너 밖으로 나가지 않도록
        if (newX < containerLeft) newX = containerLeft
        if (newY < containerTop) newY = containerTop
        if (newX > containerRight) newX = containerRight
        if (newY > containerBottom) newY = containerBottom
        
        // 컨테이너 크기 동적 조정 (노드가 경계에 도달했을 때)
        let boundsChanged = false
        if (newX <= containerLeft + 10) {
          this.containerBounds.minX = newX - 50
          boundsChanged = true
        }
        if (newY <= containerTop + 10) {
          this.containerBounds.minY = newY - 50
          boundsChanged = true
        }
        if (newX + node.width >= containerRight - 10) {
          this.containerBounds.maxX = newX + node.width + 50
          boundsChanged = true
        }
        if (newY + node.height >= containerBottom - 10) {
          this.containerBounds.maxY = newY + node.height + 50
          boundsChanged = true
        }
        
        // 경계가 변경되었으면 다시 위치 제한
        if (boundsChanged) {
          const newContainerLeft = this.containerBounds.minX
          const newContainerTop = this.containerBounds.minY
          const newContainerRight = this.containerBounds.maxX - node.width
          const newContainerBottom = this.containerBounds.maxY - node.height
          
          newX = Math.max(newContainerLeft, Math.min(newContainerRight, newX))
          newY = Math.max(newContainerTop, Math.min(newContainerBottom, newY))
        }
      }
      
      this.$emit('nodeMove', nodeId, newX, newY)
      
      // 컨테이너 크기 업데이트
      this.updateContainerBounds()
    },
    
    // 노드 드래그 종료
    handleNodeDragEnd(nodeId) {
      this.nodeDrag.isDragging = false
      this.nodeDrag.nodeId = null
    },
    
    // 특정 위치로 이동 (미니맵 클릭 시 사용)
    moveToPosition(x, y) {
      // x, y는 실제 월드 좌표이므로 직접 panzoom 값으로 설정
      this.panzoom.x = -x * this.panzoom.scale
      this.panzoom.y = -y * this.panzoom.scale
      
      this.$emit('panzoomChange', this.panzoom)
    }
  }
}
</script>

<style scoped>
.flowchart {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.flowchart-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
}

.flowchart-container:active {
  cursor: grabbing;
}

.node-container {
  position: absolute;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  transform-origin: 0 0;
}
</style> 
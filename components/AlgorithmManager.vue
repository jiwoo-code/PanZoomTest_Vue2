<template>
  <div class="algorithm-manager">
    <!-- 최상단 검색 영역 -->
    <FlowChartSearchBar 
      :searchConditions="searchConditions"
      @search="handleSearch"
    />
    
    <!-- 플로우차트 영역 -->
    <div class="flowchart-container">
      <FlowChart 
        ref="flowchart"
        :nodes="nodes"
        :links="links"
        @nodeClick="handleNodeClick"
        @nodeMove="handleNodeMove"
        @panzoomChange="handlePanzoomChange"
        @closeDetailPanel="closeDetailPanel"
      />
      
      <!-- 미니맵 -->
      <FlowChartMiniMap 
        :nodes="nodes"
        :links="links"
        :viewport="viewport"
        :position="miniMapPosition"
        @positionChange="handleMiniMapPositionChange"
        @click="handleMiniMapClick"
      />
      
      <!-- 노드 상세 정보 -->
      <div 
        v-if="selectedNode"
        class="node-detail-panel"
        :class="{ 'slide-in': showDetailPanel }"
      >
        <div class="detail-header">
          <h3>노드 상세 정보</h3>
          <button @click="closeDetailPanel" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <strong>ID:</strong> {{ selectedNode.id }}
          </div>
          <div class="detail-item">
            <strong>이름:</strong> {{ selectedNode.name }}
          </div>
          <div class="detail-item">
            <strong>타입:</strong> {{ selectedNode.type }}
          </div>
          <div class="detail-item">
            <strong>상위 노드:</strong>
            <ul>
              <li v-for="parent in selectedNode.parents" :key="parent.id">
                {{ parent.name }}
              </li>
            </ul>
          </div>
          <div class="detail-item">
            <strong>하위 노드:</strong>
            <ul>
              <li v-for="child in selectedNode.children" :key="child.id">
                {{ child.name }} ({{ child.condition }})
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FlowChartSearchBar from './FlowChartSearchBar.vue'
import FlowChart from './FlowChart.vue'
import FlowChartMiniMap from './FlowChartMiniMap.vue'

export default {
  name: 'AlgorithmManager',
  components: {
    FlowChartSearchBar,
    FlowChart,
    FlowChartMiniMap
  },
  data() {
    return {
      // 검색 조건들
      searchConditions: [
        { id: 1, name: '알고리즘 A' },
        { id: 2, name: '알고리즘 B' },
        { id: 3, name: '알고리즘 C' },
        { id: 4, name: '알고리즘 D' },
        { id: 5, name: '알고리즘 E' }
      ],
      
      // 현재 선택된 검색 조건
      currentCondition: 1,
      
      // 노드 데이터
      nodes: [],
      
      // 링크 데이터
      links: [],
      
      // 선택된 노드
      selectedNode: null,
      
      // 상세 패널 표시 여부
      showDetailPanel: false,
      
      // 뷰포트 정보 (panzoom 상태)
      viewport: {
        x: 0,
        y: 0,
        scale: 1
      },
      
      // 미니맵 위치 (기본값: 좌측 상단)
      miniMapPosition: 'top-left'
    }
  },
  mounted() {
    // 초기 데이터 로드
    this.loadData(this.currentCondition)
  },
  methods: {
    // 검색 처리
    handleSearch(conditionId) {
      this.currentCondition = conditionId
      this.loadData(conditionId)
      this.closeDetailPanel()
    },
    
    // 데이터 로드
    loadData(conditionId) {
      // 조건에 따른 샘플 데이터 생성
      this.generateSampleData(conditionId)
    },
    
    // 샘플 데이터 생성 (최소 20개 노드, 겹치지 않게 정렬)
    generateSampleData(conditionId) {
      const nodeCount = 20 + (conditionId * 5) // 조건에 따라 노드 수 증가
      this.nodes = []
      this.links = []
      
      // 격자 기반 노드 배치 (겹치지 않게)
      const gridCols = Math.ceil(Math.sqrt(nodeCount))
      const gridRows = Math.ceil(nodeCount / gridCols)
      const nodeWidth = 120
      const nodeHeight = 60
      const spacing = 50 // 노드 간 간격
      
      // 노드 생성
      for (let i = 1; i <= nodeCount; i++) {
        let type = 'branch'
        if (i > nodeCount * 0.7) {
          type = 'leaf'
        } else if (i > nodeCount * 0.4) {
          type = 'compounded_loss'
        }
        
        // 격자 위치 계산
        const row = Math.floor((i - 1) / gridCols)
        const col = (i - 1) % gridCols
        
        // 실제 위치 계산 (약간의 랜덤성 추가)
        const baseX = col * (nodeWidth + spacing) + 100
        const baseY = row * (nodeHeight + spacing) + 100
        const randomOffset = 20 // 작은 랜덤 오프셋
        
        this.nodes.push({
          id: i,
          name: `노드 ${i}`,
          type: type,
          x: baseX + (Math.random() - 0.5) * randomOffset,
          y: baseY + (Math.random() - 0.5) * randomOffset,
          width: nodeWidth,
          height: nodeHeight,
          parents: [],
          children: []
        })
      }
      
      // 링크 생성 (순환 방지)
      this.generateLinks()
    },
    
    // 링크 생성 (순환 방지)
    generateLinks() {
      const visited = new Set()
      const stack = new Set()
      
      // 각 노드에 대해 적절한 하위 노드 연결
      this.nodes.forEach(node => {
        if (node.type === 'leaf') return // leaf는 하위 노드 없음
        
        const availableChildren = this.nodes.filter(n => 
          n.id !== node.id && 
          !visited.has(n.id) && 
          !this.wouldCreateCycle(node.id, n.id)
        )
        
        if (availableChildren.length > 0) {
          // branch 타입은 true/false 두 개 연결
          if (node.type === 'branch' && availableChildren.length >= 2) {
            const child1 = availableChildren[0]
            const child2 = availableChildren[1]
            
            this.links.push({
              id: `${node.id}-${child1.id}`,
              from: node.id,
              to: child1.id,
              condition: 'true'
            })
            
            this.links.push({
              id: `${node.id}-${child2.id}`,
              from: node.id,
              to: child2.id,
              condition: 'false'
            })
            
            // 부모-자식 관계 설정
            node.children.push({ id: child1.id, name: child1.name, condition: 'true' })
            node.children.push({ id: child2.id, name: child2.name, condition: 'false' })
            child1.parents.push({ id: node.id, name: node.name })
            child2.parents.push({ id: node.id, name: node.name })
            
            visited.add(child1.id)
            visited.add(child2.id)
          } 
          // compounded_loss 타입은 true 하나만 연결
          else if (node.type === 'compounded_loss' && availableChildren.length >= 1) {
            const child = availableChildren[0]
            
            this.links.push({
              id: `${node.id}-${child.id}`,
              from: node.id,
              to: child.id,
              condition: 'true'
            })
            
            node.children.push({ id: child.id, name: child.name, condition: 'true' })
            child.parents.push({ id: node.id, name: node.name })
            
            visited.add(child.id)
          }
        }
      })
    },
    
    // 순환 생성 여부 확인
    wouldCreateCycle(fromId, toId) {
      const visited = new Set()
      const stack = new Set()
      
      const dfs = (nodeId) => {
        if (stack.has(nodeId)) return true // 순환 발견
        if (visited.has(nodeId)) return false
        
        visited.add(nodeId)
        stack.add(nodeId)
        
        const outgoingLinks = this.links.filter(link => link.from === nodeId)
        for (const link of outgoingLinks) {
          if (dfs(link.to)) return true
        }
        
        stack.delete(nodeId)
        return false
      }
      
      // 임시로 링크 추가
      this.links.push({ from: fromId, to: toId })
      const hasCycle = dfs(toId)
      this.links.pop() // 임시 링크 제거
      
      return hasCycle
    },
    
    // 노드 클릭 처리
    handleNodeClick(node) {
      this.selectedNode = node
      this.showDetailPanel = true
    },
    
    // 노드 이동 처리
    handleNodeMove(nodeId, newX, newY) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        node.x = newX
        node.y = newY
      }
      this.closeDetailPanel()
    },
    
    // panzoom 변경 처리
    handlePanzoomChange(viewport) {
      this.viewport = viewport
      this.closeDetailPanel()
    },
    
    // 상세 패널 닫기
    closeDetailPanel() {
      this.showDetailPanel = false
      this.selectedNode = null
    },
    
    // 미니맵 위치 변경
    handleMiniMapPositionChange(position) {
      this.miniMapPosition = position
    },
    
    // 미니맵 클릭 처리
    handleMiniMapClick(x, y) {
      // FlowChart 컴포넌트에 뷰포트 변경 이벤트 발생
      this.$refs.flowchart?.moveToPosition(x, y)
    }
  }
}
</script>

<style scoped>
.algorithm-manager {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.flowchart-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.node-detail-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
}

.node-detail-panel.slide-in {
  right: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.detail-content {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item ul {
  margin: 5px 0;
  padding-left: 20px;
}

.detail-item li {
  margin-bottom: 5px;
}
</style> 
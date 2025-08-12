<template>
  <svg class="flowchart-links" :style="svgStyle">
    <defs>
      <!-- 화살표 마커 정의 -->
      <marker
        id="arrowhead-true"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#d32f2f" />
      </marker>
      <marker
        id="arrowhead-false"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
      </marker>
    </defs>
    
    <!-- 링크 경로 -->
    <path
      v-for="link in processedLinks"
      :key="link.id"
      :d="link.path"
      :stroke="link.color"
      stroke-width="2"
      fill="none"
      :marker-end="link.markerEnd"
      class="link-path"
    />
  </svg>
</template>

<script>
export default {
  name: 'FlowChartLink',
  props: {
    link: {
      type: Object,
      required: true
    },
    nodes: {
      type: Array,
      required: true
    }
  },
  computed: {
    // SVG 스타일
    svgStyle() {
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '1'
      }
    },
    
    // 처리된 링크들 (경로 계산 포함)
    processedLinks() {
      const fromNode = this.nodes.find(n => n.id === this.link.from)
      const toNode = this.nodes.find(n => n.id === this.link.to)
      
      if (!fromNode || !toNode) return []
      
      // 링크 색상과 마커 설정
      const isTrue = this.link.condition === 'true'
      const color = isTrue ? '#d32f2f' : '#1976d2' // true: 붉은색, false: 파란색
      const markerEnd = isTrue ? 'url(#arrowhead-true)' : 'url(#arrowhead-false)'
      
      // 경로 계산
      const path = this.calculatePath(fromNode, toNode)
      
      return [{
        id: this.link.id,
        path: path,
        color: color,
        markerEnd: markerEnd
      }]
    }
  },
  methods: {
    // 링크 경로 계산 (우회 제거, 직선 경로만 사용)
    calculatePath(fromNode, toNode) {
      // 시작점과 끝점 계산 (노드의 가장 가까운 면의 중앙)
      const startPoint = this.getConnectionPoint(fromNode, toNode, 'start')
      const endPoint = this.getConnectionPoint(toNode, fromNode, 'end')
      
      // 직선 경로만 사용 (우회 제거)
      const path = this.calculateDirectPath(startPoint, endPoint)
      
      return path
    },
    
    // 연결점 계산 (노드의 가장 가까운 면의 중앙)
    getConnectionPoint(node, targetNode, type) {
      const nodeCenterX = node.x + node.width / 2
      const nodeCenterY = node.y + node.height / 2
      const targetCenterX = targetNode.x + targetNode.width / 2
      const targetCenterY = targetNode.y + targetNode.height / 2
      
      // 방향 벡터 계산
      const dx = targetCenterX - nodeCenterX
      const dy = targetCenterY - nodeCenterY
      
      // 노드의 각 면의 중앙점 계산
      const topCenter = { x: nodeCenterX, y: node.y }
      const bottomCenter = { x: nodeCenterX, y: node.y + node.height }
      const leftCenter = { x: node.x, y: nodeCenterY }
      const rightCenter = { x: node.x + node.width, y: nodeCenterY }
      
      // 각 면의 중앙점과 타겟 노드까지의 거리 계산
      const distances = [
        { point: topCenter, distance: Math.sqrt(Math.pow(targetCenterX - topCenter.x, 2) + Math.pow(targetCenterY - topCenter.y, 2)) },
        { point: bottomCenter, distance: Math.sqrt(Math.pow(targetCenterX - bottomCenter.x, 2) + Math.pow(targetCenterY - bottomCenter.y, 2)) },
        { point: leftCenter, distance: Math.sqrt(Math.pow(targetCenterX - leftCenter.x, 2) + Math.pow(targetCenterY - leftCenter.y, 2)) },
        { point: rightCenter, distance: Math.sqrt(Math.pow(targetCenterX - rightCenter.x, 2) + Math.pow(targetCenterY - rightCenter.y, 2)) }
      ]
      
      // 가장 가까운 면의 중앙점 선택
      distances.sort((a, b) => a.distance - b.distance)
      return distances[0].point
    },
    
    // 유효한 교차점인지 확인
    isValidIntersection(point, node) {
      return point.x >= node.x && 
             point.x <= node.x + node.width && 
             point.y >= node.y && 
             point.y <= node.y + node.height
    },
    
    // 직선 경로 계산 (가로/세로 직선만 사용, 라운드 처리)
    calculateDirectPath(start, end) {
      const radius = 4 // 라운드 처리 반지름 (8에서 4로 줄임)
      
      // 가로/세로 직선으로만 연결 (대각선 방지)
      const dx = Math.abs(end.x - start.x)
      const dy = Math.abs(end.y - start.y)
      
      // 라운드 처리 임계값 (거리가 이 값보다 작으면 라운드 처리 안함)
      const roundThreshold = 20
      
      if (dx > dy) {
        // 수평 거리가 더 큰 경우: 수평 -> 수직 -> 수평
        const midX = (start.x + end.x) / 2
        
        // 수직 거리가 임계값보다 작으면 라운드 처리 안함
        if (dy < roundThreshold) {
          return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        }
        
        // 시작점과 끝점의 실제 방향에 따라 라운드 처리 방향 결정
        if (start.x < end.x) {
          // 왼쪽에서 오른쪽으로 (ㄱ 모양)
          if (start.y < end.y) {
            // 위에서 아래로
            return `M ${start.x} ${start.y} 
                    L ${midX - radius} ${start.y} 
                    Q ${midX} ${start.y} ${midX} ${start.y + radius}
                    L ${midX} ${end.y - radius} 
                    Q ${midX} ${end.y} ${midX + radius} ${end.y}
                    L ${end.x} ${end.y}`
          } else {
            // 아래에서 위로
            return `M ${start.x} ${start.y} 
                    L ${midX - radius} ${start.y} 
                    Q ${midX} ${start.y} ${midX} ${start.y - radius}
                    L ${midX} ${end.y + radius} 
                    Q ${midX} ${end.y} ${midX + radius} ${end.y}
                    L ${end.x} ${end.y}`
          }
        } else {
          // 오른쪽에서 왼쪽으로 (거울 ㄱ 모양)
          if (start.y < end.y) {
            // 위에서 아래로
            return `M ${start.x} ${start.y} 
                    L ${midX + radius} ${start.y} 
                    Q ${midX} ${start.y} ${midX} ${start.y + radius}
                    L ${midX} ${end.y - radius} 
                    Q ${midX} ${end.y} ${midX - radius} ${end.y}
                    L ${end.x} ${end.y}`
          } else {
            // 아래에서 위로
            return `M ${start.x} ${start.y} 
                    L ${midX + radius} ${start.y} 
                    Q ${midX} ${start.y} ${midX} ${start.y - radius}
                    L ${midX} ${end.y + radius} 
                    Q ${midX} ${end.y} ${midX - radius} ${end.y}
                    L ${end.x} ${end.y}`
          }
        }
      } else {
        // 수직 거리가 더 큰 경우: 수직 -> 수평 -> 수직
        const midY = (start.y + end.y) / 2
        
        // 수평 거리가 임계값보다 작으면 라운드 처리 안함
        if (dx < roundThreshold) {
          return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        }
        
        // 시작점과 끝점의 실제 방향에 따라 라운드 처리 방향 결정
        if (start.y < end.y) {
          // 위에서 아래로 (ㄴ 모양)
          if (start.x < end.x) {
            // 왼쪽에서 오른쪽으로
            return `M ${start.x} ${start.y} 
                    L ${start.x} ${midY - radius} 
                    Q ${start.x} ${midY} ${start.x + radius} ${midY}
                    L ${end.x - radius} ${midY} 
                    Q ${end.x} ${midY} ${end.x} ${midY + radius}
                    L ${end.x} ${end.y}`
          } else {
            // 오른쪽에서 왼쪽으로
            return `M ${start.x} ${start.y} 
                    L ${start.x} ${midY - radius} 
                    Q ${start.x} ${midY} ${start.x - radius} ${midY}
                    L ${end.x + radius} ${midY} 
                    Q ${end.x} ${midY} ${end.x} ${midY + radius}
                    L ${end.x} ${end.y}`
          }
        } else {
          // 아래에서 위로 (거울 ㄴ 모양)
          if (start.x < end.x) {
            // 왼쪽에서 오른쪽으로
            return `M ${start.x} ${start.y} 
                    L ${start.x} ${midY + radius} 
                    Q ${start.x} ${midY} ${start.x + radius} ${midY}
                    L ${end.x - radius} ${midY} 
                    Q ${end.x} ${midY} ${end.x} ${midY - radius}
                    L ${end.x} ${end.y}`
          } else {
            // 오른쪽에서 왼쪽으로
            return `M ${start.x} ${start.y} 
                    L ${start.x} ${midY + radius} 
                    Q ${start.x} ${midY} ${start.x - radius} ${midY}
                    L ${end.x + radius} ${midY} 
                    Q ${end.x} ${midY} ${end.x} ${midY - radius}
                    L ${end.x} ${end.y}`
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.flowchart-links {
  pointer-events: none;
}

.link-path {
  transition: stroke-width 0.2s ease;
}

.link-path:hover {
  stroke-width: 3;
}
</style> 
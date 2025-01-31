<template>
  <div class="h-screen w-screen bg-gray-200 flex flex-col flex-no-wrap overflow-none">
    <div class="bg-white p-6 shadow z-10">
      <div class="text-lg">Vue Flowy</div>
    </div>
    <div class="flex-grow overflow-hidden flex flex-row flex-no-wrap">
      <div class="z-40 flex-shrink pl-6 pt-6 bg-white border-r border-grey-400">

        <div class="side z-50">
          <div class="text-lg font-bold mb-4">Blocks</div>
          <div>
            <flowy-new-block
              v-for="(block, index) in blocks"
              :key="index"
              @drag-start="onDragStartNewBlock"
              @drag-stop="onDragStopNewBlock"
            >
              <template v-slot:preview="{}">
                <demo-block
                  :title="block.preview.title"
                  :description="block.preview.description"
                  :icon="block.preview.icon"
                />
              </template>
              <template v-slot:node="{}">
                <demo-node
                  :title="block.node.title"
                  :description="block.node.description"
                  :icon="block.node.icon"
                  :custom-prop="block.node.canBeDragged"
                />
              </template>
            </flowy-new-block>
          </div>
        </div>
      </div>

      <div class="flex-grow overflow-auto">
        <!-- 확대/축소 및 패닝 대상 요소 -->
        <div ref="panzoomElement" class="panzoom-element h-full w-full">
          <flowy
            ref="flowyElement"
            class="h-full w-full p-6"
            :nodes="nodes"
            @drag-start="onDragStart"
            @add="add"
            @move="move"
            @remove="remove"
            :beforeAdd="beforeAdd"
            :beforeMove="beforeMove"
            :onEnterDragFn="onEnter"
          ></flowy>
        </div>
        <!-- 미니맵 -->
        <div class="minimap">
          <div ref="minimapViewport" class="minimap-viewport"></div>
          <div ref="minimapContent" class="minimap-content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-unused-components */
/* eslint-disable no-unused-vars */
import panzoom from 'panzoom';
import Vue from 'vue';
import find from 'lodash/find';
import findIndex from 'lodash/findIndex';
import generateId from './lib/generateId';
import nodes from './demo_data/simple';
import blocks from './demo_data/sampleBlocks';


export default {
  name: 'app',
  components: {

  },
  data: () => ({
    holder: [],
    dragging: false,
    blocks,
    nodes,
    newDraggingBlock: null,
  }),
  methods: {
    onDragStartNewBlock(event) {
      console.log('onDragStartNewBlock', event);
      this.newDraggingBlock = event;
    },
    onDragStopNewBlock(event) {
      console.log('onDragStopNewBlock', event);
      this.newDraggingBlock = null;
    },
    onDropBlock(_event) {

    },
    beforeAdd() {
      console.log('before add');
      return true;
    },
    afterAdd() {

    },
    onEnterDrop(event) {
      console.log('entered drop');
      return true;
    },
    beforeMove({ to, from }) {
      console.log(to, from);
      if (from && from.id === '1') {
        return false;
      }
      return true;
    },
    onEnter() {

    },
    addNode(_event) {
      const id = this.generateId();
      this.nodes.push({
        ..._event.node,
        id,
      });
    },
    remove(event) {
      const nodeIndex = findIndex(this.nodes, { id: event.node.id });
      this.nodes.splice(nodeIndex, 1);
    },
    move(event) {
      console.log('move', event);
      const { dragged, to } = event;
      dragged.parentId = to.id;
    },
    add(event) {
      const id = generateId();
      this.nodes.push({
        id,
        ...event.node,
      });
    },
    onDragStart(event) {
      console.log('onDragStart', event);
      this.dragging = true;
    },
  },
  watch: {

  },
  mounted() {
    const { panzoomElement, minimapViewport, minimapContent } = this.$refs;
    const minimap = this.$el.querySelector('.minimap');

    // panzoom 초기화
    const instance = panzoom(panzoomElement, {
      inertia: false, // 관성 효과 비활성화
      bounds: true, // 요소가 부모 영역을 벗어나지 않도록 제한
    });

    // 미니맵에 panzoomElement 내용 복제 및 축소
    const clonePanzoomContent = () => {
      // 기존 미니맵 내용 삭제
      minimapContent.innerHTML = '';

      // panzoomElement 내용 복제
      const clone = panzoomElement.cloneNode(true);
      clone.style.width = `${panzoomElement.clientWidth}px`;
      clone.style.height = `${panzoomElement.clientHeight}px`;

      // 미니맵에 추가
      minimapContent.appendChild(clone);

      // 미니맵 내용 크기 조정
      const scaleX = minimap.clientWidth / panzoomElement.clientWidth;
      const scaleY = minimap.clientHeight / panzoomElement.clientHeight;
      const scale = Math.min(scaleX, scaleY);

      minimapContent.style.transform = `scale(${scale})`;
    };

    // requestAnimationFrame을 사용한 미니맵 뷰포트 업데이트
    let isUpdating = false; // 업데이트 중인지 여부를 확인하는 플래그
    const updateMinimapViewport = () => {
      if (isUpdating) return; // 이미 업데이트 중이면 무시
      isUpdating = true;

      requestAnimationFrame(() => {
        const { x, y, scale } = instance.getTransform(); // 구조 분해 할당 사용
        const viewportX = -x / scale;
        const viewportY = -y / scale;

        minimapViewport.style.width = `${panzoomElement.clientWidth / scale}px`;
        minimapViewport.style.height = `${panzoomElement.clientHeight / scale}px`;
        minimapViewport.style.left = `${viewportX}px`;
        minimapViewport.style.top = `${viewportY}px`;

        isUpdating = false; // 업데이트 완료
      });
    };

    // panzoom 이벤트 리스너 추가
    instance.on('transform', updateMinimapViewport);

    // 미니맵 클릭 이벤트 처리
    minimap.addEventListener('click', (e) => {
      const rect = minimap.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const { scale } = instance.getTransform(); // 구조 분해 할당 사용
      const targetX = -(clickX * scale - panzoomElement.clientWidth / 2);
      const targetY = -(clickY * scale - panzoomElement.clientHeight / 2);

      instance.moveTo(targetX, targetY);
    });

    // 초기 미니맵 내용 복제 및 뷰포트 업데이트
    clonePanzoomContent();
    updateMinimapViewport();
  },
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Open+Sans:300,400,600&display=swap");
@import url("https://fonts.googleapis.com/css?family=Roboto:100&display=swap");
html,
body {
  font-family: "Open Sans", sans-serif;
  font-size: 15px;
  position: relative;
  margin: 0;
  padding: 0;
  height: 100%;
  color: #333;
  letter-spacing: 1px;
  background: #f5f5f5;
  font-weight: 300;
}

.flowy {
  background-image: url("/flowy-vue/demo_assets/tile.png");
  background-repeat: repeat;
  background-size: 30px 30px;
  background-color: #fbfbfb;
}

div {
  position: relative;
  z-index: 0;
}

.no-wrap {
  white-space: nowrap;
}

h1 {
  margin: 0;
}

.dropzone {
  width: 100px;
  height: 100px;
  border: 1px dotted black;
}

.flowy-drag-handle {
  cursor: grab;
}

a {
  text-decoration: none;
  color: #333;
}

.page {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.page:nth-child(2n) {
  background: #f0f0f0;
}
.page.main {
  z-index: 1;
  min-height: 700px;
}

.side {
  width: 340px;
  height: 100%;
}

.container {
  height: 100%;
  position: relative;
  width: auto;
  margin: auto;
}

.description {
  text-align: center;
}

.example-block {
  width: 320px;
}

.flowy-block.draggable-mirror {
  opacity: 0.6;
}

.panzoom-element {
  overflow: hidden;
  position: relative;
}

/* 미니맵 컨테이너: 화면 왼쪽 아래에 고정 */
.minimap {
  position: relative;
  left: 20px; /* 왼쪽 여백 */
  bottom: 20px; /* 아래쪽 여백 */
  width: 200px; /* 미니맵 너비 */
  height: 150px; /* 미니맵 높이 */
  margin-top: -150px;
  border: 1px solid #ccc;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8); /* 배경색 추가 */
  z-index: 1000; /* 다른 요소 위에 표시 */
}

/* 미니맵 뷰포트 */
.minimap-viewport {
  position: absolute;
  border: 2px solid red;
  background: rgba(255, 0, 0, 0.2);
  pointer-events: none; /* 미니맵 뷰포트는 클릭 이벤트를 방해하지 않음 */
}

/* 미니맵 내용 */
.minimap-content {
  position: absolute;
  transform-origin: top left;
  pointer-events: none; /* 미니맵 내용은 클릭 이벤트를 방해하지 않음 */
}

</style>

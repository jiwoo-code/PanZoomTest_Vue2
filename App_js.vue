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
        <div class="bg-white p-2 shadow z-10 flex justify-between items-center">
          <div class="text-lg">Vue Flowy</div>
          <div>
            <label for="panToggle" class="mr-2">Pan Mode</label>
            <input type="checkbox" id="panToggle" v-model="isPanMode" />
          </div>
        </div>
        <div
          ref="flowchartContainer"
          class="flowchart-container"
          @wheel="handleWheel"
          @mousedown="startPan"
          @mousemove="handlePan"
          @mouseup="endPan"
          @mouseleave="endPan"
          >
          <div class="flowy-control">
            <flowy
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-unused-components */
/* eslint-disable no-unused-vars */
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
    scale: 1, // 초기 스케일 값
    isPanning: false, // Pan 활성화 상태
    startX: 0, // Pan 시작 X 좌표
    startY: 0, // Pan 시작 Y 좌표
    translateX: 0, // X 축 이동 거리
    translateY: 0, // Y 축 이동 거리
    isPanMode: false, // Pan 모드 활성화 여부
    mouseX: 0, // 마우스 커서 X 좌표
    mouseY: 0, // 마우스 커서 Y 좌표
  }),
  methods: {
    // 마우스 휠 이벤트 핸들러 (줌인/줌아웃)
    handleWheel(event) {
      // 이벤트 전파 방지
      event.preventDefault();

      // 마우스 커서 위치 저장
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;

      // 휠 델타 값에 따라 스케일 조정
      const delta = event.deltaY;
      const scaleFactor = 0.1; // 줌 속도 조절

      // 현재 스케일 저장
      const prevScale = this.scale;

      if (delta < 0) {
        // 줌인
        this.scale += scaleFactor;
      } else {
        // 줌아웃
        this.scale -= scaleFactor;
      }

      // 스케일 범위 제한 (예: 0.5 ~ 2)
      this.scale = Math.min(Math.max(0.5, this.scale), 2);

      // 확대/축소 시 translate 값 조정
      const rect = this.$refs.flowchartContainer.getBoundingClientRect();
      const offsetX = (this.mouseX - rect.left - this.translateX) / prevScale;
      const offsetY = (this.mouseY - rect.top - this.translateY) / prevScale;

      this.translateX = this.mouseX - rect.left - offsetX * this.scale;
      this.translateY = this.mouseY - rect.top - offsetY * this.scale;
      // 플로우 차트 컨테이너에 스케일 및 이동 적용
      this.applyTransform();
    },
    // Pan 시작 (마우스 다운 이벤트)
    startPan(event) {
      if (!this.isPanMode) {
        return;
      }
      this.isPanning = true;
      this.startX = event.clientX - this.translateX;
      this.startY = event.clientY - this.translateY;
    },

    // Pan 처리 (마우스 이동 이벤트)
    handlePan(event) {
      if (!this.isPanMode) {
        return;
      }
      if (this.isPanning) {
        this.translateX = event.clientX - this.startX;
        this.translateY = event.clientY - this.startY;
        this.applyTransform();
      }
    },

    // Pan 종료 (마우스 업 또는 마우스 떠남 이벤트)
    endPan() {
      if (!this.isPanMode) {
        return;
      }
      this.isPanning = false;
    },

    // 스케일 및 이동 적용
    applyTransform() {
      const container = this.$refs.flowchartContainer;
      container.style.transform = `
        scale(${this.scale})
        translate(${this.translateX}px, ${this.translateY}px)
      `;
    },
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

.flowchart-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  // transform-origin: top left; /* 줌인/줌아웃 기준점 설정 */
  cursor: grab; /* 배경에서만 grab 커서 */
}

.flowchart-container:active {
  cursor: grabbing; /* 드래그 중 커서 변경 */
}

// .flowy-control {
//   cursor: default; /* FlowyVue 컨트롤 내부는 기본 커서 */
// }
</style>

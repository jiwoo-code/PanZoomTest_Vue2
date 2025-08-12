<template>
  <div class="main-container">
    <AlgorithmManager />
  </div>
</template>

<script>
import AlgorithmManager from './AlgorithmManager.vue'

export default {
  name: 'Main',
  components: {
    AlgorithmManager
  }
}
</script>

<style scoped>
.main-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style> 
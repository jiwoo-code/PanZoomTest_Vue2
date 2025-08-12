<template>
  <div class="search-bar">
    <div class="search-container">
      <select 
        v-model="selectedCondition" 
        class="search-select"
        @change="handleSearch"
      >
        <option value="">조건을 선택하세요</option>
        <option 
          v-for="condition in searchConditions" 
          :key="condition.id" 
          :value="condition.id"
        >
          {{ condition.name }}
        </option>
      </select>
      
      <button 
        @click="handleSearch" 
        class="search-button"
        :disabled="!selectedCondition"
      >
        조회
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowChartSearchBar',
  props: {
    searchConditions: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedCondition: ''
    }
  },
  methods: {
    handleSearch() {
      if (this.selectedCondition) {
        this.$emit('search', parseInt(this.selectedCondition))
      }
    }
  }
}
</script>

<style scoped>
.search-bar {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.search-select {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.search-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
  background: #0056b3;
}

.search-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style> 
<script setup>
import Grid from '@/components/grid.vue';
import { ref } from 'vue';

const gridRef = ref(null);

function handleScramble() {
    if (gridRef.value) {
        gridRef.value.scramble();
    }
}

function handleIdentify() {
    if (gridRef.value) {
        gridRef.value.identify();
    }
}
</script>

<template>
  <div class="app">
    <div class="buttons">
      <button @click="handleScramble">Scramble</button>
      <button @click="handleIdentify">Identify</button>
    </div>
    <Grid ref="gridRef"></Grid>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.buttons {
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4ECDC4;
  color: white;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45B7D1;
}

button:active {
  background-color: #3BA0BD;
}
</style>
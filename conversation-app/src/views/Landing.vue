<script setup>
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <div class="app-view">
    <NavBar></NavBar>
  </div>
</template>

<style scoped>
.app-view {
  min-height: 97vh;
  width: 99vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: #090c10;
  position: fixed;
  overflow: hidden;
  color: #000;
  display: flex;
}

.app-view::before {
  content: '';
  position: fixed;
  inset: 70px 0 70px;
  background-image: url(/midnightClub.png);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 35.6%;
  pointer-events: none;
  z-index: 0;
}

.app-view > * {
  position: relative;
  z-index: 1;
}
</style>

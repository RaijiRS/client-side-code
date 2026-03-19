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
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: #efeded;
  position: relative;
  overflow: hidden;
  color: #000;
}

.app-view::before {
  content: '';
  position: fixed;
  inset: 70px 0 70px;
  background-image: url(/midnightClub.jpg);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 35.6%;
  opacity: 0.5;
  filter: grayscale(100%);
  pointer-events: none;
  z-index: 0;
}

.app-view > * {
  position: relative;
  z-index: 1;
}
</style>

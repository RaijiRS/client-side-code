<script setup>

const props = defineProps({
  segment: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div
    class="cell"
    :style="{
      backgroundImage: `url(${segment.src})`,
      ...segment.style
    }"
  /> 
</template>

<style scoped>
.cell {
  width: 100%;
  height: 100%;
  outline: 1px solid rgba(0,0,0,0.4);
  background-repeat: no-repeat;
}
</style>

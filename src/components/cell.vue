<script setup>
defineProps({
    row: String,
    col: String,
    image: String,
    backgroundPositionX: String,
    backgroundPositionY: String
})
</script>

<template>
    <div 
        class="cell" 
        :style="{
            gridRow: row, 
            gridColumn: col,
            backgroundImage: image ? `url(${image})` : 'none',
            backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
            backgroundSize: '350%'
        }"
    >
    </div>
</template>

<style scoped>
.cell {
    background-color: rgba(0, 150, 255, 0.3);
    outline: 1px solid rgba(0, 0, 0, 0.4);
    overflow: hidden;
    background-repeat: no-repeat;
}
</style>
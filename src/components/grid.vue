<script setup>
import Cell from './cell.vue'
import { ref } from 'vue'

// Generate the cell layout (positions stay fixed)
function generateLayout() {
    const validLayouts = [
        // Layout 1:
        [
            { row: '1 / 8', col: '1 / 3' },  // 2x7 = 14
            { row: '1 / 5', col: '3 / 8' },  // 5x4 = 20
            { row: '5 / 6', col: '3 / 8' },  // 5x1 = 5
            { row: '6 / 7', col: '3 / 7' },  // 4x1 = 4
            { row: '7 / 8', col: '3 / 6' },  // 3x1 = 3
            { row: '7 / 8', col: '6 / 8' },  // 2x1 = 2
            { row: '6 / 7', col: '7 / 8' }   // 1x1 = 1
        ],
        // Layout 2:
        [
            { row: '1 / 8', col: '1 / 5' },  // 4x7 = 28
            { row: '1 / 4', col: '5 / 7' },  // 2x3 = 6
            { row: '1 / 6', col: '7 / 8' },  // 1x5 = 5
            { row: '4 / 8', col: '5 / 6' },  // 1x4 = 4
            { row: '4 / 7', col: '6 / 7' },  // 1x3 = 3
            { row: '6 / 8', col: '7 / 8' },  // 1x2 = 2
            { row: '7 / 8', col: '6 / 7' }   // 1x1 = 1
        ]
    ];
    
    const layout = validLayouts[Math.floor(Math.random() * validLayouts.length)];
    return layout;
}

// Calculate the center position of each cell in the 7x7 grid
function calculateCellPositions(cells) {
    return cells.map(cell => {
        const [rowStart, rowEnd] = cell.row.split(' / ').map(Number);
        const [colStart, colEnd] = cell.col.split(' / ').map(Number);
        
        const centerRow = (rowStart + rowEnd - 1) / 2;
        const centerCol = (colStart + colEnd - 1) / 2;
        
        const rowPercent = ((centerRow - 1) / 7) * 100;
        const colPercent = ((centerCol - 1) / 7) * 100;
        
        return {
            backgroundPositionX: `${colPercent}%`,
            backgroundPositionY: `${rowPercent}%`
        };
    });
}

// Source image
const sourceImage = './public/newGhost.jpg';

const cells = ref(generateLayout());
const correctPositions = calculateCellPositions(cells.value);
const correctOrder = [0, 1, 2, 3, 4, 5, 6];
const positionOrder = ref([...correctOrder]);
const isIdentified = ref(false);

function scramble() {
    isIdentified.value = false;
    
    // Shuffle the position order
    const shuffled = [...positionOrder.value];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    positionOrder.value = shuffled;
}

function identify() {
    isIdentified.value = true;
}

// Start scrambled
scramble();

defineExpose({ scramble, identify });
</script>

<template>
    <div class="grid-container">
        <!-- Cropped puzzle grid -->
        <div class="grid" :class="{ hidden: isIdentified }">
            <Cell
                v-for="(cell, i) in cells"
                :key="i"
                :row="cell.row"
                :col="cell.col"
                :image="sourceImage"
                :backgroundPositionX="correctPositions[positionOrder[i]].backgroundPositionX"
                :backgroundPositionY="correctPositions[positionOrder[i]].backgroundPositionY"
            ></Cell>
        </div>
        
        <!-- Rearrange image to complete image -->
        <div class="complete-image" :class="{ visible: isIdentified }">
            <img :src="sourceImage" alt="Complete image" />
            <!-- Grid lines overlay -->
            <div class="grid-lines">
                <div
                    v-for="(cell, i) in cells"
                    :key="'line-' + i"
                    class="grid-line"
                    :style="{
                        gridRow: cell.row,
                        gridColumn: cell.col
                    }"
                ></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-container {
    position: relative;
    width: 400px;
    height: 400px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(7, 1fr);
    width: 400px;
    height: 400px;
    border: 2px solid red;
    grid-auto-flow: dense;
    transition: opacity 0.3s ease;
}

.grid.hidden {
    opacity: 0;
    pointer-events: none;
}

.complete-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 400px;
    height: 400px;
    border: 2px solid red;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    overflow: hidden;
}

.complete-image.visible {
    opacity: 1;
    pointer-events: auto;
}

.complete-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.grid-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(7, 1fr);
    pointer-events: none;
}

.grid-line {
    outline: 1px solid rgba(0, 0, 0, 0.2);
}
</style>
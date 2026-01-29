<script setup>
import { ref } from 'vue'
import Cell from './cell.vue'

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
const sourceImage = './MC.avif';

const cells = ref(generateLayout());
const correctPositions = calculateCellPositions(cells.value);
const correctOrder = [0, 1, 2, 3, 4, 5, 6];
const positionOrder = ref([...correctOrder]);
const isIdentified = ref(false);

const BASE_SEGMENTS = Object.freeze([
  {
    // Slot 0's correct image configuration
    src: '/MC.avif',
    style: {
      backgroundSize: '600% 100%',
      backgroundPosition: '20% 20%'
    }
  },
  {
    // Slot 1
    src: '/MC.avif',
    style: {
      backgroundSize: '140% 200%',
      backgroundPosition: '100% 8%'
    }
  },
  {
    // Slot 2
    src: '/MC.avif',
    style: {
      backgroundSize: '140% 950%',
      backgroundPosition: '100% 59.5%'
    }
  },
  {
    // Slot 3
    src: '/MC.avif',
    style: {
      backgroundSize: '175% 980%',
      backgroundPosition: '67% 71%'
    }
  },
  {
    // Slot 4
    src: '/MC.avif',
    style: {
      backgroundSize: '245% 900%',
      backgroundPosition: '49.5% 83%'
    }
  },
  {
    // Slot 5
    src: '/MC.avif',
    style: {
      backgroundSize: '350% 700%',
      backgroundPosition: '92% 99%'
    }
  },
  {
    // Slot 6
    src: '/MC.avif',
    style: {
      backgroundSize: '900% 500%',
      backgroundPosition: '95% 80%'
    }
  }
])


const segmentsBySlot = ref([...BASE_SEGMENTS])

function scramble() {
  // Randomly permute the segments – same 7 configs, different slots.
  const arr = [...BASE_SEGMENTS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  segmentsBySlot.value = arr
}

function identify() {
  // Exact restore: put every slot back to its original config.
  segmentsBySlot.value = [...BASE_SEGMENTS]
}

// Start scrambled so you can immediately see the Identify effect.
scramble()
</script>

<template>
  <div class="app">
    <div class="controls">
      <button @click="scramble">Scramble</button>
      <button @click="identify">Identify</button>
    </div>

    <div class="grid-wrapper">
      <div class="grid">
        <div class="seg a"><Cell :segment="segmentsBySlot[0]" /></div>
        <div class="seg b"><Cell :segment="segmentsBySlot[1]" /></div>
        <div class="seg c"><Cell :segment="segmentsBySlot[2]" /></div>
        <div class="seg d"><Cell :segment="segmentsBySlot[3]" /></div>
        <div class="seg e"><Cell :segment="segmentsBySlot[4]" /></div>
        <div class="seg f"><Cell :segment="segmentsBySlot[5]" /></div>
        <div class="seg g"><Cell :segment="segmentsBySlot[6]" /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
  background: radial-gradient(circle at top, #222 0, #000 60%);
}

.controls {
  display: flex;
  gap: 0.75rem;
}

button {
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  background: #ffffff10;
  color: #f5f5f5;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 1px #ffffff30, 0 10px 25px rgba(0, 0, 0, 0.4);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;
}

button:hover {
  background: #ffffff20;
  transform: translateY(-1px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.grid-wrapper {
  position: relative;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(7, 1fr);
  width: 100vw;
  height: 90vh;
  
}

/* 7 unique segments (all different shapes) */
.a {
  grid-row: 1 / 8;
  grid-column: 1 / 3;
}
.b {
  grid-row: 1 / 5;
  grid-column: 3 / 8;
}
.c {
  grid-row: 5 / 6;
  grid-column: 3 / 8;
}
.d {
  grid-row: 6 / 7;
  grid-column: 3 / 7;
}
.e {
  grid-row: 7 / 8;
  grid-column: 3 / 6;
}
.f {
  grid-row: 7 / 8;
  grid-column: 6 / 8;
}
.g {
  grid-row: 6 / 7;
  grid-column: 7 / 8;
}

.seg {
  overflow: hidden;
}
</style>

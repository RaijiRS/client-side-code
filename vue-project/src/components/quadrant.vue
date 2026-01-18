<script setup>
    defineProps({
        variant: String,
        displayText:String
    })

    const emit = defineEmits(['changeText'])

    import { ref } from 'vue';

    const clickedTop = ref(false);
    const clickedBottom = ref(false);
    const animateColors = ref(false);

    function pressTop(){
      clickedTop.value = true;
      emit('changeText');
    }
    
    function releaseTop(){
      clickedTop.value = false;
    }
    
   

    function pressBottom() {
      clickedBottom.value = true;
      animateColors.value = !animateColors.value;
    }


    
    function releaseBottom(){
      clickedBottom.value = false;
    }
</script>

<template>
    <div class="quadrant" :class="variant">
        <img
            v-if="variant === 'third'"
            src="/mcgregor_crest_coat_of_arms.png"
            class="crest"
            alt="McGregor Crest"
        />

        <div class="diamond-container" v-if="variant === 'fourth'">
            <div 
                class="triangle-press" 
                @mousedown="pressTop"
                @mouseup="releaseTop"
                @mouseleave="releaseTop"
            >
                <div class="triangle" :class="{ pressed: clickedTop,animate:animateColors}">A</div>
            </div>
            <div 
                class="triangle-press" 
                @mousedown="pressBottom"
                @mouseup="releaseBottom"
                @mouseleave="releaseBottom"
            >
                <div class="triangle bottom" :class="{ pressed: clickedBottom, animate:animateColors}" >B</div>
            </div>
        </div>

        <div class="words" v-if = "variant === 'first'">
            <span>{{displayText}}</span>

        </div>
        <slot></slot>
    </div>
</template>

<style scoped>
    .quadrant {
        height: 100%;
        width: 100%;
        background-color: aliceblue;
    }
    
    .crest {
        animation: rotation 15s ease-in-out infinite;
        width: 300px;
        height: 350px;
    }
    
    .triangle-press {
        cursor: pointer;
    }
    
    .triangle {
        display: block; 
        width: 100px;
        height: 100px;
        background-color: red;
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%); 
        text-align: center;
        color: white;
        padding-top: 40px; 
        box-sizing: border-box;
        text-decoration: none;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.498));
        transition: all 0.1s ease-in-out;
        font-family: Arial;
        font-weight: bold;
        font-size: 20px;
    }
    
    .triangle.pressed {
        transform: scale(0.95);
        
    }
    
    .triangle.bottom {
        transform: rotate(180deg);
    }
    
    .triangle.bottom.pressed {
        transform: rotate(180deg) scale(0.95);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.753);
    }
    
    .triangle.animate {
  animation: colorCycle 4s linear infinite;
}

/* 🎨 Actual color transitions */
@keyframes colorCycle {
  0%   { background-color: red; }
  25%  { background-color: green; }
  50%  { background-color: blue; }
  75%  { background-color: purple; }
  100% { background-color: red; }
}

    @keyframes rotation {
        0% {
            transform: rotate(0deg);filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
        }
        50% {
            transform: rotate(360deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
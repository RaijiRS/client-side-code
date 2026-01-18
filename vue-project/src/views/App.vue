<script setup>

import{ref} from 'vue'
import quadrant from '@/components/quadrant.vue';

const displayText = ref('alpha');
function changeText(){
  displayText.value = displayText.value === 'alpha'? 'sigma':'alpha';
}




</script>
<template>
  <div class="container">
    <quadrant variant = "first" :display-text="displayText"/>
    <quadrant variant = "second"/>
    <quadrant variant ="third"/>
    <quadrant variant = "fourth" @change-text="changeText"/>
  </div>
  
</template>

<style scoped>

  @import url('https://fonts.googleapis.com/css2?family=Exile&display=swap');


  .container{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 98vw;
    height: 95vh;
  }
  .first{
    display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Exile';
      font-size: 64px;
      
  }
  .second{
        border-top-right-radius: 100%;
  }
  .third{
     display: flex;
      justify-content: center;
      align-items: center;
  }
  .fourth{
    display: flex;
    justify-content: center;
    align-items: center;

  }
  

  

</style>

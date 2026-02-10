<script setup>
import Book from '@/components/Book.vue';
import Preview from '@/components/Preview.vue';
import { ref, watch } from 'vue';


const bookData = ref({
    title: "",
    author: "",
    types: [],
    datePublished:"" ,
    description:"",
    isBookValid: false
})




</script>

<template>
  <div class="container">
    <Book v-model="bookData"/>
    <Preview :book = "bookData"/>
  </div>
    
</template>

<style scoped>
  .container{
    display: flex;
    justify-content: center;
    gap: 200px;
    
    
  }

  
</style>

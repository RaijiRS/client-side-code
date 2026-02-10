<script setup>
const props = defineProps({
    book: Object
})

</script>

<template>
    <form>
        <h1>Preview</h1>
        <div class="checkmark" v-show="book.isBookValid">
            <span>✅</span>
        </div><br>
        <h5>Title: {{book.title}}</h5>
        <h5>Author: {{book.author}}</h5>
        <h5>Type: {{book.types}}</h5>
        <h5>Date Published: {{book.datePublished}}</h5>
        <h5>Description: {{book.description}}</h5>
    </form>
    

</template>

<style scoped>

    form{
    height: 400px;
    width: 400px;
    border-style: groove;
    border-color: black;
    justify-content: center;
    align-items: center;
    text-align: center;
    display: grid;
    overflow: auto;
    grid-template-columns: 1fr 1fr ; 
    grid-template-rows: auto 100px;
    position: relative;
    border: 2px;
    border-radius: 10px;
    box-shadow: 0 4px 8px black;
    background-color: wheat;
    color: black;
    
    }
    .checkmark{
        position: absolute;
        font-size: 5.0rem;
        right: 50px;
        top: 20px;
    }

    h1{
        background-color: black;
        color: white;

    }

</style>
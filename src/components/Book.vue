<script setup>

import { ref, watch } from 'vue';


const model = defineModel();
const bookFields = ref(null);

const types = ['fiction','non-fiction','dystopian', 'Mystery'];



const validateBook = () => {
    
    
    if(bookFields.value.reportValidity()){
        model.value.isBookValid = true;
        }else{
        model.value.isBookValid = false;
    }
    
}

</script>

<template>

    <form ref="bookFields" @submit.prevent= "validateBook" >
        <h1>Book Record</h1>
        <label for="title">Title:</label><br>
        <input v-model = "model.title" required><br>

        <label for="author">Author:</label><br>
        <input v-model="model.author" required><br>

        <label for="types">Type:</label><br>
        <select id="bookTypes" v-model = "model.types" multiple>
            <option disabled value="">Select many</option>
            <option v-for="type in types" :key="type" :value="type" required>
                {{type}}
            </option>
        </select><br>

        <label for="datePublished">Date Published:</label><br>
        <input type="date" v-model="model.datePublished" required><br>


        <label for="description">Description:</label><br>
        <textarea v-model="model.description" required></textarea>
        <br>
        <button @click = "validateBook" type="submit">Validate</button><br>

    </form>

</template>

<style scoped>
form{
    width: 250px;
    border-style: groove;
    border-color: black;
    justify-content: center;
    align-items: center;
    display: grid;
    overflow: auto;
    border: 2px;
    border-radius: 10px;
    box-shadow: 0 4px 8px black;
    background-color: rgb(89, 0, 89);
    color: white;
}

#bookTypes{
    width: 200px;
    height: 100px;
}

h1{
    border: 4px solid black;
    border-radius: 10px;
    color: white;
    background-color: black;

}

</style>
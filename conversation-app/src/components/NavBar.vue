<template>
  <nav>
    <button><RouterLink class="button" to="/create">Create</RouterLink></button>
    <button><RouterLink class="button" to="/signin">Sign In</RouterLink></button>
  </nav>

  <RouterView></RouterView>
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

nav {
  background-color: #7a0101bd;
  padding: 7px;
  display: flex;
  gap: 20px;
  justify-content: right;
}
button,
.button {
  width: 100px;
  height: 40px;
  border-radius: 0px;
  display: flex;
  background-color: black;
  border-color: #000;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  text-decoration: none;
}
</style>

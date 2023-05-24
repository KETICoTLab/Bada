<template>
  <div class="home">
    <navibar v-bind:profile-area=profileArea></navibar>
    <drawer v-bind:profile-area=profileArea></drawer>
    <router-view></router-view>
  </div>
</template>
<script src="../controllers/home.js"></script>
<style src="../style/home.scss" lang="scss" scoped></style>

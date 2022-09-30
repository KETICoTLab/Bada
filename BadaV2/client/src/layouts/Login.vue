<template>
  <div class="login">
    <div class="contents">
      <div class="title">
        <div class="text">Real-time 5G shipbuilding data processing platform</div>
        <!-- <div class="icon-logo" v-on:click="autoLogin('admin@bada.com', 'admin')"/> -->
        <div class="icon-logo" v-on:click="autoLogin('user@bada.com', 'user')"/>
      </div>
      <div class="message">
        <p>Welcome</p>
        <!-- oneM2M Monitoring Platform for 5G IoT/Big data -->
      </div>
      <div class="input">
        <p>Login</p>
        <div class="element">
          <label class="form-label" for="email">E-mail</label>
          <input id="email" type="email" v-model="user.email" v-on:focus="animate($event)">
        </div>
        <div class="element">
          <label class="form-label" for="password">Password</label>
          <input id="password" type="password" v-model="user.password" v-on:focus="animate($event)" v-on:keyup.enter="login()">
        </div>
        <div class="button-group">
          <router-link to="/signup">
            <b-button class="button-signup">Sign up</b-button>
          </router-link>
          <b-button class="button-login" v-on:click="login">Login</b-button>
        </div>
      </div>
      <footer class="copyright">
        Copyright 2018 © Korea Electronics Technology Institute All rights reserved.
      </footer>
    </div>
  </div>
</template>
<script src="../controllers/login.js"></script>
<style src="../style/login.scss" lang="scss" scoped></style>

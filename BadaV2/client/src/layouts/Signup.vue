<template>
  <div class="signup">
    <div class="contents">
      <div class="title">
        <div class="text">Real-time 5G shipbuilding data processing platform</div>
      </div>
      <div class="input">
        <p>Sign Up</p>
        <div class="element">
          <label class="form-label" for="email">E-mail</label>
          <input id="email" type="email" v-model="user.email" v-on:focus="animate($event)">
        </div>
        <div class="element">
          <label class="form-label" for="name">Name</label>
          <input id="name" type="text" v-model="user.name" v-on:focus="animate($event)">
        </div>
        <div class="element">
          <label class="form-label" for="department">Department</label>
          <input id="department" type="text" v-model="user.department" v-on:focus="animate($event)">
        </div>
        <div class="element">
          <label class="form-label" for="password">Password</label>
          <input id="password" type="password" v-model="user.password" v-on:focus="animate($event)">
        </div>
        <div class="element">
          <label class="form-label" for="password-check">Password Confirm</label>
          <input id="password-check" v-model="user.check_password" type='password' 
                  v-on:focusout="checkPassword" v-on:keyup.="checkPassword" v-on:focus="animate($event)"
                  v-on:keyup.enter="signup()">
          <div class="warning-text not" v-if="password_dismatch === true">
            <p class="not">Password is not matched.</p>
          </div>
          <div class="warning-text" v-if="password_dismatch === false">
            <p>Password is matched.</p>
          </div>
          <div class="warning-text" v-if="password_dismatch === 'none'">
            <p></p>
          </div>
          <div class="button-group">
            <router-link to="/login">
              <b-button class="button-cancel">Cancel</b-button>
            </router-link>
            <b-button class="button-signup" v-on:click="signup">Sign up</b-button>
          </div>
        </div>
      </div>
    </div>
    <b-modal title="Confirm" ref="modal"
            ok-only
            ok-title="Close"
            @ok="focusIn"
            :ok-variant="okVariant"
            :header-bg-variant="headerBgVariant"
            :header-text-variant="headerTextVariant"
            :body-bg-variant="bodyBgVariant"
            :body-text-variant="bodyTextVariant">
      <p>{{modalContents}}</p>
    </b-modal>
  </div>
</template>
<script src="../controllers/signup.js"></script>
<style src="../style/signup.scss" lang="scss" scoped></style>

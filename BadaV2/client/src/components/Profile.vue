<template>
  <div class="profile">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-user"></i>
        <div class="text">Profile</div>
      </div>
      <div class="context">
        <b-container fluid>
          <b-row>
            <b-col sm="4"><label for="email">Email</label></b-col>
            <b-col sm="8"><b-form-input id="email" v-model="user.email" type='email' disabled></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"><label for="name">Name</label></b-col>
            <b-col sm="8"><b-form-input id="name" v-model="user.name"></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"><label for="department">Department</label></b-col>
            <b-col sm="8"><b-form-input id="department" v-model="user.department"></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"><label for="password">Current Password</label></b-col>
            <b-col sm="8"><b-form-input id="password" v-model="user.password" type="password"></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"><label for="new_password">New Password</label></b-col>
            <b-col sm="8"><b-form-input id="new_password" v-model="user.new_password" type="password"></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"><label for="password">New Password Confirm</label></b-col>
            <b-col sm="8"><b-form-input id="check_password" v-model="user.check_password" type="password" @keyup="checkPassword" v-on:focusout="checkPassword"></b-form-input></b-col>
          </b-row>
          <b-row>
            <b-col sm="4"></b-col>
            <b-col sm="8">
              <div class="warning-text not" v-if="password_dismatch === true">
                <p>Password is not matched.</p>
              </div>
              <div class="warning-text" v-if="password_dismatch === false">
                <p>Password is matched.</p>
              </div>
              <div class="warning-text" v-if="password_dismatch === 'none'">
                <p></p>
              </div>
            </b-col>
          </b-row>
        </b-container>
        <div class="submit">
          <div class="button-group">
            <b-button class="button-cancel" @click="cancelModal">Cancel</b-button>
            <b-button class="button-modify" @click="signUpModal">Modify</b-button>
          </div>
        </div>
      </div>
    </div>
    <b-modal title="Confirm" ref="modal"
             @ok="handle_ok"
             :ok-variant="okVariant"
             :header-bg-variant="headerBgVariant"
             :header-text-variant="headerTextVariant"
             :body-bg-variant="bodyBgVariant"
             :body-text-variant="bodyTextVariant">
        <p>{{modalContents}}</p>
    </b-modal>
  </div>
</template>
<script src="../controllers/profile.js"></script>
<style src="../style/profile.scss" lang="scss" scoped></style>

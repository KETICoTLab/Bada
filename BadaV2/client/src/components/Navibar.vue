
<template>
  <div class="navibar">
    <b-navbar type="dark" toggleable>
      <!-- <b-navbar-toggle target="nav_collapse"></b-navbar-toggle> -->
      <b-navbar-brand>
        <router-link to="/home/dashboard">Real-time 5G shipbuilding data processing platform</router-link>
      </b-navbar-brand>
      <b-collapse is-nav id="nav-menu">
        <b-navbar-nav  class="left-contents">
          <b-nav-item to="/home/profile">{{ user.name }}</b-nav-item>
          <b-nav-item v-b-modal.logoutModal>Logout</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <b-modal id="logoutModal" :title="modal.title"
      ok-title="Logout"
      ok-variant="danger"
      modal-class="logout-modal"
      header-class="logout-modal-header"
      body-class="logout-modal-body"
      @ok="logout">
      Are you sure?
    </b-modal>
  </div>
</template>
<script src="../controllers/navibar.js"></script>
<style src="../style/navibar.scss" lang="scss" scoped></style>
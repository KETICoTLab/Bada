<template>
  <div class="drawer">
    <b-nav vertical class="menu">
        <b-nav-item to="/home/dashboard">
          <i class="fa fa-sm fa-fw fa-home"/>
          <p>Dashboard</p>
        </b-nav-item>
        <b-nav-item v-on:click="toggleSubmenu">
          <i class="fa fa-sm fa-fw fa-th-large"></i>
          <p>Resource</p>
        </b-nav-item>
        <b-nav-item ref="subContents" class="sub-contents">
          <ul>
            <li>
              <b-nav-item v-if="!isAdmin()" to="/home/register">
                <i class="fa fa-sm fa-fw fa-plus"></i>
                <p>Register</p>
              </b-nav-item>
            </li>
            <li>
              <b-nav-item v-on:click="goToPage('/home/resource/ae')">
                <i class="fa fa-sm fa-fw fa-list"></i>
                <p>AE List</p>
              </b-nav-item>
            </li>
            <li>
              <b-nav-item v-on:click="goToPage('/home/resource/cnt')">
                <i class="fa fa-sm fa-fw fa-list"></i>
                <p>Container List</p>
              </b-nav-item>
            </li>
          </ul>
        </b-nav-item>

        <b-nav-item v-on:click="toggleStreamSubmenu">
          <i class="fa fa-sm fa-fw fa-stream"/>
          <p>Preprocessing</p>
        </b-nav-item>
        <b-nav-item ref="streamSubContents" class="sub-contents">
          <ul>
            <li>
                <b-nav-item to="/home/query">
                <i class="fa fa-sm fa-fw fa-plus"></i>
                <p>Query</p>
              </b-nav-item>
            </li>
            <li>
              <b-nav-item to="/home/querylist">
                <i class="fa fa-sm fa-fw fa-list"></i>
                <p>List</p>
              </b-nav-item>
            </li>
          </ul>
        </b-nav-item>
        <b-nav-item v-if="isAdmin()" to="/home/user">
          <i class="fa fa-sm fa-fw fa-user"></i>
          <p>User</p>
        </b-nav-item>
        <b-nav-item v-if="isAdmin()" to="/home/configuration">
          <i class="fa fa-sm fa-fw fa-cog"></i>
          <p>Configuration</p>
        </b-nav-item>

        <!-- <b-nav-item v-if="!isAdmin()" to="/home/search">
          <i class="fa fa-sm fa-fw fa-search"></i>
          <p>Search</p>
        </b-nav-item> -->
    </b-nav>
  </div>
</template>
<script src="../controllers/drawer.js"></script>
<style src="../style/drawer.scss" lang="scss" scoped></style>
<template>
  <div class="counts">
    <div class="contents" v-bind:class="{admin : admin}">
      <b-jumbotron class="pointer" v-on:click="goList('ae')">
        <template slot="lead">
          Application Entity
        </template>
        <div class="mark-ae">AE</div>
        <div class="count-content">
          {{ae_count.toLocaleString()}}
        </div>
      </b-jumbotron>
      <b-jumbotron class="pointer" v-on:click="goList('cnt')">
        <template slot="lead">
          Container
        </template>
        <div class="mark-cn">CN</div>
        <div class="count-content">
          {{cnt_count.toLocaleString()}}
        </div>
      </b-jumbotron>
      <b-jumbotron>
        <template slot="lead">
          Content Instance
        </template>
        <div class="mark-cin">CIN</div>
        <div class="count-content">
          {{cin_count.toLocaleString()}}
        </div>
      </b-jumbotron>
      <b-jumbotron class="pointer" v-if="isAdmin()" v-on:click="goList('user')">
        <template slot="lead">
          Users
        </template>
        <div class="mark-user">User</div>
        <div class="count-content">
          {{user_count}}
        </div>
      </b-jumbotron>
    </div>
  </div>
</template>
<script src="../../controllers/resource-count.js"></script>
<style src="../../style/resource-count.scss" lang="scss" scoped></style>

<template>
  <div class="user">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-user"></i>
        <div class="text">User</div>
      </div>
      <div class="table-area">
        <b-table show-empty responsive outlined striped small
          thead-class="header-style"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :items=items 
          :fields=fields>
        </b-table>`
      </div>
    </div>
  </div>
</template>
<script src="../controllers/user.js"></script>
<style src="../style/user.scss" lang="scss"></style>
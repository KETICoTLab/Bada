<template>
  <div class="dashboard">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-home"/>
        <div class="text">Dashboard</div>
      </div>
      <div class="block">
        <resource-count></resource-count>
        <system-usage v-if="isAdmin()"></system-usage>
      </div>
      <div class="block">
        <daily-count></daily-count>
        <compact-list v-if="isAdmin()" v-bind:title="compactList.title" v-bind:resource-name="resourceName.ae"></compact-list>
      </div>
      <div class="block" v-if="!isAdmin()" >
        <compact-list class="height-2" v-bind:category="resourceName.cnt" v-bind:title="compactList.title" v-bind:resource-name="resourceName.cin"></compact-list>
      </div>
      <div class="block" v-if="isAdmin()">
        <compact-list v-bind:title="compactList.title" v-bind:resource-name="resourceName.cnt"></compact-list>
        <compact-list v-bind:title="compactList.title" v-bind:resource-name="resourceName.cin"></compact-list>
      </div>
      <div class = "block">
        <export-excel v-if="isAdmin()"></export-excel>
      </div>
    </div>
  </div>
</template>
<script src="../controllers/dashboard.js"></script>
<style src="../style/dashboard.scss" lang="scss" scoped></style>

<template>
  <div class="resource-table">
    <div class="contents">
      <b-container fluid class="info-table">
        <b-row v-for="(value, key) in data" :key="key">
          <b-col cols="3" class="attribute-name">
            {{ key | acronymInterpreter }} 
          </b-col>
          <b-col cols="1" class="attribute-name short">
            {{key}}
          </b-col>
          <b-col>
            <json-pretty v-if="key === 'con' && typeof value === 'object'" :data="value"></json-pretty>
            <div v-else>{{ Boolean(value) ? value : '-'}}</div>
          </b-col>
        </b-row>
      </b-container>
    </div>
  </div>
</template>
<script src="../../controllers/resource-table.js"></script>
<style src="../../style/resource-table.scss" lang="scss"></style>
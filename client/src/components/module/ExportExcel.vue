<template>
  <div class="export-excel">
    <div class="contents">
      <div class="title">Download Mobius Data</div>
      <div class = 'context'>

        <div class ="input-group">
          <b-input-group>
            <b-input-group-text slot="prepend">
              <div class="prepend-first">
                <span>{{"ae" | acronymInterpreter}}</span>
              </div>
            </b-input-group-text>
            <b-form-select class="ae-selection" :options="list.ae" v-model ="selectedae" v-on:input = "selectAe(selectedae)" >
              <template slot="first">
                <option value="null" disabled>-- Select an AE --</option>
              </template>
            </b-form-select>
          </b-input-group>
        </div>
        
        <div class ="input-group">
          <b-input-group>
            <b-input-group-text slot="prepend" class="input-prepend">
              <div class="prepend-first">
                <span>{{"cnt" | acronymInterpreter}}</span>
              </div>
            </b-input-group-text>
            <b-form-select class="cnt-selection" :options="list.cnt" v-model ="selectedcnt"  >
              <template slot="first">
                <option value="null" disabled>-- Select a container --</option>
              </template>
            </b-form-select>
          </b-input-group>
        </div>
        
        <div class ="input-group">
          <b-input-group>
            <b-input-group-text slot="prepend" class="input-prepend">
              <div class="prepend-first">
                <span>Term Select</span>
              </div>
            </b-input-group-text>
            <b-form-select v-model="selectedterm" class="term-selection" :options="options" :clearable="false"></b-form-select>
          </b-input-group>
        </div>
          <b-btn class = "button" @click="exportExcelFile">Download</b-btn>
      </div>
    </div>
  </div>
</template>
<script src ="../../controllers/export-excel.js"></script>
<style src = "../../style/export-excel.scss" lang="scss"></style>
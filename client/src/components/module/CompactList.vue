<template>
  <div class="compact-list">
    <div class="contents">
      <div class="title">{{title}} {{resource.title}}</div>
      <div class="list" v-on:scroll.passive="onCloseAll">
        <b-table show-empty bordered striped fixed
                 thead-tr-class="text-left"
                 :sort-by.sync="sortBy"
                 :sort-desc.sync="sortDesc"
                 :class="[resource.acronym, 'pointer']"
                 :items=items
                 :fields=fields
                 @row-clicked="showCinInfo">
          <template :slot="fields[0].key" slot-scope="data">
            <div :id="'popId' + resourceName + (data.index+1)">{{data.item[fields[0].key]}}</div>
            <b-popover :ref="'popId' + resourceName + (data.index+1)"
                  :target="'popId' + resourceName + (data.index+1)"
                  placement="left"
                  boundary="window">
              <template slot="title">
                <b-btn @click="onClose('popId' + resourceName + (data.index+1))" class="close" aria-label="Close">
                  <span class="d-inline-block" aria-hidden="true">&times;</span>
                </b-btn>
                {{ resource.title }} Details
              </template>
              <resource-table :data="detailsData(data.item)"></resource-table>
            </b-popover>
          </template>
          <template slot="elapsed" slot-scope="data">
            <div>{{ data.item.ct | elapsedTimer }}</div>
          </template>
        </b-table>
      </div>
    </div>
  </div>
</template>
<script src="../../controllers/compact-list.js"></script>
<style src="../../style/compact-list.scss" lang="scss"></style>
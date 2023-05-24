<template>
  <div class="querylistWindow">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-stream"/>
        <div class="text">Preprocessing</div>
      </div>
      <div class="block query">
        <b-card title="Query List" class="queryList">
          <b-container fluid class="queryTable">
            <b-table fluid striped bordered sticky-header show-empty v-if="queryData.length==0" class="queryEmpty" emptyText="There are no queries to show"></b-table>
            <b-row v-for="index in Math.ceil(queryData.length / 2)" :key="index" class="queryRow">
                <b-col class="queryCol" v-if="queryData[((index-1) * 2)]"> 
                <json-pretty v-if="typeof queryData[((index-1) * 2)] === 'object'" :data="queryData[((index-1) * 2)]"></json-pretty>
                <div class="queryDetailButton">
                  <b-button class="closeButton" @click="showQueryDetails(queryData[((index-1) * 2)])" title="Show Query Details">Details</b-button>
                  <b-button class="closeButton" @click="showQueryResults(queryData[((index-1) * 2)])" title="Show Query Results">Results</b-button>
                </div>

              </b-col>
              <b-col class="queryCol" v-if="queryData[((index-1) * 2) + 1]"> 
                <json-pretty v-if="typeof queryData[((index-1) * 2) + 1] === 'object'" :data="queryData[((index-1) * 2) + 1]"></json-pretty>
                <div class="queryDetailButton">
                  <b-button class="closeButton" @click="showQueryDetails(queryData[((index-1) * 2)+1])" title="Show Query Details">Details</b-button>
                  <b-button class="closeButton" @click="showQueryResults(queryData[((index-1) * 2)+1])" title="Show Query Results">Results</b-button>
                </div>

              </b-col>
            </b-row>
          </b-container>
        </b-card>
      </div>
      <div class="block result">
        <b-card title="Query Result" class="queryResult">
          <b-table fluid striped bordered sticky-header show-empty v-if="queryResults.length == 0" :items="queryResults" class="result-table"></b-table>
          <b-table fluid striped bordered sticky-header responsive v-else-if="queryResults !=[] && Object.keys(queryResults[0]).length > 7" :items="queryResults" class="result-table"></b-table>
          <b-table fluid striped bordered sticky-header show-empty v-else :items="queryResults" class="result-table"></b-table>
        </b-card>
      </div>
      <div class="block graph">
        <query-result></query-result>
      </div>
      
      <b-modal :title="modal.title" ref="modal" 
        ok-only
        ok-title="Close"
        @ok="reset()"
        :ok-variant="modal.okVariant"
        :header-bg-variant="modal.headerBgVariant"
        :header-text-variant="modal.headerTextVariant"
        :body-text-variant="modal.bodyTextVariant"
        size='lg'
        class="streamModal">
        <div class="json-tree">
          <json-pretty v-if="typeof modal.contents === 'object'" :data="modal.contents"></json-pretty>
          <span v-else>{{modal.contents}}</span>
        </div>
    </b-modal>

    <b-modal :title="modal.title" ref="queryDetailModal" 
      centered
      ok-title="Terminate"
      @ok="terminateQuery(selected)"
      :ok-variant="modal.okVariant"
      :header-bg-variant="modal.headerBgVariant"
      :header-text-variant="modal.headerTextVariant"
      :body-text-variant="modal.bodyTextVariant"
      size='lg'
      class="queryDetailModal">
        <div class="json-tree">
          <json-pretty v-if="typeof modal.contents === 'object'" :data="modal.contents"></json-pretty>
          <span v-else>{{modal.contents}}</span>
        </div>
    </b-modal>

    </div>
  </div>
</template>
<script src="../controllers/querylist.js">
</script>
<style src="../style/querylist.scss" lang="scss" scoped>
</style>

<template>
  <div class="streammanagement">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-stream"/>
        <div class="text">Stream Management</div>
      </div>
      <div class="block connector">
          <b-card title="Connector Status" class="connectorStatus">
              <div class="connectorTable">
                <b-table show-empty bordered small responsive="sm" :items="connector" ></b-table>
              </div>
          </b-card>
      </div>
      <div class="block sensor">
          <b-card title="Sensor List" class="sensorList" >
            <input class="searchinput" type="text" v-model="searchinput" placeholder="Search sensors..." />
            <vue-scroll>
            <div class="buttonGroup" >
              <div v-for="(sensorName, index) in filteredList()" :key="index">
                <b-button class="sensorButton" @click="getSchema(sensorName)"> {{sensorName}} </b-button>
              </div>
              <div class="item error" v-if="searchinput&&!filteredList().length">
                <p>No results found!</p>
              </div>
            </div>
            </vue-scroll>
          </b-card>
          <b-card title="Sensor Schema" class="sensorSchema">
              <div class="schemaTable">
                <b-table show-empty fixed bordered striped :items="schema"></b-table>
                <b-button v-show="createTableTag" @click="createSensorTable()">Create Sensor Table - {{currentSensor}} </b-button>
              </div>
          </b-card>
      </div>
      <div class="block query">
        <b-card title="Query List" class="queryList">
          <b-container fluid class="queryTable">
            <b-row v-show="queryData.length == 0" class="queryEmpty">There are no queries to show</b-row>
            <b-row v-for="index in Math.ceil(queryData.length / 2)" :key="index">
              <!-- <b-col class="queryCol" v-for="item in queryData.slice((index - 1) * 2, index * 2)" :key="item"> 
                <json-pretty v-if="typeof item === 'object'" :data="item"></json-pretty>
                <b-button class="closeButton" @click="terminateQuery()">X</b-button>
              </b-col> -->
                <b-col class="queryCol" v-if="queryData[((index-1) * 2)]"> 
                <json-pretty v-if="typeof queryData[((index-1) * 2)] === 'object'" :data="queryData[((index-1) * 2)]"></json-pretty>
                <b-button class="closeButton" @click="showQueryDetails(queryData[((index-1) * 2)])" title="Show Query Details">Show query details</b-button>
              </b-col>
              <b-col class="queryCol" v-if="queryData[((index-1) * 2) + 1]"> 
                <json-pretty v-if="typeof queryData[((index-1) * 2) + 1] === 'object'" :data="queryData[((index-1) * 2) + 1]"></json-pretty>
                <b-button class="closeButton" @click="showQueryDetails(queryData[((index-1) * 2)+1])" title="Show Query Details">Show query details</b-button>
              </b-col>
            </b-row>
          </b-container>
        </b-card>
      </div>
      <div class="block user">
        <b-card class="userQuery">
          <form class="input-form-userquery">
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first title">Stream Query</div>
                </b-input-group-text>
                <b-form-textarea v-model="userQuery" type="text" placeholder="????????? ???????????? ?????? ????????? ???????????? ???????????? ????????? ?????????.
?????? ????????? ????????? {YOUR_AE}_{YOUR_CNT} ?????? spatial ??? ??????????????????" >
                </b-form-textarea>
              </b-input-group>
              <b-button class="querySubmitButton" type="submit" @click="submitQuery(userQuery)">Submit</b-button>
          </form>
        </b-card>
      </div>
      <div class="block user">
        <b-card class="userQuery">
          <form class="input-form-userquery">
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first title">Function</div>
                </b-input-group-text>
                <div class="functions">
                  <b-button v-for="item in selectOption" :key="item.value" @click="showQueryModal(item.value)">{{item.text}}</b-button>
                </div>
              </b-input-group>
          </form>
        </b-card>
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

    <b-modal
      class="functionModal"
      ref="queryModal"
      :title="modal.title"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
      size='lg'
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
        v-if="selected === 'anomalyDetection'"
          invalid-feedback="required field"
          :state="fieldState"
        >
        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">?????? ??????</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="anomalyDetection.sensor" :options="sensorlist" :state="fieldState" @change="selectSensor" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Sensor --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">????????? ??????</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="anomalyDetection.column" :options="columnList" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Data Column --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">?????? ??????</div>
          </b-input-group-text>
          <b-form-input v-model="anomalyDetection.time" :state="fieldState" placeholder="?????? : S" type='number' required></b-form-input>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">?????? ??????</div>
          </b-input-group-text>
          <b-form-radio-group 
          class = "radio-button"
          v-model="anomalyDetection.inequalitySign" 
          size='lg' 
          :options="anomalyDetection.option.inequalityOption" 
          buttons 
          required>
          </b-form-radio-group>
        </b-input-group>


          <b-input-group>
            <b-input-group-text slot="prepend">
              <div class="prepend-first">?????????</div>
            </b-input-group-text>
            <b-form-input v-model="anomalyDetection.comparisonValue" :state="fieldState" type='number' required></b-form-input>
          </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">????????? ??????</div>
            </b-input-group-text>
            <b-form-input v-model="anomalyDetection.count" :state="fieldState" type='number' required></b-form-input>
          </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">?????? ??????</div>
          </b-input-group-text>
          <b-form-radio-group 
          class = "radio-button"
          v-model="anomalyDetection.storageMethod" 
          size='lg' 
          :options="anomalyDetection.option.storageOption" 
          buttons 
          required>
          </b-form-radio-group>
        </b-input-group>
      </b-form-group>

        <b-form-group
          v-if="selected === 'grouping'"
          invalid-feedback="required field"
          :state="fieldState"
        >
          <b-input-group>
            <b-input-group-text slot="prepend">
              <div class="prepend-first">?????? ??????</div>
            </b-input-group-text>
            <b-form-input v-model="grouping.groupName" :state="fieldState" required></b-form-input>
          </b-input-group>

          <b-input-group>
            <vue-table-dynamic 
              :params="parsedsensor" 
              @selection-change="onSelectionChange"
              ref="table">
            </vue-table-dynamic>
          </b-input-group>

        </b-form-group>

        <b-form-group
          v-if="selected === 'windowAggregation'"
          invalid-feedback="required field"
          :state="fieldState">

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">?????? ??????</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="windowAggregation.sensor" :options="sensorlist" @change="selectSensor" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Sensor --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">????????? ??????</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="windowAggregation.column" :options="columnList" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Data Column --</option>
            </template>
          </b-form-select>
        </b-input-group>
        
          <b-input-group>
            <b-input-group-text slot="prepend">
              <div class="prepend-first title">?????? ??????</div>
            </b-input-group-text>
            <b-form-input v-model="windowAggregation.time" :state="fieldState" placeholder="?????? : S" type='number' required></b-form-input>
          </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">??????</div>
            </b-input-group-text>
            <b-form-radio-group  
            class = "radio-button"
            v-model="windowAggregation.aggregationFunction" 
            size='lg' 
            :options="windowAggregation.option.aggregationOption" 
            buttons 
            required>
            </b-form-radio-group>
          </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">?????? ??????</div>
            </b-input-group-text>
            <b-form-radio-group 
            class = "radio-button"
            v-model="windowAggregation.storageMethod" 
            size='lg' 
            :options="windowAggregation.option.storageOption" 
            buttons 
            required>
            </b-form-radio-group>
          </b-input-group>

        </b-form-group>

          <b-form-group
          v-if="selected === 'geoFence'"
          class="geofence"
          invalid-feedback="required field"
          :state="fieldState">

          <b-input-group>
            <b-input-group-text slot="prepend" class="geofence">
              <div class="prepend-first">geofence(polygon) ??????</div>
            </b-input-group-text>
            <b-form-input v-model="geoFence.fenceName" :state="fieldState" required></b-form-input>
          </b-input-group>


          <div v-for="(item, index) in geoFence.polygon" :key="item.index">
            <b-input-group class="location-input-label" :class=" {'first-index': index==0}">
              <b-input-group-text slot="prepend" v-if="index==0" class="geofence">
                <div class="prepend-first">location data</div>
              </b-input-group-text>
              <!-- <b-form-input v-model="geoFence.polygon[index]" type="text" placeholder="Add latitude and longitude"></b-form-input> -->
              <b-form-input v-model="geoFence.polygon[index].lat" type="text" placeholder="Enter latitude" required></b-form-input>
              <b-form-input v-model="geoFence.polygon[index].lng" type="text" placeholder="Enter longitude" required></b-form-input>
              <b-input-group-append v-if="index==0" class="input-append">
                <b-button variant="info" v-on:click="addTextInput('polygon')">+</b-button>
              </b-input-group-append>
              <b-input-group-append v-else class="input-append">
                <b-button variant="info" v-on:click="deleteTextInput('polygon', index)">-</b-button>
              </b-input-group-append>
            </b-input-group>
          </div>

        </b-form-group>

      </form>
    </b-modal>
    </div>
  </div>
</template>
<script src="../controllers/stream-management.js">
</script>
<style src="../style/stream-management.scss" lang="scss" scoped>
</style>

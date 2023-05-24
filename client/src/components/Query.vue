<template>
  <div class="queryWindow">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-stream"/>
        <div class="text">Preprocessing</div>
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
                <b-table show-empty fixed bordered striped small responsive stacked :items="schema"></b-table>
                <b-button v-show="createTableTag" @click="createSensorTable()">Create Sensor Table - {{currentSensor}} </b-button>
              </div>
          </b-card>
      </div>
      <div class="block user">
        <b-card class="userQuery">
          <form class="input-form-userquery">
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first title">Stream Query</div>
                </b-input-group-text>
                <b-form-textarea v-model="userQuery" type="text" placeholder="쿼리에 사용되는 모든 센서는 테이블이 생성되어 있어야 합니다.
센서 테이블 이름은 {YOUR_AE}_{YOUR_CNT} 혹은 spatial 로 입력해주세요" >
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
            <div class="prepend-first">센서 선택</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="anomalyDetection.sensor" :options="sensorlist" :state="fieldState" @change="selectSensor" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Sensor --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">데이터 선택</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="anomalyDetection.column" :options="columnList" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Data Column --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">측정 시간</div>
          </b-input-group-text>
          <b-form-input v-model="anomalyDetection.time" :state="fieldState" placeholder="단위 : S" type='number' required></b-form-input>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">기준 선택</div>
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
              <div class="prepend-first">비교값</div>
            </b-input-group-text>
            <b-form-input v-model="anomalyDetection.comparisonValue" :state="fieldState" type='number' required></b-form-input>
          </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">이상치 횟수</div>
            </b-input-group-text>
            <b-form-input v-model="anomalyDetection.count" :state="fieldState" type='number' required></b-form-input>
          </b-input-group>

        <!-- <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">저장 위치</div>
          </b-input-group-text>
          <b-form-radio-group 
          class = "radio-button"
          v-model="anomalyDetection.storageMethod" 
          size='lg' 
          :options="anomalyDetection.option.storageOption" 
          buttons 
          required>
          </b-form-radio-group>
        </b-input-group> -->
      </b-form-group>

      <b-form-group
        v-if="selected === 'grouping'"
        invalid-feedback="required field"
        :state="fieldState"
      >
        <b-input-group>
          <b-input-group-text slot="prepend">
            <div class="prepend-first">그룹 이름</div>
          </b-input-group-text>
          <b-form-input v-model="grouping.groupName" :state="fieldState" required></b-form-input>
        </b-input-group>

        <b-input-group>
          <vue-table-dynamic 
            :params="parsedsensor" 
            @selection-change="onGroupSelectionChange"
            ref="table">
          </vue-table-dynamic>
        </b-input-group>

      </b-form-group>

      <b-form-group
        v-if="selected === 'timesync'"
        invalid-feedback="required field"
        :state="fieldState"
      >
        <b-input-group>
          <b-input-group-text slot="prepend">
            <div class="prepend-first">그룹 이름</div>
          </b-input-group-text>
          <b-form-input v-model="timesync.groupName" :state="fieldState" required></b-form-input>
        </b-input-group>

        <b-input-group>
          <vue-table-dynamic 
            :params="aeList" 
            @selection-change="onTimeSelectionChange"
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
            <div class="prepend-first">센서 선택</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="windowAggregation.sensor" :options="sensorlist" @change="selectSensor" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Sensor --</option>
            </template>
          </b-form-select>
        </b-input-group>

        <b-input-group>
          <b-input-group-text slot="prepend" >
            <div class="prepend-first">데이터 선택</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="windowAggregation.column" :options="columnList" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Data Column --</option>
            </template>
          </b-form-select>
        </b-input-group>
        
          <b-input-group>
            <b-input-group-text slot="prepend">
              <div class="prepend-first title">측정 시간</div>
            </b-input-group-text>
            <b-form-input v-model="windowAggregation.time" :state="fieldState" placeholder="단위 : S" type='number' required></b-form-input>
          </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">함수</div>
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

          <!-- <b-input-group>
            <b-input-group-text slot="prepend" >
              <div class="prepend-first">저장 위치</div>
            </b-input-group-text>
            <b-form-radio-group 
            class = "radio-button"
            v-model="windowAggregation.storageMethod" 
            size='lg' 
            :options="windowAggregation.option.storageOption" 
            buttons 
            required>
            </b-form-radio-group>
          </b-input-group> -->

        </b-form-group>

          <b-form-group
          v-if="selected === 'geoFence'"
          class="geofence"
          invalid-feedback="required field"
          :state="fieldState">

        <b-input-group>
          <b-input-group-text slot="prepend" class="geofence">
            <div class="prepend-first">센서 선택</div>
          </b-input-group-text>
          <b-form-select class="sensor-selection" v-model="geoFence.ae" :options="spatialsensor.ae" :state="fieldState" @change="selectAE" required>
            <template slot="first">
              <option :value="null" disabled>-- Select AE --</option>
            </template>
          </b-form-select>
          <b-form-select class="sensor-selection" v-model="geoFence.cnt" :options="spatialsensor.cnt" :state="fieldState" required>
            <template slot="first">
              <option :value="null" disabled>-- Select Container --</option>
            </template>
          </b-form-select>
        </b-input-group>

          <b-input-group>
            <b-input-group-text slot="prepend" class="geofence">
              <div class="prepend-first">geofence(polygon) 이름</div>
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
<script src="../controllers/query.js">
</script>
<style src="../style/query.scss" lang="scss" scoped>
</style>

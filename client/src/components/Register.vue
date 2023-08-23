<template>
  <div class="register">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-plus"></i>
        <div class="text">Register</div>
      </div>
      <div class="context">
        <div class="input-area">
          <div class="form-title">Specification Form</div>
          <div class="select-area">            
            <h4 class="resource-label">Resource Type</h4>
            <div class="resource-select">
              <b-form-select v-model="selected" :options="selectOption" class="mb-1" @change="clearAttributes"></b-form-select>
            </div>
          </div>
          <div class="form-area">
            <form class="input-form-ae" v-if="selected ==='ae'">
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>Resource Name</span>
                    <span class="text-danger"> *</span>
                  </div>
                  <div class="prepend-second">rn</div>
                </b-input-group-text>
                <b-form-input id="rn" v-model="ae.rn" type="text" placeholder="Enter resource name"></b-form-input>
                <b-input-group-append id="checkboxArea-1" class="auto-create-wrapper">
                  <input class="ae-name auto-creation" type="checkbox" @click="createAttribute('rn', $event)">
                </b-input-group-append>
                <b-tooltip target="checkboxArea-1">
                  Auto Creation
                </b-tooltip>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>{{"api" | acronymInterpreter}}</span>
                    <span class="text-danger"> *</span>
                  </div>
                  <div class="prepend-second">api</div>
                </b-input-group-text>
                <b-form-input v-model="ae.api" type="text" placeholder="Enter app id"></b-form-input>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>{{"rr" | acronymInterpreter}}</span>
                    <span class="text-danger"> *</span>
                  </div>
                  <div class="prepend-second">rr</div>
                </b-input-group-text>
                <b-form-select v-model="ae.rr" placeholder="Choose">
                  <template slot="first">
                    <option value="null" disabled>-- Please select an option --</option>
                  </template>
                  <option value="true">true</option>
                  <option value="false">false</option>`
                </b-form-select>
              </b-input-group>
              <div class="label-group">
                <b-input-group>
                  <b-input-group-text slot="prepend">
                    <div class="prepend-first">{{"lbl" | acronymInterpreter}}</div>
                    <div class="prepend-second">lbl</div>
                  </b-input-group-text>
                  <b-form-input v-model="label" type="text" placeholder="Enter label"></b-form-input>
                  <b-input-group-append>
                    <b-button variant="info" v-on:click="addTextInput('lbl')">+</b-button>
                  </b-input-group-append>
                </b-input-group>
                <div v-for="(item, index) in ae.lbl" :key="item.index">
                  <b-input-group class="input-label">
                    <b-form-input v-model="ae.lbl[index]" type="text" placeholder="Add label"></b-form-input>
                    <b-input-group-append>
                      <b-button variant="info" v-on:click="deleteTextInput('lbl', index)">-</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <div class="label-group">
                <b-input-group>
                  <b-input-group-text slot="prepend">
                    <div class="prepend-first">{{"poa" | acronymInterpreter}}</div>
                    <div class="prepend-second">poa</div>
                  </b-input-group-text>
                  <b-form-input v-model="poa" type="text" placeholder="Enter point of access"></b-form-input>
                  <b-input-group-append>
                    <b-button variant="info" v-on:click="addTextInput('poa')">+</b-button>
                  </b-input-group-append>
                </b-input-group>
                <div v-for="(item, index) in ae.poa" :key="item.index">
                  <b-input-group class="input-label">
                    <b-form-input v-model="ae.poa[index]" type="text" placeholder="Add point of access"></b-form-input>
                    <b-input-group-append>
                      <b-button variant="info" v-on:click="deleteTextInput('poa', index)">-</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"apn" | acronymInterpreter}}</div>
                  <div class="prepend-second">apn</div>
                </b-input-group-text>
                <b-form-input v-model="ae.apn" type="text" placeholder="Enter app name"></b-form-input>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"et" | acronymInterpreter}}</div>
                  <div class="prepend-second">et</div>
                </b-input-group-text>
                <b-input-group-addon class="date-time-area">
                  <datepicker v-model="expirationTime.date" :disabledDates="disabledDates" input-class="date_input" wrapper-class="wrapper" placeholder="YYYY-MM-DD" format="yyyy-MM-dd"></datepicker>
                  <timepicker v-model="expirationTime.time" placeholder="YYYY-MM-DD" format="HH:mm:ss" :hide-clear-button=true></timepicker>
                  <b-button class="datetime-clear" v-on:click="clearDatetime">X</b-button>
                  <span class="et-default-value">(default {{ expirationTimeDefault }})</span>
                </b-input-group-addon>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"csz" | acronymInterpreter}}</div>
                  <div class="prepend-second">csz</div>
                </b-input-group-text>
                <b-form-input v-model="ae.csz" type="text" placeholder="Enter content serialization"></b-form-input>
              </b-input-group>
            </form>

            <form class="input-form-cnt" v-else-if="selected==='cnt'">
              <b-input-group class="resource-selection">
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>Parent Resource</span>
                    <span class="text-danger"> *</span>
                  </div>
                </b-input-group-text>
                <b-form-select class="ae-selection" v-model="cnt.ae" :options="list.ae" v-on:input="selectAe(cnt.ae)">
                  <template slot="first">
                    <option :value="null" disabled>-- Select an AE --</option>
                  </template>
                </b-form-select>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>Resource Name</span>
                    <span class="text-danger"> *</span>
                  </div>
                  <div class="prepend-second">rn</div>
                </b-input-group-text>
                <b-form-input id="rn" v-model="cnt.rn" type="text" placeholder="Enter resource name"></b-form-input>
                <b-input-group-append class="auto-create-wrapper">
                  <input class="cnt-name auto-creation" type="checkbox" @click="createAttribute('rn', $event)">
                </b-input-group-append>
              </b-input-group>
              <div class="label-group">
                <b-input-group>
                  <b-input-group-text slot="prepend">
                    <div class="prepend-first">{{"lbl" | acronymInterpreter}}</div>
                    <div class="prepend-second">lbl</div>
                  </b-input-group-text>
                  <b-form-input v-model="label" type="text" placeholder="Enter label"></b-form-input>
                  <b-input-group-append>
                    <b-button variant="info" v-on:click="addTextInput('lbl')">+</b-button>
                  </b-input-group-append>
                </b-input-group>
                <div v-for="(item, index) in cnt.lbl" :key="item.index">
                  <b-input-group class="input-label">
                    <b-form-input v-model="cnt.lbl[index]" type="text" placeholder="Add label"></b-form-input>
                    <b-input-group-append>
                      <b-button variant="info" v-on:click="deleteTextInput('lbl', index)">-</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"et" | acronymInterpreter}}</div>
                  <div class="prepend-second">et</div>
                </b-input-group-text>
                <b-input-group-addon class="date-time-area">
                  <datepicker v-model="expirationTime.date" :disabledDates="disabledDates" input-class="date_input" wrapper-class="wrapper" placeholder="YYYY-MM-DD" format="yyyy-MM-dd"></datepicker>
                  <timepicker v-model="expirationTime.time" placeholder="YYYY-MM-DD" format="HH:mm:ss" :hide-clear-button=true></timepicker>
                  <b-button class="datetime-clear" v-on:click="clearDatetime">X</b-button>
                  <span class="et-default-value">(default {{ expirationTimeDefault }})</span>
                </b-input-group-addon>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"mni" | acronymInterpreter}}</div>
                  <div class="prepend-second">mni</div>
                </b-input-group-text>
                <b-form-input v-model="cnt.mni" type="number" max="3153600000" placeholder="Enter max number of instances (default: 3,153,600,000)"></b-form-input>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"mbs" | acronymInterpreter}}</div>
                  <div class="prepend-second">mbs</div>
                </b-input-group-text>
                <b-form-input v-model="cnt.mbs" type="number" placeholder="Enter max byte size (default: 3,153,600,000)"></b-form-input>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"mia" | acronymInterpreter}}</div>
                  <div class="prepend-second">mia</div>
                </b-input-group-text>
                <b-form-input v-model="cnt.mia" type="number" placeholder="Enter max instance age (default: 31,536,000)"></b-form-input>
              </b-input-group>
              <b-input-group v-if="!cnt.cnt[0]" class="storage-option">
                <b-input-group-text slot="prepend">
                  <div class="prefend-first">Repository Type</div>
                </b-input-group-text>
                <div class="checkbox-group">
                  <b-form-checkbox v-model="cnt.timeseries" class="timeseries" value="true" unchecked-value="false">Timeseries</b-form-checkbox>
                  <b-form-checkbox v-model="cnt.spatialdata" class="spatialData" value="true" unchecked-value="false">Spatial Data</b-form-checkbox>
                </div>
              </b-input-group>

              <div class="data-model-group">
                <b-input-group>
                  <b-input-group-text slot="prepend">
                    <div class="prepend-first">{{"dm" | acronymInterpreter}}</div>
                    <div class="prepend-second">dm</div>
                  </b-input-group-text>
                  <b-form-textarea  class="datamodel-field" v-model="cnt.datamodel" type="text" placeholder="Put Json Schema"></b-form-textarea>
                </b-input-group>
              </div>
            </form>

            <form class="input-form-sub" v-else-if="selected==='sub'">
              <b-input-group class="resource-selection">
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>Parent Resource</span>
                    <span class="text-danger"> *</span>
                  </div>
                </b-input-group-text>
                <b-form-select class="ae-selection" v-model="sub.ae" :options="list.ae" v-on:input="selectAe(sub.ae)">
                  <template slot="first">
                    <option :value="null" disabled>-- Select an AE --</option>
                  </template>
                </b-form-select>
                <b-form-select v-for="(item, index) in sub.path" :key="item" 
                               v-model="sub.cnt[index]" :options="list.cnt[index]"
                               v-on:input="selectCnt(sub.cnt[index], index)">
                  <template slot="first">
                    <option :value="null">-- Select a container --</option>
                  </template>  
                </b-form-select>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">
                    <span>Resource Name</span>
                    <span class="text-danger"> *</span>
                  </div>
                  <div class="prepend-second">rn</div>
                </b-input-group-text>
                <b-form-input id="rn" v-model="sub.rn" type="text" placeholder="Enter resource name"></b-form-input>
                <b-input-group-append class="auto-create-wrapper">
                  <input class="sub-name auto-creation" type="checkbox" @click="createAttribute('rn', $event)">
                </b-input-group-append>
              </b-input-group>
              <div class="label-group">
                <b-input-group>
                  <b-input-group-text slot="prepend">
                    <div class="prepend-first">
                      <span>{{"nu" | acronymInterpreter}}</span>
                      <span class="text-danger"> *</span>
                    </div>
                    <div class="prepend-second">nu</div>
                  </b-input-group-text>
                  <b-form-input v-model="nu" type="text" placeholder="Enter Notification URI">
                  </b-form-input>
                  <b-input-group-append>
                    <b-button variant="info" v-on:click="addTextInput('nu')">+</b-button>
                  </b-input-group-append>
                </b-input-group>
                <div v-for="(item, index) in sub.nu" :key="item.index">
                  <b-input-group class="input-label">
                    <b-form-input v-model="sub.nu[index]" type="text" placeholder="Add Notification URI"></b-form-input>
                    <b-input-group-append>
                      <b-button variant="info" v-on:click="deleteTextInput('nu', index)">-</b-button>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"net" | acronymInterpreter}}</div>
                  <div class="prepend-second">net</div>
                </b-input-group-text>
                <b-form-checkbox-group class="checkbox-group" v-model="sub.net">
                  <b-container>
                    <b-row no-gutters>
                      <b-col cols="4">Resource</b-col>
                      <b-col cols="3">
                        <b-form-checkbox value="1">Update<sub>(default)</sub></b-form-checkbox>
                      </b-col>
                      <b-col>
                        <b-form-checkbox value="2">Delete</b-form-checkbox>
                      </b-col>
                    </b-row>
                    <b-row no-gutters> 
                      <b-col cols="4">Direct Child Resource</b-col>
                      <b-col cols="3">
                        <b-form-checkbox value="3">Create</b-form-checkbox>
                      </b-col>
                      <b-col>
                        <b-form-checkbox value="4">Delete</b-form-checkbox>
                      </b-col>
                    </b-row>
                    <b-row no-gutters>
                      <b-col cols="4">Container Resource</b-col>
                      <b-col cols="3">
                        <b-form-checkbox value="5">Retrieve</b-form-checkbox>
                      </b-col>
                      <b-col></b-col>
                    </b-row>
                  </b-container>
                </b-form-checkbox-group>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"nct" | acronymInterpreter}}</div>
                  <div class="prepend-second">nct</div>
                </b-input-group-text>
                <b-form-input v-model="sub.nct" type="text" placeholder="Enter notification content type (default: Modefied Attributes)"></b-form-input>
              </b-input-group>
              <b-input-group>
                <b-input-group-text slot="prepend">
                  <div class="prepend-first">{{"pn" | acronymInterpreter}}</div>
                  <div class="prepend-second">pn</div>
                </b-input-group-text>
                <b-form-input v-model="sub.pn" type="text" placeholder="Enter pending notification"></b-form-input>
              </b-input-group>
            </form>
          </div>
          <div class="format-footer" v-if="selected!=null">
            <p v-if="selected==='ae'" class="help-text">
              <span class="text-danger">*</span> Required Items.
            </p>
            <div class="button-area">
              <b-button varient="success" @click="requestCreation(selected)" >Create</b-button>
            </div>
          </div>
        </div>
      </div>
      <b-modal :title="modal.title" ref="modal" 
        ok-only
        ok-title="Close"
        @ok="reset()"
        :ok-variant="modal.okVariant"
        :header-bg-variant="modal.headerBgVariant"
        :header-text-variant="modal.headerTextVariant"
        :body-text-variant="modal.bodyTextVariant">
        <div class="json-tree">
          <tree-view v-if="modal.contents" :data="modal.contents" :options="{rootObjectKey: responseMessage}"></tree-view>
        </div>
    </b-modal>
    </div>
  </div>
</template>
<script src="../controllers/register.js">
</script>
<style src="../style/register.scss" lang="scss">
</style>

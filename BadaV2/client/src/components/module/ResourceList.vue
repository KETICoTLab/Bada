<template>
  <div class="resource-list">
    <div class="contents">
      <div class="header">
        <div class="title">{{ resource.title }}<span v-if="specification"> Specification</span></div>
        <div class="reset">
          <b-input-group prepend="Search">
            <b-form-input v-model="search"></b-form-input>
            <b-input-group-append>
              <b-button size="sm" variant="info" @click="search=''">Clear</b-button>
            </b-input-group-append>
          </b-input-group>
        </div>
      </div>

      <div class="specific-information">
        <b-breadcrumb class="resource-path">
          <b-breadcrumb-item class="resource-item" v-on:click="listPage('ae')">My Resource</b-breadcrumb-item>
          <b-breadcrumb-item class="resource-item" v-for="item in path" :key="item" v-on:click="setSpecificationByName(item)">{{ item }}</b-breadcrumb-item>
        </b-breadcrumb>
        <div class="specification">
          <div class="specific-item">
            <div class="info-title">
              Resource Information
            </div>
            <div class="no-spec" v-if="!specification">
              No Data
            </div>
            <resource-table :data="detailsData(specification)"></resource-table>
          </div>
          <div class="specific-data">
            <div class="specific-resource">
              <div class="info-title">
                Child Resource List
              </div>
              <div v-if="loading" class="spinner-area">
                <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin fa-2x"></i></span>
              </div>
              <div ref="noSpec" class="no-spec">
                No Data
              </div>
              <div class="child-group" v-if="childResource.container.length">
                <div class="child-title clickable" v-b-toggle.collapse-container>
                  Container
                  <i class="fa fa-ellipsis-h"></i>
                </div>
                <b-collapse visible id="collapse-container">
                  <b-list-group>
                      <b-list-group-item href="#" class="child-resource clickable first" 
                        v-for="child in childResource.container"
                        :key="child.rn"
                        @click="setSpecificationByName(child.rn)">
                       {{ child.rn }}
                      </b-list-group-item>
                  </b-list-group>
                </b-collapse>
              </div>
              <div class="child-group" v-if="childResource.subscription.length">
                <div class="child-title clickable" v-b-toggle.collapse-subscription>
                  Subscription
                  <i class="fa fa-ellipsis-h"></i>
                </div>
                <b-collapse visible id="collapse-subscription">
                  <b-list-group>
                      <b-list-group-item href="#" class="child-resource clickable second" 
                        v-for="child in childResource.subscription"
                        :key="child.rn"
                        @click="detailsModalOpen('sub', child, $event)">
                       {{ child.rn }}
                      </b-list-group-item>
                  </b-list-group>
                </b-collapse>
              </div>
              <div class="child-group" v-if="childResource.contentInstance">
                <div class="child-title">Latest Content Instance</div>
                <b-list-group>
                  <b-list-group-item href="#" class="child-resource clickable third" 
                    v-on:click="detailsModalOpen('cin', childResource.contentInstance, $event)">
                    {{ childResource.contentInstance.rn }}
                  </b-list-group-item>
                </b-list-group>
              </div>
            </div>
            <div v-if="specification.ty==3" class="specific-store-option">
              <div class="info-title">
                Storage Option
              </div>
              <div class="storage-data">
                <b-form-checkbox class="disabled" :disabled=true v-model="specification.timeseries">Timeseries</b-form-checkbox>
                <b-form-checkbox class="disabled" :disabled=true v-model="specification.spatialData">Spatial Data</b-form-checkbox>
              </div>
            </div>
          </div>
        </div>
        <div class="button-area">
          <b-button class="deleteButton" @click="deleteModal(resourceType)">Delete</b-button>
          <b-button class="modifyButton" v-if="specification.ty==3" @click="ModifyStorageOptionModal">Modify Storage Option</b-button>
        </div>
      </div>
      
      <div class="table-area">
        <b-table show-empty responsive small outlined striped hover
          thead-class="header-style"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :items="items" 
          :fields="fields"
          :current-page="currentPage"
          :filter="search"
          :per-page="perPage">
          <template slot="index" slot-scope="data">
            {{data.index + ((currentPage-1) * perPage) + 1}}
          </template>
          <template slot="pi" slot-scope="data">
            <div class="pointer clickable second" v-if="data.item.pi" v-on:click.stop="goSpecification(data.item, $event)">{{ getParentName(data.item.path) }} </div>
          </template>
          <template slot="rn" slot-scope="data">
            <div class="pointer clickable first" @click.stop="goSpecification(data.item, $event)">{{ data.item.rn }}</div>
          </template>
        </b-table>
        <div class="paging-area" v-if="totalRows>perPage">
          <b-pagination class="custum-style danger" :total-rows="totalRows" :per-page="perPage" v-model="currentPage"/>
        </div>
      </div>
    </div>


    <b-modal ref="detailsModal" size="lg" hide-footer>
      <div slot="modal-title" class="modal-title">
        {{ modal.title }}
      </div>
      <div class="modal-resource">
        <resource-table :data="modal.item"></resource-table>
      </div>
      <div class="modal-buttons">
        <b-button v-if="modal.type==='sub'" class="deleteButton" @click="deleteModal('sub')">Delete</b-button>
        <b-button class="closeButton" @click="modalClose('detailsModal')">Close</b-button>
      </div>
    </b-modal>
    <b-modal id="modalConfirm" ref="deleteModal" hide-footer
      ok-title="Delete"
      :ok-variant="modal.okVariant"
      :header-bg-variant="modal.headerBgVariant"
      :header-text-variant="modal.headerTextVariant">
      <div slot="modal-title" class="modal-title">
        {{ modal.title }}
      </div>
      <div class="confirm-modal-body">
        Do you really want to delete resource?
      </div>
      <div class="modal-buttons">
        <b-button class="deleteButton" @click="deleteResource">Delete</b-button>
        <b-button class="closeButton" @click="modalClose('deleteModal')">Cancle</b-button>
      </div>
    </b-modal>
    <b-modal :title="modal.title" ref="returnModal"
        ok-only
        ok-title="Close"
        :ok-variant="modal.okVariant"
        :header-bg-variant="modal.headerBgVariant"
        :header-text-variant="modal.headerTextVariant"
        :body-text-variant="modal.bodyTextVariant"
        @click="listPage(to.params.type);">
        <div class="return-modal-body">
          <div class="return-title">Result: {{ modal.responseMessage }}</div>
          <div  v-if="typeof modal.item==='object'">Resource name : {{ modal.item.rn }}</div>
          <div v-else>{{ modal.item }}</div>
        </div>
    </b-modal>
    <b-modal id="modalConfirm" ref="modifyModal" hide-footer
      ok-title="Modify"
      :ok-variant="modal.okVariant"
      :header-bg-variant="modal.headerBgVariant"
      :header-text-variant="modal.headerTextVariant">
      <div slot="modal-title" class="modal-title">
        {{ modal.title }}
      </div>
      <div class="confirm-modal-body">
        <b-form-checkbox v-model="storageOption.timeseries" value="true" unchecked-value="false">Timeseries</b-form-checkbox>
        <b-form-checkbox v-model="storageOption.spatialData" value="true" unchecked-value="false">Spatial Data</b-form-checkbox>
      </div>
      <div class="modal-buttons">
        <b-button class="deleteButton" @click="ModifyStorageOption">Modify</b-button>
        <b-button class="closeButton" @click="modalClose('modifyModal')">Cancle</b-button>
      </div>
    </b-modal>
  </div>
</template>
<script src="../../controllers/resource-list.js">
</script>
<style src="../../style/resource-list.scss" lang="scss">
</style>

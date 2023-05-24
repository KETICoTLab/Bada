<template>
  <div class="configuration">
    <div class="contents">
      <div class="title">
        <i class="fa fa-md fa-fw fa-cog"/>
        <div class="text">Configuration</div>
      </div>
      <div class="input-form">
        <b-card title="Bada Platform">
          <b-container class="card-text">
            <div class="config-table">
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="bada.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <div class="warning-text"><span class="text-danger">* </span>If you change the port number, you can access after 3~5 minutes.</div>
              </b-row>
            </div>
          </b-container>
        </b-card>
        <b-card title="Database">
          <b-container class="sql-card">
            <div class="sub-title">MySQL</div>
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col class="value"><b-form-input class="inputarea" v-model="database.mysql.host"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="database.mysql.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>User</label></b-col>
                <b-col><b-form-input v-model="database.mysql.user"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Password</label></b-col>
                <b-col><b-form-input type="password" v-model="database.mysql.password"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Database</label></b-col>
                <b-col><b-form-input v-model="database.mysql.database"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('sql')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
          <b-container class="timeseries-card">
            <div class="sub-title">Influx</div>
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col class="value"><b-form-input class="inputarea" v-model="database.influx.host"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="database.influx.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Database</label></b-col>
                <b-col><b-form-input v-model="database.influx.database"></b-form-input></b-col>
              </b-row>
              <!-- <b-row>
                <b-col><label>User</label></b-col>
                <b-col><b-form-input v-model="database.influx.username"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Password</label></b-col>
                <b-col><b-form-input type="password" v-model="database.influx.password"></b-form-input></b-col>
              </b-row> -->
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('timeseries')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
          <b-container class="spatialdata-card">
            <div class="sub-title">PostgreSQL</div>
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col class="value">
                  <b-form-input class="inputarea" v-model="database.postgres.host"></b-form-input>
                </b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="database.postgres.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>user</label></b-col>
                <b-col><b-form-input v-model="database.postgres.user"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Password</label></b-col>
                <b-col><b-form-input type="password" v-model="database.postgres.password"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Database</label></b-col>
                <b-col><b-form-input v-model="database.postgres.database"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('spatialdata')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
          <b-container class="redis-card">
            <div class="sub-title">Redis</div>
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col class="value">
                  <b-form-input class="inputarea" v-model="database.redis.host"></b-form-input>
                </b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="database.redis.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Password</label></b-col>
                <b-col><b-form-input type="password" v-model="database.redis.password"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('Redis')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
        </b-card>
        <b-card title="Mobius">
          <b-container class="mobius-card">
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col><b-form-input class="inputarea" v-model="mobius.host"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="mobius.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>CSEBase</label></b-col>
                <b-col><b-form-input class="inputarea" v-model="mobius.cb"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('mobius')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
        </b-card>
        <b-card title="Kafka">
          <b-container class="kafka-card">
            <div class="config-table">
              <b-row>
                <b-col><label>Host</label></b-col>
                <b-col><b-form-input class="inputarea" v-model="kafka.host"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col><label>Port</label></b-col>
                <b-col><b-form-input v-model="kafka.port"></b-form-input></b-col>
              </b-row>
              <b-row>
                <b-col class="text-right">
                  <span class="connection-icon-area">
                    <span class="spinner-icon"><i class="fas fa-circle-notch fa-spin"></i></span>
                    <span class="success-icon">Success <i class="far fa-check-circle"></i></span>
                    <span class="fail-icon">Fail <i class="far fa-times-circle"></i></span>
                  </span>
                </b-col>
                <b-col>
                  <b-button size="sm" class="connection-button" variant="outline-info" v-on:click="connectionTest('kafka')" >
                    Connection Test
                  </b-button>
                </b-col>
              </b-row>
            </div>
          </b-container>
        </b-card>

        <div class="button-area">
          <b-button v-on:click="modalOpen()">
            Cancel
          </b-button>
          <b-button v-on:click="modalOpen('save')">
            Save
          </b-button>
        </div>
      </div>

      <b-modal ref="confirmModal"
          :ok-variant="modal.okVariant"
          :header-bg-variant="modal.headerBgVariant"
          :header-text-variant="modal.headerTextVariant"
          :body-bg-variant="modal.bodyBgVariant"
          :body-text-variant="modal.bodyTextVariant"
          @ok="modal.handle_ok">
        <div slot="modal-title">
          {{ modal.title }}
        </div>
        <p>{{ modal.content }}</p>
      </b-modal>
    </div>
  </div>
  
</template>
<script src="../controllers/configuration.js">
</script>
<style src="../style/configuration.scss" lang="scss" scoped>
</style>

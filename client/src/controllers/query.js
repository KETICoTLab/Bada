import Util from "./../util";

export default {
  name: "Query",
  data() {
    return {
      connectorFields: [],
      connector: [],
      schema: [],
      sensorlist: ["sensor1", "sensor2"],
      spatialsensor: {
        redisdata: [],
        ae: [],
        cnt: []
      },
      searchinput: "",
      parsedsensor: {
        data: [["Application Entity", "Container"]],
        header: "row",
        showCheck: true,
        enableSearch: true,
        header: "row",
        border: true,
        stripe: true,
        sort: [0, 1],
        height: 300
      },
      aeList: {
        data: [],
        header: "row",
        showCheck: true,
        enableSearch: true,
        header: "row",
        border: true,
        stripe: true,
        sort: [0],
        height: 300
      },
      createTableTag: false,
      currentSensor: "",
      userQuery: "",
      selectOption: [
        { value: "anomalyDetection", text: "이상 상황 감지" },
        { value: "windowAggregation", text: "기간별 디바이스 전달" },
        { value: "geoFence", text: "geofencing" },
        { value: "timesync", text: "디바이스 시간 동기화" }
      ],
      selected: null,
      anomalyDetection: {
        sensor: null,
        column: null,
        time: null,
        inequalitySign: null,
        comparisonValue: null,
        count: null,
        storageMethod: null,
        option: {
          inequalityOption: ["less then", "equal", "greater then"],
          storageOption: ["Timeseries", "Spatio", "Http"]
        }
      },
      timesync: { sensor: [], groupName: null },
      windowAggregation: {
        sensor: null,
        column: null,
        time: null,
        aggregationFunction: [],
        storageMethod: null,
        option: {
          aggregationOption: ["SUM", "NORMAL", "AVG", "MIN", " MAX"],
          storageOption: ["Timeseries", "Spatio", "Http"]
        }
      },
      geoFence: {
        ae: null,
        cnt: null,
        fenceName: null,
        polygon: [
          { lat: null, lng: null },
          { lat: null, lng: null },
          { lat: null, lng: null }
        ]
      },
      columnList: [],
      variants: Util.variants,
      modal: {
        contents: "",
        title: "Success",
        headerBgVariant: Util.variants.success,
        headerTextVariant: Util.variants.light,
        bodyBgVariant: "",
        bodyTextVariant: Util.variants.outlineSuccess,
        okVariant: Util.variants.outlineSuccess
      },
      responseMessage: "",
      fieldState: null
    }; // lat,lon
    // { value: "cin", text: "Content Instance", disabled: true},
  },
  methods: {
    createSpatialSensor() {
      // console.log("Create Spatial Sensor");
      this.$http
        .post("/streammanagement/createSensor", {
          sensorName: "spatial"
        })
        .then(result => {
          // console.log("Create Sensor Table : ", result);
        });
      // console.log("Current Sensor: ", this.currentSensor);
    },
    getQueryData(index) {
      return this.queryData[index];
    },
    getSensorList() {
      this.$http.get("/streammanagement/sensors").then(result => {
        let refineTopic = [];
        let aeList = new Set();
        aeList.add("Application Entity");
        /**
         * [{"@type":"kafka_topics","statementText":"SHOW TOPICS;","topics":[{"name":"default_ksql_processing_log","replicaInfo":[1]},{"name":"refine.kafka_ae.t_cnt","replicaInfo":[1]},{"name":"refine.spatial","replicaInfo":[1]},{"name":"refine.kafka_ae.ts_cnt","replicaInfo":[1]},{"name":"timeseries","replicaInfo":[1]}],"warnings":[]}]
         */
        let rawTopicData = JSON.parse(result.data)[0];
        let topicList = rawTopicData.topics;
        topicList.forEach((element, index) => {
          let resources = element.name.split(".");
          if (resources[0] === "refine") {
            if (resources[1] === "spatial") {
              refineTopic.push(`${resources[1]}`);
            } else {
              refineTopic.push(`${resources[1]}/${resources[2]}`);
              this.parsedsensor.data.push([resources[1], resources[2]]);
              aeList.add(resources[1]);
            }
          }
        });
        // console.log(refineTopic);
        // console.log(this.parsedsensor);
        aeList.forEach(element => {
          this.aeList.data.push([element]);
        });
        this.sensorlist = refineTopic;
        return refineTopic;
      });
    },
    filteredList() {
      return this.sensorlist.filter(sensor =>
        sensor.toLowerCase().includes(this.searchinput.toLowerCase())
      );
    },
    getConnectors() {
      let connector = [];
      let state = "";
      let data = "";
      this.$http
        .get("/streammanagement/connectors")
        .then(result => {
          if (
            result.data == null ||
            result.data == undefined ||
            result.data == ""
          ) {
            return;
          } else {
            console.log(result.data)
            let newResult = result.data.map(({ className, ...rest }) => rest);
            console.log(newResult)

            for (let i = 0; i < newResult.length; i++) {
              data = newResult[i];
              state = data.state.split(" ")[0];
              if (state == "RUNNING") {
                data["_cellVariants"] = { state: "success" };
                connector.push(data);
              } else {
                data["_cellVariants"] = { state: "warning" };
                connector.push(data);
              }
            }
            this.connector = connector;
            this.connectorFields = Object.keys(newResult[0]);
          }
        })
        .catch(err => {
          console.log(err);
        });
    },
    getSchema(sensorName) {
      this.createTableTag = false;
      this.currentSensor = "";

      let schema = [];

      schema = [];
      this.$http
        .get("/streammanagement/schema/" + sensorName)
        .then(result => {
          if (
            result.data === null ||
            result.data === undefined ||
            result.data === ""
          ) {
            // No exist KSQLDB Table
            this.createTableTag = true;
            this.currentSensor = sensorName;
            // showCreateButton(sensorName);
          } else {
            //exist KSQLDB Table
            schema.push(result.data);
            this.schema = schema;
            this.columnList = schema;

            // console.log("Schema : ", schema);
          }
          console.log("VALUE 0 : ", this.schema);
          // resolve(schema);
          return schema;
        })
        .catch(err => {
          console.log(err);
        });
      // init value
      this.schema = [];
    },
    createSensorTable() {
      // let modal = { title: "", content: {} };
      this.$http
        .post("/streammanagement/createSensor", {
          sensorName: this.currentSensor
        })
        .then(result => {
          // this.responseMessage = "Result";
          // modal.title = "Success";
          // modal.content = result.data;
          this.getSchema(this.currentSensor);
        });
      // .then(() => {
      //   this.showModal(modal.title, modal.content);
      // })
      // .catch(err => {
      //   modal.title = "fail";
      //   modal.content = err.response.data;

      //   console.log("error", err);
      //   this.responseMessage = err.response.status;
      //   this.showModal(modal.title, modal.content);
      // });
      // console.log("Current Sensor: ", this.currentSensor);
    },

    submitQuery(query) {
      let modal = { title: "", content: {} };
      console.log(query);
      this.$http
        .post("/streammanagement/query", {
          query: query
        })
        .then(result => {
          console.log("Create Query : ", result);
          this.responseMessage = "Result";
          modal.title = "Success";
          modal.content = result.data;
        })
        .then(() => {
          this.showModal(modal.title, modal.content);
        })
        .catch(err => {
          modal.title = "fail";
          modal.content = err.response.data;

          console.log("error", err);
          this.responseMessage = err.response.status;
          this.showModal(modal.title, modal.content);
        });
    },
    showQueryDetails(data) {
      let queryID = data.queryID;
      if (queryID in this.queryDetails) {
        let sinkTable = JSON.parse(this.queryDetails[queryID]);
        this.selected = sinkTable;
        this.modal.title = "Query Details";
        this.modal.contents = JSON.parse(this.queryDetails[queryID]);
        this.modal.headerBgVariant = this.variants.info;
        this.modal.okVariant = this.variants.outlineDanger;
        this.$refs.queryDetailModal.show();
      }
    },
    showModal(status, data) {
      if (status === "fail") {
        this.modal.title = "Failed";
        this.modal.headerBgVariant = this.variants.danger;
        this.modal.bodyTextVariant = this.variants.outlineDanger;
        this.modal.okVariant = this.variants.outlineDanger;
      }

      this.modal.contents = data;
      this.$refs.modal.show();
    },
    getRedisStorage() {
      let aeList = [];
      this.$http.get("/streammanagement/redisStorage").then(result => {
        // console.log(result.data);
        this.spatialsensor.redisdata = result.data;
        if (result.data.length > 0) {
          result.data.forEach(element => {
            aeList.push(element.ae);
          });

          this.spatialsensor.ae = [...new Set(aeList)];
        }

        // console.log(this.spatialsensor);
      });
    },
    selectAE(value) {
      let redisdata = this.spatialsensor.redisdata;
      let cntList = [];
      if (redisdata.length > 0) {
        redisdata.forEach(element => {
          if (element.ae === value) {
            cntList.push(element.cnt);
          }
        });
        this.spatialsensor.cnt = cntList;
      }

    },
    showQueryModal(data) {
      console.log(data);
      if (data === "anomalyDetection") {
        this.modal.title = "이상 상황 여부 탐색";
      } else if (data === "windowAggregation") {
        this.modal.title = "기간별 디바이스 전달";
      } else if (data === "geoFence") {
        this.getRedisStorage();
        this.modal.title = "geofence 정보 입력";
      } else if (data === "timesync") {
        this.modal.title = "디바이스 시간 동기화";
      }
      this.selected = data;
      this.modal.contents = data;
      this.$refs.queryModal.show();
    },
    reset() {
      Object.assign(this.$data, this.$options.data.call(this));
      this.getSensorList();
    },
    selectSensor(value) {
      // console.log(value);

      let schema = [];
      let resultSchema = [];
      this.$http
        .get("/streammanagement/schema/" + value)
        .then(result => {
          if (
            result.data === null ||
            result.data === undefined ||
            result.data === ""
          ) {
            // No exist KSQLDB Table
            // SHOW MODAL
            console.log("NO TABLE");
          } else {
            //exist KSQLDB Table
            schema.push(result.data);
            for (var idx in schema[0]) {
              resultSchema.push(idx);
            }
            this.columnList = resultSchema;

            // console.log("Schema : ", schema);
          }
          console.log("THIS COLUMN LIST : ", this.columnList);
          return schema;
        })
        .catch(err => {
          console.log(err);
        });

      // init value
      this.columnList = [];

      // console.log(this.windowAggregation.sensor);
    },
    /**
     * for create function modal
     */
    checkFormValidity() {
      const valid = this.$refs.form.checkValidity();
      this.fieldState = valid;
      return valid;
    },
    resetModal() {
      // delete input data
      this.fieldState = null;

      this.anomalyDetection.sensor = null;
      this.anomalyDetection.column = null;
      this.anomalyDetection.time = null;
      this.anomalyDetection.inequalitySign = null;
      this.anomalyDetection.comparisonValue = null;
      this.anomalyDetection.count = null;
      this.anomalyDetection.storageMethod = null;

      this.timesync.groupName = null;
      this.timesync.sensor = [];

      this.columnList = [];

      this.windowAggregation.sensor = null;
      this.windowAggregation.column = null;
      this.windowAggregation.time = null;
      this.windowAggregation.aggregationFunction = null;
      this.windowAggregation.storageMethod = null;

      this.spatialsensor.ae = [];
      this.spatialsensor.cnt = [];
      this.geoFence.ae = null;
      this.geoFence.cnt = null;
      this.geoFence.fenceName = null;
      this.geoFence.polygon = [
        { lat: null, lng: null },
        { lat: null, lng: null },
        { lat: null, lng: null }
      ];
    },
    handleOk(bvModalEvent) {
      // console.log(selected)
      // Prevent modal from closing
      bvModalEvent.preventDefault();
      // // Trigger submit handler
      this.handleSubmit();
    },
    handleSubmit() {
      let modal = { title: "", content: {} };
      // Exit when the form isn't valid
      if (!this.checkFormValidity()) {
        return;
      }
      let submitData = null;
      let selectedData = null;
      if (this.selected === "anomalyDetection") {
        submitData = this.anomalyDetection;
        this.$http
          .post("/streammanagement/function/anomalyDetection", {
            data: submitData
          })
          .then(result => {
            console.log("Create Query : ", result.data);
            this.responseMessage = "Result";
            modal.title = "Success";
            modal.content = result.data;
          })
          .then(() => {
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          })
          .catch(err => {
            console.log("ERROR : ", err);
            modal.title = "fail";
            modal.content = err.response.data;
            console.log("error", err);
            this.responseMessage = err.response.status;
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          });
      } else if (this.selected === "timesync") {
        submitData = this.timesync;

        selectedData = { ...submitData };
        selectedData.sensor = [this.parsedsensor.data[0]];

        this.parsedsensor.data.forEach(element => {
          console.log(element[0], submitData.sensor[1]);
          if (element[0] == submitData.sensor[1]) {
            selectedData.sensor.push(element);
          }
        });

        this.checkSchema(selectedData.sensor).then(schema => {
          if (schema !== false) {
            console.log(schema);
            this.$http
              .post("/streammanagement/function/timesync", {
                data: selectedData,
                schema: schema
              })
              .then(result => {
                console.log("Create Query : ", result);
                this.responseMessage = "Result";
                modal.title = "Success";
                modal.content = result.data;
              })
              .then(() => {
                this.showModal(modal.title, modal.content);
              })
              .catch(err => {
                console.log(err);
                modal.title = "fail";
                modal.content = err.response.data;
                console.log("error", err);
                this.responseMessage = err.response.status;
                // this.$bvModal.hide("modal-prevent-closing");
                this.showModal(modal.title, modal.content);
              });
          } else {
            modal.title = "fail";
            modal.content = "Select sensors only have same schema";
            this.showModal("fail", "Select sensors only have same schema");
          }
        });
      } else if (this.selected === "windowAggregation") {
        submitData = this.windowAggregation;
        console.log(submitData);
        this.$http
          .post("/streammanagement/function/windowAggregation", {
            data: submitData
          })
          .then(result => {
            console.log("Create Query : ", result);
            this.responseMessage = "Result";
            modal.title = "Success";
            modal.content = result.data;
          })
          .then(() => {
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          })
          .catch(err => {
            console.log(err);
            modal.title = "fail";
            modal.content = err.response.data;
            console.log("error", err);
            this.responseMessage = err.response.status;
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          });
      } else if (this.selected === "geoFence") {
        submitData = this.geoFence;
        console.log(submitData);
        this.$http
          .post("/streammanagement/function/geoFence", {
            data: submitData
          })
          .then(result => {
            console.log("Create Query : ", result);
            this.responseMessage = "Result";
            modal.title = "Success";
            modal.content = result.data;
          })
          .then(() => {
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          })
          .catch(err => {
            console.log(err);
            modal.title = "fail";
            modal.content = err.response.data;
            console.log("error", err);
            this.responseMessage = err.response.status;
            // this.$bvModal.hide("modal-prevent-closing");
            this.showModal(modal.title, modal.content);
          });
      }
      // // Push the name to submitted names
      // this.submittedNames.push(this.name);
      // // Hide the modal manually
      // this.$nextTick(() => {
      //   this.$bvModal.hide("modal-prevent-closing");
      // });
    },
    async checkSchema(rows) {
      let modal = { title: "", content: {} };
      let schemas = [];
      rows.shift();
      let getschema = new Promise((resolve, reject) => {
        rows.forEach((element, index) => {
          this.$http
            .get("/streammanagement/schema/" + element[0] + "/" + element[1])
            .then(result => {
              if (
                result.data === null ||
                result.data === undefined ||
                result.data === ""
              ) {
                // No exist KSQLDB Table
                console.log("NO KSQLDB SCHEMA");
                this.responseMessage = "Result";
                modal.title = "Fail";
                modal.content = "Create sensor table first";
                this.showModal("fail", "Create sensor table first");
              } else {
                //exist KSQLDB Table
                schemas.push(JSON.stringify(result.data));
                if (schemas.length === rows.length) {
                  resolve(schemas);
                }
              }
            })
            .catch(err => {
              console.log(err);
              reject(err);
            });
        });
      });
      return new Promise((resolve, reject) => {
        getschema.then(value => {
          const allEqual = arr => arr.every(v => v === arr[0]);
          if (allEqual(value)) {
            resolve(value[0]);
          } else {
            resolve(false);
          }
        });
      });
    },
    onSelect(isChecked, index, data) {
      console.log("onSelect: ", isChecked, index, data);
      console.log("Checked Data:", this.$refs.table.getCheckedRowDatas(true));
    },
    onGroupSelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      // console.log("onGSelectionChange: ", checkedDatas,checkedIndexs,checkedNum);
      this.grouping.sensor = checkedDatas;
    },
    onTimeSelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      // console.log("onTSelectionChange: ", checkedDatas,checkedIndexs,checkedNum);
      this.timesync.sensor = checkedDatas;
    },
    addTextInput(attr) {
      this["geoFence"][attr].push({ lat: null, lng: null });
    },
    deleteTextInput(attr, index) {
      this["geoFence"][attr].splice(index, 1);
    }
  },
  created() {
    this.getSensorList();
    this.getConnectors();
    this.createSpatialSensor();
  }
};

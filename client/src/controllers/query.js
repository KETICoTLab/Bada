import Util from "./../util";

export default {
  name: "Query",
  data() {
    return {
      connectorFields: [],
      connector: [],
      schema: [],
      sensorlist: [],
      // for AD, WA
      timeseriesSensor: {
        data: [],
        header: "row",
        showCheck: true,
        enableSearch: true,
        border: true,
        stripe: true,
        sort: [0],
        height: 300
      },
      // for GF
      spatialSensor: {
        data: [],
        header: "row",
        showCheck: true,
        enableSearch: true,
        border: true,
        stripe: true,
        sort: [0],
        height: 300
      },
      // for TS
      aeList: {
        data: [],
        header: "row",
        showCheck: true,
        enableSearch: true,
        border: true,
        stripe: true,
        sort: [0],
        height: 300
      },
      cntList: {
        data: [],
        header: "row",
        showCheck: true,
        enableSearch: true,
        border: true,
        stripe: true,
        sort: [0],
        height: 300
      },
      searchinput: "",
      createTableTag: false,
      currentSensor: "",
      userQuery: "",
      selectOption: [
        { value: "anomalyDetection", text: "이상 상황 감지" },
        { value: "windowAggregation", text: "기간별 디바이스 전달" },
        { value: "geoFence", text: "geofencing" },
        { value: "timesync-join", text: "디바이스 시간 동기화 (JOIN)" },
        { value: "timesync-union", text: "디바이스 시간 동기화 (UNION)" }
      ],
      selected: null,
      anomalyDetection: {
        queryName : "",
        sensors: [],
        column: null,
        time: null,
        inequalitySign: null,
        comparisonValue: null,
        count: null,
        option: {
          inequalityOption: ["less then", "equal", "greater then"]
        }
      },
      timesync: { ae: null, containers: [], groupName: null },
      windowAggregation: {
        queryName: "",
        sensors: [],
        column: null,
        time: null,
        aggregationFunction: [],
        option: {
          aggregationOption: ["SUM", "AVG", "MIN", "MAX"]
        }
      },
      geoFence: {
        sensors: [],
        queryName: null,
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
    getQueryData(index) {
      return this.queryData[index];
    },
    
    getSensorList() {
      this.$http.get("/streammanagement/sensors").then(result => {
        let sensorList = [];
        let timeseriesTopic = [['sensor']];
        let spatialTopic = [['sensor']];
        let aeArray = [];
        let aeList = [['applicationEntity']];
        /**
         * [{"@type":"kafka_topics","statementText":"SHOW TOPICS;","topics":[{"name":"default_ksql_processing_log","replicaInfo":[1]},{"name":"refine.kafka_ae.t_cnt","replicaInfo":[1]},{"name":"refine.spatial","replicaInfo":[1]},{"name":"refine.kafka_ae.ts_cnt","replicaInfo":[1]},{"name":"timeseries","replicaInfo":[1]}],"warnings":[]}]
         */
        if (JSON.parse(result.data)[0].topics) {
          let rawTopicData = JSON.parse(result.data)[0];
          let topicList = rawTopicData.topics;
          topicList.forEach((element, index) => {
            let resources = element.name.split(".");
            let refineIndex = element.name.indexOf(".")
            let firstIndex = element.name.indexOf(".", refineIndex + 1);
            let secondIndex = element.name.indexOf(".", firstIndex + 1);
            let ae, cnt;
            if (resources[0] === "refine") {
              if (resources[1] === "spatial") {
                ae = element.name.substring(firstIndex + 1, secondIndex);
                cnt = element.name.substring(secondIndex + 1);
                // spatialTopic.push(`spatial_${ae}_${cnt}`);
                spatialTopic.push([`spatial_${ae}_${cnt}`]);
                sensorList.push({ type: "spatial", ae: ae, cnt: cnt });
              } else {
                ae = element.name.substring(refineIndex + 1, firstIndex);
                cnt = element.name.substring(firstIndex + 1);
                timeseriesTopic.push([`${ae}_${cnt}`]);
                sensorList.push({ type: "timeseries", ae: ae, cnt: cnt });
                // save ae name list
                aeArray.push(ae);
                
              }
            }
          });
        }

        // input parsed data to this.data
        this.timeseriesSensor.data = timeseriesTopic;
        this.spatialSensor.data = spatialTopic;
        aeArray = [...new Set(aeArray)];
        aeArray.forEach((element) => {
          aeList.push([element]);
        })
        this.aeList.data = aeList;
        this.sensorlist = sensorList;
        return sensorList;
      });
    },
    filteredList() {
      return this.sensorlist.filter(sensor =>
        sensor.ae.toLowerCase().includes(this.searchinput.toLowerCase()) || 
          sensor.cnt.toLowerCase().includes(this.searchinput.toLowerCase())
      );
    },
    removeDuplicates(arr) { 
      return arr.filter(
        (thing, index, self) =>
          index === self.findIndex((t) => t.ae === thing.ae && t.cnt === thing.cnt)
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
            // console.log(result.data)
            let newResult = result.data.map(({ className, ...rest }) => rest);
            // console.log(newResult)

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
      let name = "";
      if (sensorName.type == 'timeseries') {
        name = `${sensorName.ae}_${sensorName.cnt}`
      } else {
        name = `spatial_${sensorName.ae}_${sensorName.cnt}`
      }
      this.$http
        .get("/streammanagement/schema/" + name)
        .then(result => {
          if (
            result.data === null ||
            result.data === undefined ||
            result.data === ""
          ) {
            // No exist KSQLDB Table
            this.createTableTag = true;
            this.currentSensor = sensorName;
          } else {
            //exist KSQLDB Table
            schema.push(result.data);
            this.schema = schema;
            this.columnList = schema;

          }
          // console.log("VALUE 0 : ", this.schema);
          return schema;
        })
        .catch(err => {
          console.log(err);
        });
      // init value
      this.schema = [];
    },
    createSensorTable() {
      this.$http
        .post("/streammanagement/createSensor", {
          sensorName: this.currentSensor
        })
        .then(result => {
          this.getSchema(this.currentSensor);
        });
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
        this.modal.title = "geofence 정보 입력";
      } else if (data === "timesync-join") {
        this.modal.title = "디바이스 시간 동기화 (JOIN)";
      } else if (data === "timesync-union") {
        this.modal.title = "디바이스 시간 동기화 (UNION)"
      }
      this.selected = data;
      this.modal.contents = data;
      this.$refs.queryModal.show();
    },
    reset() {
      Object.assign(this.$data, this.$options.data.call(this));
      this.getSensorList();
    },
    selectSensor(sensors) {
      // let sensors = value.slice(1);
      let columnSet = [];

      //Check Schema
      const getSchemas = new Promise((resolve, reject) => {
        let schemas = [];
        sensors.forEach((sensor, index) => {
          // let sensorname = element;
          this.$http
            .get("/streammanagement/schema/" + sensor)
            .then(result => {
              //exist KSQLDB Table
              schemas.push(result.data);
              if (schemas.length == sensors.length) {
                resolve(schemas);
              }
              // return schemas;
            })
            .catch(err => {
              reject(err);
            });
        });
      });

      getSchemas
        .then((result) => {
          let checkSchema = true;
          console.log("THIS IS SCHEMAS : ", result);
          for (let i = 1; i < result.length; i++){
            if (JSON.stringify(result[i - 1]) !== JSON.stringify(result[i])) {
              checkSchema = false;
              break;
            }
          }
          // every schema is same
          if (checkSchema) {
            Object.keys(result[0]).forEach((key) => {
              columnSet.push({ text: key, value: { column: key, type: result[0][key] } });
            })

            // this.columnList = Object.keys(result[0]);
            this.columnList = columnSet;

            console.log("THIS COLUMN LIST : ", this.columnList);
          } else {
            this.columnList = [{text: "Select sensors with the same schema", disabled: "disabled"}];
          }
        })
        .catch((err) => {
          console.log(err);
        });
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

      this.anomalyDetection.queryName = "";
      this.anomalyDetection.sensors = [];
      this.anomalyDetection.column = null;
      this.anomalyDetection.time = null;
      this.anomalyDetection.inequalitySign = null;
      this.anomalyDetection.comparisonValue = null;
      this.anomalyDetection.count = null;

      this.timesync.ae = null;
      this.timesync.groupName = null;
      this.timesync.containers = [];

      this.columnList = [];

      this.windowAggregation.queryName = "";
      this.windowAggregation.sensors = [];
      this.windowAggregation.column = null;
      this.windowAggregation.time = null;
      this.windowAggregation.aggregationFunction = null;

      // this.spatialsensor.ae = [];
      // this.spatialsensor.cnt = [];

      this.geoFence.sensors = [];
      this.geoFence.fenceName = null;
      this.geoFence.polygon = [
        { lat: null, lng: null },
        { lat: null, lng: null },
        { lat: null, lng: null }
      ];
      if (this.$refs.table) {
        this.$refs.table.setAllRowChecked(false);
      }
      if (this.$refs["ae-table"]) {
        this.$refs["ae-table"].setAllRowChecked(false);
      }
      if (this.$refs["cnt-table"]) {
        this.$refs["cnt-table"].setAllRowChecked(false);
      }

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
      } else if (this.selected === "timesync-join") {
        let sensors = [];
        let ae = this.timesync.ae[0];
        let containers = this.timesync.containers;
        // ae 중복 선택하는 경우
        if (ae == null) {
          modal.title = "fail";
          modal.content = "Select only one application entity";
          // this.responseMessage = "Select only one application entity";
          this.showModal(modal.title, modal.content);
          return;
        }

        // container 선택 안한 경우 -> 전체 선택으로
        if (containers.length == 0) {
          this.sensorlist.forEach((element) => {
            if (element.type === "timeseries" && element.ae === ae) {
              sensors.push(`${element.ae}_${element.cnt}`);
            }
          })
        } else {
          containers.forEach((element) => {
            sensors.push(`${ae}_${element}`);
          })
        }
        submitData = { groupName : this.timesync.groupName }

        // 센서별 스키마 저장 후 create query
        this.checkSchema(sensors).then(result => {
          submitData.sensors = result;
          console.log("submitdata : ", submitData);

          this.$http
            .post("/streammanagement/function/timesync-join", {
              data: submitData
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
        });
      } else if (this.selected === "timesync-union") { 
        submitData = this.timesync;

        selectedData = { ...submitData };
        selectedData.sensors = [this.parsedsensor.data[0]];

        this.parsedsensor.data.forEach(element => {
          console.log(element[0], submitData.sensors[1]);
          if (element[0] == submitData.sensors[1]) {
            selectedData.sensors.push(element);
          }
        });

        this.checkSchema(selectedData.sensors).then(schema => {
          if (schema !== false) {
            console.log(schema);
            this.$http
              .post("/streammanagement/function/timesync-union", {
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
    async checkSchema(sensors) {
      // let modal = { title: "", content: {} };
      let sensorWithSchema = {}; // sensor : schema key value
      return new Promise((resolve, reject) => {
        sensors.forEach((sensor, index) => {
          this.$http
            .get("/streammanagement/schema/" + sensor)
            .then(result => {
              if (
                result.data === null ||
                result.data === undefined ||
                result.data === ""
              ) {
                // No exist KSQLDB Table
                console.log("NO KSQLDB SCHEMA");
                // this.responseMessage = "Result";
                // modal.title = "Fail";
                // modal.content = "Create sensor table first";
                this.showModal("fail", `Create sensor table first : ${sensor} `);
              } else {
                // console.log(result);
                //exist KSQLDB Table
                sensorWithSchema[sensor] = result.data;
                if (index + 1 === sensors.length) {
                  resolve(sensorWithSchema);
                }
              }
            })
            .catch(err => {
              console.log(err);
              reject(err);
            });
        });
      });
    },
    async onTSSelect(isChecked, index, data) {
      console.log(isChecked, index, data);
      if (isChecked) {
        this.timesync.ae = data;

        let cntData = [['container']];
        this.sensorlist.forEach((element) => {
          if (element.type === "timeseries" && element.ae === data[0]) {
            cntData.push([element.cnt]);
          }
        })
        this.cntList.data = cntData;
        
      } else {
        this.timesync.ae = null;
      }

    },
    onTSReselectAE() {
      this.timesync.ae = null;
      this.cntList.data = [];
      if (this.$refs["ae-table"]) {
        this.$refs["ae-table"].setAllRowChecked(false);
      }
      if (this.$refs["cnt-table"]) {
        this.$refs["cnt-table"].setAllRowChecked(false);
      }
    },
    onTSSelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      console.log("onTSelectionChange: ", checkedDatas,checkedIndexs,checkedNum);
      let data = this.$refs["cnt-table"].getCheckedRowDatas(false).flat();
      this.timesync.containers = data;      
    },
    onADSelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      let data = this.$refs["table"].getCheckedRowDatas(false).flat();
      this.anomalyDetection.sensors = data;
      this.selectSensor(data);
    },
    onWASelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      let data = this.$refs["table"].getCheckedRowDatas(false).flat();
      this.windowAggregation.sensors = data;
      this.selectSensor(data)
    },
    onGFSelectionChange(checkedDatas, checkedIndexs, checkedNum) {
      let data = this.$refs["table"].getCheckedRowDatas(false).flat();
      this.geoFence.sensors = data;
    },
    addTextInput(attr) {
      this["geoFence"][attr].push({ lat: null, lng: null });
    },
    deleteTextInput(attr, index) {
      this["geoFence"][attr].splice(index, 1);
    },
  },
  created() {
    this.getSensorList();
    this.getConnectors();
  }
};

import Util from "./../util";

export default {
  name: "Querylist",
  data() {
    return {
      createTableTag: false,
      currentSensor: "",
      queryData: [],
      queryDetails: {},
      queryResults: [],
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
      }
    };
  },
  methods: {
    getQueryList() {
      this.$http
        .get("/streammanagement/queries")
        .then(result => {
          let querydata = [];
          Object.keys(result.data).forEach(queryID => {
            querydata.push({
              queryID: queryID,
              queryName: result.data[queryID]
            });
          });
          this.queryData = querydata;
          // this.queryData = result.data;
        })
        .catch(err => {
          console.log(err);
        });
    },
    getQueryDetails() {
      this.$http
        .get("/streammanagement/queryDetails")
        .then(result => {
          this.queryDetails = result.data;
          // this.queryData = result.data;
        })
        .catch(err => {
          console.log(err);
        });
    },
    terminateQuery(data) {
      let modal = { title: "", content: {} };
      let queryID = data.id;
      let sinkTable = data.sinks[0];
      let sinkKafkaTopic = data.sinkKafkaTopics[0];
      this.$http
        .delete("/streammanagement/query", {
          params: {
            queryID: queryID,
            sinkTable: sinkTable,
            sinkKafkaTopic: sinkKafkaTopic
          }
        })
        .then(result => {
          // console.log(result);
          this.responseMessage = "Result";
          modal.title = "Success";
          modal.content = result.data;
          this.getQueryList();
          this.getQueryDetails();
        })
        .then(() => {
          this.showModal(modal.title, modal.content);
        })
        .catch(err => {
          modal.title = "fail";
          modal.content = err;

          console.log("error", err);
          this.responseMessage = err;
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
    showQueryResults(data) {
      console.log(data);
      let queryID = data.queryID;
      if (queryID in this.queryDetails) {
        let sinkTable = JSON.parse(this.queryDetails[queryID]).sinks[0];
        this.$http
          .get("/streammanagement/queryResults", {
            params: { sinkTable: sinkTable }
          })
          .then(result => {
            console.log(result.data)
            let resultData = [];
            result.data.forEach((element) => {
              let data = element;
              if (data["GEO_CONTAINED"] == false) {
                data["_cellVariants"] = { GEO_CONTAINED: "warning" };
                resultData.push(data);
              } else {
                data["_cellVariants"] = { GEO_CONTAINED: "success" };
                resultData.push(data);
              }
            })
            this.queryResults = result.data;
          });
      }
      // get query details
      // select ksqldb data
      // data to bootstrap table
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
    reset() {
      Object.assign(this.$data, this.$options.data.call(this));
      this.getQueryList();
      this.getQueryDetails();
    },

    /**
     * for create function modal
     */
    checkFormValidity() {
      const valid = this.$refs.form.checkValidity();
      this.fieldState = valid;
      return valid;
    }
  },
  created() {
    this.getQueryList();
    this.getQueryDetails();
    console.log(this.queryResults)
    // setTimeout('location.reload()',10000);
  },
  mounted() {
    this.getQueryList();
    this.getQueryDetails();
  }
};

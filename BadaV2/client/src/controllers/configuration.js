import Util from "./../util";

let neededDataInfo = {};

export default {
  name: "Configuration",
  data() {
    return {
      bada: {
        port: 0
      },
      database: {
        mysql: {
          host: "",
          port: 3306,
          user: "",
          password: "",
          database: ""
        },
        influx: {
          host: "",
          port: 8086,
          username: "",
          password: "",
          database: ""
        },
        postgres: {
          host: "",
          port: "",
          user: "",
          password: "",
          database: ""
        }
      },
      kafka: {
        host: "",
        port: ""
      },
      mobius: {
        host: "",
        port: 7579,
        cb: ""
      },
      modal: {
        title: "",
        content: "Are you sure?",
        handle_ok: "",
        okVariant: "",
        headerBgVariant: "",
        headerTextVariant: Util.variants.light,
        bodyBgVariant: Util.variants.light,
        bodyTextVariant: Util.variants.light
      }
    };
  },
  methods: {
    saveConfiguration() {
      let changedConfiguration = {
        bada: { port: this.bada.port },
        database: this.database,
        mobius: this.mobius,
        kafka: this.kafka
      };

      this.$http
        .post("/configuration/info", changedConfiguration)
        .then(result => {
          console.log(result);
        });
    },
    connectionTest(database) {
      let databaseInfoContainer = this.$el.querySelector(
        "." + database + "-card"
      );
      let loadingIconElementClasses = databaseInfoContainer.querySelector(
        ".spinner-icon"
      ).classList;
      let successIconElementClasses = databaseInfoContainer.querySelector(
        ".success-icon"
      ).classList;
      let failIconElementClasses = databaseInfoContainer.querySelector(
        ".fail-icon"
      ).classList;
      if (
        successIconElementClasses.contains("show") ||
        failIconElementClasses.contains("show")
      ) {
        successIconElementClasses.remove("show");
        failIconElementClasses.remove("show");
      }

      loadingIconElementClasses.add("show");

      let options = {
        type: database,
        config: {}
      };

      if (database === "sql") {
        options.config = this.database.mysql;
      } else if (database === "timeseries") {
        options.config = this.database.influx;
      } else if (database === "spatialdata") {
        options.config = this.database.postgres;
      } else if (database === "mobius") {
        options.config = this.mobius;
      }

      this.$http
        .get("/database/test", { params: options })
        .then(result => {
          let resultIconElementClassess = {};

          if (result.status === 200) {
            if (result.data.connection) {
              resultIconElementClassess = successIconElementClasses;
            } else {
              resultIconElementClassess = failIconElementClasses;
            }

            setTimeout(() => {
              loadingIconElementClasses.remove("show");
              resultIconElementClassess.add("show");
            }, 500);
          }
        })
        .catch(err => {
          console.log(err);
        });
    },
    inputCancel() {
      let parsingOriginal = neededDataInfo;

      this.bada.port = parsingOriginal.bada.port;
      this.database = parsingOriginal.database;
      this.mobius = parsingOriginal.mobius;
    },
    modalOpen(type) {
      if (type === "save") {
        this.modal.title = "Save Configuration";
        this.modal.handle_ok = this.saveConfiguration;
        this.modal.okVariant = Util.variants.outlinePrimary;
        this.modal.headerBgVariant = Util.variants.primary;
        this.modal.bodyBgVariant = Util.variants.primary;
      } else {
        this.modal.title = "Cancel Configuration";
        this.modal.handle_ok = this.inputCancel;
        this.modal.okVariant = Util.variants.outlineDanger;
        this.modal.headerBgVariant = Util.variants.danger;
        this.modal.bodyBgVariant = Util.variants.danger;
      }

      this.$refs.confirmModal.show();
    },
    modalClose() {
      this.$refs.confirmModal.hide();
    }
  },
  mounted() {
    this.$http.get("/configuration/info").then(result => {
      let configFileData = result.data;

      console.log(configFileData);
      neededDataInfo = {
        bada: { port: configFileData.bada.port },
        database: configFileData.database,
        mobius: configFileData.mobius,
        kafka: configFileData.kafka
      };

      this.bada.port = configFileData.bada.port;
      this.database = configFileData.database;
      this.mobius = configFileData.mobius;
      this.kafka = configFileData.kafka;
    });
  }
};

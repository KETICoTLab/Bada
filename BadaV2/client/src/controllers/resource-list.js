import Util from "./../util";
import { eventBus } from "./../main";

let tableSetting = {
  ae: {
    index: 1,
    title: "Application Entity",
    name: "ae",
    next: "cnt",
    fields: [
      { key: "index", label: "No." },
      { key: "rn", sortable: true },
      { key: "ri", sortable: false },
      { key: "api", sortable: false },
      { key: "aei", sortable: false },
      { key: "rr", sortable: false },
      {
        key: "ct",
        sortable: true,
        formatter: value => {
          return Util.setStringToDate(value).read();
        }
      },
      { key: "lbl", sortable: false }
      // * Not used Data Column
      // { key: 'ty' },
      // { key: 'poa' },
      // { key: 'pi' },
      // { key: 'lt' },
      // { key: 'et' },
    ]
  },
  cnt: {
    index: 2,
    title: "Container",
    name: "cnt",
    id: "",
    next: "cin",
    fields: [
      { key: "index", label: "No." },
      { key: "rn", label: "Name", sortable: true },
      { key: "pi", label: "Parent ID" },
      {
        key: "ct",
        sortable: true,
        formatter: value => {
          return Util.setStringToDate(value).read();
        }
      },
      { key: "lbl" },
      { key: "st" },
      {
        key: "timeseries",
        label: "Timeseries",
        formatter: value => {
          return value == "true" ? value : "";
        }
      }
      // * Not used Data Column
      // { key: 'cni' },
      // { key: 'cbs' },
      // { key: 'mia' },
      // { key: 'mbs' },
      // { key: 'mni' },
      // { key: 'ri' },
      // { key: 'ty' },
      // { key: 'cr', label: "Creator" },
      // { key: 'pi' },
      // { key: 'lt' },
      // { key: 'et' },
    ]
  },
  cin: {
    index: 3,
    title: "Content Instance",
    name: "cin",
    id: "",
    fields: [
      { key: "index", label: "No." },
      { key: "rn", label: "Name", sortable: true },
      { key: "ri" },
      { key: "cr", label: "Creator" },
      { key: "cnf" },
      { key: "cs" },
      { key: "or" },
      { key: "ct", sortable: true },
      { key: "st" },
      { key: "con", label: "Content", sortable: true }
      // * Not used Data Column
      // { key: 'ty' },
      // { key: 'pi' },
      // { key: 'lt' },
      // { key: 'et' },
    ]
  }
};

export default {
  name: "ResourceList",
  props: {
    bookmark: Boolean
  },
  data() {
    return {
      resourceType: "ae",
      options: [{ value: "ae", text: "" }],
      sortBy: "rn",
      sortDesc: false,
      toggleDetails: "",
      tableSetting: tableSetting,
      resource: tableSetting.ae,
      currentPage: 1,
      perPage: 30,
      totalRows: 0,
      profileArea: false,
      fields: tableSetting.ae.fields,
      items: [],
      childResource: {
        container: [],
        contentInstance: null,
        subscription: []
      },
      modal: {
        title: "",
        result: "",
        item: {},
        okVariant: Util.variants.outlineInfo,
        headerBgVariant: "",
        headerTextVariant: Util.variants.dark,
        responseMessage: "Success"
      },
      path: [],
      specification: "",
      loading: true,
      search: "",
      storageOption: {}
    };
  },
  watch: {
    $route(to, from) {
      this.listPage(to.params.type);
      this.resourceType = to.params.type;
      // console.log("change page", to.params.type)
    }
  },
  methods: {
    goSpecification(resource, event) {
      let targetName = event.target.textContent.trim();

      let pathParser = pathResource => {
        let splited = pathResource.split("/");
        splited.shift();
        return splited;
      };

      if (targetName === resource.rn) {
        if (resource.path) {
          this.path = pathParser(resource.path);
        } else {
          this.path.push(resource.rn);
        }

        resource.ct = Util.setStringToDate(resource.ct).read();
        resource.lt = Util.setStringToDate(resource.lt).read();
        resource.et = Util.setStringToDate(resource.et).read();

        this.specification = resource;
        this.getChildren(resource);
      } else {
        let parameter = { ri: resource.pi };
        let resourceType = "ae";
        let parsedPath = "";

        if (resource.path) {
          parsedPath = pathParser(resource.path);

          if (parsedPath.length > 2) {
            resourceType = "cnt";
          }
        }

        this.$http
          .get("/resources/" + resourceType, { params: parameter })
          .then(result => {
            this.resource = tableSetting[resourceType];
            this.specification = {};
            let resultData = result.data[0];

            if (!resultData) return;

            this.specification = resultData;

            if (resultData.path) {
              this.path = pathParser(resultData.path);
            } else {
              this.path.push(resultData.rn);
            }
            resultData.ct = Util.setStringToDate(resultData.ct).read();
            resultData.lt = Util.setStringToDate(resultData.lt).read();
            resultData.et = Util.setStringToDate(resultData.et).read();

            return resultData;
          })
          .then(result => {
            this.childResource.container = [];
            this.childResource.contentInstance = null;
            this.childResource.subscription = [];

            this.getChildren(result);
          })
          .catch(err => {
            console.log(err);
          });
      }

      this.$el.querySelector(".specific-information").style.display = "block";
      this.$el.querySelector(".table-area").style.display = "none";
    },
    setSpecificationByName(resourceName) {
      let sliceIndex = this.path.indexOf(resourceName) + 1;
      let sendingPath = [];
      let resourceType = "ae";
      let parameter = {
        rn: resourceName,
        path: ""
      };

      if (!sliceIndex) {
        this.path.push(resourceName);
        sendingPath = this.path.slice(0, this.path.length);
      } else {
        sendingPath = this.path.slice(0, sliceIndex);
      }

      if (sendingPath.length > 1) {
        console.log("length ---- ", sendingPath.length);
        resourceType = "cnt";
        this.resourceType = "cnt";
      } else {
        this.resourceType = "ae";
      }

      sendingPath.forEach(element => {
        parameter.path += "/" + element;
      });

      console.log(
        "LOG [resrouce-list sendingPath1] \n",
        JSON.stringify(parameter)
      );
      this.$http
        .get("/resources/" + resourceType, { params: parameter })
        .then(result => {
          this.resource = tableSetting[resourceType];
          this.specification = {};
          let resultData = result.data[0];
          let retrievePath = [];

          if (resultData) {
            this.specification = resultData;
          }

          if (resultData.path) {
            let parsedData = resultData.path.split("/");
            parsedData.shift();
            retrievePath = parsedData;
          } else {
            retrievePath.push(resourceName);
          }
          this.path = retrievePath;
          resultData.ct = Util.setStringToDate(resultData.ct).read();
          resultData.lt = Util.setStringToDate(resultData.lt).read();
          resultData.et = Util.setStringToDate(resultData.et).read();

          return resultData;
        })
        .then(result => {
          this.childResource.container = [];
          this.childResource.contentInstance = null;
          this.childResource.subscription = [];
          this.getChildren(result);
        })
        .catch(err => {
          console.log(err);
        });
    },
    listPage(key) {
      if (!key) return alert("No searching Data");
      this.resetPage();
      let parameter = {};

      this.$http
        .get("/resources/" + key)
        .then(result => {
          this.resource = tableSetting[key];
          this.setTable(result);
        })
        .then(() => {
          if (Util.isAdmin()) {
            let userField = {
              key: "user",
              label: "User"
            };
            this.fields.push(userField);
          }
          this.$el.querySelector(".specific-information").style.display =
            "none";
          this.$el.querySelector(".table-area").style.display = "block";
        })
        .catch(err => {
          console.log(err);
        });
    },
    goToList(type) {
      this.resetPage();

      if (type !== this.$route.params.type) {
        this.$router.push("/home/resource/" + type);
        this.resourceType = type;
        this.resource = tableSetting[type];
      } else {
        this.$el.querySelector(".specific-information").style.display = "none";
        this.$el.querySelector(".table-area").style.display = "block";
      }
    },
    resetPage() {
      this.fields = [];
      this.currentPage = 1;
      this.totalRows = 0;
      this.specification = "";
      this.path = [];
      this.childResource = {
        container: [],
        subscription: [],
        contentInstance: null
      };
    },
    setTable(result) {
      if (result.status !== 200) {
        console.log("Error");
        return;
      }

      let resultData = result.data;
      let acronymInterpreter = this.$options.filters.acronymInterpreter;

      if (resultData.length === 0) {
        this.items = [];
      } else {
        this.items = resultData;
      }

      this.totalRows = resultData.length;

      this.resource.fields.forEach((field, index) => {
        if (!field.label) {
          field.label = acronymInterpreter(field.key);
        }
        this.fields.push(field);
      });

      if (this.items.length > 0 && this.items[0].con) {
        this.items.forEach((element, index) => {
          let context = "";

          try {
            context = JSON.parse(element.con);
          } catch (e) {
            if (e.name === "SyntaxError") {
              context = element.con;
            }
          } finally {
            this.items[index].details = context;
          }
        });
      }
    },
    detailsData(scopeData) {
      let stringData = JSON.stringify(scopeData);
      let resultData = JSON.parse(stringData);

      delete resultData["_showDetails"];
      delete resultData["container"];
      delete resultData["contentInstance"];
      delete resultData["subscription"];
      delete resultData["user"];
      delete resultData["timeseries"];
      delete resultData["spatialData"];
      delete resultData["path"];

      return resultData;
    },
    getChildren(resource) {
      this.loading = true;
      this.$refs.noSpec.style.display = "none";

      let parameter = {
        path: resource.path,
        resource: resource
      };

      this.$http
        .get("/resources/children", { params: parameter })
        .then(result => {
          let returnedData = result.data;

          this.childResource.container = returnedData.cnt;
          this.childResource.subscription = returnedData.sub;
          this.childResource.contentInstance = returnedData.cin;
        })
        .then(() => {
          if (
            !this.childResource.container.length &&
            !this.childResource.subscription.length &&
            Util.emptyStringCheck(this.childResource.contentInstance)
          ) {
            console.log(this.$refs.noSpec);
            this.$refs.noSpec.style.display = "inline-block";
          }
          this.loading = false;
        });
    },
    getParentName(path) {
      if (!path || this.path > 0) {
        return this.path[this.path.length - 2];
      }
      let pathArray = path.split("/");
      pathArray.shift();
      let parentName = pathArray[pathArray.length - 2];

      return parentName;
    },
    detailsModalOpen(type, item, event) {
      let objectCopy = JSON.stringify(item);
      console.log(type);

      switch (type) {
        case "sub":
          this.modal.title = "Subscription";
          break;
        case "cin":
          this.modal.title = "Latest Content Instance";
          break;
        default:
          break;
      }

      this.modal.type = type;
      this.modal.item = JSON.parse(objectCopy);

      this.modal.item.ct = Util.setStringToDate(this.modal.item.ct).read();
      this.modal.item.lt = Util.setStringToDate(this.modal.item.lt).read();
      this.modal.item.et = Util.setStringToDate(this.modal.item.et).read();

      if (this.modal.item.con) {
        this.modal.item.con = JSON.parse(this.modal.item.con);
      }

      delete this.modal.item.cnt;
      delete this.modal.item.ae;

      this.$refs.detailsModal.show();
    },
    modalClose(modal) {
      if (modal) {
        this.$refs[modal].hide();
      }
    },
    deleteModal(type) {
      if (type) {
        this.modal.type = type;
      }

      if (type !== "sub") {
        this.modal.item = this.specification;
      }

      this.modal.title = "Resource Delete Confirm";
      this.modal.headerTextVariant = Util.variants.light;
      this.modal.headerBgVariant = Util.variants.secondary;

      this.$refs.deleteModal.show();
    },
    deleteResource() {
      let type = this.modal.type;
      let acronymInterpreter = this.$options.filters.acronymInterpreter;
      let urlPath = "";
      let parameter = {};

      this.path.forEach(depth => {
        urlPath += "/" + depth;
      });

      if (type === "sub") {
        parameter = {
          url: urlPath + "/" + this.modal.item.rn
        };
      } else {
        parameter = {
          url: urlPath,
          ri: this.specification.ri
        };
      }

      this.$http
        .delete("/resources/" + type, { params: parameter })
        .then(result => {
          this.modal.headerBgVariant = Util.variants.success;
          this.modal.headerTextVariant = Util.variants.light;
          this.modal.item = result.data;
        })
        .catch(err => {
          this.modal.responseMessage = "Fail";
          this.modal.headerBgVariant = Util.variants.danger;
          this.modal.item = err.response.data;
        });

      this.modal.title = acronymInterpreter(type) + " Delete";
      this.$refs.returnModal.show();
    },
    ModifyStorageOptionModal() {
      this.storageOption.timeseries = this.specification.timeseries;
      this.storageOption.spatialData = this.specification.spatialData;
      this.modal.title = "Modify Storage Option";
      this.modal.headerTextVariant = Util.variants.light;
      this.modal.headerBgVariant = Util.variants.secondary;
      this.$refs.modifyModal.show();
    },
    ModifyStorageOption() {
      console.log("This is Modify btn operation");
      let urlPath = "";
      this.path.forEach(depth => {
        urlPath += "/" + depth;
      });
      this.$http
        .put("/resources/storageOption" + urlPath, this.storageOption)
        .then(result => {
          this.modal.headerBgVariant = Util.variants.success;
          this.modal.headerTextVariant = Util.variants.light;
          this.modal.item = result.data;
        })
        .catch(err => {
          this.modal.responseMessage = "Fail";
          this.modal.headerBgVariant = Util.variants.danger;
          this.modal.item = err.response.data;
        });
      this.$refs.returnModal.show();
      this.specification.timeseries = this.storageOption.timeseries;
      this.specification.spatialData = this.storageOption.spatialData;
      this.$forceUpdate();
    }
  },
  created() {
    this.fields = this.resource.fields;
    eventBus.$on("/home/resource/ae", () => {
      this.listPage("ae");
    });

    eventBus.$on("/home/resource/cnt", () => {
      this.listPage("cnt");
    });
  },
  mounted() {
    if (this.$route.params.type) {
      this.resourceType = this.$route.params.type;
    }
    this.listPage(this.resourceType);
    this.$forceUpdate();
  }
};

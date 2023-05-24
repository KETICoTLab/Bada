import Util from "./../util";

export default {
  name: "CompactList",
  props: {
    resourceName: {
      type: String
    },
    category: {
      type: String
    },
    title: {
      type: String
    }
  },
  data() {
    return {
      initFields: {
        ae: {
          type: 2,
          title: "Application Entity",
          fields: [
            { key: "rn", label: "AE", sortable: true },
            {
              key: "ct",
              label: "Creation Time",
              sortable: true,
              formatter: value => {
                return Util.setStringToDate(value).read();
              }
            }
          ],
          sortBy: "ct",
          sortDesc: true
        },
        cnt: {
          type: 3,
          title: "Container",
          fields: [
            { key: "ae", label: "AE", sortable: true },
            { key: "rn", label: "Container", sortable: true },
            {
              key: "ct",
              label: "Creation Time",
              sortable: true,
              formatter: value => {
                return Util.setStringToDate(value).read();
              }
            }
          ],
          sortBy: "ct",
          sortDesc: true
        },
        cin: {
          type: 4,
          title: "Content Instance",
          fields: [
            {
              key: "ae",
              label: "AE",
              sortable: true,
              class: "name-column-size"
            },
            {
              key: "cnt",
              label: "Container",
              sortable: true,
              class: "name-column-size"
            },
            {
              key: "ct",
              label: "Creation Time",
              sortable: true,
              formatter: value => {
                return Util.setStringToDate(value).read();
              },
              class: "time-column-size"
            },
            {
              key: "elapsed",
              label: "Elapsed Time",
              class: "align-timer time-column-size"
            },
            { key: "con", label: "Content", sortable: true }
          ],
          sortBy: "ct",
          sortDesc: true
        }
      },
      sortBy: "",
      sortDesc: false,
      popoverShow: false,
      variants: Util.variants,
      resource: {
        type: "",
        title: "",
        acronym: this.resourceName.toLowerCase(),
        style: ""
      },
      fields: [],
      items: [],
      last_sec: new Date("July 20, 69 20:17:40 GMT+00:00")
    };
  },
  methods: {
    onClose(popId) {
      this.$refs[popId].$emit("close");
      this.popoverShow = false;
    },
    getListData() {
      let resultData = "";
      let category = "";
      if (this.category === "CNT") {
        category = "/" + this.category;
      }

      resultData = this.$http
        .get("/resources/latest" + category, {
          params: { type: this.resourceName }
        })
        .then(result => {
          this.items = result.data;
          if (this.items.length > 0 && this.items[0].con) {
            this.items.forEach((element, index) => {
              let context = "";

              try {
                context = JSON.parse(element.con);
                // context = element.con;
              } catch (e) {
                if (e.name === "SyntaxError") {
                  context = element.con;
                }
              } finally {
                this.items[index].details = context;
              }
            });
          }
          return result.data;
        });

      return resultData;
    },
    isAdmin() {
      return Util.isAdmin();
    },
    showCinInfo(item, index, event) {
      let popoverId = "popId" + this.resourceName + (index + 1);
      if (this.popoverShow === popoverId) {
        this.onClose(popoverId);
        return;
      }

      this.onCloseAll();
      this.$refs[popoverId].$emit("open");
      this.popoverShow = popoverId;

      event.stopPropagation();
    },
    onCloseAll() {
      this.$root.$emit("bv::hide::popover");
    },
    detailsData(scopeData) {
      let stringData = JSON.stringify(scopeData);
      let resultData = JSON.parse(stringData);

      // resultData.ri = resultData.sri;

      resultData.ct = Util.setStringToDate(resultData.ct).read();
      resultData.lt = Util.setStringToDate(resultData.lt).read();
      resultData.et = Util.setStringToDate(resultData.et).read();

      if (resultData.con) {
        resultData.con = JSON.parse(resultData.con);
      }

      delete resultData["details"];
      delete resultData["container"];
      delete resultData["contentInstance"];
      delete resultData["subscription"];
      delete resultData["user"];
      delete resultData["timeseries"];
      delete resultData["path"];
      delete resultData["ae"];
      delete resultData["cnt"];
      return resultData;
    }
  },
  created() {
    this.resource.type = this.initFields[this.resourceName.toLowerCase()].type;
    this.resource.title = this.initFields[
      this.resourceName.toLowerCase()
    ].title;
    this.fields = this.initFields[this.resourceName.toLowerCase()].fields;
    this.sortBy = this.initFields[this.resourceName.toLowerCase()].sortBy;
    this.sortDesc = this.initFields[this.resourceName.toLowerCase()].sortDesc;

    if (this.isAdmin()) {
      let userField = {
        key: "user",
        label: "User"
      };
      this.fields.push(userField);
    }

    if (this.category && this.resourceName === "cin") {
      this.fields.push();
    }
    this.getListData();

    setInterval(() => {
      this.getListData();
    }, 10000);

    this.$root.sockets.on("cin", cin => {
      let date = new Date();
      let current_sec = date.getTime();
      if (current_sec - this.last_sec >= 1000) {
        this.last_sec = current_sec;
        this.getListData();
      }
    });
  },
  mounted() {
    this.$root.$on("bv::hide::popover", () => {
      this.popoverShow = false;
    });
  }
};

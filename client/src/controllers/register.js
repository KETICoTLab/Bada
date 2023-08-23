import Util from "./../util";

let today = new Date();
let expirationDefault = {
  yyyy: today.getFullYear() + 2,
  MM: today.getMonth() + 1,
  dd: today.getDate(),
  hh: today.getHours(),
  mm: today.getMinutes(),
  ss: today.getSeconds()
};

expirationDefault.MM =
  (expirationDefault.MM < 10 ? "0" : "") + expirationDefault.MM;
expirationDefault.hh =
  (expirationDefault.hh < 10 ? "0" : "") + expirationDefault.hh;
expirationDefault.mm =
  (expirationDefault.mm < 10 ? "0" : "") + expirationDefault.mm;
expirationDefault.ss =
  (expirationDefault.ss < 10 ? "0" : "") + expirationDefault.ss;

//  <AE> creation attribute
// mandatory attributes :
//  - api
//  - rr
// optinal attributes :
//  - rn
//  - et
//  - lbl
//  - apn
//  - poa
//  - nl
//  - csz

//  <Container> creation attribute
// optinal attributes :
//  - rn
//  - et
//  - lbl
//  - mni
//  - mbs
//  - mia

export default {
  name: "Register",
  data() {
    return {
      list: {
        ae: [],
        cnt: [],
        sub: []
      },
      resourceInformation: {},
      label: "",
      poa: "",
      nu: "",
      disabledDates: {
        to: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        // from: new Date(2016, 0, 26), // Disable all dates after specific date
      },
      expirationTimeDefault:
        expirationDefault.yyyy +
        "-" +
        expirationDefault.MM +
        "-" +
        expirationDefault.dd,
      expirationDay: "",
      expirationTime: {
        date: "",
        time: {
          HH: "",
          mm: "",
          ss: ""
        }
      },
      ae: {
        rn: null,
        api: null,
        lbl: [],
        rr: null,
        et: null,
        apn: null,
        poa: [],
        csz: null
      },
      cnt: {
        ae: null,
        cnt: [],
        path: [],
        rn: null,
        et: null,
        lbl: [],
        mni: null,
        mbs: null,
        mia: null,
        timeseries: "true",
        spatialdata: "false",
        datamodel: ""
      },
      cin: {
        ae: null,
        cnt: null,
        con: ""
      },
      sub: {
        ae: null,
        cnt: [],
        path: [],
        rn: null,
        net: ["3"],
        nu: [],
        nct: null,
        pn: null
      },
      data: "",
      selected: null,
      selectOption: [
        { value: null, text: "Please select a resource type" },
        { value: "ae", text: "Application Entity" },
        { value: "cnt", text: "Container" },
        { value: "sub", text: "Subscription" }
        // { value: "cin", text: "Content Instance", disabled: true},
      ],
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
      today: "",
      notiType: "mqtt://",
      notiAddType: ["mqtt://"],
      notiOptions: [
        { value: "mqtt://", text: "MQTT" },
        { value: "http://", text: "HTTP" }
      ]
    };
  },

  methods: {
    checkValidation() {
      let empty = false;
      let rnAutoCreation = this.$el.querySelector(".auto-creation");

      // this.sub.nu.forEach((url, index)=>{
      //   if(!this.urlChecker(url)) {
      //     wrongUrl = true;
      //   }
      // })

      if (!this[this.selected]["rn"] && !rnAutoCreation.checked) {
        alert("Please fill out the resource name");
        empty = true;
      } else if (this.selected === "ae") {
        if (Util.emptyStringCheck(this.ae.api)) {
          alert("Please fill out the app ID");
          empty = true;
        } else if (Util.emptyStringCheck(this.ae.rr)) {
          alert("Please select the request reachability");
          empty = true;
        }
      } else if (this.selected === "cnt") {
        if (Util.emptyStringCheck(this.cnt.ae)) {
          alert("Please fill out the parent resource");
          empty = true;
        }
      } else if (this.selected === "sub") {
        if (Util.emptyStringCheck(this.nu)) {
          alert("Please fill out the notification URI");
          empty = true;
        } else if (Util.emptyStringCheck(this.sub.ae)) {
          alert("Please fill out the parent resource");
          empty = true;
        }
        //  else if(urlChecker(this.nu)) {
        //   alert('Please fill out the first notification url form');
        //   empty = true;
        // }
      }

      if (
        !this.expirationTime.date &&
        !this.expirationTime.time.HH &&
        !this.expirationTime.time.mm &&
        !this.expirationTime.time.ss
      ) {
      } else if (
        !this.expirationTime.date ||
        !this.expirationTime.time.HH ||
        !this.expirationTime.time.mm ||
        !this.expirationTime.time.ss
      ) {
        alert("Please fill out expiration time");
        empty = true;
      }

      return empty;
    },
    validateAttribute(check) {
      return check ? true : false;
    },
    clearAttributes() {
      if (this.selected === null) {
        return;
      }

      let inputAttributes = Object.keys(this[this.selected]);

      inputAttributes.forEach(attribute => {
        if (attribute === "lbl" || attribute === "poa" || attribute === "cnt") {
          this[this.selected][attribute] = [];
          console.log("HERE : ", attribute)
        } else if (attribute === "rr" || attribute === "ae") {
          this[this.selected][attribute] = null;
        } else if (attribute === "rn") {
          this.$el.querySelector("#rn").disabled = false;
          this.$el.querySelector("#rn").value = null;

          this[this.selected][attribute] = null;
        } else {
          this[this.selected][attribute] = null;
        }
      });

      this.label = "";
      this.poa = "";

      this.clearDatetime();
    },
    reset() {
      Object.assign(this.$data, this.$options.data.call(this));

      this.getAeList();
    },
    addTextInput(attr) {
      this[this.selected][attr].push("");
    },
    deleteTextInput(attr, index) {
      this[this.selected][attr].splice(index, 1);
    },
    inputCheck(parameter) {
      let cntList = this.list.cnt[this.cnt.path.length - 1];
    },
    getAeList() {
      this.$http
        .get("/resources/ae")
        .then(result => {
          result.data.forEach((element, index) => {
            element.value = element.ri;
            element.text = element.rn;
            this.list.ae.push(element);
          });
        })
        .then(() => {
          this.list.ae.sort(function(a, b) {
            var nameA = a.rn.toUpperCase();
            var nameB = b.rn.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }

            return 0;
          });
        });
    },
    selectAe(aeid) {
      if (this.selected === "cin") {
        this.getCntList();
      } else if (this.selected === "cnt") {
        this.cnt.path = [];

        this.list.ae.forEach(element => {
          if (element.ri === aeid) {
            // this.cnt.path.push(element.rn);
            this.getCntList(element);
          }
        });
      } else if (this.selected === "sub") {
        this.sub.path = [];

        this.list.ae.forEach(element => {
          if (element.ri === aeid) {
            // this.cnt.path.push(element.rn);
            this.getCntList(element);
          }
        });
      }
    },
    selectCnt(cntid, index) {
      let containerIndex = index;
      let cntList = this.list.cnt[containerIndex];

      this[this.selected].path.splice(
        containerIndex + 1,
        this[this.selected].path.length
      );
      this[this.selected].cnt.splice(
        containerIndex + 1,
        this[this.selected].cnt.length
      );

      cntList.forEach(element => {
        if (element.ri === cntid) {
          this.getCntList(element, containerIndex + 1);
        }
      });
    },
    getCntList(parentResource, index) {
      this.cin.cnt = null;
      let parameter = { pi: parentResource.ri };
      let subContainer = [];
      let listContainerIndex = index;

      if (!index) {
        listContainerIndex = 0;
      }

      this.$http
        .get("/resources/cnt", { params: parameter })
        .then(result => {
          if (!result.data.length) {
            this.list.cnt[listContainerIndex] = [];
            this.list.cnt[listContainerIndex].push({
              value: "non",
              text: "No Data"
            });
            // this.cnt.cnt = 'non';
            // return;
          }

          result.data.forEach((element, index) => {
            element.value = element.ri;
            element.text = element.rn;
            subContainer.push(element);
          });

          this.list.cnt[listContainerIndex] = subContainer;
          return parentResource;
        })
        .then(selectedResource => {
          this[this.selected].path.push(selectedResource.rn);
          this[this.selected].cnt[listContainerIndex] = null;
          // Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'path')at eval (export-excel.js?312e:123)
        });
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
    requestCreation(type) {
      if (this.checkValidation()) {
        return;
      }

      let yyyy = "";
      let mm = "";
      let dd = "";
      let expirationText = "";
      let rnAutoCreation = this.$el.querySelector(".auto-creation");
      let modal = {
        title: "",
        content: {}
      };

      if (!Util.emptyStringCheck(this.expirationTime.date)) {
        yyyy = this.expirationTime.date.getFullYear().toString();
        mm = (this.expirationTime.date.getMonth() + 1).toString();
        dd = this.expirationTime.date.getDate().toString();
        expirationText =
          yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]);

        this[type].et =
          expirationText +
          "T" +
          (this.expirationTime.time.HH
            ? this.expirationTime.time.HH
            : expirationDefault.hh) +
          (this.expirationTime.time.mm
            ? this.expirationTime.time.mm
            : expirationDefault.mm) +
          (this.expirationTime.time.ss
            ? this.expirationTime.time.ss
            : expirationDefault.ss);
      }

      if (type === "ae") {
        this.ae.poa.unshift(this.poa);
        this.ae.lbl.unshift(this.label);
      }

      this.resourceInformation = this[type];

      if (type === "cnt") {
        this.cnt.lbl.unshift(this.label);
        delete this.resourceInformation["cnt"];

      }

      if (type === "sub") {
        this.sub.nu.unshift(this.nu);
        delete this.resourceInformation["cnt"];
      }

      if (rnAutoCreation.checked) {
        this.resourceInformation["rn"] = null;
      }

      Object.keys(this.resourceInformation).forEach(attribute => {
        if (
          !this.resourceInformation[attribute] &&
          attribute !== "timeseries"
        ) {
          delete this.resourceInformation[attribute];
        } else if (
          typeof this.resourceInformation[attribute] === "object" &&
          Util.emptyStringCheck(this.resourceInformation[attribute][0])
        ) {
          delete this.resourceInformation[attribute];
        }
      });
      console.log("---", this.resourceInformation);
      this.$http
        .post("/resources/" + type, this.resourceInformation)
        .then(result => {
          let data = result.data;

          if (!result.data) {
            data = "No Result";
          }

          let resourceData = data["m2m:rce"]["m2m:" + type];
          resourceData.ct = Util.setStringToDate(resourceData.ct).read();
          resourceData.lt = Util.setStringToDate(resourceData.lt).read();
          resourceData.et = Util.setStringToDate(resourceData.et).read();

          if (type === "cnt") {
            delete resourceData["path"];
            delete resourceData["timeseries"];
            delete resourceData["spatialData"];
            delete resourceData["user"];
          } else if (type === "ae") {
            delete resourceData["user"];
          }

          this.responseMessage = "Result";

          modal.title = "Success";
          modal.content = data;
        })
        .then(() => {
          this.showModal(modal.title, modal.content);
        })
        .catch(err => {
          modal.title = "fail";
          modal.content = err.response.data;

          console.log("error response", err.response);
          console.log("error", err);
          this.responseMessage = err.response.status;
          this.showModal(modal.title, modal.content);
        });

      this.reset();
    },
    clearDatetime() {
      let initialTime = {
        HH: "",
        mm: "",
        ss: ""
      };

      if (this.expirationTime.date) {
        this.expirationTime.date = "";
      }
      this.expirationTime.date = "";
      this.expirationTime.time = initialTime;
    },
    createAttribute(attribute, event) {
      let clickedTarget = event.target;

      if (clickedTarget.checked) {
        // this[this.selected][attribute] = "";
        this.$el.querySelector("#rn").disabled = true;
        this.$el.querySelector("#rn").value = "Checked auto creation.";
      } else {
        // this[this.selected][attribute] = null;
        this.$el.querySelector("#rn").disabled = false;
        this.$el.querySelector("#rn").value = this[this.selected][attribute];
      }
    }
  },
  created() {
    this.getAeList();
  }
};

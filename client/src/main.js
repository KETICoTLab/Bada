// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import router from "./router";
import axios from "axios";
// import env from '../config/config'
import env from "../../server/configuration/env";

Date.prototype.yyyymmdd = function(mark) {
  let that = this;

  if (!that.valueOf()) return " ";

  let yyyy = that.getFullYear().toString();
  let mm = (that.getMonth() + 1).toString();
  let dd = that.getDate().toString();

  if (!mark) {
    mark = "";
  }

  return (
    yyyy + mark + (mm[1] ? mm : "0" + mm[0]) + mark + (dd[1] ? dd : "0" + dd[0])
  );
};

Date.prototype.read = function() {
  let originalDateObject = this;

  let hour = originalDateObject.getHours();
  let minute = originalDateObject.getMinutes();
  let second = originalDateObject.getSeconds();

  let yyyy = originalDateObject.getFullYear().toString();
  let mm = (originalDateObject.getMonth() + 1).toString();
  let dd = originalDateObject.getDate().toString();

  let stringifyDate =
    yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]);

  // stringifyDate += ' ' + ((hour < 10) ? hour - 12 : hour);
  stringifyDate += (hour < 10 ? " 0" : " ") + hour;
  stringifyDate += (minute < 10 ? ":0" : ":") + minute;
  stringifyDate += (second < 10 ? ":0" : ":") + second;
  // stringifyDate += (hour >= 12) ? ' P.M.' : ' A.M.';

  return stringifyDate;
};

let server = "http://" + env.server.HOST + ":" + env.server.PORT;

Vue.prototype.env = { server: server };
Vue.prototype.$http = axios.create({
  headers: {
    "Content-Type": "application/json",
    "x-access-token": localStorage.token
  },
  baseURL: server
});

Vue.config.productionTip = false;

export const eventBus = new Vue();

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>",
  methods: {
    updateComponent() {
      let self = this;
      self.show = false;

      Vue.nextTick(function() {
        self.show = true;
      });
    }
  }
});

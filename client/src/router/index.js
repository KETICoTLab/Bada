import Vue from "vue";
import Router from "vue-router";
import BootstrapVue from "bootstrap-vue";
import JsonTree from "vue-json-tree-view";
import Timepicker from "vue2-timepicker";
import Datepicker from "vuejs-datepicker";
import JsonPretty from "vue-json-pretty";
import vSelect from "vue-select";
import vuescroll from "vuescroll";
import VueGoodTablePlugin from "vue-good-table";
import VueTableDynamic from "vue-table-dynamic";
import AcronymDictionary from "@/AcronymDictionary";

import Home from "@/layouts/Home";
import Login from "@/layouts/Login";
import Signup from "@/layouts/Signup";

import Dashboard from "@/components/Dashboard";
import Resource from "@/components/Resource";
import Navibar from "@/components/Navibar";
import Drawer from "@/components/Drawer";
import Profile from "@/components/Profile";
import Register from "@/components/Register";
import User from "@/components/User";
import Configuration from "@/components/Configuration";
import StreamManagement from "@/components/StreamManagement";
import Query from "@/components/Query";
import Querylist from "@/components/Querylist"
// import Bookmark from '@/components/Bookmark'
// import Search from '@/components/Search'

import SystemUsage from "@/components/module/SystemUsage";
import ResourceCount from "@/components/module/ResourceCount";
import CompactList from "@/components/module/CompactList";
import DailyCount from "@/components/module/DailyCount";
import ResourceList from "@/components/module/ResourceList";
import ResourceTable from "@/components/module/ResourceTable";
import ExportExcel from "@/components/module/ExportExcel";
import QueryResult from "@/components/module/QueryResult"
// import MatrixChart from '@/components/module/MatrixChart'
// import IntensificationFactor from '@/components/module/IntensificationFactor'
// import CinMonitor from '@/components/module/CinMonitor'

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "vue-good-table/dist/vue-good-table.css";

Vue.use(Router);
Vue.use(BootstrapVue);
Vue.use(JsonTree);
Vue.use(vuescroll);
Vue.use(VueGoodTablePlugin);
Vue.use(VueTableDynamic);
Vue.component("v-select", vSelect);
Vue.component("datepicker", Datepicker);
Vue.component("timepicker", Timepicker);
Vue.component("json-pretty", JsonPretty);

Vue.component("navibar", Navibar);
Vue.component("drawer", Drawer);
Vue.component("system-usage", SystemUsage);
Vue.component("resource-count", ResourceCount);
Vue.component("daily-count", DailyCount);
Vue.component("compact-list", CompactList);
Vue.component("resource-list", ResourceList);
Vue.component("resource-table", ResourceTable);
Vue.component("export-excel", ExportExcel);
Vue.component("query-result", QueryResult)
// Vue.component('matrix-chart', MatrixChart);
// Vue.component('intensification-factor', IntensificationFactor);
// Vue.component('cin-monitor', CinMonitor);

Vue.directive("focus", {
  inserted: function(el) {
    el.focus();
  }
});

/**
 * Vue Config Object Set
 */
// Vue.config.keyCodes.enter = 13;

/** Filter Section */
Vue.filter("acronymInterpreter", original => {
  let modified = original;

  if (AcronymDictionary[original]) {
    modified = AcronymDictionary[original];
  }

  return modified;
});

Vue.filter("timeFormatter", time => {
  let formatchange =
    time.substring(0, 4) +
    "-" +
    time.substring(4, 6) +
    "-" +
    time.substring(6, 8) +
    "T" +
    time.substring(9, 11) +
    ":" +
    time.substring(11, 13) +
    ":" +
    time.substring(13, 15) +
    "Z";
  let modified = new Date(formatchange);

  return modified.read();
});

Vue.filter("elapsedTimer", time => {
  let formatchange =
    time.substring(0, 4) +
    "-" +
    time.substring(4, 6) +
    "-" +
    time.substring(6, 8) +
    "T" +
    time.substring(9, 11) +
    ":" +
    time.substring(11, 13) +
    ":" +
    time.substring(13, 15) +
    "Z";
  let recorded = new Date(formatchange);
  let now = new Date();
  let resultFormatString = "";

  let secondsElapsed = parseInt((now - recorded) / 1000);

  let seconds = parseInt(secondsElapsed % 60);
  let minutes = parseInt((secondsElapsed / 60) % 60);
  let hours = parseInt((secondsElapsed / 3600) % 24);
  let days = parseInt(secondsElapsed / 3600 / 24);

  seconds = seconds < 10 ? "0" + seconds : seconds;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  hours = hours < 10 ? "0" + hours : hours;

  days = days ? days + "day(s)" : "";

  resultFormatString = days + " " + hours + ":" + minutes + ":" + seconds;

  return resultFormatString;
});

export default new Router({
  // mode: 'history',
  routes: [
    {
      path: "/",
      component: Login
    },
    {
      path: "/home",
      component: Home,
      children: [
        { path: "dashboard", component: Dashboard },
        { path: "resource", component: Resource },
        { path: "resource/:type", component: Resource },
        { path: "register", component: Register },
        { path: "user", component: User },
        { path: "profile", component: Profile },
        { path: "configuration", component: Configuration },
        { path: "streammanagement", component: StreamManagement },
        { path: "query", component: Query },
        { path : "querylist", component: Querylist}
        // { path: 'bookmark', component: Bookmark },
        // { path: 'search', component: Search },
      ]
    },
    {
      path: "/signup",
      component: Signup
    }
  ]
});

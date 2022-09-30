import Util from './../util';
import io from 'socket.io-client';

export default {
  name: 'Dashboard',
  data() {
    return {
      compactList: { title: "Latest"},
      resourceName: { 
        ae: "AE",
        cnt: "CNT",
        cin: "CIN"
      }
    }
  },
  methods: {
    getAETables() {
      return this.$http.get('/ae')
      .then((result) => {      
        this.items = result.data;
        return (result.data);
      })
    },
    getCntTables(value) {
      this.$http.get('/cnt')
      .then((result) => {
        this.items = result.data;
        return (result.data);
      })
    },
    isAdmin() {
      return Util.isAdmin();
    }
  },
  created() {
    this.$root.sockets = io(this.$root.env.server, {
      query: { token: localStorage.token }
    })
    if(!this.$root.sockets.connected) {
      this.$root.sockets.open();
    }
  },
  beforeDestroy() {
    this.$root.sockets.close();
  },
}
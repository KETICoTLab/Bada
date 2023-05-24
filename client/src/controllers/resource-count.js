import Util from './../util';

let resourceList = ['ae', 'cnt', 'cin'];

export default {
  name: 'ResourceCount',
  data() {
    return {
      admin: this.isAdmin(),
      ae_count: 0,
      cnt_count: 0,
      cin_count: 0,
      user_count: 0
    }
  },
  methods: {
    countingResource: function () {
      this.$http.get('/resources/count')
        .then((result) => {
          result.data.ae === null ? (this.ae_count = 0) : (this.ae_count = result.data.ae);
          result.data.cnt === null ? (this.cnt_count = 0) : (this.cnt_count = result.data.cnt);
          result.data.cin === null ? (this.cin_count = 0) : (this.cin_count = result.data.cin);
        })
        .catch((err) => {
          console.log(err.response);
        })
    },
    countingUser: function () {
      this.$http.get('/user/count')
        .then((result) => {
          this.user_count = result.data.user;
        })
        .catch((err) => {
          console.log(err.response);
        })
    },
    isAdmin: function () {
      return Util.isAdmin();
    },
    goList: function(type) {
      if(type==='user') {
        this.$parent.$router.push({ path: type });
      } else {
        this.$parent.$router.push({ path: 'resource/' + type });
      }
    }
  },
  created() {
    resourceList.forEach((resource, index) => {
      this.$root.sockets.on(resource, (resultData) => {
        if(resultData.delete) {
          this[resource+"_count"]--;  
        } else {
          this[resource+"_count"]++;
        }
      })
    });

    this.countingResource();

    if(this.isAdmin()) {
      this.countingUser();
    }
  }
}
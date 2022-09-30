import Util from './../util';

export default {
  name: 'ExportExcel',
  data() {
    return {
      admin: this.isAdmin(),
      list: {
        ae: [],
        cnt: []
      },
      selectedae: '',
      selectedcnt: '',
      selectedterm:'1 day',
      options:[
        '1 day',
        '1 week',
        '1 month',
        '6 months',
        '1 year'
      ],
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
        timeseries: true,
        spatialdata: false,
        blockchain: false
      },cin: {
        ae: null,
        cnt: null,
        con: ''
      },
    }
  },
  mounted() {
    this.getAeList()
  },

  methods: {
    exportExcelFile: function () {
      let path = '';
      let aePath = '';
      this.list.ae.forEach((element)=> {
        if(element.ri === this.selectedae) {
          aePath = element.rn
        }
      })
      path = `/resources/excel?&term=${this.selectedterm}&ae=${aePath}&cnt=${this.selectedcnt}`
      console.log(path);
      this.$http.get(path)
      .then((result) => {
        console.log('excel result : ' ,result);
        if(result.data === ''){
          alert(`There are no Content Instance Data`);
        }else{
          alert(`Download Mobius Data Success`);
        }

      }).catch((err) =>{
        console.log(err.response)
        alert(`Error Status Code : ${err.response.status} \n Error Message : ${JSON.stringify(err.response.data)}`);
      })
      
    },
    getAeList() {
      this.$http.get('/resources/ae')
      .then((result) => {
        console.log('result : ' , result)
        result.data.forEach((element, index) => {
          element.value = element.ri;
          element.text = element.rn;
          this.list.ae.push(element);
          console.log('this.list ae : ', this.list.ae)
        });
      }).then(()=>{
        this.list.ae.sort(function(a, b) {
          var nameA = a.rn.toUpperCase();
          var nameB = b.rn.toUpperCase();
          if (nameA < nameB) { return -1; }
          if (nameA > nameB) { return 1; }

          return 0;
        });
      })
    },
    selectAe(aeid) {
        this.cnt.path = [];
        this.list.cnt = [];
        this.list.ae.forEach((element)=> {
            if(element.ri === aeid) {
              // this.cnt.path.push(element.rn);
              // console.log("this is get cnt list")
              this.getCntList(element);
            }
        })
    },getCntList(parentResource, index) {
      this.cin.cnt = null;
      let parameter = {"pi" : parentResource.ri};
      let subContainer = [];
      let listContainerIndex = index;

      if(!index) {
        listContainerIndex = 0;
      }

      this.$http.get('/resources/cnt', {params: parameter})
      .then((result) => {
        if(!result.data.length) {
          this.list.cnt[listContainerIndex] = [];
          this.list.cnt[listContainerIndex].push({ value:'non' , text: 'No Data'});
          // this.cnt.cnt = 'non';
          // return;
        }
        // console.log(result)
        result.data.forEach((element, index) => {
          element.value = element.ri;
          element.text = element.rn;
          subContainer.push(element);
          this.list.cnt.push(element.rn);
          console.log(element.rn)
        });

        // this.list.cnt[listContainerIndex] = subContainer ;
        return parentResource;
      })
      // .then((selectedResource)=> {
      //   // console.log(selectedResource)
      //   this[this.selected].path.push(selectedResource.rn);
      //   this[this.selected].cnt[listContainerIndex] = null;
      // })
    },
    
    isAdmin: function () {
      return Util.isAdmin();
    },
    
  },  

}

/*

      getAeList() {
      this.$http.get('/resources/ae')
      .then((result) => {
        result.data.forEach((element, index) => {
          element.value = element.ri;
          element.text = element.rn;
          this.list.ae.push(element);
        });
      }).then(()=>{
        this.list.ae.sort(function(a, b) {
          var nameA = a.rn.toUpperCase();
          var nameB = b.rn.toUpperCase();
          if (nameA < nameB) { return -1; }
          if (nameA > nameB) { return 1; }

          return 0;
        });
      })
    },
    selectAe(aeid) {
      if(this.selected === 'cnt') {
        this.cnt.path = [];

        this.list.ae.forEach((element)=> {
            if(element.ri === aeid) {
              // this.cnt.path.push(element.rn);
              this.getCntList(element);
            }
        })
      }
    },
    selectCnt(cntid, index) {
      let containerIndex = index;
      let cntList = this.list.cnt[containerIndex];

      this[this.selected].path.splice(containerIndex+1, this[this.selected].path.length);
      this[this.selected].cnt.splice(containerIndex+1, this[this.selected].cnt.length);

      cntList.forEach((element)=>{
        if(element.ri === cntid) {
          this.getCntList(element, containerIndex+1);
        }
      })
    },
    getCntList(parentResource, index) {
      this.cin.cnt = null;
      let parameter = {"pi" : parentResource.ri};
      let subContainer = [];
      let listContainerIndex = index;

      if(!index) {
        listContainerIndex = 0;
      }

      this.$http.get('/resources/cnt', {params: parameter})
      .then((result) => {
        if(!result.data.length) {
          this.list.cnt[listContainerIndex] = [];
          this.list.cnt[listContainerIndex].push({ value:'non' , text: 'No Data'});
          // this.cnt.cnt = 'non';
          // return;
        }

        result.data.forEach((element, index) => {
          element.value = element.ri;
          element.text = element.rn;
          subContainer.push(element);
        });

        this.list.cnt[listContainerIndex] = subContainer ;
        return parentResource;
      }).then((selectedResource)=> {
        this[this.selected].path.push(selectedResource.rn);
        this[this.selected].cnt[listContainerIndex] = null;
      })
    },
*/
export default {
  name: 'SystemUsage',
  data() {
    return {
      server: {
        cpu: "",
        memory: "",
      },
      process: {
        cpu: "",
        memory: ""
      },
      cpu_usage: "",
      memory_usage: "",
      response_time: "",
      cpuUsage: [
        {
          server: "",
          process: ""
        }
      ],
      memoryUsage: [
        {
          server: "",
          process: ""
        }
      ],
      autoReload: {}
    }
  },
  methods: {
    getSystemUsage() {
      this.$http.get('/resources/system')
      .then((result) => {
        this.server = result.data.server;
        this.process = result.data.process;
        this.response_time = result.data.responseTime;
      })
    },
  },
  created() {
    this.getSystemUsage();

    this.$root.sockets.on('system-usage', (usageData)=>{
      this.server = usageData.server;
      this.process = usageData.process;
      this.response_time = usageData.responseTime;
    })
  }
}
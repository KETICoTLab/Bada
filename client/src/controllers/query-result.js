import IEcharts from "vue-echarts-v3/src/full.js";

const chartDataCount = 8
export default {
  name: "QueryResult",
  components: {
    IEcharts
  },
  props: {
    queryData: {
      type: Array
    },
    showChart: {
      type: Boolean
    }
  },
  data() {
    return {
      loading: false,
      duration: {
        start_date: "",
        end_date: ""
      },
      chartOption: {
        title: { show: false },
        styles: { width: "100%", height: "300xp" },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            label: { show: true, backgroundColor: "#6a7985", precision: "0" }
          }
        },
        xAxis: [{ type: "category", data: [] }],
        yAxis: [{ type: "value" }],
        series: [
          {
            name: "CIN",
            type: "bar",
            itemStyle: {
              normal: {
                label: {
                  show: true,
                  position: "top",
                  distance: 15,
                  formatter: function(params) {
                    return params.value.toLocaleString();
                  },
                  textStyle: { baseline: "top" }
                }
              }
            },
            areaStyle: { normal: {} },
            data: []
          }
        ],
        watch: true,
        lazyUpdate: true
      },
    };
  },
  watch: {
    queryData() {
      console.log(this.queryData, this.showChart)
      this.chartOption.xAxis[0].data = []
      this.chartOption.series[0].data = []
      /**
       * 차트 데이터 설정
       */
      let graphData = [];
      this.chartOption.xAxis[0].data = [];
      if (this.queryData && this.showChart) {
        this.queryData.forEach((element) => {
          console.log(element)
          let { WINDOW_START, WINDOW_END, COUNT, RESULT } = element;
          graphData.push({ WINDOW_START, WINDOW_END, COUNT, RESULT })
        })


        // set time
        let end_time = new Date(graphData[graphData.length - 1].WINDOW_END);
        let tumbling_time = end_time - new Date(graphData[graphData.length - 1].WINDOW_START);
        let date;
        console.log(end_time, tumbling_time);
        let searchIndex = graphData.length - 1

        for (let i = chartDataCount-1; i >= 0; i--) {

          date = new Date(end_time - tumbling_time * i);
          this.chartOption.xAxis[0].data.push(date.toLocaleTimeString());
          this.chartOption.series[0].data.push(0)

          if (i == chartDataCount-1) {
            this.duration.start_date = date.toLocaleTimeString();
          }
          if (i == 0) {
            this.duration.end_date = date.toLocaleTimeString();
          }

          //데이터 Endtime을 다 확인해야 함

          for (let j = searchIndex; j >= 0; j--){
            console.log("END TIME 찾기", date, new Date(graphData[j].WINDOW_END));
            if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
              console.log("############# HERE", date, new Date(graphData[j].WINDOW_END))
              this.chartOption.series[0].data.pop();
              if (graphData[j].RESULT !== undefined) {
                this.chartOption.series[0].data.push(graphData[j].RESULT.toFixed(3))
              } else {
                this.chartOption.series[0].data.push(graphData[j].COUNT)
              }
              break;

            }
          }
        }
      }
    }
  }
};


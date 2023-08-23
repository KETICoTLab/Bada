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
          let { WINDOW_START, WINDOW_END, count, SUM, AVG, MIN, MAX } = element;
            graphData.push({ WINDOW_START, WINDOW_END, count, SUM, AVG, MIN, MAX })
        })


        // set time
        // 마지막 데이터 (가장 마지막 End TIme) 로 Tumbling Time 확인 (Window End - Window Start)
        let end_time = new Date(graphData[graphData.length - 1].WINDOW_END);
        let tumbling_time = end_time - new Date(graphData[graphData.length - 1].WINDOW_START);
        let date;
        let searchIndex = graphData.length - 1

        // chartDataCount :  차트에 보여줄 데이터 개수
        // 차트에 보여줄 데이터 개수만큼 데이터 생성
        for (let i = chartDataCount-1; i >= 0; i--) {
        // 가장 마지막 데이터 End TIme 부터 tumbling time 간격으로 데이터 생성
          date = new Date(end_time - tumbling_time * i);
          this.chartOption.xAxis[0].data.push(date.toLocaleTimeString());
          this.chartOption.series[0].data.push(0)

          if (i == chartDataCount-1) {
            this.duration.start_date = date.toLocaleTimeString();
          }
          if (i == 0) {
            this.duration.end_date = date.toLocaleTimeString();
          }

          let avgTotalSum = 0;
          let avgTotalCount = 0;
          let minTemp = 9999999999;
          let maxTemp = -9999999999;
          //데이터 Endtime을 다 확인해서 현재 x 축과 같은 시간을 가졌으면 데이터로 추가해줌
          // new : 센서들 여러개를 union해서 쿼리를 생성한 경우 이때 결과를 union해서 보여줄 수 있게끔 처리 (ex. sum, avg)

          if (graphData[0].AVG) {
            for (let j = searchIndex; j >= 0; j--) {
              // console.log("END TIME 찾기", date, new Date(graphData[j].WINDOW_END));
              if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
                  avgTotalSum += graphData[j].AVG * graphData[j].count;
                  avgTotalCount += graphData[j].count;
              }
            }
            this.chartOption.series[0].data[chartDataCount - 1 - i] = avgTotalSum / avgTotalCount;
          } else if (graphData[0].SUM) {
            for (let j = searchIndex; j >= 0; j--) {
              if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
                this.chartOption.series[0].data[chartDataCount - 1 - i] = this.chartOption.series[0].data[chartDataCount - 1 - i] + graphData[j].SUM
              }
            }
          } else if (graphData[0].MIN) {
            for (let j = searchIndex; j >= 0; j--) {
              if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
                if (graphData[j].MIN < minTemp) {
                  minTemp = graphData[j].MIN;
                  this.chartOption.series[0].data[chartDataCount - 1 - i] = graphData[j].MIN;
                }
              }
            }
          } else if (graphData[0].MAX) {
            for (let j = searchIndex; j >= 0; j--) {
              if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
                if (graphData[j].MAX > maxTemp) {
                  maxTemp = graphData[j].MAX;
                  this.chartOption.series[0].data[chartDataCount - 1 - i] = graphData[j].MAX;
                }
              }
            }
          } else {
            for (let j = searchIndex; j >= 0; j--) {
              if (new Date(graphData[j].WINDOW_END).getTime() == date.getTime()) {
                this.chartOption.series[0].data[chartDataCount - 1 - i] = this.chartOption.series[0].data[chartDataCount - 1 - i] + graphData[j].count
              }
            }
          }
        }
      }
    }
  }
};


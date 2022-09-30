import IEcharts from "vue-echarts-v3/src/full.js";

let initEndDate = new Date();
let initStartDate = new Date();

initStartDate.setDate(initEndDate.getDate() - 6);

function setOneWeek(input_end) {
  let end_date;

  if (!input_end) {
    end_date = new Date().yyyymmdd("-");
  } else {
    end_date = input_end;
  }

  let end_date_year = end_date.substring(0, 4);
  let end_date_month = end_date.substring(5, 7);
  let end_date_date = end_date.substring(8, 10);

  let start_date = new Date(
    end_date_year,
    Number(end_date_month) - 1,
    Number(end_date_date) - 6
  );

  return {
    start_date: start_date.yyyymmdd("-"),
    end_date: end_date
  };
}

function setStringToDate(input) {
  if (typeof input !== "string") {
    return;
  }
  input = new Date(
    input.substring(0, 4),
    input.substring(5, 7),
    input.substring(8, 10)
  );

  return input;
}

export default {
  name: "WeeklyCount",
  components: {
    IEcharts
  },
  data() {
    return {
      loading: false,
      duration: {
        start_date: initStartDate.yyyymmdd("-"),
        end_date: initEndDate.yyyymmdd("-")
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
      last_sec: new Date("July 20, 69 20:17:40 GMT+00:00"),
      dataCount: 0
    };
  },
  methods: {
    search() {
      this.loading = true;
      this.chartOption.xAxis[0].data = [];
      this.chartOption.series[0].data = [];

      this.$http
        .get("/resources/cin/daily", { params: this.duration })
        .then(result => {
          result.data.forEach(element => {
            if (!element["date"]) return;

            let formatted =
              element["date"].substring(0, 4) +
              "-" +
              element["date"].substring(4, 6) +
              "-" +
              element["date"].substring(6, 8);

            let value = {
              name: element["count"].toLocaleString(),
              value: element["count"]
            };

            this.chartOption.xAxis[0].data.push(formatted);
            this.chartOption.series[0].data.push(element["count"]);
          });

          this.loading = false;
        });
    },
    format(value) {
      if (
        Math.sign(
          setStringToqDate(this.duration.end_date) - setStringToDate(value)
        ) >= 0
      )
        return value;

      alert("Not Allowed Date Selected.");
      let formatValue = setOneWeek(this.duration.end_date);
      this.duration.end_date = formatValue.end_date;

      return formatValue.start_date;
    },
    setDuration(duration) {
      let startDate = new Date();
      let endDate = new Date(this.duration.end_date);

      if (duration === "week") {
        startDate.setDate(endDate.getDate() - 6);
      } else if (duration === "2weeks") {
        startDate.setDate(endDate.getDate() - 13);
      } else if (duration === "month") {
        startDate.setMonth(endDate.getMonth() - 1);
      }

      this.duration.start_date = startDate.yyyymmdd("-");
      this.duration.end_date = endDate.yyyymmdd("-");

      this.search();
    }
  },
  mounted() {
    this.search();

    setInterval(() => {
      this.$http
        .get("/resources/cin/today", { params: this.duration })
        .then(result => {
          this.chartOption.series[0].data[
            this.chartOption.series[0].data.length - 1
          ] =
            result.data.count;

          try {
            this.$refs.bar_chart.mergeOption(this.chartOption);
          } catch (e) {
            if (e.name === "TypeError") {
              return true;
            }
          }
        });
    }, 10000);
  }
};

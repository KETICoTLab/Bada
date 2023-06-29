const Influx = require("influx");
const influx = new Influx.InfluxDB({
  host: "localhost",
  database: "BADA_DATA",
  port: 8086,
});

influx.query(`select * from GP_grouping_20230616111207 limit 2;`).then((rows) => {
  Object.keys(rows[0]).forEach((key) => { 

    console.log(key);
  })
});

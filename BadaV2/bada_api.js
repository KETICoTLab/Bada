var pg = require("pg"); //postgres
// pg.types.setTypeParser(1114, (str) => str);

const express = require("express");
const app = express();
var moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("UTC");
const Database = require("./server/src/database");
const Config = require("./server/configuration/config.json");

const client = new pg.Client(Config.db.postgres);
client.connect((err) => {
  if (err) {
    console.log(err);
    throw err;
  } else {
    console.log("Database connected");
  }
});

const Influx = require("influx");
const influx = new Influx.InfluxDB(`http://${Config.db.influx.user}:${Config.db.influx.password}@${Config.db.influx.host}:${Config.db.influx.port}/BADA_DATA`);
var moment = require("moment");

app.listen(7570, () => {
  console.log(" API SERVER START ON PORT 7570");
});

/* GET Retrieve Types
 * 1. 최신 센서 데이터 조회
 * 설명 : 특정 디바이스의 아이디를 통해 최신 센서 데이터 조회
 * localhost:7576/timeseries/:aeName/:containerName/latest
 */
app.get("/timeseries/:aeName/:containerName/latest", (req, res) => {
  if (req.params.aeName && req.params.containerName) {
    let { aeName, containerName } = req.params;
    sql = `select * from timeseries where Container = '${containerName}' and ApplicationEntity = '${aeName}' order by desc limit 1`;
    console.log(sql);
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["time"] = moment(result[0].time).format("YYYYMMDDTHHmmss");
          delete result[0].time;
          delete result[0].container;
          returnValues["values"] = result[0];
          res.send(returnValues);
          console.log(">>> 200 OK  (latest - Timeseries)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (latest - Timeseries)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 2. 기간별 센서 데이터 조회
 * 설명 : 특정 디바이스가 일정 기간 내 생성한 센서 데이터 조회
 * localhost:7576/timeseries/:aeName/:containerName/period?from={startDateTime}&to={endDateTime}
 */
app.get("/timeseries/:aeName/:containerName/period", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.from && req.query.to) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.from) / 0.000001;
    var enddatetime = moment(req.query.to) / 0.000001;
    sql = `select * from timeseries where time >= ${startdatetime} and time <= ${enddatetime} AND ApplicationEntity = '${aeName}' AND Container = '${containerName}'`;

    console.log(sql);
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};
          var value = {};
          var values = [];
          for (var index = 0; index < result.length; index++) {
            var time = moment(result[index].time).format("YYYYMMDDTHHmmss");
            delete result[index].time;
            delete result[index].container;
            value = result[index];
            values.push({ time, value });
          }

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = values;
          res.send(returnValues);
          console.log(">>> 200 OK  (period)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK (period)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 3. 일간 평균값 조회
 * 설명 : 특정 디바이스가 생성한 일간 센서 데이터의 평균값 조회
 * localhost:7576/timeseries/:aeName/:containerName/average?date={Date}
 */
app.get("/timeseries/:aeName/:containerName/average", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.date) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.date) / 0.000001;
    var enddatetime = startdatetime + 86399999999000;

    sql = `select mean(*) from timeseries where ApplicationEntity = '${aeName}' AND Container = '${containerName}' and time >= ${startdatetime} and time <= ${enddatetime}`;
    console.log(sql);

    var values = [];
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};

          delete result[0].time;
          values.push(result[0]);

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = values;
          res.send(returnValues);
          console.log(">>> 200 OK  (average)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (average)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 4. 일간 최소값 조회
 * 설명 : 특정 디바이스가 생성한 일간 센서 데이터의 최소값 조회
 * localhost:7576/timeseries/:aeName/:containerName/min?date={Date}
 */
app.get("/timeseries/:aeName/:containerName/min", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.date) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.date) / 0.000001;
    var enddatetime = startdatetime + 86399999999000;

    sql = `select min(*) from timeseries where ApplicationEntity = '${aeName}' AND Container = '${containerName}' and time >= ${startdatetime} and time <= ${enddatetime}`;
    console.log(sql);

    var values = [];
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};

          delete result[0].time;
          values.push(result[0]);

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = values;
          res.send(returnValues);
          console.log(">>> 200 OK  (min)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (min)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 5. 일간 최대값 조회
 * 설명 : 특정 디바이스가 생성한 일간 센서 데이터의 최대값 조회
 * localhost:7576/timeseries/:aeName/:containerName/max?date={Date}
 */
app.get("/timeseries/:aeName/:containerName/max", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.date) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.date) / 0.000001;
    var enddatetime = startdatetime + 86399999999000;

    sql = `select max(*) from timeseries where ApplicationEntity = '${aeName}' AND Container = '${containerName}' and time >= ${startdatetime} and time <= ${enddatetime}`;
    console.log(sql);

    var values = [];
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};

          delete result[0].time;
          values.push(result[0]);

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = values;
          res.send(returnValues);
          console.log(">>> 200 OK  (max)");
        } else {
          //if no response
          console.log("{}");
          res.send("{}");
          console.log(">>> 200 OK  (max)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

//누적값을 sum으로
/* GET Retrieve Types
 * 6. 일간 누적합 조회
 * 설명 : 특정 디바이스가 생성한 일간 센서 데이터의 누적합 조회
 * localhost:7576/timeseries/:aeName/:containerName/cumsum?date={Date}
 */
app.get("/timeseries/:aeName/:containerName/cumsum", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.date) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.date) / 0.000001;
    var enddatetime = startdatetime + 86399999999000;
    //console.log(`deviceID = ${deviceID}, containerName = ${containerName}, from = ${startdatetime}, to = ${enddatetime}`);

    sql = `select sum(*) from timeseries where ApplicationEntity = '${aeName}' AND Container = '${containerName}' and time >= ${startdatetime} and time <= ${enddatetime}`;
    console.log(sql);

    var values = [];
    influx
      .query(sql)
      .then((result) => {
        if (result[0]) {
          var returnValues = {};

          delete result[0].time;
          values.push(result[0]);

          returnValues["ae"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = values;
          res.send(returnValues);
          console.log(">>> 200 OK  (cumsum)");
        } else {
          //if no response
          console.log("{}");
          res.send("{}");
          console.log(">>> 200 OK  (cumsum)");
        }
      })
      .catch((err) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error", err);
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 1. 디바이스 위치 조회
 * 설명 : 디바이스의 아이디를 통해 해당 디바이스의 마지막 위치 조회
 * localhost:7576/location/:aeName/:containerName/latest
 */
app.get("/location/:aeName/:containerName/latest", (req, res) => {
  if (req.params.aeName && req.params.containerName) {
    let { aeName, containerName } = req.params;
    let sql = "SELECT spatialdata.applicationentity, spatialdata.container, spatialdata.latitude, spatialdata.longitude, spatialdata.altitude, spatialdata.creationtime from (SELECT applicationentity, container, MAX(spatialdata.creationtime) as creationtime FROM spatialdata where applicationentity = '" + aeName + "' AND container = '" + containerName + "' GROUP BY applicationentity, container)  AS lastvalue, spatialdata WHERE lastvalue.creationtime=spatialdata.creationtime AND lastvalue.applicationentity=spatialdata.applicationentity AND lastvalue.container=spatialdata.container";

    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response) {
          var { applicationentity, container, latitude, longitude, altitude, creationtime } = response.rows[0];
          var creationtime = moment(creationtime).format("YYYYMMDDTHHmmss");
          let parseresponse = {
            aeName: applicationentity,
            container,
            location: { latitude, longitude, altitude },
            creationtime,
          };
          res.send(parseresponse);
          console.log(">>> 200 OK  (latest - Location)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (latest - Location)");
        }
      })
      .catch((e) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500, Internal Server Error...");
        console.log(e.stack);
      }); //client.query
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 2. 주변 디바이스 조회
 * 설명 : 디바이스의 아이디를 통해 해당 디바이스 주변에 위치하는 다른 디바이스 조회
 * localhost:7576/location/aeName/containerName/around?radius={중심 반경 거리(단위:m)}&term={조회 기간 (단위:s)}
 */
app.get("/location/:aeName/:containerName/around", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.radius && req.query.term) {
    let { aeName, containerName } = req.params;
    let { radius, term } = req.query;
    let sql = "select spatialdata.applicationentity, spatialdata.container, spatialdata.latitude, spatialdata.longitude, spatialdata.altitude, spatialdata.creationtime " + "from (" + "select spatialdata.applicationentity, spatialdata.container, max(spatialdata.creationtime) " + "from spatialdata " + "WHERE st_DistanceSphere(ST_SetSRID(ST_MakePoint(longitude,latitude),4326), (SELECT DISTINCT ST_SetSRID(ST_MakePoint(spatialdata.longitude,spatialdata.latitude),4326) from (SELECT applicationentity, container, MAX(spatialdata.creationtime) as creationtime FROM spatialdata where applicationentity = '" + aeName + "' AND container = '" + containerName + "' AND creationtime::timestamp > NOW() - interval '" + term + " sec' " + " GROUP BY applicationentity, container) AS lastvalue, spatialdata WHERE lastvalue.creationtime=spatialdata.creationtime AND lastvalue.applicationentity=spatialdata.applicationentity)) < " + radius + " AND creationtime::timestamp > NOW() - interval '" + term + " sec' " + "group by applicationentity, container) as lastvalue, spatialdata " + "WHERE lastvalue.max = spatialdata.creationtime AND lastvalue.applicationentity=spatialdata.applicationentity AND lastvalue.container = spatialdata.container";

    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response) {
          var devices = [];
          for (var index in response.rows) {
            if (response.rows[index].applicationentity != aeName) {
              var { applicationentity, container, latitude, longitude, altitude, creationtime } = response.rows[index];
              var creationtime = moment(creationtime).format("YYYYMMDDTHHmmss");
              let parseresponse = {
                aeName: applicationentity,
                container,
                location: { latitude, longitude, altitude },
                creationtime,
              };
              devices.push(parseresponse);
            }
          } //for
          res.send({ devices });
          console.log(">>> 200 OK  (around)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (around)");
        }
      })
      .catch((e) => {
        console.log(e.stack);
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error");
      }); //client.query
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 3. 영역 내 디바이스 조회
 * 설명 : 두 개의 GPS좌표를 통해 특정 영역 내 위치하는 디바이스 조회
 * localhost:7576/bada/location/field?firstPoint={[37.408977, 127.127674]}&secondPoint={[37.410804, 127.129812]}&term={조회 기간 (단위:s)}
 */
app.get("/location/field", (req, res) => {
  console.log("req: ", req.query);
  if (req.query.firstPoint && req.query.secondPoint && req.query.term) {
    let { firstPoint, secondPoint, term } = req.query;

    try {
      firstArr = JSON.parse(firstPoint);
      secondArr = JSON.parse(secondPoint);
    } catch (error) {
      res.status(400).send("Bad Request");
      console.log("Bad Request: JSON parse error");
      return;
    }

    if (firstArr.length == 2 && secondArr.length == 2) {
      let latitude = [firstArr[0], firstArr[0], secondArr[0], secondArr[0], firstArr[0]];
      let longitude = [firstArr[1], secondArr[1], secondArr[1], firstArr[1], firstArr[1]];
      let gpsList = "";
      for (let index = 0; index < latitude.length; index++) {
        gpsList += (index ? ", " : "") + longitude[index] + " " + latitude[index];
      }

      getObjectsInSomeSQfield(gpsList, term)
        .then((response) => {
          res.send(response);
          console.log(">>> 200 OK  (field)");
        })
        .catch((e) => {
          res.status(500).send("Internal Server Error");
          console.log(">>> 500 Internal Server Error");
          console.log(e.stack);
        });
    } else {
      res.status(400).send("Bad Request");
      console.log("Bad Request: Input argument count error");
      console.log(">>> 400 Bad Request");
      return;
    }
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

function getObjectsInSomeSQfield(gpsList, term) {
  return new Promise((resolve, reject) => {
    let areaType = "ST_Contains(ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(" + gpsList + ")')),4326), ST_SetSRID(ST_MakePoint(longitude,latitude),4326))";
    let searchObjectsFromAreaSql = "select spatialdata.applicationentity, spatialdata.container, spatialdata.latitude, spatialdata.longitude, spatialdata.altitude, spatialdata.creationtime from (select spatialdata.applicationentity, max(spatialdata.creationtime) from spatialdata WHERE creationtime::timestamp > NOW() - interval '" + term + " sec' AND " + areaType + " group by applicationentity) as lastvalue, spatialdata WHERE lastvalue.max = spatialdata.creationtime AND lastvalue.applicationentity=spatialdata.applicationentity";

    console.log(searchObjectsFromAreaSql);
    client
      .query(searchObjectsFromAreaSql)
      .then((response) => {
        var devices = [];
        for (var index in response.rows) {
          var { applicationentity, container, latitude, longitude, altitude, creationtime } = response.rows[index];
          var creationtime = moment(creationtime).format("YYYYMMDDTHHmmss");
          let parseresponse = {
            aeName: applicationentity,
            container,
            location: { latitude, longitude, altitude },
            creationtime,
          };
          devices.push(parseresponse);
        }
        resolve({ devices });
      })
      .catch((e) => {
        console.log(e.stack);
        reject(e);
      }); //client.query
  }); //return new Promise
} //function

/* GET Retrieve Types
 * 4. 디바이스 누적 이동 거리 조회
 * 설명 : 디바이스의 아이디를 통해 특정 디바이스의 누적 이동 거리 조회
 * localhost:7576/location/:aeName/:containerName/distance?from={startDateTime}&to={endDateTime}
 */
app.get("/location/:aeName/:containerName/distance", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.from && req.query.to) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.from).format("YYYY-MM-DD HH:mm:ss");
    var enddatetime = moment(req.query.to).format("YYYY-MM-DD HH:mm:ss");
    sql = "SELECT st_Length(ST_Transform(ST_MakeLine( ST_SetSRID(ST_MakePoint(geom.longitude,geom.latitude),4326)),5179)) as distancevalue FROM (select * from (select * from spatialdata where applicationentity='" + aeName + "' and container='" + containerName + "') as aevalue " + "where creationtime::date between '" + startdatetime + "' and '" + enddatetime + "' order by creationtime) As geom";

    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response.rows[0].distancevalue != null) {
          var returnValues = {};
          returnValues["applicationentity"] = aeName;
          returnValues["container"] = containerName;
          returnValues["value"] = response.rows[0].distancevalue;
          res.send(returnValues);
          console.log(">>> 200 OK   (distance)");
        } else {
          console.log("{}");
          res.send("{}");
          console.log(">>> 200 OK   (distance)");
        }
      })
      .catch((e) => {
        console.log(e.stack);
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error");
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

function distance(start_point, end_point) {
  var lat1 = start_point.latitude;
  var lng1 = start_point.longitude;
  var lat2 = end_point.latitude;
  var lng2 = end_point.longitude;

  var p = 0.017453292519943295; // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p) / 2 + (c(lat1 * p) * c(lat2 * p) * (1 - c((lng2 - lng1) * p))) / 2;
  return 12742 * Math.asin(Math.sqrt(a)) * 1000;
}

function gettimediff(startpoint, endpoint) {
  let starttime = moment(startpoint.time).format("YYYY-MM-DD HH:mm:ss.SSS");
  let endtime = moment(endpoint.time).format("YYYY-MM-DD HH:mm:ss.SSS");
  let timediffvalue = moment(endtime).diff(moment(starttime)) / 1000;
  return timediffvalue;
}

// (km/h)
function computespeed(startpoint, endpoint) {
  let timediff = gettimediff(startpoint, endpoint);

  let distancediff = distance(startpoint, endpoint);

  if (distancediff == 0) {
    tspeed = 0;
  } else {
    tspeed = distancediff / timediff;
  }
  return tspeed * 3.6;
}

/* GET Retrieve Types
 * 5. 디바이스 누적 평균 이동 속도 조회
 * 설명 : 디바이스의 아이디를 통해 기간 내 디바이스의 이동 속력 평균값 조회
 * localhost:7576/location/:aeName/:containerName/speed?from={startDateTime}&to={endDateTime}
 */
app.get("/location/:aeName/:containerName/speed", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.from && req.query.to) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.from).format("YYYY-MM-DD HH:mm:ss");
    var enddatetime = moment(req.query.to).format("YYYY-MM-DD HH:mm:ss");
    sql = "select * from (select * from spatialdata where applicationentity='" + aeName + "' and container='" + containerName + "' ) as aevalue where creationtime::date between '" + startdatetime + "' and '" + enddatetime + "' order by creationtime asc";

    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response) {
          let speedsum = 0;
          let datacount = 0;

          for (i = 0; i < response.rows.length - 1; i++) {
            let startpoint = response.rows[i];
            let endpoint = response.rows[i + 1];
            let speed = computespeed(startpoint, endpoint);
            if (speed > 0) {
              speedsum += speed;
              datacount++;
            } else {
            }
          }
          let speedaverage = speedsum / datacount;
          var returnValues = {};
          returnValues["applicationentity"] = aeName;
          returnValues["container"] = containerName;
          returnValues["value"] = speedaverage;

          res.send(returnValues);
          console.log(">>> 200 OK  (speed)");
        } else {
          res.send("{}");
          console.log("no travel distance");
          console.log(">>> 200 OK   (speed)");
        }
      })
      .catch((e) => {
        console.log(e.stack);
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error");
      });
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 6. 기간별 이동 경로 조회
 * 설명 : 디바이스의 아이디를 통해 기간 내 디바이스의 이동 방향 조회
 * localhost:7576/location/:aeName/:containerName/direction?from={startDateTime}&to={endDateTime}
 */
function convertdecimaldegreestoradians(deg) {
  return (deg * Math.PI) / 180;
}
/*decimal radian -> degree*/
function convertradianstodecimaldegrees(rad) {
  return (rad * 180) / Math.PI;
}
/*bearing*/
function getbearing(lat1, lon1, lat2, lon2) {
  let lat1_rad = convertdecimaldegreestoradians(lat1);
  let lat2_rad = convertdecimaldegreestoradians(lat2);
  let lon_diff_rad = convertdecimaldegreestoradians(lon2 - lon1);
  let y = Math.sin(lon_diff_rad) * Math.cos(lat2_rad);
  let x = Math.cos(lat1_rad) * Math.sin(lat2_rad) - Math.sin(lat1_rad) * Math.cos(lat2_rad) * Math.cos(lon_diff_rad);
  return (convertradianstodecimaldegrees(Math.atan2(y, x)) + 360) % 360;
}

app.get("/location/:aeName/:containerName/direction", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.from && req.query.to) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.from).format("YYYY-MM-DD HH:mm:ss");
    var enddatetime = moment(req.query.to).format("YYYY-MM-DD HH:mm:ss");
    sql = "select * from (select * from spatialdata where applicationentity='" + aeName + "' and container='" + containerName + "' ) as aevalue where creationtime::date between '" + startdatetime + "' and '" + enddatetime + "' order by creationtime asc";

    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response) {
          var directionlist = [];
          for (i = 0; i < response.rows.length - 1; i++) {
            let startpoint = response.rows[i];
            let endpoint = response.rows[i + 1];
            let direction = getbearing(response.rows[i].latitude, response.rows[i].longitude, response.rows[i + 1].latitude, response.rows[i + 1].longitude);
            let speed = computespeed(startpoint, endpoint);
            let creationtime = moment(response.rows[i].creationtime).format("YYYYMMDDTHHmmss");
            directionlist.push({ direction, speed, creationtime });
          }

          var returnValues = {};
          returnValues["applicationentity"] = aeName;
          returnValues["container"] = containerName;
          returnValues["values"] = directionlist;
          res.send(returnValues);
          console.log(">>> 200 OK  (direction)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (direction)");
        }
      })
      .catch((e) => {
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error");
        console.log(e.stack);
      }); //client.query
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

/* GET Retrieve Types
 * 7. 기간별 이동 경로 조회
 * 설명 : 디바이스의 아이디를 통해 기간 내 디바이스의 이동 경로 조회
 * localhost:7576/location/:aeName/:containerName/trajectory?from={startDateTime}&to={endDateTime}
 */
app.get("/location/:aeName/:containerName/trajectory", (req, res) => {
  if (req.params.aeName && req.params.containerName && req.query.from && req.query.to) {
    let { aeName, containerName } = req.params;
    var startdatetime = moment(req.query.from).format("YYYY-MM-DD HH:mm:ss");
    var enddatetime = moment(req.query.to).format("YYYY-MM-DD HH:mm:ss");
    sql = "select * from (select * from spatialdata where applicationentity='" + aeName + "' and container='" + containerName + "' ) as aevalue where creationtime::date between '" + startdatetime + "' and '" + enddatetime + "' order by creationtime asc";
    console.log(sql);
    client
      .query(sql)
      .then((response) => {
        if (response) {
          var returnValues = {};
          var trajectory = [];

          for (var index in response.rows) {
            let latitude = response.rows[index].latitude;
            let longitude = response.rows[index].longitude;
            let altitude = response.rows[index].altitude;
            var creationtime = moment(response.rows[index].creationtime).format("YYYYMMDDTHHmmss");
            trajectory.push({
              location: { latitude, longitude, altitude },
              creationtime,
            });
          } //for
          returnValues["applicationentity"] = aeName;
          returnValues["container"] = containerName;
          returnValues["trajectory"] = trajectory;
          res.send(returnValues);
          console.log(">>> 200 OK  (trajectory)");
        } else {
          //if no response
          res.send("{}");
          console.log("{}");
          console.log(">>> 200 OK  (trajectory)");
        }
      })
      .catch((e) => {
        console.log(e.stack);
        res.status(500).send("Internal Server Error");
        console.log(">>> 500 Internal Server Error");
      }); //client.query
  } else {
    res.status(400).send("Bad Request");
    console.log("input value error");
  }
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", function (req, res) {
  res.send("Bad Request (Wrong Url)", 404);
});

app.post("*", function (req, res) {
  res.send("Bad Request (Wrong Url)", 404);
});

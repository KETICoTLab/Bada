const express = require("express");
const app = express();
const http = require("http");
const httpServer = http.Server(app);
const io = require("socket.io")(httpServer, { transports: ["websocket", "polling"] });
const bodyParser = require("body-parser");
const history = require("connect-history-api-fallback");
const responseModule = require("response-time");
const redis = require("redis");

const cluster = require("cluster");
const numCPUs = require("os").cpus().length / 2;

const logStamp = require("log-timestamp")(() => {
  return "[Bada]" + new Date().toLocaleString() + " %s";
});

const Auth = require("./util/auth");
const config = require("./configuration/config.json");
const configJs = require("./configuration/config");
const env = require("./configuration/env");
const Database = require("./src/database");
const system = require("./src/system-usage");
const responseTime = require("./src/response-time");
const database = require("./src/database");
const cinSync = require("./src/cin-sync");

const request = require("request");
const redisClient = redis.createClient(config.db.redis);

let badaPort = config.server.port;
app.use("/", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Express Middleware Import
app.use(history());
app.use(responseModule());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, X-M2M-RI, X-M2M-Origin, x-access-token");
  next();
});

// API Route
app.use("/user", require("./routes/user"));
app.use("/resources", require("./routes/resources"));
app.use("/bada", require("./routes/open_resources"));
app.use("/database", require("./routes/connection"));
app.use("/configuration", require("./routes/configuration"));
app.use("/streammanagement", require("./routes/stream_management"));
// app.use('/bada', require('./routes/device'));
// app.use('/bot', require('./routes/bot'));

database.mysql.create(function (rsc) {
  if (rsc == "1") {
    database.mysql.connection(function (code, connection) {
      if (code === "200") {
        // database.mysql.tuning(function (err, results) {
        //   if (err) {
        //     console.log("[set_tuning] error");
        //   }
        console.log("success tuning");
        require("../bada_api");
        /*
	require("./pxy/pxy_mqtt");
        require("./pxy/pxy_coap");
        require("./pxy/pxy_ws");
	*/
        /**
         * Create Raw Sink Connector (Timeseries, Postgresql) via KSQLDB
         */
        var options = {
          method: "POST",
          url: `http://${config.ksqldb.host}:${config.ksqldb.port}/ksql`,
          headers: {
            "Content-Type": "application/vnd.ksql.v1+json",
            Accept: "application/vnd.ksql.v1+json",
          },
        };
        let body = {
          ksql: "",
          streamsProperties: {
            "ksql.streams.auto.offset.reset": "earliest",
          },
        };
        let drop_sql = `DROP CONNECTOR IF EXISTS kafka_influx_sink_connector; DROP CONNECTOR IF EXISTS kafka_postgresql_sink_connector;`;
        let create_sql = `CREATE SINK CONNECTOR kafka_influx_sink_connector WITH ('connector.class' = 'platform.bada.v2.kafka.connect.influxdb.InfluxDBSinkConnector', 'topics' = 'timeseries', 'influxdb.url' = 'http://${config.db.influx.host}:${config.db.influx.port}', 'influxdb.database' = '${config.db.influx.database}', 'influxdb.username' = '${config.db.influx.user}', 'influxdb.password' = '${config.db.influx.password}', 'kafka.url' = '${config.kafka.host}', 'kafka.port' = '${config.kafka.port}', 'redis.url' = '${config.db.redis.host}', 'redis.port' = '${config.db.redis.port}', 'key.converter'='org.apache.kafka.connect.storage.StringConverter', 'key.converter.schemas.enable'='false', 'value.converter'='org.apache.kafka.connect.json.JsonConverter','value.converter.schemas.enable'='false'); CREATE SINK CONNECTOR kafka_postgresql_sink_connector WITH ('connector.class' = 'io.confluent.connect.jdbc.JdbcSinkConnector', 'topics' = 'spatialdata', 'input.data.format'='JSON', 'connection.url'='jdbc:postgresql://${config.db.postgres.host}:${config.db.postgres.port}/${config.db.postgres.database}', 'connection.host'='${config.db.postgres.host}', 'connection.port'='${config.db.postgres.port}', 'connection.user'='${config.db.postgres.user}', 'connection.password'='${config.db.postgres.password}', 'redis.url'='${config.db.redis.host}', 'kafka.url'='${config.kafka.host}:${config.kafka.port}', 'db.name'='${config.db.postgres.database}', 'auto.create'='true', 'key.converter'='org.apache.kafka.connect.storage.StringConverter','key.converter.schemas.enable'='false', 'value.converter'='org.apache.kafka.connect.json.JsonConverter', 'value.converter.schemas.enable'='false');`;
        body.ksql = drop_sql;
        options.body = JSON.stringify(body);
        let promiseRequest = new Promise((resolve) => {
          request(options, function (error, response) {
            if (error) throw new Error(error);
            let body = JSON.parse(response.body);

            if (body.error_code == 50000 || body.error_code == 40001 || body.error_code == 40000) {
              console.log("Drop Connector Error : ", body);
            } else {
              body.forEach((element) => {
                console.log(element);
              });
            }

            resolve(response.body);
          });
        });
        promiseRequest.then((result) => {
          body.ksql = create_sql;
          options.body = JSON.stringify(body);
          request(options, function (error, response) {
            if (error) throw new Error(error);
            let body = JSON.parse(response.body);

            if (body.error_code == 50000 || body.error_code == 40001 || body.error_code == 40000) {
              console.log("Create Connector Error : ", body);
            } else {
              body.forEach((element) => {
                console.log(element);
              });
            }
          });
        });

        // datamodel overwrite to redis
        let dm_sql = `select path, dm from cnt`;
        database.mysql.query(dm_sql, connection, (err, result) => {
          if (err) {
            console.log(err);
            return;
          }
          if (result[0]) {
            result.forEach((element) => {
              if (element.dm !== null) {
                redisClient.hmset("datamodel", element.path, element.dm);
              }
            });
          }

          connection.release();
        });
      } else {
        console.log("[db.connect] No Connection");
      }
    });
  }
});

Date.prototype.yyyymmdd = function (mark) {
  let yyyy = this.getFullYear().toString();
  let mm = (this.getMonth() + 1).toString();
  let dd = this.getDate().toString();

  if (!this.valueOf()) return " ";

  if (!mark) {
    mark = "";
  }

  return yyyy + mark + (mm[1] ? mm : "0" + mm[0]) + mark + (dd[1] ? dd : "0" + dd[0]);
};

Object.prototype.isEmpty = function () {
  for (let key in this) {
    if (this.hasOwnProperty(key)) return false;
  }
  return true;
};

let systemUsageEmitter = setInterval(() => {
  let results = {};

  system
    .usage()
    .then((result) => {
      results.server = result.osUsage;
      results.process = result.processUsage;
      return responseTime.average();
    })
    .then((responseAvg) => {
      results.responseTime = responseAvg;
      io.to(config.server.admin.id).emit("system-usage", results);
    })
    .then(() => {
      responseTime.clear();
    });
}, 60000);

io.on("connection", (socket) => {
  let userId = Auth.getUserId(socket.handshake.query.token);
  let secretId = socket.handshake.query.secretKey;

  if (userId === "Invalid token." && !socket.handshake.query.secretKey) {
    socket.disconnect();
    console.log("Socket connect failed " + userId);
    console.log(socket.handshake.query.token);
    return;
  }

  if (secretId) {
    userId = secretId;
  }

  socket.join(userId);
  console.log("Socket Connected and Joined : " + userId);

  socket.on("disconnect", (reason) => {
    console.log("Socket Disconnected : " + userId);
  });
});

Database.mysql.create(function (rsc) {
  if (rsc === "1") {
    http.globalAgent.maxSockets = 1000000;

    httpServer.listen({ port: badaPort, host: "0.0.0.0", agent: false }, () => {
      console.log("Bada app listening on: %s", badaPort);
    });

    process.on("uncaughtException", function (e) {
      console.log(e);
    });
  }
});
Database.timeseries.connection();
Database.spatial.connection();

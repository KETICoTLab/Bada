const http = require("http");
const config = require("../configuration/config.json");
const router = require("express").Router();
const Influx = require("influx");
const redis = require("redis");
const redisClient = redis.createClient(config.db.redis);

var options = {
  method: "POST",
  hostname: config.ksqldb.host,
  port: config.ksqldb.port,
  path: "/ksql",
  headers: {
    "Content-Type": "application/vnd.ksql.v1+json",
    Accept: "application/vnd.ksql.v1+json",
  },
  maxRedirects: 20,
};
const influx = new Influx.InfluxDB({
  host: config.db.influx.host,
  database: config.db.influx.database,
  password: config.db.influx.password,
  // schema: [
  //   {
  //     measurement: "tide",
  //     fields: { height: Influx.FieldType.FLOAT },
  //     tags: ["unit", "location"],
  //   },
  // ],
});

/**
 * Get Connector Status
 */
/*
[
  {
    "@type": "connector_list",
    statementText: "SHOW CONNECTORS;",
    warnings: [],
    connectors: [
      {
        name: "KAFKA_POSTGRESQL_SINK_CONNECTOR",
        type: "sink",
        className: "io.confluent.connect.jdbc.JdbcSinkConnector",
        state: "RUNNING (1/1 tasks RUNNING)",
      },
      {
        name: "KAFKA_INFLUX_SINK_CONNECTOR",
        type: "sink",
        className: "com.github.jcustenborder.kafka.connect.influxdb.CustomInfluxDBSinkConnector",
        state: "WARNING (0/1 tasks RUNNING)",
      },
    ],
  },
]
*/
router.get("/connectors", (req, res) => {
  options.path = "/ksql";
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    let topicData = {};

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      resultData = JSON.parse(data);
      res.status(response.statusCode).json(resultData[0].connectors);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: "SHOW CONNECTORS;",
    streamsProperties: {},
  });
  request.write(postData);

  request.end();
});

/**
 * Get Connector Status
 */
/*
[
  {
    "@type": "connector_description",
    statementText: 'DESCRIBE CONNECTOR "KAFKA_INFLUX_SINK_CONNECTOR";',
    connectorClass: "com.github.jcustenborder.kafka.connect.influxdb.CustomInfluxDBSinkConnector",
    status: {
      name: "KAFKA_INFLUX_SINK_CONNECTOR",
      connector: {
        state: "RUNNING",
        worker_id: "192.168.254.145:8083",
      },
      tasks: [
        {
          id: 0,
          state: "FAILED",
          worker_id: "192.168.254.145:8083",
          trace: "org.apache.kafka.connect.errors.ConnectException: Exiting WorkerSinkTask due to unrecoverable exception.\n\tat org.apache.kafka.connect.runtime.WorkerSinkTask.deliverMessages(WorkerSinkTask.java:561)\n\tat org.apache.kafka.connect.runtime.WorkerSinkTask.poll(WorkerSinkTask.java:322)\n\tat org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:224)\n\tat org.apache.kafka.connect.runtime.WorkerSinkTask.execute... 10 more\n",
        },
      ],
      type: "sink",
    },
    sources: [],
    topics: [],
    warnings: [],
  },
]
*/
router.get("/connectorStatus/:connector", (req, res) => {
  options.path = "/ksql";
  let connector = req.params.connector;
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    let topicData = {};

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      res.status(response.statusCode).json(data);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `DESCRIBE CONNECTOR "${connector}";`,
    streamsProperties: {},
  });
  request.write(postData);

  request.end();
});

/**
 * Get Sensor List
 */
/*
[
  {
    "@type": "kafka_topics",
    statementText: "SHOW TOPICS;",
    topics: [
      {
        name: "default_ksql_processing_log",
        replicaInfo: [1],
      },
      {
        name: "refine_spatial",
        replicaInfo: [1],
      },
      {
        name: "spatialdata",
        replicaInfo: [1],
      },
      {
        name: "timeseries",
        replicaInfo: [1],
      },
    ],
    warnings: [],
  },
];
*/
router.get("/sensors", (req, res) => {
  options.path = "/ksql";
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    let topicData = {};

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      res.status(response.statusCode).json(data);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: "SHOW TOPICS;",
    streamsProperties: {},
  });
  request.write(postData);

  request.end();
});

/**
 * Describe Table
 */

// spatial data
router.get("/schema/spatial", (req, res) => {
  options.path = "/ksql";
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      if (response.statusCode === 400) {
        res.send(null);
      } else {
        // resultData = JSON.parse(data);
        let respData = {};
        resultData = JSON.parse(data)[0].sourceDescription.fields;
        resultData.forEach((element, index) => {
          respData[element.name] = element.schema.type;
        });
        res.status(response.statusCode).json(respData);
      }
    });

    response.on("error", function (error) {
      console.log(error);
      res.status(response.statusCode).json(error);
    });
  });
  console.log(`Describe spatial;`);
  var postData = JSON.stringify({
    ksql: `Describe spatial;`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});

// timeseries data
router.get("/schema/:sensorAe/:sensorCnt", (req, res) => {
  options.path = "/ksql";
  // let sensorName = req.params.sensorName;
  let sensorAe = req.params.sensorAe;
  let sensorCnt = req.params.sensorCnt;
  console.log(sensorAe, sensorCnt);
  // let resources = sensorName.split("/");
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      if (response.statusCode === 400) {
        res.send(null);
      } else {
        // resultData = JSON.parse(data);
        let respData = {};
        resultData = JSON.parse(data)[0].sourceDescription.fields;
        resultData.forEach((element, index) => {
          respData[element.name] = element.schema.type;
        });
        res.status(response.statusCode).json(respData);
      }
    });

    response.on("error", function (error) {
      console.log(error);
      res.status(response.statusCode).json(error);
    });
  });
  console.log(`Describe "${sensorAe}_${sensorCnt}";`);
  var postData = JSON.stringify({
    ksql: `Describe "${sensorAe}_${sensorCnt}";`,
    streamsProperties: {},
  });

  request.write(postData);
  request.end();
});

// redis storage option retrieve
router.get("/redisStorage", (req, res) => {
  let respdata = [];
  redisClient.hgetall("storage", (err, obj) => {
    if (!err) {
      Object.keys(obj).forEach((element) => {
        if (obj[element] > 1) {
          respdata.push(JSON.parse(element));
        }
      })
      // console.log(JSON.stringify(respdata));
      res.send(JSON.stringify(respdata));
    } else {
      res.send(err);
    }
  });
});

/**
 * Create Sensor Table
 */
router.post("/createSensor", (req, res) => {
  // spatial sensor create
  options.path = "/ksql";
  if (req.body.sensorName == "spatial") {
    let sql = `create stream if not exists spatial (applicationentity varchar, container varchar, creationtime varchar, latitude double, longitude double, altitude double) with (kafka_topic = 'refine.spatial', value_format = 'json', partitions = 1);`;

    let request = http.request(options, function (response) {
      let data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function (chunk) {
        console.log("Create spatial Sensor : ", data);
        res.status(response.statusCode).json(data);
      });

      response.on("error", function (error) {
        console.error(error);
        res.status(400).send(error);
      });
    });

    var postData = JSON.stringify({
      ksql: sql,
      streamsProperties: { "ksql.streams.auto.offset.reset": "earliest" },
    });
    request.write(postData);
    request.end();
    return;
  }

  // timeseries sensor create
  let resources = req.body.sensorName.split("/");
  let sensorAe = resources[0];
  let sensorCnt = resources[1];
  influx
    // .query(`select * from timeseries where ApplicationEntity='${sensorAe}' and Container='${sensorCnt}' limit 1`)
    .query(`select * from ${sensorAe} where Container='${sensorCnt}' limit 1`)
    .then((result) => {
      let rawColumn = [];
      Object.keys(result[0]).forEach((key) => {
        // if (result[0][key] === null || key === "time") {
        //   delete result[0][key];
        // } 
        // else{
        //   rawColumn.push(key.split('.')[2]);
        // }
        if (key.includes(`${sensorAe}.${sensorCnt}`)) {
          rawColumn.push(key);
        } else if (key == 'APPLICATIONENTITY' || key == 'CONTAINER') {
          rawColumn.push(key);
        }
      });
      //Get Sensor Schema from InfluxDB
      console.log("Create Sensor Result: ", result);
      // let rawColumn = Object.keys(result[0]);
      let dataColumn = {};
      let sql = `create stream "${sensorAe}_${sensorCnt}" (`;
      rawColumn.forEach((key, index) => {
        if (result[0][key] !== null) {
          if (index !== 0) sql += ", ";
          let dataType = typeof result[0][key] === "number" ? "Double" : "String";

          if (key.includes(`${sensorAe}.${sensorCnt}`)) {
            sql += `"${key.split('.')[2]}" ${dataType}`;
          } else {
            sql += `"${key}" ${dataType}`;
          }
        }
      });
      sql += `) with (kafka_topic = 'refine.${sensorAe}.${sensorCnt}', value_format = 'json', partitions = 1);`;

      console.log("SQL : ", sql);
      // Create Table In KSQLDB
      let request = http.request(options, function (response) {
        let data = "";

        response.on("data", function (chunk) {
          data += chunk;
        });

        response.on("end", function (chunk) {
          console.log("Create timeseries Sensor : ", data);
          res.status(response.statusCode).json(data);
        });

        response.on("error", function (error) {
          console.error(error);
          res.status(400).send(error);
        });
      });

      var postData = JSON.stringify({
        ksql: sql,
        streamsProperties: { "ksql.streams.auto.offset.reset": "earliest" },
      });
      request.write(postData);
      request.end();
    })
    .catch((error) => console.log("error: ", error));
});

/**
 * Get Query List
 */
/**
 * [{"@type":"queries","statementText":"SHOW QUERIES;","queries":[{"queryString":"CREATE TABLE ACCOUNTS_TO_MONITOR WITH (KAFKA_TOPIC='accounts_to_monitor', PARTITIONS=1, REPLICAS=1, VALUE_FORMAT='JSON') AS SELECT\n  TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss Z') WINDOW_START,\n  TIMESTAMPTOSTRING(WINDOWEND, 'yyyy-MM-dd HH:mm:ss Z') WINDOW_END,\n  REFINE_SPATIAL.CONTAINER CONTAINER\nFROM REFINE_SPATIAL REFINE_SPATIAL\nWINDOW TUMBLING ( SIZE 1 MINUTES ) \nWHERE (REFINE_SPATIAL.LATITUDE > 90)\nGROUP BY REFINE_SPATIAL.CONTAINER\nHAVING (COUNT(*) > 3)\nEMIT CHANGES;","sinks":["ACCOUNTS_TO_MONITOR"],"sinkKafkaTopics":["accounts_to_monitor"],"id":"CTAS_ACCOUNTS_TO_MONITOR_7","statusCount":{"RUNNING":1},"queryType":"PERSISTENT","state":"RUNNING"}],"warnings":[]}]
 */
router.get("/queries", (req, res) => {
  redisClient.hgetall("query", (err, obj) => {
    if (!err) {
      res.send(obj);
    } else {
      res.send(err);
    }
  });
});

router.get("/queryDetails", (req, res) => {
  options.path = "/ksql";
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    let queryData = {};

    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", async function (chunk) {
      resultData = JSON.parse(data)[0];
      queryData = resultData.queries;
      // Save Query Details in Redis

      await Promise.all(
        queryData.map(async (element) => {
          await redisClient.hmset("queryDetails", element.id, JSON.stringify(element));
        })
      );
      redisClient.hgetall("queryDetails", (err, obj) => {
        if (err) {
          res.send(err);
        } else {
          res.send(obj);
        }
      });
      // res.status(response.statusCode).json(queryData);/
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: "SHOW QUERIES;",
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});

/**
 * Terminate Query
 * (Drop Table)
 */
router.delete("/query", (req, res) => {
  options.path = "/ksql";
  let queryID = req.query.queryID;
  let sinkTable = req.query.sinkTable;
  let sinkKafkaTopic = req.query.sinkKafkaTopic;
  dropInfluxdbConnector(sinkKafkaTopic, (result) => {
    console.log(result);
    let request = http.request(options, function (response) {
      let data = "";
      let resultData = "";

      // console.log("queryData : ", queryData.queryString);
      response.on("data", function (chunk) {
        data += chunk;
      });

      response.on("end", function (chunk) {
        console.log("Drop table and terminate query result : ", data);
        resultData = JSON.parse(data);

        redisClient.hdel("query", queryID, function (err, reply) {
          if (err) console.log(err);
          if (reply === 1) {
            console.log(`LOG [Redis] -- Delete terminated query data\n`, queryID);
          } else {
            console.log(`LOG [Redis] -- No Exist query data \n`, queryID);
          }
        });
        redisClient.hdel("queryDetails", queryID, function (err, reply) {
          if (err) console.log(err);
          if (reply === 1) {
            console.log(`LOG [Redis] -- Delete terminated querydetails data\n`, queryID);
          } else {
            console.log(`LOG [Redis] -- No Exist querydetails data \n`, queryID);
          }
        });

        res.status(response.statusCode).json(resultData);
      });

      response.on("error", function (error) {
        console.log("Drop Table Error ", error);
        let terminateRequest = http.request(options, function (terminateResponse) {
          let terminateData = "";
          terminateResponse.on("data", function (chunk) {
            terminateData += chunk;
          });
          terminateResponse.on("end", function (chunk) {
            console.log("Terminate query result : ", terminateData);
            resultData = JSON.parse(data);

            redisClient.hdel("query", queryID, function (err, reply) {
              if (err) console.log(err);
              if (reply === 1) {
                console.log(`LOG [Redis] -- Delete terminated query data\n`, queryID);
              } else {
                console.log(`LOG [Redis] -- No Exist query data \n`, queryID);
              }
            });
            redisClient.hdel("queryDetails", queryID, function (err, reply) {
              if (err) console.log(err);
              if (reply === 1) {
                console.log(`LOG [Redis] -- Delete terminated querydetails data\n`, queryID);
              } else {
                console.log(`LOG [Redis] -- No Exist querydetails data \n`, queryID);
              }
            });
            res.status(response.statusCode).json(resultData);
          });
          terminateResponse.on("error", function (terminateError) {
            console.log("Terminate Query Error ", terminateError);
            res.status(400).send(terminateError);
          });
        });

        var terminateData = JSON.stringify({
          ksql: `terminate ${queryID};`,
          streamsProperties: {},
        });
        request.write(terminateData);
        request.end();
      });
    });
    var postData = JSON.stringify({
      ksql: `DROP TABLE "${sinkTable}" DELETE TOPIC;`,
      streamsProperties: {},
    });
    request.write(postData);
    request.end();
  });
});

/**
 * Create Query
 */
router.post("/query", (req, res) => {
  let query = req.body.query;
  console.log("create query : ", query);

  if (query.split(" ")[0] === "select" || query.split(" ")[0] === "SELECT") {
    options.path = "/query";
  } else {
    options.path = "/ksql";
  }

  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";

    let queryID = "";
    let queryName = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);
      // CREATE INFLUXDB CONNCETOR with queryID

      // create redis query data
      if (resultData[0].commandStatus) {
        let date = getCurrentDate();
        queryName = `user_query_${date}`;
        queryID = resultData[0].commandStatus.queryId;
        redisClient.hmset("query", queryID, queryName);
      }

      res.status(response.statusCode).json(resultData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `${query}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});


/**
 * Get Query Results

[
  {"header":{"queryId":"","schema":"`APPLICATIONENTITY` STRING KEY},
  {"row":{"columns":["testae", ...]}},
  {"row":{"columns":["testae", ...]}}
]
 */
router.get("/queryResults", ((req, res) => {
  let sinkTable = req.query.sinkTable;
  console.log("Get query result - sink table : " ,sinkTable);
  options.path = "/query";
  let sql = `select * from "${sinkTable}" limit 10;`;

  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";
    let field = [];
    let returnData = [];
    
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);

      let schemaTxt = JSON.stringify(resultData[0].header.schema);
      let schemaArr = [...schemaTxt.split(",")];
      // ` ` 사이에 있는 문자 추출
      let regexp = /(?<=\`)(.*?)(?=\`)/g;

      schemaArr.forEach((element) => {
        field.push(element.match(regexp)[0]);
      })

      for (let i = 1; i < resultData.length; i++){
        let colArr = [...resultData[i].row.columns];
        let colData = {};
        field.forEach((value, index) => {
          colData[value] = colArr[index];
        });
        delete colData.WINDOWEND;
        delete colData.WINDOWSTART;
        returnData.push(colData);
      }

      res.status(response.statusCode).json(returnData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `${sql}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
}))


/**
 * Anomaly Detection
 */

router.post("/function/anomalyDetection", (req, res) => {
  let data = req.body.data;
  console.log("create query : ", data);
  options.path = "/ksql";
  let sensorAe = "";
  let sensorCnt = "";
  let sql = "";
  let sensor = data.sensor;
  let comparisonValue = data.comparisonValue;
  let column = data.column;
  let queryID = "";
  let queryName = "";

  let inequalitySign = "";
  data.inequalitySign === "less then" ? (inequalitySign = "<") : data.inequalitySign === "greater then" ? (inequalitySign = ">") : (inequalitySign = "=");

  let date = getCurrentDate();
  if (sensor !== "spatial") {
    let resources = sensor.split("/");
    sensorAe = resources[0];
    sensorCnt = resources[1];
    sql = `CREATE TABLE "AD_${sensorAe}_${sensorCnt}_${date}"
    WITH (kafka_topic='AD_${sensorAe}_${sensorCnt}_${date}', partitions=1, value_format='JSON', KEY_FORMAT = 'JSON') AS 
    SELECT TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_START, 
    TIMESTAMPTOSTRING(WINDOWEND, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_END, 
    ApplicationEntity, Container, COUNT(*) AS COUNT
    FROM "${sensorAe}_${sensorCnt}"
    WINDOW TUMBLING (SIZE ${data.time} SECONDS)
    WHERE ${column} ${inequalitySign} ${comparisonValue}
    GROUP BY "APPLICATIONENTITY", "CONTAINER"
    Having Count(*) > ${data.count};`;
  } else {
    sql = `CREATE TABLE AD_spatial_${date}
    WITH (kafka_topic='AD_spatial_${date}', partitions=1, value_format='JSON', KEY_FORMAT = 'JSON') AS 
    SELECT TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_START, 
    TIMESTAMPTOSTRING(WINDOWEND, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_END, 
    APPLICATIOINENTITY, CONTAINER, COUNT(*) AS COUNT
    FROM spatial
    WINDOW TUMBLING (SIZE ${data.time} SECONDS)
    WHERE ${column} ${inequalitySign} ${comparisonValue}
    GROUP BY "APPLICATIONENTITY", "CONTAINER"
    Having Count(*) > ${data.count};`;
  }

  console.log(sql);

  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);

      if (!resultData[0]['@type'].includes('error')) {
        //CREATE INFLUXDB CONNECTOR with
        if (sensor !== "spatial") {
          queryName = `AnomalyDetection_${sensorAe}_${sensorCnt}_${column}_${inequalitySign}_${comparisonValue}`;
          createInfluxdbConnector(`AD_${sensorAe}_${sensorCnt}_${date}`);
        } else {
          queryName = `AnomalyDetection_${spatial}_${column}_${inequalitySign}_${comparisonValue}`;
          createInfluxdbConnector(`AD_spatial_${date}`);
        }

        // create redis query data
        if (resultData[0].commandStatus) {
          queryID = resultData[0].commandStatus.queryId;
          redisClient.hmset("query", queryID, queryName);
        }

      }

      res.status(response.statusCode).json(resultData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });
  var postData = JSON.stringify({
    ksql: `${sql}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});

/**
 * Aggregation Data by Period
 */
/** INFLUXDB
 * 
 * CREATE SINK CONNECTOR grouping_influx_sink WITH (
'connector.class' = 'com.github.jcustenborder.kafka.connect.influxdb.com.github.jcustenborder.kafka.connect.influxdb.CustomInfluxDBSinkConnector', 
'topics' = 'grouping_sensors',
'influxdb.url' = 'http://192.168.1.145:8086', 
'influxdb.database' = 'raw_kafka_data',
'influxdb.username' = 'admin',
'influxdb.password' = 'keti123', 
'key.converter'='org.apache.kafka.connect.storage.StringConverter', 'key.converter.schemas.enable'='false', 
'value.converter'='org.apache.kafka.connect.json.JsonConverter', 'value.converter.schemas.enable'='false');
 * 
 */
router.post("/function/windowAggregation", (req, res) => {
  let data = req.body.data;
  console.log("create query : ", data);
  options.path = "/ksql";
  let sensorAe = "";
  let sensorCnt = "";
  let sql = "";
  let date = getCurrentDate();
  let aggregationFunction = data.aggregationFunction;
  let column = data.column;
  let sensor = data.sensor;
  let queryID = "";
  let queryName = "";

  if (sensor !== "spatial") {
    let resources = sensor.split("/");
    sensorAe = resources[0];
    sensorCnt = resources[1];
    sql = `CREATE TABLE "WA_${sensorAe}_${sensorCnt}_${date}"
    WITH (kafka_topic='WA_${sensorAe}_${sensorCnt}_${date}', partitions=1, value_format='JSON', key_format='JSON') AS SELECT
    ApplicationEntity, Container, TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_START,
    TIMESTAMPTOSTRING(WINDOWEND, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_END, 
    COUNT(*) AS COUNT, ${aggregationFunction}(${column}) AS RESULT
    FROM "${sensorAe}_${sensorCnt}"
    WINDOW TUMBLING(SIZE ${data.time} SECONDS)
    GROUP BY ApplicationEntity, Container;`;
  } else {
    sql = `CREATE TABLE WA_spatial_${date}
    WITH (kafka_topic='WA_spatial_${date}', partitions=1, value_format='JSON', key_format='JSON') AS SELECT
    ApplicationEntity, Container, TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_START,
    TIMESTAMPTOSTRING(WINDOWEND, 'yyyy-MM-dd HH:mm:ss Z') AS WINDOW_END, 
    COUNT(*) AS COUNT, ${aggregationFunction}(${column}) AS RESULT
    FROM spatial
    WINDOW TUMBLING(SIZE ${data.time} SECONDS)
    GROUP BY ApplicationEntity, Container;`;
  }

  console.log(sql);
  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);
      //CREATE INFLUXDB CONNECTOR with

      if (sensor !== "spatial") {
        queryName = `WindowAggregation_${sensorAe}_${sensorCnt}_${aggregationFunction}_${column}`;
        createInfluxdbConnector(`WA_${sensorAe}_${sensorCnt}_${date}`);
      } else {
        queryName = `WindowAggregation_spatial_${aggregationFunction}_${column}`;
        createInfluxdbConnector(`WA_spatial_${date}`);
      }
      if (resultData[0].commandStatus) {
        queryID = resultData[0].commandStatus.queryId;
        redisClient.hmset("query", queryID, queryName);
      }
      res.status(response.statusCode).json(resultData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `${sql}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});

/**
 * Device Grouping
 */
/**
 * CREATE TABLE grouping_sensors(ContainerName varchar, column type, column type ...)
WITH (kafka_topic='grouping_sensors', partitions=1, value_format='JSON')
INSERT INTO grouping_sensors SELECT 'ae_sensor1' AS SENSORNAME, * FROM ae_sensor1;
INSERT INTO grouping_sensors SELECT 'ae_sensor2' AS SENSORNAME, * FROM ae_sensor2;
INSERT INTO grouping_sensors SELECT 'ae_sensor3' AS SENSORNAME, * FROM ae_sensor3;
 */

router.post("/function/grouping", (req, res) => {
  let data = req.body.data;
  console.log("create query : ", data, req.body.schema);
  let sensors = data.sensor;
  let groupName = data.groupName;
  let schema = JSON.parse(req.body.schema);
  let columns = Object.keys(schema);
  let sensorName = "";
  options.path = "/ksql";
  let date = getCurrentDate();

  let queryID = "";
  let queryName = "";

  let sql = `CREATE STREAM "${groupName}" (`;
  columns.forEach((key, index) => {
    sql += `${key} ${schema[key]}`;
    if (index < columns.length - 1) {
      sql += ", ";
    }
  });
  sql += `) WITH (kafka_topic='GP_${groupName}_${date}', partitions=1, value_format='JSON', key_format='JSON'); `;
  sensors.forEach((element) => {
    sensorName = `${element[0]}_${element[1]}`;
    sql += `INSERT INTO "${groupName}" SELECT * FROM "${sensorName}"; `;
  });

  console.log(sql);

  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);

      //CREATE INFLUXDB CONNECTOR with
      createInfluxdbConnector(`GP_${groupName}_${date}`);
      // Save Redis Data
      if (resultData[1].commandStatus) {
        queryID = resultData[1].commandStatus.queryId;
        queryName = `Grouping_${groupName}`;
        redisClient.hmset("query", queryID, queryName);
      }
      res.status(response.statusCode).json(resultData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `${sql}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});


/**
 * Device Timesync
 */
/**
 * CREATE TABLE grouping_sensors(ContainerName varchar, column type, column type ...)
WITH (kafka_topic='grouping_sensors', partitions=1, value_format='JSON')
INSERT INTO grouping_sensors SELECT 'ae_sensor1' AS SENSORNAME, * FROM ae_sensor1;
INSERT INTO grouping_sensors SELECT 'ae_sensor2' AS SENSORNAME, * FROM ae_sensor2;
INSERT INTO grouping_sensors SELECT 'ae_sensor3' AS SENSORNAME, * FROM ae_sensor3;
 */
router.post("/function/timesync", (req, res) => {
  // console.log("create query : ", req.body);
  let { sensor, groupName } = req.body.data;
  let schema = JSON.parse(req.body.schema);
  let columns = Object.keys(schema);
  
  let deleteIdx = columns.indexOf("APPLICATIONENTITY");
  if(deleteIdx != -1) columns.splice(deleteIdx, 1);
  deleteIdx = columns.indexOf("CONTAINER");
  if (deleteIdx != -1) columns.splice(deleteIdx, 1);
  
  let numberOfSensor = sensor.length;
  options.path = "/ksql";
  let date = getCurrentDate();

  let queryID = "";
  let queryName = "";

  /**
   * create grouping stream
   * create stream DO_three as select a.AE, from_unixtime(a.rowtime), a.container, b.container, a.temperature, a.humidity, b.gps, c.carbon from temp_sensor_stream a join location_sensor_stream b within 2 hours on a.AE = b.AE join carbon_sensor_stream c within 2 hours on a.AE=c.AE emit changes;
   */

  let unionSql = `CREATE STREAM "TS_UNION_${groupName}_${date}" WITH (kafka_topic='TS_UNION_${groupName}_${date}', partitions=1, value_format='JSON', key_format='JSON')` +
    `as select a.applicationentity as applicationentity, from_unixtime(a.rowtime)`;
  for (let n = 0; n < numberOfSensor; n++) {
    // unionSql += `, `
    // unionSql += `${sensorAlias}.container`;
    let sensorAlias = String.fromCharCode(n + 97);

    for (let column of columns) {
      unionSql += `, ${sensorAlias}.${column}`;

    }
  }
  unionSql += ` from "${sensor[0][0]}_${sensor[0][1]}" a`;

  for (let n = 1; n < numberOfSensor; n++) {
    let streamName = `"${sensor[n][0]}_${sensor[n][1]}"`;
    let sensorAlias = String.fromCharCode(n+97)
    unionSql += ` join ${streamName} ${sensorAlias} within 2 hours on a.applicationentity = ${sensorAlias}.applicationentity`;
    if (n == numberOfSensor - 1) {
      unionSql += ` emit changes;`
    }
  }
  
  console.log(unionSql);

  /**
   * create tumbling table get latest data
   * select A_AE, from_unixtime(windowstart) as timestamp, latest_by_offset(temperature) as temperature, latest_by_offset(gps) as gps, latest_by_offset(carbon) as carbon from do_three window tumbling (size 10 minutes) group by a_ae emit changes;
   */

  let sql = `CREATE TABLE "TS_${groupName}_${date}" WITH (kafka_topic='TS_${groupName}_${date}', partitions=1, value_format='JSON', key_format='JSON')` +
    ` as select applicationentity, from_unixtime(windowstart) as timestamp`;
  for (let n = 0; n < numberOfSensor; n++){
    let sensorAlias = String.fromCharCode(n + 97);
    for (let column of columns) {
      sql += `, latest_by_offset(${sensorAlias}_${column}) as ${sensor[n][1]}_${column}`;
    }
  }

  sql += ` from "TS_UNION_${groupName}_${date}" window tumbling (size 10 minutes) group by applicationentity emit changes;`


  console.log(sql);

  let unionRequest = http.request(options, function (unionResponse) {
    let unionData = "";

    unionResponse.on("data", function (unionChunk) {
      unionData += unionChunk;
    });

    unionResponse.on("end", function () {
      console.log(unionData);
      
      let request = http.request(options, function (response) {
        let data = "";
        let resultData = "";
        
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          resultData = JSON.parse(data);

          //CREATE INFLUXDB CONNECTOR with
          createInfluxdbConnector(`TS_${groupName}_${date}`);
          // Save Redis Data
          if (resultData[0].commandStatus) {
            queryID = resultData[0].commandStatus.queryId;
            queryName = `Timesync_${groupName}`;
            redisClient.hmset("query", queryID, queryName);
          }
          res.status(response.statusCode).json(resultData);
        })
        response.on("error", function (error) {
          console.error(error);
          res.status(400).send(error);
        })
      })

      let postData = JSON.stringify({
        ksql: `${sql}`,
        streamsProperties: {},
      });
      request.write(postData);
      request.end();

    });

    unionResponse.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  let unionPost = JSON.stringify({
    ksql: `${unionSql}`,
    streamsProperties: {},
  });
  unionRequest.write(unionPost);
  unionRequest.end();
});

/**
 * geoFence
 */
/**
 * create table geofence with (kafka_topic='geofence', partitions=1, value_format='json', key_format='json') as select sensor_name, LATEST_BY_OFFSET(Latitude) as latitude, LATEST_BY_OFFSET(Longitude) as longitude, LATEST_BY_OFFSET(creation_time) as creation_time, GEO_CONTAINED(LATEST_BY_OFFSET(Latitude), LATEST_BY_OFFSET(Longitude),'POLYGON((129.4323059 35.5337368, 129.4326204 35.5178721, 129.4337507 35.5115060, 129.4510655 35.5416463, 129.4410811 35.5352173, 129.4323059 35.5337368))') as GEO_CONTAINED FROM sensor group by sensor_name;
 */

router.post("/function/geoFence", (req, res) => {
  let data = req.body.data;
  console.log("create query : ", data);
  let { ae, cnt, fenceName, polygon } = data;

  options.path = "/ksql";
  let date = getCurrentDate();

  let sql = `CREATE TABLE "GF_${fenceName}_${date}"`;
  let queryID = "";
  let queryName = "";

  sql += ` WITH (kafka_topic='GF_${fenceName}_${date}', partitions=1, value_format='JSON', key_format='JSON') AS SELECT applicationentity, container , LATEST_BY_OFFSET(creationtime) as creationtime, LATEST_BY_OFFSET(latitude) as latitude, LATEST_BY_OFFSET(longitude) as longitude, GEO_CONTAINED(LATEST_BY_OFFSET(latitude), LATEST_BY_OFFSET(longitude),'POLYGON((`;

  polygon.forEach((element, index) => {
    sql += `${element.lng} ${element.lat}, `;
    if (index == polygon.length - 1) {
      sql += `${polygon[0].lng} ${polygon[0].lat}))') as GEO_CONTAINED `;
    }
  });
  sql += `FROM spatial group by applicationentity, container;`;
  console.log(sql);

  let request = http.request(options, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      console.log(data);
      resultData = JSON.parse(data);

      // CREATE INFLUXDB CONNECTOR with
      createInfluxdbConnector(`GF_${fenceName}_${date}`);
      // Save Redis Data
      if (resultData[0].commandStatus) {
        queryID = resultData[0].commandStatus.queryId;
        queryName = `GeoFence_${fenceName}`;
        redisClient.hmset("query", queryID, queryName);
      }
      res.status(response.statusCode).json(resultData);
    });

    response.on("error", function (error) {
      console.error(error);
      res.status(400).send(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `${sql}`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
});

async function createInfluxdbConnector(connectorName) {
  /**
   * {
  "schema": {
    "type": "struct",
    "fields": [
      {
        "type": "map",
        "keys": {
          "type": "string",
          "optional": false
        },
        "values": {
          "type": "string",
          "optional": false
        },
        "optional": false,
        "field": "tags"
      },
      {
        "type": "string",
        "optional": false,
        "field": "time"
      },
      {
        "type": "double",
        "optional": true,
        "field": "value"
      }
    ],
    "optional": false,
    "version": 1
  },
  "payload": {
    "tags": {
      "id": "5"
    },
    "time": "2019-07-24T11:43:19.201040841Z",
    "value": 500
  }
}
   */
  var influxDBOption = {
    method: "POST",
    hostname: config.ksqldb.host,
    port: config.ksqldb.port,
    path: "/ksql",
    headers: {
      "Content-Type": "application/vnd.ksql.v1+json",
      Accept: "application/vnd.ksql.v1+json",
    },
    maxRedirects: 20,
  };

  let request = http.request(influxDBOption, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      resultData = JSON.parse(data);
      console.log("INFLUXDB SINK CONNECTOR RESULT", resultData);
      return resultData;
    });

    response.on("error", function (error) {
      console.error(error);
      return error;
    });
  });

  var postData = JSON.stringify({
    ksql: `CREATE SINK CONNECTOR "${connectorName}" WITH ('connector.class' = 'com.datamountaineer.streamreactor.connect.influx.InfluxSinkConnector', 'topics' = '${connectorName}','tasks.max'='1', 'connect.influx.url'='http://${config.db.influx.host}:${config.db.influx.port}','connect.influx.db'='${config.db.influx.database}', 'connect.influx.username'='${config.db.influx.user}', 'connect.influx.password'= '${config.db.influx.password}', 'connect.influx.kcql'='INSERT INTO "${connectorName}" SELECT * FROM "${connectorName}" WITHTIMESTAMP sys_time()', 'use.schema'='false', 'key.converter'='org.apache.kafka.connect.json.JsonConverter', 'key.converter.schemas.enable'='false', 'value.converter'='org.apache.kafka.connect.json.JsonConverter', 'value.converter.schemas.enable'='false');`,
    streamsProperties: { "ksql.streams.auto.offset.reset": "earliest" },
  });
  request.write(postData);
  request.end();
}

async function dropInfluxdbConnector(connectorName, cb) {
  var influxDBOption = {
    method: "POST",
    hostname: config.ksqldb.host,
    port: config.ksqldb.port,
    path: "/ksql",
    headers: {
      "Content-Type": "application/vnd.ksql.v1+json",
      Accept: "application/vnd.ksql.v1+json",
    },
    maxRedirects: 20,
  };

  let request = http.request(influxDBOption, function (response) {
    let data = "";
    let resultData = "";

    // console.log("queryData : ", queryData.queryString);
    response.on("data", function (chunk) {
      data += chunk;
    });

    response.on("end", function (chunk) {
      resultData = JSON.parse(data);
      console.log("DROP INFLUXDB SINK CONNECTOR RESULT", resultData);
      cb(resultData);
    });

    response.on("error", function (error) {
      console.log(error);
      cb(error);
    });
  });

  var postData = JSON.stringify({
    ksql: `DROP CONNECTOR "${connectorName}";`,
    streamsProperties: {},
  });
  request.write(postData);
  request.end();
}

function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear().toString();
  let month = date.getMonth() + 1;
  month = month < 10 ? "0" + month.toString() : month.toString();
  let day = date.getDate();
  day = day < 10 ? "0" + day.toString() : day.toString();
  let hour = date.getHours();
  hour = hour < 10 ? "0" + hour.toString() : hour.toString();
  let minutes = date.getMinutes();
  minutes = minutes < 10 ? "0" + minutes.toString() : minutes.toString();
  let seconds = date.getSeconds();
  seconds = seconds < 10 ? "0" + seconds.toString() : seconds.toString();
  return year + month + day + hour + minutes + seconds;
}
module.exports = router;

const Mysql = require("mysql");
const Postgres = require("pg");
const badaInfo = require("../configuration/config.json").db.mysql;
const influxInfo = require("../configuration/config.json").db.influx;
const postgresInfo = require("../configuration/config.json").db.postgres;
const util = require("util");
const Influx = require("influx");

let countErrorHandler = 0;

let badaDbInstance = null;
let influxInstance = null;
let influxOptions = new Array();
let postgresInstance = "";

let retainConnection = {};
let sqlPing = null;

let spatialConnection = () => {
  postgresInstance = new Postgres.Client(postgresInfo);

  postgresInstance.connect((err) => {
    if (err) {
      console.log("Database> Spatial Database connection error");
      return;
    }

    console.log("Database> Spatial Database Database Connected");
  });
};

let spatialQuery = (sql) => {
  return postgresInstance.query(sql);
};

let testPostgresConnection = (options) => {
  let testResult = {
    connection: false,
  };

  if (!options) {
    options = badaInfo;
  }

  return new Promise((resolve) => {
    postgresInstance.query("SELECT NOW() as now", (err, res) => {
      if (!err) {
        testResult.connection = true;
      }

      resolve(testResult);
    });
  });
};

let testMysqlConnection = (options) => {
  let testResult = {
    connection: false,
  };

  if (!options) {
    options = badaInfo;
  }

  if (typeof badaInfo === "string") {
    badaInfo = JSON.parse(influxInfo);
  }

  badaDbInstance = Mysql.createConnection(badaInfo);

  return new Promise((resolve) => {
    badaDbInstance.query("SELECT 1", (error, results, fields) => {
      if (!error) {
        testResult.connection = true;
      }

      resolve(testResult);
    });
  });
};

let testInfluxConnection = (options) => {
  let testResult = {
    connection: false,
  };

  if (!options) {
    options = influxInfo;
  }

  if (typeof influxInfo === "string") {
    influxInfo = JSON.parse(influxInfo);
  }

  influxInstance = new Influx.InfluxDB(influxInfo);
  // influxInstance = new Influx(`http://${influxInfo.host}:${influxInfo.port}/${influxInfo.database}`);

  return new Promise((resolve) => {
    influxInstance.ping(5000).then((hosts) => {
      if (hosts[0].online) {
        // console.log('host check: ', hosts[0].online);
        testResult.connection = true;
      }
      resolve(testResult);
    });
    testResult.connection = true;
    resolve(testResult);
  });
};

let timeseriesConnection = () => {
  testInfluxConnection(influxInfo)
    .then((result) => {
      if (!result.connection) {
        console.log("Database> Timeseries connection error");
        return;
      }

      // influxInstance = new Influx(`http://${influxInfo.host}:${influxInfo.port}/${influxInfo.database}`);
      influxInstance = new Influx.InfluxDB(influxInfo);
      console.log("Database> Timeseries Database Connected");
    })
    .catch((error) => {
      console.log(error);
    });
};

let timeseriesWrite = (options) => {
  influxOptions.push(options);
  // if(influxOptions.length >= 3000){
  //   influxInstance.writePoints(influxOptions).then(() =>{
  //     console.log("Success" , influxOptions);
  //     influxOptions = [];
  //   }).catch((err) =>{
  //     console.log("influx error")
  //     console.log(err);
  //   })
  // }
};

// execute every 10 seconds
setInterval(() => {
  if (influxOptions.length !== 0) {
    influxInstance
      .writePoints(influxOptions)
      .then(() => {
        console.log("Influx Success");
        influxOptions = [];
      })
      .catch((err) => {
        console.log("influx error");
        console.log(err);
      });
  }
}, 10000);

let timeseriesQuery = (query) => {
  influxInstance
    .query(query)
    .then(() => {})
    .catch((error) => {
      console.log(error);
    });
};

//var _this = this;

let sqlCreate = function (callback) {
  badaDbInstance = Mysql.createPool(badaInfo);
  callback("1");
};

let sqlConnection = function (callback) {
  if (badaDbInstance == null) {
    console.error("mysql is not connected");
    callback(true, "mysql is not connected");
    return "0";
  }

  badaDbInstance.getConnection(function (err, connection) {
    if (err) {
      callback("500-5");
    } else {
      if (connection) {
        callback("200", connection);
      } else {
        callback("500-5");
      }
    }
  });
  // badaDbInstance.getConnection((err, conn) =>{
  //   if(err){
  //     errorHandler(err);
  //     return;
  //   }

  //   countErrorHandler = 0;
  //   console.log('Database> SQL Database Connected');
  //   callback(conn)
  // })
};

function executeQuery(pool, query, connection, callback) {
  connection.query({ sql: query, timeout: 60000 }, function (err, rows, fields) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, rows);
  });
}

let getResult = function (query, connection, callback) {
  if (badaDbInstance == null) {
    console.error("mysql is not connected");
    return "0";
  }

  executeQuery(badaDbInstance, query, connection, function (err, rows) {
    if (!err) {
      callback(null, rows);
    } else {
      callback(true, err);
    }
  });
};

// let sqlQuery = (query, second, third) => {
//   if(third) {
//     badaDbInstance.query(query, second, third);
//   } else {
//     badaDbInstance.query(query, second);
//   }
// }

let sqlTuning = function (callback) {
  var sql = util.format("set global max_connections = 2000");
  badaDbInstance.query({ sql: sql, timeout: 60000 }, function (err, results) {
    if (err) {
      console.log(results.message);
    }
    sql = util.format("set global innodb_flush_log_at_trx_commit=0");
    badaDbInstance.query({ sql: sql, timeout: 60000 }, function (err, results) {
      if (err) {
        console.log(results.message);
      }
      sql = util.format("set global sync_binlog=0");
      badaDbInstance.query({ sql: sql, timeout: 60000 }, function (err, results) {
        if (err) {
          console.log(results.message);
        }
        sql = util.format("set global transaction_isolation='READ-UNCOMMITTED'");
        badaDbInstance.query({ sql: sql, timeout: 60000 }, function (err, results) {
          if (err) {
            console.log(results.message);
          }
          callback(err, results);
        });
      });
    });
  });
};

function errorHandler(error) {
  countErrorHandler++;
  if (sqlPing) {
    clearInterval(sqlPing);
    sqlPing = null;
  }

  if (countErrorHandler > 10) {
    console.log("Database> MySql Reconnection Stop by over 10 times error");
    return;
  }

  if (retainConnection) {
    clearInterval(retainConnection);
  }

  if (error.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
    console.log("Database> MySQL After Fatal Error ");
    console.log(error.stack);

    badaDbInstance = Mysql.createConnection(badaInfo);
  } else if (error.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Database> MySQL Re-connection caused by Lost ");
    console.log(error.stack);
  } else if (error.code === "ECONNREFUSED") {
    console.log("Database> MySQL Connection Refused ");
    console.log(error.stack);
  } else {
    console.log(error.stack);
  }

  console.log(`Database> Error occurred (Count: ${countErrorHandler})`);

  setTimeout(sqlConnection, 3000);
}

module.exports = {
  bada: badaDbInstance,
  mysql: {
    create: sqlCreate,
    connection: sqlConnection,
    query: getResult,
    testConnection: testMysqlConnection,
    tuning: sqlTuning,
  },
  timeseries: {
    connection: timeseriesConnection,
    query: timeseriesQuery,
    write: timeseriesWrite,
    testConnection: testInfluxConnection,
  },
  spatial: {
    connection: spatialConnection,
    query: spatialQuery,
    testConnection: testPostgresConnection,
  },
};

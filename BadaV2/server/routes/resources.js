const router = require("express").Router();
const http = require("http");
const url = require("url");
const querystring = require("querystring");

const Database = require("../src/database");
const Auth = require("../util/auth");
const Config = require("../configuration/config.json");
const system = require("../src/system-usage");
const responseTime = require("../src/response-time");

const excel = require("exceljs");
const moment = require("moment");
const fs = require("fs");
const redis = require("redis");
const redisClient = redis.createClient(Config.db.redis);

const GET = "get";
const POST = "post";
const PUT = "put";
const DELETE = "delete";

let globalOptions = {
  hostname: Config.mobius.host,
  port: Config.mobius.port,
  method: "POST",
  path: "/" + Config.mobius.cb + "?rcn=3",
  headers: {
    Accept: "application/json",
    "X-M2M-RI": "ketiketi",
    "X-M2M-Origin": "S",
  },
};

// database column 리턴
function getTitle(json_data) {
  const json_array = json_data;
  let titleList = [];
  if (json_array !== null && json_array !== undefined) {
    const titles = Object.keys(json_array);
    titles.forEach((title, index) => {
      titleList.push(title);
    });
  }
  return titleList;
}

let dailyCount = (userId, type, start_date, end_date, connection, callback) => {
  let sql = "SELECT resource_type, resource_count, creation_time FROM dailycount WHERE resource_type='" + type + "' " + "AND creation_time BETWEEN " + start_date + " AND " + end_date;

  if (userId !== Config.server.admin.id) {
    sql += ` AND user='${userId}'`;
  } else {
    sql = `SELECT resource_type, sum(resource_count) as resource_count, creation_time FROM dailycount WHERE resource_type='${type}' AND creation_time BETWEEN ${start_date} AND ${end_date} GROUP BY creation_time`;
  }
  Database.mysql.query(sql, connection, (err, result) => {
    if (err) console.log(err);

    if (!result[0]) {
      console.log("resources Error [dailyCount] -- database result error");
    }

    callback(result);
  });
};
let saveResource = (type, data, userId, path, storage, connection) => {
  let insertData = {};

  insertData = data["m2m:rce"]["m2m:" + type];
  insertData.user = userId;

  if (type === "cnt") {
    insertData.path = path + "/" + insertData.rn;
    insertData.timeseries = storage.timeseries;
    insertData.spatialData = storage.spatialdata;
  }

  let values = Object.values(insertData);
  let valueString = "";

  values.forEach((element, index) => {
    valueString += "'" + element + "'" + (index == values.length - 1 ? "" : ",");
  });

  let sql = "INSERT INTO " + type + " (" + Object.keys(insertData) + ") VALUES (" + valueString + ")";
  // console.log("Save Resource : ", sql);
  Database.mysql.query(sql, connection, (err, result) => {
    if (err) console.log(err);

    if (result.affectedRows === 1) {
      console.log("Success the " + type + " creation");
    }
    console.log("send query and return message", result);
  });
};

let saveCount = (type, data, userId, connection) => {
  let sql = "";
  let insertData = {
    resource_type: type,
    creation_time: data["m2m:rce"]["m2m:" + type].ct.split("T", 1),
  };

  let logMessage = "Resource Daily Counting UPDATE Success";

  sql = "UPDATE dailycount SET resource_count = resource_count + 1 WHERE " + "user='" + userId + "' AND resource_type='" + insertData.resource_type + "' AND creation_time='" + insertData.creation_time + "'";

  Database.mysql.query(sql, connection, (err, result) => {
    if (err) console.log(err);

    if (result.affectedRows === 0) {
      sql = "INSERT dailycount (user, resource_type, resource_count, creation_time) VALUES ('" + userId + "', '" + insertData.resource_type + "', 1, '" + insertData.creation_time + "' )";

      Database.mysql.query(sql, connection, (err, result) => {
        if (err) console.log(err);

        logMessage = "Resource Daily Counting INSERT Success";
      });
    }
    console.log(logMessage);
  });
};

let saveLatest = (userId, parent, data, connection) => {
  let insertData = {};
  let logMessage = "UPDATE Latest CIN success";
  let values = "";
  let updateString = "";
  let insertString = "";
  let sql = "";

  insertData = data["m2m:rce"]["m2m:cin"];
  insertData.sri = data["m2m:rce"]["m2m:cin"].ri;
  insertData.ri = "/" + data["m2m:rce"].uri;
  insertData.ae = parent.ae;
  insertData.cnt = parent.cnt;

  values = Object.values(insertData);

  values.forEach((element, index) => {
    updateString += Object.keys(insertData)[index] + "='" + element + (index == values.length - 1 ? "'" : "',");
  });

  values.forEach((element, index) => {
    insertString += "'" + element + "'" + (index == values.length - 1 ? "" : ",");
  });

  sql = "UPDATE latestcin SET " + updateString + " WHERE ae='" + parent.ae + "' AND cnt='" + parent.cnt + "'";

  Database.mysql.query(sql, connection, (err, result) => {
    if (err) console.log(err);

    if (result.affectedRows === 0) {
      sql = "INSERT INTO latestcin (" + Object.keys(insertData) + ") VALUES (" + insertString + ")";

      Database.mysql.query(sql, connection, (err, result) => {
        if (err) console.log(err);

        logMessage = "INSERT Latest CIN success";
      });
    }
    console.log(logMessage);
  });
};

router.get("/count", (req, res) => {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let sql = "";
  let userSql = "";

  if (!loginStatus.admin) {
    userSql = "WHERE user='" + userId + "' ";
    typeWhere = "and";
  } else {
    typeWhere = "WHERE";
  }
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      sql = "SELECT (SELECT COUNT(*) FROM ae " + userSql + ") as ae, (SELECT COUNT(*) FROM cnt " + userSql + ") as cnt, (SELECT SUM(resource_count) FROM dailycount " + userSql + typeWhere + " resource_type='cin') as cin FROM dual";

      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          res.status(400).send(err.sqlMessage);
        }

        res.send(result[0]);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });

      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.send("[db.connect] No Connection");
    }
  });
});

router.get("/excel", async (req, res) => {
  //http://10.252.73.102:7579/Mobius/sohyeon_ae1/sohyeon_cnt1?crb=20210826T072322&cra=20210601T043037&ty=4&rcn=4
  if (!req.body) {
    res.status(400).send("Bad Request");
  }
  const queryObject = url.parse(req.url, true).query;
  let requestData = "";
  if (queryObject.term === "1 day") {
    requestData = { crb: moment().format("YYYYMMDDTHHmmss"), ty: 4, rcn: 4, cra: moment().subtract(1, "day").format("YYYYMMDDTHHmmss") };
  } else if (queryObject.term === "1 week") {
    requestData = { crb: moment().format("YYYYMMDDTHHmmss"), ty: 4, rcn: 4, cra: moment().subtract(7, "day").format("YYYYMMDDTHHmmss") };
  } else if (queryObject.term === "1 month") {
    requestData = { crb: moment().format("YYYYMMDDTHHmmss"), ty: 4, rcn: 4, cra: moment().subtract(1, "month").format("YYYYMMDDTHHmmss") };
  } else if (queryObject.term === "6 months") {
    requestData = { crb: moment().format("YYYYMMDDTHHmmss"), ty: 4, rcn: 4, cra: moment().subtract(6, "month").format("YYYYMMDDTHHmmss") };
  } else if (queryObject.term === "1 year") {
    requestData = { crb: moment().format("YYYYMMDDTHHmmss"), ty: 4, rcn: 4, cra: moment().subtract(1, "year").format("YYYYMMDDTHHmmss") };
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));
  options.method = "GET";
  options.path = `/${Config.mobius.cb}/${queryObject.ae}/${queryObject.cnt}?${querystring.stringify(requestData)}`;
  // options.path= '/' + Config.mobius.cb + '/sohyeon_ae1/sohyeon_cnt1?'
  // options.path += querystring.stringify(requestData);
  options.agent = false;
  try {
    const request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let resultData = JSON.parse(data);
          console.log("LOG [Get Excel Data] \n", resultData);
          console.log(response.statusCode);
          if (response.statusCode === 200) {
            try {
              resultData = resultData["m2m:rsp"]["m2m:cin"];
              if (!resultData) {
                console.log("There is no saved data.");
                res.status(response.statusCode).json(resultData);
                return;
              }
              console.log("resData", resultData);
              if (resultData !== undefined) {
                console.log(resultData[0]);
              }
              let workbook = new excel.Workbook();
              let worksheet = workbook.addWorksheet("mobius data");
              let titleList = getTitle(resultData[0]["con"]);
              let columns = [];
              columns.push({ header: "ae", key: "ae", width: 30 }, { header: "cnt", key: "cnt", width: 30 });
              // "{header: 'ae', key: 'ae', width: 30 },{header: 'cnt', key: 'cnt, width: 30 },"
              console.log(titleList);
              titleList.forEach((element) => {
                columns.push({ header: element, key: element, width: 30 });
              });
              worksheet.columns = columns;

              resultData.forEach((data) => {
                var row = "";
                data["con"]["ae"] = queryObject.ae;
                data["con"]["cnt"] = queryObject.cnt;
                row += JSON.stringify(data["con"]);
                eval(`worksheet.addRow(${row})`);
              });

              const date = moment().format("YYYY-MM-DD");
              const time = moment().format("HH-mm-ss");

              //현재 폴더 하위에 xlsx 폴더 생성
              const makeFolder = (dir) => {
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir);
                }
              };

              try {
                makeFolder(`./xlsx`);
                makeFolder(`./xlsx/${date}`);
                console.log(`create excel folder success`);
              } catch (err) {
                console.log(`create excel folder error : ${err}`);
                res.status(400).send(err);
              }

              try {
                workbook.xlsx.writeFile(`./xlsx/${date}/${time}.xlsx`).then((workbook) => {
                  console.log("file saved");
                  // res.send(workbook);
                  // responseTime.store(res.getHeader("X-Response-Time"), GET);
                });
              } catch (err) {
                res.status(404).send("There are some error with write xlsx file");
              }
            } catch (err) {
              console.log("", err);
              res.status(404).send(err);
            }

            res.status(response.statusCode).json(resultData);
            responseTime.store(res.getHeader("X-Response-Time"), POST);
          } else {
            res.status(response.statusCode).json(data);
          }
        });
    });
    // request.write();
    request.end();
  } catch (err) {
    console.log(err);
    res.status(404).send("You are not connected to the Mobius server or the resource does not exist on the Mobius server");
  }
});

router.get("/system", (req, res) => {
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
      res.json(results);
      responseTime.store(res.getHeader("X-Response-Time"), GET);
    });
});

router.get("/cin/daily", (req, res) => {
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let start_date = new Date(req.query.start_date);
  let end_date = new Date(req.query.end_date);
  let durationList = [];

  while (start_date <= end_date) {
    let month = (start_date.getMonth() + 1).toString();
    let date = start_date.getDate().toString();
    let fullDate = start_date.getFullYear() + (month[1] ? month : "0" + month[0]) + (date[1] ? date : "0" + date[0]);
    let dateSet = {
      date: fullDate,
      count: 0,
    };
    durationList.push(dateSet);
    start_date.setDate(start_date.getDate() + 1);
  }

  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      dailyCount(userId, "cin", new Date(req.query.start_date).yyyymmdd(), new Date(req.query.end_date).yyyymmdd(), connection, (dataList) => {
        durationList.forEach((element) => {
          dataList.forEach((data) => {
            if (element.date === data.creation_time.yyyymmdd()) {
              element.count = data.resource_count;
            }
          });
        });
        res.send(durationList);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.send("[db.connect] No Connection");
    }
  });
});

router.get("/cin/today", (req, res) => {
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let todayDate = new Date().toISOString().split("T")[0];
  let dateSet = {
    date: todayDate,
    count: 0,
  };

  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      let sql = `SELECT resource_type, resource_count, creation_time FROM dailycount WHERE resource_type='cin' AND creation_time = '${todayDate}'`;

      if (userId !== Config.server.admin.id) {
        sql += ` AND user='${userId}'`;
      } else {
        sql = `SELECT resource_type, sum(resource_count) as resource_count, creation_time FROM dailycount WHERE resource_type='cin' AND creation_time = ${new Date(todayDate).yyyymmdd()} GROUP BY creation_time`;
      }
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log(err);
          res.send(err);
          return;
        }

        if (!result[0]) {
          console.log("resources Error [dailyCount] -- Database no result");
          res.send("[db] No data");
          return;
        }

        dateSet.count = result[0].resource_count;
        res.send(dateSet);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.send("[db.connect] No Connection");
    }
  });
});

router.post("/ae", (req, res) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
  }
  let type = "ae";
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  let requestData = { "m2m:ae": req.body };

  options.headers["Content-Type"] = "application/json; ty=2";
  options.agent = false;

  try {
    const request = http.request(options, (response) => {
      let data = "";
      let resultData = "";
      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          resultData = JSON.parse(data);
          console.log("LOG [Create Application Entity] \n", data);

          if (response.statusCode === 201) {
            try {
              Database.mysql.connection((code, connection) => {
                if (code === "200") {
                  saveResource(type, resultData, userId, "", "", connection);
                  saveCount(type, resultData, userId, connection);
                  redisClient.hmset("owner", resultData["m2m:rce"]["m2m:ae"].rn, userId);
                  connection.release();
                  res.status(response.statusCode).json(resultData);
                  responseTime.store(res.getHeader("X-Response-Time"), POST);
                } else {
                  console.log("[db.connect] No Connection");
                  res.status(400).send("[db.connect] No Connection");
                }
              });
            } catch (e) {
              console.log(e);
              res.status(400).send(e);
            }
          } else {
            res.status(response.statusCode).json(resultData);
          }

          // res.status(response.statusCode).json(resultData);
          // responseTime.store(res.getHeader("X-Response-Time"), POST);
        });
    });

    request.write(JSON.stringify(requestData));
    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/cnt", (req, res) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
  }

  let type = "cnt";
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));
  let subOptions = JSON.parse(JSON.stringify(globalOptions));

  let requestData = {
    "m2m:cnt": {
      rn: "",
    },
  };

  let storage = {
    timeseries: req.body.timeseries,
    spatialdata: req.body.spatialdata,
  };
  let pathList = req.body.path; // /:AEname

  let pathString = "";
  pathList.forEach((path) => {
    pathString += "/" + path;
  });

  delete req.body.ae;
  delete req.body.path;
  delete req.body.timeseries;
  delete req.body.spatialdata;

  requestData["m2m:cnt"] = req.body;

  options.headers["Content-Type"] = "application/json; ty=3";
  options.path = "/" + Config.mobius.cb + pathString + "?rcn=3";
  options.agent = false;

  subOptions.headers["Content-Type"] = "application/json; ty=23";
  subOptions.path = "/" + Config.mobius.cb + pathString + "/" + requestData["m2m:cnt"].rn + "?rcn=3";
  subOptions.agent = false;

  try {
    const request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", async () => {
          let resultData = JSON.parse(data);
          console.log("LOG [Create Container] \n", data);

          // Success Container Creation
          if (response.statusCode === 201) {
            Database.mysql.connection((code, connection) => {
              if (code === "200") {
                saveResource(type, resultData, userId, pathString, storage, connection);
                saveCount(type, resultData, userId, connection);
                connection.release();
                res.status(response.statusCode).json(resultData);
                responseTime.store(res.getHeader("X-Response-Time"), POST);
              } else {
                console.log("[db.connect] No Connection");
                res.status(400).send("[db.connect] No Connection");
              }
            });
          } else {
            res.status(response.statusCode).send(resultData);
          }
        });
    });

    request.write(JSON.stringify(requestData));
    request.end();
  } catch (e) {
    console.log(e);
  }
});

router.post("/sub", (req, res) => {
  if (!req.body) {
    res.status(400).send("Bad Request");
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  let requestData = {
    "m2m:sub": {
      rn: "",
      enc: { net: [] },
      pn: "",
    },
  };

  let pathList = req.body.path;

  let pathString = "";
  pathList.forEach((path) => {
    pathString += "/" + path;
  });

  requestData["m2m:sub"] = req.body;
  requestData["m2m:sub"].enc = { net: req.body.net };

  delete req.body.ae;
  delete req.body.path;
  delete req.body.net;

  options.headers["Content-Type"] = "application/json; ty=23";
  options.path = "/" + Config.mobius.cb + pathString + "?rcn=3";

  try {
    const request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let resultData = JSON.parse(data);
          console.log("LOG [Create Subscription] \n", data);
          let emitData = {};

          if (JSON.parse(data).hasOwnProperty("m2m:dbg")) {
            emitData = resultData;
          } else {
            emitData = JSON.parse(data)["m2m:rce"]["m2m:sub"];
          }
          res.status(response.statusCode).json(resultData);
          responseTime.store(res.getHeader("X-Response-Time"), POST);
        });
    });

    request.write(JSON.stringify(requestData));
    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.delete("/sub", (req, res) => {
  if (!req.query.url) {
    res.status(400).send("Bad Request");
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  options.method = "DELETE";
  options.path = "/" + Config.mobius.cb + req.query.url + "?rcn=1";

  console.log("subscription options", options);
  try {
    let request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let resultData = JSON.parse(data);
          let emitData = {};

          if (JSON.parse(data).hasOwnProperty("m2m:dbg")) {
            emitData = resultData;
          } else {
            emitData = JSON.parse(data)["m2m:sub"];
            emitData.delete = true;
          }
          res.status(response.statusCode).json(emitData);
          responseTime.store(res.getHeader("X-Response-Time"), DELETE);
        });
    });

    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.delete("/cnt", (req, res) => {
  if (!req.query.url) {
    res.status(400).send("Bad Request");
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  options.method = "DELETE";
  options.path = "/" + Config.mobius.cb + req.query.url + "?rcn=1";
  options.agent = false;
  // options.headers['X-M2M-Origin'] = req.query.ri;
  console.log("delete CNT Options : ", options);
  console.log("delete CNT REQ Query : ", req.query);

  let url = JSON.stringify(req.query.url).replace(/[\"]/g, "").split("/");
  console.log(url);
  let parentResource = {
    ae: url[1],
    cnt: url[2],
    user: userId,
  };
  redisClient.hdel("latest", `/Mobius/${parentResource.ae}/${parentResource.cnt}`, function (err, success) {
    if (err) {
      console.error("Failed to remove latest in redis: " + err);
    }
    console.log("delete Redis Latest", success);
  });
  redisClient.hdel("storage", JSON.stringify({ ae: parentResource.ae, cnt: parentResource.cnt }), function (err, success) {
    if (err) {
      console.error("Failed to remove storage in redis: " + err);
    }
    console.log("delete Redis storage", success);
  });
  try {
    let request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let resultData = JSON.parse(data);
          console.log("delete CNT Result Data : ", response.statusCode, resultData);
          let emitData = {};

          if (JSON.parse(data).hasOwnProperty("m2m:dbg")) {
            emitData = resultData;
          } else {
            emitData = JSON.parse(data)["m2m:cnt"];
            emitData.delete = true;
          }

          if (response.statusCode === 200) {
            Database.mysql.connection((code, connection) => {
              if (code === "200") {
                deleteResource("cnt", req.query.ri, connection);
                let sql = `delete from latestcin where pi = '${req.query.ri}'`;
                Database.mysql.query(sql, connection, (err, result) => {
                  if (err) console.log(err);
                  console.log(sql);

                  if (result.affectedRows >= 1) {
                    console.log("Success latestcin deletion");
                  }
                  console.log("send query and return message", result);
                });
                connection.release();

                res.status(response.statusCode).json(emitData);
                responseTime.store(res.getHeader("X-Response-Time"), DELETE);
              } else {
                console.log("[db.connect] No Connection");
                res.status(400).send("[db.connect] No Connection");
              }
            });
          } else {
            res.status(response.statusCode).send(data);
          }
        });
    });

    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.delete("/ae", (req, res) => {
  if (!req.query.url) {
    res.status(400).send("Bad Request");
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  options.method = "DELETE";
  options.path = "/" + Config.mobius.cb + req.query.url + "?rcn=1";
  options.headers["X-M2M-Origin"] = req.query.ri;
  console.log("delete AE Options : ", options);
  console.log("delete AE REQ Query : ", req.query);

  let url = JSON.stringify(req.query.url).replace(/[\"]/g, "").split("/");
  console.log(url);
  let parentResource = {
    ae: url[1],
  };

  try {
    let request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let resultData = JSON.parse(data);
          let emitData = {};

          console.log("delete AE Result Data: ", response.statusCode, resultData);
          if (JSON.parse(data).hasOwnProperty("m2m:dbg")) {
            emitData = resultData;
          } else {
            emitData = JSON.parse(data)["m2m:ae"];
            emitData.delete = true;
          }

          if (response.statusCode === 200) {
            Database.mysql.connection((code, connection) => {
              if (code === "200") {
                deleteResource("ae", req.query.ri, connection);

                // get cnt ri
                let sql = `select ri, rn from cnt where pi = '${req.query.ri}' `;
                Database.mysql.query(sql, connection, (err, result) => {
                  if (err) console.log(err);
                  console.log(sql);
                  console.log("send query and return message", result);
                  if (result) {
                    result.forEach((element) => {
                      //delete cnt
                      parentResource.cnt = element.rn;
                      parentResource.user = userId;

                      redisClient.hdel("latest", `/Mobius/${parentResource.ae}/${parentResource.cnt}`, function (err, success) {
                        if (err) {
                          console.error("Failed to remove latest in redis: " + err);
                        }
                        console.log("delete Redis Latest", success);
                      });
                      redisClient.hdel("owner", parentResource.ae, function (err, success) {
                        if (err) {
                          console.error("Failed to remove owner in redis: " + err);
                        }
                        console.log("delete Redis Owner", success);
                      });
                      redisClient.hdel("storage", JSON.stringify({ ae: parentResource.ae, cnt: parentResource.cnt }), function (err, success) {
                        if (err) {
                          console.error("Failed to remove storage in redis: " + err);
                        }
                        console.log("delete Redis Storage", success);
                      });

                      sql = `delete from cnt where ri = '${element.ri}'`;
                      Database.mysql.query(sql, connection, (err, result) => {
                        if (err) console.log(err);
                        if (result.affectedRows >= 1) {
                          console.log("Success cnt deletion");
                          console.log("send query and return message", result);
                          // delete latestcin
                          sql = `delete from latestcin where pi = '${element.ri}'`;
                          Database.mysql.query(sql, connection, (err, result) => {
                            if (err) console.log(err);
                            if (result.affectedRows >= 1) {
                              console.log("Success latestcin deletion");
                              console.log("send query and return message", result);
                            } else {
                              console.log("send query and return message", result);
                            }
                          });
                        } else {
                          console.log("send query and return message", result);
                        }
                      });
                    });
                  }
                });

                connection.release();
                res.status(response.statusCode).json(emitData);
                responseTime.store(res.getHeader("X-Response-Time"), DELETE);
              } else {
                console.log("[db.connect] No Connection");
                res.status(400).send("[db.connect] No Connection");
              }
            });
          } else {
            res.status(response.statusCode).send(data);
          }
        });
    });
    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

let deleteResource = (type, resourceId, connection) => {
  let sql = "DELETE FROM " + type + " WHERE ri=" + "'" + resourceId + "'";

  Database.mysql.query(sql, connection, (err, result) => {
    if (err) console.log(err);
    console.log(sql);

    if (result.affectedRows === 1) {
      console.log("Success the " + type + " creation");
    }
    console.log("send query and return message", result);
  });
};

router.get("/latest", (req, res) => {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let userId = Auth.getUserId(req.headers["x-access-token"]);

  let sql = "";
  let limit = Config.resource.limit;

  if (!req.query.type) {
    res.status(406).send("Resource is not specified");
  }
  if (req.query.limit) {
    limit = req.query.limit;
  }

  if (req.query.type === "AE") {
    sql = "SELECT * FROM ae";
  } else if (req.query.type === "CNT") {
    sql = "SELECT cnt.*, ae.rn as ae FROM cnt LEFT JOIN ae ON cnt.pi = ae.ri";
  } else if (req.query.type === "CIN") {
    sql = "select latestcin.*, cnt.user as user FROM latestcin LEFT JOIN cnt ON latestcin.pi = cnt.ri";
  }

  if (!loginStatus.admin) {
    sql += " WHERE user='" + userId + "'";
  }

  sql += " ORDER BY ct DESC LIMIT " + limit;
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log(" error", err, result);
        }
        res.json(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.get("/latest/cnt", (req, res) => {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let sql = "SELECT latestcin.* FROM latestcin LEFT JOIN ae on ae.rn = latestcin.ae";
  let whereList = [];
  let whereSet = "";

  if (!loginStatus.admin) {
    whereList.push("user='" + userId + "'");
  }

  if (req.query.parent) {
    whereList.push("cnt='" + req.query.parent + "'");
  }

  if (whereList.length > 0) {
    whereSet += " WHERE ";

    whereList.forEach((clause, index, list) => {
      whereSet += list[index + 1] ? clause + " AND " : clause;
    });
  }

  sql += whereSet;

  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log(" error", err, result);
        }
        res.send(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.get("/ae", function (req, res) {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let sql = "";
  let whereList = [];
  let whereSet = "";

  if (!loginStatus.admin) {
    whereList.push("user='" + userId + "'");
  }

  if (req.query.ri) {
    whereList.push("ri='" + req.query.ri + "'");
  } else if (req.query.rn) {
    whereList.push("rn='" + req.query.rn + "'");
  }

  if (whereList.length > 0) {
    whereSet += " WHERE ";

    whereList.forEach((clause, index, list) => {
      whereSet += list[index + 1] ? clause + " AND " : clause;
    });
  }

  sql = "SELECT * FROM ae " + whereSet;
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error", err);
        }

        res.send(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.get("/cnt", (req, res) => {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let sql = "SELECT * FROM cnt ";
  let whereList = [];

  if (!loginStatus.admin) {
    whereList.push("user='" + userId + "'");
  }
  if (req.query.pi) {
    whereList.push("pi='" + req.query.pi + "'");
  } else if (req.query.ri) {
    whereList.push("ri='" + req.query.ri + "'");
  } else if (req.query.rn) {
    whereList.push("rn='" + req.query.rn + "'");
  }

  if (req.query.path) {
    whereList.push("path='" + req.query.path + "'");
  }

  if (whereList.length > 0) {
    sql += " WHERE ";

    whereList.forEach((clause, index, list) => {
      sql += list[index + 1] ? clause + " AND " : clause;
    });
  }
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log(err);
        }
        res.send(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.get("/cnt/children", (req, res) => {
  if (!req.query.pi && !req.query.ri) return;

  let data = "";
  let options = JSON.parse(JSON.stringify(globalOptions));

  options.method = "GET";
  options.headers["Content-Type"] = "application/json; ty=3";
  options.path = "/" + Config.mobius.cb + req.query.parent + "/" + req.query.ri + "?rcn=4&ty=23&ty=3";

  try {
    http.get(options, (response) => {
      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          res.json(JSON.parse(data)["m2m:rsp"]);
          responseTime.store(res.getHeader("X-Response-Time"), GET);
        });
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get("/cnt/sub", (req, res) => {
  if (!req.query.path) return;

  let data = "";
  let path = req.query.path;
  let api = "";
  let options = JSON.parse(JSON.stringify(globalOptions));

  path.forEach((value, index) => {
    api += "/" + value;
  });

  options.method = "GET";
  options.headers["Content-Type"] = "application/json; ty=3";
  options.path = "/" + Config.mobius.cb + api + "?rcn=4&ty=23";
  try {
    http.get(options, (response) => {
      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          res.json(JSON.parse(data)["m2m:sub"]);
          responseTime.store(res.getHeader("X-Response-Time"), GET);
        });
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get("/children", (req, res) => {
  if (!req.query.resource) return;
  let data = "";
  let path = req.query.path;
  let resourceName = JSON.parse(req.query.resource).rn;
  let resourceId = JSON.parse(req.query.resource).ri;
  let pathString = "";
  let options = JSON.parse(JSON.stringify(globalOptions));

  if (typeof path === "object") {
    path.forEach((value, index) => {
      pathString += "/" + value;
    });
  }

  let resultChildren = {
    cnt: [],
    sub: [],
    cin: {},
  };

  options.method = "GET";
  options.path = "/" + Config.mobius.cb + pathString + "?rcn=4&ty=3&ty=23";

  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      let sql = "SELECT * FROM latestcin where pi='" + resourceId + "'";
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        resultChildren.cin = result[0];

        try {
          http.get(options, (response) => {
            response.setEncoding("utf8");
            response
              .on("data", (chunk) => {
                data += chunk;
              })
              .on("end", () => {
                let resourceAll = JSON.parse(data)["m2m:rsp"];
                function myResourceFilter(value) {
                  return value.pi === resourceId;
                }

                if (resourceAll["m2m:cnt"]) {
                  resultChildren.cnt = resourceAll["m2m:cnt"].filter(myResourceFilter);
                }

                if (resourceAll["m2m:sub"]) {
                  resultChildren.sub = resourceAll["m2m:sub"].filter(myResourceFilter);
                }

                res.json(resultChildren);
                responseTime.store(res.getHeader("X-Response-Time"), GET);
              });
          });
        } catch (e) {
          console.log(e);
          res.status(400).send(e);
        }
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.get("/ae/children", (req, res) => {
  let data = "";
  let options = JSON.parse(JSON.stringify(globalOptions));
  if (!req.query.pi && !req.query.ri) return;

  options.method = "GET";
  options.headers["Content-Type"] = "application/json; ty=2";
  options.path = "/" + Config.mobius.cb + req.query.parent + "/" + req.query.ri + "?rcn=4&ty=3";

  try {
    http.get(options, (response) => {
      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          res.json(JSON.parse(data)["m2m:rsp"]);
          responseTime.store(res.getHeader("X-Response-Time"), GET);
        });
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.get("/intensification", (req, res) => {
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let today = new Date();
  let yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      let sql = "SELECT * FROM dailycount WHERE user='" + userId + "' AND resource_type='cin' AND creation_time BETWEEN '" + yesterday.yyyymmdd() + "' AND '" + today.yyyymmdd() + "'";
      // let sql = 'SELECT * FROM dailycount WHERE user=\'' + userId + '\' AND resource_type=\'cin\' AND creation_time BETWEEN 20180805 AND 20180806';
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        result.forEach((element) => {
          element.creation_time = new Date(element.creation_time).yyyymmdd();
        });
        res.send(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
      res.status(400).send("[db.connect] No Connection");
    }
  });
});

router.put("/storageOption/:AEname/:CNTname", async (req, res) => {
  console.log("---- PUT API Storage Option resource Update");
  if (!req.body) {
    res.status(400).send("Bad Request");
  }
  let AEname = req.params.AEname;
  let CNTname = req.params.CNTname;
  let userId = Auth.getUserId(req.headers["x-access-token"]);
  console.log("req.data : ", req.body);

  let storage = {
    timeseries: req.body.timeseries == "true" ? "true" : "false",
    spatialdata: req.body.spatialData == "true" ? "true" : "false",
  };

  try {
    /**
     * Modify Mysql Timeseries, spatialData column
     */
    let sql = `UPDATE cnt SET timeseries='${storage.timeseries}', spatialData='${storage.spatialdata}' WHERE path = '/${AEname}/${CNTname}' and user = '${userId}'`;
    Database.mysql.connection((code, connection) => {
      if (code === "200") {
        Database.mysql.query(sql, connection, function (err, results) {
          if (err) {
            console.log("ERROR Modify Storage Option", err, results);
            res.status(400).send(err + results);
            return;
          }

          /**
           * Modify Redis Storage Field
           */
          let parentResource = {
            ae: AEname,
            cnt: CNTname,
          };
          let redisCacheValue = 0;
          if (timeseries === "true") redisCacheValue += 1;
          if (spatialData === "true") redisCacheValue += 2;
          redisClient.hmset("storage", JSON.stringify(parentResource), redisCacheValue);

          res.status(200).send("SUCCESS Modify Storage Option \n" + JSON.stringify(req.body));
          console.log("Update Storage Option", results);
        });
        connection.release();
      } else {
        res.status(400).send("[db.connect] No Connection - Update Storage Option");
      }
    });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.put("/*/*", (req, res) => {
  console.log("---- PUT API 2-depth resource Update");
  if (!req.body) {
    res.status(400).send("Bad Request");
  }

  let userId = Auth.getUserId(req.headers["x-access-token"]);
  let options = JSON.parse(JSON.stringify(globalOptions));

  console.log(req.body);
  let requestData = req.body;

  options.headers["Content-Type"] = "application/json";
  options.path = "/" + Config.mobius.cb + req.url + "?rcn=1";
  options.method = "PUT";

  try {
    const request = http.request(options, (response) => {
      let data = "";

      response.setEncoding("utf8");
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          let mobiusReturn = JSON.parse(data);
          let ContainerRI = mobiusReturn["m2m:cnt"]["ri"];
          console.log(ContainerRI);

          if (response.statusCode === 200) {
            // update container
            let sql = `UPDATE cnt SET lbl="inactive" WHERE ri = '${ContainerRI}'`;
            Database.mysql.connection((code, connection) => {
              if (code === "200") {
                Database.mysql.query(sql, connection, function (err, results) {
                  console.log(err, results);
                });
                connection.release();
              } else {
                res.status(400).send("[db.connect] No Connection");
              }
            });
          }
          let mobiusHeaders = Object.keys(response.headers);
          mobiusHeaders.forEach((header) => {
            if (header === "x-m2m-rsc" || header === "x-m2m-ri" || header === "x-m2m-rvi") {
              res.header(header, response.headers[header]);
            }
          });
          res.status(response.statusCode).json(mobiusReturn);
          responseTime.store(res.getHeader("X-Response-Time"), PUT);
        });
    });

    request.write(JSON.stringify(requestData));
    request.end();
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

module.exports = router;

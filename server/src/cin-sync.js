/**
 *
 * @description :
 * Creation of cin only can be done by mobius
 * Mobius produce cin data to kafka - topic : cin
 * Bada Platform synchronizes CIN datas with periodic polling
 */
const { Kafka, logLevel } = require("kafkajs");
const redis = require("redis");
const Config = require("../configuration/config.json");
const Database = require("./database");
const redisClient = redis.createClient(Config.db.redis);
const moment = require("moment");
// the client ID lets kafka know who's producing the messages
const clientId = "kafkajs-client";
const groupId = "batch-consumer-group";
// we can define the list of brokers in the cluster
const brokers = [`${Config.kafka.host}:${Config.kafka.port}`];
// this is the topic to which we want to poll messages
const topic = "cin";

const AVG_MESSAGE_SIZE = 350; // bytes
const NUMBER_OF_MESSAGES_TO_RECEIVE = 400;
const MAX_BYTES_PER_PARTITION = NUMBER_OF_MESSAGES_TO_RECEIVE * AVG_MESSAGE_SIZE;
const MAX_BYTES = 32 * MAX_BYTES_PER_PARTITION;
const MIN_BYTES = MAX_BYTES_PER_PARTITION;

const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: brokers,
  clientId: clientId,
  connectionTimeout: 10000,
});
const consumer = kafka.consumer({ groupId: groupId, maxBytes: MAX_BYTES, minBytes: MIN_BYTES });
const producer = kafka.producer();
const initKafka = async () => {
  await producer.connect();
};
initKafka();

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  await consumer.run({
    eachBatchAutoResolve: true,
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, uncommittedOffsets, isRunning, isStale, pause }) => {
      console.log("======= BATCH Consumer Test : ");
      for (let record of batch.messages) {
        let message = record.value;
        let mobiusReturn = JSON.parse(message);

        if (!mobiusReturn.con) {
          console.log(`ERROR [cin-sync] -- No con Data`);
        }
        // console.log("CON MESSAGE : ", mobiusReturn.con);

        let piList = mobiusReturn.pi.split("/");
        let parentResource = {
          ae: piList[2],
          cnt: piList[3],
        };

        /**
         * latest 저장
         * ri, rn, ty, pi, ct, lt, et, st, cr, cs, con, sri, ae, cnt
         */
        redisClient.hmset("latest", mobiusReturn.pi, message);

        /**
         * count 저장
         * user, type, count, ct
         */
        redisClient.hincrby("count", JSON.stringify({ user: await getOwner(parentResource.ae), ct: UTC2KST(mobiusReturn.ct) }), 1);

        /**
         * timeseries, spatial 저장
         */
        saveStorage(parentResource, mobiusReturn);

        resolveOffset(message.offset);
        await heartbeat();
      }
    },
  });
};
run().catch((e) => console.error(`[cin-sync] - consumergroup error ${e.message}`, e));

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
  process.on(type, async (e) => {
    console.log(`process.on ${type}`);
    console.log(e);
    // try {
    //   console.log(`process.on ${type}`);
    //   console.log(e);
    //   await consumer.disconnect();
    //   process.exit(0);
    // } catch (_) {
    //   process.exit(1);
    // }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    // try {
    //   await consumer.disconnect();
    // } finally {
    //   process.kill(process.pid, type);
    // }
  });
});

console.log('Started Consumer for topic "' + topic + '" in group "' + clientId + '"');

/**
 * 1초에 한 번씩 Redis 정보 Mysql에 업데이트
 */
setInterval(() => {
  redisClient.hgetall("count", (err, obj) => {
    if (err) {
      console.log("ERROR [cinsync - mysql interval] -- redis count hgetall error\n", err);
      return;
    } else {
      if (obj !== null) {
        Object.keys(obj).forEach((key) => {
          let dateObj = new Date();
          let { year, month, date } = { year: dateObj.getFullYear(), month: dateObj.getMonth() + 1, date: dateObj.getDate() };
          let today = `${year}${month >= 10 ? month : "0" + month}${date >= 10 ? date : "0" + date}`;
          if (JSON.parse(key).ct == today) {
            saveCount(key, obj[key]);
          } else {
            redisClient.hdel("count", key, function (err, reply) {
              if (err) {
                console.log("ERROR [cinsync - Mysql Interval] -- redis count hdel error\n", err);
              }
              if (reply === 1) {
                console.log(`LOG [cinsync - Mysql Interval] -- Delete expired redis count data \n`, key);
              } else {
                console.log(`LOG [cinsync - Mysql Interval] -- No Exist data \n`, key);
              }
            });
          }
        });
      }
    }
  });
  redisClient.hgetall("latest", (err, obj) => {
    if (err) {
      console.log("ERROR [cinsync - mysql interval] -- redis latest hgetall error\n", err);
      return;
    } else {
      if (obj !== null) {
        Object.keys(obj).forEach((key) => {
          saveLatest(obj[key]);
        });
      }
    }
  });
}, 1000);

function UTC2KST(ct) {
  /**
   * MobiusReturn의 CT(creation time)은 UTC를 따름
   * web에 Dailycount 차트는 KST를 따름
   * DB에 저장할 때 kst로 변경하여 저장
   */

  let UTCDate = ct;
  let KSTDate = `${UTCDate.slice(0, 4)}-${UTCDate.slice(4, 6)}-${UTCDate.slice(6, 8)} ${UTCDate.slice(9, 11)}:${UTCDate.slice(11, 13)}:${UTCDate.slice(13, 15)}Z`;
  KSTDate = new Date(KSTDate);
  let { year, month, date } = { year: KSTDate.getFullYear(), month: KSTDate.getMonth() + 1, date: KSTDate.getDate() };
  KSTDate = `${year}${month >= 10 ? month : "0" + month}${date >= 10 ? date : "0" + date}`;

  return KSTDate;
}

let saveLatest = async (data) => {
  let mobiusData = JSON.parse(data);
  let cntPid = mobiusData.spi;
  // bada db에 필요없는 필드 삭제
  delete mobiusData.cnf;
  delete mobiusData.acpi;
  delete mobiusData.lbl;
  delete mobiusData.at;
  delete mobiusData.aa;
  delete mobiusData.subl;
  delete mobiusData.or;
  delete mobiusData.spi;

  let insertData = mobiusData;

  let logMessage = "Latest CIN UPDATE success";
  let updateString = "";
  let insertString = "";
  let sql = "";

  // console.log("MOBIUS DATA : ", mobiusData);

  let piList = mobiusData.pi.split("/");
  let parentResource = {
    ae: piList[2],
    cnt: piList[3],
  };

  insertData.ae = parentResource.ae;
  insertData.cnt = parentResource.cnt;

  let values = Object.values(insertData);

  values.forEach((element, index) => {
    if (Object.keys(insertData)[index] == "pi") {
      updateString += Object.keys(insertData)[index] + "='" + cntPid + (index == values.length - 1 ? "'" : "',");
    } else if (Object.keys(insertData)[index] == "con") {
      updateString += Object.keys(insertData)[index] + "='" + JSON.stringify(element) + (index == values.length - 1 ? "'" : "',");
    } else {
      updateString += Object.keys(insertData)[index] + "='" + element + (index == values.length - 1 ? "'" : "',");
    }
  });
  values.forEach((element, index) => {
    if (Object.keys(insertData)[index] == "pi") {
      insertString += "'" + cntPid + "'" + (index == values.length - 1 ? "" : ",");
    } else if (Object.keys(insertData)[index] == "con") {
      insertString += "'" + JSON.stringify(element) + "'" + (index == values.length - 1 ? "" : ",");
    } else {
      insertString += "'" + element + "'" + (index == values.length - 1 ? "" : ",");
    }
  });

  sql = "UPDATE latestcin SET " + updateString + " WHERE pi='" + cntPid + "'";

  let cntsearchsql = "SELECT ri FROM cnt WHERE ri='" + cntPid + "'";

  Database.mysql.connection((code, connection) => {
    Database.mysql.query(cntsearchsql, connection, function (err, results) {
      if (!err) {
        if (!results[0]) {
          console.log("ERROR [saveLatest] -- SELECT cnt\n", "No Container resource id: ", cntPid, err);
          connection.release();
          return;
        }
        Database.mysql.query(sql, connection, function (err, results) {
          if (!err) {
            if (results.affectedRows === 0) {
              sql = "INSERT INTO latestcin (" + Object.keys(insertData) + ") VALUES (" + insertString + ")";
              console.log("INSERT SQL : ", sql);
              Database.mysql.query(sql, connection, function (err, results) {
                if (err) {
                  console.log("ERROR [saveLatest] -- INSERT latestcin \n", err, results);
                  connection.release();
                  return;
                }
                console.log("SUCCESS [saveLatest] -- INSERT latestcin \n result of cin insert: ", results.affectedRows);
              });
            } 
            insertData = null;
            logMessage = "Latest CIN INSERT success";
            connection.release();
            // console.log(logMessage, results);
          } else {
            console.log("ERROR [saveLatest] -- UPDATE latestcin \n", err, results);
            connection.release();
            return;
          }
        });
      } else {
        console.log("ERROR [saveLatest] -- SELECT cnt \n", err, results);
        connection.release();
        return;
      }
    });
  });
};

function saveCount(data, countValue) {
  let mobiusData = JSON.parse(data);
  let sql = "";
  let insertData = {
    user: mobiusData.user,
    resource_type: "cin",
    creation_time: mobiusData.ct,
  };

  let logMessage = "Resource Daily Counting UPDATE Success";

  sql = `UPDATE dailycount SET resource_count = ${countValue} WHERE user='${insertData.user}' AND resource_type='${insertData.resource_type}' AND creation_time= '${insertData.creation_time}';`;

  Database.mysql.connection((code, connection) => {
    Database.mysql.query(sql, connection, (err, result) => {
      if (err) {
        console.log(err);
        connection.release();
        return;
      }

      if (result.affectedRows === 0) {
        sql = `INSERT dailycount (user, resource_type, resource_count, creation_time) VALUES ('${insertData.user}', '${insertData.resource_type}', ${countValue},'${insertData.creation_time}');`;

        Database.mysql.query(sql, connection, (err, result) => {
          if (err) {
            console.log(err);
            connection.release();
            return;
          }

          logMessage = "Resource Daily Counting INSERT Success";
        });
      }
      // console.log(logMessage);
      connection.release();
    });
  });
}

function saveStorage(parentResource, mobiusReturn) {

  let fieldkeys = Object.keys(mobiusReturn.con);
  let lower = fieldkeys.map(element => {
    return element.toLowerCase();
  });
  let spatialKafkaData = mobiusReturn;

  fieldkeys.forEach((element) => {
    if (element.toLowerCase() == 'creationtime') {
      let ctData = mobiusReturn.con[element];
      spatialKafkaData.con[element] = moment(ctData).format("YYYY-MM-DD HH:mm:ss");
    }
  });

  if (!lower.includes("creationtime")) {
    let ctData = mobiusReturn.ct;
    ctData = moment(ctData).format("YYYY-MM-DD HH:mm:ss");
    spatialKafkaData.con["creationtime"] = ctData;
  }


  redisClient.hget("storage", JSON.stringify(parentResource), (err, val) => {
    if (err) {
      console.log(`ERROR [Redis Cache] -- hgetall storage error \n`, err);
    }

    if (val) {

      if (val == 0) {
      } else if (val == 1) {
        ProdKafka("timeseries", mobiusReturn);
        console.log("Produce Timeseries Data to Kafka");
      } else if (val == 2) {
        ProdKafka("spatialdata", spatialKafkaData);
        console.log("Produce Spatial Data to Kafka");
      } else if (val == 3) {
        ProdKafka("timeseries", mobiusReturn);
        ProdKafka("spatialdata", spatialKafkaData);
        console.log("Produce Timeseries Data to Kafka");
        console.log("Produce Spatial Data to Kafka");
      }
    } else {
      console.log(`INFO [Redis Cache] -- CREATE Redis Cache\n`);
      Database.mysql.connection((code, connection) => {
        if (code === "200") {
          let sql = `SELECT timeseries, spatialData from cnt where path ='/${parentResource.ae}/${parentResource.cnt}'`;
          let redisCacheValue = 0;
          Database.mysql.query(sql, connection, function (err, result) {
            if (!err) {
              if (result[0].timeseries == "true") {
                console.log("Produce Timeseries Data to Kafka");
                ProdKafka("timeseries", mobiusReturn);
                redisCacheValue += 1;
              }
              if (result[0].spatialData == "true") {
                console.log("Produce Spatial Data to Kafka");
                ProdKafka("spatialdata", spatialKafkaData);
                redisCacheValue += 2;
              }
              redisClient.hmset("storage", JSON.stringify(parentResource), redisCacheValue);
            } else {
              console.log(`ERROR [Redis Cache] -- DATABASE ERROR \n`, err, result);
              return;
            }
          });
        } else {
          console.log(`ERROR [Redis Cache] -- Database No Connection`);
        }
        connection.release();
      });
    }
  });
}

async function ProdKafka(kafkaTopic, bodyString) {
  // let payloads = [
  //   {
  //     topic: kafkaTopic,
  //     messages: JSON.stringify(bodyString),
  //     key: bodyString["m2m:rce"]["uri"],
  //   },
  // ];

  // kafka_producer.send(payloads, function (err, data) {
  //   if (err) console.log("ERROR [Produce Kafka Payloads Error] \n ", err);
  //   //   else console.log("LOG [Produce Kafka Result Data] \n ", data);
  // });

  console.log("HERE IS BODY STRING", bodyString)
  await producer.send({
    topic: kafkaTopic,
    messages: [{ key: bodyString["pi"], value: JSON.stringify(bodyString.con) }],
  });
}

async function getOwner(ae) {
  let ownerPromise = new Promise((resolve, reject) => {
    redisClient.hgetall("owner", (err, obj) => {
      if (err) {
        console.log(`ERROR [cinsync - getOnwer] -- redis hgetall error\n`, err);
        resolve(err);
      }
      if (obj !== null) {
        resolve(obj[ae]);
      } else {
        let sql = `SELECT user FROM ae WHERE rn='${ae}'`;
        Database.mysql.connection((code, connection) => {
          Database.mysql.query(sql, connection, (err, result) => {
            if (err) {
              console.log(`ERROR [cinsync - getOwner] -- DATABASE ERROR \n`, err, result);
              resolve(err);
            }
            redisClient.hmset("owner", ae, result[0].user);
            connection.release();
            resolve(result[0].user);
          });
        });
      }
    });
  });

  return await ownerPromise;
}

const router = require("express").Router();
const http = require("http");
const Config = require("../configuration/config.json");
const Database = require("../src/database");
const responseTime = require("../src/response-time");
const GET = "get";
const POST = "post";
const PUT = "put";
const DELETE = "delete";

function requestMobius(requestInfo, method, returnData, bodyInfo) {
  let options = {
    hostname: Config.mobius.host,
    port: Config.mobius.port,
    path: "/" + Config.mobius.cb,
    method: method,
    headers: {},
  };

  let httpHeaders = Object.keys(requestInfo.headers);

  console.log(`LOG [requestMobius] -- resource name keys\n`, requestInfo.url);

  // make mobius request header
  httpHeaders.forEach((header) => {
    if (header === "accept" || header === "x-m2m-ri" || header === "x-m2m-origin" || header === "content-type") {
      options.headers[header] = requestInfo.headers[header];
    }
  });
  if (requestInfo.url.includes("/?")) {
    options.path += requestInfo.url.substr(1);
  } else if (requestInfo.url === "/") {
    options.path += "";
  } else {
    options.path += requestInfo.url;
  }

  options.agent = false;
  // execute mobius request

  console.log(`LOG [requestMobius] -- request Mobius Options\n`, options);
  let request = http.request(options, (response) => {
    let data = "";

    response.setEncoding("utf8");
    response
      .on("data", (chunk) => {
        data += chunk;
      })
      .on("end", () => {
        returnData(response, data);
      })
      .on("error", (err) => {
        console.log(`ERROR [requestMobius] -- error response\n`, err);
      });
  });

  if (bodyInfo) {
    request.write(JSON.stringify(bodyInfo));
  }
  request.end();
}

/**
 * Create Content Instance
 * @function
 * @param {string} parameter - api parameter.
 * @param {callback} execution - api execution callback function.
 */

router.post("/*/*", (req, res) => {
  if (req.body["m2m:cin"]) {
    console.log(`LOG [Create CIN] -- create Content Instance `);
    console.log(`ERROR [Create CIN] -- CIN creation is not supported. \n It can only be created on the Mobius Server of http://HOST:7579.`);
    res.status(404).json({
      "m2m:dbg": "CIN creation is not supported. \n It can only be created on the Mobius Server of http://HOST:7579.",
    });
  }
  if (req.body["m2m:sub"]) {
    console.log(`LOG [Create SUB] -- create Subscription `);
    console.log(`ERROR [Create SUB] -- SUB creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.`);
    res.status(404).json({
      "m2m:dbg": "SUB creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.",
    });
  }
});

/**
 * Create AE
 * @function
 * @param {string} parameter
 * @param {callback} execution
 */

router.post("/", (req, res) => {
  console.log(`LOG [Create AE] -- create Application Entity `);
  console.log(`ERROR [Create AE] -- AE creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.`);
  res.status(404).json({
    "m2m:dbg": "AE creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.",
  });
});

/**
 * Create Container
 * @function
 * @param {string} parameter - api parameter.
 * @param {callback} execution - api execution callback function.
 */
router.post("/*", (req, res) => {
  console.log(`LOG [Create Container] -- create Container`);
  console.log(`ERROR [Create Container] -- Container creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.`);
  res.status(404).json({
    "m2m:dbg": "Container creation is not supported. \n It can only be created on the Web UI-Register page of http://HOST:7576.",
  });
});

/**
 * Retrieve Mobius Resource
 * @function
 * @param {string} parameter - Resource Parameter Path
 * @param {callback} execution - api execution callback function.
 */

router.get("/", (req, res) => {
  console.log(`LOG [Retrieve Mobius Resource] -- CSE Base Retrieve`);
  requestMobius(req, GET, (response, data) => {
    // console.log(JSON.parse(data))
    let mobiusHeaders = Object.keys(response.headers);
    mobiusHeaders.forEach((header) => {
      if (header === "x-m2m-rsc" || header === "x-m2m-ri" || header === "x-m2m-rvi") {
        res.header(header, response.headers[header]);
      }
    });
    res.status(response.statusCode).json(JSON.parse(data));
    responseTime.store(res.getHeader("X-Response-Time"), GET);
  });
});

/**
 * Retrieve AE Resource
 * @function
 * @param {string} parameter - Resource Parameter Path
 * @param {callback} execution - api execution callback function.
 */
router.get("/*", (req, res) => {
  console.log(`LOG [Retrieve AE Resource] -- AE Retrieve`);
  console.log(`LOG [Retrieve AE Resource] -- AE retrieve respose header\n`, res.getHeaders());
  requestMobius(req, GET, (response, data) => {
    let mobiusHeaders = Object.keys(response.headers);
    mobiusHeaders.forEach((header) => {
      if (header === "x-m2m-rsc" || header === "x-m2m-ri" || header === "x-m2m-rvi") {
        res.header(header, response.headers[header]);
      }
    });
    res.status(response.statusCode).json(JSON.parse(data));
    responseTime.store(res.getHeader("X-Response-Time"), GET);
  });
});

/**
 * PUT Mobius Subscription
 * @function
 * @param {string} parameter - Resource Parameter Path
 * @param {callback} execution - api execution callback function.
 */
router.put("/*/*/*", (req, res) => {
  console.log(`LOG [PUT Mobius Subscription] -- create Mobius Subscription`);
  requestMobius(
    req,
    PUT,
    (response, data) => {
      console.log(`LOG [PUT Mobius Subscription] -- request Mobius response data \n`, data);
      let mobiusHeaders = Object.keys(response.headers);
      mobiusHeaders.forEach((header) => {
        if (header === "x-m2m-rsc" || header === "x-m2m-ri" || header === "x-m2m-rvi") {
          res.header(header, response.headers[header]);
        }
      });
      res.status(response.statusCode).json(JSON.parse(data));
      responseTime.store(res.getHeader("X-Response-Time"), PUT);
    },
    req.body
  );
});

/**
 * PUT Not Supported API 2-depth resource Update
 * @function
 * @param {string} parameter - Resource Parameter 2-depth Path
 * @param {callback} execution - api execution callback function.
 */
router.put("/*/*", (req, res) => {
  console.log(`LOG [PUT 2-depth resource Update] -- PUT 2-depth resource Update `);

  requestMobius(
    req,
    PUT,
    (response, data) => {
      let mobiusReturn = JSON.parse(data);
      let ContainerRI = mobiusReturn["m2m:cnt"]["ri"];
      let body = req.body["m2m:cnt"];

      let updateString = "";
      let objectLength = Object.keys(body).length;
      Object.keys(body).forEach((key, index) => {
        updateString += `${key} = '${body[key]}'` + (index === objectLength - 1 ? "" : ",");
      });

      if (response.statusCode === 200) {
        // update container
        let sql = `UPDATE cnt SET ${updateString} WHERE ri = '${ContainerRI}'`;
        Database.mysql.connection((code, connection) => {
          if (code === "200") {
            Database.mysql.query(sql, connection, function (err, results) {
              console.log(`ERROR [PUT 2-depth resource Update] -- UPDATE cnt Error \n`, err, results);
            });
            connection.release();
          } else {
            console.log(`ERROR [PUT 2-depth resource Update] -- No Database Connection error`);
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
      responseTime.store(res.getHeader("X-Response-Time"), GET);
    },
    req.body
  );
});

/**
 * DELETE Mobius Latest ContentInstance
 * @function
 * @param {string} parameter - Resource Parameter Path
 * @param {callback} execution - api execution callback function.
 */
router.delete("/*/*/latest", (req, res) => {
  console.log(`LOG [Delete Mobius Latest ContentInstance] -- delete Mobius Latest Content Instance`);
  console.log(`ERROR [Delete Mobius Latest ConttentInstance] -- Resource Does not exist`);
  res.status(404).json({
    "m2m:dbg": "resource does not exist",
  });
});

/**
 * DELETE Mobius Subscription
 * @function
 * @param {string} parameter - Resource Parameter Path
 * @param {callback} execution - api execution callback function.
 */
router.delete("/*/*/*", (req, res) => {
  console.log(`LOG [Delete Mobius Subscription] -- DELETE Mobius Subscription`);
  requestMobius(req, DELETE, (response, data) => {
    let mobiusHeaders = Object.keys(response.headers);
    mobiusHeaders.forEach((header) => {
      if (header === "x-m2m-rsc" || header === "x-m2m-ri" || header === "x-m2m-rvi") {
        res.header(header, response.headers[header]);
      }
    });
    res.status(response.statusCode).json(data);
    responseTime.store(res.getHeader("X-Response-Time"), DELETE);
  });
});

module.exports = router;

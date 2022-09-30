const router = require('express').Router();
const Mysql = require('mysql');
const Influx = require('influx');
const http = require('http');
const Config = require('../configuration/config.json');
const responseTime = require('../src/response-time');
const Databse = require('../src/database');

let testMysqlConnection = (options) => {
  let testResult = {
    connection: false
  };

  let alteredOptions = JSON.parse(options);
  alteredOptions.database = "bada";

  let mysqlInstance = Mysql.createConnection(alteredOptions);

  return new Promise(resolve => {
    mysqlInstance.query('SELECT 1', (error, results, fields) => {
      if(!error) {
        testResult.connection = true;
      }

      resolve(testResult);
    })  
  })
}

let testInfluxConnection = (options) => {
  let testResult = {
    connection: false
  };

  let alteredOptions = JSON.parse(options);

  alteredOptions.database = "bada";
  alteredOptions.precision = "rc3339";

  let influxInstance = new Influx.InfluxDB(alteredOptions);

  return new Promise(resolve => {
    influxInstance.ping(5000).then(hosts => {

      if(hosts[0].online) {
        testResult.connection = true;
      }
      resolve(testResult);
    })
  })
}

let testMobiusConnection = (options) => {
  let testResult = {
    connection: false
  };

  let alteredOptions = JSON.parse(options);

  let optionSet = {
    hostname: alteredOptions.host,
    port: alteredOptions.port,
    method: 'GET',
    path: '/' + alteredOptions.cb + '?rcn=1',
    headers: {
      'Accept': 'application/json',
      'X-M2M-RI': 'ketiketi',
      'X-M2M-Origin': 'S',
    }
  }

  return new Promise(resolve => {
    http.get(optionSet, (response) => {
      response.setEncoding('utf8');
      response.on('data', _ => {}).on('end', () => {
        if(response.statusCode === 200) {
          testResult.connection = true;
        }
        resolve(testResult);
      })
    }).on('error', (e) => {
      resolve(testResult);
    })
  });
}

router.get('/test', (req, res)=> {
  if(req.query.type === 'sql') {
    testMysqlConnection(req.query.config).then(result => {
      res.send(result);
      responseTime.store(res.getHeader("X-Response-Time"), 'get');
    }).catch(err=>{
      console.log(err);
    });
  } else if(req.query.type === 'timeseries') {
    testInfluxConnection(req.query.config).then(result => {
      res.send(result);
      responseTime.store(res.getHeader("X-Response-Time"), 'get');
    }).catch(err=>{
      console.log(err);
    });
  } else if(req.query.type === 'spatialdata') {
    Databse.spatial.testConnection(req.query.config).then(result => {
      res.send(result);
      responseTime.store(res.getHeader("X-Response-Time"), 'get');
    }).catch(err=>{
      console.log(err);
    });
  } else if(req.query.type === 'mobius') {
    testMobiusConnection(req.query.config).then(result => {
      res.send(result);
      responseTime.store(res.getHeader("X-Response-Time"), 'get');
    }).catch(err=>{
      console.log(err);
    });
  }
})


module.exports = router;
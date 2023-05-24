const express = require('express');
const app = express();
const http = require('http')
const POST = "post"
const mqtt = require('mqtt')

/* mqtt subscribe */
function MQTTsubscribe() {   
  mqtt_sub_client = mqtt.connect(`mqtt://localhost:1883`);
  
  mqtt_sub_client.on("connect", function () {
      console.log("MQTT connected!", mqtt_sub_client.connected);
  });

  mqtt_sub_client.on("error", (error) => {
      console.log(error);
      process.exit(1);
  });

  mqtt_sub_client.subscribe(`/oneM2M/req/+/+/+`, function (err) {
      if (err) {
          console.log(err);
      }
  });
  
  mqtt_sub_client.on("message", (topic, message, packet) => {
    console.log("topic: " + topic + ", message: " + message);
    var topic_arr = topic.split("/");
    var bodytype = 'json';
    var jsonbody = JSON.parse(message);

      if(topic_arr[5] != null) {
          bodytype = (topic_arr[5] === 'xml') ? topic_arr[5] : ((topic_arr[5] === 'json') ? topic_arr[5] : ((topic_arr[5] === 'cbor') ? topic_arr[5] : 'json'));
      }

      if(topic_arr[1] === 'oneM2M' && topic_arr[2] === 'req') {
          console.log(message.toString());
          if(bodytype === 'xml') {
              var parser = new xml2js.Parser({explicitArray: false});
              parser.parseString(message.toString(), function (err, jsonObj) {
                  if (err) {
                      console.log('[mqtt noti xml2js parser error]');
                  }
                  else {
                      mqtt_noti_action(topic_arr, jsonObj);
                  }
              });
          }
          else if(bodytype === 'cbor') {
              var encoded = message.toString();
              cbor.decodeFirst(encoded, function(err, jsonObj) {
                  if (err) {
                      console.log('[mqtt noti cbor parser error]');
                  }
                  else {
                      mqtt_noti_action(topic_arr, jsonObj);
                  }
              });
          }
          else { // json
              var jsonObj = JSON.parse(message);

              if (jsonObj['m2m:rqp'] == null) {
      
                  jsonObj['m2m:rqp'] = jsonObj;
              }
              mqtt_noti_action(topic_arr, jsonObj);
          }
      }
      else {
          console.log('topic is not supported');
      }
  });
}


var response_mqtt = function (rsp_topic, rsc, to, fr, rqi, inpc, bodytype) {
  var rsp_message = {};
  rsp_message['m2m:rsp'] = {};
  rsp_message['m2m:rsp'].rsc = rsc;
  rsp_message['m2m:rsp'].to = to;
  rsp_message['m2m:rsp'].fr = fr;
  rsp_message['m2m:rsp'].rqi = rqi;
  rsp_message['m2m:rsp'].pc = inpc;

  if(bodytype === 'xml') {
      rsp_message['m2m:rsp']['@'] = {
          "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
          "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
      };

      var xmlString = js2xmlparser.parse("m2m:rsp", rsp_message['m2m:rsp']);

      mqtt_sub_client.publish(rsp_topic, xmlString);
  }
  else if (bodytype ===  'cbor') {
      xmlString = cbor.encode(rsp_message['m2m:rsp']).toString('hex');

      mqtt_sub_client.publish(rsp_topic, xmlString);
  }
  else { // 'json'
      console.log("rsp_topic : " ,rsp_topic);
      console.log("rsp_message : " ,rsp_message);
      mqtt_sub_client.publish(rsp_topic, JSON.stringify(rsp_message['m2m:rsp']));
  }
};

var mqtt_noti_action = function(topic_arr, jsonObj) {
  if (jsonObj != null) {
      var bodytype = 'json';
      if(topic_arr[5] != null) {
          bodytype = topic_arr[5];
      }

      var op = (jsonObj['m2m:rqp']['op'] == null) ? '' : jsonObj['m2m:rqp']['op'];
      var to = (jsonObj['m2m:rqp']['to'] == null) ? '' : jsonObj['m2m:rqp']['to'];
      var fr = (jsonObj['m2m:rqp']['fr'] == null) ? '' : jsonObj['m2m:rqp']['fr'];
      var rqi = (jsonObj['m2m:rqp']['rqi'] == null) ? '' : jsonObj['m2m:rqp']['rqi'];
      var pc = {};
      pc = (jsonObj['m2m:rqp']['pc'] == null) ? {} : jsonObj['m2m:rqp']['pc'];

      if(pc['m2m:sgn']) {
          pc.sgn = {};
          pc.sgn = pc['m2m:sgn'];
          delete pc['m2m:sgn'];
      }

      parse_sgn(rqi, pc, function (path_arr, cinObj, rqi) {
          if(cinObj) {
              if(cinObj.sud || cinObj.vrq) {
                  var resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                  response_mqtt(resp_topic, 2001, to, fr, rqi, '', topic_arr[5]);
              }
              else {
                  resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                  response_mqtt(resp_topic, 2001, to, fr, rqi, '', topic_arr[5]);

                  console.log('mqtt ' + bodytype + ' notification <----');

                  // _this.emit('notification', path_arr.join('/'), cinObj);
              }
          }
      });
  }
  else {
      console.log('[mqtt_noti_action] message is not noti');
  }
};
var parse_sgn = function (rqi, pc, callback) {
  if(pc.sgn) {
      var nmtype = pc['sgn'] != null ? 'short' : 'long';
      var sgnObj = {};
      var cinObj = {};
      sgnObj = pc['sgn'] != null ? pc['sgn'] : pc['singleNotification'];

      if (nmtype === 'long') {
          console.log('oneM2M spec. define only short name for resource')
      }
      else { // 'short'
          if (sgnObj.sur) {
              if(sgnObj.sur.charAt(0) != '/') {
                  sgnObj.sur = '/' + sgnObj.sur;
              }
              var path_arr = sgnObj.sur.split('/');
          }

          if (sgnObj.nev) {
              if (sgnObj.nev.rep) {
                  if (sgnObj.nev.rep['m2m:cin']) {
                      sgnObj.nev.rep.cin = sgnObj.nev.rep['m2m:cin'];
                      delete sgnObj.nev.rep['m2m:cin'];
                  }

                  if (sgnObj.nev.rep.cin) {
                      cinObj = sgnObj.nev.rep.cin;
                  }
                  else {
                      console.log('[mqtt_noti_action] m2m:cin is none');
                      cinObj = null;
                  }
              }
              else {
                  console.log('[mqtt_noti_action] rep tag of m2m:sgn.nev is none. m2m:notification format mismatch with oneM2M spec.');
                  cinObj = null;
              }
          }
          else if (sgnObj.sud) {
              console.log('[mqtt_noti_action] received notification of verification');
              cinObj = {};
              cinObj.sud = sgnObj.sud;
          }
          else if (sgnObj.vrq) {
              console.log('[mqtt_noti_action] received notification of verification');
              cinObj = {};
              cinObj.vrq = sgnObj.vrq;
          }

          else {
              console.log('[mqtt_noti_action] nev tag of m2m:sgn is none. m2m:notification format mismatch with oneM2M spec.');
              cinObj = null;
          }
      }
  }
  else {
      console.log('[mqtt_noti_action] m2m:sgn tag is none. m2m:notification format mismatch with oneM2M spec.');
      console.log(pc);
  }

  callback(path_arr, cinObj, rqi);
};



MQTTsubscribe();

/**
 * This is for http subscription
 */
const port = 7890;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

app.post("*", (req, res)=>{
	
	var fullBody = '';
	req.on('data', function(chunk) {
		fullBody += chunk; 
	});

	req.on('end', function() {
		res.status(200).send('post /end test ok');
		var receivedData = JSON.parse(fullBody);
		var rep = receivedData['m2m:sgn'].nev.rep;
		console.log("> receivedData: ", receivedData);
		console.log("> rep: ", rep);
	
	});
})

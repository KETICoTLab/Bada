/**
 * Copyright (c) 2018, KETI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @file
 * @copyright KETI Korea 2018, KETI
 * @author Il Yeup Ahn [iyahn@keti.re.kr]
 */

 var fs = require('fs');
 var http = require('http');
 var https = require('https');
 var express = require('express');
 var bodyParser = require('body-parser');
 var util = require('util');
 var xml2js = require('xml2js');
 var js2xmlparser = require('js2xmlparser');
 var url = require('url');
 var xmlbuilder = require('xmlbuilder');
 var moment = require('moment');
 var ip = require("ip");
 var events = require('events');
 var cbor = require('cbor');
 
 var WebSocketServer = require('websocket').server;
 
 var _server = null;
 
 var _this = this;
 
 var ws_state = 'init';
 
 // ������ �����մϴ�.
 var ws_app = express();
 
 var usewscbhost = 'localhost'; // pxyws to mobius
 
 var pxy_ws_server = null;
 
 
 function originIsAllowed(origin) {
     // put logic here to detect whether the specified origin is allowed.
     return true;
 }
 
 
 exports.ws_watchdog = function() {
     if(ws_state === 'init') {
         if(use_secure === 'disable') {
             http.globalAgent.maxSockets = 1000000;
             _server = http.createServer(ws_app);
 
             _server.listen({port: usepxywsport, agent: false}, function () {
                 console.log('pxyws server (' + ip.address() + ') running at ' + usepxywsport + ' port');
 
                 ws_state = 'connect';
             });
         }
         else {
             var options = {
                 key: fs.readFileSync('server-key.pem'),
                 cert: fs.readFileSync('server-crt.pem'),
                 ca: fs.readFileSync('ca-crt.pem')
             };
             https.globalAgent.maxSockets = 1000000;
             _server = https.createServer(options, ws_app);
 
             _server.listen({port: usepxywsport, agent: false}, function () {
                 console.log('pxyws server (' + ip.address() + ') running at ' + usepxywsport + ' port');
 
                 ws_state = 'connect';
             });
         }
     }
     else if(ws_state === 'connect') {
         http_retrieve_CSEBase(function(status, res_body) {
             console.log("http retrieve csebase connect status, res_body : ", status , res_body)
             if (status == '2000') {
                 var jsonObj = JSON.parse(res_body);
                 usecseid = jsonObj['m2m:cb'].csi;
 
                 ws_state = 'connecting';
             }
             else {
                 console.log('Target CSE(' + usewscbhost + ') is not ready');
             }
         });
     }
     else if(ws_state === 'connecting') {
         if(pxy_ws_server == null) {
             pxy_ws_server = new WebSocketServer({
                 httpServer: _server,
                 // You should not use autoAcceptConnections for production
                 // applications, as it defeats all standard cross-origin protection
                 // facilities built into the protocol and the browser.  You should
                 // *always* verify the connection's origin and decide whether or not
                 // to accept it.
                 autoAcceptConnections: false
             });
 
             ws_state = 'ready';
 
             pxy_ws_server.on('request', function (request) {
                 if (!originIsAllowed(request.origin)) {
                     // Make sure we only accept requests from an allowed origin
                     request.reject();
                     console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                     return;
                 }
 
                 for (var index in request.requestedProtocols) {
                     if(request.requestedProtocols.hasOwnProperty(index)) {
                         if(request.requestedProtocols[index] === 'onem2m.r2.0.xml') {
                             var connection = request.accept('onem2m.r2.0.xml', request.origin);
                             console.log((new Date()) + ' Connection accepted. (xml)');
                             connection.on('message', ws_message_handler);
                             connection.on('close', function (reasonCode, description) {
                                 console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                             });
                             break;
                         }
                         else if(request.requestedProtocols[index] === 'onem2m.r2.0.cbor') {
                             var connection = request.accept('onem2m.r2.0.cbor', request.origin);
                             console.log((new Date()) + ' Connection accepted. (cbor)');
                             connection.on('message', ws_message_handler);
                             connection.on('close', function (reasonCode, description) {
                                 console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                             });
                             break;
                         }
                         else if(request.requestedProtocols[index] === 'onem2m.r2.0.json') {
                             var connection = request.accept('onem2m.r2.0.json', request.origin);
                             console.log((new Date()) + ' Connection accepted. (json)');
                             connection.on('message', ws_message_handler);
                             connection.on('close', function (reasonCode, description) {
                                 console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                             });
                             break;
                         }
                     }
                 }
             });
         }
     }
 };
 
 
 global.make_json_obj = function (bodytype, str, callback) {
     try {
         if (bodytype === 'xml') {
             var message = str;
             var parser = new xml2js.Parser({explicitArray: false});
             parser.parseString(message.toString(), function (err, result) {
                 if (err) {
                     console.log('[mqtt make json obj] xml2js parser error]');
                     callback('0');
                 }
                 else {
                     for (var prop in result) {
                         if (result.hasOwnProperty(prop)) {
                             for (var attr in result[prop]) {
                                 if (result[prop].hasOwnProperty(attr)) {
                                     if (attr == '$') {
                                         delete result[prop][attr];
                                     }
                                     else if (attr == 'pc') {
                                         make_json_arraytype(result[prop][attr]);
                                     }
                                 }
                             }
                         }
                     }
                     callback('1', result);
                 }
             });
         }
         else if (bodytype === 'cbor') {
             cbor.decodeFirst(str, function (err, result) {
                 if (err) {
                     console.log('cbor parser error]');
                 }
                 else {
                     callback('1', result);
                 }
             });
         }
         else {
             var result = JSON.parse(str);
             callback('1', result);
         }
     }
     catch (e) {
         console.error(e.message);
         callback('0');
     }
 };
 
 global.make_json_arraytype = function (body_Obj) {
     for (var prop in body_Obj) {
         if (body_Obj.hasOwnProperty(prop)) {
             for (var attr in body_Obj[prop]) {
                 if (body_Obj[prop].hasOwnProperty(attr)) {
                     if (attr == 'srv' || attr == 'aa' || attr == 'at' || attr == 'poa' || attr == 'lbl' || attr == 'acpi' || attr == 'srt' || attr == 'nu' || attr == 'mid' || attr == 'macp' || attr == 'rels') {
                         if (body_Obj[prop][attr]) {
                             body_Obj[prop][attr] = body_Obj[prop][attr].split(' ');
                         }
                         if (body_Obj[prop][attr] == '') {
                             body_Obj[prop][attr] = [];
                         }
                         if (body_Obj[prop][attr] == '[]') {
                             body_Obj[prop][attr] = [];
                         }
                     }
                     else if (attr == 'rqps') {
                         var rqps_type = getType(body_Obj[prop][attr]);
                         if (rqps_type === 'array') {
 
                         }
                         else if (rqps_type === 'object') {
                             var temp = body_Obj[prop][attr];
                             body_Obj[prop][attr] = [];
                             body_Obj[prop][attr].push(temp);
                         }
                         else {
 
                         }
                     }
                     else if (attr == 'enc') {
                         if (body_Obj[prop][attr]) {
                             if (body_Obj[prop][attr].net) {
                                 if (!Array.isArray(body_Obj[prop][attr].net)) {
                                     body_Obj[prop][attr].net = body_Obj[prop][attr].net.split(' ');
                                 }
                             }
                         }
                     }
                     else if (attr == 'pv' || attr == 'pvs') {
                         if (body_Obj[prop][attr]) {
                             if (body_Obj[prop][attr].acr) {
                                 if (!Array.isArray(body_Obj[prop][attr].acr)) {
                                     temp = body_Obj[prop][attr].acr;
                                     body_Obj[prop][attr].acr = [];
                                     body_Obj[prop][attr].acr[0] = temp;
                                 }
 
                                 for (var acr_idx in body_Obj[prop][attr].acr) {
                                     if (body_Obj[prop][attr].acr.hasOwnProperty(acr_idx)) {
                                         if (body_Obj[prop][attr].acr[acr_idx].acor) {
                                             body_Obj[prop][attr].acr[acr_idx].acor = body_Obj[prop][attr].acr[acr_idx].acor.split(' ');
                                         }
 
                                         if (body_Obj[prop][attr].acr[acr_idx].hasOwnProperty('acco')) {
                                             if (!Array.isArray(body_Obj[prop][attr].acr[acr_idx].acco)) {
                                                 temp = body_Obj[prop][attr].acr[acr_idx].acco;
                                                 body_Obj[prop][attr].acr[acr_idx].acco = [];
                                                 body_Obj[prop][attr].acr[acr_idx].acco[0] = temp;
                                             }
 
                                             var acco = body_Obj[prop][attr].acr[acr_idx].acco;
                                             for (var acco_idx in acco) {
                                                 if (acco.hasOwnProperty(acco_idx)) {
                                                     if (acco[acco_idx].hasOwnProperty('acip')) {
                                                         if (acco[acco_idx].acip.hasOwnProperty('ipv4')) {
                                                             if (getType(acco[acco_idx].acip['ipv4']) == 'string') {
                                                                 acco[acco_idx].acip['ipv4'] = acco[acco_idx].acip.ipv4.split(' ');
                                                             }
                                                         }
                                                         else if (acco[acco_idx].acip.hasOwnProperty('ipv6')) {
                                                             if (getType(acco[acco_idx].acip['ipv6']) == 'string') {
                                                                 acco[acco_idx].acip['ipv6'] = acco[acco_idx].acip.ipv6.split(' ');
                                                             }
                                                         }
                                                     }
                                                     if (acco[acco_idx].hasOwnProperty('actw')) {
                                                         if (getType(acco[acco_idx].actw) == 'string') {
                                                             temp = acco[acco_idx].actw;
                                                             acco[acco_idx]['actw'] = [];
                                                             acco[acco_idx].actw[0] = temp;
                                                         }
                                                     }
                                                 }
                                             }
                                         }
                                     }
                                 }
                             }
 
                             if (body_Obj[prop][attr].acr == '') {
                                 body_Obj[prop][attr].acr = [];
                             }
 
                             if (body_Obj[prop][attr].acr == '[]') {
                                 body_Obj[prop][attr].acr = [];
                             }
                         }
                     }
                 }
             }
         }
     }
 };
 
 
 var ws_tid = require('shortid').generate();
 wdt.set_wdt(ws_tid, 2, _this.ws_watchdog);
 
 function ws_message_handler(message) {
     var _this = this;
     if(message.type === 'utf8') {
         console.log(message.utf8Data.toString());
 
         var protocol_arr = this.protocol.split('.'); // ['onem2m', 'r2', '0', 'json']
         var bodytype = protocol_arr[protocol_arr.length-1]; // json
 
         make_json_obj(bodytype, message.utf8Data.toString(), function(rsc, result) {
             console.log("result : ", result, "rsc : ", rsc)
             if(rsc == '1') {
                 ws_message_action(_this, bodytype, result);
             }
             else {
                 console.log(1)
                 ws_response(_this, 4000, '', '', '', 'to parsing error', bodytype);
             }
         });
     }
     else if(message.type === 'binary') {
         // Buffer.from('80', 'hex').toString('utf8');
         // Buffer.from(message).toString('hex');
         console.log(message.binaryData.toString('hex'));
 
         //var data = Buffer.from(message);
 
         //Array.prototype.map.call(new Uint8Array(data), x => ('00' + x.toString(16)).slice(-2)).join('').match(/[a-fA-F0-9]{2}/g).reverse().join('');
 
         var protocol_arr = this.protocol.split('.');
         var bodytype = protocol_arr[protocol_arr.length-1];
 
         var str = message.binaryData.toString('hex');
         make_json_obj(bodytype, str, function(rsc, result) {
             if(rsc == '1') {
                 ws_message_action(_this, bodytype, result);
             }
             else {
                 ws_response(_this, 4000, '', '', '', 'to parsing error', bodytype);
             }
         });
 
         // var protocol_arr = this.protocol.split('.');
         // var bodytype = protocol_arr[protocol_arr.length-1];
         //
         // make_json_obj(bodytype, message.utf8Data.toString(), function(rsc, result) {
         //     if(rsc == '1') {
         //         ws_message_action(_this, bodytype, result);
         //     }
         //     else {
         //         ws_response(_this, 4000, '', '', '', 'to parsing error', bodytype);
         //     }
         // });
     }
 }
 
 function ws_message_action(ws_conn, bodytype, jsonObj) {
     if (jsonObj['m2m:rqp'] != null) {
         console.log('m2m:rqp tag of ws message is removed');
 
         var res_body = {};
         res_body['m2m:dbg'] = 'm2m:rqp tag of ws message is removed';
 
         ws_response(ws_conn, 4000, "", usecseid, "", JSON.parse(res_body), bodytype);
     }
     else {
         var op = (jsonObj.op == null) ? '' : jsonObj.op;
         var to = (jsonObj.to == null) ? '' : jsonObj.to;
 
         to = to.replace(usespid + usecseid + '/', '/');
         to = to.replace(usecseid + '/', '/');
 
         if(to.charAt(0) != '/') {
             to = '/' + to;
         }
 
         var fr = (jsonObj.fr == null) ? '' : jsonObj.fr;
         var rqi = (jsonObj.rqi == null) ? '' : jsonObj.rqi;
         var ty = (jsonObj.ty == null) ? '' : jsonObj.ty.toString();
         var pc = (jsonObj.pc == null) ? '' : jsonObj.pc;
 
         if(jsonObj.fc) {
             var query_count = 0;
             for(var fc_idx in jsonObj.fc) {
                 if(jsonObj.fc.hasOwnProperty(fc_idx)) {
                     if(query_count == 0) {
                         to += '?';
                         query_count++;
                     }
                     else {
                         to += '&';
                         query_count++;
                     }
                     to += fc_idx;
                     to += '=';
                     to += jsonObj.fc[fc_idx].toString();
                 }
             }
         }
 
         try {
             //if (to.split('/')[1].split('?')[0] == usecsebase) {
                 ws_binding(op, to, fr, rqi, ty, pc, bodytype, function (res, res_body) {
                     if (res_body == '') {
                         res_body = '{}';
                     }
                     ws_response(ws_conn, res.headers['x-m2m-rsc'], to, usecseid, rqi, JSON.parse(res_body), bodytype);
                 });
             // }
             // else {
             //     ws_response(ws_conn, 4004, fr, usecseid, rqi, 'this is not MN-CSE, csebase do not exist', bodytype);
             // }
         }
         catch (e) {
             console.error(e);
             ws_response(ws_conn, 5000, fr, usecseid, rqi, 'to parsing error', bodytype);
         }
     }
 }
 
 function ws_binding(op, to, fr, rqi, ty, pc, bodytype, callback) {
     var content_type = 'application/json';
 
     switch (op.toString()) {
         case '1':
             op = 'post';
             content_type += ('; ty=' + ty);
             break;
         case '2':
             op = 'get';
             break;
         case '3':
             op = 'put';
             break;
         case '4':
             op = 'delete';
             break;
     }
 
     var reqBodyString = '';
     if( op == 'post' || op == 'put') {
         reqBodyString = JSON.stringify(pc);
     }
 
     var bodyStr = '';
     //TODO
     var options = {
         hostname: usewscbhost,
         port: usecsebasebadaport,
         path: to,
         method: op,
         headers: {
             'X-M2M-RI': rqi,
             'Accept': 'application/json',
             'X-M2M-Origin': fr,
             'Content-Type': content_type,
             'binding': 'W',
             'X-M2M-RVI': uservi
         },
         rejectUnauthorized: false
     };

     if(use_secure == 'disable') {
         var req = http.request(options, function (res) {
             res.setEncoding('utf8');
 
             res.on('data', function (chunk) {
                 bodyStr += chunk;
             });
 
             res.on('end', function () {
                //  console.log("this is pxy_ws res bodyStr : ", res, bodyStr);
                //  console.log("this is pxy_ws res header : ",res.headers)
                // if(bodyStr["m2m:dbg"]){
                //     // res.setHeader('x-m2m-rsc', '9999');
                //     callback(res, bodyStr);
                // }else{
                //     console.log(res.headers)
                //     res.headers['x-m2m-rsc'] = '2001';
                //     // res.setHeader('x-m2m-rsc', '2001');
                //     callback(res, bodyStr);
                // }

                 callback(res, bodyStr);
             });
         });
     }
     else {
         options.ca = fs.readFileSync('ca-crt.pem');
 
         req = https.request(options, function (res) {
             res.setEncoding('utf8');
 
             res.on('data', function (chunk) {
                 bodyStr += chunk;
             });
 
             res.on('end', function () {
                // if(JSON.parse(bodyStr)["m2m:dbg"]){
                //     res.setHeader('x-m2m-rsc', '9999');
                //     callback(res, bodyStr);
                // }else{
                //     res.setHeader('x-m2m-rsc', '2001');
                //     callback(res, bodyStr);
                // }
                 callback(res, bodyStr);
             });
         });
     }
 
     req.on('error', function (e) {
         console.log('[pxyws_binding] problem with request: ' + e.message);
     });
 
     // write data to request body

     req.write(reqBodyString);
     req.end();
 }
 
 function ws_response(ws_conn, rsc, to, fr, rqi, inpc, bodytype) {
     var rsp_message = {};
     rsp_message['m2m:rsp'] = {};
     //rsp_message['m2m:rsp'].rsc = rsc;
     rsp_message['m2m:rsp'].rsc = parseInt(rsc); // convert to int
     //rsp_message['m2m:rsp'].to = to;
     //rsp_message['m2m:rsp'].fr = fr;
 
     rsp_message['m2m:rsp'].rqi = rqi;
     rsp_message['m2m:rsp'].rvi = uservi;
     rsp_message['m2m:rsp'].pc = inpc;
 
     if (bodytype === 'xml') {
         rsp_message['m2m:rsp']['@'] = {
             "xmlns:m2m": "http://www.onem2m.org/xml/protocols",
             "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
         };
 
         for(var prop in rsp_message['m2m:rsp'].pc) {
             if (rsp_message['m2m:rsp'].pc.hasOwnProperty(prop)) {
                 for(var prop2 in rsp_message['m2m:rsp'].pc[prop]) {
                     if (rsp_message['m2m:rsp'].pc[prop].hasOwnProperty(prop2)) {
                         if(prop2 == 'rn') {
                             rsp_message['m2m:rsp'].pc[prop]['@'] = {rn : rsp_message['m2m:rsp'].pc[prop][prop2]};
                             delete rsp_message['m2m:rsp'].pc[prop][prop2];
                         }
                         for(var prop3 in rsp_message['m2m:rsp'].pc[prop][prop2]) {
                             if (rsp_message['m2m:rsp'].pc[prop][prop2].hasOwnProperty(prop3)) {
                                 if(prop3 == 'rn') {
                                     rsp_message['m2m:rsp'].pc[prop][prop2]['@'] = {rn : rsp_message['m2m:rsp'].pc[prop][prop2][prop3]};
                                     delete rsp_message['m2m:rsp'].pc[prop][prop2][prop3];
                                 }
                             }
                         }
                     }
                 }
             }
         }
 
         var bodyString = js2xmlparser.parse("m2m:rsp", rsp_message['m2m:rsp']);
 
         ws_conn.sendUTF(bodyString.toString());
     }
     else if (bodytype === 'cbor') { // 'cbor'
         bodyString = cbor.encode(rsp_message['m2m:rsp']).toString('hex');
         var bytearray = Buffer.from(bodyString, 'hex');
         ws_conn.send(bytearray);
     }
     else { // 'json'
         ws_conn.sendUTF(JSON.stringify(rsp_message['m2m:rsp']));
     }
 }
 
 function http_retrieve_CSEBase(callback) {
     var rqi = require('shortid').generate();
     var resourceid = '/' + usecsebadabase;
     var responseBody = '';
 
     if(use_secure == 'disable') {
         var options = {
             hostname: usewscbhost,
             port: usecsebasebadaport,
             path: resourceid,
             method: 'get',
             headers: {
                 'X-M2M-RI': rqi,
                 'Accept': 'application/json',
                 'X-M2M-Origin': usecseid,
                 'X-M2M-RVI': uservi
             }
         };
 
         console.log("http_retrieve_CSEBase request options : " , options)
         var req = http.request(options, function (res) {
             res.setEncoding('utf8');
             res.on('data', function (chunk) {
                 responseBody += chunk;
             });

             res.on('end', function () {
                callback(res.headers['x-m2m-rsc'], responseBody);
                 
             });
         });
     }
     else {
         options = {
             hostname: usewscbhost,
             port: usecsebasebadaport,
             path: resourceid,
             method: 'get',
             headers: {
                 'X-M2M-RI': rqi,
                 'Accept': 'application/json',
                 'X-M2M-Origin': usecseid,
                 'X-M2M-RVI': uservi
             },
             ca: fs.readFileSync('ca-crt.pem')
         };
 
         req = https.request(options, function (res) {
             res.setEncoding('utf8');
             res.on('data', function (chunk) {
                 responseBody += chunk;
             });
 
             res.on('end', function () {
                //  callback(res.headers['x-m2m-rsc'], responseBody);
                callback('2000', responseBody);
             });
         });
     }
 
     req.on('error', function (e) {
         if(e.message != 'read ECONNRESET') {
             //console.log('[pxyws - http_retrieve_CSEBase] problem with request: ' + e.message);
         }
     });
 
     // write data to request body
     req.write('');
     req.end();
 }
 
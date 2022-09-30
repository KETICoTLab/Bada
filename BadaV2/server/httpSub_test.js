const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const POST = "post";
/**
 * This is for http subscription
 */

const port = 7890;
const host = "192.168.1.145";
let httpServer = http.createServer(app);

httpServer.listen(7890);
//  app.listen(port, host, () => console.log(`Example app listening at https://${host}:${port}`))
console.log(`Example app listening at https://${host}:${port}`);

app.post("*", (req, res) => {
  var fullBody = "";
  req.on("data", function (chunk) {
    fullBody += chunk;
  });

  req.on("end", function () {
    res.status(200).send("post /end test ok");
    var receivedData = JSON.parse(fullBody);
    var rep = receivedData["m2m:sgn"].nev.rep;
    console.log("> receivedData: ", receivedData);
    console.log("> rep: ", rep);
  });
});

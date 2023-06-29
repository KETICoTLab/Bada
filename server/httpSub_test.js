const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync("C:\\cert\\test\\server-key.pem"),
  cert: fs.readFileSync("C:\\cert\\test\\server-crt.pem"),
  // ca: fs.readFileSync("C:\\cert\\ca-crt.pem"),
  rejectUnauthorized: false,
};

const httpsPort = 7890;
// const httpPort = 7890;
const host = "192.168.40.203";
let httpServer = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * This is for http subscription
 */


  

app.get("*", (req, res) => {
  console.log(req.body);
  res.send("HERE")
});

// Post request for geetting input from
// the form
app.post("*", function (req, res) {
  
  console.log(req.body);
  var rep = req.body["m2m:sgn"].nev.rep;
  console.log("> rep: ", rep);
  res.send("POST");

  // res.redirect("/");
});
  

// app.post("*", (req, res) => {
//   var fullBody = "";
//   req.on("data", function (chunk) {
//     fullBody += chunk;
//   });

//   req.on("end", function () {
//     res.status(200).send("post /end test ok");
//     var receivedData = JSON.parse(fullBody);
//     var rep = receivedData["m2m:sgn"].nev.rep;
//     console.log("> receivedData: ", receivedData);
//     console.log("> rep: ", rep);
//   });

//   req.on("error", (e) => {
//     console.log(e)
//   })
// });

// httpServer.listen(7890);
// //  app.listen(port, host, () => console.log(`Example app listening at https://${host}:${port}`))
// console.log(`Example app listening at https://${host}:${port}`);

https.createServer(options, app).listen(httpsPort, () => {
  console.log(`HTTPS: Express listening on port ${httpsPort}`);
})

const runningProcess = require("child_process");
const fs = require("fs");
const util = require("util");
const path = require("path");
const exec = util.promisify(runningProcess.exec);

const cluster = require("cluster");
const numCPUs = require("os").cpus().length / 2;

let config = require("./server/configuration/config.json");

// var worker = [];
// var use_clustering = 1;
// var worker_init_count = 0;

// if(cluster.isMaster){
//   //   // Fork workers.
//   //   cluster.on('death', function (worker) {
//   //     console.log('worker' + worker.pid + ' died --> start again');
//   //     cluster.fork();
//   // });
//   console.log('CPU Count:', numCPUs);
//   for (var i = 0; i < numCPUs; i++) {
//       cluster.fork();
//   }

//     cluster.on('exit', (worker, code, signal) => {
//       console.log(`worker ${worker.process.pid} died`);
//     });
// } else{

let createBadaProcess = () => {
  let appProcess = runningProcess.spawn("node", [path.join(__dirname, "server\\app.js")]);

  appProcess.stdout.on("data", (data) => {
    console.log(`${data}`);
  });

  appProcess.stderr.on("data", (data) => {
    console.log(`${data}`);
    // throw new Error('Bada Error');
  });

  return appProcess;
};

let restartBadaProcess = () => {
  console.log("Restart Process: Bada Process restart");
  console.log(badaProcess.killed, badaProcess.pid);

  badaProcess.kill("SIGINT");
  if (badaProcess.killed) {
    console.log(badaProcess.killed);
    console.log(badaProcess.connected);
    badaProcess = createBadaProcess();
  }
};

let runUiBuildProcess = () => {
  return exec("npm run build", { cwd: __dirname + "/client" })
    .then((message) => {
      if (message.error) {
        console.error(`Build UI System: ${message.error}`);
      } else if (message.stdout) {
        console.log(`Build UI System: ${message.stdout}`);
      } else if (message.stderr) {
        console.log(`Build UI System: ${message.stderr}`);
      } else {
        console.log(`Build UI System: ${message}`);
      }
    })
    .catch((e) => {
      console.log(e);
    });
};

let badaProcess = createBadaProcess();

fs.watchFile(path.join(__dirname, "server\\configuration\\config.json"), (type, filename) => {
  console.log("Restart Process: Configuration file changed");

  fs.readFile(path.join(__dirname, "server\\configuration\\config.json"), "utf8", (err, data) => {
    let currentPort = config.server.port;
    let changedData = JSON.parse(data);

    if (currentPort !== changedData.server.port) {
      console.log("Restart Process: UI Build Start");
      runUiBuildProcess().then(() => {
        console.log("Restart Process: UI Build End");
        restartBadaProcess();
      });
    } else {
      restartBadaProcess();
    }
    config = changedData;
  });
});
// }

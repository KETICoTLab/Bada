const express = require("express");
const morgan = require("morgan");
const app = express();
const port = 3000;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// Logging the requests
app.use(morgan("dev"));
app.use('/', (req, res) => {
  console.log(req.baseUrl, req.body, req.header);
  res.send("HI")
})
// app.post("/bada/*/*", ((req, res) => {

//   res.send("CIN");
// }));

// app.use('/*', (req, res) => {
//   res.send("HERE");
// });

// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//   });
// });

app.listen(port, () => {
  console.log(`server is listening at ${7575}`);
});

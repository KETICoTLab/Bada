const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt-nodejs");
const Database = require("../src/database");
const responseTime = require("../src/response-time");
const Auth = require("../util/auth");
const util = require("util");

const GET = "get";
const POST = "post";
const PUT = "put";
const DELETE = "delete";

function bcryptPassword(password) {
  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);

  return hashedPassword;
}

router.post("/signup", (req, res) => {
  var sql = "";
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      sql = util.format("SELECT * FROM user WHERE email='%s'", req.body.email);
      console.log("post signup 1: ", sql);
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) console.log(err);

        if (result[0]) {
          res.status(500).send("There is the same email address");
        } else {
          var sql = util.format("INSERT INTO user (email, name, department, password) VALUES ('%s', '%s', '%s' ,'%s')", req.body.email, req.body.name, req.body.department, bcryptPassword(req.body.password));
          // Database.mysql.query("INSERT INTO user (email, name, department, password) VALUES (?, ?, ? ,?)", [req.body.email, req.body.name, req.body.department, bcryptPassword(req.body.password)], connection,(err, result) => {
          console.log("post signup 2: ", sql);
          Database.mysql.query(sql, connection, (err, result) => {
            if (err) console.log(err);

            res.status(200).send("success Signup");
            responseTime.store(res.getHeader("X-Response-Time"), POST);
          });
        }
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

router.put("/signup", (req, res) => {
  let query = util.format("UPDATE user SET name = '%s', department = '%s' WHERE email = '%s'", req.body.name, req.body.department, req.body.email);

  if (req.body.new_password) {
    query = util.format("UPDATE user SET name = '%s', department = '%s', password='%s' WHERE email = '%s'", req.body.name, req.body.department, bcryptPassword(req.body.new_password), req.body.email);
  }
  var sql = "";
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      sql = util.format("SELECT * FROM user WHERE email='%s'", req.body.email);
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) console.log(err);

        if (!result[0]) {
          res.status(503).send("There is no account.");
        } else if (!bcrypt.compareSync(req.body.password, result[0].password)) {
          res.status(503).send("Wrong Password.");
        } else {
          Database.mysql.query(query, connection, (err, result) => {
            if (err) console.log(err);

            res.status(200).json("Succes Update");
            responseTime.store(res.getHeader("X-Response-Time"), PUT);
          });
        }
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

router.get("/list", (req, res) => {
  let query = "SELECT email, name, department FROM user";
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(query, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        res.json(result);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

router.get("/", (req, res) => {
  var sql = "";
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      sql = util.format("SELECT * FROM user WHERE email='%s'", req.query.email);
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        let account = {};

        account.email = result[0].email;
        account.name = result[0].name;
        account.department = result[0].department;

        res.json(account);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

router.post("/login", (req, res) => {
  let account = {
    email: "",
    name: "",
    department: "",
    token: "",
  };

  console.log("login api call");
  var sql = "";
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      sql = util.format("SELECT * FROM user WHERE email='%s'", req.body.email);
      console.log(req.body.email);
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        if (!result[0]) {
          res.status(503).send("There is no account.");
        } else if (!bcrypt.compareSync(req.body.password, result[0].password)) {
          res.status(503).send("There is no account.");
        } else {
          jwt.sign(
            {
              email: result[0].email,
              password: result[0].password,
            },
            "badacafe00",
            { algorithm: "HS256" },
            (err, token) => {
              if (err) console.log(err);

              account.token = token;
              account.email = result[0].email;
              account.name = result[0].name;
              account.department = result[0].department;

              res.json(account);
              responseTime.store(res.getHeader("X-Response-Time"), POST);
            }
          );
        }
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

router.get("/count", (req, res) => {
  let loginStatus = Auth.isLoggedIn(req.headers["x-access-token"]);
  let sql = "SELECT COUNT(*) AS user FROM user";

  if (!loginStatus.admin) {
    return res.status(401).send("Unauthorized");
  }
  Database.mysql.connection((code, connection) => {
    if (code === "200") {
      Database.mysql.query(sql, connection, (err, result) => {
        if (err) {
          console.log("Database error");
        }

        if (!result[0]) {
          return res.status(404).send("Not Found");
        }

        res.send(result[0]);
        responseTime.store(res.getHeader("X-Response-Time"), GET);
      });
      connection.release();
    } else {
      console.log("[db.connect] No Connection");
    }
  });
});

module.exports = router;

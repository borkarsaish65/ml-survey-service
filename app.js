require("dotenv").config();

//express
const express = require("express");
let app = express();

// Health check
require("./healthCheck")(app);

//config and routes
require("./config");
require("./config/globalVariable")();

let environmentData = require("./envVariables")();

if (!environmentData.success) {
  console.log(
    "Server could not start . Not all environment variable is provided"
  );
  process.exit();
}

let router = require("./routes");

//required modules
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const cors = require("cors");
var fs = require("fs");
var path = require("path");
var expressValidator = require("express-validator");

//To enable cors
app.use(cors());
app.use(expressValidator());

app.use(fileUpload());
app.use(bodyParser.json({ limit: "50MB" }));
app.use(bodyParser.urlencoded({ limit: "50MB", extended: false }));
app.use(express.static("public"));

fs.existsSync("logs") || fs.mkdirSync("logs");

app.all("*", (req, res, next) => {
  console.log({ "Debugging ML Survey Service": true });
  // console.log("-------Request log starts here------------------");
  // console.log(
  //   "%s %s on %s from ",
  //   req.method,
  //   req.url,
  //   new Date(),
  //   req.headers["user-agent"]
  // );
  // console.log("Request Headers: ", req.headers);
  // console.log("Request Body: ", req.body);
  // console.log("Request Files: ", req.files);
  // console.log("-------Request log ends here------------------");
  next();
});

//add routing
router(app);

//listen to given port
if (process.env.APPLICATION_ENV == "BM") {
  const server = app.listen(process.env.APPLICATION_PORT, () => {
    console.log("Environment: " + process.env.APPLICATION_ENV);
    console.log(
      "Application is running on the port running in BM " +
        process.env.APPLICATION_PORT
    );
  });
  server.keepAliveTimeout = 60000 * 120;
  return server;
} else {
  //listen to given port
  const server = app.listen(process.env.APPLICATION_PORT, () => {
    console.log("Environment: " + process.env.APPLICATION_ENV);
    console.log(
      "Application is running on the port: " + process.env.APPLICATION_PORT
    );
  });
  return server;
}

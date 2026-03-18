const cors = require("cors");
const express = require("express");
const globalErrorHandler = require("./src/middlewares/errorHandler");
const notFoundErrorHandler = require("./src/middlewares/notFound");
const router = require("./src/routes/index");

const app = express();

// parser
app.use(express.json());
app.use(cors());

// parent application route
app.use("/api/sfx-funded", router);

app.get("/", (req, res) => {
  res.send("Welcome to sfx funded ....");
});

// global error handler
app.use(globalErrorHandler);

// not found
app.use(notFoundErrorHandler);

module.exports = app;

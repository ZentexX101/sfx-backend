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
app.use("/api/v1/", router);

app.get("/", (req, res) => {
	res.send("Welcome to Personal Finance Server V1");
});

// global error handler
app.use(globalErrorHandler);

// not found
app.use(notFoundErrorHandler);

module.exports = app;

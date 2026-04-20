const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const globalErrorHandler = require("./src/middlewares/errorHandler");
const notFoundErrorHandler = require("./src/middlewares/notFound");
const router = require("./src/routes/index");
const config = require("./src/config/config");

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://sfx-review.vercel.app",
  "https://sfxfunded.com"
];

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : defaultAllowedOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once("connected", resolve);
      mongoose.connection.once("error", reject);
    });
    return;
  }
  await mongoose.connect(config.database_url);
};

// parser
app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ensure database connection for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

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

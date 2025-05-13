const express = require("express");
const app = express();
const cors = require("cors");
const logger = require("morgan");
const passport = require("passport");
const session = require("express-session");

const mainRouter = require("./routes/mainRouter.js");
const errorHandler = require("./middleware/errorHandler");
const initPassport = require("./config/passportConfig");

initPassport();

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", mainRouter);
app.use(errorHandler);

module.exports = app;

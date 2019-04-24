const winston = require("winston");
const { createLogger, format, transports } = winston;
const fse = require("fs-extra");
const path = require("path");
const dayjs = require("dayjs");

const { combine, errors, json } = format;

/**
 * create files and folder if not exist
 */
const combinedLog = path.join(__dirname, "../logs/combined.log");
const errorLog = path.join(__dirname, "../logs/error.log");
const exceptionsLog = path.join(__dirname, "../logs/exceptions.log");
const successLog = path.join(__dirname, "../logs/success.log");

fse.ensureFile(combinedLog, err => {
  if (err) {
    console.log("err: ", err);
  }
});
fse.ensureFile(errorLog, err => {
  if (err) {
    console.log("err: ", err);
  }
});
fse.ensureFile(exceptionsLog, err => {
  if (err) {
    console.log("err: ", err);
  }
});
fse.ensureFile(successLog, err => {
  if (err) {
    console.log("err: ", err);
  }
});

let dateNow = dayjs().format("DD/MM/YYYY:HH:mm:ss");

const logger = createLogger({
  format: format.json(),
  defaultMeta: {
    service: "auth-service",
    date: dateNow
  },
  transports: [
    new transports.File({ filename: errorLog, level: "error" }),
    new transports.File({ filename: combinedLog })
  ],
  exceptionHandlers: [new transports.File({ filename: exceptionsLog })]
});

const authLogger = createLogger({
  levels: {
    success: 0
  },
  format: format.json(),
  defaultMeta: { service: "auth-service", date: dateNow },
  transports: [new transports.File({ filename: successLog, level: "success" })]
});

logger.exceptions.handle(new transports.File({ filename: exceptionsLog }));

module.exports = {
  logger,
  authLogger
};

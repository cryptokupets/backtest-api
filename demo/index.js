"use strict";

require("dotenv").config();

const express = require("express");
const { BacktestServer } = require("../lib/server");

const app = express();
const port = process.env.PORT;

app.use("/odata", BacktestServer.create());

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

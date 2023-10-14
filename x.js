const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  //   const x = { ...req };
  const headers = req.headers;
  const keys = Object.keys(req);
  if (!req.headers["user-agent"].includes("localhost:50000")) {
    return res.json({});
  }
  res.json({ host: req.headers["user-agent"], keys });
});

app.listen(50000, () => {
  console.log("STARTED");
});

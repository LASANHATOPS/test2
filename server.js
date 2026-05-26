const express = require("express");
const whitelist = require("./whitelist.json");

const app = express();

app.get("/", (req, res) => {
  res.send("A14 API online");
});

app.get("/whitelist", (req, res) => {
  res.json(whitelist);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("A14 API running"));

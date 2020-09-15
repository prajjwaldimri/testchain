const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const PubSub = require("./pubsub");

const app = express();
const blockchain = new Blockchain();
const pubSub = new PubSub({ blockchain });

app.use(bodyParser.json());

app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/api/mine", (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data });

  res.redirect("/api/blocks");
});

const DEFAULT_PORT = 3000;
let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
  console.log(`Listening at PORT:${PORT}`);
});

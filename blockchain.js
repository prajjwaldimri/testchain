const Block = require("./block");
const cryptoHash = require("./crypto-hash");

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain) {
    if (chain.length <= this.chain.length) {
      console.error("Incoming change must be longer");
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error("Incoming change must be valid");
      return;
    }

    console.log("Replacing chain with ", chain);
    this.chain = chain;
  }

  static isValidChain(chain) {
    // Check if the chain starts with genesis block
    for (const key in chain[0]) {
      if (chain[0][key] !== Block.genesis()[key]) {
        return false;
      }
    }

    // Check for lastHash and hash of each block
    for (let i = 1; i < chain.length; i++) {
      const { hash, timestamp, lastHash, data } = chain[i];

      // Last hash of current block should be equal to hash of previous
      if (lastHash !== chain[i - 1].hash) {
        return false;
      }

      // Hash of current block should be valid
      if (cryptoHash(lastHash, data, timestamp) !== hash) {
        return false;
      }
    }

    return true;
  }
}

module.exports = Blockchain;

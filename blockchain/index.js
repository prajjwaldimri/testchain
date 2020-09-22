const Block = require("./block");
const { cryptoHash } = require("../util");

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

  replaceChain(chain, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error("Incoming change must be longer");
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error("Incoming change must be valid");
      return;
    }

    if (onSuccess) onSuccess();
    console.log("Replacing chain with ", chain);
    this.chain = chain;
  }

  static isValidChain(chain) {
    // Check if the chain starts with genesis block
    const genesisBlock = Block.genesis();
    for (const key in chain[0]) {
      if (chain[0][key] !== genesisBlock[key]) {
        return false;
      }
    }

    // Check for lastHash and hash of each block
    for (let i = 1; i < chain.length; i++) {
      const { hash, timestamp, lastHash, nonce, difficulty, data } = chain[i];

      // Last hash of current block should be equal to hash of previous
      if (lastHash !== chain[i - 1].hash) {
        return false;
      }

      // Hash of current block should be valid
      if (cryptoHash(lastHash, data, timestamp, nonce, difficulty) !== hash) {
        return false;
      }

      // Difficulty shouldn't be higher or lower than 1
      if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;
    }

    return true;
  }
}

module.exports = Blockchain;

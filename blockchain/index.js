const Block = require("./block");
const Transaction = require("../wallet/transaction");
const { cryptoHash } = require("../util");
const { REWARD_INPUT, MINING_REWARD } = require("../config");

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

  replaceChain(chain, validateTransactions, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error("Incoming change must be longer");
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error("Incoming change must be valid");
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain })) {
      return;
    }

    if (onSuccess) onSuccess();
    console.log("Replacing chain with ", chain);
    this.chain = chain;
  }

  validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (const transaction of block.data) {
        if ((transaction.input.address = REWARD_INPUT.address)) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address,
          });

          if (transaction.input.amount !== trueBalance) {
            return false;
          }

          // Duplicate transactions
          if (transactionSet.has(transaction)) {
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
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

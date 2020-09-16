const Blockchain = require("./index.js");
const Block = require("./block.js");
const cryptoHash = require("../util/crypto-hash");

describe("Blockchain", () => {
  let blockchain, newChain, originalChain;

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();

    originalChain = blockchain.chain;
  });

  it("contains a `chain` array Instance", () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it("starts with the Genesis block", () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it("adds a new block to the chain", () => {
    const newData = "yomate";
    blockchain.addBlock({ data: newData });
    expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
  });

  describe("isValidChain()", () => {
    describe("when the chain doesn't start with genesis block", () => {
      it("returns false", () => {
        blockchain.chain[0] = { data: "fake-genesis-block" };

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe("when the chain starts with genesis block", () => {
      beforeEach(() => {
        blockchain.addBlock({ data: "bear" });
        blockchain.addBlock({ data: "roots" });
        blockchain.addBlock({ data: "yeet" });
      });

      describe("and a lastHash reference has changed", () => {
        it("returns false", () => {
          blockchain.chain[2].lastHash = "wrong lastHash";

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with an invalid field", () => {
        it("returns false", () => {
          blockchain.chain[2].data = "wrong data";

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and the chain contains a block with jumped difficulty", () => {
        it("returns false", () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const data = [];
          const difficulty = lastBlock.difficulty - 3;

          const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);

          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            data,
            nonce,
            difficulty,
          });

          blockchain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe("and the chain doesn't contain any invalid block", () => {
        it("returns true", () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });

  describe("replaceChain()", () => {
    let errorMock, logMock;

    beforeEach(() => {
      // Stubs
      errorMock = jest.fn();
      logMock = jest.fn();

      global.console.error = errorMock;
      global.console.log = logMock;
    });

    describe("when the chain is not longer", () => {
      beforeEach(() => {
        newChain.chain[0] = { new: "chain" };
        blockchain.replaceChain(newChain.chain);
      });
      it("doesn't replace the chain", () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it("logs an error", () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe("when the chain is longer", () => {
      beforeEach(() => {
        newChain.addBlock({ data: "bear" });
        newChain.addBlock({ data: "roots" });
        newChain.addBlock({ data: "yeet" });
      });

      describe("and the chain is invalid", () => {
        beforeEach(() => {
          newChain.chain[2].hash = "wrong-hash";
          blockchain.replaceChain(newChain.chain);
        });
        it("doesn't replace the chain", () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it("logs an error", () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe("and the chain is valid", () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it("replaces the chain", () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it("logs about chain replacement", () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });
  });
});

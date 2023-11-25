const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Shared Wallet", function () {
  let contract;
  let owner, signer1, signer2;

  beforeEach(async () => {
    [owner, signer1, signer2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory(
      "contracts/SharedWallet.sol:SharedWallet",
      owner
    );
    contract = await Contract.deploy();
    await contract.waitForDeployment();
  });

  it("Should be able to add or remove an owner of shared wallet ", async function () {
    await contract.addOwner(signer1.address);
    await contract.removeOwner(signer1.address);
  });

  it("Should be able to deposit fund", async function () {
    await signer1.sendTransaction({
      to: contract.runner.address,
      value: ethers.parseEther("1"),
    });

    expect(await contract.runner.provider.getBalance(contract.runner.address)).to.be.greaterThan(
      ethers.parseEther("1")
    );
  });

  it("Should be able to withdraw fund", async function () {
    await contract.addOwner(signer1.address);
    await signer1.sendTransaction({
      to: contract.runner.address,
      value: ethers.parseEther("1"),
    });

    contract.withdraw(ethers.parseEther("0.5"));
    expect(await contract.runner.provider.getBalance(contract.runner.address)).to.be.greaterThan(
      ethers.parseEther("1.5")
    );
  });

  it("Should be able to transfer fund to another address", async function () {
    await contract.addOwner(signer1.address);
    await signer1.sendTransaction({
      to: contract.runner.address,
      value: ethers.parseEther("1"),
    });

    contract.connect(signer1).transferTo(signer2.address, ethers.parseEther("0.5"))

    expect(await signer2.provider.getBalance(signer2.address)).to.be.greaterThan(
      ethers.parseEther("1.5")
    );
  });
});

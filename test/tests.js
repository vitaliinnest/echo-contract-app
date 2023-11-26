import chai from "chai";
import hardhat from "hardhat";

const { expect } = chai;
const { ethers } = hardhat;

describe("Shared Wallet", function () {
  let contract;
  let uploader;

  beforeEach(async () => {
    [uploader, uploader2] = await ethers.getSigners();
    const DataStorage = await ethers.getContractFactory(
      "src/contracts-app/contracts/DataStorage.sol:DataStorage",
      uploader
    );
    contract = await DataStorage.deploy();
    await contract.waitForDeployment();
  });

  it("Should add data to storage", async function () {
    const uploadedData = "newData";

    await contract.connect(uploader).addData(uploadedData);

    contract.storedData(0)
      .then(res => expect(res).to.not.be.empty());   
  });

  it("Should clear data from storage", async function () {
    const uploadedData = "newData";
    await contract.connect(uploader).addData(uploadedData);

    await contract.connect(uploader).clearData();

    contract.storedData(0)
      .then(res => expect(res).to.be.empty());   
  });
});
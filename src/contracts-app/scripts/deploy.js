import { Web3 } from "web3";
import * as fs from "fs";
import 'dotenv/config'

const { abi, bytecode } = JSON.parse(fs.readFileSync("../compiled/EchoContract.json"));

async function main() {
  const network = process.env.VITE_ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.VITE_INFURA_API_KEY}`,
    ),
  );
  const signer = web3.eth.accounts.privateKeyToAccount(
    '0x' + process.env.VITE_SIGNER_PRIVATE_KEY,
  );
  web3.eth.accounts.wallet.add(signer);

  const contract = new web3.eth.Contract(abi);
  contract.options.data = bytecode;
  const deployTx = contract.deploy();
  const deployedContract = await deployTx
    .send({
      from: signer.address,
      gas: 5000000,
    })
    .once("transactionHash", (txhash) => {
      console.log(`Mining deployment transaction ...`);
      console.log(`https://${network}.etherscan.io/tx/${txhash}`);
    });
  // The contract is now deployed on chain!
  console.log(`Contract deployed at ${deployedContract.options.address}`);
  console.log(
    `Add VITE_CONTRACT_ADDRESS to the.env file to store the contract address: ${deployedContract.options.address}`,
  );
}

main();
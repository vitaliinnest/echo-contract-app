import { Web3 } from "web3";
import { readFileSync } from "fs";
import 'dotenv/config'

const { abi } = JSON.parse(readFileSync("../compiled/DataStorage.json"));

async function main() {
  const network = process.env.VITE_ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.VITE_INFURA_API_KEY}`,
    ),
  );
  const signer = web3.eth.accounts.privateKeyToAccount(
    "0x" + process.env.VITE_SIGNER_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(signer);
  const contract = new web3.eth.Contract(
    abi,
    process.env.VITE_CONTRACT_ADDRESS,
  );
  const method_abi = contract.methods.addData("it's my life it's now or never").encodeABI();
  const tx = {
    from: signer.address,
    to: contract.options.address,
    data: method_abi,
    value: '0',
    gasPrice: '100000000000',
  };
  const gas_estimate = await web3.eth.estimateGas(tx);
  tx.gas = gas_estimate;
  const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
  const receipt = await web3.eth
    .sendSignedTransaction(signedTx.rawTransaction)
    .once("transactionHash", (txhash) => {
      console.log(`Mining transaction ...`);
      console.log(`https://${network}.etherscan.io/tx/${txhash}`);
    });

  const dataWrittenLogs = receipt.logs.filter(log =>
    log.address.toLowerCase() === process.env.VITE_CONTRACT_ADDRESS.toLowerCase() &&
    log.topics[0] === web3.utils.sha3('DataWritten(string)')
  );

  dataWrittenLogs.forEach(log => {
    const decodedData = web3.eth.abi.decodeLog(
      [
        { type: 'string', name: 'storedResult', indexed: false },
      ],
      log.data,
      log.topics.slice(1)
    );
    console.log('DataWritten Result:', decodedData.storedResult);
  });


  console.log(`Mined in block ${receipt.blockNumber}`);
}

main();
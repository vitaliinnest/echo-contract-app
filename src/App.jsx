import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SharedWallet from './contracts-app/compiled/SharedWallet.json'
import { Web3 } from 'web3';

function App() {
  const network = import.meta.env.VITE_ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    ),
  );
  const signer = web3.eth.accounts.privateKeyToAccount(
    "0x" + import.meta.env.VITE_SIGNER_PRIVATE_KEY
  );

  web3.eth.accounts.wallet.add(signer);
  const sharedWalletContract = new web3.eth.Contract(
    SharedWallet.abi,
    import.meta.env.VITE_CONTRACT_ADDRESS,
  );

  const callSmh = async () => {
    try {
      const addressToAdd = "0xd9E1F2dA88C8bE17DDa595111E8f134Ba1489B91";
      const gas = await sharedWalletContract.methods.addOwner(addressToAdd).estimateGas();
      const post = await sharedWalletContract.methods.addOwner(addressToAdd).send({
        from: signer.address,
        gas,
      });
    
      console.log('Transaction successful:', post);
    } catch (error) {
      console.log(error);
      console.error('Transaction failed:', error.message);
    
      // Additional details about the error object
      if (error.reason) {
        console.log('Error Reason:', error.reason);
      }
    
      if (error.transactionHash) {
        console.log('Transaction Hash:', error.transactionHash);
      }
    }
    
    console.log(post);
  }

  return (
    <>
      <button onClick={callSmh}>click</button>
    </>
  )
}

export default App

  // const method_abi = contract.methods.echo("Hello, world!").encodeABI();
  // const tx = {
  //   from: signer.address,
  //   to: contract.options.address,
  //   data: method_abi,
  //   value: '0',
  //   gasPrice: '100000000000',
  // };
  // const gas_estimate = await web3.eth.estimateGas(tx);
  // tx.gas = gas_estimate;
  // const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
  // console.log("Raw transaction data: " + signedTx.rawTransaction);
  // const receipt = await web3.eth
  //   .sendSignedTransaction(signedTx.rawTransaction)
  //   .once("transactionHash", (txhash) => {
  //     console.log(`Mining transaction ...`);
  //     console.log(`https://${network}.etherscan.io/tx/${txhash}`);
  //   });


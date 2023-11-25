import React, { useState } from 'react';
import EchoContract from './contracts-app/compiled/EchoContract.json';
import { Web3 } from 'web3';

const { abi } = EchoContract;
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
const contract = new web3.eth.Contract(
  abi,
  import.meta.env.VITE_CONTRACT_ADDRESS,
);

// todo: field for private key is needed!

function App() {
  const [msg, setMsg] = useState('');
  const [logs, setLogs] = useState([]);

  async function sendToTransaction() {
    const method_abi = contract.methods.echo(msg).encodeABI();
    const tx = {
      from: signer.address,
      to: contract.options.address,
      data: method_abi,
      value: '0',
      gasPrice: '100000000000',
    };

    try {
      setLogs(['In progress...']);
      const gas_estimate = await web3.eth.estimateGas(tx);
      tx.gas = gas_estimate;
      const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
      // Capture logs in an array
      const transactionLogs = [];

      const receipt = await web3.eth
        .sendSignedTransaction(signedTx.rawTransaction)
        .on("transactionHash", (txhash) => {
          transactionLogs.push(`https://${network}.etherscan.io/tx/${txhash}`);
        })
        .on("receipt", (receipt) => {
          transactionLogs.push(`Mined in block ${receipt.blockNumber}`);
        });

      // Update the logs state
      setLogs(transactionLogs);
    } catch (error) {
      console.error('Error:', error.message);
      setLogs((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
    }
  }

  return (
    <div
      className="App"
      style={{
        marginLeft: '50px',
      }}
    >
      <input
        style={{
          marginRight: '50px',
        }}
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Enter a message"
      />
      <button onClick={sendToTransaction}>Send To Transaction</button>

      {/* Render logs */}
      <div>
        {logs.map((log, index) => (
          <div key={index}>
            {typeof log === 'string' && log.startsWith('https://') ? (
              <a href={log} target="_blank" rel="noopener noreferrer">
                {log}
              </a>
            ) : (
              log
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

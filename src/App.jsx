import React, { useState } from "react";
import EchoContract from "./contracts-app/compiled/EchoContract.json";
import { Web3 } from "web3";

const { abi } = EchoContract;
const network = import.meta.env.VITE_ETHEREUM_NETWORK;
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${network}.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
  )
);

function App() {
  const [privateKey, setPrivateKey] = useState("");
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState([]);

  const handlePrivateKeyChange = (e) => {
    setPrivateKey(e.target.value);
  };

  async function sendTransaction() {
    if (!privateKey) {
      setLogs(["Please enter a private key."]);
      return;
    }

    try {
      const signer = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
      web3.eth.accounts.wallet.add(signer);

      const contract = new web3.eth.Contract(
        abi,
        import.meta.env.VITE_CONTRACT_ADDRESS
      );

      const method_abi = contract.methods.echo(msg).encodeABI();
      const tx = {
        from: signer.address,
        to: contract.options.address,
        data: method_abi,
        value: "0",
        gasPrice: "100000000000",
      };

      setLogs(["In progress..."]);
      const gas_estimate = await web3.eth.estimateGas(tx);
      tx.gas = gas_estimate;
      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        signer.privateKey
      );

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
      console.error("Error:", error.message);
      setLogs((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
    }
  }

  return (
    <div
      className="App"
      style={{
        marginLeft: "50px",
      }}
    >
      <input
        type="password"
        value={privateKey}
        onChange={handlePrivateKeyChange}
        placeholder="Enter Private Key"
      />
      <br />
      <input
        style={{
          marginRight: "50px",
        }}
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Enter a message"
      />
      <button disabled={!privateKey.length} onClick={sendTransaction}>
        Send Transaction
      </button>
      <div
        style={{
          marginTop: "20px",
        }}
      >
        {logs.map((log, index) => (
          <div key={index}>
            {typeof log === "string" && log.startsWith("https://") ? (
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

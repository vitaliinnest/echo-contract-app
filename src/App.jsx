import React, { useState } from "react";
import DataStorage from "./contracts-app/compiled/DataStorage.json";
import { Web3 } from "web3";

const { abi } = DataStorage;
const network = import.meta.env.VITE_ETHEREUM_NETWORK;
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${network}.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`
  )
);

function App() {
  const [privateKey, setPrivateKey] = useState(import.meta.env.VITE_SIGNER_PRIVATE_KEY);
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState([]);
  const [sending, setSending] = useState(false);
  const [storedResult, setStoredResult] = useState([]);

  const handlePrivateKeyChange = (e) => {
    setPrivateKey(e.target.value);
  };

  async function sendTransaction() {
    if (!privateKey) {
      setLogs(["Please enter a private key."]);
      return;
    }

    try {
      setSending(true);
      setLogs(["In progress..."]);

      const signer = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
      web3.eth.accounts.wallet.add(signer);

      const contract = new web3.eth.Contract(
        abi,
        import.meta.env.VITE_CONTRACT_ADDRESS
      );

      const method_abi = contract.methods.addData(msg).encodeABI();
      const tx = {
        from: signer.address,
        to: contract.options.address,
        data: method_abi,
        value: "0",
        gasPrice: "100000000000",
      };

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

      const dataWrittenLogs = receipt.logs.filter(
        (log) =>
          log.address.toLowerCase() ===
            import.meta.env.VITE_CONTRACT_ADDRESS.toLowerCase() &&
          log.topics[0] === web3.utils.sha3("DataWritten(string)")
      );

      const log = dataWrittenLogs[0];
      const decodedData = web3.eth.abi.decodeLog(
        [{ type: "string", name: "storedResult", indexed: false }],
        log.data,
        log.topics.slice(1)
      );
      const splittedStoredResult = decodedData.storedResult.split(', ');
      setStoredResult(splittedStoredResult);

      setLogs(transactionLogs);
    } catch (error) {
      console.error("Error:", error.message);
      setLogs((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
    } finally {
      setSending(false);
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
      <button
        disabled={!privateKey?.length || sending}
        onClick={sendTransaction}
      >
        Store Data Into Smart Contract
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
      {!!storedResult?.length && (<div
        style={{
          marginTop: "20px",
        }}
      >
        <div style={{ fontWeight: 'bold' }}>Stored Results:</div>
        {storedResult.map((storedStr, index) => (
          <div key={index} style={{ color: index === storedResult.length-1 ? 'blue' : 'white' }}>
            {index+1}. {storedStr}
          </div>
        ))}
      </div>)}
    </div>
  );
}

export default App;

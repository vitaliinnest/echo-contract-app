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
  const [privateKey, setPrivateKey] = useState(
    import.meta.env.VITE_SIGNER_PRIVATE_KEY ?? ''
  );
  const [msg, setMsg] = useState("");
  const [logs, setLogs] = useState([]);
  const [sending, setSending] = useState(false);
  const [storedResult, setStoredResult] = useState([]);
  const [dataWasDeleted, setDataWasDeleted] = useState(false);

  const handlePrivateKeyChange = (e) => {
    setPrivateKey(e.target.value);
  };

  async function sendTransactionAsync(processTransaction) {
    if (!privateKey) {
      setLogs(["Please enter a private key."]);
      return;
    }

    try {
      setSending(true);
      setLogs(["In progress..."]);

      await processTransaction();
    } catch (error) {
      console.error("Error:", error.message);
      setLogs((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
    } finally {
      setSending(false);
    }
  }

  async function storeData() {
    await sendTransactionAsync(async () => {
      const { contract, signer } = createContractAndSigner();

      const method_abi = contract.methods.addData(msg).encodeABI();
      const signedTx = await signTransactionAsync(signer, contract, method_abi);
      const transactionLogs = [];
      const receipt = await sendSignedTransactionAsync(
        signedTx,
        transactionLogs
      );

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
      const splittedStoredResult = decodedData.storedResult.split(", ");
      setStoredResult(splittedStoredResult);
      setDataWasDeleted(false);
      setLogs(transactionLogs);
    });
  }

  async function clearData() {
    await sendTransactionAsync(async () => {
      const { contract, signer } = createContractAndSigner();

      const method_abi = contract.methods.clearData().encodeABI();
      const signedTx = await signTransactionAsync(signer, contract, method_abi);
      const transactionLogs = [];
      await sendSignedTransactionAsync(signedTx, transactionLogs);

      setLogs(transactionLogs);
      setDataWasDeleted(true);
      setStoredResult([]);
    });
  }

  async function signTransactionAsync(signer, contract, method_abi) {
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
    return signedTx;
  }

  function createContractAndSigner() {
    const signer = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
    web3.eth.accounts.wallet.add(signer);

    const contract = new web3.eth.Contract(
      abi,
      import.meta.env.VITE_CONTRACT_ADDRESS
    );
    return { contract, signer };
  }

  async function sendSignedTransactionAsync(signedTx, transactionLogs) {
    return await web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on("transactionHash", (txhash) => {
        transactionLogs.push(`https://${network}.etherscan.io/tx/${txhash}`);
      })
      .on("receipt", (receipt) => {
        transactionLogs.push(`Mined in block ${receipt.blockNumber}`);
      });
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
        style={{ background: "blue" }}
        disabled={!privateKey?.length || sending}
        onClick={storeData}
      >
        Store Data Into Smart Contract
      </button>
      <button
        disabled={!privateKey?.length || sending}
        style={{ marginLeft: "20px", background: "red" }}
        onClick={clearData}
      >
        Clear Data
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
      {dataWasDeleted && (
        <div
          style={{ marginTop: "20px", fontWeight: "bold", color: "#00e80c" }}
        >
          Storage Cleaned!
        </div>
      )}
      {!!storedResult?.length && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <div style={{ fontWeight: "bold" }}>Stored Results:</div>
          {storedResult.map((storedStr, index) => (
            <div
              key={index}
              style={
                index === storedResult.length - 1
                  ? {
                      color: "blue",
                      fontWeight: "bold"
                    }
                  : undefined
              }
            >
              {index + 1}. {storedStr}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

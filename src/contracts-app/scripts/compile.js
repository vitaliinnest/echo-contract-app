import { promises as fs } from "fs";
import solc from "solc";

async function main() {
  const sourceCode = await fs.readFile("../contracts/DataStorage.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "DataStorage");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("../compiled/DataStorage.json", artifact);
  console.log('Compiled!');
}

function compile(sourceCode, contractName) {
  const input = {
    language: "Solidity",
    sources: { main: { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
  const output = solc.compile(JSON.stringify(input));
  const artifact = JSON.parse(output).contracts.main[contractName];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

main()
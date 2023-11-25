import { promises as fs } from "fs";
import solc from "solc";

async function main() {
  const sourceCode = await fs.readFile("../contracts/SharedWallet.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "SharedWallet");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("../compiled/SharedWallet.json", artifact);
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
pragma solidity >=0.5.8;

contract SharedWallet {
    event Echo(string message);

    function echo(string calldata message) external {
        emit Echo(message);
    }
}
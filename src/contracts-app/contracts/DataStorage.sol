// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract DataStorage {
    string[] public storedData;

    event DataWritten(string storedResult);

    function addData(string memory newData) public {
        storedData.push(newData);
        string memory storedResult = string(abi.encodePacked(stringJoin(storedData, ", ")));
        emit DataWritten(storedResult);
    }

    function clearData() public {
        delete storedData;
    }

    function stringJoin(string[] memory values, string memory delimiter) internal pure returns (string memory) {
        if (values.length == 0) {
            return "";
        }
        string memory result = values[0];
        for (uint256 i = 1; i < values.length; i++) {
            result = string(abi.encodePacked(result, delimiter, values[i]));
        }
        return result;
    }
}

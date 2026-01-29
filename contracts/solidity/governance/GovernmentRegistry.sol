// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernmentRegistry
 * @notice Registro de gobiernos autorizados
 */
contract GovernmentRegistry is Ownable {

    struct Government {
        string name;
        string jurisdiction;
        address wallet;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Government) public governments;
    address[] public governmentList;

    event GovernmentRegistered(address indexed govAddress, string name, string jurisdiction);
    event GovernmentDeactivated(address indexed govAddress);
    event GovernmentActivated(address indexed govAddress);

    constructor(address _admin) Ownable(_admin) {}

    function registerGovernment(
        address _govAddress,
        string calldata _name,
        string calldata _jurisdiction
    ) external onlyOwner {
        require(_govAddress != address(0), "Invalid address");
        require(governments[_govAddress].wallet == address(0), "Already registered");

        governments[_govAddress] = Government({
            name: _name,
            jurisdiction: _jurisdiction,
            wallet: _govAddress,
            isActive: true,
            registeredAt: block.timestamp
        });

        governmentList.push(_govAddress);

        emit GovernmentRegistered(_govAddress, _name, _jurisdiction);
    }

    function deactivateGovernment(address _govAddress) external onlyOwner {
        require(governments[_govAddress].isActive, "Already inactive");
        governments[_govAddress].isActive = false;
        emit GovernmentDeactivated(_govAddress);
    }

    function activateGovernment(address _govAddress) external onlyOwner {
        require(!governments[_govAddress].isActive, "Already active");
        governments[_govAddress].isActive = true;
        emit GovernmentActivated(_govAddress);
    }

    function isActiveGovernment(address _address) external view returns (bool) {
        return governments[_address].isActive;
    }

    function getAllGovernments() external view returns (address[] memory) {
        return governmentList;
    }

    function getGovernmentInfo(address _govAddress)
        external
        view
        returns (
            string memory name,
            string memory jurisdiction,
            bool isActive,
            uint256 registeredAt
        )
    {
        Government memory gov = governments[_govAddress];
        return (gov.name, gov.jurisdiction, gov.isActive, gov.registeredAt);
    }
}

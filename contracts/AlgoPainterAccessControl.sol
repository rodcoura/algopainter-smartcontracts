// SPDX-License-Identifier: GPL-v3
pragma solidity >=0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract AlgoPainterAccessControl is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier onlyRole(bytes32 role) {
        require(
            hasRole(role, _msgSender()),
            "AlgoPainterAccessControl: INVALID_ROLE"
        );
        _;
    }
}

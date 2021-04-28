// SPDX-License-Identifier: GPL-v3
pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AlgoPainterTimeLock {
    // custom data structure to hold locked funds and time
    struct PaymentInfo {
        uint256 amount;
        uint256 releaseTime;
        bool isRequested;
    }

    mapping(address => PaymentInfo[]) private accounts;
    mapping(address => uint256) private remainingAmount;
    mapping(address => uint256) private lastAllowedReleaseTime;

    event NewScheduledPayment(
        address indexed beneficiary,
        uint256 indexed releaseTime,
        uint256 amount
    );

    event NewPayment(
        address indexed beneficiary,
        uint256 amount,
        uint256 remainingAmount
    );

    IERC20 public token;

    address owner;

    constructor(IERC20 _token) {
        owner = msg.sender;
        token = _token;
    }

    function getNow() public view returns (uint256) {
        return block.timestamp;
    }

    function addSeconds(uint256 _ref, uint256 _amount)
        public
        view
        returns (uint256)
    {
        uint256 result = _ref;
        for (uint256 i = 0; i < _amount; i++) {
            result = result + 1 seconds;
        }

        return result;
    }

    function addDays(uint256 _ref, uint256 _amount)
        public
        view
        returns (uint256)
    {
        uint256 result = _ref;
        for (uint256 i = 0; i < _amount; i++) {
            result = result + 1 days;
        }

        return result;
    }

    function schedulePayment(
        address _beneficiary,
        uint256 _releaseTime,
        uint256 _amount
    ) public {
        require(msg.sender == owner, "INVALID SENDER");
        require(_releaseTime > lastAllowedReleaseTime[_beneficiary]);

        accounts[_beneficiary].push(PaymentInfo(_amount, _releaseTime, false));
        lastAllowedReleaseTime[_beneficiary] = _releaseTime;

        remainingAmount[_beneficiary] += _amount;

        emit NewScheduledPayment(_beneficiary, _releaseTime, _amount);
    }

    function requestPayment() public {
        uint256 amount = 0;
        PaymentInfo[] storage info = accounts[msg.sender];

        for (uint256 i = 0; i < info.length; i++) {
            if (getNow() > info[i].releaseTime && !info[i].isRequested) {
                amount += info[i].amount;
                info[i].isRequested = true;
            }
        }

        remainingAmount[msg.sender] -= amount;
        token.transfer(msg.sender, amount);

        emit NewPayment(msg.sender, amount, remainingAmount[msg.sender]);
    }

    function getRemainingAmount(address _beneficiary)
        public
        view
        returns (uint256)
    {
        return remainingAmount[_beneficiary];
    }

    function getPaymentInfoLength(address _beneficiary, uint256 _index)
        public
        view
        returns (uint256)
    {
        return accounts[_beneficiary].length;
    }

    function getPaymentInfo(address _beneficiary, uint256 _index)
        public
        view
        returns (
            uint256 releaseTime,
            uint256 amount,
            bool isRequested
        )
    {
        PaymentInfo[] storage info = accounts[_beneficiary];

        if (_index < info.length) {
            releaseTime = info[_index].releaseTime;
            amount = info[_index].amount;
            isRequested = info[_index].isRequested;
        } else {
            releaseTime = 0;
            amount = 0;
            isRequested = false;
        }
    }
}

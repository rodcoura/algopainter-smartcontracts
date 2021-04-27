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

    mapping(address => PaymentInfo[]) public accounts;
    mapping(address => uint256) public remainingAmount;
    mapping(address => uint256) public lastAllowedReleaseTime;
    mapping(address => uint256) public nextPayments;

    event NewScheduledPayment(
        address indexed beneficiary,
        uint256 indexed releaseTime,
        uint256 amount
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
        uint256 nextPayment = nextPayments[msg.sender];
        PaymentInfo[] storage info = accounts[msg.sender];

        for (uint256 i = nextPayment; i < info.length; i++) {
            if (getNow() > info[i].releaseTime && !info[i].isRequested) {
                amount += info[i].amount;
                info[i].isRequested = true;
                nextPayment = i;
            }
        }

        remainingAmount[msg.sender] -= amount;
        token.transfer(msg.sender, amount);
    }

    function getRemainingAmount(address _beneficiary)
        public
        view
        returns (uint256)
    {
        return remainingAmount[_beneficiary];
    }

    function getNextPayment(address _beneficiary)
        public
        view
        returns (uint256 releaseTime, uint256 amount)
    {
        uint256 nextPayment = nextPayments[msg.sender];
        PaymentInfo[] storage info = accounts[msg.sender];

        releaseTime = info[nextPayment].releaseTime;
        amount = info[nextPayment].amount;
    }
}

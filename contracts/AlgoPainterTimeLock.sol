// SPDX-License-Identifier: GPL-v3
pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AlgoPainterAccessControl.sol";

contract AlgoPainterTimeLock is AlgoPainterAccessControl {
    // custom data structure to hold locked funds and time
    struct PaymentInfo {
        uint256 amount;
        uint256 releaseTime;
        bool isRequested;
    }

    mapping(address => PaymentInfo[]) private accounts;
    mapping(address => uint256) private remainingAmount;
    mapping(address => uint256) private lastAllowedReleaseTime;
    uint256 private emergencyWithdrawLimit;

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

    constructor(IERC20 _token, uint256 _emergencyWithdrawLimit) {
        token = _token;
        emergencyWithdrawLimit = _emergencyWithdrawLimit;
    }

    function getNow() public view returns (uint256) {
        return block.timestamp;
    }

    function addSeconds(uint256 _ref, uint256 _amount)
        public
        pure
        returns (uint256)
    {
        uint256 result = _ref;
        for (uint256 i = 0; i < _amount; i++) {
            result = result + 1 seconds;
        }

        return result;
    }

    function getDayInterval(uint256 _amount) public pure returns (uint256) {
        return (0 + 1 days) * _amount;
    }

    function getSecondInterval(uint256 _amount) public pure returns (uint256) {
        return (0 + 1 seconds) * _amount;
    }

    function schedulePayments(
        uint256 _startDate,
        uint256 _interval,
        uint256 _cliffPeriods,
        uint256 _vestingPeriods,
        address _beneficiary,
        uint256 _amountByPeriod
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 schedule = _startDate;

        for (uint256 i = 0; i < _vestingPeriods; i++) {
            if (_cliffPeriods > 0 && i + 1 == _cliffPeriods) {
                schedulePayment(
                    _beneficiary,
                    schedule,
                    _amountByPeriod * _cliffPeriods
                );
            } else if (
                _cliffPeriods == 0 ||
                (_cliffPeriods > 0 && i + 1 > _cliffPeriods)
            ) {
                schedulePayment(_beneficiary, schedule, _amountByPeriod);
            }
            schedule += _interval;
        }
    }

    function schedulePayment(
        address _beneficiary,
        uint256 _releaseTime,
        uint256 _amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _releaseTime > lastAllowedReleaseTime[_beneficiary],
            "Invalid release time"
        );

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

    function getEmergencyWithdrawLimit() public view returns (uint256) {
        return emergencyWithdrawLimit;
    }

    function emergencyWithdraw(uint256 _amount)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(getNow() > emergencyWithdrawLimit, "IT IS NOT ALLOWED");
        token.transfer(msg.sender, _amount);
    }

    function getRemainingAmount(address _beneficiary)
        public
        view
        returns (uint256)
    {
        return remainingAmount[_beneficiary];
    }

    function getPaymentInfoLength(address _beneficiary)
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
        }
    }
}

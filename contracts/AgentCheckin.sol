// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentCheckin
/// @notice Daily check-in for Binance Agent ID holders.
/// @dev Any wallet holding an Agent ID (SPACE ID Agent ID, ERC-721,
///      non-transferable, on BNB Chain) may check in once per UTC day.
///      The contract tracks each holder's current consecutive-day streak
///      and total check-ins, and exposes an on-chain leaderboard source
///      (the list of all check-in addresses). No token, no payments,
///      no owner privileges, no backdoors. Check-ins cost gas only.
interface IAgentID {
    /// @notice Returns how many Agent ID tokens `owner` holds.
    function balanceOf(address owner) external view returns (uint256);
}

contract AgentCheckin {
    /// @notice The Agent ID contract (SPACE ID Agent ID, BSC).
    IAgentID public immutable agentId;

    /// @notice Check-in record for one Agent ID holder.
    /// @dev Packed into a single 256-bit storage slot (3 x uint64).
    struct Streak {
        uint64 lastDay; // UTC day number (block.timestamp / 1 days) of last check-in
        uint64 streak; // current consecutive-day streak
        uint64 total; // total check-ins ever
    }

    /// @notice Check-in record per holder address.
    mapping(address => Streak) public checkins;

    /// @notice Every address that has ever checked in, in first-seen order.
    /// @dev Used by the frontend to build the leaderboard on-chain.
    address[] public checkers;

    /// @notice True once an address has checked in at least once.
    mapping(address => bool) public hasCheckedIn;

    /// @notice Emitted on every successful check-in.
    /// @param agent The checking-in holder.
    /// @param day The UTC day number of the check-in.
    /// @param streak The holder's streak after this check-in.
    /// @param total The holder's total check-ins after this check-in.
    event CheckedIn(address indexed agent, uint256 indexed day, uint256 streak, uint256 total);

    /// @param _agentId Address of the Agent ID contract on BNB Chain.
    constructor(address _agentId) {
        require(_agentId != address(0), "zero Agent ID address");
        agentId = IAgentID(_agentId);
    }

    /// @notice Check in for today. Caller must hold an Agent ID.
    /// @dev One check-in per holder per UTC day. A check-in on the day
    ///      immediately after the last one extends the streak; any gap
    ///      (or a first check-in) starts a fresh streak of 1.
    function checkIn() external {
        require(agentId.balanceOf(msg.sender) > 0, "no Agent ID");
        uint64 day = uint64(block.timestamp / 1 days);
        Streak storage s = checkins[msg.sender];
        require(s.lastDay != day, "already checked in today");

        if (s.lastDay + 1 == day) {
            s.streak += 1;
        } else {
            s.streak = 1;
        }
        s.lastDay = day;
        s.total += 1;

        if (!hasCheckedIn[msg.sender]) {
            hasCheckedIn[msg.sender] = true;
            checkers.push(msg.sender);
        }

        emit CheckedIn(msg.sender, day, s.streak, s.total);
    }

    /// @notice Returns true when `account` holds at least one Agent ID.
    function hasAgentId(address account) external view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }

    /// @notice The current UTC day number, matching the day used by checkIn().
    function currentDay() external view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    /// @notice How many distinct addresses have ever checked in.
    function checkerCount() external view returns (uint256) {
        return checkers.length;
    }
}

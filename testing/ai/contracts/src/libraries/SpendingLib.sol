// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

struct SpendingRecord {
    uint256 dailySpent;
    uint256 weeklySpent;
    uint256 lastDailyReset;
    uint256 lastWeeklyReset;
}

library SpendingLib {
    function checkAndUpdateSpending(
        SpendingRecord storage record,
        uint256 amount,
        uint256 dailyLimit,
        uint256 weeklyLimit
    ) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / 1 weeks;

        if (currentDay > record.lastDailyReset) {
            record.dailySpent = 0;
            record.lastDailyReset = currentDay;
        }

        if (currentWeek > record.lastWeeklyReset) {
            record.weeklySpent = 0;
            record.lastWeeklyReset = currentWeek;
        }

        require(record.dailySpent + amount <= dailyLimit, "SpendingLib: daily limit exceeded");
        require(record.weeklySpent + amount <= weeklyLimit, "SpendingLib: weekly limit exceeded");

        record.dailySpent += amount;
        record.weeklySpent += amount;
    }
}

#include "../include/strategy_engine.hpp"
#include <algorithm>

static const DriverState* findDriver(const RaceState& raceState, const std::string& code) {
    for (const auto& driver : raceState.drivers) {
        if (driver.code == code) return &driver;
    }
    return nullptr;
}

static double estimateDegPenaltyPerLap(const DriverState& driver) {
    if (driver.compound == "SOFT") return 0.18;
    if (driver.compound == "MEDIUM") return 0.11;
    return 0.08;
}

static double estimateNewTyreBaseGain(const std::string& currentCompound) {
    if (currentCompound == "SOFT") return 0.85;
    if (currentCompound == "MEDIUM") return 0.65;
    return 0.45;
}

static int estimateRejoinPosition(
    const RaceState& raceState,
    const DriverState& target,
    double pitLoss
) {
    int carsAheadAfterPit = 0;

    for (const auto& other : raceState.drivers) {
        if (other.code == target.code) continue;

        double gapToOther = other.gapToLeader - target.gapToLeader;

        if (gapToOther < pitLoss) {
            carsAheadAfterPit++;
        }
    }

    return carsAheadAfterPit + 1;
}

std::vector<StrategyOption> simulatePitStrategy(
    const RaceState& raceState,
    const std::string& targetDriverCode,
    const std::vector<int>& candidatePitLaps
) {
    std::vector<StrategyOption> results;

    const DriverState* target = findDriver(raceState, targetDriverCode);
    if (!target) return results;

    double degPenalty = estimateDegPenaltyPerLap(*target);
    double newTyreGain = estimateNewTyreBaseGain(target->compound);

    for (int pitLap : candidatePitLaps) {
        if (pitLap <= raceState.currentLap || pitLap > raceState.totalLaps) continue;

        int lapsUntilPit = pitLap - raceState.currentLap;
        int lapsAfterPit = raceState.totalLaps - pitLap;

        double wearCostBeforePit = lapsUntilPit * degPenalty;
        double freshTyreBenefitAfterPit = lapsAfterPit * newTyreGain * 0.22;

        double strategyDelta = wearCostBeforePit - freshTyreBenefitAfterPit;

        int rejoinPosition = estimateRejoinPosition(raceState, *target, raceState.pitLoss);

        std::string risk;
        if (rejoinPosition <= 2 && strategyDelta < 0.5) risk = "LOW";
        else if (rejoinPosition <= 4 && strategyDelta < 1.5) risk = "MEDIUM";
        else risk = "HIGH";

        double score = 100.0;
        score -= std::max(0.0, strategyDelta) * 18.0;
        score += std::max(0.0, -strategyDelta) * 12.0;
        score -= (rejoinPosition - 1) * 4.5;
        if (risk == "MEDIUM") score -= 6.0;
        if (risk == "HIGH") score -= 12.0;

        double projectedRaceTime =
            target->lastLapTime * (raceState.totalLaps - raceState.currentLap) + strategyDelta;

        results.push_back({
            pitLap,
            rejoinPosition,
            projectedRaceTime,
            strategyDelta,
            risk,
            score
        });
    }

    std::sort(results.begin(), results.end(), [](const StrategyOption& a, const StrategyOption& b) {
        return a.score > b.score;
    });

    return results;
}

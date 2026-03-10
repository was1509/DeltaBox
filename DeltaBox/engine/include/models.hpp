#pragma once

#include <string>
#include <vector>

struct DriverState {
    std::string code;
    std::string team;
    int position;
    double gapToLeader;
    double lastLapTime;
    std::string compound;
    int tyreAge;
};

struct RaceState {
    int currentLap;
    int totalLaps;
    double pitLoss;
    std::vector<DriverState> drivers;
};

struct StrategyOption {
    int pitLap;
    int predictedRejoinPosition;
    double projectedRaceTime;
    double projectedDelta;
    std::string risk;
    double score;
};

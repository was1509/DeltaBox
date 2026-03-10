#pragma once

#include "models.hpp"
#include <string>
#include <vector>

std::vector<StrategyOption> simulatePitStrategy(
    const RaceState& raceState,
    const std::string& targetDriverCode,
    const std::vector<int>& candidatePitLaps
);

#include "../include/strategy_engine.hpp"
#include <iostream>
#include <vector>

int main() {
    RaceState raceState{
        36,
        57,
        22.4,
        {
            {"LEC", "Ferrari", 1, 0.0, 92.481, "MEDIUM", 18},
            {"VER", "Red Bull", 2, 1.842, 92.777, "HARD", 10},
            {"NOR", "McLaren", 3, 3.271, 92.905, "HARD", 11},
            {"HAM", "Mercedes", 4, 6.918, 93.190, "MEDIUM", 20},
            {"SAI", "Ferrari", 5, 8.004, 92.662, "SOFT", 7}
        }
    };

    std::vector<int> candidatePitLaps = {37, 38, 39, 40};

    auto results = simulatePitStrategy(raceState, "LEC", candidatePitLaps);

    std::cout << "DeltaBox Strategy Output\n";
    std::cout << "========================\n";

    for (const auto& option : results) {
        std::cout
            << "Pit Lap: " << option.pitLap
            << " | Rejoin P: " << option.predictedRejoinPosition
            << " | Delta: " << option.projectedDelta
            << " | Risk: " << option.risk
            << " | Score: " << option.score
            << "\n";
    }

    return 0;
}

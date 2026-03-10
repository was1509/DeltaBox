#include "../include/strategy_engine.hpp"
#include <nlohmann/json.hpp>

#include <fstream>
#include <iostream>
#include <string>
#include <vector>

using json = nlohmann::json;

static RaceState parseRaceState(const json& input) {
    RaceState raceState;
    raceState.currentLap = input.at("currentLap").get<int>();
    raceState.totalLaps = input.at("totalLaps").get<int>();
    raceState.pitLoss = input.at("pitLoss").get<double>();

    for (const auto& driverJson : input.at("drivers")) {
        raceState.drivers.push_back({
            driverJson.at("code").get<std::string>(),
            driverJson.at("team").get<std::string>(),
            driverJson.at("position").get<int>(),
            driverJson.at("gapToLeader").get<double>(),
            driverJson.at("lastLapTime").get<double>(),
            driverJson.at("compound").get<std::string>(),
            driverJson.at("tyreAge").get<int>()
        });
    }

    return raceState;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: ./deltabox_engine <input_json_path> [driver_code]\n";
        return 1;
    }

    const std::string inputPath = argv[1];
    const std::string driverCode = (argc >= 3) ? argv[2] : "LEC";

    std::ifstream inputFile(inputPath);
    if (!inputFile.is_open()) {
        std::cerr << "Failed to open input file: " << inputPath << "\n";
        return 1;
    }

    json inputJson;
    inputFile >> inputJson;

    RaceState raceState = parseRaceState(inputJson);

    std::vector<int> candidatePitLaps = inputJson.at("candidatePitLaps").get<std::vector<int>>();

    auto results = simulatePitStrategy(raceState, driverCode, candidatePitLaps);

    json output;
    output["targetDriver"] = driverCode;
    output["recommendedLap"] = results.empty() ? nullptr : json(results.front().pitLap);
    output["options"] = json::array();

    for (const auto& option : results) {
        output["options"].push_back({
            {"pitLap", option.pitLap},
            {"predictedRejoinPosition", option.predictedRejoinPosition},
            {"projectedRaceTime", option.projectedRaceTime},
            {"projectedDelta", option.projectedDelta},
            {"risk", option.risk},
            {"score", option.score}
        });
    }

    std::cout << output.dump(2) << "\n";
    return 0;
}

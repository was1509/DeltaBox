cmake_minimum_required(VERSION 3.16)
project(deltabox_engine)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(nlohmann_json REQUIRED)

add_executable(deltabox_engine
    src/main.cpp
    src/strategy_engine.cpp
)

target_include_directories(deltabox_engine PRIVATE include)
target_link_libraries(deltabox_engine PRIVATE nlohmann_json::nlohmann_json)

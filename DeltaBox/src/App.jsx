import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const drivers = [
  { code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', position: 1, gap: 'Leader', tyre: 'Medium', tyreAge: 18, lastLap: '1:32.481', pace: '+0.00', color: '#ff5c7a' },
  { code: 'VER', name: 'Max Verstappen', team: 'Red Bull', position: 2, gap: '+1.842', tyre: 'Hard', tyreAge: 10, lastLap: '1:32.777', pace: '+0.29', color: '#6ea8ff' },
  { code: 'NOR', name: 'Lando Norris', team: 'McLaren', position: 3, gap: '+3.271', tyre: 'Hard', tyreAge: 11, lastLap: '1:32.905', pace: '+0.42', color: '#ffb45c' },
  { code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', position: 4, gap: '+6.918', tyre: 'Medium', tyreAge: 20, lastLap: '1:33.190', pace: '+0.70', color: '#5eead4' },
  { code: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', position: 5, gap: '+8.004', tyre: 'Soft', tyreAge: 7, lastLap: '1:32.662', pace: '+0.18', color: '#ff7b72' },
]

const events = [
  { lap: 12, text: 'Norris pits for Hard' },
  { lap: 21, text: 'Hamilton reports rear degradation' },
  { lap: 29, text: 'Leclerc extends first stint' },
  { lap: 36, text: 'Pit window opens for Ferrari' },
]

const initialCars = [
  { id: 'LEC', progress: 0.02, speed: 0.00018, color: '#ff5c7a', isInPit: false, outLapSlowUntil: 0 },
  { id: 'VER', progress: 0.075, speed: 0.000172, color: '#6ea8ff', isInPit: false, outLapSlowUntil: 0 },
  { id: 'NOR', progress: 0.13, speed: 0.000167, color: '#ffb45c', isInPit: false, outLapSlowUntil: 0 },
  { id: 'HAM', progress: 0.19, speed: 0.000158, color: '#5eead4', isInPit: false, outLapSlowUntil: 0 },
  { id: 'SAI', progress: 0.245, speed: 0.000176, color: '#ff7b72', isInPit: false, outLapSlowUntil: 0 },
]

function getTrackPosition(progress) {
  const t = progress * Math.PI * 2

  const cx = 360
  const cy = 185

  const x =
    cx +
    235 * Math.cos(t) +
    42 * Math.cos(2.2 * t + 0.55) +
    16 * Math.sin(3.3 * t)

  const y =
    cy +
    108 * Math.sin(t) +
    28 * Math.sin(2.05 * t - 0.4) +
    10 * Math.cos(4.1 * t)

  return { x, y }
}

function getTyreModel(compound) {
  if (compound === 'Soft') {
    return { baseLap: 92.2, deg: 0.095, warmupPenalty: 1.4 }
  }
  if (compound === 'Medium') {
    return { baseLap: 92.6, deg: 0.07, warmupPenalty: 1.1 }
  }
  return { baseLap: 93.0, deg: 0.05, warmupPenalty: 0.9 }
}

function estimateTrafficPenalty(rejoinPosition) {
  if (rejoinPosition <= 2) return 0.2
  if (rejoinPosition <= 4) return 0.7
  return 1.6
}

function parseGap(gap) {
  return gap === 'Leader' ? 0 : parseFloat(gap.replace('+', ''))
}

function getNextCompound(currentTyre) {
  if (currentTyre === 'Soft') return 'Medium'
  if (currentTyre === 'Medium') return 'Hard'
  return 'Medium'
}

function getMinPitAge(tyre) {
  if (tyre === 'Soft') return 8
  if (tyre === 'Medium') return 12
  return 18
}

function simulatePitWindows(driver, currentLap, totalLaps = 57) {
  const minPitAge = getMinPitAge(driver.tyre)

  if (driver.tyreAge < minPitAge) {
    return {
      recommendedLap: null,
      options: [],
      status: 'too_early',
      nextWatchLap: currentLap + (minPitAge - driver.tyreAge),
    }
  }

  const options = []
  const currentTyre = getTyreModel(driver.tyre)

  for (let pitLap = currentLap; pitLap <= Math.min(currentLap + 5, totalLaps - 1); pitLap++) {
    const lapsBeforePit = pitLap - currentLap
    const lapsAfterPit = totalLaps - pitLap

    const stintBeforePitTime =
      Array.from({ length: lapsBeforePit }).reduce((sum, _, i) => {
        const age = driver.tyreAge + i

        let cliffPenalty = 0
        if (age >= 20) cliffPenalty += (age - 19) * 0.18
        if (age >= 25) cliffPenalty += (age - 24) * 0.35

        return sum + currentTyre.baseLap + age * currentTyre.deg + cliffPenalty
      }, 0)

    const nextCompound = getNextCompound(driver.tyre)
    const nextTyre = getTyreModel(nextCompound)

    const stintAfterPitTime =
      Array.from({ length: lapsAfterPit }).reduce((sum, _, i) => {
        return sum + nextTyre.baseLap + i * nextTyre.deg
      }, 0)

    const estimatedPitLoss = 22.4
    const outLapPenalty = nextTyre.warmupPenalty

    let predictedRejoinPosition = driver.position
    if (pitLap === currentLap) predictedRejoinPosition = Math.min(driver.position + 2, 5)
    else if (pitLap <= currentLap + 2) predictedRejoinPosition = Math.min(driver.position + 1, 5)
    else predictedRejoinPosition = Math.min(driver.position + 2, 5)

    const trafficPenalty = estimateTrafficPenalty(predictedRejoinPosition)
    const waitPenalty = lapsBeforePit * 0.9

    const totalRaceTime =
      stintBeforePitTime +
      estimatedPitLoss +
      outLapPenalty +
      trafficPenalty +
      waitPenalty +
      stintAfterPitTime

    options.push({
      pitLap,
      tyreAfter: nextCompound,
      predictedRejoinPosition,
      trafficPenalty,
      totalRaceTime,
    })
  }

  options.sort((a, b) => a.totalRaceTime - b.totalRaceTime)

  return {
    recommendedLap: options[0]?.pitLap ?? null,
    options,
    status: 'ready',
    nextWatchLap: options[0]?.pitLap ?? null,
  }
}

function App() {
  const [raceDrivers, setRaceDrivers] = useState(drivers)
  const [selectedDriverCode, setSelectedDriverCode] = useState(drivers[0].code)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cars, setCars] = useState(initialCars)

  const [strategyOptions, setStrategyOptions] = useState([])
  const [strategyLoading, setStrategyLoading] = useState(true)
  const [strategyError, setStrategyError] = useState('')
  const [recommendedLap, setRecommendedLap] = useState(null)
  const [simulateTick, setSimulateTick] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentLap, setCurrentLap] = useState(36)
  const [strategyStatus, setStrategyStatus] = useState('ready')
  const [nextWatchLap, setNextWatchLap] = useState(null)

  const [pitSequence, setPitSequence] = useState({
    active: false,
    driverCode: null,
    startTimeMs: null,
    elapsedSeconds: 0,
  })

  const [pitMessage, setPitMessage] = useState('')
  const animationRef = useRef(null)
  const lastTimeRef = useRef(null)
  const lastLapAppliedRef = useRef(36)

  const selectedDriver = useMemo(() => {
    return raceDrivers.find((driver) => driver.code === selectedDriverCode) || raceDrivers[0]
  }, [raceDrivers, selectedDriverCode])

  const isSelectedDriverInPit = pitSequence.active && pitSequence.driverCode === selectedDriverCode

  useEffect(() => {
    if (!isPlaying) return

    const id = setInterval(() => {
      setCurrentLap((lap) => (lap < 57 ? lap + 1 : lap))
    }, 4000)

    return () => clearInterval(id)
  }, [isPlaying])

  useEffect(() => {
    if (currentLap === lastLapAppliedRef.current) return

    const lapDiff = currentLap - lastLapAppliedRef.current
    if (lapDiff <= 0) return

    setRaceDrivers((prev) =>
      prev.map((driver) => ({
        ...driver,
        tyreAge: driver.tyreAge + lapDiff,
      })),
    )

    lastLapAppliedRef.current = currentLap
  }, [currentLap])

  useEffect(() => {
    if (isSelectedDriverInPit) return

    setStrategyLoading(true)
    setStrategyError('')

    try {
      const result = simulatePitWindows(selectedDriver, currentLap, 57)
      setRecommendedLap(result.recommendedLap)
      setStrategyOptions(result.options)
      setStrategyStatus(result.status || 'ready')
      setNextWatchLap(result.nextWatchLap ?? null)
    } catch {
      setStrategyError('Could not simulate strategy')
      setStrategyOptions([])
      setRecommendedLap(null)
      setStrategyStatus('error')
      setNextWatchLap(null)
    } finally {
      setStrategyLoading(false)
      setIsSimulating(false)
    }
  }, [selectedDriver, currentLap, simulateTick, isSelectedDriverInPit])

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = null
      lastTimeRef.current = null
      return
    }

    const animate = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      setCars((prev) =>
        prev.map((car) => {
          if (car.isInPit) {
            return car
          }

          let speedMultiplier = 1
          if (car.outLapSlowUntil && time < car.outLapSlowUntil) {
            const remaining = car.outLapSlowUntil - time
            const totalSlowWindow = 5000
            const normalized = Math.max(0, Math.min(1, remaining / totalSlowWindow))
            speedMultiplier = 0.68 + (1 - normalized) * 0.32
          }

          return {
            ...car,
            progress: (car.progress + car.speed * speedMultiplier * delta) % 1,
          }
        }),
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  function startPitStop() {
    if (pitSequence.active) return

    const now = Date.now()

    setPitSequence({
      active: true,
      driverCode: selectedDriverCode,
      startTimeMs: now,
      elapsedSeconds: 0,
    })

    setPitMessage(`${selectedDriverCode} PIT IN`)
    setRecommendedLap(null)
    setStrategyOptions([])
    setStrategyStatus('pitting')
    setNextWatchLap(null)

    setRaceDrivers((prev) =>
      prev.map((driver) =>
        driver.code === selectedDriverCode
          ? { ...driver, lastLap: 'PIT IN' }
          : driver,
      ),
    )

    setCars((prev) =>
      prev.map((car) =>
        car.id === selectedDriverCode
          ? { ...car, isInPit: true }
          : car,
      ),
    )
  }

  function endPitStop() {
    if (!pitSequence.active || pitSequence.driverCode !== selectedDriverCode) return

    const endTimeMs = Date.now()
    const elapsedSeconds = Math.max(2, (endTimeMs - pitSequence.startTimeMs) / 1000)
    const nextTyre = getNextCompound(selectedDriver.tyre)

    setRaceDrivers((prev) => {
      const updated = prev.map((driver) => {
        if (driver.code !== selectedDriverCode) return driver

        const currentGap = parseGap(driver.gap)
        const newGap = currentGap + elapsedSeconds

        return {
          ...driver,
          tyre: nextTyre,
          tyreAge: 0,
          gap: `+${newGap.toFixed(3)}`,
          lastLap: `PIT OUT +${elapsedSeconds.toFixed(1)}s`,
        }
      })

      const sorted = [...updated].sort((a, b) => parseGap(a.gap) - parseGap(b.gap))
      const leaderGap = parseGap(sorted[0].gap)

      return sorted.map((driver, index) => ({
        ...driver,
        position: index + 1,
        gap: index === 0 ? 'Leader' : `+${(parseGap(driver.gap) - leaderGap).toFixed(3)}`,
      }))
    })

    setCars((prev) =>
      prev.map((car) =>
        car.id === selectedDriverCode
          ? {
              ...car,
              isInPit: false,
              outLapSlowUntil: performance.now() + 5000,
            }
          : car,
      ),
    )

    setPitMessage(`${selectedDriverCode} PIT COMPLETE · Time lost ${elapsedSeconds.toFixed(1)}s`)

    setPitSequence({
      active: false,
      driverCode: null,
      startTimeMs: null,
      elapsedSeconds,
    })

    setSimulateTick((prev) => prev + 1)
  }

  const renderedCars = useMemo(() => {
    return cars.map((car) => ({
      ...car,
      ...getTrackPosition(car.progress),
    }))
  }, [cars])

  return (
    <div className="app">
      <div className="shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">DeltaBox</div>
            <h1>Formula 1 Strategy Dashboard</h1>
            <p className="subtext">2025 Bahrain Grand Prix · Race · Lap {currentLap} / 57</p>
          </div>

          <div className="topbar-right">
            <div className="pill live">{isPlaying ? 'REPLAY ON' : 'REPLAY OFF'}</div>
            <div className="pill muted">Track: Sakhir</div>
            <div className="pill accent">Ferrari Focus</div>
          </div>
        </header>

        <main className="grid">
          <section className="panel leaderboard">
            <div className="panel-header">
              <h2>Leaderboard</h2>
              <span>Top 5</span>
            </div>

            <div className="driver-list">
              {raceDrivers.map((driver) => (
                <button
                  type="button"
                  className={`driver-row ${driver.code === selectedDriverCode ? 'active' : ''}`}
                  key={driver.code}
                  onClick={() => setSelectedDriverCode(driver.code)}
                >
                  <div className="driver-left">
                    <div className="pos">{driver.position}</div>
                    <div className="team-mark" style={{ background: driver.color }} />
                    <div>
                      <div className="driver-code">{driver.code}</div>
                      <div className="driver-name">{driver.name}</div>
                    </div>
                  </div>

                  <div className="driver-right">
                    <div className="gap">{driver.gap}</div>
                    <div className="mini-meta">
                      {driver.tyre} · {driver.tyreAge}L
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel center-panel">
            <div className="panel-header">
              <h2>Track Overview</h2>
              <span>Predicted race state</span>
            </div>

            <div className="track-card">
              <div className="track-glow" />

              <div className="track-actions">
                <button
                  type="button"
                  className="play-btn"
                  onClick={() => setIsPlaying((prev) => !prev)}
                >
                  {isPlaying ? 'Pause Replay' : 'Play Replay'}
                </button>
              </div>

              <svg viewBox="0 0 700 420" className="track-svg">
                <defs>
                  <linearGradient id="trackStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4d6d" />
                    <stop offset="50%" stopColor="#7c5cff" />
                    <stop offset="100%" stopColor="#3dd9ff" />
                  </linearGradient>
                  <filter id="carGlow" x="-120%" y="-120%" width="340%" height="340%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M140 290
                     C100 250, 90 180, 130 130
                     C170 80, 260 70, 330 95
                     C390 115, 450 110, 510 90
                     C575 68, 625 95, 620 150
                     C615 215, 540 235, 495 250
                     C430 272, 430 330, 355 340
                     C285 350, 225 325, 190 305
                     C170 295, 155 300, 140 290"
                  fill="none"
                  stroke="url(#trackStroke)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                {[
                  ...renderedCars.filter((car) => car.id !== selectedDriverCode),
                  ...renderedCars.filter((car) => car.id === selectedDriverCode),
                ].map((car) => {
                  const isSelected = car.id === selectedDriverCode
                  const showPitHalo = isSelected && car.isInPit

                  return (
                    <g key={car.id}>
                      {isSelected && !car.isInPit && (
                        <>
                          <circle cx={car.x} cy={car.y} r="11" fill={car.color} opacity="0.12" />
                          <circle
                            cx={car.x}
                            cy={car.y}
                            r="15"
                            fill="none"
                            stroke={car.color}
                            strokeWidth="1.8"
                            opacity="0.4"
                          />
                        </>
                      )}

                      {showPitHalo && (
                        <>
                          <circle
                            cx={car.x}
                            cy={car.y}
                            r="16"
                            fill="none"
                            stroke={car.color}
                            strokeWidth="2"
                            opacity="0.5"
                          />
                          <circle
                            cx={car.x}
                            cy={car.y}
                            r="10"
                            fill={car.color}
                            opacity="0.14"
                          />
                        </>
                      )}

                      <circle
                        cx={car.x}
                        cy={car.y}
                        r={isSelected ? 7.2 : 6.2}
                        fill={car.color}
                        filter="url(#carGlow)"
                        stroke={isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(12,16,28,0.85)'}
                        strokeWidth={isSelected ? 1.6 : 1.1}
                        opacity={car.isInPit ? 0.65 : 1}
                      />
                    </g>
                  )
                })}
              </svg>

              <div className="track-stats">
                <div className="stat-box">
                  <span className="stat-label">Gap to P2</span>
                  <strong>{selectedDriver.position === 1 ? 'Leader' : selectedDriver.gap}</strong>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Last Pit Loss</span>
                  <strong>
                    {pitSequence.elapsedSeconds > 0 ? `${pitSequence.elapsedSeconds.toFixed(1)}s` : '-'}
                  </strong>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Pit State</span>
                  <strong>{isSelectedDriverInPit ? 'In Box' : 'On Track'}</strong>
                </div>
              </div>
            </div>

            <div className="chart-row">
              <div className="mini-panel">
                <div className="mini-header">
                  <span>Tyre Degradation</span>
                  <strong>{selectedDriver.tyre}</strong>
                </div>
                <div className="bars">
                  <div className="bar"><span style={{ width: `${Math.max(18, 100 - selectedDriver.tyreAge * 3)}%` }} /></div>
                  <div className="bar"><span style={{ width: `${Math.max(14, 88 - selectedDriver.tyreAge * 2.7)}%` }} /></div>
                  <div className="bar"><span style={{ width: `${Math.max(10, 74 - selectedDriver.tyreAge * 2.4)}%` }} /></div>
                  <div className="bar"><span style={{ width: `${Math.max(8, 58 - selectedDriver.tyreAge * 2.1)}%` }} /></div>
                </div>
              </div>

              <div className="mini-panel">
                <div className="mini-header">
                  <span>Pace Trend</span>
                  <strong>{selectedDriver.tyreAge > 18 ? 'Falling' : 'Stable'}</strong>
                </div>
                <div className="trendline">
                  <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path
                      d="M0 60 C25 55, 40 35, 70 38 C100 40, 125 68, 150 58 C180 45, 205 22, 240 30 C265 36, 285 44, 300 26"
                      fill="none"
                      stroke="#8b7dff"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <section className="panel strategy-panel">
            <div className="panel-header">
              <h2>Strategy Engine</h2>
              <span>C++ Engine</span>
            </div>

            <div className="selected-driver-card">
              <div className="selected-top">
                <div>
                  <div className="eyebrow">Selected Driver</div>
                  <h3>{selectedDriver.name}</h3>
                  <p>{selectedDriver.team} · P{selectedDriver.position}</p>
                </div>
                <div className="team-dot" style={{ background: selectedDriver.color }} />
              </div>

              <div className="selected-grid">
                <div>
                  <span>Tyre</span>
                  <strong>{selectedDriver.tyre}</strong>
                </div>
                <div>
                  <span>Tyre Age</span>
                  <strong>{selectedDriver.tyreAge} laps</strong>
                </div>
                <div>
                  <span>Last Lap</span>
                  <strong>{selectedDriver.lastLap}</strong>
                </div>
                <div>
                  <span>Pace Delta</span>
                  <strong>{selectedDriver.pace}</strong>
                </div>
              </div>
            </div>

            <div className="recommendation">
              <div>
                <div className="eyebrow">Recommendation</div>
                <h3>
                  {isSelectedDriverInPit
                    ? 'Pit stop in progress'
                    : strategyStatus === 'too_early'
                      ? 'No pit needed yet'
                      : recommendedLap
                        ? `Best Pit Lap: ${recommendedLap}`
                        : 'No recommendation yet'}
                </h3>

                <p>
                  {isSelectedDriverInPit
                    ? pitMessage
                    : strategyLoading
                      ? 'Running DeltaBox strategy engine...'
                      : strategyError
                        ? strategyError
                        : strategyStatus === 'too_early'
                          ? `Fresh tyres on ${selectedDriver.code}. Re-evaluate around lap ${nextWatchLap}.`
                          : pitMessage
                            ? pitMessage
                            : `Best current pit window for ${selectedDriver.code} at lap ${currentLap}.`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="simulate-btn"
                  onClick={() => {
                    setIsSimulating(true)
                    setSimulateTick((prev) => prev + 1)
                  }}
                  disabled={strategyLoading || isSelectedDriverInPit}
                >
                  {strategyLoading || isSimulating ? 'Simulating...' : 'Recalculate Window'}
                </button>

                <button
                  className="simulate-btn"
                  onClick={isSelectedDriverInPit ? endPitStop : startPitStop}
                >
                  {isSelectedDriverInPit ? 'End Pit' : 'Start Pit'}
                </button>
              </div>
            </div>

            <div className="option-table">
              {strategyLoading ? (
                <div className="option-row">
                  <span>Loading...</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : strategyError ? (
                <div className="option-row">
                  <span>Error</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : strategyOptions.length === 0 ? (
                <div className="option-row">
                  <span>No pit needed</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : (
                strategyOptions.map((option) => (
                  <div
                    className={`option-row ${option.pitLap === recommendedLap ? 'recommended' : ''}`}
                    key={option.pitLap}
                  >
                    <span>Lap {option.pitLap}</span>
                    <span>{option.tyreAfter}</span>
                    <span>P{option.predictedRejoinPosition}</span>
                    <span>{option.totalRaceTime.toFixed(1)}s</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel events-panel">
            <div className="panel-header">
              <h2>Race Control Feed</h2>
              <span>Session timeline</span>
            </div>

            <div className="events-list">
              {events.map((event, index) => (
                <div className="event-row" key={index}>
                  <div className="event-lap">L{event.lap}</div>
                  <div className="event-text">{event.text}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
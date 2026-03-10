import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const drivers = [
  { code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', position: 1, gap: 'Leader', tyre: 'Medium', tyreAge: 18, lastLap: '1:32.481', pace: '+0.00', color: '#ff5c7a' },
  { code: 'VER', name: 'Max Verstappen', team: 'Red Bull', position: 2, gap: '+1.842', tyre: 'Hard', tyreAge: 10, lastLap: '1:32.777', pace: '+0.29', color: '#6ea8ff' },
  { code: 'NOR', name: 'Lando Norris', team: 'McLaren', position: 3, gap: '+3.271', tyre: 'Hard', tyreAge: 11, lastLap: '1:32.905', pace: '+0.42', color: '#ffb45c' },
  { code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', position: 4, gap: '+6.918', tyre: 'Medium', tyreAge: 20, lastLap: '1:33.190', pace: '+0.70', color: '#5eead4' },
  { code: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', position: 5, gap: '+8.004', tyre: 'Soft', tyreAge: 7, lastLap: '1:32.662', pace: '+0.18', color: '#ff7b72' },
]

const strategyOptions = [
  { lap: 37, rejoin: 'P2', gap: '-0.8s', risk: 'High' },
  { lap: 38, rejoin: 'P1', gap: '+0.3s', risk: 'Medium' },
  { lap: 39, rejoin: 'P1', gap: '+1.1s', risk: 'Low' },
  { lap: 40, rejoin: 'P2', gap: '-1.9s', risk: 'High' },
]

const events = [
  { lap: 12, text: 'Norris pits for Hard' },
  { lap: 21, text: 'Hamilton reports rear degradation' },
  { lap: 29, text: 'Leclerc extends first stint' },
  { lap: 36, text: 'Pit window opens for Ferrari' },
]

const initialCars = [
  { id: 'LEC', progress: 0.02, speed: 0.00018, color: '#ff5c7a' },
  { id: 'VER', progress: 0.075, speed: 0.000172, color: '#6ea8ff' },
  { id: 'NOR', progress: 0.13, speed: 0.000167, color: '#ffb45c' },
  { id: 'HAM', progress: 0.19, speed: 0.000158, color: '#5eead4' },
  { id: 'SAI', progress: 0.245, speed: 0.000176, color: '#ff7b72' },
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

function App() {
  const [selectedDriver, setSelectedDriver] = useState(drivers[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [cars, setCars] = useState(initialCars)

  const animationRef = useRef(null)
  const lastTimeRef = useRef(null)

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
        prev.map((car) => ({
          ...car,
          progress: (car.progress + car.speed * delta) % 1,
        })),
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

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
            <p className="subtext">2025 Bahrain Grand Prix · Race · Lap 36 / 57</p>
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
              {drivers.map((driver) => (
                <button
                  type="button"
                  className={`driver-row ${driver.code === selectedDriver.code ? 'active' : ''}`}
                  key={driver.code}
                  onClick={() => setSelectedDriver(driver)}
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
                  <filter
                    id="carGlow"
                    x="-120%"
                    y="-120%"
                    width="340%"
                    height="340%"
                  >
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
                  ...renderedCars.filter((car) => car.id !== selectedDriver.code),
                  ...renderedCars.filter((car) => car.id === selectedDriver.code),
                ].map((car) => {
                  const isSelected = car.id === selectedDriver.code

                  return (
                    <g key={car.id}>
                      {isSelected && (
                        <>
                          <circle
                            cx={car.x}
                            cy={car.y}
                            r="11"
                            fill={car.color}
                            opacity="0.12"
                          />
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

                      <circle
                        cx={car.x}
                        cy={car.y}
                        r={isSelected ? 7.2 : 6.2}
                        fill={car.color}
                        filter="url(#carGlow)"
                        stroke={isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(12,16,28,0.85)'}
                        strokeWidth={isSelected ? 1.6 : 1.1}
                      />
                    </g>
                  )
                })}
              </svg>

              <div className="track-stats">
                <div className="stat-box">
                  <span className="stat-label">Gap to P2</span>
                  <strong>+1.842s</strong>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Pit Loss</span>
                  <strong>22.4s</strong>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Safety Car Window</span>
                  <strong>Open</strong>
                </div>
              </div>
            </div>

            <div className="chart-row">
              <div className="mini-panel">
                <div className="mini-header">
                  <span>Tyre Degradation</span>
                  <strong>Medium</strong>
                </div>
                <div className="bars">
                  <div className="bar"><span style={{ width: '88%' }} /></div>
                  <div className="bar"><span style={{ width: '74%' }} /></div>
                  <div className="bar"><span style={{ width: '61%' }} /></div>
                  <div className="bar"><span style={{ width: '44%' }} /></div>
                </div>
              </div>

              <div className="mini-panel">
                <div className="mini-header">
                  <span>Pace Trend</span>
                  <strong>Stable</strong>
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
              <span>Dummy model</span>
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
                <h3>Pit on Lap 39</h3>
                <p>Highest chance of retaining track position with lowest undercut risk.</p>
              </div>
              <button className="simulate-btn">Simulate Pit Window</button>
            </div>

            <div className="option-table">
              {strategyOptions.map((option) => (
                <div className={`option-row ${option.lap === 39 ? 'recommended' : ''}`} key={option.lap}>
                  <span>Lap {option.lap}</span>
                  <span>{option.rejoin}</span>
                  <span>{option.gap}</span>
                  <span className={`risk ${option.risk.toLowerCase()}`}>{option.risk}</span>
                </div>
              ))}
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
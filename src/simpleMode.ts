import type { SimulationStateSnapshot, WorldConfig, ShipClass } from "./contracts"

/**
 * Creates a target-practice challenge tracker.
 * Call update(dt, state) each simulation tick to advance the timer and count kills.
 * The simulation must be initialized with createTargetChallengeConfig() so that
 * target ships (team 1) are present in the world.
 */
export function createTargetChallenge() {
  let score = 0
  let time = 60
  let done = false
  let pendingHits = 0

  return {
    update(dt: number, state: SimulationStateSnapshot) {
      if (done) return
      time -= dt
      const shipTeamById = new Map(state.ships.map((ship) => [ship.id, ship.team]))

      // Count score from this tick against target ships (team 1).
      // Hits award immediate feedback; kills grant an extra bonus.
      for (const event of state.combatEvents) {
        const targetTeam =
          typeof event.targetId === "number" ? shipTeamById.get(event.targetId) : undefined
        if (targetTeam !== 1) continue

        if (event.type === "hit") {
          score += 10
          pendingHits += 1
        }
        if (event.type === "kill") score += 100
      }
      if (time <= 0) done = true
    },
    isFinished() {
      return done
    },
    getScore() {
      return score
    },
    getTime() {
      return time < 0 ? 0 : time
    },
    /** Returns number of new hits since the last call and resets the counter. */
    flushHits(): number {
      const n = pendingHits
      pendingHits = 0
      return n
    }
  }
}

/**
 * Returns a WorldConfig that places one player Fighter (team 0) at the origin
 * and several static target Fighters (team 1) around the battlefield.
 */
export function createTargetChallengeConfig(
  rng: { next(): number },
  targetCount = 8
): WorldConfig {
  const BASE_RADIUS = 2500
  const RADIUS_JITTER = 600
  const targets = Array.from({ length: targetCount }, (_, i) => ({
    team: 1,
    class: "Fighter" as ShipClass,
    position: {
      x: Math.cos((i / targetCount) * Math.PI * 2) * (BASE_RADIUS + rng.next() * RADIUS_JITTER),
      y: Math.sin((i / targetCount) * Math.PI * 2) * (BASE_RADIUS + rng.next() * RADIUS_JITTER),
      z: 0
    },
    heading: 0
  }))

  return {
    worldSize: 20_000,
    ships: [
      { team: 0, class: "Fighter" as ShipClass, position: { x: 0, y: 0, z: 0 }, heading: 0 },
      ...targets
    ]
  }
}

// This file handles the target-practice challenge:
// spawn static target ships via WorldConfig, track time and kills, return final score.
// Score: 10 pts per hit + 100 pts per kill. Time limit: 60 seconds.
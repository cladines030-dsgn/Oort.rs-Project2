import type {
  ShipClass,
  ShipCommandsApi,
  SimulationStateSnapshot,
  TargetChallengeMode,
  WorldConfig
} from "./contracts"
import { vec3 } from "./math"

type Tone = "default" | "danger" | "success"

type Point = { x: number; y: number }

type HudStat = {
  label: string
  value: string
  tone?: Tone
}

type HazardDefinition = {
  class: ShipClass
  position: Point
  heading: number
  radius: number
  patrol?: ReadonlyArray<Point>
  segmentTicks?: number
}

type ObstacleCourseDefinition = {
  id: ObstacleCourseId
  label: string
  description: string
  objective: string
  timeLimitSeconds: number
  maxContacts: number
  worldSize: number
  start: Point
  startHeading: number
  checkpoints: ReadonlyArray<Point>
  hazards: ReadonlyArray<HazardDefinition>
}

export interface ChallengeHudState {
  title: string
  objective: string
  stats: ReadonlyArray<HudStat>
  completionLabel?: string
  completionTone?: Tone
}

export interface ChallengeRuntime extends TargetChallengeMode {
  getHudState(): ChallengeHudState
}

const TARGET_TIME_LIMIT_SECONDS = 60
const DEFENSE_TIME_LIMIT_SECONDS = 75
const DEFENSE_BASE_RADIUS = 900
const DEFENSE_PLAYER_START = { x: 0, y: -2200 }
const DEFENSE_ENEMY_SPAWNS: ReadonlyArray<Point> = [
  { x: -8400, y: 6400 },
  { x: -6400, y: 8200 },
  { x: -1800, y: 9300 },
  { x: 2400, y: 9100 },
  { x: 7200, y: 7200 },
  { x: 8600, y: 2600 },
  { x: 8200, y: -4200 },
  { x: -7600, y: -5200 }
]

export const OBSTACLE_COURSE_OPTIONS = [
  {
    id: "slalom",
    label: "Asteroid Slalom",
    description: "Fast alternating gates with large static hazards."
  },
  {
    id: "switchbacks",
    label: "Switchback Run",
    description: "Sharp lateral cuts through a stacked canyon of hulks."
  },
  {
    id: "spiral",
    label: "Spiral Dive",
    description: "A tightening inward route with moving sweepers near the core."
  }
] as const

export type ObstacleCourseId = (typeof OBSTACLE_COURSE_OPTIONS)[number]["id"]

export const OBSTACLE_COURSES: Record<ObstacleCourseId, ObstacleCourseDefinition> = {
  slalom: {
    id: "slalom",
    label: "Asteroid Slalom",
    description: "Fast alternating gates with large static hazards.",
    objective: "Clear every gate in order and keep away from the hazard halos.",
    timeLimitSeconds: 50,
    maxContacts: 5,
    worldSize: 24_000,
    start: { x: -7600, y: 0 },
    startHeading: 0,
    checkpoints: [
      { x: -5600, y: -1800 },
      { x: -3400, y: 1700 },
      { x: -1200, y: -1650 },
      { x: 1200, y: 1600 },
      { x: 3500, y: -1500 },
      { x: 5800, y: 1450 },
      { x: 7600, y: 0 }
    ],
    hazards: [
      { class: "Cruiser", position: { x: -4500, y: 1350 }, heading: Math.PI, radius: 780 },
      { class: "Cruiser", position: { x: -2200, y: -1450 }, heading: Math.PI, radius: 780 },
      { class: "Cruiser", position: { x: 150, y: 1420 }, heading: Math.PI, radius: 780 },
      { class: "Cruiser", position: { x: 2450, y: -1380 }, heading: Math.PI, radius: 780 },
      { class: "Cruiser", position: { x: 4700, y: 1320 }, heading: Math.PI, radius: 780 }
    ]
  },
  switchbacks: {
    id: "switchbacks",
    label: "Switchback Run",
    description: "Sharp lateral cuts through a stacked canyon of hulks.",
    objective: "Thread the switchbacks, brake before each cut, and limit hull contacts.",
    timeLimitSeconds: 65,
    maxContacts: 5,
    worldSize: 26_000,
    start: { x: -6900, y: -5200 },
    startHeading: Math.PI / 5,
    checkpoints: [
      { x: -5200, y: -3500 },
      { x: -2600, y: -1200 },
      { x: 250, y: -3500 },
      { x: 2850, y: -900 },
      { x: 5400, y: -3100 },
      { x: 6400, y: 900 },
      { x: 3600, y: 3800 },
      { x: 500, y: 1850 },
      { x: -2800, y: 4550 }
    ],
    hazards: [
      { class: "Frigate", position: { x: -4050, y: -2200 }, heading: Math.PI / 2, radius: 620 },
      { class: "Frigate", position: { x: -1150, y: -2400 }, heading: -Math.PI / 2, radius: 620 },
      { class: "Frigate", position: { x: 1650, y: -2000 }, heading: Math.PI / 2, radius: 620 },
      { class: "Frigate", position: { x: 4350, y: -1700 }, heading: -Math.PI / 2, radius: 620 },
      { class: "Cruiser", position: { x: 5000, y: 1700 }, heading: Math.PI, radius: 760 },
      { class: "Cruiser", position: { x: 1700, y: 3200 }, heading: Math.PI, radius: 760 }
    ]
  },
  spiral: {
    id: "spiral",
    label: "Spiral Dive",
    description: "A tightening inward route with moving sweepers near the core.",
    objective: "Collapse inward through the spiral and stay clear of the moving sweepers.",
    timeLimitSeconds: 70,
    maxContacts: 5,
    worldSize: 24_000,
    start: { x: -6800, y: 0 },
    startHeading: 0,
    checkpoints: [
      { x: -5000, y: 2300 },
      { x: -1700, y: 4300 },
      { x: 1700, y: 3450 },
      { x: 3600, y: 950 },
      { x: 2800, y: -1850 },
      { x: 700, y: -3300 },
      { x: -1650, y: -1800 },
      { x: -1150, y: 450 },
      { x: 350, y: 1300 },
      { x: 1180, y: 120 },
      { x: 0, y: 0 }
    ],
    hazards: [
      { class: "Cruiser", position: { x: 0, y: 0 }, heading: 0, radius: 900 },
      {
        class: "Frigate",
        position: { x: 2500, y: 2500 },
        heading: Math.PI,
        radius: 620,
        patrol: [
          { x: 2500, y: 2500 },
          { x: 2500, y: -2500 },
          { x: -2500, y: -2500 },
          { x: -2500, y: 2500 }
        ],
        segmentTicks: 150
      },
      {
        class: "Frigate",
        position: { x: -3200, y: 0 },
        heading: 0,
        radius: 620,
        patrol: [
          { x: -3200, y: 0 },
          { x: 3200, y: 0 }
        ],
        segmentTicks: 120
      }
    ]
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds))
  const mins = Math.floor(safe / 60)
  return `${mins}:${String(safe % 60).padStart(2, "0")}`
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (1_664_525 * state + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function distanceToPoint(position: { x: number; y: number }, point: Point): number {
  return Math.hypot(position.x - point.x, position.y - point.y)
}

function angleToPoint(from: { x: number; y: number }, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

function scoreTone(value: number, warningThreshold: number): Tone {
  return value <= warningThreshold ? "danger" : "default"
}

export function resolveObstacleCourseId(course?: string): ObstacleCourseId {
  if (course && course in OBSTACLE_COURSES) {
    return course as ObstacleCourseId
  }

  return "slalom"
}

export function getChallengeModeName(challenge: string, course?: string): string {
  if (challenge === "shooting") return "Target Practice"
  if (challenge === "defense") return "Perimeter Defense"
  if (challenge === "obstacle") {
    return OBSTACLE_COURSES[resolveObstacleCourseId(course)].label
  }

  return challenge
}

export function getChallengeObjective(challenge: string, course?: string): string {
  if (challenge === "shooting") {
    return "Destroy as many static targets as possible before time runs out."
  }

  if (challenge === "defense") {
    return "Hold the command node at the center until the assault wave burns out."
  }

  if (challenge === "obstacle") {
    return OBSTACLE_COURSES[resolveObstacleCourseId(course)].objective
  }

  return ""
}

export function getChallengePreviewHud(challenge: string, course?: string): ChallengeHudState | null {
  if (challenge === "shooting") {
    return {
      title: "Target Practice",
      objective: getChallengeObjective(challenge),
      stats: [
        { label: "TIME", value: formatTime(TARGET_TIME_LIMIT_SECONDS) },
        { label: "SCORE", value: "0" }
      ]
    }
  }

  if (challenge === "defense") {
    return {
      title: "Perimeter Defense",
      objective: getChallengeObjective(challenge),
      stats: [
        { label: "TIME", value: formatTime(DEFENSE_TIME_LIMIT_SECONDS) },
        { label: "INTEGRITY", value: "100%" },
        { label: "THREATS", value: String(DEFENSE_ENEMY_SPAWNS.length) }
      ]
    }
  }

  if (challenge === "obstacle") {
    const courseDef = OBSTACLE_COURSES[resolveObstacleCourseId(course)]

    return {
      title: courseDef.label,
      objective: courseDef.objective,
      stats: [
        { label: "TIME", value: formatTime(courseDef.timeLimitSeconds) },
        { label: "GATES", value: `0/${courseDef.checkpoints.length}` },
        { label: "CONTACTS", value: `0/${courseDef.maxContacts}` }
      ]
    }
  }

  return null
}

/**
 * Creates a target-practice challenge tracker.
 * Call update(dt, state) each simulation tick to advance the timer and count kills.
 * The simulation must be initialized with createTargetChallengeConfig() so that
 * target ships (team 1) are present in the world.
 */
export function createTargetChallenge(): ChallengeRuntime {
  let score = 0
  let time = TARGET_TIME_LIMIT_SECONDS
  let done = false

  return {
    update(dt: number, state: SimulationStateSnapshot) {
      if (done) return
      time -= dt
      const shipTeamById = new Map(state.ships.map((ship) => [ship.id, ship.team]))

      for (const event of state.combatEvents) {
        const targetTeam =
          typeof event.targetId === "number" ? shipTeamById.get(event.targetId) : undefined
        if (targetTeam !== 1) continue

        if (event.type === "hit") {
          score += 10
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
    getHudState(): ChallengeHudState {
      return {
        title: "Target Practice",
        objective: getChallengeObjective("shooting"),
        stats: [
          { label: "TIME", value: formatTime(time), tone: scoreTone(time, 15) },
          { label: "SCORE", value: String(score) }
        ],
        completionLabel: done ? "RANGE COLD" : undefined,
        completionTone: done ? "success" : undefined
      }
    },
    getCompletionStatus() {
      return `Target practice complete! Score: ${score}`
    }
  }
}

/**
 * Returns a WorldConfig that places one player Fighter (team 0) at the origin
 * and several static target Fighters (team 1) around the battlefield.
 */
export function createTargetChallengeConfig(seed = 1234, targetCount = 8): WorldConfig {
  const next = createSeededRng(seed)
  const baseRadius = 2500
  const radiusJitter = 600
  const targets = Array.from({ length: targetCount }, (_, index) => ({
    team: 1,
    class: "Fighter" as ShipClass,
    position: {
      x: Math.cos((index / targetCount) * Math.PI * 2) * (baseRadius + next() * radiusJitter),
      y: Math.sin((index / targetCount) * Math.PI * 2) * (baseRadius + next() * radiusJitter),
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

function createDefenseChallengeConfig(): WorldConfig {
  return {
    worldSize: 24_000,
    ships: [
      {
        team: 0,
        class: "Fighter" as ShipClass,
        position: vec3(DEFENSE_PLAYER_START.x, DEFENSE_PLAYER_START.y, 0),
        heading: Math.PI / 2
      },
      ...DEFENSE_ENEMY_SPAWNS.map((spawn) => ({
        team: 1,
        class: "Fighter" as ShipClass,
        position: vec3(spawn.x, spawn.y, 0),
        heading: angleToPoint(spawn, { x: 0, y: 0 })
      }))
    ]
  }
}

function createDefenseChallenge(): ChallengeRuntime {
  let latestState: SimulationStateSnapshot | null = null
  let time = DEFENSE_TIME_LIMIT_SECONDS
  let integrity = 100
  let destroyedThreats = 0
  let done = false

  return {
    update(dt: number, state: SimulationStateSnapshot) {
      latestState = state
      if (done) return

      time -= dt
      const liveEnemies = state.ships.filter((ship) => ship.team === 1 && ship.health > 0)
      const pressure = liveEnemies.filter(
        (ship) => distanceToPoint(ship.position, { x: 0, y: 0 }) <= DEFENSE_BASE_RADIUS
      ).length

      if (pressure > 0) {
        integrity = Math.max(0, integrity - pressure * dt * 14)
      }

      const shipTeamById = new Map(state.ships.map((ship) => [ship.id, ship.team]))
      for (const event of state.combatEvents) {
        const targetTeam =
          typeof event.targetId === "number" ? shipTeamById.get(event.targetId) : undefined
        if (event.type === "kill" && targetTeam === 1) {
          destroyedThreats += 1
        }
      }

      if (time <= 0 || integrity <= 0 || liveEnemies.length === 0) {
        done = true
      }
    },
    isFinished() {
      return done
    },
    getScore() {
      return Math.max(0, Math.round(integrity * 20 + destroyedThreats * 250 + time * 5))
    },
    getTime() {
      return time < 0 ? 0 : time
    },
    controlShip(shipId: number, team: number, api: ShipCommandsApi) {
      if (team !== 1) return

      const snapshot = latestState
      const self = snapshot?.ships.find((ship) => ship.id === shipId)
      const player = snapshot?.ships.find((ship) => ship.team === 0 && ship.health > 0)

      if (!self) {
        api.moveTo(0, 0)
        return
      }

      const playerDistance = player
        ? Math.hypot(self.position.x - player.position.x, self.position.y - player.position.y)
        : Number.POSITIVE_INFINITY

      if (player && playerDistance < 2600) {
        api.setHeading(angleToPoint(self.position, { x: player.position.x, y: player.position.y }))

        if (playerDistance > 1000) {
          api.thrust(0.9)
        } else {
          api.brake(0.7)
        }

        if (playerDistance < 2200 && api.reloadTicks(0) === 0) {
          api.fire(0)
        }

        return
      }

      api.moveTo(0, 0)
    },
    getHudState(): ChallengeHudState {
      const threatsRemaining = latestState
        ? latestState.ships.filter((ship) => ship.team === 1 && ship.health > 0).length
        : DEFENSE_ENEMY_SPAWNS.length
      const success = integrity > 0

      return {
        title: "Perimeter Defense",
        objective: getChallengeObjective("defense"),
        stats: [
          { label: "TIME", value: formatTime(time), tone: scoreTone(time, 20) },
          {
            label: "INTEGRITY",
            value: `${Math.round(clamp(integrity, 0, 100))}%`,
            tone: integrity <= 35 ? "danger" : "default"
          },
          {
            label: "THREATS",
            value: String(threatsRemaining),
            tone: threatsRemaining === 0 ? "success" : "default"
          }
        ],
        completionLabel: done ? (success ? "SECTOR HELD" : "DEFENSE FAILED") : undefined,
        completionTone: done ? (success ? "success" : "danger") : undefined
      }
    },
    getCompletionStatus() {
      return integrity > 0
        ? `Defense complete! Node integrity ${Math.round(clamp(integrity, 0, 100))}%`
        : "Defense failed: the command node was overrun"
    }
  }
}

function createObstacleCourseChallenge(
  courseId: ObstacleCourseId
): { runtime: ChallengeRuntime; worldConfig: WorldConfig } {
  const course = OBSTACLE_COURSES[courseId]
  const hazardById = new Map<number, HazardDefinition>()
  const ships = [
    {
      team: 0,
      class: "Fighter" as ShipClass,
      position: vec3(course.start.x, course.start.y, 0),
      heading: course.startHeading
    },
    ...course.hazards.map((hazard, index) => {
      hazardById.set(index + 1, hazard)
      return {
        team: 1,
        class: hazard.class,
        position: vec3(hazard.position.x, hazard.position.y, 0),
        heading: hazard.heading
      }
    })
  ]

  let time = course.timeLimitSeconds
  let completedCheckpoints = 0
  let contacts = 0
  let done = false
  let completed = false
  const lastContactTickByHazard = new Map<number, number>()

  const runtime: ChallengeRuntime = {
    update(dt: number, state: SimulationStateSnapshot) {
      if (done) return

      time -= dt
      const player = state.ships.find((ship) => ship.team === 0 && ship.health > 0)
      if (!player) {
        done = true
        completed = false
        return
      }

      const nextCheckpoint = course.checkpoints[completedCheckpoints]
      if (nextCheckpoint && distanceToPoint(player.position, nextCheckpoint) <= 340) {
        completedCheckpoints += 1
      }

      for (const hazardShip of state.ships) {
        if (hazardShip.team !== 1 || hazardShip.health <= 0) continue
        const hazard = hazardById.get(hazardShip.id)
        if (!hazard) continue

        const lastContactTick = lastContactTickByHazard.get(hazardShip.id) ?? -1_000
        if (
          distanceToPoint(player.position, {
            x: hazardShip.position.x,
            y: hazardShip.position.y
          }) <= hazard.radius &&
          state.tick - lastContactTick >= 36
        ) {
          contacts += 1
          lastContactTickByHazard.set(hazardShip.id, state.tick)
        }
      }

      if (completedCheckpoints >= course.checkpoints.length) {
        done = true
        completed = true
        return
      }

      if (time <= 0 || contacts >= course.maxContacts) {
        done = true
        completed = false
      }
    },
    isFinished() {
      return done
    },
    getScore() {
      const timeBonus = Math.max(0, Math.round(time * 12))
      return Math.max(0, completedCheckpoints * 180 + timeBonus - contacts * 160)
    },
    getTime() {
      return time < 0 ? 0 : time
    },
    controlShip(shipId: number, team: number, api: ShipCommandsApi) {
      if (team !== 1) return

      const hazard = hazardById.get(shipId)
      if (!hazard) return

      if (!hazard.patrol || hazard.patrol.length === 0) {
        api.brake(1)
        return
      }

      const segmentTicks = hazard.segmentTicks ?? 180
      const pointIndex = Math.floor(api.currentTick() / segmentTicks) % hazard.patrol.length
      const point = hazard.patrol[pointIndex]
      api.moveTo(point.x, point.y)
    },
    getHudState(): ChallengeHudState {
      const totalCheckpoints = course.checkpoints.length

      return {
        title: course.label,
        objective: course.objective,
        stats: [
          { label: "TIME", value: formatTime(time), tone: scoreTone(time, 18) },
          { label: "GATES", value: `${completedCheckpoints}/${totalCheckpoints}` },
          {
            label: "CONTACTS",
            value: `${contacts}/${course.maxContacts}`,
            tone: contacts >= course.maxContacts - 1 ? "danger" : "default"
          }
        ],
        completionLabel: done ? (completed ? "COURSE CLEAR" : "RUN FAILED") : undefined,
        completionTone: done ? (completed ? "success" : "danger") : undefined
      }
    },
    getCompletionStatus() {
      if (completed) {
        return `${course.label} clear! Score: ${runtime.getScore()}`
      }

      if (contacts >= course.maxContacts) {
        return `${course.label} failed: contact limit exceeded`
      }

      return `${course.label} failed: time expired`
    }
  }

  return {
    runtime,
    worldConfig: {
      worldSize: course.worldSize,
      ships
    }
  }
}

export function createChallengeScenario(
  challenge: string,
  course?: string,
  seed = 1234
): { runtime: ChallengeRuntime; worldConfig: WorldConfig } | null {
  if (challenge === "shooting") {
    return {
      runtime: createTargetChallenge(),
      worldConfig: createTargetChallengeConfig(seed)
    }
  }

  if (challenge === "defense") {
    return {
      runtime: createDefenseChallenge(),
      worldConfig: createDefenseChallengeConfig()
    }
  }

  if (challenge === "obstacle") {
    return createObstacleCourseChallenge(resolveObstacleCourseId(course))
  }

  return null
}
import { OBSTACLE_COURSES, resolveObstacleCourseId } from "../../../simpleMode";

const TUTORIAL_LESSON_STARTER_CODE: Record<string, string> = {
  "1": `// Tutorial 1: Basic Movement
// update(ship) runs 60 times per second.
// Goal: make controlled movement instead of drifting forever.

function update(ship) {
  // Two-point patrol using moveTo helper.
  const phase = Math.floor(ship.currentTick() / 180) % 2;
  const waypoint = phase === 0 ? { x: 1200, y: 0 } : { x: -1200, y: 0 };
  ship.moveTo(waypoint.x, waypoint.y);

  // Keep one weapon active so you can see fire/reload behavior.
  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "2": `// Tutorial 2: Steering Practice
// Goal: hold near the center and rotate to inspect heading control.

function update(ship) {
  // Stay near center to avoid endless forward travel.
  ship.moveTo(0, 0);

  // Slow continuous turn while parked near center.
  ship.turn(0.6);

  // Fire on cooldown.
  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "3": `// Tutorial 3: Weapons & Combat
// Goal: act like a stationary turret and fire whenever possible.

function update(ship) {
  // Brake first so recoil/motion does not drift you away.
  ship.brake(1.0);

  // Sweep firing arc.
  ship.turn(1.0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  "4": `// Tutorial 4: Coordination Prep
// Fleet messaging APIs are not wired yet.
// For now, this starter demonstrates stable patrol + fire control.

function update(ship) {
  const phase = Math.floor(ship.currentTick() / 240) % 4;

  if (phase === 0) ship.moveTo(800, 800);
  if (phase === 1) ship.moveTo(-800, 800);
  if (phase === 2) ship.moveTo(-800, -800);
  if (phase === 3) ship.moveTo(800, -800);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,

  default: `// Tutorial starter
// Keep update(ship) defined. It runs every tick.

function update(ship) {
  ship.moveTo(0, 0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`
};

const STANDARD_STARTER_CODE = `// Standard starter
// update(ship) runs every tick.

function update(ship) {
  ship.thrust(1.0);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`;

const DEFENSE_STARTER_CODE = `// Challenge: Perimeter Defense
// Goal: keep the command node at the center safe until the timer expires.

const patrolPoints = [
  { x: -2800, y: -400 },
  { x: 0, y: 2600 },
  { x: 2800, y: -400 },
  { x: 0, y: -2600 }
];

let patrolIndex = 0;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(ship) {
  const target = patrolPoints[patrolIndex];
  const position = ship.position();

  if (distance(position, target) < 350) {
    patrolIndex = (patrolIndex + 1) % patrolPoints.length;
  }

  const nextTarget = patrolPoints[patrolIndex];
  ship.moveTo(nextTarget.x, nextTarget.y);

  // Keep your nose hot while crossing the center lane.
  ship.turn(0.35);

  if (distance(position, { x: 0, y: 0 }) < 2200 && ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`;

function formatWaypointBlock(points: ReadonlyArray<{ x: number; y: number }>) {
  return points.map((point) => `  { x: ${point.x}, y: ${point.y} }`).join(",\n");
}

function createObstacleStarterCode(course?: string) {
  const resolvedCourse = resolveObstacleCourseId(course);
  const courseDef = OBSTACLE_COURSES[resolvedCourse];

  return `// Challenge: ${courseDef.label}
// Goal: clear each gate in order and stay outside the hazard halos.

const waypoints = [
${formatWaypointBlock(courseDef.checkpoints)}
];

let waypointIndex = 0;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update(ship) {
  const position = ship.position();
  const waypoint = waypoints[Math.min(waypointIndex, waypoints.length - 1)];

  if (distance(position, waypoint) < 320 && waypointIndex < waypoints.length - 1) {
    waypointIndex += 1;
  }

  const nextWaypoint = waypoints[Math.min(waypointIndex, waypoints.length - 1)];
  ship.moveTo(nextWaypoint.x, nextWaypoint.y);

  // Bleed speed before the tighter transitions.
  if (distance(position, nextWaypoint) < 900) {
    ship.brake(0.4);
  }
}`;
}

const CHALLENGE_STARTER_CODE: Record<string, string> = {
  shooting: `// Challenge: Target Practice
// Goal: Destroy as many static targets as possible before time runs out.

function update(ship) {
  // Stay controlled and rotate to sweep targets.
  ship.brake(1.0);
  ship.turn(0.9);

  if (ship.reloadTicks(0) === 0) {
    ship.fire(0);
  }
}`,
  defense: DEFENSE_STARTER_CODE,
  default: `// Challenge starter
// Scenario-specific starting code can be added in CHALLENGE_STARTER_CODE.

function update(ship) {
  // TODO: Implement your challenge strategy.
}`
};

export const CHALLENGE_DISPLAY_NAMES: Record<string, string> = {
  shooting: "Target Practice",
  defense: "Perimeter Defense",
  obstacle: "Obstacle Course"
};

export function getStarterCodeForScenario(
  mode: string,
  challenge: string,
  lesson: string,
  course?: string
): string {
  if (mode === "tutorial") {
    return TUTORIAL_LESSON_STARTER_CODE[lesson] ?? TUTORIAL_LESSON_STARTER_CODE.default;
  }

  if (mode === "challenges") {
    if (challenge === "obstacle") {
      return createObstacleStarterCode(course);
    }

    return CHALLENGE_STARTER_CODE[challenge] ?? CHALLENGE_STARTER_CODE.default;
  }

  return STANDARD_STARTER_CODE;
}

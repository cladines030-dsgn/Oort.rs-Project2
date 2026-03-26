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

const CHALLENGE_STARTER_CODE: Record<string, string> = {
  // Challenge-specific templates live here.
  // Add new keys as scenarios are implemented (defense, obstacle, etc).
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
  defense: `// Challenge: Defense (starter placeholder)
// Tip: Keep your ship between threats and the protected zone.

function update(ship) {
  // TODO: Move to patrol position.
  // TODO: Prioritize nearest threat.
}`,
  obstacle: `// Challenge: Obstacle Course (starter placeholder)
// Tip: Balance thrust and turning to avoid collisions.

function update(ship) {
  // TODO: Steer toward checkpoints.
  // TODO: Slow down before tight turns.
}`,
  default: `// Challenge starter
// Scenario-specific starting code can be added in CHALLENGE_STARTER_CODE.

function update(ship) {
  // TODO: Implement your challenge strategy.
}`
};

export const CHALLENGE_DISPLAY_NAMES: Record<string, string> = {
  shooting: "Target Practice",
  defense: "Defense",
  obstacle: "Obstacle Course"
};

export function getStarterCodeForScenario(mode: string, challenge: string, lesson: string): string {
  if (mode === "tutorial") {
    return TUTORIAL_LESSON_STARTER_CODE[lesson] ?? TUTORIAL_LESSON_STARTER_CODE.default;
  }

  if (mode === "challenges") {
    return CHALLENGE_STARTER_CODE[challenge] ?? CHALLENGE_STARTER_CODE.default;
  }

  return STANDARD_STARTER_CODE;
}

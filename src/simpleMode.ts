export function createTargetChallange(sim: any, rng: { next(): number }) {
  let score = 0
  let time = 60
  let spawnTimer = 0
  let done = false

  if (sim.onEntityDestroyed) {
    sim.onEntityDestroyed((e: any) => {
      if (e.type === "target") score += 100
    })
  }

  function spawnTarget() {
    const x = rng.next() * 800 - 400
    const y = rng.next() * 600 - 300

    sim.spawnEntity({
      id: "target-" + Date.now() + "-" + rng.next(),
      type: "target",
      position: { x, y },
      velocity: { x: 0, y: 0 },
      hp: 1
    })
  }

  return {
    update(dt: number) {
      if (done) return
      time -= dt
      spawnTimer += dt
      if (spawnTimer > 1.5) {
        spawnTarget()
        spawnTimer = 0
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
    }
  }
}

// updated engine loop to log scoring as well added simplemode as well
//this file handles spawning targets scoring and time limit
// you get a score in the end 
// super simplifed, hope to make it more complex before submission, mabye make diffrent spawns worth diffrent points? etc etc 
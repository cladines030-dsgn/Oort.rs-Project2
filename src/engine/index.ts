import type { EngineDependencies, EngineSystem, SimulationStateSnapshot, WorldConfig, ShipCommandsApi } from "../contracts"

export interface EngineScheduler {
  requestAnimationFrame(callback: FrameRequestCallback): number
  cancelAnimationFrame(id: number): void
  now(): number
}

function createBrowserScheduler(): EngineScheduler {
  return {
    requestAnimationFrame(callback: FrameRequestCallback): number {
      return window.requestAnimationFrame(callback)
    },
    cancelAnimationFrame(id: number): void {
      window.cancelAnimationFrame(id)
    },
    now(): number {
      return performance.now()
    }
  }
}

export function createEngine(
  dependencies: EngineDependencies,
  scheduler: EngineScheduler = createBrowserScheduler()
): EngineSystem {
  let running = false
  let rafId = -1
  let previousFrameMs = 0
  let accumulatorMs = 0
  const timestepMs = dependencies.timestepSeconds * 1000
  let currentState = dependencies.simulation.getState()
  let previousState = currentState
  const challenge = dependencies.targetChallenge ?? null

  const frame: FrameRequestCallback = () => {
    if (!running) return

    const now = scheduler.now()
    const elapsedMs = Math.max(0, now - previousFrameMs)
    previousFrameMs = now
    accumulatorMs += elapsedMs

    while (accumulatorMs >= timestepMs) {
      const latestState: SimulationStateSnapshot = dependencies.simulation.step(dependencies.timestepSeconds)
      dependencies.combat.resolveTick(latestState)
      challenge?.update(dependencies.timestepSeconds, latestState)
      previousState = currentState
      currentState = latestState
      accumulatorMs -= timestepMs
    }

    dependencies.ui.render({
      state: currentState,
      previousState,
      interpolationAlpha: Math.max(0, Math.min(0.999, accumulatorMs / timestepMs))
    })
    dependencies.ui.renderScriptLogs(dependencies.sandbox.flushLogs())

    if (challenge?.isFinished()) {
      running = false
      scheduler.cancelAnimationFrame(rafId)
      dependencies.ui.updateStatus(`Challenge complete! Score: ${challenge.getScore()}`)
      return
    }

    rafId = scheduler.requestAnimationFrame(frame)
  }

  return {
    start(seed = 1, worldConfig?: WorldConfig): void {
      if (running) return
      running = true
      accumulatorMs = 0
      previousFrameMs = scheduler.now()

      dependencies.simulation.initialize(seed, worldConfig)
      dependencies.combat.initialize()
      dependencies.editor.initialize()

      const source = dependencies.editor.getProgramSource()
      dependencies.sandbox.initialize(source)
      dependencies.simulation.registerShipCodeHook((shipId: number, team: number, api: ShipCommandsApi) => {
        if (team !== 0) return
        dependencies.sandbox.execute(shipId, team, api.currentTick(), api)
      })

      currentState = dependencies.simulation.getState()
      previousState = currentState
      dependencies.ui.updateStatus("Simulation running")
      dependencies.ui.render({
        state: currentState,
        previousState,
        interpolationAlpha: 0
      })
      dependencies.ui.renderScriptLogs(dependencies.sandbox.flushLogs())

      rafId = scheduler.requestAnimationFrame(frame)
    },

    stop(): void {
      if (!running) return
      running = false
      scheduler.cancelAnimationFrame(rafId)
      dependencies.ui.updateStatus("Simulation stopped")
    },

    isRunning(): boolean {
      return running
    }
  }
}
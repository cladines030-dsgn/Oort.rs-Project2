Project Name: Oort.js
Version: 1.0
Last Updated: 2026-03-09

1. Purpose

Oort.js is a browser-based programming strategy simulator inspired by the capabilities of Oort.rs.

The project recreates the core gameplay mechanics of Oort while implementing the system entirely in JavaScript and web-native technologies rather than Rust.

Players will:

Write code that controls spacecraft behavior.

Simulate combat between autonomous fleets.

Visualize battles in real time.

Iteratively improve strategies through programming.

This project prioritizes accessibility, extensibility, and developer friendliness, while maintaining gameplay fidelity.

2. Core Design Principles
2.1 Web-Native First

The entire system must run in a browser using:

JavaScript / TypeScript

Web APIs

WebGL / Canvas rendering

No server-side requirements for core gameplay

2.2 Modularity

All systems must be independently replaceable and extensible, including:

Physics engine

Combat engine

Rendering

UI

Code editor

Simulation loop

2.3 Deterministic Simulation

The simulation must produce the same results when given identical:

ship code

random seed

initial state

This enables:

reproducible battles

tournaments

debugging

2.4 UI Evolvability

The UI must be designed so that it can evolve without breaking core systems.

UI must be treated as a layer, not tightly coupled to the simulation.

3. Core System Architecture

The project is divided into five major subsystems.

/src
  /engine
  /combat
  /simulation
  /ui
  /editor
4. Simulation Engine

The simulation engine governs the game loop.

Requirements

Fixed timestep simulation

Deterministic updates

Independent of rendering speed

Responsibilities

Update physics

Execute ship programs

Resolve combat

Maintain world state

Simulation Loop
while (simulationRunning) {
    processInputs()
    executeShipCode()
    updatePhysics()
    resolveCombat()
    updateGameState()
}
5. Movement System

Ships must support programmable movement using vector-based controls.

Movement Capabilities

Ships must be able to:

Thrust forward

Rotate

Strafe (if applicable)

Brake

Navigate to positions

Core API (Example)
ship.thrust(power)
ship.turn(angle)
ship.setHeading(angle)
ship.moveTo(x, y)
ship.velocity()
ship.position()

Movement must obey physics rules such as:

inertia

acceleration limits

rotational speed limits

6. Combat System

Combat must simulate realistic autonomous engagements.

Weapon Capabilities

Ships may have:

projectiles

missiles

energy weapons

area effects

Combat API
ship.fire(target)
ship.fireAt(x, y)
ship.lockTarget(enemy)
ship.scanEnemies()
ship.health()
Combat Rules

Combat resolution must include:

projectile travel time

collision detection

damage modeling

cooldowns

7. Ship Programming System

Users control ships through code executed every simulation tick.

Execution Model

User code must:

run in a sandbox

execute each tick

access only approved APIs

Example:

function update(ship) {
    const enemies = ship.scanEnemies()

    if (enemies.length > 0) {
        ship.lockTarget(enemies[0])
        ship.fire(enemies[0])
    } else {
        ship.thrust(1)
    }
}
Sandbox Requirements

User code must be isolated using:

Web Workers OR

JavaScript sandboxing

The simulation must remain secure and stable.

8. Code Editor Interface

The interface must include a large programmable code window.

Required Features

syntax highlighting

line numbers

error display

auto formatting

run/reset controls

Recommended editor engine:

Monaco Editor

CodeMirror

Editor Layout
-----------------------------------------
| Code Editor | Simulation Window       |
|             |                         |
|             |                         |
-----------------------------------------
| Logs | Controls | Battle Status       |
-----------------------------------------
9. Visualization System

Battles must be visualized in real time.

Rendering Options

Preferred technologies:

WebGL

Three.js

Canvas 2D (fallback)

Visual Elements

Must include:

ships

projectiles

explosions

sensor ranges

UI overlays

Visualization must not affect simulation determinism.

10. UI System

The UI must support progressive enhancement during development.

Requirements

UI components must be modular.

Possible UI technologies:

Vue

React

Svelte

Vanilla JS components

UI must support future additions such as:

fleet management

tournaments

replays

AI training tools

11. Logging and Debugging

The system must support developer feedback.

Required Debug Features

simulation logs

console output from ship code

performance stats

step-through simulation

Example debug tools:

pause()
stepFrame()
showHitboxes()
showVectors()
12. Extensibility

The system must allow future features including:

multiplayer matches

AI competitions

new ship types

new weapons

scripting languages

All new gameplay features must integrate through clearly defined APIs.

13. Performance Requirements

The system must support:

60 FPS rendering

100+ ships simultaneously

deterministic tick simulation

Performance priorities:

Simulation correctness

Responsiveness

Visual fidelity

14. Development Guidelines
Code Quality

All code must:

be documented

include descriptive naming

avoid global state where possible

Structure

Preferred stack:

JavaScript / TypeScript
WebGL rendering
Modular architecture
Version Control

Development must follow:

feature branches

pull request reviews

continuous testing

15. Security

Because users run code:

ship programs must run in sandboxed execution

the program must not access:

DOM

network

filesystem

browser APIs outside the game API

16. Project Goals

The goal of Oort.js is to create:

a programmable combat simulation

a teaching tool for programming

an extensible sandbox for AI experimentation

17. Non-Goals

The project will not initially include:

server infrastructure

multiplayer networking

persistent player accounts

These may be added later.

18. Guiding Philosophy

The project must prioritize:

Playability

Transparency

Programmability

Extensibility

If design decisions conflict, simplicity and clarity take priority.
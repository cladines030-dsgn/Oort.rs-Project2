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

TypeScript
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


Oort.rs API reference:


Oort expects your code to have a Ship type with a tick method. Each tutorial provides some starter code which includes this:

use oort_api::prelude::*;

pub struct Ship {}

impl Ship {
    pub fn new() -> Ship {
        Ship {}
    }

    pub fn tick(&mut self) {
    }
}

The game will call your new function when a ship is created and then call tick 60 times per second during the simulation.

struct Ship is useful for storing any state that needs to persist between ticks. enum Ship works too and can be helpful when this state differs between ship classes.

The statement use oort_api::prelude::* imports all the APIs so that you can use them simply as e.g. position(). See the prelude module documentation for the details on everything this imports. The important APIs are covered below.
Subsystems

All actions performed by a ship (such as firing weapons or scanning the radar) occur between ticks. In particular, setting the radar heading or the radio channel will affect the scan results or messages received on the next tick.
Ship Status and Control

Basic status:

    class() → Class: Get the ship class (Fighter, Cruiser, etc).
    position() → Vec2: Get the current position in meters.
    velocity() → Vec2: Get the current velocity in m/s.
    heading() → f64: Get the current heading in radians.
    angular_velocity() → f64: Get the current angular velocity in radians/s.
    health() → f64: Get the current health.
    fuel() → f64: Get the current fuel (delta-v).

Engine control:

    accelerate(acceleration: Vec2): Accelerate the ship. Units are m/s².
    turn(speed: f64): Rotate the ship. Unit is radians/s.
    torque(acceleration: f64): Angular acceleration. Unit is radians/s².

Engine limits:

    max_forward_acceleration() -> f64: Maximum forward acceleration.
    max_backward_acceleration() -> f64: Maximum backward acceleration.
    max_lateral_acceleration() -> f64: Maximum lateral acceleration.
    max_angular_acceleration() -> f64: Maximum angular acceleration.

Weapons

    fire(index: usize): Fire a weapon (gun or missile).
    aim(index: usize, angle: f64): Aim a weapon (for weapons on a turret).
    reload_ticks(index: usize) -> u32: Number of ticks until the weapon is ready to fire.
    explode(): Self-destruct.

Radar

Radar in Oort is modeled as a beam that can be pointed in any direction and which has a beam width between 1/720 to 1/4 of a circle (min 1/3600 for frigates and cruisers). Enemy ships illuminated by this beam reflect an amount of energy proportional to their radar cross section (larger for larger ships). The radar can return one contact per tick. Any changes to radar heading/width/filtering take effect on the next tick.

The position and velocity returned for a contact will have error inversely related to the signal strength.

Basic operation:

    set_radar_heading(angle: f64): Point the radar at the given heading.
    set_radar_width(width: f64): Adjust the beam width (in radians).
    scan() → Option<ScanResult>: Get the radar contact with the highest signal strength.
    struct ScanResult { position: Vec2, velocity: Vec2, class: Class }: Structure returned by scan.

Advanced filtering:

    set_radar_min_distance(dist: f64): Set the minimum distance filter.
    set_radar_max_distance(dist: f64): Set the maximum distance filter.

Electronic Counter Measures (ECM):

The goal of ECM is to make enemy radar less effective. For ECM to work, the enemy radar must be pointed towards your ship, and your ship’s radar must be pointed at the enemy. Your radar will not return contacts while ECM is enabled.

    EcmMode:
        EcmMode::None: No ECM, radar will operate normally.
        EcmMode::Noise: Decrease the enemy radar’s signal to noise ratio, making it more difficult to detect targets and reducing accuracy of returned contacts.
    set_radar_ecm_mode(mode: EcmMode): Set the ECM mode.

Retrieving current state:

    radar_heading() -> f64: Get current radar heading.
    radar_width() -> f64: Get current radar width.
    radar_min_distance() -> f64: Get current minimum distance filter.
    radar_max_distance() -> f64: Get current maximum distance filter.

Multiple radars:

Most ships have a single radar except for cruisers which have two.

    select_radar(index: usize): Select the radar to control with subsequent API calls.

Radio

The radio can be used to send or receive a [f64; 4] message per tick. There are 10 channels available (0 to 9), shared between all teams.

    set_radio_channel(channel: usize): Change the radio channel. Takes effect next tick.
    get_radio_channel() -> usize: Get the radio channel.
    send(data: [f64; 4]): Send a message on a channel.
    receive() -> Option<[f64; 4]>: Receive a message from the channel. The message with the strongest signal is returned.
    send_bytes(data: &[u8]): Send a message on a channel as bytes, the data will be zero-filled or truncated to a length of 32 bytes.
    receive_bytes() -> Option<[u8; 32]>: Just like receive, but instead the message will be returned as a byte array.
    select_radio(index: usize): Select the radio to control with subsequent API calls. Frigates have 4 radios and cruisers have 8.

Special Abilities

Some ship classes have a unique special ability. These abilities need to be activated, after which they will function for a short time before needing to reload. An ability can be deactivated early via the API. If an ability is activated and never deactivated, then it will automatically start back up again after its reload time passes.

    activate_ability(ability: Ability): Activates a special ability.
    deactivate_ability(ability: Ability): Deactivates a ship’s special ability.
    active_abilities() → ActiveAbilities: Returns the ship’s active abilities.
    Available abilities:
        Ability::Boost: Fighter and missile only. Applies a 100 m/s² forward acceleration for 2s. Reloads in 10s.
        Ability::Decoy: Torpedo only. Mimics the radar signature of a Cruiser for 0.5s. Reloads in 10s.
        Ability::Shield: Cruiser only. Deflects damage for 1s. Reloads in 5s.

Scalar Math

    PI, TAU: Constants.
    x.abs(): Absolute value.
    x.sqrt(): Square root.
    x.sin(), x.cos(), x.tan(): Trigonometry.

See the Rust documentation for the full list of f64 methods.
Vector Math

Two-dimensional floating point vectors (Vec2) are ubiquitous in Oort and are used to represent positions, velocities, accelerations, etc.

    vec2(x: f64, y: f64) → Vec2: Create a vector.
    v.x, v.y → f64: Get a component of a vector.
    v1 +- v2 → Vec2: Basic arithmetic between vectors.
    v */ f64 → Vec2: Basic arithmetic between vectors and scalars.
    -v → Vec2: Negate a vector.
    v.length() → f64: Length.
    v.normalize() → Vec2: Normalize to a unit vector.
    v.rotate(angle: f64) → Vec2: Rotate counter-clockwise.
    v.angle() → f64: Angle of a vector.
    v1.dot(v2: Vec2) → f64: Dot product.
    v1.distance(v2: Vec2) → f64: Distance between two points.

The entire maths_rs crate is also available.
Debugging

Clicking on a ship in the UI displays status information and graphics indicating its acceleration, radar cone, etc. You can add to this with the functions below.

    debug!(...): Add status text.
    draw_line(v0: Vec2, v1: Vec2, color: u32): Draw a line.
    draw_triangle(center: Vec2, radius: f64, color: u32): Draw a triangle.
    draw_square(center: Vec2, radius: f64, color: u32): Draw a square.
    draw_diamond(center: Vec2, radius: f64, color: u32): Draw a diamond.
    draw_polygon(center: Vec2, radius: f64, sides: i32, angle: f64, color: u32): Draw a regular polygon.
    draw_text!(topleft: Vec2, color: u32, ...): Draw text.

Entering debug mode by pressing the ‘g’ key also displays debug graphics from all ships.
Miscellaneous

    current_tick() → u32: Returns the number of ticks elapsed since the simulation started.
    current_time() → f64: Returns the number of seconds elapsed since the simulation started.
    angle_diff(a: f64, b: f64) → f64: Returns the shortest (possibly negative) distance between two angles.
    rand(low: f64, high: f64) → f64: Get a random number.
    seed() → u128: Returns a seed useful for initializing a random number generator.
    scenario_name() → &str: Returns the name of the current scenario.
    world_size() → f64: Returns the width of the world in meters.
    id() → u32: Returns a per-ship ID that is unique within a team.
    TICK_LENGTH: Length of a single game tick in seconds. There are 60 ticks per second.

Extra Crates

The following crates are available for use in your code:

    byteorder: Utilities to read and write binary data, useful for radio.
    maths_rs: A linear algebra library.
    oorandom: A random number generation library.

Ship Classes

    Fighter: Small, fast, and lightly armored.
        Health: 100
        Acceleration: Forward: 60 m/s², Lateral: 30 m/s², Reverse: 30 m/s², Angular: 2π rad/s²
        Weapon 0: Gun, Speed: 1000 m/s, Reload: 66ms
        Weapon 1: Missile, Reload: 5s
    Frigate: Medium size with heavy armor and an extremely powerful main gun.
        Health: 10000
        Acceleration: Forward: 10 m/s², Lateral: 5 m/s², Reverse: 5 m/s², Angular: π/4 rad/s²
        Weapon 0: Gun, Speed: 4000 m/s, Reload: 2 seconds
        Weapon 1: Gun, Speed: 1000 m/s, Reload: 66ms, Turreted
        Weapon 2: Gun, Speed: 1000 m/s, Reload: 66ms, Turreted
        Weapon 3: Missile, Reload: 2s
    Cruiser: Large, slow, and heavily armored. Rapid fire missile launchers and devastating torpedos.
        Health: 20000
        Acceleration: Forward: 5 m/s², Lateral: 2.5 m/s², Reverse: 2.5 m/s², Angular: π/8 rad/s²
        Weapon 0: Gun, Speed: 2000 m/s, Burst size: 6, Reload: 5s, Turreted
        Weapon 1: Missile, Reload: 1.2s
        Weapon 2: Missile, Reload: 1.2s
        Weapon 3: Torpedo, Reload: 3s
    Missile: Highly maneuverable but unarmored. Explodes on contact or after an explode call.
        Health: 20
        Fuel: 2000 m/s
        Acceleration: Forward: 300 m/s², Reverse: 0 m/s², Lateral: 100 m/s², Angular: 4π rad/s²
    Torpedo: Better armor, larger warhead, but less maneuverable than a missile. Explodes on contact or after an explode call.
        Health: 100
        Fuel: 3000 m/s
        Acceleration: Forward: 70 m/s², Reverse: 0 m/s², Lateral: 20 m/s², Angular: 2π rad/s²

Modules

prelude
    All APIs.

Macros

debug
    Adds text to be displayed when the ship is selected by clicking on it.
draw_text
    Adds text to be drawn in the world, visible in debug mode.

Structs

ActiveAbilities
    List of active abilities for an entity.
ClassStats
    Stats for a class of ship

Enums

Ability
    Special abilities available to different ship classes.
Class
    Identifiers for each class of ship.
EcmMode
    Electronic Counter Measures (ECM) modes.
SystemState

Constants

ABILITIES
    Array of all ability types.
MAX_ENVIRONMENT_SIZE

Type Aliases

Message
    Message sent and received on the radio.
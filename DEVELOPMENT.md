# Firefighter Game — Development Log

## Step 1 — Basic Game Engine

### Goal

Create the basic underlying Firefighter game mechanics before adding the
variable-cost system, solver, or browser interface.

### Implemented

- Created a `FirefighterGame` class.
- Added game initialisation using `__init__`.
- Represented the graph using an adjacency dictionary.
- Added a set of burning vertices.
- Added a set of defended vertices.
- Implemented basic vertex defence.
- Implemented fire spreading to adjacent undefended vertices.
- Created a basic test demonstrating that defending a vertex prevents the fire
  from spreading to it.

### Current Game Model

The game currently represents:

- `graph` — the graph structure.
- `burning` — the currently burning vertices.
- `defended` — the vertices that have been defended.

### Example Graph

The graph is currently represented using an adjacency dictionary.

For example:

```python
graph = {
    "A": ["B"],
    "B": ["A", "C"],
    "C": ["B"]
}
```

## Step 2 — Timestep System

### Goal

Introduce discrete timesteps
- Add a `turn` variable.
- Add a `step()` method to handle one complete timestep.
- Decide when the game ends.
- Test the timestep system before adding variable costs.


### Timestep Structure

START OF TURN
↓
Player sees the current fire
↓
Player chooses a vertex to defend
↓
Defence is applied
↓
Fire spreads
↓
TURN ENDS
↓
Next timestep

### Implemented

- Added a `turn` variable.
- Added a `step()` method to handle one complete timestep.
- Added a game-ending condition for when the fire can no longer spread.
- Created `simulation.py` to simulate multiple turns and display the game state.
- Tested the timestep system through the simulation.

### Current Game Model

The game now tracks:

- `graph` — the graph structure.
- `burning` — the currently burning vertices.
- `defended` — the vertices that have been defended.
- `turn` — the current timestep.

### Next Step

Add the variable defence-cost system

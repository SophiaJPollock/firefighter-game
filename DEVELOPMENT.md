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

## Step 3 — Variable Defence Costs

### Goal

Introduce defence costs that vary depending on the current state of the fire.
- Add a budget of 3 per timestep.
- Add a cost to each vertex.
- Calculate costs based on fire distance in Cost-Based Mode.
- Add Random-Cost Mode.
- Prevent the player from defending a vertex they cannot afford.
- Deduct the defence cost from the current budget.
- Display the current cost and remaining budget.

### Budget

- The player starts with a budget of 3.
- 3 budget is added at the start of every timestep.
- Unused budget carries over between timesteps.
- The player can save budget for more expensive defences.
- A defence can only be made if the player has enough budget to pay its current cost.

### Cost-Based Mode

The cost of defending a vertex depends on its distance from the current fire:

- 3 — vertex is directly adjacent to the fire.
- 2 — vertex is two edges away from the fire.
- 1 — vertex is three or more edges away from the fire.

### Random-Cost Mode

A second mode randomly assigns each vertex a cost of 1, 2, or 3.

The costs are assigned when the game starts and remain fixed throughout the game.

### Implemented

- Added `cost_mode` to `__init__()` to select between distance and random costs.
- Added `budget` to the game state.
- Added `costs` to store calculated defence costs.
- Added `calculate_distance_costs(vertex)`.
- Added `calculate_random_costs(vertex)`.
- Added `calculate_costs(vertex)` to select the appropriate cost calculation.
- Updated `defend()` to:
  - calculate the defence cost,
  - check whether the player can afford it,
  - deduct the cost from the budget,
  - prevent unaffordable defences.
- Updated `step()` to add 3 budget for the next timestep.
- Updated the simulation to display defence costs and budget during the game.

### Current Turn Structure

START OF TURN
↓
Player has current budget
↓
Player chooses a vertex to defend
↓
Defence cost is checked
↓
Cost is deducted from budget
↓
Defence is applied
↓
Fire spreads
↓
TURN ENDS
↓
3 budget is added for the next turn
↓
Next timestep

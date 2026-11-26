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

## Step 3.1 — Variable Defence Costs

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

## Step 3.2 — Automated Testing

### Goal

Create automated tests for each development step to make sure new features do not break previous implementations. (Getting hard to keep track of everything in simulation)

### Implemented

- Created a separate test file for each development step.
- Each test file covers the main aims and functionality implemented in that step.
- Tests were added to keep track of which parts of the game are working as new features are added.

## Step 4.1 — Backend API

### Goal
Connect the Python game engine to a frontend.

### Implemented
- Created `backend/api.py` using Python's built-in HTTP server.
- Added endpoints for getting the game state, defending vertices, ending turns and restarting.
- Sent vertex states, defence costs, budget and turn information to the frontend.

## Step 4.2 — React Frontend

### Goal
Get a playable React frontend working with the existing backend.

### Development
- Initially created a basic React prototype using React Flow.
- The first version displayed a graph but the buttons were not properly functional.
- Replaced with a simpler, interactive grid.
- Connected React to the Python API.
- Added vertex selection, defence costs, game statistics and working buttons.
- Used colours and symbols to show burning, defended and safe vertices.

## Step 4.3 — Grid Graph and Gameplay Improvements

### Grid Graph
- Created `backend/graphs/grid.py`.
- Added a function to generate rectangular grid graphs.
- Used a 5×5 grid for the current game.
- Kept graph generation separate from the game logic so other graph types can be added later.

### Multiple Defences Per Turn
Noticed a bug where it automatically ended the turn after defending one vertex, even if there was budget remaining.

To fix this:
- Added `end_turn()` to `game.py`.
- Separated defending vertices from spreading fire.
- Allowed multiple defences per turn within the available budget.
- Added separate Defend and End Turn buttons.
- Updated the API to support these actions.
- Fixed the budget increase to use `budget_per_turn`.
- Prevented defending the same vertex twice.

### Cleanup
- Removed the unused React Flow dependency.
- Removed unnecessary frontend assets.
- Updated `.gitignore`.
- Removed the old `/api/move` endpoint.
- Removed the automated tests for now, with manual gameplay testing used during development.
- Removed outdated simulation.py from backend

## Current State

The game now has a playable React frontend connected to the Python backend.

Current settings:
- 5×5 grid.
- Fire starts at vertex 0.
- Starting budget of 3.
- Budget increases by 3 each turn.
- Distance-based defence costs.
- Multiple defences allowed per turn.
- Fire spreads when the player ends the turn.

## Next Steps
- Add settings for grid size and starting conditions.
- Allow different defence cost modes.
- Consider supporting other graph types.
- Add solver

## Step 7 — Initial CP-SAT Solver

### Goal

Find a defence strategy that saves as many vertices as possible.

### Implemented

- Added `backend/solver/cpsat.py` using Google OR-Tools CP-SAT.
- Expressed the existing game rules as CP-SAT constraints so the solver could search for a defence plan.
- Replayed the solver's chosen moves through `FirefighterGame` to check that the final number of vertices saved matched the model's result.
- The first run on a 3×3 grid returned `OPTIMAL` and saved 6 of 9 vertices.

### Budget Change

Updated both the game and the solver so the budget resets at the start of each new turn. With the current settings, the player gets a fresh 3 points each turn and any unused points expire.

## Step 8: Main Menu

**Visual Design:**
- Designed an 8-bit pixel-art style with a firefighter title and Play button.
- Created a forest background with layered trees, a night sky and animated campfire.
- Adjusted the colours, fonts and layout.

**Implementation:**
- Created the React components and CSS for the main menu.
- Connected the Play button to the next screen.

## Step 9: Game Settings

**Visual Design:**
- Designed a settings window matching the main menu's style.
- Added matching buttons, fonts and colours.

**Implementation:**
- Created the Game Settings screen.
- Added distance-based and random defence cost options.
- Updated the backend to support the selected cost mode.
- Connected the settings screen to the game.

## Step 10: Graph Generation

- Decided to replace the original grid with more general graph structures.
- Created a graph generator producing connected graphs with varying vertex degrees.
- Generated three 25-vertex graph presets, with a maximum degree of four.
- Saved the graphs as JSON files.
- Updated the backend API to load the selected graph.
- Added graph preset selection to Game Settings.

## Step 11: Graph Visualisation

**Visual Design:**
- Chose three visualisations: force-directed, fire-centred radial and tree-style.
- Kept the graph structure identical across layouts.
- Used dashed lines to distinguish additional connections in the tree-style layout.

**Implementation:**
- Created the `GraphView` React component.
- Implemented the three layout algorithms.
- Added clickable vertices displaying their numbers, defence costs and status.
- Added layout selection to Game Settings.
- Connected the graph visualisations to the existing gameplay.
- Removed the original grid display from the frontend.

## Step 12 – Gameplay interface redesign

- Applied the existing pixel-art forest background to the gameplay screen.
- Reused the animated Firefighter logo and campfire.
- Redesigned the graph panel, game controls and statistics.
- Introduced consistent pixel fonts, colours and button styling.
- Replaced circular vertices with pixel-art shapes.
- Created animated fire and shield sprites for burning and defended vertices.
- Experimented with tree sprites before removing them to improve readability.
- Enlarged and centred defence costs within undefended vertices.

## Step 13 – Cytoscape graph layouts

- Installed Cytoscape.js to replace the custom graph layout algorithms.
- Separated layout calculations into GraphLayouts.js.
- Implemented three layouts using Cytoscape:
  - Force-directed (CoSE).
  - Radial (concentric).
  - Tree-style (breadth-first).
- Retained custom SVG rendering to preserve the visual design.
- Increased the minimum spacing between vertices to improve readability.
- Allowed the graph display to expand and scroll when additional space is required.
- Changed layout calculations to depend on graph structure rather than game state, keeping vertex positions stable between turns.

## Step 14 – Gameplay interface improvements

- Added a back button to return to the game setup screen.
- Added confirmation before leaving an unfinished game.
- Improved the visual distinction between enabled and disabled buttons.
- Improved the hierarchy of headings and instructional text.
- Added a clearer game-over display showing the number of vertices saved and burned.
- Changed the displayed terminology from safe to undefended to better represent the vertex state.
- Retained the existing backend functionality and internal vertex statuses.
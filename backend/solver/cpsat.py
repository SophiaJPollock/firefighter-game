
from collections import deque

from ortools.sat.python import cp_model

from backend.game import FirefighterGame
from backend.graphs.grid import make_grid


# Graph distances:
def distances_from(graph, start):
    distances = {start: 0}
    queue = deque([start])

    while queue:
        current = queue.popleft()

        for neighbour in graph[current]:
            if neighbour not in distances:
                distances[neighbour] = distances[current] + 1
                queue.append(neighbour)

    return distances


# Find best defence plan:
def solve_game(game, time_limit=30):

    if game.cost_mode != "distance":
        raise ValueError("Only distance costs supported for now.")

    if not game.burning:
        raise ValueError("At least one vertex must be burning.")

    graph = game.graph
    vertices = list(graph)

    # Maximum turns needed:
    horizon = len(vertices) - len(game.burning)

    distances = {
        v: distances_from(graph, v)
        for v in vertices
    }

    incoming = {v: [] for v in vertices}

    for vertex, neighbours in graph.items():
        for neighbour in neighbours:
            incoming[neighbour].append(vertex)

    model = cp_model.CpModel()

    # Game variables:
    burning = {
        (v, t): model.NewBoolVar(f"burn_{v}_{t}")
        for v in vertices
        for t in range(horizon + 1)
    }

    defended = {
        (v, t): model.NewBoolVar(f"protected_{v}_{t}")
        for v in vertices
        for t in range(horizon + 1)
    }

    defend = {
        (v, t): model.NewBoolVar(f"choose_{v}_{t}")
        for v in vertices
        for t in range(horizon)
    }

    max_budget = game.budget + horizon * game.budget_per_turn

    budget = [
        model.NewIntVar(0, max_budget, f"budget_{t}")
        for t in range(horizon + 1)
    ]

    model.Add(budget[0] == game.budget)

    # Starting state:
    for v in vertices:
        model.Add(burning[v, 0] == int(v in game.burning))
        model.Add(defended[v, 0] == int(v in game.defended))

    # Turn rules:
    for t in range(horizon):
        costs_this_turn = []

        for v in vertices:

            # Defend once:
            model.Add(defend[v, t] + defended[v, t] <= 1)
            model.Add(defend[v, t] + burning[v, t] <= 1)

            model.Add(
                defended[v, t + 1]
                == defended[v, t] + defend[v, t]
            )

            # Fire spread:
            model.Add(burning[v, t + 1] >= burning[v, t])

            for u in incoming[v]:
                model.Add(
                    burning[v, t + 1]
                    >= burning[u, t] - defended[v, t + 1]
                )

            model.Add(
                burning[v, t + 1]
                <= burning[v, t]
                + sum(burning[u, t] for u in incoming[v])
            )

            model.Add(
                burning[v, t + 1] + defended[v, t + 1] <= 1
            )

            # Distance costs:
            distance_1 = [
                u for u, d in distances[v].items()
                if d == 1
            ]

            distance_2 = [
                u for u, d in distances[v].items()
                if 1 <= d <= 2
            ]

            near_1 = model.NewBoolVar(f"near1_{v}_{t}")
            near_2 = model.NewBoolVar(f"near2_{v}_{t}")

            if distance_1:
                model.AddMaxEquality(
                    near_1,
                    [burning[u, t] for u in distance_1]
                )
            else:
                model.Add(near_1 == 0)

            if distance_2:
                model.AddMaxEquality(
                    near_2,
                    [burning[u, t] for u in distance_2]
                )
            else:
                model.Add(near_2 == 0)

            charged_1 = model.NewBoolVar(f"charge1_{v}_{t}")
            charged_2 = model.NewBoolVar(f"charge2_{v}_{t}")

            model.AddMultiplicationEquality(
                charged_1, [defend[v, t], near_1]
            )

            model.AddMultiplicationEquality(
                charged_2, [defend[v, t], near_2]
            )

            costs_this_turn.extend([
                defend[v, t],
                charged_1,
                charged_2,
            ])

        # Budget:
        total_cost = sum(costs_this_turn)

        model.Add(total_cost <= budget[t])

        model.Add(
            budget[t + 1]
            == budget[t] - total_cost + game.budget_per_turn
        )

    # Maximise saved vertices:
    model.Minimize(
        sum(burning[v, horizon] for v in vertices)
    )

    # Run solver:
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit

    status = solver.Solve(model)
    status_name = solver.StatusName(status)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": status_name,
            "turns": [],
            "saved": None,
        }

    # Check using existing game:
    replay = FirefighterGame(
        graph=graph,
        burning=game.burning,
        defended=game.defended,
        cost_mode="distance",
        budget=game.budget,
        budget_per_turn=game.budget_per_turn,
    )

    turns = []

    for t in range(horizon):
        if replay.is_game_over():
            break

        moves = [
            v for v in vertices
            if solver.Value(defend[v, t])
        ]

        for v in moves:
            replay.defend(v)

        replay.end_turn()
        turns.append(moves)

    saved = len(vertices) - len(replay.burning)
    expected = len(vertices) - round(solver.ObjectiveValue())

    if saved != expected:
        raise RuntimeError(
            "Solver result disagrees with game.py."
        )

    return {
        "status": status_name,
        "turns": turns,
        "saved": saved,
    }


# Test solver:
if __name__ == "__main__":

    game = FirefighterGame(
        graph=make_grid(3, 3),
        burning=[0],
        budget=3,
        budget_per_turn=3,
        cost_mode="distance",
    )

    result = solve_game(game)

    print("Solver status:", result["status"])
    print("Vertices saved:", result["saved"])

    for turn, moves in enumerate(result["turns"]):
        print(
            f"Turn {turn}: defend {moves}, then spread fire"
        )

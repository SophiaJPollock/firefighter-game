from copy import deepcopy

import networkx as nx
from ortools.sat.python import cp_model

from backend.game import FirefighterGame


# Find best defence plan:
def solve_game(game, time_limit=30):
    vertices = list(game.graph)
    horizon = len(vertices) - len(game.burning)

    # Check if game already finished:
    if game.is_game_over():
        saved = len(vertices) - len(game.burning)

        return {
            "status": "OPTIMAL",
            "turns": [],
            "saved": saved,
            "upper_bound": saved,
            "runtime": 0.0,
        }

    # Graph structure:
    graph = game.network

    incoming = {
        v: list(graph.predecessors(v))
        for v in vertices
    }

    # Distance costs:
    if game.cost_mode == "distance":
        distances = {
            v: nx.single_source_shortest_path_length(
                graph, v, cutoff=2
            )
            for v in vertices
        }

        distance_1 = {
            v: [u for u, d in distances[v].items() if d == 1]
            for v in vertices
        }

        distance_2 = {
            v: [u for u, d in distances[v].items() if 1 <= d <= 2]
            for v in vertices
        }

    # Random costs:
    else:
        random_costs = {
            v: game.calculate_random_costs(v)
            for v in vertices
            if v not in game.burning
        }

    # Create model:
    model = cp_model.CpModel()

    # Burning vertices:
    burning = {
        (v, t): model.NewBoolVar(f"burn_{v}_{t}")
        for v in vertices
        for t in range(horizon + 1)
    }

    # Defended vertices:
    defended = {
        (v, t): model.NewBoolVar(f"protected_{v}_{t}")
        for v in vertices
        for t in range(horizon + 1)
    }

    # Defence decisions:
    defend = {
        (v, t): model.NewBoolVar(f"choose_{v}_{t}")
        for v in vertices
        for t in range(horizon)
    }

    # Starting state:
    for v in vertices:
        model.Add(burning[v, 0] == int(v in game.burning))
        model.Add(defended[v, 0] == int(v in game.defended))

    # Turn rules:
    for t in range(horizon):
        costs_this_turn = []

        for v in vertices:

            # Defend only safe vertices:
            model.Add(defend[v, t] + defended[v, t] <= 1)
            model.Add(defend[v, t] + burning[v, t] <= 1)

            # Defended vertices stay defended:
            model.Add(
                defended[v, t + 1]
                == defended[v, t] + defend[v, t]
            )

            # Burning vertices stay burning:
            model.Add(burning[v, t + 1] >= burning[v, t])

            # Fire spreads to undefended neighbours:
            for u in incoming[v]:
                model.Add(
                    burning[v, t + 1]
                    >= burning[u, t] - defended[v, t + 1]
                )

            # Fire cannot appear without a burning neighbour:
            model.Add(
                burning[v, t + 1]
                <= burning[v, t]
                + sum(burning[u, t] for u in incoming[v])
            )

            # Burning and defended are mutually exclusive:
            model.Add(
                burning[v, t + 1] + defended[v, t + 1] <= 1
            )

            # Random defence costs:
            if game.cost_mode == "random":
                costs_this_turn.append(
                    random_costs.get(v, 0) * defend[v, t]
                )

            # Distance defence costs:
            else:
                near_1 = model.NewBoolVar(f"near1_{v}_{t}")
                near_2 = model.NewBoolVar(f"near2_{v}_{t}")

                if distance_1[v]:
                    model.AddMaxEquality(
                        near_1,
                        [burning[u, t] for u in distance_1[v]]
                    )
                else:
                    model.Add(near_1 == 0)

                if distance_2[v]:
                    model.AddMaxEquality(
                        near_2,
                        [burning[u, t] for u in distance_2[v]]
                    )
                else:
                    model.Add(near_2 == 0)

                # Additional distance charges:
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

        # Budget per turn:
        budget = game.budget if t == 0 else game.budget_per_turn

        model.Add(sum(costs_this_turn) <= budget)

    # Maximise saved vertices:
    model.Maximize(
        sum(1 - burning[v, horizon] for v in vertices)
    )

    # Run solver:
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit

    status = solver.Solve(model)
    status_name = solver.StatusName(status)

    # Check solution exists:
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": status_name,
            "turns": [],
            "saved": None,
            "upper_bound": None,
            "runtime": solver.WallTime(),
        }

    # Replay using existing game:
    replay = deepcopy(game)
    turns = []

    for t in range(horizon):
        if replay.is_game_over():
            break

        played = []

        for v in vertices:
            if replay.is_game_over():
                break

            if solver.Value(defend[v, t]):
                replay.defend(v)
                played.append(v)

        turns.append(played)

        if not replay.is_game_over():
            replay.end_turn()

    # Verify solution:
    saved = len(vertices) - len(replay.burning)

    if saved != round(solver.ObjectiveValue()):
        raise RuntimeError(
            "Solver result disagrees with game.py."
        )

    # Return result:
    return {
        "status": status_name,
        "turns": turns,
        "saved": saved,
        "upper_bound": solver.BestObjectiveBound(),
        "runtime": solver.WallTime(),
    }


# Test solver:
if __name__ == "__main__":
    graph = nx.to_dict_of_lists(nx.cycle_graph(9))

    for cost_mode in ("distance", "random"):
        game = FirefighterGame(
            graph=graph,
            burning=[0],
            cost_mode=cost_mode,
        )

        result = solve_game(game)

        print("\nCost mode:", cost_mode)
        print("Solver status:", result["status"])
        print("Vertices saved:", result["saved"])
        print("Upper bound:", result["upper_bound"])
        print("Runtime:", result["runtime"], "seconds")

        for turn, moves in enumerate(result["turns"]):
            print(f"Turn {turn}: defend {moves}")
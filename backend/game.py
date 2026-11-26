import random
import networkx as nx


class FirefighterGame:

    def __init__(
        self,
        graph,
        burning=None,
        defended=None,
        cost_mode="distance",
        budget=3,
        budget_per_turn=3,
    ):
        self.graph = {
            vertex: list(neighbours)
            for vertex, neighbours in graph.items()
        }

        # Validate graph:
        for neighbours in self.graph.values():
            for neighbour in neighbours:
                if neighbour not in self.graph:
                    raise ValueError("Unknown neighbour.")

        self.network = nx.DiGraph(self.graph)

        self.burning = set(burning or [])
        self.defended = set(defended or [])

        if not self.burning.issubset(self.graph):
            raise ValueError("Unknown burning vertex.")

        if not self.defended.issubset(self.graph):
            raise ValueError("Unknown defended vertex.")

        if self.burning & self.defended:
            raise ValueError("Vertex cannot be burning and defended.")

        if cost_mode not in ("distance", "random"):
            raise ValueError("Invalid cost mode.")

        if budget < 0 or budget_per_turn < 0:
            raise ValueError("Budget cannot be negative.")

        self.turn = 0
        self.budget = budget
        self.budget_per_turn = budget_per_turn
        self.cost_mode = cost_mode
        self.costs = {}

    # Defend vertex:
    def defend(self, vertex):
        if vertex not in self.graph:
            raise ValueError("Unknown vertex.")

        if vertex in self.burning:
            raise ValueError("Cannot defend a burning vertex.")

        if vertex in self.defended:
            raise ValueError("Vertex is already defended.")

        cost = self.calculate_costs(vertex)

        if cost > self.budget:
            raise ValueError("Not enough budget.")

        self.budget -= cost
        self.defended.add(vertex)

    # Spread fire:
    def spread_fire(self):
        new_burning = set(self.burning)

        for vertex in self.burning:
            new_burning.update(
                neighbour
                for neighbour in self.graph[vertex]
                if neighbour not in self.defended
            )

        self.burning = new_burning

    # End turn:
    def end_turn(self):
        self.spread_fire()
        self.turn += 1
        self.budget = self.budget_per_turn

    # Distance defence costs:
    def calculate_distance_costs(self, vertex):
        if vertex in self.burning:
            return None

        distances = nx.single_source_shortest_path_length(
            self.network, vertex, cutoff=2
        )

        distance = min(
            (distances[v] for v in self.burning if v in distances),
            default=float("inf"),
        )

        if distance == 1:
            return 3

        if distance == 2:
            return 2

        return 1

    # Random defence costs:
    def calculate_random_costs(self, vertex):
        if vertex in self.burning:
            return None

        if vertex not in self.costs:
            self.costs[vertex] = random.randint(1, 3)

        return self.costs[vertex]

    # Calculate defence costs:
    def calculate_costs(self, vertex):
        if self.cost_mode == "random":
            return self.calculate_random_costs(vertex)

        return self.calculate_distance_costs(vertex)

    # Game state:
    def is_game_over(self):
        return not any(
            neighbour not in self.burning
            and neighbour not in self.defended
            for vertex in self.burning
            for neighbour in self.graph[vertex]
        )
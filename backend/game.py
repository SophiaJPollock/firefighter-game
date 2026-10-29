import random

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
        
        for vertex, neighbours in self.graph.items():
            for neighbour in neighbours:
                if neighbour not in self.graph:
                    raise ValueError(
                        f"Vertex {vertex} references unknown "
                        f"neighbour {neighbour}."
                    )

        self.burning = set(burning or [])
        self.defended = set(defended or [])

        if not self.burning.issubset(self.graph):
            raise ValueError("Burning vertices must exist in the graph.")

        if not self.defended.issubset(self.graph):
            raise ValueError("Defended vertices must exist in the graph.")

        if self.burning & self.defended:
            raise ValueError("A vertex cannot be both burning and defended.")
        
        self.turn = 0
        self.budget = budget
        self.budget_per_turn = budget_per_turn
        self.cost_mode = cost_mode
        self.costs = {}
        
        if cost_mode not in ("distance", "random"):
            raise ValueError("Invalid cost mode.")

        if budget < 0 or budget_per_turn < 0:
            raise ValueError("Budget values cannot be negative.")
    
    # Spreading & Blocking Fire:
    def defend(self, vertex):
        
        # Must exist in graph
        if vertex not in self.graph:
            raise ValueError("Unknown vertex.")
        
        # Cannot be already burning
        if vertex in self.burning:
            raise ValueError("Cannot defend a burning vertex.")
        
        # Cannot be already defended
        if vertex in self.defended:
            raise ValueError("Vertex is already defended.")

        # Cannot cost more than budget
        cost = self.calculate_costs(vertex)
        
        if cost > self.budget:
            raise ValueError("Not enough budget to defend this vertex.")
        
        self.budget -= cost
        self.defended.add(vertex)
        
    def spread_fire(self):
        new_burning = set(self.burning)

        for vertex in self.burning:
            for neighbour in self.graph[vertex]:
                if neighbour not in self.defended:
                    new_burning.add(neighbour)

        self.burning = new_burning
    
    # End turn:
    def end_turn(self):
        self.spread_fire()
        self.turn += 1
        self.budget += self.budget_per_turn

    # Defend and end turn:
    def step(self, vertex):
        self.defend(vertex)
        self.end_turn()
    
    # Defence Costs:
    def calculate_distance_costs(self, vertex):

        if vertex in self.burning:
            return None

        distances = {vertex: 0}
        queue = [vertex]

        while queue:
            current = queue.pop(0)
    
            for neighbour in self.graph[current]:
                if neighbour not in distances:
                    distances[neighbour] = distances[current] + 1
                    queue.append(neighbour)

        distance_from_fire = min(
            distances[burning_vertex]
            for burning_vertex in self.burning
            if burning_vertex in distances
        )

        if distance_from_fire == 1:
            return 3
        elif distance_from_fire == 2:
            return 2
        else:
            return 1
        
    def calculate_random_costs(self, vertex):
        if vertex in self.burning:
            return None

        if vertex not in self.costs:
            self.costs[vertex] = random.randint(1, 3)

        return self.costs[vertex]


    def calculate_costs(self, vertex):
        if self.cost_mode == "random":
            return self.calculate_random_costs(vertex)

        elif self.cost_mode == "distance":
            return self.calculate_distance_costs(vertex)

        else:
            raise ValueError("Invalid cost mode")

    
    # Game State:
    def is_game_over(self):
    # game is over if there are no possible new vertices for the fire to spread to
        for vertex in self.burning:
            for neighbour in self.graph[vertex]:
                if neighbour not in self.burning and neighbour not in self.defended:
                    return False

        return True
    

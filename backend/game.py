import random

class FirefighterGame:
    
    def __init__(self, graph, burning=None, defended=None, cost_mode="distance"):
        self.graph = graph
        # Game state:
        self.burning = set(burning or [])
        self.defended = set(defended or [])
        self.turn = 0
        # Budget:
        self.budget = 3
        # Defence costs: 
        self.cost_mode = cost_mode
        self.costs = {}
    
    # Spreading & Blocking Fire:
    def defend(self, vertex):
        
        # Cannot be already burning
        if vertex in self.burning:
            raise ValueError("Cannot defend a burning vertex.")
        
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
    
    def step(self, vertex):
        # Make move
        self.defend(vertex)
        # Update environment
        self.spread_fire()
        # New turn
        self.turn += 1
        self.budget += 3
    
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
    

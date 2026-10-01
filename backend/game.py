class FirefighterGame:
    
    def __init__(self, graph, burning=None, defended=None):
        self.graph = graph
        self.burning = set(burning or [])
        self.defended = set(defended or [])
        self.turn = 0
    
    def defend(self, vertex):
        if vertex in self.burning:
            raise ValueError("Cannot defend a burning vertex.")
        self.defended.add(vertex)
        
    def spread_fire(self):
        new_burning = set(self.burning)

        for vertex in self.burning:
            for neighbour in self.graph[vertex]:
                if neighbour not in self.defended:
                    new_burning.add(neighbour)

        self.burning = new_burning
    
    def step(self, vertex):
        self.defend(vertex)
        self.spread_fire()
        self.turn += 1
        
    def is_game_over(self):
    # game is over if there are no possible new vertices for the fire to spread to
        for vertex in self.burning:
            for neighbour in self.graph[vertex]:
                if neighbour not in self.burning and neighbour not in self.defended:
                    return False

        return True
    

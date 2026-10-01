class FirefighterGame:
    
    def __init__(self, graph, burning=None, defended=None):
        self.graph = graph
        self.burning = set(burning or [])
        self.defended = set(defended or [])
    
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
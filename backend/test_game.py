from game import FirefighterGame


graph = {
    "A": ["B"],
    "B": ["A", "C"],
    "C": ["B"]
}

game = FirefighterGame(
    graph=graph,
    burning={"A"}
)

print("Initial burning:", game.burning)

game.defend("B")
game.spread_fire()

print("After one timestep:", game.burning)

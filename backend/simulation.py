from game import FirefighterGame


graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "D"],
    "D": ["B", "C", "E"],
    "E": ["B", "D", "F"],
    "F": ["E"]
}



game = FirefighterGame(
    graph=graph,
    burning={"A"}
)


print("===== FIREFIGHTER GAME SIMULATION =====")


# Turn 0

print("\nTurn", game.turn)
print("Burning:", game.burning)
print("Defended:", game.defended)


# Turn 1

print("\nPlayer defends: B")
game.step("B")

print("\nTurn", game.turn)
print("Burning:", game.burning)
print("Defended:", game.defended)


# Turn 2

print("\nPlayer defends: D")
game.step("D")

print("\nTurn", game.turn)
print("Burning:", game.burning)
print("Defended:", game.defended)


# Turn 3

print("\nPlayer defends: F")
game.step("F")

print("\nTurn", game.turn)
print("Burning:", game.burning)
print("Defended:", game.defended)



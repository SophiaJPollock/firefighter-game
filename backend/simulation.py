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
    burning={"A"},
    cost_mode="distance")

print("\nDefence costs:")
print("A:", game.calculate_costs("A"))
print("B:", game.calculate_costs("B"))
print("C:", game.calculate_costs("C"))
print("D:", game.calculate_costs("D"))
print("E:", game.calculate_costs("E"))
print("F:", game.calculate_costs("F"))




print("===== FIREFIGHTER GAME SIMULATION =====")
# Turn 0

print("\n--- Turn", game.turn, "---")
print("Burning:", game.burning)
print("Defended:", game.defended)
print("Budget:", game.budget)

print("\nDefence costs:")
for vertex in graph:
    print(vertex, ":", game.calculate_costs(vertex))

print("\nPlayer defends: B")
game.step("B")

print("Budget after defence:", game.budget)
print("Burning:", game.burning)
print("Defended:", game.defended)


# Turn 1

print("\n--- Turn", game.turn, "---")
print("Budget at start:", game.budget)

print("\nDefence costs:")
for vertex in graph:
    print(vertex, ":", game.calculate_costs(vertex))

print("\nPlayer defends: D")
game.step("D")

print("Budget after defence:", game.budget)
print("Burning:", game.burning)
print("Defended:", game.defended)


# Turn 2

print("\n--- Turn", game.turn, "---")
print("Budget at start:", game.budget)

print("\nDefence costs:")
for vertex in graph:
    print(vertex, ":", game.calculate_costs(vertex))

print("\nPlayer defends: F")
game.step("F")

print("Budget after defence:", game.budget)
print("Burning:", game.burning)
print("Defended:", game.defended)



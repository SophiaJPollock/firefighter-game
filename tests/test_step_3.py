from backend.game import FirefighterGame


graph = {
    "A": ["B"],
    "B": ["A", "C"],
    "C": ["B"]
}


def test_distance_costs():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="distance"
    )

    assert game.calculate_costs("B") == 3
    assert game.calculate_costs("C") == 2


def test_burning_vertex_has_no_cost():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="distance"
    )

    assert game.calculate_costs("A") is None


def test_random_cost_is_valid():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="random"
    )

    cost = game.calculate_costs("B")

    assert cost in {1, 2, 3}


def test_random_cost_stays_the_same():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="random"
    )

    first_cost = game.calculate_costs("B")
    second_cost = game.calculate_costs("B")

    assert first_cost == second_cost


def test_defending_vertex_uses_budget():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="distance"
    )

    game.defend("B")

    assert game.budget == 0


def test_player_cannot_afford_defence():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="distance"
    )

    game.budget = 2

    try:
        game.defend("B")
        assert False
    except ValueError:
        pass


def test_unaffordable_vertex_is_not_defended():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        cost_mode="distance"
    )

    game.budget = 2

    try:
        game.defend("B")
    except ValueError:
        pass

    assert "B" not in game.defended

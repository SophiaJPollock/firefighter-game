from backend.game import FirefighterGame


graph = {
    "A": ["B"],
    "B": ["A", "C"],
    "C": ["B"]
}


def test_game_starts_at_turn_zero():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    assert game.turn == 0


def test_step_increases_turn():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.step("B")

    assert game.turn == 1


def test_step_defends_vertex():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.step("B")

    assert "B" in game.defended


def test_step_spreads_fire():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.step("C")

    assert "B" in game.burning


def test_defended_vertex_does_not_burn():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.step("B")

    assert "B" not in game.burning


def test_game_over_when_fire_is_contained():
    game = FirefighterGame(
        graph=graph,
        burning={"A"},
        defended={"B"}
    )

    assert game.is_game_over()
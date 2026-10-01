from backend.game import FirefighterGame

graph = {
    "A": ["B"],
    "B": ["A", "C"],
    "C": ["B"]
}


def test_game_initialisation():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    assert game.graph == graph
    assert game.burning == {"A"}
    assert game.defended == set()


def test_defend_vertex():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.defend("B")

    assert "B" in game.defended


def test_cannot_defend_burning_vertex():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    try:
        game.defend("A")
        assert False
    except ValueError:
        pass


def test_fire_spreads_to_undefended_vertex():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.spread_fire()

    assert "B" in game.burning


def test_defended_vertex_does_not_burn():
    game = FirefighterGame(
        graph=graph,
        burning={"A"}
    )

    game.defend("B")
    game.spread_fire()

    assert "B" not in game.burning

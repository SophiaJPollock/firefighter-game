import json
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from pathlib import Path

from backend.game import FirefighterGame
from backend.solver.cpsat import solve_game


# Game settings:
STARTING_FIRE = [0]
STARTING_BUDGET = 3
BUDGET_PER_TURN = 3
COST_MODE = "distance"
SOLVER_TIME_LIMIT = 30

# Graph settings:
GRAPH_PRESETS = ("graph_1", "graph_2", "graph_3")
DEFAULT_GRAPH = "graph_1"

game_lock = Lock()
current_graph_id = DEFAULT_GRAPH


# Load graph:
def load_graph(graph_id):
    if graph_id not in GRAPH_PRESETS:
        raise ValueError("Invalid graph.")

    path = (
        Path(__file__).parent
        / "graphs"
        / "presets"
        / f"{graph_id}.json"
    )

    with open(path, encoding="utf-8") as file:
        data = json.load(file)

    return {
        int(vertex): neighbours
        for vertex, neighbours in data.items()
    }


# Create game:
def create_game(cost_mode=COST_MODE, graph_id=DEFAULT_GRAPH):
    game = FirefighterGame(
        graph=load_graph(graph_id),
        burning=STARTING_FIRE,
        cost_mode=cost_mode,
        budget=STARTING_BUDGET,
        budget_per_turn=BUDGET_PER_TURN,
    )

    if cost_mode == "random":
        for vertex in game.graph:
            game.calculate_random_costs(vertex)

    return game


# Initial game:
initial_game = create_game()
game = deepcopy(initial_game)


# Get game state:
def get_game_state():
    vertices = []

    for vertex, neighbours in game.graph.items():
        if vertex in game.burning:
            status = "burning"
            cost = None

        elif vertex in game.defended:
            status = "defended"
            cost = None

        else:
            status = "safe"
            cost = game.calculate_costs(vertex)

        vertices.append({
            "id": vertex,
            "neighbours": neighbours,
            "status": status,
            "cost": cost,
        })

    return {
        "graph_id": current_graph_id,
        "vertices": vertices,
        "burning": sorted(game.burning),
        "defended": sorted(game.defended),
        "turn": game.turn,
        "budget": game.budget,
        "cost_mode": game.cost_mode,
        "game_over": game.is_game_over(),
    }


class GameHandler(BaseHTTPRequestHandler):

    # Send response:
    def send_json(self, data, status=200):
        response = json.dumps(data).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS",
        )
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type",
        )
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()

        self.wfile.write(response)

    # Read request:
    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))

        if length < 0 or length > 10000:
            raise ValueError("Invalid request body.")

        if length == 0:
            return {}

        data = json.loads(self.rfile.read(length))

        if not isinstance(data, dict):
            raise ValueError("Invalid request body.")

        return data

    # Browser requests:
    def do_OPTIONS(self):
        self.send_json({})

    # Get current game:
    def do_GET(self):
        if self.path == "/api/state":
            with game_lock:
                state = get_game_state()

            self.send_json(state)

        else:
            self.send_json({"error": "Not found"}, 404)

    # Player actions:
    def do_POST(self):
        global game, initial_game, current_graph_id

        # Solve original game:
        if self.path == "/api/solve":
            with game_lock:
                original = initial_game
                solver_game = deepcopy(original)

            try:
                result = solve_game(
                    solver_game,
                    time_limit=SOLVER_TIME_LIMIT,
                )

            except (ValueError, RuntimeError) as error:
                self.send_json({"error": str(error)}, 500)
                return

            with game_lock:
                if initial_game is not original:
                    self.send_json(
                        {"error": "A new game has been started."},
                        409,
                    )
                    return

            self.send_json(result)
            return

        # Update game:
        try:
            with game_lock:

                # Start new game:
                if self.path == "/api/new-game":
                    data = self.read_json()

                    graph_id = data.get(
                        "graph_id", DEFAULT_GRAPH
                    )
                    cost_mode = data.get(
                        "cost_mode", COST_MODE
                    )

                    initial_game = create_game(
                        cost_mode, graph_id
                    )

                    game = deepcopy(initial_game)
                    current_graph_id = graph_id

                # Restart game:
                elif self.path == "/api/restart":
                    game = deepcopy(initial_game)

                # Defend vertex:
                elif self.path == "/api/defend":
                    if game.is_game_over():
                        raise ValueError("The game is already over.")

                    data = self.read_json()
                    vertex = data.get("vertex")

                    if type(vertex) is not int:
                        raise ValueError("Vertex must be an integer.")

                    game.defend(vertex)

                # End turn:
                elif self.path == "/api/end-turn":
                    if game.is_game_over():
                        raise ValueError("The game is already over.")

                    game.end_turn()

                else:
                    self.send_json({"error": "Not found"}, 404)
                    return

                state = get_game_state()

        except (OSError, ValueError) as error:
            self.send_json({"error": str(error)}, 400)
            return

        self.send_json(state)


# Start server:
if __name__ == "__main__":
    server = ThreadingHTTPServer(
        ("127.0.0.1", 8000),
        GameHandler,
    )

    print("Firefighter API running!")
    print("Open http://localhost:8000/api/state")

    try:
        server.serve_forever()

    except KeyboardInterrupt:
        pass

    finally:
        server.server_close()

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock

from backend.game import FirefighterGame
from backend.graphs.grid import make_grid


# Game settings:
GRID_ROWS = 5
GRID_COLS = 5
STARTING_FIRE = [0]
STARTING_BUDGET = 3
BUDGET_PER_TURN = 3
COST_MODE = "distance"

game_lock = Lock()


# Create game:
def create_game():
    graph = make_grid(GRID_ROWS, GRID_COLS)

    return FirefighterGame(
        graph=graph,
        burning=STARTING_FIRE,
        cost_mode=COST_MODE,
        budget=STARTING_BUDGET,
        budget_per_turn=BUDGET_PER_TURN,
    )


game = create_game()


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
        "graph_type": "grid",
        "rows": GRID_ROWS,
        "cols": GRID_COLS,
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
        global game

        # Restart game:
        if self.path == "/api/restart":

            with game_lock:
                game = create_game()
                state = get_game_state()

            self.send_json(state)
            return

        # End turn:
        if self.path == "/api/end-turn":

            with game_lock:
                if game.is_game_over():
                    self.send_json(
                        {"error": "The game is already over."},
                        400,
                    )
                    return

                game.end_turn()
                state = get_game_state()

            self.send_json(state)
            return

        # Check action:
        if self.path not in ("/api/defend", "/api/move"):
            self.send_json(
                {"error": "Not found"},
                404,
            )
            return

        # Get selected vertex:
        try:
            length = int(
                self.headers.get("Content-Length", 0)
            )

            if length <= 0 or length > 10000:
                raise ValueError("Invalid request body.")

            data = json.loads(
                self.rfile.read(length).decode("utf-8")
            )

            vertex = data["vertex"]

            if type(vertex) is not int:
                raise ValueError("Vertex must be an integer.")

        except (ValueError, KeyError, TypeError):
            self.send_json(
                {"error": "Invalid move request."},
                400,
            )
            return

        # Defend vertex:
        with game_lock:

            if game.is_game_over():
                self.send_json(
                    {"error": "The game is already over."},
                    400,
                )
                return

            try:
                if self.path == "/api/defend":
                    game.defend(vertex)

                else:
                    game.step(vertex)

            except ValueError as error:
                self.send_json(
                    {"error": str(error)},
                    400,
                )
                return

            state = get_game_state()

        self.send_json(state)


# Start server:
if __name__ == "__main__":

    server = ThreadingHTTPServer(
        ("127.0.0.1", 8000),
        GameHandler,
    )

    print("Firefighter API running!")
    print("Open http://localhost:8000/api/state")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()

    except KeyboardInterrupt:
        pass

    finally:
        server.server_close()


import json
import random
from pathlib import Path


# Generate graph:
def generate_graph(num_vertices=25, max_degree=4, extra_edges=5, seed=None):
    if num_vertices < 2:
        raise ValueError("A graph must have at least 2 vertices.")

    if max_degree < 1 or (num_vertices > 2 and max_degree < 2):
        raise ValueError("Maximum degree is too small.")

    if extra_edges < 0:
        raise ValueError("Extra edges cannot be negative.")

    rng = random.Random(seed)

    graph = {v: set() for v in range(num_vertices)}
    vertices = list(graph)
    rng.shuffle(vertices)

    # Connect all vertices:
    for i in range(1, num_vertices):
        vertex = vertices[i]

        available = [
            v for v in vertices[:i]
            if len(graph[v]) < max_degree
        ]

        neighbour = rng.choice(available)

        graph[vertex].add(neighbour)
        graph[neighbour].add(vertex)

    # Add extra connections:
    for _ in range(extra_edges):
        available = [
            (u, v)
            for u in graph
            for v in graph
            if u < v
            and v not in graph[u]
            and len(graph[u]) < max_degree
            and len(graph[v]) < max_degree
        ]

        if not available:
            break

        u, v = rng.choice(available)

        graph[u].add(v)
        graph[v].add(u)

    return {
        v: sorted(neighbours)
        for v, neighbours in graph.items()
    }


# Save presets:
def save_presets():
    folder = Path(__file__).parent / "presets"
    folder.mkdir(exist_ok=True)

    for number in range(1, 4):
        graph = generate_graph(seed=number)

        path = folder / f"graph_{number}.json"

        with open(path, "w") as file:
            json.dump(graph, file, indent=2)

        print(f"Graph {number} saved.")


# Run generator:
if __name__ == "__main__":
    save_presets()

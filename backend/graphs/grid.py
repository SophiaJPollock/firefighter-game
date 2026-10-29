
def make_grid(rows=5, cols=5):
    graph = {}

    for row in range(rows):
        for col in range(cols):
            vertex = row * cols + col
            neighbours = []

            if row > 0:
                neighbours.append(vertex - cols)

            if row < rows - 1:
                neighbours.append(vertex + cols)

            if col > 0:
                neighbours.append(vertex - 1)

            if col < cols - 1:
                neighbours.append(vertex + 1)

            graph[vertex] = neighbours

    return graph

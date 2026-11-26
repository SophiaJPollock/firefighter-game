
import { useMemo } from 'react';

// Get graph connections:
function getEdges(vertices) {
    return vertices.flatMap((vertex) =>
        vertex.neighbours
            .filter((neighbour) => vertex.id < neighbour)
            .map((neighbour) => [vertex.id, neighbour])
    );
}

// Get distances from starting fire:
function getTree(vertices) {
    const neighbours = Object.fromEntries(
        vertices.map((vertex) => [vertex.id, vertex.neighbours])
    );

    const start = vertices.some((vertex) => vertex.id === 0)
        ? 0
        : vertices[0].id;

    const depth = { [start]: 0 };
    const parent = {};
    const order = [start];

    for (let i = 0; i < order.length; i++) {
        const vertex = order[i];

        for (const neighbour of neighbours[vertex]) {
            if (depth[neighbour] !== undefined) continue;

            depth[neighbour] = depth[vertex] + 1;
            parent[neighbour] = vertex;
            order.push(neighbour);
        }
    }

    const levels = [];

    for (const vertex of order) {
        const level = depth[vertex];

        if (!levels[level]) levels[level] = [];
        levels[level].push(vertex);
    }

    return { start, depth, parent, levels };
}

// Force-directed layout:
function forceLayout(vertices, edges) {
    const positions = {};
    const count = vertices.length;

    vertices.forEach((vertex, index) => {
        const angle = (2 * Math.PI * index) / count;

        positions[vertex.id] = {
            x: 450 + 200 * Math.cos(angle),
            y: 350 + 180 * Math.sin(angle),
        };
    });

    const k = 120;

    for (let step = 0; step < 250; step++) {
        const movement = {};

        for (const vertex of vertices) {
            movement[vertex.id] = { x: 0, y: 0 };
        }

        // Repel vertices:
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const u = vertices[i].id;
                const v = vertices[j].id;

                const dx = positions[u].x - positions[v].x;
                const dy = positions[u].y - positions[v].y;
                const distance = Math.max(1, Math.hypot(dx, dy));
                const force = (k * k) / distance;

                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                movement[u].x += fx;
                movement[u].y += fy;
                movement[v].x -= fx;
                movement[v].y -= fy;
            }
        }

        // Attract connected vertices:
        for (const [u, v] of edges) {
            const dx = positions[u].x - positions[v].x;
            const dy = positions[u].y - positions[v].y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            const force = (distance * distance) / k;

            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            movement[u].x -= fx;
            movement[u].y -= fy;
            movement[v].x += fx;
            movement[v].y += fy;
        }

        // Update positions:
        const temperature = 15 * (1 - step / 250) + 0.5;

        for (const vertex of vertices) {
            const id = vertex.id;
            const dx = movement[id].x;
            const dy = movement[id].y;
            const distance = Math.max(1, Math.hypot(dx, dy));
            const amount = Math.min(distance, temperature);

            positions[id].x = Math.max(
                45,
                Math.min(855, positions[id].x + (dx / distance) * amount)
            );

            positions[id].y = Math.max(
                45,
                Math.min(655, positions[id].y + (dy / distance) * amount)
            );
        }
    }

    return positions;
}

// Fire-centred layout:
function radialLayout(tree) {
    const positions = {};
    const maxDepth = Math.max(1, tree.levels.length - 1);

    tree.levels.forEach((vertices, level) => {
        const radius = (level / maxDepth) * 280;

        vertices.forEach((vertex, index) => {
            const angle =
                -Math.PI / 2 +
                (2 * Math.PI * index) / vertices.length;

            positions[vertex] = {
                x: 450 + radius * Math.cos(angle),
                y: 350 + radius * Math.sin(angle),
            };
        });
    });

    return positions;
}

// Tree-style layout:
function treeLayout(vertices, tree) {
    const children = Object.fromEntries(
        vertices.map((vertex) => [vertex.id, []])
    );

    for (const [vertex, parent] of Object.entries(tree.parent)) {
        children[parent].push(Number(vertex));
    }

    const horizontal = {};
    let nextLeaf = 0;

    // Arrange branches:
    function place(vertex) {
        if (children[vertex].length === 0) {
            horizontal[vertex] = nextLeaf + 0.5;
            nextLeaf++;
        } else {
            const childPositions = children[vertex].map(place);

            horizontal[vertex] =
                childPositions.reduce((sum, x) => sum + x, 0) /
                childPositions.length;
        }

        return horizontal[vertex];
    }

    place(tree.start);

    const maxDepth = Math.max(1, tree.levels.length - 1);
    const positions = {};

    for (const vertex of vertices) {
        positions[vertex.id] = {
            x: 65 + (horizontal[vertex.id] / nextLeaf) * 770,
            y: 65 + (tree.depth[vertex.id] / maxDepth) * 570,
        };
    }

    return positions;
}

// Graph view:
function GraphView({
    game,
    layout = 'force',
    selected,
    onSelect,
    busy = false,
}) {
    // Calculate layout:
    const { positions, edges, tree } = useMemo(() => {
        const vertices = game.vertices;
        const edges = getEdges(vertices);
        const tree = getTree(vertices);

        let positions;

        if (layout === 'radial') {
            positions = radialLayout(tree);
        } else if (layout === 'tree') {
            positions = treeLayout(vertices, tree);
        } else {
            positions = forceLayout(vertices, edges);
        }

        return { positions, edges, tree };
    }, [game.vertices, layout]);

    // Tree connections:
    function isTreeEdge(u, v) {
        return tree.parent[u] === v || tree.parent[v] === u;
    }

    return (
        <div style={{ width: '100%', overflow: 'auto' }}>
            <svg
                viewBox="0 0 900 700"
                style={{ width: '100%', minWidth: 500, height: 'auto' }}
                aria-label="Firefighter network graph"
            >
                {/* Connections: */}
                {edges.map(([u, v]) => {
                    const extra = layout === 'tree' && !isTreeEdge(u, v);

                    return (
                        <line
                            key={`${u}-${v}`}
                            x1={positions[u].x}
                            y1={positions[u].y}
                            x2={positions[v].x}
                            y2={positions[v].y}
                            stroke={extra ? '#d97706' : '#64748b'}
                            strokeWidth={extra ? 3 : 2.5}
                            strokeDasharray={extra ? '8 6' : undefined}
                        />
                    );
                })}

                {/* Vertices: */}
                {game.vertices.map((vertex) => {
                    const { x, y } = positions[vertex.id];

                    const burning = vertex.status === 'burning';
                    const defended = vertex.status === 'defended';
                    const isSelected = selected === vertex.id;

                    const disabled =
                        busy || game.game_over || burning || defended;

                    const background = burning
                        ? '#dc2626'
                        : defended
                            ? '#2563eb'
                            : '#f1f5f9';

                    const colour = burning || defended
                        ? '#ffffff'
                        : '#334155';

                    return (
                        <g
                            key={vertex.id}
                            role="button"
                            tabIndex={disabled ? -1 : 0}
                            aria-disabled={disabled}
                            aria-label={`Vertex ${vertex.id}, ${vertex.status}, defence cost ${vertex.cost ?? 'unavailable'}`}
                            onClick={() => {
                                if (!disabled) onSelect(vertex.id);
                            }}
                            onKeyDown={(event) => {
                                if (
                                    !disabled &&
                                    (event.key === 'Enter' || event.key === ' ')
                                ) {
                                    event.preventDefault();
                                    onSelect(vertex.id);
                                }
                            }}
                            style={{
                                cursor: disabled ? 'default' : 'pointer',
                            }}
                        >
                            {/* Selected outline: */}
                            {isSelected && (
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={29}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth={5}
                                />
                            )}

                            {/* Vertex circle: */}
                            <circle
                                cx={x}
                                cy={y}
                                r={24}
                                fill={background}
                                stroke="#334155"
                                strokeWidth={2}
                            />

                            {/* Vertex number: */}
                            <text
                                x={x}
                                y={y - 5}
                                textAnchor="middle"
                                fill={colour}
                                fontSize={13}
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                {vertex.id}
                            </text>

                            {/* Cost or status: */}
                            <text
                                x={x}
                                y={y + 13}
                                textAnchor="middle"
                                fill={colour}
                                fontSize={16}
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                {burning
                                    ? '🔥'
                                    : defended
                                        ? '🛡️'
                                        : vertex.cost}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default GraphView;

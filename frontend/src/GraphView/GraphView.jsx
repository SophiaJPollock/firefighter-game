import { useMemo } from 'react';
import { calculateLayout } from './GraphLayouts';

// Fire sprite:
function FireSprite() {
    return (
        <g className="node-flame">
            <path
                d="M-13 17 V0 H-9 V-8 H-5 V-3
                   H-2 V-19 H3 V-12 H7 V-6
                   H11 V2 H14 V17 Z"
                fill="#df4b22"
            />

            <path
                className="flame-outer"
                d="M-9 17 V5 H-5 V-2 H0 V-9
                   H4 V0 H8 V6 H10 V17 Z"
            />

            <path
                className="flame-inner"
                d="M-5 17 V8 H-1 V2 H3 V8 H6 V17 Z"
            />
        </g>
    );
}

// Shield sprite:
function ShieldSprite() {
    return (
        <g
            className="node-shield"
            transform="scale(1.7) translate(0, -9)"
        >
            <path
                className="shield-outer"
                d="M-9 0 H9 V12 H6 V15 H3 V18
                   H-3 V15 H-6 V12 H-9 Z"
            />

            <path
                className="shield-inner"
                d="M-5 4 H5 V10 H2 V14
                   H-2 V10 H-5 Z"
            />
        </g>
    );
}

// Graph view:
function GraphView({
    game,
    layout = 'force',
    selected,
    onSelect,
    busy = false,
}) {
    // Graph structure:
    const structure = JSON.stringify(
        game.vertices.map((vertex) => ({
            id: vertex.id,
            neighbours: [...vertex.neighbours].sort((a, b) => a - b),
        })).sort((a, b) => a.id - b.id)
    );

    // Calculate layout:
    const { positions, edges, parent, width, height } = useMemo(() => {
        return calculateLayout(JSON.parse(structure), layout);
    }, [structure, layout]);

    // Tree connections:
    function isTreeEdge(u, v) {
        return parent[u] === v || parent[v] === u;
    }

    return (
        <div className="graph-view">
            <svg
                className="graph-svg"
                viewBox={`0 0 ${width} ${height}`}
                style={{
                    width: width * 0.75,
                    minWidth: width * 0.75,
                    maxWidth: 'none',
                    margin: '0 auto',
                }}
                aria-label="Firefighter network graph"
            >
                {/* Connections: */}
                {edges.map(([u, v]) => {
                    const extra =
                        layout === 'tree' && !isTreeEdge(u, v);

                    return (
                        <line
                            key={`${u}-${v}`}
                            x1={positions[u].x}
                            y1={positions[u].y}
                            x2={positions[v].x}
                            y2={positions[v].y}
                            className={`graph-edge ${extra ? 'extra-edge' : ''
                                }`}
                        />
                    );
                })}

                {/* Vertices: */}
                {game.vertices.map((vertex) => {
                    const { x, y } = positions[vertex.id];

                    const burning = vertex.status === 'burning';
                    const defended = vertex.status === 'defended';
                    const isSelected = selected === vertex.id;

                    const statusLabel =
                        vertex.status === 'safe'
                            ? 'undefended'
                            : vertex.status;

                    const disabled =
                        busy ||
                        game.game_over ||
                        burning ||
                        defended;

                    return (
                        <g
                            key={vertex.id}
                            transform={`translate(${x}, ${y})`}
                            className={`graph-node ${vertex.status} ${isSelected ? 'selected' : ''
                                }`}
                            role="button"
                            tabIndex={disabled ? -1 : 0}
                            aria-disabled={disabled}
                            aria-label={`Vertex ${vertex.id}, ${statusLabel
                                }, defence cost ${vertex.cost ?? 'unavailable'
                                }`}
                            onClick={() => {
                                if (!disabled) {
                                    onSelect(vertex.id);
                                }
                            }}
                            onKeyDown={(event) => {
                                if (
                                    !disabled &&
                                    (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                    )
                                ) {
                                    event.preventDefault();
                                    onSelect(vertex.id);
                                }
                            }}
                        >
                            {/* Selected outline: */}
                            <path
                                className="node-outline"
                                d="M-22 -29 H22 V-22 H29
                                   V22 H22 V29 H-22 V22
                                   H-29 V-22 H-22 Z"
                            />

                            {/* Vertex shape: */}
                            <path
                                className="node-shape"
                                d="M-18 -24 H18 V-18 H24
                                   V18 H18 V24 H-18 V18
                                   H-24 V-18 H-18 Z"
                            />

                            {/* Vertex contents: */}
                            {burning ? (
                                <FireSprite />
                            ) : defended ? (
                                <ShieldSprite />
                            ) : (
                                <text
                                    className="node-cost"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                >
                                    {vertex.cost}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default GraphView;
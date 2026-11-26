import cytoscape from 'cytoscape';

// Get graph connections:
function getEdges(vertices) {
    return vertices.flatMap((vertex) =>
        vertex.neighbours
            .filter((neighbour) => vertex.id < neighbour)
            .map((neighbour) => [vertex.id, neighbour])
    );
}

// Fit positions with minimum vertex spacing:
function fitPositions(nodes) {
    const minSpacing = 90;
    const padding = 45;

    if (nodes.length === 0) {
        return {
            positions: {},
            width: 900,
            height: 700,
        };
    }

    const xs = nodes.map((node) => node.position('x'));
    const ys = nodes.map((node) => node.position('y'));

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Find closest vertices:
    let minDistance = Infinity;

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = xs[i] - xs[j];
            const dy = ys[i] - ys[j];

            const distance = Math.hypot(dx, dy);

            minDistance = Math.min(minDistance, distance);
        }
    }

    // Calculate scale:
    const fitScale = Math.min(
        810 / Math.max(1, maxX - minX),
        610 / Math.max(1, maxY - minY)
    );

    const spacingScale =
        minDistance > 0 ? minSpacing / minDistance : 1;

    const scale = Math.max(fitScale, spacingScale);

    // Calculate graph dimensions:
    const width = Math.max(
        900,
        Math.ceil((maxX - minX) * scale + padding * 2)
    );

    const height = Math.max(
        700,
        Math.ceil((maxY - minY) * scale + padding * 2)
    );

    const centreX = (minX + maxX) / 2;
    const centreY = (minY + maxY) / 2;

    // Scale vertex positions:
    const positions = Object.fromEntries(
        nodes.map((node) => [
            node.id(),
            {
                x: width / 2 +
                    (node.position('x') - centreX) * scale,

                y: height / 2 +
                    (node.position('y') - centreY) * scale,
            },
        ])
    );

    return { positions, width, height };
}

// Calculate graph layout:
export function calculateLayout(vertices, layout) {
    const edges = getEdges(vertices);

    if (vertices.length === 0) {
        return {
            positions: {},
            edges: [],
            parent: {},
            width: 900,
            height: 700,
        };
    }

    // Starting vertex:
    const start = vertices.some((vertex) => vertex.id === 0)
        ? 0
        : vertices[0].id;

    // Cytoscape nodes:
    const nodes = vertices.map((vertex, index) => {
        const angle = (2 * Math.PI * index) / vertices.length;

        return {
            data: {
                id: String(vertex.id),
            },
            position: {
                x: 450 + 200 * Math.cos(angle),
                y: 350 + 180 * Math.sin(angle),
            },
        };
    });

    // Cytoscape edges:
    const connections = edges.map(([u, v]) => ({
        data: {
            id: `edge-${u}-${v}`,
            source: String(u),
            target: String(v),
        },
    }));

    // Create Cytoscape instance:
    const cy = cytoscape({
        headless: true,
        styleEnabled: true,
        elements: [...nodes, ...connections],
        layout: {
            name: 'preset',
        },
        style: [
            {
                selector: 'node',
                style: {
                    width: 60,
                    height: 60,
                },
            },
        ],
    });

    try {
        const root = cy.getElementById(String(start));

        const depth = {};
        const parent = {};

        // Breadth-first search:
        cy.elements().bfs({
            roots: root,
            directed: false,

            visit(vertex, edge, previous, index, distance) {
                depth[vertex.id()] = distance;

                if (previous && previous.length) {
                    parent[vertex.id()] = Number(previous.id());
                }
            },
        });

        // Shared layout settings:
        const settings = {
            animate: false,
            fit: false,
            boundingBox: {
                x1: 45,
                y1: 45,
                w: 810,
                h: 610,
            },
        };

        // Radial layout:
        if (layout === 'radial') {
            cy.layout({
                ...settings,
                name: 'concentric',
                concentric: (node) =>
                    -(depth[node.id()] ?? vertices.length),
                levelWidth: () => 1,
                minNodeSpacing: 30,
                avoidOverlap: true,
                equidistant: true,
            }).run();

            // Tree layout:
        } else if (layout === 'tree') {
            cy.layout({
                ...settings,
                name: 'breadthfirst',
                roots: root,
                directed: false,
                circle: false,
                avoidOverlap: true,
                spacingFactor: 1.5,
            }).run();

            // Force-directed layout:
        } else {
            cy.layout({
                ...settings,
                name: 'cose',
                randomize: false,
                nodeRepulsion: () => 8000,
                idealEdgeLength: () => 120,
                numIter: 1000,
            }).run();
        }

        // Return graph layout:
        return {
            ...fitPositions(cy.nodes().toArray()),
            edges,
            parent,
        };

    } finally {
        cy.destroy();
    }
}
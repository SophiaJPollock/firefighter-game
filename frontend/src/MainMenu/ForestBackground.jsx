import { useEffect, useRef } from "react";

// Tree sprite:
const sprite = [
    "...............a...............",
    "..............ab...............",
    "..............abc..............",
    ".............aabc..............",
    ".............abbcd.............",
    "............aabbcd.............",
    "...........aabbccde............",
    "...........abbcddde............",
    "..........aabbccddee...........",
    ".........aabbccdddeee..........",
    "........abbbccdddeefff.........",
    "..........abbcdddef............",
    ".........aabbccddde............",
    "........aabbcccddeee...........",
    ".......aabbccbbcddeee..........",
    ".......abbccbbccddeee..........",
    "......aabbcccccdddeeee.........",
    ".....aabbccddddcddeeeff........",
    "....aabbccdddeeddddeefff.......",
    "...aabbcccdddeeeddddeefff......",
    ".....bbccdddeeffddeeff.........",
    ".......aabbccdddeeee...........",
    "......aabbccbbcddeeee..........",
    ".....aabbccbbccdddeeee.........",
    "....aabbccbccddddeeeeff........",
    "...aabbcccccddccdddeefff.......",
    "...abbccdddddcccdddeeeff.......",
    "..aabbccdddeeddcdddeeefff......",
    ".aabbccdddeeeeddddeeeeffff.....",
    "aabbccdddeeeffdddeeeeefffff....",
    "..bbccdddeeffffddeeeeffff......",
    "....ccddeefffffeeeeffff........",
    ".........efffffffff............",
    ".............tuv...............",
    ".............tuv...............",
    ".............tuv...............",
    "............ttuvv.............."
];

// Foreground tree colours:
const front = {
    a: "#427f8b",
    b: "#326977",
    c: "#275363",
    d: "#1d4055",
    e: "#152e46",
    f: "#101f35",
    t: "#594b40",
    u: "#393b3c",
    v: "#242c34"
};

// Middle tree colours:
const middle = {
    a: "#315d70",
    b: "#294f63",
    c: "#254659",
    d: "#203b50",
    e: "#1a3148",
    f: "#15283e",
    t: "#3b3e40",
    u: "#30383e",
    v: "#25323d"
};

// Background tree colours:
const far = {
    a: "#29465f",
    b: "#27435b",
    c: "#233e57",
    d: "#203951",
    e: "#1e354d",
    f: "#1b3047",
    t: "#23394c",
    u: "#21364a",
    v: "#1e3348"
};

export default function ForestBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const width = canvas.width;
        const height = canvas.height;

        // Draw pixel:
        function block(x, y, w, h, colour) {
            ctx.fillStyle = colour;

            ctx.fillRect(
                Math.round(x),
                Math.round(y),
                Math.max(1, Math.round(w)),
                Math.max(1, Math.round(h))
            );
        }

        // Random number:
        let seed = 126;

        function random() {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        }

        // Draw tree sprite:
        function tree(x, y, size, palette) {
            sprite.forEach((row, j) => {
                const cells = [...row];

                const first = cells.findIndex(k => k !== ".");
                const last = cells.findLastIndex(k => k !== ".");

                if (first < 0) return;

                const centre = (first + last) / 2;

                cells.forEach((value, i) => {
                    if (value === ".") return;

                    const offset = Math.round(i - centre);

                    const ax = Math.round(x + offset * size);
                    const ay = Math.round(y + (j - 37) * size);

                    const ex = Math.round(x + (offset + 1) * size);
                    const ey = Math.round(y + (j - 36) * size);

                    if (ex > ax && ey > ay) {
                        block(
                            ax,
                            ay,
                            ex - ax,
                            ey - ay,
                            palette[value]
                        );
                    }
                });
            });
        }

        // Night sky:
        const sky = [
            "#08132f",
            "#0b193a",
            "#0f2047",
            "#132854",
            "#183362",
            "#1b3b6b"
        ];

        sky.forEach((colour, i) => {
            block(0, i * 29, width, 29, colour);
        });

        block(0, 174, width, height - 174, sky[5]);

        // Stars:
        for (let i = 0; i < 95; i++) {
            const x = Math.floor(random() * width);
            const y = Math.floor(random() * 135);

            block(
                x,
                y,
                1,
                1,
                i % 5 === 0 ? "#d1dff4" : "#577aa4"
            );

            if (i % 23 === 0) {
                block(x - 1, y, 3, 1, "#9ab6d8");
                block(x, y - 1, 1, 3, "#9ab6d8");
            }
        }

        // Background forest:
        block(0, 161, width, height - 161, "#1b3047");

        for (let i = -1; i < 31; i++) {
            tree(
                i * 14 + Math.floor(random() * 6),
                166 + Math.floor(random() * 7),
                0.7 + random() * 0.4,
                far
            );
        }

        // Middle forest:
        block(0, 185, width, height - 185, "#152b3d");

        for (let i = -1; i < 23; i++) {
            tree(
                i * 19 + Math.floor(random() * 6),
                190 + Math.floor(random() * 5),
                0.85 + random() * 0.45,
                middle
            );
        }

        // Forest floor:
        block(0, 204, width, height - 204, "#101f30");

        // Foreground tree positions:
        const trees = [
            [8, 207, 1.65],
            [42, 205, 1.15],
            [73, 204, 1.4],
            [106, 208, 1.65],
            [140, 204, 1],
            [163, 207, 1.5],
            [195, 205, 1.1],
            [224, 207, 1.65],
            [257, 205, 1.15],
            [281, 207, 1.4],
            [391, 207, 1.7]
        ];

        // Foreground forest:
        for (const [x, y, size] of trees) {
            tree(x, y, size, front);
        }

        // Ground texture:
        for (let i = 0; i < 130; i++) {
            const x = Math.floor(random() * width);
            const y = 208 + Math.floor(random() * 17);

            block(
                x,
                y,
                2 + Math.floor(random() * 5),
                1,
                i % 3 ? "#172d40" : "#224253"
            );
        }

        // Grass:
        for (let i = 0; i < 65; i++) {
            const x = Math.floor(random() * width);

            // Leave a clearing for the campfire:
            if (x > 307 && x < 367) continue;

            const y = 205 + Math.floor(random() * 9);

            block(
                x,
                y,
                1,
                3,
                i % 3 ? "#275363" : "#326977"
            );

            block(x + 2, y + 1, 1, 2, "#1d4055");
        }

        // Rocks:
        const rocks = [
            [28, 216],
            [115, 211],
            [206, 220],
            [311, 213],
            [374, 216]
        ];

        for (const [x, y] of rocks) {
            block(x, y, 5, 2, "#263e50");
            block(x + 1, y - 1, 3, 1, "#395466");
        }

    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={225}
            className="forest-background"
            aria-hidden="true"
        />
    );
}
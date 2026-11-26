import { useEffect, useRef } from "react";

// Pixel font:
const font = {
    F: ["11111", "11000", "11000", "11110", "11000", "11000", "11000"],
    I: ["1111", "0110", "0110", "0110", "0110", "0110", "1111"],
    R: ["11110", "11011", "11011", "11110", "11100", "11010", "11011"],
    E: ["11111", "11000", "11000", "11110", "11000", "11000", "11111"],
    G: ["01110", "11011", "11000", "11011", "11011", "11011", "01110"],
    H: ["11011", "11011", "11011", "11111", "11011", "11011", "11011"],
    T: ["111111", "001100", "001100", "001100", "001100", "001100", "001100"],
};

export default function FireLogo() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const pixels = [];
        const size = 4;
        const title = "FIREFIGHTER";

        let x = 12;
        let frame = 0;

        // Generate letters:
        for (const letter of title) {
            font[letter].forEach((row, j) => {
                [...row].forEach((value, i) => {
                    if (value === "1") {
                        const px = x + i * size;
                        const py = 37 + j * size;

                        pixels.push([px, py]);
                    }
                });
            });

            x += (font[letter][0].length + 1) * size;
        }

        // Draw pixel:
        function block(x, y, width, height, colour) {
            ctx.fillStyle = colour;
            ctx.fillRect(x, y, width, height);
        }

        // Draw logo:
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Outline and shadow:
            for (const [x, y] of pixels) {
                block(x - 2, y - 2, 8, 8, "#281b18");
                block(x + 3, y + 5, 5, 5, "#872c1c");
            }

            // Animated letter colours:
            for (const [x, y] of pixels) {
                const wave =
                    Math.sin(x * 0.09 + frame * 0.5) * 5 +
                    Math.sin(x * 0.21 - frame * 0.35) * 3;

                const level = y - 37 + wave;

                const colour =
                    level < 7 ? "#fff0a0" :
                    level < 14 ? "#ffd04b" :
                    level < 22 ? "#ff9b27" :
                    "#ef571e";

                block(x, y, size, size, colour);
            }

            frame++;
        }

        // Start animation:
        draw();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const interval = setInterval(draw, 150);

        // Stop animation:
        return () => clearInterval(interval);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={280}
            height={94}
            className="fire-logo"
            role="img"
            aria-label="Firefighter"
        />
    );
}
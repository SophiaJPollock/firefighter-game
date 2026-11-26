import { useEffect, useRef } from "react";

export default function Campfire() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const fx = 338;
        const fy = 209; 

        let frame = 0;

        // Draw pixel:
        function block(x, y, w, h, colour) {
            ctx.fillStyle = colour;
            ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
        }

        // Draw campfire:
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Fire glow:
            for (let i = 5; i >= 1; i--) {
                ctx.globalAlpha = 0.045;

                block(
                    fx - i * 6,
                    fy - i * 2,
                    i * 12,
                    i * 4,
                    "#f5a03d"
                );
            }

            ctx.globalAlpha = 1;

            // Rising smoke:
            for (let i = 0; i < 11; i++) {
                const age = (frame * 0.35 + i * 4.7) % 52;

                const x =
                    fx + Math.sin(age * 0.13 + i * 0.7) * 3
                    + age * 0.35;

                const y = fy - 13 - age;
                const size = 2 + Math.floor(age / 12);

                ctx.globalAlpha = (1 - age / 52) * 0.37;

                block(x, y, size * 2, size, "#a6aaa1");
                block(x + 2, y - 2, size, size, "#90988e");
            }

            ctx.globalAlpha = 1;

            // Logs:
            block(fx - 11, fy + 2, 22, 3, "#62442b");
            block(fx - 8, fy, 16, 4, "#392c21");
            block(fx - 9, fy + 1, 4, 4, "#b18149");
            block(fx + 7, fy + 2, 4, 3, "#9f6a38");

            // Animated flames:
            for (let i = -7; i <= 7; i++) {
                const height = Math.floor(
                    (1 - Math.abs(i) / 9) *
                    (
                        12 +
                        4 * Math.sin(i * 0.6 + frame * 0.7) +
                        3 * Math.sin(i * 1.5 - frame * 0.5)
                    )
                );

                block(fx + i, fy - height, 1, height + 1, "#d44821");

                if (height > 3) {
                    block(
                        fx + i, fy - height + 3,
                        1, height - 2, "#ff8128"
                    );
                }

                if (height > 5) {
                    block(
                        fx + i, fy - Math.floor(height * 0.55),
                        1, Math.floor(height * 0.55), "#ffce4a"
                    );
                }

                if (Math.abs(i) < 3) {
                    block(fx + i, fy - 3, 1, 3, "#fff0a0");
                }
            }

            // Floating embers:
            for (let i = 0; i < 6; i++) {
                const age = (frame * 0.7 + i * 7) % 35;

                ctx.globalAlpha = 1 - age / 35;

                block(
                    fx + Math.sin(age * 0.2 + i) * 5 + age * 0.12,
                    fy - 10 - age,
                    1,
                    1,
                    i % 2 ? "#ffb43c" : "#ff7027"
                );
            }

            ctx.globalAlpha = 1;

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
            width={400}
            height={225}
            className="campfire"
            aria-hidden="true"
        />
    );
}
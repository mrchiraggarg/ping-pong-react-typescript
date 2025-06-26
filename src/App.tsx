import React, { useRef, useEffect, useState } from "react";

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 10;
const PADDLE_Y = CANVAS_HEIGHT - 60;

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const getRandomVelocity = () => {
  // Ball speed and random direction
  const speed = 5;
  const angle = (Math.random() * Math.PI) / 2 + Math.PI / 4;
  return { vx: speed * Math.cos(angle), vy: -speed * Math.sin(angle) };
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS - 1,
    ...getRandomVelocity(),
  });
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);

  // Handle mouse/touch movement
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ("clientX" in e) {
        clientX = e.clientX;
      }
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        let nextX = clientX - rect.left - PADDLE_WIDTH / 2;
        nextX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, nextX));
        setPaddleX(nextX);
      }
    };

    if (isRunning) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [isRunning]);

  // Game loop
  useEffect(() => {
    if (!isRunning) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 16.67; // ~60 FPS
      lastTime = time;

      setBall((prev) => {
        let { x, y, vx, vy } = prev;
        x += vx * dt;
        y += vy * dt;

        // Bounce off walls
        if (x < BALL_RADIUS) {
          x = BALL_RADIUS;
          vx = -vx;
        }
        if (x > CANVAS_WIDTH - BALL_RADIUS) {
          x = CANVAS_WIDTH - BALL_RADIUS;
          vx = -vx;
        }
        if (y < BALL_RADIUS) {
          y = BALL_RADIUS;
          vy = -vy;
        }

        // Paddle collision
        if (
          y + BALL_RADIUS > PADDLE_Y &&
          y + BALL_RADIUS < PADDLE_Y + PADDLE_HEIGHT &&
          x > paddleX &&
          x < paddleX + PADDLE_WIDTH &&
          vy > 0
        ) {
          y = PADDLE_Y - BALL_RADIUS;
          vy = -vy;
          setScore((s) => s + 1);
        }

        // If missed
        if (y > CANVAS_HEIGHT + BALL_RADIUS) {
          setIsRunning(false);
        }

        return { x, y, vx, vy };
      });

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, paddleX]);

  // Draw everything
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1c1d2b";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Paddle
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = "#f54b64";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Score
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 40);

    // Game Over
    if (!isRunning && score > 0) {
      ctx.font = "32px Arial";
      ctx.fillStyle = "#fff";
      ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.font = "20px Arial";
      ctx.fillText("Click to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
    // Start
    if (!isRunning && score === 0) {
      ctx.font = "28px Arial";
      ctx.fillStyle = "#fff";
      ctx.fillText("Ping Pong Go", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.font = "20px Arial";
      ctx.fillText("Click to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, [ball, paddleX, isRunning, score]);

  // Start/Restart game
  const handleCanvasClick = () => {
    if (!isRunning) {
      setScore(0);
      setBall({
        x: CANVAS_WIDTH / 2,
        y: PADDLE_Y - BALL_RADIUS - 1,
        ...getRandomVelocity(),
      });
      setIsRunning(true);
    }
  };

  return (
    <div style={{ background: "#181924", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          borderRadius: 24,
          boxShadow: "0 8px 40px #0007",
          background: "#1c1d2b",
          cursor: isRunning ? "none" : "pointer"
        }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default App;
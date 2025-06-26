import React, { useRef, useEffect, useState } from 'react';

type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
};

type Ball = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 6;
const BALL_SPEED = 4;

const PingPongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(true);
  const [score, setScore] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  // Game objects
  const paddleLeft = useRef<Paddle>({
    x: 10,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
  });

  const paddleRight = useRef<Paddle>({
    x: CANVAS_WIDTH - 10 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
  });

  const ball = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: BALL_RADIUS,
    dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    dy: BALL_SPEED * (Math.random() * 2 - 1),
  });

  // Paddle control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w') paddleLeft.current.dy = -PADDLE_SPEED;
      if (e.key === 's') paddleLeft.current.dy = PADDLE_SPEED;
      if (e.key === 'ArrowUp') paddleRight.current.dy = -PADDLE_SPEED;
      if (e.key === 'ArrowDown') paddleRight.current.dy = PADDLE_SPEED;
      if (e.key === ' ') setIsRunning((run) => !run);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 's') paddleLeft.current.dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') paddleRight.current.dy = 0;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    function resetBall(direction: number) {
      ball.current.x = CANVAS_WIDTH / 2;
      ball.current.y = CANVAS_HEIGHT / 2;
      ball.current.dx = BALL_SPEED * direction;
      ball.current.dy = BALL_SPEED * (Math.random() * 2 - 1);
    }

    function draw(ctx: CanvasRenderingContext2D) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw paddles
      ctx.fillStyle = 'white';
      ctx.fillRect(
        paddleLeft.current.x,
        paddleLeft.current.y,
        paddleLeft.current.width,
        paddleLeft.current.height
      );
      ctx.fillRect(
        paddleRight.current.x,
        paddleRight.current.y,
        paddleRight.current.width,
        paddleRight.current.height
      );

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw net
      ctx.strokeStyle = 'white';
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw score
      ctx.font = '32px Arial';
      ctx.fillText(`${score.left}`, CANVAS_WIDTH / 4, 40);
      ctx.fillText(`${score.right}`, (3 * CANVAS_WIDTH) / 4, 40);
    }

    function update() {
      // Move paddles
      paddleLeft.current.y += paddleLeft.current.dy;
      paddleRight.current.y += paddleRight.current.dy;

      // Clamp paddles
      paddleLeft.current.y = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddleLeft.current.y)
      );
      paddleRight.current.y = Math.max(
        0,
        Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddleRight.current.y)
      );

      // Move ball
      ball.current.x += ball.current.dx;
      ball.current.y += ball.current.dy;

      // Ball collision with top/bottom walls
      if (
        ball.current.y - ball.current.radius < 0 ||
        ball.current.y + ball.current.radius > CANVAS_HEIGHT
      ) {
        ball.current.dy *= -1;
      }

      // Ball collision with paddles
      const paddleCollision = (paddle: Paddle) =>
        ball.current.x - ball.current.radius < paddle.x + paddle.width &&
        ball.current.x + ball.current.radius > paddle.x &&
        ball.current.y > paddle.y &&
        ball.current.y < paddle.y + paddle.height;

      if (
        paddleCollision(paddleLeft.current) &&
        ball.current.dx < 0
      ) {
        ball.current.dx *= -1;
        // Add some spin
        ball.current.dy += paddleLeft.current.dy * 0.3;
      }

      if (
        paddleCollision(paddleRight.current) &&
        ball.current.dx > 0
      ) {
        ball.current.dx *= -1;
        // Add some spin
        ball.current.dy += paddleRight.current.dy * 0.3;
      }

      // Ball out of bounds (score)
      if (ball.current.x < 0) {
        setScore((s) => ({ ...s, right: s.right + 1 }));
        resetBall(1);
      }
      if (ball.current.x > CANVAS_WIDTH) {
        setScore((s) => ({ ...s, left: s.left + 1 }));
        resetBall(-1);
      }
    }

    function gameLoop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (isRunning) {
        update();
      }
      draw(ctx);
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line
  }, [isRunning, score.left, score.right]);

  return (
    <div style={{ background: '#222', padding: 20, borderRadius: 10, width: CANVAS_WIDTH + 40, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ background: '#000', display: 'block', margin: '0 auto', borderRadius: 8 }}
      />
      <div style={{ color: 'white', textAlign: 'center', marginTop: 16 }}>
        <b>Controls:</b>
        <div>Left: W/S | Right: Arrow Up/Down | Pause: Space</div>
        <div>
          <b>Score:</b> {score.left} - {score.right}
        </div>
      </div>
    </div>
  );
};

export default PingPongGame;
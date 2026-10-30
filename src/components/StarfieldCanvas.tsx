import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  color: string;
}

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const checkReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Colors: restrained white, pale silver, soft gold
    const starColors = ['#FFFFFF', '#F3F0E8', '#E2E8F0', '#D6AD60', '#CBD5E1'];

    const numStars = Math.min(130, Math.floor((width * height) / 9000));
    const stars: Star[] = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        targetAlpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        vx: checkReducedMotion ? 0 : (Math.random() - 0.5) * 0.08,
        vy: checkReducedMotion ? 0 : (Math.random() - 0.5) * 0.08,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    const render = () => {
      // Clear with dark indigo deep space color
      ctx.fillStyle = '#080D1A';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background nebulae glow
      const grad1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 10, width * 0.2, height * 0.3, width * 0.45);
      grad1.addColorStop(0, 'rgba(16, 24, 42, 0.6)');
      grad1.addColorStop(0.5, 'rgba(23, 34, 56, 0.3)');
      grad1.addColorStop(1, 'rgba(8, 13, 26, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 10, width * 0.8, height * 0.7, width * 0.5);
      grad2.addColorStop(0, 'rgba(214, 173, 96, 0.04)');
      grad2.addColorStop(0.6, 'rgba(16, 24, 42, 0.2)');
      grad2.addColorStop(1, 'rgba(8, 13, 26, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Update & draw stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Twinkle update
        if (Math.abs(star.alpha - star.targetAlpha) < 0.02) {
          star.targetAlpha = Math.random() * 0.85 + 0.15;
        } else {
          star.alpha += (star.targetAlpha - star.alpha) * star.twinkleSpeed;
        }

        // Drifting movement
        if (!checkReducedMotion) {
          star.x += star.vx;
          star.y += star.vy;

          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle faint cross glow for larger stars
        if (star.size > 1.8) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = star.alpha * 0.4;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 2, star.y);
          ctx.lineTo(star.x + star.size * 2, star.y);
          ctx.moveTo(star.x, star.y - star.size * 2);
          ctx.lineTo(star.x, star.y + star.size * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

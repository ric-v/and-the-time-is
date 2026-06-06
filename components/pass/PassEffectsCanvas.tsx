'use client';

import React, { useEffect, useRef } from 'react';
import type { PassSkyPhase } from '../../utils/passLayoutEngine';

interface PassEffectsCanvasProps {
  skyWeights: Record<PassSkyPhase, number>;
  rideVelocity: number;
  reducedMotion: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  depth: number;
}

interface Streak {
  x: number;
  y: number;
  len: number;
  life: number;
}

const PassEffectsCanvas: React.FC<PassEffectsCanvasProps> = ({
  skyWeights,
  rideVelocity,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const flakesRef = useRef<Flake[]>([]);
  const streaksRef = useRef<Streak[]>([]);
  const velocityRef = useRef(rideVelocity);

  velocityRef.current = rideVelocity;

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      starsRef.current = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.55,
        r: Math.random() * 1.8 + 0.4,
        phase: Math.random() * Math.PI * 2,
      }));
      flakesRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.2 + 0.4,
        speed: Math.random() * 0.9 + 0.25,
        drift: Math.random() * 0.5 - 0.25,
        depth: Math.random(),
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    const draw = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const nightAlpha =
        skyWeights.night * 0.95 +
        skyWeights.dusk * 0.4 +
        skyWeights.dawn * 0.15;

      if (nightAlpha > 0.05) {
        starsRef.current.forEach((s) => {
          const twinkle = 0.5 + 0.5 * Math.sin(t / 800 + s.phase);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * twinkle, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${nightAlpha * twinkle * 0.85})`;
          ctx.fill();
        });
      }

      flakesRef.current.forEach((f) => {
        const parallax = 0.5 + f.depth * 0.5;
        f.y += f.speed * parallax;
        f.x += f.drift + velocityRef.current * 0.02 * parallax;
        if (f.y > h) {
          f.y = -4;
          f.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * parallax, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.35 + f.depth * 0.35})`;
        ctx.fill();
      });

      const absVel = Math.abs(velocityRef.current);
      if (absVel > 2) {
        if (Math.random() < 0.35) {
          streaksRef.current.push({
            x: w * 0.35 + Math.random() * w * 0.3,
            y: h * 0.55 + Math.random() * h * 0.15,
            len: 20 + absVel * 3,
            life: 1,
          });
        }
      }
      streaksRef.current = streaksRef.current.filter((s) => {
        s.life -= 0.06;
        if (s.life <= 0) return false;
        const dir = velocityRef.current >= 0 ? -1 : 1;
        ctx.strokeStyle = `rgba(255,255,255,${s.life * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + dir * s.len * s.life, s.y);
        ctx.stroke();
        return true;
      });

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion, skyWeights.dawn, skyWeights.day, skyWeights.dusk, skyWeights.night]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className="pass-effects-canvas" aria-hidden />;
};

export default PassEffectsCanvas;

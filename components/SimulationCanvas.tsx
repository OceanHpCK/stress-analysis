import React, { useRef, useEffect, useState } from 'react';
import { ProductDimensions, ForceConfig, ForceType, MaterialConfig, Point } from '../types';
import { getBeamHeightAtX, calculateStressMPa } from '../utils/physics';

interface Props {
  dimensions: ProductDimensions;
  force: ForceConfig;
  material: MaterialConfig;
  onForcePositionChange: (newX: number) => void;
}

const SCALE = 3.5; // Pixels per mm
const PADDING_X = 100;
const PADDING_Y = 50;

const SimulationCanvas: React.FC<Props> = ({ dimensions, force, material, onForcePositionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number, y: number, stress: number } | null>(null);

  // Interaction State
  const [mode, setMode] = useState<'force' | 'measure'>('force');
  const [pinnedPoints, setPinnedPoints] = useState<Point[]>([]);

  const width = (dimensions.totalLength * SCALE) + (PADDING_X * 2);
  const height = (dimensions.totalHeight * SCALE) + (PADDING_Y * 2);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(PADDING_X, height - PADDING_Y);
    ctx.scale(SCALE, -SCALE);

    const step = 2;

    // 1. Draw Stress Map
    for (let x = 0; x <= dimensions.totalLength; x += step) {
      const h = getBeamHeightAtX(x, dimensions);
      for (let y = 0; y <= h; y += step) {
        const stress = calculateStressMPa(x, y, dimensions, force.positionX, force.magnitude);

        if (stress > 0.1) {
          const yieldStrength = material.yieldStrength;
          const ratio = Math.min(stress / yieldStrength, 1.2);

          let r, g, b;
          if (ratio < 0.5) {
            const t = ratio * 2;
            r = 0; g = Math.floor(255 * t); b = Math.floor(255 * (1 - t));
          } else if (ratio < 1.0) {
            const t = (ratio - 0.5) * 2;
            r = Math.floor(255 * t); g = Math.floor(255 * (1 - t * 0.5)); b = 0;
          } else {
            r = 255; g = 0; b = 0;
          }

          ctx.fillStyle = `rgba(${r},${g},${b}, 0.9)`;
          ctx.fillRect(x, y, step, step);
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // 2. Draw Outline
    ctx.beginPath();
    ctx.lineWidth = 2 / SCALE;
    ctx.strokeStyle = '#334155';
    ctx.moveTo(0, 0);
    ctx.lineTo(0, dimensions.totalHeight);
    ctx.lineTo(dimensions.leftWidth, dimensions.totalHeight);
    ctx.lineTo(dimensions.leftWidth, dimensions.totalHeight - dimensions.a);
    ctx.lineTo(dimensions.leftWidth + dimensions.b, dimensions.endHeight);
    ctx.lineTo(dimensions.totalLength, dimensions.endHeight);
    ctx.lineTo(dimensions.totalLength, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // 3. Draw Overlays (Dimensions, Force, Points)
    drawDimensions(ctx);
    drawForce(ctx);

    // Draw Pinned Points
    pinnedPoints.forEach(p => {
      const h = getBeamHeightAtX(p.x, dimensions);
      if (p.x <= dimensions.totalLength && p.y <= h) {
        const stress = calculateStressMPa(p.x, p.y, dimensions, force.positionX, force.magnitude);
        drawPointTooltip(ctx, p.x, p.y, stress, true);
      }
    });

    // Draw Hover Point
    if (hoverData) {
      drawPointTooltip(ctx, hoverData.x, hoverData.y, hoverData.stress, false);
    }
  };

  const toScreen = (x: number, y: number) => ({
    x: PADDING_X + x * SCALE,
    y: height - PADDING_Y - y * SCALE
  });

  const drawDimensions = (ctx: CanvasRenderingContext2D) => {
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;

    const drawDimLine = (p1: { x: number, y: number }, p2: { x: number, y: number }, text: string, offset: number, axis: 'x' | 'y', color?: string) => {
      ctx.save();
      if (color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }

      ctx.beginPath();
      if (axis === 'x') {
        const yPos = p1.y + offset;
        ctx.moveTo(p1.x, p1.y + 5); ctx.lineTo(p1.x, yPos);
        ctx.moveTo(p2.x, p2.y + 5); ctx.lineTo(p2.x, yPos);
        ctx.moveTo(p1.x, yPos); ctx.lineTo(p2.x, yPos);
        ctx.textAlign = 'center';
        ctx.fillText(text, (p1.x + p2.x) / 2, yPos + 15);
      } else {
        const xPos = p1.x + offset;
        ctx.moveTo(p1.x + 5, p1.y); ctx.lineTo(xPos, p1.y);
        ctx.moveTo(p2.x + 5, p2.y); ctx.lineTo(xPos, p2.y);
        ctx.moveTo(xPos, p1.y); ctx.lineTo(xPos, p2.y);
        ctx.textAlign = 'left';
        ctx.fillText(text, xPos + 5, (p1.y + p2.y) / 2 + 4);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawDimLine(toScreen(0, 0), toScreen(0, dimensions.totalHeight), `d=${dimensions.totalHeight}`, -50, 'y');
    drawDimLine(toScreen(0, dimensions.totalHeight), toScreen(dimensions.leftWidth, dimensions.totalHeight), `c=${dimensions.leftWidth}`, -35, 'x');
    drawDimLine(toScreen(dimensions.leftWidth, dimensions.totalHeight), toScreen(dimensions.leftWidth, dimensions.totalHeight - dimensions.a), `a=${dimensions.a}`, 30, 'y');
    drawDimLine(toScreen(dimensions.leftWidth, 0), toScreen(dimensions.leftWidth + dimensions.b, 0), `b=${dimensions.b}`, 20, 'x');
    drawDimLine(toScreen(dimensions.totalLength, 0), toScreen(dimensions.totalLength, dimensions.endHeight), `e=${dimensions.endHeight}`, 50, 'y');

    // Force Position Dimension (New)
    const isTopForce = force.type === ForceType.F;
    const color = isTopForce ? '#ef4444' : '#f59e0b';
    drawDimLine(toScreen(0, 0), toScreen(force.positionX, 0), `x = ${force.positionX.toFixed(0)}`, 45, 'x', color);
  };

  const drawForce = (ctx: CanvasRenderingContext2D) => {
    const beamY = getBeamHeightAtX(force.positionX, dimensions);
    const pos = toScreen(force.positionX, beamY);
    const isTopForce = force.type === ForceType.F;
    const arrowY = isTopForce ? pos.y : toScreen(force.positionX, 0).y;
    const direction = isTopForce ? 1 : -1;

    ctx.fillStyle = isTopForce ? '#ef4444' : '#f59e0b';
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 3;
    const arrowLength = 40;

    ctx.beginPath();
    ctx.moveTo(pos.x, arrowY - (direction * arrowLength));
    ctx.lineTo(pos.x, arrowY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos.x, arrowY);
    ctx.lineTo(pos.x - 6, arrowY - (direction * 10));
    ctx.lineTo(pos.x + 6, arrowY - (direction * 10));
    ctx.fill();

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`${force.magnitude}N`, pos.x + 10, arrowY - (direction * arrowLength / 2));
  };

  const drawPointTooltip = (ctx: CanvasRenderingContext2D, x: number, y: number, stress: number, isPinned: boolean) => {
    const pos = toScreen(x, y);
    const sf = stress > 0 ? (material.yieldStrength / stress).toFixed(1) : '∞';
    const isDanger = stress > material.yieldStrength;

    // Calculate Tension vs Compression
    const h = getBeamHeightAtX(x, dimensions);
    const neutralAxis = h / 2;
    let type = '';

    if (stress > 0.01) {
      if (force.type === ForceType.F) {
        type = y > neutralAxis ? '(Kéo)' : '(Nén)';
      } else {
        type = y > neutralAxis ? '(Nén)' : '(Kéo)';
      }
    }

    // Draw Point Marker
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isPinned ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isPinned ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.strokeStyle = isPinned ? '#0f172a' : '#fff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Tooltip Box
    const boxWidth = 150;
    const boxHeight = 65;
    const offset = 15;

    let boxX = pos.x + offset;
    let boxY = pos.y - boxHeight / 2;
    if (boxX + boxWidth > ctx.canvas.width) boxX = pos.x - boxWidth - offset;
    if (boxY < 0) boxY = 10;

    ctx.fillStyle = isPinned ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
    ctx.fill();

    if (isPinned) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Text
    ctx.textAlign = 'left';

    // Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Pos: (${x.toFixed(0)}, ${y.toFixed(0)}) mm`, boxX + 10, boxY + 18);

    // Stress
    ctx.fillStyle = isDanger ? '#f87171' : '#fff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`Stress: ${stress.toFixed(2)} MPa ${type}`, boxX + 10, boxY + 38);

    // SF
    ctx.fillStyle = Number(sf) < 1.0 ? '#f87171' : '#4ade80';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Safety Factor: ${sf}`, boxX + 10, boxY + 54);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
      }
    }
  }, [dimensions, force, hoverData, material, pinnedPoints]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasMouseX = (e.clientX - rect.left) * scaleX;
    const canvasMouseY = (e.clientY - rect.top) * scaleY;

    const xMm = (canvasMouseX - PADDING_X) / SCALE;
    const yMm = (height - PADDING_Y - canvasMouseY) / SCALE;

    if (xMm >= 0 && xMm <= dimensions.totalLength) {
      const h = getBeamHeightAtX(xMm, dimensions);
      if (yMm >= 0 && yMm <= h) {
        const stress = calculateStressMPa(xMm, yMm, dimensions, force.positionX, force.magnitude);
        setHoverData({ x: xMm, y: yMm, stress });
        return;
      }
    }
    setHoverData(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoverData) {
      if (mode === 'measure') {
        setPinnedPoints(prev => [...prev, { x: hoverData.x, y: hoverData.y }]);
      } else {
        onForcePositionChange(hoverData.x);
      }
    }
  };

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 opacity-20"></div>

      {/* Interaction Mode Controls - Trên cùng giữa canvas */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="flex bg-white/90 backdrop-blur rounded-lg p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setMode('force')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${mode === 'force' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Di chuyển lực
          </button>
          <button
            onClick={() => setMode('measure')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${mode === 'measure' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <circle cx="12" cy="12" r="6" strokeWidth={2} />
              <circle cx="12" cy="12" r="2" strokeWidth={2} />
            </svg>
            Đo đạc
          </button>
        </div>

        {pinnedPoints.length > 0 && (
          <button
            onClick={() => setPinnedPoints([])}
            className="px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Xóa điểm ({pinnedPoints.length})
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full h-auto ${mode === 'force' ? 'cursor-ew-resize' : 'cursor-crosshair'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
        onClick={handleClick}
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm text-xs pointer-events-none">
        <div className="font-semibold text-slate-700 mb-2">Thang Ứng Suất ({material.name})</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
            <span className="text-slate-600">An toàn (&lt;{Math.round(material.yieldStrength * 0.5)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-green-500 to-yellow-400"></div>
            <span className="text-slate-600">Cảnh báo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-red-600"></div>
            <span className="text-red-600 font-medium">Phá hủy (&gt;{material.yieldStrength})</span>
          </div>
        </div>
      </div>


    </div>
  );
};

export default SimulationCanvas;
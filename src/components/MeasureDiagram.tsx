import type { DiagramType } from '@/types';

interface Props {
  type: DiagramType;
  className?: string;
}

const W = 280;
const H = 180;

function Wall({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <g>
      <rect x="60" y="20" width="160" height="140" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" rx="4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={'h' + i}
          x1="60"
          y1={40 + i * 22}
          x2="220"
          y2={40 + i * 22}
          stroke="#E2E8F0"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <line
          key={'v' + i}
          x1={100 + i * 40}
          y1="20"
          x2={100 + i * 40}
          y2="160"
          stroke="#E2E8F0"
          strokeWidth="1"
        />
      ))}
      {showLabel && (
        <text x="30" y="170" fontSize="12" fill="#475569">
          墙面
        </text>
      )}
    </g>
  );
}

function Floor({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <g>
      <rect x="30" y="100" width="220" height="50" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" rx="4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={'f' + i}
          x1={50 + i * 26}
          y1="100"
          x2={50 + i * 26}
          y2="150"
          stroke="#FDE68A"
          strokeWidth="1"
        />
      ))}
      <line x1="30" y1="150" x2="250" y2="150" stroke="#78350F" strokeWidth="3" />
      {showLabel && (
        <text x="130" y="178" fontSize="12" textAnchor="middle" fill="#475569">
          地面
        </text>
      )}
    </g>
  );
}

function Ruler({
  x1,
  y1,
  x2,
  y2,
  color = '#0EA5E9',
  label = '2m靠尺',
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: string;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="6" strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
      <g transform={`translate(${mx}, ${my}) rotate(${angle})`}>
        <rect x="-28" y="-12" width="56" height="20" rx="4" fill={color} opacity="0.95" />
        <text x="0" y="2" fontSize="11" textAnchor="middle" fill="#FFF" fontWeight="bold">
          {label}
        </text>
      </g>
    </g>
  );
}

function Feeler({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-4" y="-20" width="8" height="24" fill="#DC2626" rx="2" />
      <rect x="-2" y="-28" width="4" height="12" fill="#991B1B" />
      <text x="0" y="20" fontSize="10" textAnchor="middle" fill="#DC2626" fontWeight="bold">
        塞尺
      </text>
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = '#DC2626',
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: string;
}) {
  const markerId = 'arr-' + color.replace('#', '');
  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#${markerId})`}
        strokeDasharray="4 3"
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 5}
          fontSize="11"
          fill={color}
          fontWeight="bold"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function MeasureDiagram({ type, className = '' }: Props) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full max-w-[280px] mx-auto ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {type === 'wall-vertical' && (
        <>
          <Wall />
          <Ruler x1={140} y1={25} x2={140} y2={155} color="#0EA5E9" label="垂直靠尺" />
          <Arrow x1={155} y1={90} x2={175} y2={90} label="读偏差" />
        </>
      )}

      {type === 'wall-horizontal' && (
        <>
          <Wall />
          <Ruler x1={65} y1={90} x2={215} y2={90} color="#F59E0B" label="水平靠尺" />
          <Arrow x1={140} y1={100} x2={140} y2={120} color="#DC2626" label="读偏差" />
        </>
      )}

      {type === 'wall-2m' && (
        <>
          <Wall />
          <Ruler x1={70} y1={60} x2={210} y2={60} color="#8B5CF6" label="2m靠尺" />
          <Feeler x={140} y={60} />
          <Arrow x1={160} y1={85} x2={148} y2={68} label="塞尺量缝" />
        </>
      )}

      {type === 'floor-level' && (
        <>
          <Floor />
          <Ruler x1={50} y1={100} x2={230} y2={100} color="#059669" label="靠尺/水平仪" />
          <Arrow x1={140} y1={80} x2={140} y2={95} color="#DC2626" label="测高差" />
        </>
      )}

      {type === 'floor-2m' && (
        <>
          <Floor />
          <Ruler x1={40} y1={115} x2={240} y2={115} color="#7C3AED" label="2m靠尺" />
          <Feeler x={140} y={115} />
          <Arrow x1={160} y1={75} x2={148} y2={108} label="塞尺量缝" />
        </>
      )}

      {type === 'brick-plumb' && (
        <>
          <Wall showLabel={false} />
          <text x="30" y="170" fontSize="12" fill="#475569">
            砖墙
          </text>
          <Ruler x1={140} y1={25} x2={140} y2={155} color="#0EA5E9" label="托线板" />
          <line x1="235" y1="20" x2="235" y2="160" stroke="#78716C" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="235" cy="160" r="6" fill="#57534E" />
          <text x="250" y="95" fontSize="11" fill="#57534E" fontWeight="bold">
            铅垂线
          </text>
        </>
      )}

      {type === 'corner-square' && (
        <>
          <line x1="140" y1="30" x2="140" y2="160" stroke="#64748B" strokeWidth="3" />
          <line x1="140" y1="160" x2="260" y2="160" stroke="#64748B" strokeWidth="3" />
          <path d="M 140 30 L 40 30 L 40 160 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
          <text x="85" y="180" fontSize="12" fill="#475569">阴角示意</text>
          <g>
            <line x1="140" y1="160" x2="70" y2="90" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
            <line x1="140" y1="160" x2="210" y2="90" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
            <text x="110" y="140" fontSize="11" fill="#EA580C" fontWeight="bold" transform="rotate(-45 110 130)">方尺</text>
          </g>
          <Arrow x1={155} y1={130} x2={170} y2={115} label="读偏差" />
        </>
      )}
    </svg>
  );
}

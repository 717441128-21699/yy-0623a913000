import { NavLink } from 'react-router-dom';
import { ClipboardCheck, Wrench, CheckSquare, BarChart3 } from 'lucide-react';

const tabs = [
  { to: '/', label: '今日自检', icon: ClipboardCheck, emoji: '📋' },
  { to: '/rework', label: '返工清单', icon: Wrench, emoji: '🔧' },
  { to: '/records', label: '合格记录', icon: CheckSquare, emoji: '✅' },
  { to: '/report', label: '班组长日报', icon: BarChart3, emoji: '📊' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16 px-2 pb-safe">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl btn-tap transition-colors ${
                isActive
                  ? 'text-primary-800 font-bold'
                  : 'text-gray-500 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`text-2xl transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {t.emoji}
                </div>
                <span className={`text-[12px] leading-tight text-center ${isActive ? '' : ''}`}>
                  {t.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-8 h-1 rounded-full bg-primary-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

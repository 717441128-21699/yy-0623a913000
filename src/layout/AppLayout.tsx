import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-100 flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 relative shadow-xl">
        <main className="pb-24 pt-4 px-4">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

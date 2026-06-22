import { HashRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import DailyCheck from '@/pages/DailyCheck';
import ReworkList from '@/pages/ReworkList';
import QualifiedRecords from '@/pages/QualifiedRecords';
import DailyReport from '@/pages/DailyReport';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DailyCheck />} />
          <Route path="/rework" element={<ReworkList />} />
          <Route path="/records" element={<QualifiedRecords />} />
          <Route path="/report" element={<DailyReport />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

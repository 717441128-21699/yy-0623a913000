import { useMemo, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
  Copy,
  CheckCheck,
  Wrench,
  CalendarRange,
  CalendarDays,
} from 'lucide-react';
import { useQualityStore } from '@/store/qualityStore';
import { PROCESSES, getCheckItemById, getProcessById } from '@/data/config';
import {
  formatDate,
  getLastNDates,
  formatDateCN,
  getThisWeekRange,
  isDateInRange,
} from '@/utils/helpers';
import { isItemFinallyPassed } from '@/types';
import type { ProcessType, ReworkItem } from '@/types';

interface ProcessStat {
  processId: ProcessType;
  checked: number;
  passed: number;
  reworkGenerated: number;
  reworkClosed: number;
}

interface OpenReworkStat {
  processId: ProcessType;
  count: number;
  overdueCount: number;
  earliestDate: string | null;
  items: ReworkItem[];
}

type RangeMode = 'today' | 'week' | 'custom';

export default function DailyReport() {
  const { records, reworkItems } = useQualityStore();
  const [mode, setMode] = useState<RangeMode>('today');
  const [customStart, setCustomStart] = useState<string>(formatDate());
  const [customEnd, setCustomEnd] = useState<string>(formatDate());
  const [selectedDay, setSelectedDay] = useState<string>(formatDate());

  const dates = useMemo(() => getLastNDates(14), []);

  const [rangeStart, rangeEnd] = useMemo<[string, string]>(() => {
    if (mode === 'today') return [selectedDay, selectedDay];
    if (mode === 'week') return getThisWeekRange();
    return [customStart, customEnd];
  }, [mode, selectedDay, customStart, customEnd]);

  const rangeLabel = useMemo(() => {
    if (mode === 'today') return formatDateCN(rangeStart);
    if (rangeStart === rangeEnd) return formatDateCN(rangeStart);
    return `${formatDateCN(rangeStart)} ~ ${formatDateCN(rangeEnd)}`;
  }, [mode, rangeStart, rangeEnd]);

  const openReworkStats = useMemo<OpenReworkStat[]>(() => {
    const open = reworkItems.filter((r) => !r.closedAt);
    const today = formatDate();
    const map = new Map<ProcessType, OpenReworkStat>();
    PROCESSES.forEach((p) => {
      map.set(p.id, {
        processId: p.id,
        count: 0,
        overdueCount: 0,
        earliestDate: null,
        items: [],
      });
    });
    open.forEach((item) => {
      const s = map.get(item.processId)!;
      s.count++;
      s.items.push(item);
      if (item.reworkDate < today) s.overdueCount++;
      if (!s.earliestDate || item.reworkDate < s.earliestDate) {
        s.earliestDate = item.reworkDate;
      }
    });
    return PROCESSES.map((p) => map.get(p.id)!).filter((s) => s.count > 0);
  }, [reworkItems]);

  const stats = useMemo(() => {
    const periodRecords = records.filter((r) =>
      isDateInRange(r.date, rangeStart, rangeEnd),
    );

    let totalChecked = 0;
    let totalPassed = 0;

    const byProcess: Record<string, ProcessStat> = {};
    PROCESSES.forEach((p) => {
      byProcess[p.id] = {
        processId: p.id,
        checked: 0,
        passed: 0,
        reworkGenerated: 0,
        reworkClosed: 0,
      };
    });

    periodRecords.forEach((rec) => {
      const pid = rec.processId;
      rec.results.forEach((res) => {
        totalChecked++;
        const item = getCheckItemById(res.itemId);
        if (!item) return;
        byProcess[pid].checked++;
        const ok = isItemFinallyPassed(res, item.allowMax, item.allowMin);
        if (ok) {
          totalPassed++;
          byProcess[pid].passed++;
        }
      });
    });

    const reworkGenerated = reworkItems.filter((r) => {
      const d = formatDate(new Date(r.createdAt));
      return isDateInRange(d, rangeStart, rangeEnd);
    });
    const reworkClosed = reworkItems.filter((r) => {
      if (!r.closedAt) return false;
      const d = formatDate(new Date(r.closedAt));
      return isDateInRange(d, rangeStart, rangeEnd);
    });

    reworkGenerated.forEach((r) => {
      if (byProcess[r.processId]) {
        byProcess[r.processId].reworkGenerated++;
      }
    });
    reworkClosed.forEach((r) => {
      if (byProcess[r.processId]) {
        byProcess[r.processId].reworkClosed++;
      }
    });

    const processStats = PROCESSES.map((p) => byProcess[p.id]).filter(
      (s) => s.checked > 0 || s.reworkGenerated > 0 || s.reworkClosed > 0,
    );

    return {
      totalChecked,
      totalPassed,
      totalReworkGenerated: reworkGenerated.length,
      totalReworkClosed: reworkClosed.length,
      processStats,
    };
  }, [rangeStart, rangeEnd, records, reworkItems]);

  const wechatText = useMemo(() => {
    const totalOpen = openReworkStats.reduce((s, r) => s + r.count, 0);
    const totalOverdue = openReworkStats.reduce((s, r) => s + r.overdueCount, 0);
    const lines: string[] = [];
    lines.push(
      `【${rangeLabel} 班组长质量${mode === 'today' ? '日报' : mode === 'week' ? '周报' : '汇总'}】`,
    );
    lines.push('');
    lines.push(
      `📊 共检查 ${stats.totalChecked} 项，合格 ${stats.totalPassed} 项，生成返工 ${stats.totalReworkGenerated} 项，关闭返工 ${stats.totalReworkClosed} 项。`,
    );
    if (stats.processStats.length > 0) {
      lines.push('');
      lines.push('— 各工序明细 —');
      stats.processStats.forEach((s) => {
        const p = getProcessById(s.processId);
        lines.push(
          `${p?.emoji ?? ''} ${p?.name ?? s.processId}：查 ${s.checked} / 合格 ${s.passed} / 返工 ${s.reworkGenerated} / 关闭 ${s.reworkClosed}`,
        );
      });
    }
    if (totalOpen > 0) {
      lines.push('');
      lines.push(`— 未关闭返工汇总（共 ${totalOpen} 项${totalOverdue > 0 ? `，超期 ${totalOverdue} 项` : ''}）—`);
      openReworkStats.forEach((s) => {
        const p = getProcessById(s.processId);
        const earliest = s.earliestDate ? formatDateCN(s.earliestDate) : '-';
        lines.push(
          `${p?.emoji ?? ''} ${p?.name ?? s.processId}：未关 ${s.count} 项${s.overdueCount > 0 ? `(超期${s.overdueCount})` : ''}，最早计划 ${earliest}`,
        );
      });
      lines.push('');
      lines.push('⚠️ 未关闭项请按时复测关闭，超期项优先处理！');
    } else {
      lines.push('');
      lines.push('✅ 无未关闭返工，状态良好！');
    }
    lines.push(`— 班组长 ${formatDateCN(formatDate())} 汇总`);
    return lines.join('\n');
  }, [mode, rangeLabel, stats, openReworkStats]);

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wechatText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = wechatText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">班组长日报</h1>
          <p className="text-[15px] text-gray-500">
            {rangeLabel} 汇总 · 共 {stats.processStats.length} 道工序
          </p>
        </div>
        <div className="text-3xl">📊</div>
      </header>

      <section>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => setMode('today')}
            className={`h-12 rounded-2xl font-black text-[15px] btn-tap flex items-center justify-center gap-1.5 ${
              mode === 'today'
                ? 'bg-primary-600 text-white shadow-btn'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            <Calendar size={16} />
            今天
          </button>
          <button
            onClick={() => setMode('week')}
            className={`h-12 rounded-2xl font-black text-[15px] btn-tap flex items-center justify-center gap-1.5 ${
              mode === 'week'
                ? 'bg-primary-600 text-white shadow-btn'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            <CalendarDays size={16} />
            本周
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`h-12 rounded-2xl font-black text-[15px] btn-tap flex items-center justify-center gap-1.5 ${
              mode === 'custom'
                ? 'bg-primary-600 text-white shadow-btn'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            <CalendarRange size={16} />
            自定义
          </button>
        </div>

        {mode === 'today' && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
            {dates.map((d) => {
              const isToday = d === formatDate();
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`shrink-0 h-11 px-4 rounded-full font-bold text-[15px] btn-tap ${
                    selectedDay === d
                      ? 'bg-primary-600 text-white shadow-btn'
                      : 'bg-white text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  {isToday ? '今天' : formatDateCN(d)}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-gray-600 mb-1">
                开始日期
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 bg-white focus:outline-none focus:border-primary-500 font-bold text-[15px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-600 mb-1">
                结束日期
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border-2 border-gray-200 bg-white focus:outline-none focus:border-primary-500 font-bold text-[15px]"
              />
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4 bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center">
              <ClipboardList size={20} className="text-primary-700" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-500">检查项</div>
              <div className="text-display font-black text-darkblue-800">
                {stats.totalChecked}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-success-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-success-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-success-700" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-500">合格项</div>
              <div className="text-display font-black text-success-700">
                {stats.totalPassed}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-warning-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warning-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-warning-700" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-500">生成返工</div>
              <div className="text-display font-black text-warning-700">
                {stats.totalReworkGenerated}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-darkblue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-darkblue-100 flex items-center justify-center">
              <Lock size={20} className="text-darkblue-700" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-500">关闭返工</div>
              <div className="text-display font-black text-darkblue-800">
                {stats.totalReworkClosed}
              </div>
            </div>
          </div>
        </div>
      </section>

      {openReworkStats.length > 0 && (
        <section className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Wrench size={18} className="text-purple-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-black text-darkblue-800">
                未关闭返工汇总
              </h3>
              <p className="text-[13px] text-gray-500">
                共 {openReworkStats.reduce((s, r) => s + r.count, 0)} 项，超期{' '}
                {openReworkStats.reduce((s, r) => s + r.overdueCount, 0)} 项
              </p>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {openReworkStats.map((s) => {
              const p = getProcessById(s.processId);
              return (
                <div
                  key={s.processId}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p?.gradient} flex items-center justify-center text-xl shadow-inner shrink-0`}
                  >
                    {p?.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-darkblue-800">
                        {p?.name}
                      </span>
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                        欠 {s.count} 项
                      </span>
                      {s.overdueCount > 0 && (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-danger-100 text-danger-700">
                          超期 {s.overdueCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[13px] text-gray-500 flex items-center gap-1">
                      <CalendarDays size={12} />
                      最早计划 {s.earliestDate ? formatDateCN(s.earliestDate) : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {stats.processStats.length === 0 ? (
        <section className="card p-8 text-center">
          <div className="text-7xl mb-4">📅</div>
          <h2 className="text-heading font-black text-darkblue-800">
            {rangeLabel} 暂无检查记录
          </h2>
          <p className="mt-2 text-[15px] text-gray-500">
            去「今日自检」完成检查后，这里会自动汇总
          </p>
        </section>
      ) : (
        <section className="space-y-2">
          <div className="text-[14px] font-bold text-gray-600 flex items-center gap-2">
            🛠 各工序明细
          </div>
          {stats.processStats.map((s) => {
            const p = getProcessById(s.processId);
            return (
              <article
                key={s.processId}
                className="card p-4 flex items-center gap-3 animate-bounce-in"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p?.gradient} flex items-center justify-center text-2xl shadow-inner shrink-0`}
                >
                  {p?.emoji}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[12px] text-gray-500 font-bold">检查</div>
                    <div className="text-lg font-black text-darkblue-800">
                      {s.checked}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500 font-bold">合格</div>
                    <div className="text-lg font-black text-success-700">{s.passed}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500 font-bold">返工</div>
                    <div className="text-lg font-black text-warning-700">
                      {s.reworkGenerated}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-gray-500 font-bold">关闭</div>
                    <div className="text-lg font-black text-darkblue-700">
                      {s.reworkClosed}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="pt-2 pb-4">
        <div className="flex items-center gap-2 mb-2 text-[14px] font-bold text-gray-600">
          📱 一键复制微信群通知
        </div>
        <div className="card p-4 bg-slate-50">
          <pre className="whitespace-pre-wrap text-[14px] leading-7 text-gray-700 font-sans">
            {wechatText}
          </pre>
          <button
            onClick={handleCopy}
            className={`mt-4 w-full h-14 rounded-2xl font-black text-[17px] btn-tap text-white flex items-center justify-center gap-2 ${
              copied
                ? 'bg-success-500'
                : 'bg-gradient-to-r from-primary-600 to-primary-800 shadow-btn'
            }`}
          >
            {copied ? (
              <>
                <CheckCheck size={22} strokeWidth={2.5} />
                已复制到剪贴板
              </>
            ) : (
              <>
                <Copy size={22} strokeWidth={2.5} />
                复制汇总内容
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

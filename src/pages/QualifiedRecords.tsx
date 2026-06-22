import { useMemo, useState } from 'react';
import { CheckCircle2, Calendar, ChevronDown } from 'lucide-react';
import { useQualityStore } from '@/store/qualityStore';
import { PROCESSES, getCheckItemById, getProcessById } from '@/data/config';
import { getLastNDates, formatDateCN, formatTime } from '@/utils/helpers';
import type { ProcessType, ItemFinalStatus } from '@/types';
import {
  isItemFinallyPassed,
  getFinalValue,
  getFinalPhoto,
  getItemFinalStatus,
} from '@/types';

export default function QualifiedRecords() {
  const { getRecordsByDateAndProcess } = useQualityStore();
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterProcess, setFilterProcess] = useState<ProcessType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dates = useMemo(() => getLastNDates(14), []);
  const allRecords = useMemo(
    () => getRecordsByDateAndProcess(filterDate, filterProcess),
    [filterDate, filterProcess, getRecordsByDateAndProcess],
  );

  const records = useMemo(() => {
    return allRecords.filter((r) =>
      r.results.every((res) => {
        const item = getCheckItemById(res.itemId);
        if (!item) return false;
        return isItemFinallyPassed(res, item.allowMax, item.allowMin);
      }),
    );
  }, [allRecords]);

  const totalCount = records.length;
  const passedItemCount = records.reduce((sum, r) => {
    return sum + r.results.length;
  }, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">合格记录</h1>
          <p className="text-[15px] text-gray-500">
            已通过 {totalCount} 次检查，共 {passedItemCount} 项
          </p>
        </div>
        <div className="text-3xl">✅</div>
      </header>

      <section>
        <div className="flex items-center gap-2 mb-2 text-[14px] font-bold text-gray-600">
          <Calendar size={16} />
          选择日期
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
          <button
            onClick={() => setFilterDate(null)}
            className={`shrink-0 h-11 px-4 rounded-full font-bold text-[15px] btn-tap ${
              filterDate === null
                ? 'bg-primary-600 text-white shadow-btn'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            全部
          </button>
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setFilterDate(d)}
              className={`shrink-0 h-11 px-4 rounded-full font-bold text-[15px] btn-tap ${
                filterDate === d
                  ? 'bg-primary-600 text-white shadow-btn'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              {formatDateCN(d)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterProcess('all')}
            className={`h-11 px-4 rounded-full font-bold text-[14px] btn-tap ${
              filterProcess === 'all'
                ? 'bg-darkblue-800 text-white'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            全部工序
          </button>
          {PROCESSES.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProcess(p.id)}
              className={`h-11 px-4 rounded-full font-bold text-[14px] btn-tap flex items-center gap-1 ${
                filterProcess === p.id
                  ? 'text-white ' + `bg-gradient-to-r ${p.gradient}`
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <span>{p.emoji}</span>
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const process = getProcessById(r.processId);
            const expanded = expandedId === r.id;
            const items = r.results
              .map((res) => {
                const item = getCheckItemById(res.itemId);
                if (!item) return null;
                const status = getItemFinalStatus(res, item.allowMax, item.allowMin);
                const passed = isItemFinallyPassed(
                  res,
                  item.allowMax,
                  item.allowMin,
                );
                const finalValue = getFinalValue(res);
                const finalPhoto = getFinalPhoto(res);
                return {
                  ...item,
                  result: res,
                  ok: passed,
                  status,
                  finalValue,
                  finalPhoto,
                };
              })
              .filter(
                Boolean,
              ) as Array<ReturnType<typeof getCheckItemById> & {
              result: (typeof r.results)[number];
              ok: boolean;
              status: ItemFinalStatus;
              finalValue: number | null;
              finalPhoto: string | null;
            }>;
            const hasReworkClosed = items.some((it) => it.status === 'rework_closed');
            const hasFixed = items.some((it) => it.status === 'fixed');

            const badgeText = hasReworkClosed
              ? '含返工合格'
              : hasFixed
                ? '含当场修补'
                : '全部合格';
            const badgeClass = hasReworkClosed
              ? 'bg-primary-100 text-primary-700'
              : hasFixed
                ? 'bg-warning-100 text-warning-700'
                : 'bg-success-100 text-success-700';

            return (
              <article
                key={r.id}
                className="card overflow-hidden animate-bounce-in"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 text-left btn-tap"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${process?.gradient} flex items-center justify-center text-3xl shadow-inner shrink-0`}
                  >
                    {process?.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-subheading font-black text-darkblue-800">
                        {process?.name}工程
                      </h3>
                      <span
                        className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[14px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDateCN(r.date)}
                      </span>
                      <span>{formatTime(r.timestamp)}</span>
                      <span>
                        {items.length}项
                      </span>
                    </div>
                  </div>
                  <div
                    className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                  >
                    <ChevronDown size={24} className="text-gray-400" />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2 animate-bounce-in">
                    {items.map((it, i) => {
                      const statusLabel =
                        it.status === 'passed'
                          ? '合格'
                          : it.status === 'fixed'
                            ? '当场修补'
                            : it.status === 'rework_closed'
                              ? '返工合格'
                              : '待返工';
                      const statusClass =
                        it.status === 'passed'
                          ? 'bg-success-100 text-success-700'
                          : it.status === 'fixed'
                            ? 'bg-warning-100 text-warning-700'
                            : it.status === 'rework_closed'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-danger-100 text-danger-700';

                      return (
                        <div
                          key={it.id}
                          className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 font-black text-[12px] text-gray-600">
                                {i + 1}
                              </span>
                              <span className="font-bold text-darkblue-800 text-[15px]">
                                {it.name}
                              </span>
                            </div>
                            <span
                              className={`text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <div>
                              <span className="text-[12px] text-gray-500">
                                {it.status === 'rework_closed' ? '复测值' : '测量值'}
                              </span>
                              <div
                                className={`text-xl font-black ${
                                  it.ok ? 'text-success-700' : 'text-danger-700'
                                }`}
                              >
                                {it.finalValue}
                                <span className="text-sm font-medium ml-1 text-gray-400">
                                  {it.unit}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[12px] text-gray-500">允许范围</span>
                              <div className="text-[15px] font-bold text-gray-600">
                                {it.allowMin !== undefined
                                  ? `${it.allowMin} ~ +${it.allowMax}`
                                  : `≤${it.allowMax}`}{' '}
                                {it.unit}
                              </div>
                            </div>
                            {it.finalPhoto && (
                              <div className="ml-auto relative">
                                <img
                                  src={it.finalPhoto}
                                  alt="现场照片"
                                  className="w-16 h-16 rounded-xl object-cover shadow-sm"
                                />
                                {it.status === 'rework_closed' && (
                                  <span className="absolute -top-1 -right-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                                    复测
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <div className="text-7xl mb-4">📋</div>
      <h2 className="text-heading font-black text-darkblue-800">还没有合格记录</h2>
      <p className="mt-2 text-[15px] text-gray-500 max-w-[280px] mx-auto">
        检查项合格、当场修补、或返工复测合格关闭后，会自动出现在这里
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-[14px] text-primary-700 bg-primary-50 px-4 py-2 rounded-full font-bold">
        <CheckCircle2 size={16} /> 去「今日自检」开始检查吧
      </div>
    </div>
  );
}

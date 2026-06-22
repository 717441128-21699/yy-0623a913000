import { useMemo, useState } from 'react';
import { CheckCircle2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useQualityStore, isPassedValue } from '@/store/qualityStore';
import { PROCESSES, getCheckItemById, getProcessById } from '@/data/config';
import { getLastNDates, formatDateCN, formatTime } from '@/utils/helpers';
import type { ProcessType } from '@/types';

export default function QualifiedRecords() {
  const { getRecordsByDateAndProcess } = useQualityStore();
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterProcess, setFilterProcess] = useState<ProcessType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dates = useMemo(() => getLastNDates(14), []);
  const records = useMemo(
    () => getRecordsByDateAndProcess(filterDate, filterProcess),
    [filterDate, filterProcess, getRecordsByDateAndProcess],
  );

  const totalCount = records.length;
  const passedItemCount = records.reduce((sum, r) => {
    return (
      sum +
      r.results.filter((res) => {
        const item = getCheckItemById(res.itemId);
        if (!item) return false;
        return (
          isPassedValue(res.value, item.allowMax, item.allowMin) || res.fixedOnSite
        );
      }).length
    );
  }, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">合格记录</h1>
          <p className="text-[15px] text-gray-500">
            共 {totalCount} 次检查，{passedItemCount} 项合格
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
            const items = r.results.map((res) => {
              const item = getCheckItemById(res.itemId);
              if (!item) return null;
              const ok =
                isPassedValue(res.value, item.allowMax, item.allowMin) || res.fixedOnSite;
              return { ...item, result: res, ok };
            }).filter(Boolean) as Array<ReturnType<typeof getCheckItemById> & { result: typeof r.results[number]; ok: boolean }>;
            const allOk = items.every((it) => it.ok);
            const okCount = items.filter((it) => it.ok).length;

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
                    <div className="flex items-center gap-2">
                      <h3 className="text-subheading font-black text-darkblue-800">
                        {process?.name}工程
                      </h3>
                      {allOk ? (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-success-100 text-success-700">
                          全部合格
                        </span>
                      ) : (
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
                          含修补项
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[14px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDateCN(r.date)}
                      </span>
                      <span>{formatTime(r.timestamp)}</span>
                      <span>
                        {okCount}/{items.length}项
                      </span>
                    </div>
                  </div>
                  <div className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={24} className="text-gray-400" />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2 animate-bounce-in">
                    {items.map((it, i) => (
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
                          {it.ok ? (
                            <CheckCircle2
                              size={20}
                              className="text-success-600 shrink-0 mt-0.5"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 shrink-0">
                              修补
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <div>
                            <span className="text-[12px] text-gray-500">测量值</span>
                            <div className="text-xl font-black text-darkblue-800">
                              {it.result.value}
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
                          {it.result.photo && (
                            <img
                              src={it.result.photo}
                              alt="照片"
                              className="w-16 h-16 rounded-xl object-cover ml-auto shadow-sm"
                            />
                          )}
                        </div>
                      </div>
                    ))}
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
      <h2 className="text-heading font-black text-darkblue-800">还没有记录</h2>
      <p className="mt-2 text-[15px] text-gray-500 max-w-[280px] mx-auto">
        完成今日自检后，合格的数据会自动出现在这里
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-[14px] text-primary-700 bg-primary-50 px-4 py-2 rounded-full font-bold">
        👉 去「今日自检」开始检查吧
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { useQualityStore } from '@/store/qualityStore';
import { PROCESSES, getCheckItemById, getProcessById } from '@/data/config';
import { formatDate, getLastNDates, formatDateCN } from '@/utils/helpers';
import { isItemFinallyPassed, getItemFinalStatus } from '@/types';
import type { ProcessType } from '@/types';

interface ProcessStat {
  processId: ProcessType;
  checked: number;
  passed: number;
  reworkGenerated: number;
  reworkClosed: number;
}

export default function DailyReport() {
  const { records, reworkItems } = useQualityStore();
  const dates = useMemo(() => getLastNDates(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate());

  const stats = useMemo(() => {
    const dayRecords = records.filter((r) => r.date === selectedDate);

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

    dayRecords.forEach((rec) => {
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
      const d = new Date(r.createdAt);
      return formatDate(d) === selectedDate;
    });
    const reworkClosed = reworkItems.filter((r) => {
      if (!r.closedAt) return false;
      const d = new Date(r.closedAt);
      return formatDate(d) === selectedDate;
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
      (s) => s.checked > 0 || s.reworkClosed > 0,
    );

    return {
      totalChecked,
      totalPassed,
      totalReworkGenerated: reworkGenerated.length,
      totalReworkClosed: reworkClosed.length,
      processStats,
    };
  }, [selectedDate, records, reworkItems]);

  const wechatText = useMemo(() => {
  const dateLabel = formatDateCN(selectedDate);
  const lines: string[] = [];
  lines.push(`【${dateLabel} 班组长质量日报】`);
  lines.push('');
  lines.push(
    `📊 今日共检查 ${stats.totalChecked} 项，合格 ${stats.totalPassed} 项，生成返工 ${stats.totalReworkGenerated} 项，关闭返工 ${stats.totalReworkClosed} 项。`,
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
  lines.push('');
  if (stats.totalReworkGenerated > 0) {
    lines.push(`⚠️ 待处理返工项请按时复测，别放过！`);
  } else {
    lines.push(`✅ 今日无新增返工，继续保持！`);
  }
  return lines.join('\n');
}, [selectedDate, stats]);

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
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">班组长日报</h1>
          <p className="text-[15px] text-gray-500">按日期、工序汇总</p>
        </div>
        <div className="text-3xl">📊</div>
      </header>

      <section>
        <div className="flex items-center gap-2 mb-2 text-[14px] font-bold text-gray-600">
          <Calendar size={16} />
          选择日期
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
          {dates.map((d) => {
            const isToday = d === formatDate();
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 h-11 px-4 rounded-full font-bold text-[15px] btn-tap ${
                  selectedDate === d
                    ? 'bg-primary-600 text-white shadow-btn'
                    : 'bg-white text-gray-600 border-2 border-gray-200'
                }`}
              >
                {isToday ? '今天' : formatDateCN(d)}
              </button>
            );
          })}
        </div>
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

      {stats.processStats.length === 0 ? (
        <section className="card p-8 text-center">
          <div className="text-7xl mb-4">📅</div>
          <h2 className="text-heading font-black text-darkblue-800">
            今日还没有检查记录
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
          📱 一键复制微信通知
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
                复制日报内容
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

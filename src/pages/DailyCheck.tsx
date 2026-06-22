import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useQualityStore, isPassedValue } from '@/store/qualityStore';
import { PROCESSES, getCheckItemsByProcess, getProcessById } from '@/data/config';
import { formatDate, todayCN, tomorrowCN } from '@/utils/helpers';
import MeasureDiagram from '@/components/MeasureDiagram';
import PhotoUpload from '@/components/PhotoUpload';
import type { ProcessType } from '@/types';

export default function DailyCheck() {
  const {
    selectedProcess,
    tempResults,
    selectProcess,
    initTempResults,
    updateTempResult,
    resetTempResults,
    submitInspection,
  } = useQualityStore();

  const checkItems = useMemo(
    () => (selectedProcess ? getCheckItemsByProcess(selectedProcess) : []),
    [selectedProcess],
  );

  const [resultTip, setResultTip] = useState<{
    ok: boolean;
    title: string;
    detail: string[];
  } | null>(null);

  const allFilled = useMemo(() => {
    return checkItems.every(
      (it) =>
        tempResults[it.id]?.value !== null &&
        tempResults[it.id]?.photo !== null &&
        tempResults[it.id]?.fixedOnSite !== null &&
        tempResults[it.id]?.fixedOnSite !== undefined,
    );
  }, [checkItems, tempResults]);

  const handleSelectProcess = (p: ProcessType) => {
    selectProcess(p);
    initTempResults(p);
    setResultTip(null);
  };

  const handleBack = () => {
    resetTempResults();
    setResultTip(null);
  };

  const handleSubmit = () => {
    if (!allFilled) return;
    const res = submitInspection();
    if (!res.success) return;
    if (res.generatedRework.length === 0) {
      setResultTip({
        ok: true,
        title: '✅ 全部合格！',
        detail: ['所有实测项均在允许范围内', '已自动记入「合格记录」'],
      });
    } else {
      const items = res.generatedRework.map(
        (r) => `⚠ ${r.itemName} 偏差${r.originalValue}mm → 通知 ${r.workerName}`,
      );
      setResultTip({
        ok: false,
        title: '📋 已生成返工清单',
        detail: [
          `共 ${res.generatedRework.length} 项超差，需返工处理`,
          ...items,
          `计划日期：${tomorrowCN()}`,
        ],
      });
    }
  };

  const handleValueChange = (itemId: string, raw: string) => {
    const v = raw === '' || raw === '-' || raw === '.' ? null : parseFloat(raw);
    updateTempResult(itemId, { value: isNaN(v as number) ? null : (v as number) });
  };

  const handleToggleFix = (itemId: string, fixed: boolean) => {
    updateTempResult(itemId, { fixedOnSite: fixed });
  };

  const handlePhotoChange = (itemId: string, v: string | null) => {
    updateTempResult(itemId, { photo: v });
  };

  const processInfo = selectedProcess ? getProcessById(selectedProcess) : null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">今日自检</h1>
          <p className="text-[15px] text-gray-500">{todayCN()} · 收工前检查</p>
        </div>
        <div className="text-3xl">📋</div>
      </header>

      {!selectedProcess && (
        <section>
          <h2 className="text-subheading font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>选择负责工序</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {PROCESSES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProcess(p.id)}
                className={`card relative p-4 pt-5 pb-6 text-left btn-tap hover:shadow-card-hover transition-all animate-bounce-in border-2 border-transparent`}
              >
                <div
                  className={`w-full h-20 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-5xl shadow-inner`}
                >
                  <span className="drop-shadow-sm">{p.emoji}</span>
                </div>
                <div className="mt-3 text-heading font-black text-darkblue-800">
                  {p.name}
                </div>
                <div className="text-[14px] text-gray-500">
                  {getCheckItemsByProcess(p.id).length} 个实测项
                </div>
                <ArrowRight
                  className="absolute right-4 bottom-4 text-gray-300"
                  size={20}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedProcess && processInfo && !resultTip && (
        <section className="space-y-4">
          <div
            className={`card p-4 flex items-center gap-3 bg-gradient-to-r ${processInfo.gradient} text-white`}
          >
            <div className="text-4xl">{processInfo.emoji}</div>
            <div className="flex-1">
              <div className="text-heading font-black">{processInfo.name}工程</div>
              <div className="text-[14px] opacity-90">
                共 {checkItems.length} 项，请逐项填写
              </div>
            </div>
            <button
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center btn-tap"
              aria-label="返回选工序"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-4">
            {checkItems.map((item, i) => {
              const r = tempResults[item.id];
              const value = r?.value;
              const passed =
                value !== null &&
                value !== undefined &&
                isPassedValue(value, item.allowMax, item.allowMin);
              const allowText =
                item.allowMin !== undefined
                  ? `允许偏差 ${item.allowMin} ~ +${item.allowMax} ${item.unit}`
                  : `允许偏差 ≤${item.allowMax} ${item.unit}`;

              return (
                <article
                  key={item.id}
                  className={`card overflow-hidden animate-bounce-in border-l-[6px] ${
                    value === null
                      ? 'border-l-gray-200'
                      : passed
                        ? 'border-l-success-600'
                        : 'border-l-danger-600'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="p-4 pb-3 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-black text-[15px]">
                          {i + 1}
                        </span>
                        <h3 className="text-subheading font-black text-darkblue-800">
                          {item.name}
                        </h3>
                      </div>
                      <div className="mt-1 text-[14px] text-gray-500 flex items-center gap-1">
                        <Info size={14} />
                        {allowText}
                      </div>
                    </div>
                    {value !== null && (
                      passed ? (
                        <CheckCircle2
                          size={28}
                          className="text-success-600 shrink-0"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <XCircle
                          size={28}
                          className="text-danger-600 shrink-0 animate-pulse-soft"
                          strokeWidth={2.5}
                        />
                      )
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 p-2">
                      <MeasureDiagram type={item.diagramType} />
                      <div className="text-center text-[13px] text-gray-600 font-medium -mt-1 px-3 py-1 rounded-xl bg-primary-50 inline-block mx-auto w-full">
                        💡 {item.measureTip}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-gray-700 mb-2">
                        输入测量值 ({item.unit})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          placeholder="请输入数值"
                          value={value === null ? '' : String(value)}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          className={`input-big pr-16 ${
                            value !== null && !passed
                              ? 'border-danger-500 bg-danger-50 text-danger-700'
                              : value !== null && passed
                                ? 'border-success-500 bg-success-50 text-success-700'
                                : ''
                          }`}
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">
                          {item.unit}
                        </span>
                      </div>
                      {value !== null && !passed && (
                        <div className="mt-2 flex items-center gap-2 text-[14px] font-bold text-danger-600 bg-danger-50 px-3 py-2 rounded-xl">
                          <AlertTriangle size={18} />
                          超差！已超出允许范围
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-gray-700 mb-2">
                        现场照片
                        {r?.photo === null && (
                          <span className="ml-2 text-warning-600 text-[13px]">*必填</span>
                        )}
                      </label>
                      <PhotoUpload
                        value={r?.photo ?? null}
                        onChange={(v) => handlePhotoChange(item.id, v)}
                      />
                      {r?.photo === null && (
                        <div className="mt-2 flex items-center gap-2 text-[14px] font-bold text-warning-700 bg-warning-50 px-3 py-2 rounded-xl">
                          <span className="text-lg">📷</span>
                          请拍一张现场照片再提交
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-gray-700 mb-2">
                        是否当场修补？
                        {(r?.fixedOnSite === null || r?.fixedOnSite === undefined) && (
                          <span className="ml-2 text-warning-600 text-[13px]">*必填</span>
                        )}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleFix(item.id, false)}
                          className={`h-16 rounded-2xl font-black text-[17px] btn-tap border-2 transition-all ${
                            r?.fixedOnSite === false
                              ? 'bg-danger-50 border-danger-500 text-danger-700 shadow-btn'
                              : 'bg-white border-gray-200 text-gray-400'
                          }`}
                        >
                          <span className="block text-2xl leading-none mb-1">❌</span>
                          未修补
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFix(item.id, true)}
                          className={`h-16 rounded-2xl font-black text-[17px] btn-tap border-2 transition-all ${
                            r?.fixedOnSite === true
                              ? 'bg-success-500 border-success-600 text-white shadow-btn'
                              : 'bg-white border-gray-200 text-gray-400'
                          }`}
                        >
                          <span className="block text-2xl leading-none mb-1">✅</span>
                          已修补
                        </button>
                      </div>
                      {(r?.fixedOnSite === null || r?.fixedOnSite === undefined) && (
                        <div className="mt-2 flex items-center gap-2 text-[14px] font-bold text-warning-700 bg-warning-50 px-3 py-2 rounded-xl">
                          <span className="text-lg">⚙️</span>
                          请选择是否当场修补
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pt-2 pb-4">
            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className={`btn-primary w-full h-[72px] text-2xl font-black rounded-3xl ${
                !allFilled ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <ArrowRight size={28} strokeWidth={3} />
              提交自检记录
            </button>
            {!allFilled && (
              <div className="mt-2 text-center">
                {(() => {
                  const missingValue = checkItems.filter(
                    (it) => tempResults[it.id]?.value === null,
                  ).length;
                  const missingPhoto = checkItems.filter(
                    (it) => tempResults[it.id]?.photo === null,
                  ).length;
                  const missingFix = checkItems.filter(
                    (it) =>
                      tempResults[it.id]?.fixedOnSite === null ||
                      tempResults[it.id]?.fixedOnSite === undefined,
                  ).length;
                  const tips: string[] = [];
                  if (missingValue > 0) tips.push(`${missingValue} 项未填数值`);
                  if (missingPhoto > 0) tips.push(`${missingPhoto} 项缺照片`);
                  if (missingFix > 0) tips.push(`${missingFix} 项未选修补状态`);
                  return (
                    <p className="text-[14px] text-warning-600 font-bold">
                      ⚠ 还差：{tips.join('、')}
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {resultTip && (
        <section className="animate-bounce-in">
          <div
            className={`card p-6 text-center ${
              resultTip.ok
                ? 'bg-gradient-to-br from-success-50 to-white border-2 border-success-200'
                : 'bg-gradient-to-br from-warning-50 to-white border-2 border-warning-500/40'
            }`}
          >
            <div className="text-6xl mb-3">{resultTip.ok ? '🎉' : '📝'}</div>
            <h2 className="text-heading font-black text-darkblue-800 mb-3">
              {resultTip.title}
            </h2>
            <ul className="space-y-2 text-left inline-block">
              {resultTip.detail.map((d, i) => (
                <li
                  key={i}
                  className="text-[16px] text-gray-700 font-medium flex items-start gap-2"
                >
                  <span className="text-primary-700">•</span>
                  {d}
                </li>
              ))}
            </ul>
            <button
              onClick={handleBack}
              className="btn-primary w-full mt-6 h-16 text-xl rounded-3xl"
            >
              继续下一个工序 →
            </button>
          </div>
          <p className="text-center text-[13px] text-gray-400 mt-4">
            记录时间：{formatDate()} {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </section>
      )}
    </div>
  );
}

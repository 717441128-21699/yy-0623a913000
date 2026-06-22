import { useMemo, useState } from 'react';
import { Wrench, Clock, User, Check, AlertTriangle, ChevronDown, X } from 'lucide-react';
import { useQualityStore, isPassedValue } from '@/store/qualityStore';
import { getProcessById, getCheckItemById } from '@/data/config';
import { formatDateCN } from '@/utils/helpers';
import PhotoUpload from '@/components/PhotoUpload';

interface RetestModalState {
  id: string;
  itemName: string;
  allowMax: number;
  allowMin?: number;
  unit: string;
  originalValue: number;
  processColor: string;
  measureTip: string;
  diagramType: string;
  currentPhoto: string | null;
}

export default function ReworkList() {
  const { reworkItems, getPendingReworks, updateReworkRetest, closeReworkItem, deleteReworkItem } =
    useQualityStore();
  const list = useMemo(() => getPendingReworks(), [reworkItems, getPendingReworks]);
  const [modal, setModal] = useState<RetestModalState | null>(null);
  const [retestValue, setRetestValue] = useState<string>('');
  const [retestPhoto, setRetestPhoto] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  const openRetest = (id: string) => {
    const item = list.find((r) => r.id === id);
    if (!item) return;
    const checkItem = getCheckItemById(item.itemId);
    const process = getProcessById(item.processId);
    setModal({
      id: item.id,
      itemName: item.itemName,
      allowMax: item.allowMax,
      allowMin: checkItem?.allowMin,
      unit: checkItem?.unit ?? 'mm',
      originalValue: item.originalValue,
      processColor: process?.dotColor ?? 'bg-primary-600',
      measureTip: checkItem?.measureTip ?? '',
      diagramType: checkItem?.diagramType ?? 'wall-vertical',
      currentPhoto: item.photo,
    });
    setRetestValue(item.retestValue !== null ? String(item.retestValue) : '');
    setRetestPhoto(item.retestPhoto ?? null);
  };

  const closeModal = () => {
    setModal(null);
    setRetestValue('');
    setRetestPhoto(null);
  };

  const submitRetest = () => {
    if (!modal) return;
    const v = parseFloat(retestValue);
    if (isNaN(v)) return;
    updateReworkRetest(modal.id, v, retestPhoto);
    closeModal();
  };

  const passedCount = list.filter((r) => r.status === 'retest_passed').length;
  const pendingCount = list.filter((r) => r.status === 'pending').length;
  const failedCount = list.filter((r) => r.status === 'retest_failed').length;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">返工清单</h1>
          <p className="text-[15px] text-gray-500">复测合格后关闭，转入记录</p>
        </div>
        <div className="text-3xl">🔧</div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 bg-gradient-to-br from-danger-50 to-white text-center">
          <div className="text-2xl font-black text-danger-700">{pendingCount}</div>
          <div className="text-[13px] text-gray-500 font-medium">待处理</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-warning-50 to-white text-center">
          <div className="text-2xl font-black text-warning-600">{failedCount}</div>
          <div className="text-[13px] text-gray-500 font-medium">需继续</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-success-50 to-white text-center">
          <div className="text-2xl font-black text-success-700">{passedCount}</div>
          <div className="text-[13px] text-gray-500 font-medium">可关闭</div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {list.map((item) => {
            const process = getProcessById(item.processId);
            const isPassed = item.status === 'retest_passed';
            const isFailed = item.status === 'retest_failed';
            return (
              <article
                key={item.id}
                className={`card overflow-hidden border-l-[6px] animate-bounce-in ${
                  isPassed
                    ? 'border-l-success-600'
                    : isFailed
                      ? 'border-l-warning-600'
                      : 'border-l-danger-600'
                }`}
              >
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${process?.dotColor}`}
                      />
                      <h3 className="text-subheading font-black text-darkblue-800">
                        {process?.emoji} {process?.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[13px] font-bold px-3 py-1 rounded-full ${
                        isPassed
                          ? 'bg-success-100 text-success-700'
                          : isFailed
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-danger-100 text-danger-700'
                      }`}
                    >
                      {isPassed ? '复测合格' : isFailed ? '仍超差' : '待返工'}
                    </span>
                  </div>
                  <h2 className="mt-2 text-heading font-black">{item.itemName}</h2>
                </div>

                <div className="px-4 py-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-danger-50 p-3 text-center">
                    <div className="text-[12px] text-danger-600 font-bold">原测量值</div>
                    <div className="text-display font-black text-danger-700 leading-tight mt-1">
                      {item.originalValue}
                      <span className="text-sm font-medium ml-1">mm</span>
                    </div>
                    <div className="text-[12px] text-danger-500">
                      允许≤{item.allowMax}mm
                    </div>
                  </div>
                  {item.retestValue !== null && (
                    <div
                      className={`rounded-2xl p-3 text-center ${
                        isPassed ? 'bg-success-50' : 'bg-warning-50'
                      }`}
                    >
                      <div
                        className={`text-[12px] font-bold ${
                          isPassed ? 'text-success-600' : 'text-warning-600'
                        }`}
                      >
                        复测值
                      </div>
                      <div
                        className={`text-display font-black leading-tight mt-1 ${
                          isPassed ? 'text-success-700' : 'text-warning-700'
                        }`}
                      >
                        {item.retestValue}
                        <span className="text-sm font-medium ml-1">mm</span>
                      </div>
                      <div
                        className={`text-[12px] ${
                          isPassed ? 'text-success-500' : 'text-warning-500'
                        }`}
                      >
                        {isPassed ? '✅ 合格' : '⚠ 仍超差'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mx-4 rounded-2xl bg-slate-50 p-3 mb-3 flex items-center gap-3">
                  {(item.photo || item.retestPhoto) ? (
                    <img
                      src={item.retestPhoto || item.photo!}
                      alt="现场"
                      className="w-16 h-16 rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-2xl">
                      📷
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[14px] font-bold text-warning-700 mb-1">
                      <User size={16} strokeWidth={2.5} />
                      通知 {item.workerName}
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-gray-500">
                      <Clock size={14} />
                      计划：{formatDateCN(item.reworkDate)}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openRetest(item.id)}
                    className="h-16 rounded-2xl font-black text-[17px] btn-tap text-white bg-gradient-to-r from-primary-600 to-primary-800 shadow-btn flex items-center justify-center gap-2"
                  >
                    <Wrench size={22} strokeWidth={2.5} />
                    {item.retestValue !== null ? '再次复测' : '去复测'}
                  </button>
                  {isPassed ? (
                    <button
                      onClick={() => setConfirmClose(item.id)}
                      className="h-16 rounded-2xl font-black text-[17px] btn-tap text-white bg-gradient-to-r from-success-500 to-success-700 shadow-btn flex items-center justify-center gap-2"
                    >
                      <Check size={22} strokeWidth={2.5} />
                      合格关闭
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteReworkItem(item.id)}
                      className="h-16 rounded-2xl font-black text-[17px] btn-tap text-gray-600 bg-white border-2 border-gray-200 flex items-center justify-center gap-2"
                    >
                      <X size={22} strokeWidth={2.5} />
                      清除
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <RetestModal
          modal={modal}
          retestValue={retestValue}
          retestPhoto={retestPhoto}
          onValueChange={setRetestValue}
          onPhotoChange={setRetestPhoto}
          onCancel={closeModal}
          onSubmit={submitRetest}
        />
      )}

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 animate-bounce-in p-4">
          <div className="card w-full max-w-[420px] p-6">
            <div className="text-center">
              <div className="text-6xl mb-2">✅</div>
              <h2 className="text-heading font-black text-darkblue-800">确认关闭？</h2>
              <p className="mt-2 text-[15px] text-gray-600">
                关闭后将自动转入「合格记录」，可在历史中查看
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmClose(null)}
                className="btn-outline h-16 text-[17px]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  closeReworkItem(confirmClose);
                  setConfirmClose(null);
                }}
                className="btn-success h-16 text-[17px]"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h2 className="text-heading font-black text-darkblue-800">暂无待返工项</h2>
      <p className="mt-2 text-[15px] text-gray-500 max-w-[280px] mx-auto">
        所有检查项都已合格，或超差项已当场修补
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-[14px] text-success-700 bg-success-50 px-4 py-2 rounded-full font-bold">
        <Check size={16} /> 质量状态良好，继续保持！
      </div>
    </div>
  );
}

function RetestModal({
  modal,
  retestValue,
  retestPhoto,
  onValueChange,
  onPhotoChange,
  onCancel,
  onSubmit,
}: {
  modal: RetestModalState;
  retestValue: string;
  retestPhoto: string | null;
  onValueChange: (v: string) => void;
  onPhotoChange: (v: string | null) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const v = retestValue === '' || retestValue === '-' ? null : parseFloat(retestValue);
  const passed = v !== null && !isNaN(v) && isPassedValue(v, modal.allowMax, modal.allowMin);

  const allowText =
    modal.allowMin !== undefined
      ? `${modal.allowMin} ~ +${modal.allowMax}`
      : `≤${modal.allowMax}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-slate-50 w-full sm:max-w-[440px] sm:rounded-3xl rounded-t-[32px] max-h-[92vh] overflow-y-auto animate-bounce-in shadow-2xl">
        <div className="sticky top-0 bg-slate-50 pt-4 px-5 pb-3 flex items-center justify-between border-b border-slate-100 z-10">
          <h2 className="text-heading font-black text-darkblue-800">
            🔧 复测「{modal.itemName}」
          </h2>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center btn-tap"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-danger-50 border-2 border-danger-200 p-4 flex items-center gap-4">
            <AlertTriangle size={36} className="text-danger-600 shrink-0" />
            <div>
              <div className="text-[14px] font-bold text-danger-700">原测量值超差</div>
              <div className="text-heading font-black text-danger-800">
                {modal.originalValue}
                <span className="text-[15px] ml-1">mm</span>
                <span className="ml-3 text-sm font-bold text-danger-500">
                  （允许 {allowText} mm）
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-black text-gray-700 mb-2">
              输入复测值 ({modal.unit})
            </label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="请输入复测数值"
              value={retestValue}
              onChange={(e) => onValueChange(e.target.value)}
              className={`input-big text-4xl py-6 ${
                v !== null && passed
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : v !== null
                    ? 'border-danger-500 bg-danger-50 text-danger-700'
                    : ''
              }`}
            />
            {v !== null && (
              <div
                className={`mt-2 text-[15px] font-bold px-4 py-3 rounded-2xl flex items-center gap-2 ${
                  passed
                    ? 'bg-success-50 text-success-700'
                    : 'bg-danger-50 text-danger-700'
                }`}
              >
                <span className="text-2xl">{passed ? '✅' : '❌'}</span>
                <span>
                  {passed ? '复测合格！可关闭此返工项' : '仍超差，请继续整改后再测'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[15px] font-black text-gray-700 mb-2">
              复测现场照片
            </label>
            <PhotoUpload value={retestPhoto} onChange={onPhotoChange} />
          </div>

          {modal.currentPhoto && !retestPhoto && (
            <div>
              <div className="block text-[13px] font-bold text-gray-500 mb-2">
                原始现场照片
              </div>
              <img
                src={modal.currentPhoto}
                alt="原始照片"
                className="w-full max-w-[240px] aspect-[4/3] rounded-2xl object-cover mx-auto shadow-card"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
            <button onClick={onCancel} className="btn-outline h-16 text-[17px]">
              取消
            </button>
            <button
              onClick={onSubmit}
              disabled={v === null || isNaN(v)}
              className={`btn-primary h-16 text-[17px] ${
                v === null || isNaN(v) ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              保存复测
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  Wrench,
  User,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Copy,
  CheckCheck,
  FileText,
  Camera,
} from 'lucide-react';
import { useQualityStore, isPassedValue } from '@/store/qualityStore';
import { getProcessById, getCheckItemById } from '@/data/config';
import { formatDate, formatDateCN, formatTime } from '@/utils/helpers';
import PhotoUpload from '@/components/PhotoUpload';
import type { ProcessType, ReworkItem } from '@/types';

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

function isOverdue(item: ReworkItem): boolean {
  if (item.closedAt) return false;
  const today = formatDate();
  return item.reworkDate < today;
}

interface GroupSection {
  key: string;
  title: string;
  subtitle?: string;
  level: 'danger' | 'warning' | 'normal';
  groups: {
    processId: ProcessType;
    items: ReworkItem[];
  }[];
}

function buildNoticeText(item: ReworkItem): string {
  const process = getProcessById(item.processId);
  const lines: string[] = [];
  lines.push(`【整改通知单】@${item.workerName}`);
  lines.push('');
  lines.push(`工序：${process?.name ?? item.processId}`);
  lines.push(`实测项：${item.itemName}`);
  lines.push(`原测量值：${item.originalValue}mm（允许≤${item.allowMax}mm）`);
  lines.push(`计划整改完成日期：${formatDateCN(item.reworkDate)}`);
  lines.push('');
  lines.push('⚠️ 整改要求：');
  lines.push('1. 请严格按工艺要求完成整改');
  lines.push('2. 整改完成后现场拍照存档（带刻度/靠尺）');
  lines.push('3. 班组长到场复测合格后关闭');
  lines.push('');
  lines.push(`— 班组长 ${formatDateCN(formatDate())} 发出`);
  return lines.join('\n');
}

export default function ReworkList() {
  const {
    reworkItems,
    updateReworkRetest,
    closeReworkItem,
    deleteReworkItem,
  } = useQualityStore();

  const sections = useMemo<GroupSection[]>(() => {
    const active = reworkItems
      .filter((r) => !r.closedAt)
      .slice()
      .sort((a, b) => {
        if (a.reworkDate !== b.reworkDate) return a.reworkDate < b.reworkDate ? -1 : 1;
        return a.createdAt - b.createdAt;
      });
    const overdue = active.filter((r) => isOverdue(r));
    const normal = active.filter((r) => !isOverdue(r));

    const groupByProcess = (items: ReworkItem[]) => {
      const map = new Map<ProcessType, ReworkItem[]>();
      items.forEach((item) => {
        if (!map.has(item.processId)) map.set(item.processId, []);
        map.get(item.processId)!.push(item);
      });
      const processOrder = [
        'plastering',
        'tiling',
        'flooring',
        'masonry',
      ] as ProcessType[];
      const result: { processId: ProcessType; items: ReworkItem[] }[] = [];
      processOrder.forEach((pid) => {
        if (map.has(pid)) result.push({ processId: pid, items: map.get(pid)! });
      });
      return result;
    };

    const result: GroupSection[] = [];
    if (overdue.length > 0) {
      result.push({
        key: 'overdue',
        title: '⚠️ 超期未关闭项',
        subtitle: `共 ${overdue.length} 项，请优先处理`,
        level: 'danger',
        groups: groupByProcess(overdue),
      });
    }
    if (normal.length > 0) {
      result.push({
        key: 'normal',
        title: '📋 按计划处理中',
        subtitle: normal.length > 0 ? `共 ${normal.length} 项` : undefined,
        level: 'normal',
        groups: groupByProcess(normal),
      });
    }
    return result;
  }, [reworkItems]);

  const totalPending = reworkItems.filter(
    (r) => !r.closedAt && r.status === 'pending',
  ).length;
  const totalFailed = reworkItems.filter(
    (r) => !r.closedAt && r.status === 'retest_failed',
  ).length;
  const totalPassed = reworkItems.filter(
    (r) => !r.closedAt && r.status === 'retest_passed',
  ).length;
  const totalOverdue = reworkItems.filter((r) => !r.closedAt && isOverdue(r)).length;

  const [modal, setModal] = useState<RetestModalState | null>(null);
  const [retestValue, setRetestValue] = useState<string>('');
  const [retestPhoto, setRetestPhoto] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [needPhotoModal, setNeedPhotoModal] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    () => sections[0]?.key ?? null,
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const openRetest = (id: string) => {
    const item = reworkItems.find((r) => r.id === id);
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

  const handleTryClose = (id: string) => {
    const item = reworkItems.find((r) => r.id === id);
    if (!item) return;
    if (item.status !== 'retest_passed') return;
    if (!item.retestPhoto) {
      setNeedPhotoModal(id);
      return;
    }
    setConfirmClose(id);
  };

  const activeItems = reworkItems.filter((r) => !r.closedAt);
  if (activeItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-bold text-darkblue-800">返工清单</h1>
          <p className="text-[15px] text-gray-500">超期项置顶，按工序分组处理</p>
        </div>
        <div className="text-3xl">🔧</div>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <div className="card p-3 bg-gradient-to-br from-danger-50 to-white text-center">
          <div className="text-2xl font-black text-danger-700">{totalPending}</div>
          <div className="text-[12px] text-gray-500 font-medium">待处理</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-warning-50 to-white text-center">
          <div className="text-2xl font-black text-warning-600">{totalFailed}</div>
          <div className="text-[12px] text-gray-500 font-medium">需继续</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-success-50 to-white text-center">
          <div className="text-2xl font-black text-success-700">{totalPassed}</div>
          <div className="text-[12px] text-gray-500 font-medium">可关闭</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-purple-50 to-white text-center">
          <div className="text-2xl font-black text-purple-700">{totalOverdue}</div>
          <div className="text-[12px] text-gray-500 font-medium">超期</div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => {
          const secOpen = expandedSection === sec.key;
          const sectionBorder =
            sec.level === 'danger'
              ? 'border-purple-400 border-[3px]'
              : sec.level === 'warning'
                ? 'border-warning-300 border-[2px]'
                : '';
          const headerBg =
            sec.level === 'danger'
              ? 'bg-gradient-to-r from-purple-50 to-white'
              : sec.level === 'warning'
                ? 'bg-gradient-to-r from-warning-50 to-white'
                : '';
          return (
            <section
              key={sec.key}
              className={`card overflow-hidden ${sectionBorder} animate-bounce-in`}
            >
              <button
                onClick={() => setExpandedSection(secOpen ? null : sec.key)}
                className={`w-full p-4 flex items-center gap-3 text-left btn-tap ${headerBg}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    sec.level === 'danger'
                      ? 'bg-purple-100'
                      : sec.level === 'warning'
                        ? 'bg-warning-100'
                        : 'bg-slate-100'
                  }`}
                >
                  {sec.level === 'danger' ? '🚨' : sec.level === 'warning' ? '⏰' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-subheading font-black ${
                      sec.level === 'danger'
                        ? 'text-purple-800'
                        : sec.level === 'warning'
                          ? 'text-warning-700'
                          : 'text-darkblue-800'
                    }`}
                  >
                    {sec.title}
                  </h3>
                  {sec.subtitle && (
                    <p className="text-[13px] text-gray-500">{sec.subtitle}</p>
                  )}
                </div>
                <div
                  className={`transition-transform ${secOpen ? 'rotate-180' : ''}`}
                >
                  <ChevronDown size={22} className="text-gray-400" />
                </div>
              </button>

              {secOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                  {sec.groups.map((pg) => {
                    const process = getProcessById(pg.processId);
                    const items = pg.items;
                    return (
                      <div
                        key={`${sec.key}-${pg.processId}`}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-600 px-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${process?.dotColor}`}
                          />
                          <span>
                            {process?.emoji} {process?.name}（{items.length}项）
                          </span>
                        </div>

                        {items.map((item) => {
                          const isPassed = item.status === 'retest_passed';
                          const isFailed = item.status === 'retest_failed';
                          const isOpen = expandedItem === item.id;
                          const overdue = isOverdue(item);

                          return (
                            <article
                              key={item.id}
                              className={`rounded-2xl border-l-[6px] bg-white overflow-hidden shadow-sm animate-bounce-in ${
                                isPassed
                                  ? 'border-l-success-600'
                                  : isFailed
                                    ? 'border-l-warning-600'
                                    : overdue
                                      ? 'border-l-purple-600'
                                      : 'border-l-danger-600'
                              }`}
                            >
                              <button
                                onClick={() =>
                                  setExpandedItem(isOpen ? null : item.id)
                                }
                                className="w-full p-3 flex items-center gap-3 text-left btn-tap"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-[16px] font-black text-darkblue-800">
                                      {item.itemName}
                                    </h4>
                                    <span
                                      className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                                        isPassed
                                          ? 'bg-success-100 text-success-700'
                                          : isFailed
                                            ? 'bg-warning-100 text-warning-700'
                                            : overdue
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-danger-100 text-danger-700'
                                      }`}
                                    >
                                      {isPassed
                                        ? '复测合格'
                                        : isFailed
                                          ? '仍超差'
                                          : overdue
                                            ? '超期待处理'
                                            : '待返工'}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-3 text-[13px] text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <User size={14} />
                                      {item.workerName}
                                    </span>
                                    <span>原 {item.originalValue}mm</span>
                                    {item.retestValue !== null && (
                                      <span>
                                        复测 {item.retestValue}mm
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                >
                                  <ChevronDown
                                    size={20}
                                    className="text-gray-400"
                                  />
                                </div>
                              </button>

                              {isOpen && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-3 animate-bounce-in">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-[12px] font-bold text-danger-700 mb-1">
                                        原始照片
                                      </div>
                                      {item.photo ? (
                                        <img
                                          src={item.photo}
                                          alt="原始照片"
                                          className="w-full aspect-[4/3] rounded-xl object-cover"
                                        />
                                      ) : (
                                        <div className="w-full aspect-[4/3] rounded-xl bg-slate-200 flex items-center justify-center text-2xl text-gray-400">
                                          📷
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-[12px] font-bold text-primary-700 mb-1 flex items-center gap-1">
                                        复测照片
                                        {item.retestPhoto ? (
                                          <span className="ml-1 bg-primary-100 px-1.5 py-0.5 rounded-full text-[11px]">
                                            已拍
                                          </span>
                                        ) : (
                                          <span className="ml-1 bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded-full text-[11px]">
                                            待补
                                          </span>
                                        )}
                                      </div>
                                      {item.retestPhoto ? (
                                        <img
                                          src={item.retestPhoto}
                                          alt="复测照片"
                                          className="w-full aspect-[4/3] rounded-xl object-cover"
                                        />
                                      ) : (
                                        <div className="w-full aspect-[4/3] rounded-xl bg-slate-200 flex items-center justify-center text-2xl text-gray-400">
                                          📷
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-600">
                                    <div className="bg-white rounded-xl px-3 py-2">
                                      <span className="text-gray-400">
                                        计划日期：
                                      </span>
                                      <span
                                        className={`font-bold ${overdue ? 'text-danger-600' : ''}`}
                                      >
                                        {formatDateCN(item.reworkDate)}
                                        {overdue && '（已超期）'}
                                      </span>
                                    </div>
                                    <div className="bg-white rounded-xl px-3 py-2">
                                      <span className="text-gray-400">
                                        创建时间：
                                      </span>
                                      <span className="font-bold">
                                        {formatDateCN(
                                          formatDate(
                                            new Date(item.createdAt),
                                          ),
                                        )}{' '}
                                        {formatTime(item.createdAt)}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setNoticeModal(item.id)}
                                    className="w-full h-11 rounded-2xl font-bold text-[15px] btn-tap bg-darkblue-800 text-white flex items-center justify-center gap-2"
                                  >
                                    <FileText size={18} strokeWidth={2.5} />
                                    生成整改通知单 · 复制发群
                                  </button>

                                  <div className="grid grid-cols-2 gap-3 pt-1">
                                    <button
                                      onClick={() => openRetest(item.id)}
                                      className="h-14 rounded-2xl font-black text-[16px] btn-tap text-white bg-gradient-to-r from-primary-600 to-primary-800 shadow-btn flex items-center justify-center gap-2"
                                    >
                                      <Wrench size={20} strokeWidth={2.5} />
                                      {item.retestValue !== null
                                        ? '再次复测'
                                        : '去复测'}
                                    </button>
                                    {isPassed ? (
                                      <button
                                        onClick={() => handleTryClose(item.id)}
                                        className="h-14 rounded-2xl font-black text-[16px] btn-tap text-white bg-gradient-to-r from-success-500 to-success-700 shadow-btn flex items-center justify-center gap-2"
                                      >
                                        <Check size={20} strokeWidth={2.5} />
                                        合格关闭
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          deleteReworkItem(item.id)
                                        }
                                        className="h-14 rounded-2xl font-black text-[16px] btn-tap text-gray-600 bg-white border-2 border-gray-200 flex items-center justify-center gap-2"
                                      >
                                        <X size={20} strokeWidth={2.5} />
                                        清除
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

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
                关闭后将自动转入「合格记录」，历史将展示复测值和照片
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

      {needPhotoModal && (
        <NeedPhotoModal
          itemId={needPhotoModal}
          onCancel={() => setNeedPhotoModal(null)}
          onGoRetest={() => {
            const id = needPhotoModal;
            setNeedPhotoModal(null);
            openRetest(id);
          }}
        />
      )}

      {noticeModal && (
        <NoticeModal
          item={reworkItems.find((r) => r.id === noticeModal)!}
          copied={copiedNotice}
          onClose={() => {
            setNoticeModal(null);
            setCopiedNotice(false);
          }}
          onCopy={async () => {
            const item = reworkItems.find((r) => r.id === noticeModal);
            if (!item) return;
            try {
              await navigator.clipboard.writeText(buildNoticeText(item));
            } catch {
              const ta = document.createElement('textarea');
              ta.value = buildNoticeText(item);
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
            setCopiedNotice(true);
            setTimeout(() => setCopiedNotice(false), 2000);
          }}
        />
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

function NeedPhotoModal({
  itemId,
  onCancel,
  onGoRetest,
}: {
  itemId: string;
  onCancel: () => void;
  onGoRetest: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 animate-bounce-in p-4">
      <div className="card w-full max-w-[420px] p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-warning-100 flex items-center justify-center mb-3">
            <Camera size={32} className="text-warning-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-heading font-black text-darkblue-800">
            还缺复测照片
          </h2>
          <p className="mt-2 text-[15px] text-gray-600">
            关闭前必须先拍一张复测现场照片，方便后续历史追踪
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="btn-outline h-16 text-[17px]">
            取消
          </button>
          <button
            onClick={onGoRetest}
            className="h-16 rounded-2xl font-black text-[17px] btn-tap text-white bg-gradient-to-r from-primary-600 to-primary-800 shadow-btn flex items-center justify-center gap-2"
          >
            <Camera size={20} strokeWidth={2.5} />
            去补照片
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeModal({
  item,
  copied,
  onClose,
  onCopy,
}: {
  item: ReworkItem;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
}) {
  const process = getProcessById(item.processId);
  const text = buildNoticeText(item);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 animate-bounce-in p-4">
      <div className="card w-full max-w-[440px] overflow-hidden">
        <div className="p-5 pb-0 flex items-center justify-between">
          <h2 className="text-subheading font-black text-darkblue-800 flex items-center gap-2">
            <FileText size={20} className="text-primary-700" />
            整改通知单
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center btn-tap"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-darkblue-50">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${process?.gradient} flex items-center justify-center text-xl shadow-inner shrink-0`}
            >
              {process?.emoji}
            </div>
            <div>
              <div className="text-[13px] text-gray-500">
                通知 <span className="font-bold text-darkblue-800">{item.workerName}</span>
              </div>
              <div className="text-[15px] font-black text-darkblue-800">
                {item.itemName} · 原测 {item.originalValue}mm
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <pre className="whitespace-pre-wrap text-[14px] leading-7 text-gray-700 font-sans">
              {text}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 pb-1">
            <button onClick={onClose} className="btn-outline h-14 text-[16px]">
              关闭
            </button>
            <button
              onClick={onCopy}
              className={`h-14 rounded-2xl font-black text-[16px] btn-tap text-white flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-success-500'
                  : 'bg-gradient-to-r from-darkblue-700 to-darkblue-900 shadow-btn'
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck size={18} strokeWidth={2.5} />
                  已复制，去发群
                </>
              ) : (
                <>
                  <Copy size={18} strokeWidth={2.5} />
                  一键复制
                </>
              )}
            </button>
          </div>
        </div>
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
            <ChevronRight size={22} className="-rotate-90" />
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
              复测现场照片 <span className="text-warning-600 text-[13px]">*必填</span>
            </label>
            <PhotoUpload value={retestPhoto} onChange={onPhotoChange} />
            {!retestPhoto && (
              <div className="mt-2 flex items-center gap-2 text-[14px] font-bold text-warning-700 bg-warning-50 px-3 py-2 rounded-xl">
                <span className="text-lg">📷</span>
                请拍一张复测现场照片
              </div>
            )}
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
              disabled={v === null || isNaN(v) || !retestPhoto}
              className={`btn-primary h-16 text-[17px] ${
                v === null || isNaN(v) || !retestPhoto
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
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

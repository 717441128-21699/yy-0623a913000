import type { Process, CheckItem, Worker } from '@/types';

export const PROCESSES: Process[] = [
  {
    id: 'plastering',
    name: '抹灰',
    emoji: '🧱',
    gradient: 'from-orange-400 to-orange-600',
    borderColor: 'border-orange-500',
    dotColor: 'bg-orange-500',
  },
  {
    id: 'tiling',
    name: '贴砖',
    emoji: '🔲',
    gradient: 'from-sky-400 to-sky-600',
    borderColor: 'border-sky-500',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'flooring',
    name: '地坪',
    emoji: '🟫',
    gradient: 'from-amber-500 to-amber-700',
    borderColor: 'border-amber-600',
    dotColor: 'bg-amber-600',
  },
  {
    id: 'masonry',
    name: '砌筑',
    emoji: '🏗️',
    gradient: 'from-emerald-500 to-emerald-700',
    borderColor: 'border-emerald-600',
    dotColor: 'bg-emerald-600',
  },
];

export const CHECK_ITEMS: CheckItem[] = [
  // 抹灰 3项
  {
    id: 'p-vert',
    processId: 'plastering',
    name: '立面垂直度',
    unit: 'mm',
    allowMax: 4,
    diagramType: 'wall-vertical',
    measureTip: '2m靠尺垂直靠墙，读取最大读数',
  },
  {
    id: 'p-flat',
    processId: 'plastering',
    name: '表面平整度',
    unit: 'mm',
    allowMax: 4,
    diagramType: 'wall-2m',
    measureTip: '2m靠尺横向放墙面，塞尺量最大缝宽',
  },
  {
    id: 'p-corner',
    processId: 'plastering',
    name: '阴阳角方正',
    unit: 'mm',
    allowMax: 4,
    diagramType: 'corner-square',
    measureTip: '方尺靠在阴阳角，读取偏差值',
  },
  // 贴砖 3项
  {
    id: 't-vert',
    processId: 'tiling',
    name: '立面垂直度',
    unit: 'mm',
    allowMax: 2,
    diagramType: 'wall-vertical',
    measureTip: '2m靠尺垂直贴砖墙面，读数',
  },
  {
    id: 't-flat',
    processId: 'tiling',
    name: '表面平整度',
    unit: 'mm',
    allowMax: 2,
    diagramType: 'wall-2m',
    measureTip: '2m靠尺+塞尺，量砖面缝隙',
  },
  {
    id: 't-gap',
    processId: 'tiling',
    name: '接缝高低差',
    unit: 'mm',
    allowMax: 0.5,
    diagramType: 'floor-level',
    measureTip: '靠尺横放砖缝，测两块砖高低差',
  },
  // 地坪 4项
  {
    id: 'f-flat',
    processId: 'flooring',
    name: '表面平整度',
    unit: 'mm',
    allowMax: 4,
    diagramType: 'floor-2m',
    measureTip: '2m靠尺放地面，塞尺量最大缝隙',
  },
  {
    id: 'f-level',
    processId: 'flooring',
    name: '标高偏差',
    unit: 'mm',
    allowMax: 10,
    allowMin: -10,
    diagramType: 'floor-level',
    measureTip: '水平仪测与基准线高差，正负10内合格',
  },
  {
    id: 'f-gap',
    processId: 'flooring',
    name: '相邻块高低差',
    unit: 'mm',
    allowMax: 2,
    diagramType: 'floor-level',
    measureTip: '靠尺横跨两块地面，塞尺量高低差',
  },
  {
    id: 'f-line',
    processId: 'flooring',
    name: '缝格平直度',
    unit: 'mm',
    allowMax: 3,
    diagramType: 'floor-2m',
    measureTip: '拉5m通线，量缝格最大偏差值',
  },
  // 砌筑 3项
  {
    id: 'm-vert',
    processId: 'masonry',
    name: '墙面垂直度',
    unit: 'mm',
    allowMax: 5,
    diagramType: 'wall-vertical',
    measureTip: '2m托线板靠墙面，读数',
  },
  {
    id: 'm-flat',
    processId: 'masonry',
    name: '表面平整度',
    unit: 'mm',
    allowMax: 8,
    diagramType: 'wall-horizontal',
    measureTip: '2m靠尺+塞尺，墙面横向测量',
  },
  {
    id: 'm-joint',
    processId: 'masonry',
    name: '灰缝平直度',
    unit: 'mm',
    allowMax: 10,
    diagramType: 'wall-horizontal',
    measureTip: '拉通线量10皮砖，最大偏差',
  },
];

export const WORKERS: Worker[] = [
  { id: 'w1', name: '张师傅', processId: 'plastering' },
  { id: 'w2', name: '李师傅', processId: 'tiling' },
  { id: 'w3', name: '王师傅', processId: 'flooring' },
  { id: 'w4', name: '赵师傅', processId: 'masonry' },
  { id: 'w5', name: '刘师傅', processId: 'plastering' },
  { id: 'w6', name: '陈师傅', processId: 'tiling' },
];

export function getProcessById(id: string) {
  return PROCESSES.find(p => p.id === id);
}

export function getCheckItemsByProcess(processId: string) {
  return CHECK_ITEMS.filter(item => item.processId === processId);
}

export function getCheckItemById(id: string) {
  return CHECK_ITEMS.find(item => item.id === id);
}

export function getWorkersByProcess(processId: string) {
  return WORKERS.filter(w => w.processId === processId);
}

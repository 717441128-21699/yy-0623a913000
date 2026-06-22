export type ProcessType = 'plastering' | 'tiling' | 'flooring' | 'masonry';

export type DiagramType =
  | 'wall-vertical'
  | 'wall-horizontal'
  | 'wall-2m'
  | 'floor-level'
  | 'floor-2m'
  | 'brick-plumb'
  | 'corner-square';

export interface Process {
  id: ProcessType;
  name: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  dotColor: string;
}

export interface CheckItem {
  id: string;
  processId: ProcessType;
  name: string;
  unit: string;
  allowMax: number;
  allowMin?: number;
  diagramType: DiagramType;
  measureTip: string;
}

export interface MeasureResult {
  itemId: string;
  value: number | null;
  photo: string | null;
  fixedOnSite: boolean;
  retestValue?: number | null;
  retestPhoto?: string | null;
  reworkClosed?: boolean;
}

export interface InspectionRecord {
  id: string;
  processId: ProcessType;
  date: string;
  timestamp: number;
  results: MeasureResult[];
}

export type ReworkStatus = 'pending' | 'retest_passed' | 'retest_failed';

export interface ReworkItem {
  id: string;
  inspectionId: string;
  itemId: string;
  processId: ProcessType;
  itemName: string;
  workerName: string;
  originalValue: number;
  allowMax: number;
  retestValue: number | null;
  retestPhoto: string | null;
  reworkDate: string;
  status: ReworkStatus;
  photo: string | null;
  createdAt: number;
  closedAt: number | null;
}

export interface Worker {
  id: string;
  name: string;
  processId: ProcessType;
}

export function isPassedValue(value: number | null, allowMax: number, allowMin?: number): boolean {
  if (value === null) return false;
  const abs = Math.abs(value);
  if (allowMin !== undefined) {
    return value >= allowMin && abs <= allowMax;
  }
  return abs <= allowMax;
}

export type ItemFinalStatus = 'passed' | 'fixed' | 'rework_closed' | 'rework_pending';

export function getItemFinalStatus(
  result: MeasureResult,
  allowMax: number,
  allowMin?: number,
): ItemFinalStatus {
  if (result.reworkClosed) return 'rework_closed';
  const passed = isPassedValue(result.value, allowMax, allowMin);
  if (passed) return 'passed';
  if (result.fixedOnSite) return 'fixed';
  return 'rework_pending';
}

export function getFinalValue(result: MeasureResult): number | null {
  if (result.reworkClosed && result.retestValue !== undefined && result.retestValue !== null) {
    return result.retestValue;
  }
  return result.value;
}

export function getFinalPhoto(result: MeasureResult): string | null {
  if (result.reworkClosed && result.retestPhoto) {
    return result.retestPhoto;
  }
  return result.photo;
}

export function isItemFinallyPassed(
  result: MeasureResult,
  allowMax: number,
  allowMin?: number,
): boolean {
  const status = getItemFinalStatus(result, allowMax, allowMin);
  return status === 'passed' || status === 'fixed' || status === 'rework_closed';
}

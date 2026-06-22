import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProcessType,
  MeasureResult,
  InspectionRecord,
  ReworkItem,
  ReworkStatus,
} from '@/types';
import { isPassedValue } from '@/types';
import {
  CHECK_ITEMS,
  getCheckItemById,
  getWorkersByProcess,
  getCheckItemsByProcess,
} from '@/data/config';
import { formatDate, addDays, uid } from '@/utils/helpers';

interface QualityState {
  records: InspectionRecord[];
  reworkItems: ReworkItem[];
  selectedProcess: ProcessType | null;
  tempResults: Record<string, MeasureResult>;

  selectProcess: (p: ProcessType | null) => void;
  initTempResults: (processId: ProcessType) => void;
  updateTempResult: (itemId: string, patch: Partial<MeasureResult>) => void;
  resetTempResults: () => void;

  submitInspection: () => {
    success: boolean;
    generatedRework: ReworkItem[];
  };

  updateReworkRetest: (
    id: string,
    value: number,
    newPhoto?: string | null,
  ) => ReworkStatus;
  closeReworkItem: (id: string) => void;
  deleteReworkItem: (id: string) => void;

  getPendingReworks: () => ReworkItem[];
  getRecordsByDateAndProcess: (
    date: string | null,
    processId: ProcessType | 'all',
  ) => InspectionRecord[];
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set, get) => ({
      records: [],
      reworkItems: [],
      selectedProcess: null,
      tempResults: {},

      selectProcess: (p) => set({ selectedProcess: p }),

      initTempResults: (processId) => {
        const items = getCheckItemsByProcess(processId);
        const temp: Record<string, MeasureResult> = {};
        items.forEach((it) => {
          temp[it.id] = {
            itemId: it.id,
            value: null,
            photo: null,
            fixedOnSite: false,
          };
        });
        set({ tempResults: temp });
      },

      updateTempResult: (itemId, patch) => {
        set((s) => ({
          tempResults: {
            ...s.tempResults,
            [itemId]: { ...s.tempResults[itemId], ...patch },
          },
        }));
      },

      resetTempResults: () => {
        set({ tempResults: {}, selectedProcess: null });
      },

      submitInspection: () => {
        const { selectedProcess, tempResults, records, reworkItems } = get();
        if (!selectedProcess) return { success: false, generatedRework: [] };

        const items = getCheckItemsByProcess(selectedProcess);
        const resultsArr: MeasureResult[] = items.map((it) => tempResults[it.id]);
        const allFilled = resultsArr.every((r) => r?.value !== null);
        if (!allFilled) return { success: false, generatedRework: [] };

        const today = formatDate();
        const inspectionId = 'ins-' + uid();
        const timestamp = Date.now();

        const record: InspectionRecord = {
          id: inspectionId,
          processId: selectedProcess,
          date: today,
          timestamp,
          results: resultsArr,
        };

        const workers = getWorkersByProcess(selectedProcess);
        const generatedRework: ReworkItem[] = [];
        const tomorrow = addDays(today, 1);

        resultsArr.forEach((r, idx) => {
          const item = items[idx];
          const passed = isPassedValue(r.value, item.allowMax, item.allowMin);
          if (!passed && !r.fixedOnSite) {
            const worker = workers[idx % Math.max(workers.length, 1)];
            const rework: ReworkItem = {
              id: 'rw-' + uid(),
              inspectionId,
              itemId: item.id,
              processId: selectedProcess,
              itemName: item.name,
              workerName: worker?.name ?? '待分配',
              originalValue: r.value!,
              allowMax: item.allowMax,
              retestValue: null,
              retestPhoto: null,
              reworkDate: tomorrow,
              status: 'pending',
              photo: r.photo,
              createdAt: timestamp,
              closedAt: null,
            };
            generatedRework.push(rework);
          }
        });

        set({
          records: [record, ...records],
          reworkItems: [...generatedRework, ...reworkItems],
          selectedProcess: null,
          tempResults: {},
        });

        return { success: true, generatedRework };
      },

      updateReworkRetest: (id, value, newPhoto) => {
        const item = get().reworkItems.find((r) => r.id === id);
        if (!item) return 'pending';
        const checkItem = getCheckItemById(item.itemId);
        if (!checkItem) return 'pending';
        const passed = isPassedValue(value, checkItem.allowMax, checkItem.allowMin);
        const status: ReworkStatus = passed ? 'retest_passed' : 'retest_failed';
        set((s) => ({
          reworkItems: s.reworkItems.map((r) =>
            r.id === id
              ? {
                  ...r,
                  retestValue: value,
                  retestPhoto: newPhoto !== undefined ? newPhoto : r.retestPhoto,
                  status,
                }
              : r,
          ),
        }));
        return status;
      },

      closeReworkItem: (id) => {
        set((s) => ({
          reworkItems: s.reworkItems.map((r) =>
            r.id === id ? { ...r, closedAt: Date.now() } : r,
          ),
        }));
      },

      deleteReworkItem: (id) => {
        set((s) => ({
          reworkItems: s.reworkItems.filter((r) => r.id !== id),
        }));
      },

      getPendingReworks: () => {
        return get()
          .reworkItems.filter((r) => !r.closedAt)
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      getRecordsByDateAndProcess: (date, processId) => {
        return get()
          .records.filter((r) => {
            if (date && r.date !== date) return false;
            if (processId !== 'all' && r.processId !== processId) return false;
            return true;
          })
          .sort((a, b) => b.timestamp - a.timestamp);
      },
    }),
    {
      name: 'quality-selfcheck-storage',
      partialize: (state) => ({
        records: state.records,
        reworkItems: state.reworkItems,
      }),
    },
  ),
);

export { isPassedValue, CHECK_ITEMS };

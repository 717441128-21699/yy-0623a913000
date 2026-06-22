export function formatDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}月${d}日`;
}

export function todayCN(): string {
  return formatDateCN(formatDate());
}

export function tomorrowCN(): string {
  return formatDateCN(addDays(formatDate(), 1));
}

export function getLastNDates(n: number): string[] {
  const arr: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(formatDate(d));
  }
  return arr;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  const dataUrl = await fileToBase64(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

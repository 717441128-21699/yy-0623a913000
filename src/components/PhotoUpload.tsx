import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { compressImage } from '@/utils/helpers';

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
  size?: 'normal' | 'small';
}

export default function PhotoUpload({ value, onChange, size = 'normal' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, size === 'small' ? 400 : 700, 0.75);
      onChange(base64);
    } catch {
      onChange(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  if (value) {
    const dimClass =
      size === 'small' ? 'w-20 h-20' : 'w-full max-w-[240px] aspect-[4/3]';
    return (
      <div
        className={`relative ${dimClass} rounded-2xl overflow-hidden shadow-card bg-slate-200 cursor-pointer btn-tap`}
        onClick={handleClick}
      >
        <img src={value} alt="现场照片" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-danger-600 text-white flex items-center justify-center shadow-lg btn-tap"
          aria-label="删除照片"
        >
          <X size={18} strokeWidth={3} />
        </button>
      </div>
    );
  }

  const frameClass =
    size === 'small'
      ? 'w-20 h-20'
      : 'w-full max-w-[240px] aspect-[4/3] mx-auto';

  return (
    <div className={frameClass}>
      <button
        type="button"
        onClick={handleClick}
        className="photo-frame w-full h-full flex flex-col items-center justify-center gap-2 btn-tap text-primary-700"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Camera size={28} strokeWidth={2.2} />
        </div>
        <span className="text-[15px] font-bold">拍现场照片</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, FileCheck } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedFile,
  onClear
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {!selectedFile || !previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[230px] group ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99] shadow-lg shadow-emerald-500/10'
              : 'border-slate-300/80 hover:border-emerald-400 bg-white/60 hover:bg-emerald-50/20 shadow-2xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-100 text-emerald-700 flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm mb-1">
            Drag & drop specimen or <span className="text-emerald-600 underline underline-offset-4 font-bold">browse image</span>
          </h4>
          <p className="text-xs text-slate-400 max-w-xs font-normal">
            Supports JPEG, PNG, WEBP up to 10MB. Specimen scaled to 224×224 normalized RGB tensor.
          </p>
        </div>
      ) : (
        <div className="relative border border-slate-200/90 rounded-3xl p-4 bg-white/80 backdrop-blur-xs shadow-xs">
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition z-10 cursor-pointer shadow-xs"
            title="Remove specimen"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Selected waste specimen"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h5 className="font-bold text-slate-900 text-sm truncate max-w-xs">
                  {selectedFile.name}
                </h5>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB | {selectedFile.type || 'image/jpeg'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                <span>Input Normalized (224×224)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

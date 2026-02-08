import React from 'react';
import { ProductDimensions, ForceType, ForceConfig, MaterialConfig } from '../types';

interface Props {
  dims: ProductDimensions;
  setDims: React.Dispatch<React.SetStateAction<ProductDimensions>>;
  forceType: ForceType;
  setForceType: (t: ForceType) => void;
  forceConfig: ForceConfig;
  setForceMagnitude: (m: number) => void;
  setForcePosition: (x: number) => void;
  material: MaterialConfig;
  setMaterial: React.Dispatch<React.SetStateAction<MaterialConfig>>;
}

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  unit?: string;
  max?: number;
  step?: number;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, unit, max, step }) => (
  <div className="w-full">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
      />
      {unit && <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium select-none">{unit}</span>}
    </div>
  </div>
);

const Controls: React.FC<Props> = ({
  dims, setDims,
  forceType, setForceType,
  forceConfig, setForceMagnitude,
  setForcePosition,
  material, setMaterial
}) => {

  const handleDimChange = (key: keyof ProductDimensions, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setDims(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleMaterialChange = (key: keyof MaterialConfig, value: string) => {
    if (key === 'name') {
      setMaterial(prev => ({ ...prev, name: value }));
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setMaterial(prev => ({ ...prev, [key]: num }));
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

      {/* 1. Material Configuration */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 bg-green-100 rounded-md">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">Vật liệu</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên vật liệu</label>
            <input
              type="text"
              value={material.name}
              onChange={(e) => handleMaterialChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Giới hạn bền" value={material.yieldStrength} unit="MPa" onChange={(v) => handleMaterialChange('yieldStrength', v)} />
            <InputGroup label="Module Đàn hồi" value={material.modulus} unit="MPa" onChange={(v) => handleMaterialChange('modulus', v)} />
          </div>
        </div>
      </div>

      {/* 2. Geometry Configuration */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">Hình học</h3>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <InputGroup label="c (Rộng trái)" value={dims.leftWidth} unit="mm" onChange={(v) => handleDimChange('leftWidth', v)} />
          <InputGroup label="d (Cao tổng)" value={dims.totalHeight} unit="mm" onChange={(v) => handleDimChange('totalHeight', v)} />
          <InputGroup label="e (Cao cuối)" value={dims.endHeight} unit="mm" onChange={(v) => handleDimChange('endHeight', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputGroup label="Chiều dài vát (a)" value={dims.a} unit="mm" onChange={(v) => handleDimChange('a', v)} />
          <InputGroup label="Chiều dài dốc (b)" value={dims.b} unit="mm" onChange={(v) => handleDimChange('b', v)} />
          <InputGroup label="Tổng chiều dài" value={dims.totalLength} unit="mm" onChange={(v) => handleDimChange('totalLength', v)} />
        </div>
      </div>

      {/* 3. Force Configuration - Redesigned */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="p-1.5 bg-red-100 rounded-md">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">Tác động lực</h3>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <InputGroup
            label="Độ lớn lực (Magnitude)"
            value={forceConfig.magnitude}
            unit="N"
            step={100}
            onChange={(v) => setForceMagnitude(parseFloat(v) || 0)}
          />

          <InputGroup
            label="Vị trí đặt lực (x)"
            value={forceConfig.positionX}
            max={dims.totalLength}
            unit="mm"
            onChange={(v) => {
              const val = parseFloat(v);
              if (!isNaN(val)) setForcePosition(Math.min(val, dims.totalLength));
            }}
          />

          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            <button
              onClick={() => setForceType(ForceType.F)}
              className={`py-2 text-sm font-bold rounded-lg border flex justify-center items-center gap-2 transition-all ${forceType === ForceType.F ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
            >
              <span>↓</span> Lực F (Xuống)
            </button>
            <button
              onClick={() => setForceType(ForceType.F2)}
              className={`py-2 text-sm font-bold rounded-lg border flex justify-center items-center gap-2 transition-all ${forceType === ForceType.F2 ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
            >
              <span>↑</span> Lực F2 (Lên)
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Controls;
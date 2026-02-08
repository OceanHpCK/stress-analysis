import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import Controls from './components/Controls';
import SimulationCanvas from './components/SimulationCanvas';
import { ProductDimensions, ForceType, ForceConfig, MaterialConfig } from './types';
import { getMaxStressAtSection, DEFAULT_MATERIAL } from './utils/physics';

// --- Components ---

const ExplanationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Thuyết Minh Tính Toán
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 hover:bg-slate-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 text-slate-700 space-y-8">
          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-blue-500 pl-3">
              1. Mô hình vật lý
            </h4>
            <p className="text-sm leading-relaxed text-slate-600 text-justify">
              Sản phẩm được mô hình hóa dưới dạng <strong>dầm console (cantilever beam)</strong> ngàm tại đầu trái ($x=0$).
              Tiết diện của dầm là hình chữ nhật có chiều cao $h(x)$ thay đổi theo trục $x$ (do hình dạng vát và dốc) và bề dày $w$ không đổi.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-green-500 pl-3">
              2. Công thức Ứng suất uốn
            </h4>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm text-center mb-4 shadow-sm text-slate-800">
              σ = (M · y) / I
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                <strong className="text-slate-800 block mb-1">σ (Sigma)</strong>
                Ứng suất pháp tại điểm tính toán (MPa).
              </div>
              <div className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                <strong className="text-slate-800 block mb-1">y</strong>
                Khoảng cách từ trục trung hòa (Neutral Axis) đến điểm tính toán (mm). Trục trung hòa nằm tại $h/2$.
              </div>
              <div className="bg-white p-3 rounded border border-slate-100 shadow-sm md:col-span-2">
                <strong className="text-slate-800 block mb-1">M (Momen uốn)</strong>
                {'Tại vị trí $x < x_{luc}$, momen uốn được tính bằng:'}
                <div className="font-mono text-xs mt-1 text-slate-500 bg-slate-50 p-1 rounded inline-block">M = F · |x_luc - x|</div>
                <div className="text-xs mt-1 italic">{'(Momen bằng 0 tại các vị trí $x > x_{luc}$)'}</div>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-amber-500 pl-3">
              3. Momen Quán tính (Moment of Inertia)
            </h4>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 text-sm text-slate-600 text-justify">
                Đối với tiết diện hình chữ nhật, khả năng chống uốn phụ thuộc vào bề dày và lập phương chiều cao. Chiều cao $h$ đóng vai trò quan trọng nhất trong việc giảm ứng suất.
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 font-mono text-sm text-center min-w-[200px] text-amber-800">
                I = (w · h³) / 12
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-red-500 pl-3">
              4. Hệ số tập trung ứng suất (SCF)
            </h4>
            <p className="text-sm text-slate-600 text-justify bg-red-50 p-3 rounded border border-red-100">
              Tại góc vát ($x = LeftWidth$), sự thay đổi hình học đột ngột gây ra hiện tượng tập trung ứng suất.
              Mô phỏng này áp dụng một hệ số nhân cục bộ (SCF $\approx$ 2.0) giảm dần theo khoảng cách để phản ánh thực tế: <strong>Ứng suất tại góc nhọn sẽ lớn hơn tính toán lý thuyết.</strong>
            </p>
          </section>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end sticky bottom-0 z-10">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 text-sm shadow-lg shadow-slate-200 transition-all transform hover:scale-105">Đã hiểu</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // State
  const [dimensions, setDimensions] = useState<ProductDimensions>({
    totalHeight: 100,
    leftWidth: 52,
    endHeight: 47,
    totalLength: 250,
    a: 20,
    b: 40,
    width: 20
  });

  const [material, setMaterial] = useState<MaterialConfig>(DEFAULT_MATERIAL);

  const [forceConfig, setForceConfig] = useState<ForceConfig>({
    type: ForceType.F,
    positionX: 180,
    magnitude: 1500
  });

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handlers
  const setForcePositionX = (x: number) => {
    setForceConfig(prev => ({ ...prev, positionX: x }));
  };

  const setForceType = (t: ForceType) => {
    setForceConfig(prev => ({ ...prev, type: t }));
  }

  const setForceMagnitude = (m: number) => {
    setForceConfig(prev => ({ ...prev, magnitude: m }));
  }

  // Calculations
  // Điểm A: Tìm ứng suất max tại vùng góc vát (scan nhiều điểm quanh corner để lấy max)
  const getMaxStressAtCorner = () => {
    const cornerX = dimensions.leftWidth;
    const cornerY = dimensions.totalHeight - dimensions.a;
    let maxStress = 0;

    // Scan các điểm quanh góc để tìm stress max
    for (let dx = -10; dx <= 10; dx += 2) {
      for (let dy = -10; dy <= 10; dy += 2) {
        const x = cornerX + dx;
        const y = cornerY + dy;
        if (x >= 0 && x <= dimensions.totalLength && y >= 0) {
          const stress = getMaxStressAtSection(x, dimensions, forceConfig.positionX, forceConfig.magnitude, y);
          if (stress > maxStress) maxStress = stress;
        }
      }
    }
    return maxStress;
  };

  const stressAtA = getMaxStressAtCorner();
  const stressAtB = getMaxStressAtSection(dimensions.leftWidth + dimensions.b, dimensions, forceConfig.positionX, forceConfig.magnitude);

  const handleAnalyzeClick = () => {
    runAnalysis();
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');

    try {
      // Sử dụng trực tiếp process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        Bạn là chuyên gia kỹ thuật kết cấu. Hãy phân tích kịch bản ứng suất sau đây cho dầm chữ L:
        
        1. THÔNG SỐ:
        - Vật liệu: ${material.name} (Giới hạn bền: ${material.yieldStrength} MPa, E: ${material.modulus} MPa).
        - Hình học: Vát a=${dimensions.a}mm, Dốc b=${dimensions.b}mm, Dày=${dimensions.width}mm.
        - Lực: ${forceConfig.magnitude}N đặt tại x=${forceConfig.positionX.toFixed(0)}mm (Kiểu: ${forceConfig.type}).
        
        2. KẾT QUẢ TÍNH TOÁN:
        - Ứng suất tại góc vát (Điểm A): ${stressAtA.toFixed(2)} MPa.
        - Ứng suất tại chân dốc (Điểm B): ${stressAtB.toFixed(2)} MPa.
        
        3. YÊU CẦU:
        - Đánh giá độ an toàn của thiết kế.
        - Nếu không an toàn, hãy đề xuất thay đổi cụ thể về a, b hoặc độ dày.
        - Viết ngắn gọn, súc tích dưới dạng danh sách gạch đầu dòng (Markdown).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || "Không có phản hồi.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Lỗi: Không thể kết nối với Gemini. Vui lòng kiểm tra xem biến môi trường API_KEY đã được cấu hình chính xác chưa.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (stress: number) => {
    if (stress > material.yieldStrength) return 'text-red-600';
    if (stress > material.yieldStrength * 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">

      <ExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">L</span>
              Stress Analyzer
            </h1>
            <p className="text-xs text-slate-500 mt-1">Mô phỏng ứng suất dầm console tiết diện thay đổi</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Explanation Button */}
            <button
              onClick={() => setIsExplanationOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all border border-transparent hover:border-blue-100"
              title="Thuyết minh tính toán"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Thuyết minh
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* TOP: Controls */}
        <Controls
          dims={dimensions}
          setDims={setDimensions}
          forceType={forceConfig.type}
          setForceType={setForceType}
          forceConfig={forceConfig}
          setForceMagnitude={setForceMagnitude}
          setForcePosition={setForcePositionX}
          material={material}
          setMaterial={setMaterial}
        />

        {/* MIDDLE: Canvas & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <SimulationCanvas
                dimensions={dimensions}
                force={forceConfig}
                material={material}
                onForcePositionChange={setForcePositionX}
              />
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Live Stats & Analysis Button */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Điểm quan trọng</h3>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-slate-600">Tại góc vát (A)</span>
                  <span className={`text-2xl font-bold ${getStatusColor(stressAtA)}`}>{stressAtA.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${stressAtA > material.yieldStrength ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(stressAtA / material.yieldStrength * 100, 100)}%` }}></div>
                </div>
                <div className="text-right text-[10px] text-slate-400 mt-1">MPa</div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium text-slate-600">Tại chân dốc (B)</span>
                  <span className={`text-2xl font-bold ${getStatusColor(stressAtB)}`}>{stressAtB.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${stressAtB > material.yieldStrength ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(stressAtB / material.yieldStrength * 100, 100)}%` }}></div>
                </div>
                <div className="text-right text-[10px] text-slate-400 mt-1">MPa</div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isAnalyzing}
                  className={`
                                w-full py-3 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-sm
                                ${isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'}
                            `}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C12.5 7 17 11.5 22 12C17 12.5 12.5 17 12 22C11.5 17 7 12.5 2 12C7 11.5 11.5 7 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 15C15.5 16.5 17 18 18.5 18.5C17 19 15.5 20.5 15 22C14.5 20.5 13 19 11.5 18.5C13 18 14.5 16.5 15 15Z" fill="currentColor" opacity="0.5" />
                      </svg>
                      Phân tích AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: AI Analysis Result */}
        {aiAnalysis && (
          <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 flex items-center justify-between">
              <h3 className="text-white font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12.5 7 17 11.5 22 12C17 12.5 12.5 17 12 22C11.5 17 7 12.5 2 12C7 11.5 11.5 7 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Kết quả phân tích từ Gemini
              </h3>
              <button onClick={() => setAiAnalysis('')} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 prose prose-slate max-w-none text-sm bg-slate-50/50">
              <pre className="whitespace-pre-wrap font-sans text-slate-700">{aiAnalysis}</pre>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
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
        <div className="p-6 text-slate-700 space-y-6">
          {/* Giới thiệu */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-blue-500 pl-3">
              1. Giới thiệu
            </h4>
            <p className="text-sm leading-relaxed text-slate-600 text-justify">
              Tài liệu này trình bày các tính toán về lực tác động của nước biển lên đường ống <strong>HDPE DN800 PN10 (SDR17)</strong> trong ba kịch bản thời tiết khác nhau. Mục tiêu nhằm xác định tải trọng cực đại tại các điểm trọng yếu, phục vụ công tác thiết kế đối trọng và lập phương án thi công an toàn.
            </p>
          </section>

          {/* Thông số kỹ thuật */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-green-500 pl-3">
              2. Thông số kỹ thuật đầu vào
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <strong className="text-slate-800">Vật liệu:</strong> HDPE PE100
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <strong className="text-slate-800">Kích thước:</strong> DN800 (OD 800mm), SDR17 (Dày 47.4mm)
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <strong className="text-slate-800">Nhịp lắp đặt (L):</strong> 3.0 m
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <strong className="text-slate-800">Môi trường:</strong> Nước biển (ρ = 1025 kg/m³)
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100 md:col-span-2">
                <strong className="text-slate-800">Gia tốc trọng trường (g):</strong> 9.81 m/s²
              </div>
            </div>
          </section>

          {/* Cơ sở tính toán */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-amber-500 pl-3">
              3. Cơ sở tính toán
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Các lực được tính toán dựa trên các phương trình cơ bản của thủy động lực học:
            </p>

            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <strong className="text-slate-800 block mb-2">3.1. Lực cản dòng chảy (Fd) - Phương trình Morison:</strong>
                <div className="font-mono text-sm text-center bg-white p-2 rounded border border-amber-200 mb-2">
                  Fd = ½ · ρ · v² · Cd · D
                </div>
                <p className="text-xs text-slate-500">
                  Cd (Hệ số cản) = 1.0 cho ống trụ tròn; v = vận tốc dòng chảy (m/s)
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <strong className="text-slate-800 block mb-2">3.2. Lực cắt tại điểm khảo sát V(x):</strong>
                <div className="font-mono text-sm text-center bg-white p-2 rounded border border-amber-200 mb-2">
                  V(x) = q · (L/2 - x)
                </div>
                <p className="text-xs text-slate-500">
                  q = tổng tải trọng ngang phân bố đều (N/m)
                </p>
              </div>
            </div>
          </section>

          {/* Bảng phân tích kịch bản */}
          <section>
            <h4 className="font-bold text-slate-900 mb-3 text-base border-l-4 border-red-500 pl-3">
              4. Phân tích theo các kịch bản thời tiết
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              Bảng giá trị lực tại vị trí cách điểm cố định 150mm (vùng nhạy cảm nhất về ứng suất):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 p-2 text-left">Thông số</th>
                    <th className="border border-slate-200 p-2 text-center bg-blue-50">Biển lặng</th>
                    <th className="border border-slate-200 p-2 text-center bg-yellow-50">Dòng mạnh</th>
                    <th className="border border-slate-200 p-2 text-center bg-red-50">Bão</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2">Vận tốc nước (v)</td>
                    <td className="border border-slate-200 p-2 text-center">0.5 m/s</td>
                    <td className="border border-slate-200 p-2 text-center">1.5 m/s</td>
                    <td className="border border-slate-200 p-2 text-center">3.0 m/s</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 p-2">Lực cản (Fd)</td>
                    <td className="border border-slate-200 p-2 text-center">103 N/m</td>
                    <td className="border border-slate-200 p-2 text-center">922 N/m</td>
                    <td className="border border-slate-200 p-2 text-center font-bold text-red-600">3,690 N/m</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2">Tổng tải ngang (q)</td>
                    <td className="border border-slate-200 p-2 text-center">206 N/m</td>
                    <td className="border border-slate-200 p-2 text-center">1,436 N/m</td>
                    <td className="border border-slate-200 p-2 text-center font-bold text-red-600">5,234 N/m</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-200 p-2">Lực tại 150mm</td>
                    <td className="border border-slate-200 p-2 text-center font-bold text-green-600">278 N</td>
                    <td className="border border-slate-200 p-2 text-center font-bold text-yellow-600">1,938 N</td>
                    <td className="border border-slate-200 p-2 text-center font-bold text-red-600">7,065 N</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2">Trạng thái</td>
                    <td className="border border-slate-200 p-2 text-center text-green-600 text-[10px]">Lý tưởng thi công</td>
                    <td className="border border-slate-200 p-2 text-center text-yellow-600 text-[10px]">Cần tàu hỗ trợ</td>
                    <td className="border border-slate-200 p-2 text-center text-red-600 text-[10px] font-bold">DỪNG THI CÔNG</td>
                  </tr>
                </tbody>
              </table>
            </div>
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

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-6 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-white">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Stress Analyzer NTP
          </div>
          <p className="text-sm text-slate-400">
            Powered by <span className="text-blue-400 font-semibold">DuongHp</span>
          </p>
          <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed mt-3 bg-slate-700/50 p-3 rounded-lg">
            <span className="text-amber-400 font-semibold">⚠️ Lưu ý:</span> Kết quả tính toán chỉ mang tính chất tham khảo. Cần tham khảo ý kiến kỹ sư chuyên ngành cho dự án thực tế.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
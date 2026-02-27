import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// Helper to sanitize data for AI context to save tokens (General Mode)
const formatDataForPrompt = (students: Student[]) => {
  return students.map(s => 
    `- ${s.name} (${s.className}, ${s.gender}) | Okul: ${s.schoolName} | Köy: ${s.village} | Güzergah: ${s.route} | Şoför: ${s.driver}`
  ).join('\n');
};

// Helper for Route Analysis (Aggregated Data) - Consumes fewer tokens, provides better context for optimization
const formatRouteAnalytics = (students: Student[]) => {
  const routeMap: Record<string, { count: number; villages: Set<string>; driver: string; schools: Set<string> }> = {};

  students.forEach(s => {
    const route = s.route || 'Tanımsız Güzergah';
    if (!routeMap[route]) {
      routeMap[route] = { count: 0, villages: new Set(), driver: s.driver, schools: new Set() };
    }
    routeMap[route].count++;
    if (s.village) routeMap[route].villages.add(s.village);
    if (s.schoolName) routeMap[route].schools.add(s.schoolName);
  });

  return Object.entries(routeMap).map(([route, data]) => {
    return `- GÜZERGAH: "${route}" 
      Şoför: ${data.driver || 'Atanmamış'}
      Toplam Öğrenci: ${data.count}
      Hizmet Verilen Köyler: ${Array.from(data.villages).join(', ')}
      Okullar: ${Array.from(data.schools).join(', ')}
      (Not: Standart bir servis aracı kapasitesi genelde 16-19 kişiliktir)`;
  }).join('\n\n');
};

export type AnalysisMode = 'general' | 'routes' | 'custom';

export const analyzeTransportData = async (students: Student[], mode: AnalysisMode = 'general', apiKey: string, question?: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Anahtarı eksik.");
  }
  return getStudentInsights(students, mode, apiKey, question);
};

export const testGeminiConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
    });
    return true;
  } catch (error) {
    console.error("Connection Test Error:", error);
    return false;
  }
};

export const getStudentInsights = async (students: Student[], mode: AnalysisMode, apiKey: string, customPrompt?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = "Sen bir okul taşıma sistemi veri analistisin. Verilen verileri analiz ederek Türkçe, profesyonel, sayısal verilere dayalı ve eyleme geçirilebilir içgörüler sunmalısın.";
    let userPrompt = "";
    let dataContext = "";

    // Prepare data based on mode
    if (mode === 'routes') {
      dataContext = formatRouteAnalytics(students);
    } else {
      dataContext = formatDataForPrompt(students);
    }

    switch (mode) {
      case 'general':
        userPrompt = `
          Aşağıdaki öğrenci listesi için kapsamlı bir yönetim özeti raporu oluştur.
          
          Lütfen şu başlıkları kullanarak analiz yap:
          1. **Genel Durum Özeti**: Toplam öğrenci, servis ve güzergah sayılarıyla genel tablo.
          2. **Demografik ve Bölgesel Dağılım**: Hangi bölgelerden (köylerden) yoğunluk var?
          3. **Kapasite Kullanımı**: Genel doluluk durumu nasıl görünüyor?
          4. **Veri Kalitesi Uyarısı**: Listede eksik (şoförü olmayan, güzergahı olmayan) öğrenci var mı?

          Veri Seti:
          ${dataContext}
        `;
        break;
      
      case 'routes':
        userPrompt = `
          Aşağıdaki güzergah özet verilerini "Taşıma Verimliliği ve Optimizasyon" açısından detaylıca analiz et.
          
          Lütfen şu başlıkları kullan:
          1. **Araç Doluluk Analizi**:
             - Kapasitesini aşma riski olan (17+ öğrenci) güzergahlar hangileri?
             - Çok az öğrencisi olan (5-8 altı) verimsiz güzergahlar hangileri?
          
          2. **Birleştirme (Optimizasyon) Önerileri**:
             - Az öğrencisi olan ve coğrafi olarak yakın görünen (isim benzerliği veya mantıksal yakınlık) hangi güzergahlar birleştirilebilir?
             - Bu birleştirmeler maliyeti nasıl etkiler?
          
          3. **Şoför Performans ve Yük Dağılımı**:
             - Hangi şoförler en fazla yükü taşıyor? Adaletsiz bir dağılım var mı?

          Özet Veri Seti:
          ${dataContext}
        `;
        break;

      case 'custom':
        userPrompt = `
          Veri Seti:
          ${dataContext}

          Kullanıcı Sorusu: ${customPrompt}
          
          Lütfen veriye dayanarak bu soruya net bir cevap ver.
        `;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Daha tutarlı ve analitik sonuçlar için düşürdük
      }
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analiz sırasında bir hata oluştu. Lütfen API anahtarınızı kontrol edin.";
  }
};

import React from 'react';
import { Mail, User, Info, CheckCircle, ArrowRight, ShieldCheck, Cpu, Briefcase, FileText } from 'lucide-react';

export const About: React.FC = () => {
  const steps = [
    {
      title: "1. Genel Ayarlar",
      desc: "Uygulamayı kullanmaya 'Genel Ayarlar' menüsünden başlayın. Okul bilgileri, idari personel, nöbetçi öğretmenler ve AI (Yapay Zeka) anahtarınızı buradan yapılandırın."
    },
    {
      title: "2. Veri Yükleme",
      desc: "'Hızlı Excel Yükle' menüsünü kullanarak e-Okul veya MEBBİS'ten aldığınız öğrenci listelerini sisteme yükleyin. Sistem, 'Akıllı Birleştirme' özelliği ile verileri analiz eder ve mevcut verileri koruyarak yenileri ekler."
    },
    {
      title: "3. Taşıma Yönetimi",
      desc: "'Taşıma Yönetimi' sayfası operasyonun merkezidir. Burada Şoförleri ve Güzergahları yönetebilir, 'Toplu Atama Sihirbazı' ile öğrencileri hızlıca servislere atayabilir ve 'Araçlar' sekmesinden servis birleştirme işlemleri yapabilirsiniz."
    },
    {
      title: "4. Harita ve Analiz",
      desc: "'Harita / Konumlar' menüsü ile öğrenci ve şoförlerin konumlarını görselleştirin. Güzergah mesafelerini harita üzerinden ölçerek 'Mesafe Tutanağı' verilerini otomatik oluşturun."
    },
    {
      title: "5. Resmi Evraklar ve Raporlar",
      desc: "Taşıma Planlama (Ek-1), Araç Denetim Formu, Taşımalı Eğitim Raporu gibi resmi evrakları ilgili menülerden oluşturun. 'Raporlama Merkezi' üzerinden ise Puantaj ve İmza Çizelgeleri gibi toplu çıktıları alın."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Hakkında ve Yardım</h1>
        <p className="text-slate-500">OkulServis Taşıma Yönetim Sistemi güncel kullanım kılavuzu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Developer Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <User size={40} className="text-white" />
              </div>
              <h2 className="text-xl font-bold">Abdullah Yanarateş</h2>
              <p className="text-blue-100 text-sm opacity-90">Geliştirici & Tasarımcı</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Mail size={16} />
                </div>
                <a href="mailto:appo.yanarates@gmail.com" className="text-sm font-medium hover:text-blue-600 transition-colors">
                  appo.yanarates@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-sm font-medium">AyPro 10022026</span>
              </div>
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                © 2025 Tüm Hakları Saklıdır.
              </div>
            </div>
          </div>
        </div>

        {/* How To Use Guide */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Info className="text-blue-600" />
              Adım Adım Kullanım
            </h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {steps.map((step, index) => (
                <div key={index} className="relative flex items-start group">
                  <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm z-10 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">
                    <span className="font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="ml-16">
                    <h4 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">{step.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-violet-900 to-purple-800 rounded-2xl p-6 text-white shadow-lg">
               <h4 className="font-bold text-lg flex items-center gap-2"><Cpu size={20} className="text-yellow-400"/> AI Destekli Analiz</h4>
               <p className="text-violet-200 text-sm mt-2">Gemini AI, verilerinizi analiz ederek doluluk oranlarını hesaplar ve optimizasyon önerileri sunar.</p>
             </div>
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
               <h4 className="font-bold text-lg flex items-center gap-2"><FileText size={20} className="text-blue-400"/> Dijital Evraklar</h4>
               <p className="text-slate-300 text-sm mt-2">Tüm çıktılar MEB standartlarına uygun formatta hazırlanır. Word veya PDF olarak indirebilirsiniz.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

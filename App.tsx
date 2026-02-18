import React, { useState, useEffect } from 'react';
import { InterestType, CalculationInput, CalculationResult, Language, HistoryItem } from './types';
import { TRANSLATIONS, LANGUAGES } from './translations';
import { calculateInterest } from './services/interestService';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'plan' | 'offers'>('calc');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'te');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('calc_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState<CalculationInput>({
    principal: 10000,
    rate: 2,
    isAnnualRate: false,
    useMonthsInput: true,
    durationMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    interestType: InterestType.SIMPLE,
    compoundingFrequencyMonths: 12
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({
      ...prev,
      [name]: (name === 'principal' || name === 'rate' || name === 'durationMonths') 
        ? (value === '' ? 0 : parseFloat(value)) 
        : value
    }));
  };

  const handleCalculate = () => {
    const res = calculateInterest(input);
    setResult(res);
    
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input: { ...input },
      result: res
    };
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
  };

  const handleCopyResult = () => {
    if (!result) return;
    const shareText = `💰 *${t.TITLE}* 💰\n\n💵 *అసలు:* ₹${result.principal.toLocaleString('en-IN')}\n📈 *నెలవారీ వడ్డీ:* ₹${result.monthlyInterest.toLocaleString('en-IN')}\n📅 *కాలం:* ${result.years}సం ${result.months}నె ${result.days}రో\n✅ *మొత్తం:* ₹${result.totalAmount.toLocaleString('en-IN')}\n\n_Calculated using VS APPS_`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareResult = async (res: CalculationResult) => {
    const shareText = `💰 *${t.TITLE}* 💰\n\n💵 *అసలు:* ₹${res.principal.toLocaleString('en-IN')}\n📈 *నెలవారీ వడ్డీ:* ₹${res.monthlyInterest.toLocaleString('en-IN')}\n✅ *మొత్తం:* ₹${res.totalAmount.toLocaleString('en-IN')}\n\n_VS APPS_`;
    if (navigator.share) {
      try { await navigator.share({ title: t.TITLE, text: shareText }); } catch (e) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden shadow-2xl border-x border-slate-100">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-orange-600 to-orange-700 text-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-xl z-20 relative">
        <div className="flex justify-between items-start mb-6">
          <Logo />
          <div className="flex space-x-2">
             <button onClick={() => setShowHelp(true)} className="w-10 h-10 flex items-center justify-center bg-white/15 rounded-xl backdrop-blur-md ripple">
                <i className="fa-solid fa-question text-sm"></i>
             </button>
             <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center bg-white/15 rounded-xl backdrop-blur-md ripple">
                <i className="fa-solid fa-gear text-sm"></i>
             </button>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black heading-font">{t.TITLE}</h1>
          <p className="text-orange-100 text-[10px] font-bold mt-1 uppercase tracking-widest opacity-80">{t.SUBTITLE}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-6">
        
        {activeTab === 'calc' && (
          <div className="space-y-6 animate-slide-up">
            {!result ? (
              <>
                {/* Principal Input */}
                <section className="bg-white rounded-[2rem] p-6 shadow-premium border border-slate-50">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t.PRINCIPAL}</label>
                  <div className="flex items-center space-x-4 bg-slate-50 p-5 rounded-[1.2rem] border-2 border-transparent focus-within:border-orange-500 transition-all">
                    <span className="text-2xl font-black text-orange-600">₹</span>
                    <input type="number" name="principal" value={input.principal || ''} onChange={handleInputChange} inputMode="numeric" className="bg-transparent text-3xl font-black w-full outline-none text-slate-800 placeholder:text-slate-200" placeholder="0" />
                  </div>
                </section>

                {/* Rate Input */}
                <section className="bg-white rounded-[2rem] p-6 shadow-premium border border-slate-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">{input.isAnnualRate ? t.RATE_ANNUAL : t.RATE_MONTHLY}</label>
                      <div className="bg-slate-50 p-4 rounded-[1rem] border-2 border-transparent focus-within:border-orange-500 transition-all">
                        <input type="number" name="rate" value={input.rate || ''} onChange={handleInputChange} inputMode="decimal" className="bg-transparent text-xl font-black w-full outline-none text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">{t.RATE_TYPE}</label>
                      <button onClick={() => setInput(p => ({...p, isAnnualRate: !p.isAnnualRate}))} className="w-full h-full bg-orange-50 text-orange-700 rounded-[1rem] text-[10px] font-black px-2 uppercase border border-orange-100 ripple flex items-center justify-center text-center leading-tight min-h-[56px]">
                        {input.isAnnualRate ? 'Annual %' : t.VILLAGE_STYLE}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Duration */}
                <section className="bg-white rounded-[2rem] p-6 shadow-premium border border-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.DURATION}</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setInput(p => ({...p, useMonthsInput: true}))} className={`px-4 py-2 text-[9px] font-black rounded-lg transition-all ${input.useMonthsInput ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>{t.MONTHS}</button>
                      <button onClick={() => setInput(p => ({...p, useMonthsInput: false}))} className={`px-4 py-2 text-[9px] font-black rounded-lg transition-all ${!input.useMonthsInput ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>{t.DATES}</button>
                    </div>
                  </div>
                  {input.useMonthsInput ? (
                    <div className="bg-slate-50 p-5 rounded-[1.2rem] flex items-center space-x-4 shadow-inner">
                      <i className="fa-solid fa-clock text-orange-400"></i>
                      <input type="number" name="durationMonths" value={input.durationMonths || ''} onChange={handleInputChange} inputMode="numeric" className="bg-transparent text-xl font-black w-full outline-none text-slate-700" placeholder={t.MONTHS} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" name="startDate" value={input.startDate} onChange={handleInputChange} className="p-4 bg-slate-50 rounded-[1rem] outline-none font-bold text-slate-700 text-xs shadow-inner" />
                      <input type="date" name="endDate" value={input.endDate} onChange={handleInputChange} className="p-4 bg-slate-50 rounded-[1rem] outline-none font-bold text-slate-700 text-xs shadow-inner" />
                    </div>
                  )}
                </section>

                <button onClick={handleCalculate} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-xl ripple text-lg flex items-center justify-center space-x-3">
                  <i className="fa-solid fa-calculator"></i>
                  <span>{t.CALCULATE}</span>
                </button>
              </>
            ) : (
              <div className="space-y-6 animate-slide-up">
                {/* Result Controls */}
                <div className="flex justify-between items-center">
                  <button onClick={() => setResult(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100 ripple">
                    <i className="fa-solid fa-arrow-left mr-2"></i> {t.CLEAR}
                  </button>
                  <div className="flex space-x-2">
                    <button onClick={handleCopyResult} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm border border-slate-100 ripple relative">
                      <i className="fa-solid fa-copy"></i>
                      {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] py-1 px-2 rounded-lg whitespace-nowrap">COPIED!</span>}
                    </button>
                    <button onClick={() => handleShareResult(result)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg ripple">
                      <i className="fa-solid fa-share-nodes"></i>
                    </button>
                  </div>
                </div>

                {/* Highlight Card: Monthly Interest */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-10">
                      <i className="fa-solid fa-calendar-check text-8xl"></i>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">{t.MONTHLY_AVG}</p>
                   <h3 className="text-5xl font-black mb-1">₹{result.monthlyInterest.toLocaleString('en-IN')}</h3>
                   <p className="text-[11px] font-bold text-indigo-100">ప్రతి నెల అయ్యే వడ్డీ (Monthly Interest)</p>
                </div>

                {/* Breakdown Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100 space-y-8">
                   <div className="flex justify-between items-end border-b border-slate-50 pb-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.PRINCIPAL}</p>
                        <p className="text-2xl font-black text-slate-800">₹{result.principal.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.INTEREST}</p>
                        <p className="text-2xl font-black text-orange-600">₹{result.totalInterest.toLocaleString('en-IN')}</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                            <i className="fa-solid fa-hourglass-start"></i>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Total Duration</p>
                            <p className="text-sm font-black text-slate-700">{result.years}y {result.months}m {result.days}d</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.TOTAL}</p>
                        <p className="text-xl font-black text-slate-900 leading-none">₹{result.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Tabs handled as before with minor style polishes */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-black text-slate-800 mb-4">{t.HISTORY}</h2>
            {history.length === 0 ? (
               <div className="py-20 text-center text-slate-300">
                  <i className="fa-solid fa-ghost text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">{t.NO_HISTORY}</p>
               </div>
            ) : (
              history.map(item => (
                <div key={item.id} onClick={() => { setInput(item.input); setResult(item.result); setActiveTab('calc'); }} className="bg-white p-5 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center ripple">
                   <div>
                      <p className="text-lg font-black text-slate-800">₹{item.result.principal.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{item.result.totalDays} days @ {item.input.rate}%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-orange-600">+₹{item.result.totalInterest.toLocaleString('en-IN')}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase">{new Date(item.timestamp).toLocaleDateString()}</p>
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-slate-100 flex items-center justify-around h-24 px-4 pb-4 z-30">
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center transition-all ${activeTab === 'calc' ? 'text-orange-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-calculator text-lg mb-1"></i>
          <span className="text-[9px] font-black uppercase">Calc</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center transition-all ${activeTab === 'history' ? 'text-orange-600' : 'text-slate-400'}`}>
          <i className="fa-solid fa-clock-rotate-left text-lg mb-1"></i>
          <span className="text-[9px] font-black uppercase">History</span>
        </button>
      </nav>

      {/* Settings Modal (Simplified) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end">
           <div className="bg-white w-full rounded-t-[2rem] p-8 pb-12 animate-slide-up">
              <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
              <h2 className="text-2xl font-black mb-6">Language / భాష</h2>
              <div className="grid grid-cols-2 gap-3 mb-10">
                 {LANGUAGES.map(l => (
                   <button key={l.code} onClick={() => { setLang(l.code); localStorage.setItem('app_lang', l.code); setShowSettings(false); }} className={`p-4 rounded-xl border-2 font-black text-xs ${lang === l.code ? 'border-orange-500 bg-orange-50' : 'border-slate-50'}`}>
                     {l.native}
                   </button>
                 ))}
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl">Close</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
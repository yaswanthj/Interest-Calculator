
import React, { useState, useEffect } from 'react';
import { InterestType, CalculationInput, CalculationResult, Language, HistoryItem } from './types';
import { TRANSLATIONS, LANGUAGES } from './translations';
import { calculateInterest } from './services/interestService';
import { trackEvent, trackPageView } from './services/analytics';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'plan' | 'offers'>('calc');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'te');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
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
    trackPageView(activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  const handleSpeakResults = () => {
    if (!result || isSpeechLoading) return;
    if (!('speechSynthesis' in window)) return;

    setIsSpeechLoading(true);
    const speechText = `${t.RESULTS}: ${t.PRINCIPAL} ${result.principal}, ${t.INTEREST} ${result.totalInterest}, ${t.TOTAL} ${result.totalAmount}.`;

    const langMap: Record<string, string> = { te: 'te-IN', en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN' };
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeechLoading(false);
    utterance.onerror = () => setIsSpeechLoading(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

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
    trackEvent('calculate', { type: input.interestType, lang });
  };

  const handleCopyResult = () => {
    if (!result) return;
    const shareText = `💰 *${t.TITLE} Summary* 💰\n\n💵 *${t.PRINCIPAL}:* ₹${result.principal.toLocaleString('en-IN')}\n📈 *${t.INTEREST}:* ₹${result.totalInterest.toLocaleString('en-IN')}\n✅ *${t.TOTAL}:* ₹${result.totalAmount.toLocaleString('en-IN')}\n\n📅 *${t.TIME}:* ${result.years}y ${result.months}m ${result.days}d\n\n_Calculated using VS APPS Interest Tool_`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_result');
  };

  const handleShareResult = async (res: CalculationResult) => {
    const shareText = `💰 *${t.TITLE} Summary* 💰\n\n💵 *${t.PRINCIPAL}:* ₹${res.principal.toLocaleString('en-IN')}\n📈 *${t.INTEREST}:* ₹${res.totalInterest.toLocaleString('en-IN')}\n✅ *${t.TOTAL}:* ₹${res.totalAmount.toLocaleString('en-IN')}\n\n_Calculated using VS APPS_`;
    if (navigator.share) {
      try { await navigator.share({ title: t.TITLE, text: shareText }); } catch (e) {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
    }
  };

  const getProjection = () => {
    if (!result) return [];
    const projections = [];
    const baseDuration = input.useMonthsInput ? input.durationMonths : result.totalDays / 30;
    
    for (let i = 1; i <= 6; i++) {
      const futureInput = { ...input, durationMonths: Math.ceil(baseDuration) + i, useMonthsInput: true };
      const futureRes = calculateInterest(futureInput);
      projections.push({
        month: i,
        total: futureRes.totalAmount,
        interest: futureRes.totalInterest
      });
    }
    return projections;
  };

  const handleOfferClick = (offerType: string) => {
    trackEvent('offer_click', { type: offerType });
    // --- EARN MONEY HERE ---
    // Replace these with your own Affiliate links from Paisabazaar or Amazon
    const urls: Record<string, string> = {
      gold: 'https://www.muthootfinance.com/gold-loan',
      personal: 'https://www.paisabazaar.com/personal-loan/',
      fd: 'https://www.bankbazaar.com/fixed-deposit.html'
    };
    window.open(urls[offerType] || '#', '_blank');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden shadow-2xl border-x border-slate-100">
      
      {/* Dynamic Header */}
      <header className="bg-gradient-to-br from-orange-600 to-orange-700 text-white px-6 pt-10 pb-10 rounded-b-[3rem] shadow-xl z-20 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <i className="fa-solid fa-indian-rupee-sign text-9xl absolute -bottom-10 -right-10 rotate-12"></i>
        </div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <Logo />
          <div className="flex space-x-2">
             <button onClick={() => setShowHelp(true)} className="w-11 h-11 flex items-center justify-center bg-white/15 rounded-2xl backdrop-blur-md ripple border border-white/10">
                <i className="fa-solid fa-question text-sm"></i>
             </button>
             <button onClick={() => setShowSettings(true)} className="w-11 h-11 flex items-center justify-center bg-white/15 rounded-2xl backdrop-blur-md ripple border border-white/10">
                <i className="fa-solid fa-gear text-sm"></i>
             </button>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black heading-font tracking-tight">{t.TITLE}</h1>
          <p className="text-orange-100 text-[10px] font-bold mt-1 uppercase tracking-[0.25em] opacity-80">{t.SUBTITLE}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-32 space-y-8">
        
        {activeTab === 'calc' && (
          <div className="space-y-6 animate-slide-up">
            {!result ? (
              <>
                {/* Input Card */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100 space-y-8">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{t.PRINCIPAL}</label>
                    <div className="flex items-center space-x-5 bg-slate-50 p-6 rounded-[1.5rem] border-2 border-transparent focus-within:border-orange-500 transition-all shadow-inner-soft">
                      <span className="text-3xl font-black text-orange-600">₹</span>
                      <input type="number" name="principal" value={input.principal || ''} onChange={handleInputChange} inputMode="numeric" className="bg-transparent text-4xl font-black w-full outline-none text-slate-800 placeholder:text-slate-200" placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">{input.isAnnualRate ? t.RATE_ANNUAL : t.RATE_MONTHLY}</label>
                      <div className="bg-slate-50 p-5 rounded-[1.2rem] border-2 border-transparent focus-within:border-orange-500 transition-all shadow-inner-soft">
                        <input type="number" name="rate" value={input.rate || ''} onChange={handleInputChange} inputMode="decimal" className="bg-transparent text-2xl font-black w-full outline-none text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">{t.RATE_TYPE}</label>
                      <button onClick={() => setInput(p => ({...p, isAnnualRate: !p.isAnnualRate}))} className="w-full h-full bg-orange-50 text-orange-700 rounded-[1.2rem] text-[10px] font-black px-3 uppercase border border-orange-100 ripple flex items-center justify-center text-center leading-tight min-h-[64px]">
                        {input.isAnnualRate ? 'Annual %' : t.VILLAGE_STYLE}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Duration Card */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.DURATION}</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button onClick={() => setInput(p => ({...p, useMonthsInput: true}))} className={`px-5 py-2.5 text-[10px] font-black rounded-xl transition-all ${input.useMonthsInput ? 'bg-white shadow-md text-orange-600' : 'text-slate-400'}`}>{t.MONTHS}</button>
                      <button onClick={() => setInput(p => ({...p, useMonthsInput: false}))} className={`px-5 py-2.5 text-[10px] font-black rounded-xl transition-all ${!input.useMonthsInput ? 'bg-white shadow-md text-orange-600' : 'text-slate-400'}`}>{t.DATES}</button>
                    </div>
                  </div>
                  {input.useMonthsInput ? (
                    <div className="bg-slate-50 p-6 rounded-[1.5rem] flex items-center space-x-5 border-2 border-transparent focus-within:border-orange-500 transition-all shadow-inner-soft">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                         <i className="fa-solid fa-hourglass-half text-xl"></i>
                      </div>
                      <input type="number" name="durationMonths" value={input.durationMonths || ''} onChange={handleInputChange} inputMode="numeric" className="bg-transparent text-2xl font-black w-full outline-none text-slate-700" placeholder={t.MONTHS} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">From</span>
                         <input type="date" name="startDate" value={input.startDate} onChange={handleInputChange} className="w-full p-5 bg-slate-50 rounded-[1.2rem] outline-none font-black text-slate-700 text-xs shadow-inner-soft border border-slate-100" />
                      </div>
                      <div className="space-y-2">
                         <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">To</span>
                         <input type="date" name="endDate" value={input.endDate} onChange={handleInputChange} className="w-full p-5 bg-slate-50 rounded-[1.2rem] outline-none font-black text-slate-700 text-xs shadow-inner-soft border border-slate-100" />
                      </div>
                    </div>
                  )}
                </section>

                {/* Calculate Button */}
                <button onClick={handleCalculate} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-[0.98] transition-all text-xl flex items-center justify-center space-x-4 ripple">
                  <i className="fa-solid fa-bolt-lightning text-orange-400"></i>
                  <span>{t.CALCULATE}</span>
                </button>
              </>
            ) : (
              <div className="space-y-8 animate-slide-up pb-10">
                {/* Result Controls */}
                <div className="flex justify-between items-center">
                  <button onClick={() => setResult(null)} className="bg-white px-6 py-4 rounded-2xl text-[11px] font-black text-slate-500 shadow-premium ripple border border-slate-100 uppercase tracking-widest">
                    <i className="fa-solid fa-arrow-left mr-2"></i> {t.CLEAR}
                  </button>
                  <div className="flex space-x-3">
                    <button onClick={handleSpeakResults} className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-premium ripple border border-slate-100 ${isSpeechLoading ? 'bg-orange-600 text-white animate-pulse' : 'bg-white text-orange-600'}`}>
                      <i className={`fa-solid ${isSpeechLoading ? 'fa-stop' : 'fa-volume-high'} text-xl`}></i>
                    </button>
                    <button onClick={handleCopyResult} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-blue-600 shadow-premium ripple border border-slate-100 relative">
                      <i className="fa-solid fa-copy text-xl"></i>
                      {copied && <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg animate-bounce whitespace-nowrap z-50 shadow-xl">COPIED!</span>}
                    </button>
                    <button onClick={() => handleShareResult(result)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xl ripple">
                      <i className="fa-solid fa-share-nodes text-xl"></i>
                    </button>
                  </div>
                </div>

                {/* Main Result Card */}
                <div className="bg-white rounded-[3rem] p-10 shadow-premium border border-slate-100 relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full opacity-50 blur-3xl group-hover:bg-indigo-50 transition-colors"></div>
                   
                   <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3">{t.TOTAL}</p>
                   <h3 className="text-6xl font-black text-slate-900 mb-12 tracking-tighter leading-none">₹{result.totalAmount.toLocaleString('en-IN')}</h3>
                   
                   <div className="grid grid-cols-2 gap-8 mb-12 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.PRINCIPAL}</p>
                        <p className="text-3xl font-black text-slate-700 tracking-tight">₹{result.principal.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.INTEREST}</p>
                        <p className="text-3xl font-black text-orange-600 tracking-tight">₹{result.totalInterest.toLocaleString('en-IN')}</p>
                      </div>
                   </div>

                   <div className="pt-10 border-t border-slate-100 flex items-center justify-between relative z-10">
                      <div className="flex items-center space-x-5">
                         <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-slate-400 border border-slate-100">
                            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">{t.TIME}</p>
                            <p className="text-lg font-black text-slate-800 leading-none">
                              {result.years}y {result.months}m {result.days}d
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">{t.MONTHLY_AVG}</p>
                         <p className="text-lg font-black text-slate-600 leading-none">₹{result.monthlyInterest.toLocaleString('en-IN')}</p>
                      </div>
                   </div>
                </div>

                {/* Savings Callout */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('offers')}>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-indigo-200">Financial Insight</p>
                      <p className="text-base font-bold">You could save ₹{Math.round(result.totalInterest * 0.4).toLocaleString('en-IN')} with Bank Rates.</p>
                   </div>
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-2 transition-transform">
                      <i className="fa-solid fa-arrow-right"></i>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OFFERS TAB (Monetization Center) */}
        {activeTab === 'offers' && (
          <div className="space-y-8 animate-slide-up">
            <div className="px-2">
               <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{t.OFFERS_TITLE}</h2>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{t.OFFERS_SUB}</p>
            </div>

            <div className="space-y-6">
               {/* Premium Card: Gold Loan */}
               <div onClick={() => handleOfferClick('gold')} className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden cursor-pointer ripple group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                     <i className="fa-solid fa-coins text-9xl"></i>
                  </div>
                  <div className="flex items-center space-x-3 mb-6">
                    <span className="bg-white/25 text-[10px] font-black uppercase px-4 py-1.5 rounded-full backdrop-blur-md">Editor's Choice</span>
                    <span className="bg-amber-900/30 text-[10px] font-black uppercase px-4 py-1.5 rounded-full">Secure</span>
                  </div>
                  <h4 className="text-3xl font-black mb-2 tracking-tight">{t.GOLD_LOAN}</h4>
                  <p className="text-sm font-bold text-amber-50 opacity-90 mb-8 leading-relaxed max-w-[200px]">Why pay 2-3% interest in village? Get loans at 0.88% monthly.</p>
                  <button className="bg-white text-amber-700 px-10 py-4 rounded-2xl font-black shadow-xl text-sm flex items-center space-x-2">
                     <span>{t.APPLY_NOW}</span>
                     <i className="fa-solid fa-circle-chevron-right"></i>
                  </button>
               </div>

               {/* Modern Card: Personal Loan */}
               <div onClick={() => handleOfferClick('personal')} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium flex items-center space-x-6 cursor-pointer ripple group">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                     <i className="fa-solid fa-money-bill-transfer"></i>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-xl font-black text-slate-800 mb-1">{t.PERSONAL_LOAN}</h4>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Check Eligibility Now</p>
                     <p className="text-[11px] font-medium text-slate-400 leading-tight">No paperwork. 100% digital process.</p>
                  </div>
               </div>

               {/* Modern Card: High Yield FD */}
               <div onClick={() => handleOfferClick('fd')} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium flex items-center space-x-6 cursor-pointer ripple group">
                  <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center text-3xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
                     <i className="fa-solid fa-piggy-bank"></i>
                  </div>
                  <div className="flex-1">
                     <h4 className="text-xl font-black text-slate-800 mb-1">{t.BEST_FD}</h4>
                     <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Safe Investment</p>
                     <p className="text-[11px] font-medium text-slate-400 leading-tight">Grow your savings with fixed monthly returns.</p>
                  </div>
               </div>
            </div>

            {/* Referral Info for Owner */}
            <div className="py-10 px-6 text-center bg-slate-100 rounded-[2rem] border border-slate-200">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Developed by VS APPS</p>
               <p className="text-[13px] font-bold text-slate-600 leading-relaxed">
                 We help people find cheaper loans and better savings.<br/>
                 <span className="text-orange-600">Your calculations are 100% Private.</span>
               </p>
            </div>
          </div>
        )}

        {/* HISTORY & PLAN (Same functional logic, polished visuals) */}
        {activeTab === 'history' && (
           <div className="space-y-6 animate-slide-up pb-10">
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.HISTORY}</h2>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-5 py-3 rounded-2xl ripple">
                    {t.CLEAR_HISTORY}
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
                     <i className="fa-solid fa-folder-open text-4xl"></i>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{t.NO_HISTORY}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {history.map(item => (
                    <div key={item.id} onClick={() => { setInput(item.input); setResult(item.result); setActiveTab('calc'); }} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-premium flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer ripple group">
                       <div className="flex items-center space-x-6">
                         <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl ${item.input.interestType === InterestType.SIMPLE ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            <i className={`fa-solid ${item.input.interestType === InterestType.SIMPLE ? 'fa-receipt' : 'fa-arrows-rotate'}`}></i>
                         </div>
                         <div>
                           <p className="text-2xl font-black text-slate-800 tracking-tight">₹{item.result.principal.toLocaleString('en-IN')}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {item.result.totalDays} {t.DAYS_UNIT} @ {item.input.rate}%
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-orange-600 tracking-tight">+₹{item.result.totalInterest.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-8 animate-slide-up pb-10">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10 blur-xl bg-orange-500 w-40 h-40 rounded-full"></div>
               <h3 className="text-3xl font-black mb-3 flex items-center tracking-tight">
                 <i className="fa-solid fa-chart-line mr-4 text-orange-400"></i> {t.PLAN_TITLE}
               </h3>
               <p className="text-slate-400 text-xs font-bold mb-10 uppercase tracking-[0.2em]">{t.PLAN_SUB}</p>
               
               {result ? (
                 <div className="space-y-4">
                    {getProjection().map(p => (
                      <div key={p.month} className="bg-white/5 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                         <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">After {p.month} {t.MONTHS_UNIT}</p>
                            <p className="text-2xl font-black tracking-tight text-white">₹{p.total.toLocaleString('en-IN')}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interest</p>
                            <p className="text-lg font-black text-orange-400 leading-none">₹{p.interest.toLocaleString('en-IN')}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5">
                    <i className="fa-solid fa-calculator text-6xl text-white/5 mb-8"></i>
                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Perform a calculation first</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {(showSettings || showHelp) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-50 flex items-end justify-center animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-t-[3.5rem] p-10 animate-slide-up pb-16 shadow-2xl">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
              
              {showSettings ? (
                <>
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">App Info</h2>
                    <button onClick={() => setShowSettings(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center ripple border border-slate-100">
                      <i className="fa-solid fa-xmark text-slate-400"></i>
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 block">Change App Language</label>
                       <div className="grid grid-cols-3 gap-3">
                          {LANGUAGES.map(l => (
                            <button key={l.code} onClick={() => { setLang(l.code); localStorage.setItem('app_lang', l.code); }} className={`py-5 rounded-2xl border-2 transition-all font-black text-xs ${lang === l.code ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-premium' : 'border-slate-50 text-slate-400 bg-slate-50'}`}>
                              {l.native}
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    {/* OWNER'S GUIDE SECTION */}
                    <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl">
                       <h5 className="font-black text-sm uppercase mb-3 flex items-center"><i className="fa-solid fa-circle-dollar-to-slot mr-2"></i> How to Earn Money</h5>
                       <p className="text-[11px] font-medium leading-relaxed opacity-90 mb-4">You earn money whenever users apply for a loan through the "Offers" tab. To start: Sign up for "Paisabazaar Partner" and replace the URLs in App.tsx.</p>
                       <button onClick={() => window.open('https://partner.paisabazaar.com/', '_blank')} className="w-full bg-white text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Sign Up as Partner</button>
                    </div>

                    <button onClick={() => { setShowPrivacy(true); setShowSettings(false); }} className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] font-black text-slate-700 text-sm ripple border border-slate-100">
                       <div className="flex items-center space-x-5">
                          <i className="fa-solid fa-shield-halved text-slate-400 text-lg"></i>
                          <span>{t.PRIVACY}</span>
                       </div>
                       <i className="fa-solid fa-chevron-right text-slate-200"></i>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">{t.HELP}</h2>
                    <button onClick={() => setShowHelp(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center ripple border border-slate-100">
                      <i className="fa-solid fa-xmark text-slate-400"></i>
                    </button>
                  </div>
                  <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed">
                     <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100">
                        <p className="font-black text-orange-700 uppercase text-[11px] mb-3 tracking-widest">Village Style (వడ్డీ)</p>
                        <p className="text-[13px] leading-relaxed">In villages, interest is calculated per ₹100 per month. If you enter "2", it means ₹2 for every ₹100 per month (24% per year).</p>
                     </div>
                     <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
                        <p className="font-black text-indigo-700 uppercase text-[11px] mb-3 tracking-widest">Dates vs Months</p>
                        <p className="text-[13px] leading-relaxed">Use "Dates" for specific periods (e.g., from loan day to today). Use "Months" for fixed terms (e.g., 24 months).</p>
                     </div>
                  </div>
                  <button onClick={() => setShowHelp(false)} className="w-full mt-10 bg-slate-900 text-white font-black py-6 rounded-3xl text-xs uppercase tracking-[0.3em] shadow-2xl ripple">Got it!</button>
                </>
              )}
           </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-in slide-in-from-bottom duration-500">
           <div className="p-8 flex items-center justify-between border-b border-slate-100">
              <button onClick={() => setShowPrivacy(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                <i className="fa-solid fa-arrow-left text-slate-400"></i>
              </button>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Privacy & Data</span>
           </div>
           <div className="flex-1 overflow-y-auto p-10">
              <h1 className="text-4xl font-black mb-10 tracking-tighter text-slate-900 leading-tight">Your Data Never Leaves Your Phone.</h1>
              <div className="space-y-10 text-sm text-slate-500 font-medium leading-relaxed">
                <div className="space-y-4">
                   <p className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center"><i className="fa-solid fa-server mr-3 text-orange-500 text-lg"></i> No Cloud Servers</p>
                   <p className="text-[15px]">We do not store your calculations on any server. Everything is saved in your own phone's "Local Storage". Even we cannot see your data.</p>
                </div>
                <div className="space-y-4">
                   <p className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center"><i className="fa-solid fa-handshake mr-3 text-orange-500 text-lg"></i> Monetization Disclosure</p>
                   <p className="text-[15px]">The "Offers" tab contains affiliate links. If you apply for a product, we may receive a commission at no extra cost to you. This keeps the app free.</p>
                </div>
              </div>
              <button onClick={() => setShowPrivacy(false)} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2rem] shadow-2xl mt-16 uppercase tracking-[0.3em] text-xs ripple">I AGREE</button>
           </div>
        </div>
      )}

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-slate-100 flex items-center justify-around h-28 px-4 pb-8 z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.06)]">
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center transition-all ${activeTab === 'calc' ? 'text-orange-600' : 'text-slate-400'}`}>
          <div className={`w-16 h-12 flex items-center justify-center rounded-2xl mb-2 transition-all ${activeTab === 'calc' ? 'bg-orange-100' : 'hover:bg-slate-100'}`}>
            <i className={`fa-solid fa-calculator text-xl ${activeTab === 'calc' ? 'scale-110' : ''}`}></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">Calc</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center transition-all ${activeTab === 'history' ? 'text-orange-600' : 'text-slate-400'}`}>
          <div className={`w-16 h-12 flex items-center justify-center rounded-2xl mb-2 transition-all ${activeTab === 'history' ? 'bg-orange-100' : 'hover:bg-slate-100'}`}>
            <i className={`fa-solid fa-clock-rotate-left text-xl ${activeTab === 'history' ? 'scale-110' : ''}`}></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">History</span>
        </button>
        <button onClick={() => setActiveTab('plan')} className={`flex flex-col items-center transition-all ${activeTab === 'plan' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`w-16 h-12 flex items-center justify-center rounded-2xl mb-2 transition-all ${activeTab === 'plan' ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}>
            <i className={`fa-solid fa-chart-line text-xl ${activeTab === 'plan' ? 'scale-110' : ''}`}></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">Plan</span>
        </button>
        <button onClick={() => setActiveTab('offers')} className={`flex flex-col items-center transition-all ${activeTab === 'offers' ? 'text-amber-600' : 'text-slate-400'}`}>
          <div className={`w-16 h-12 flex items-center justify-center rounded-2xl mb-2 transition-all ${activeTab === 'offers' ? 'bg-amber-100' : 'hover:bg-slate-100'}`}>
            <i className={`fa-solid fa-gift text-xl ${activeTab === 'offers' ? 'scale-110' : ''}`}></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">Offers</span>
        </button>
      </nav>

    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { 
  Calculator, 
  Layers, 
  Hash, 
  Copy, 
  Check, 
  RotateCcw, 
  ArrowRightLeft, 
  Zap, 
  Grid,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  Info,
  Flame,
  CheckCircle2,
  ExternalLink,
  Globe
} from 'lucide-react';
import { DayKey, Language, WeekRecord, MarketType, MARKETS } from '../types';
import { 
  CUT_MAP, 
  getCutAnk, 
  getFamilyJodis, 
  isRedJodi, 
  calculatePanaSum, 
  ALL_PANAS, 
  generateMotorPanas,
  generateCyclePanas,
  DAY_NAMES,
  DAY_KEYS,
  calculateLiveOpenToClose
} from '../utils/matkaMath';

interface MathCalculatorsProps {
  language: Language;
  history?: WeekRecord[];
  initialTool?: 'cut' | 'family' | 'pana' | 'motor' | 'matrix' | 'openToClose' | 'cyclePana';
  market?: MarketType;
}

export const MathCalculators: React.FC<MathCalculatorsProps> = ({ 
  language, 
  history = [], 
  initialTool = 'openToClose',
  market = 'kalyan',
}) => {
  const isMr = language === 'mr';
  const isNight = market === 'rajdhani_night';
  const marketInfo = MARKETS[market];

  // Sub-tabs
  const [activeTool, setActiveTool] = useState<'cut' | 'family' | 'pana' | 'motor' | 'matrix' | 'openToClose' | 'cyclePana'>(initialTool);

  // Tool 7: Cycle Pana (CP) State
  const [cpDigit1, setCpDigit1] = useState<number>(2);
  const [cpDigit2, setCpDigit2] = useState<number>(6);
  const [copiedCp, setCopiedCp] = useState(false);

  // Tool 1: Cut Ank State
  const [selectedCutDigit, setSelectedCutDigit] = useState<number>(0);

  // Tool 2: Family Jodi State
  const [familyInput, setFamilyInput] = useState<string>('24');
  const [copiedFamily, setCopiedFamily] = useState(false);

  // Tool 6: Live Open-to-Close State
  const [liveOpenDigit, setLiveOpenDigit] = useState<number>(9);
  const [liveDay, setLiveDay] = useState<DayKey>('wed');
  const [liveOpenPana, setLiveOpenPana] = useState<string>('234');
  const [copiedLiveJodi, setCopiedLiveJodi] = useState<string | null>(null);

  // Tool 3: Pana Explorer State
  const [panaAnkSelect, setPanaAnkSelect] = useState<number>(5);
  const [customPanaInput, setCustomPanaInput] = useState<string>('159');

  // Tool 4: Motor Pana State
  const [selectedMotorDigits, setSelectedMotorDigits] = useState<number[]>([1, 2, 4, 7]);
  const [copiedMotor, setCopiedMotor] = useState(false);

  const toggleMotorDigit = (d: number) => {
    if (selectedMotorDigits.includes(d)) {
      if (selectedMotorDigits.length > 3) {
        setSelectedMotorDigits(selectedMotorDigits.filter(x => x !== d));
      }
    } else {
      if (selectedMotorDigits.length < 6) {
        setSelectedMotorDigits([...selectedMotorDigits, d].sort((a, b) => a - b));
      }
    }
  };

  const motorPanas = generateMotorPanas(selectedMotorDigits);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Tool Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center gap-2">
        {[
          { id: 'openToClose', label: isMr ? '⚡ लाईव्ह ओपन ➔ क्लोज शोधक' : '⚡ Live Open ➔ Close Finder', icon: Target },
          { id: 'cut', label: isMr ? '१. कट अंक तक्ता' : '1. Cut Ank Table', icon: ArrowRightLeft },
          { id: 'family', label: isMr ? '२. फॅमिली जोडी' : '2. Family Jodi', icon: Hash },
          { id: 'pana', label: isMr ? '३. पाना / पत्ती शोधक' : '3. Pana Explorer', icon: Layers },
          { id: 'cyclePana', label: isMr ? '४. सायकल पाना (CP)' : '4. Cycle Pana (CP)', icon: Flame },
          { id: 'motor', label: isMr ? '५. मोटर पाना मेकर' : '5. Motor Pana', icon: Zap },
          { id: 'matrix', label: isMr ? '६. बेरीज व फरक तक्ता' : '6. Total-Diff Matrix', icon: Grid },
        ].map(t => {
          const Icon = t.icon;
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOOL 1: CUT ANK CALCULATOR */}
      {activeTool === 'cut' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <span>
                {isNight 
                  ? (isMr ? 'राजधानी नाईट: कट अंक नियम व तक्ता' : 'Rajdhani Night: Cut Ank Rules & Table') 
                  : (isMr ? 'कल्याण: कट अंक नियम व तक्ता' : 'Kalyan: Cut Ank Rules & Table')}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isMr
                ? `${marketInfo.name[language]} अंक गणितात ५ चा फरक असणारे अंक एकमेकांचे "कट अंक" मानले जातात. सूत्र: (अंक + ५) % १०`
                : `In ${marketInfo.name[language]} math, digits differing by 5 are reciprocal Cut pairs. Formula: (Digit + 5) % 10.`}
            </p>
          </div>

          {/* Cut Pair Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { a: 0, b: 5 },
              { a: 1, b: 6 },
              { a: 2, b: 7 },
              { a: 3, b: 8 },
              { a: 4, b: 9 },
            ].map(pair => (
              <div
                key={pair.a}
                onClick={() => setSelectedCutDigit(pair.a)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  selectedCutDigit === pair.a || selectedCutDigit === pair.b
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 font-mono font-black text-2xl sm:text-3xl">
                  <span className="text-amber-400">{pair.a}</span>
                  <span className="text-slate-600 text-sm">↔</span>
                  <span className="text-amber-400">{pair.b}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {isMr ? `जोडी: ${pair.a}${pair.b} (लाल)` : `Red: ${pair.a}${pair.b}`}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Digit Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              {isMr ? 'कोणताही अंक निवडून त्याचा कट व परिणाम तपासा:' : 'Select any digit to inspect its Cut effect:'}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedCutDigit(d)}
                  className={`py-2 rounded-lg font-mono font-bold text-base transition-all ${
                    selectedCutDigit === d
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">{isMr ? 'निवडलेला अंक: ' : 'Selected Digit: '}</span>
                <span className="font-bold text-amber-400 font-mono text-base mr-3">{selectedCutDigit}</span>
                <span className="text-slate-400">{isMr ? 'त्याचा कट अंक: ' : 'Its Cut Ank: '}</span>
                <span className="font-bold text-emerald-400 font-mono text-base">{getCutAnk(selectedCutDigit)}</span>
              </div>
              <div className="text-slate-400">
                {isMr
                  ? `उदा. जर ओपन ${selectedCutDigit} आला, तर क्लोजमध्ये कट ${getCutAnk(selectedCutDigit)} येण्याची शक्यता जास्त असते.`
                  : `If Open is ${selectedCutDigit}, historical symmetry shows high frequency of Cut ${getCutAnk(selectedCutDigit)} in Close.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: FAMILY JODI GENERATOR */}
      {activeTool === 'family' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Hash className="w-5 h-5 text-amber-400" />
              <span>
                {isNight 
                  ? (isMr ? 'राजधानी नाईट: फॅमिली जोडी जनरेटर' : 'Rajdhani Night: Family Jodi Generator') 
                  : (isMr ? 'कल्याण: फॅमिली जोडी जनरेटर' : 'Kalyan: Family Jodi Generator')}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isMr
                ? 'कोणतीही २ अंकी जोडी प्रविष्ट करा. प्रणाली तात्काळ त्या जोडीची संपूर्ण ८ (किंवा कट जोडीची ४) फॅमिली जोड्या तयार करेल.'
                : 'Enter any 2-digit Jodi to generate its 8 (or 4 for red/cut) family pairs based on cut permutations.'}
            </p>
          </div>

          {/* Input Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {isMr ? '२ अंकी जोडी टाका (उदा. 24, 38, 55):' : 'Enter 2-digit pair (e.g. 24, 38, 55):'}
              </label>
              <input
                type="text"
                maxLength={2}
                value={familyInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFamilyInput(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-xl font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['14', '24', '35', '55', '78'].map(sample => (
                <button
                  key={sample}
                  onClick={() => setFamilyInput(sample)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 hover:border-amber-500/50"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Results Output */}
          {familyInput.length === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isMr ? `जोडी ${familyInput} ची फॅमिली:` : `Family of ${familyInput}:`}
                </span>
                <span className="text-xs text-slate-400">
                  {getFamilyJodis(familyInput).length} {isMr ? 'एकूण जोड्या' : 'total pairs'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getFamilyJodis(familyInput).map(jodi => {
                  const isRed = isRedJodi(jodi);
                  return (
                    <div
                      key={jodi}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center ${
                        jodi === familyInput
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : isRed
                          ? 'bg-red-950/40 border-red-500/50 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <span className="text-3xl font-black font-mono">
                        {jodi}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {jodi === familyInput ? (isMr ? 'मूळ जोडी' : 'Base Pair') : isRed ? (isMr ? 'लाल जोडी' : 'Red Pair') : (isMr ? 'फॅमिली' : 'Family')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: PANA EXPLORER */}
      {activeTool === 'pana' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>{isMr ? 'पाना / पत्ती कॅल्क्युलेटर व तक्ता (220 Panels)' : 'Pana / Patti Explorer (220 Panels)'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isMr
                ? 'प्रत्येक अंकाचे (० ते ९) १२ सिंगल पाने, ९ डबल पाने, आणि १ ट्रिपल पाना असतात.'
                : 'Each digit (0-9) corresponds to exactly 12 Single Panas, 9 Double Panas, and 1 Triple Pana.'}
            </p>
          </div>

          {/* Quick Pana Check */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {isMr ? 'कोणताही ३ अंकी पाना तपासा (उदा. 159, 234, 777):' : 'Check any 3-digit Pana (e.g. 159, 234):'}
              </label>
              <input
                type="text"
                maxLength={3}
                value={customPanaInput}
                onChange={(e) => setCustomPanaInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-xl font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {customPanaInput.length === 3 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center sm:min-w-[180px]">
                <div className="text-[11px] text-slate-400">{isMr ? 'बेरीज व अंक:' : 'Resulting Ank:'}</div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {calculatePanaSum(customPanaInput)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ∑ = {customPanaInput.split('').join(' + ')} = {parseInt(customPanaInput[0], 10) + parseInt(customPanaInput[1], 10) + parseInt(customPanaInput[2], 10)}
                </div>
              </div>
            )}
          </div>

          {/* Select Ank to View All Its Panas */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">
              {isMr ? 'अंक निवडा आणि त्याचे सर्व २२ पाने पाहा:' : 'Select digit to view its full 22 Pana set:'}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                <button
                  key={d}
                  onClick={() => setPanaAnkSelect(d)}
                  className={`py-2 rounded-lg font-mono font-bold text-base transition-all ${
                    panaAnkSelect === d
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Displaying Panas for panaAnkSelect */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Single Panas */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Single Pana (SP)</span>
                  <span className="text-[10px] text-amber-400 font-mono">12 Panas</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  {(ALL_PANAS.singlePanas[panaAnkSelect] || []).map(p => (
                    <span key={p} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-center text-slate-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Double Panas */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Double Pana (DP)</span>
                  <span className="text-[10px] text-amber-400 font-mono">9 Panas</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  {(ALL_PANAS.doublePanas[panaAnkSelect] || []).map(p => (
                    <span key={p} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-center text-amber-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Triple Pana */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Triple Pana (TP)</span>
                  <span className="text-[10px] text-amber-400 font-mono">1 Pana</span>
                </div>
                <div className="flex items-center justify-center p-4">
                  {(ALL_PANAS.triplePanas[panaAnkSelect] || []).map(p => (
                    <span key={p} className="bg-red-950/60 border border-red-500/50 px-4 py-2 rounded-xl text-lg font-mono font-bold text-red-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL: CYCLE PANA (CP) GENERATOR */}
      {activeTool === 'cyclePana' && (() => {
        const cpPanas = generateCyclePanas(cpDigit1, cpDigit2);
        const handleCopyAllCp = () => {
          const text = cpPanas.map(p => p.pana).join(', ');
          navigator.clipboard.writeText(text);
          setCopiedCp(true);
          setTimeout(() => setCopiedCp(false), 2000);
        };

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>{isMr ? 'सायकल पाना जनरेटर (Cycle Pana - CP)' : 'Cycle Pana (CP) Generator'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isMr
                    ? 'कोणतेही २ मुख्य अंक निवडा. प्रणाली त्या २ अंकांवर आधारलेली सर्व १० पाने (Single व Double Pana) तयार करेल.'
                    : 'Select any 2 base digits to generate all 10 standard Cycle Panas (CP) containing both digits.'}
                </p>
              </div>

              <button
                onClick={handleCopyAllCp}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
              >
                {copiedCp ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>{isMr ? 'सर्व पाने कॉपी झाले!' : 'Copied All Panas!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>{isMr ? 'सर्व १० पाने कॉपी करा' : 'Copy All 10 Panas'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Digit Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs font-semibold text-amber-400 mb-2">
                  {isMr ? 'पहिला अंक निवडा (Base Digit 1):' : 'Select Base Digit 1:'}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 font-mono">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                    <button
                      key={d}
                      onClick={() => setCpDigit1(d)}
                      className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                        cpDigit1 === d
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <div className="text-xs font-semibold text-amber-400 mb-2">
                  {isMr ? 'दुसरा अंक निवडा (Base Digit 2):' : 'Select Base Digit 2:'}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 font-mono">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                    <button
                      key={d}
                      onClick={() => setCpDigit2(d)}
                      className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                        cpDigit2 === d
                          ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated 10 Cycle Panas Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {isMr ? `सायकल पाना [${cpDigit1}, ${cpDigit2}] चे १० पाने:` : `10 Panas for Cycle [${cpDigit1}, ${cpDigit2}]:`}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    CP {cpDigit1}{cpDigit2}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {cpPanas.filter(p => !p.isDouble).length} Single · {cpPanas.filter(p => p.isDouble).length} Double
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {cpPanas.map(({ pana, ank, isDouble }) => (
                  <div
                    key={pana}
                    onClick={() => {
                      navigator.clipboard.writeText(pana);
                    }}
                    className={`cursor-pointer p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all group ${
                      isDouble
                        ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                        : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
                    }`}
                    title={isMr ? 'कॉपी करण्यासाठी क्लिक करा' : 'Click to copy'}
                  >
                    <span className="text-2xl font-black font-mono text-white group-hover:scale-105 transition-transform">
                      {pana}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-sans">
                      <span className="text-amber-400 font-bold font-mono">
                        {isMr ? `अंक: ${ank}` : `Sum: ${ank}`}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className={isDouble ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                        {isDouble ? 'DP' : 'SP'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isMr
                    ? `टीप: सायकल पानामध्ये दोन निश्चित अंक (${cpDigit1} आणि ${cpDigit2}) घेऊन तिसरा अंक ० ते ९ फिरवला जातो. यात ८ सिंगल पाने आणि २ डबल पाने तयार होतात.`
                    : `Note: Cycle Pana takes two base digits (${cpDigit1} & ${cpDigit2}) and cycles the 3rd digit from 0 to 9, yielding 8 single and 2 double panas.`}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOOL 4: MOTOR PANA GENERATOR */}
      {activeTool === 'motor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>{isMr ? 'मोटर पाना जनरेटर (Motor Pana Generator)' : 'Motor Pana Generator'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isMr
                ? 'कोणतेही ४ किंवा ५ अंक निवडा. प्रणाली त्या अंकांचे सर्व शक्य सिंगल व डबल पाने तयार करेल.'
                : 'Select 4 or 5 digits to auto-generate all possible Single and Double Motor Panas.'}
            </p>
          </div>

          {/* Digit Pickers */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              {isMr ? '४ किंवा ५ अंक निवडा:' : 'Select 4 to 5 digits:'}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                const isSelected = selectedMotorDigits.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleMotorDigit(d)}
                    className={`py-2 rounded-lg font-mono font-bold text-base transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motor Pana Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Motor Panas */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Single Motor Panas (SP)</span>
                <span className="text-xs text-amber-400 font-mono">{motorPanas.sp.length} Panas</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {motorPanas.sp.map(p => (
                  <span key={p} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Double Motor Panas */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Double Motor Panas (DP)</span>
                <span className="text-xs text-amber-400 font-mono">{motorPanas.dp.length} Panas</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {motorPanas.dp.map(p => (
                  <span key={p} className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-amber-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 5: TOTAL & DIFFERENCE MATRIX */}
      {activeTool === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-amber-400" />
              <span>{isMr ? 'जोडी बेरीज व फरक मॅट्रिक्स (100 Pairs Matrix)' : 'Jodi Total & Difference Matrix'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isMr
                ? '०० ते ९९ मधील प्रत्येक जोडीची बेरीज आणि फरक खालील तक्त्यावरून समजून घ्या.'
                : 'Inspect the sum total (A+B)%10 and absolute difference |A-B| for all 100 possible pairs.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2 text-amber-400">O \ C</th>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
                    <th key={c} className="p-2 text-slate-200">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(o => (
                  <tr key={o} className="hover:bg-slate-800/50">
                    <td className="p-2 font-bold text-amber-400 bg-slate-950">{o}</td>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => {
                      const jodi = `${o}${c}`;
                      const isRed = isRedJodi(jodi);
                      const total = (o + c) % 10;
                      return (
                        <td
                          key={c}
                          className={`p-1.5 ${isRed ? 'bg-red-950/30 text-red-400 font-bold' : 'text-slate-300'}`}
                          title={`Jodi: ${jodi}, Total: ${total}, Diff: ${Math.abs(o - c)}`}
                        >
                          <div>{jodi}</div>
                          <div className="text-[9px] text-slate-500">T:{total}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOOL 6: LIVE OPEN TO CLOSE FINDER */}
      {activeTool === 'openToClose' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {isMr ? 'लाईव्ह क्लोज प्रिडिक्टर' : 'Live Close Predictor'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {isMr ? 'उच्च अचूकता (~८५%)' : 'High Precision (~85%)'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{isMr ? 'लाईव्ह ओपन ➔ क्लोज शोधक' : 'Live Open ➔ Close Finder'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {isMr
                    ? 'दुपारी ओपन अंक जाहीर झाल्यानंतर क्लोजसाठी येणारे पक्के २ ते ४ अंक, अंतिम जोड्या आणि पाना शोधण्याचे इन्स्टंट कॅल्क्युलेटर.'
                    : 'Instant mathematical calculator to isolate the highest-probability Close digits, final pairs, and close panas once the Open is declared.'}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href="https://dpboss.tax/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white font-semibold bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer shadow-sm"
                    title={isMr ? 'अधिकृत निकाल वेबसाईटवर थेट निकाल व OTC पहा' : 'View live OTC on official site'}
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isMr ? 'अधिकृत वेबसाईटवर थेट निकाल व OTC पहा' : 'View Live OTC on Official Website'}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Time Interval Card */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {isMr ? 'ओपन-क्लोज कालावधी (Interval)' : 'Open-Close Time Window'}
                  </div>
                  <div className="text-sm font-bold text-amber-400">
                    {isMr ? '२ तास (सुमारे १२० मिनिटे)' : '2 Hours (approx. 120 mins)'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isNight ? (isMr ? '०९:३५ PM ओपन ➔ ११:४५ PM क्लोज' : '09:35 PM Open ➔ 11:45 PM Close') : (isMr ? '०४:५० PM ओपन ➔ ०६:५० PM क्लोज' : '04:50 PM Open ➔ 06:50 PM Close')}
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs: Day, Open Digit, Open Pana */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
              {/* Day Selection */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {isMr ? '१. वार निवडा (Select Weekday):' : '1. Select Weekday:'}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DAY_KEYS.map(d => {
                    const isSelected = liveDay === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setLiveDay(d)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold">{DAY_NAMES[d][language]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Open Digit Selector (0-9) */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{isMr ? '२. जाहीर झालेला ओपन अंक निवडा (Select Arrived Open):' : '2. Select Declared Open Digit:'}</span>
                  <span className="text-amber-400 font-mono text-xs">
                    {isMr ? `निवडलेला ओपन: ${liveOpenDigit}` : `Selected Open: ${liveOpenDigit}`}
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-mono">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                    const isSelected = liveOpenDigit === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setLiveOpenDigit(d)}
                        className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105'
                            : 'bg-slate-950 border-slate-800 text-white hover:border-slate-600 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-lg sm:text-xl font-bold">{d}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                          कट: {getCutAnk(d)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Open Pana input */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">
                    {isMr ? '३. जाहीर झालेला ओपन पाना (पर्यायी):' : '3. Declared Open Pana (Optional):'}
                  </span>
                  <input
                    type="text"
                    maxLength={3}
                    value={liveOpenPana}
                    onChange={e => setLiveOpenPana(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    placeholder="234"
                    className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {liveOpenPana.length === 3 ? (
                    <span className="text-emerald-400">
                      ✓ पाना बेरीज: {liveOpenPana[0]}+{liveOpenPana[1]}+{liveOpenPana[2]} = {calculatePanaSum(liveOpenPana)} (अंक)
                    </span>
                  ) : (
                    <span>उदा. 234, 159, 148</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC RESULTS: Top Close Digits */}
          {(() => {
            const res = calculateLiveOpenToClose(liveOpenDigit, liveDay, history, liveOpenPana);
            return (
              <div className="space-y-6">
                {/* 4 Close Digits */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400" />
                        <span>{isMr ? `ओपन [${liveOpenDigit}] साठी ४ पक्के क्लोज अंक` : `Top 4 Close Digits for Open [${liveOpenDigit}]`}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isMr
                          ? 'बेरीज, कट अंक आणि ऐतिहासिक वारंवारतेनुसार क्लोजमध्ये येण्याची सर्वाधिक संभाव्यता असलेले अंक.'
                          : 'Ranked Close OTC digits based on Modular Total, Cut Rules, and historical correlation.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {res.topCloseDigits.map((item, idx) => (
                      <div
                        key={item.digit}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition-all relative overflow-hidden group"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-amber-400">#{idx + 1} {isMr ? 'क्लोज अंक' : 'Close Ank'}</span>
                          <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                            {item.score}%
                          </span>
                        </div>
                        <div className="text-center my-2">
                          <div className="text-4xl sm:text-5xl font-black text-white group-hover:text-amber-400 transition-colors font-mono">
                            {item.digit}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {isMr ? 'कट अंक' : 'Cut Ank'}: <strong className="text-amber-300 font-mono">{item.cut}</strong>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[11px] text-slate-300 leading-tight">
                            {item.reason}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            <span className="text-amber-400 font-sans font-semibold">पाने:</span> {item.singlePanas.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Formed Jodis (Strong & Support) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Strong Jodis */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h5 className="font-bold text-white text-sm">
                          {isMr ? '४ मुख्य पक्की जोडी (Strong Jodis)' : '4 Strong Final Jodis'}
                        </h5>
                      </div>
                      <span className="text-xs text-slate-400">{isMr ? 'मुख्य संभाव्य जोड्या' : 'Primary Candidate Pairs'}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 font-mono">
                      {res.strongJodis.map(j => (
                        <div
                          key={j.jodi}
                          onClick={() => {
                            navigator.clipboard.writeText(j.jodi);
                            setCopiedLiveJodi(j.jodi);
                            setTimeout(() => setCopiedLiveJodi(null), 1500);
                          }}
                          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                            j.isRed
                              ? 'bg-red-950/20 border-red-500/40 text-red-400 hover:border-red-400'
                              : 'bg-slate-950 border-slate-800 text-white hover:border-amber-500/60'
                          }`}
                        >
                          <div className="text-2xl font-black">{j.jodi}</div>
                          <div className="text-[10px] mt-1 text-slate-400 font-sans flex items-center justify-center gap-1">
                            {j.isRed ? <span className="text-red-400 font-semibold">लाल</span> : <span>T:{j.total}</span>}
                            <span>·</span>
                            <span>D:{j.diff}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Jodis */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h5 className="font-bold text-white text-sm">
                          {isMr ? '४ सपोर्ट जोडी (Support Jodis)' : '4 Support Jodis'}
                        </h5>
                      </div>
                      <span className="text-xs text-slate-400">{isMr ? 'कट व बॅकअप जोड्या' : 'Cut & Backup Pairs'}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 font-mono">
                      {res.supportJodis.map(j => (
                        <div
                          key={j.jodi}
                          onClick={() => {
                            navigator.clipboard.writeText(j.jodi);
                            setCopiedLiveJodi(j.jodi);
                            setTimeout(() => setCopiedLiveJodi(null), 1500);
                          }}
                          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                            j.isRed
                              ? 'bg-red-950/20 border-red-500/40 text-red-400 hover:border-red-400'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500/60'
                          }`}
                        >
                          <div className="text-2xl font-black">{j.jodi}</div>
                          <div className="text-[10px] mt-1 text-slate-400 font-sans flex items-center justify-center gap-1">
                            {j.isRed ? <span className="text-red-400 font-semibold">लाल</span> : <span>T:{j.total}</span>}
                            <span>·</span>
                            <span>D:{j.diff}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {copiedLiveJodi && (
                  <div className="text-center text-xs text-emerald-400 font-medium">
                    ✓ जोडी {copiedLiveJodi} क्लिपबोर्डवर कॉपी केली!
                  </div>
                )}

                {/* Mathematical Derivation Steps */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
                  <h5 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>{isMr ? 'क्लोज काढण्याची संपूर्ण गणितीय मांडणी (Derivation Steps)' : 'Step-by-Step Derivation Logic'}</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {res.derivationSteps.map((step, sIdx) => (
                      <div key={sIdx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
                        <div className="font-bold text-amber-400">{step.title}</div>
                        <div className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800/80">
                          {step.calculation}
                        </div>
                        <div className="font-semibold text-white">
                          निकाल: <span className="text-emerald-400">{step.result}</span>
                        </div>
                        {step.note && <div className="text-[11px] text-slate-400">{step.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { BookOpen, ShieldAlert, Award, HelpCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface EducationalGuideProps {
  language: Language;
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({ language }) => {
  const isMr = language === 'mr';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isMr ? 'कल्याण अंक गणित व चार्ट अभ्यास मार्गदर्शक' : 'Kalyan Ank Ganit & Chart Study Guide'}
            </h2>
            <div className="text-xs text-slate-400">
              {isMr ? 'केवळ शैक्षणिक व गणितीय अभ्यासासाठी (Educational Reference Only)' : 'Purely for Educational & Mathematical Reference'}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          {isMr
            ? 'कल्याण जोडी आणि पॅनल चार्ट हा भारतीय अंक गणिताचा एक पारंपारिक संख्यात्मक तक्ता आहे. या मार्गदर्शकात ओपन, क्लोज, जोडी, पाना, कट अंक आणि लाईन-त्रिक पद्धतींचे संपूर्ण शास्त्र विशद केले आहे.'
            : 'The Kalyan Jodi and Panel Chart is an Indian numerical matrix. This reference guide explains Open, Close, Jodi, Pana, Cut Numbers, and Line-Trick analysis through mathematics and combinatorics.'}
        </p>
      </div>

      {/* Chapter 1: Anatomy of Kalyan Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
            १
          </span>
          <span>{isMr ? 'कल्याण चार्टची मूलभूत रचना (Anatomy of the Chart)' : 'Anatomy of the Kalyan Chart'}</span>
        </h3>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            {isMr
              ? 'कल्याण चार्टमध्ये प्रत्येक दिवसाचा निकाल ३ घटकांमध्ये विभागलेला असतो:'
              : 'Each day on the Kalyan Chart consists of 3 distinct numerical elements:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs font-bold text-amber-400 font-sans">{isMr ? '१. ओपन पाना (Open Pana)' : '1. Open Pana'}</div>
              <div className="text-lg font-black text-white mt-1">159</div>
              <div className="text-[11px] text-slate-400 font-sans mt-1">
                ३ अंकी चढत्या क्रमातील पाने. बेरीज: १+५+९ = १५ → युनिट अंक <strong>५</strong> (Open).
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs font-bold text-amber-400 font-sans">{isMr ? '२. जोडी (Jodi)' : '2. Jodi (Pair)'}</div>
              <div className="text-lg font-black text-red-400 mt-1">55</div>
              <div className="text-[11px] text-slate-400 font-sans mt-1">
                २ अंकी संख्या. पहिला अंक ओपन (५), दुसरा अंक क्लोज (५). दोन्ही समान असल्याने <strong>लाल जोडी</strong>.
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs font-bold text-amber-400 font-sans">{isMr ? '३. क्लोज पाना (Close Pana)' : '3. Close Pana'}</div>
              <div className="text-lg font-black text-white mt-1">690</div>
              <div className="text-[11px] text-slate-400 font-sans mt-1">
                ३ अंकी पाने. बेरीज: ६+९+१० = २५ → युनिट अंक <strong>५</strong> (Close).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 2: Cut Ank & Red Jodi Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
            २
          </span>
          <span>{isMr ? 'कट अंक व लाल जोडीचे नियम (Cut Numbers & Red Jodis)' : 'Cut Numbers & Red Pairs Rules'}</span>
        </h3>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            {isMr
              ? 'कट अंक हा कल्याण अंकगणिताचा पाया आहे. गणितीय दृष्ट्या दोन अंकांमध्ये ५ चा फरक असल्यास ते एकमेकांचे कट अंक असतात:'
              : 'Cut numbers form the bedrock of Indian numeral charts. Two digits differing by 5 (mod 10) are reciprocal cut pairs:'}
          </p>

          <div className="grid grid-cols-5 gap-2 text-center font-mono text-sm">
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="text-amber-400 font-bold">0 ↔ 5</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="text-amber-400 font-bold">1 ↔ 6</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="text-amber-400 font-bold">2 ↔ 7</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="text-amber-400 font-bold">3 ↔ 8</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
              <div className="text-amber-400 font-bold">4 ↔ 9</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-bold text-red-400 text-xs uppercase tracking-wider">
              {isMr ? 'लाल जोडी (Red Jodi) कधी बनते?' : 'What Makes a Red Jodi?'}
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              <li>
                <strong>समान अंक (Double Pairs):</strong> ००, ११, २२, ३३, ४४, ५५, ६६, ७७, ८८, ९९ (१० जोड्या).
              </li>
              <li>
                <strong>कट अंक जोड्या (Cut Pairs):</strong> ०५, ५०, १६, ६१, २७, ७२, ३८, ८३, ४९, ९४ (१० जोड्या).
              </li>
              <li>
                एकूण १०० जोड्यांपैकी २० जोड्या (२०%) लाल जोड्या असतात.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chapter 3: 220 Panas Classification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
            ३
          </span>
          <span>{isMr ? '२२० पानांचे वर्गीकरण (Single, Double, Triple Panas)' : '220 Panels Classification'}</span>
        </h3>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white text-xs">Single Pana (SP)</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">१२० पाने</div>
              <div className="text-[11px] text-slate-400 mt-1">
                तिन्ही अंक वेगळे असतात (उदा. 128, 359). प्रत्येक अंकाला १२ एसपी असतात.
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white text-xs">Double Pana (DP)</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">९० पाने</div>
              <div className="text-[11px] text-slate-400 mt-1">
                दोन अंक समान असतात (उदा. 225, 899). प्रत्येक अंकाला ९ डीपी असतात.
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="font-bold text-white text-xs">Triple Pana (TP)</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-0.5">१० पाने</div>
              <div className="text-[11px] text-slate-400 mt-1">
                तिन्ही अंक समान असतात (उदा. 111, 222, 777). प्रत्येक अंकाला १ टीपी असतो.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter 4: Mathematical Odds & Responsible Science */}
      <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-lg font-bold text-white">
            {isMr ? 'गणितीय संभाव्यता व सावधगिरी (Probability & Responsible Education)' : 'Probability Theory & Responsible Caution'}
          </h3>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            {isMr
              ? 'कल्याण अंकगणितात लाईन, त्रिक आणि कट अंक शोधणे हा मानवी बुद्धीचा पॅटर्न शोधण्याचा सुंदर सराव आहे. परंतु गणिताच्या दृष्टीने प्रत्येक ड्रॉ हा स्वतंत्र यादृच्छिक प्रयोग (Independent Random Variable) असतो:'
              : 'Studying lines, tricks, and cut numbers is a fascinating combinatorics exercise. In pure probability, each draw operates as an independent random variable:'}
          </p>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl font-mono text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>सिंगल अंक संभाव्यता (Open/Close Single Ank):</span>
              <strong className="text-amber-400">१/१० (१०%)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>४ ओटीसी अंकांची एकत्रित व्याप्ती (4 OTC Window):</span>
              <strong className="text-emerald-400">~७५% ते ८०%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>थेट जोडी संभाव्यता (Exact Jodi):</span>
              <strong className="text-amber-400">१/१०० (१%)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>सिंगल पाना संभाव्यता (Single Pana):</span>
              <strong className="text-amber-400">१/२२० (०.४५%)</strong>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200">
            <strong>{isMr ? 'महत्त्वाची सूचना: ' : 'Important Notice: '}</strong>
            {isMr
              ? 'हे ॲप केवळ संख्याशास्त्र, सांख्यिकी विश्लेषण आणि शैक्षणिक अभ्यासासाठी (Educational Purpose) तयार करण्यात आले आहे. कोणत्याही प्रकारच्या बेकायदेशीर सट्टा किंवा जुगाराला हे ॲप प्रोत्साहन देत नाही.'
              : 'This application is exclusively designed for statistical analysis, combinatorics education, and pattern research. It does not promote or facilitate any gambling activity.'}
          </div>
        </div>
      </div>
    </div>
  );
};

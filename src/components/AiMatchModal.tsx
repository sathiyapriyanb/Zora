import React, { useState, useEffect } from 'react';
import { LostFoundItem, AiMatchResult } from '../types';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Shield, RefreshCw, X, FileText } from 'lucide-react';

interface AiMatchModalProps {
  lostItem: LostFoundItem;
  foundItem: LostFoundItem;
  onClose: () => void;
  onOpenClaim: (item: LostFoundItem) => void;
}

export const AiMatchModal: React.FC<AiMatchModalProps> = ({
  lostItem,
  foundItem,
  onClose,
  onOpenClaim,
}) => {
  const [loading, setLoading] = useState(true);
  const [matchResult, setMatchResult] = useState<AiMatchResult | null>(null);
  const [error, setError] = useState('');

  const fetchMatch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/gemini/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lostItem, foundItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to run AI match comparison.');
      }

      const data = await response.json();
      setMatchResult({
        id: 'match-' + Date.now(),
        lostItemId: lostItem.id,
        foundItemId: foundItem.id,
        lostItemTitle: lostItem.title,
        foundItemTitle: foundItem.title,
        lostItemLocation: lostItem.location,
        foundItemLocation: foundItem.location,
        score: data.score,
        reasons: data.reasons || [],
        mismatches: data.mismatches || [],
        recommendation: data.recommendation || '',
        confidence: data.confidence || 'Medium',
        isAiPowered: data.isAiPowered ?? true,
        createdAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Error matching items:', err);
      setError(err.message || 'Error communicating with Gemini AI matching engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [lostItem.id, foundItem.id]);

  const score = matchResult?.score || 0;
  const isHighMatch = score >= 75;
  const isMedMatch = score >= 50 && score < 75;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#52625C] hover:text-[#1E2A28] p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[3px] bg-[#1F4E46] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-[#E6AF2E]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F4E46] bg-[#1F4E46]/10 px-2 py-0.5 rounded">
                Gemini AI Lost ↔ Found Intelligence
              </span>
              {matchResult?.isAiPowered && (
                <span className="text-[10px] font-mono font-bold bg-[#EDEFE8] text-[#1E2A28] px-1.5 py-0.5 rounded border border-[#CFD4C6]">
                  Gemini 3.7
                </span>
              )}
            </div>
            <h2 className="font-['Fraunces',serif] text-2xl font-bold text-[#1E2A28] mt-1">
              AI Match Analysis
            </h2>
          </div>
        </div>

        {/* Side-by-side Items Comparison Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-white border border-[#CFD4C6] rounded-[3px] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#B4442E] uppercase">
              <span>Lost Item</span>
              <span className="font-mono text-[#52625C]">{lostItem.id}</span>
            </div>
            <div className="font-bold text-sm text-[#1E2A28]">{lostItem.title}</div>
            <div className="text-xs text-[#52625C]">📍 {lostItem.location}</div>
            <div className="text-xs text-[#52625C]">📅 {lostItem.date} {lostItem.time && `• ${lostItem.time}`}</div>
            {lostItem.description && (
              <p className="text-[11px] text-[#52625C] line-clamp-2 italic">"{lostItem.description}"</p>
            )}
          </div>

          <div className="p-3.5 bg-white border border-[#CFD4C6] rounded-[3px] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#1F4E46] uppercase">
              <span>Found Item</span>
              <span className="font-mono text-[#52625C]">{foundItem.id}</span>
            </div>
            <div className="font-bold text-sm text-[#1E2A28]">{foundItem.title}</div>
            <div className="text-xs text-[#52625C]">📍 {foundItem.location}</div>
            <div className="text-xs text-[#52625C]">📅 {foundItem.date} {foundItem.time && `• ${foundItem.time}`}</div>
            {foundItem.keptAt && (
              <div className="text-[11px] text-[#1F4E46] font-medium">🛡 Kept: {foundItem.keptAt}</div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#1F4E46] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-bold text-sm text-[#1E2A28]">
              Analyzing semantic features with Gemini AI...
            </div>
            <p className="text-xs text-[#52625C] max-w-sm mx-auto">
              Comparing physical attributes, campus locations at RTC, time offsets, and distinctive identifiers.
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[#B4442E]/10 border border-[#B4442E] rounded text-xs space-y-2">
            <div className="font-bold text-[#B4442E] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Matching Analysis Error
            </div>
            <p className="text-[#52625C]">{error}</p>
            <button
              onClick={fetchMatch}
              className="text-xs font-bold text-[#1F4E46] underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Analysis
            </button>
          </div>
        ) : matchResult ? (
          <div className="space-y-4">
            {/* Score Banner */}
            <div
              className={`p-4 rounded-[4px] border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isHighMatch
                  ? 'bg-[#2C6E63]/12 border-[#2C6E63]/30 text-[#1F4E46]'
                  : isMedMatch
                  ? 'bg-[#D98C2B]/12 border-[#D98C2B]/30 text-[#8F5511]'
                  : 'bg-[#52625C]/10 border-[#52625C]/20 text-[#1E2A28]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-['Fraunces',serif] font-bold text-xl border-2 shrink-0 ${
                    isHighMatch
                      ? 'border-[#2C6E63] text-[#1F4E46] bg-white'
                      : isMedMatch
                      ? 'border-[#D98C2B] text-[#8F5511] bg-white'
                      : 'border-[#52625C] text-[#1E2A28] bg-white'
                  }`}
                >
                  {score}%
                </div>
                <div>
                  <div className="font-['Fraunces',serif] font-bold text-lg leading-tight">
                    Possible Match – {score}%
                  </div>
                  <div className="text-xs opacity-90 font-medium">
                    Confidence: {matchResult.confidence} • {isHighMatch ? 'Strong Potential Match' : isMedMatch ? 'Moderate Correlation' : 'Low Correlation'}
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right shrink-0">
                <button
                  onClick={() => onOpenClaim(foundItem)}
                  className="px-4 py-2 bg-[#1F4E46] text-white font-bold text-xs rounded-[3px] hover:brightness-110 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  File Claim with Proof
                </button>
              </div>
            </div>

            {/* AI Caveat Warning */}
            <div className="text-[11px] text-[#52625C] bg-[#EDEFE8] px-3 py-2 rounded border border-[#CFD4C6] flex items-center gap-2">
              <span className="font-bold text-[#1E2A28]">Notice:</span>
              <span>AI matches are advisory suggestions. RTC verification requires student ID and private physical proof.</span>
            </div>

            {/* Reasons & Mismatches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[#CFD4C6] rounded-[3px] p-3.5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2C6E63] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matching Factors</span>
                </div>
                <ul className="text-xs text-[#1E2A28] space-y-1.5 list-disc list-inside">
                  {matchResult.reasons.map((r, i) => (
                    <li key={i} className="leading-relaxed">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-[#CFD4C6] rounded-[3px] p-3.5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#B4442E] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Possible Mismatches / Notes</span>
                </div>
                <ul className="text-xs text-[#1E2A28] space-y-1.5 list-disc list-inside">
                  {matchResult.mismatches.map((m, i) => (
                    <li key={i} className="leading-relaxed">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            {matchResult.recommendation && (
              <div className="p-3 bg-white border border-[#CFD4C6] rounded-[3px] text-xs">
                <span className="font-bold text-[#1E2A28]">AI Recommendation: </span>
                <span className="text-[#52625C]">{matchResult.recommendation}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-4 mt-5 border-t border-[#CFD4C6] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#52625C] hover:text-[#1E2A28] cursor-pointer"
          >
            Close Match Window
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenClaim(foundItem)}
              className="px-4 py-2 bg-[#1E2A28] text-white text-xs font-bold rounded-[3px] hover:bg-[#1F4E46] cursor-pointer shadow-xs"
            >
              Verify &amp; Claim Item →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

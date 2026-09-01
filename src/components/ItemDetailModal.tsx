import React, { useState } from 'react';
import { LostFoundItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  MapPin,
  Calendar,
  Shield,
  Printer,
  Sparkles,
  Share2,
  Award,
  Building2,
  Tag,
  Check,
  Lock,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';

interface ItemDetailModalProps {
  item: LostFoundItem;
  allItems: LostFoundItem[];
  onClose: () => void;
  onOpenFlyer: (item: LostFoundItem) => void;
  onOpenClaim: (item: LostFoundItem) => void;
  onOpenMatchModal: (lost: LostFoundItem, found: LostFoundItem) => void;
  onSelectOtherItem: (item: LostFoundItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  allItems,
  onClose,
  onOpenFlyer,
  onOpenClaim,
  onOpenMatchModal,
  onSelectOtherItem,
}) => {
  const { profile, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);

  const isLost = item.type === 'lost';
  const isReturned = item.status === 'returned' || item.status === 'resolved';

  // Smart candidate matches from the opposite item type
  const oppositeItems = allItems.filter(
    (o) => o.id !== item.id && o.type !== item.type && o.status !== 'returned'
  );

  const candidateMatches = oppositeItems.filter((other) => {
    const sameCat = other.category === item.category;
    const sameLoc = other.location === item.location;
    const wordsA = item.title.toLowerCase().split(' ').filter((w) => w.length > 2);
    const wordsB = other.title.toLowerCase().split(' ').filter((w) => w.length > 2);
    const sharedWord = wordsA.some((w) => wordsB.some((b) => b.includes(w)));
    return sameCat || sameLoc || sharedWord;
  }).slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Top bar */}
        <div className="bg-[#EDEFE8] border-b border-[#CFD4C6] px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isLost ? 'bg-[#B4442E]/12 text-[#B4442E]' : 'bg-[#2C6E63]/12 text-[#1F4E46]'
              }`}
            >
              {isLost ? 'RTC Lost Item Report' : 'RTC Found Item Record'}
            </span>
            <span className="text-xs font-mono text-[#52625C]">#{item.id.slice(-6).toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Share item link"
              className="p-1.5 text-[#52625C] hover:text-[#1E2A28] rounded hover:bg-black/5 cursor-pointer text-xs flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => onOpenFlyer(item)}
              title="Print bulletin flyer"
              className="p-1.5 text-[#52625C] hover:text-[#1E2A28] rounded hover:bg-black/5 cursor-pointer text-xs flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Notice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#52625C] hover:text-[#1E2A28] rounded hover:bg-black/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Main Title & Status */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
              <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-[#1E2A28] leading-tight">
                {item.title}
              </h2>
              {isReturned && (
                <span className="px-3 py-1 bg-[#1F4E46]/10 text-[#1F4E46] rounded-full text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Reunited with Owner
                </span>
              )}
            </div>

            {item.reward && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D98C2B]/12 border border-[#D98C2B]/30 rounded-[3px] text-[#B06E1B] text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Offered Finder Reward: {item.reward}</span>
              </div>
            )}
          </div>

          {/* Photo if present */}
          {item.imageUrl && (
            <div className="w-full h-52 sm:h-64 rounded-[3px] overflow-hidden border border-[#CFD4C6] bg-white shadow-xs">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-[3px] border border-[#CFD4C6] text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#52625C]">
                <MapPin className="w-4 h-4 text-[#1F4E46] shrink-0" />
                <span>
                  <strong className="text-[#1E2A28] font-semibold">RTC Campus Location:</strong> {item.location}
                </span>
              </div>
              {item.locationDetail && (
                <div className="text-[11.5px] text-[#52625C] pl-6 italic">
                  ↳ {item.locationDetail}
                </div>
              )}
              {item.keptAt && (
                <div className="flex items-center gap-2 text-[#2C6E63] font-semibold">
                  <Shield className="w-4 h-4 text-[#2C6E63] shrink-0" />
                  <span>Held Safely At: {item.keptAt}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#52625C]">
                <Calendar className="w-4 h-4 text-[#52625C] shrink-0" />
                <span>
                  <strong className="text-[#1E2A28] font-semibold">Date:</strong> {item.date} {item.time && `(${item.time})`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#52625C]">
                <Tag className="w-4 h-4 text-[#52625C] shrink-0" />
                <span>
                  <strong className="text-[#1E2A28] font-semibold">Category:</strong> {item.category}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-[#52625C] mb-1.5">
                Description &amp; Observations
              </h4>
              <p className="text-xs sm:text-sm text-[#1E2A28] leading-relaxed bg-white p-3.5 rounded-[3px] border border-[#CFD4C6]">
                {item.description}
              </p>
            </div>
          )}

          {/* Distinctive Details (if Lost item) */}
          {item.distinctiveDetails && (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-[#1F4E46] mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D98C2B]" />
                Distinctive Identifying Details (AI Reference)
              </h4>
              <p className="text-xs text-[#1E2A28] leading-relaxed bg-[#FFF9ED] p-3 rounded-[3px] border border-[#E6AF2E]/40">
                {item.distinctiveDetails}
              </p>
            </div>
          )}

          {/* AI Matching Opportunities */}
          {candidateMatches.length > 0 && (
            <div className="p-4 bg-[#1F4E46]/8 border border-[#1F4E46]/25 rounded-[3px] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F4E46] uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-[#D98C2B]" />
                  <span>Gemini AI Potential Matches ({candidateMatches.length})</span>
                </div>
                <span className="text-[10px] text-[#52625C]">Compare with AI</span>
              </div>

              <div className="space-y-2">
                {candidateMatches.map((other) => (
                  <div
                    key={other.id}
                    className="p-2.5 bg-white border border-[#CFD4C6] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#1E2A28]">{other.title}</div>
                      <div className="text-[11px] text-[#52625C]">
                        {other.type === 'lost' ? 'Lost' : 'Found'} at {other.location} ({other.date})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const lost = isLost ? item : other;
                        const found = isLost ? other : item;
                        onOpenMatchModal(lost, found);
                      }}
                      className="px-3 py-1 bg-[#1F4E46] text-white text-[11px] font-bold rounded hover:brightness-110 cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-[#E6AF2E]" />
                      Run AI Compare
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Claim Verification Action */}
          <div className="bg-white p-4.5 rounded-[3px] border border-[#CFD4C6] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-[#1E2A28] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1F4E46]" />
                RTC Ownership &amp; Claim Policy
              </span>
              <span className="text-[10px] bg-[#EDEFE8] text-[#52625C] px-2 py-0.5 rounded font-mono">
                Encrypted Verification
              </span>
            </div>

            <p className="text-xs text-[#52625C] leading-relaxed">
              To protect student privacy and prevent fraudulent claims, contact numbers and personal emails are kept confidential. To claim this item, submit your private proof (unique markings, serial numbers, exact contents) for admin verification.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenClaim(item)}
                className="px-5 py-2.5 bg-[#1F4E46] text-white text-xs font-bold rounded-[3px] hover:brightness-110 cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-[#E6AF2E]" />
                Submit Ownership Claim with Private Proof
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#EDEFE8] border-t border-[#CFD4C6] px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-[#52625C]">
            Reported by: <span className="font-semibold text-[#1E2A28]">{item.userName}</span> ({item.userDept || 'RTC'})
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-2 bg-white border border-[#CFD4C6] text-[#1E2A28] hover:bg-[#CFD4C6] rounded-[3px] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Check, Tag, CheckCircle2, Award, Printer, Shield, Sparkles, Building2, Eye } from 'lucide-react';
import { LostFoundItem } from '../types';

interface ItemCardProps {
  item: LostFoundItem;
  onSelectItem: (item: LostFoundItem) => void;
  onOpenFlyer: (item: LostFoundItem) => void;
  onOpenClaim?: (item: LostFoundItem) => void;
  onFindMatch?: (item: LostFoundItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onSelectItem,
  onOpenFlyer,
  onOpenClaim,
  onFindMatch,
}) => {
  const formattedDate = () => {
    if (!item.date) return '';
    try {
      const dt = new Date(item.date + 'T00:00:00');
      return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return item.date;
    }
  };

  const isReturned = item.status === 'returned' || item.status === 'resolved';
  const isClaimPending = item.status === 'claim_pending' || item.status === 'under_review';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectItem(item)}
      className={`bg-[#F7F8F3] border border-[#CFD4C6] rounded-[4px] p-4 sm:p-5 flex flex-col justify-between gap-3 transition-all relative group cursor-pointer ${
        isReturned
          ? 'opacity-65 grayscale-[30%] bg-[#F2F3EC]'
          : 'hover:border-[#1E2A28] hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div>
        {/* Tag Row & Item ID */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                item.type === 'lost'
                  ? 'bg-[#B4442E]/12 text-[#B4442E] border border-[#B4442E]/20'
                  : 'bg-[#2C6E63]/12 text-[#1F4E46] border border-[#2C6E63]/20'
              }`}
            >
              {item.type === 'lost' ? 'Lost' : 'Found'}
            </span>

            <span className="text-[11px] text-[#52625C] flex items-center gap-1 bg-white px-2 py-0.5 rounded-[2px] border border-[#CFD4C6]/70">
              <Tag className="w-3 h-3 opacity-60" />
              {item.category}
            </span>

            {item.isDemo && (
              <span className="text-[9px] font-mono font-bold bg-[#EDEFE8] text-[#52625C] px-1 py-0.2 rounded border border-[#CFD4C6]">
                DEMO
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isReturned ? (
              <span className="text-[10.5px] font-semibold tracking-tight px-2 py-0.5 rounded-full bg-[#1F4E46]/10 text-[#1F4E46] flex items-center gap-1">
                <Check className="w-3 h-3" />
                Returned
              </span>
            ) : isClaimPending ? (
              <span className="text-[10.5px] font-bold tracking-tight px-2 py-0.5 rounded-full bg-[#D98C2B]/15 text-[#8F5511] flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#E6AF2E]" />
                Claim Pending
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#52625C]/70">
                #{item.id.slice(-6).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail Image */}
        {item.imageUrl && (
          <div className="w-full h-36 rounded-[2px] overflow-hidden border border-[#CFD4C6] mb-3 bg-white relative">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            {item.reward && (
              <div className="absolute top-2 right-2 bg-[#D98C2B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Award className="w-3 h-3" />
                {item.reward}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-['Fraunces',serif] text-[18px] font-semibold text-[#1E2A28] leading-tight mb-2 group-hover:text-[#1F4E46] transition-colors">
          {item.title}
        </h3>

        {/* Location & Time */}
        <div className="text-[12px] text-[#52625C] flex flex-col gap-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-[#1F4E46] font-medium truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#1F4E46]" />
            <span className="truncate">
              {item.type === 'lost' ? 'Lost at: ' : 'Found at: '}
              <strong className="font-semibold text-[#1E2A28]">{item.location}</strong>
            </span>
          </div>

          {item.locationDetail && (
            <div className="text-[11.5px] text-[#52625C] pl-5 truncate italic">
              ↳ {item.locationDetail}
            </div>
          )}

          {item.keptAt && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#2C6E63] font-medium truncate">
              <Shield className="w-3.5 h-3.5 shrink-0 text-[#2C6E63]" />
              <span className="truncate">Kept safe at: <strong>{item.keptAt}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11.5px]">
            <Calendar className="w-3.5 h-3.5 text-[#52625C] shrink-0" />
            <span>{formattedDate()} {item.time && `• ${item.time}`}</span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-[13px] text-[#1E2A28] leading-relaxed line-clamp-2 mb-2 font-normal">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="pt-2.5 border-t border-[#CFD4C6] mt-1 flex items-center justify-between gap-2">
        <div className="text-[11px] text-[#52625C] truncate">
          By: <span className="font-semibold text-[#1E2A28]">{item.userName}</span> ({item.userDept || 'RTC'})
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onFindMatch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFindMatch(item);
              }}
              title="AI match analysis"
              className="p-1.5 text-[#1F4E46] hover:bg-[#1F4E46]/10 border border-[#1F4E46]/30 rounded-[2px] bg-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            >
              <Sparkles className="w-3 h-3 text-[#D98C2B]" />
              <span className="hidden sm:inline">AI Match</span>
            </button>
          )}

          {onOpenClaim && !isReturned && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenClaim(item);
              }}
              title="File Ownership Claim"
              className="text-[11px] font-bold px-2.5 py-1 rounded-[3px] bg-[#1F4E46] text-white hover:brightness-110 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Shield className="w-3 h-3 text-[#E6AF2E]" />
              <span>Claim</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFlyer(item);
            }}
            title="Generate printable notice flyer"
            className="p-1.5 text-[#52625C] hover:text-[#1E2A28] border border-[#CFD4C6] rounded-[2px] bg-white hover:bg-[#EDEFE8] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

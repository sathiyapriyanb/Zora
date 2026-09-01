import React from 'react';
import { LostFoundItem } from '../types';
import { Printer, X, MapPin, Calendar, Mail, Award, Building2, Shield, QrCode } from 'lucide-react';

interface FlyerModalProps {
  item: LostFoundItem;
  onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ item, onClose }) => {
  const isLost = item.type === 'lost';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-[#1E2A28] rounded-[4px] shadow-2xl overflow-hidden border-4 border-[#1E2A28] my-8 print:m-0 print:border-none print:shadow-none animate-in fade-in">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="bg-[#1E2A28] text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#E6AF2E]">
              RTC Official Notice Generator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#1F4E46] text-white hover:brightness-110 px-3 py-1.5 rounded-[2px] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF Notice
            </button>
            <button
              onClick={onClose}
              className="text-[#CFD4C6] hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Poster Area */}
        <div className="p-8 sm:p-10 bg-[#FAF9F5] print:p-4">
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-[#1E2A28] pb-3 mb-4">
            <div className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold tracking-tight text-[#1E2A28]">
              RATHINAM TECHNICAL CAMPUS (RTC)
            </div>
            <div className="text-xs text-[#52625C] font-medium">
              Rathinam Techzone Campus, Eachanari, Coimbatore, Tamil Nadu
            </div>
          </div>

          {/* Header Banner */}
          <div
            className={`border-4 text-center py-3.5 px-6 mb-5 ${
              isLost
                ? 'border-[#B4442E] bg-[#B4442E]/10 text-[#B4442E]'
                : 'border-[#1F4E46] bg-[#1F4E46]/10 text-[#1F4E46]'
            }`}
          >
            <div className="text-xs font-mono font-black uppercase tracking-[0.25em] mb-0.5">
              OFFICIAL CAMPUS LOST &amp; FOUND NOTICE
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-black uppercase tracking-tight">
              {isLost ? 'MISSING / LOST ITEM' : 'FOUND ITEM NOTICE'}
            </h1>
          </div>

          {/* Item Title & Reward */}
          <div className="text-center mb-5">
            <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-[#1E2A28] mb-1.5">
              {item.title}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EDEFE8] border border-[#CFD4C6] rounded-full text-xs font-semibold text-[#52625C]">
              <span>Category: {item.category}</span>
              <span>•</span>
              <span>Campus Spot: {item.location}</span>
            </div>

            {item.reward && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#D98C2B]/15 border-2 border-[#D98C2B] rounded-full text-[#B06E1B] font-bold text-sm">
                <Award className="w-4 h-4" />
                <span>FINDER REWARD: {item.reward}</span>
              </div>
            )}
          </div>

          {/* Image if available */}
          {item.imageUrl && (
            <div className="mb-5 flex justify-center">
              <div className="max-w-xs max-h-56 rounded border-2 border-[#1E2A28] overflow-hidden bg-white shadow-xs">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover max-h-52"
                />
              </div>
            </div>
          )}

          {/* Details Box */}
          <div className="bg-white border-2 border-[#1E2A28] p-4.5 mb-5 text-xs sm:text-sm space-y-2.5">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#1F4E46] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[#1E2A28]">{isLost ? 'Lost At Location:' : 'Found At Location:'}</strong>{' '}
                {item.location} {item.locationDetail && `(${item.locationDetail})`}
              </div>
            </div>

            {item.keptAt && (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#2C6E63] shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-[#1E2A28]">Currently Kept Safe At:</strong>{' '}
                  <span className="text-[#1F4E46] font-semibold">{item.keptAt}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-[#52625C] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[#1E2A28]">Date Recorded:</strong> {item.date} {item.time && `at ${item.time}`}
              </div>
            </div>

            {item.description && (
              <div className="border-t border-[#EDEFE8] pt-2 text-[#52625C] leading-relaxed">
                <strong className="text-[#1E2A28] font-bold">Public Details:</strong> {item.description}
              </div>
            )}
          </div>

          {/* Verification & Claim Dispatch */}
          <div className="text-center p-3.5 bg-[#EDEFE8] border border-[#CFD4C6] rounded mb-6 text-xs">
            <div className="font-bold uppercase tracking-wider text-[#1E2A28] mb-0.5">
              How to Claim / Verify at Rathinam Technical Campus:
            </div>
            <div className="text-[#52625C]">
              Visit the RTC Lost &amp; Found Portal online or report to the Main Admin / Security Office with your College ID Card.
            </div>
          </div>

          {/* Tear-Off Tabs at the bottom */}
          <div className="border-t-2 border-dashed border-[#1E2A28] pt-3">
            <div className="text-[9px] text-center uppercase tracking-widest text-[#52625C] mb-2 font-bold">
              ✂ Cut / Tear-off slips for student notice boards
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 border-t border-b border-[#CFD4C6] py-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border-r border-dashed border-[#CFD4C6] last:border-none p-1 text-center flex flex-col justify-center"
                >
                  <div className="text-[9.5px] font-bold text-[#1E2A28] truncate">{item.title}</div>
                  <div className="text-[8.5px] font-mono truncate text-[#1F4E46] mt-0.5">RTC Hub #{item.id.slice(-4)}</div>
                  <div className="text-[8px] text-[#52625C] truncate">{item.location.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

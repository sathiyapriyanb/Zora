import React, { useState } from 'react';
import { LostFoundItem } from '../types';
import { MapPin, Building2, Layers, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface CampusMapViewProps {
  items: LostFoundItem[];
  campusLocations: string[];
  onSelectItem: (item: LostFoundItem) => void;
  onFilterLocation?: (location: string) => void;
}

// Visual RTC Campus Map zones
interface RtcMapBlock {
  name: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: 'academic' | 'amenity' | 'hostel' | 'sports' | 'gate';
}

const RTC_MAP_BLOCKS: RtcMapBlock[] = [
  { name: 'Main/Admin Block', code: 'ADM', x: 50, y: 18, width: 28, height: 20, category: 'academic' },
  { name: 'Library', code: 'LIB', x: 22, y: 18, width: 22, height: 18, category: 'academic' },
  { name: 'CSE / Computer Science area', code: 'CSE', x: 20, y: 44, width: 25, height: 22, category: 'academic' },
  { name: 'IT area', code: 'IT', x: 48, y: 44, width: 22, height: 22, category: 'academic' },
  { name: 'ECE area', code: 'ECE', x: 75, y: 44, width: 22, height: 22, category: 'academic' },
  { name: 'Mechanical area', code: 'MECH', x: 78, y: 20, width: 20, height: 18, category: 'academic' },
  { name: 'Biomedical area', code: 'BME', x: 20, y: 72, width: 22, height: 20, category: 'academic' },
  { name: 'AI & Data Science area', code: 'AI-DS', x: 46, y: 72, width: 24, height: 20, category: 'academic' },
  { name: 'Food Court / Canteen', code: 'FOOD', x: 75, y: 72, width: 22, height: 20, category: 'amenity' },
  { name: 'Boys Hostel', code: 'BH', x: 12, y: 92, width: 20, height: 12, category: 'hostel' },
  { name: 'Girls Hostel', code: 'GH', x: 36, y: 92, width: 20, height: 12, category: 'hostel' },
  { name: 'Sports Ground', code: 'SPRT', x: 62, y: 92, width: 22, height: 12, category: 'sports' },
  { name: 'Parking Area', code: 'PARK', x: 88, y: 92, width: 18, height: 12, category: 'gate' },
];

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  items,
  campusLocations,
  onSelectItem,
}) => {
  const [activeLocation, setActiveLocation] = useState<string | null>('Library');

  const locationItems = activeLocation
    ? items.filter((i) => i.location === activeLocation)
    : items;

  return (
    <div className="bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] p-4 sm:p-6 mb-8 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#CFD4C6] pb-4">
        <div>
          <h3 className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold text-[#1E2A28] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1F4E46]" />
            <span>Interactive RTC Campus Map &amp; Hotspots</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#52625C] mt-0.5">
            Rathinam Techzone Campus Layout • Click any building zone to inspect reported items.
          </p>
        </div>

        <button
          onClick={() => setActiveLocation(null)}
          className={`text-xs font-bold px-3 py-1.5 rounded-[3px] border transition-colors cursor-pointer ${
            activeLocation === null
              ? 'bg-[#1E2A28] text-white border-[#1E2A28]'
              : 'bg-white text-[#52625C] border-[#CFD4C6] hover:text-[#1E2A28]'
          }`}
        >
          Show All RTC Campus Spots
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* Map Blueprint Canvas */}
        <div className="relative aspect-[16/11] bg-[#E8EBE2] border-2 border-[#CFD4C6] rounded-[4px] overflow-hidden p-3 shadow-inner">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#CFD4C6_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />

          {/* Central RTC Plaza Landmark */}
          <div className="absolute top-[32%] left-[50%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#D9E1D2] rounded-full border border-[#BFC8B5] flex items-center justify-center pointer-events-none opacity-90 shadow-xs">
            <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-[#1F4E46]">
              RTC Central Quad / Palm Avenue
            </span>
          </div>

          {/* Map Zone Blocks */}
          {RTC_MAP_BLOCKS.map((block) => {
            const count = items.filter(
              (i) => i.location === block.name && i.status !== 'returned' && i.status !== 'resolved'
            ).length;
            const isSelected = activeLocation === block.name;

            return (
              <button
                key={block.name}
                onClick={() => setActiveLocation(block.name)}
                style={{
                  top: `${block.y}%`,
                  left: `${block.x}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-[3px] border-2 transition-all cursor-pointer flex flex-col justify-between text-left group ${
                  isSelected
                    ? 'bg-white border-[#1E2A28] shadow-md z-20 scale-102 ring-2 ring-[#1F4E46]/30'
                    : 'bg-white/90 border-[#CFD4C6] hover:bg-white hover:border-[#1E2A28]/60 z-10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-mono font-bold text-[#52625C] px-1 py-0.2 bg-[#EDEFE8] rounded">
                    {block.code}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-[#1F4E46] text-white'
                          : 'bg-[#B4442E]/15 text-[#B4442E]'
                      }`}
                    >
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>

                <div className="font-bold text-[10.5px] sm:text-xs text-[#1E2A28] line-clamp-2 leading-tight">
                  {block.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Zone Details & Item List */}
        <div className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-4 sm:p-5 flex flex-col min-h-[340px] max-h-[440px] overflow-y-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EDEFE8] pb-3 mb-3">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#52625C]">
                {activeLocation ? 'Inspecting RTC Area' : 'Entire Campus View'}
              </div>
              <div className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
                {activeLocation || 'All Rathinam Campus Locations'}
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EDEFE8] text-[#1E2A28]">
              {locationItems.length} items
            </span>
          </div>

          {locationItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#52625C]">
              <CheckCircle2 className="w-8 h-8 text-[#2C6E63] opacity-40 mb-2" />
              <p className="text-xs font-bold text-[#1E2A28]">No active items in this spot</p>
              <p className="text-[11px] text-[#52625C] mt-0.5">
                Nothing is currently reported lost or found at this location.
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {locationItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="p-2.5 bg-[#F7F8F3] border border-[#CFD4C6] rounded-[3px] hover:border-[#1E2A28] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          item.type === 'lost'
                            ? 'bg-[#B4442E]/12 text-[#B4442E]'
                            : 'bg-[#2C6E63]/12 text-[#1F4E46]'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-[#52625C] truncate">{item.category}</span>
                    </div>
                    <div className="text-xs font-bold text-[#1E2A28] group-hover:text-[#1F4E46] truncate">
                      {item.title}
                    </div>
                    {item.locationDetail && (
                      <div className="text-[10.5px] text-[#52625C] truncate italic">
                        {item.locationDetail}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#52625C] group-hover:text-[#1E2A28] shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Building2,
  PackageOpen,
  LayoutGrid,
  ListFilter,
  Map as MapIcon,
  Sparkles,
  Award,
  ArrowRight,
  Shield,
  Tag,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { LostFoundItem, Category } from '../types';
import { CATEGORIES } from '../data';
import { ItemCard } from './ItemCard';
import { CampusMapView } from './CampusMapView';

interface BoardViewProps {
  items: LostFoundItem[];
  campusLocations: string[];
  onSelectItem: (item: LostFoundItem) => void;
  onOpenFlyer: (item: LostFoundItem) => void;
  onOpenClaim: (item: LostFoundItem) => void;
  onFindMatch: (item: LostFoundItem) => void;
  onNavigateToLost: () => void;
  onNavigateToFound: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  items,
  campusLocations,
  onSelectItem,
  onOpenFlyer,
  onOpenClaim,
  onFindMatch,
  onNavigateToLost,
  onNavigateToFound,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [viewMode, setViewMode] = useState<'grid' | 'ledger' | 'map'>('grid');

  // Stats calculation
  const stats = useMemo(() => {
    const activeLost = items.filter(
      (i) => i.type === 'lost' && i.status !== 'returned' && i.status !== 'resolved'
    ).length;
    const foundWaiting = items.filter(
      (i) => i.type === 'found' && i.status !== 'returned' && i.status !== 'resolved'
    ).length;
    const returned = items.filter(
      (i) => i.status === 'returned' || i.status === 'resolved'
    ).length;
    return { activeLost, foundWaiting, returned };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items
      .filter((it) => {
        if (typeFilter !== 'all' && it.type !== typeFilter) return false;
        if (statusFilter === 'open' && (it.status === 'returned' || it.status === 'resolved'))
          return false;
        if (selectedCategory && it.category !== selectedCategory) return false;
        if (selectedLocation && it.location !== selectedLocation) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const haystack = `${it.title} ${it.location} ${it.locationDetail || ''} ${
            it.description || ''
          } ${it.category} ${it.userName || ''} ${it.userDept || ''} ${
            it.keptAt || ''
          }`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [items, typeFilter, statusFilter, selectedCategory, selectedLocation, searchQuery]);

  // Recent returned items for ticker
  const returnedItems = items.filter(
    (i) => i.status === 'returned' || i.status === 'resolved'
  );

  return (
    <div className="pb-16 space-y-7">
      {/* Hero & Institution Header Section */}
      <section className="pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1F4E46]/10 text-[#1F4E46] rounded text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1F4E46] animate-pulse" />
              Rathinam Technical Campus • Official Dispatch
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl md:text-[42px] font-bold text-[#1E2A28] leading-[1.14]">
              Everything lost on campus <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#1F4E46]">finds its way back.</span>
            </h1>
            <p className="mt-3 text-[#52625C] text-sm sm:text-base leading-relaxed max-w-[50ch]">
              Live, verified lost &amp; found registry for RTC students, faculty, labs, and security. Powered by real-time Firestore synchronization and Gemini AI smart matching.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-[1px] bg-[#CFD4C6] border-2 border-[#1E2A28] rounded-[4px] overflow-hidden shadow-xs">
            <div className="bg-[#F7F8F3] p-4 flex flex-col justify-between">
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-[#B4442E]">
                {stats.activeLost}
              </div>
              <div className="text-[11px] sm:text-xs text-[#52625C] mt-1 font-semibold">
                Lost Items
              </div>
            </div>

            <div className="bg-[#F7F8F3] p-4 flex flex-col justify-between">
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-[#1F4E46]">
                {stats.foundWaiting}
              </div>
              <div className="text-[11px] sm:text-xs text-[#52625C] mt-1 font-semibold">
                Found &amp; Stored
              </div>
            </div>

            <div className="bg-[#F7F8F3] p-4 flex flex-col justify-between">
              <div className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold text-[#1E2A28]">
                {stats.returned}
              </div>
              <div className="text-[11px] sm:text-xs text-[#52625C] mt-1 font-semibold">
                Reunited at RTC
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reunion Ticker Banner */}
        {returnedItems.length > 0 && (
          <div className="mt-6 p-2.5 sm:p-3 bg-[#1F4E46]/10 border border-[#1F4E46]/20 rounded-[3px] flex items-center justify-between text-xs text-[#1F4E46] overflow-x-auto gap-3">
            <div className="flex items-center gap-2 shrink-0 font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#E6AF2E]" />
              <span>Campus Reunion:</span>
            </div>
            <div className="truncate font-medium text-[12px] flex-1">
              "{returnedItems[0].title}" was safely returned at {returnedItems[0].location}!
            </div>
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
            >
              View RTC Archive →
            </button>
          </div>
        )}
      </section>

      {/* Category Pills */}
      <section className="space-y-2">
        <div className="text-xs uppercase font-bold text-[#52625C] tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#1F4E46]" /> Item Categories
          </span>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-[#1F4E46] hover:underline cursor-pointer font-bold"
            >
              Show All Categories
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === ''
                ? 'bg-[#1E2A28] text-white border-[#1E2A28]'
                : 'bg-white text-[#52625C] border-[#CFD4C6] hover:text-[#1E2A28] hover:border-[#1E2A28]'
            }`}
          >
            All Categories ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1F4E46] text-white border-[#1F4E46]'
                    : 'bg-white text-[#52625C] border-[#CFD4C6] hover:text-[#1E2A28] hover:border-[#1E2A28]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EDEFE8] text-[#52625C]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Search, Filter & View Controls */}
      <section className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-3.5 sm:p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52625C]" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, item name, RTC department, spot..."
              className="w-full pl-9 pr-8 py-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded-[3px] text-xs sm:text-sm text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white transition-all placeholder:text-[#52625C]/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#52625C] hover:text-[#1E2A28]"
              >
                ✕
              </button>
            )}
          </div>

          {/* RTC Campus Location selector */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-[#F7F8F3] border border-[#CFD4C6] rounded-[3px] text-xs sm:text-sm text-[#1E2A28] py-2 px-3 focus:outline-none focus:border-[#1E2A28] cursor-pointer max-w-[220px]"
          >
            <option value="">All RTC Campus Locations</option>
            {campusLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Type Segmented Filter */}
          <div className="flex border border-[#CFD4C6] rounded-[3px] overflow-hidden bg-[#F7F8F3]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold border-r border-[#CFD4C6] transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#1E2A28] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-3 py-1.5 text-xs font-bold border-r border-[#CFD4C6] transition-colors cursor-pointer ${
                typeFilter === 'lost'
                  ? 'bg-[#B4442E] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === 'found'
                  ? 'bg-[#1F4E46] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              Found
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex border border-[#CFD4C6] rounded-[3px] overflow-hidden bg-[#F7F8F3]">
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-2.5 py-1.5 text-xs font-semibold border-r border-[#CFD4C6] transition-colors cursor-pointer ${
                statusFilter === 'open'
                  ? 'bg-[#1E2A28] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1E2A28] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              All Status
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-[#CFD4C6] rounded-[3px] overflow-hidden bg-[#F7F8F3] ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 text-xs font-bold border-r border-[#CFD4C6] transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#1E2A28] text-white' : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              title="Ledger Table View"
              className={`p-1.5 text-xs font-bold border-r border-[#CFD4C6] transition-colors cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-[#1E2A28] text-white'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              title="Campus Map View"
              className={`p-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-[#1E2A28] text-white' : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Map View Mode */}
      {viewMode === 'map' && (
        <CampusMapView
          items={filteredItems}
          campusLocations={campusLocations}
          onSelectItem={onSelectItem}
        />
      )}

      {/* Ledger Table View Mode */}
      {viewMode === 'ledger' && (
        <div className="bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EDEFE8] border-b border-[#CFD4C6] text-[#52625C] font-mono uppercase tracking-wider">
                  <th className="p-3">Type</th>
                  <th className="p-3">Item Details</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">RTC Campus Location</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reported By</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFD4C6]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-white cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.type === 'lost'
                            ? 'bg-[#B4442E]/12 text-[#B4442E]'
                            : 'bg-[#2C6E63]/12 text-[#1F4E46]'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-sm text-[#1E2A28]">{item.title}</div>
                      {item.reward && (
                        <span className="text-[10px] text-[#B06E1B] font-bold">★ {item.reward}</span>
                      )}
                    </td>
                    <td className="p-3 text-[#52625C] font-medium">{item.category}</td>
                    <td className="p-3 text-[#1E2A28]">
                      <div className="font-semibold">{item.location}</div>
                      {item.locationDetail && (
                        <div className="text-[11px] text-[#52625C]">{item.locationDetail}</div>
                      )}
                      {item.keptAt && (
                        <div className="text-[10px] text-[#2C6E63]">↳ Held: {item.keptAt}</div>
                      )}
                    </td>
                    <td className="p-3 text-[#52625C]">{item.date}</td>
                    <td className="p-3 text-[#1F4E46] font-medium">
                      {item.userName} ({item.userDept || 'RTC'})
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onFindMatch(item)}
                          className="text-[10px] font-bold px-2 py-1 bg-white border border-[#CFD4C6] rounded hover:border-[#1E2A28] flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#D98C2B]" /> AI Match
                        </button>
                        <button
                          onClick={() => onOpenClaim(item)}
                          className="text-[10px] font-bold px-2 py-1 bg-[#1F4E46] text-white rounded hover:brightness-110"
                        >
                          Claim
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View Mode */}
      {viewMode === 'grid' && (
        <div>
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-[#CFD4C6] rounded-[4px] bg-[#F7F8F3] my-4">
              <PackageOpen className="w-12 h-12 text-[#52625C]/40 mx-auto mb-3" />
              <h3 className="font-['Fraunces',serif] text-2xl font-bold text-[#1E2A28] mb-1">
                No matching reports found
              </h3>
              <p className="text-sm text-[#52625C] max-w-[44ch] mx-auto mb-6">
                Try clearing your search filters or record this item on the Rathinam Technical Campus registry.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={onNavigateToLost}
                  className="text-xs font-bold px-4 py-2.5 bg-[#B4442E] text-white rounded-[3px] hover:brightness-105 cursor-pointer shadow-xs"
                >
                  Report Lost Item
                </button>
                <button
                  onClick={onNavigateToFound}
                  className="text-xs font-bold px-4 py-2.5 bg-[#1F4E46] text-white rounded-[3px] hover:brightness-110 cursor-pointer shadow-xs"
                >
                  Report Found Item
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onSelectItem={onSelectItem}
                  onOpenFlyer={onOpenFlyer}
                  onOpenClaim={onOpenClaim}
                  onFindMatch={onFindMatch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

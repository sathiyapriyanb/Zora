import React, { useState } from 'react';
import { LostFoundItem, Category } from '../types';
import { CATEGORIES } from '../data';
import { useAuth } from '../context/AuthContext';
import { createFoundItemDoc } from '../lib/firebase';
import { CheckCircle2, ArrowRight, Image as ImageIcon, ShieldCheck, Clock, MapPin, Sparkles, Building2 } from 'lucide-react';

interface ReportFoundFormProps {
  campusLocations: string[];
  onViewBoard: () => void;
  onItemAdded?: (item: LostFoundItem) => void;
}

export const ReportFoundForm: React.FC<ReportFoundFormProps> = ({
  campusLocations,
  onViewBoard,
  onItemAdded,
}) => {
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | ''>('Electronics');
  const [location, setLocation] = useState(campusLocations[1] || 'CSE / Computer Science area');
  const [locationDetail, setLocationDetail] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('01:30 PM');
  const [description, setDescription] = useState('');
  const [keptAt, setKeptAt] = useState('Department HOD Office / Staff Room');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Common holding presets
  const keptAtPresets = [
    'Main Admin Block Security Office',
    'CSE Department HOD Office',
    'Central Library Front Desk',
    'Food Court Manager Counter',
    'Main Gate / Entrance Security Post',
    'Engineering Workshop Lab Assistant Desk',
  ];

  const samplePhotos = [
    { label: 'Student ID', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
    { label: 'Charger', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80' },
    { label: 'Water Bottle', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80' },
    { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !location || !date || !keptAt) return;

    setSubmitting(true);
    try {
      const itemPayload: Omit<LostFoundItem, 'id'> = {
        type: 'found',
        title,
        category: category as Category,
        location,
        locationDetail: locationDetail || undefined,
        date,
        time: time || undefined,
        description,
        keptAt,
        imageUrl: imageUrl || undefined,
        status: 'open',
        userId: profile?.uid || 'guest-finder',
        userName: profile?.name || 'RTC Good Samaritan',
        userEmail: profile?.email || 'finder@rathinam.in',
        userDept: profile?.department || 'CSE',
        createdAt: Date.now(),
      };

      const docId = await createFoundItemDoc(itemPayload);
      setSubmitted(true);

      if (onItemAdded) {
        onItemAdded({
          ...itemPayload,
          id: docId,
        });
      }

      // Reset
      setTitle('');
      setLocationDetail('');
      setDescription('');
      setImageUrl('');
    } catch (err) {
      console.error('Error reporting found item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 pb-20 max-w-[760px] mx-auto">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1F4E46] bg-[#1F4E46]/10 px-2.5 py-1 rounded">
          RTC Found Item Submission
        </span>
        <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-semibold text-[#1E2A28] mt-2 mb-1.5">
          Report Something Found at RTC
        </h2>
        <p className="text-[#52625C] text-sm sm:text-base leading-relaxed">
          Thanks for helping keep Rathinam Technical Campus honest and safe. State where you discovered the item and where it is currently stored so the rightful owner can verify it.
        </p>
      </div>

      {submitted && (
        <div className="mb-6 p-4 rounded-[4px] bg-[#2C6E63]/10 border border-[#2C6E63]/25 text-[#1F4E46] text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2C6E63] shrink-0" />
            <span>Success! The item is now listed on the live RTC campus board.</span>
          </div>
          <button
            onClick={onViewBoard}
            className="text-xs underline font-bold hover:text-[#1E2A28] flex items-center gap-1 cursor-pointer shrink-0"
          >
            View on board <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#CFD4C6] rounded-[4px] p-6 sm:p-7 space-y-5 shadow-xs"
      >
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="found-title" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
            Item Title / Name <span className="text-[#1F4E46]">*</span>
          </label>
          <input
            id="found-title"
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rathinam College Student ID Card or Black Wireless Earbuds"
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
        </div>

        {/* Category, RTC Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="found-category" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
              Category <span className="text-[#1F4E46]">*</span>
            </label>
            <select
              id="found-category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="found-loc" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1F4E46]" />
              <span>RTC Campus Location Found <span className="text-[#1F4E46]">*</span></span>
            </label>
            <select
              id="found-loc"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white cursor-pointer"
            >
              {campusLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Spot detail */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="found-detail" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
            Specific Spot Found (Corridor / Workstation / Lab / Table)
          </label>
          <input
            id="found-detail"
            type="text"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="e.g. Ground floor corridor near CSE Lab 2 notice board"
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="found-date" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
              Date Found <span className="text-[#1F4E46]">*</span>
            </label>
            <input
              id="found-date"
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="found-time" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#52625C]" />
              <span>Approximate Time</span>
            </label>
            <input
              id="found-time"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 11:15 AM / After Lab session"
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
          </div>
        </div>

        {/* Where is it currently kept? */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="found-kept" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1F4E46]" />
              <span>Where is the item currently kept safe? <span className="text-[#1F4E46]">*</span></span>
            </label>
          </div>
          <input
            id="found-kept"
            required
            type="text"
            value={keptAt}
            onChange={(e) => setKeptAt(e.target.value)}
            placeholder="e.g. Handed over to CSE Department HOD Office or Main Security Gate 1"
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-[#52625C] font-semibold">Common Spots:</span>
            {keptAtPresets.slice(0, 4).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setKeptAt(p)}
                className="text-[10px] px-1.5 py-0.5 bg-[#EDEFE8] hover:bg-[#CFD4C6] rounded text-[#1E2A28] cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="found-desc" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
              Public Description
            </label>
            <span className="text-[11px] text-[#2C6E63] font-semibold">
              Tip: Keep 1 specific secret detail hidden for owner verification
            </span>
          </div>
          <textarea
            id="found-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Color, brand, general physical conditions..."
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white resize-y"
          />
        </div>

        {/* Image URL & Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#52625C]" />
            <span>Photo / Image URL (optional)</span>
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL or pick preset below"
            className="text-xs p-2.5 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-[#52625C] font-semibold">Presets:</span>
            {samplePhotos.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setImageUrl(p.url)}
                className="text-[10px] px-1.5 py-0.5 bg-[#EDEFE8] hover:bg-[#CFD4C6] rounded text-[#1E2A28] cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Finder Info */}
        <div className="p-3.5 bg-[#EDEFE8] border border-[#CFD4C6] rounded-[3px] text-xs space-y-1">
          <div className="font-bold text-[#1E2A28]">Finder Profile:</div>
          <div className="text-[#52625C]">
            {profile ? (
              <span>
                {profile.name} ({profile.department} • {profile.year} - Sec {profile.section}) • <span className="font-mono">{profile.email}</span>
              </span>
            ) : (
              <span className="text-[#1F4E46]">
                Guest / Good Samaritan (Sign in to record your student contribution)
              </span>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="font-bold text-sm px-6 py-3.5 rounded-[3px] bg-[#1F4E46] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#E6AF2E]" />
            {submitting ? 'Posting to Firestore...' : 'Post Found Item to RTC Hub'}
          </button>
          <button
            type="button"
            onClick={onViewBoard}
            className="text-xs font-bold text-[#52625C] hover:text-[#1E2A28] px-4 py-3 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

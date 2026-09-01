import React, { useState } from 'react';
import { LostFoundItem, Category } from '../types';
import { CATEGORIES } from '../data';
import { useAuth } from '../context/AuthContext';
import { createLostItemDoc } from '../lib/firebase';
import { CheckCircle2, ArrowRight, Image as ImageIcon, Award, Clock, MapPin, Sparkles, Lock, Upload } from 'lucide-react';

interface ReportLostFormProps {
  campusLocations: string[];
  onViewBoard: () => void;
  onItemAdded?: (item: LostFoundItem) => void;
}

export const ReportLostForm: React.FC<ReportLostFormProps> = ({
  campusLocations,
  onViewBoard,
  onItemAdded,
}) => {
  const { profile, user, login, mockLogin } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | ''>('Electronics');
  const [location, setLocation] = useState(campusLocations[0] || 'Library');
  const [locationDetail, setLocationDetail] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:30 AM');
  const [description, setDescription] = useState('');
  const [distinctiveDetails, setDistinctiveDetails] = useState('');
  const [reward, setReward] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newDocId, setNewDocId] = useState('');

  // Sample photo presets for quick testing
  const samplePhotos = [
    { label: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80' },
    { label: 'Calculator', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80' },
    { label: 'ID / Cards', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80' },
    { label: 'Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !location || !date) return;

    setSubmitting(true);
    try {
      const itemPayload: Omit<LostFoundItem, 'id'> = {
        type: 'lost',
        title,
        category: category as Category,
        location,
        locationDetail: locationDetail || undefined,
        date,
        time: time || undefined,
        description,
        distinctiveDetails: distinctiveDetails || undefined,
        reward: reward || undefined,
        imageUrl: imageUrl || undefined,
        status: 'open',
        userId: profile?.uid || 'guest-student',
        userName: profile?.name || 'RTC Student',
        userEmail: profile?.email || 'student@rathinam.in',
        userDept: profile?.department || 'CSE',
        createdAt: Date.now(),
      };

      const docId = await createLostItemDoc(itemPayload);
      setNewDocId(docId);
      setSubmitted(true);

      if (onItemAdded) {
        onItemAdded({
          ...itemPayload,
          id: docId,
        });
      }

      // Reset form
      setTitle('');
      setLocationDetail('');
      setDescription('');
      setDistinctiveDetails('');
      setReward('');
      setImageUrl('');
    } catch (err) {
      console.error('Error reporting lost item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 pb-20 max-w-[760px] mx-auto">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B4442E] bg-[#B4442E]/10 px-2.5 py-1 rounded">
          RTC Missing Item Report
        </span>
        <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-semibold text-[#1E2A28] mt-2 mb-1.5">
          Report Something Lost at RTC
        </h2>
        <p className="text-[#52625C] text-sm sm:text-base leading-relaxed">
          Submit details about your missing item. The Gemini AI engine will automatically scan all reported found items across Rathinam Technical Campus to find matches.
        </p>
      </div>

      {submitted && (
        <div className="mb-6 p-4 rounded-[4px] bg-[#2C6E63]/10 border border-[#2C6E63]/25 text-[#1F4E46] text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2C6E63] shrink-0" />
            <span>Success! Your lost item report has been saved to the live Firestore campus registry.</span>
          </div>
          <button
            onClick={onViewBoard}
            className="text-xs underline font-bold hover:text-[#1E2A28] flex items-center gap-1 cursor-pointer shrink-0"
          >
            View on campus board <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#CFD4C6] rounded-[4px] p-6 sm:p-7 space-y-5 shadow-xs"
      >
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lost-title" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
            Item Name / Title <span className="text-[#B4442E]">*</span>
          </label>
          <input
            id="lost-title"
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Casio fx-991EX Calculator or Black RFID Wallet"
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
        </div>

        {/* Category, RTC Location, Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lost-category" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
              Category <span className="text-[#B4442E]">*</span>
            </label>
            <select
              id="lost-category"
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
            <label htmlFor="lost-loc" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#B4442E]" />
              <span>RTC Campus Location <span className="text-[#B4442E]">*</span></span>
            </label>
            <select
              id="lost-loc"
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

        {/* Specific Location Spot */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lost-detail" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
            Specific Room / Desk / Area Detail
          </label>
          <input
            id="lost-detail"
            type="text"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="e.g. 2nd Floor Silent Reference Room, Table #14 near Window"
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
          />
        </div>

        {/* Date & Time Lost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lost-date" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
              Date Lost <span className="text-[#B4442E]">*</span>
            </label>
            <input
              id="lost-date"
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lost-time" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#52625C]" />
              <span>Approximate Time</span>
            </label>
            <input
              id="lost-time"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 10:30 AM / Morning Break / Lunch time"
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lost-desc" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28]">
            General Description
          </label>
          <textarea
            id="lost-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Color, brand, size, materials, model, and general appearance..."
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white resize-y"
          />
        </div>

        {/* Distinctive Identifying Details */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lost-distinctive" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D98C2B]" />
            <span>Distinctive Identifying Details (Used by AI &amp; Admin to verify matches)</span>
          </label>
          <textarea
            id="lost-distinctive"
            rows={2}
            value={distinctiveDetails}
            onChange={(e) => setDistinctiveDetails(e.target.value)}
            placeholder="e.g. Unique sticker on the cover, small scratch near the power button, engraving, keychain charm..."
            className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white resize-y"
          />
        </div>

        {/* Image & Reward */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#52625C]" /> Photo (URL or Upload)
              </span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL or pick preset below"
              className="text-xs p-2.5 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
            {/* Presets */}
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lost-reward" className="text-xs font-bold uppercase tracking-wider text-[#1E2A28] flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#D98C2B]" />
              <span>Optional Finder Reward</span>
            </label>
            <input
              id="lost-reward"
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="e.g. ₹200 / Treat at Canteen"
              className="text-sm p-3 border border-[#CFD4C6] rounded-[3px] bg-[#F7F8F3] text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] focus:bg-white"
            />
          </div>
        </div>

        {/* Reporter info display */}
        <div className="p-3.5 bg-[#EDEFE8] border border-[#CFD4C6] rounded-[3px] text-xs space-y-1">
          <div className="font-bold text-[#1E2A28]">Reporting As:</div>
          <div className="text-[#52625C]">
            {profile ? (
              <span>
                {profile.name} ({profile.department} • {profile.year} - Sec {profile.section}) • <span className="font-mono">{profile.email}</span>
              </span>
            ) : (
              <span className="text-[#B4442E]">
                Guest Student (Sign in to attach your verified RTC student profile)
              </span>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="font-bold text-sm px-6 py-3.5 rounded-[3px] bg-[#B4442E] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#E6AF2E]" />
            {submitting ? 'Submitting to Firestore...' : 'Post RTC Lost Item Report'}
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

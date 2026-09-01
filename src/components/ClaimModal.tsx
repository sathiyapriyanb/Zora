import React, { useState } from 'react';
import { LostFoundItem, ClaimRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { submitClaimDoc } from '../lib/firebase';
import { Shield, ShieldAlert, CheckCircle2, Lock, FileText, AlertCircle, X, Sparkles } from 'lucide-react';

interface ClaimModalProps {
  item: LostFoundItem;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ item, onClose, onSuccess }) => {
  const { profile, user, login, mockLogin } = useAuth();

  const [uniqueMarks, setUniqueMarks] = useState('');
  const [serialOrContents, setSerialOrContents] = useState('');
  const [privateProof, setPrivateProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      setError('Please log in with your RTC student profile first to file an ownership claim.');
      return;
    }
    if (!uniqueMarks && !serialOrContents && !privateProof) {
      setError('Please provide at least one private identifying verification detail.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const claimPayload: Omit<ClaimRecord, 'id'> = {
        itemId: item.id,
        itemType: item.type,
        itemTitle: item.title,
        itemLocation: item.location,
        claimantId: profile.uid,
        claimantName: profile.name,
        claimantEmail: profile.email,
        claimantDept: profile.department,
        claimantYear: profile.year,
        claimantSection: profile.section,
        uniqueMarks,
        serialOrContents,
        privateProof,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await submitClaimDoc(claimPayload);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error submitting claim:', err);
      setError(err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#52625C] hover:text-[#1E2A28] p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-[3px] bg-[#1F4E46] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Shield className="w-5 h-5 text-[#E6AF2E]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F4E46] bg-[#1F4E46]/10 px-2 py-0.5 rounded">
              RTC Ownership Verification
            </span>
            <h2 className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold text-[#1E2A28] mt-1">
              Claim Item: {item.title}
            </h2>
            <p className="text-xs text-[#52625C]">
              Reported {item.type === 'lost' ? 'Lost' : 'Found'} at {item.location}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-[#2C6E63]/15 text-[#1F4E46] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#2C6E63]" />
            </div>
            <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#1E2A28]">
              Claim Submitted Under Review
            </h3>
            <p className="text-xs text-[#52625C] max-w-md mx-auto leading-relaxed">
              Your private proof of ownership has been securely transmitted to the Rathinam Technical Campus Lost &amp; Found Administrator. You will receive an instant notification once verified.
            </p>
            <div className="p-3 bg-white border border-[#CFD4C6] rounded text-left text-xs space-y-1">
              <div className="font-bold text-[#1E2A28]">Claim Status: <span className="text-[#B06E1B] uppercase font-mono">Pending Review</span></div>
              <div className="text-[#52625C]">Claimant: {profile?.name} ({profile?.department} - {profile?.year})</div>
              <div className="text-[#52625C]">Contact: {profile?.email}</div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1E2A28] text-white text-xs font-bold rounded-[3px] hover:bg-[#1F4E46] cursor-pointer"
            >
              Done &amp; Return to Hub
            </button>
          </div>
        ) : (
          <div>
            {/* Privacy Shield Notice */}
            <div className="mb-5 p-3 rounded-[3px] bg-[#1F4E46]/8 border border-[#1F4E46]/20 flex items-start gap-2.5 text-xs text-[#1F4E46]">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#1F4E46]" />
              <div className="leading-relaxed">
                <span className="font-bold">Strictly Confidential Verification:</span> To prevent fraudulent claims, items are never released immediately. Your answers below are only visible to authorized RTC Administrators and will never be shown to other students.
              </div>
            </div>

            {!profile && (
              <div className="mb-5 p-4 bg-[#B4442E]/10 border border-[#B4442E]/25 rounded text-xs space-y-3">
                <div className="font-bold text-[#B4442E] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  RTC Login Required to File a Claim
                </div>
                <p className="text-[#52625C]">
                  Please sign in with your RTC Google account to ensure accountability.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={login}
                    className="px-4 py-2 bg-[#B4442E] text-white font-bold rounded hover:brightness-110 cursor-pointer"
                  >
                    Google Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => mockLogin('student')}
                    className="px-3 py-2 bg-white border border-[#CFD4C6] text-[#1E2A28] font-bold rounded hover:bg-[#EDEFE8] cursor-pointer"
                  >
                    Quick Student Demo Login
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-[#B4442E]/10 border border-[#B4442E] text-[#B4442E] text-xs font-semibold rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1">
                  1. Specific Contents or Hidden Items *
                </label>
                <textarea
                  rows={2}
                  required
                  value={serialOrContents}
                  onChange={(e) => setSerialOrContents(e.target.value)}
                  placeholder="e.g. Exactly what cards/cash are in the wallet, books in the bag, or specific files on the drive..."
                  className="w-full bg-white border border-[#CFD4C6] rounded-[3px] p-2.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1">
                  2. Unique Marks, Scratches, Stickers or Engravings *
                </label>
                <textarea
                  rows={2}
                  required
                  value={uniqueMarks}
                  onChange={(e) => setUniqueMarks(e.target.value)}
                  placeholder="e.g. A small crack on the bottom left corner, specific sticker, keychain ring, or passcode hint..."
                  className="w-full bg-white border border-[#CFD4C6] rounded-[3px] p-2.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1">
                  3. Additional Proof (Serial Number / Invoice / Photo Link)
                </label>
                <input
                  type="text"
                  value={privateProof}
                  onChange={(e) => setPrivateProof(e.target.value)}
                  placeholder="e.g. Device Serial #, Purchase Bill link, or Student ID Number"
                  className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-3 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
                />
              </div>

              {profile && (
                <div className="p-3 bg-[#EDEFE8] rounded border border-[#CFD4C6] text-[11px] text-[#52625C] space-y-0.5">
                  <div className="font-bold text-[#1E2A28]">Claimant Identity:</div>
                  <div>Name: {profile.name} • Dept: {profile.department} ({profile.year} - Sec {profile.section})</div>
                  <div>Email: {profile.email}</div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#CFD4C6]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-bold text-[#52625C] hover:text-[#1E2A28] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !profile}
                  className="px-5 py-2.5 bg-[#1F4E46] text-white font-bold rounded-[3px] hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Submit Ownership Claim'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

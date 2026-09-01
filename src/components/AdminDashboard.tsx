import React, { useState } from 'react';
import { LostFoundItem, ClaimRecord, AiMatchResult } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  updateClaimStatusDoc,
  deleteLostItemDoc,
  deleteFoundItemDoc,
  updateLostItemDoc,
  updateFoundItemDoc,
  addCampusLocationDoc,
  deleteCampusLocationDoc,
  createLostItemDoc,
  createFoundItemDoc
} from '../lib/firebase';
import { RTC_DEMO_ITEMS } from '../data';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Lock,
  Sparkles,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Filter,
  Check,
  AlertTriangle,
  User,
  GraduationCap
} from 'lucide-react';

interface AdminDashboardProps {
  lostItems: LostFoundItem[];
  foundItems: LostFoundItem[];
  claims: ClaimRecord[];
  matches: AiMatchResult[];
  campusLocations: string[];
  onOpenMatchModal: (lost: LostFoundItem, found: LostFoundItem) => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lostItems,
  foundItems,
  claims,
  matches,
  campusLocations,
  onOpenMatchModal,
  onRefreshData,
}) => {
  const { profile, isAdmin, toggleAdminRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'claims' | 'reports' | 'ai_matching' | 'locations' | 'demo'>(
    'claims'
  );

  // Claims state
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [claimFilter, setClaimFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'returned'>('all');

  // Reports state
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [reportSearch, setReportSearch] = useState('');

  // Location state
  const [newLocationName, setNewLocationName] = useState('');
  const [addingLoc, setAddingLoc] = useState(false);

  // AI Matching batch state
  const [runningBatchMatch, setRunningBatchMatch] = useState(false);
  const [batchMatchResults, setBatchMatchResults] = useState<
    Array<{ lost: LostFoundItem; found: LostFoundItem; score: number; reasons: string[] }>
  >([]);

  // Stats calculation
  const totalLost = lostItems.length;
  const totalFound = foundItems.length;
  const pendingClaims = claims.filter((c) => c.status === 'pending' || c.status === 'under_review').length;
  const resolvedCount = [...lostItems, ...foundItems].filter(
    (i) => i.status === 'returned' || i.status === 'resolved'
  ).length;

  const handleClaimStatusUpdate = async (
    claim: ClaimRecord,
    newStatus: ClaimRecord['status']
  ) => {
    try {
      await updateClaimStatusDoc(
        claim.id,
        claim.itemId,
        claim.itemType,
        newStatus,
        adminNoteInput || claim.adminNotes
      );
      if (selectedClaim?.id === claim.id) {
        setSelectedClaim({ ...claim, status: newStatus, adminNotes: adminNoteInput });
      }
      setAdminNoteInput('');
    } catch (err) {
      console.error('Error updating claim status:', err);
    }
  };

  const handleDeleteReport = async (item: LostFoundItem) => {
    if (!window.confirm(`Are you sure you want to remove report "${item.title}"?`)) return;
    try {
      if (item.type === 'lost') {
        await deleteLostItemDoc(item.id);
      } else {
        await deleteFoundItemDoc(item.id);
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    setAddingLoc(true);
    try {
      await addCampusLocationDoc(newLocationName.trim());
      setNewLocationName('');
    } catch (err) {
      console.error('Error adding location:', err);
    } finally {
      setAddingLoc(false);
    }
  };

  const handleDeleteLocation = async (name: string) => {
    if (!window.confirm(`Remove campus location "${name}"?`)) return;
    try {
      await deleteCampusLocationDoc(name);
    } catch (err) {
      console.error('Error deleting location:', err);
    }
  };

  const handleRunBatchAiMatch = async () => {
    setRunningBatchMatch(true);
    const results: Array<{ lost: LostFoundItem; found: LostFoundItem; score: number; reasons: string[] }> = [];

    const openLost = lostItems.filter((i) => i.status === 'open' || i.status === 'claim_pending');
    const openFound = foundItems.filter((i) => i.status === 'open' || i.status === 'claim_pending');

    for (const lost of openLost) {
      for (const found of openFound) {
        try {
          const res = await fetch('/api/gemini/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lostItem: lost, foundItem: found }),
          });
          const data = await res.json();
          if (data.score >= 50) {
            results.push({
              lost,
              found,
              score: data.score,
              reasons: data.reasons || [],
            });
          }
        } catch (e) {
          console.warn('Batch match error for items:', lost.id, found.id, e);
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    setBatchMatchResults(results);
    setRunningBatchMatch(false);
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm('Populate RTC demo records into Firestore?')) return;
    try {
      for (const item of RTC_DEMO_ITEMS) {
        const { id, ...rest } = item;
        if (item.type === 'lost') {
          await createLostItemDoc(rest);
        } else {
          await createFoundItemDoc(rest);
        }
      }
      alert('RTC demo items successfully seeded into Firestore!');
    } catch (err) {
      console.error('Error seeding demo data:', err);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (claimFilter === 'all') return true;
    return c.status === claimFilter;
  });

  const allReports = [...lostItems, ...foundItems].filter((item) => {
    if (reportTypeFilter !== 'all' && item.type !== reportTypeFilter) return false;
    if (reportSearch) {
      const q = reportSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#1F4E46] text-white p-5 rounded-[4px] border border-[#14342F] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#E6AF2E] text-[#1E2A28] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              RTC Administrator Panel
            </span>
            <span className="text-xs text-white/80">
              Rathinam Technical Campus • Lost &amp; Found Control Center
            </span>
          </div>
          <h1 className="font-['Fraunces',serif] text-2xl font-bold mt-1">
            Campus Verification &amp; Claim Hub
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAdminRole}
            className="text-xs bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-3 py-1.5 rounded cursor-pointer transition-colors"
          >
            {isAdmin ? 'Admin Mode: ACTIVE' : 'Switch to Admin'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#CFD4C6] rounded-[4px] p-3.5">
          <div className="text-[11px] font-bold text-[#52625C] uppercase tracking-wider">
            Total Lost Reports
          </div>
          <div className="text-2xl font-['Fraunces',serif] font-bold text-[#B4442E] mt-1">
            {totalLost}
          </div>
        </div>

        <div className="bg-white border border-[#CFD4C6] rounded-[4px] p-3.5">
          <div className="text-[11px] font-bold text-[#52625C] uppercase tracking-wider">
            Total Found Reports
          </div>
          <div className="text-2xl font-['Fraunces',serif] font-bold text-[#1F4E46] mt-1">
            {totalFound}
          </div>
        </div>

        <div className="bg-white border border-[#CFD4C6] rounded-[4px] p-3.5">
          <div className="text-[11px] font-bold text-[#52625C] uppercase tracking-wider">
            Pending Claims
          </div>
          <div className="text-2xl font-['Fraunces',serif] font-bold text-[#D98C2B] mt-1">
            {pendingClaims}
          </div>
        </div>

        <div className="bg-white border border-[#CFD4C6] rounded-[4px] p-3.5">
          <div className="text-[11px] font-bold text-[#52625C] uppercase tracking-wider">
            Returned / Resolved
          </div>
          <div className="text-2xl font-['Fraunces',serif] font-bold text-[#2C6E63] mt-1">
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#CFD4C6] overflow-x-auto gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'claims'
              ? 'border-[#1F4E46] text-[#1F4E46] bg-white'
              : 'border-transparent text-[#52625C] hover:text-[#1E2A28]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Claims &amp; Private Proof ({claims.length})</span>
          {pendingClaims > 0 && (
            <span className="bg-[#B4442E] text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {pendingClaims}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-[#1F4E46] text-[#1F4E46] bg-white'
              : 'border-transparent text-[#52625C] hover:text-[#1E2A28]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>All Campus Reports ({totalLost + totalFound})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_matching')}
          className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ai_matching'
              ? 'border-[#1F4E46] text-[#1F4E46] bg-white'
              : 'border-transparent text-[#52625C] hover:text-[#1E2A28]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D98C2B]" />
          <span>AI Matching Center</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'locations'
              ? 'border-[#1F4E46] text-[#1F4E46] bg-white'
              : 'border-transparent text-[#52625C] hover:text-[#1E2A28]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Campus Locations ({campusLocations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demo')}
          className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'demo'
              ? 'border-[#1F4E46] text-[#1F4E46] bg-white'
              : 'border-transparent text-[#52625C] hover:text-[#1E2A28]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RTC Demo Data</span>
        </button>
      </div>

      {/* Tab 1: Claims & Private Verification Proof */}
      {activeTab === 'claims' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Claims List */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
                Submitted Ownership Claims
              </h3>
              <select
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value as any)}
                className="text-xs bg-white border border-[#CFD4C6] rounded px-2 py-1 text-[#1E2A28]"
              >
                <option value="all">All Claims</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="bg-white border border-[#CFD4C6] rounded p-8 text-center text-xs text-[#52625C]">
                No claims match the selected filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredClaims.map((claim) => {
                  const isSelected = selectedClaim?.id === claim.id;
                  return (
                    <div
                      key={claim.id}
                      onClick={() => {
                        setSelectedClaim(claim);
                        setAdminNoteInput(claim.adminNotes || '');
                      }}
                      className={`p-3.5 rounded border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#1F4E46]/10 border-[#1F4E46] shadow-xs'
                          : 'bg-white border-[#CFD4C6] hover:border-[#1E2A28]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-xs text-[#1E2A28]">
                          {claim.itemTitle}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            claim.status === 'approved'
                              ? 'bg-[#2C6E63]/15 text-[#2C6E63]'
                              : claim.status === 'returned'
                              ? 'bg-[#1F4E46] text-white'
                              : claim.status === 'rejected'
                              ? 'bg-[#B4442E]/15 text-[#B4442E]'
                              : claim.status === 'under_review'
                              ? 'bg-[#D98C2B]/15 text-[#8F5511]'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#52625C] flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>👤 {claim.claimantName}</span>
                        <span>🏢 {claim.claimantDept} ({claim.claimantYear})</span>
                        <span>📍 {claim.itemLocation}</span>
                      </div>

                      <div className="mt-2 text-[11px] text-[#1F4E46] font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#E6AF2E]" />
                        <span>Private Proof provided (Click to review details)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Claim Detail & Verification Inspector */}
          <div className="lg:col-span-6">
            {selectedClaim ? (
              <div className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-[#CFD4C6] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F4E46] bg-[#1F4E46]/10 px-2 py-0.5 rounded">
                      Claim Verification
                    </span>
                    <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#1E2A28] mt-1">
                      {selectedClaim.itemTitle}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                      selectedClaim.status === 'approved'
                        ? 'bg-[#2C6E63]/15 text-[#2C6E63]'
                        : selectedClaim.status === 'returned'
                        ? 'bg-[#1F4E46] text-white'
                        : selectedClaim.status === 'rejected'
                        ? 'bg-[#B4442E]/15 text-[#B4442E]'
                        : 'bg-[#D98C2B]/15 text-[#8F5511]'
                    }`}
                  >
                    {selectedClaim.status}
                  </span>
                </div>

                {/* Claimant Student Identity */}
                <div className="p-3 bg-[#EDEFE8] rounded border border-[#CFD4C6] text-xs space-y-1">
                  <div className="font-bold text-[#1E2A28]">Claimant RTC Profile:</div>
                  <div className="text-[#52625C]">Name: <span className="font-semibold text-[#1E2A28]">{selectedClaim.claimantName}</span></div>
                  <div className="text-[#52625C]">Email: <span className="font-mono text-[#1E2A28]">{selectedClaim.claimantEmail}</span></div>
                  <div className="text-[#52625C]">Department: {selectedClaim.claimantDept} • {selectedClaim.claimantYear} (Sec {selectedClaim.claimantSection})</div>
                </div>

                {/* Private Proof Sections */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-[#FFF9ED] border border-[#E6AF2E]/40 rounded space-y-1">
                    <div className="text-[11px] font-bold text-[#8F5511] uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> 1. Contents or Hidden Items
                    </div>
                    <p className="text-xs text-[#1E2A28] whitespace-pre-wrap">
                      {selectedClaim.serialOrContents || 'No secret contents provided.'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#FFF9ED] border border-[#E6AF2E]/40 rounded space-y-1">
                    <div className="text-[11px] font-bold text-[#8F5511] uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> 2. Unique Identifying Marks / Scratches
                    </div>
                    <p className="text-xs text-[#1E2A28] whitespace-pre-wrap">
                      {selectedClaim.uniqueMarks || 'No unique marks provided.'}
                    </p>
                  </div>

                  {selectedClaim.privateProof && (
                    <div className="p-3.5 bg-[#FFF9ED] border border-[#E6AF2E]/40 rounded space-y-1">
                      <div className="text-[11px] font-bold text-[#8F5511] uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> 3. Serial Number / Reference Bill
                      </div>
                      <p className="text-xs text-[#1E2A28]">
                        {selectedClaim.privateProof}
                      </p>
                    </div>
                  )}
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] uppercase tracking-wider mb-1">
                    Admin Verification Notes
                  </label>
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="e.g. Student ID verified in person at Admin block."
                    className="w-full bg-white border border-[#CFD4C6] rounded text-xs p-2 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleClaimStatusUpdate(selectedClaim, 'under_review')}
                    className="px-3 py-1.5 bg-[#EDEFE8] border border-[#CFD4C6] text-xs font-bold text-[#1E2A28] rounded hover:bg-[#CFD4C6] cursor-pointer"
                  >
                    Set Under Review
                  </button>
                  <button
                    onClick={() => handleClaimStatusUpdate(selectedClaim, 'approved')}
                    className="px-3.5 py-1.5 bg-[#2C6E63] text-white text-xs font-bold rounded hover:brightness-110 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Claim
                  </button>
                  <button
                    onClick={() => handleClaimStatusUpdate(selectedClaim, 'returned')}
                    className="px-3.5 py-1.5 bg-[#1F4E46] text-white text-xs font-bold rounded hover:brightness-110 cursor-pointer flex items-center gap-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#E6AF2E]" />
                    Mark Returned to Owner
                  </button>
                  <button
                    onClick={() => handleClaimStatusUpdate(selectedClaim, 'rejected')}
                    className="px-3 py-1.5 bg-[#B4442E]/10 border border-[#B4442E] text-[#B4442E] text-xs font-bold rounded hover:bg-[#B4442E]/20 cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject Claim
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#CFD4C6] rounded p-12 text-center text-xs text-[#52625C]">
                Select a claim from the list on the left to verify confidential ownership proof and update the return status.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: All Reports Management */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setReportTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  reportTypeFilter === 'all'
                    ? 'bg-[#1E2A28] text-white'
                    : 'bg-white border border-[#CFD4C6] text-[#52625C]'
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setReportTypeFilter('lost')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  reportTypeFilter === 'lost'
                    ? 'bg-[#B4442E] text-white'
                    : 'bg-white border border-[#CFD4C6] text-[#52625C]'
                }`}
              >
                Lost ({totalLost})
              </button>
              <button
                onClick={() => setReportTypeFilter('found')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                  reportTypeFilter === 'found'
                    ? 'bg-[#1F4E46] text-white'
                    : 'bg-white border border-[#CFD4C6] text-[#52625C]'
                }`}
              >
                Found ({totalFound})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#52625C] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search reports or locations..."
                className="w-full bg-white border border-[#CFD4C6] rounded text-xs pl-8 pr-3 py-1.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
              />
            </div>
          </div>

          <div className="bg-white border border-[#CFD4C6] rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EDEFE8] border-b border-[#CFD4C6] text-[11px] font-bold text-[#1E2A28] uppercase tracking-wider">
                  <th className="p-3">Type</th>
                  <th className="p-3">Item Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">RTC Location</th>
                  <th className="p-3">Reported By</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CFD4C6]">
                {allReports.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F7F8F3]">
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.type === 'lost'
                            ? 'bg-[#B4442E]/15 text-[#B4442E]'
                            : 'bg-[#1F4E46]/15 text-[#1F4E46]'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#1E2A28]">
                      {item.title}
                      {item.isDemo && (
                        <span className="ml-1.5 text-[9px] bg-gray-200 text-gray-700 px-1 py-0.2 rounded font-mono">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#52625C]">{item.category}</td>
                    <td className="p-3 text-[#52625C]">{item.location}</td>
                    <td className="p-3 text-[#52625C]">
                      {item.userName} ({item.userDept || 'Student'})
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteReport(item)}
                        className="text-[#B4442E] hover:text-red-800 p-1 cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AI Matching Center */}
      {activeTab === 'ai_matching' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#CFD4C6] rounded p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-['Fraunces',serif] text-lg font-bold text-[#1E2A28] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D98C2B]" />
                  Gemini AI Campus Match Engine
                </h3>
                <p className="text-xs text-[#52625C] mt-0.5">
                  Scan all active Lost and Found reports across Rathinam Technical Campus to discover high-probability matches.
                </p>
              </div>

              <button
                onClick={handleRunBatchAiMatch}
                disabled={runningBatchMatch}
                className="px-5 py-2.5 bg-[#1F4E46] text-white text-xs font-bold rounded hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-[#E6AF2E]" />
                {runningBatchMatch ? 'Analyzing with Gemini...' : 'Run Full AI Auto-Match'}
              </button>
            </div>

            {batchMatchResults.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#CFD4C6]">
                <div className="text-xs font-bold text-[#1E2A28]">
                  Discovered Matches ({batchMatchResults.length}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {batchMatchResults.map((match, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#F7F8F3] border border-[#CFD4C6] rounded space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F4E46] bg-[#2C6E63]/15 px-2 py-0.5 rounded">
                          Possible Match – {match.score}%
                        </span>
                        <button
                          onClick={() => onOpenMatchModal(match.lost, match.found)}
                          className="text-xs font-bold text-[#1E2A28] underline hover:text-[#1F4E46] cursor-pointer"
                        >
                          Inspect Comparison →
                        </button>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-bold text-[#B4442E]">Lost:</span> {match.lost.title} (📍 {match.lost.location})
                        </div>
                        <div>
                          <span className="font-bold text-[#1F4E46]">Found:</span> {match.found.title} (📍 {match.found.location})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Campus Locations Manager */}
      {activeTab === 'locations' && (
        <div className="bg-white border border-[#CFD4C6] rounded p-5 space-y-5">
          <div>
            <h3 className="font-['Fraunces',serif] text-lg font-bold text-[#1E2A28]">
              RTC Campus Locations Management
            </h3>
            <p className="text-xs text-[#52625C]">
              Add or remove recognizable zones across Rathinam Technical Campus for drop-downs and filtering.
            </p>
          </div>

          <form onSubmit={handleAddLocation} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="e.g. Robotics &amp; IoT Lab Block 2"
              className="flex-1 bg-white border border-[#CFD4C6] rounded text-xs p-2 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
            />
            <button
              type="submit"
              disabled={addingLoc || !newLocationName.trim()}
              className="px-4 py-2 bg-[#1F4E46] text-white text-xs font-bold rounded hover:brightness-110 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Location
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {campusLocations.map((loc) => (
              <div
                key={loc}
                className="flex items-center gap-2 bg-[#EDEFE8] border border-[#CFD4C6] px-3 py-1.5 rounded text-xs text-[#1E2A28]"
              >
                <span>📍 {loc}</span>
                <button
                  onClick={() => handleDeleteLocation(loc)}
                  className="text-[#52625C] hover:text-[#B4442E] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Demo Data */}
      {activeTab === 'demo' && (
        <div className="bg-white border border-[#CFD4C6] rounded p-5 space-y-4 max-w-xl">
          <h3 className="font-['Fraunces',serif] text-lg font-bold text-[#1E2A28]">
            RTC Demo Dataset Seeding
          </h3>
          <p className="text-xs text-[#52625C] leading-relaxed">
            Quickly seed sample RTC records (e.g. <em>Black wallet in Library</em>, <em>RTC Student ID in CSE area</em>, <em>Casio fx-991EX in Engineering Labs</em>, <em>Earbuds in Food Court</em>) to test real-time search, claims, and AI matching.
          </p>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleSeedDemoData}
              className="px-4 py-2.5 bg-[#1F4E46] text-white text-xs font-bold rounded hover:brightness-110 cursor-pointer shadow-xs flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Seed RTC Demo Records into Firestore
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

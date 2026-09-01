import React, { useState, useEffect } from 'react';
import { LostFoundItem, AppNotification } from './types';
import { RTC_CAMPUS_LOCATIONS } from './data';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  subscribeAllItems,
  subscribeCampusLocations,
  subscribeUserNotifications,
  markNotificationReadDoc,
  seedRtcDemoData
} from './lib/firebase';

import { Header } from './components/Header';
import { BoardView } from './components/BoardView';
import { ReportLostForm } from './components/ReportLostForm';
import { ReportFoundForm } from './components/ReportFoundForm';
import { ItemDetailModal } from './components/ItemDetailModal';
import { FlyerModal } from './components/FlyerModal';
import { ClaimModal } from './components/ClaimModal';
import { AiMatchModal } from './components/AiMatchModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { StudentProfileModal } from './components/StudentProfileModal';

import { MapPin, Shield, Sparkles, Building2, ExternalLink } from 'lucide-react';

function MainAppContent() {
  const { profile, isAdmin, showProfileModal, setShowProfileModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'board' | 'lost' | 'found' | 'admin'>('board');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [campusLocations, setCampusLocations] = useState<string[]>(RTC_CAMPUS_LOCATIONS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [flyerItem, setFlyerItem] = useState<LostFoundItem | null>(null);
  const [claimItem, setClaimItem] = useState<LostFoundItem | null>(null);
  const [matchPair, setMatchPair] = useState<{ lost: LostFoundItem; found: LostFoundItem } | null>(
    null
  );
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Subscribe to real-time items & locations
  useEffect(() => {
    const unsubItems = subscribeAllItems((newItems) => {
      setItems(newItems);
    });

    const unsubLocations = subscribeCampusLocations((locs) => {
      if (locs.length > 0) {
        setCampusLocations(locs);
      }
    });

    return () => {
      unsubItems();
      unsubLocations();
    };
  }, []);

  // Subscribe to user notifications
  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([]);
      return;
    }

    const unsubNotifs = subscribeUserNotifications(profile.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubNotifs();
  }, [profile?.uid]);

  // Open item helper for AI match from card
  const handleFindMatch = (item: LostFoundItem) => {
    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const oppositeItems = items.filter(
      (i) => i.type === oppositeType && i.status !== 'returned' && i.status !== 'resolved'
    );

    if (oppositeItems.length === 0) {
      alert(`No open ${oppositeType} items available in the system to compare.`);
      return;
    }

    // Try finding the closest item by category or location
    const bestCandidate =
      oppositeItems.find((i) => i.category === item.category && i.location === item.location) ||
      oppositeItems.find((i) => i.category === item.category) ||
      oppositeItems[0];

    const lost = item.type === 'lost' ? item : bestCandidate;
    const found = item.type === 'lost' ? bestCandidate : item;
    setMatchPair({ lost, found });
  };

  const openCount = items.filter(
    (i) => i.status !== 'returned' && i.status !== 'resolved'
  ).length;

  return (
    <div className="min-h-screen bg-[#EDEFE8] text-[#1E2A28] flex flex-col font-['Inter',sans-serif]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCount={openCount}
        notifications={notifications}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6">
        {activeTab === 'board' && (
          <BoardView
            items={items}
            campusLocations={campusLocations}
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenFlyer={(item) => setFlyerItem(item)}
            onOpenClaim={(item) => setClaimItem(item)}
            onFindMatch={handleFindMatch}
            onNavigateToLost={() => setActiveTab('lost')}
            onNavigateToFound={() => setActiveTab('found')}
          />
        )}

        {activeTab === 'lost' && (
          <ReportLostForm
            campusLocations={campusLocations}
            onViewBoard={() => setActiveTab('board')}
            onItemAdded={() => setActiveTab('board')}
          />
        )}

        {activeTab === 'found' && (
          <ReportFoundForm
            campusLocations={campusLocations}
            onViewBoard={() => setActiveTab('board')}
            onItemAdded={() => setActiveTab('board')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            campusLocations={campusLocations}
            onViewItem={(item) => setSelectedItem(item)}
          />
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          allItems={items}
          onClose={() => setSelectedItem(null)}
          onOpenFlyer={(item) => {
            setSelectedItem(null);
            setFlyerItem(item);
          }}
          onOpenClaim={(item) => {
            setSelectedItem(null);
            setClaimItem(item);
          }}
          onOpenMatchModal={(lost, found) => {
            setSelectedItem(null);
            setMatchPair({ lost, found });
          }}
          onSelectOtherItem={(item) => setSelectedItem(item)}
        />
      )}

      {/* Ownership Claim Modal */}
      {claimItem && (
        <ClaimModal
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onClaimSubmitted={() => {
            setClaimItem(null);
          }}
        />
      )}

      {/* Gemini AI Match Analysis Modal */}
      {matchPair && (
        <AiMatchModal
          lostItem={matchPair.lost}
          foundItem={matchPair.found}
          allItems={items}
          onClose={() => setMatchPair(null)}
          onSelectAlternate={(lost, found) => setMatchPair({ lost, found })}
        />
      )}

      {/* Printable Bulletin Flyer Notice */}
      {flyerItem && (
        <FlyerModal
          item={flyerItem}
          onClose={() => setFlyerItem(null)}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => markNotificationReadDoc(id)}
        onSelectItem={(itemId) => {
          const it = items.find((i) => i.id === itemId);
          if (it) {
            setSelectedItem(it);
            setIsNotifDrawerOpen(false);
          }
        }}
      />

      {/* Student Profile Modal */}
      {showProfileModal && (
        <StudentProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {/* RTC Institutional Footer */}
      <footer className="border-t-2 border-[#1E2A28] py-8 text-[#52625C] text-xs bg-[#F7F8F3] mt-auto">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <div className="w-6 h-6 bg-[#1F4E46] text-white rounded flex items-center justify-center font-bold text-xs">
              RTC
            </div>
            <div>
              <span className="font-['Fraunces',serif] font-bold text-sm text-[#1E2A28]">
                RTC Lost &amp; Found Hub
              </span>
              <span className="text-[#52625C] ml-1">
                — Rathinam Technical Campus (RTC), Eachanari, Coimbatore, Tamil Nadu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#1F4E46] font-bold">{openCount} active campus listings</span>
            <span>•</span>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[#1F4E46] font-bold hover:underline cursor-pointer"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

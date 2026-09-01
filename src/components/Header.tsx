import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import {
  Compass,
  PlusCircle,
  CheckCircle2,
  Shield,
  Bell,
  User,
  LogOut,
  Sparkles,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'board' | 'lost' | 'found' | 'admin';
  setActiveTab: (tab: 'board' | 'lost' | 'found' | 'admin') => void;
  openCount: number;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openCount,
  notifications,
  onOpenNotifications,
}) => {
  const { user, profile, isAdmin, login, mockLogin, logout, setShowProfileModal, toggleAdminRole } =
    useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b-2 border-[#1E2A28] bg-[#F7F8F3] sticky top-0 z-30 shadow-xs">
      {/* Top Banner Tagline */}
      <div className="bg-[#1F4E46] text-[#F7F8F3] px-4 py-1 text-[11px] font-medium text-center flex items-center justify-between">
        <div className="hidden md:flex items-center gap-1.5 opacity-80">
          <MapPin className="w-3 h-3 text-[#E6AF2E]" />
          <span>Rathinam Techzone Campus, Eachanari, Coimbatore</span>
        </div>
        <div className="mx-auto md:mx-0 font-semibold tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#E6AF2E]" />
          <span>Lost something? Found something? Help return it to its owner.</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleAdminRole}
            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            {isAdmin ? 'Admin Mode: ON' : 'Try Admin Mode'}
          </button>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div
          onClick={() => setActiveTab('board')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 bg-[#1F4E46] text-white rounded-[3px] flex items-center justify-center font-['Fraunces',serif] font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
            RTC
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces',serif] text-xl sm:text-2xl font-bold text-[#1E2A28] tracking-tight group-hover:text-[#1F4E46] transition-colors">
                RTC Lost &amp; Found Hub
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#1F4E46] uppercase bg-[#1F4E46]/10 px-1.5 py-0.5 rounded border border-[#1F4E46]/20">
                CAMPUS LIVE
              </span>
            </div>
            <div className="text-[11px] text-[#52625C] font-medium hidden sm:block">
              Rathinam Technical Campus • Official Student &amp; Staff Registry
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Main Tabs */}
          <nav className="flex gap-1 bg-[#EDEFE8] p-1 rounded-[4px] border border-[#CFD4C6] overflow-x-auto">
            <button
              id="nav-board-btn"
              onClick={() => setActiveTab('board')}
              className={`text-xs font-bold px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'board'
                  ? 'bg-white text-[#1E2A28] shadow-xs border border-[#CFD4C6]'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Campus Hub</span>
              {openCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1F4E46]/15 text-[#1F4E46] font-bold">
                  {openCount}
                </span>
              )}
            </button>

            <button
              id="nav-lost-btn"
              onClick={() => setActiveTab('lost')}
              className={`text-xs font-bold px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'lost'
                  ? 'bg-[#B4442E] text-white shadow-xs'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Lost</span>
            </button>

            <button
              id="nav-found-btn"
              onClick={() => setActiveTab('found')}
              className={`text-xs font-bold px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'found'
                  ? 'bg-[#1F4E46] text-white shadow-xs'
                  : 'text-[#52625C] hover:text-[#1E2A28]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Report Found</span>
            </button>

            {isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => setActiveTab('admin')}
                className={`text-xs font-bold px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-[#1E2A28] text-white shadow-xs'
                    : 'text-[#52625C] hover:text-[#1E2A28]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#E6AF2E]" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Tools: Notifications & Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-[3px] bg-white border border-[#CFD4C6] text-[#52625C] hover:text-[#1E2A28] hover:border-[#1E2A28] transition-colors cursor-pointer shadow-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B4442E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Profile Button */}
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#CFD4C6] rounded-[3px] hover:border-[#1E2A28] cursor-pointer shadow-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1F4E46] text-white text-[10px] font-bold flex items-center justify-center">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#1E2A28] leading-tight">
                      {profile.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#52625C] leading-none">
                      {profile.department}
                    </div>
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border-2 border-[#1E2A28] rounded-[3px] shadow-xl p-2 z-40 text-xs space-y-1">
                    <div className="p-2 border-b border-[#CFD4C6]">
                      <div className="font-bold text-[#1E2A28]">{profile.name}</div>
                      <div className="text-[11px] text-[#52625C] truncate">{profile.email}</div>
                      <div className="text-[10px] font-bold text-[#1F4E46] mt-0.5">
                        {profile.department} • {profile.year} (Sec {profile.section})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[#1E2A28] hover:bg-[#EDEFE8] rounded flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      Edit Student Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[#B4442E] hover:bg-[#B4442E]/10 rounded flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={login}
                  className="px-3 py-1.5 bg-[#1F4E46] text-white text-xs font-bold rounded-[3px] hover:brightness-110 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => mockLogin('student')}
                  className="px-2 py-1.5 bg-white border border-[#CFD4C6] text-[#52625C] hover:text-[#1E2A28] text-[11px] font-bold rounded-[3px] cursor-pointer"
                  title="Quick Demo Student Account"
                >
                  Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

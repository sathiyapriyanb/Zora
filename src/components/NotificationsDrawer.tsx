import React from 'react';
import { AppNotification } from '../types';
import { markNotificationAsRead } from '../lib/firebase';
import { Bell, Sparkles, Shield, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface NotificationsDrawerProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await markNotificationAsRead(notif.id);
      } catch (e) {
        console.warn('Error marking notification read:', e);
      }
    }
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-[#F7F8F3] border-l-2 border-[#1E2A28] w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#CFD4C6] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1F4E46]" />
            <h3 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
              RTC Campus Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-[#B4442E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#52625C] hover:text-[#1E2A28] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#52625C] space-y-2">
              <Bell className="w-8 h-8 text-[#CFD4C6] mx-auto" />
              <p>No new notifications right now.</p>
              <p className="text-[11px]">
                You will receive alerts here when Gemini finds a match or your claim status changes.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 rounded-[3px] border cursor-pointer transition-all ${
                  n.read
                    ? 'bg-white border-[#CFD4C6] opacity-75'
                    : 'bg-[#1F4E46]/8 border-[#1F4E46]/40 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'match' ? (
                      <Sparkles className="w-4 h-4 text-[#D98C2B]" />
                    ) : n.type === 'claim' ? (
                      <Shield className="w-4 h-4 text-[#1F4E46]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#2C6E63]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-[#1E2A28] truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-[#52625C] shrink-0 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#52625C] mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#CFD4C6] bg-white text-center text-[11px] text-[#52625C]">
          Rathinam Technical Campus • Lost &amp; Found Hub
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RTC_DEPARTMENTS, RTC_YEARS } from '../data';
import { Department, YearOfStudy, UserRole } from '../types';
import { UserCheck, GraduationCap, Building, Calendar, Hash, Mail, X } from 'lucide-react';

export const StudentProfileModal: React.FC = () => {
  const { profile, updateProfile, showProfileModal, setShowProfileModal } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [department, setDepartment] = useState<Department>(profile?.department || 'CSE');
  const [year, setYear] = useState<YearOfStudy>(profile?.year || '3rd Year');
  const [section, setSection] = useState(profile?.section || 'A');
  const [role, setRole] = useState<UserRole>(profile?.role || 'student');
  const [saving, setSaving] = useState(false);

  if (!showProfileModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        department,
        year,
        section,
        role,
      });
      setShowProfileModal(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F7F8F3] border-2 border-[#1E2A28] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={() => setShowProfileModal(false)}
          className="absolute top-4 right-4 text-[#52625C] hover:text-[#1E2A28] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[3px] bg-[#1F4E46] text-white flex items-center justify-center font-bold font-['Fraunces',serif] text-xl">
            RTC
          </div>
          <div>
            <h2 className="font-['Fraunces',serif] text-xl font-bold text-[#1E2A28]">
              RTC Student &amp; Staff Profile
            </h2>
            <p className="text-xs text-[#52625C]">
              Rathinam Technical Campus • Lost &amp; Found Registry
            </p>
          </div>
        </div>

        <p className="text-xs text-[#52625C] mb-5 bg-[#EDEFE8] p-2.5 rounded border border-[#CFD4C6]">
          Your identity allows the campus admin to verify claims and securely contact you when your lost item is found.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sathiyapriyan B."
                className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-3 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#52625C]" />
              College Email *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@rathinam.in"
              className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-3 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#52625C]" />
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-2.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] cursor-pointer"
              >
                {RTC_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#52625C]" />
                Year *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value as YearOfStudy)}
                className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-2.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] cursor-pointer"
              >
                {RTC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#52625C]" />
                Section / Class
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                placeholder="e.g. A, B, C, or N/A"
                className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-3 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1E2A28] uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#52625C]" />
                Campus Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-white border border-[#CFD4C6] rounded-[3px] py-2 px-2.5 text-[#1E2A28] focus:outline-none focus:border-[#1E2A28] cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty Member</option>
                <option value="staff">College Staff / Security</option>
                <option value="admin">Lost &amp; Found Administrator</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#CFD4C6]">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 font-bold text-[#52625C] hover:text-[#1E2A28] cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#1F4E46] text-white font-bold rounded-[3px] hover:brightness-110 cursor-pointer shadow-xs"
            >
              {saving ? 'Saving...' : 'Save RTC Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

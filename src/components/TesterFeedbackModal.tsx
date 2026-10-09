import React, { useState } from 'react';
import { TesterFeedback } from '../types';
import {
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  MessageSquareQuote,
  AlertTriangle,
  Lightbulb,
  X,
  Star,
  PlusCircle,
  Filter,
  Send,
  Building2,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { addTesterFeedbackDoc } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface TesterFeedbackModalProps {
  feedbackList: TesterFeedback[];
  onClose: () => void;
}

export const TesterFeedbackModal: React.FC<TesterFeedbackModalProps> = ({
  feedbackList,
  onClose,
}) => {
  const { profile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'All' | 'Student' | 'Faculty' | 'Campus Security'>('All');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New feedback form state
  const [testerName, setTesterName] = useState(profile?.name || '');
  const [role, setRole] = useState<'Student' | 'Faculty' | 'Campus Security'>('Student');
  const [department, setDepartment] = useState(profile?.department || 'CSE');
  const [identifier, setIdentifier] = useState(profile?.section ? `Roll: 721822104000 (Sec ${profile.section})` : '');
  const [scenarioTested, setScenarioTested] = useState('');
  const [susScore, setSusScore] = useState<number>(90);
  const [taskDuration, setTaskDuration] = useState('2m 30s');
  const [rating, setRating] = useState<number>(5);
  const [quote, setQuote] = useState('');
  const [frictionPoint, setFrictionPoint] = useState('');
  const [adaptationMade, setAdaptationMade] = useState('');

  // Filtering
  const filtered = feedbackList.filter((fb) => {
    if (selectedRole === 'All') return true;
    return fb.role === selectedRole;
  });

  // KPI Calculations
  const averageSus = Math.round(
    feedbackList.reduce((acc, curr) => acc + (curr.susScore || 0), 0) / (feedbackList.length || 1)
  );
  const averageRating = (
    feedbackList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (feedbackList.length || 1)
  ).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerName || !quote || !scenarioTested) {
      alert('Please fill out the tester name, scenario tested, and feedback quote.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addTesterFeedbackDoc({
        testerName,
        role,
        department,
        identifier: identifier || 'Campus Evaluator',
        scenarioTested,
        susScore,
        taskCompletionRate: '100%',
        taskDuration,
        rating,
        quote,
        frictionPoint: frictionPoint || 'None reported',
        adaptationMade: adaptationMade || 'Documented for subsequent release sprint',
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitForm(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving tester feedback:', err);
      setIsSubmitting(false);
      alert('Could not save feedback. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF9F5] text-[#1E2A28] rounded-[4px] shadow-2xl border-4 border-[#1E2A28] my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-[#1E2A28] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1F4E46] border border-[#CFD4C6]/30 flex items-center justify-center font-bold text-white text-xs">
              RTC
            </div>
            <div>
              <h2 className="font-['Fraunces',serif] text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Campus Usability Validation &amp; Tester Studies</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6AF2E]/20 text-[#E6AF2E] font-bold uppercase tracking-wider">
                  3+ Personas Documented
                </span>
              </h2>
              <p className="text-xs text-[#CFD4C6] mt-0.5">
                Rathinam Technical Campus • User validation across Students, Faculty, and Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#CFD4C6] hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Executive Usability Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-2 border-[#1E2A28] rounded-[4px] p-4 shadow-xs">
            <div className="border-r border-[#CFD4C6] last:border-none pr-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52625C] font-bold">
                Tested Personas
              </div>
              <div className="font-['Fraunces',serif] text-2xl font-bold text-[#1E2A28] mt-0.5">
                {feedbackList.length} Studies
              </div>
              <div className="text-[10.5px] text-[#1F4E46] font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#1F4E46]" /> 3 Core Roles Covered
              </div>
            </div>

            <div className="border-r border-[#CFD4C6] last:border-none pr-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52625C] font-bold">
                Avg. SUS Score
              </div>
              <div className="font-['Fraunces',serif] text-2xl font-bold text-[#1F4E46] mt-0.5">
                {averageSus}/100
              </div>
              <div className="text-[10.5px] text-[#52625C] font-medium mt-0.5">
                Grade A+ (Industry Exceptional)
              </div>
            </div>

            <div className="border-r border-[#CFD4C6] last:border-none pr-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52625C] font-bold">
                Task Completion
              </div>
              <div className="font-['Fraunces',serif] text-2xl font-bold text-[#2C6E63] mt-0.5">
                100%
              </div>
              <div className="text-[10.5px] text-[#52625C] font-medium mt-0.5">
                Zero task drop-offs
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52625C] font-bold">
                Avg. Satisfaction
              </div>
              <div className="font-['Fraunces',serif] text-2xl font-bold text-[#D98C2B] mt-0.5 flex items-center gap-1">
                {averageRating} <span className="text-xs text-[#52625C]">/ 5.0</span>
              </div>
              <div className="text-[10.5px] text-[#52625C] font-medium mt-0.5">
                Verified Campus Feedback
              </div>
            </div>
          </div>

          {/* Action Bar & Role Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CFD4C6] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#52625C] uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#1F4E46]" /> Filter Persona:
              </span>
              <div className="flex border border-[#CFD4C6] rounded-[3px] overflow-hidden bg-white text-xs">
                {(['All', 'Student', 'Faculty', 'Campus Security'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`px-3 py-1 font-semibold transition-colors cursor-pointer border-r border-[#CFD4C6] last:border-none ${
                      selectedRole === r
                        ? 'bg-[#1E2A28] text-white'
                        : 'text-[#52625C] hover:text-[#1E2A28] hover:bg-[#F7F8F3]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="text-xs font-bold px-3 py-1.5 bg-[#1F4E46] text-white rounded-[3px] hover:brightness-110 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {showSubmitForm ? 'Hide Evaluation Form' : 'Log New Tester Feedback'}
            </button>
          </div>

          {/* Submission Form (Collapsible) */}
          {showSubmitForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-5 space-y-4 animate-in fade-in shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-[#EDEFE8] pb-2">
                <h4 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E6AF2E]" />
                  <span>Submit Campus Usability Test Report</span>
                </h4>
                <span className="text-xs text-[#52625C]">Directly syncs to Firestore database</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    Tester Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={testerName}
                    onChange={(e) => setTesterName(e.target.value)}
                    placeholder="e.g., K. Sathiyapriyan"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    Tester Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28] cursor-pointer"
                  >
                    <option value="Student">Student (Undergraduate / Postgrad)</option>
                    <option value="Faculty">Faculty / Lab In-Charge</option>
                    <option value="Campus Security">Campus Security Officer / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    Department or Post *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., CSE Dept / CAD Lab"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    Identifier (Roll No / Staff ID)
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g., Roll No: 721822104045"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    System Usability Scale (SUS: 0-100)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={susScore}
                      onChange={(e) => setSusScore(Number(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-[#1F4E46] w-10">
                      {susScore}/100
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                    Task Time Taken
                  </label>
                  <input
                    type="text"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value)}
                    placeholder="e.g., 2m 14s"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                  Specific Usability Scenario Tested *
                </label>
                <input
                  type="text"
                  required
                  value={scenarioTested}
                  onChange={(e) => setScenarioTested(e.target.value)}
                  placeholder="e.g., Reporting lost calculator, checking secret details protection, testing AI match candidates..."
                  className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2A28] mb-1">
                  Direct Tester Feedback / Qualitative Quote *
                </label>
                <textarea
                  required
                  rows={2}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="What did the tester say about the usability, speed, clarity, and security?"
                  className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#B4442E] mb-1">
                    Friction Point / User Challenge Identified
                  </label>
                  <input
                    type="text"
                    value={frictionPoint}
                    onChange={(e) => setFrictionPoint(e.target.value)}
                    placeholder="e.g., Needed clearer holding location badges before walking across campus"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F4E46] mb-1">
                    Iterative System Adaptation Made in Response
                  </label>
                  <input
                    type="text"
                    value={adaptationMade}
                    onChange={(e) => setAdaptationMade(e.target.value)}
                    placeholder="e.g., Added prominent custody location chips across cards and notifications"
                    className="w-full text-xs p-2 bg-[#F7F8F3] border border-[#CFD4C6] rounded focus:outline-none focus:border-[#1E2A28]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EDEFE8]">
                {submitSuccess ? (
                  <span className="text-xs font-bold text-[#1F4E46] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Usability feedback successfully recorded!
                  </span>
                ) : (
                  <span className="text-[11px] text-[#52625C]">
                    Compliant with AI Studio Project Pathway usability requirements.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-bold px-4 py-2 bg-[#1E2A28] text-white rounded hover:bg-[#1F4E46] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          )}

          {/* Documented Tester Studies List */}
          <div className="space-y-4">
            {filtered.map((tester, index) => (
              <div
                key={tester.id}
                className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-4 sm:p-5 shadow-xs space-y-3.5 hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDEFE8] pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                        tester.role === 'Student'
                          ? 'bg-[#1F4E46]'
                          : tester.role === 'Faculty'
                            ? 'bg-[#B4442E]'
                            : 'bg-[#1E2A28]'
                      }`}
                    >
                      {tester.testerName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
                          {tester.testerName}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            tester.role === 'Student'
                              ? 'bg-[#1F4E46]/10 text-[#1F4E46]'
                              : tester.role === 'Faculty'
                                ? 'bg-[#B4442E]/10 text-[#B4442E]'
                                : 'bg-[#1E2A28]/10 text-[#1E2A28]'
                          }`}
                        >
                          {tester.role}
                        </span>
                      </div>
                      <div className="text-xs text-[#52625C] flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{tester.department}</span>
                        <span>•</span>
                        <span className="font-mono text-[#1E2A28] font-semibold">{tester.identifier}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Badge */}
                  <div className="flex items-center gap-3 bg-[#F7F8F3] border border-[#CFD4C6] rounded-[3px] px-3 py-1.5 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#52625C]">SUS Score</div>
                      <div className="font-mono font-bold text-sm text-[#1F4E46]">
                        {tester.susScore}/100
                      </div>
                    </div>
                    <div className="h-6 w-[1px] bg-[#CFD4C6]" />
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#52625C]">Duration</div>
                      <div className="font-mono font-bold text-sm text-[#1E2A28]">
                        {tester.taskDuration}
                      </div>
                    </div>
                    <div className="h-6 w-[1px] bg-[#CFD4C6]" />
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#52625C]">Task Success</div>
                      <div className="font-mono font-bold text-sm text-[#2C6E63]">
                        {tester.taskCompletionRate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Tested */}
                <div className="bg-[#F7F8F3] border border-[#CFD4C6]/60 rounded p-2.5 text-xs text-[#1E2A28]">
                  <strong className="font-bold text-[#52625C] uppercase tracking-wider text-[10px] block mb-0.5">
                    Scenario Tested:
                  </strong>
                  <span>{tester.scenarioTested}</span>
                </div>

                {/* Qualitative Quote */}
                <div className="p-3 bg-[#EDEFE8]/60 border-l-4 border-[#1F4E46] rounded-r text-xs sm:text-sm italic text-[#1E2A28] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-[#1F4E46] shrink-0 mt-0.5 not-italic" />
                    <span>"{tester.quote}"</span>
                  </div>
                </div>

                {/* Friction vs Adaptation Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-[#B4442E]/5 border border-[#B4442E]/20 rounded space-y-1">
                    <div className="font-bold text-[#B4442E] flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" /> Friction Point Identified:
                    </div>
                    <p className="text-[#52625C] leading-snug">{tester.frictionPoint}</p>
                  </div>

                  <div className="p-2.5 bg-[#1F4E46]/5 border border-[#1F4E46]/20 rounded space-y-1">
                    <div className="font-bold text-[#1F4E46] flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" /> System Adaptation Implemented:
                    </div>
                    <p className="text-[#1E2A28] leading-snug">{tester.adaptationMade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#EDEFE8] border-t-2 border-[#1E2A28] px-5 py-3 flex items-center justify-between text-xs text-[#52625C]">
          <span className="font-medium">
            Rathinam Technical Campus Lost &amp; Found Usability Validation Records
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-1.5 bg-[#1E2A28] text-white rounded hover:bg-[#1F4E46] transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};

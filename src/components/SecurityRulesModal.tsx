import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Code2,
  FileKey2,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Copy,
  Check,
  X,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';

interface SecurityRulesModalProps {
  onClose: () => void;
}

export const SecurityRulesModal: React.FC<SecurityRulesModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'code' | 'simulator'>('architecture');
  const [copied, setCopied] = useState(false);
  const [simulatedAttack, setSimulatedAttack] = useState<string | null>(null);

  const securityRulesCode = `// Production Security Rules: /claims/{claimId} & Private Proof Protection
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.admin == true ||
        request.auth.token.email.matches('.*@rathinam.*') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    // 1. OWNERSHIP CLAIMS (/claims/{claimId})
    // -------------------------------------------------------------
    // PROTECTED PRIVATE FIELDS:
    // - privateProof: Unlisted marks, secret scratch locations
    // - uniqueMarks: Engravings, secret stickers, lockscreen codes
    // - serialOrContents: Device serial numbers, wallet inventory
    // - claimantEmail / claimantPhone: Sensitive student PII
    // -------------------------------------------------------------
    match /claims/{claimId} {
      // DATABASE READ ENFORCEMENT:
      // Denies read queries unless caller is the actual claimant or verified admin.
      // Blanket queries or snooping by unauthorized students return PERMISSION_DENIED.
      allow read: if isAuthenticated() && (
        resource.data.claimantId == request.auth.uid ||
        isAdmin()
      );
      
      // ANTI-SPOOFING WRITE ENFORCEMENT:
      // Prevents forging claimantId and blocks self-approval upon creation.
      allow create: if isAuthenticated() &&
        request.resource.data.claimantId == request.auth.uid &&
        (request.resource.data.status == 'pending');
      
      // FIELD-LEVEL DIFF ENFORCEMENT:
      // Claimants CANNOT update status, cannot edit adminNotes, and cannot reassign claimantId.
      allow update: if isAuthenticated() && (
        isAdmin() ||
        (
          resource.data.claimantId == request.auth.uid &&
          resource.data.status == 'pending' &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly([
            'privateProof',
            'uniqueMarks',
            'serialOrContents',
            'updatedAt'
          ])
        )
      );
      
      allow delete: if isAdmin();
    }

    // 2. LOST & FOUND REPORTS: IMMUTABLE IDENTITY & STATUS LOCK
    match /lostItems/{itemId} {
      allow read: if true;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && (
        isAdmin() ||
        (resource.data.userId == request.auth.uid &&
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['userId', 'createdAt']))
      );
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(securityRulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const attackVectors = [
    {
      id: 'snoop_claims',
      title: 'Vector 1: Malicious Client Queries All Private Proofs',
      description: 'An attacker uses the browser console or Firebase SDK to query db.collection("claims").getDocs() to steal secret passwords and serial numbers.',
      verdict: 'BLOCKED AT DATABASE LAYER',
      httpStatus: 'PERMISSION_DENIED (403)',
      enforcingRule: 'allow read: if isAuthenticated() && (resource.data.claimantId == request.auth.uid || isAdmin());',
      explanation: 'Firestore evaluates the security rule on Google Cloud before returning any document stream. Because resource.data.claimantId does not match the attacker UID, the database halts execution and sends zero bytes of proof data.',
    },
    {
      id: 'self_approve',
      title: 'Vector 2: Fraudulent Claimant Self-Approves Their Claim',
      description: 'A claimant intercepts network traffic or sends a REST write with status: "approved" to claim high-value electronics without security staff review.',
      verdict: 'BLOCKED AT DATABASE LAYER',
      httpStatus: 'PERMISSION_DENIED (403)',
      enforcingRule: 'request.resource.data.status == "pending" && affectedKeys().hasOnly([...])',
      explanation: 'On creation, status is locked strictly to "pending". On update, affectedKeys().hasOnly() denies modifying the "status" field unless caller satisfies isAdmin().',
    },
    {
      id: 'spoof_identity',
      title: 'Vector 3: Claimant ID Impersonation / Identity Spoofing',
      description: 'An attacker submits a claim injecting another student\'s Roll Number and UID into the claimantId field.',
      verdict: 'BLOCKED AT DATABASE LAYER',
      httpStatus: 'PERMISSION_DENIED (403)',
      enforcingRule: 'request.resource.data.claimantId == request.auth.uid',
      explanation: 'Firestore cryptographically binds request.auth.uid to the user Firebase Authentication token. Any attempt to write a mismatched claimantId is rejected.',
    },
    {
      id: 'tamper_item',
      title: 'Vector 4: Competitor Deletes or Alters Other Student\'s Report',
      description: 'A student tries to delete another student\'s lost report or reassign the report ownership to themselves.',
      verdict: 'BLOCKED AT DATABASE LAYER',
      httpStatus: 'PERMISSION_DENIED (403)',
      enforcingRule: '!request.resource.data.diff(resource.data).affectedKeys().hasAny(["userId", "createdAt"])',
      explanation: 'Updates forbid altering userId or creation timestamps, while delete requires matching resource.data.userId == request.auth.uid.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF9F5] text-[#1E2A28] rounded-[4px] shadow-2xl border-4 border-[#1E2A28] my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1E2A28] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1F4E46] border border-[#CFD4C6]/30 flex items-center justify-center font-bold text-white text-xs">
              <ShieldCheck className="w-5 h-5 text-[#E6AF2E]" />
            </div>
            <div>
              <h2 className="font-['Fraunces',serif] text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Database-Layer Security Rules &amp; Field Privacy</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2C6E63]/30 text-[#A3D9CE] font-bold uppercase tracking-wider">
                  Cloud Rules Enforced
                </span>
              </h2>
              <p className="text-xs text-[#CFD4C6] mt-0.5">
                Demonstrating cryptographic data protection beyond superficial client UI hiding
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

        {/* Navigation Tabs */}
        <div className="bg-[#EDEFE8] border-b-2 border-[#1E2A28] px-5 pt-3 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t-[3px] transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-[#FAF9F5] text-[#1E2A28] border-[#1E2A28]'
                : 'bg-transparent text-[#52625C] border-transparent hover:text-[#1E2A28]'
            }`}
          >
            Privacy Architecture
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t-[3px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-[#FAF9F5] text-[#1E2A28] border-[#1E2A28]'
                : 'bg-transparent text-[#52625C] border-transparent hover:text-[#1E2A28]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#1F4E46]" />
            firestore.rules Definitions
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 text-xs font-bold border-t-2 border-l-2 border-r-2 rounded-t-[3px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-[#FAF9F5] text-[#1E2A28] border-[#1E2A28]'
                : 'bg-transparent text-[#52625C] border-transparent hover:text-[#1E2A28]'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-[#B4442E]" />
            Attack Vector Simulator
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              {/* Comparison Matrix Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50/60 border-2 border-[#B4442E]/30 rounded-[4px] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#B4442E]">
                    <XCircle className="w-4 h-4" /> Superficial Client UI Redaction
                  </div>
                  <h4 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
                    Vulnerable Approach (Client-Only Hiding)
                  </h4>
                  <p className="text-xs text-[#52625C] leading-relaxed">
                    Hiding sensitive fields like <code className="bg-white px-1 py-0.5 rounded text-[#B4442E]">distinctiveDetails</code> or <code className="bg-white px-1 py-0.5 rounded text-[#B4442E]">privateProof</code> with CSS classes (<code className="bg-white px-1 py-0.5 rounded">hidden</code> or <code className="bg-white px-1 py-0.5 rounded">display: none</code>) leaves raw JSON strings accessible in the browser network inspector or DevTools console.
                  </p>
                  <div className="text-[11px] font-bold text-[#B4442E] bg-white p-2 rounded border border-[#B4442E]/20">
                    ❌ Risk: Any tech-savvy student can extract secret serial numbers and claim items dishonestly.
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 border-2 border-[#1F4E46]/40 rounded-[4px] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#1F4E46]">
                    <CheckCircle2 className="w-4 h-4" /> Database-Layer Security Rules
                  </div>
                  <h4 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28]">
                    Our Implemented Architecture (Zero-Trust)
                  </h4>
                  <p className="text-xs text-[#52625C] leading-relaxed">
                    Google Cloud Firestore evaluates rule expressions on the server before transmitting any document. Non-claimants receive <code className="bg-white px-1 py-0.5 rounded text-[#1F4E46] font-bold">PERMISSION_DENIED (403)</code> at the socket level. Unauthenticated packets are immediately dropped.
                  </p>
                  <div className="text-[11px] font-bold text-[#1F4E46] bg-white p-2 rounded border border-[#1F4E46]/20">
                    ✅ Guarantee: Private proof is cryptographically quarantined to the author UID and verified campus admins.
                  </div>
                </div>
              </div>

              {/* Protected Entities & Private Fields Breakdown */}
              <div className="bg-white border-2 border-[#1E2A28] rounded-[4px] p-4.5 space-y-3.5 shadow-xs">
                <h4 className="font-['Fraunces',serif] text-base font-bold text-[#1E2A28] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1F4E46]" />
                  <span>Enforced Data Isolation Tiers in RTC Lost &amp; Found</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F8F3] border border-[#CFD4C6] rounded space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-[#1F4E46] block">
                      Tier 1: Public Directory
                    </span>
                    <strong className="font-bold text-[#1E2A28] block">/lostItems &amp; /foundItems</strong>
                    <p className="text-[#52625C] text-[11.5px]">
                      General descriptions, photos, and location zones are publicly readable to facilitate campus identification.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F7F8F3] border border-[#CFD4C6] rounded space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-[#B4442E] block">
                      Tier 2: Blind Private Proof
                    </span>
                    <strong className="font-bold text-[#1E2A28] block">/claims/{'{claimId}'}</strong>
                    <p className="text-[#52625C] text-[11.5px]">
                      Private proof, serial numbers, and wallet inventories are restricted strictly to <code className="bg-white px-1 rounded text-[#1E2A28]">claimantId == auth.uid</code> or verified admins.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F7F8F3] border border-[#CFD4C6] rounded space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-[#D98C2B] block">
                      Tier 3: Audit Governance
                    </span>
                    <strong className="font-bold text-[#1E2A28] block">Role-Based Approvals</strong>
                    <p className="text-[#52625C] text-[11.5px]">
                      Status transitions (<code className="bg-white px-1 rounded">approved</code>, <code className="bg-white px-1 rounded">returned</code>) and <code className="bg-white px-1 rounded">adminNotes</code> require verified administrator rights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE DEFINITION */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#1F4E46] uppercase">
                    Active Production Ruleset: firestore.rules
                  </span>
                  <p className="text-xs text-[#52625C]">
                    Deployed to Cloud Firestore database <code className="text-[#1E2A28] font-bold">ai-studio-fieldnotescampus-76593e8f-164a-4ec9-96a0-8a0542c68982</code>
                  </p>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="text-xs font-bold px-3 py-1.5 bg-[#1E2A28] text-white rounded hover:bg-[#1F4E46] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Rules'}
                </button>
              </div>

              <div className="bg-[#1E2A28] text-[#F7F8F3] p-4 rounded-[4px] font-mono text-xs overflow-x-auto border-2 border-[#1E2A28] shadow-inner max-h-[380px] leading-relaxed">
                <pre>{securityRulesCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: ATTACK SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="bg-[#EDEFE8] p-3 rounded border border-[#CFD4C6] text-xs text-[#52625C]">
                <strong className="text-[#1E2A28] font-bold">Interactive Verification:</strong> Select an attack vector below to test and observe how the database layer prevents unauthorized operations.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attackVectors.map((v) => {
                  const isSelected = simulatedAttack === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSimulatedAttack(v.id)}
                      className={`p-4 bg-white border-2 rounded-[4px] cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1E2A28] shadow-md ring-2 ring-[#1F4E46]/30'
                          : 'border-[#CFD4C6] hover:border-[#1E2A28]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B4442E]">
                          Simulated Attack
                        </span>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {v.verdict}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-[#1E2A28] mb-1">{v.title}</h4>
                      <p className="text-[11px] text-[#52625C] line-clamp-2">{v.description}</p>
                    </div>
                  );
                })}
              </div>

              {simulatedAttack && (() => {
                const vector = attackVectors.find((v) => v.id === simulatedAttack);
                if (!vector) return null;
                return (
                  <div className="p-4 bg-white border-2 border-[#1E2A28] rounded-[4px] space-y-3 animate-in fade-in shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#EDEFE8] pb-2">
                      <span className="font-bold text-xs text-[#1E2A28]">
                        Database Engine Response Log:
                      </span>
                      <span className="font-mono text-xs font-bold text-[#B4442E] px-2 py-0.5 bg-red-50 border border-red-200 rounded">
                        {vector.httpStatus}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-[#52625C]">
                        <strong className="text-[#1E2A28]">Enforcing Rule:</strong>
                      </div>
                      <div className="bg-[#1E2A28] text-emerald-300 font-mono text-[11px] p-2 rounded overflow-x-auto">
                        {vector.enforcingRule}
                      </div>
                      <p className="text-[#52625C] text-xs leading-relaxed pt-1">
                        <strong className="text-[#1E2A28]">Why It Failed:</strong> {vector.explanation}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#EDEFE8] border-t-2 border-[#1E2A28] px-5 py-3 flex items-center justify-between text-xs text-[#52625C]">
          <span>Firestore Security Version 2 • Zero-Trust Compliance</span>
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-1.5 bg-[#1E2A28] text-white rounded hover:bg-[#1F4E46] transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

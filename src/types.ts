export type ItemType = 'lost' | 'found';

export type ItemStatus =
  | 'open'
  | 'claim_pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'resolved';

export type ClaimStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'returned';

export type Department =
  | 'CSE'
  | 'CSE (AI & ML)'
  | 'CSE (Cyber Security)'
  | 'AI & Data Science'
  | 'IT'
  | 'ECE'
  | 'Biomedical Engineering'
  | 'Mechanical Engineering'
  | 'Agricultural Engineering'
  | 'Biotechnology'
  | 'Other';

export type YearOfStudy =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'Faculty / Staff';

export type UserRole = 'student' | 'faculty' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  department: Department;
  year: YearOfStudy;
  section: string;
  role: UserRole;
  photoURL?: string;
  createdAt: number;
}

export type Category =
  | 'Electronics'
  | 'Bags & Backpacks'
  | 'ID & Cards'
  | 'Keys'
  | 'Clothing'
  | 'Books & Stationery'
  | 'Accessories'
  | 'Watches & Jewellery'
  | 'Calculators & Lab Gear'
  | 'Other';

export type CampusLocation =
  | 'Main/Admin Block'
  | 'CSE / Computer Science area'
  | 'IT area'
  | 'ECE area'
  | 'Mechanical area'
  | 'Biomedical area'
  | 'AI & Data Science area'
  | 'Library'
  | 'Computer Labs'
  | 'Engineering Labs'
  | 'Auditorium'
  | 'Food Court / Canteen'
  | 'Hostel'
  | 'Girls Hostel'
  | 'Boys Hostel'
  | 'Sports Ground'
  | 'Basketball Court'
  | 'Volleyball Court'
  | 'Parking Area'
  | 'Entrance / Gate'
  | 'Transport Area'
  | 'Skill Centre'
  | 'RAISE / Innovation Centre'
  | 'Other';

export interface LostFoundItem {
  id: string;
  type: ItemType;
  title: string;
  category: Category;
  location: string;
  locationDetail?: string;
  date: string;
  time?: string;
  description: string;
  distinctiveDetails?: string; // for lost items
  keptAt?: string; // for found items
  contact?: string;
  contactName?: string;
  reward?: string;
  imageUrl?: string;
  status: ItemStatus;
  userId: string;
  userName: string;
  userEmail: string;
  userDept?: string;
  isDemo?: boolean;
  createdAt: number;
  tags?: string[];
}

export interface ClaimRecord {
  id: string;
  itemId: string;
  itemType: ItemType;
  itemTitle: string;
  itemLocation: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantDept: string;
  claimantYear: string;
  claimantSection: string;
  privateProof: string;
  uniqueMarks: string;
  serialOrContents: string;
  status: ClaimStatus;
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AiMatchResult {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostItemTitle?: string;
  foundItemTitle?: string;
  lostItemLocation?: string;
  foundItemLocation?: string;
  score: number;
  reasons: string[];
  mismatches: string[];
  recommendation: string;
  confidence: 'Low' | 'Medium' | 'High' | 'Very High';
  isAiPowered: boolean;
  isReviewed?: boolean;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string; // user UID or 'broadcast'
  title: string;
  message: string;
  type: 'match' | 'claim' | 'status' | 'announcement';
  linkId?: string;
  linkType?: 'item' | 'claim' | 'match';
  read: boolean;
  createdAt: number;
}

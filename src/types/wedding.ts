import type {
  RSVP_STATUSES,
  TABLE_SHAPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  VENDOR_STATUSES,
  WORKSPACE_ROLES,
} from "../constants/enums";

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type RsvpStatus = (typeof RSVP_STATUSES)[number];
export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export type TableShape = (typeof TABLE_SHAPES)[number];
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export type MemberStatus = "pending" | "active";
export type SyncState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface WeddingMeta {
  title: string;
  plannerName: string;
  partnerOne: string;
  partnerTwo: string;
  sideOneLabel: string;
  sideTwoLabel: string;
  weddingDate: string;
  venue: string;
  currency: string;
}

export interface Guest {
  id: string;
  name: string;
  side: string;
  phone: string;
  email: string;
  rsvp: RsvpStatus;
  notes: string;
}

export interface WeddingTable {
  id: string;
  name: string;
  capacity: number;
  guestIds: string[];
  shape: TableShape;
  x: number;
  y: number;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  owner: string;
  notes: string;
}

export interface BudgetItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  quote: number;
  status: VendorStatus;
  lastContact: string;
  nextStep: string;
  notes: string;
}

export interface WeddingData {
  meta: WeddingMeta;
  guests: Guest[];
  tables: WeddingTable[];
  tasks: Task[];
  budget: BudgetItem[];
  vendors: Vendor[];
}

export type WeddingDomain = keyof WeddingData;
// Resolves to: 'meta' | 'guests' | 'tables' | 'tasks' | 'budget' | 'vendors'

export const ALL_WEDDING_DOMAINS: WeddingDomain[] = ["meta", "guests", "tables", "tasks", "budget", "vendors"];

export interface WeddingMember {
  id: string;
  user_id: string | null;
  invited_email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  created_at: string;
  invited_by_user_id: string;
}

export interface WeddingStats {
  totalGuests: number;
  confirmedGuests: number;
  totalTables: number;
  openSeats: number;
  openTasks: number;
  tasksCompletion: number;
  rsvpCompletion: number;
  budgetPlanned: number;
  budgetLeft: number;
  currency: string;
  shortlistedVendors: number;
  bookedVendors: number;
  daysToWedding: number | null;
}

export interface CollapseSignal {
  mode: "collapse" | "expand" | null;
  seq: number;
}

export interface WorkspaceResult {
  weddingId: string;
  role: WorkspaceRole;
  updatedAt: string;
  data: WeddingData;
}

export interface ServerStatePayload {
  data: WeddingData;
  updatedAt: string;
}

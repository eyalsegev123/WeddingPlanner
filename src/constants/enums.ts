export const TASK_STATUSES = ["Open", "In Progress", "Blocked", "Done"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export const RSVP_STATUSES = ["Pending", "Yes", "No"] as const;
export const VENDOR_STATUSES = ["Researching", "Shortlisted", "Booked"] as const;
export const TABLE_SHAPES = ["round", "rect"] as const;
export const WORKSPACE_ROLES = ["owner", "editor"] as const;

export const BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photo/Video",
  "Music",
  "Flowers",
  "Attire",
  "Transport",
  "Other",
] as const;

export const VENDOR_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Video",
  "DJ/Band",
  "Florist",
  "Planner",
  "Decor",
  "Transportation",
  "Other",
] as const;

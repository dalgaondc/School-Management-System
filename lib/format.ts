export type ClassOption = {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
};

export function classLabel(c: {
  name: string;
  section: string | null;
  academic_year?: string;
}) {
  const base = c.section ? `${c.name} - ${c.section}` : c.name;
  return c.academic_year ? `${base} (${c.academic_year})` : base;
}

// Change this to your school's timezone (IANA name) so "today" is correct.
export const SCHOOL_TIMEZONE = "Asia/Kolkata";

// Returns today's date as YYYY-MM-DD in the school's timezone.
export function schoolToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

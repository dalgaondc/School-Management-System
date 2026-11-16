// Demo data seeder for the School Management System.
//
//   node --env-file=.env.local scripts/seed-demo.mjs            create demo data
//   node --env-file=.env.local scripts/seed-demo.mjs --reset    wipe the demo data, then recreate it
//   node scripts/seed-demo.mjs --dry                            preview counts only (no database needed)
//
// Uses SUPABASE_SECRET_KEY, so run it only on your own machine. Never ship this to the browser.

import { randomUUID } from "node:crypto";

const DRY = process.argv.includes("--dry");
const RESET = process.argv.includes("--reset");

const YEAR = "2026-27";
const TIMEZONE = "Asia/Kolkata"; // keep in sync with SCHOOL_TIMEZONE in lib/format.ts
const DEMO_PASSWORD = "Demo@12345";
const EMAIL_DOMAIN = "example.com";
const SCHOOL_DAYS = 20; // weekdays of attendance history, ending yesterday
const PER_CLASS = 12;

const SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "Computer Science",
  "Physical Education",
];

const CLASSES = [
  { name: "Grade 6", section: "A", classTeacher: "emily.carter" },
  { name: "Grade 6", section: "B", classTeacher: "james.wilson" },
  { name: "Grade 7", section: "A", classTeacher: "olivia.thompson" },
  { name: "Grade 8", section: "A", classTeacher: "michael.davies" },
];
const ALL = CLASSES.map((c) => `${c.name}|${c.section}`);

const TEACHERS = [
  { key: "emily.carter", name: "Emily Carter", teaches: { Mathematics: ["Grade 6|A", "Grade 6|B", "Grade 7|A"] } },
  { key: "james.wilson", name: "James Wilson", teaches: { English: ALL } },
  { key: "olivia.thompson", name: "Olivia Thompson", teaches: { Science: ALL } },
  { key: "daniel.roberts", name: "Daniel Roberts", teaches: { "Social Studies": ALL } },
  { key: "sophia.anderson", name: "Sophia Anderson", teaches: { "Computer Science": ["Grade 7|A", "Grade 8|A"] } },
  { key: "michael.davies", name: "Michael Davies", teaches: { Mathematics: ["Grade 8|A"], "Physical Education": ALL } },
];

const FIRST = [
  "Oliver", "Amelia", "Harry", "Isla", "George", "Ava", "Noah", "Mia", "Leo", "Emily",
  "Jack", "Grace", "Charlie", "Sophie", "Thomas", "Lily", "Oscar", "Ella", "William", "Freya",
  "Henry", "Chloe", "Samuel", "Ruby", "Alfie", "Poppy", "Archie", "Evie", "Joshua", "Daisy",
  "Edward", "Matilda", "Lucas", "Hannah", "Ethan", "Charlotte", "Max", "Phoebe", "Benjamin", "Alice",
  "Dylan", "Imogen", "Jacob", "Eleanor", "Finley", "Willow", "Ryan", "Scarlett",
];
const LAST = [
  "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright",
  "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke",
  "Harris", "Lewis", "Turner", "Hill", "Cooper", "Ward", "Morris", "Moore", "King", "Watson",
  "Baker", "Harrison", "Morgan", "Patel", "Young", "Allen", "Mitchell", "James", "Anderson", "Phillips",
  "Lee", "Bell", "Parker", "Davis", "Bennett", "Cook", "Murphy", "Shaw",
];
const GUARDIANS = [
  "David", "Sarah", "Andrew", "Rebecca", "Mark", "Laura", "Paul", "Karen", "Stephen", "Helen", "Peter", "Joanne",
];

// ---------- deterministic randomness (same data every run) ----------
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261116);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ---------- dates ----------
const addDays = (s, d) => {
  const dt = new Date(`${s}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
};
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const schoolDays = [];
for (let d = addDays(today, -1); schoolDays.length < SCHOOL_DAYS; d = addDays(d, -1)) {
  const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
  if (dow !== 0 && dow !== 6) schoolDays.push(d);
}
schoolDays.reverse();

// ---------- build all demo data in memory ----------
const classes = CLASSES.map((c) => ({
  id: randomUUID(), name: c.name, section: c.section, academic_year: YEAR,
  key: `${c.name}|${c.section}`, classTeacher: c.classTeacher,
}));

const students = [];
let n = 0;
for (const c of classes) {
  for (let r = 1; r <= PER_CLASS; r++) {
    const last = LAST[(n * 7 + 3) % LAST.length];
    students.push({
      id: randomUUID(),
      full_name: `${FIRST[n]} ${last}`,
      roll_no: String(r),
      class_id: c.id,
      guardian_name: `${GUARDIANS[(n * 5 + 1) % GUARDIANS.length]} ${last}`,
      guardian_phone: `+1 555 01${String(n).padStart(2, "0")}`,
      _classKey: c.key,
      _presentRate: rand() < 0.12 ? 0.75 : 0.93, // a few students miss more school
      _ability: 0.5 + 0.4 * rand(),
    });
    n++;
  }
}

const assignments = [];
for (const t of TEACHERS)
  for (const [subject, keys] of Object.entries(t.teaches))
    for (const key of keys) assignments.push({ teacherKey: t.key, classKey: key, subject });

const attendance = [];
for (const s of students) {
  const cls = classes.find((c) => c.key === s._classKey);
  for (const date of schoolDays) {
    let status = "present";
    if (rand() >= s._presentRate) {
      const q = rand();
      status = q < 0.5 ? "absent" : q < 0.8 ? "late" : "excused";
    }
    attendance.push({ student_id: s.id, class_id: cls.id, date, status, _markedBy: cls.classTeacher });
  }
}

const exams = [];
const grades = [];
for (const a of assignments) {
  if (a.subject === "Physical Education") continue; // no written exams
  const cls = classes.find((c) => c.key === a.classKey);
  const defs = [
    { name: "Unit Test 1", max: 20, graded: true },
    { name: "Midterm Exam", max: 50, graded: true },
  ];
  if (a.subject === "Mathematics") defs.push({ name: "Unit Test 2", max: 20, graded: false }); // left empty for the live demo

  for (const d of defs) {
    const exam = { id: randomUUID(), name: d.name, class_id: cls.id, _subject: a.subject, max_marks: d.max };
    exams.push(exam);
    if (!d.graded) continue;
    for (const s of students.filter((x) => x.class_id === cls.id)) {
      if (rand() < 0.04) continue; // absent on exam day, no mark
      const score = clamp(s._ability + (rand() - 0.5) * 0.2 + (rand() - 0.5) * 0.1, 0.25, 1);
      const raw = d.max * score;
      grades.push({
        exam_id: exam.id,
        student_id: s.id,
        marks: d.max === 50 ? Math.round(raw * 2) / 2 : Math.round(raw),
      });
    }
  }
}

const strip = (row) => Object.fromEntries(Object.entries(row).filter(([k]) => !k.startsWith("_")));

console.log(
  `Prepared: ${TEACHERS.length} teachers, ${SUBJECTS.length} subjects, ${classes.length} classes, ` +
    `${students.length} students, ${assignments.length} assignments, ${attendance.length} attendance rows ` +
    `(${schoolDays[0]} to ${schoolDays[schoolDays.length - 1]}), ${exams.length} exams, ${grades.length} marks.`
);
if (DRY) process.exit(0);

// ---------- write to Supabase ----------
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  console.error("Run: node --env-file=.env.local scripts/seed-demo.mjs");
  process.exit(1);
}
const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const fail = (label, error) => {
  console.error(`\nFailed at: ${label}\n${error.message}`);
  console.error("Fix the problem, then run again with --reset to start clean.");
  process.exit(1);
};
const ok = (label, res) => {
  if (res.error) fail(label, res.error);
  return res.data;
};
async function insertBatches(table, rows, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + size));
    if (error) fail(table, error);
  }
}

const emailOf = (k) => `${k}@${EMAIL_DOMAIN}`;
const demoEmails = new Set(TEACHERS.map((t) => emailOf(t.key)));

// 1. Look for existing demo data
const userList = ok("list users", await sb.auth.admin.listUsers({ perPage: 1000 }));
const existingUsers = userList.users.filter((u) => demoEmails.has(u.email));
const demoKeys = new Set(classes.map((c) => c.key));
const existingClasses = ok(
  "read classes",
  await sb.from("classes").select("id, name, section").eq("academic_year", YEAR)
).filter((c) => demoKeys.has(`${c.name}|${c.section}`));

if ((existingUsers.length || existingClasses.length) && !RESET) {
  console.error("Demo data already exists (demo teachers or Grade 6/7/8 classes for " + YEAR + ").");
  console.error("Run again with --reset to delete it and recreate it.");
  console.error("Note: --reset also deletes any students, exams and marks in those classes.");
  process.exit(1);
}

// 2. Reset
if (RESET) {
  console.log("Removing existing demo data...");
  for (const u of existingUsers) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    if (error) fail(`delete user ${u.email}`, error);
  }
  if (existingClasses.length) {
    const ids = existingClasses.map((c) => c.id);
    ok("delete students", await sb.from("students").delete().in("class_id", ids));
    ok("delete classes", await sb.from("classes").delete().in("id", ids));
  }
}

// 3. Subjects (reuses any that already exist)
const subjectRows = ok(
  "subjects",
  await sb.from("subjects").upsert(SUBJECTS.map((name) => ({ name })), { onConflict: "name" }).select("id, name")
);
const subjectId = Object.fromEntries(subjectRows.map((s) => [s.name, s.id]));
console.log(`Subjects ready (${subjectRows.length}).`);

// 4. Teachers (login + profile)
const teacherId = {};
for (const t of TEACHERS) {
  const { data, error } = await sb.auth.admin.createUser({
    email: emailOf(t.key), password: DEMO_PASSWORD, email_confirm: true,
  });
  if (error || !data.user) fail(`create teacher ${t.name}`, error ?? new Error("no user returned"));
  const res = await sb.from("profiles").insert({ id: data.user.id, full_name: t.name, role: "teacher" });
  if (res.error) fail(`profile for ${t.name}`, res.error);
  teacherId[t.key] = data.user.id;
}
console.log(`Teachers created (${TEACHERS.length}).`);

// 5. Classes and students
await insertBatches("classes", classes.map(({ id, name, section, academic_year }) => ({ id, name, section, academic_year })));
await insertBatches("students", students.map(strip));
console.log(`Classes (${classes.length}) and students (${students.length}) created.`);

// 6. Teacher assignments
const classIdByKey = Object.fromEntries(classes.map((c) => [c.key, c.id]));
await insertBatches(
  "teacher_assignments",
  assignments.map((a) => ({
    teacher_id: teacherId[a.teacherKey],
    class_id: classIdByKey[a.classKey],
    subject_id: subjectId[a.subject],
  }))
);
console.log(`Assignments created (${assignments.length}).`);

// 7. Attendance
await insertBatches(
  "attendance",
  attendance.map((r) => ({ ...strip(r), marked_by: teacherId[r._markedBy] }))
);
console.log(`Attendance created (${attendance.length} rows).`);

// 8. Exams and marks
await insertBatches(
  "exams",
  exams.map((e) => ({ ...strip(e), subject_id: subjectId[e._subject] }))
);
await insertBatches("grades", grades);
console.log(`Exams (${exams.length}) and marks (${grades.length}) created.`);

console.log("\nDone. Demo teacher logins (password for all: " + DEMO_PASSWORD + "):");
for (const t of TEACHERS) console.log(`  ${t.name.padEnd(18)} ${emailOf(t.key)}`);

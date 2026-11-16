// Gives every teacher who has NO class assignments some classes, so their dashboard is not empty.
//
//   node --env-file=.env.local scripts/assign-teachers.mjs
//
// Teachers who already have assignments are left alone. Safe to run more than once.

const SUBJECT_ROTATION = ["Mathematics", "English", "Science", "Social Studies"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  console.error("Run: node --env-file=.env.local scripts/assign-teachers.mjs");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const must = (label, res) => {
  if (res.error) {
    console.error(`Failed at: ${label}\n${res.error.message}`);
    process.exit(1);
  }
  return res.data;
};

const teachers = must("read teachers", await sb.from("profiles").select("id, full_name").eq("role", "teacher"));
const existing = must("read assignments", await sb.from("teacher_assignments").select("teacher_id"));
const hasAssignments = new Set(existing.map((a) => a.teacher_id));
const unassigned = teachers.filter((t) => !hasAssignments.has(t.id));

if (unassigned.length === 0) {
  console.log("Every teacher already has at least one class. Nothing to do.");
  process.exit(0);
}

const classes = must("read classes", await sb.from("classes").select("id, name, section"));
if (classes.length === 0) {
  console.error("There are no classes yet. Run the demo seed first.");
  process.exit(1);
}

const subjects = must(
  "read subjects",
  await sb.from("subjects").select("id, name").in("name", SUBJECT_ROTATION)
);
const subjectByName = Object.fromEntries(subjects.map((s) => [s.name, s.id]));
const available = SUBJECT_ROTATION.filter((n) => subjectByName[n]);
if (available.length === 0) {
  console.error("None of the expected subjects exist (Mathematics, English, Science, Social Studies).");
  process.exit(1);
}

const users = must("read logins", await sb.auth.admin.listUsers({ perPage: 1000 }));
const emailById = new Map(users.users.map((u) => [u.id, u.email]));

const rows = [];
unassigned.forEach((t, i) => {
  const subject = available[i % available.length];
  for (const c of classes) {
    rows.push({ teacher_id: t.id, class_id: c.id, subject_id: subjectByName[subject] });
  }
  console.log(`${t.full_name} (${emailById.get(t.id) ?? "no email"}) -> ${subject}, ${classes.length} classes`);
});

must(
  "create assignments",
  await sb.from("teacher_assignments").upsert(rows, {
    onConflict: "teacher_id,class_id,subject_id",
    ignoreDuplicates: true,
  })
);

console.log(`\nDone. Created ${rows.length} assignments. Refresh the teacher page.`);

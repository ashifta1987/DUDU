import { createHash } from "node:crypto";
import { PROMPTS_V1 } from "./prompts";
import { FRACTIONS_CLASS5 } from "./quiz-fractions";

/* ──────────────────────────────────────────────────────────────────────────
 * Pure, deterministic seed data. No I/O — the same builder feeds Supabase
 * (scripts/seed.ts) and the PGlite seed test. Times are relative to `now`.
 * ────────────────────────────────────────────────────────────────────────── */

export type Row = Record<string, unknown>;

export interface SeedUser {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: "parent" | "owner" | "ops" | "content" | "support";
  city?: string;
  locale?: "en" | "ml" | "hi";
}

export interface SeedDevice {
  id: string;
  serial: string;
  model: string;
}

export interface SeedTable {
  table: string;
  rows: Row[];
  /** conflict target for idempotent upserts (default "id") */
  onConflict?: string;
}

export interface SeedData {
  users: SeedUser[];
  devices: SeedDevice[];
  /** in insert order */
  tables: SeedTable[];
  pairing: { serial: string; code6: string; qr_token: string };
}

/** Deterministic UUID (v4 layout) from a stable name, so re-seeding is idempotent. */
export function seedId(name: string): string {
  const h = createHash("sha256").update(`dudu-seed:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** A Date at IST wall-clock `hhmm` on (today − daysAgo). */
export function istAt(now: Date, daysAgo: number, hhmm: string): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  const utc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysAgo, h, m);
  return new Date(utc - IST_OFFSET_MS);
}

export function istDate(now: Date, daysAgo = 0): string {
  return istAt(now, daysAgo, "12:00").toISOString().slice(0, 10);
}

const iso = (d: Date) => d.toISOString();
const addMin = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);

export function buildSeed(opts: {
  now?: Date;
  ownerEmail?: string;
  deviceSecretHashes: Record<string, string>;
}): SeedData {
  const now = opts.now ?? new Date();
  const rand = mulberry32(20261119);

  // ── Users ──────────────────────────────────────────────────────────────
  const owner: SeedUser = {
    id: seedId("user:owner"),
    email: opts.ownerEmail ?? "owner@dudu.local",
    full_name: "DuDu Owner",
    role: "owner",
    city: "Kochi",
  };
  const p1: SeedUser = {
    id: seedId("user:menon"),
    email: "anjali.menon@dudu.local",
    phone: "+919800000001",
    full_name: "Anjali Menon",
    role: "parent",
    city: "Kochi",
    locale: "en",
  };
  const p1g: SeedUser = {
    id: seedId("user:menon-guardian"),
    email: "rahul.menon@dudu.local",
    phone: "+919800000011",
    full_name: "Rahul Menon",
    role: "parent",
    city: "Kochi",
    locale: "ml",
  };
  const p2: SeedUser = {
    id: seedId("user:sharma"),
    email: "priya.sharma@dudu.local",
    phone: "+919800000002",
    full_name: "Priya Sharma",
    role: "parent",
    city: "Bengaluru",
    locale: "hi",
  };
  const p3: SeedUser = {
    id: seedId("user:nair"),
    email: "sreeja.nair@dudu.local",
    phone: "+919800000003",
    full_name: "Sreeja Nair",
    role: "parent",
    city: "Thiruvananthapuram",
    locale: "ml",
  };
  const users = [owner, p1, p1g, p2, p3];

  // ── Families & children ────────────────────────────────────────────────
  const F = {
    menon: seedId("family:menon"),
    sharma: seedId("family:sharma"),
    nair: seedId("family:nair"),
  };
  const C = {
    aarav: seedId("child:aarav"),
    diya: seedId("child:diya"),
    kabir: seedId("child:kabir"),
    meera: seedId("child:meera"),
  };
  const D = {
    d1: seedId("device:DB-01"),
    d2: seedId("device:DB-02"),
    d3: seedId("device:DB-03"),
    d4: seedId("device:DB-04"),
  };

  const families: Row[] = [
    {
      id: F.menon,
      name: "Menon family",
      owner_user_id: p1.id,
      plan: "plus",
      plan_renews_at: iso(istAt(now, -18, "00:00")),
      trial_ends_at: iso(istAt(now, 40, "00:00")),
      whatsapp_opt_in: true,
    },
    {
      id: F.sharma,
      name: "Sharma family",
      owner_user_id: p2.id,
      plan: "basic",
      plan_renews_at: iso(istAt(now, -9, "00:00")),
      trial_ends_at: iso(istAt(now, 25, "00:00")),
      whatsapp_opt_in: true,
    },
    {
      id: F.nair,
      name: "Nair family",
      owner_user_id: p3.id,
      plan: "trial",
      trial_ends_at: iso(istAt(now, -2, "23:59")),
      whatsapp_opt_in: false,
    },
  ];

  const children: Row[] = [
    {
      id: C.aarav,
      family_id: F.menon,
      first_name: "Aarav",
      class: 5,
      board: "cbse",
      languages: ["en", "ml"],
      avatar_color: "#F26B1D",
      fun_daily_limit_min: 45,
      quiet_hours_start: "21:00",
      quiet_hours_end: "07:00",
    },
    {
      id: C.diya,
      family_id: F.menon,
      first_name: "Diya",
      class: 2,
      board: "cbse",
      languages: ["en", "ml"],
      avatar_color: "#1E6FE0",
      fun_daily_limit_min: 30,
      quiet_hours_start: "20:30",
      quiet_hours_end: "07:00",
    },
    {
      id: C.kabir,
      family_id: F.sharma,
      first_name: "Kabir",
      class: 7,
      board: "cbse",
      languages: ["en", "hi"],
      avatar_color: "#17A34A",
      fun_daily_limit_min: 60,
      quiet_hours_start: "22:00",
      quiet_hours_end: "06:30",
    },
    {
      id: C.meera,
      family_id: F.nair,
      first_name: "Meera",
      class: 3,
      board: "scert",
      languages: ["ml", "en"],
      avatar_color: "#8B6CF0",
      fun_daily_limit_min: 45,
      quiet_hours_start: "21:00",
      quiet_hours_end: "07:00",
    },
  ];

  // ── Devices (one per model) ────────────────────────────────────────────
  const hash = (serial: string) => {
    const h = opts.deviceSecretHashes[serial];
    if (!h) throw new Error(`missing device secret hash for ${serial}`);
    return h;
  };
  const devicesRows: Row[] = [
    {
      id: D.d1,
      serial: "DB01-2611-0001",
      model: "DB-01",
      family_id: F.menon,
      child_id: C.aarav,
      firmware: "1.4.2",
      firmware_channel: "stable",
      status: "online",
      last_seen_at: iso(addMin(now, -1)),
      battery_pct: 82,
      wifi_rssi: -54,
      volume_pct: 60,
      mode: "study",
      device_secret_hash: hash("DB01-2611-0001"),
    },
    {
      id: D.d2,
      serial: "DB02-2611-0002",
      model: "DB-02",
      family_id: F.sharma,
      child_id: C.kabir,
      firmware: "1.5.0-rc1",
      firmware_channel: "rc",
      status: "sleeping",
      last_seen_at: iso(addMin(now, -95)),
      battery_pct: 47,
      wifi_rssi: -67,
      volume_pct: 45,
      mode: "fun",
      device_secret_hash: hash("DB02-2611-0002"),
    },
    {
      id: D.d3,
      serial: "DB03-2611-0003",
      model: "DB-03",
      family_id: F.nair,
      child_id: C.meera,
      firmware: "1.4.2",
      firmware_channel: "stable",
      status: "offline",
      last_seen_at: iso(addMin(now, -60 * 50)),
      battery_pct: 12,
      wifi_rssi: -81,
      volume_pct: 70,
      mode: "study",
      device_secret_hash: hash("DB03-2611-0003"),
    },
    {
      id: D.d4,
      serial: "DB04-2611-0004",
      model: "DB-04",
      family_id: null,
      child_id: null,
      firmware: "1.4.2",
      firmware_channel: "stable",
      status: "provisioned",
      last_seen_at: null,
      battery_pct: 100,
      wifi_rssi: null,
      volume_pct: 60,
      mode: "study",
      device_secret_hash: hash("DB04-2611-0004"),
    },
  ];
  const pairing = {
    serial: "DB04-2611-0004",
    code6: "246810",
    qr_token: "dudu-dev-qr-db04-246810",
  };

  // ── Routine ────────────────────────────────────────────────────────────
  const weekdays = [1, 2, 3, 4, 5];
  const sched = (
    child: string,
    days: number[],
    start: string,
    end: string,
    subject: string,
    mode: "study" | "fun" = "study",
  ) =>
    days.map((weekday) => ({
      id: seedId(`sched:${child}:${weekday}:${start}`),
      child_id: child,
      weekday,
      start_time: start,
      end_time: end,
      subject,
      mode,
    }));
  const schedules: Row[] = [
    ...sched(C.aarav, weekdays, "16:30", "17:15", "Maths"),
    ...sched(C.aarav, weekdays, "17:15", "17:45", "English"),
    ...sched(C.aarav, [1, 3, 5], "17:45", "18:15", "EVS"),
    ...sched(C.aarav, weekdays, "18:30", "19:00", "Story time", "fun"),
    ...sched(C.aarav, [6], "10:00", "11:00", "Maths revision"),
    ...sched(C.aarav, [0], "17:00", "17:45", "Games", "fun"),
    ...sched(C.diya, weekdays, "16:00", "16:30", "Reading"),
    ...sched(C.diya, weekdays, "16:30", "17:00", "Rhymes", "fun"),
    ...sched(C.kabir, weekdays, "17:00", "18:00", "Maths"),
    ...sched(C.kabir, weekdays, "18:00", "18:45", "Science"),
    ...sched(C.kabir, [6, 0], "11:00", "12:00", "Hindi"),
    ...sched(C.meera, weekdays, "16:00", "16:45", "Malayalam"),
    ...sched(C.meera, weekdays, "16:45", "17:15", "Maths"),
  ];

  const reminders: Row[] = [
    {
      id: seedId("rem:aarav:water"),
      child_id: C.aarav,
      title: "Drink a glass of water",
      time: "17:00",
      repeat: "daily",
      days: [],
      enabled: true,
    },
    {
      id: seedId("rem:aarav:bag"),
      child_id: C.aarav,
      title: "Pack your school bag",
      time: "20:30",
      repeat: "weekdays",
      days: [],
      enabled: true,
    },
    {
      id: seedId("rem:aarav:piano"),
      child_id: C.aarav,
      title: "Piano class",
      time: "18:00",
      repeat: "custom",
      days: [2, 4],
      enabled: true,
    },
    {
      id: seedId("rem:aarav:dentist"),
      child_id: C.aarav,
      title: "Dentist visit at 11",
      time: "10:15",
      repeat: "once",
      days: [],
      once_on: istDate(now, -2),
      enabled: true,
    },
    {
      id: seedId("rem:diya:teeth"),
      child_id: C.diya,
      title: "Brush your teeth",
      time: "20:15",
      repeat: "daily",
      days: [],
      enabled: true,
    },
    {
      id: seedId("rem:kabir:revise"),
      child_id: C.kabir,
      title: "Revise Science chapter",
      time: "19:00",
      repeat: "weekdays",
      days: [],
      enabled: true,
    },
    {
      id: seedId("rem:kabir:cricket"),
      child_id: C.kabir,
      title: "Cricket practice",
      time: "06:45",
      repeat: "custom",
      days: [6, 0],
      enabled: false,
    },
    {
      id: seedId("rem:meera:hw"),
      child_id: C.meera,
      title: "Homework time",
      time: "16:00",
      repeat: "weekdays",
      days: [],
      enabled: true,
    },
  ];

  // ── Sessions with minute presence buckets (last 7 days) ────────────────
  const sessions: Row[] = [];
  const studyKids: [string, string, string][] = [
    [C.aarav, D.d1, "16:30"],
    [C.kabir, D.d2, "17:00"],
    [C.meera, D.d3, "16:00"],
  ];
  for (const [child, device, start] of studyKids) {
    for (let day = 0; day < 7; day++) {
      if (device === D.d3 && day < 2) continue; // Meera's device has been offline for 2 days
      const startedAt = istAt(now, day, start);
      if (startedAt > now) continue;
      const length = 35 + Math.floor(rand() * 25);
      const endedAt = addMin(startedAt, length);
      const presence = Array.from({ length }, (_, i) => ({
        t: iso(addMin(startedAt, i)),
        at_desk: !(i > 10 && i < 10 + Math.floor(rand() * 6)) && rand() > 0.06,
      }));
      sessions.push({
        id: seedId(`session:${child}:${day}`),
        device_id: device,
        child_id: child,
        mode: "study",
        started_at: iso(startedAt),
        ended_at: endedAt > now ? null : iso(endedAt),
        presence_json: presence,
        focus_minutes: presence.filter((p) => p.at_desk).length,
      });
    }
  }

  // ── Conversations & turns ──────────────────────────────────────────────
  const conversations: Row[] = [];
  const turns: Row[] = [];
  const safetyReviews: Row[] = [];
  type Line = [role: "child" | "dudu", text: string, face?: string, flag?: string];
  const script = (
    key: string,
    child: string,
    device: string,
    mode: "study" | "fun",
    startedAt: Date,
    lang: string,
    lines: Line[],
  ) => {
    const convId = seedId(`conv:${key}`);
    conversations.push({
      id: convId,
      child_id: child,
      device_id: device,
      mode,
      started_at: iso(startedAt),
    });
    lines.forEach(([role, text, face, flag], i) => {
      const isDudu = role === "dudu";
      const tokensIn = isDudu ? 380 + Math.floor(rand() * 220) : 0;
      const tokensOut = isDudu ? 40 + Math.floor(rand() * 60) : 0;
      const id = seedId(`turn:${key}:${i}`);
      turns.push({
        id,
        conversation_id: convId,
        role,
        text,
        lang,
        face_state: face ?? (isDudu ? "talking" : "listening"),
        latency_ms: isDudu ? 900 + Math.floor(rand() * 900) : null,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_inr: isDudu
          ? Number((tokensIn * 0.00003 + tokensOut * 0.00025 + 0.02).toFixed(4))
          : 0.01,
        safety_flag: flag ?? "none",
        created_at: iso(new Date(startedAt.getTime() + i * 20_000)),
      });
      if (flag === "review") {
        safetyReviews.push({
          id: seedId(`review:${key}:${i}`),
          turn_id: id,
          category: "personal-info request",
          severity: "medium",
          status: "open",
        });
      }
      if (flag === "softened") {
        safetyReviews.push({
          id: seedId(`review:${key}:${i}`),
          turn_id: id,
          category: "violence",
          severity: "low",
          status: "reviewed",
          decision: "reply_ok",
          reviewer_id: owner.id,
          note: "Cartoon context, soft reply was fine.",
        });
      }
    });
  };
  script("aarav-fractions", C.aarav, D.d1, "study", istAt(now, 0, "16:35"), "en", [
    ["child", "Hey DuDu, how do I add one half and one quarter?"],
    [
      "dudu",
      "Good question! First make the bottoms the same. One half is the same as two quarters. What do you get when you add two quarters and one quarter?",
      "question",
    ],
    ["child", "Three quarters!"],
    ["dudu", "Yes! Three quarters. You did it step by step.", "correct"],
  ]);
  script("aarav-plants", C.aarav, D.d1, "study", istAt(now, 1, "17:50"), "en", [
    ["child", "Why are leaves green?"],
    [
      "dudu",
      "Leaves have a green helper called chlorophyll. It catches sunlight to make food for the plant. Can you guess what else a plant needs to make food?",
      "thinking",
    ],
    ["child", "Water?"],
    ["dudu", "Correct — water, sunlight and air. Great thinking!", "proud"],
  ]);
  script("aarav-story", C.aarav, D.d1, "fun", istAt(now, 1, "18:35"), "ml", [
    ["child", "DuDu, oru kadha parayamo?"],
    ["dudu", "Theerchayayum! Oru kochu aanakuttiyude kadha kelkkam…", "story"],
  ]);
  script("aarav-address", C.aarav, D.d1, "fun", istAt(now, 2, "18:40"), "en", [
    ["child", "Can I tell you my home address and phone number?"],
    [
      "dudu",
      "Let's keep that private — only grown-ups at home need it. Want to hear a riddle instead?",
      "shy",
      "review",
    ],
  ]);
  script("kabir-equations", C.kabir, D.d2, "study", istAt(now, 0, "17:10"), "hi", [
    ["child", "x plus 5 equals 12, x kya hai?"],
    ["dudu", "Chalo saath mein sochte hain. Dono taraf se 5 ghatao toh kya bachega?", "question"],
    ["child", "x equals 7"],
    ["dudu", "Bilkul sahi! Shabash Kabir.", "correct"],
  ]);
  script("kabir-game", C.kabir, D.d2, "fun", istAt(now, 1, "19:20"), "en", [
    ["child", "Tell me about the fight in the cartoon where the robot smashes everything"],
    [
      "dudu",
      "Robots in cartoons can be silly! Shall we invent a robot that cleans rooms instead?",
      "laugh",
      "softened",
    ],
  ]);
  script("meera-aksharam", C.meera, D.d3, "study", istAt(now, 3, "16:10"), "ml", [
    ["child", "'Ka' ezhuthunnathu engane?"],
    [
      "dudu",
      "Aadyam oru cheriya vattam, pinne thazhekku oru vara. Nammal onnichu ezhuthi nokkam?",
      "focus",
    ],
  ]);
  for (let day = 2; day < 7; day++) {
    script(
      `aarav-daily-${day}`,
      C.aarav,
      D.d1,
      day % 2 ? "fun" : "study",
      istAt(now, day, "17:05"),
      "en",
      [
        ["child", day % 2 ? "Tell me a joke!" : "What is 7 times 8?"],
        [
          "dudu",
          day % 2
            ? "Why did the mango go to school? To become a little smarter-mango!"
            : "Let's count in eights together: 8, 16, 24… what comes after 48?",
          day % 2 ? "laugh" : "counting",
        ],
      ],
    );
  }

  // ── Learning ───────────────────────────────────────────────────────────
  const hw = (
    key: string,
    child: string,
    family: string,
    daysAgo: number,
    subject: string,
    title: string,
    result: string,
    score: string | null,
    explanation: string,
  ): Row => ({
    id: seedId(`hw:${key}`),
    child_id: child,
    subject,
    title,
    photo_paths: [`${family}/${child}/${seedId(`hw:${key}`)}/1.jpg`],
    explanation_text: explanation,
    explanation_audio_path: null,
    result,
    score,
    created_at: iso(istAt(now, daysAgo, "17:20")),
  });
  const homework: Row[] = [
    hw(
      "aarav-frac",
      C.aarav,
      F.menon,
      0,
      "Maths",
      "Adding fractions with unlike denominators",
      "correct",
      "4/5",
      "You changed each fraction to the same denominator before adding — great. In Q3, 2/3 + 1/6: 2/3 is 4/6, so the answer is 5/6.",
    ),
    hw(
      "aarav-opp",
      C.aarav,
      F.menon,
      1,
      "English",
      "Opposites worksheet",
      "partial",
      "7/10",
      "Most opposites are right! 'Ancient' is the opposite of 'modern', and 'generous' is the opposite of 'selfish'. Try those two again.",
    ),
    hw(
      "aarav-plant",
      C.aarav,
      F.menon,
      2,
      "EVS",
      "Parts of a plant",
      "explained",
      null,
      "Roots hold the plant and drink water, the stem carries water up, and leaves make food using sunlight.",
    ),
    hw(
      "aarav-dec",
      C.aarav,
      F.menon,
      4,
      "Maths",
      "Decimals on a number line",
      "retry",
      "2/5",
      "Remember: 0.5 is exactly half-way between 0 and 1. Let's mark 0.2 and 0.7 again together.",
    ),
    hw(
      "diya-words",
      C.diya,
      F.menon,
      1,
      "English",
      "Three-letter words",
      "correct",
      "10/10",
      "Lovely reading! You read cat, sun, pen and bus perfectly.",
    ),
    hw(
      "kabir-eq",
      C.kabir,
      F.sharma,
      0,
      "Maths",
      "Simple linear equations",
      "retry",
      "3/6",
      "When you move a number to the other side, its sign changes. In 2x − 4 = 10, add 4 to both sides first.",
    ),
    hw(
      "kabir-sci",
      C.kabir,
      F.sharma,
      3,
      "Science",
      "Acids, bases and salts",
      "correct",
      "8/8",
      "All correct — lemon juice is an acid and soap solution is a base.",
    ),
    hw(
      "meera-ml",
      C.meera,
      F.nair,
      3,
      "Malayalam",
      "Aksharangal — ka, kha, ga",
      "correct",
      null,
      "Ellaam nannayi ezhuthi! 'Ga' yude vaalu kurachu koodi neettam.",
    ),
  ];

  const quizzes: Row[] = [
    {
      id: seedId("quiz:aarav:1"),
      child_id: C.aarav,
      topic: "Fractions",
      questions_json: FRACTIONS_CLASS5.slice(0, 10).map((q, i) => ({
        id: q.id,
        picked: i === 3 || i === 7 ? (q.answer + 1) % 4 : q.answer,
        correct: !(i === 3 || i === 7),
      })),
      score: 8,
      max_score: 10,
      stars_earned: 3,
      taken_at: iso(istAt(now, 0, "17:40")),
    },
    {
      id: seedId("quiz:aarav:2"),
      child_id: C.aarav,
      topic: "Fractions",
      questions_json: FRACTIONS_CLASS5.slice(10, 20).map((q, i) => ({
        id: q.id,
        picked: i < 4 ? (q.answer + 1) % 4 : q.answer,
        correct: i >= 4,
      })),
      score: 6,
      max_score: 10,
      stars_earned: 2,
      taken_at: iso(istAt(now, 3, "17:30")),
    },
    {
      id: seedId("quiz:aarav:3"),
      child_id: C.aarav,
      topic: "Plants",
      questions_json: [],
      score: 5,
      max_score: 5,
      stars_earned: 3,
      taken_at: iso(istAt(now, 5, "18:00")),
    },
    {
      id: seedId("quiz:diya:1"),
      child_id: C.diya,
      topic: "Shapes",
      questions_json: [],
      score: 4,
      max_score: 5,
      stars_earned: 2,
      taken_at: iso(istAt(now, 1, "16:45")),
    },
    {
      id: seedId("quiz:kabir:1"),
      child_id: C.kabir,
      topic: "Integers",
      questions_json: [],
      score: 7,
      max_score: 10,
      stars_earned: 2,
      taken_at: iso(istAt(now, 2, "18:20")),
    },
    {
      id: seedId("quiz:meera:1"),
      child_id: C.meera,
      topic: "Addition",
      questions_json: [],
      score: 9,
      max_score: 10,
      stars_earned: 3,
      taken_at: iso(istAt(now, 3, "16:50")),
    },
  ];

  const childStats: Row[] = [
    {
      id: seedId("stats:aarav"),
      child_id: C.aarav,
      stars: 128,
      streak_days: 6,
      badges: ["fraction-friend", "early-bird", "bookworm", "curious-mind"],
      last_active_date: istDate(now),
    },
    {
      id: seedId("stats:diya"),
      child_id: C.diya,
      stars: 41,
      streak_days: 3,
      badges: ["first-quiz", "rhyme-star"],
      last_active_date: istDate(now, 1),
    },
    {
      id: seedId("stats:kabir"),
      child_id: C.kabir,
      stars: 212,
      streak_days: 11,
      badges: ["equation-ace", "science-explorer", "ten-day-streak"],
      last_active_date: istDate(now),
    },
    {
      id: seedId("stats:meera"),
      child_id: C.meera,
      stars: 37,
      streak_days: 0,
      badges: ["first-quiz"],
      last_active_date: istDate(now, 3),
    },
  ];

  const snapshots: Row[] = [
    {
      id: seedId("snap:aarav:1"),
      device_id: D.d1,
      requested_by: p1.id,
      photo_path: `${F.menon}/${D.d1}/${seedId("snap:aarav:1")}.jpg`,
      announced: true,
      created_at: iso(istAt(now, 1, "17:05")),
      expires_at: iso(istAt(now, -6, "17:05")),
    },
    {
      id: seedId("snap:aarav:2"),
      device_id: D.d1,
      requested_by: p1g.id,
      photo_path: `${F.menon}/${D.d1}/${seedId("snap:aarav:2")}.jpg`,
      announced: true,
      created_at: iso(istAt(now, 3, "16:50")),
      expires_at: iso(istAt(now, -4, "16:50")),
    },
  ];

  // ── Content & AI configuration ─────────────────────────────────────────
  const contentPacks: Row[] = [
    {
      id: seedId("pack:cbse:5"),
      board: "cbse",
      class: 5,
      subjects: ["Maths", "English", "EVS"],
      status: "live",
      quiz_bank_count: FRACTIONS_CLASS5.length,
      chapters_json: [
        {
          id: "m5-01",
          subject: "Maths",
          title: "The Fish Tale",
          topics: ["large numbers", "estimation"],
          quiz_bank: [],
        },
        {
          id: "m5-04",
          subject: "Maths",
          title: "Parts and Wholes",
          topics: ["fractions", "equivalent fractions", "adding fractions"],
          quiz_bank: FRACTIONS_CLASS5,
        },
        {
          id: "m5-10",
          subject: "Maths",
          title: "Tenths and Hundredths",
          topics: ["decimals"],
          quiz_bank: [],
        },
        {
          id: "e5-01",
          subject: "English",
          title: "Ice-cream Man",
          topics: ["poem", "rhyming words"],
          quiz_bank: [],
        },
        {
          id: "e5-04",
          subject: "English",
          title: "Team Work",
          topics: ["opposites", "comprehension"],
          quiz_bank: [],
        },
        {
          id: "v5-03",
          subject: "EVS",
          title: "From Tasting to Digesting",
          topics: ["taste", "digestion"],
          quiz_bank: [],
        },
        {
          id: "v5-06",
          subject: "EVS",
          title: "Every Drop Counts",
          topics: ["water", "conservation"],
          quiz_bank: [],
        },
      ],
    },
  ];

  const prompts: Row[] = (Object.keys(PROMPTS_V1) as (keyof typeof PROMPTS_V1)[]).map((key) => ({
    id: seedId(`prompt:${key}:1`),
    key,
    version: 1,
    body: PROMPTS_V1[key],
    status: "live",
    published_by: owner.id,
    published_at: iso(istAt(now, 7, "10:00")),
  }));

  // NOTE: model IDs are data — verify/adjust in Admin → Content → Model routing.
  const route = (
    task: string,
    provider: string,
    model: string,
    priority: number,
    lang: string | null = null,
    config: Row = {},
  ): Row => ({
    id: seedId(`route:${task}:${provider}:${model}:${lang ?? "*"}`),
    task,
    provider,
    model,
    lang,
    priority,
    is_active: true,
    config_json: config,
  });
  const modelRoutes: Row[] = [
    route("stt", "sarvam", "saarika:v2.5", 1, "en", { language_code: "en-IN" }),
    route("stt", "sarvam", "saarika:v2.5", 1, "ml", { language_code: "ml-IN" }),
    route("stt", "sarvam", "saarika:v2.5", 1, "hi", { language_code: "hi-IN" }),
    route("stt", "google", "latest_short", 2, null, {
      languages: { en: "en-IN", ml: "ml-IN", hi: "hi-IN" },
    }),
    route("tutor", "google", "gemini-flash-latest", 1),
    route("tutor", "openai", "gpt-4o-mini", 2),
    route("fun", "google", "gemini-flash-lite-latest", 1),
    route("fun", "openai", "gpt-4o-mini", 2),
    route("vision", "google", "gemini-flash-latest", 1),
    route("tts", "sarvam", "bulbul:v3", 1, "en", {
      language_code: "en-IN",
      speaker: "priya",
      pace: 0.95,
    }),
    route("tts", "sarvam", "bulbul:v3", 1, "ml", {
      language_code: "ml-IN",
      speaker: "priya",
      pace: 0.9,
    }),
    route("tts", "sarvam", "bulbul:v3", 1, "hi", {
      language_code: "hi-IN",
      speaker: "priya",
      pace: 0.95,
    }),
    route("tts", "google", "wavenet", 2, "en", { voice: "en-IN-Wavenet-A" }),
    route("tts", "google", "wavenet", 2, "ml", { voice: "ml-IN-Wavenet-A" }),
    route("tts", "google", "wavenet", 2, "hi", { voice: "hi-IN-Wavenet-A" }),
  ];

  const media = (
    key: string,
    type: string,
    title: string,
    lang: string,
    duration_s: number,
    extra: Row = {},
  ): Row => ({
    id: seedId(`media:${key}`),
    type,
    title,
    lang,
    duration_s,
    storage_path: `${type}/${seedId(`media:${key}`)}.mp3`,
    stream_url: null,
    age_min: 4,
    age_max: 12,
    status: "approved",
    generated_by_ai: false,
    ...extra,
  });
  const mediaLibrary: Row[] = [
    media("story-elephant", "story", "Kuttan the Little Elephant", "en", 420),
    media("story-boat", "story", "Vallam Kali — The Boat Race", "ml", 380),
    media("story-moon", "story", "Chanda Mama ki Kahani", "hi", 360, { age_max: 8 }),
    media("rhyme-twinkle", "rhyme", "Twinkle Twinkle Little Star", "en", 95, { age_max: 7 }),
    media("rhyme-thatha", "rhyme", "Thatha Thatha Kili", "ml", 80, { age_max: 7 }),
    media("rhyme-machli", "rhyme", "Machli Jal Ki Rani Hai", "hi", 70, { age_max: 7 }),
    media("amb-rain", "ambience", "Monsoon rain on the window", "en", 1800, {
      age_min: 4,
      age_max: 14,
    }),
    media("amb-forest", "ambience", "Western Ghats forest morning", "en", 1800, {
      age_min: 4,
      age_max: 14,
    }),
    media("radio-kids", "radio", "DuDu Kids Radio", "en", 0, {
      storage_path: null,
      stream_url: "https://stream.example.com/dudu-kids",
      age_min: 5,
      age_max: 14,
    }),
    media("ai-aarav-kite", "story", "Aarav and the Runaway Kite", "en", 300, {
      status: "pending",
      generated_by_ai: true,
      requested_by_family_id: F.menon,
      storage_path: null,
      body_text: "Aarav lived near the backwaters of Kochi… (AI draft awaiting approval)",
    }),
  ];

  // ── Commerce ───────────────────────────────────────────────────────────
  const subscriptions: Row[] = [
    {
      id: seedId("sub:menon"),
      family_id: F.menon,
      plan: "plus",
      status: "active",
      provider: "razorpay",
      provider_sub_id: "sub_seed_menon",
      amount_inr: 599,
      current_period_end: iso(istAt(now, -18, "00:00")),
    },
    {
      id: seedId("sub:sharma"),
      family_id: F.sharma,
      plan: "basic",
      status: "active",
      provider: "razorpay",
      provider_sub_id: "sub_seed_sharma",
      amount_inr: 299,
      current_period_end: iso(istAt(now, -9, "00:00")),
    },
  ];
  const preorders: Row[] = [
    {
      id: seedId("pre:1"),
      name: "Fathima K",
      phone: "+919811100001",
      email: "fathima@example.com",
      model: "DB-02",
      city: "Kozhikode",
      deposit_paid: true,
      razorpay_order_id: "order_seed_0001",
    },
    {
      id: seedId("pre:2"),
      name: "Vikram Rao",
      phone: "+919811100002",
      email: null,
      model: "DB-01",
      city: "Hyderabad",
      deposit_paid: false,
      razorpay_order_id: "order_seed_0002",
    },
    {
      id: seedId("pre:3"),
      name: "Lakshmi Iyer",
      phone: "+919811100003",
      email: "lakshmi@example.com",
      model: "DB-04",
      city: "Chennai",
      deposit_paid: true,
      razorpay_order_id: "order_seed_0003",
    },
  ];

  // ── AI usage (30 days) ─────────────────────────────────────────────────
  const services: [string, string, number, number][] = [
    // service, provider, units/device/day, ₹ per unit
    ["stt", "sarvam", 260, 0.0083], // seconds of audio
    ["llm_tutor", "google", 9000, 0.000025], // tokens
    ["llm_fun", "google", 6000, 0.00001],
    ["tts", "sarvam", 2400, 0.0006], // characters
    ["vision", "google", 3, 0.09], // images
  ];
  const aiUsage: Row[] = [];
  for (let day = 29; day >= 0; day--) {
    const deviceCount = 3 + (day < 20 ? 1 : 0) + Math.floor(rand() * 2);
    const weekend = [0, 6].includes(new Date(istDate(now, day)).getUTCDay());
    for (const [service, provider, perDevice, price] of services) {
      const units = Math.round(
        perDevice * deviceCount * (weekend ? 1.3 : 1) * (0.75 + rand() * 0.5),
      );
      aiUsage.push({
        id: seedId(`usage:${day}:${service}`),
        date: istDate(now, day),
        service,
        provider,
        units,
        cost_inr: Number((units * price).toFixed(2)),
        device_count: deviceCount,
      });
    }
  }

  // ── Operations ─────────────────────────────────────────────────────────
  const firmware: Row[] = [
    {
      id: seedId("fw:1.4.2"),
      version: "1.4.2",
      channel: "stable",
      storage_path: "stable/1.4.2.bin",
      notes: "Faster wake word, Malayalam voice polish.",
      rollout_pct: 100,
    },
    {
      id: seedId("fw:1.5.0-rc1"),
      version: "1.5.0-rc1",
      channel: "rc",
      storage_path: "rc/1.5.0-rc1.bin",
      notes: "Presence detection v2, new face animations.",
      rollout_pct: 20,
    },
  ];
  const settings: Row[] = [
    {
      id: seedId("setting:budget"),
      key: "ai_budget",
      value_json: {
        daily_inr: 1500,
        monthly_inr: 40000,
        per_device_daily_inr: 12,
        alert_at_pct: 80,
      },
    },
    {
      id: seedId("setting:alerts"),
      key: "alert_thresholds",
      value_json: { offline_hours: 24, latency_p50_ms: 1800, safety_open_high: 1 },
    },
    {
      id: seedId("setting:safety"),
      key: "safety_rules",
      value_json: { allow_list: [], block_list: [], pending_rules: [] },
    },
  ];

  const familyMembers: Row[] = [{ family_id: F.menon, user_id: p1g.id, role: "guardian" }];

  return {
    users,
    devices: devicesRows.map((d) => ({
      id: d.id as string,
      serial: d.serial as string,
      model: d.model as string,
    })),
    pairing,
    tables: [
      {
        table: "profiles",
        onConflict: "user_id",
        rows: users.map((u) => ({
          user_id: u.id,
          full_name: u.full_name,
          phone: u.phone ?? null,
          role: u.role,
          locale: u.locale ?? "en",
          city: u.city ?? null,
        })),
      },
      { table: "families", rows: families },
      { table: "family_members", onConflict: "family_id,user_id", rows: familyMembers },
      { table: "children", rows: children },
      { table: "devices", rows: devicesRows },
      {
        table: "pairing_codes",
        onConflict: "qr_token",
        rows: [
          {
            device_id: D.d4,
            code6: pairing.code6,
            qr_token: pairing.qr_token,
            expires_at: iso(istAt(now, -30, "23:59")),
            used_at: null,
          },
        ],
      },
      { table: "schedules", rows: schedules },
      { table: "reminders", rows: reminders },
      { table: "sessions", rows: sessions },
      { table: "conversations", rows: conversations },
      { table: "turns", rows: turns },
      { table: "homework_items", rows: homework },
      { table: "quizzes", rows: quizzes },
      { table: "child_stats", rows: childStats },
      { table: "snapshots", rows: snapshots },
      { table: "content_packs", rows: contentPacks },
      { table: "prompts", rows: prompts },
      { table: "model_routes", rows: modelRoutes },
      { table: "media_library", rows: mediaLibrary },
      { table: "subscriptions", rows: subscriptions },
      { table: "preorders", rows: preorders },
      { table: "ai_usage_daily", onConflict: "date,service,provider", rows: aiUsage },
      { table: "safety_reviews", rows: safetyReviews },
      { table: "firmware_releases", rows: firmware },
      { table: "settings", onConflict: "key", rows: settings },
    ],
  };
}

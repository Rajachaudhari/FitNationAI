import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env.js";
import { logger } from "./logger.js";

// Global in-memory storage store for offline / fallback mode
class MemoryDatabase {
  constructor() {
    this.tables = {
      users: [],
      fitness_assessments: [],
      exercises: [],
      workout_plans: [],
      workout_plan_exercises: [],
      workout_sessions: [],
      workout_session_sets: [],
      activity_logs: [],
      food_logs: [],
      challenges: [],
      user_challenges: [],
      point_transactions: [],
      achievements: [],
      user_achievements: [],
      groups: [],
      group_members: [],
      chat_messages: [],
      form_check_sessions: [],
      notifications: [],
      device_tokens: [],
    };
    this.initDefaultData();
  }

  initDefaultData() {
    // Seed default catalog exercises
    this.tables.exercises = [
      {
        id: "e1000000-0000-0000-0000-000000000001",
        name: "Barbell Back Squat",
        slug: "barbell-back-squat",
        category: "Legs",
        target_muscles: ["Quadriceps", "Glutes"],
        secondary_muscles: ["Hamstrings", "Lower Back", "Core"],
        equipment: "Barbell",
        difficulty: "Intermediate",
        instructions: ["Stand with feet shoulder-width apart.", "Brace core and descend until hips are below parallel.", "Drive through midfoot to stand back up."],
        common_mistakes: ["Knees caving inward (valgus)", "Excessive forward torso lean", "Heels lifting"],
        cautions: "Ensure safety bars are set. Keep spine neutral.",
        thumbnail_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
        created_at: new Date().toISOString(),
      },
      {
        id: "e1000000-0000-0000-0000-000000000002",
        name: "Push-Up",
        slug: "push-up",
        category: "Chest",
        target_muscles: ["Chest", "Triceps"],
        secondary_muscles: ["Anterior Deltoids", "Core"],
        equipment: "Bodyweight",
        difficulty: "Beginner",
        instructions: ["Start in high plank with hands slightly wider than shoulders.", "Lower chest until 2-3 inches above floor.", "Push firmly back to lockout."],
        common_mistakes: ["Hips sagging or piking", "Elbows flaring 90 degrees out", "Incomplete range of motion"],
        cautions: "Keep body in a straight line from ears to heels.",
        thumbnail_url: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
        created_at: new Date().toISOString(),
      },
      {
        id: "e1000000-0000-0000-0000-000000000003",
        name: "Dumbbell Bicep Curl",
        slug: "dumbbell-bicep-curl",
        category: "Arms",
        target_muscles: ["Biceps"],
        secondary_muscles: ["Brachialis", "Forearms"],
        equipment: "Dumbbells",
        difficulty: "Beginner",
        instructions: ["Hold dumbbells with palms forward.", "Curl weights toward shoulders keeping elbows pinned.", "Lower with control."],
        common_mistakes: ["Swinging upper body for momentum", "Elbows drifting forward"],
        cautions: "Control the eccentric lowering phase.",
        thumbnail_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400",
        created_at: new Date().toISOString(),
      },
      {
        id: "e1000000-0000-0000-0000-000000000004",
        name: "Forward Lunge",
        slug: "forward-lunge",
        category: "Legs",
        target_muscles: ["Quadriceps", "Glutes"],
        secondary_muscles: ["Hamstrings", "Calves"],
        equipment: "Bodyweight",
        difficulty: "Beginner",
        instructions: ["Step forward with right foot into 90-degree bend.", "Lower back knee almost to floor.", "Push back to starting stance."],
        common_mistakes: ["Front knee shooting past toes with heel up", "Torso collapsing forward"],
        cautions: "Maintain upright posture and stable knee tracking.",
        thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
        created_at: new Date().toISOString(),
      },
      {
        id: "e1000000-0000-0000-0000-000000000005",
        name: "Standard Plank",
        slug: "standard-plank",
        category: "Core",
        target_muscles: ["Rectus Abdominis", "Transverse Abdominis"],
        secondary_muscles: ["Glutes", "Shoulders"],
        equipment: "Bodyweight",
        difficulty: "Beginner",
        instructions: ["Rest on forearms and toes with elbows beneath shoulders.", "Tighten abs, glutes, and quads.", "Hold stable position."],
        common_mistakes: ["Lower back sagging", "Hips piked up in triangle"],
        cautions: "Do not hold your breath during the static hold.",
        thumbnail_url: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400",
        created_at: new Date().toISOString(),
      }
    ];

    // Seed default challenges
    this.tables.challenges = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        title: "7-Day Walking Blitz",
        subtitle: "Walk 7,000 steps every day for a week",
        description: "Consistency is key to health. Hit 7,000 steps daily for 7 consecutive days.",
        category: "steps",
        total_units: 7,
        unit_label: "days",
        reward_points: 350,
        starts_at: "2026-09-01",
        ends_at: "2026-10-31",
        is_active: true,
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        title: "Iron Discipline: 5 Workouts",
        subtitle: "Complete 5 guided or custom workouts",
        description: "Push yourself across 5 training sessions to unlock the Iron Discipline badge.",
        category: "workout",
        total_units: 5,
        unit_label: "sessions",
        reward_points: 500,
        starts_at: "2026-09-01",
        ends_at: "2026-10-31",
        is_active: true,
      },
      {
        id: "c1000000-0000-0000-0000-000000000003",
        title: "Calorie Torch: 3,000 kcal",
        subtitle: "Burn 3,000 active calories through workouts and steps",
        description: "Accumulate 3,000 active burned calories across your recorded activities.",
        category: "calories",
        total_units: 3000,
        unit_label: "kcal",
        reward_points: 400,
        starts_at: "2026-09-01",
        ends_at: "2026-10-31",
        is_active: true,
      }
    ];

    // Seed default achievements
    this.tables.achievements = [
      { id: "a1000000-0000-0000-0000-000000000001", code: "FIRST_WORKOUT", title: "First Blood", description: "Complete your very first workout session", icon: "dumbbell", points_reward: 50 },
      { id: "a1000000-0000-0000-0000-000000000002", code: "STREAK_7", title: "Unstoppable Momentum", description: "Maintain a 7-day workout streak", icon: "fire", points_reward: 150 },
      { id: "a1000000-0000-0000-0000-000000000003", code: "CHALLENGE_MASTER", title: "Challenge Conqueror", description: "Successfully complete your first fitness challenge", icon: "trophy", points_reward: 200 },
      { id: "a1000000-0000-0000-0000-000000000004", code: "FORM_PERFECTION", title: "Biomechanics Master", description: "Score 90+ on an AI exercise form check", icon: "sparkles", points_reward: 100 }
    ];

    // Seed demo groups
    this.tables.groups = [
      { id: "g1000000-0000-0000-0000-000000000001", name: "DSCodeTech Varsity Athletes", description: "College community for athletic conditioning", avatar_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200", is_private: false, invite_code: "DSCODE26", created_at: new Date().toISOString() },
      { id: "g1000000-0000-0000-0000-000000000002", name: "Morning 5K Runners", description: "Early morning runners pacing every weekday", avatar_url: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=200", is_private: false, invite_code: "RUN5K", created_at: new Date().toISOString() },
      { id: "g1000000-0000-0000-0000-000000000003", name: "Calisthenics & Bodyweight Club", description: "Pushups, pullups, planks, and pure body control", avatar_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200", is_private: false, invite_code: "CALIS", created_at: new Date().toISOString() }
    ];
  }
}

export const memoryDb = new MemoryDatabase();

let isPostgresConnected = false;
let pgPoolInstance = null;

try {
  pgPoolInstance = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 2000,
  });

  pgPoolInstance.on("error", (err) => {
    logger.warn("PostgreSQL connection error in pool; using memory store fallback", { error: err.message });
  });
} catch (e) {
  logger.info("Initializing with memory database engine");
}

/**
 * Check if live PostgreSQL is active or switch to memory fallback
 */
export async function testDbConnection() {
  if (!pgPoolInstance) return false;
  try {
    const client = await pgPoolInstance.connect();
    await client.query("SELECT 1");
    client.release();
    isPostgresConnected = true;
    logger.info("Live PostgreSQL connected successfully");
    return true;
  } catch (err) {
    isPostgresConnected = false;
    logger.info("PostgreSQL unavailable; utilizing in-memory relational storage engine", { reason: err.message });
    return false;
  }
}

/**
 * Main query interface: executes on real PostgreSQL if connected, or uses memory engine
 */
export async function query(text, params = []) {
  if (isPostgresConnected && pgPoolInstance) {
    try {
      return await pgPoolInstance.query(text, params);
    } catch (err) {
      logger.error("PostgreSQL query failed:", { query: text, error: err.message });
      throw err;
    }
  }

  // Fallback memory engine query dispatcher
  return executeMemoryQuery(text, params);
}

/**
 * Transaction client helper
 */
export async function getClient() {
  if (isPostgresConnected && pgPoolInstance) {
    const client = await pgPoolInstance.connect();
    return {
      query: (sql, params) => client.query(sql, params),
      release: () => client.release(),
    };
  }

  // Memory mock transaction client
  return {
    query: (sql, params) => executeMemoryQuery(sql, params),
    release: () => {},
  };
}

/**
 * Flexible memory engine handler supporting FitNation AI domain queries
 */
function executeMemoryQuery(sql, params) {
  const normalized = sql.trim().replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  // 1. SELECT queries
  if (lower.startsWith("select")) {
    // JOIN workout_plan_exercises and workout_plans for IDOR check
    if (lower.includes("from workout_plan_exercises") && lower.includes("join workout_plans")) {
      const exerciseId = params[0];
      const exercise = memoryDb.tables.workout_plan_exercises.find((e) => e.id === exerciseId);
      if (exercise) {
        const plan = memoryDb.tables.workout_plans.find((p) => p.id === exercise.plan_id);
        if (plan) {
          return { rows: [{ user_id: plan.user_id, plan_id: plan.id }], rowCount: 1 };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    if (lower.includes("from users")) {
      let rows = [...memoryDb.tables.users];
      if (lower.includes("where firebase_uid = $1")) {
        rows = rows.filter((u) => u.firebase_uid === params[0]);
      } else if (lower.includes("where id = $1")) {
        rows = rows.filter((u) => u.id === params[0]);
      } else if (lower.includes("order by points desc")) {
        rows = rows.sort((a, b) => (b.points || 0) - (a.points || 0));
      }
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from exercises")) {
      let rows = [...memoryDb.tables.exercises];
      if (lower.includes("where id = $1")) {
        rows = rows.filter((e) => e.id === params[0]);
      } else if (lower.includes("where category = $1")) {
        rows = rows.filter((e) => e.category.toLowerCase() === (params[0] || "").toLowerCase());
      }
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from workout_plans")) {
      let rows = memoryDb.tables.workout_plans.filter((p) => p.user_id === params[0]);
      rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (lower.includes("limit 1")) rows = rows.slice(0, 1);
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from workout_plan_exercises") || lower.includes("from workout_exercises")) {
      let rows = memoryDb.tables.workout_plan_exercises;
      if (lower.includes("where id = $1") || lower.includes("where id = $2")) {
        const targetId = params[1] || params[0];
        rows = rows.filter((e) => e.id === targetId);
      } else {
        rows = rows.filter((e) => e.plan_id === params[0]);
      }
      rows.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from activity_logs")) {
      let rows = memoryDb.tables.activity_logs.filter((a) => a.user_id === params[0]);
      if (params[1] && params[2]) {
        rows = rows.filter((a) => a.log_date >= params[1] && a.log_date <= params[2]);
      }
      rows.sort((a, b) => a.log_date.localeCompare(b.log_date));
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from food_logs")) {
      let rows = memoryDb.tables.food_logs;
      if (lower.includes("where id = $1")) {
        rows = rows.filter((f) => f.id === params[0]);
      } else {
        rows = rows.filter((f) => f.user_id === params[0]);
      }
      rows.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from challenges")) {
      if (lower.includes("where id = $1")) {
        const ch = memoryDb.tables.challenges.find((c) => c.id === params[0]);
        return { rows: ch ? [ch] : [], rowCount: ch ? 1 : 0 };
      }
      const challenges = memoryDb.tables.challenges.map((c) => {
        const uc = memoryDb.tables.user_challenges.find((u) => u.challenge_id === c.id && u.user_id === params[0]);
        return {
          ...c,
          progress: uc ? uc.progress : 0,
          completed_at: uc ? uc.completed_at : null,
          reward_claimed: uc ? uc.reward_claimed : false,
        };
      });
      return { rows: challenges, rowCount: challenges.length };
    }

    if (lower.includes("from groups")) {
      let rows = memoryDb.tables.groups;
      if (lower.includes("where id = $1")) {
        rows = rows.filter((g) => g.id === params[0]);
      } else if (lower.includes("join group_members")) {
        const userGroupIds = memoryDb.tables.group_members
          .filter((gm) => gm.user_id === params[0])
          .map((gm) => gm.group_id);
        rows = rows.filter((g) => userGroupIds.includes(g.id));
      }
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from chat_messages")) {
      let rows = memoryDb.tables.chat_messages.filter((m) => m.user_id === params[0]);
      rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from point_transactions")) {
      let rows = memoryDb.tables.point_transactions.filter((pt) => pt.user_id === params[0]);
      rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows, rowCount: rows.length };
    }

    if (lower.includes("from achievements")) {
      return { rows: memoryDb.tables.achievements, rowCount: memoryDb.tables.achievements.length };
    }
  }

  // 2. INSERT queries
  if (lower.startsWith("insert into users")) {
    const existing = memoryDb.tables.users.find((u) => u.firebase_uid === params[0]);
    if (existing) {
      existing.updated_at = new Date().toISOString();
      if (params[1]) existing.name = params[1];
      return { rows: [existing], rowCount: 1 };
    }
    const newUser = {
      id: uuidv4(),
      firebase_uid: params[0],
      name: params[1] || "Athlete",
      email: params[2] || "user@fitnation.ai",
      points: 0,
      level: 1,
      streak_days: 1,
      fitness_level: "Beginner",
      goal: "General fitness",
      role: "member",
      avatar_url: params[3] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.tables.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  if (lower.startsWith("insert into workout_plans")) {
    const plan = {
      id: uuidv4(),
      user_id: params[0],
      title: params[1],
      duration_min: params[2],
      is_custom: params[3] || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.tables.workout_plans.push(plan);
    return { rows: [plan], rowCount: 1 };
  }

  if (lower.startsWith("insert into workout_plan_exercises") || lower.startsWith("insert into workout_exercises")) {
    const item = {
      id: uuidv4(),
      plan_id: params[0],
      name: params[1],
      detail: params[2],
      position: params[3] || 0,
      is_done: false,
    };
    memoryDb.tables.workout_plan_exercises.push(item);
    return { rows: [item], rowCount: 1 };
  }

  if (lower.startsWith("insert into activity_logs")) {
    const existing = memoryDb.tables.activity_logs.find(
      (a) => a.user_id === params[0] && a.log_date === params[1]
    );
    if (existing) {
      existing.steps = params[2];
      existing.distance_km = params[3];
      existing.calories = params[4];
      existing.active_minutes = params[5];
      existing.source = params[6] || "manual";
      existing.updated_at = new Date().toISOString();
      return { rows: [existing], rowCount: 1 };
    }
    const log = {
      id: uuidv4(),
      user_id: params[0],
      log_date: params[1],
      steps: params[2] || 0,
      distance_km: params[3] || 0,
      calories: params[4] || 0,
      active_minutes: params[5] || 0,
      source: params[6] || "manual",
      created_at: new Date().toISOString(),
    };
    memoryDb.tables.activity_logs.push(log);
    return { rows: [log], rowCount: 1 };
  }

  if (lower.startsWith("insert into food_logs")) {
    const log = {
      id: uuidv4(),
      user_id: params[0],
      meal: params[1],
      description: params[2],
      calories: params[3],
      protein_g: params[4] || 0,
      carbs_g: params[5] || 0,
      fat_g: params[6] || 0,
      logged_at: new Date().toISOString(),
    };
    memoryDb.tables.food_logs.push(log);
    return { rows: [log], rowCount: 1 };
  }

  if (lower.startsWith("insert into user_challenges")) {
    let uc = memoryDb.tables.user_challenges.find(
      (u) => u.user_id === params[0] && u.challenge_id === params[1]
    );
    if (uc) {
      uc.progress = (uc.progress || 0) + (params[2] || 1);
      return { rows: [uc], rowCount: 1 };
    }
    uc = {
      id: uuidv4(),
      user_id: params[0],
      challenge_id: params[1],
      progress: params[2] || 0,
      reward_claimed: false,
      completed_at: null,
      joined_at: new Date().toISOString(),
    };
    memoryDb.tables.user_challenges.push(uc);
    return { rows: [uc], rowCount: 1 };
  }

  if (lower.startsWith("insert into chat_messages")) {
    const msg = {
      id: uuidv4(),
      user_id: params[0],
      role: params[1],
      content: params[2],
      created_at: new Date().toISOString(),
    };
    memoryDb.tables.chat_messages.push(msg);
    return { rows: [msg], rowCount: 1 };
  }

  if (lower.startsWith("insert into form_check_sessions")) {
    const sess = {
      id: uuidv4(),
      user_id: params[0],
      exercise: params[1],
      rep_count: params[2] || 0,
      score: params[3] || 0,
      feedback: params[4] || "",
      detected_flaws: params[5] || [],
      created_at: new Date().toISOString(),
    };
    memoryDb.tables.form_check_sessions.push(sess);
    return { rows: [sess], rowCount: 1 };
  }

  if (lower.startsWith("insert into point_transactions")) {
    const pt = {
      id: uuidv4(),
      user_id: params[0],
      amount: params[1],
      source: params[2],
      reference_id: params[3] || null,
      created_at: new Date().toISOString(),
    };
    memoryDb.tables.point_transactions.push(pt);
    return { rows: [pt], rowCount: 1 };
  }

  // 3. UPDATE queries
  if (lower.startsWith("update workout_plan_exercises")) {
    const exercise = memoryDb.tables.workout_plan_exercises.find((e) => e.id === params[1]);
    if (exercise) {
      exercise.is_done = !!params[0];
      return { rows: [exercise], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith("update user_challenges")) {
    const uc = memoryDb.tables.user_challenges.find((u) => u.id === params[0]);
    if (uc) {
      uc.completed_at = new Date().toISOString();
      uc.reward_claimed = true;
      return { rows: [uc], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith("update users")) {
    const user = memoryDb.tables.users.find((u) => u.id === params[params.length - 1] || u.firebase_uid === params[params.length - 1]);
    if (user) {
      if (lower.includes("points = points + $1")) {
        user.points = (user.points || 0) + params[0];
      }
      user.updated_at = new Date().toISOString();
      return { rows: [user], rowCount: 1 };
    }
  }

  // 4. DELETE queries
  if (lower.startsWith("delete from food_logs")) {
    const idx = memoryDb.tables.food_logs.findIndex((f) => f.id === params[0]);
    if (idx !== -1) {
      memoryDb.tables.food_logs.splice(idx, 1);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

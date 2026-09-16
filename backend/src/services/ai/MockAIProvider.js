import { AIProvider } from "./AIProvider.js";

export class MockAIProvider extends AIProvider {
  async chat(messages, userContext = {}) {
    const lastMessage = messages[messages.length - 1]?.content || "";
    const lower = lastMessage.toLowerCase();

    // 1. Safety Filter — Medical & Health Caution
    if (
      lower.includes("chest pain") ||
      lower.includes("heart attack") ||
      lower.includes("fracture") ||
      lower.includes("severe pain") ||
      lower.includes("anorexia") ||
      lower.includes("prescription")
    ) {
      return (
        "⚠️ Medical Advisory: I am your AI fitness coach, not a licensed healthcare professional or medical doctor. " +
        "The symptoms or topics you described require clinical attention. Please consult a physician, physical therapist, " +
        "or emergency medical service promptly."
      );
    }

    // 2. Contextual Fitness Advice
    const name = userContext.name || "Athlete";
    const goal = userContext.goal || "your fitness journey";
    const level = userContext.fitness_level || "intermediate";

    if (lower.includes("squat") || lower.includes("form")) {
      return (
        `Hey ${name}! For squats, remember three key cues: \n\n` +
        `1. **Foot Placement & Tripod Foot**: Position feet shoulder-width with toes flared ~15-30°. Maintain even pressure across the heel, big toe, and pinky toe.\n` +
        `2. **Knee Tracking**: Drive your knees in line with your middle toes. Prevent knee valgus (inward caving).\n` +
        `3. **Core Bracing**: Take a 360-degree diaphragmatic breath into your abdomen and brace before initiating descent to parallel depth.`
      );
    }

    if (lower.includes("diet") || lower.includes("protein") || lower.includes("nutrition")) {
      return (
        `To optimize for ${goal}, aim for approximately 1.6 to 2.2 grams of protein per kilogram of bodyweight daily. ` +
        `Distribute this across 3 to 4 meals containing lean sources (chicken, fish, eggs, tofu, Greek yogurt, or lentils) paired with complex carbohydrates for recovery.`
      );
    }

    if (lower.includes("motivation") || lower.includes("tired") || lower.includes("lazy")) {
      return (
        `Consistency over intensity, ${name}! Even on low-energy days, doing a 15-minute mobility routine or a brisk walk keeps your neural habit loop alive. ` +
        `Remember why you set your goal of "${goal}". You don't have to be extreme, just consistent.`
      );
    }

    return (
      `Great question! Tailoring your training for ${level} level and ${goal} requires progressive overload, ` +
      `adequate sleep (7-9 hours), and structured deloads every 5-6 weeks. How can I help you customize your next session or meal plan?`
    );
  }

  async generateWorkout(profile = {}, preferences = {}) {
    const goal = preferences.goal || profile.goal || "Muscle building";
    const duration = preferences.duration_min || 45;
    const focus = preferences.focus || "Full Body";
    const level = preferences.difficulty || profile.fitness_level || "Intermediate";

    const workoutLibrary = {
      "Upper Body": [
        { name: "Barbell Bench Press", sets: 4, reps: 8, rest_seconds: 90, target_muscles: ["Chest", "Triceps"], instructions: "Control eccentric to mid-chest, press up." },
        { name: "Overhead Dumbbell Press", sets: 3, reps: 10, rest_seconds: 75, target_muscles: ["Shoulders", "Triceps"], instructions: "Press upward without arching lumbar spine." },
        { name: "Bent-Over Barbell Row", sets: 4, reps: 8, rest_seconds: 90, target_muscles: ["Lats", "Upper Back"], instructions: "Hinge at hips, pull bar into lower ribcage." },
        { name: "Dumbbell Bicep Curl", sets: 3, reps: 12, rest_seconds: 60, target_muscles: ["Biceps"], instructions: "Keep elbows fixed at sides." },
        { name: "Push-Up Burnout", sets: 2, reps: 15, rest_seconds: 60, target_muscles: ["Chest", "Triceps"], instructions: "Maintain rigid plank alignment." },
      ],
      "Lower Body": [
        { name: "Barbell Back Squat", sets: 4, reps: 8, rest_seconds: 120, target_muscles: ["Quadriceps", "Glutes"], instructions: "Descend to parallel, drive up through midfoot." },
        { name: "Romanian Deadlift", sets: 3, reps: 10, rest_seconds: 90, target_muscles: ["Hamstrings", "Glutes"], instructions: "Push hips back, slight knee bend, feel hamstring stretch." },
        { name: "Forward Lunge", sets: 3, reps: 10, rest_seconds: 60, target_muscles: ["Quadriceps", "Glutes"], instructions: "Step forward into 90-degree knee bend." },
        { name: "Calf Raises", sets: 4, reps: 15, rest_seconds: 45, target_muscles: ["Calves"], instructions: "Pause at top peak contraction for 1 second." },
        { name: "Standard Plank", sets: 3, reps: 45, rest_seconds: 45, target_muscles: ["Core"], instructions: "Hold isometric hollow body hold." },
      ],
      "Full Body": [
        { name: "Barbell Back Squat", sets: 3, reps: 8, rest_seconds: 90, target_muscles: ["Quadriceps", "Glutes"], instructions: "Deep controlled squat." },
        { name: "Push-Up", sets: 3, reps: 12, rest_seconds: 60, target_muscles: ["Chest", "Triceps"], instructions: "Chest to 2 inches off floor." },
        { name: "Dumbbell Bicep Curl", sets: 3, reps: 12, rest_seconds: 60, target_muscles: ["Biceps"], instructions: "Control lowering." },
        { name: "Forward Lunge", sets: 3, reps: 10, rest_seconds: 60, target_muscles: ["Quadriceps", "Glutes"], instructions: "Stable upright torso." },
        { name: "Standard Plank", sets: 3, reps: 45, rest_seconds: 45, target_muscles: ["Core"], instructions: "Maintain straight spine." },
      ],
    };

    const selectedExercises = workoutLibrary[focus] || workoutLibrary["Full Body"];

    return {
      title: `${level} ${focus} Strength`,
      duration_minutes: duration,
      difficulty: level,
      focus,
      goal,
      warmup: ["5 min Light Cardio", "Arm Circles & Band Pull-aparts", "Hip Openers & Bodyweight Squats"],
      exercises: selectedExercises,
      cooldown: ["Standing Hamstring Stretch", "Doorway Chest Stretch", "Cobra Pose"],
    };
  }

  async parseFood(naturalText) {
    const text = (naturalText || "").toLowerCase();
    let calories = 350;
    let protein_g = 20;
    let carbs_g = 40;
    let fat_g = 12;
    let items = [];

    if (text.includes("roti") || text.includes("chapati")) {
      calories += 200;
      carbs_g += 40;
      protein_g += 6;
      items.push("2 Whole Wheat Rotis");
    }
    if (text.includes("paneer")) {
      calories += 260;
      protein_g += 18;
      fat_g += 20;
      items.push("Paneer Curry (150g)");
    }
    if (text.includes("chicken") || text.includes("breast")) {
      calories += 240;
      protein_g += 38;
      fat_g += 5;
      carbs_g += 0;
      items.push("Grilled Chicken Breast (180g)");
    }
    if (text.includes("rice") || text.includes("bowl")) {
      calories += 220;
      carbs_g += 45;
      protein_g += 4;
      items.push("Steamed White Rice (1 cup)");
    }
    if (text.includes("dal") || text.includes("lentil")) {
      calories += 180;
      protein_g += 12;
      carbs_g += 25;
      items.push("Yellow Dal (1 bowl)");
    }
    if (text.includes("egg") || text.includes("omelet")) {
      calories += 210;
      protein_g += 18;
      fat_g += 14;
      items.push("3 Whole Eggs");
    }

    if (items.length === 0) {
      items.push(naturalText.trim());
    }

    return {
      description: items.join(" + "),
      estimated_calories: calories,
      protein_g: Math.round(protein_g),
      carbs_g: Math.round(carbs_g),
      fat_g: Math.round(fat_g),
      confidence: 0.88,
      items,
      disclaimer: "Estimates are generated based on typical preparation portions and nutritional databases.",
    };
  }
}

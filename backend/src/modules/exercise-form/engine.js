import { calculateAngle, calculateDistance, LANDMARKS } from "./kinematics.js";

/**
 * Biomechanical Form Analysis Engine
 */
export class FormAnalysisEngine {
  /**
   * Main entry point to analyze keypoints for any supported exercise
   */
  static analyze(exercise, keypoints) {
    const landmarks = Array.isArray(keypoints) ? keypoints : keypoints?.landmarks || [];
    if (!landmarks || landmarks.length < 29) {
      return {
        exercise,
        score: 50,
        rep_phase: "unknown",
        rep_completed: false,
        feedback: "Subject partially out of frame. Please position your entire body within the camera view.",
        flaws: ["Insufficient landmark visibility"],
        angles: {},
      };
    }

    const ex = (exercise || "").toLowerCase().replace(/[-_\s]/g, "");

    if (ex.includes("squat")) {
      return this.analyzeSquat(landmarks);
    } else if (ex.includes("pushup")) {
      return this.analyzePushUp(landmarks);
    } else if (ex.includes("curl")) {
      return this.analyzeBicepCurl(landmarks);
    } else if (ex.includes("lunge")) {
      return this.analyzeLunge(landmarks);
    } else if (ex.includes("plank")) {
      return this.analyzePlank(landmarks);
    } else {
      return this.analyzeGeneral(landmarks, exercise);
    }
  }

  static analyzeSquat(lm) {
    const leftHip = lm[LANDMARKS.LEFT_HIP];
    const leftKnee = lm[LANDMARKS.LEFT_KNEE];
    const leftAnkle = lm[LANDMARKS.LEFT_ANKLE];
    const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];

    const rightKnee = lm[LANDMARKS.RIGHT_KNEE];
    const rightAnkle = lm[LANDMARKS.RIGHT_ANKLE];

    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);

    const flaws = [];
    let score = 95;
    let rep_phase = "standing";
    let rep_completed = false;

    // Depth analysis
    if (kneeAngle <= 95) {
      rep_phase = "bottom_depth";
      if (kneeAngle < 70) {
        flaws.push("Ass-to-grass depth: watch for posterior pelvic tilt (butt wink)");
      }
    } else if (kneeAngle < 140) {
      rep_phase = "descending";
    } else {
      rep_phase = "top_lockout";
      rep_completed = true;
    }

    // Torso incline check
    if (hipAngle < 55) {
      flaws.push("Excessive forward torso lean; keep chest upright and brace core");
      score -= 15;
    }

    // Knee valgus check (inward collapse)
    const kneeDist = calculateDistance(leftKnee, rightKnee);
    const ankleDist = calculateDistance(leftAnkle, rightAnkle);
    if (ankleDist > 0 && kneeDist / ankleDist < 0.75) {
      flaws.push("Knee valgus detected: drive knees outward in line with toes");
      score -= 20;
    }

    score = Math.max(40, Math.min(100, score));

    let feedback = "Excellent squat mechanics! Fluid movement and solid depth.";
    if (flaws.length > 0) {
      feedback = flaws[0];
    } else if (rep_phase === "bottom_depth") {
      feedback = "Great depth! Drive straight up through your midfoot.";
    }

    return {
      exercise: "Squat",
      score,
      rep_phase,
      rep_completed,
      feedback,
      flaws,
      angles: { knee_angle: kneeAngle, hip_angle: hipAngle },
    };
  }

  static analyzePushUp(lm) {
    const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];
    const leftElbow = lm[LANDMARKS.LEFT_ELBOW];
    const leftWrist = lm[LANDMARKS.LEFT_WRIST];
    const leftHip = lm[LANDMARKS.LEFT_HIP];
    const leftAnkle = lm[LANDMARKS.LEFT_ANKLE];

    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const bodyLineAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);

    const flaws = [];
    let score = 95;
    let rep_phase = "top";
    let rep_completed = false;

    if (elbowAngle <= 90) {
      rep_phase = "chest_down";
    } else if (elbowAngle > 155) {
      rep_phase = "top_lockout";
      rep_completed = true;
    } else {
      rep_phase = "transition";
    }

    // Plank posture check (shoulder - hip - ankle should be near 180 deg)
    if (bodyLineAngle < 160) {
      flaws.push("Hips sagging: squeeze glutes and brace core to protect lumbar spine");
      score -= 20;
    } else if (bodyLineAngle > 195) {
      flaws.push("Hips piked too high: maintain a flat rigid plank");
      score -= 15;
    }

    score = Math.max(40, Math.min(100, score));

    let feedback = "Strong push-up form! Full range of motion.";
    if (flaws.length > 0) {
      feedback = flaws[0];
    } else if (rep_phase === "chest_down") {
      feedback = "Good chest depth! Press firmly through your palms.";
    }

    return {
      exercise: "Push-Up",
      score,
      rep_phase,
      rep_completed,
      feedback,
      flaws,
      angles: { elbow_angle: elbowAngle, body_line_angle: bodyLineAngle },
    };
  }

  static analyzeBicepCurl(lm) {
    const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];
    const leftElbow = lm[LANDMARKS.LEFT_ELBOW];
    const leftWrist = lm[LANDMARKS.LEFT_WRIST];
    const leftHip = lm[LANDMARKS.LEFT_HIP];

    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const shoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);

    const flaws = [];
    let score = 95;
    let rep_phase = "down";
    let rep_completed = false;

    if (elbowAngle < 55) {
      rep_phase = "peak_contraction";
    } else if (elbowAngle > 145) {
      rep_phase = "bottom_extension";
      rep_completed = true;
    } else {
      rep_phase = "curling";
    }

    // Shoulder swing detection (elbow drifting forward/backward)
    if (shoulderAngle > 30) {
      flaws.push("Elbow drifting forward: keep elbows pinned to torso to isolate biceps");
      score -= 15;
    }

    score = Math.max(40, Math.min(100, score));

    let feedback = "Clean bicep curl. Controlled eccentric motion.";
    if (flaws.length > 0) {
      feedback = flaws[0];
    }

    return {
      exercise: "Bicep Curl",
      score,
      rep_phase,
      rep_completed,
      feedback,
      flaws,
      angles: { elbow_angle: elbowAngle, shoulder_drift_angle: shoulderAngle },
    };
  }

  static analyzeLunge(lm) {
    const leftHip = lm[LANDMARKS.LEFT_HIP];
    const leftKnee = lm[LANDMARKS.LEFT_KNEE];
    const leftAnkle = lm[LANDMARKS.LEFT_ANKLE];
    const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];

    const leadKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const torsoAngle = calculateAngle(leftShoulder, leftHip, leftKnee);

    const flaws = [];
    let score = 92;
    let rep_phase = "standing";
    let rep_completed = false;

    if (leadKneeAngle <= 95) {
      rep_phase = "lunge_bottom";
    } else if (leadKneeAngle > 150) {
      rep_phase = "standing";
      rep_completed = true;
    } else {
      rep_phase = "stepping";
    }

    if (leadKneeAngle < 70) {
      flaws.push("Lead knee tracking too far forward past toes; widen your stride");
      score -= 15;
    }

    if (torsoAngle < 70) {
      flaws.push("Torso leaning forward; maintain vertical posture");
      score -= 10;
    }

    score = Math.max(40, Math.min(100, score));
    let feedback = flaws.length > 0 ? flaws[0] : "Good stride and balanced knee flexion!";

    return {
      exercise: "Lunge",
      score,
      rep_phase,
      rep_completed,
      feedback,
      flaws,
      angles: { lead_knee_angle: leadKneeAngle, torso_angle: torsoAngle },
    };
  }

  static analyzePlank(lm) {
    const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];
    const leftHip = lm[LANDMARKS.LEFT_HIP];
    const leftAnkle = lm[LANDMARKS.LEFT_ANKLE];

    const bodyLineAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const flaws = [];
    let score = 95;

    if (bodyLineAngle < 162) {
      flaws.push("Lower back sagging: tuck pelvis and squeeze abdominal wall");
      score -= 20;
    } else if (bodyLineAngle > 195) {
      flaws.push("Hips elevated: lower hips in line with shoulders and heels");
      score -= 15;
    }

    score = Math.max(40, Math.min(100, score));
    const feedback = flaws.length > 0 ? flaws[0] : "Solid isometric plank alignment. Keep breathing.";

    return {
      exercise: "Plank",
      score,
      rep_phase: "holding",
      rep_completed: false,
      feedback,
      flaws,
      angles: { alignment_angle: bodyLineAngle },
    };
  }

  static analyzeGeneral(lm, exercise) {
    return {
      exercise: exercise || "Exercise",
      score: 85,
      rep_phase: "active",
      rep_completed: false,
      feedback: "Maintain steady breathing, stable core bracing, and controlled tempo.",
      flaws: [],
      angles: {},
    };
  }
}

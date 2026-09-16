# FitNation AI — AI & Computer Vision Engineering Specification

## 1. Biomechanical Form Analysis Engine

### 1.1 Vector Kinematics
Given three consecutive joint landmarks $A$, $B$ (vertex), and $C$ in normalized coordinate space $(x, y, z)$:
$$\mathbf{u} = A - B = (x_A - x_B, y_A - y_B, z_A - z_B)$$
$$\mathbf{v} = C - B = (x_C - x_B, y_C - y_B, z_C - z_B)$$
$$\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right) \times \frac{180}{\pi}$$

### 1.2 Exercise Rule Definitions

#### Squat
- **Key Angles**:
  - Hip Angle (Shoulder - Hip - Knee)
  - Knee Angle (Hip - Knee - Ankle)
  - Torso Angle (Shoulder - Hip relative to vertical)
- **Phases & Thresholds**:
  - Standing / Top: Knee angle $> 160^\circ$
  - Bottom / Depth: Knee angle $\le 95^\circ$ (Parallel / Deep)
  - Fault Detection:
    - Knee Valgus: Inward knee collapse detected via distance ratio between knees vs ankles $< 0.85$.
    - Torso Lean: Torso inclination $> 45^\circ$ from vertical.
    - Shallow Depth: Bottom inflection stopped at $> 105^\circ$.

#### Push-Up
- **Key Angles**:
  - Elbow Angle (Shoulder - Elbow - Wrist)
  - Torso-Hip Alignment (Shoulder - Hip - Ankle)
  - Elbow Flare (Elbow - Shoulder - Hip)
- **Phases & Thresholds**:
  - Top Lockout: Elbow angle $> 160^\circ$
  - Bottom Chest Depth: Elbow angle $\le 90^\circ$
  - Fault Detection:
    - Hip Sag / Pike: Shoulder-Hip-Ankle deviation from $180^\circ$ by $> 15^\circ$.
    - Elbow Flare: Flare angle $> 75^\circ$ (straining anterior deltoid).

#### Lunge
- **Key Angles**:
  - Lead Knee Angle (Hip - Knee - Ankle): Target $90^\circ \pm 10^\circ$.
  - Trail Knee Angle: Target $90^\circ$ flexion near floor.
  - Fault: Lead knee tracking forward beyond toes ($< 80^\circ$ with heel elevation).

#### Plank
- **Key Metric**:
  - Continuous alignment angle (Shoulder - Hip - Ankle) sustained between $165^\circ - 180^\circ$.
  - Fault: Hip sagging ($< 160^\circ$) or piking ($> 195^\circ$).

#### Bicep Curl
- **Key Angles**:
  - Elbow Angle (Shoulder - Elbow - Wrist): Extension $> 150^\circ$, Peak Flexion $< 50^\circ$.
  - Upper Arm Angle (Hip - Shoulder - Elbow): Target $< 15^\circ$ (detecting momentum swing).

---

## 2. AI Coach & Provider Abstraction

### 2.1 Provider Architecture
```typescript
interface AIProvider {
  chat(messages: Message[], context: UserContext): Promise<string>;
  generateWorkout(profile: UserProfile, request: WorkoutRequest): Promise<WorkoutPlanOutput>;
  parseFood(text: string): Promise<NutritionEstimate>;
}
```
Implementations:
- `OpenAIProvider`: Connects to OpenAI API using structured JSON schema.
- `MockAIProvider`: Offline deterministic generator providing realistic, medically-sound, high-variety responses for local development and CI testing.

### 2.2 Safety Guardrails
1. **Medical Boundary Filter**: System prompts forbid medical diagnosis or treatment prescribing. Queries concerning acute chest pain, injuries, or clinical disorders automatically output urgent clinical referral disclaimers:
   > "I'm your AI fitness coach, not a medical doctor. For acute symptoms, persistent pain, or medical conditions, please consult a qualified healthcare professional."
2. **Extreme Dieting Suppression**: Flag calorie targets $< 1200$ kcal/day or dangerous dehydration suggestions.

### 2.3 Structured Workout Generation Output Schema (Zod)
```json
{
  "title": "Hypertrophy Push Session",
  "duration_min": 45,
  "difficulty": "Intermediate",
  "focus": "Chest, Shoulders & Triceps",
  "warmup": ["Arm circles", "Band pull-aparts", "Light pushups"],
  "exercises": [
    {
      "name": "Barbell Bench Press",
      "sets": 4,
      "reps": 8,
      "rest_seconds": 90,
      "target_muscles": ["Chest", "Triceps"],
      "instructions": "Lower the bar with control to mid-chest, press upwards explosively."
    }
  ],
  "cooldown": ["Chest door stretch", "Tricep overhead stretch"]
}
```

-- Seed initial standard exercises
INSERT INTO exercises (name, slug, category, target_muscles, secondary_muscles, equipment, difficulty, instructions, common_mistakes, cautions, thumbnail_url)
VALUES
('Barbell Back Squat', 'barbell-back-squat', 'Legs', ARRAY['Quadriceps','Glutes'], ARRAY['Hamstrings','Core'], 'Barbell', 'Intermediate', '["Set feet shoulder-width apart","Brace core and sit back into hips","Descend below parallel and drive through midfoot"]', '["Knees caving inwards","Excessive forward torso lean","Heels lifting"]', 'Ensure safety pins are set.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400'),
('Push-Up', 'push-up', 'Chest', ARRAY['Chest','Triceps'], ARRAY['Anterior Deltoids','Core'], 'Bodyweight', 'Beginner', '["Start in high plank with hands slightly wider than shoulders","Lower chest to 2 inches off floor","Press back to full lockout"]', '["Hips sagging or piking","Elbows flaring 90 degrees out"]', 'Keep core tight throughout movement.', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400'),
('Dumbbell Bicep Curl', 'dumbbell-bicep-curl', 'Arms', ARRAY['Biceps'], ARRAY['Brachialis','Forearms'], 'Dumbbells', 'Beginner', '["Hold dumbbells with palms forward","Curl weights keeping elbows glued to ribs","Lower under control"]', '["Swinging torso for momentum","Elbows drifting forward"]', 'Focus on mind-muscle connection.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'),
('Forward Lunge', 'forward-lunge', 'Legs', ARRAY['Quadriceps','Glutes'], ARRAY['Hamstrings','Calves'], 'Bodyweight', 'Beginner', '["Take a long step forward into 90-degree knee bend","Hover back knee just above floor","Push through lead foot to stand"]', '["Lead knee collapsing past toes","Torso collapsing forward"]', 'Maintain an upright spine.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'),
('Standard Plank', 'standard-plank', 'Core', ARRAY['Rectus Abdominis','Transverse Abdominis'], ARRAY['Glutes','Shoulders'], 'Bodyweight', 'Beginner', '["Hold forearm plank position with elbows under shoulders","Squeeze abs, quads, and glutes","Breathe steadily while maintaining straight line"]', '["Lower back arching","Hips held too high"]', 'Do not hold your breath.', 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400')
ON CONFLICT (slug) DO NOTHING;

-- Seed default challenges
INSERT INTO challenges (title, subtitle, description, category, total_units, unit_label, reward_points, starts_at, ends_at)
VALUES
('7-Day Walking Blitz', 'Walk 7,000 steps daily for a week', 'Build consistent daily baseline activity by hitting 7,000 steps each day.', 'steps', 7, 'days', 350, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days'),
('Iron Discipline: 5 Workouts', 'Complete 5 guided or custom workouts', 'Dedicate yourself to completing five full workout sessions.', 'workout', 5, 'sessions', 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days'),
('Calorie Torch: 3,000 kcal', 'Burn 3,000 active calories', 'Accumulate 3,000 active burned calories across workouts and daily activities.', 'calories', 3000, 'kcal', 400, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days');

-- Seed achievements
INSERT INTO achievements (code, title, description, icon, points_reward)
VALUES
('FIRST_WORKOUT', 'First Blood', 'Complete your very first workout session', 'dumbbell', 50),
('STREAK_7', 'Unstoppable Momentum', 'Maintain a 7-day workout streak', 'fire', 150),
('CHALLENGE_MASTER', 'Challenge Conqueror', 'Complete your first fitness challenge', 'trophy', 200),
('FORM_PERFECTION', 'Biomechanics Master', 'Score 90+ on an AI exercise form check', 'sparkles', 100)
ON CONFLICT (code) DO NOTHING;

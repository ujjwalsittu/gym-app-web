// Comprehensive exercise library with animation data, instructions, and muscle targets
// This data is cached offline for gym use

export interface Exercise {
  name: string
  category: 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'stretching' | 'full_body'
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  tips: string[]
  animationFrames: number // Number of SVG frames for animation
  caloriesPerMinute: number
}

export const exerciseLibrary: Exercise[] = [
  // UPPER BODY - CHEST
  {
    name: 'Bench Press',
    category: 'upper_body',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench with feet flat on floor',
      'Grip bar slightly wider than shoulder width',
      'Lower bar to mid-chest',
      'Press up until arms are extended',
      'Keep core engaged throughout'
    ],
    tips: ['Keep shoulder blades pinched', 'Do not bounce bar off chest', 'Breathe out on push'],
    animationFrames: 30,
    caloriesPerMinute: 8
  },
  {
    name: 'Push Up',
    category: 'upper_body',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Keep body in straight line from head to heels',
      'Lower chest to just above ground',
      'Push back up to starting position',
      'Keep elbows at 45-degree angle'
    ],
    tips: ['Engage core throughout', 'Do not let hips sag', 'Full range of motion'],
    animationFrames: 24,
    caloriesPerMinute: 7
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'upper_body',
    muscleGroups: ['upper chest', 'shoulders', 'triceps'],
    equipment: ['dumbbells', 'incline bench'],
    difficulty: 'intermediate',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Hold dumbbells at shoulder level',
      'Press weights up until arms extended',
      'Lower with control to starting position'
    ],
    tips: ['Keep wrists straight', 'Control the negative', 'Do not lock elbows'],
    animationFrames: 28,
    caloriesPerMinute: 7
  },
  {
    name: 'Chest Fly',
    category: 'upper_body',
    muscleGroups: ['chest'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'beginner',
    instructions: [
      'Lie on flat bench holding dumbbells above chest',
      'Slight bend in elbows',
      'Lower arms out to sides in arc motion',
      'Squeeze chest to bring weights back together'
    ],
    tips: ['Feel the stretch at bottom', 'Do not go too deep', 'Control movement'],
    animationFrames: 26,
    caloriesPerMinute: 5
  },

  // UPPER BODY - BACK
  {
    name: 'Pull Up',
    category: 'upper_body',
    muscleGroups: ['lats', 'biceps', 'upper back'],
    equipment: ['pull-up bar'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull body up until chin over bar',
      'Lower with control to full extension',
      'Keep core engaged'
    ],
    tips: ['Avoid swinging', 'Lead with chest', 'Full range of motion'],
    animationFrames: 32,
    caloriesPerMinute: 10
  },
  {
    name: 'Lat Pulldown',
    category: 'upper_body',
    muscleGroups: ['lats', 'biceps', 'upper back'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit at lat pulldown machine',
      'Grip bar wider than shoulder width',
      'Pull bar down to upper chest',
      'Slowly return to starting position'
    ],
    tips: ['Lean back slightly', 'Squeeze shoulder blades', 'Avoid using momentum'],
    animationFrames: 28,
    caloriesPerMinute: 6
  },
  {
    name: 'Bent Over Row',
    category: 'upper_body',
    muscleGroups: ['lats', 'rhomboids', 'biceps', 'lower back'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
    instructions: [
      'Hinge at hips with slight knee bend',
      'Hold barbell with overhand grip',
      'Pull bar to lower chest/upper abs',
      'Lower with control'
    ],
    tips: ['Keep back flat', 'Squeeze at top', 'Avoid rounding spine'],
    animationFrames: 26,
    caloriesPerMinute: 8
  },
  {
    name: 'Seated Cable Row',
    category: 'upper_body',
    muscleGroups: ['lats', 'rhomboids', 'biceps'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit at cable row station',
      'Grasp handles with arms extended',
      'Pull handles to midsection',
      'Squeeze shoulder blades together',
      'Return with control'
    ],
    tips: ['Keep chest up', 'Do not lean back excessively', 'Focus on back contraction'],
    animationFrames: 24,
    caloriesPerMinute: 6
  },

  // UPPER BODY - SHOULDERS
  {
    name: 'Shoulder Press',
    category: 'upper_body',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Sit or stand with dumbbells at shoulder height',
      'Press weights overhead until arms extended',
      'Lower with control to starting position'
    ],
    tips: ['Keep core tight', 'Do not arch lower back', 'Full range of motion'],
    animationFrames: 26,
    caloriesPerMinute: 7
  },
  {
    name: 'Lateral Raise',
    category: 'upper_body',
    muscleGroups: ['lateral deltoids'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand with dumbbells at sides',
      'Raise arms out to sides until parallel to ground',
      'Lower with control'
    ],
    tips: ['Slight bend in elbows', 'Lead with elbows', 'Use lighter weight with strict form'],
    animationFrames: 22,
    caloriesPerMinute: 4
  },
  {
    name: 'Front Raise',
    category: 'upper_body',
    muscleGroups: ['front deltoids'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand with dumbbells in front of thighs',
      'Raise one or both arms to shoulder height',
      'Lower with control'
    ],
    tips: ['Avoid swinging', 'Keep core engaged', 'Control throughout'],
    animationFrames: 22,
    caloriesPerMinute: 4
  },
  {
    name: 'Reverse Fly',
    category: 'upper_body',
    muscleGroups: ['rear deltoids', 'upper back'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Bend forward at hips',
      'Hold dumbbells hanging below chest',
      'Raise arms out to sides',
      'Squeeze shoulder blades',
      'Lower with control'
    ],
    tips: ['Keep back flat', 'Light weights', 'Focus on squeeze'],
    animationFrames: 24,
    caloriesPerMinute: 4
  },

  // UPPER BODY - ARMS
  {
    name: 'Bicep Curl',
    category: 'upper_body',
    muscleGroups: ['biceps'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand with dumbbells at sides',
      'Curl weights to shoulders',
      'Lower with control'
    ],
    tips: ['Keep elbows fixed', 'Full range of motion', 'Avoid swinging'],
    animationFrames: 22,
    caloriesPerMinute: 4
  },
  {
    name: 'Hammer Curl',
    category: 'upper_body',
    muscleGroups: ['biceps', 'forearms'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand with dumbbells at sides, palms facing in',
      'Curl weights to shoulders keeping palms facing each other',
      'Lower with control'
    ],
    tips: ['Neutral grip throughout', 'Control the movement', 'No swinging'],
    animationFrames: 22,
    caloriesPerMinute: 4
  },
  {
    name: 'Tricep Pushdown',
    category: 'upper_body',
    muscleGroups: ['triceps'],
    equipment: ['cable machine'],
    difficulty: 'beginner',
    instructions: [
      'Stand at cable machine with bar at chest height',
      'Push bar down until arms fully extended',
      'Return with control'
    ],
    tips: ['Keep elbows at sides', 'Squeeze at bottom', 'Avoid leaning forward'],
    animationFrames: 22,
    caloriesPerMinute: 4
  },
  {
    name: 'Tricep Dip',
    category: 'upper_body',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    equipment: ['dip bars', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Support body on dip bars or bench',
      'Lower body by bending elbows',
      'Push back up to starting position'
    ],
    tips: ['Keep elbows close', 'Control descent', 'Do not lock elbows at top'],
    animationFrames: 26,
    caloriesPerMinute: 7
  },
  {
    name: 'Skull Crusher',
    category: 'upper_body',
    muscleGroups: ['triceps'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on bench holding bar above chest',
      'Lower bar to forehead by bending elbows',
      'Extend arms back to start'
    ],
    tips: ['Keep upper arms still', 'Control movement', 'Do not flare elbows'],
    animationFrames: 24,
    caloriesPerMinute: 5
  },

  // LOWER BODY
  {
    name: 'Squat',
    category: 'lower_body',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['barbell', 'rack'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Bar across upper back',
      'Lower by pushing hips back and bending knees',
      'Descend until thighs parallel to ground',
      'Drive up through heels'
    ],
    tips: ['Keep chest up', 'Knees track over toes', 'Depth is important'],
    animationFrames: 30,
    caloriesPerMinute: 10
  },
  {
    name: 'Deadlift',
    category: 'lower_body',
    muscleGroups: ['hamstrings', 'glutes', 'lower back', 'traps'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Hinge at hips to grip bar',
      'Drive through floor to stand up',
      'Keep bar close to body',
      'Lower with control'
    ],
    tips: ['Neutral spine always', 'Engage lats', 'Push floor away'],
    animationFrames: 32,
    caloriesPerMinute: 12
  },
  {
    name: 'Leg Press',
    category: 'lower_body',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['leg press machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit in leg press machine',
      'Place feet shoulder-width on platform',
      'Lower platform by bending knees',
      'Press back to start without locking knees'
    ],
    tips: ['Keep lower back pressed to pad', 'Control the negative', 'Do not lock knees'],
    animationFrames: 26,
    caloriesPerMinute: 8
  },
  {
    name: 'Lunge',
    category: 'lower_body',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet together',
      'Step forward and lower until both knees at 90 degrees',
      'Push off front foot to return',
      'Alternate legs'
    ],
    tips: ['Keep torso upright', 'Front knee over ankle', 'Control movement'],
    animationFrames: 28,
    caloriesPerMinute: 8
  },
  {
    name: 'Romanian Deadlift',
    category: 'lower_body',
    muscleGroups: ['hamstrings', 'glutes', 'lower back'],
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Stand holding bar at thighs',
      'Hinge at hips, lowering bar along legs',
      'Feel stretch in hamstrings',
      'Return to standing'
    ],
    tips: ['Slight knee bend', 'Keep bar close', 'Neutral spine'],
    animationFrames: 26,
    caloriesPerMinute: 8
  },
  {
    name: 'Leg Curl',
    category: 'lower_body',
    muscleGroups: ['hamstrings'],
    equipment: ['leg curl machine'],
    difficulty: 'beginner',
    instructions: [
      'Lie face down on leg curl machine',
      'Curl heels toward glutes',
      'Squeeze at top',
      'Lower with control'
    ],
    tips: ['Avoid lifting hips', 'Full range of motion', 'Control movement'],
    animationFrames: 22,
    caloriesPerMinute: 5
  },
  {
    name: 'Leg Extension',
    category: 'lower_body',
    muscleGroups: ['quadriceps'],
    equipment: ['leg extension machine'],
    difficulty: 'beginner',
    instructions: [
      'Sit in leg extension machine',
      'Extend legs until straight',
      'Squeeze quads at top',
      'Lower with control'
    ],
    tips: ['Do not hyperextend', 'Control throughout', 'Focus on contraction'],
    animationFrames: 22,
    caloriesPerMinute: 5
  },
  {
    name: 'Calf Raise',
    category: 'lower_body',
    muscleGroups: ['calves'],
    equipment: ['none', 'dumbbells'],
    difficulty: 'beginner',
    instructions: [
      'Stand on edge of step or flat ground',
      'Rise up on toes',
      'Pause at top',
      'Lower heels below starting point'
    ],
    tips: ['Full range of motion', 'Slow and controlled', 'Squeeze at top'],
    animationFrames: 20,
    caloriesPerMinute: 4
  },
  {
    name: 'Hip Thrust',
    category: 'lower_body',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Sit with upper back against bench',
      'Barbell across hips',
      'Drive hips up until body forms straight line',
      'Squeeze glutes at top',
      'Lower with control'
    ],
    tips: ['Chin tucked', 'Posterior pelvic tilt at top', 'Drive through heels'],
    animationFrames: 26,
    caloriesPerMinute: 7
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'lower_body',
    muscleGroups: ['quadriceps', 'glutes'],
    equipment: ['dumbbells', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Stand facing away from bench',
      'Place rear foot on bench behind you',
      'Lower until front thigh parallel',
      'Drive up through front heel'
    ],
    tips: ['Keep torso upright', 'Front knee over ankle', 'Control descent'],
    animationFrames: 28,
    caloriesPerMinute: 8
  },

  // CORE
  {
    name: 'Plank',
    category: 'core',
    muscleGroups: ['abs', 'obliques', 'lower back'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Start in push-up position on forearms',
      'Keep body in straight line',
      'Engage core',
      'Hold position'
    ],
    tips: ['Do not let hips sag', 'Breathe normally', 'Keep neck neutral'],
    animationFrames: 10,
    caloriesPerMinute: 4
  },
  {
    name: 'Crunch',
    category: 'core',
    muscleGroups: ['abs'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back with knees bent',
      'Hands behind head',
      'Curl shoulders off ground',
      'Lower with control'
    ],
    tips: ['Do not pull on neck', 'Exhale on crunch', 'Focus on contraction'],
    animationFrames: 20,
    caloriesPerMinute: 5
  },
  {
    name: 'Russian Twist',
    category: 'core',
    muscleGroups: ['obliques', 'abs'],
    equipment: ['none', 'weight plate'],
    difficulty: 'beginner',
    instructions: [
      'Sit with knees bent, feet off ground',
      'Lean back slightly',
      'Rotate torso side to side',
      'Touch weight to ground each side'
    ],
    tips: ['Keep chest up', 'Control rotation', 'Engage core throughout'],
    animationFrames: 24,
    caloriesPerMinute: 6
  },
  {
    name: 'Leg Raise',
    category: 'core',
    muscleGroups: ['lower abs', 'hip flexors'],
    equipment: ['none'],
    difficulty: 'intermediate',
    instructions: [
      'Lie on back with legs straight',
      'Raise legs to vertical',
      'Lower with control',
      'Keep lower back pressed to floor'
    ],
    tips: ['Do not swing', 'Slow and controlled', 'Hands under glutes for support'],
    animationFrames: 24,
    caloriesPerMinute: 5
  },
  {
    name: 'Mountain Climber',
    category: 'core',
    muscleGroups: ['abs', 'hip flexors', 'shoulders'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Start in push-up position',
      'Drive one knee toward chest',
      'Quickly switch legs',
      'Continue alternating'
    ],
    tips: ['Keep hips level', 'Core tight', 'Maintain steady pace'],
    animationFrames: 28,
    caloriesPerMinute: 10
  },
  {
    name: 'Dead Bug',
    category: 'core',
    muscleGroups: ['abs', 'hip flexors'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, arms extended up',
      'Knees bent at 90 degrees',
      'Lower opposite arm and leg',
      'Return and repeat other side'
    ],
    tips: ['Keep lower back flat', 'Move slowly', 'Breathe out as you extend'],
    animationFrames: 26,
    caloriesPerMinute: 4
  },
  {
    name: 'Bicycle Crunch',
    category: 'core',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Lie on back, hands behind head',
      'Bring knee to opposite elbow',
      'Extend other leg',
      'Alternate sides in cycling motion'
    ],
    tips: ['Do not pull on neck', 'Full rotation', 'Control movement'],
    animationFrames: 26,
    caloriesPerMinute: 7
  },

  // CARDIO
  {
    name: 'Jumping Jack',
    category: 'cardio',
    muscleGroups: ['full body'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet together, arms at sides',
      'Jump feet apart while raising arms overhead',
      'Jump back to starting position',
      'Repeat continuously'
    ],
    tips: ['Land softly', 'Keep steady rhythm', 'Engage core'],
    animationFrames: 20,
    caloriesPerMinute: 8
  },
  {
    name: 'Burpee',
    category: 'cardio',
    muscleGroups: ['full body'],
    equipment: ['none'],
    difficulty: 'intermediate',
    instructions: [
      'Start standing',
      'Drop into squat, hands on floor',
      'Jump feet back to plank',
      'Do a push-up',
      'Jump feet forward',
      'Jump up with arms overhead'
    ],
    tips: ['Move quickly but controlled', 'Land softly', 'Full extension on jump'],
    animationFrames: 36,
    caloriesPerMinute: 12
  },
  {
    name: 'High Knees',
    category: 'cardio',
    muscleGroups: ['hip flexors', 'quadriceps'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Stand tall',
      'Run in place bringing knees to hip height',
      'Pump arms',
      'Maintain quick pace'
    ],
    tips: ['Stay on balls of feet', 'Keep core tight', 'Drive knees up'],
    animationFrames: 24,
    caloriesPerMinute: 10
  },
  {
    name: 'Box Jump',
    category: 'cardio',
    muscleGroups: ['quadriceps', 'glutes', 'calves'],
    equipment: ['plyo box'],
    difficulty: 'intermediate',
    instructions: [
      'Stand facing box',
      'Bend knees and swing arms back',
      'Jump onto box landing softly',
      'Stand fully',
      'Step down and repeat'
    ],
    tips: ['Land softly', 'Full hip extension on top', 'Start with lower box'],
    animationFrames: 28,
    caloriesPerMinute: 10
  },
  {
    name: 'Jump Rope',
    category: 'cardio',
    muscleGroups: ['calves', 'shoulders', 'core'],
    equipment: ['jump rope'],
    difficulty: 'beginner',
    instructions: [
      'Hold rope handles at hip level',
      'Rotate wrists to swing rope',
      'Jump with both feet',
      'Land softly on balls of feet'
    ],
    tips: ['Small jumps', 'Stay relaxed', 'Use wrists not arms'],
    animationFrames: 18,
    caloriesPerMinute: 11
  },

  // STRETCHING
  {
    name: 'Hamstring Stretch',
    category: 'stretching',
    muscleGroups: ['hamstrings'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Sit with one leg extended',
      'Bend other knee, foot against inner thigh',
      'Reach toward extended foot',
      'Hold stretch'
    ],
    tips: ['Keep back straight', 'Breathe deeply', 'No bouncing'],
    animationFrames: 12,
    caloriesPerMinute: 2
  },
  {
    name: 'Quad Stretch',
    category: 'stretching',
    muscleGroups: ['quadriceps'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Stand on one leg',
      'Pull other foot toward glutes',
      'Keep knees together',
      'Hold stretch'
    ],
    tips: ['Hold something for balance', 'Keep hips forward', 'Stand tall'],
    animationFrames: 10,
    caloriesPerMinute: 2
  },
  {
    name: 'Hip Flexor Stretch',
    category: 'stretching',
    muscleGroups: ['hip flexors'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Kneel on one knee',
      'Other foot forward, knee at 90 degrees',
      'Push hips forward',
      'Feel stretch in front of hip'
    ],
    tips: ['Keep torso upright', 'Squeeze glute of back leg', 'Hold position'],
    animationFrames: 10,
    caloriesPerMinute: 2
  },
  {
    name: 'Chest Stretch',
    category: 'stretching',
    muscleGroups: ['chest', 'shoulders'],
    equipment: ['doorway', 'wall'],
    difficulty: 'beginner',
    instructions: [
      'Stand in doorway',
      'Place forearm on door frame',
      'Step forward through doorway',
      'Feel stretch across chest'
    ],
    tips: ['Keep shoulder blade back', 'Different arm angles', 'Breathe deeply'],
    animationFrames: 10,
    caloriesPerMinute: 2
  },
  {
    name: 'Cat-Cow Stretch',
    category: 'stretching',
    muscleGroups: ['spine', 'abs', 'back'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Start on hands and knees',
      'Arch back, drop belly (cow)',
      'Round back, tuck chin (cat)',
      'Flow between positions'
    ],
    tips: ['Move with breath', 'Slow controlled movements', 'Full range of motion'],
    animationFrames: 24,
    caloriesPerMinute: 2
  },
  {
    name: 'Shoulder Stretch',
    category: 'stretching',
    muscleGroups: ['shoulders', 'upper back'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: [
      'Bring one arm across chest',
      'Use other hand to pull arm closer',
      'Keep shoulder down',
      'Hold stretch'
    ],
    tips: ['Keep shoulder relaxed', 'Do not rotate torso', 'Breathe deeply'],
    animationFrames: 10,
    caloriesPerMinute: 2
  }
]

// Get exercise by name (case insensitive)
export function getExercise(name: string): Exercise | undefined {
  return exerciseLibrary.find(
    e => e.name.toLowerCase() === name.toLowerCase() ||
         e.name.toLowerCase().includes(name.toLowerCase()) ||
         name.toLowerCase().includes(e.name.toLowerCase())
  )
}

// Get exercises by category
export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return exerciseLibrary.filter(e => e.category === category)
}

// Get exercises by muscle group
export function getExercisesByMuscle(muscleGroup: string): Exercise[] {
  return exerciseLibrary.filter(e => 
    e.muscleGroups.some(m => m.toLowerCase().includes(muscleGroup.toLowerCase()))
  )
}

// Get exercises by difficulty
export function getExercisesByDifficulty(difficulty: Exercise['difficulty']): Exercise[] {
  return exerciseLibrary.filter(e => e.difficulty === difficulty)
}

// Get exercises that need no equipment
export function getBodyweightExercises(): Exercise[] {
  return exerciseLibrary.filter(e => 
    e.equipment.includes('none') || e.equipment.length === 0
  )
}

// Calculate total calories for a workout
export function calculateWorkoutCalories(exercises: { name: string; durationMinutes: number }[]): number {
  return exercises.reduce((total, ex) => {
    const exercise = getExercise(ex.name)
    return total + (exercise?.caloriesPerMinute || 5) * ex.durationMinutes
  }, 0)
}

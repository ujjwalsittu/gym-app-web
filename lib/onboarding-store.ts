import { create } from 'zustand'

export interface OnboardingData {
  // Step 1: Personal Info
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  height: number | null // in cm
  weight: number | null // in kg
  
  // Step 2: Lifestyle
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  sleepHours: number | null
  occupation: 'desk_job' | 'standing_job' | 'physical_job' | 'student' | 'other' | null
  stressLevel: 'low' | 'moderate' | 'high' | 'very_high' | null
  
  // Step 3: Diet & Habits
  dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'other' | null
  mealsPerDay: number | null
  waterIntake: number | null // glasses per day
  supplements: string[]
  
  // Step 4: Habits (Smoke/Drink)
  smokingStatus: 'never' | 'former' | 'occasional' | 'regular' | null
  alcoholConsumption: 'never' | 'occasional' | 'moderate' | 'frequent' | null
  caffeineIntake: 'none' | 'low' | 'moderate' | 'high' | null
  
  // Step 5: Fitness Goals
  primaryGoal: 'lose_weight' | 'build_muscle' | 'get_fit' | 'improve_health' | 'increase_strength' | 'improve_flexibility' | null
  targetWeight: number | null
  workoutDaysPerWeek: number | null
  workoutDuration: number | null // in minutes
  gymAccess: boolean | null
  equipmentAtHome: string[]
  
  // Step 6: Medical & Injuries
  medicalConditions: string[]
  injuries: string[]
  medications: string[]
  allergies: string[]
  
  // Step 7: Body Photos
  photoFront: string | null // blob URL or uploaded URL
  photoLeft: string | null
  photoRight: string | null
  
  // Step 8: Location
  country: string | null
  state: string | null
  city: string | null
  timezone: string | null
}

interface OnboardingStore {
  currentStep: number
  data: OnboardingData
  setStep: (step: number) => void
  updateData: (data: Partial<OnboardingData>) => void
  reset: () => void
}

const initialData: OnboardingData = {
  age: null,
  gender: null,
  height: null,
  weight: null,
  activityLevel: null,
  sleepHours: null,
  occupation: null,
  stressLevel: null,
  dietType: null,
  mealsPerDay: null,
  waterIntake: null,
  supplements: [],
  smokingStatus: null,
  alcoholConsumption: null,
  caffeineIntake: null,
  primaryGoal: null,
  targetWeight: null,
  workoutDaysPerWeek: null,
  workoutDuration: null,
  gymAccess: null,
  equipmentAtHome: [],
  medicalConditions: [],
  injuries: [],
  medications: [],
  allergies: [],
  photoFront: null,
  photoLeft: null,
  photoRight: null,
  country: null,
  state: null,
  city: null,
  timezone: null
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  currentStep: 1,
  data: initialData,
  setStep: (step) => set({ currentStep: step }),
  updateData: (newData) => set((state) => ({ 
    data: { ...state.data, ...newData } 
  })),
  reset: () => set({ currentStep: 1, data: initialData })
}))

export const TOTAL_STEPS = 8

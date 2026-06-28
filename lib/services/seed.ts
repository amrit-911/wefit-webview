/**
 * lib/services/seed.ts
 * 
 * One-time seeder for static data (exercises + nutrition items).
 * Call seedDatabase() from admin settings or run once via a button.
 * It checks if data already exists before seeding to avoid duplicates.
 */

import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EXERCISES_SEED = [
  { name: "Bench Press",      category: "Chest",     muscle: "Pectorals",        equipment: "Barbell",      difficulty: "Intermediate", sets: 3, reps: "10" },
  { name: "Squat",            category: "Legs",      muscle: "Quadriceps",        equipment: "Barbell",      difficulty: "Intermediate", sets: 4, reps: "8"  },
  { name: "Deadlift",         category: "Back",      muscle: "Hamstrings",        equipment: "Barbell",      difficulty: "Advanced",     sets: 3, reps: "6"  },
  { name: "Pull-Up",          category: "Back",      muscle: "Latissimus Dorsi",  equipment: "Pull-up Bar",  difficulty: "Intermediate", sets: 3, reps: "12" },
  { name: "Shoulder Press",   category: "Shoulders", muscle: "Deltoids",          equipment: "Dumbbell",     difficulty: "Beginner",     sets: 3, reps: "12" },
  { name: "Bicep Curl",       category: "Arms",      muscle: "Biceps",            equipment: "Dumbbell",     difficulty: "Beginner",     sets: 3, reps: "15" },
  { name: "Plank",            category: "Core",      muscle: "Abdominals",        equipment: "None",         difficulty: "Beginner",     sets: 3, reps: "60s"},
  { name: "Lunges",           category: "Legs",      muscle: "Glutes",            equipment: "None",         difficulty: "Beginner",     sets: 3, reps: "12" },
  { name: "Tricep Dips",      category: "Arms",      muscle: "Triceps",           equipment: "Parallel Bars",difficulty: "Intermediate", sets: 3, reps: "12" },
  { name: "Leg Press",        category: "Legs",      muscle: "Quadriceps",        equipment: "Machine",      difficulty: "Beginner",     sets: 3, reps: "15" },
  { name: "Cable Rows",       category: "Back",      muscle: "Rhomboids",         equipment: "Cable",        difficulty: "Intermediate", sets: 3, reps: "12" },
  { name: "Lateral Raises",   category: "Shoulders", muscle: "Deltoids",          equipment: "Dumbbell",     difficulty: "Beginner",     sets: 3, reps: "15" },
];

const NUTRITION_SEED = [
  { name: "Almond",           quantity: 1,   calories: "7.00",   carbs: "0.24",  protein: "0.26",  fats: "0.61"  },
  { name: "Almond Butter",    quantity: 7,   calories: "47.00",  carbs: "1.30",  protein: "1.50",  fats: "4.00"  },
  { name: "Almond Milk",      quantity: 240, calories: "30.00",  carbs: "1.00",  protein: "1.00",  fats: "2.50"  },
  { name: "Avocado",          quantity: 1,   calories: "80.00",  carbs: "4.00",  protein: "1.00",  fats: "7.00"  },
  { name: "Banana",           quantity: 1,   calories: "105.00", carbs: "27.00", protein: "1.30",  fats: "0.30"  },
  { name: "Beef (Lean)",      quantity: 100, calories: "250.00", carbs: "0.00",  protein: "26.00", fats: "15.00" },
  { name: "Black Beans",      quantity: 100, calories: "132.00", carbs: "23.70", protein: "8.90",  fats: "0.50"  },
  { name: "Blueberries",      quantity: 100, calories: "57.00",  carbs: "14.50", protein: "0.70",  fats: "0.30"  },
  { name: "Broccoli",         quantity: 100, calories: "34.00",  carbs: "6.60",  protein: "2.80",  fats: "0.40"  },
  { name: "Brown Rice",       quantity: 100, calories: "111.00", carbs: "23.00", protein: "2.60",  fats: "0.90"  },
  { name: "Chicken Breast",   quantity: 100, calories: "165.00", carbs: "0.00",  protein: "31.00", fats: "3.60"  },
  { name: "Eggs (Large)",     quantity: 1,   calories: "72.00",  carbs: "0.40",  protein: "6.30",  fats: "4.80"  },
  { name: "Greek Yogurt",     quantity: 100, calories: "59.00",  carbs: "3.60",  protein: "10.00", fats: "0.40"  },
  { name: "Oatmeal",          quantity: 100, calories: "68.00",  carbs: "11.50", protein: "2.40",  fats: "1.40"  },
  { name: "Peanut Butter",    quantity: 32,  calories: "188.00", carbs: "6.30",  protein: "7.70",  fats: "16.00" },
  { name: "Salmon",           quantity: 100, calories: "208.00", carbs: "0.00",  protein: "20.00", fats: "13.00" },
  { name: "Spinach",          quantity: 100, calories: "23.00",  carbs: "3.60",  protein: "2.90",  fats: "0.40"  },
  { name: "Sweet Potato",     quantity: 100, calories: "86.00",  carbs: "20.10", protein: "1.60",  fats: "0.10"  },
  { name: "Tofu (Firm)",      quantity: 100, calories: "144.00", carbs: "2.80",  protein: "15.80", fats: "8.70"  },
  { name: "Tuna (Canned)",    quantity: 100, calories: "116.00", carbs: "0.00",  protein: "25.50", fats: "0.80"  },
  { name: "Walnuts",          quantity: 28,  calories: "185.00", carbs: "3.90",  protein: "4.30",  fats: "18.50" },
  { name: "Whey Protein",     quantity: 30,  calories: "120.00", carbs: "3.00",  protein: "25.00", fats: "1.50"  },
  { name: "Quinoa",           quantity: 100, calories: "120.00", carbs: "21.30", protein: "4.40",  fats: "1.90"  },
  { name: "Milk (Whole)",     quantity: 240, calories: "149.00", carbs: "11.70", protein: "7.70",  fats: "8.00"  },
  { name: "Apple",            quantity: 1,   calories: "95.00",  carbs: "25.00", protein: "0.50",  fats: "0.30"  },
];

export async function seedDatabase(): Promise<{ exercises: number; nutrition: number }> {
  if (!db) throw new Error("Firestore not initialized");

  let exercisesSeeded = 0;
  let nutritionSeeded = 0;

  // ── Exercises ────────────────────────────────────────────────────────────────
  const exSnap = await getDocs(collection(db, "exercises"));
  if (exSnap.empty) {
    const batch = writeBatch(db);
    for (const ex of EXERCISES_SEED) {
      const ref = doc(collection(db, "exercises"));
      batch.set(ref, ex);
      exercisesSeeded++;
    }
    await batch.commit();
  }

  // ── Nutrition Items ─────────────────────────────────────────────────────────
  const nutSnap = await getDocs(collection(db, "nutrition_items"));
  if (nutSnap.empty) {
    const batch = writeBatch(db);
    for (const item of NUTRITION_SEED) {
      const ref = doc(collection(db, "nutrition_items"));
      batch.set(ref, item);
      nutritionSeeded++;
    }
    await batch.commit();
  }

  return { exercises: exercisesSeeded, nutrition: nutritionSeeded };
}

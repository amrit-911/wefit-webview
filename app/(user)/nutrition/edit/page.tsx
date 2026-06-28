"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { X, Info } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getClientNutritionPlan, NutritionItem } from "@/lib/services/client-nutrition.service";

function EditFoodContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Expect ?meal=0&item=1 (meal section index & item index within that section)
  const mealIdx = parseInt(searchParams.get("meal") || "0");
  const itemIdx = parseInt(searchParams.get("item") || "0");

  const [food, setFood] = useState<NutritionItem | null>(null);
  const [mealLabel, setMealLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getClientNutritionPlan(user.uid).then((plan) => {
      if (plan) {
        // Search workoutDay first, then offDay
        const allMeals = [
          ...plan.workoutDay.meals,
          ...plan.offDay.meals,
        ];
        if (allMeals[mealIdx]) {
          const section = allMeals[mealIdx];
          setMealLabel(section.meal);
          setFood(section.items[itemIdx] || null);
        }
      }
      setLoading(false);
    });
  }, [user, mealIdx, itemIdx]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-[#121212] pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-5 pt-10 border-b border-[#2c2c2e]">
        <h1 className="text-[18px] font-bold text-white">Food Details</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-5 pt-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 w-40 bg-[#2a2a2c] rounded" />
            <div className="h-4 w-24 bg-[#2a2a2c] rounded" />
            <div className="h-24 bg-[#2a2a2c] rounded-xl mt-4" />
          </div>
        ) : !food ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Info className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-gray-400 font-bold text-[13px]">Food item not found</p>
            <p className="text-gray-600 text-[11px] mt-1">Your nutrition plan may have changed.</p>
            <button onClick={() => router.back()} className="mt-6 text-[#a3e635] text-[12px] font-bold">← Go back</button>
          </div>
        ) : (
          <>
            {mealLabel && (
              <p className="text-[10px] text-[#a3e635] font-extrabold tracking-widest mb-2 uppercase">{mealLabel}</p>
            )}
            <h2 className="text-[20px] font-extrabold text-white mb-1 tracking-wide uppercase">{food.name}</h2>
            {food.quantity && (
              <p className="text-[12px] text-gray-400 mb-6">{food.quantity}</p>
            )}

            {/* Macro Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "CALORIES", value: food.kcal, unit: "kcal", color: "#a3e635" },
                { label: "PROTEIN", value: food.protein, unit: "g", color: "#34d399" },
                { label: "CARBS", value: food.carbs, unit: "g", color: "#60a5fa" },
                { label: "FATS", value: food.fats, unit: "g", color: "#f59e0b" },
              ].map((macro) => (
                <div key={macro.label} className="bg-[#1c1c1e] rounded-xl p-4 border border-[#2a2a2c]">
                  <p className="text-[9px] font-bold tracking-widest mb-1" style={{ color: macro.color }}>{macro.label}</p>
                  <p className="text-[24px] font-extrabold text-white leading-none">{macro.value ?? "—"}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{macro.unit}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-600 text-center mt-2">
              This food item is assigned by your trainer and cannot be edited.
            </p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function EditFoodPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EditFoodContent />
    </Suspense>
  );
}

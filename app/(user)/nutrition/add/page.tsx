"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AddFoodPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealType = searchParams.get("meal") || "Breakfast";

  const foods = [
    { name: "CHICKEN BREAST", amount: "100g", kcal: 165 },
    { name: "EGGS ( 2 WHOLE)", amount: "", kcal: 143 },
    { name: "GREEK YOGURT", amount: "100g", kcal: 59 },
    { name: "OATS", amount: "100g", kcal: 389 },
    { name: "WHEY PROTEIN SHAKE", amount: "", kcal: 120 },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-[#121212] pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-5 pt-10 border-b border-[#2c2c2e]">
        <h1 className="text-[18px] font-bold text-white capitalize">
          Add to {mealType.replace("-", " ")}
        </h1>
        <button 
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-5 pt-6">
        <h2 className="text-[12px] font-bold text-gray-500 mb-4 tracking-wider">COMMON FOODS</h2>

        <div className="flex flex-col gap-3">
          {foods.map((food, i) => (
            <AddFoodItem 
              key={i} 
              name={food.name} 
              amount={food.amount} 
              kcal={food.kcal} 
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function AddFoodItem({ name, amount, kcal }: { name: string, amount: string, kcal: number }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl flex justify-between items-center p-4">
      <div>
        <h3 className="text-[13px] font-bold text-white mb-1 uppercase tracking-wide">{name}</h3>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 transition-colors">
          {amount && <span>{amount}</span>}
          {amount && <span className="text-[8px]">•</span>}
          <span>{kcal}kcal</span>
        </div>
      </div>
      <button className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
        <Plus className="w-5 h-5 text-black font-bold" strokeWidth={3} />
      </button>
    </div>
  );
}

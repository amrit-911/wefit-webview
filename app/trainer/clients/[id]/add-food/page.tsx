"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, X, Check } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getClientNutritionPlan,
  saveClientNutritionPlan,
  type MealSection,
  type DayNutrition,
} from "@/lib/services/client-nutrition.service";
import {
  getNutritionItems,
  type NutritionItem as MasterItem,
} from "@/lib/services/nutrition.service";

type Mode = "workout" | "off";

const EMPTY_FORM = {
  foodName: "",
  quantity: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  note: "",
};

function AddFoodContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string;
  const mealName = searchParams.get("meal") ?? "Meal 1";
  const mode = (searchParams.get("mode") as Mode) ?? "workout";
  const editMealIdx = searchParams.get("editMeal");
  const editItemIdx = searchParams.get("editItem");
  const isEditMode = editMealIdx !== null && editItemIdx !== null;
  const { user } = useAuth();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store a reference state to scale macros when quantity changes.
  // If the user manually edits a macro, we nullify this to prevent overriding their manual input.
  const [macroRef, setMacroRef] = useState<{
    qty: number;
    kcal: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  // Master nutrition items search
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNutritionItems()
      .then(setMasterItems)
      .catch(console.error);
  }, []);

  // Prefill form when in edit mode
  useEffect(() => {
    if (!isEditMode || !user) return;
    getClientNutritionPlan(clientId).then((plan) => {
      if (!plan) return;
      const day = mode === "workout" ? plan.workoutDay : plan.offDay;
      const mIdx = parseInt(editMealIdx!);
      const iIdx = parseInt(editItemIdx!);
      const item = day.meals[mIdx]?.items[iIdx];
      if (item) {
        setForm({
          foodName: item.name,
          quantity: item.quantity ?? "",
          calories: String(item.kcal),
          protein: String(item.protein),
          carbs: String(item.carbs),
          fats: String(item.fats),
          note: item.note ?? "",
        });
        setSearchQuery(item.name);
        
        const qtyNum = parseFloat(String(item.quantity || "1").replace(/[^\d.]/g, ""));
        if (!isNaN(qtyNum) && qtyNum > 0) {
          setMacroRef({
            qty: qtyNum,
            kcal: item.kcal || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fats: item.fats || 0,
          });
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredItems = masterItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (item: MasterItem) => {
    const qtyStr = item.quantity ? `${item.quantity}${item.measurement ?? ""}` : "";
    setForm({
      foodName: item.name,
      quantity: qtyStr,
      calories: item.calories ?? "",
      protein: item.protein ?? "",
      carbs: item.carbs ?? "",
      fats: item.fats ?? "",
      note: form.note, // preserve existing note
    });
    setSearchQuery(item.name);
    setShowDropdown(false);

    const qtyNum = parseFloat(qtyStr.replace(/[^\d.]/g, ""));
    if (!isNaN(qtyNum) && qtyNum > 0) {
      setMacroRef({
        qty: qtyNum,
        kcal: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fats: Number(item.fats) || 0,
      });
    } else {
      setMacroRef(null);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // If user manually inputs macro, break the reference to stop auto-scaling
    if (["calories", "protein", "carbs", "fats"].includes(field)) {
      setMacroRef(null);
    }
  };

  const handleQuantityChange = (val: string) => {
    setForm((prev) => ({ ...prev, quantity: val }));
    if (macroRef) {
      const num = parseFloat(val.replace(/[^\d.]/g, ""));
      if (!isNaN(num) && num > 0) {
        const ratio = num / macroRef.qty;
        setForm((prev) => ({
          ...prev,
          quantity: val,
          calories: Math.round(macroRef.kcal * ratio).toString(),
          protein: Number((macroRef.protein * ratio).toFixed(1)).toString(),
          carbs: Number((macroRef.carbs * ratio).toFixed(1)).toString(),
          fats: Number((macroRef.fats * ratio).toFixed(1)).toString(),
        }));
      }
    }
  };

  const handleAdd = async () => {
    if (!form.foodName.trim() || !user) return;
    setAdding(true);
    setError(null);
    try {
      const existing = await getClientNutritionPlan(clientId);

      const defaultDay = (meals: MealSection[]): DayNutrition => ({ meals });

      const ensureDefaultMeals = (day: DayNutrition): DayNutrition => {
        const stored = day.meals;
        const defaultNames = [
          "Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5", "Meal 6", "Meal 7",
          "Pre-Workout", "Post Workout",
        ];
        const result = defaultNames.map((name) => {
          return stored.find((m) => m.meal === name) ?? { meal: name, items: [], emoji: "" };
        });
        const extraMeals = stored.filter((m) => !defaultNames.includes(m.meal));
        return { ...day, meals: [...result, ...extraMeals] };
      };

      let workoutDay: DayNutrition = ensureDefaultMeals(existing?.workoutDay ?? defaultDay([]));
      let offDay: DayNutrition = ensureDefaultMeals(existing?.offDay ?? defaultDay([]));

      const newItem = {
        name: form.foodName.trim().toUpperCase(),
        quantity: form.quantity.trim(),
        kcal: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
        note: form.note.trim() || undefined,
      };

      const updateMeals = (day: DayNutrition): DayNutrition => ({
        meals: day.meals.map((section) => {
          if (section.meal !== mealName) return section;
          if (isEditMode) {
            const iIdx = parseInt(editItemIdx!);
            const updatedItems = [...section.items];
            updatedItems[iIdx] = newItem;
            return { ...section, items: updatedItems };
          }
          return { ...section, items: [...section.items, newItem] };
        }),
      });

      if (mode === "workout") {
        workoutDay = updateMeals(workoutDay);
      } else {
        offDay = updateMeals(offDay);
      }

      await saveClientNutritionPlan(
        clientId,
        user.uid,
        workoutDay,
        offDay,
        existing?.waterTargetLiters,
        existing?.supplements
      );
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add food. Try again.");
      setAdding(false);
    }
  };

  const modeLabel = mode === "workout" ? "💪 Workout Day" : "🌙 Off Day";

  return (
    <div className="min-h-dvh bg-[#121212] font-sans">
      <div className="px-5 pt-12 pb-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          back
        </button>

        <h1 className="text-[24px] font-extrabold text-white mb-1">
          {isEditMode ? "Edit Food Item" : "Add Food Item"}
        </h1>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[11px] text-gray-400">
            {isEditMode ? "Editing in" : "Adding to"}
          </span>
          <span className="text-[11px] font-bold text-[#a3e635]">{mealName}</span>
          <span className="text-gray-600 text-[10px]">•</span>
          <span className="text-[11px] font-bold text-gray-400">{modeLabel}</span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-[12px] text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Search from master list */}
        <div ref={searchRef} className="relative mb-6">
          <label className="text-[10px] font-extrabold text-white tracking-widest uppercase mb-2 block">
            SEARCH FOOD DATABASE
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search nutrition items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setForm({ ...EMPTY_FORM });
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full h-12 bg-[#1c1c1e] rounded-xl pl-10 pr-10 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setForm({ ...EMPTY_FORM }); setShowDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && searchQuery && filteredItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden shadow-xl max-h-[240px] overflow-y-auto"
              >
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full text-left px-4 py-3 hover:bg-[#2a2a2c] transition-colors border-b border-white/5 last:border-0"
                  >
                    <p className="text-[12px] font-bold text-white">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-500">{item.calories} kcal</span>
                      <span className="text-gray-700 text-[10px]">•</span>
                      <span className="text-[10px] text-gray-500">{item.protein}g P</span>
                      <span className="text-gray-700 text-[10px]">•</span>
                      <span className="text-[10px] text-gray-500">{item.carbs}g C</span>
                      <span className="text-gray-700 text-[10px]">•</span>
                      <span className="text-[10px] text-gray-500">{item.fats}g F</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
            {showDropdown && searchQuery && filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-4 text-center shadow-xl"
              >
                <p className="text-[12px] text-gray-500">No items found — fill in manually below</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form fields */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {/* Food Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
              FOOD NAME
            </label>
            <input
              type="text"
              placeholder="e.g. Brown Rice"
              value={form.foodName}
              onChange={(e) => handleChange("foodName", e.target.value)}
              className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
              QUANTITY (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 100g"
              value={form.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
            />
          </div>

          {/* Macros — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">KCAL</label>
              <input
                type="number"
                placeholder="350"
                value={form.calories}
                onChange={(e) => handleChange("calories", e.target.value)}
                className="w-full h-12 bg-[#1c1c1e] rounded-xl px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">PROTEIN (G)</label>
              <input
                type="number"
                placeholder="12"
                value={form.protein}
                onChange={(e) => handleChange("protein", e.target.value)}
                className="w-full h-12 bg-[#1c1c1e] rounded-xl px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">CARBS (G)</label>
              <input
                type="number"
                placeholder="60"
                value={form.carbs}
                onChange={(e) => handleChange("carbs", e.target.value)}
                className="w-full h-12 bg-[#1c1c1e] rounded-xl px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">FATS (G)</label>
              <input
                type="number"
                placeholder="10"
                value={form.fats}
                onChange={(e) => handleChange("fats", e.target.value)}
                className="w-full h-12 bg-[#1c1c1e] rounded-xl px-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
              />
            </div>
          </div>

          {/* Description Note — new field */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
              DESCRIPTION NOTE (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Cook in olive oil, serve with veggies…"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              className="w-full bg-[#1c1c1e] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
            />
          </div>
        </motion.div>

        {/* Add button */}
        <div className="mt-8">
          <button
            onClick={handleAdd}
            disabled={!form.foodName.trim() || adding}
            className="w-full h-14 bg-[#a3e635] hover:bg-[#b5f745] disabled:bg-[#2a2a2c] disabled:text-gray-500 text-black font-bold text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {adding ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                {isEditMode ? "Save Changes" : `Add To ${mealName}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#121212]" />}>
      <AddFoodContent />
    </Suspense>
  );
}

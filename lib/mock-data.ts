// ─── Mock Data for PTRB Fitness Admin Dashboard ───────────────────────────────

export let mockMembers = [
  { id: "1469", name: "Dheeraj", email: "drjsnghwork1+client3@gmail.com", phone: "9209192091", plan: "Premium", status: "Active", joinDate: "2024-01-15", avatar: "", goal: "Lose weight", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 0, gender: "Male", dob: "06/07/1986", injuries: "No", country: "India", height: 176, currentWeight: 89, goalWeight: 85, membershipEnd: "07/04/2026", purpose: "" },
  { id: "1470", name: "Dheeraj", email: "drjsnghwork1+client4@gmail.com", phone: "9209151458", plan: "Basic", status: "Active", joinDate: "2024-02-01", avatar: "", goal: "Lose weight", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 0, gender: "Male", dob: "12/03/1990", injuries: "No", country: "India", height: 172, currentWeight: 82, goalWeight: 75, membershipEnd: "15/06/2026", purpose: "" },
  { id: "1471", name: "Priya Patel", email: "priya@example.com", phone: "8765432109", plan: "Elite", status: "Active", joinDate: "2023-11-10", avatar: "", goal: "Build muscle", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 25, gender: "Female", dob: "22/09/1995", injuries: "No", country: "India", height: 163, currentWeight: 58, goalWeight: 62, membershipEnd: "10/11/2026", purpose: "" },
  { id: "1472", name: "Amit Singh", email: "amit@example.com", phone: "7654321098", plan: "Premium", status: "Active", joinDate: "2024-03-05", avatar: "", goal: "Lose weight", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 10, gender: "Male", dob: "01/01/1988", injuries: "Knee", country: "India", height: 180, currentWeight: 95, goalWeight: 82, membershipEnd: "05/03/2026", purpose: "" },
  { id: "1473", name: "Sneha Gupta", email: "sneha@example.com", phone: "6543210987", plan: "Basic", status: "Active", joinDate: "2023-12-20", avatar: "", goal: "General fitness", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 40, gender: "Female", dob: "15/05/1992", injuries: "No", country: "India", height: 160, currentWeight: 55, goalWeight: 52, membershipEnd: "20/12/2025", purpose: "" },
  { id: "1474", name: "Vikram Joshi", email: "vikram@example.com", phone: "5432109876", plan: "Elite", status: "Active", joinDate: "2024-01-28", avatar: "", goal: "Build muscle", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 15, gender: "Male", dob: "08/11/1993", injuries: "No", country: "India", height: 175, currentWeight: 72, goalWeight: 80, membershipEnd: "28/01/2026", purpose: "" },
  { id: "1475", name: "Ananya Nair", email: "ananya@example.com", phone: "4321098765", plan: "Premium", status: "Active", joinDate: "2024-02-14", avatar: "", goal: "Lose weight", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 5, gender: "Female", dob: "30/07/1989", injuries: "No", country: "India", height: 165, currentWeight: 68, goalWeight: 58, membershipEnd: "14/02/2026", purpose: "" },
  { id: "1476", name: "Ravi Kumar", email: "ravi@example.com", phone: "3210987654", plan: "Basic", status: "Active", joinDate: "2024-03-01", avatar: "", goal: "Lose weight", trainer: "tanvi sharma", trainerSpec: "Body building", progress: 0, gender: "Male", dob: "25/04/1991", injuries: "No", country: "India", height: 170, currentWeight: 78, goalWeight: 70, membershipEnd: "01/03/2026", purpose: "" },
];

export const addMockMember = (member: any) => {
  mockMembers = [member, ...mockMembers];
};

export let mockTrainers = [
  { id: "T001", name: "Coach Arjun", email: "arjun@ptrb.in", phone: "+91 99887 76655", specialization: "Strength Training", experience: "8 years", status: "Active", clients: 24, address: "arjun home Address", dob: "15/08/1990", language: "English, Hindi", country: "India", height: 180, weight: 85, periodOfAccess: "08/02/2026", proofId: "Aadhaar Card", ptInsurance: "Yes" },
  { id: "T002", name: "Coach Deepika", email: "deepika@ptrb.in", phone: "+91 88776 65544", specialization: "Yoga & Flexibility", experience: "6 years", status: "Active", clients: 18, address: "deepika home Address", dob: "22/11/1994", language: "English", country: "India", height: 165, weight: 60, periodOfAccess: "08/02/2026", proofId: "PAN Card", ptInsurance: "No" },
  { id: "T003", name: "Coach Suresh", email: "suresh@ptrb.in", phone: "+91 77665 54433", specialization: "Cardio & HIIT", experience: "5 years", status: "Active", clients: 31, address: "suresh home Address", dob: "10/05/1992", language: "Hindi", country: "India", height: 175, weight: 75, periodOfAccess: "08/02/2026", proofId: "Driving License", ptInsurance: "Yes" },
  { id: "T004", name: "Coach Kavya", email: "kavya@ptrb.in", phone: "+91 66554 43322", specialization: "Nutrition & Diet", experience: "7 years", status: "Inactive", clients: 12, address: "kavya home Address", dob: "22/11/2002", language: "English", country: "India", height: 176, weight: 81, periodOfAccess: "08/02/2026", proofId: "Custom Id", ptInsurance: "No" },
  { id: "T005", name: "Coach Rohan", email: "rohan@ptrb.in", phone: "+91 99881 12233", specialization: "Body building", experience: "4 years", status: "Active", clients: 15, address: "123 Gym Street, Mumbai", dob: "14/06/1995", language: "English, Marathi", country: "India", height: 182, weight: 88, periodOfAccess: "10/05/2025", proofId: "Aadhaar Card", ptInsurance: "Yes" },
  { id: "T006", name: "Coach Sneha", email: "sneha@ptrb.in", phone: "+91 98765 43210", specialization: "Yoga & Flexibility", experience: "3 years", status: "Active", clients: 20, address: "45 Lotus Path, Pune", dob: "03/09/1997", language: "English, Hindi", country: "India", height: 160, weight: 55, periodOfAccess: "15/12/2025", proofId: "PAN Card", ptInsurance: "Yes" },
  { id: "T007", name: "Coach Vikram", email: "vikram@ptrb.in", phone: "+91 87654 32109", specialization: "Strength Training", experience: "10 years", status: "Active", clients: 40, address: "78 Elite Ave, Delhi", dob: "25/01/1985", language: "English, Hindi", country: "India", height: 185, weight: 95, periodOfAccess: "01/01/2027", proofId: "Passport", ptInsurance: "Yes" },
  { id: "T008", name: "Coach Meera", email: "meera@ptrb.in", phone: "+91 76543 21098", specialization: "Zumba", experience: "5 years", status: "Active", clients: 25, address: "12 Dance Rd, Bangalore", dob: "11/11/1993", language: "English, Kannada", country: "India", height: 168, weight: 62, periodOfAccess: "20/08/2026", proofId: "Aadhaar Card", ptInsurance: "No" },
  { id: "T009", name: "Coach Amit", email: "amit@ptrb.in", phone: "+91 65432 10987", specialization: "Cardio & HIIT", experience: "2 years", status: "Inactive", clients: 5, address: "90 Runner St, Chennai", dob: "05/04/1998", language: "English, Tamil", country: "India", height: 170, weight: 68, periodOfAccess: "05/04/2025", proofId: "Driving License", ptInsurance: "No" },
  { id: "T010", name: "Coach Pooja", email: "pooja@ptrb.in", phone: "+91 54321 09876", specialization: "Aerobics", experience: "6 years", status: "Active", clients: 18, address: "34 Fitness Lane, Hyd", dob: "19/07/1991", language: "English, Telugu", country: "India", height: 162, weight: 58, periodOfAccess: "30/11/2025", proofId: "Passport", ptInsurance: "Yes" },
  { id: "T011", name: "Coach Neha", email: "neha@ptrb.in", phone: "+91 90123 45678", specialization: "Nutrition & Diet", experience: "4 years", status: "Active", clients: 14, address: "55 Health Park, Kochi", dob: "28/02/1996", language: "English, Malayalam", country: "India", height: 165, weight: 59, periodOfAccess: "14/02/2026", proofId: "Aadhaar Card", ptInsurance: "No" },
  { id: "T012", name: "Coach Raj", email: "raj@ptrb.in", phone: "+91 81234 56789", specialization: "Body building", experience: "12 years", status: "Active", clients: 35, address: "88 Ironworks, Chandigarh", dob: "12/10/1982", language: "English, Punjabi", country: "India", height: 178, weight: 90, periodOfAccess: "31/12/2026", proofId: "PAN Card", ptInsurance: "Yes" },
  { id: "T013", name: "Coach Priya", email: "priya.fit@ptrb.in", phone: "+91 72345 67890", specialization: "Pilates", experience: "7 years", status: "Active", clients: 22, address: "21 Core St, Ahmedabad", dob: "07/07/1992", language: "English, Gujarati", country: "India", height: 164, weight: 56, periodOfAccess: "07/07/2025", proofId: "Aadhaar Card", ptInsurance: "Yes" },
  { id: "T014", name: "Coach Karan", email: "karan@ptrb.in", phone: "+91 63456 78901", specialization: "CrossFit", experience: "9 years", status: "Active", clients: 28, address: "100 WOD Blvd, Gurgaon", dob: "21/05/1988", language: "English, Hindi", country: "India", height: 181, weight: 83, periodOfAccess: "21/05/2026", proofId: "Driving License", ptInsurance: "No" },
  { id: "T015", name: "Coach Anil", email: "anil@ptrb.in", phone: "+91 54567 89012", specialization: "Strength Training", experience: "3 years", status: "Active", clients: 10, address: "11 Lift Alley, Kolkata", dob: "16/09/1995", language: "English, Bengali", country: "India", height: 173, weight: 72, periodOfAccess: "16/09/2025", proofId: "Aadhaar Card", ptInsurance: "Yes" },
];

export const addMockTrainer = (trainer: any) => {
  mockTrainers = [trainer, ...mockTrainers];
};

export const mockExercises = [
  { id: "E001", name: "Bench Press", category: "Chest", muscle: "Pectorals", equipment: "Barbell", difficulty: "Intermediate", sets: 3, reps: 10 },
  { id: "E002", name: "Squat", category: "Legs", muscle: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate", sets: 4, reps: 8 },
  { id: "E003", name: "Deadlift", category: "Back", muscle: "Hamstrings", equipment: "Barbell", difficulty: "Advanced", sets: 3, reps: 6 },
  { id: "E004", name: "Pull-Up", category: "Back", muscle: "Latissimus Dorsi", equipment: "Pull-up Bar", difficulty: "Intermediate", sets: 3, reps: 12 },
  { id: "E005", name: "Shoulder Press", category: "Shoulders", muscle: "Deltoids", equipment: "Dumbbell", difficulty: "Beginner", sets: 3, reps: 12 },
  { id: "E006", name: "Bicep Curl", category: "Arms", muscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner", sets: 3, reps: 15 },
  { id: "E007", name: "Plank", category: "Core", muscle: "Abdominals", equipment: "None", difficulty: "Beginner", sets: 3, reps: "60s" },
  { id: "E008", name: "Lunges", category: "Legs", muscle: "Glutes", equipment: "None", difficulty: "Beginner", sets: 3, reps: 12 },
];

export const mockCardio = [
  { id: "C001", name: "Treadmill Run", type: "Running", duration: "30 min", intensity: "Moderate", calories: 280, equipment: "Treadmill" },
  { id: "C002", name: "Cycling Class", type: "Cycling", duration: "45 min", intensity: "High", calories: 400, equipment: "Stationary Bike" },
  { id: "C003", name: "Rowing Machine", type: "Rowing", duration: "20 min", intensity: "High", calories: 250, equipment: "Rowing Machine" },
  { id: "C004", name: "Jump Rope HIIT", type: "HIIT", duration: "15 min", intensity: "Very High", calories: 200, equipment: "Jump Rope" },
  { id: "C005", name: "Elliptical Trainer", type: "Low-Impact", duration: "40 min", intensity: "Moderate", calories: 320, equipment: "Elliptical" },
];

export const mockWorkoutPlans = [
  { id: "WP001", name: "Beginner Full Body", duration: "4 weeks", days: 3, level: "Beginner", goal: "General Fitness", members: 45, trainer: "Coach Arjun" },
  { id: "WP002", name: "Fat Loss Blaster", duration: "8 weeks", days: 5, level: "Intermediate", goal: "Weight Loss", members: 67, trainer: "Coach Suresh" },
  { id: "WP003", name: "Muscle Building Pro", duration: "12 weeks", days: 5, level: "Advanced", goal: "Muscle Gain", members: 38, trainer: "Coach Arjun" },
  { id: "WP004", name: "Flexibility & Wellness", duration: "6 weeks", days: 4, level: "Beginner", goal: "Flexibility", members: 52, trainer: "Coach Deepika" },
];

export const mockMealPlans = [
  { id: "MP001", name: "Weight Loss Plan", calories: 1500, protein: "120g", carbs: "150g", fats: "50g", meals: 5, goal: "Weight Loss" },
  { id: "MP002", name: "Muscle Gain Plan", calories: 2800, protein: "200g", carbs: "300g", fats: "90g", meals: 6, goal: "Muscle Gain" },
  { id: "MP003", name: "Maintenance Plan", calories: 2000, protein: "150g", carbs: "220g", fats: "70g", meals: 5, goal: "Maintenance" },
  { id: "MP004", name: "Keto Plan", calories: 1800, protein: "140g", carbs: "30g", fats: "140g", meals: 4, goal: "Weight Loss" },
];

export const mockNutritionPlans = [
  { id: "N001", name: "Almond", quantity: 1, calories: "7.00", carbs: "0.24", protein: "0.26", fats: "0.61" },
  { id: "N002", name: "Almond Butter", quantity: 7, calories: "47.00", carbs: "1.30", protein: "1.50", fats: "4.00" },
  { id: "N003", name: "Almond Milk", quantity: 240, calories: "30.00", carbs: "1.00", protein: "1.00", fats: "2.50" },
  { id: "N004", name: "Almonds (28g)", quantity: 28, calories: "164.00", carbs: "6.10", protein: "6.00", fats: "14.00" },
  { id: "N005", name: "Avocado", quantity: 1, calories: "80.00", carbs: "4.00", protein: "1.00", fats: "7.00" },
  { id: "N006", name: "Banana", quantity: 1, calories: "105.00", carbs: "27.00", protein: "1.30", fats: "0.30" },
  { id: "N007", name: "Beef (Lean)", quantity: 100, calories: "250.00", carbs: "0.00", protein: "26.00", fats: "15.00" },
  { id: "N008", name: "Bison", quantity: 85, calories: "121.00", carbs: "0.00", protein: "24.10", fats: "2.10" },
  { id: "N009", name: "Black Beans", quantity: 100, calories: "132.00", carbs: "23.70", protein: "8.90", fats: "0.50" },
  { id: "N010", name: "Blueberries", quantity: 100, calories: "57.00", carbs: "14.50", protein: "0.70", fats: "0.30" },
  { id: "N011", name: "Broccoli", quantity: 100, calories: "34.00", carbs: "6.60", protein: "2.80", fats: "0.40" },
  { id: "N012", name: "Brown Rice", quantity: 100, calories: "111.00", carbs: "23.00", protein: "2.60", fats: "0.90" },
  { id: "N013", name: "Carrots", quantity: 100, calories: "41.00", carbs: "9.60", protein: "0.90", fats: "0.20" },
  { id: "N014", name: "Cheddar Cheese", quantity: 100, calories: "402.00", carbs: "1.30", protein: "25.00", fats: "33.00" },
  { id: "N015", name: "Chicken Breast", quantity: 100, calories: "165.00", carbs: "0.00", protein: "31.00", fats: "3.60" },
  { id: "N016", name: "Eggs (Large)", quantity: 1, calories: "72.00", carbs: "0.40", protein: "6.30", fats: "4.80" },
  { id: "N017", name: "Greek Yogurt", quantity: 100, calories: "59.00", carbs: "3.60", protein: "10.00", fats: "0.40" },
  { id: "N018", name: "Oatmeal", quantity: 100, calories: "68.00", carbs: "11.50", protein: "2.40", fats: "1.40" },
  { id: "N019", name: "Peanut Butter", quantity: 32, calories: "188.00", carbs: "6.30", protein: "7.70", fats: "16.00" },
  { id: "N020", name: "Spinach", quantity: 100, calories: "23.00", carbs: "3.60", protein: "2.90", fats: "0.40" },
  { id: "N021", name: "Sweet Potato", quantity: 100, calories: "86.00", carbs: "20.10", protein: "1.60", fats: "0.10" },
  { id: "N022", name: "Tofu (Firm)", quantity: 100, calories: "144.00", carbs: "2.80", protein: "15.80", fats: "8.70" },
  { id: "N023", name: "Tuna (Canned)", quantity: 100, calories: "116.00", carbs: "0.00", protein: "25.50", fats: "0.80" },
  { id: "N024", name: "Walnuts", quantity: 28, calories: "185.00", carbs: "3.90", protein: "4.30", fats: "18.50" },
  { id: "N025", name: "Apple", quantity: 1, calories: "95.00", carbs: "25.00", protein: "0.50", fats: "0.30" },
  { id: "N026", name: "Quinoa", quantity: 100, calories: "120.00", carbs: "21.30", protein: "4.40", fats: "1.90" },
  { id: "N027", name: "Milk (Whole)", quantity: 240, calories: "149.00", carbs: "11.70", protein: "7.70", fats: "8.00" },
  { id: "N028", name: "Salmon", quantity: 100, calories: "208.00", carbs: "0.00", protein: "20.00", fats: "13.00" },
];

export const mockSupplements = [
  { id: "S001", name: "Whey Protein", brand: "Optimum Nutrition", category: "Protein", price: 2499, stock: 45, servings: 30 },
  { id: "S002", name: "Creatine Monohydrate", brand: "MuscleTech", category: "Performance", price: 899, stock: 78, servings: 60 },
  { id: "S003", name: "Pre-Workout", brand: "C4 Energy", category: "Pre-Workout", price: 1799, stock: 23, servings: 30 },
  { id: "S004", name: "BCAA Complex", brand: "MusclePharm", category: "Recovery", price: 1299, stock: 56, servings: 45 },
  { id: "S005", name: "Fish Oil Omega-3", brand: "Now Foods", category: "Health", price: 599, stock: 102, servings: 90 },
  { id: "S006", name: "Multivitamin", brand: "One A Day", category: "Health", price: 499, stock: 89, servings: 60 },
  { id: "S007", name: "Mass Gainer", brand: "MuscleBlaze", category: "Protein", price: 3499, stock: 15, servings: 20 },
  { id: "S008", name: "Glutamine", brand: "Scivation", category: "Recovery", price: 1099, stock: 65, servings: 60 },
  { id: "S009", name: "L-Carnitine", brand: "Dymatize", category: "Fat Loss", price: 799, stock: 40, servings: 31 },
  { id: "S010", name: "Casein Protein", brand: "MyProtein", category: "Protein", price: 2899, stock: 30, servings: 33 },
  { id: "S011", name: "Nitric Oxide Booster", brand: "Cellucor", category: "Performance", price: 1599, stock: 25, servings: 40 },
  { id: "S012", name: "ZMA Night Recovery", brand: "Optimum Nutrition", category: "Recovery", price: 999, stock: 50, servings: 90 },
  { id: "S013", name: "CLA Softgels", brand: "MuscleTech", category: "Fat Loss", price: 699, stock: 80, servings: 90 },
  { id: "S014", name: "Electrolyte Powder", brand: "Scivation XTEND", category: "Hydration", price: 1499, stock: 55, servings: 30 },
  { id: "S015", name: "Vegan Plant Protein", brand: "AS-IT-IS", category: "Protein", price: 2199, stock: 35, servings: 30 },
];

export const mockProducts = [
  { id: "P001", name: "Resistance Bands Set", category: "Equipment", price: 799, stock: 34, status: "Active" },
  { id: "P002", name: "Yoga Mat Premium", category: "Equipment", price: 1299, stock: 67, status: "Active" },
  { id: "P003", name: "PTRB Shaker Bottle", category: "Accessories", price: 299, stock: 120, status: "Active" },
  { id: "P004", name: "Gym Gloves", category: "Accessories", price: 449, stock: 45, status: "Active" },
  { id: "P005", name: "PTRB T-Shirt", category: "Apparel", price: 599, stock: 88, status: "Active" },
  { id: "P006", name: "Foam Roller", category: "Recovery", price: 999, stock: 29, status: "Active" },
];

export const mockCategories = [
  { id: "CAT001", name: "Equipment", products: 12, status: "Active" },
  { id: "CAT002", name: "Supplements", products: 28, status: "Active" },
  { id: "CAT003", name: "Apparel", products: 8, status: "Active" },
  { id: "CAT004", name: "Accessories", products: 15, status: "Active" },
  { id: "CAT005", name: "Recovery", products: 7, status: "Active" },
];

export const mockCoupons = [
  { id: "CPN001", code: "WELCOME20", discount: "20%", type: "Percentage", minOrder: 999, status: "Active", expires: "2024-12-31", used: 45 },
  { id: "CPN002", code: "FLAT500", discount: "₹500", type: "Fixed", minOrder: 2000, status: "Active", expires: "2024-06-30", used: 23 },
  { id: "CPN003", code: "SUMMER30", discount: "30%", type: "Percentage", minOrder: 1500, status: "Expired", expires: "2024-03-31", used: 78 },
  { id: "CPN004", code: "NEWMEMBER", discount: "15%", type: "Percentage", minOrder: 0, status: "Active", expires: "2024-12-31", used: 112 },
];

export const mockFlashDeals = [
  { id: "FD001", name: "Protein Combo Deal", originalPrice: 3499, salePrice: 2499, discount: "29%", stock: 20, sold: 15, endsAt: "2024-04-30T23:59:59" },
  { id: "FD002", name: "Equipment Bundle", originalPrice: 4999, salePrice: 3499, discount: "30%", stock: 10, sold: 8, endsAt: "2024-04-15T23:59:59" },
  { id: "FD003", name: "Supplement Starter Kit", originalPrice: 2999, salePrice: 1999, discount: "33%", stock: 30, sold: 22, endsAt: "2024-05-01T23:59:59" },
];

export const mockSubscriptions = [
  { id: "SUB001", member: "Rahul Sharma", plan: "Premium", amount: 2999, startDate: "2024-01-15", endDate: "2025-01-15", status: "Active" },
  { id: "SUB002", member: "Priya Patel", plan: "Basic", amount: 999, startDate: "2024-02-01", endDate: "2025-02-01", status: "Active" },
  { id: "SUB003", member: "Amit Singh", plan: "Elite", amount: 4999, startDate: "2023-11-10", endDate: "2024-11-10", status: "Expired" },
  { id: "SUB004", member: "Sneha Gupta", plan: "Premium", amount: 2999, startDate: "2024-03-05", endDate: "2025-03-05", status: "Active" },
  { id: "SUB005", member: "Vikram Joshi", plan: "Basic", amount: 999, startDate: "2023-12-20", endDate: "2024-12-20", status: "Active" },
];

export const mockInvoices = [
  { id: "INV001", member: "Rahul Sharma", amount: 2999, date: "2024-01-15", dueDate: "2024-02-15", status: "Paid", items: ["Premium Subscription"] },
  { id: "INV002", member: "Priya Patel", amount: 999, date: "2024-02-01", dueDate: "2024-03-01", status: "Paid", items: ["Basic Subscription"] },
  { id: "INV003", member: "Amit Singh", amount: 4999, date: "2024-03-10", dueDate: "2024-04-10", status: "Pending", items: ["Elite Subscription", "Whey Protein"] },
  { id: "INV004", member: "Sneha Gupta", amount: 3798, date: "2024-03-05", dueDate: "2024-04-05", status: "Paid", items: ["Premium Subscription", "BCAA Complex"] },
  { id: "INV005", member: "Vikram Joshi", amount: 1798, date: "2024-03-15", dueDate: "2024-04-15", status: "Overdue", items: ["Basic Subscription", "Gym Gloves"] },
];

export const mockCalendarEvents = [
  { id: "EV001", title: "Group HIIT Class", start: new Date(2024, 2, 15, 7, 0), end: new Date(2024, 2, 15, 8, 0), trainer: "Coach Suresh", type: "Class" },
  { id: "EV002", title: "Yoga Session", start: new Date(2024, 2, 16, 9, 0), end: new Date(2024, 2, 16, 10, 30), trainer: "Coach Deepika", type: "Class" },
  { id: "EV003", title: "Personal Training - Rahul", start: new Date(2024, 2, 18, 6, 0), end: new Date(2024, 2, 18, 7, 0), trainer: "Coach Arjun", type: "Personal" },
  { id: "EV004", title: "Nutrition Workshop", start: new Date(2024, 2, 20, 11, 0), end: new Date(2024, 2, 20, 12, 0), trainer: "Coach Kavya", type: "Workshop" },
  { id: "EV005", title: "Strength Training Class", start: new Date(2024, 2, 22, 7, 0), end: new Date(2024, 2, 22, 8, 30), trainer: "Coach Arjun", type: "Class" },
];

export const revenueData = [
  { month: "Jan", revenue: 145000, members: 82, expenses: 45000 },
  { month: "Feb", revenue: 168000, members: 95, expenses: 52000 },
  { month: "Mar", revenue: 192000, members: 108, expenses: 58000 },
  { month: "Apr", revenue: 178000, members: 101, expenses: 60000 },
  { month: "May", revenue: 215000, members: 124, expenses: 65000 },
  { month: "Jun", revenue: 248000, members: 142, expenses: 72000 },
  { month: "Jul", revenue: 232000, members: 135, expenses: 68000 },
  { month: "Aug", revenue: 265000, members: 158, expenses: 75000 },
  { month: "Sep", revenue: 289000, members: 171, expenses: 82000 },
  { month: "Oct", revenue: 312000, members: 186, expenses: 88000 },
  { month: "Nov", revenue: 298000, members: 178, expenses: 84000 },
  { month: "Dec", revenue: 342000, members: 203, expenses: 95000 },
];

export const membershipData = [
  { name: "Basic", value: 45, color: "#6366f1" },
  { name: "Premium", value: 35, color: "#8b5cf6" },
  { name: "Elite", value: 20, color: "#06b6d4" },
];

export const dashboardStats = {
  totalMembers: 428,
  activeMembers: 374,
  monthlyRevenue: 342000,
  totalTrainers: 12,
  activePlans: 156,
  pendingInvoices: 23,
};

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { addMemberWithAuth } from "@/lib/services/members.service";
import { notifyAdminTrainerAddedClient } from "@/lib/services/notifications.service";
import { WEFIT_PLANS, computeMembershipEnd } from "@/lib/services/subscriptions.service";

export default function AddClientPage() {
	const router = useRouter();
	const { user } = useAuth();

	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		tempPassword: "",
		gender: "",
		dob: "",
		height: "",
		startingWeight: "",
		targetWeight: "",
		plan: WEFIT_PLANS[0].id,
		goal: "",
		injuryNote: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const isValid =
		form.name.trim() &&
		form.email.trim() &&
		form.phone.trim() &&
		form.tempPassword.length >= 6 &&
		form.gender &&
		form.dob &&
		form.height &&
		form.startingWeight &&
		form.targetWeight;

	const handleChange = (field: string, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (error) setError("");
	};

	const handleSubmit = async () => {
		if (!isValid || !user) return;
		setLoading(true);
		setError("");

		const membershipEnd = computeMembershipEnd(form.plan);

		try {
			await addMemberWithAuth(
				{
					name: form.name.trim(),
					email: form.email.trim().toLowerCase(),
					phone: form.phone.trim(),
					gender: form.gender,
					dob: form.dob,
					height: form.height ? Number(form.height) : 0,
					currentWeight: form.startingWeight ? Number(form.startingWeight) : 0,
					goalWeight: form.targetWeight ? Number(form.targetWeight) : 0,
					goal: form.goal.trim(),
					plan: form.plan,
					membershipEnd,
					status: "Active",
					trainer: user.uid,
					trainerSpec: "",
					avatar: "",
					joinDate: new Date().toISOString().split("T")[0],
					progress: 0,
					injuries: form.injuryNote.trim(),
					country: "",
					purpose: form.goal.trim(),
				},
				form.tempPassword
			);

			// Notify admin that this trainer added a new client
			notifyAdminTrainerAddedClient(
				user.displayName ?? "Trainer",
				form.name.trim(),
				user.uid
			).catch(console.error);

			router.push(
				`/trainer/clients/add/success?email=${encodeURIComponent(form.email.trim())}&name=${encodeURIComponent(form.name.trim())}`
			);
		} catch (err: any) {
			setError(err?.message ?? "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[100dvh] bg-[#121212] font-sans flex flex-col">
			<div className="flex-1 px-5 pt-12 pb-36 overflow-y-auto">
				{/* Back */}
				<button
					onClick={() => router.back()}
					className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-6 transition-colors"
				>
					<ArrowLeft className="w-3 h-3 mr-1" />
					back
				</button>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35 }}
				>
					<h1 className="text-[24px] font-extrabold text-white mb-1">
						Add New Client
					</h1>
					<p className="text-[12px] text-gray-400 mb-8">
						Client will receive login credentials via email
					</p>

					{error && (
						<div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
							<p className="text-[12px] text-red-400 font-medium">{error}</p>
						</div>
					)}

					<div className="space-y-5">
						<p className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase">
							BASIC INFO
						</p>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								CLIENT NAME <span className="text-[#a3e635]">*</span>
							</label>
							<input
								type="text"
								placeholder="Full name"
								value={form.name}
								onChange={(e) => handleChange("name", e.target.value)}
								className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								EMAIL <span className="text-[#a3e635]">*</span>
							</label>
							<input
								type="email"
								placeholder="client@example.com"
								value={form.email}
								onChange={(e) => handleChange("email", e.target.value)}
								className="w-full h-12 bg-[#1c1c1e] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								PHONE <span className="text-[#a3e635]">*</span>
							</label>
							<input
								type="tel"
								placeholder="Contact number"
								value={form.phone}
								onChange={(e) => handleChange("phone", e.target.value)}
								className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								TEMP PASSWORD <span className="text-[#a3e635]">*</span>
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									placeholder="Min. 6 characters"
									value={form.tempPassword}
									onChange={(e) => handleChange("tempPassword", e.target.value)}
									className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 pr-12 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
							<p className="text-[10px] text-gray-600">
								Client uses this to log in for the first time
							</p>
						</div>

						<div className="border-t border-white/5 pt-2">
							<p className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">
								PERSONAL DETAILS
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
									GENDER <span className="text-[#a3e635]">*</span>
								</label>
								<select
									value={form.gender}
									onChange={(e) => handleChange("gender", e.target.value)}
									className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all appearance-none"
								>
									<option value="" className="bg-[#1c1e1c]">
										Select
									</option>
									<option value="Male" className="bg-[#1c1e1c]">
										Male
									</option>
									<option value="Female" className="bg-[#1c1e1c]">
										Female
									</option>
									<option value="Other" className="bg-[#1c1e1c]">
										Other
									</option>
								</select>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
									DATE OF BIRTH <span className="text-[#a3e635]">*</span>
								</label>
								<input
									type="date"
									value={form.dob}
									max={new Date().toISOString().split("T")[0]}
									onChange={(e) => handleChange("dob", e.target.value)}
									className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
									HEIGHT &#123;CM&#125; <span className="text-[#a3e635]">*</span>
								</label>
								<input
									type="number"
									placeholder="e.g., 175"
									value={form.height}
									onChange={(e) => handleChange("height", e.target.value)}
									className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
									START WT &#123;KG&#125; <span className="text-[#a3e635]">*</span>
								</label>
								<input
									type="number"
									placeholder="e.g., 85"
									value={form.startingWeight}
									onChange={(e) => handleChange("startingWeight", e.target.value)}
									className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								TARGET WEIGHT &#123;KG&#125; <span className="text-[#a3e635]">*</span>
							</label>
							<input
								type="number"
								placeholder="e.g., 70"
								value={form.targetWeight}
								onChange={(e) => handleChange("targetWeight", e.target.value)}
								className="w-full h-12 bg-[#1c1e1c] rounded-xl px-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all"
							/>
						</div>

						<div className="border-t border-white/5 pt-2">
							<p className="text-[9px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">
								PLAN & GOAL
							</p>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								MEMBERSHIP PLAN <span className="text-[#a3e635]">*</span>
							</label>
							<div className="flex flex-wrap gap-2">
								{WEFIT_PLANS.map((p) => (
									<button
										key={p.id}
										type="button"
										onClick={() => handleChange("plan", p.id)}
										className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${
											form.plan === p.id
												? "bg-[#a3e635] text-black border-[#a3e635]"
												: "bg-[#1c1e1c] text-gray-400 border-white/10 hover:border-[#a3e635]/30"
										}`}
									>
										{p.name}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								GOAL NOTE
							</label>
							<textarea
								placeholder="e.g., Lose 10kg in 3 months"
								value={form.goal}
								onChange={(e) => handleChange("goal", e.target.value)}
								rows={3}
								className="w-full bg-[#1c1e1c] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-[10px] font-extrabold text-white tracking-widest uppercase">
								INJURY NOTE
							</label>
							<textarea
								placeholder="e.g., Previous knee injury, avoid deep squats"
								value={form.injuryNote}
								onChange={(e) => handleChange("injuryNote", e.target.value)}
								rows={3}
								className="w-full bg-[#1c1e1c] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50 transition-all resize-none"
							/>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Submit — inline, not fixed, to avoid overlapping bottom nav */}
			<div className="px-5 pb-10 pt-4">
				<button
					onClick={handleSubmit}
					disabled={!isValid || loading}
					className="w-full h-14 bg-[#a3e635] hover:bg-[#b5f745] disabled:bg-[#2a2a2c] disabled:text-gray-500 text-black font-bold text-[15px] rounded-xl transition-colors flex items-center justify-center gap-2"
				>
					{loading ? (
						<>
							<span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
							Creating Account...
						</>
					) : (
						<>
							<span className="text-[18px] font-light">+</span>
							Add Client
						</>
					)}
				</button>
			</div>
		</div>
	);
}

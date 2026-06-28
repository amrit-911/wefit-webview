"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  
  // Visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form values
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate save duration
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    toast.success("Password updated successfully!");
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3]">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/admin/profile" className="text-[#7367f0] hover:underline font-medium">My Profile</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Change Password</span>
      </div>

      <div className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6">
        <h2 className="text-xl font-bold text-[#5e5873] mb-6">Change Password</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Current Password - stretches max width md:col-span-1 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#6e6b7b]">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Current Password"
                className="h-10 text-sm border-gray-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
          </div>
          
          {/* Empty div for grid offset on desktop if needed, but per screenshot Current Password is on its own row? Actually the screenshot shows it taking up one column. */}
          <div className="hidden md:block"></div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#6e6b7b]">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                className="h-10 text-sm border-gray-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#6e6b7b]">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                className="h-10 text-sm border-gray-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </button>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="mb-8">
          <h3 className="text-[15px] font-bold text-[#5e5873] mb-3">Password Requirements</h3>
          <ul className="list-disc list-inside text-sm text-[#6e6b7b] space-y-1 ml-1">
            <li>Minimum 8 Characters Long, the more, the better</li>
            <li>At least one lowercase character</li>
            <li>At least one number, one symbol.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#7367f0] hover:bg-[#6355e0] text-white px-6 shadow-[0_3px_10px_rgba(115,103,240,0.35)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="text-[#6e6b7b] border-gray-300 hover:bg-gray-50 px-6"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

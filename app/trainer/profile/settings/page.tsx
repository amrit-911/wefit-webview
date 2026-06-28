"use client";

import { ChevronRight, ArrowLeft, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getCmsItems, type CmsItem } from "@/lib/services/cms.service";

export default function TrainerSettingsPage() {
  const router = useRouter();
  const [cmsItems, setCmsItems] = useState<CmsItem[]>([]);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    getCmsItems()
      .then(setCmsItems)
      .catch(console.error)
      .finally(() => setCmsLoading(false));
  }, []);

  const handleCmsPress = (item: CmsItem) => {
    const link = item.pageLink;
    if (link && link !== "NO-LINK" && (link.startsWith("http://") || link.startsWith("https://"))) {
      window.open(link, "_blank");
    } else {
      router.push(`/trainer/profile/cms-page/${item.id}`);
    }
  };

  const helpItem = cmsItems.find((c) => c.type === "Contact Us");
  const privacyItem = cmsItems.find((c) => c.type === "Privacy Policy");
  const termsItem = cmsItems.find((c) => c.type === "Terms & Conditions");

  const appRows: { label: string; item: CmsItem }[] = [
    helpItem ? { label: "Help & Support", item: helpItem } : null,
    privacyItem ? { label: "Privacy Policy", item: privacyItem } : null,
    termsItem ? { label: "Terms Of Service", item: termsItem } : null,
  ].filter(Boolean) as { label: string; item: CmsItem }[];

  return (
    <div className="min-h-screen bg-[#121212] font-sans pt-10 px-5 pb-24 text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 text-[12px] font-medium mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        back
      </button>

      <h1 className="text-[22px] font-extrabold text-white mb-7">Settings</h1>

      {/* PROFILE group */}
      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-1 mb-2">Profile</p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1c1c1e] rounded-2xl overflow-hidden mb-5"
      >
        <SettingsRow label="Edit Profile" onPress={() => router.push("/trainer/profile/edit-profile")} />
        <div className="h-px bg-white/5 mx-4" />
        <SettingsRow label="Change Password" onPress={() => router.push("/trainer/profile/change-password")} isLast />
      </motion.div>

      {/* APP group */}
      {(cmsLoading || appRows.length > 0) && (
        <>
          <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-1 mb-2">App</p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1c1c1e] rounded-2xl overflow-hidden mb-5"
          >
            {cmsLoading ? (
              <>
                <SkeletonRow />
                <div className="h-px bg-white/5 mx-4" />
                <SkeletonRow />
                <div className="h-px bg-white/5 mx-4" />
                <SkeletonRow />
                <div className="h-px bg-white/5 mx-4" />
                <SkeletonRow isLast />
              </>
            ) : (
              <>
                {appRows.map(({ label, item }, i) => (
                  <div key={label}>
                    {i > 0 && <div className="h-px bg-white/5 mx-4" />}
                    <SettingsRow label={label} onPress={() => handleCmsPress(item)} />
                  </div>
                ))}
                {appRows.length > 0 && <div className="h-px bg-white/5 mx-4" />}
                <SettingsRow label="FAQs" onPress={() => router.push("/trainer/profile/faq")} isLast />
              </>
            )}
          </motion.div>
        </>
      )}
      {/* SUPPORT group */}
      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-1 mb-2">Support</p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1c1c1e] rounded-2xl overflow-hidden mb-5"
      >
        <button
          onClick={() => router.push("/trainer/contact/support")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#a3e635]/15 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#a3e635]" />
            </div>
            <span className="text-[14px] font-bold text-white">Contact Admin</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </motion.div>
    </div>
  );
}

function SettingsRow({
  label,
  onPress,
  isLast = false,
}: {
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
    >
      <span className="text-[14px] font-bold text-white">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-500" />
    </button>
  );
}

function SkeletonRow({ isLast = false }: { isLast?: boolean }) {
  return (
    <div className="w-full flex items-center justify-between px-5 py-4">
      <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
      <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

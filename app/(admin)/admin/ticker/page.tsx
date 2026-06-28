"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, ToggleLeft, ToggleRight, Users, Dumbbell } from "lucide-react";
import Link from "next/link";
import { getTickerSettings, saveTickerSettings } from "@/lib/services/ticker.service";
import { TickerTape } from "@/components/ui/ticker-tape";

interface AudienceSettings {
  enabled: boolean;
  content: string;
}

export default function TickerManagementPage() {
  const [client, setClient] = useState<AudienceSettings>({ enabled: false, content: "" });
  const [trainer, setTrainer] = useState<AudienceSettings>({ enabled: false, content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getTickerSettings()
      .then((s) => {
        setClient({ enabled: s.clientEnabled, content: s.clientContent });
        setTrainer({ enabled: s.trainerEnabled, content: s.trainerContent });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await saveTickerSettings({
        clientEnabled: client.enabled,
        clientContent: client.content,
        trainerEnabled: trainer.enabled,
        trainerContent: trainer.content,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#b9b9c3]">
        <Link href="/admin" className="text-[#7367f0] hover:underline font-medium">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#6e6b7b] font-medium">Ticker Management</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#5e5873]">Ticker Management</h2>
        <p className="text-sm text-[#b9b9c3]">Configure separately for clients &amp; trainers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Client Ticker ── */}
        <AudienceCard
          icon={<Users className="w-4 h-4" />}
          label="Client Ticker"
          description="Shown on the Client home page"
          accentColor="#7367f0"
          settings={client}
          loading={loading}
          onChange={setClient}
        />

        {/* ── Trainer Ticker ── */}
        <AudienceCard
          icon={<Dumbbell className="w-4 h-4" />}
          label="Trainer Ticker"
          description="Shown on the Trainer home page"
          accentColor="#28c76f"
          settings={trainer}
          loading={loading}
          onChange={setTrainer}
        />
      </div>

      {/* Save */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-[#5e5873]">Save All Changes</p>
          <p className="text-xs text-[#b9b9c3] mt-0.5">
            Both client and trainer settings are saved together.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {success && (
            <div className="flex items-center gap-2 text-[#28c76f] text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Saved successfully
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 bg-[#7367f0] hover:bg-[#6355e0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* Live previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PreviewCard
          label="Client Home Page"
          enabled={client.enabled}
          content={client.content}
          accentColor="#7367f0"
          delay={0.2}
        />
        <PreviewCard
          label="Trainer Home Page"
          enabled={trainer.enabled}
          content={trainer.content}
          accentColor="#28c76f"
          delay={0.25}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Sub-components                                          */
/* ──────────────────────────────────────────────────────── */

function AudienceCard({
  icon,
  label,
  description,
  accentColor,
  settings,
  loading,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  accentColor: string;
  settings: AudienceSettings;
  loading: boolean;
  onChange: (s: AudienceSettings) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: accentColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#5e5873]">{label}</h3>
          <p className="text-xs text-[#b9b9c3]">{description}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-24 rounded-md bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#5e5873]">
                {settings.enabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-[#b9b9c3] mt-0.5">
                {settings.enabled
                  ? `Ticker is live on ${label.replace(" Ticker", "")} page`
                  : `Ticker is hidden on ${label.replace(" Ticker", "")} page`}
              </p>
            </div>
            <button
              onClick={() => onChange({ ...settings, enabled: !settings.enabled })}
              className="flex items-center gap-2 transition-colors"
            >
              {settings.enabled ? (
                <ToggleRight className="w-9 h-9" style={{ color: accentColor }} />
              ) : (
                <ToggleLeft className="w-9 h-9 text-gray-400" />
              )}
            </button>
          </div>

          {/* Content textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#5e5873] mb-1.5">
              Ticker Message
            </label>
            <textarea
              value={settings.content}
              onChange={(e) => onChange({ ...settings, content: e.target.value })}
              rows={4}
              placeholder={`Enter message for ${label.replace(" Ticker", "")} ticker…`}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-[#5e5873] placeholder:text-[#b9b9c3] focus:outline-none focus:ring-2 focus:border-transparent resize-none transition"
              style={
                settings.content
                  ? { "--tw-ring-color": `${accentColor}4d` } as React.CSSProperties
                  : {}
              }
              onFocus={(e) => {
                e.target.style.boxShadow = `0 0 0 2px ${accentColor}33`;
                e.target.style.borderColor = accentColor;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "";
                e.target.style.borderColor = "";
              }}
            />
            <p className="text-xs text-[#b9b9c3] mt-1">{settings.content.length} characters</p>
          </div>
        </>
      )}
    </motion.div>
  );
}

function PreviewCard({
  label,
  enabled,
  content,
  accentColor,
  delay,
}: {
  label: string;
  enabled: boolean;
  content: string;
  accentColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-md shadow-[0_4px_24px_0_rgba(34,41,47,0.1)] p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: enabled && content.trim() ? accentColor : "#d1d5db" }}
        />
        <h3 className="text-sm font-semibold text-[#5e5873]">{label} — Preview</h3>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: enabled && content.trim() ? `${accentColor}18` : "#f3f4f6",
            color: enabled && content.trim() ? accentColor : "#9ca3af",
          }}
        >
          {enabled && content.trim() ? "Live" : "Off"}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1a1a1a] px-4 py-3 text-xs text-gray-400 font-mono">{label}</div>

        {enabled && content.trim() ? (
          <div className="py-2 overflow-hidden" style={{ backgroundColor: accentColor }}>
            <TickerTape content={content} className="text-white" />
          </div>
        ) : (
          <div className="bg-gray-50 py-3 flex items-center justify-center">
            <span className="text-sm text-[#b9b9c3]">
              {!enabled ? "Ticker is disabled" : "Enter content to preview"}
            </span>
          </div>
        )}

        <div className="bg-[#121212] h-16 flex items-center justify-center">
          <div className="w-48 h-4 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

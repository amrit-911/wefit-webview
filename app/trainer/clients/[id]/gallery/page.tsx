"use client";

import { ArrowLeft, X, ZoomIn, SlidersHorizontal } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getGalleryPhotos,
  groupPhotosByDate,
  type GalleryPhoto,
} from "@/lib/services/gallery.service";

// ─── Compare Slider ───────────────────────────────────────────────────────────
function CompareSlider({ leftUrl, rightUrl, onClose }: { leftUrl: string; rightUrl: string; onClose: () => void }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0">
        <p className="text-white text-[13px] font-bold">Compare Photos</p>
        <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 w-full select-none overflow-hidden"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
        onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
        onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX); }}
        onTouchEnd={() => { dragging.current = false; }}
      >
        {/* Right image — full size, always visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rightUrl} alt="After" draggable={false} className="absolute inset-0 w-full h-full object-contain" />

        {/* Left image — same size, clipped on the right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={leftUrl}
          alt="Before"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] pointer-events-none"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-2xl cursor-col-resize z-10"
          style={{ left: `${pos}%` }}
        >
          <SlidersHorizontal className="w-4 h-4 text-gray-800" />
        </div>

        <div className="absolute bottom-5 left-4 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">BEFORE</div>
        <div className="absolute bottom-5 right-4 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">AFTER</div>
      </div>
      <p className="text-gray-400 text-[11px] font-medium text-center py-4 shrink-0">Drag the slider to compare</p>
    </motion.div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-12 right-5 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10">
        <X className="w-5 h-5 text-white" />
      </button>
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(1, s - 0.5)); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg font-bold">−</button>
        <span className="text-white text-[12px] font-bold">{Math.round(scale * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(4, s + 0.5)); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-lg font-bold">+</button>
      </div>
      <motion.div onClick={(e) => e.stopPropagation()} animate={{ scale }} transition={{ type: "spring", damping: 20, stiffness: 200 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Gallery photo" style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain" }} />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Trainer Gallery Page ────────────────────────────────────────────────
export default function TrainerClientGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [compareUrls, setCompareUrls] = useState<[string, string] | null>(null);

  const grouped = groupPhotosByDate(photos);

  useEffect(() => {
    if (!clientId) return;
    getGalleryPhotos(clientId)
      .then(setPhotos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  function toggleSelect(photo: GalleryPhoto) {
    if (selectedIds.includes(photo.id)) {
      setSelectedIds((prev) => prev.filter((id) => id !== photo.id));
    } else {
      if (selectedIds.length >= 2) return;
      setSelectedIds((prev) => [...prev, photo.id]);
    }
  }

  function startCompare() {
    if (selectedIds.length !== 2) return;
    const [a, b] = selectedIds.map((id) => photos.find((p) => p.id === id)!);
    setCompareUrls([a.url, b.url]);
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-12">
      {/* Header */}
      <div className="pt-12 px-5 pb-4 border-b border-white/5">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white text-[12px] font-medium mb-4 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-1" />back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-white mb-0.5">Photo Gallery</h1>
            <p className="text-[12px] text-gray-500 font-medium">{photos.length} photo{photos.length !== 1 ? "s" : ""} · Client progress</p>
          </div>
          {photos.length >= 2 && (
            <button
              onClick={() => { setSelectMode((v) => !v); setSelectedIds([]); }}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${selectMode ? "bg-[#a3e635] text-black" : "bg-[#1c1c1e] text-gray-400 border border-white/5"}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Compare
            </button>
          )}
        </div>
      </div>

      {/* Compare bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-5 mt-4 bg-[#1c1c1e] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between"
          >
            <p className="text-[12px] text-gray-400 font-medium">
              {selectedIds.length === 0 && "Tap 2 photos to compare"}
              {selectedIds.length === 1 && "Select 1 more photo"}
              {selectedIds.length === 2 && "Ready to compare!"}
            </p>
            <button
              onClick={startCompare}
              disabled={selectedIds.length !== 2}
              className="h-8 px-4 bg-[#a3e635] disabled:opacity-30 text-black font-bold text-[12px] rounded-xl transition-opacity"
            >
              Compare
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo list */}
      <div className="px-5 pt-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="h-4 w-32 bg-[#1c1c1e] rounded animate-pulse mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => <div key={j} className="aspect-square bg-[#1c1c1e] rounded-xl animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-[48px] mb-4">📸</div>
            <p className="text-[14px] font-bold text-white mb-1">No photos yet</p>
            <p className="text-[12px] text-gray-500">Client hasn't uploaded any progress photos</p>
          </div>
        )}

        {!loading && grouped.map(({ date, label, photos: datePhotos }) => (
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[13px] font-extrabold text-white tracking-wide">{label}</p>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {datePhotos.map((photo) => {
                const isSelected = selectedIds.includes(photo.id);
                const selIdx = selectedIds.indexOf(photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() => selectMode ? toggleSelect(photo) : setLightboxUrl(photo.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? "border-[#a3e635] scale-[0.96]" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="Gallery" className="w-full h-full object-cover" />
                    {selectMode && (
                      <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? "bg-[#a3e635] text-black" : "bg-black/50 border border-white/30"
                      }`}>
                        {isSelected ? selIdx + 1 : ""}
                      </div>
                    )}
                    {!selectMode && (
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
        {compareUrls && <CompareSlider leftUrl={compareUrls[0]} rightUrl={compareUrls[1]} onClose={() => { setCompareUrls(null); setSelectedIds([]); setSelectMode(false); }} />}
      </AnimatePresence>
    </div>
  );
}

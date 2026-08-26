"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  RotateRight01Icon, 
  RotateLeft01Icon, 
  RefreshIcon, 
  PlusSignIcon, 
  MinusSignIcon, 
  Sun01Icon, 
  Upload01Icon, 
  CheckmarkCircle02Icon,
  CropIcon
} from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";

interface PhotoAdjustmentModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void> | void;
}

export function PhotoAdjustmentModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
}: PhotoAdjustmentModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [brightness, setBrightness] = useState(100); // 70 to 130
  const [contrast, setContrast] = useState(100); // 70 to 130
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "adjust">("crop");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(imageSrc);

  // Sync imageSrc prop
  useEffect(() => {
    if (imageSrc) {
      setCurrentImageSrc(imageSrc);
      setZoom(1);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageSrc, isOpen]);

  // Load image object
  useEffect(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageObjRef.current = img;
      drawPreview();
    };
    img.src = currentImageSrc;
  }, [currentImageSrc]);

  // Redraw preview on adjustments
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Apply brightness & contrast filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    ctx.save();
    // Translate to canvas center
    ctx.translate(size / 2 + position.x, size / 2 + position.y);
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    // Scale / Zoom
    ctx.scale(zoom, zoom);

    // Determine aspect-ratio scaling to cover center
    const aspect = img.width / img.height;
    let drawWidth = size;
    let drawHeight = size;

    if (aspect > 1) {
      drawWidth = size * aspect;
      drawHeight = size;
    } else {
      drawWidth = size;
      drawHeight = size / aspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [zoom, rotation, brightness, contrast, position]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse / Touch handlers for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.min(3, Math.max(0.8, Number((prev + delta).toFixed(2)))));
  };

  // Rotate handlers
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setPosition({ x: 0, y: 0 });
  };

  // New photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentImageSrc(event.target.result as string);
          handleReset();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export cropped & enhanced image
  const handleApply = async () => {
    const img = imageObjRef.current;
    if (!img) return;

    setSaving(true);
    try {
      // Off-screen canvas for full 512x512 high-resolution export
      const exportCanvas = document.createElement("canvas");
      const exportSize = 512;
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        ctx.save();
        const scaleFactor = exportSize / 320;
        ctx.translate(exportSize / 2 + position.x * scaleFactor, exportSize / 2 + position.y * scaleFactor);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

        const aspect = img.width / img.height;
        let drawWidth = 320;
        let drawHeight = 320;

        if (aspect > 1) {
          drawWidth = 320 * aspect;
          drawHeight = 320;
        } else {
          drawWidth = 320;
          drawHeight = 320 / aspect;
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        const croppedDataUrl = exportCanvas.toDataURL("image/png", 0.95);
        await onSave(croppedDataUrl);
        onClose();
      }
    } catch (err) {
      console.error("Error cropping image:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Adjust Company Logo</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Crop, zoom, and adjust your organization's logo.</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Viewport Canvas Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-[320px] h-[320px] rounded-[28px] overflow-hidden bg-gray-50 border border-gray-200/80 shadow-sm select-none cursor-grab active:cursor-grabbing group">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  className="w-full h-full object-cover"
                />

                {/* Drag Guidance Badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white/90 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  Drag to pan • Scroll to zoom
                </div>
              </div>
            </div>

            {/* Adjustment Tabs */}
            <div className="flex items-center justify-center gap-2 border-b border-gray-100 pb-2">
              <button
                onClick={() => setActiveTab("crop")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  activeTab === "crop"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <HugeiconsIcon icon={CropIcon} className="w-4 h-4" />
                <span>Crop & Transform</span>
              </button>

              <button
                onClick={() => setActiveTab("adjust")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  activeTab === "adjust"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <HugeiconsIcon icon={Sun01Icon} className="w-4 h-4" />
                <span>Enhance & Filter</span>
              </button>
            </div>

            {/* Tab 1: Crop & Transform Controls */}
            {activeTab === "crop" && (
              <div className="space-y-4">
                {/* Zoom Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-700">Zoom</span>
                    <span className="font-semibold text-gray-900">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setZoom((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(2))))}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={MinusSignIcon} className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0.8"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-black h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rotation & Reset Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRotateLeft}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={RotateLeft01Icon} className="w-4 h-4" />
                      <span>Rotate Left</span>
                    </button>
                    <button
                      onClick={handleRotateRight}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={RotateRight01Icon} className="w-4 h-4" />
                      <span>Rotate Right</span>
                    </button>
                  </div>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-900 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Enhance & Filters */}
            {activeTab === "adjust" && (
              <div className="space-y-4">
                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-700">Brightness</span>
                    <span className="font-semibold text-gray-900">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-black h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-700">Contrast</span>
                    <span className="font-semibold text-gray-900">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-black h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                    }}
                    className="text-[12.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <HugeiconsIcon icon={Upload01Icon} className="w-4 h-4 text-gray-500" />
                <span>Choose Different Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-[13.5px] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-medium text-[13.5px] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-white" />
                    <span>Save Logo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

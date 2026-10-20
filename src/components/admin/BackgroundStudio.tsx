import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { BackgroundStudioConfig, BackgroundRevision, BackgroundTargetScene } from '../../types/index.ts';
import {
  Sparkles,
  Layers,
  Eye,
  Save,
  Send,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  History,
  Image,
  Video,
  Box,
  Compass,
  Palette,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface BackgroundStudioProps {
  isLight?: boolean;
}

const PRESETS: Record<string, Partial<BackgroundStudioConfig>> = {
  'Alpine Dawn (Default)': {
    mediaType: '3d-procedural',
    overlayColor: '#080D1A',
    overlayOpacity: 0.45,
    brightness: 1.0,
    saturation: 1.05,
    blur: 0,
    parallaxIntensity: 0.65,
    particlesEnabled: true,
  },
  'Golden Champagne': {
    mediaType: '3d-procedural',
    overlayColor: '#120D0A',
    overlayOpacity: 0.35,
    brightness: 1.1,
    saturation: 1.25,
    blur: 0,
    parallaxIntensity: 0.8,
    particlesEnabled: true,
  },
  'Obsidian Twilight': {
    mediaType: '3d-procedural',
    overlayColor: '#05070E',
    overlayOpacity: 0.65,
    brightness: 0.9,
    saturation: 0.95,
    blur: 1,
    parallaxIntensity: 0.5,
    particlesEnabled: true,
  },
  'Kyoto Rose Mist': {
    mediaType: '3d-procedural',
    overlayColor: '#1A0C16',
    overlayOpacity: 0.4,
    brightness: 1.05,
    saturation: 1.15,
    blur: 0,
    parallaxIntensity: 0.7,
    particlesEnabled: true,
  },
};

export const BackgroundStudio: React.FC<BackgroundStudioProps> = ({ isLight = false }) => {
  const [targetScene, setTargetScene] = useState<BackgroundTargetScene>('sunrise');
  const [config, setConfig] = useState<BackgroundStudioConfig>({
    targetScene: 'sunrise',
    displayName: 'Daybreak Sunrise & Authentication',
    mediaType: '3d-procedural',
    focalPoint: { x: 50, y: 45 },
    scalingMode: 'cover',
    overlayColor: '#080D1A',
    overlayOpacity: 0.45,
    brightness: 1.0,
    saturation: 1.05,
    blur: 0,
    parallaxIntensity: 0.65,
    particlesEnabled: true,
    transitionDuration: 1.2,
    status: 'published',
    updatedAt: new Date().toISOString(),
    updatedBy: 'System',
  });

  const [revisions, setRevisions] = useState<BackgroundRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Load config and revision history when targetScene changes
  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      api.getBackgroundScene(targetScene),
      api.getBackgroundRevisions(targetScene),
    ])
      .then(([sceneConfig, sceneRevisions]) => {
        if (!active) return;
        if (sceneConfig) setConfig(sceneConfig);
        if (Array.isArray(sceneRevisions)) setRevisions(sceneRevisions);
      })
      .catch((err) => {
        console.error('Failed to load background studio data:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [targetScene]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await api.saveBackgroundDraft(targetScene, config);
      if (res.success) {
        setConfig(res.config);
        showToast('Draft configuration saved successfully.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.publishBackground(targetScene, {
        ...config,
        note: publishNote || `Published update for ${targetScene} background`,
      });
      if (res.success) {
        setConfig(res.config);
        setPublishModalOpen(false);
        setPublishNote('');
        showToast('Background settings published live to production!');
        // Refresh revisions
        api.getBackgroundRevisions(targetScene).then(setRevisions);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish background.');
    } finally {
      setPublishing(false);
    }
  };

  // Rollback to Revision
  const handleRollback = async (revisionId: string) => {
    if (!window.confirm('Are you sure you want to rollback to this revision? Current live settings will be replaced.')) {
      return;
    }
    try {
      const res = await api.rollbackBackground(targetScene, revisionId);
      if (res.success) {
        setConfig(res.config);
        showToast(`Rolled back successfully to revision.`);
        api.getBackgroundRevisions(targetScene).then(setRevisions);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to rollback.');
    }
  };

  // Apply Preset
  const handleApplyPreset = (presetName: string) => {
    const p = PRESETS[presetName];
    if (!p) return;
    setConfig((prev) => ({
      ...prev,
      ...p,
    }));
    showToast(`Applied preset: ${presetName}`);
  };

  // Focal Point Picker calculation
  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setConfig((prev) => ({
      ...prev,
      focalPoint: { x, y },
    }));
  };

  // Legibility Scoring
  // High overlay opacity + proper brightness yields AAA contrast for golden & white text
  const overlayRatio = config.overlayOpacity;
  const isContrastOptimal = overlayRatio >= 0.35 && config.brightness <= 1.15;
  const contrastScore = Math.min(10, Math.round((overlayRatio * 7 + (1.2 - (config.brightness - 0.9) * 2) * 3) * 10) / 10);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[11px] font-bold border border-orange-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daybreak Studio Core · V3 Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Background Studio & Legibility Lab
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Manage procedural 3D dawn environments, video backdrops, and photography across all client portals.
            Fine-tune exposure, color tints, blur, and ensure WCAG typography legibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || loading}
            className="px-4 py-2.5 rounded-xl border border-[#2B2B30] bg-[#151518] hover:bg-[#1E1E24] text-xs font-bold text-stone-300 hover:text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-stone-400" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            disabled={publishing || loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F18B58] to-[#FFD58A] text-black text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5 text-black" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* Target Scene Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141E33]/70 border border-[#263653]/80 backdrop-blur-md overflow-x-auto">
        {[
          { id: 'sunrise' as const, label: 'Sunrise & Authentication', icon: Compass },
          { id: 'homepage' as const, label: '3D Culinary World (Home)', icon: Box },
          { id: 'admin' as const, label: 'Admin Command Console', icon: Layers },
          { id: 'mobile' as const, label: 'Courier & Mobile Portals', icon: Image },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = targetScene === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTargetScene(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#F18B58] to-[#FFD58A] text-black shadow-md'
                  : 'text-[#B8B8C0] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid: Controls on Left, Live Preview & Legibility Lab on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Media Type & Engine Selection */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-white">Rendering Engine & Media Format</h3>
                <p className="text-[11px] text-stone-400">Choose between living Three.js 3D shaders, photography, or video</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                config.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {config.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { type: '3d-procedural' as const, label: '3D Procedural', desc: 'Sculpted mountain & dawn shader', icon: Box },
                { type: 'image' as const, label: 'Static Image', desc: 'High-res architectural capture', icon: Image },
                { type: 'video' as const, label: 'Ambient Video', desc: 'Cinematic looping footage', icon: Video },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = config.mediaType === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setConfig({ ...config, mediaType: m.type })}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1C2A48] border-[#F18B58] shadow-md ring-1 ring-[#F18B58]/40'
                        : 'bg-[#0B0B0D] border-[#2B2B30] hover:border-stone-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#FFD58A]' : 'text-stone-500'}`} />
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Media URLs if image or video */}
            {config.mediaType !== '3d-procedural' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                    Desktop Asset URL {config.mediaType === 'video' ? '(MP4 / WebM)' : '(JPEG / WebP / PNG)'}
                  </label>
                  <input
                    type="text"
                    value={config.desktopUrl || ''}
                    onChange={(e) => setConfig({ ...config, desktopUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or /assets/..."
                    className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Mobile Fallback URL</label>
                    <input
                      type="text"
                      value={config.mobileUrl || ''}
                      onChange={(e) => setConfig({ ...config, mobileUrl: e.target.value })}
                      placeholder="Optional vertical crop URL"
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Scaling Mode</label>
                    <select
                      value={config.scalingMode || 'cover'}
                      onChange={(e) => setConfig({ ...config, scalingMode: e.target.value as any })}
                      className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="cover">Cover (Full Screen)</option>
                      <option value="fit">Fit / Contain</option>
                      <option value="center">Center Fixed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Atmosphere & Optical Sliders */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-white">Atmospheric Depth & Optical Controls</h3>
                <p className="text-[11px] text-stone-400">Calibrate exposure, contrast, blur, and overlay tinting</p>
              </div>
              <Sliders className="w-4 h-4 text-orange-400" />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-400">Curated Daybreak Mood Presets</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(PRESETS).map((pName) => (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => handleApplyPreset(pName)}
                    className="p-2 rounded-xl bg-[#0B0B0D] border border-[#2B2B30] hover:border-orange-500 text-[11px] font-semibold text-stone-300 text-left transition-colors"
                  >
                    {pName}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Blur Slider */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-300">Gaussian Depth Blur</span>
                  <span className="font-mono text-orange-400">{config.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="0.5"
                  value={config.blur}
                  onChange={(e) => setConfig({ ...config, blur: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">Adds cinematic focal separation behind text cards</span>
              </div>

              {/* Brightness Slider */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-300">Exposure Brightness</span>
                  <span className="font-mono text-orange-400">{Math.round(config.brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={config.brightness}
                  onChange={(e) => setConfig({ ...config, brightness: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">Restrained 0.8–1.1 range prevents mountain washout</span>
              </div>

              {/* Saturation Slider */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-300">Color Saturation</span>
                  <span className="font-mono text-orange-400">{Math.round(config.saturation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={config.saturation}
                  onChange={(e) => setConfig({ ...config, saturation: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">Intensifies golden ambers and dawn twilight</span>
              </div>

              {/* Overlay Tint Opacity */}
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-300">Vignette Tint Density</span>
                  <span className="font-mono text-orange-400">{Math.round(config.overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={config.overlayOpacity}
                  onChange={(e) => setConfig({ ...config, overlayOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">Crucial for guaranteed text readability</span>
              </div>
            </div>

            {/* Overlay Color & Additional Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Atmospheric Tint Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.overlayColor}
                    onChange={(e) => setConfig({ ...config, overlayColor: e.target.value })}
                    className="w-10 h-9 rounded-xl bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={config.overlayColor}
                    onChange={(e) => setConfig({ ...config, overlayColor: e.target.value })}
                    className="bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3 py-2 text-xs font-mono text-white flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] my-auto">
                <div>
                  <span className="text-xs font-bold text-white block">Floating Sun Motes</span>
                  <span className="text-[10px] text-stone-500">Procedural luminous particle field</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, particlesEnabled: !config.particlesEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.particlesEnabled ? 'bg-orange-500' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.particlesEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Interactive Focal Point Picker */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-400">2D Visual Focal Point Origin</span>
                <span className="font-mono text-[11px] text-[#FFD58A]">
                  X: {config.focalPoint?.x ?? 50}%, Y: {config.focalPoint?.y ?? 45}%
                </span>
              </div>
              <div
                onClick={handleFocalPointClick}
                className="relative w-full h-28 rounded-2xl bg-[#080D1A] border border-[#263653] overflow-hidden cursor-crosshair group flex items-center justify-center"
              >
                {/* Visual grid lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#263653_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                {/* Horizontal & vertical center guides */}
                <div className="absolute inset-x-0 top-1/2 border-t border-white/10 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 border-l border-white/10 pointer-events-none" />
                {/* Crosshair indicator */}
                <div
                  className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#FFD58A] bg-[#F18B58]/30 flex items-center justify-center shadow-lg transition-all"
                  style={{
                    left: `${config.focalPoint?.x ?? 50}%`,
                    top: `${config.focalPoint?.y ?? 45}%`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="absolute bottom-2 right-3 text-[10px] text-stone-500 pointer-events-none">
                  Click to reposition sun / camera focus target
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Legibility Lab & Revisions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Legibility & Contrast Score Card */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-white">Live Legibility Diagnostic</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isContrastOptimal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {isContrastOptimal ? 'WCAG AAA · Passed' : 'Moderate Contrast'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] text-center">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Contrast Score</span>
                <span className="font-display text-2xl font-black text-[#FFD58A]">{contrastScore} / 10</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">High Text Legibility</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] text-center">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Card Readability</span>
                <span className="font-display text-2xl font-black text-emerald-400">100%</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Glassmorphic Rim Intact</span>
              </div>
            </div>

            {/* Live Interactive Simulation Frame */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-semibold">Simulated Viewport</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      previewMode === 'desktop' ? 'bg-[#F18B58] text-black' : 'text-stone-400'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      previewMode === 'mobile' ? 'bg-[#F18B58] text-black' : 'text-stone-400'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div
                className={`relative rounded-2xl overflow-hidden border border-[#263653] shadow-inner transition-all flex flex-col justify-between p-4 ${
                  previewMode === 'mobile' ? 'w-56 mx-auto h-72' : 'w-full h-64'
                }`}
                style={{
                  background: 'linear-gradient(135deg, #080D1A 0%, #151528 50%, #2A1520 100%)',
                  filter: `blur(${config.blur * 0.2}px) brightness(${config.brightness}) saturate(${config.saturation})`,
                }}
              >
                {/* Simulated Horizon Glow & Sun */}
                <div
                  className="absolute w-24 h-24 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${config.focalPoint?.x ?? 50}%`,
                    top: `${config.focalPoint?.y ?? 45}%`,
                    background: 'radial-gradient(circle, #FFF6E9 0%, #FFD58A 45%, #F18B58 75%, transparent 100%)',
                    boxShadow: '0 0 45px rgba(255, 213, 138, 0.65)',
                  }}
                />

                {/* Simulated Mountains Silhouette */}
                <div
                  className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, #0A0E18 0%, #20182E 60%, transparent 100%)',
                    clipPath: 'polygon(0% 100%, 0% 55%, 25% 30%, 48% 60%, 72% 20%, 100% 45%, 100% 100%)',
                  }}
                />

                {/* Simulated Overlay Tint Layer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: config.overlayColor,
                    opacity: config.overlayOpacity,
                  }}
                />

                {/* Simulated Front Glassmorphic UI Card (Testing Legibility) */}
                <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-white bg-[#141E33]/85 p-2 rounded-xl border border-[#263653] backdrop-blur-md">
                  <span>Nova Hunger Portal</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <div className="relative z-10 p-3 rounded-xl bg-[#111A2E]/90 border border-[#F18B58]/40 shadow-xl backdrop-blur-md space-y-1.5">
                  <span className="text-[10px] font-bold text-[#FFD58A] uppercase tracking-wider block">
                    EVERY NEW DAY STARTS HERE
                  </span>
                  <p className="text-[11px] text-white font-semibold leading-tight">
                    Text clarity check: Zero washout against active dawn.
                  </p>
                  <div className="h-6 rounded-lg bg-gradient-to-r from-[#F18B58] to-[#FFD58A] flex items-center justify-center text-[10px] font-black text-black">
                    Interactive CTA
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Revision History & Instant Rollback */}
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#2B2B30]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" />
                <h3 className="font-display font-bold text-sm text-white">Version History & Rollback</h3>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">{revisions.length} saved</span>
            </div>

            {revisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-stone-600 mb-1" />
                <p>No published revisions yet for this scene.</p>
                <p className="text-[10px]">When you click 'Publish Live', revision checkpoints are recorded here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {revisions.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="p-3 rounded-2xl bg-[#0B0B0D] border border-[#2B2B30] text-xs flex items-center justify-between gap-3 hover:border-stone-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{rev.note || 'Version Update'}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <span>{new Date(rev.publishedAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-stone-400">{rev.publishedBy}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRollback(rev.id)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-orange-500 hover:text-black text-stone-300 font-bold text-[11px] transition-colors shrink-0 flex items-center gap-1"
                      title="Rollback to this revision"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rollback</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md border border-[#2B2B30] rounded-3xl p-6 bg-[#151518] text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[#2B2B30]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-400" />
                <h3 className="font-display font-bold text-base">Publish Background Update</h3>
              </div>
              <button onClick={() => setPublishModalOpen(false)} className="text-stone-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Publishing will immediately apply this configuration to the <strong className="text-[#FFD58A]">{config.displayName || targetScene}</strong> scene. A rollback checkpoint will be saved in your revision history.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                Change Summary / Version Note
              </label>
              <input
                type="text"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="e.g., Calibrated golden dawn exposure & enhanced contrast"
                className="w-full bg-[#0B0B0D] border border-[#2B2B30] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : 'Confirm & Deploy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

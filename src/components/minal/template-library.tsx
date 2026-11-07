"use client";

import React, { useState, useMemo } from "react";
import { sfx } from "@/lib/sound";
import { useMinal } from "@/lib/store";
import { useRouter } from "@/lib/router";
import { useChat } from "@/lib/use-chat";
import {
  Layers,
  Eye,
  Sliders,
  X,
  Search,
  Box,
  Download,
  Check,
  ChevronRight,
  ArrowRight,
  Flame,
  ShieldCheck,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PackagingTemplate {
  id: string;
  name: string;
  category: string;
  dimensions: string;
  material: string;
  finish: string;
  unitCost: string;
  description: string;
  prompt: string;
  badge?: string;
  colors?: string[];
  tolerance: string;
  image?: string;
}

export const PACKAGING_TEMPLATES: PackagingTemplate[] = [
  {
    id: "rigid-perfume",
    name: "Rigid Lift-Off Box",
    category: "Luxury Packaging",
    dimensions: "140 x 80 x 50 mm",
    material: "1200gsm Greyboard + 157gsm Artpaper",
    finish: "Soft-Touch Matte + 24K Gold Stamping",
    unitCost: "Rs 45.00",
    badge: "Bestseller",
    colors: ["#14161a", "#ff6b00"],
    tolerance: "±0.05mm",
    image: "/images/box.jpg",
    description:
      "Two-piece rigid setup box with snug telescopic lid, zero-glare velvet lamination, and custom high-density EVA foam insert.",
    prompt:
      "Design a luxury rigid box with lift-off lid, 140x80x50mm, matte black finish with gold foil logo and custom velvet insert.",
  },
  {
    id: "magnetic-flap",
    name: "Magnetic Book Flap Box",
    category: "Luxury Packaging",
    dimensions: "220 x 150 x 60 mm",
    material: "1400gsm Heavy Greyboard + Pearl Artpaper",
    finish: "Matte Black + Embossed Rose Gold Foil",
    unitCost: "Rs 68.00",
    badge: "Premium",
    colors: ["#0f172a", "#f59e0b"],
    tolerance: "±0.05mm",
    image: "/images/login_hero.jpg",
    description:
      "Hinged book-style presentation box with dual concealed N45 neodymium magnets for a crisp, tactile snap closure.",
    prompt:
      "Create a magnetic closure book-style rigid box, 220x150x60mm, obsidian black with gold foil embossing and custom magnetic closure.",
  },
  {
    id: "mailer-ecom",
    name: "Corrugated Roll-End Mailer",
    category: "E-Commerce Shipping",
    dimensions: "250 x 180 x 75 mm",
    material: "E-Flute Single Wall Corrugated Board",
    finish: "Flexo Direct Print / Natural Kraft Exterior",
    unitCost: "Rs 28.00",
    badge: "Eco-Friendly",
    colors: ["#854d0e", "#ffffff"],
    tolerance: "±0.15mm",
    image: "/images/box.jpg",
    description:
      "Self-locking front-tuck mailer box engineered for maximum crush resistance during delivery without requiring plastic adhesive tape.",
    prompt:
      "Create a corrugated mailer box with roll-end tuck top, 250x180x75mm, natural kraft board with white ink minimalist branding.",
  },
  {
    id: "crash-lock-box",
    name: "Auto-Lock Bottom Shipper",
    category: "E-Commerce Shipping",
    dimensions: "300 x 200 x 120 mm",
    material: "B-Flute Heavy Corrugated 350 GSM",
    finish: "Water-based Soy Ink / Kraft",
    unitCost: "Rs 34.00",
    badge: "Fast Assembly",
    colors: ["#78350f", "#000000"],
    tolerance: "±0.20mm",
    image: "/images/box.jpg",
    description:
      "Snaps into shape in 1 second with pre-glued crash lock base. Cuts warehouse packing time by 60% for high-volume fulfillment.",
    prompt:
      "Design an auto-bottom crash-lock corrugated carton for shipping, 300x200x120mm, eco-friendly kraft with bold black typography.",
  },
  {
    id: "sleeve-drawer",
    name: "Sleeve & Sliding Drawer",
    category: "Confectionery & Gifts",
    dimensions: "200 x 100 x 40 mm",
    material: "350gsm SBS Paperboard + Rigid Inner",
    finish: "Soft-Touch Velvet + Spot UV Glaze",
    unitCost: "Rs 38.00",
    colors: ["#064e3b", "#d97706"],
    tolerance: "±0.10mm",
    image: "/images/ribbon.jpg",
    description:
      "Sliding inner tray with satin ribbon pull. Ideal for artisan chocolates, macarons, jewelry, and luxury watch presentation.",
    prompt:
      "Generate a sleeve and tray slide box, 200x100x40mm with emerald green exterior, embossed logo, and a gold satin ribbon pull.",
  },
  {
    id: "tuck-cosmetic",
    name: "Straight Tuck End Mono-Carton",
    category: "Cosmetics & Retail",
    dimensions: "45 x 45 x 130 mm",
    material: "300gsm Virgin Fibre SBS Paperboard",
    finish: "Gloss Aqueous Coat + Micro-Embossing",
    unitCost: "Rs 16.50",
    badge: "High Speed",
    colors: ["#ffffff", "#ff6b00"],
    tolerance: "±0.05mm",
    image: "/images/box.jpg",
    description:
      "High-speed machine cartoning template with matching top and bottom flaps for cosmetic dropper bottles, serums, and oils.",
    prompt:
      "Design a straight tuck end mono-carton for a 30ml cosmetic dropper bottle, dimensions 45x45x130mm, minimalist pastel tones.",
  },
  {
    id: "reverse-tuck",
    name: "Reverse Tuck End (RTE) Carton",
    category: "Cosmetics & Retail",
    dimensions: "55 x 55 x 150 mm",
    material: "350gsm Coated Clay Board",
    finish: "Matte Lamination + Silver Foil",
    unitCost: "Rs 18.00",
    colors: ["#18181b", "#cbd5e1"],
    tolerance: "±0.05mm",
    image: "/images/login_hero.jpg",
    description:
      "The retail standard for pharmaceuticals and beauty. Top flap folds from rear, bottom flap folds from front for structural strength.",
    prompt:
      "Create a reverse tuck end retail carton 55x55x150mm with silver foil branding and clean ingredient layout on rear panel.",
  },
  {
    id: "wedding-suite",
    name: "Artisan Wedding Invitation Suite",
    category: "Artisan Stationery",
    dimensions: "220 x 160 x 15 mm",
    material: "400gsm Cotton Deckled Stock",
    finish: "Deep Letterpress + Hot Rose Gold Foil",
    unitCost: "Rs 65.00",
    badge: "Handmade",
    colors: ["#fafaf9", "#e11d48"],
    tolerance: "±0.10mm",
    image: "/images/artisan.jpg",
    description:
      "Heirloom invitation folio with wax seal closure, handmade deckled cotton edges, and Faisalabad press hot rose gold stamping.",
    prompt:
      "Design a royal wedding invitation folder with wax seal, rose gold foil typography on ivory cotton paper and printed satin ribbon.",
  },
  {
    id: "window-confection",
    name: "Window Display Bakery Box",
    category: "Food & Bakery",
    dimensions: "180 x 180 x 60 mm",
    material: "Food-Grade Bleached Kraft + PET Window",
    finish: "Biodegradable Barrier Lamination",
    unitCost: "Rs 22.00",
    badge: "Food Safe",
    colors: ["#fef3c7", "#92400e"],
    tolerance: "±0.15mm",
    image: "/images/box.jpg",
    description:
      "Anti-fog crystal clear acetate display window allowing customers to view artisan confectionery while locking in bakery freshness.",
    prompt:
      "Make a confectionery bakery box with a clear top window, 180x180x60mm, pastel berry color palette with playful brand typography.",
  },
];

interface TemplateLibraryProps {
  open?: boolean;
  onClose?: () => void;
}

export function TemplateLibrary({ open: controlledOpen, onClose }: TemplateLibraryProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const openViewer = useMinal((s) => s.openViewer);
  const newConversation = useMinal((s) => s.newConversation);
  const { send } = useChat();

  React.useEffect(() => {
    const handleOpen = () => {
      sfx.whoosh();
      setInternalOpen(true);
    };
    window.addEventListener("open-template-library", handleOpen);
    return () => window.removeEventListener("open-template-library", handleOpen);
  }, []);

  const handleClose = () => {
    sfx.pop();
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const handleInspect3D = (template: PackagingTemplate) => {
    sfx.click();
    openViewer({
      kind: template.name,
      title: template.name,
      width: parseInt(template.dimensions.split("x")[0]) || 180,
      length: parseInt(template.dimensions.split("x")[1]) || 120,
      height: parseInt(template.dimensions.split("x")[2]) || 60,
      material: template.material,
      finish: template.finish,
      colors: template.colors || ["#14161a", "#ff6b00"],
    });
    toast.success(`Loaded "${template.name}" in 3D Turntable!`);
    handleClose();
  };

  const handleCustomizeAI = (template: PackagingTemplate) => {
    sfx.click();
    newConversation();
    send({ text: template.prompt });
    router.push("/studio");
    toast.success(`Loaded "${template.name}" in AI Studio!`);
    handleClose();
  };

  const categories = [
    "All",
    "Luxury Packaging",
    "E-Commerce Shipping",
    "Confectionery & Gifts",
    "Cosmetics & Retail",
    "Artisan Stationery",
    "Food & Bakery",
  ];

  const filteredTemplates = useMemo(() => {
    return PACKAGING_TEMPLATES.filter((t) => {
      const matchCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-6xl rounded-[32px] bg-[#0c0e14]/95 border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden text-white backdrop-blur-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 text-[#ff6b00] grid place-items-center shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Parametric Dieline &amp; Packaging Presets
                </h2>
                <span className="text-[10px] font-mono bg-[#ff6b00]/15 text-[#ff6b00] px-2.5 py-0.5 rounded-full border border-[#ff6b00]/30 font-bold">
                  {PACKAGING_TEMPLATES.length} CNC Ready
                </span>
              </div>
              <p className="text-xs text-white/50">
                Factory-calibrated structural CAD templates with CNC fold creases, cut tolerance, and Heidelberg offset specs.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar + Categories Bar */}
        <div className="px-6 py-3.5 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40 text-xs">
          {/* Categories Pill Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto minal-scroll-hidden py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sfx.toggle();
                  setSelectedCategory(cat);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full whitespace-nowrap text-[12px] font-medium transition",
                  selectedCategory === cat
                    ? "bg-[#ff6b00] text-black font-bold shadow-md shadow-[#ff6b00]/20"
                    : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-white/[0.06] border border-white/10 text-[12px] w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search packaging preset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white outline-none w-full placeholder:text-white/35 text-[12px]"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto minal-scroll p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="rounded-[24px] p-4 sm:p-5 bg-[#14161f]/90 border border-white/[0.08] hover:border-[#ff6b00]/40 transition-all flex flex-col justify-between group hover:shadow-2xl hover:shadow-black/70 backdrop-blur-xl relative overflow-hidden"
            >
              <div>
                {/* Packaging Preview Render Thumbnail */}
                {t.image && (
                  <div
                    onClick={() => handleCustomizeAI(t)}
                    className="relative w-full h-36 rounded-2xl overflow-hidden mb-3.5 bg-black/60 border border-white/10 group-hover:border-[#ff6b00]/40 transition cursor-pointer"
                  >
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14161f] via-transparent to-black/40" />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-mono uppercase bg-black/70 backdrop-blur-md text-[#ff6b00] font-bold px-2 py-0.5 rounded-full border border-white/10">
                        {t.category}
                      </span>
                    </div>
                    {t.badge && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[9.5px] font-mono bg-[#ff6b00] text-black font-bold px-2 py-0.5 rounded-full shadow-md">
                          {t.badge}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
                      {t.dimensions}
                    </div>
                  </div>
                )}

                {!t.image && (
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10.5px] font-mono uppercase text-[#ff6b00] font-semibold tracking-wider">
                      {t.category}
                    </span>
                    {t.badge && (
                      <span className="text-[9.5px] font-mono bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/15">
                        {t.badge}
                      </span>
                    )}
                  </div>
                )}

                <h3
                  onClick={() => handleCustomizeAI(t)}
                  className="text-[16px] font-bold text-white group-hover:text-white transition cursor-pointer"
                >
                  {t.name}
                </h3>
                <p className="text-[12px] text-white/60 mt-1.5 leading-relaxed">
                  {t.description}
                </p>

                {/* Specs Pill Table */}
                <div className="mt-3.5 p-3 rounded-2xl bg-black/60 border border-white/[0.08] space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-mono">Dimensions:</span>
                    <span className="font-mono text-white font-medium">{t.dimensions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-mono">Material:</span>
                    <span className="text-white/85 truncate max-w-[170px] text-right">{t.material}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 font-mono">Finish:</span>
                    <span className="text-white/85 truncate max-w-[170px] text-right">{t.finish}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/[0.06]">
                    <span className="text-white/40 font-mono">Unit Cost:</span>
                    <span className="font-mono text-[#ff6b00] font-bold text-[12px]">{t.unitCost}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleInspect3D(t)}
                  className="py-2 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-white/80" />
                  <span>3D View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomizeAI(t)}
                  className="py-2 px-3 rounded-full bg-white hover:bg-zinc-100 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sliders className="w-3.5 h-3.5 text-black" />
                  <span>Customize</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-xs bg-white/[0.02]">
          <span className="text-white/40">
            Click &quot;Customize&quot; to load CAD prompt directly into Minal AI Studio with auto dieline calibration.
          </span>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white px-4 py-1.5 rounded-full hover:bg-white/10 transition border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

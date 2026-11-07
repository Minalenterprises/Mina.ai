"use client";

import React, { useState, useMemo } from "react";
import { useMinal } from "@/lib/store";
import { useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Star,
  Percent,
  BarChart3,
  Megaphone,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  Box,
  Cpu,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  Sliders,
  Filter,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NavTab =
  | "dashboard"
  | "orders"
  | "products"
  | "generated"
  | "categories"
  | "customers"
  | "reviews"
  | "discounts"
  | "analytics"
  | "marketing"
  | "settings";

interface AdminViewProps {
  onClose?: () => void;
}

export function AdminView({ onClose }: AdminViewProps = {}) {
  const router = useRouter();
  const conversations = useMinal((s) => s.conversations);
  const orders = useMinal((s) => s.orders);
  const openViewer = useMinal((s) => s.openViewer);

  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [searchQuery, setSearchQuery] = useState("");

  // Demo generated things / AI user logs
  const generatedLogs = useMemo(() => {
    const defaultLogs = [
      {
        id: "GEN-8821",
        title: "Aura Parfum Rigid Box",
        prompt: "Design a luxury rigid lift-off lid perfume box for 100ml bottle with gold foil stamping.",
        model: "Nvidia Nemotron 3 Ultra",
        dimensions: "140 x 80 x 50 mm",
        substrate: "1200gsm Greyboard + 157gsm Artpaper",
        finish: "Soft-Touch Matte + 24K Gold Stamping",
        time: "10 mins ago",
        status: "Dieline Ready",
        user: "Sadekur Rahman",
      },
      {
        id: "GEN-8820",
        title: "E-Commerce Corrugated Mailer",
        prompt: "Create an e-commerce corrugated shipping mailer box, E-flute kraft with white ink branding.",
        model: "Claude 3.5 Sonnet",
        dimensions: "250 x 180 x 75 mm",
        substrate: "E-Flute Single Wall Corrugated",
        finish: "Flexo Direct Ink / Natural Kraft",
        time: "1 hour ago",
        status: "Sample Ordered",
        user: "Strato Footwear",
      },
      {
        id: "GEN-8819",
        title: "Straight-Tuck Cosmetic Mono-Carton",
        prompt: "Design a 300 GSM virgin SBS straight-tuck mono carton for dropper bottle with embossing.",
        model: "GPT-4o Omni",
        dimensions: "45 x 45 x 130 mm",
        substrate: "300gsm Virgin Fibre SBS",
        finish: "Gloss Aqueous Coat + Embossing",
        time: "3 hours ago",
        status: "CNC Calibrated",
        user: "Aura Serum Labs",
      },
      {
        id: "GEN-8818",
        title: "Sliding Tray & Ribbon Drawer Box",
        prompt: "Generate a sleeve and sliding tray box with gold satin ribbon pull and emerald exterior.",
        model: "Gemini 1.5 Pro",
        dimensions: "200 x 100 x 40 mm",
        substrate: "350gsm SBS Paperboard",
        finish: "Soft-Touch Matte + Spot UV Glaze",
        time: "Yesterday",
        status: "Production Ready",
        user: "Kashmir Loom Co.",
      },
      {
        id: "GEN-8817",
        title: "Pizza Delivery Corrugated Flute",
        prompt: "12-Inch Corrugated flute take-out box with ventilation tabs and food barrier.",
        model: "Nvidia Nemotron 3 Ultra",
        dimensions: "310 x 310 x 45 mm",
        substrate: "B-Flute Kraft FSC Certified",
        finish: "Single Color Water-based Flexo",
        time: "Yesterday",
        status: "Press Run",
        user: "Napoli Fire Artisans",
      },
    ];

    // Merge any real user conversation designs
    const userDesigns = conversations.flatMap((c) =>
      (c.designHistory || []).map((d, i) => ({
        id: `GEN-USER-${c.id.slice(0, 4)}-${i}`,
        title: d.title || c.title || "Custom Packaging",
        prompt: `Custom session: ${c.title}`,
        model: "Minal Packaging AI",
        dimensions: `${d.length} x ${d.width} x ${d.height} mm`,
        substrate: d.material || "SBS Paperboard",
        finish: d.finish || "Matte Lamination",
        time: "Recent session",
        status: "Saved in Studio",
        user: "Active Client",
      }))
    );

    return [...userDesigns, ...defaultLogs];
  }, [conversations]);

  // Merge live user placed orders with demo factory orders
  const allOrders = useMemo(() => {
    const userPlaced = orders.map((o) => ({
      id: `ORD-${o.id.slice(0, 4).toUpperCase()}`,
      client: o.info?.companyName || o.info?.fullName || "Bespoke Client",
      item: o.spec ? `${o.spec.title || o.spec.kind} (${o.spec.width}x${o.spec.length}x${o.spec.height}mm)` : "Custom Rigid Carton",
      qty: `${(o.info?.quantity || 1000).toLocaleString()} units`,
      stage: o.status === "pending" ? "Queued / Review" : o.status === "in_production" ? "Press Run" : "QC Passed",
      date: "Just now",
      amount: `$${((o.info?.quantity || 1000) * 1.85).toLocaleString()}`,
      statusColor: o.status === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    }));

    const demoOrders = [
      {
        id: "ORD-9412",
        client: "Strato Footwear Ltd.",
        item: "Custom Sneaker Rigid Box (340x220x130mm)",
        qty: "2,500 units",
        stage: "Die-Cutting",
        date: "Today 14:20",
        amount: "$4,250",
        statusColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      },
      {
        id: "ORD-9411",
        client: "Napoli Fire Artisans",
        item: "12-Inch Flute Corrugated Pizza Cartons",
        qty: "10,000 units",
        stage: "Press Run",
        date: "Today 11:45",
        amount: "$2,800",
        statusColor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      },
      {
        id: "ORD-9410",
        client: "Royal Wedding Suite",
        item: "Emerald Cardstock Rigid Box with Ribbon",
        qty: "600 sets",
        stage: "QC Passed",
        date: "Yesterday",
        amount: "$1,450",
        statusColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      },
      {
        id: "ORD-9409",
        client: "Aura Serum Labs",
        item: "Reverse-Tuck Dropper Mono-Carton",
        qty: "5,000 units",
        stage: "Dispatched",
        date: "Yesterday",
        amount: "$3,200",
        statusColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      },
      {
        id: "ORD-9408",
        client: "Kashmir Loom Co.",
        item: "Slide-out Satin Ribbon Drawer Box",
        qty: "1,200 units",
        stage: "Approved",
        date: "18 Sep",
        amount: "$1,850",
        statusColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      },
    ];

    return [...userPlaced, ...demoOrders];
  }, [orders]);

  // Live filtered AI logs by top search bar
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return generatedLogs;
    const q = searchQuery.toLowerCase();
    return generatedLogs.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.prompt.toLowerCase().includes(q) ||
        l.substrate.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q)
    );
  }, [generatedLogs, searchQuery]);

  // Live filtered orders by top search bar
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return allOrders;
    const q = searchQuery.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q) ||
        o.stage.toLowerCase().includes(q)
    );
  }, [allOrders, searchQuery]);

  // Customer accounts ledger
  const defaultCustomers = useMemo(() => [
    {
      id: "CUST-101",
      name: "Alice Johnson",
      company: "Alice & Co. Perfumes",
      email: "alice@perfumes.co",
      phone: "+92 300 8451290",
      orders: 23,
      spent: "$2,340",
      tier: "VIP",
      city: "Lahore",
      status: "Active",
    },
    {
      id: "CUST-102",
      name: "Robert Smith",
      company: "Strato Footwear Ltd.",
      email: "r.smith@stratofootwear.com",
      phone: "+92 321 4459812",
      orders: 18,
      spent: "$1,980",
      tier: "Enterprise",
      city: "Karachi",
      status: "Active",
    },
    {
      id: "CUST-103",
      name: "Maria Garcia",
      company: "Aura Serum Labs",
      email: "maria@auraserum.com",
      phone: "+92 333 9081234",
      orders: 15,
      spent: "$1,650",
      tier: "VIP",
      city: "Islamabad",
      status: "Active",
    },
    {
      id: "CUST-104",
      name: "Tariq Mahmood",
      company: "Kashmir Loom Co.",
      email: "tariq@kashmirloom.pk",
      phone: "+92 341 5567789",
      orders: 12,
      spent: "$2,890",
      tier: "Wholesale",
      city: "Faisalabad",
      status: "Active",
    },
    {
      id: "CUST-105",
      name: "Marco Rossi",
      company: "Napoli Fire Artisans",
      email: "marco@napolifire.it",
      phone: "+92 301 7891234",
      orders: 9,
      spent: "$1,420",
      tier: "Commercial",
      city: "Rawalpindi",
      status: "Active",
    },
    {
      id: "CUST-106",
      name: "Sadekur Rahman",
      company: "Minal Operations HQ",
      email: "sadekur@minal.ai",
      phone: "+92 300 1234567",
      orders: 34,
      spent: "$12,400",
      tier: "Partner",
      city: "Faisalabad",
      status: "Active",
    },
  ], []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return defaultCustomers;
    const q = searchQuery.toLowerCase();
    return defaultCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.tier.toLowerCase().includes(q)
    );
  }, [defaultCustomers, searchQuery]);

  // Packaging carton categories
  const categoriesList = useMemo(() => [
    {
      id: "cat-rigid",
      name: "Luxury Rigid Boxes",
      subtitle: "Lift-off lid, magnetic book-flap & shoulder boxes",
      substrate: "1200 - 1800 GSM Greyboard + 157 GSM Artpaper",
      finishes: "Hot Foil Stamping, Soft-Touch Matte, Embossing",
      moq: "500 units",
      leadTime: "5-7 Days",
      tag: "High Margin",
    },
    {
      id: "cat-corrugated",
      name: "Corrugated Mailers & Shippers",
      subtitle: "Roll-end tuck top & heavy-duty fluted master cartons",
      substrate: "E-Flute, B-Flute & Single Wall Kraft",
      finishes: "Direct Water-based Flexo, White Ink on Kraft",
      moq: "1,000 units",
      leadTime: "3-5 Days",
      tag: "High Volume",
    },
    {
      id: "cat-mono",
      name: "Cosmetic & Retail Mono-Cartons",
      subtitle: "Straight-tuck & reverse-tuck retail paperboard boxes",
      substrate: "300 - 400 GSM Virgin Fibre SBS Paperboard",
      finishes: "Gloss Aqueous Coat, Spot UV Glaze, Debossing",
      moq: "2,000 units",
      leadTime: "4-6 Days",
      tag: "Fast Turnaround",
    },
    {
      id: "cat-drawer",
      name: "Slide Tray & Ribbon Drawer Boxes",
      subtitle: "Two-piece friction-fit sliding drawer cartons",
      substrate: "350 GSM SBS / 1200 GSM Rigid Sleeve",
      finishes: "Satin Ribbon Pull, Gold Foil Rim, Matte Laminate",
      moq: "500 units",
      leadTime: "6-8 Days",
      tag: "Bespoke",
    },
    {
      id: "cat-food",
      name: "Food & Gourmet Cartons",
      subtitle: "Pizza take-out, bakery boxes with clear window patch",
      substrate: "FDA Certified Food-Grade Virgin Kraft",
      finishes: "Oil/Grease Barrier, Anti-Fog PET Window Film",
      moq: "1,000 units",
      leadTime: "3-4 Days",
      tag: "Food Safe",
    },
    {
      id: "cat-pos",
      name: "Countertop Point-of-Sale (POS)",
      subtitle: "Retail display trays with perforated tear-away headers",
      substrate: "450 GSM CCNB / E-Flute Laminated",
      finishes: "Full-color CMYK Litho-Laminate High Gloss",
      moq: "500 units",
      leadTime: "5-7 Days",
      tag: "Retail Ready",
    },
  ], []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesList;
    const q = searchQuery.toLowerCase();
    return categoriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.substrate.toLowerCase().includes(q)
    );
  }, [categoriesList, searchQuery]);

  // Chart data for monthly sales & production
  const chartData = [
    { month: "Jan", height: 35 },
    { month: "Feb", height: 50 },
    { month: "Mar", height: 75 },
    { month: "Apr", height: 90 },
    { month: "May", height: 65 },
    { month: "Jun", height: 55 },
    { month: "Jul", height: 28 },
    { month: "Aug", height: 70 },
    { month: "Sep", height: 60 },
    { month: "Oct", height: 85 },
    { month: "Nov", height: 65 },
    { month: "Dec", height: 35 },
  ];

  const handleInspectLog = (log: (typeof generatedLogs)[0]) => {
    sfx.click();
    const parts = log.dimensions.split("x").map((s) => parseInt(s.trim()));
    openViewer({
      kind: log.title,
      title: log.title,
      width: parts[0] || 140,
      length: parts[1] || 80,
      height: parts[2] || 50,
      material: log.substrate,
      finish: log.finish,
      colors: ["#18181b", "#ff6b00"],
    });
    toast.success(`Loaded "${log.title}" in 3D stage`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f5f8] text-zinc-900 font-sans flex items-center justify-center p-2 sm:p-4 md:p-6 select-none">
      {/* Container matching Mycogen dashboard image */}
      <div className="w-full max-w-[1400px] bg-white rounded-[28px] sm:rounded-[36px] shadow-[0_20px_70px_rgba(0,0,0,0.06)] border border-zinc-200/80 overflow-hidden flex flex-col">
        
        {/* =========================================================================
            TOP HEADER BAR (Matching Reference Image)
            ========================================================================= */}
        <header className="px-6 sm:px-8 py-4 border-b border-zinc-100 flex items-center justify-between gap-4 bg-white">
          {/* Brand Logo */}
          <div
            onClick={() => {
              sfx.click();
              router.push("/");
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white grid place-items-center font-bold text-sm shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="18" r="3" />
              </svg>
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-zinc-950 font-sans">
              Minal<span className="text-zinc-400 font-normal">Factory</span>
            </span>
          </div>

          {/* Search Bar in Header */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md h-10 px-4 rounded-full bg-zinc-50 border border-zinc-200/80 text-[13px] text-zinc-600 focus-within:border-zinc-900 focus-within:bg-white transition">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products, orders, customers, AI logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[13px] text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          {/* Right Header Controls: Notification, Profile, Action Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => {
                sfx.pop();
                toast.info("Heidelberg Speedmaster: 14,200 sheets/hr operational");
              }}
              className="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 grid place-items-center text-zinc-600 transition relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#ff6b00] text-white font-bold text-[9.5px] grid place-items-center shadow-sm">
                3
              </span>
            </button>

            {/* Profile Capsule */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-bold text-xs grid place-items-center shadow-sm">
                SR
              </div>
              <div className="leading-tight text-left">
                <div className="text-[13px] font-bold text-zinc-900">Sadekur Rahman</div>
                <div className="text-[10.5px] text-zinc-400 font-medium">Operations Partner</div>
              </div>
            </div>

            {/* "+ Launch Studio" Action Button (Black Pill Button) */}
            <button
              onClick={() => {
                sfx.success();
                router.push("/studio");
              }}
              className="h-10 px-4 rounded-full bg-zinc-950 hover:bg-black text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Studio</span>
            </button>

            {onClose && (
              <button
                onClick={() => {
                  sfx.pop();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 grid place-items-center transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* =========================================================================
            MAIN BODY: SIDEBAR + CONTENT AREA (Matching Reference Image)
            ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[700px]">
          
          {/* LEFT SIDEBAR (Exact Replica of Reference Menu) */}
          <aside className="w-full md:w-[220px] p-4 sm:p-5 border-r border-zinc-100 flex flex-col justify-between shrink-0 bg-white">
            <div className="space-y-1">
              {/* 1. Dashboard */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("dashboard");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "dashboard"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {/* 2. Orders */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("orders");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "orders"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Orders</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  24
                </span>
              </button>

              {/* 3. Products / Items */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("products");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "products"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <Package className="w-4 h-4" />
                <span>Products / Boxes</span>
              </button>

              {/* 4. Generated Things / AI Logs (Requested by user!) */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("generated");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "generated"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-[#ff6b00]" />
                  <span>AI Generated Logs</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold",
                  activeTab === "generated" ? "bg-[#ff6b00] text-black" : "bg-[#ff6b00]/15 text-[#ff6b00]"
                )}>
                  NEW
                </span>
              </button>

              {/* 5. Categories */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("categories");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "categories"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <Layers className="w-4 h-4" />
                <span>Categories</span>
              </button>

              {/* 6. Customers */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("customers");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "customers"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Customers</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                  activeTab === "customers" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  32
                </span>
              </button>

              {/* 7. Reviews & QC */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("reviews");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "reviews"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4" />
                  <span>Reviews / QC</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                  activeTab === "reviews" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  14
                </span>
              </button>

              {/* 8. Discounts / Rates */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("discounts");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "discounts"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <Percent className="w-4 h-4" />
                <span>Discounts</span>
              </button>

              {/* 9. Analytics */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("analytics");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "analytics"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>

              {/* 10. Marketing */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("marketing");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "marketing"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4" />
                  <span>Marketing</span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold",
                  activeTab === "marketing" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                )}>
                  3
                </span>
              </button>

              {/* 11. Settings */}
              <button
                onClick={() => {
                  sfx.click();
                  setActiveTab("settings");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition text-left",
                  activeTab === "settings"
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Bottom Button in Sidebar: "+ Add Product" */}
            <div className="pt-4 border-t border-zinc-100 mt-4">
              <button
                onClick={() => {
                  sfx.click();
                  router.push("/templates");
                }}
                className="w-full h-10 rounded-2xl bg-zinc-950 hover:bg-black text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT CONTAINER */}
          <main className="flex-1 p-5 sm:p-7 md:p-8 overflow-y-auto bg-zinc-50/50">
            
            {/* ===================================================================
                VIEW 1: DASHBOARD (Matching Reference Image)
                =================================================================== */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Greeting Header */}
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 mt-1">
                    Welcome back! Here&apos;s what&apos;s happening with your factory store today.
                  </p>
                </div>

                {/* Top Action Banner Strip (4 Pastel Cards with Arrow ↗) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Card 1: Pastel Blue */}
                  <div
                    onClick={() => {
                      sfx.click();
                      router.push("/studio");
                      toast.info("Parameter Dieline CAD Studio Loaded");
                    }}
                    className="p-4 rounded-2xl bg-[#e0f2fe]/80 border border-[#bae6fd] flex items-start justify-between cursor-pointer hover:shadow-md transition group min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-[#0369a1] flex items-center justify-between gap-1">
                        <span className="truncate">Create Dieline Spec</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#0369a1] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-[#0284c7] mt-1 leading-snug truncate">
                        Set up custom rigid box dimensions
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Pastel Amber/Yellow */}
                  <div
                    onClick={() => {
                      sfx.click();
                      toast.info("Heidelberg Speedmaster: 14,200 sheets/hr. Ink density 1.45. 21°C.");
                    }}
                    className="p-4 rounded-2xl bg-[#fef3c7]/80 border border-[#fde68a] flex items-start justify-between cursor-pointer hover:shadow-md transition group min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-[#b45309] flex items-center justify-between gap-1">
                        <span className="truncate">Press Run Telemetry</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#b45309] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-[#d97706] mt-1 leading-snug truncate">
                        Heidelberg offset live calibration
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Pastel Mint Green */}
                  <div
                    onClick={() => {
                      sfx.click();
                      toast.info("Faisalabad Press Line 2 online. 6-color offset & foil stamper active.");
                    }}
                    className="p-4 rounded-2xl bg-[#dcfce7]/80 border border-[#bbf7d0] flex items-start justify-between cursor-pointer hover:shadow-md transition group min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-[#15803d] flex items-center justify-between gap-1">
                        <span className="truncate">Factory Update</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#15803d] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-[#16a34a] mt-1 leading-snug truncate">
                        Faisalabad Press Line 2 online
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Pastel Lavender Purple */}
                  <div
                    onClick={() => {
                      sfx.click();
                      setActiveTab("discounts");
                      toast.info("Viewing Tiered Wholesale Volume Pricing (Up to 40% off)");
                    }}
                    className="p-4 rounded-2xl bg-[#f3e8ff]/80 border border-[#e9d5ff] flex items-start justify-between cursor-pointer hover:shadow-md transition group min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-[#7e22ce] flex items-center justify-between gap-1">
                        <span className="truncate">Wholesale Bulk Run</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#7e22ce] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-[#9333ea] mt-1 leading-snug truncate">
                        Tiered 10k+ volume pricing active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dual Column Layout: Left (2x3 Metrics + Sales Chart) | Right (Customer Insights + Active Promotions) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT STACK (lg:col-span-8) */}
                  <div className="lg:col-span-8 space-y-6 min-w-0">
                    
                    {/* 2x3 Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* 1. Total Sales */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Total Sales</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">$54,890</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>+12.5% This month</span>
                        </div>
                      </div>

                      {/* 2. Orders */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Orders</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">1,429</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>+8.2% This month</span>
                        </div>
                      </div>

                      {/* 3. Average Order Value */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Average Order Value</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">$38.42</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>+3.1% This month</span>
                        </div>
                      </div>

                      {/* 4. Returning Customers */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Returning Customers</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">68%</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>+2.4% This month</span>
                        </div>
                      </div>

                      {/* 5. Cart Abandonment */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Cart Abandonment</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">23.8%</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <span>↘ -1.8% This month</span>
                        </div>
                      </div>

                      {/* 6. Product Views */}
                      <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm min-w-0">
                        <div className="text-[12px] font-medium text-zinc-500">Product &amp; 3D Views</div>
                        <div className="text-[26px] sm:text-[28px] font-extrabold text-zinc-900 mt-1 truncate">45,210</div>
                        <div className="text-[11.5px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 whitespace-nowrap">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          <span>+15.3% This month</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales & Production Analytics Bar Chart Card */}
                    <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[16px] font-extrabold text-zinc-900">
                          Sales Analytics
                        </h2>

                        {/* Chart Period Filters */}
                        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-100 text-xs font-semibold">
                          {(["daily", "weekly", "monthly"] as const).map((period) => (
                            <button
                              key={period}
                              onClick={() => {
                                sfx.click();
                                setChartPeriod(period);
                              }}
                              className={cn(
                                "px-3 py-1 rounded-full capitalize transition",
                                chartPeriod === period
                                  ? "bg-zinc-950 text-white shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-900"
                              )}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Golden-Amber Bar Chart matching reference image */}
                      <div className="relative pt-4">
                        <div className="flex gap-3">
                          {/* Y-Axis Labels matching reference image */}
                          <div className="flex flex-col justify-between text-[11px] font-mono text-zinc-400 h-56 pb-7 shrink-0 text-right select-none">
                            <span>10000</span>
                            <span>7500</span>
                            <span>5000</span>
                            <span>2500</span>
                            <span>0</span>
                          </div>

                          {/* Chart Grid & Bars */}
                          <div className="flex-1 relative">
                            {/* Background horizontal guideline rules */}
                            <div className="absolute inset-0 flex flex-col justify-between pb-7 pointer-events-none opacity-40">
                              <div className="border-b border-zinc-200/80 w-full" />
                              <div className="border-b border-zinc-200/80 w-full" />
                              <div className="border-b border-zinc-200/80 w-full" />
                              <div className="border-b border-zinc-200/80 w-full" />
                              <div className="border-b border-zinc-200/80 w-full" />
                            </div>

                            <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-2.5 px-1 relative z-10">
                              {chartData.map((item) => (
                                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                                  <div
                                    className="w-full max-w-[34px] rounded-t-lg bg-gradient-to-t from-[#f59e0b] via-[#fbbf24] to-[#fde68a] hover:from-[#ea580c] hover:to-[#f59e0b] transition-all shadow-sm relative group-hover:scale-y-105 origin-bottom"
                                    style={{ height: `${item.height * 2.1}px` }}
                                  >
                                    {/* Hover tooltip */}
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap shadow-md z-20">
                                      ${item.height * 80}
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-medium text-zinc-400">
                                    {item.month}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT STACK (lg:col-span-4) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Customer Insights Card */}
                    <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm space-y-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-[16px] font-extrabold text-zinc-900">
                          Customer Insights
                        </h2>
                      </div>

                      {/* Top Metrics Row */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 grid place-items-center">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="text-[12.5px] font-bold text-zinc-900">New Customers</div>
                              <div className="text-[10px] text-zinc-400">This week</div>
                            </div>
                          </div>
                          <span className="font-extrabold text-[15px] text-zinc-900">15</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 grid place-items-center">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="text-[12.5px] font-bold text-zinc-900">VIP Customers</div>
                              <div className="text-[10px] text-zinc-400">Active brands</div>
                            </div>
                          </div>
                          <span className="font-extrabold text-[15px] text-zinc-900">12</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="text-[12.5px] font-bold text-zinc-900">Total Customers</div>
                              <div className="text-[10px] text-zinc-400">All time</div>
                            </div>
                          </div>
                          <span className="font-extrabold text-[15px] text-zinc-900">2,847</span>
                        </div>
                      </div>

                      {/* Top Customers List */}
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                          Top Customers
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] grid place-items-center">
                                AJ
                              </div>
                              <div>
                                <div className="text-[12px] font-bold text-zinc-900">Alice Johnson</div>
                                <div className="text-[10px] text-zinc-400">23 orders</div>
                              </div>
                            </div>
                            <span className="text-[12px] font-bold text-emerald-600 font-mono">$2,340</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] grid place-items-center">
                                RS
                              </div>
                              <div>
                                <div className="text-[12px] font-bold text-zinc-900">Robert Smith</div>
                                <div className="text-[10px] text-zinc-400">18 orders</div>
                              </div>
                            </div>
                            <span className="text-[12px] font-bold text-emerald-600 font-mono">$1,980</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] grid place-items-center">
                                MG
                              </div>
                              <div>
                                <div className="text-[12px] font-bold text-zinc-900">Maria Garcia</div>
                                <div className="text-[10px] text-zinc-400">15 orders</div>
                              </div>
                            </div>
                            <span className="text-[12px] font-bold text-emerald-600 font-mono">$1,650</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Retention Progress */}
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <span className="font-semibold text-zinc-900">Customer Retention</span>
                          <span className="font-bold text-emerald-600">60%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "60%" }} />
                        </div>
                        <div className="text-[10.5px] text-zinc-400 mt-1">
                          +2.4% from last month
                        </div>
                      </div>
                    </div>

                    {/* Active Promotions & Production Runs */}
                    <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm space-y-3.5">
                      <h2 className="text-[15px] font-extrabold text-zinc-900">
                        Active Promotions &amp; Runs
                      </h2>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div>
                          <div className="text-[12.5px] font-bold text-zinc-900">Holiday Sale</div>
                          <div className="text-[10.5px] text-zinc-400">Discount Code <span className="font-mono text-zinc-600">234 used</span></div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-bold">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div>
                          <div className="text-[12.5px] font-bold text-zinc-900">Heidelberg Press Run #4</div>
                          <div className="text-[10.5px] text-zinc-400">6-Color Offset <span className="font-mono text-zinc-600">89% completed</span></div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10.5px] font-bold">
                          Running
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 2: AI GENERATED LOGS & OUTPUTS ("users log genrated things")
                =================================================================== */}
            {activeTab === "generated" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      AI Generated Packaging Logs
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Real-time ledger of parametric dielines, 3D box models, and AI prompts generated by users.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono">Total Outputs:</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-zinc-950 text-white font-bold font-mono">
                      {filteredLogs.length} Records
                    </span>
                  </div>
                </div>

                {/* Logs Table Card */}
                <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-800">
                      <thead className="text-[10.5px] uppercase font-mono text-zinc-400 bg-zinc-50/75 border-b border-zinc-100">
                        <tr>
                          <th className="py-3.5 px-4">Spec ID</th>
                          <th className="py-3.5 px-4">Design Title &amp; Prompt</th>
                          <th className="py-3.5 px-4">Model Engine</th>
                          <th className="py-3.5 px-4">Footprint</th>
                          <th className="py-3.5 px-4">Material &amp; Finish</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-50/60 transition">
                            <td className="py-4 px-4 font-mono text-xs font-bold text-zinc-900">
                              {log.id}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-zinc-900">{log.title}</div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                                {log.prompt}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono">
                                {log.model}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-xs text-zinc-600">
                              {log.dimensions}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-[12px] text-zinc-800 font-medium">{log.substrate}</div>
                              <div className="text-[10.5px] text-zinc-400">{log.finish}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {log.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleInspectLog(log)}
                                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                                  title="3D Preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    sfx.pop();
                                    toast.success(`Dieline for ${log.title} downloaded!`);
                                  }}
                                  className="p-1.5 rounded-lg bg-zinc-950 hover:bg-black text-white transition"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 3: ORDERS (Detailed Table)
                =================================================================== */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      Factory Orders &amp; Press Queue
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Tracking physical production runs from Faisalabad offset presses to dispatch.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.success();
                      router.push("/studio");
                    }}
                    className="h-10 px-4 rounded-full bg-zinc-950 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Order Spec</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-800">
                      <thead className="text-[10.5px] uppercase font-mono text-zinc-400 bg-zinc-50/75 border-b border-zinc-100">
                        <tr>
                          <th className="py-3.5 px-4">Order ID</th>
                          <th className="py-3.5 px-4">Client Brand</th>
                          <th className="py-3.5 px-4">Packaging Specification</th>
                          <th className="py-3.5 px-4">Quantity</th>
                          <th className="py-3.5 px-4">Stage</th>
                          <th className="py-3.5 px-4">Invoice</th>
                          <th className="py-3.5 px-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-zinc-50/60 transition">
                            <td className="py-4 px-4 font-mono text-xs font-bold text-zinc-900">{ord.id}</td>
                            <td className="py-4 px-4 font-bold text-zinc-900">{ord.client}</td>
                            <td className="py-4 px-4 text-zinc-700">{ord.item}</td>
                            <td className="py-4 px-4 font-mono text-xs text-zinc-800">{ord.qty}</td>
                            <td className="py-4 px-4">
                              <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", ord.statusColor)}>
                                {ord.stage}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-zinc-900">{ord.amount}</td>
                            <td className="py-4 px-4 text-right font-mono text-xs text-zinc-400">{ord.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 4: PRODUCTS / ITEMS
                =================================================================== */}
            {activeTab === "products" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      Manufactured Packaging Items
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Standard and custom structural cartons manufactured at Minal Enterprises Press.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.click();
                      router.push("/templates");
                    }}
                    className="h-10 px-4 rounded-full bg-zinc-950 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Browse All Presets</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Luxury Rigid Box (Lift-Off)", price: "Rs 45.00", min: "500 pcs", material: "1200 GSM Greyboard" },
                    { name: "Magnetic Book Flap Box", price: "Rs 68.00", min: "300 pcs", material: "1400 GSM Heavy Board" },
                    { name: "Corrugated Roll-End Mailer", price: "Rs 28.00", min: "1,000 pcs", material: "E-Flute Kraft" },
                    { name: "Slide Drawer & Tray Box", price: "Rs 38.00", min: "500 pcs", material: "350 GSM SBS Board" },
                    { name: "Straight Tuck Mono-Carton", price: "Rs 16.50", min: "2,000 pcs", material: "300 GSM Virgin Board" },
                    { name: "Bakery Window Display Box", price: "Rs 22.00", min: "1,000 pcs", material: "Food Grade Kraft" },
                  ].map((p) => (
                    <div key={p.name} className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-mono text-[#ff6b00] font-bold uppercase tracking-wider">
                          {p.material}
                        </div>
                        <h3 className="text-[15px] font-bold text-zinc-900 mt-1">{p.name}</h3>
                        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500 font-mono">
                          <span>Unit: {p.price}</span>
                          <span>•</span>
                          <span>MOQ: {p.min}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-zinc-100 mt-4 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-600 font-bold">In Production</span>
                        <button
                          onClick={() => {
                            sfx.click();
                            router.push("/studio");
                          }}
                          className="text-[12px] font-bold text-zinc-900 hover:text-[#ff6b00] flex items-center gap-1"
                        >
                          <span>Configure</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 5: CATEGORIES
                =================================================================== */}
            {activeTab === "categories" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      Structural Carton Categories
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Certified dieline templates &amp; board constructions engineered at Minal Enterprises Press.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.success();
                      router.push("/studio");
                    }}
                    className="h-10 px-4 rounded-full bg-zinc-950 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Custom Structural CAD</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60 uppercase">
                            {cat.tag}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">MOQ: {cat.moq}</span>
                        </div>
                        <h3 className="text-[16px] font-extrabold text-zinc-900">{cat.name}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{cat.subtitle}</p>
                        
                        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-zinc-600">
                            <span className="text-zinc-400">Board Grade:</span>
                            <span className="font-medium font-mono text-[11px] truncate max-w-[170px] text-right">{cat.substrate}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-600">
                            <span className="text-zinc-400">Finishes:</span>
                            <span className="font-medium truncate max-w-[170px] text-right">{cat.finishes}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-600">
                            <span className="text-zinc-400">Press Turnaround:</span>
                            <span className="font-bold text-emerald-600 font-mono">{cat.leadTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 font-mono">CNC Dielines Ready</span>
                        <button
                          onClick={() => {
                            sfx.click();
                            router.push("/studio");
                            toast.info(`Opening ${cat.name} parametric CAD tool...`);
                          }}
                          className="h-8 px-3 rounded-full bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>Open in Studio</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 6: CUSTOMERS & VIP ACCOUNTS
                =================================================================== */}
            {activeTab === "customers" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      Customer Accounts &amp; Brand Partners
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Direct client relationships, repeat production contracts, and account spend.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.pop();
                      toast.success("New Client Onboarding form loaded");
                    }}
                    className="h-10 px-4 rounded-full bg-zinc-950 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Client</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-800">
                      <thead className="text-[10.5px] uppercase font-mono text-zinc-400 bg-zinc-50/75 border-b border-zinc-100">
                        <tr>
                          <th className="py-3.5 px-4">Account ID</th>
                          <th className="py-3.5 px-4">Client Name &amp; Company</th>
                          <th className="py-3.5 px-4">Contact Info</th>
                          <th className="py-3.5 px-4">Location</th>
                          <th className="py-3.5 px-4">Tier</th>
                          <th className="py-3.5 px-4">Total Orders</th>
                          <th className="py-3.5 px-4">Lifetime Spend</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredCustomers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-zinc-50/60 transition">
                            <td className="py-4 px-4 font-mono text-xs font-bold text-zinc-900">
                              {cust.id}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-zinc-900">{cust.name}</div>
                              <div className="text-[11.5px] text-zinc-500">{cust.company}</div>
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-zinc-600">
                              <div>{cust.email}</div>
                              <div className="text-[10.5px] text-zinc-400">{cust.phone}</div>
                            </td>
                            <td className="py-4 px-4 text-xs text-zinc-700 font-medium">
                              {cust.city}
                            </td>
                            <td className="py-4 px-4">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border",
                                cust.tier === "VIP" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                cust.tier === "Enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                cust.tier === "Partner" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                "bg-zinc-100 text-zinc-700 border-zinc-200"
                              )}>
                                {cust.tier}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-xs font-bold text-zinc-800">
                              {cust.orders} runs
                            </td>
                            <td className="py-4 px-4 font-mono font-extrabold text-emerald-600">
                              {cust.spent}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => {
                                  sfx.click();
                                  router.push("/studio");
                                  toast.info(`Preparing custom carton spec for ${cust.company}`);
                                }}
                                className="px-3 py-1 rounded-full bg-zinc-950 text-white text-[11px] font-semibold hover:bg-black transition"
                              >
                                Re-Order Spec
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 7: REVIEWS & QC INSPECTION
                =================================================================== */}
            {activeTab === "reviews" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                    Quality Control &amp; Press Approvals
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 mt-1">
                    Spectrophotometer delta-E validation passes, folding stiffness tests, and verified client press reports.
                  </p>
                </div>

                {/* 4 Telemetry Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Offset Registration</div>
                    <div className="text-[24px] font-extrabold text-zinc-900 mt-1 font-mono">±0.03 mm</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passed (Target ±0.05 mm)</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Color Fidelity</div>
                    <div className="text-[24px] font-extrabold text-zinc-900 mt-1 font-mono">ΔE 1.12</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved (Standard &lt; 2.0)</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Board Moisture</div>
                    <div className="text-[24px] font-extrabold text-zinc-900 mt-1 font-mono">7.2% RH</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Optimal 6.5–7.5% Range</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fold Stiffness</div>
                    <div className="text-[24px] font-extrabold text-zinc-900 mt-1 font-mono">1.42 N</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Standard Auto-Erect</span>
                    </div>
                  </div>
                </div>

                {/* Client Reviews Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Sadekur Rahman",
                      company: "Minal Enterprises Operations",
                      box: "Aura Parfum Rigid Box (100ml)",
                      stars: 5,
                      text: "The gold foil stamping and soft-touch lamination on the greyboard exceeded European luxury standards. Sharp corners with 0.1mm alignment.",
                      date: "2 days ago",
                    },
                    {
                      name: "Marco Rossi",
                      company: "Napoli Fire Artisans",
                      box: "12-Inch Corrugated Pizza Cartons",
                      stars: 5,
                      text: "Delivered 10,000 units to our kitchen on-time. Exceptional B-flute steam barrier and zero box warping during hot transit.",
                      date: "Yesterday",
                    },
                    {
                      name: "Robert Smith",
                      company: "Strato Footwear Ltd.",
                      box: "Sneaker Rigid Box (340x220x130mm)",
                      stars: 5,
                      text: "Massive structural rigidity. The magnetic closure snaps shut with satisfying tactile feel. Will re-order 5,000 more next month.",
                      date: "4 days ago",
                    },
                    {
                      name: "Maria Garcia",
                      company: "Aura Serum Labs",
                      box: "Dropper Bottle Mono-Carton",
                      stars: 5,
                      text: "Precision micro-embossing on 300 GSM SBS virgin board. Fits the bottle like a glove. Heidelberg print registration was 100% spot-on.",
                      date: "Last week",
                    },
                  ].map((rev, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(rev.stars)].map((_, idx) => (
                              <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">{rev.date}</span>
                        </div>
                        <div className="text-[11.5px] font-mono font-bold text-[#ff6b00] uppercase mb-1">{rev.box}</div>
                        <p className="text-[13px] text-zinc-700 leading-relaxed italic">
                          &ldquo;{rev.text}&rdquo;
                        </p>
                      </div>
                      <div className="pt-3 border-t border-zinc-100 mt-4 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-zinc-900">{rev.name}</div>
                          <div className="text-[11px] text-zinc-400">{rev.company}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          QC Verified Press Run
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 8: DISCOUNTS & TIERED WHOLESALE SCHEDULE
                =================================================================== */}
            {activeTab === "discounts" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                    Wholesale Volume Schedules &amp; Discount Vouchers
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 mt-1">
                    Direct mill discounts on paperboard, greyboard, and corrugated fluting for bulk manufacturing runs.
                  </p>
                </div>

                {/* Volume Tier Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {[
                    { tier: "Tier 1", units: "500 - 999", discount: "Base Rate", savings: "Standard MOQ", color: "border-zinc-200 bg-white" },
                    { tier: "Tier 2", units: "1,000 - 2,499", discount: "10% OFF", savings: "Save ~Rs 4.50/unit", color: "border-blue-200 bg-blue-50/40" },
                    { tier: "Tier 3", units: "2,500 - 4,999", discount: "20% OFF", savings: "Save ~Rs 9.00/unit", color: "border-amber-200 bg-amber-50/40" },
                    { tier: "Tier 4", units: "5,000 - 9,999", discount: "30% OFF", savings: "Save ~Rs 14.50/unit", color: "border-emerald-200 bg-emerald-50/40" },
                    { tier: "Tier 5", units: "10,000+ units", discount: "40% OFF", savings: "Mill Direct Wholesale", color: "border-orange-300 bg-orange-50/60" },
                  ].map((t) => (
                    <div key={t.tier} className={cn("p-4 rounded-2xl border shadow-sm flex flex-col justify-between", t.color)}>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-zinc-500">{t.tier}</span>
                        <div className="text-[15px] font-extrabold text-zinc-900 mt-0.5">{t.units}</div>
                        <div className="text-[22px] font-black text-zinc-950 mt-2">{t.discount}</div>
                      </div>
                      <div className="text-[11px] font-medium text-zinc-500 mt-3 pt-2 border-t border-black/5">
                        {t.savings}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Vouchers Card */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4">
                  <h2 className="text-[16px] font-extrabold text-zinc-900">
                    Active Factory Discount Vouchers
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        code: "HOLIDAY2026",
                        benefit: "20% Off Sample Press Runs",
                        usage: "234 clients redeemed",
                        expiry: "31 Jan 2026",
                      },
                      {
                        code: "MINALVIP",
                        benefit: "Free CNC CAD Dieline Setup ($150 Value)",
                        usage: "89 clients redeemed",
                        expiry: "Ongoing VIP",
                      },
                      {
                        code: "FREIGHTPK",
                        benefit: "50% Off Direct Transport Across Pakistan",
                        usage: "145 clients redeemed",
                        expiry: "15 Feb 2026",
                      },
                    ].map((promo) => (
                      <div key={promo.code} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-zinc-900 text-white select-all">
                              {promo.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Active
                            </span>
                          </div>
                          <div className="text-[13px] font-bold text-zinc-900 mt-3">{promo.benefit}</div>
                          <div className="text-[11px] text-zinc-500 mt-1">{promo.usage}</div>
                        </div>

                        <div className="pt-3 border-t border-zinc-200/50 mt-4 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-mono">Valid until {promo.expiry}</span>
                          <button
                            onClick={() => {
                              sfx.click();
                              navigator.clipboard.writeText(promo.code);
                              toast.success(`Copied code "${promo.code}" to clipboard!`);
                            }}
                            className="text-xs font-bold text-[#ff6b00] hover:underline"
                          >
                            Copy Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 9: ANALYTICS & MACHINE TELEMETRY
                =================================================================== */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                    Factory Telemetry &amp; Machine Analytics
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 mt-1">
                    Real-time Heidelberg offset press speeds, Bobst die-cutting throughput, and raw board yields.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-[12px] font-medium text-zinc-500">Heidelberg XL 106 Speed</div>
                    <div className="text-[26px] font-extrabold text-zinc-900 mt-1 font-mono">14,200 <span className="text-sm font-normal text-zinc-400">s/hr</span></div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1">94% of rated machine speed</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-[12px] font-medium text-zinc-500">Daily Press Sheet Output</div>
                    <div className="text-[26px] font-extrabold text-zinc-900 mt-1 font-mono">113,600</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1">+18.4% above shift target</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-[12px] font-medium text-zinc-500">Board Scrap Waste Rate</div>
                    <div className="text-[26px] font-extrabold text-zinc-900 mt-1 font-mono">1.18%</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1">Industry benchmark is 3.5%</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
                    <div className="text-[12px] font-medium text-zinc-500">Clean Energy Offset</div>
                    <div className="text-[26px] font-extrabold text-zinc-900 mt-1 font-mono">42%</div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-1">Powered by Faisalabad rooftop solar</div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-extrabold text-zinc-900">
                      Press Shift Output Breakdown (Units per Hour)
                    </h2>
                    <span className="text-xs font-mono text-zinc-400">Heidelberg Press Line 1 &amp; 2 Online</span>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 items-end h-44 border-b border-zinc-100 pb-3">
                    {[65, 80, 92, 98, 85, 70, 45, 88, 95, 99, 90, 75].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 transition-all shadow-sm"
                          style={{ height: `${val}%` }}
                        />
                        <span className="text-[9.5px] font-mono text-zinc-400">{idx * 2}:00</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 10: MARKETING CAMPAIGNS
                =================================================================== */}
            {activeTab === "marketing" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                      Factory Marketing &amp; Brand Outreach
                    </h1>
                    <p className="text-[13.5px] text-zinc-500 mt-1">
                      Promote physical sample kit distribution, luxury packaging showcases, and direct brand campaigns.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sfx.success();
                      toast.success("Sample Kit Dispatch dispatched to perfume clients");
                    }}
                    className="h-10 px-4 rounded-full bg-zinc-950 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dispatch Sample Kits</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Faisalabad Heritage Swatch Box",
                      desc: "500 tactile tactile swatches of greyboard, SBS, and kraft with foil stamps dispatched to perfume & footwear founders.",
                      stat: "78% Conversion to Quote",
                      badge: "Active",
                      badgeColor: "bg-emerald-100 text-emerald-800",
                    },
                    {
                      title: "Gold Foil & Emboss Showcase",
                      desc: "Promotional mailer sent to Karachi and Lahore cosmetic brands highlighting 24K hot-stamping tolerances.",
                      stat: "89% Email Open Rate",
                      badge: "Running",
                      badgeColor: "bg-amber-100 text-amber-800",
                    },
                    {
                      title: "Eco-Kraft Mailer Outreach",
                      desc: "Targeting high-growth Shopify apparel brands with 100% biodegradable FSC certified corrugated cartons.",
                      stat: "1,200 DTC Brands Targeted",
                      badge: "Scheduled",
                      badgeColor: "bg-blue-100 text-blue-800",
                    },
                  ].map((camp, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10.5px] font-bold", camp.badgeColor)}>
                            {camp.badge}
                          </span>
                          <Megaphone className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <h3 className="text-[15px] font-bold text-zinc-900">{camp.title}</h3>
                        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{camp.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 mt-4 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-600 font-mono">{camp.stat}</span>
                        <button
                          onClick={() => {
                            sfx.click();
                            toast.info(`Managing campaign: ${camp.title}`);
                          }}
                          className="text-xs font-bold text-zinc-900 hover:text-[#ff6b00] flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                VIEW 11: SETTINGS & MACHINE CALIBRATION
                =================================================================== */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-extrabold text-zinc-900 tracking-tight">
                    Factory Settings &amp; Press Line Profiles
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 mt-1">
                    Configure machine tolerances, CAD measurement standards, and team operations.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-6">
                  {/* Factory Machine Roster */}
                  <div>
                    <h2 className="text-[15px] font-extrabold text-zinc-900 mb-3">
                      Production Machinery
                    </h2>
                    <div className="space-y-2.5">
                      {[
                        { name: "Heidelberg Speedmaster XL 106", role: "6-Color Offset + Aqueous Coater", status: "Online", speed: "14,200 sheets/hr" },
                        { name: "Bobst Novacut 106 ER", role: "Autoplaten Die-Cutter & Embosser", status: "Online", speed: "7,500 sheets/hr" },
                        { name: "Polar 137 High-Speed Guillotine", role: "Hydraulic Paperboard Trimmer", status: "Online", speed: "Hydraulic precision" },
                      ].map((mach) => (
                        <div key={mach.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                          <div>
                            <div className="text-[13px] font-bold text-zinc-900">{mach.name}</div>
                            <div className="text-[11px] text-zinc-400">{mach.role}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-zinc-500">{mach.speed}</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-bold">
                              {mach.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calibration & Units */}
                  <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                      <div className="text-[13px] font-bold text-zinc-900">CAD Dimensions Unit</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Default unit across all parametric 3D views</div>
                      <div className="flex items-center gap-2 mt-3">
                        <button className="px-3 py-1.5 rounded-full bg-zinc-950 text-white text-xs font-bold shadow-sm">
                          Millimeters (mm)
                        </button>
                        <button className="px-3 py-1.5 rounded-full bg-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-300">
                          Inches (in)
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                      <div className="text-[13px] font-bold text-zinc-900">Primary Invoicing Currency</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Display invoices for wholesale clients</div>
                      <div className="flex items-center gap-2 mt-3">
                        <button className="px-3 py-1.5 rounded-full bg-zinc-950 text-white text-xs font-bold shadow-sm">
                          PKR (Rs)
                        </button>
                        <button className="px-3 py-1.5 rounded-full bg-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-300">
                          USD ($)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Location & Heritage info */}
                  <div className="pt-4 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-800">Minal Enterprises Packaging Mills</span> — Small Industrial Estate, Faisalabad, Punjab, Pakistan
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">Heidelberg ID: PK-FSD-0492</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const open = useMinal((s) => s.adminOpen);
  const setOpen = useMinal((s) => s.openAdmin);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-[1440px] h-[94vh] rounded-[32px] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)] flex flex-col bg-[#f4f5f8] border border-white/20">
        <div className="flex-1 overflow-y-auto minal-scroll">
          <AdminView onClose={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );
}

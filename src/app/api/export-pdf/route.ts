import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { DesignSpec, OrderInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  spec: DesignSpec;
  order?: OrderInfo;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.spec) {
      return NextResponse.json({ error: "spec required" }, { status: 400 });
    }
    const { spec, order } = body;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = 56;

    doc.setFillColor(229, 70, 31);
    doc.rect(0, 0, pageW, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(26, 20, 16);
    doc.text("Minal AI", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 110, 100);
    doc.text("Design Specification Sheet", pageW - margin, y, { align: "right" });

    y += 22;
    doc.setDrawColor(220, 210, 195);
    doc.line(margin, y, pageW - margin, y);
    y += 26;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(26, 20, 16);
    doc.text(spec.title || spec.kind, margin, y);
    y += 22;

    const rows: [string, string][] = [
      ["Type", spec.kind],
      ["Width", `${spec.width}"`],
      ["Length", `${spec.length}"`],
      ["Height", `${spec.height}"`],
      ["Material", spec.material],
      ["Finish", spec.finish],
      ["Colors", (spec.colors || []).join("   •   ")],
    ];
    if (spec.notes) rows.push(["Notes", spec.notes]);

    doc.setFontSize(10);
    for (const [k, v] of rows) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 110, 100);
      doc.text(k.toUpperCase(), margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(26, 20, 16);
      doc.text(String(v || "—"), margin + 120, y, { maxWidth: pageW - margin * 2 - 120 });
      y += 22;
    }

    if (spec.colors?.length) {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 110, 100);
      doc.setFontSize(9);
      doc.text("PALETTE", margin, y);
      y += 16;
      let x = margin;
      for (const c of spec.colors) {
        const hex = c.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16) || 0;
        const g = parseInt(hex.slice(2, 4), 16) || 0;
        const b = parseInt(hex.slice(4, 6), 16) || 0;
        doc.setFillColor(r, g, b);
        doc.rect(x, y - 10, 22, 22, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 70, 60);
        doc.text(c, x, y + 22);
        x += 60;
      }
      y += 50;
    }

    // Brand info section
    if (spec.brand) {
      const b = spec.brand;
      y += 8;
      doc.setDrawColor(229, 70, 31);
      doc.setLineWidth(1.5);
      doc.line(margin, y, margin + 30, y);
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(26, 20, 16);
      doc.text("Brand & Back Panel Info", margin, y);
      y += 20;

      const brandRows: [string, string][] = [
        ["Company", b.companyName],
        ["Tagline", b.tagline],
        ["Description", b.description],
        ["Ingredients", b.ingredients],
        ["Weight", b.weight],
        ["Barcode", b.barcode],
        ["Website", b.website],
        ["Email", b.email],
        ["Phone", b.phone],
        ["Address", b.address],
        ["Regulatory", b.regulatory],
        ["Social", (b.social || []).join("  ·  ")],
      ];
      doc.setFontSize(10);
      for (const [k, v] of brandRows) {
        if (!v) continue;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 110, 100);
        doc.text(k.toUpperCase(), margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 20, 16);
        doc.text(String(v), margin + 120, y, { maxWidth: pageW - margin * 2 - 120 });
        y += 20;
        if (y > pageH - 100) {
          doc.addPage();
          y = 56;
        }
      }
    }

    if (order) {
      y += 12;
      doc.setDrawColor(220, 210, 195);
      doc.line(margin, y, pageW - margin, y);
      y += 24;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(26, 20, 16);
      doc.text("Order Request", margin, y);
      y += 20;

      const o: [string, string][] = [
        ["Full Name", order.fullName],
        ["Company", order.companyName],
        ["CNIC", order.cnic],
        ["Phone", order.phone],
        ["Address", order.address],
        ["Quantity", String(order.quantity)],
        ["Notes", order.notes],
      ];
      doc.setFontSize(10);
      for (const [k, v] of o) {
        if (!v) continue;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 110, 100);
        doc.text(k.toUpperCase(), margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(26, 20, 16);
        doc.text(v, margin + 120, y, { maxWidth: pageW - margin * 2 - 120 });
        y += 20;
      }
    }

    doc.setDrawColor(220, 210, 195);
    doc.line(margin, pageH - 56, pageW - margin, pageH - 56);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 130, 120);
    doc.text("Generated by Minal AI — minalenterprises.org", margin, pageH - 40);
    doc.text(new Date().toLocaleString(), pageW - margin, pageH - 40, { align: "right" });

    const bytes = doc.output("arraybuffer");
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="minal-${(spec.title || spec.kind).replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal" },
      { status: 500 }
    );
  }
}

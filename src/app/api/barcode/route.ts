import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import bwipjs from "bwip-js";

export const runtime = "nodejs";

interface Body {
  code: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    // Sanitize: keep digits only, pad/truncate to 12 for EAN-13 (last digit is checksum)
    let digits = body.code.replace(/\D/g, "");
    if (digits.length < 12) {
      digits = digits.padEnd(12, "0");
    } else if (digits.length > 13) {
      digits = digits.slice(0, 13);
    } else if (digits.length === 12) {
      // bwip-js will compute the checksum
    } else if (digits.length === 13) {
      // already full — strip last so bwip recomputes
      digits = digits.slice(0, 12);
    }

    const png = await bwipjs.toBuffer({
      bcid: "ean13",
      text: digits,
      scale: 2,
      height: 30,
      includetext: true,
      textxalign: "center",
      paddingwidth: 8,
      paddingheight: 4,
    });

    return new NextResponse(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal" },
      { status: 500 }
    );
  }
}

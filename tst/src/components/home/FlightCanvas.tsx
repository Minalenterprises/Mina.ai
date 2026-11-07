"use client";
import dynamic from "next/dynamic";

const HomeFlight = dynamic(() => import("./HomeFlight"), { ssr: false });

export default function FlightCanvas() {
  return <HomeFlight />;
}

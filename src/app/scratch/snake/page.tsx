import type { Metadata } from "next";
import SnekVG from "@/components/SnekVG";

export const metadata: Metadata = {
  title: "Snake",
  alternates: { canonical: "/scratch/snake" },
};

export default function Snake() {
  return <SnekVG />;
}

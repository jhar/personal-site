import type { Metadata } from "next";
import VisitsTable from "./VisitsTable";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Visits() {
  return <VisitsTable />;
}

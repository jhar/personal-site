import { BLACK, Bars, Ground, OCHRE, PALE, ROSE } from "./parts";

// A few that belong together, and one further off.
export default function Family() {
  return (
    <>
      <Ground fill="#161A1B" />
      <Bars from={560} to={720} step={40} height={18} fill="#263033" />
      <circle cx="440" cy="320" r="140" fill={OCHRE} />
      <circle cx="610" cy="395" r="100" fill={ROSE} />
      <circle cx="505" cy="505" r="62" fill={PALE} />
      <circle cx="650" cy="250" r="40" fill={PALE} />
      <circle cx="130" cy="610" r="76" fill={BLACK} />
    </>
  );
}

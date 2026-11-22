import { BLACK, Bars, Ground, PALE, ROSE } from "./parts";

// A loaded bar across the top, and what it landed on.
export default function Bar() {
  return (
    <>
      <Ground fill="#1B1212" />
      <Bars from={430} to={720} step={30} height={12} fill={PALE} />
      <rect x="-300" y="150" width="1600" height="34" fill={BLACK} />
      <circle cx="70" cy="167" r="180" fill={BLACK} />
      <circle cx="930" cy="167" r="180" fill={BLACK} />
      <circle cx="500" cy="330" r="74" fill={ROSE} />
      <circle cx="370" cy="470" r="13" fill={ROSE} />
      <circle cx="650" cy="505" r="20" fill={ROSE} />
    </>
  );
}

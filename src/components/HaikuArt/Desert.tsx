import { Bars, Ground, OCHRE, PALE, ROSE, Swell } from "./parts";

// Dunes, a low sun, and wind across the top.
export default function Desert() {
  return (
    <>
      <Ground fill="#2A2012" />
      <circle cx="750" cy="200" r="110" fill={ROSE} />
      <Bars from={40} to={250} step={46} height={8} fill={PALE} tilt={-5} />
      <Swell y={450} rise={110} length={760} fill="#6B5330" />
      <Swell y={540} rise={90} length={620} fill="#9A7A45" />
      <Swell y={640} rise={80} length={900} fill={OCHRE} />
    </>
  );
}

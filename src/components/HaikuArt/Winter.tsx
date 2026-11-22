import { BLACK, Bars, Ground, PALE } from "./parts";

// Cold slanting down over everything, and green coming up from one corner.
export default function Winter() {
  return (
    <>
      <Ground fill="#121A22" />
      <Bars from={-40} to={470} step={52} height={14} fill={PALE} tilt={-12} />
      <circle cx="230" cy="430" r="150" fill={BLACK} />
      <circle cx="820" cy="660" r="210" fill="#8FB58A" />
      <circle cx="590" cy="500" r="24" fill="#8FB58A" />
    </>
  );
}

import { BLACK, Ground, PALE } from "./parts";

const RED = "#B54A3F";

// A field split in two, each half wearing the other's colour.
export default function Inversion() {
  return (
    <>
      <Ground fill={BLACK} />
      <polygon points="-300,-300 1367,-300 -300,950" fill={PALE} />
      <path d="M652 236 A190 190 0 0 0 348 464 Z" fill={BLACK} />
      <path d="M652 236 A190 190 0 0 1 348 464 Z" fill={PALE} />
      <polygon points="150,110 300,150 190,250" fill={RED} />
      <polygon points="850,590 700,550 810,450" fill={RED} />
      <circle cx="800" cy="200" r="30" fill={RED} />
    </>
  );
}

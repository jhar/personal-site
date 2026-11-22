import { BLACK, Ground } from "./parts";

const PETALS = Array.from({ length: 18 }, (_, i) => i * 20);

// A ring of blue flame.
export default function Gas() {
  return (
    <>
      <Ground fill="#0E151C" />
      {PETALS.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 500 400)`}>
          <polygon points="456,230 544,230 500,30" fill="#4F8FD9" />
          <polygon points="474,230 526,230 500,120" fill="#A9CDF2" />
        </g>
      ))}
      <circle cx="500" cy="400" r="185" fill={BLACK} />
      <circle cx="860" cy="110" r="26" fill="#E0B45A" />
    </>
  );
}

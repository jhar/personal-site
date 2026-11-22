import { Bars, Ground } from "./parts";

// A hot blue sky and a sun already high, through blinds.
export default function Noon() {
  return (
    <>
      <Ground fill="#6F9FD4" />
      <circle cx="560" cy="110" r="250" fill="#F0CF86" />
      <circle cx="560" cy="110" r="160" fill="#FFF1C7" />
      <Bars from={390} to={720} step={34} height={18} fill="#1B1212" />
    </>
  );
}

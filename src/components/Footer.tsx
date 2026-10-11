import FooterLink from "./FooterLink";
import Year from "./Year";

export default function Footer() {
  return (
    <footer className="absolute dark:bg-slate bg-white fixed bottom-0 w-full">
      <div className="font-serif flex flex-row items-center justify-around m-auto max-w-5xl py-3 text-medgray dark:text-offwhite text-sm w-[86%]">
        <span>&copy; <Year /></span>
        <FooterLink
          name="credly"
          href="https://www.credly.com/users/justin-harrison.19866e97"
        />
        <FooterLink name="github" href="https://github.com/jhar" />
        <FooterLink name="gitlab" href="https://gitlab.com/justin187" />
        <FooterLink
          name="linkedin"
          href="https://www.linkedin.com/in/justinadenharrison"
        />
      </div>
    </footer>
  );
}

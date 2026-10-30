import FooterLink from "./FooterLink";
import ThemeToggle from "./ThemeToggle";
import Year from "./Year";

export default function Footer() {
  return (
    <footer className="absolute bg-page fixed bottom-0 w-full">
      <div className="font-footer [font-weight:var(--t-footer-weight)] [letter-spacing:var(--t-footer-tracking)] [text-transform:var(--t-footer-case)] [font-size:var(--t-footer-size)] flex flex-row items-center justify-around m-auto max-w-5xl py-3 text-ink w-[86%]">
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
        <ThemeToggle className="cursor-pointer hover:animate-pulse hover:text-link-hover [text-transform:inherit] [letter-spacing:inherit]" />
      </div>
    </footer>
  );
}

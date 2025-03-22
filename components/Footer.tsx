import FooterLink from "./FooterLink.tsx";

export default function Footer() {
  return (
    <footer class="absolute dark:bg-slate bg-white dark:bg fixed bottom-0 w-full">
      <div class="font-serif flex flex-row items-center justify-around m-auto max-w-5xl py-3 text-medgray dark:text-offwhite text-sm w-[86%]">
        <span>&copy; {new Date().getFullYear()}</span>
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

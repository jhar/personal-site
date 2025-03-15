export default function Footer() {
  return (
    <footer class="fixed bottom-0 w-full">
      <div class="font-serif flex flex-row items-center justify-around m-auto max-w-5xl py-3 text-medgray dark:text-offwhite text-sm w-[86%]">
        <span>&copy; {new Date().getFullYear()}</span>
        <a
          class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue dark:text-offwhite"
          href="https://github.com/jhar"
        >
          github
        </a>
        <a
          class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue dark:text-offwhite"
          href="https://www.linkedin.com/in/justinadenharrison"
        >
          linkedin
        </a>
      </div>
    </footer>
  );
}

import Experience from "./Experience.tsx";
import SectionHeader from "./SectionHeader.tsx";
import experience from "./experience.json" with { type: "json" };

export default function Resume() {
  return (
    <div class="box-border dark:text-offwhite font-mono h-full mx-auto max-w-5xl pb-15 w-[86%]">
      <div class="box-border inline-block float-left min-h-[57px] pr-10 w-full md:w-[62%] mb-5">
        <span class="dark:text-slate-200 text-3xl">Full-Stack Developer</span>
      </div>
      <div class="box-border inline-block float-right w-full md:w-[38%] mb-5">
        <span class="font-bold">Burbank, CA</span>
        <br />
        <a
          class="hover:animate-pulse hover:text-blue"
          href="mailto:jhar-dev@protonmail.com"
          target="_top"
        >
          jhar-dev@protonmail.com
        </a>
        <br />
      </div>
      <div class="box-border inline-block float-left min-h-[57px] pr-10 w-full md:w-[62%] md:mb-12">
        <SectionHeader name="Work Experience" />
        {experience.work.map((entry) => <Experience {...entry} />)}
      </div>
      <div class="box-border inline-block float-right w-full md:w-[38%] mb-12">
        <SectionHeader name="Education and Awards" />
        {experience.education.map((entry) => <Experience {...entry} />)}
        <SectionHeader name="Professional Development" />
        {experience.professionalDevelopment.map((entry) => (
          <Experience {...entry} />
        ))}
        <SectionHeader name="Technical Skills" />
        <p class="mb-5">
          HTML, CSS, JavaScript, PHP, MySQL, MongoDB, Unix, Bootstrap, jQuery,
          React, Knockout, Vue, Node, NPM, Express, SASS, LESS, Firebase, AWS,
          Webpack, Browserify, Gulp, WordPress, p5.js, Processing, Chrome
          Developer Tools, AJAX, and Google.
        </p>
        <SectionHeader name="Volunteering" />
        {experience.volunteering.map((entry) => <Experience {...entry} />)}
      </div>
    </div>
  );
}

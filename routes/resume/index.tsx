import Experience from "./Experience.tsx";
import SectionHeader from "./SectionHeader.tsx";
import resume from "./resume.json" with { type: "json" };

export default function Resume() {
  const sections = Object.groupBy(resume.data, d => d.category);
  return (
    <div class="box-border dark:text-offwhite font-mono h-full mx-auto max-w-5xl pb-15 w-[86%]">
      <div class="box-border inline-block float-left min-h-[57px] pr-10 w-full md:w-[62%] mb-5">
        <span class="dark:text-slate-200 text-3xl">Software Engineer</span>
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
        {sections["Work Experience"]?.map((entry) => <Experience {...entry} />)}
      </div>
      <div class="box-border inline-block float-right w-full md:w-[38%] mb-12">
        <SectionHeader name="Education and Awards" />
        {sections["Education and Awards"]?.map((entry) => <Experience {...entry} />)}
        <SectionHeader name="Professional Development" />
        {sections["Professional Development"]?.map((entry) => (
          <Experience {...entry} />
        ))}
        <SectionHeader name="Technical Skills" />
        {sections["Technical Skills"]?.map((entry) => <Experience {...entry} />)}
        <SectionHeader name="Volunteering" />
        {sections["Volunteering"]?.map((entry) => <Experience {...entry} />)}
      </div>
    </div>
  );
}

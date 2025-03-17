import Category from "./Category.tsx";
import resume from "./resume.json" with { type: "json" };

export default function Resume() {
  const data = Object.groupBy(resume.data, (d) => d.category);
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
      <div class="box-border inline-block float-left min-h-[57px] pr-10 w-full md:w-[62%] md:pb-20">
        <Category experience={data["Work Experience"]} />
      </div>
      <div class="box-border inline-block float-right w-full md:w-[38%] pb-11">
        <Category experience={data["Education and Awards"]} />
        <Category experience={data["Professional Development"]} />
        <Category experience={data["Technical Skills"]} />
        <Category experience={data["Volunteering"]} />
      </div>
    </div>
  );
}

import Experience from "./Experience.tsx";
import SectionHeader from "./SectionHeader.tsx";
import experience from "./experience.json" with { type: "json" };

export default function Resume() {
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
          Adobe CS, A-Frame, Ant Design, Amplify, AppSync, Ahtena, CloudFront, CloudWatch,
          Cognito, CSS3, Cypress, DigitalOcean, Docker, DynamoDB, EC2, ECS, Elm, EventBridge,
          HLS, HTML5, IAM, Java, JavaScript (ES6+), Jest, Lambda, LESS, MongoDB, MSSQL, MySQL,
          Next.js, NewRelic, NGINX, Node.js, PHP, Playwright, PostgreSQL, Python, RDS, React.js,
          React Flow, React-Native, React Query, Recharts, Redis, Redux, Rails, Ruby, S3, Sails.js,
          SCORM 2.0, SCSS/SASS, Serverless, Snowflake, SSM, Step Functions, Stripe, Svelte, SVG,
          Swift, Tailwind, Terraform, Three.js, Transcribe, Translate, TypeScript, VPC, WebGL,
          WebVTT, WordPress
        </p>
        <SectionHeader name="Volunteering" />
        {experience.volunteering.map((entry) => <Experience {...entry} />)}
      </div>
    </div>
  );
}

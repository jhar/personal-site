// Text of public/resume.pdf, for browsers that can't show PDFs (iOS Lockdown Mode).
// Keep it in step with the PDF when the resume changes.

export interface Job {
  title: string;
  org: string;
  place: string;
  dates: string;
  summary: string;
  bullets: string[];
}

export const contact = [
  { text: "jhar-dev@protonmail.com", href: "mailto:jhar-dev@protonmail.com" },
  { text: "GitHub", href: "https://github.com/jhar" },
  { text: "LinkedIn", href: "https://linkedin.com/in/justinadenharrison" },
  { text: "Credly", href: "https://www.credly.com/users/justin-harrison.19866e97/badges" },
];

export const location = "Burbank, CA";

export const skills = [
  "AWS (Lambda, ECS, S3, DynamoDB, EventBridge, Step Functions, SQS, IAM, VPC, RDS, SSM, AppSync), Serverless, Docker",
  "CI/CD (GitHub Actions), IaC (Terraform), workflow orchestration, observability (New Relic, CloudWatch), RCA, data pipelines",
  "TypeScript, Python, SQL, Bash • Node.js, React, Next.js, Flask • Snowflake, PostgreSQL, MongoDB, Redis • Playwright, Jest",
];

export const experience: Job[] = [
  {
    title: "Engineer II",
    org: "Massachusetts DFML via Last Call Media",
    place: "Boston, MA",
    dates: "Mar 2024 – Sep 2025",
    summary:
      "Cloud infrastructure, DevOps, and platform reliability for a state benefits system disbursing ~$750M/year to 150k+ applicants.",
    bullets: [
      "Built and optimized test infrastructure across 8 lower environments with GitHub Actions, SSM, and Docker/ECS",
      "Performed RCA using New Relic, CloudWatch, Python, Postgres, and Cypress Cloud to identify and resolve system issues",
      "Conducted load and stress testing to validate system behavior under peak usage and identify reliability risks",
      "Enhanced test observability by expanding New Relic dashboards with custom NRQL queries and React UI development",
      "Added synthetic monitoring using the New Relic Terraform provider to improve visibility into releases of 16 systems",
      "Maintained and extended a suite of 140+ E2E and integration tests written with Playwright, Cypress, and Jest",
      "Prevented ~1 production‑bound defect per day (team‑wide) through proactive testing, triage, and cross‑team coordination",
      "Operated internal CLI tools for synthetic data generation and population via APIs and browser automation",
      "Served on leadership council, guiding strategy, multi‑team planning, recruiting, delegation, and mentorship",
    ],
  },
  {
    title: "Senior Software Engineer",
    org: "Snail Games USA",
    place: "Culver City, CA",
    dates: "2021 – 2023",
    summary:
      "Cloud-native data engineering, Node/React development, and infra modernization for Twitch analytics and MarTech.",
    bullets: [
      "Engineered a serverless data pipeline on AWS using EventBridge, Lambda (Node), DynamoDB, Twitch, S3, and Snowflake",
      "Refactored Node batch jobs to leverage Snowflake concurrency, reducing runtimes by 90–99%",
      "Maintained infrastructure for Node/Sails platform on DigitalOcean with NGINX load balancing and a MongoDB cluster",
      "Integrated IP geolocation services to detect circumvention of marketing campaign geo‑restrictions",
      "Delivered features with React/Redux product UIs with modern CSS/SASS with a Node/Sails/MongoDB back-end",
      "Led mobile app development with TypeScript and React Native backed by cloud services and Stripe payments",
    ],
  },
  {
    title: "Software Engineer",
    org: "Building Safety Solutions",
    place: "Pasadena, CA",
    dates: "2017 – 2020",
    summary:
      "Safety training and engineering reference systems used by clients including Brookfield, Disney, Burj Khalifa, LA Metro and LAX",
    bullets: [
      "Architected and built a serverless, GraphQL-based LMS/CMS on AWS, reducing infrastructure costs by over 90%",
      "Engineered AI-driven video transcription, translation, and WebVTT generation pipeline using AWS services",
      "Owned development of custom React/Redux based course‑player components and interactive SVG tools for the LMS",
      "Developed React Native and Swift based mobile applications for multiple products backed by AWS services",
      "Maintained legacy Ruby on Rails and RDS/MSSQL systems hosted on AWS Windows Server",
      "Prototyped 3D model viewers using WebGL/A‑Frame for building systems (electrical, water, etc) visualization",
      "Automated the conversion of cloud based courses to Scorm 2.0-compliant packages to meet client security specifications",
    ],
  },
];

export const additional = [
  { title: "Web Engineer", org: "Advercalls Inc", place: "Beverly Hills, CA", dates: "2016" },
  { title: "Software Developer (Contract)", org: "Not That This, LLC", place: "Burbank, CA", dates: "2015" },
  { title: "Web Developer, IT Helpdesk", org: "University of California", place: "Santa Barbara, CA", dates: "2013 – 2015" },
];

export const certifications = [
  { name: "AWS Certified Solutions Architect - Associate", note: "Expires 2027" },
  { name: "AWS Certified Developer - Associate", note: "Expires 2027" },
  { name: "AWS Certified AI Practitioner (Early Adopter)", note: "Expires 2027" },
  { name: "HashiCorp Certified: Terraform Associate", note: "Expires 2027" },
];

export const education = { school: "University of California, Santa Barbara", degree: "BA Art (Creative Coding)" };

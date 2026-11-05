import type { Metadata } from "next";
import { additional, certifications, contact, education, experience, location, skills } from "./resume";

export const metadata: Metadata = {
  title: "Resume",
};

const link = "hover:animate-pulse hover:text-link-hover text-link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="border-b border-rule mb-3 pb-1 text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <span>{left}</span>
      <span className="text-sm">{right}</span>
    </div>
  );
}

// HTML copy of public/resume.pdf. The nav's resume link sends browsers that can't show
// PDFs here (see NavAnchor).
export default function Resume() {
  return (
    <div className="max-w-5xl pb-20 mx-auto w-[86%]">
      <p className="mb-8">
        {location}
        {contact.map((c) => (
          <span key={c.href}>
            {" | "}
            <a className={link} href={c.href}>
              {c.text}
            </a>
          </span>
        ))}
        {" | "}
        <a className={link} href="/resume.pdf" download>
          PDF
        </a>
      </p>

      <Section title="Skills">
        <ul className="space-y-1">
          {skills.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Section>

      <Section title="Experience">
        {experience.map((j) => (
          <div key={j.org} className="mb-6">
            <Row
              left={<strong className="text-ink-strong">{j.title}, {j.org} – {j.place}</strong>}
              right={j.dates}
            />
            <p className="italic mb-1">{j.summary}</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {j.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Additional Experience">
        {additional.map((j) => (
          <Row key={j.org} left={`${j.title}, ${j.org} – ${j.place}`} right={j.dates} />
        ))}
      </Section>

      <Section title="Certifications">
        {certifications.map((c) => <Row key={c.name} left={c.name} right={c.note} />)}
      </Section>

      <Section title="Education">
        <Row left={education.school} right={education.degree} />
      </Section>
    </div>
  );
}

interface Experience {
  bullets?: string[];
  category: string;
  description?: string;
  location?: string;
  organization?: string;
  time?: string;
  title?: string;
}

interface CategoryProps {
  experience: Experience[] | undefined;
}

export default function Category({ experience }: CategoryProps) {
  if (!experience) return null;
  return (
    <>
      <h3 class="dark:text-lightblue text-blue text-lg">
        {experience[0]?.category}
      </h3>
      {experience.map((exp) => <Experience {...exp} />)}
    </>
  );
}

type ExperienceProps = Omit<Experience, "category">;

function Experience({
  bullets,
  description,
  location,
  organization,
  time,
  title,
}: ExperienceProps) {
  return (
    <div class="my-5">
      {title ? <span class="block font-bold">{title}</span> : null}
      {organization ? <span class="block">{organization}</span> : null}
      {location
        ? <span class="block text-lightgrey text-xs">{location}</span>
        : null}
      {time ? <span class="text-lightgrey text-xs">{time}</span> : null}
      {description ? <p>{description}</p> : null}
      {bullets
        ? (
          <ul class="list-disc ml-4">
            {bullets.map((bullet) => <li>{bullet}</li>)}
          </ul>
        )
        : null}
    </div>
  );
}

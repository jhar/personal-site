interface ExperienceProps {
  bullets?: string[];
  description?: string;
  location?: string;
  organization?: string;
  time?: string;
  title?: string;
}

export default function Experience({
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

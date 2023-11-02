interface ExperienceProps {
    description?: string;
    location?: string;
    organization: string;
    time: string;
    title?: string;
}

export default function Experience({
    description,
    location,
    organization,
    time,
    title
}: ExperienceProps) {
    return (
        <div class="my-5">
            {title ? <span class="block font-bold">{title}</span> : null}
            {organization ? <span class="block">{organization}</span> : null}
            {location ? <span class="block text-lightgrey text-xs">{location}</span> : null}
            <span class="text-lightgrey text-xs">{time}</span>
            {description ? <p>{description}</p> : null} 
        </div>
    )
}
interface SectionHeaderProps {
  name: string;
}

export default function SectionHeader({ name }: SectionHeaderProps) {
  return (
    <h3 class="dark:text-lightblue text-blue text-lg">
      {name}
    </h3>
  );
}
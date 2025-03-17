export default function About() {
  return (
    <div class="dark:text-offwhite max-w-5xl pb-20 mx-auto w-[86%]">
      <p class="mb-8">
        I'm a software engineer experienced with cloud infrastructure, dev ops,
        full stack development for web and mobile, E2E and integration testing,
        data engineering, and creative coding.
      </p>
      <p class="mb-8">
        My academic background is in cognitive science and conceptual art. In a
        past life, I wanted to be a neuroscientist who helped study the{" "}
        <a
          class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
          href="https://www.researchgate.net/publication/233556531_The_Science_of_Art_A_Neurological_Theory_of_Aesthetic_Experience"
          target="_blank"
        >
          neurological foundatations of visual art
        </a>.
      </p>
      <p class="mb-8">
        I'm currently prepping for Terraform Associate and AWS Data Engineer,
        Associate certifications.
      </p>
      <p class="mb-8">
        Outside of work, I like to play games (Switch, 3DS, PS5, PC), watch
        movies (AMC A-List), and lift weights.
      </p>
      <h3 class="mb-2 text-lg">Places I've lived</h3>
      <ul class="mb-8 ml-8 list-disc">
        <li>Social Circle, Georgia</li>
        <li>Madison, Georgia</li>
        <li>Athens, Georgia</li>
        <li>Salt Lake City, Utah</li>
        <li>Los Angeles, California</li>
        <li>San Francisco, California</li>
        <li>Oakland, California</li>
        <li>Berkeley, California</li>
        <li>Santa Barbara, California</li>
        <li>Seattle, Washington</li>
        <li>Everett, Washington</li>
        <li>Pasadena, California</li>
        <li>Ciudad de México</li>
        <li>Burbank, California</li>
      </ul>
      <h3 class="mb-2 text-lg">Gym bests*</h3>
      <table class="border-separate [border-spacing:1rem] mb-2 table-auto">
        <thead>
          <tr>
            <th class="text-left">Lift</th>
            <th>1RM (lbs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bench Press</td>
            <td>335</td>
          </tr>
          <tr>
            <td>Strict Press</td>
            <td>201</td>
          </tr>
          <tr>
            <td class="pr-4">Overhead Pin Press from Nose</td>
            <td>215</td>
          </tr>
          <tr>
            <td>Power Clean</td>
            <td>225</td>
          </tr>
          <tr>
            <td>Front Squat</td>
            <td>305</td>
          </tr>
          <tr>
            <td>Back Squat</td>
            <td>375</td>
          </tr>
          <tr>
            <td>Deadlift</td>
            <td>460</td>
          </tr>
        </tbody>
      </table>
      <span class="text-xs">
        * I'm working with a lower extremity disability that skews upper/lower
        ratio from what you might expect.
      </span>
    </div>
  );
}

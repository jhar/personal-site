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
          neurological foundations of visual art
        </a>.
      </p>
      <p class="mb-8">
        I'm currently prepping for the AWS Data Engineer,
        Associate certification.
      </p>
      <p class="mb-8">
        Outside of work, I like to play games (Switch, 3DS, PS5, PC), watch
        movies (AMC A-List), and lift weights.
      </p>
      <h3 class="mb-2 text-lg">Gym bests*</h3>
      <table class="border-separate [border-spacing:1rem] mb-2 table-auto">
        <thead>
          <tr>
            <th class="text-left">Lift</th>
            <th>PR (lbs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bench Press</td>
            <td>335x1</td>
          </tr>
          <tr>
            <td>Strict Press</td>
            <td>205x3</td>
          </tr>
          <tr>
            <td class="pr-4">Overhead Pin Press from Nose</td>
            <td>227.5x1</td>
          </tr>
          <tr>
            <td>Power Clean</td>
            <td>225x1</td>
          </tr>
	  <tr>
	    <td>Overhead Squat</td>
	    <td>195x1</td>
	  </tr>
          <tr>
            <td>Front Squat</td>
            <td>315x1</td>
          </tr>
          <tr>
            <td>High-bar Box Squat - 14 inch</td>
            <td>385x1</td>
          </tr>
          <tr>
            <td>Deadlift</td>
            <td>475x1</td>
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

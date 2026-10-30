import RecentMovies from "./RecentMovies";

export default function About() {
  return (
    <div className="max-w-5xl pb-20 mx-auto w-[86%]">
      <p className="mb-8">
        I&apos;m a software engineer experienced with cloud infrastructure, dev ops,
        full stack development for web and mobile, E2E and integration testing,
        data engineering, and creative coding.
      </p>
      <p className="mb-8">
        My academic background is in cognitive science and conceptual art. In a
        past life, I wanted to be a neuroscientist who helped study the{" "}
        <a
          className="hover:animate-pulse hover:text-link-hover text-link"
          href="https://www.researchgate.net/publication/233556531_The_Science_of_Art_A_Neurological_Theory_of_Aesthetic_Experience"
          target="_blank"
        >
          neurological foundations of visual art
        </a>.
      </p>
      <p className="mb-2">
        Outside of work, I rotate through a handful of hobbies and interests,
        including:
      </p>
      <ul className="list-disc list-inside mb-8">
        <li>Games (Switch 2, 3DS, PS5, PC)</li>
        <li>Movies (AMC A-List, Kanopy, Paramount+, THE LIBRARY)</li>
        <li>Monastic rabbit holes (lately Merton, Chödrön, Krishnamurti, Chopra, Becker, and Kierkegaard)</li>
        <li>
          Physical practice (lately just hybrid strength training methodology with walking and light yoga and boxing)
        </li>
        <li>
          Watching Crunchyroll (Kaiju No. 8 and Frieren) although not as fast as I&apos;d like.
        </li>
        <li>
          UFC and boxing. Old episodes of TUF tickle me pink.
        </li>
        <li>
          Udemy courses.
        </li>
      </ul>

      <h3 className="mb-2 text-lg">Gym bests*</h3>
      <table className="border-separate [border-spacing:1rem] mb-2 table-auto">
        <thead>
          <tr>
            <th className="text-left">Lift</th>
            <th>PR (lbs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bench Press</td>
            <td>340x1</td>
          </tr>
          <tr>
            <td>Strict Press</td>
            <td>205x3</td>
          </tr>
          <tr>
            <td className="pr-4">Overhead Pin Press from Nose</td>
            <td>227.5x1</td>
          </tr>
          <tr>
            <td>Clean</td>
            <td>235x1</td>
          </tr>
          <tr>
            <td>Power Clean</td>
            <td>225x1</td>
          </tr>
          <tr>
            <td>Overhead Squat</td>
            <td>200x1</td>
          </tr>
          <tr>
            <td>Front Squat</td>
            <td>350x1</td>
          </tr>
          <tr>
            <td>Back Squat</td>
            <td>405x1</td>
          </tr>
          <tr>
            <td>Deadlift</td>
            <td>485x1</td>
          </tr>
        </tbody>
      </table>
      <span className="text-xs">
        * I&apos;m working with a lower extremity disability that skews upper/lower
        ratio from what you might expect.
      </span>

      <RecentMovies />
    </div>
  );
}

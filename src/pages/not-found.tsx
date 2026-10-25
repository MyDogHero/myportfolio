export default function NotFound() {
  // The site lives at the root of its web address (e.g. kaustubhiyer.netlify.app/).
  const home = '/';

  return (
    <main className="not-found">
      <div className="not-found-inner">
        <h1>This page doesn&rsquo;t exist.</h1>
        <p>The link may be mistyped or out of date.</p>
        <a href={home}>Go to the portfolio</a>
      </div>
    </main>
  );
}

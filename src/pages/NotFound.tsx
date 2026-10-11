import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function NotFound() {
  return (
    <Layout title="Page not found, Isaac Koh">
      <section className="lost wrap">
        <div className="lost-copy">
          <p className="row-kicker lost-code">404</p>
          <h1 className="page-title reveal">This page isn't here</h1>
          <p className="page-lede reveal">The link may be old, or the page has moved. Isaac is looking for it too.</p>
          <div className="about-ctas reveal">
            <Link to="/" className="btn btn-solid" data-magnetic>Back home</Link>
            <Link to="/contact" className="btn btn-line" data-magnetic>Get in touch</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

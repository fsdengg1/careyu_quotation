import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/quotationApi";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@careyu.ai");
  const [password, setPassword] = useState("CareYu@2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div>
          <div className="login-brand">
            <img src="/assets/careyu-logo.png" alt="" />
            <div>
              <strong>Care Yu</strong>
              <span>Automation Pvt Ltd</span>
            </div>
          </div>
          <h1>Quotations that match the Care Yu letterhead.</h1>
          <p className="lede">
            Prepare a five-page A4 quotation, preview it as you type, and issue the PDF from one workspace.
          </p>
          <ul className="login-points">
            <li><i>✓</i> Cover, company profile and commercial pages</li>
            <li><i>✓</i> Customer details filled from the master list</li>
            <li><i>✓</i> Live A4 preview before you generate the PDF</li>
          </ul>
        </div>
        <footer>Care Yu Automation · Quotation studio</footer>
      </aside>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="sub">Use your Care Yu account to open the studio.</p>
          {error ? <div className="alert">{error}</div> : null}
          <div className="login-fields">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}

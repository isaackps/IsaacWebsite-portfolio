import { useState } from "react";
import { ArrowUpRight, Copy, Check } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import { PERSON } from "../data";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [opened, setOpened] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(PERSON.email); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim(), email = String(f.get("email") || "").trim(), message = String(f.get("message") || "").trim();
    const errs: Errors = {};
    if (!name) errs.name = "Please add your name.";
    if (!email) errs.email = "Please add your email so Isaac can reply.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "That email address doesn't look complete.";
    if (message.length < 10) errs.message = "Please write a little more (10 characters or more).";
    setErrors(errs);
    if (Object.keys(errs).length) {
      (e.currentTarget.querySelector(`[name="${Object.keys(errs)[0]}"]`) as HTMLElement | null)?.focus();
      return;
    }
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${PERSON.email}?subject=${encodeURIComponent("Hello from " + name)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  const field = (id: "name" | "email" | "message", label: string, el: React.ReactNode, help?: string) => (
    <div className={`field ${errors[id] ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {el}
      {help && <p className="help" id={`${id}-help`}>{help}</p>}
      {errors[id] && <p className="error" id={`${id}-err`}>{errors[id]}</p>}
    </div>
  );
  const desc = (id: string, help?: boolean) => [help ? `${id}-help` : "", errors[id as keyof Errors] ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <Layout title="Contact, Isaac Koh">
      <section className="contact wrap">
        <div className="contact-intro">
          <h1 className="close-title reveal">Let's talk</h1>
          <p className="page-lede reveal">Open to conversations about verifiable credentials, digital trade, open-source frameworks and engineering leadership. Email is the quickest way to reach me.</p>
          <ul className="channels reveal">
            <li>
              <span className="ch-label">Email</span>
              <a href={`mailto:${PERSON.email}`} className="ch-value">{PERSON.email}</a>
              <button type="button" className="icon-btn" onClick={copy} aria-label={copied ? "Email address copied" : "Copy email address"}>
                {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </button>
            </li>
            <li>
              <span className="ch-label">LinkedIn</span>
              <a href={PERSON.linkedin} target="_blank" rel="noopener noreferrer" className="ch-value">{PERSON.linkedinLabel} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </li>
            <li>
              <span className="ch-label">GitHub</span>
              <a href={PERSON.github} target="_blank" rel="noopener noreferrer" className="ch-value">{PERSON.githubLabel} <ArrowUpRight size={16} aria-hidden="true" /></a>
            </li>
          </ul>
          <span className="sr-only" role="status" aria-live="polite">{copied ? "Email address copied" : ""}</span>
        </div>

        <form className="note-form reveal" noValidate onSubmit={submit} aria-labelledby="form-h">
          <h2 id="form-h" className="form-title">Write a note</h2>
          <p className="help form-help">This opens your own email app with the note filled in. Nothing is sent from this page.</p>
          {field("name", "Your name", <input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={desc("name")} />)}
          {field("email", "Your email", <input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={desc("email")} />)}
          {field("message", "Message", <textarea id="message" name="message" rows={5} aria-invalid={!!errors.message} aria-describedby={desc("message", true)} />, "A few lines about what you'd like to talk about.")}
          <button type="submit" className="btn btn-solid" data-magnetic>Open in my email app <ArrowUpRight size={18} weight="bold" aria-hidden="true" /></button>
          {opened && <p className="success" role="status">Your email app should have opened with the note. If it didn't, email {PERSON.email} directly.</p>}
        </form>
      </section>
    </Layout>
  );
}

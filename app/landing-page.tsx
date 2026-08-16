"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { AsYouType, CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { CheckCircle2, Heart, MessageSquare, Mic, Network, Shield, UsersRound, XCircle } from "lucide-react";
import Image from "next/image";
import { FormEvent, Fragment, useEffect, useRef, useState } from "react";

const challenges = [
  "I struggle with the open (Approach Anxiety)",
  "I do not know what to say",
  "My conversations are too platonic",
  "I lack confidence",
  "Other",
];
const importanceLevels = ["Very important", "Important", "Not important"];
const budgets = [
  "I am ready and able to invest $5,000+ USD for maximum 1-on-1 support.",
  "I can comfortably invest $3,000 USD to get fully transformed.",
  "It's a stretch, but I can invest $1,000 – $2,500 USD right now.",
  "My budget is around $500 USD to get started.",
  "I DON'T have the finances to invest in myself.",
];
type ApplicationData = { firstName: string; lastName: string; email: string; phone: string; instagram: string; challenge: string; importance: string; budget: string };
const initialForm: ApplicationData = { firstName: "", lastName: "", email: "", phone: "", instagram: "", challenge: "", importance: "", budget: "" };
const testimonials = ["1.mp4", "2.mp4", "3.mp4", "diego.mp4", "5.mp4", "6.mp4"];
const outcomes = [
  { Icon: Shield, title: "Walk Away Unshakeable", description: "Develop self-belief so deep that rejection, judgment, and criticism stop controlling your choices." },
  { Icon: MessageSquare, title: "Speak With Confidence", description: "Express yourself clearly without second-guessing every word. Flow effortlessly in any conversation." },
  { Icon: Heart, title: "Attract authentically", description: "Approach with confidence, be yourself, create genuine attraction, and become the man women are drawn to." },
  { Icon: UsersRound, title: "Become Magnetically Social", description: "Read the room, command respect, and become someone people genuinely want to be around." },
  { Icon: Network, title: "Build High-Value Relationships", description: "Open doors in career and life through authentic connections with people who matter." },
  { Icon: Mic, title: "Own Any Room", description: "Command an audience, articulate your ideas powerfully, and be remembered long after you leave." },
];
const fitItems = [
  "You see a woman you’re attracted to but can’t bring yourself to approach",
  "You overthink what to say instead of simply starting the conversation",
  "You struggle to have natural, engaging conversations with women",
  "You want to meet and date more women but don’t know how to create genuine attraction",
  "You don’t know how to create attraction or move things forward",
  "You know you’re capable of being better with women, but you don’t know how to get there",
];
const notFitItems = [
  "You want instant results without putting in the work",
  "You're not willing to practice outside of sessions",
  "You expect confidence to arrive without discomfort",
  "You're looking for scripts and tricks instead of real change",
  "You're not ready to invest seriously in yourself",
];
const howItWorks = [
  { title: "Tell Me About Yourself", description: "Fill out a short application so I can understand where you're starting from and what's holding you back." },
  { title: "Let's Meet", description: "We'll get on a strategy call to see if we're the right fit and map out exactly what your transformation looks like." },
  { title: "Your Personalized Game Plan", description: "Weekly 1:1 sessions, custom exercises, and real-world challenges built strictly around your bottlenecks." },
  { title: "Build Confidence That Lasts", description: "Not just tactics—an identity shift. You'll step into social situations with the ease you've always wanted." },
];
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = getCountries().map(code => ({ code, name: regionNames.of(code) || code, callingCode: getCountryCallingCode(code) })).sort((a, b) => a.name.localeCompare(b.name));
const isValidEmail = (value: string) => {
  const email = value.trim();
  const [local, domain, ...extra] = email.split("@");
  return email.length <= 254 && !extra.length && Boolean(local && domain) && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") && /^[^\s@]+\.[^\s@]{2,}$/.test(domain);
};

function Arrow() { return <span aria-hidden="true" className="arrow">↗</span>; }

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 28, mass: .25 });

  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

function Application({ open, close }: { open: boolean; close: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("FR");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("locked");
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("locked"); window.removeEventListener("keydown", onKey); };
  }, [open, close]);

  const parsedPhone = parsePhoneNumberFromString(data.phone, phoneCountry);
  const phoneValid = Boolean(parsedPhone?.isValid());
  const emailValid = isValidEmail(data.email);
  const contactValid = data.firstName.trim().length > 1 && data.lastName.trim().length > 1 && emailValid && phoneValid;
  const valid = [true, Boolean(data.challenge), Boolean(data.importance), contactValid, Boolean(data.budget)][step];
  const cannotInvest = data.budget === budgets[4];

  function choose(field: "challenge" | "importance", value: string, nextStep: number) {
    setData(current => ({ ...current, [field]: value }));
    window.setTimeout(() => setStep(nextStep), reduce ? 0 : 180);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 4) return setStep(step + 1);
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, phone: parsedPhone?.number || data.phone }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to send your application.");
      setComplete(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send your application."); }
    finally { setSubmitting(false); }
  }

  function resetAndClose() { close(); setTimeout(() => { setStep(0); setData(initialForm); setComplete(false); setDeclined(false); setPhoneCountry("FR"); setError(""); }, 250); }

  return <AnimatePresence initial={false}>
    {open && <motion.div className="modal" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-card" role="dialog" aria-modal="true" aria-label="Coaching application"
        initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .26 }}>
        <header className="modal-top"><button className="wordmark wordmark-button" type="button" onClick={resetAndClose}>DON <i>RAMITH</i></button><button className="close" onClick={resetAndClose} aria-label="Close application">×</button></header>
        {declined ? <div className="complete no-finances"><div className="complete-mark">✓</div><h2>Thank you for coming by!</h2><p>I’m really glad you visited. Make full use of my free content, keep leveling up, and I’ll be here whenever the time is right for you.</p><div className="complete-actions"><a className="primary" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Follow on Instagram <Arrow /></a><a className="secondary" href="https://youtube.com/@donramith?sub_confirmation=1" target="_blank" rel="noreferrer">Subscribe on YouTube <Arrow /></a><button type="button" onClick={resetAndClose}>Back to the website</button></div></div> : !complete ? <form className="form" onSubmit={submit}>
          <div className="progress"><span>{String(step + 1).padStart(2, "0")} / 05</span><div><i style={{ width: `${(step + 1) * 20}%` }} /></div><span>~2 MIN</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div className="question" key={step} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
              {step === 0 && <><p className="eyebrow">BEFORE WE BEGIN</p><h2>Are you willing to answer an additional 4 questions to find the best solution for your dating struggles?</h2><div className="choices consent-choices"><button type="button" onClick={() => setStep(1)}><span>Yes</span><b>↗</b></button><button type="button" onClick={() => setDeclined(true)}><span>No</span><b>×</b></button></div></>}
              {step === 1 && <><p className="eyebrow">YOUR STARTING POINT</p><h2>What&apos;s the #1 thing holding you back with women right now?</h2><div className="choices">{challenges.map(value => <button type="button" className={data.challenge === value ? "selected" : ""} onClick={() => choose("challenge", value, 2)} key={value}><span>{value}</span><b>{data.challenge === value ? "✓" : "↗"}</b></button>)}</div></>}
              {step === 2 && <><p className="eyebrow">YOUR PRIORITY</p><h2>How important is it for you to change this now?</h2><div className="choices">{importanceLevels.map(value => <button type="button" className={data.importance === value ? "selected" : ""} onClick={() => choose("importance", value, 3)} key={value}><span>{value}</span><b>{data.importance === value ? "✓" : "↗"}</b></button>)}</div></>}
              {step === 3 && <><p className="eyebrow">STAY IN TOUCH</p><h2>Where can we reach you?</h2><p className="question-intro"><em>(Note: This data is not shared with 3rd parties)</em></p><div className="contact-grid"><label>First Name<input autoComplete="given-name" value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} placeholder="First Name" /></label><label>Last Name<input autoComplete="family-name" value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} placeholder="Last Name" /></label><label className="email-field-label">Email Address<input className={data.email ? emailValid ? "valid" : "invalid" : ""} type="email" autoComplete="email" aria-invalid={data.email ? !emailValid : undefined} value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="Email Address" />{data.email && <small className={`validation-status ${emailValid ? "valid" : "invalid"}`}>{emailValid ? "Valid email address" : "Enter a valid email address"}</small>}</label><label className="phone-field-label">Phone Number / WhatsApp<div className={`phone-input-shell${data.phone ? phoneValid ? " valid" : " invalid" : ""}`}><select aria-label="Country calling code" value={phoneCountry} onChange={e => { setPhoneCountry(e.target.value as CountryCode); setData({ ...data, phone: "" }); }}>{countries.map(country => <option value={country.code} key={country.code}>{country.name} +{country.callingCode}</option>)}</select><input type="tel" inputMode="tel" autoComplete="tel-national" aria-invalid={data.phone ? !phoneValid : undefined} value={data.phone} onChange={e => setData({ ...data, phone: new AsYouType(phoneCountry).input(e.target.value) })} placeholder="Phone Number / WhatsApp" /></div>{data.phone && <small className={`validation-status ${phoneValid ? "valid" : "invalid"}`}>{phoneValid ? "Valid phone number" : "Enter a valid phone number"}</small>}</label><label className="wide">Instagram Handle (@)<input autoComplete="off" value={data.instagram} onChange={e => setData({ ...data, instagram: e.target.value })} placeholder="Instagram Handle (@)" /></label></div></>}
              {step === 4 && <><p className="eyebrow">YOUR INVESTMENT</p><h2>How willing are you to invest in yourself to improve this part of your life?</h2><p className="question-intro"><em>(This helps us match you with the right level of support. There&apos;s no wrong answer.)</em></p><div className="choices budget-choices">{budgets.map(value => <button type="button" className={data.budget === value ? "selected" : ""} onClick={() => setData({ ...data, budget: value })} key={value}><span>{value}</span><b>{data.budget === value ? "✓" : "↗"}</b></button>)}</div></>}
            </motion.div>
          </AnimatePresence>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">{step > 0 && <button type="button" className="back" onClick={() => setStep(step - 1)}>← Back</button>}{step > 0 && <button className="next" disabled={!valid || submitting}>{submitting ? "Sending…" : step === 4 ? cannotInvest ? "Continue" : "See available times" : "Continue"}<Arrow /></button>}</div>
        </form> : cannotInvest ? <div className="complete no-finances"><div className="complete-mark">✓</div><h2>Thank you for coming by!</h2><p>I’m really glad you visited. Make full use of my free content, keep leveling up, and I’ll be here whenever the time is right for you.</p><div className="complete-actions"><a className="primary" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Follow on Instagram <Arrow /></a><a className="secondary" href="https://youtube.com/@donramith?sub_confirmation=1" target="_blank" rel="noreferrer">Subscribe on YouTube <Arrow /></a><button type="button" onClick={resetAndClose}>Back to the website</button></div></div> : <div className="booking"><div className="booking-copy"><div className="complete-mark">✓</div><p className="eyebrow">YOU’RE ALL SET</p><h2>Book Your 1-on-1 Strategy Session</h2></div><iframe src={process.env.NEXT_PUBLIC_CALENDAR_URL || "https://cal.com/"} title="Book your strategy session" loading="lazy" /><a className="calendar-fallback" href={process.env.NEXT_PUBLIC_CALENDAR_URL || "https://cal.com/"} target="_blank" rel="noreferrer">Open calendar in a new tab <Arrow /></a></div>}
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}

export function LandingPage() {
  const [apply, setApply] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const testimonialTrack = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const reveal = reduce ? {} : { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: .55 } };
  function slideTestimonials(direction: -1 | 1) {
    testimonialTrack.current?.scrollBy({ left: direction * Math.min(testimonialTrack.current.clientWidth * .82, 430), behavior: reduce ? "auto" : "smooth" });
  }
  function pauseOtherTestimonials(current: HTMLVideoElement) {
    testimonialTrack.current?.querySelectorAll("video").forEach(video => { if (video !== current) video.pause(); });
  }
  return <main>
    <ScrollProgress />
    <nav><a className="wordmark" href="#top">DON <i>RAMITH</i></a><div className="nav-links"><a href="#method">The method</a><a href="#testimonials">Testimonials</a><a href="#faq">FAQ</a><button onClick={() => setApply(true)}>Apply now <Arrow /></button></div></nav>
    <section className="hero" id="top">
      <motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
        <h1>The social skills<br/>they never<br/><em>taught you!</em></h1>
        <p className="lede">Work with me 1 on 1 to become naturally confident, approach authentically, start conversations effortlessly, and build meaningful relationships.</p>
        <div className="hero-actions"><button className="primary" onClick={() => setApply(true)}>Apply for 1-on-1 coaching <Arrow /></button></div>
      </motion.div>
    </section>

    <section className="marquee" aria-label="Don Ramith principles">
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map(group => <div className="marquee-group" key={group}>
          {[0, 1, 2, 3, 4, 5].map(copy => <div className="marquee-content" key={copy}><span>CONFIDENCE</span><i>•</i><span>AUTHENTICITY</span><i>•</i><span>CONNECTION</span><i>•</i><span>ACTION</span><i>•</i></div>)}
        </div>)}
      </div>
    </section>

    <motion.section className="my-story" id="story" {...reveal}>
      <div className="my-story-image"><Image src="/hero-don-beach-walk.webp" alt="Don walking and talking on the beach" fill sizes="(max-width: 800px) 100vw, 54vw" /></div>
      <div className="my-story-copy">
        <p className="section-index">MY STORY</p>
        <h2>Hi, I’m <em>Ramith.</em></h2>
        <p>A few years ago, I struggled with confidence. I wasn’t good with women. I wanted to approach women I found attractive, but I would overthink everything, hesitate, and walk away without saying anything at all.</p>
        <p>Instead of giving up, I started pushing myself to have conversations with strangers and beautiful women every single day. Along the way, I learned a lot about women, social dynamics, psychology, and what it actually takes to connect with someone authentically.</p>
        <p>Over time, I became better with women and people alike. I became more confident, more secure in who I am, and better at expressing myself.</p>
        <p>Now, I want to share what I’ve learned and help you become a better version of yourself too.</p>
        <button className="primary" onClick={() => setApply(true)}>Start your confidence journey <Arrow /></button>
      </div>
    </motion.section>

    <section className="outcomes" aria-labelledby="outcomes-title">
      <motion.div className="outcomes-head" {...reveal}>
        <h2 id="outcomes-title">What You&apos;ll Walk Away With</h2>
        <p>Six areas, one transformation. Each skill reinforces the next.</p>
      </motion.div>
      <div className="outcomes-grid">{outcomes.map(({ Icon, title, description }, index) =>
        <motion.article key={title} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .48, delay: index % 3 * .08 }}>
          <span className="outcome-icon" aria-hidden="true"><Icon /></span>
          <h3>{title}</h3>
          <p>{description}</p>
        </motion.article>
      )}</div>
    </section>

    <section className="fit-section" aria-label="Who coaching is and is not for">
      <div className="fit-comparison">
        <div className="fit-panel fit-panel-positive">
          <header className="fit-head fit-head-positive"><h2>This is for you if…</h2><p>You’ll see yourself in at least one of these.</p></header>
          {fitItems.map((item, index) => <motion.div className="fit-cell fit-cell-positive" key={item} initial={reduce ? false : { opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .7 }} transition={{ duration: .34, delay: index * .045 }}><CheckCircle2 aria-hidden="true"/><span>{item}</span></motion.div>)}
        </div>
        <div className="fit-panel fit-panel-negative">
          <header className="fit-head fit-head-negative"><h2>This is not for you if…</h2><p>Don is selective about who he works with.</p></header>
          {notFitItems.map((item, index) => <motion.div className="fit-cell fit-cell-negative" key={item} initial={reduce ? false : { opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .7 }} transition={{ duration: .34, delay: index * .045 }}><XCircle aria-hidden="true"/><span>{item}</span></motion.div>)}
        </div>
      </div>
    </section>

    <section className="how-section" id="method">
      <motion.div className="how-head" {...reveal}><h2>How It Works</h2><p>A simple, personal path from where you are to where you want to be.</p></motion.div>
      <div className="how-timeline">{howItWorks.map(({ title, description }, index) => <motion.article className={`how-step ${index % 2 ? "how-step-right" : "how-step-left"}`} key={title} initial={reduce ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .48 }}>
        <div className="how-card"><h3>{title}</h3><p>{description}</p></div><span className="how-number" aria-hidden="true">{index + 1}</span>
      </motion.article>)}</div>
    </section>

    <section className="content testimonials" id="testimonials"><motion.div className="content-head" {...reveal}><p className="section-index">TESTIMONIALS</p><h2>Hear it from<br/><em>the men coached.</em></h2></motion.div>
      <div className="testimonial-toolbar"><p>Swipe or use the arrows to explore every story.</p><div className="testimonial-controls"><button type="button" onClick={() => slideTestimonials(-1)} aria-label="Previous testimonial">←</button><button type="button" onClick={() => slideTestimonials(1)} aria-label="Next testimonial">→</button></div></div>
      <div className="testimonial-track" ref={testimonialTrack}>{testimonials.map((file, index) => <article className="testimonial-video" key={file}>
        {/* Captions can be added once transcripts are available. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video controls playsInline preload="metadata" onPlay={event => pauseOtherTestimonials(event.currentTarget)}><source src={`/testimonials/${file}`} type="video/mp4" />Your browser does not support HTML video.</video>
        <div><span>CLIENT STORY</span><b>{String(index + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</b></div>
      </article>)}</div>
    </section>

    <section className="faq" id="faq"><motion.div className="faq-head" {...reveal}><p className="section-index">FAQ</p><h2>Frequently asked<br/><em>questions.</em></h2></motion.div><div className="faq-list">{[
      ["Who is coaching for?","Coaching is for men who want to become more confident approaching women, start authentic conversations, improve their dating life, and become more socially confident overall."],
      ["How long is the coaching program?","Programs typically run 1 to 3 months, depending on your starting point and goals. Meaningful identity change takes time. We are not looking for a temporary boost in confidence. The goal is to build something that lasts and becomes part of who you are."],
      ["Is this dating coaching?","Yes. You’ll learn how to approach women you’re attracted to without hesitation, start an authentic, genuine conversation, and confidently lead the interaction from there.\n\nThe skills you develop through dating coaching naturally extend beyond dating. As you become more comfortable approaching, communicating, expressing yourself, and handling social situations, you’ll naturally become more confident in your interactions with people in general — making friends, meeting new people, public speaking and simply feeling more comfortable in your own skin."],
    ].map(([question,answer],i)=><motion.div className={`faq-item${openFaq === i ? " open" : ""}`} key={question} {...reveal} transition={{ duration:.4, delay:i*.05 }}><button className="faq-question" type="button" aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{question}</span><b aria-hidden="true">+</b></button><div className="faq-answer-shell"><button id={`faq-answer-${i}`} className="faq-answer" type="button" tabIndex={openFaq === i ? 0 : -1} onClick={() => setOpenFaq(null)}><span>{answer.split("\n\n").map((paragraph, index) => <Fragment key={paragraph}>{index > 0 && <><br/><br/></>}{paragraph}</Fragment>)}</span></button></div></motion.div>)}</div></section>

    <section className="final-cta"><motion.div {...reveal}><h2>A few months<br/><em>from now...</em></h2><p className="final-cta-copy">You’ll either wish you had started today, or be grateful you did.</p><p className="final-cta-note">Limited spots available each month.</p><button className="primary" onClick={() => setApply(true)}>Apply for 1-on-1 coaching <Arrow /></button></motion.div></section>
    <footer><a className="wordmark" href="#top">DON <i>RAMITH</i></a><p>CONFIDENCE · AUTHENTICITY · CONNECTION</p><div><a href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Instagram</a><a href="https://youtube.com/@donramith?sub_confirmation=1" target="_blank" rel="noreferrer">YouTube</a><span>© 2026</span></div></footer>
    <Application open={apply} close={() => setApply(false)} />
  </main>;
}

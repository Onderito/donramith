"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { AsYouType, CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { FormEvent, useEffect, useRef, useState } from "react";

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
const minimumBudget = Number(process.env.NEXT_PUBLIC_MIN_BUDGET_USD || 100);

type ApplicationData = { firstName: string; lastName: string; email: string; phone: string; instagram: string; challenge: string; importance: string; budget: string };
const initialForm: ApplicationData = { firstName: "", lastName: "", email: "", phone: "", instagram: "", challenge: "", importance: "", budget: "" };
const testimonials = ["1.mp4", "2.mp4", "3.mp4", "diego.mp4", "5.mp4", "6.mp4"];
const heroSlides = [
  { src: "/hero-don-leading-session.webp", alt: "Don leading a conversation during a group coaching session" },
  { src: "/hero-don-beach.webp", alt: "Don sharing a joyful moment with friends by the ocean" },
  { src: "/hero-don-conversation.webp", alt: "Don having a conversation with a group during a coaching session" },
  { src: "/hero-don-beach-walk.webp", alt: "Don walking and talking with a woman on the beach" },
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
        {declined ? <div className="complete no-finances"><div className="complete-mark">✓</div><h2>Thank you for coming by!</h2><p>I’m really glad you visited. Make full use of my free content, keep leveling up, and I’ll be here whenever the time is right for you.</p><div className="complete-actions"><a className="primary" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Watch free content <Arrow /></a><button type="button" onClick={resetAndClose}>Back to the website</button></div></div> : !complete ? <form className="form" onSubmit={submit}>
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
        </form> : cannotInvest ? <div className="complete no-finances"><div className="complete-mark">✓</div><h2>Thank you for coming by!</h2><p>I’m really glad you visited. Make full use of my free content, keep leveling up, and I’ll be here whenever the time is right for you.</p><div className="complete-actions"><a className="primary" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Watch free content <Arrow /></a><button type="button" onClick={resetAndClose}>Back to the website</button></div></div> : <div className="booking"><div className="booking-copy"><div className="complete-mark">✓</div><p className="eyebrow">YOU’RE ALL SET</p><h2>Book Your 1-on-1 Strategy Session</h2></div><iframe src={process.env.NEXT_PUBLIC_CALENDAR_URL || "https://cal.com/"} title="Book your strategy session" loading="lazy" /><a className="calendar-fallback" href={process.env.NEXT_PUBLIC_CALENDAR_URL || "https://cal.com/"} target="_blank" rel="noreferrer">Open calendar in a new tab <Arrow /></a></div>}
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}

export function LandingPage() {
  const [apply, setApply] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const testimonialTrack = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const reveal = reduce ? {} : { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: .55 } };
  function slideTestimonials(direction: -1 | 1) {
    testimonialTrack.current?.scrollBy({ left: direction * Math.min(testimonialTrack.current.clientWidth * .82, 430), behavior: reduce ? "auto" : "smooth" });
  }
  function pauseOtherTestimonials(current: HTMLVideoElement) {
    testimonialTrack.current?.querySelectorAll("video").forEach(video => { if (video !== current) video.pause(); });
  }
  function moveHero(direction: number) {
    setHeroSlide(current => (current + direction + heroSlides.length) % heroSlides.length);
  }
  return <main>
    <ScrollProgress />
    <nav><a className="wordmark" href="#top">DON <i>RAMITH</i></a><div className="nav-links"><a href="#method">The method</a><a href="#testimonials">Testimonials</a><a href="#faq">FAQ</a><button onClick={() => setApply(true)}>Apply now <Arrow /></button></div></nav>
    <section className="hero" id="top">
      <motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
        <h1>Become the man<br/>who starts the<br/><em>conversation.</em></h1>
        <p className="lede">Build real confidence, approach authentically, and create genuine connections without scripts, tricks, or pretending to be someone else.</p>
        <div className="hero-actions"><button className="primary" onClick={() => setApply(true)}>Apply for 1-on-1 coaching <Arrow /></button><a className="secondary" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Watch on Instagram <Arrow /></a></div>
        <p className="social-proof"><b>10K+</b> people following Don’s journey</p>
      </motion.div>
      <motion.div className="hero-carousel" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .15 }} aria-roledescription="carousel" aria-label="Don Ramith gallery">
        <div className="hero-carousel-viewport">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img key={heroSlides[heroSlide].src} src={heroSlides[heroSlide].src} alt={heroSlides[heroSlide].alt} width="6000" height="4000" draggable={false}
              initial={reduce ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: .38, ease: [0.2, 0, 0, 1] }}
              drag={heroSlides.length > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
              onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 55) moveHero(info.offset.x < 0 ? 1 : -1); }} />
          </AnimatePresence>
        </div>
        {heroSlides.length > 1 && <><div className="hero-carousel-controls"><button type="button" onClick={() => moveHero(-1)} aria-label="Previous image">←</button><button type="button" onClick={() => moveHero(1)} aria-label="Next image">→</button></div><div className="hero-carousel-dots" aria-label="Choose an image">{heroSlides.map((slide, index) => <button type="button" className={index === heroSlide ? "active" : ""} onClick={() => setHeroSlide(index)} aria-label={`Show image ${index + 1}`} aria-current={index === heroSlide ? "true" : undefined} key={slide.src} />)}</div></>}
      </motion.div>
    </section>

    <section className="marquee" aria-label="Don Ramith principles"><div>CONFIDENCE <i>•</i> AUTHENTICITY <i>•</i> CONNECTION <i>•</i> ACTION <i>•</i> CONFIDENCE <i>•</i> AUTHENTICITY</div></section>

    <motion.section className="transformation" {...reveal}>
      <div className="transformation-head"><p className="section-index">01 / THE TRANSFORMATION</p><h2>From holding back<br/>to <em>showing up.</em></h2><p>Coaching is not about becoming someone else. It is about replacing hesitation with the confidence to act naturally.</p></div>
      <div className="comparison" role="table" aria-label="Before and after coaching"><div className="comparison-label before-label" role="columnheader">BEFORE</div><div className="comparison-label after-label" role="columnheader">AFTER</div>{[
        ["Overthinking every interaction","Starting conversations naturally"],
        ["Fear of rejection","Comfortable meeting anyone"],
        ["Running out of things to say","Confident in any conversation"],
        ["Avoiding social opportunities","Taking action without hesitation"],
        ["Dreading first impressions","Making people feel at ease instantly"],
      ].map(([before,after])=><div className="comparison-row" role="row" key={before}><div className="before-item" role="cell"><b aria-hidden="true">×</b><span>{before}</span></div><div className="after-item" role="cell"><b aria-hidden="true">✓</b><span>{after}</span></div></div>)}</div>
    </motion.section>

    <section className="method" id="method"><div className="method-layout"><motion.div className="method-head" {...reveal}><p className="section-index">02 / THE METHOD</p><h2>Confidence <span className="method-title-line">built in the</span> <em>real world.</em></h2><p>Not theory. Not pickup tricks. A direct coaching process built around who you are.</p></motion.div>
      <div className="steps">{[["01","See clearly","We identify the habits, beliefs and situations that keep you stuck. You leave with a clear picture of what actually needs to change."],["02","Practice for real","You take focused action in real social situations, with direct feedback that turns every attempt into useful progress."],["03","Make it yours","The new behavior becomes natural. Confidence stops feeling like something you perform and starts feeling like who you are."]].map(([n,t,d])=><motion.article key={n} initial={reduce ? false : { opacity:0, y:70, scale:.97 }} whileInView={{ opacity:1, y:0, scale:1 }} viewport={{ once:true, amount:.45 }} transition={{ duration:.55 }}><b>{n}</b><span className="step-mark">↗</span><h3>{t}</h3><p>{d}</p></motion.article>)}</div></div>
    </section>

    <section className="about"><motion.div className="about-card" {...reveal}><p className="section-index">03 / MEET DON</p><div><h2>Not a guru.<br/><em>A real person.</em></h2><p>Don built his confidence by doing the work in real life. His approach is direct, human and grounded in authenticity because the goal isn’t to become someone else. It’s to become fully comfortable being you.</p><a href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">Follow Don on Instagram <Arrow /></a></div><div className="signature">DR</div></motion.div></section>

    <section className="content testimonials" id="testimonials"><motion.div className="content-head" {...reveal}><p className="section-index">04 / TESTIMONIALS</p><h2>Hear it from<br/><em>the men coached.</em></h2></motion.div>
      <div className="testimonial-toolbar"><p>Swipe or use the arrows to explore every story.</p><div className="testimonial-controls"><button type="button" onClick={() => slideTestimonials(-1)} aria-label="Previous testimonial">←</button><button type="button" onClick={() => slideTestimonials(1)} aria-label="Next testimonial">→</button></div></div>
      <div className="testimonial-track" ref={testimonialTrack}>{testimonials.map((file, index) => <article className="testimonial-video" key={file}>
        {/* Captions can be added once transcripts are available. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video controls playsInline preload="metadata" onPlay={event => pauseOtherTestimonials(event.currentTarget)}><source src={`/testimonials/${file}`} type="video/mp4" />Your browser does not support HTML video.</video>
        <div><span>CLIENT STORY</span><b>{String(index + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</b></div>
      </article>)}</div>
    </section>

    <section className="top-videos" id="content"><motion.div className="content-head" {...reveal}><p className="section-index">05 / TOP VIDEOS</p><h2>The videos people<br/><em>keep watching.</em></h2><a href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer">View Instagram <Arrow /></a></motion.div><div className="top-video-grid">{[
      ["/top-video-1.png","She is Jacked","1.9M views"],
      ["/top-video-2.png","The Social Challenge","190K views"],
      ["/top-video-3.png","5 Kids","309K views"],
    ].map(([src,title,views],i)=><motion.a className="top-video-card" href="https://www.instagram.com/donramith/" target="_blank" rel="noreferrer" key={src} {...reveal} transition={{ duration:.5, delay:i*.08 }} aria-label={`${title}, ${views}, watch on Instagram`}><img src={src} alt={`Thumbnail for ${title}`} width="626" height="978"/><span>WATCH ON INSTAGRAM <Arrow /></span></motion.a>)}</div></section>

    <section className="faq" id="faq"><motion.div className="faq-head" {...reveal}><p className="section-index">06 / FAQ</p><h2>Clear answers.<br/><em>No pressure.</em></h2><p>Everything you need to know before applying for private coaching.</p></motion.div><div className="faq-list">{[
      ["Who is this coaching for?","For men who want stronger real-world confidence, more natural conversations and genuine connections without relying on scripts or pretending to be someone else."],
      ["Is this pickup coaching?","No. Don’s work is about self-trust, social confidence and authentic communication, not tricks, manipulation or memorized lines."],
      ["How does the coaching work?","The exact format is discussed on the fit call. The process combines honest diagnosis, focused real-world practice and direct feedback tailored to you."],
      ["How much does private coaching cost?",`Private coaching starts from $${minimumBudget}. The application includes a budget check so both sides know whether moving forward makes sense.`],
      ["What happens after I apply?","Don reviews your answers. If the fit and investment are aligned, you can choose a time for an initial call and discuss the next steps."],
    ].map(([question,answer],i)=><motion.div className={`faq-item${openFaq === i ? " open" : ""}`} key={question} {...reveal} transition={{ duration:.4, delay:i*.05 }}><button className="faq-question" type="button" aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{question}</span><b aria-hidden="true">+</b></button><div className="faq-answer-shell"><button id={`faq-answer-${i}`} className="faq-answer" type="button" tabIndex={openFaq === i ? 0 : -1} onClick={() => setOpenFaq(null)}><span>{answer}</span></button></div></motion.div>)}</div></section>

    <section className="final-cta"><motion.div {...reveal}><p className="eyebrow">READY WHEN YOU ARE</p><h2>One conversation<br/>can change <em>everything.</em></h2><p>Apply for private coaching and find out if Don’s process is the right fit for you.</p><button className="primary" onClick={() => setApply(true)}>Apply for 1-on-1 coaching <Arrow /></button></motion.div></section>
    <footer><a className="wordmark" href="#top">DON <i>RAMITH</i></a><p>CONFIDENCE · AUTHENTICITY · CONNECTION</p><div><a href="https://www.instagram.com/donramith/">Instagram</a><span>© 2026</span></div></footer>
    <Application open={apply} close={() => setApply(false)} />
  </main>;
}

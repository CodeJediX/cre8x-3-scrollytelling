"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, LockKeyhole, Menu, Sparkles, X } from "lucide-react";
import type { PublicContent } from "@/lib/types";
import { LiveRegistrationMetrics } from "@/components/live-registration-metrics";

const chapters = [
  { eyebrow: "FOUNDATIONS OF CIVILIZATION", title: <>The past gave us <em>form.</em></>, body: "Marble, proportion and mythology became the first interface between imagination and civilization." },
  { eyebrow: "THE PRESENT SIGNAL", title: <>Technology gave us <em>reach.</em></>, body: "Design moved from static surfaces into systems that learn, respond and connect billions of people." },
  { eyebrow: "THE FRACTURE", title: <>Today is not the <em>destination.</em></>, body: "The systems around us still carry the assumptions of the world that built them. CreateX asks you to break those assumptions." },
  { eyebrow: "THE 2050 PROTOCOL", title: <>Imagine a world worth <em>arriving at.</em></>, body: "Design meaningful products, services and digital experiences for the people who will inherit 2050." },
  { eyebrow: "CREATE X 3.0", title: <>Design what comes <em>next.</em></>, body: "This is a UI/UX competition for undergraduates ready to define the next era of human experience." }
];

const domains = ["AI", "Healthcare", "Smart Cities", "Education", "Sustainability", "Transportation", "Finance", "Accessibility", "Agriculture", "Communication", "Entertainment", "HCI", "Space", "Disaster Management"];

const domainProfiles: Record<string, { code: string; statement: string }> = {
  AI: { code: "COGNITIVE SYSTEMS", statement: "Design intelligence that expands human agency without erasing accountability." },
  Healthcare: { code: "HUMAN VITALITY", statement: "Reimagine prevention, diagnosis and care as understandable, equitable experiences." },
  "Smart Cities": { code: "URBAN INTELLIGENCE", statement: "Turn infrastructure into a responsive public service for every citizen." },
  Education: { code: "KNOWLEDGE EVOLUTION", statement: "Create learning systems that adapt to people, cultures and lifelong change." },
  Sustainability: { code: "PLANETARY BALANCE", statement: "Make responsible choices visible, accessible and meaningfully rewarding." },
  Transportation: { code: "MOBILITY PROTOCOL", statement: "Connect people and places through safer, calmer and more inclusive movement." },
  Finance: { code: "ECONOMIC ACCESS", statement: "Make complex financial systems legible, fair and useful to more people." },
  Accessibility: { code: "UNIVERSAL INTERFACE", statement: "Design participation as a foundation—not an accommodation added later." },
  Agriculture: { code: "LIVING SYSTEMS", statement: "Help growers, communities and ecosystems make better decisions together." },
  Communication: { code: "HUMAN SIGNAL", statement: "Protect meaning, trust and genuine connection in an always-connected world." },
  Entertainment: { code: "IMMERSIVE CULTURE", statement: "Imagine stories and shared worlds that deepen creativity instead of attention debt." },
  HCI: { code: "SYMBIOTIC INTERFACE", statement: "Explore how humans and machines can cooperate naturally, safely and transparently." },
  Space: { code: "ORBITAL EXPERIENCE", statement: "Design humane systems for discovery, distance and life beyond Earth." },
  "Disaster Management": { code: "RESILIENCE NETWORK", statement: "Turn critical information into coordinated action when every second matters." }
};

const faqs = [
  ["Who can participate?", "Current undergraduate students from any recognized university may participate."],
  ["Can I participate alone?", "Yes. Choose Solo registration, or create an alliance of up to four participants."],
  ["Can students from different universities form a team?", "Yes. Cross-university teams are welcome; every member must independently verify undergraduate eligibility."],
  ["Is coding required?", "No. This is a UI/UX and product-thinking competition. A convincing prototype and clear reasoning matter more than production code."],
  ["What should we design?", "A meaningful digital product, service, experience or system that improves how people may live in 2050."],
  ["Can we use Figma?", "Yes. Figma links, interactive prototypes, PDFs and supporting material are supported by the submission system."],
  ["Can we edit our submission?", "Submissions remain editable until the configured deadline. They become read-only automatically afterward."],
  ["What happens in the final round?", "Finalists enter the Olympus Finale: a full product pitch covering the problem, users, research, interface, prototype, impact and scalability."],
  ["Is there a registration fee?", "No fee has been configured for the initial launch. Any change will be published through official announcements."],
  ["How will finalists be selected?", "The judging criteria will be published with the Oracle Challenge and can be updated by competition administrators." ]
];

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const distance = now === null ? 0 : Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60)
  };
}

export function PublicExperience({ content }: { content: PublicContent }) {
  const storyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("AI");
  const countdown = useCountdown(content.milestoneDate);
  const bootText = useMemo(() => {
    if (progress < 24) return "INITIALIZING CREATE X";
    if (progress < 48) return "ANALYZING THE PAST";
    if (progress < 70) return "CALCULATING THE FUTURE";
    if (progress < 94) return "ENVISIONING 2050";
    return "ENTERING CREATE X 3.0";
  }, [progress]);

  useEffect(() => {
    let animation = 0;
    const started = performance.now();
    const tick = () => {
      const value = Math.min(100, ((performance.now() - started) / 1900) * 100);
      setProgress(value);
      if (value < 100) animation = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoaded(true), 220);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const closeMenu = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeMenu);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeMenu);
    };
  }, [menuOpen]);

  useEffect(() => {
    const story = storyRef.current;
    const video = videoRef.current;
    if (!story || !video) return;
    let frame = 0;
    let target = 0;

    const paint = () => {
      frame = 0;
      const rect = story.getBoundingClientRect();
      const scrollable = Math.max(story.offsetHeight - innerHeight, 1);
      const amount = Math.min(1, Math.max(0, -rect.top / scrollable));
      setActiveChapter(Math.min(chapters.length - 1, Math.floor(amount * chapters.length)));
      story.style.setProperty("--story-progress", String(amount));
      if (Number.isFinite(video.duration) && video.duration > 0) {
        target = amount * Math.max(0, video.duration - .04);
        if (!video.seeking && Math.abs(video.currentTime - target) > .02) {
          try { video.currentTime = target; } catch { /* a later frame will retry */ }
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const settle = () => { if (Math.abs(video.currentTime - target) > .02) schedule(); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    video.addEventListener("seeked", settle);
    paint();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      video.removeEventListener("seeked", settle);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!matchMedia("(pointer:fine)").matches) return;
    const cursor = document.querySelector<HTMLElement>(".future-cursor");
    if (!cursor) return;
    const move = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      cursor.dataset.label = target?.dataset.cursor ?? "";
      cursor.classList.toggle("is-active", Boolean(target));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className="future-site">
      <div className={`future-preloader ${loaded ? "is-complete" : ""}`} aria-hidden={loaded}>
        <div className="preloader-matrix" />
        <div className="future-preloader-core">
          <Image src="/assets/cre8x-preloader.gif" alt="" width={640} height={360} unoptimized priority />
          <p>{bootText}</p>
          <div className="future-load-track"><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
          <b>{String(Math.round(progress)).padStart(2, "0")}%</b>
        </div>
      </div>

      <div className="future-cursor" aria-hidden="true"><span /></div>
      <div className="future-noise" aria-hidden="true" />

      <header className="future-nav">
        <Link href="#experience" aria-label="CreateX 3.0 home"><Image src="/assets/cre8x-logo.png" alt="CreateX 3.0" width={180} height={90} priority /></Link>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#world2050" onClick={() => setMenuOpen(false)}>2050</a>
          <a href="#journey" onClick={() => setMenuOpen(false)}>Journey</a>
          <a href="#timeline" onClick={() => setMenuOpen(false)}>Timeline</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <Link className="future-register" href="/register" data-cursor="ENTER">Register</Link>
        </nav>
        <div className="future-nav-tools">
          <button className="mobile-menu" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      {content.previewMode && <div className="preview-ribbon">Platform preview · Supabase connection pending</div>}

      <main>
        <section ref={storyRef} className="future-story" id="experience" aria-label="CreateX 3.0 vision">
          <div className="future-story-stage">
            <video ref={videoRef} muted playsInline preload="auto" poster="/assets/cre8x-origin.png" src="/assets/cre8x-cinematic-scrub.mp4" />
            <div className="story-atmosphere"><i /><i /><i /></div>
            <div className="story-grid" />
            <div className="story-vignette" />

            <div className={`hero-intro ${activeChapter === 0 ? "is-active" : ""}`}>
              <span className="hero-signal"><i /> {content.heroAnnouncement}</span>
              <Image src="/assets/cre8x-logo.png" alt="CreateX 3.0" width={620} height={310} priority />
              <h1><span>Imagine 2050.</span> Design What Comes Next.</h1>
              <p>The UI/UX competition for undergraduates shaping the systems, services and human experiences of the future.</p>
              <div className="hero-actions">
                <Link href="/register" className="hero-primary" data-cursor="ENTER">Register now <ArrowRight size={15} /></Link>
                <a href="#about" className="hero-secondary" data-cursor="EXPLORE">Explore the experience <ArrowDown size={15} /></a>
              </div>
            </div>

            <div className="story-chapters">
              {chapters.slice(1).map((chapter, index) => (
                <article key={chapter.eyebrow} className={activeChapter === index + 1 ? "is-active" : ""}>
                  <span>{chapter.eyebrow}</span><h2>{chapter.title}</h2><p>{chapter.body}</p>
                </article>
              ))}
            </div>
            <div className="story-progress"><span>PAST</span><i><b style={{ transform: `scaleX(${activeChapter / 4})` }} /></i><span>2050</span></div>
          </div>
        </section>

        <LiveRegistrationMetrics
          enabled={!content.previewMode}
          initial={{ totalPlayers: content.registeredPeople, teamsCount: content.teamsCount, soloRegistrations: content.soloRegistrations }}
        />

        <section className="future-about" id="about">
          <Image src="/assets/cre8x-awakening.png" alt="Ancient marble awakening with future technology" fill sizes="100vw" />
          <div className="future-about-shade" />
          <div className="future-about-copy">
            <span className="section-code">CREATE X / PURPOSE</span>
            <h2>Designing<br /><em>beyond today.</em></h2>
            <div className="about-manifesto">
              <p>CreateX is a future-focused UI/UX competition built around product thinking, human insight and the courage to question familiar interfaces.</p>
              <p>Its third edition asks participants to imagine the world of 2050—not as science fiction, but as a design responsibility.</p>
              <div><b>01</b> Understand the human need</div><div><b>02</b> Challenge the current system</div><div><b>03</b> Prototype a meaningful future</div>
            </div>
          </div>
        </section>

        <section className="evolution-archive" id="timeline">
          <div className="archive-heading"><span className="section-code">THE EVOLUTION ARCHIVE</span><h2>Three generations.<br /><em>One trajectory.</em></h2></div>
          <div className="archive-rail">
            {["CREATE X 1.0", "CREATE X 2.0", "CREATE X 3.0", "2050"].map((year, index) => (
              <article key={year} className={index === 2 ? "is-current" : index === 3 ? "is-future" : ""}>
                <span>0{index + 1}</span><h3>{year}</h3><p>{["The foundation", "The expansion", "The transformation", "The world you design"][index]}</p><i />
              </article>
            ))}
          </div>
        </section>

        <section className="world-2050" id="world2050">
          <div className="world-copy"><span className="section-code">THE WORLD OF 2050</span><h2>What should the<br />world <em>become?</em></h2><p>Choose a system worth improving. Find the people it leaves behind. Design an experience that deserves to exist in 2050.</p></div>
          <div className="domain-constellation" aria-label="Innovation domains">
            <div className="domain-core"><b>2050</b><span>SELECT A SIGNAL</span></div>
            {domains.map((domain, index) => (
              <button
                key={domain}
                className={selectedDomain === domain ? "is-selected" : ""}
                style={{ "--domain-index": index } as React.CSSProperties}
                data-cursor="EXPLORE"
                aria-pressed={selectedDomain === domain}
                onClick={() => setSelectedDomain(domain)}
              ><span>{domain}</span></button>
            ))}
            <div className="domain-readout" aria-live="polite">
              <span>{domainProfiles[selectedDomain].code}</span>
              <strong>{selectedDomain}</strong>
              <p>{domainProfiles[selectedDomain].statement}</p>
            </div>
          </div>
        </section>

        <section className="guardian-transition">
          <Image src="/assets/cre8x-duality.png" alt="A marble guardian transforming into a cybernetic intelligence" fill sizes="100vw" />
          <div className="guardian-scan" />
          <div className="guardian-copy"><span>PAST × INNOVATION × FUTURE</span><h2>The guardian<br />of <em>what comes next.</em></h2></div>
        </section>

        <section className="competition-journey" id="journey">
          <div className="journey-heading"><span className="section-code">COMPETITION PROTOCOL</span><h2>Enter the realm.<br /><em>Ascend through design.</em></h2></div>
          <div className="journey-stages">
            {content.rounds.map((round, index) => (
              <article key={round.round_slug} className={`journey-stage status-${round.status}`}>
                <div className="stage-index">0{index + 1}</div>
                <div><span>{round.status.replaceAll("_", " ")}</span><h3>{round.round_name}</h3><p>{round.description}</p></div>
                {round.status === "coming_soon" && <LockKeyhole aria-label="Locked" />}
                {round.status === "open" && <Link href="/register">Enter stage <ArrowRight size={14} /></Link>}
              </article>
            ))}
          </div>
        </section>

        <section className="milestone-section">
          <Image src="/assets/cre8x-zeus.png" alt="Cybernetic Zeus controlling the CreateX timeline" fill sizes="100vw" />
          <div className="milestone-shade" />
          <div className="milestone-content">
            <span className="section-code">NEXT MILESTONE</span><h2>{content.milestoneLabel}</h2>
            <div className="countdown" aria-live="polite">
              {Object.entries(countdown).map(([label, value]) => <div key={label}><b>{String(value).padStart(2, "0")}</b><span>{label}</span></div>)}
            </div>
            <p>Olympus Finale · October 3 · {content.venue}</p>
          </div>
        </section>

        {content.announcements.length > 0 && (
          <section className="public-announcements"><span className="section-code">ORACLE TRANSMISSIONS</span>{content.announcements.map((item) => <article key={item.id}><b>{item.priority}</b><h3>{item.title}</h3><p>{item.message}</p></article>)}</section>
        )}

        <section className="future-faq" id="faq">
          <div className="faq-heading"><span className="section-code">KNOWLEDGE ARCHIVE</span><h2>Questions from<br /><em>the realm.</em></h2></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="final-invitation">
          <div className="final-orbit" /><Sparkles aria-hidden="true" />
          <Image src="/assets/cre8x-logo.png" alt="CreateX 3.0" width={420} height={210} />
          <h2>The future is not found.<br /><em>It is designed.</em></h2>
          <p>Enter CreateX 3.0 and define one part of the world people deserve in 2050.</p>
          <Link href="/register" data-cursor="ENTER">Register now <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="future-footer">
        <div><Image src="/assets/cre8x-logo.png" alt="CreateX 3.0" width={180} height={90} /><p>Kotelawala Defence University Student Chapter</p></div>
        <nav><a href="#experience">Experience</a><a href="#about">About</a><a href="#world2050">2050</a><a href="#journey">Journey</a><a href="#faq">FAQ</a></nav>
        <div className="footer-meta"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>Contact · To be announced</span><span>© 2026 CREATE X 3.0</span></div>
      </footer>
    </div>
  );
}

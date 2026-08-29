"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Menu, Sparkles, X } from "lucide-react";
import type { PublicContent } from "@/lib/types";
import { LiveRegistrationMetrics } from "@/components/live-registration-metrics";

const REGISTRATION_CLOSE = "2026-09-15T23:59:59+05:30";

const chapters = [
  { eyebrow: "FOUNDATIONS OF CIVILIZATION", title: <>The past gave us <em>form.</em></>, body: "Marble, proportion and mythology became the first interface between imagination and civilization." },
  { eyebrow: "THE PRESENT SIGNAL", title: <>Technology gave us <em>reach.</em></>, body: "Design moved from static surfaces into systems that learn, respond and connect billions of people." },
  { eyebrow: "THE FRACTURE", title: <>Today is not the <em>destination.</em></>, body: "The systems around us still carry the assumptions of the world that built them. CREA8X asks you to break those assumptions." },
  { eyebrow: "THE 2100 PROTOCOL", title: <>Imagine a world worth <em>arriving at.</em></>, body: "Design meaningful products, services and digital experiences for the people who will inherit 2100." },
  { eyebrow: "CREA8X 3.0", title: <>Design what comes <em>next.</em></>, body: "This is a UI/UX competition for undergraduates ready to define the next era of human experience." }
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

const roadmapEvents = [
  { short: "SEP 02", date: "September 2", title: "Registration Opens", tag: "THE GATES OPEN", detail: "The journey begins. Enter solo or assemble your alliance and claim your place in CREA8X 3.0." },
  { short: "SEP 15", date: "September 15 · Midnight", title: "Registration Closes", tag: "THE GATES SEAL", detail: "Registration closes at midnight. All participant and team details must be completed before the gate seals." },
  { short: "SEP 18", date: "September 18", title: "The Oracle Challenge Begins", tag: "THE ORACLE SPEAKS", detail: "The first challenge is revealed and the design expedition officially enters its competitive phase." },
  { short: "SEP 20", date: "September 20 · Midnight", title: "The Oracle Challenge Ends", tag: "THE ORACLE FALLS SILENT", detail: "The challenge closes at midnight. Finalize and submit your response before the signal disappears." },
  { short: "SEP 24", date: "September 24", title: "The Ascension — Main Workshop", tag: "ASCEND THE FORGE", detail: "A focused main workshop to sharpen product thinking, interface craft and presentation strategy." },
  { short: "OCT 02", date: "October 2", title: "Finalists Announced", tag: "THE CHOSEN ASCEND", detail: "The strongest visions are announced and advance toward the final ascent to Olympus." },
  { short: "OCT 11", date: "October 11", title: "The Olympus Finale", tag: "REACH OLYMPUS", detail: "The final arena. Finalists reveal, defend and present the experiences they designed for the world of 2100." }
];

const faqs = [
  ["Who can participate?", "Current undergraduate students from any recognized university may participate."],
  ["Can I participate alone?", "Yes. Choose Solo registration, or create an alliance of up to four participants."],
  ["Can students from different universities form a team?", "Yes. Cross-university teams are welcome; every member must independently verify undergraduate eligibility."],
  ["Is coding required?", "No. This is a UI/UX and product-thinking competition. A convincing prototype and clear reasoning matter more than production code."],
  ["What should we design?", "A meaningful digital product, service, experience or system that improves how people may live in 2100."],
  ["Can we use Figma?", "Yes. Figma links, interactive prototypes, PDFs and supporting material are supported by the submission system."],
  ["Can we edit our submission?", "Submissions remain editable until the configured deadline. They become read-only automatically afterward."],
  ["What happens in the final round?", "Finalists enter the Olympus Finale: a full product pitch covering the problem, users, research, interface, prototype, impact and scalability."],
  ["Is there a registration fee?", "No fee has been configured for the initial launch. Any change will be published through official announcements."],
  ["How will finalists be selected?", "The judging criteria will be published with the Oracle Challenge and can be updated by competition administrators."]
];

function brandCopy(value: string) {
  return value.replace(/create\s*x/gi, "CREA8X");
}

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

export function PublicExperienceV2({ content }: { content: PublicContent }) {
  const storyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("AI");
  const [activeRoadmap, setActiveRoadmap] = useState(0);
  const countdown = useCountdown(REGISTRATION_CLOSE);

  const bootText = useMemo(() => {
    if (progress < 24) return "INITIALIZING CREA8X";
    if (progress < 48) return "ANALYZING THE PAST";
    if (progress < 70) return "CALCULATING THE FUTURE";
    if (progress < 94) return "ENVISIONING 2100";
    return "ENTERING CREA8X 3.0";
  }, [progress]);

  useEffect(() => {
    let animation = 0;
    const started = performance.now();
    const tick = () => {
      const value = Math.min(100, ((performance.now() - started) / 1750) * 100);
      setProgress(value);
      if (value < 100) animation = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoaded(true), 180);
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
          try { video.currentTime = target; } catch { /* later frames retry */ }
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

  const jumpRoadmap = (index: number) => {
    const rail = roadmapRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(`[data-roadmap-index="${index}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveRoadmap(index);
  };

  const nudgeRoadmap = (direction: -1 | 1) => {
    jumpRoadmap(Math.min(roadmapEvents.length - 1, Math.max(0, activeRoadmap + direction)));
  };

  const syncRoadmapProgress = () => {
    const rail = roadmapRef.current;
    if (!rail) return;
    const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let nearest = activeRoadmap;
    let distance = Number.POSITIVE_INFINITY;
    rail.querySelectorAll<HTMLElement>("[data-roadmap-index]").forEach((card) => {
      const rect = card.getBoundingClientRect();
      const nextDistance = Math.abs(rect.left + rect.width / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = Number(card.dataset.roadmapIndex ?? 0);
      }
    });
    if (nearest !== activeRoadmap) setActiveRoadmap(nearest);
  };

  return (
    <div className="future-site crea8x-upgraded">
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
        <Link href="#experience" aria-label="CREA8X 3.0 home"><Image src="/assets/cre8x-logo.png" alt="CREA8X 3.0" width={180} height={90} priority /></Link>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#world2100" onClick={() => setMenuOpen(false)}>2100</a>
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
        <section ref={storyRef} className="future-story" id="experience" aria-label="CREA8X 3.0 vision">
          <div className="future-story-stage">
            <video ref={videoRef} muted playsInline preload="auto" poster="/assets/cre8x-origin.png" src="/assets/cre8x-cinematic-scrub.mp4" />
            <div className="story-atmosphere"><i /><i /><i /></div>
            <div className="story-grid" /><div className="story-vignette" />

            <div className={`hero-intro ${activeChapter === 0 ? "is-active" : ""}`}>
              <span className="hero-signal"><i /> {brandCopy(content.heroAnnouncement)}</span>
              <Image src="/assets/cre8x-logo.png" alt="CREA8X 3.0" width={620} height={310} priority />
              <h1><span>Imagine 2100.</span> Design What Comes Next.</h1>
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
            <div className="story-progress"><span>PAST</span><i><b style={{ transform: `scaleX(${activeChapter / 4})` }} /></i><span>2100</span></div>
          </div>
        </section>

        <LiveRegistrationMetrics enabled={!content.previewMode} initial={{ totalPlayers: content.registeredPeople, teamsCount: content.teamsCount, soloRegistrations: content.soloRegistrations }} />

        <section className="future-about cinematic-seam" id="about">
          <Image src="/assets/cre8x-awakening.png" alt="Ancient marble awakening with future technology" fill sizes="100vw" />
          <div className="future-about-shade" />
          <div className="future-about-copy">
            <span className="section-code">CREA8X / PURPOSE</span>
            <h2>Designing<br /><em>beyond today.</em></h2>
            <div className="about-manifesto">
              <p>CREA8X is a future-focused UI/UX competition built around product thinking, human insight and the courage to question familiar interfaces.</p>
              <p>Its third edition asks participants to imagine the world of 2100—not as science fiction, but as a design responsibility.</p>
              <div><b>01</b> Understand the human need</div><div><b>02</b> Challenge the current system</div><div><b>03</b> Prototype a meaningful future</div>
            </div>
          </div>
        </section>

        <section className="evolution-archive cinematic-seam" aria-label="CREA8X evolution">
          <div className="archive-heading"><span className="section-code">THE EVOLUTION ARCHIVE</span><h2>Three generations.<br /><em>One trajectory.</em></h2></div>
          <div className="archive-rail">
            {["CREA8X 1.0", "CREA8X 2.0", "CREA8X 3.0", "2100"].map((year, index) => (
              <article key={year} className={index === 2 ? "is-current" : index === 3 ? "is-future" : ""}>
                <span>0{index + 1}</span><h3>{year}</h3><p>{["The foundation", "The expansion", "The transformation", "The world you design"][index]}</p><i />
              </article>
            ))}
          </div>
        </section>

        <section className="world-2050 cinematic-seam" id="world2100">
          <div className="world-copy"><span className="section-code">THE WORLD OF 2100</span><h2>What should the<br />world <em>become?</em></h2><p>Choose a system worth improving. Find the people it leaves behind. Design an experience that deserves to exist in 2100.</p></div>
          <div className="domain-constellation" aria-label="Innovation domains">
            <div className="domain-core"><b>2100</b><span>SELECT A SIGNAL</span></div>
            {domains.map((domain, index) => (
              <button key={domain} className={selectedDomain === domain ? "is-selected" : ""} style={{ "--domain-index": index } as React.CSSProperties} data-cursor="EXPLORE" aria-pressed={selectedDomain === domain} onClick={() => setSelectedDomain(domain)}><span>{domain}</span></button>
            ))}
            <div className="domain-readout" aria-live="polite"><span>{domainProfiles[selectedDomain].code}</span><strong>{selectedDomain}</strong><p>{domainProfiles[selectedDomain].statement}</p></div>
          </div>
        </section>

        <section className="guardian-transition cinematic-seam">
          <Image src="/assets/cre8x-duality.png" alt="A marble guardian transforming into a cybernetic intelligence" fill sizes="100vw" />
          <div className="guardian-scan" />
          <div className="guardian-copy"><span>PAST × INNOVATION × FUTURE</span><h2>The guardian<br />of <em>what comes next.</em></h2></div>
        </section>

        <section className="competition-journey cinematic-seam" id="journey">
          <div className="journey-heading"><span className="section-code">COMPETITION PROTOCOL</span><h2>Enter the realm.<br /><em>Ascend through design.</em></h2></div>
          <div className="journey-stages">
            {content.rounds.map((round, index) => (
              <article key={round.round_slug} className={`journey-stage status-${round.status}`}>
                <div className="stage-index">0{index + 1}</div>
                <div><span>{round.status.replaceAll("_", " ")}</span><h3>{brandCopy(round.round_name)}</h3><p>{brandCopy(round.description)}</p></div>
                {round.status === "open" && <Link href="/register">Enter stage <ArrowRight size={14} /></Link>}
              </article>
            ))}
          </div>
        </section>

        <section className="olympus-roadmap cinematic-seam" id="timeline">
          <div className="roadmap-heading">
            <div><span className="section-code">THE ASCENT TO OLYMPUS</span><h2>Seven milestones.<br /><em>One road upward.</em></h2></div>
            <p>Follow the complete CREA8X 3.0 campaign from the opening gate to the Olympus Finale. Select a milestone or scroll horizontally to move through the journey.</p>
          </div>

          <div className="roadmap-toolbar" aria-label="Timeline controls">
            <div className="roadmap-progress"><span>GATE</span><i><b style={{ transform: `scaleX(${activeRoadmap / (roadmapEvents.length - 1)})` }} /></i><span>OLYMPUS</span></div>
            <div className="roadmap-arrows"><button onClick={() => nudgeRoadmap(-1)} disabled={activeRoadmap === 0} aria-label="Previous milestone"><ArrowLeft /></button><button onClick={() => nudgeRoadmap(1)} disabled={activeRoadmap === roadmapEvents.length - 1} aria-label="Next milestone"><ArrowRight /></button></div>
          </div>

          <div className="roadmap-viewport" ref={roadmapRef} onScroll={syncRoadmapProgress}>
            <div className="roadmap-path" aria-hidden="true"><i /></div>
            {roadmapEvents.map((event, index) => (
              <article key={event.title} data-roadmap-index={index} className={`roadmap-card ${activeRoadmap === index ? "is-active" : ""}`} onClick={() => jumpRoadmap(index)} data-cursor="ASCEND">
                <button type="button" className="roadmap-node" aria-label={`Open ${event.title}`} onClick={() => jumpRoadmap(index)}><span>{String(index + 1).padStart(2, "0")}</span></button>
                <div className="roadmap-date"><span>{event.short}</span><strong>{event.date}</strong></div>
                <span className="roadmap-tag">{event.tag}</span>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
                <div className="roadmap-glyph" aria-hidden="true">Ω</div>
              </article>
            ))}
          </div>
          <div className="roadmap-mobile-hint">Swipe the roadmap to continue the ascent <ArrowRight size={14} /></div>
        </section>

        <section className="milestone-section cinematic-seam">
          <Image src="/assets/cre8x-zeus.png" alt="Cybernetic Zeus controlling the CREA8X timeline" fill sizes="100vw" />
          <div className="milestone-shade" />
          <div className="milestone-content">
            <span className="section-code">REGISTRATION CLOSES</span><h2>September 15 · Midnight</h2>
            <div className="countdown" aria-live="polite">
              {Object.entries(countdown).map(([label, value]) => <div key={label}><b>{String(value).padStart(2, "0")}</b><span>{label}</span></div>)}
            </div>
            <p>The Olympus Finale · October 11 · {content.venue}</p>
          </div>
        </section>

        {content.announcements.length > 0 && <section className="public-announcements"><span className="section-code">ORACLE TRANSMISSIONS</span>{content.announcements.map((item) => <article key={item.id}><b>{item.priority}</b><h3>{brandCopy(item.title)}</h3><p>{brandCopy(item.message)}</p></article>)}</section>}

        <section className="future-faq cinematic-seam" id="faq">
          <div className="faq-heading"><span className="section-code">KNOWLEDGE ARCHIVE</span><h2>Questions from<br /><em>the realm.</em></h2></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="final-invitation cinematic-seam">
          <div className="final-orbit" /><Sparkles aria-hidden="true" />
          <Image src="/assets/cre8x-logo.png" alt="CREA8X 3.0" width={420} height={210} />
          <h2>The future is not found.<br /><em>It is designed.</em></h2>
          <p>Enter CREA8X 3.0 and define one part of the world people deserve in 2100.</p>
          <Link href="/register" data-cursor="ENTER">Register now <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="future-footer">
        <div><Image src="/assets/cre8x-logo.png" alt="CREA8X 3.0" width={180} height={90} /><p>Kotelawala Defence University Student Chapter</p></div>
        <nav><a href="#experience">Experience</a><a href="#about">About</a><a href="#world2100">2100</a><a href="#journey">Journey</a><a href="#timeline">Timeline</a><a href="#faq">FAQ</a></nav>
        <div className="footer-meta"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>Contact · To be announced</span><span>© 2026 CREA8X 3.0</span></div>
      </footer>
    </div>
  );
}

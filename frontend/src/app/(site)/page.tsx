import Link from 'next/link';
import Image from 'next/image';
import {
  getServices,
  getCaseStudies,
  getTestimonials,
  getPosts,
  getHomepageStats,
  getWhyUs,
  getClientLogos,
  getHomepageSections,
  getPublicSettings,
  sectionsMap,
} from '@/lib/api';
import { MotionReveal } from '@/components/MotionReveal';
import { CountUp } from '@/components/CountUp';
import { LogoMarquee } from '@/components/LogoMarquee';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import { ArrowRightIcon, SERVICE_ICONS } from '@/components/icons';

export default async function HomePage() {
  const [services, caseStudies, testimonials, posts, stats, whyUs, logos, sections, settings] = await Promise.all([
    getServices(),
    getCaseStudies(),
    getTestimonials(),
    getPosts(),
    getHomepageStats(),
    getWhyUs(),
    getClientLogos(),
    getHomepageSections(),
    getPublicSettings(),
  ]);

  const enabled = sectionsMap(sections);
  const isOn = (key: string) => enabled[key] !== false; // default to visible if not seeded yet

  const featured = caseStudies.find((c) => c.is_featured) || caseStudies[0];
  const others = caseStudies.filter((c) => c.id !== featured?.id).slice(0, 2);
  const heroStats = featured?.results_json?.slice(0, 2) || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.agency_name || 'Anvil Digital',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    description: settings.tagline || "A performance marketing agency for D2C & SME brands in India, built by people who've shipped their own eCommerce brand.",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      {isOn('hero') && (
        <section className="relative overflow-hidden border-b border-line px-6 pb-24 pt-20 md:px-16 md:pb-28 md:pt-24">
          <video
            className="animate-kenburns absolute inset-0 h-full w-full object-cover"
            src="/homesection.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/85 to-bg" />
          <div className="pointer-events-none absolute inset-0 bg-bg/40" />
          <div
            className="animate-drift pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="animate-drift pointer-events-none absolute -left-32 bottom-0 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[100px]"
            style={{ animationDelay: '-6s' }}
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1312px] items-end gap-12 md:grid-cols-[1.15fr_0.85fr]">
            <MotionReveal>
              <div className="mb-7 flex items-center gap-2.5">
                <span className="h-px w-7 bg-accent" />
                <span className="text-xs uppercase tracking-[0.2em] text-accent">Digital Marketing Agency &middot; India</span>
              </div>
              <h1 className="mb-7 max-w-[760px] font-serif text-[40px] font-normal leading-[1.1] md:text-[58px]">
                We don&apos;t just <span className="font-serif-italic text-accent">market</span> brands.
                <br />
                We&apos;ve built one.
              </h1>
              <p className="mb-10 max-w-[520px] text-lg leading-relaxed text-muted">
                {settings.agency_name || 'Anvil'} is a performance-driven agency for D2C and SME brands in India.
                Every strategy we sell has already been stress-tested on our own eCommerce brand — real product,
                real spend, real results.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2.5 bg-accent px-7 py-4 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_8px_30px_-8px_var(--accent)]"
                >
                  Get a Free Audit <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/work"
                  className="group inline-flex items-center gap-2.5 border border-line px-7 py-4 text-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  View Our Work <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionReveal>

            {featured && (
              <MotionReveal delay={0.15}>
                <div className="relative border border-line bg-bg2/90 p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1">
                  <div className="pointer-events-none absolute inset-2 border border-accent-dim" />
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-accent">Real brand. Real results.</span>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                  </div>
                  <div className="font-serif-italic mb-1 text-[46px]">
                    <CountUp value={featured.results_json[0]?.value || '—'} />
                  </div>
                  <div className="mb-7 text-[13px] text-muted">
                    {featured.results_json[0]?.metric || 'Result'} — {featured.title}
                  </div>
                  {heroStats.length > 1 && (
                    <div className="grid grid-cols-2 gap-4 border-t border-line pt-5">
                      {heroStats.slice(1, 3).map((r) => (
                        <div key={r.metric}>
                          <div className="font-serif-italic text-[22px]">
                            <CountUp value={r.value} />
                          </div>
                          <div className="text-xs text-faint">{r.metric}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </MotionReveal>
            )}
          </div>
        </section>
      )}

      {/* LOGO STRIP */}
      {isOn('logos') && logos.length > 0 && (
        <section className="border-b border-line py-9">
          <div className="mx-auto mb-5 max-w-[1312px] px-6 md:px-16">
            <span className="whitespace-nowrap text-xs uppercase tracking-wider text-faint">Trusted by growing brands</span>
          </div>
          <LogoMarquee logos={logos} />
        </section>
      )}

      {/* SERVICES */}
      {isOn('services') && services.length > 0 && (
        <section className="border-b border-line px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-accent">What we do</span>
                <h2 className="mt-3 font-serif text-4xl font-normal md:text-[42px]">
                  Full-funnel growth,
                  <br />
                  run by people who&apos;ve shipped.
                </h2>
              </div>
              <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">
                Six disciplines. One accountable team. No hand-offs between &ldquo;the agency&rdquo; and &ldquo;the
                growth team&rdquo; — it&apos;s the same people.
              </p>
            </MotionReveal>

            <div className="grid grid-cols-1 border-t border-line md:grid-cols-2">
              {services.map((service, i) => {
                const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.target;
                const isRightCol = i % 2 === 1;
                return (
                  <MotionReveal key={service.id} delay={(i % 2) * 0.08}>
                    <Link
                      href={`/services/${service.slug}`}
                      className={`group relative block overflow-hidden border-b border-line py-9 pr-0 transition-all duration-300 hover:bg-bg2/50 hover:pl-3 md:pr-10 ${
                        isRightCol ? 'md:pl-10 md:pr-0 md:hover:pl-13' : 'md:border-r'
                      }`}
                    >
                      <span className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100" />
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-serif-italic text-[13px] text-faint">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="mb-2.5 mt-2.5 text-xl font-semibold transition-colors group-hover:text-accent">{service.title}</h3>
                          <p className="max-w-[400px] text-[14.5px] leading-relaxed text-muted">
                            {service.short_description}
                          </p>
                        </div>
                        <Icon
                          className="mt-1.5 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:rotate-6"
                          size={18}
                        />
                      </div>
                    </Link>
                  </MotionReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      {isOn('stats') && stats.length > 0 && (
        <section className="border-b border-line bg-bg2 px-6 py-14 md:px-16">
          <div className="mx-auto grid max-w-[1312px] grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <MotionReveal key={s.id} delay={i * 0.06} className={i > 0 ? 'md:border-l md:border-line md:pl-8' : ''}>
                <div className="font-serif-italic text-4xl text-accent md:text-[44px]">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1.5 text-[13px] text-muted">{s.label}</div>
              </MotionReveal>
            ))}
          </div>
        </section>
      )}

      {/* CASE STUDIES */}
      {isOn('case_studies') && caseStudies.length > 0 && (
        <section className="border-b border-line px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-accent">Selected work</span>
                <h2 className="mt-3 font-serif text-4xl font-normal md:text-[42px]">Proof, not portfolios.</h2>
              </div>
              <Link href="/work" className="flex items-center gap-2 text-sm hover:text-accent">
                View all case studies <ArrowRightIcon size={14} />
              </Link>
            </MotionReveal>

            {featured && (
              <MotionReveal className="mb-6 grid gap-12 border border-accent-dim bg-bg2 p-8 md:grid-cols-2 md:p-12">
                <div>
                  <span className="mb-5 inline-block bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
                    Built &amp; owned by {settings.agency_name || 'Anvil'}
                  </span>
                  <h3 className="mb-3 font-serif text-2xl md:text-[30px]">{featured.title}</h3>
                  <p className="mb-6 max-w-[440px] text-[14.5px] leading-relaxed text-muted">
                    We didn&apos;t just run this brand&apos;s ads — we built the product, the store, and the growth
                    engine from zero. Every tactic below has our own money behind it.
                  </p>
                  <Link href={`/work/${featured.slug}`} className="inline-flex items-center gap-2 text-sm hover:text-accent">
                    Read the full story <ArrowRightIcon size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-px bg-line">
                  {featured.results_json.slice(0, 4).map((r) => (
                    <div key={r.metric} className="bg-bg p-6 transition-colors hover:bg-bg2">
                      <div className="font-serif-italic text-3xl text-accent">
                        <CountUp value={r.value} />
                      </div>
                      <div className="mt-1 text-xs text-faint">{r.metric}{r.label ? `, ${r.label}` : ''}</div>
                    </div>
                  ))}
                </div>
              </MotionReveal>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {others.map((cs, i) => (
                <MotionReveal
                  key={cs.id}
                  delay={i * 0.08}
                  className="group border border-line p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent-dim hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]"
                >
                  <span className="text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
                  <h3 className="mb-5 mt-3 text-xl font-semibold transition-colors group-hover:text-accent">{cs.title}</h3>
                  <div className="mb-5 flex gap-6">
                    {cs.results_json.slice(0, 2).map((r) => (
                      <div key={r.metric}>
                        <div className="font-serif-italic text-[22px] text-accent">
                          <CountUp value={r.value} />
                        </div>
                        <div className="text-xs text-faint">{r.metric}</div>
                      </div>
                    ))}
                  </div>
                  <Link href={`/work/${cs.slug}`} className="inline-flex items-center gap-1.5 text-[13px] hover:text-accent">
                    View case study <ArrowRightIcon size={12} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      {isOn('why_us') && whyUs.length > 0 && (
        <section className="border-b border-line px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto grid max-w-[1312px] gap-12 md:grid-cols-[0.8fr_1.2fr]">
            <MotionReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-accent">Why {settings.agency_name || 'Anvil'}</span>
              <h2 className="mt-3 font-serif text-[34px] font-normal leading-tight md:text-[38px]">
                Agencies talk strategy.
                <br />
                We&apos;ve paid for it.
              </h2>
            </MotionReveal>
            <div>
              {whyUs.map((w, i) => (
                <MotionReveal key={w.id} delay={i * 0.05}>
                  <div className={`flex gap-6 py-5 border-t border-line ${i === whyUs.length - 1 ? 'border-b' : ''}`}>
                    <span className="font-serif-italic w-8 shrink-0 text-lg text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[15.5px] leading-relaxed">{w.point}</p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {isOn('testimonials') && testimonials.length > 0 && (
        <section className="border-b border-line bg-bg2 px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal className="mb-14 text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-accent">Client words</span>
              <h2 className="mt-3 font-serif text-[34px] font-normal md:text-[38px]">
                What founders say after we&apos;re done.
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <TestimonialCarousel testimonials={testimonials} />
            </MotionReveal>
          </div>
        </section>
      )}

      {/* BLOG */}
      {isOn('blog') && posts.items.length > 0 && (
        <section className="border-b border-line px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-accent">From the desk</span>
                <h2 className="mt-3 font-serif text-[34px] font-normal md:text-[38px]">
                  Notes on building &amp; growing D2C.
                </h2>
              </div>
              <Link href="/blog" className="flex items-center gap-2 text-sm hover:text-accent">
                Visit the blog <ArrowRightIcon size={14} />
              </Link>
            </MotionReveal>
            <div className="grid gap-10 md:grid-cols-3">
              {posts.items.slice(0, 3).map((post, i) => (
                <MotionReveal key={post.id} delay={i * 0.08}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="relative mb-5 aspect-[4/3] overflow-hidden border border-line bg-bg2">
                      {post.cover_image && (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          sizes="360px"
                        />
                      )}
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
                    <h3 className="mt-2.5 text-[19px] font-semibold leading-snug transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>
                  </Link>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      {isOn('cta') && (
        <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-bg2 to-accent-dim px-6 py-24 text-center md:px-16">
          <div
            className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]"
            aria-hidden="true"
          />
          <MotionReveal className="relative">
            <h2 className="mx-auto mb-4 max-w-[700px] font-serif text-3xl font-normal md:text-[44px]">
              Ready to grow like a brand we&apos;d build ourselves?
            </h2>
            <p className="mb-9 text-[16px] text-muted">
              30 minutes. No deck, no pitch — just a straight look at what&apos;s leaking in your funnel.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 bg-accent px-8 py-[17px] text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_8px_30px_-8px_var(--accent)]"
            >
              Book a Free Strategy Call <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </MotionReveal>
        </section>
      )}
    </main>
  );
}

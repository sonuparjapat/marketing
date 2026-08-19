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
  getBanners,
  getHomepageSections,
  getPublicSettings,
  sectionsMap,
} from '@/lib/api';
import { MotionReveal } from '@/components/MotionReveal';
import { CountUp } from '@/components/CountUp';
import { LogoMarquee } from '@/components/LogoMarquee';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import { HeroBannerSlider } from '@/components/HeroBannerSlider';
import { ArrowRightIcon, SERVICE_ICONS } from '@/components/icons';

export default async function HomePage() {
  const [services, caseStudies, testimonials, posts, stats, whyUs, logos, banners, sections, settings] = await Promise.all([
    getServices(),
    getCaseStudies(),
    getTestimonials(),
    getPosts(),
    getHomepageStats(),
    getWhyUs(),
    getClientLogos(),
    getBanners('hero'),
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
          <span className="hero-watermark hidden md:block">Growth</span>
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
                  className="group inline-flex items-center gap-2.5 bg-accent px-7 py-4 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:opacity-90 hover:shadow-[0_20px_40px_-14px_var(--accent)]"
                >
                  Get a Free Audit <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/work"
                  className="group inline-flex items-center gap-2.5 border border-line px-7 py-4 text-sm transition-all hover:-translate-y-1 hover:border-accent hover:text-accent"
                >
                  View Our Work <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionReveal>

            {featured && (
              <MotionReveal delay={0.15}>
                <div className="relative">
                  <div
                    className="dash-mock glass hidden md:block"
                    aria-hidden="true"
                  >
                    <div className="dash-mock-bar">
                      <span />
                      <span />
                      <span />
                      <span className="ml-2 text-[10px] tracking-wide text-faint">Live Dashboard</span>
                    </div>
                    <div className="dash-mock-body">
                      <svg viewBox="0 0 260 70" width="100%" height="70" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="oklch(0.8 0.14 85 / 0.35)" />
                            <stop offset="100%" stopColor="oklch(0.8 0.14 85 / 0)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,55 L30,48 L60,50 L90,32 L120,38 L150,20 L180,26 L210,10 L240,16 L260,4 L260,70 L0,70 Z"
                          fill="url(#dashFill)"
                        />
                        <path
                          d="M0,55 L30,48 L60,50 L90,32 L120,38 L150,20 L180,26 L210,10 L240,16 L260,4"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="dash-mock-chips">
                        <span>
                          <b>+64%</b>CTR
                        </span>
                        <span>
                          <b>2.1x</b>ROAS
                        </span>
                        <span>
                          <b>-29%</b>CPA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="glass glass-border-grad relative p-8 transition-transform duration-500 hover:-translate-y-1">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-accent">Real brand. Real results.</span>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
                      </span>
                    </div>
                    <div className="font-serif-italic text-accent mb-1 text-[46px]">
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
                </div>
              </MotionReveal>
            )}
          </div>
        </section>
      )}

      {/* BANNERS */}
      {isOn('banners') && banners.length > 0 && (
        <section className="border-b border-line px-6 py-16 md:px-16">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal>
              <HeroBannerSlider banners={banners} />
            </MotionReveal>
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {services.map((service, i) => {
                const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.target;
                const hue = (['gold', 'emerald', 'coral'] as const)[i % 3];
                return (
                  <MotionReveal key={service.id} delay={(i % 3) * 0.08}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="group glass relative block overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_36px_64px_-28px_rgba(0,0,0,0.7)]"
                    >
                      <span className="font-serif-italic absolute right-6 top-6 text-[13px] text-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className={`icon-badge ${hue}`}>
                        <Icon size={22} />
                      </div>
                      <h3 className="mb-2.5 mt-5 text-xl font-semibold transition-colors group-hover:text-accent">{service.title}</h3>
                      <p className="text-[14.5px] leading-relaxed text-muted">{service.short_description}</p>
                      <span className="mt-4 flex w-full items-center gap-1.5 border-t border-line-soft pt-3.5 text-[11px] uppercase tracking-wide text-accent">
                        Learn more
                        <ArrowRightIcon size={12} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </MotionReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* HOW WE WORK */}
      {isOn('process') && (
        <section className="border-b border-line px-6 py-20 md:px-16 md:py-24">
          <div className="mx-auto max-w-[1312px]">
            <MotionReveal className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-accent">How we work</span>
                <h2 className="mt-3 font-serif text-4xl font-normal md:text-[42px]">Four steps. No black box.</h2>
              </div>
              <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">
                You see exactly what we&apos;re doing and why — every step, every week, on the same dashboard we use.
              </p>
            </MotionReveal>
            <div className="relative pt-10">
              <div className="process-line hidden md:block" />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                {[
                  { n: '01', hue: 'gold', title: 'Audit & Diagnose', body: 'Full funnel teardown — spend, creative, landing pages, retention — in the first 7 days.' },
                  { n: '02', hue: 'emerald', title: 'Strategy & Roadmap', body: 'A 90-day plan with target CAC, ROAS and revenue milestones, agreed before we spend a rupee.' },
                  { n: '03', hue: 'coral', title: 'Build & Launch', body: 'Creative, landing pages and campaigns shipped by the same pod that wrote the strategy.' },
                  { n: '04', hue: 'gold', title: 'Scale & Optimize', body: "Weekly testing cycles compound what works and kill what doesn't — fast." },
                ].map((step, i) => (
                  <MotionReveal key={step.n} delay={i * 0.06} className="relative">
                    <div
                      className={`icon-badge ${step.hue} font-serif-italic mb-5 w-13! h-13! text-lg`}
                      style={{ borderRadius: '999px' }}
                    >
                      {step.n}
                    </div>
                    <h4 className="mb-2 text-base font-bold">{step.title}</h4>
                    <p className="text-[13.5px] leading-relaxed text-muted">{step.body}</p>
                  </MotionReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      {isOn('stats') && stats.length > 0 && (
        <section className="border-b border-line bg-gradient-to-b from-bg2 to-bg px-6 py-14 md:px-16">
          <div className="mx-auto grid max-w-[1312px] grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => {
              const hueClass = (['text-accent', 'text-accent-2', 'text-accent-3'] as const)[i % 3];
              return (
                <MotionReveal key={s.id} delay={i * 0.06} className={i > 0 ? 'md:border-l md:border-line-soft md:pl-8' : ''}>
                  <div className={`font-serif-italic text-4xl md:text-[44px] ${hueClass}`}>
                    <CountUp value={s.value} />
                  </div>
                  <div className="mt-1.5 text-[13px] text-muted">{s.label}</div>
                </MotionReveal>
              );
            })}
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
              <MotionReveal className="glass glass-border-grad relative mb-6 grid gap-12 overflow-hidden rounded-2xl p-8 md:grid-cols-2 md:p-12">
                <div
                  className="animate-drift pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-[90px]"
                  aria-hidden="true"
                />
                <div className="relative">
                  <span className="mb-5 inline-block rounded-full bg-gradient-to-r from-accent to-[oklch(0.68_0.15_60)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
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
                <div className="relative grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line-soft">
                  {featured.results_json.slice(0, 4).map((r) => (
                    <div key={r.metric} className="bg-bg p-6 transition-colors hover:bg-bg2">
                      <div className="font-serif-italic text-accent text-3xl">
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
                  className="group glass rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/35 hover:shadow-[0_36px_64px_-28px_rgba(0,0,0,0.7)]"
                >
                  <span className="text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
                  <h3 className="mb-5 mt-3 text-xl font-semibold transition-colors group-hover:text-accent">{cs.title}</h3>
                  <div className="mb-5 flex gap-6">
                    {cs.results_json.slice(0, 2).map((r) => (
                      <div key={r.metric}>
                        <div className="font-serif-italic text-accent text-[22px]">
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
                  <div
                    className={`group flex items-start gap-6 border-t border-line-soft py-5 transition-colors hover:border-accent/40 ${i === whyUs.length - 1 ? 'border-b' : ''}`}
                  >
                    <span className="font-serif-italic flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-soft text-[13px] text-accent transition-all group-hover:border-accent group-hover:bg-accent/10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="pt-0.5 text-[15.5px] leading-relaxed">{w.point}</p>
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
              <div className="glass glass-border-grad mx-auto max-w-[860px] rounded-2xl p-10 md:p-14">
                <TestimonialCarousel testimonials={testimonials} />
              </div>
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
              {posts.items.slice(0, 3).map((post, i) => {
                const hue = (['85', '165', '25'] as const)[i % 3];
                return (
                  <MotionReveal key={post.id} delay={i * 0.08}>
                    <Link href={`/blog/${post.slug}`} className="group block">
                      <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl border border-line-soft bg-bg2">
                        {post.cover_image ? (
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            sizes="360px"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                            style={{
                              background: `radial-gradient(120% 100% at 15% 10%, oklch(0.42 0.09 ${hue} / 0.9), transparent 60%), radial-gradient(90% 80% at 90% 90%, oklch(0.55 0.11 300 / 0.5), transparent 60%), linear-gradient(150deg, oklch(0.22 0.04 ${hue}), oklch(0.16 0.028 265))`,
                            }}
                          >
                            <svg className="blog-chart" viewBox="0 0 200 90" preserveAspectRatio="none">
                              <path
                                d="M0,50 L28,52 L56,34 L84,38 L112,20 L140,26 L168,14 L200,18"
                                fill="none"
                                stroke="oklch(1 0 0 / 0.5)"
                                strokeWidth={2}
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
                      <h3 className="mt-2.5 text-[19px] font-semibold leading-snug transition-colors group-hover:text-accent">
                        {post.title}
                      </h3>
                    </Link>
                  </MotionReveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      {isOn('cta') && (
        <section className="relative overflow-hidden border-b border-line px-6 py-24 text-center md:px-16">
          <div
            className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent/25 to-[oklch(0.55_0.11_300_/_0.2)] blur-[120px]"
            aria-hidden="true"
          />
          <MotionReveal className="glass glass-border-grad relative mx-auto max-w-[760px] rounded-2xl p-12 md:p-16">
            <h2 className="mx-auto mb-4 max-w-[700px] font-serif text-3xl font-normal md:text-[44px]">
              Ready to grow like a brand we&apos;d build ourselves?
            </h2>
            <p className="mb-9 text-[16px] text-muted">
              30 minutes. No deck, no pitch — just a straight look at what&apos;s leaking in your funnel.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 bg-accent px-8 py-[17px] text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:opacity-90 hover:shadow-[0_20px_40px_-14px_var(--accent)]"
            >
              Book a Free Strategy Call <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </MotionReveal>
        </section>
      )}
    </main>
  );
}

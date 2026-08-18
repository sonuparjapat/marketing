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
import { ArrowRightIcon, StarIcon, SERVICE_ICONS } from '@/components/icons';

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
          <div className="pointer-events-none absolute right-6 top-4 select-none font-serif-italic text-[220px] leading-none text-bg2 md:right-16 md:text-[280px]">
            01
          </div>
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
                  className="inline-flex items-center gap-2.5 bg-accent px-7 py-4 text-sm font-bold text-bg transition-opacity hover:opacity-90"
                >
                  Get a Free Audit <ArrowRightIcon size={16} />
                </Link>
                <Link
                  href="/work"
                  className="inline-flex items-center gap-2.5 border border-line px-7 py-4 text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  View Our Work <ArrowRightIcon size={16} />
                </Link>
              </div>
            </MotionReveal>

            {featured && (
              <MotionReveal delay={0.15}>
                <div className="relative border border-line bg-bg2 p-8">
                  <div className="pointer-events-none absolute inset-2 border border-accent-dim" />
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-accent">Real brand. Real results.</span>
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <div className="font-serif-italic mb-1 text-[46px]">
                    {featured.results_json[0]?.value || '—'}
                  </div>
                  <div className="mb-7 text-[13px] text-muted">
                    {featured.results_json[0]?.metric || 'Result'} — {featured.title}
                  </div>
                  {heroStats.length > 1 && (
                    <div className="grid grid-cols-2 gap-4 border-t border-line pt-5">
                      {heroStats.slice(1, 3).map((r) => (
                        <div key={r.metric}>
                          <div className="font-serif-italic text-[22px]">{r.value}</div>
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
        <section className="border-b border-line px-6 py-9 md:px-16">
          <div className="mx-auto flex max-w-[1312px] flex-wrap items-center gap-8 md:gap-12">
            <span className="whitespace-nowrap text-xs uppercase tracking-wider text-faint">Trusted by growing brands</span>
            <div className="flex flex-1 flex-wrap justify-between gap-6">
              {logos.map((logo) =>
                logo.logo_url ? (
                  <div key={logo.id} className="relative h-8 w-28 opacity-70 grayscale">
                    <Image src={logo.logo_url} alt={logo.name} fill className="object-contain object-left" sizes="112px" />
                  </div>
                ) : (
                  <span key={logo.id} className="font-serif-italic text-lg text-faint">
                    {logo.name}
                  </span>
                )
              )}
            </div>
          </div>
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
                      className={`group block border-b border-line py-9 pr-0 transition-colors hover:bg-bg2/50 md:pr-10 ${
                        isRightCol ? 'md:pl-10 md:pr-0' : 'md:border-r'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-serif-italic text-[13px] text-faint">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="mb-2.5 mt-2.5 text-xl font-semibold">{service.title}</h3>
                          <p className="max-w-[400px] text-[14.5px] leading-relaxed text-muted">
                            {service.short_description}
                          </p>
                        </div>
                        <Icon className="mt-1.5 shrink-0 text-accent transition-transform group-hover:translate-x-1" size={18} />
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
                <div className="font-serif-italic text-4xl text-accent md:text-[44px]">{s.value}</div>
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
                    <div key={r.metric} className="bg-bg p-6">
                      <div className="font-serif-italic text-3xl text-accent">{r.value}</div>
                      <div className="mt-1 text-xs text-faint">{r.metric}{r.label ? `, ${r.label}` : ''}</div>
                    </div>
                  ))}
                </div>
              </MotionReveal>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {others.map((cs, i) => (
                <MotionReveal key={cs.id} delay={i * 0.08} className="border border-line p-8 transition-colors hover:border-faint">
                  <span className="text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
                  <h3 className="mb-5 mt-3 text-xl font-semibold">{cs.title}</h3>
                  <div className="mb-5 flex gap-6">
                    {cs.results_json.slice(0, 2).map((r) => (
                      <div key={r.metric}>
                        <div className="font-serif-italic text-[22px] text-accent">{r.value}</div>
                        <div className="text-xs text-faint">{r.metric}</div>
                      </div>
                    ))}
                  </div>
                  <Link href={`/work/${cs.slug}`} className="text-[13px] hover:text-accent">
                    View case study &rarr;
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
            <div className="grid gap-px bg-line md:grid-cols-3">
              {testimonials.slice(0, 3).map((t, i) => (
                <MotionReveal key={t.id} delay={i * 0.08} className="bg-bg2 p-8">
                  <div className="mb-4 flex gap-1 text-accent">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <StarIcon key={idx} size={14} />
                    ))}
                  </div>
                  <p className="font-serif-italic mb-6 text-[17px] leading-relaxed">&ldquo;{t.review}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {t.client_photo ? (
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-line">
                        <Image src={t.client_photo} alt={t.client_name} fill className="object-cover" sizes="36px" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-xs font-bold text-accent">
                        {t.client_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-[13.5px] font-bold">{t.client_name}</div>
                      <div className="text-xs text-faint">
                        {[t.client_designation, t.client_company].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
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
                        <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="360px" />
                      )}
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
                    <h3 className="mt-2.5 text-[19px] font-semibold leading-snug group-hover:text-accent">
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
        <section className="border-b border-line bg-gradient-to-br from-bg2 to-accent-dim px-6 py-24 text-center md:px-16">
          <MotionReveal>
            <h2 className="mx-auto mb-4 max-w-[700px] font-serif text-3xl font-normal md:text-[44px]">
              Ready to grow like a brand we&apos;d build ourselves?
            </h2>
            <p className="mb-9 text-[16px] text-muted">
              30 minutes. No deck, no pitch — just a straight look at what&apos;s leaking in your funnel.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 bg-accent px-8 py-[17px] text-sm font-bold text-bg transition-opacity hover:opacity-90"
            >
              Book a Free Strategy Call <ArrowRightIcon size={16} />
            </Link>
          </MotionReveal>
        </section>
      )}
    </main>
  );
}

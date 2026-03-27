"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  School, Users, BookOpen, BarChart3, Shield, Globe,
  ArrowRight, CheckCircle2, Sparkles, Star, Zap,
  TrendingUp, Award, ChevronRight, Play,
  GraduationCap, Building2, HeartHandshake, Layers
} from "lucide-react"
import { PublicServicesSection } from "@/components/services/public-services-section"
import { DemoBookingModal } from "@/components/demo/demo-booking-modal"
import { useSiteSettings } from "@/lib/site-settings-context"
import "./landing-animations.css"

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  { icon: Users,    title: "Student Management",  description: "Complete lifecycle from admission to graduation with smart automation.", color: "from-violet-500/20 to-indigo-500/10", iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400", iconHover: "group-hover:bg-violet-500" },
  { icon: BookOpen, title: "Academic Management", description: "Classes, subjects, exams, and results in one unified workspace.",          color: "from-indigo-500/20 to-blue-500/10",   iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", iconHover: "group-hover:bg-indigo-500" },
  { icon: BarChart3,title: "Analytics & Reports",  description: "Real-time dashboards and deep insights for data-driven decisions.",       color: "from-cyan-500/20 to-sky-500/10",      iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",     iconHover: "group-hover:bg-cyan-500" },
  { icon: Shield,   title: "Secure & Reliable",   description: "Enterprise-grade security with granular role-based access control.",      color: "from-emerald-500/20 to-teal-500/10", iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", iconHover: "group-hover:bg-emerald-500" },
  { icon: Globe,    title: "Multi-Language",       description: "Seamless support for multiple languages with instant switching.",         color: "from-pink-500/20 to-rose-500/10",    iconBg: "bg-pink-500/15 text-pink-600 dark:text-pink-400",     iconHover: "group-hover:bg-pink-500" },
  { icon: Zap,      title: "Automation",           description: "Automate attendance, fees, notifications and routine workflows.",         color: "from-amber-500/20 to-orange-500/10", iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",  iconHover: "group-hover:bg-amber-500" },
]

const stats = [
  { value: "500+",  label: "Active Schools",   icon: Building2,     color: "text-violet-500",  bg: "bg-violet-500/10 group-hover:bg-violet-500" },
  { value: "50K+",  label: "Students Managed", icon: GraduationCap, color: "text-indigo-500",  bg: "bg-indigo-500/10 group-hover:bg-indigo-500" },
  { value: "99.9%", label: "Uptime SLA",        icon: TrendingUp,    color: "text-cyan-500",    bg: "bg-cyan-500/10 group-hover:bg-cyan-500" },
  { value: "24/7",  label: "Expert Support",    icon: HeartHandshake,color: "text-emerald-500", bg: "bg-emerald-500/10 group-hover:bg-emerald-500" },
]

const testimonials = [
  { name: "Sarah Johnson",  role: "Principal, Greenwood Academy",   text: "Transformed how we manage 2,000+ students. The automation alone saves us 10 hours a week.", avatar: "SJ", rating: 5, color: "from-violet-500 to-indigo-500" },
  { name: "Michael Chen",   role: "Admin Director, Sunrise School", text: "The analytics dashboard gives us insights we never had before. Absolutely game-changing.",   avatar: "MC", rating: 5, color: "from-indigo-500 to-cyan-500" },
  { name: "Priya Sharma",   role: "IT Head, Delhi Public School",   text: "Setup was seamless. The multi-language support is perfect for our diverse community.",        avatar: "PS", rating: 5, color: "from-cyan-500 to-emerald-500" },
  { name: "James Williams", role: "CFO, Westside Institute",        text: "Fee collection and financial reports are now fully automated. Zero manual errors.",           avatar: "JW", rating: 5, color: "from-emerald-500 to-teal-500" },
  { name: "Aisha Patel",    role: "Vice Principal, Horizon School", text: "Parent communication has improved dramatically. Everyone loves the portal.",                  avatar: "AP", rating: 5, color: "from-pink-500 to-rose-500" },
  { name: "David Kim",      role: "Founder, EduTech Academy",       text: "Best school ERP we've tried. The support team is incredibly responsive.",                     avatar: "DK", rating: 5, color: "from-amber-500 to-orange-500" },
]

const logos = [
  "Greenwood Academy","Sunrise School","Delhi Public","Westside Institute",
  "Horizon School","EduTech Academy","Bright Minds","Future Leaders",
  "Global School","Star Academy","Pioneer Institute","Excel School",
]

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=700&q=80", label: "Student Dashboard" },
  { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=80", label: "Classroom Management" },
  { src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=700&q=80", label: "Analytics Reports" },
  { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=80", label: "Fee Management" },
  { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&q=80", label: "Staff Portal" },
  { src: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=700&q=80", label: "Exam Results" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [isDemoOpen, setIsDemoOpen]     = useState(false)
  const [activeGallery, setActiveGallery] = useState(0)
  const site = useSiteSettings()

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed") }),
      { threshold: 0.1 }
    )
    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
      .forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Gallery auto-rotate
  useEffect(() => {
    const t = setInterval(() => setActiveGallery(p => (p + 1) % galleryImages.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ── Ambient gradient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-500/8 blur-[120px] animate-float-1" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[120px] animate-float-2" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px] animate-float-3" />
      </div>

      {/* ── Grid ── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-30" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="bg-brand-gradient p-1.5 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-brand">
              {site.site_logo_url
                ? <img src={site.site_logo_url} alt={site.site_name} className="h-5 w-5 object-contain" />
                : <School className="h-5 w-5 text-white" />}
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-gradient">{site.site_name}</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {[["#features","Features"],["#gallery","Gallery"],["#testimonials","Reviews"],["/pricing","Pricing"]].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-foreground transition-colors relative group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-brand-gradient group-hover:w-full transition-all duration-300 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-brand-gradient text-white border-0 shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5 transition-all duration-200">
                Get Started <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative container mx-auto px-6 pt-24 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="animate-fade-in-up opacity-0-init">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-brand-gradient-soft border border-violet-500/20 text-violet-600 dark:text-violet-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                Trusted by 500+ Institutions Worldwide
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up delay-100 opacity-0-init text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tighter">
              Manage Your School<br />
              <span className="text-brand-gradient animate-gradient">With Intelligence.</span>
            </h1>

            <p className="animate-fade-in-up delay-200 opacity-0-init max-w-lg text-lg text-muted-foreground leading-relaxed">
              The next-generation school ERP. Automate attendance, simplify fee collection,
              and unlock deep insights — all from one AI-ready platform.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up delay-300 opacity-0-init flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="h-13 px-8 text-base font-semibold bg-brand-gradient text-white border-0 shadow-brand-lg hover:shadow-brand hover:-translate-y-1 transition-all duration-200 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg" variant="outline"
                className="h-13 px-8 text-base border-2 border-violet-500/30 hover:bg-violet-500/8 hover:border-violet-500/60 hover:-translate-y-1 transition-all duration-200 group"
                onClick={() => setIsDemoOpen(true)}
              >
                <Play className="mr-2 h-4 w-4 fill-current text-violet-500 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust row */}
            <div className="animate-fade-in-up delay-400 opacity-0-init flex flex-wrap items-center gap-5 pt-2">
              {["No credit card","Free 30-day trial","Cancel anytime"].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — 3D Hero Card */}
          <div className="relative animate-fade-in-left opacity-0-init">
            {/* Glow halo */}
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-violet-500/20 via-indigo-500/15 to-cyan-500/20 blur-3xl animate-pulse-slow" />

            <div className="card-3d relative rounded-2xl border border-violet-500/20 bg-card/70 p-3 shadow-2xl backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1170&auto=format&fit=crop"
                alt="School Dashboard"
                className="rounded-xl w-full object-cover shadow-inner"
              />

              {/* Floating card — revenue */}
              <div className="absolute -bottom-5 -left-5 glass-strong rounded-xl p-3.5 shadow-2xl animate-bounce-slow border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-full">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">+$12,450</p>
                  </div>
                </div>
              </div>

              {/* Floating card — students */}
              <div className="absolute -top-5 -right-5 glass-strong rounded-xl p-3.5 shadow-2xl animate-float-3 border border-violet-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-violet-500 to-indigo-500 p-2 rounded-full">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Students</p>
                    <p className="text-base font-bold text-violet-600 dark:text-violet-400">2,847</p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute top-1/2 -right-8 glass rounded-lg px-3 py-2 shadow-xl animate-float-1 border border-amber-500/20">
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold">Top Rated ERP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo Marquee ── */}
      <section className="py-12 border-y border-border/40 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Trusted by leading institutions
        </p>
        <div className="marquee-container">
          <div className="marquee-track gap-4">
            {[...logos, ...logos].map((logo, i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-2 rounded-full border border-border/50 bg-card/60 whitespace-nowrap hover:border-violet-500/40 hover:bg-violet-500/5 transition-all cursor-default">
                <School className="h-3.5 w-3.5 text-violet-500 opacity-70" />
                <span className="text-sm font-medium text-muted-foreground">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map(({ value, label, icon: Icon, color, bg }, i) => (
            <div
              key={i}
              className="reveal reveal-scale group text-center p-6 rounded-2xl border border-border/50 bg-card/60 hover:border-transparent transition-all duration-300 card-3d-subtle hover:shadow-brand"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-all duration-300 ${bg} group-hover:text-white`}>
                <Icon className={`h-6 w-6 ${color} group-hover:text-white transition-colors`} />
              </div>
              <div className={`text-4xl font-extrabold mb-1 ${color}`}>{value}</div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="container mx-auto px-6 py-24 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
            <Layers className="h-4 w-4" /> All-in-One Platform
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold">Everything in one place</h2>
          <p className="text-muted-foreground text-lg">No more juggling multiple apps. Every tool your administration needs, built from the ground up.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, color, iconBg, iconHover }, i) => (
            <div
              key={i}
              className={`reveal group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-6 hover:border-transparent transition-all duration-300 card-3d hover-lift hover:shadow-brand`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {/* Gradient bg on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className={`mb-4 inline-flex p-3 rounded-xl transition-all duration-300 ${iconBg} ${iconHover} group-hover:text-white group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer pointer-events-none" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="container mx-auto px-6 py-24 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-600 dark:text-cyan-400 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Platform Preview
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold">See it in action</h2>
          <p className="text-muted-foreground text-lg">A glimpse of what your school management experience looks like.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 items-start">
          {/* Main image */}
          <div className="lg:col-span-3 reveal-left">
            <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-500/10 group">
              <img
                src={galleryImages[activeGallery].src}
                alt={galleryImages[activeGallery].label}
                className="w-full h-80 lg:h-[420px] object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-white font-semibold text-lg drop-shadow">{galleryImages[activeGallery].label}</span>
                <div className="flex gap-1.5">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveGallery(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeGallery ? "w-6 bg-gradient-to-r from-violet-400 to-cyan-400" : "w-1.5 bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-3 reveal-right">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveGallery(i)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${i === activeGallery ? "border-violet-500 shadow-lg shadow-violet-500/30" : "border-border/50 hover:border-violet-500/40"}`}
              >
                <img src={img.src} alt={img.label} className="w-full h-24 object-cover" />
                <div className={`absolute inset-0 transition-opacity duration-300 ${i === activeGallery ? "bg-gradient-to-br from-violet-500/30 to-cyan-500/20" : "bg-transparent"}`} />
                {i === activeGallery && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center shadow-brand">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <PublicServicesSection />

      {/* ── Testimonials Marquee ── */}
      <section id="testimonials" className="py-24 border-t border-border/40 overflow-hidden">
        <div className="container mx-auto px-6 mb-12 text-center reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400 text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-current" /> Loved by Educators
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-4">What schools are saying</h2>
        </div>

        {/* Row 1 — forward */}
        <div className="marquee-container mb-4">
          <div className="marquee-track gap-4">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-80 flex-shrink-0 rounded-2xl border border-border/50 bg-card/70 p-5 glass hover:border-violet-500/30 transition-all duration-300 card-3d-subtle">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — reverse */}
        <div className="marquee-container">
          <div className="marquee-track-reverse gap-4">
            {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => (
              <div key={i} className="w-80 flex-shrink-0 rounded-2xl border border-border/50 bg-card/70 p-5 glass hover:border-cyan-500/30 transition-all duration-300 card-3d-subtle">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-6 py-24 border-t border-border/40">
        <div className="relative overflow-hidden rounded-3xl p-12 lg:p-20 text-center reveal-scale">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-indigo-500/10 to-cyan-500/15 rounded-3xl" />
          <div className="absolute inset-0 border border-violet-500/20 rounded-3xl" />

          {/* Animated orbs */}
          <div className="pointer-events-none absolute top-0 left-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl animate-float-1" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-500/12 blur-3xl animate-float-2" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/8 blur-3xl animate-float-3" />
          <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-20 rounded-3xl" />

          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Ready to Transform Your School?
            </span>
            <h2 className="text-3xl lg:text-6xl font-extrabold tracking-tight">
              Start Your{" "}
              <span className="text-brand-gradient animate-gradient">Free Trial</span>{" "}
              Today
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
              One ERP for schools, businesses, trusts, and NGOs — streamline operations from a single intelligent dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg font-semibold bg-brand-gradient text-white border-0 shadow-brand-lg hover:shadow-brand hover:-translate-y-1 transition-all duration-200 group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg" variant="outline"
                className="h-14 px-10 text-lg border-2 border-violet-500/30 hover:bg-violet-500/8 hover:border-violet-500/60 hover:-translate-y-1 transition-all duration-200"
                onClick={() => setIsDemoOpen(true)}
              >
                Schedule a Demo
              </Button>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap justify-center gap-10 pt-6">
              {stats.map(({ value, label, color }, i) => (
                <div key={i} className="text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-gradient p-1 rounded-lg shadow-brand">
              <School className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-brand-gradient">{site.site_name}</span>
          </div>
          <p>© {new Date().getFullYear()} {site.site_name}. All rights reserved.</p>
          <div className="flex gap-6">
            {[["/pricing","Pricing"],["/login","Login"],["/register","Register"]].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-violet-500 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </footer>

      <DemoBookingModal open={isDemoOpen} onOpenChange={setIsDemoOpen} />
    </div>
  )
}

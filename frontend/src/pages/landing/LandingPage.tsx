import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MessageCircle, Users, Shield, Zap, Globe, Heart } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: MessageCircle,
    title: 'Real-time Messaging',
    description: 'Chat instantly with WebSocket-powered direct messages that feel alive.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Create and join communities around shared interests and passions.',
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'AI Moderation',
    description: 'Smart content moderation powered by AI keeps every space safe.',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Rich Media',
    description: 'Share text, images, and videos — your story in every format.',
    gradient: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Globe,
    title: 'Open Platform',
    description: 'Connect with curious people from anywhere in the world.',
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Heart,
    title: 'Express Yourself',
    description: 'React, comment, and bookmark posts that inspire you.',
    gradient: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-500/10',
  },
]

const stats = [
  { value: '10K+', label: 'Active Learners' },
  { value: '500+', label: 'Communities' },
  { value: '50K+', label: 'Posts Shared' },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-word', {
        y: 60,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2,
      })

      gsap.from('.hero-sub', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.7,
      })

      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.9,
      })

      gsap.to('.orb-1', {
        y: -30,
        x: 20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.orb-2', {
        y: 25,
        x: -15,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      })

      ScrollTrigger.create({
        trigger: '.features-section',
        start: 'top 80%',
        onEnter: () => {
          gsap.from('.feature-card', {
            y: 40,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: 'power2.out',
          })
        },
        once: true,
      })

      ScrollTrigger.create({
        trigger: '.stats-section',
        start: 'top 85%',
        onEnter: () => {
          gsap.from('.stat-item', {
            y: 20,
            opacity: 0,
            stagger: 0.12,
            duration: 0.5,
            ease: 'power2.out',
          })
        },
        once: true,
      })

      ScrollTrigger.create({
        trigger: '.cta-section',
        start: 'top 85%',
        onEnter: () => {
          gsap.from('.cta-content', {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
          })
        },
        once: true,
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-bg-primary/85 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-white font-black text-sm">V</span>
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">Voyage</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="btn-gradient text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
        {/* Background orbs */}
        <div className="orb-1 absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="orb-2 absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 chip-muted mb-8 py-1.5 px-4 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium">Open platform for curious minds</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-text-primary mb-6 leading-tight tracking-tighter">
            {['Learn.', 'Share.', 'Voyage.'].map((word, i) => (
              <span key={word} className="hero-word inline-block mr-3 sm:mr-4">
                {i === 1 ? <span className="gradient-text">{word}</span> : word}
              </span>
            ))}
          </h1>

          <p className="hero-sub text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A social platform built for genuine connections and learning. Share your journey,
            discover communities, and engage with people who matter — in real time.
          </p>

          <div className="hero-cta flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="btn-gradient text-base px-8 py-3 rounded-2xl"
            >
              Start your journey →
            </Link>
            <Link
              to="/login"
              className="bg-bg-card/80 backdrop-blur border border-border text-text-primary font-semibold text-base px-8 py-3 rounded-2xl hover:bg-surface-hover hover:border-border/80 active:scale-95 transition-all duration-150"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 grid grid-cols-3 gap-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="stat-item text-center py-2">
                <p className="text-3xl font-black gradient-text">{value}</p>
                <p className="text-xs text-text-muted mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">
              Everything you need to connect
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              Built with modern technology to give you the best social learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, gradient, bg }) => (
              <div
                key={title}
                className="feature-card card p-6 space-y-4 transition-all duration-200 hover:shadow-md hover:shadow-black/[0.06] hover:-translate-y-0.5"
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1.5">{title}</h3>
                  <p className="text-sm text-text-secondary leading-[1.7]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-24 px-6">
        <div className="cta-content max-w-2xl mx-auto text-center">
          <div className="card p-12 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-violet-500/8 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Ready to start your <span className="gradient-text">Voyage</span>?
              </h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Join thousands of curious minds already on Voyage. It&apos;s free — always will be.
              </p>
              <Link
                to="/register"
                className="btn-gradient text-base px-10 py-3 rounded-2xl inline-block"
              >
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-text-muted">
        <p>© 2026 Voyage. Built for curious minds everywhere.</p>
      </footer>
    </div>
  )
}

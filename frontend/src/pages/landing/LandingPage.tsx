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
    description: 'Chat instantly with WebSocket-powered direct messages.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Create and join communities around shared interests.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Shield,
    title: 'AI Moderation',
    description: 'Smart content moderation keeps the community safe.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: Zap,
    title: 'Rich Media',
    description: 'Share text, images, and videos with your followers.',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    icon: Globe,
    title: 'Open Platform',
    description: 'Connect with people from anywhere in the world.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Heart,
    title: 'Express Reactions',
    description: 'React with 6 emotions to any post on the platform.',
    color: 'bg-red-500/10 text-red-500',
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text stagger
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

      // Floating orbs
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

      // Features scroll trigger
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

      // CTA section
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-bg-primary/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-lg font-bold text-text-primary">Voyage</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
        {/* Background orbs */}
        <div className="orb-1 absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="orb-2 absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-text-primary mb-6 leading-tight tracking-tight">
            {['Connect.', 'Share.', 'Voyage.'].map((word) => (
              <span key={word} className="hero-word inline-block mr-4">{word}</span>
            ))}
          </h1>

          <p className="hero-sub text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A social platform built for genuine connections. Share your journey, discover
            communities, and engage with people who matter — in real time.
          </p>

          <div className="hero-cta flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="btn-primary text-base px-8 py-3 rounded-2xl shadow-lg shadow-accent/25"
            >
              Start your journey →
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-base px-8 py-3 rounded-2xl"
            >
              Sign in
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-cta mt-16 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[
              { value: 'Free', label: 'Forever' },
              { value: 'AI', label: 'Moderated' },
              { value: 'Live', label: 'Messaging' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-accent">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything you need to connect
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Built with modern technology to give you the best social experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="feature-card card-hover p-6 space-y-4"
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-24 px-6">
        <div className="cta-content max-w-2xl mx-auto text-center">
          <div className="card p-10 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-purple-500/5 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                Ready to start your journey?
              </h2>
              <p className="text-text-secondary mb-6">
                Join thousands of people already on Voyage. It's free — always will be.
              </p>
              <Link
                to="/register"
                className="btn-primary text-base px-10 py-3 rounded-2xl inline-block shadow-lg shadow-accent/20"
              >
                Create your account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-text-muted">
        <p>© 2026 Voyage. Built with ❤️ and Django + React.</p>
      </footer>
    </div>
  )
}

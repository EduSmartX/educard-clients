import { useRef } from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  Shield,
  BarChart3,
  Bell,
  Quote,
  Star,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { COMPANY_NAME, ROUTES } from '@/constants/app-config';
import { BRANDING } from '@/constants/branding';
import heroImage from '/assets/images/hero-illustration.png';

// --- Reusable animated wrapper that reveals on scroll ---
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Staggered children animation ---
function StaggerContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerItem = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

// --- Counter animation ---
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
    >
      {target}
      {suffix}
    </motion.span>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description:
        'Efficiently manage student records, enrollment, and academic progress in one centralized system.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: GraduationCap,
      title: 'Teacher Portal',
      description:
        'Empower teachers with tools for attendance tracking, grade management, and parent communication.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: CalendarCheck,
      title: 'Attendance Tracking',
      description:
        'Real-time attendance monitoring with automated notifications for parents and administrators.',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: ClipboardList,
      title: 'Leave Management',
      description:
        'Streamlined leave request and approval system for both students and staff members.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: BookOpen,
      title: 'Class Scheduling',
      description:
        'Create and manage class schedules, subject allocations, and academic calendars effortlessly.',
      color: 'from-blue-600 to-indigo-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Comprehensive dashboards and reports for data-driven decision making.',
      color: 'from-purple-500 to-blue-500',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Automated alerts and notifications keep everyone informed and connected.',
      color: 'from-emerald-600 to-green-500',
    },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Principal',
      school: 'Springfield High School',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      rating: 5,
      review:
        'EduCard has revolutionized how we manage our school. The attendance tracking and parent communication features have saved us countless hours.',
    },
    {
      name: 'Michael Chen',
      role: 'IT Administrator',
      school: 'Riverside Academy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      rating: 5,
      review:
        'The implementation was seamless, and the support team was exceptional. Our teachers adapted to the platform within days.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Vice Principal',
      school: 'Oakwood Elementary',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      rating: 5,
      review:
        "We've seen a 40% reduction in administrative overhead since adopting EduCard. The leave management system alone has paid for itself.",
    },
    {
      name: 'James Williams',
      role: 'School Director',
      school: 'Greenfield International',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      rating: 5,
      review:
        'Outstanding platform! The mobile app keeps parents engaged and informed. Student attendance has improved significantly.',
    },
    {
      name: 'Dr. Priya Patel',
      role: 'Academic Coordinator',
      school: 'Hillside Academy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
      rating: 5,
      review:
        "EduCard's class scheduling feature has eliminated conflicts and confusion. Teachers love the intuitive interface.",
    },
    {
      name: 'Robert Anderson',
      role: 'Superintendent',
      school: 'Metro School District',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
      rating: 5,
      review:
        'We rolled out EduCard across 12 schools in our district. The centralized management and reporting capabilities are transformative.',
    },
  ];

  const highlights = [
    'Multi-tenant architecture — each school gets its own secure space',
    'Role-based dashboards for Admins, Teachers, Students & Parents',
    'Real-time attendance with automatic absence notifications',
    'Complete leave management with approval workflows',
    'Academic year, holiday calendar & working day policies',
  ];

  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* ─── HERO SECTION — Parallax + Fade ─── */}
      <div ref={heroRef} className="relative min-h-[100vh] w-full overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/40" />

        {/* Floating decorative orbs */}
        <motion.div
          className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-blue-200/30 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[10%] bottom-20 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 mx-auto flex min-h-[100vh] max-w-7xl flex-col items-center justify-center gap-12 px-6 lg:flex-row lg:gap-16 lg:px-12">
          {/* Left Content */}
          <motion.div style={{ opacity: heroOpacity }} className="flex-1 space-y-8 pt-20 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Smarter Learning, Simplified
              </div>

              <h1 className="text-foreground font-serif text-4xl leading-[1.1] font-bold tracking-tight lg:text-5xl xl:text-6xl">
                Empower Your{' '}
                <span className="bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Educational
                </span>{' '}
                Journey
              </h1>

              <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
                A unified platform connecting students, educators, and parents through intelligent
                tools for learning, communication, and administration.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button
                variant="brand"
                size="lg"
                className="group h-14 px-8 text-base shadow-lg shadow-teal-500/20 transition-shadow hover:shadow-xl hover:shadow-teal-500/30"
                onClick={() => navigate(ROUTES.AUTH.SIGNUP)}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="brandOutline"
                size="lg"
                className="h-14 px-8 text-base"
                onClick={scrollToFeatures}
              >
                Explore Features
              </Button>
            </motion.div>

            {/* Stats with counter animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-3 gap-8 pt-4"
            >
              {[
                {
                  value: '20K',
                  suffix: '+',
                  label: 'Active Users',
                  gradient: 'from-blue-600 to-emerald-500',
                },
                {
                  value: '1K',
                  suffix: '+',
                  label: 'Educators',
                  gradient: 'from-emerald-500 to-teal-500',
                },
                {
                  value: '100',
                  suffix: '+',
                  label: 'Institutions',
                  gradient: 'from-teal-500 to-blue-500',
                },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div
                    className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-3xl font-bold text-transparent lg:text-4xl`}
                  >
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-muted-foreground text-xs font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Floating Hero Image with Parallax */}
          <motion.div
            style={{ y: heroImageY }}
            className="relative hidden flex-1 lg:flex lg:items-center lg:justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow behind image */}
              <div className="absolute inset-0 -z-10 translate-y-8 scale-90 rounded-3xl bg-gradient-to-br from-blue-400/20 to-emerald-400/20 blur-3xl" />
              <motion.img
                src={heroImage}
                alt={`${COMPANY_NAME} Platform`}
                className="h-auto w-full max-w-xl object-contain drop-shadow-2xl"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <button
            onClick={scrollToFeatures}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </motion.div>
      </div>

      {/* ─── FEATURES SECTION — Staggered grid reveal ─── */}
      <div id="features-section" className="bg-muted/30 w-full px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection className="mb-16 text-center">
            <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
              Powerful Features
            </p>
            <h2 className="text-foreground mb-4 font-serif text-3xl font-bold lg:text-5xl">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base lg:text-lg">
              Our comprehensive platform provides all the tools you need to streamline operations
              and enhance the educational experience.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="group relative h-full overflow-hidden border-2 transition-all duration-300 hover:shadow-xl">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <CardHeader className="relative z-10 pb-3">
                      <div
                        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg transition-colors duration-300 group-hover:text-white">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-sm leading-relaxed transition-colors duration-300 group-hover:text-white/80">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </StaggerContainer>
        </div>
      </div>

      {/* ─── WHY CHOOSE US — Slide in from sides ─── */}
      <div className="bg-background w-full px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Image with float */}
            <AnimatedSection>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-100/50 to-emerald-100/50 blur-2xl" />
                <motion.img
                  src={heroImage}
                  alt="Platform Overview"
                  className="relative rounded-2xl object-contain drop-shadow-lg"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </AnimatedSection>

            {/* Right — Content */}
            <div className="space-y-8">
              <AnimatedSection>
                <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
                  Why {COMPANY_NAME}
                </p>
                <h2 className="text-foreground mb-4 font-serif text-3xl font-bold lg:text-4xl">
                  Built for Modern Educational Institutions
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  From small schools to large districts, {COMPANY_NAME} scales with your needs. Our
                  multi-tenant architecture ensures every institution gets a secure, private space.
                </p>
              </AnimatedSection>

              <StaggerContainer className="space-y-4">
                {highlights.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    whileHover={{ x: 8 }}
                    className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-emerald-50 to-transparent p-3 transition-colors hover:from-emerald-100"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-foreground text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TESTIMONIALS — Carousel with scroll reveal ─── */}
      <div className="bg-muted/30 w-full px-6 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection className="mb-16 text-center">
            <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
              Testimonials
            </p>
            <h2 className="text-foreground mb-4 font-serif text-3xl font-bold lg:text-5xl">
              Loved by Schools Worldwide
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base lg:text-lg">
              See what educators are saying about their experience with {COMPANY_NAME}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      className="p-2"
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="h-full border-2 transition-all duration-300 hover:shadow-xl">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="border-primary/20 h-12 w-12 border-2">
                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                <AvatarFallback>
                                  {testimonial.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-foreground text-sm font-semibold">
                                  {testimonial.name}
                                </h4>
                                <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                                <p className="text-primary text-[10px] font-medium">
                                  {testimonial.school}
                                </p>
                              </div>
                            </div>
                            <Quote className="text-primary/20 h-6 w-6" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-0.5">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            &ldquo;{testimonial.review}&rdquo;
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </AnimatedSection>
        </div>
      </div>

      {/* ─── CTA SECTION — Dramatic reveal ─── */}
      <AnimatedSection>
        <div className="relative w-full overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-blue-700 px-6 py-24 lg:px-16">
          {/* Decorative */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
            <div className="absolute right-10 bottom-10 h-60 w-60 rounded-full bg-white blur-3xl" />
          </div>
          <motion.div
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.05, 0.15] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-6 font-serif text-3xl font-bold text-white lg:text-5xl"
            >
              Ready to Transform Your School?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-10 max-w-2xl text-lg text-white/90"
            >
              Join hundreds of schools already using {COMPANY_NAME} to improve their operations and
              enhance the learning experience.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col items-center gap-4 sm:flex-row"
            >
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-base shadow-lg"
                onClick={() => navigate(ROUTES.AUTH.SIGNUP)}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:text-primary h-14 border-2 border-white bg-transparent px-10 text-base text-white hover:bg-white"
                onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              >
                Schedule a Demo
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background border-t px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="text-primary h-8 w-8" />
              <span className="text-xl font-bold">{COMPANY_NAME}</span>
            </div>
            <p className="text-muted-foreground text-center text-sm">{BRANDING.COPYRIGHT.TEXT}</p>
            <div className="flex flex-wrap justify-center gap-6">
              {['Privacy Policy', 'Terms of Service', 'Contact'].map((link) => (
                <button
                  key={link}
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>
            {BRANDING.CONTACT.EMAIL && (
              <a
                href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                className="text-primary text-sm hover:underline"
              >
                {BRANDING.CONTACT.EMAIL}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

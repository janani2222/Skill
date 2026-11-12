import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import {
  UserPlus,
  Users,
  Code2,
  TrendingUp,
  Compass,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  Award,
  BookOpen,
} from 'lucide-react';
import { getPlatformStatistics } from '../services/studentService';

const LandingPage = () => {
  const [stats, setStats] = useState({
    studentsRegistered: 0,
    projectsCreated: 0,
    skillsListed: 0,
    departmentsConnected: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getPlatformStatistics();
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load platform stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="landing-page">
      <Navbar />

      {/* 1. HERO SECTION (Mirroring Reference Design) */}
      <section
        className="university-hero"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&auto=format&fit=crop')`,
        }}
      >
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="hero-subtag">SkillBridge Collegiate Platform</span>
          <h1 className="hero-title">Connect. Collaborate. Grow Together.</h1>
          <p className="hero-description">
            A premier platform for college students to discover skills, find visionary
            teammates, and build groundbreaking academic and technical projects.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-gold">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-hero-learn">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* 2. FOUR OVERLAPPING FEATURE CARDS */}
      <section className="hero-feature-cards-section" id="about">
        <div className="container">
          <div className="feature-cards-grid">
            <FeatureCard
              icon={UserPlus}
              stepNumber="1"
              title="Create Your Profile"
              description="Showcase your technical skills, interests, and GitHub repositories to the collegiate community."
            />
            <FeatureCard
              icon={Users}
              stepNumber="2"
              title="Discover Students"
              description="Find like-minded peers across engineering departments with complementary technical proficiencies."
            />
            <FeatureCard
              icon={Code2}
              stepNumber="3"
              title="Build Projects"
              description="Turn your ideas into reality by forming balanced interdisciplinary project teams."
            />
            <FeatureCard
              icon={TrendingUp}
              stepNumber="4"
              title="Grow Together"
              description="Improve through peer review, code collaboration, and shared technical achievements."
            />
          </div>
        </div>
      </section>

      {/* 3. NAVY SECTION: EXPLORE OUR PROGRAMS & STATISTICS */}
      <section className="navy-programs-section" id="programs">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-tag">Institutional Ecosystem</span>
            <h2 className="section-title-white">EXPLORE OUR PROGRAMS</h2>
            <div className="gold-divider center" />
            <p className="section-subtitle-white">
              Bridging academic theory with hands-on development through institutional student collaboration.
            </p>
          </div>

          {/* DYNAMIC STATISTICS ROW */}
          <div className="stats-banner-row">
            <div className="stat-metric-item">
              <span className="stat-metric-number">
                {loadingStats ? '...' : `${stats.studentsRegistered}`}
              </span>
              <span className="stat-metric-label">Students Registered</span>
            </div>
            <div className="stat-metric-item">
              <span className="stat-metric-number">
                {loadingStats ? '...' : `${stats.projectsCreated}`}
              </span>
              <span className="stat-metric-label">Projects Created</span>
            </div>
            <div className="stat-metric-item">
              <span className="stat-metric-number">
                {loadingStats ? '...' : `${stats.skillsListed}`}
              </span>
              <span className="stat-metric-label">Skills Listed</span>
            </div>
            <div className="stat-metric-item">
              <span className="stat-metric-number">
                {loadingStats ? '...' : `${stats.departmentsConnected}`}
              </span>
              <span className="stat-metric-label">Departments Connected</span>
            </div>
          </div>

          {/* FOUR PROGRAM CARDS (MATCHING REFERENCE UNIVERSITY DESIGN) */}
          <div className="program-cards-grid">
            {/* Card 1: Skill Discovery */}
            <div className="program-card">
              <div className="program-card-image">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop"
                  alt="Skill Discovery"
                />
                <span className="program-badge">Discovery</span>
              </div>
              <div className="program-card-content">
                <h3 className="program-card-title">Skill Discovery</h3>
                <p className="program-card-desc">
                  Browse verified student capabilities across MERN stack, Artificial Intelligence, Mobile Apps, and Cloud Computing.
                </p>
                <Link to="/register" className="program-card-link">
                  Explore Directory <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Card 2: Project Collaboration */}
            <div className="program-card">
              <div className="program-card-image">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600&auto=format&fit=crop"
                  alt="Project Collaboration"
                />
                <span className="program-badge">Collaboration</span>
              </div>
              <div className="program-card-content">
                <h3 className="program-card-title">Project Collaboration</h3>
                <p className="program-card-desc">
                  Recruit co-developers, designers, and testers for your capstone and final year collegiate projects.
                </p>
                <Link to="/register" className="program-card-link">
                  Find Teammates <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Card 3: Community Growth */}
            <div className="program-card">
              <div className="program-card-image">
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop"
                  alt="Community Growth"
                />
                <span className="program-badge">Community</span>
              </div>
              <div className="program-card-content">
                <h3 className="program-card-title">Community Growth</h3>
                <p className="program-card-desc">
                  Participate in peer-driven code reviews, mentorship circles, and inter-departmental technical symposiums.
                </p>
                <Link to="/register" className="program-card-link">
                  Join Community <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Card 4: Career Opportunities */}
            <div className="program-card">
              <div className="program-card-image">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop"
                  alt="Career Opportunities"
                />
                <span className="program-badge">Careers</span>
              </div>
              <div className="program-card-content">
                <h3 className="program-card-title">Career Opportunities</h3>
                <p className="program-card-desc">
                  Build an institutional digital portfolio demonstrating verifiable skills and collaborative achievements.
                </p>
                <Link to="/register" className="program-card-link">
                  Build Portfolio <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LATEST NEWS AND UPCOMING EVENTS (TWO COLUMNS AS IN SCREENSHOT) */}
      <section className="news-events-section" id="events">
        <div className="container">
          <div className="news-events-grid">
            {/* Column 1: Latest News */}
            <div className="news-column">
              <div className="column-header">
                <h2 className="column-title">Latest Campus News</h2>
                <div className="gold-divider" style={{ width: '40px', margin: '8px 0 0' }} />
              </div>
              <div className="cards-list">
                <div className="horizontal-item-card">
                  <div className="item-thumbnail">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop"
                      alt="Student Achievement"
                    />
                  </div>
                  <div className="item-content">
                    <span className="item-meta">
                      <Award size={14} /> Student Achievement &bull; Nov 2026
                    </span>
                    <h4 className="item-title">
                      CSE Department Students Win National Smart India Hackathon
                    </h4>
                    <p className="item-desc">
                      A collaborative team built an AI-powered agricultural monitoring system using React and Node.js.
                    </p>
                  </div>
                </div>

                <div className="horizontal-item-card">
                  <div className="item-thumbnail">
                    <img
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop"
                      alt="Project Showcase"
                    />
                  </div>
                  <div className="item-content">
                    <span className="item-meta">
                      <Sparkles size={14} /> Project Announcement &bull; Oct 2026
                    </span>
                    <h4 className="item-title">
                      SkillBridge Phase 1 Portal Officially Launched for Engineering Students
                    </h4>
                    <p className="item-desc">
                      Enabling seamless student skill discovery and interdisciplinary peer teamwork.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Upcoming Events */}
            <div className="events-column">
              <div className="column-header">
                <h2 className="column-title">Upcoming Events</h2>
                <div className="gold-divider" style={{ width: '40px', margin: '8px 0 0' }} />
              </div>
              <div className="cards-list">
                <div className="horizontal-item-card">
                  <div className="item-thumbnail">
                    <img
                      src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=300&auto=format&fit=crop"
                      alt="Hackathon 2026"
                    />
                  </div>
                  <div className="item-content">
                    <span className="item-meta">
                      <Calendar size={14} /> Dec 04, 2026 &bull; Main Auditorium
                    </span>
                    <h4 className="item-title">
                      Annual Collegiate Hackathon: 36-Hour Innovation Sprint
                    </h4>
                    <p className="item-desc">
                      Assemble cross-functional teams of coders and designers to solve smart campus challenges.
                    </p>
                  </div>
                </div>

                <div className="horizontal-item-card">
                  <div className="item-thumbnail">
                    <img
                      src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=300&auto=format&fit=crop"
                      alt="Full-Stack Workshop"
                    />
                  </div>
                  <div className="item-content">
                    <span className="item-meta">
                      <BookOpen size={14} /> Dec 12, 2026 &bull; Virtual / Lab 4
                    </span>
                    <h4 className="item-title">
                      MERN Stack Architecture & MongoDB Scaling Workshop
                    </h4>
                    <p className="item-desc">
                      Hands-on session guided by industry mentors on building performant RESTful APIs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="events-bottom-cta">
                <Link to="/register" className="btn-gold">
                  Register for Upcoming Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-tag">Step-by-Step Workflow</span>
            <h2 style={{ fontSize: '2.4rem', color: '#10243B', marginTop: '6px' }}>
              How Collaboration Works
            </h2>
            <div className="gold-divider center" />
            <p style={{ color: '#667085', fontSize: '1.05rem' }}>
              Simple, transparent steps to discover talent and execute impactful college projects.
            </p>
          </div>

          <div className="step-card-grid">
            <div className="step-card">
              <div className="step-number-tag">01</div>
              <h3 style={{ fontSize: '1.25rem', color: '#10243B', marginBottom: '8px' }}>
                Register Account
              </h3>
              <p style={{ color: '#667085', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Sign up with your official college email address, select your engineering department and year of study.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-tag">02</div>
              <h3 style={{ fontSize: '1.25rem', color: '#10243B', marginBottom: '8px' }}>
                Build Skill Profile
              </h3>
              <p style={{ color: '#667085', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Add your technical proficiencies (React, Node, Python, C++), portfolio links, and academic interests.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-tag">03</div>
              <h3 style={{ fontSize: '1.25rem', color: '#10243B', marginBottom: '8px' }}>
                Connect with Peers
              </h3>
              <p style={{ color: '#667085', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Explore student profiles, find complementary teammates for hackathons and academic capstones.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-tag">04</div>
              <h3 style={{ fontSize: '1.25rem', color: '#10243B', marginBottom: '8px' }}>
                Collaborate & Excel
              </h3>
              <p style={{ color: '#667085', fontSize: '0.9rem', lineHeight: '1.55' }}>
                Build real-world applications, showcase team projects, and elevate your technical career.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;


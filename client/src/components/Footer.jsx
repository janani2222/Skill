import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  CheckCircle2,
} from 'lucide-react';

const Footer = () => {
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribedEmail.trim()) {
      setSubscribedSuccess(true);
      setSubscribedEmail('');
      setTimeout(() => setSubscribedSuccess(false), 4000);
    }
  };

  return (
    <footer className="university-footer">
      {/* Stay Connected Banner */}
      <div className="stay-connected-section">
        <div className="container">
          <div className="stay-connected-box">
            <h3 className="stay-connected-title">Stay Connected</h3>
            <p className="stay-connected-subtitle">
              Subscribe to collegiate project opportunities, hackathon announcements, and skill workshops.
            </p>
            <form onSubmit={handleSubscribe} className="subscribe-form">
              <input
                type="email"
                placeholder="Enter your student email..."
                value={subscribedEmail}
                onChange={(e) => setSubscribedEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-gold">
                Subscribe
              </button>
            </form>
            {subscribedSuccess && (
              <p className="subscribe-success-msg">
                <CheckCircle2 size={16} /> Thank you! You are now connected to SkillBridge updates.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="main-footer-content">
        <div className="container footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <div className="logo-shield-badge">
                <Shield className="shield-icon" size={24} />
              </div>
              <div>
                <span className="logo-title">SkillBridge</span>
                <span className="logo-subtitle">COLLEGIATE NETWORK</span>
              </div>
            </div>
            <p className="footer-about">
              An institutional-grade collaborative platform engineered for collegiate students
              to showcase technical competencies, discover talented project partners, and turn
              innovative ideas into high-impact academic achievements.
            </p>
            <div className="footer-social-icons">
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <div className="gold-divider" style={{ width: '30px', margin: '8px 0 16px' }} />
            <ul className="footer-link-list">
              <li><Link to="/">Home Campus</Link></li>
              <li><a href="#about">About Platform</a></li>
              <li><a href="#programs">Academic Programs</a></li>
              <li><a href="#how-it-works">How Collaboration Works</a></li>
              <li><Link to="/login">Student Portal</Link></li>
              <li><Link to="/register">Join SkillBridge</Link></li>
            </ul>
          </div>

          {/* Academic Resources */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <div className="gold-divider" style={{ width: '30px', margin: '8px 0 16px' }} />
            <ul className="footer-link-list">
              <li><a href="#!">Skill Directory</a></li>
              <li><a href="#!">Project Blueprint Guidelines</a></li>
              <li><a href="#!">Department Portals</a></li>
              <li><a href="#!">Collegiate Hackathon Hub</a></li>
              <li><a href="#!">Peer Code Review Guild</a></li>
              <li><a href="#!">Student Code of Conduct</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h4 className="footer-col-title">Campus Contact</h4>
            <div className="gold-divider" style={{ width: '30px', margin: '8px 0 16px' }} />
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} className="contact-icon" />
                <span>Tech Innovation Complex, University Campus Center</span>
              </li>
              <li>
                <Mail size={18} className="contact-icon" />
                <a href="mailto:support@skillbridge.edu">support@skillbridge.edu</a>
              </li>
              <li>
                <Phone size={18} className="contact-icon" />
                <span>+1 (800) 555-SKILL / Ext. 402</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="footer-bottom-bar">
        <div className="container bottom-bar-content">
          <p>&copy; {new Date().getFullYear()} SkillBridge Collegiate Platform. All Rights Reserved.</p>
          <div className="bottom-links">
            <a href="#!">Privacy Policy</a>
            <span className="dot">&bull;</span>
            <a href="#!">Terms of Service</a>
            <span className="dot">&bull;</span>
            <a href="#!">Academic Integrity Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


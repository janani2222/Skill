import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Artificial Intelligence and Data Science',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science and Engineering',
    year: 'First Year',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setErrorMsg('Please enter a valid college email address.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check your password.');
      return;
    }

    if (!formData.termsAccepted) {
      setErrorMsg('You must agree to the SkillBridge Terms & Code of Conduct.');
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        department: formData.department,
        year: formData.year,
      });

      setSuccessMsg('Registration successful! Redirecting to student dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Top Navbar */}
      <nav className="auth-nav">
        <div className="container auth-nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-shield-badge">
              <Shield className="shield-icon" size={22} />
            </div>
            <div className="logo-text-group">
              <span className="logo-title" style={{ fontSize: '1.25rem' }}>
                SkillBridge
              </span>
              <span className="logo-subtitle">STUDENT PORTAL</span>
            </div>
          </Link>

          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Back to Campus Home
          </Link>
        </div>
      </nav>

      {/* Split Screen Layout */}
      <div className="auth-main-wrapper">
        {/* Left Side: Realistic Campus Photo Panel */}
        <div
          className="auth-visual-panel"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop')`,
          }}
        >
          <div className="auth-visual-overlay" />
          <div className="auth-visual-content">
            <div className="auth-visual-badge">
              <GraduationCap size={16} />
              <span>Institutional Membership</span>
            </div>

            <div className="auth-quote-box">
              <div className="auth-quote-mark">&ldquo;</div>
              <h2 className="auth-quote-text">
                Collaboration is the catalyst that transforms individual curiosity into collective breakthrough.
              </h2>
              <p className="auth-quote-author">
                &mdash; SkillBridge Academic Innovation Charter
              </p>
            </div>

            <div className="auth-visual-footer">
              <span>Verified Student Access</span>
              <span>&bull;</span>
              <span>Encrypted Credentials</span>
              <span>&bull;</span>
              <span>Institutional Privacy</span>
            </div>
          </div>
        </div>

        {/* Right Side: White Registration Card */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Join SkillBridge</h2>
              <p className="auth-card-subtitle">
                Be a part of our growing student community!
              </p>
            </div>

            {errorMsg && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-alert auth-alert-success">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="form-input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Janani Raman"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* College Email */}
              <div className="form-group">
                <label className="form-label">College Email Address</label>
                <div className="form-input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@college.edu"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Department & Year (Two Columns) */}
              <div className="form-row-two">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <div className="form-input-wrapper">
                    <GraduationCap size={18} className="input-icon" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="form-input"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Year of Study</label>
                  <div className="form-input-wrapper">
                    <Calendar size={18} className="input-icon" />
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="form-input"
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password (min. 8 characters)</label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    required
                  />
                  <span>
                    I agree to the <a href="#!" style={{ color: '#B99545', fontWeight: 600 }}>Terms of Service</a> & Academic Honor Code
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-gold auth-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Creating Student Account...' : 'Complete Registration'}
              </button>
            </form>

            <div className="auth-card-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="auth-switch-link">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

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

    if (!formData.email.trim() || !formData.password) {
      setErrorMsg('Please enter both your college email and password.');
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      setSuccessMsg('Authentication successful! Loading dashboard...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      setErrorMsg(
        err.message || 'Invalid email or password. Please verify your credentials.'
      );
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
            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop')`,
          }}
        >
          <div className="auth-visual-overlay" />
          <div className="auth-visual-content">
            <div className="auth-visual-badge">
              <Sparkles size={16} />
              <span>Collegiate Collaboration Network</span>
            </div>

            <div className="auth-quote-box">
              <div className="auth-quote-mark">&ldquo;</div>
              <h2 className="auth-quote-text">
                Great innovations are born when diverse student minds unite around a shared vision.
              </h2>
              <p className="auth-quote-author">
                &mdash; SkillBridge Community Guild
              </p>
            </div>

            <div className="auth-visual-footer">
              <span>Secure Authentication</span>
              <span>&bull;</span>
              <span>Local Session Persistence</span>
              <span>&bull;</span>
              <span>MERN Stack Powered</span>
            </div>
          </div>
        </div>

        {/* Right Side: White Login Form Card */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Welcome Back!</h2>
              <p className="auth-card-subtitle">
                Login to continue your SkillBridge journey.
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
              {/* Email */}
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

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
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

              {/* Remember Me & Forgot Password */}
              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me for 30 days</span>
                </label>

                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      'For password reset assistance, please contact the campus tech desk: helpdesk@skillbridge.edu'
                    );
                  }}
                  className="forgot-password-link"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-gold auth-submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>

            <div className="auth-card-footer">
              <span>Don't have an account?</span>
              <Link to="/register" className="auth-switch-link">
                Register as a student
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

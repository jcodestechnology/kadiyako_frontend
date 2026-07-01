import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from 'antd';
import axiosInstance from '../api/axios';
import {
  DollarOutlined,
  MessageOutlined,
  QrcodeOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  PictureOutlined,
  SmileOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const pkgRes = await axiosInstance.get('/public/packages');
        setPackages(pkgRes.data.data || []);
      } catch (err) {
        console.error('Failed to load packages', err);
      }
      try {
        const eventRes = await axiosInstance.get('/public/events/latest');
        setEvents(eventRes.data.data || []);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    };
    fetchPublicData();
  }, []);

  const getEventImage = (event) => {
    if (event.image_url) {
      return event.image_url;
    }
    if (event.template && event.template.thumbnail_path) {
      return event.template.thumbnail_path;
    }
    return null;
  };

  const filteredEvents = activeTab === 'all' 
    ? events 
    : events.filter(e => e.status === activeTab);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleLogin = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      {/* Sticky Header */}
      <header className="home-header">
        <div className="header-nav">
          <div className="brand-logo-wrapper" onClick={() => navigate('/')}>
            <img src="/LOGO2.png" alt="Kadi Yako Logo" className="brand-logo-img" />
            <span className="brand-logo-text">KADI YAKO</span>
          </div>

          <nav className="nav-links">
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#how-it-works" className="nav-link-item">How It Works</a>
            <a href="#templates" className="nav-link-item">Card Showcase</a>
            <a href="#pricing" className="nav-link-item">Pricing</a>
          </nav>

          <div className="header-actions">
            {user ? (
              <Button type="primary" size="large" onClick={() => navigate('/dashboard')} style={{ background: '#0892d0', border: 'none', borderRadius: '8px' }}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button type="text" size="large" onClick={handleLogin} style={{ fontWeight: 600, color: '#1f1f1f' }}>
                  Login
                </Button>
                <Button type="primary" size="large" onClick={handleGetStarted} style={{ background: '#0892d0', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <span className="hero-tag">✨ Redefining Event Invitations</span>
          <h1 className="hero-title">
            Make Your Events Stand Out With Premium <span>Digital Cards</span>
          </h1>
          <p className="hero-subtitle">
            Kadi Yako is the ultimate digital platform for event hosts. Create custom invitation cards, manage RSVPs, track guest contributions, send automated SMS updates, and verify gate check-ins with secure QR codes.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn-primary" onClick={handleGetStarted}>
              Start Hosting Now <ArrowRightOutlined style={{ marginLeft: 8 }} />
            </button>
            <a href="#features">
              <button className="hero-btn-secondary">Explore Features</button>
            </a>
          </div>
        </div>

        <div className="hero-mockup-container">
          <div className="smartphone-frame">
            <div className="smartphone-speaker"></div>
            <div className="smartphone-screen">
              {/* Brand Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                <img src="/LOGO1.png" alt="Logo" style={{ height: 20 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0892d0' }}>KADI YAKO</span>
              </div>

              {/* Mock Invitation Card */}
              <div className="mock-card">
                <span className="mock-card-title">Wedding Invitation</span>
                <h3 className="mock-card-names">Sophia & David</h3>
                <p style={{ fontSize: 10, color: '#595959', margin: '4px 0' }}>Are cordially inviting you to witness their union</p>
                <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '10px 0' }} />
                <p className="mock-card-detail">
                  📅 Saturday, Nov 14, 2026<br />
                  📍 Serena Hotel, Dar es Salaam<br />
                  🕒 06:00 PM onwards
                </p>

                {/* Secure QR Code */}
                <div className="mock-qr-code">
                  <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block' }}>
                    <path d="M0,0 h30 v10 h-20 v20 h-10 z M70,0 h30 v30 h-10 v-20 h-20 z M0,70 h10 v20 h20 v10 h-30 z M90,90 h-20 v10 h30 v-30 h-10 z" fill="#0892d0" />
                    <rect x="20" y="20" width="15" height="15" fill="#111" />
                    <rect x="25" y="25" width="5" height="5" fill="#fff" />
                    <rect x="65" y="20" width="15" height="15" fill="#111" />
                    <rect x="70" y="25" width="5" height="5" fill="#fff" />
                    <rect x="20" y="65" width="15" height="15" fill="#111" />
                    <rect x="25" y="70" width="5" height="5" fill="#fff" />
                    {/* Inner QR patterns */}
                    <rect x="45" y="20" width="10" height="5" fill="#111" />
                    <rect x="50" y="30" width="5" height="10" fill="#111" />
                    <rect x="40" y="45" width="20" height="5" fill="#111" />
                    <rect x="45" y="60" width="10" height="10" fill="#111" />
                    <rect x="65" y="45" width="10" height="10" fill="#111" />
                    <rect x="80" y="65" width="10" height="10" fill="#111" />
                  </svg>
                </div>
                <span className="mock-card-badge">Card No: KY-2026-089</span>

                <div className="mock-card-rsvp">
                  <button className="mock-rsvp-btn yes">RSVP: Going</button>
                  <button className="mock-rsvp-btn no">Declined</button>
                </div>
              </div>

              {/* Contribution Card Mockup */}
              <div className="mock-contributions">
                <div className="mock-cont-title">Wedding Pledge Tracking</div>
                <div className="mock-progress-bar">
                  <div className="mock-progress-fill"></div>
                </div>
                <div className="mock-cont-desc">
                  <span>Pledged: 1,500,000 TZS</span>
                  <span style={{ fontWeight: 700, color: '#52c41a' }}>75% Paid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">50,000+</div>
            <div className="stat-label">Cards Sent</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">70+</div>
            <div className="stat-label">Events Hosted</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">SMS Delivery Rate</div>
          </div>
          {/* <div className="stat-item">
            <div className="stat-number">10M+</div>
            <div className="stat-label">Contributions Tracked</div>
          </div> */}
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-tag">Powerful Features</span>
          <h2 className="section-title">Everything You Need to Run a Flawless Event</h2>
          <p className="section-subtitle">
            Kadi Yako provides a robust collection of tools designed specifically for modern event hosts in Tanzania.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper-large">
              <PictureOutlined />
            </div>
            <h3 className="feature-card-title">Digital Cards</h3>
            <p className="feature-card-desc">
              Choose from a template library or upload your designs. Cards dynamically contain guest names, unique codes, and locations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper-large">
              <DollarOutlined />
            </div>
            <h3 className="feature-card-title">Contribution Tracking</h3>
            <p className="feature-card-desc">
              Record pledges, track payments, monitor balances, and generate clear tables of your event committee’s financials.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper-large">
              <MessageOutlined />
            </div>
            <h3 className="feature-card-title">SMS Broadcasts</h3>
            <p className="feature-card-desc">
              Send personalized invitations directly to your guests' phones via SMS, complete with their unique card link.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper-large">
              <QrcodeOutlined />
            </div>
            <h3 className="feature-card-title">QR Entrance Scanning</h3>
            <p className="feature-card-desc">
              Ushers can scan the QR code on cards at the gate. Prevent gate-crashers and view real-time check-in counts.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Events Section */}
      <section className="events-section" id="events">
        <div className="section-header">
          <span className="section-tag">Explore Events</span>
          <h2 className="section-title">Latest Events Hosted on Kadi Yako</h2>
          <p className="section-subtitle">
            See how event hosts organize their RSVP, guest check-ins, and timelines dynamically.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="events-tabs-wrapper">
          <div className="events-tabs-container">
            {[
              { id: 'all', label: 'All Events', icon: <AppstoreOutlined /> },
              { id: 'upcoming', label: 'Upcoming', icon: <CalendarOutlined /> },
              { id: 'ongoing', label: 'Ongoing', icon: <PlayCircleOutlined /> },
              { id: 'completed', label: 'Completed', icon: <CheckCircleOutlined /> },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`event-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span style={{ marginLeft: 8 }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const eventImg = getEventImage(event);
              const formattedDate = event.event_date 
                ? new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Date to be announced';

              return (
                <div key={event.id} className="event-card">
                  <div className="event-card-img-wrapper">
                    {eventImg ? (
                      <img src={eventImg} alt={event.name} className="event-card-img" />
                    ) : (
                      <div style={{ fontSize: '40px', opacity: 0.8 }}>📅</div>
                    )}
                    <span className={`event-status-badge ${event.status || 'upcoming'}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="event-card-body">
                    <h3 className="event-card-title">{event.name}</h3>
                    
                    <div className="event-card-info-item">
                      <span className="event-card-info-icon">📅</span>
                      <span>{formattedDate}</span>
                    </div>

                    <div className="event-card-info-item">
                      <span className="event-card-info-icon">📍</span>
                      <span>{event.location || 'Virtual / Online'}</span>
                    </div>

                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', lineHeight: '1.4' }}>
                      {event.description ? (event.description.length > 90 ? event.description.slice(0, 90) + '...' : event.description) : 'No description provided.'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '48px 0', color: '#8c8c8c' }}>
              No {activeTab !== 'all' ? activeTab : ''} events found at this time.
            </div>
          )}
        </div>
      </section>

      {/* Showcase Templates */}
      <section className="gallery-section" id="templates">
        <div className="section-header">
          <span className="section-tag">Template Showcase</span>
          <h2 className="section-title">Designed for Every Special Moment</h2>
          <p className="section-subtitle">
            Explore our curated card templates suitable for various family and corporate events.
          </p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-card">
            <div className="gallery-img-placeholder">
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>💍</span>
              <div className="gallery-img-title">Golden Royal Wedding</div>
              <span className="gallery-img-badge">Wedding</span>
            </div>
            <div className="gallery-card-body">
              <h3 className="gallery-card-title">Royal Gold & Cream</h3>
              <p className="gallery-card-desc">A premium, classic gold card layout tailored for elegant weddings and send-off ceremonies.</p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-placeholder">
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</span>
              <div className="gallery-img-title">Midnight Neon Party</div>
              <span className="gallery-img-badge">Celebration</span>
            </div>
            <div className="gallery-card-body">
              <h3 className="gallery-card-title">Modern Neon Glow</h3>
              <p className="gallery-card-desc">Vibrant dark theme featuring high-contrast neon borders. Perfect for birthdays and private parties.</p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-placeholder">
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>👔</span>
              <div className="gallery-img-title">Corporate Gala Summit</div>
              <span className="gallery-img-badge">Corporate</span>
            </div>
            <div className="gallery-card-body">
              <h3 className="gallery-card-title">Minimalist Professional</h3>
              <p className="gallery-card-desc">Sleek, minimalist branding optimized for corporate meetings, award ceremonies, and forums.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">Simple Process</span>
          <h2 className="section-title">How Kadi Yako Works</h2>
          <p className="section-subtitle">
            Get your event organized and start inviting guests in under 10 minutes.
          </p>
        </div>

        <div className="timeline">
          <div className="timeline-step">
            <div className="step-number">1</div>
            <h3 className="timeline-step-title">Register as Host</h3>
            <p className="timeline-step-desc">Create your host account and verify your phone number via a quick secure SMS OTP code.</p>
          </div>

          <div className="timeline-step">
            <div className="step-number">2</div>
            <h3 className="timeline-step-title">Create Your Event</h3>
            <p className="timeline-step-desc">Enter your event date, location, details, and select or upload your custom card template.</p>
          </div>

          <div className="timeline-step">
            <div className="step-number">3</div>
            <h3 className="timeline-step-title">Add & Send</h3>
            <p className="timeline-step-desc">Import your guest contact list via Excel or add them manually. Broadcast cards instantly via SMS.</p>
          </div>

          <div className="timeline-step">
            <div className="step-number">4</div>
            <h3 className="timeline-step-title">Track & Verify</h3>
            <p className="timeline-step-desc">Monitor RSVP statuses, track event contributions, and scan QR codes at the entry gate.</p>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <span className="section-tag">Pricing Plans</span>
          <h2 className="section-title">Flexible Plans for Every Budget</h2>
          <p className="section-subtitle">
            Choose a plan that matches your event size. Upgrade anytime as your guest list grows.
          </p>
        </div>

        <div className="pricing-grid">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.id} className={`pricing-card ${pkg.is_popular ? 'premium' : ''}`}>
                {pkg.is_popular && <div className="premium-badge">Most Popular</div>}
                <h3 className="pricing-tier">{pkg.name}</h3>
                <div className="pricing-price">
                  {pkg.price}
                  {pkg.price_detail && <span>{pkg.price_detail}</span>}
                </div>
                <ul className="pricing-features-list">
                  {pkg.features && pkg.features.map((feature, idx) => {
                    const isDisabled = feature.startsWith('❌');
                    return (
                      <li key={idx} className={`pricing-feature-item ${isDisabled ? 'disabled' : ''}`}>
                        {!isDisabled && <CheckOutlined style={{ color: '#52c41a' }} />} {feature}
                      </li>
                    );
                  })}
                </ul>
                <Button 
                  type={pkg.is_popular ? 'primary' : 'default'} 
                  size="large" 
                  block 
                  onClick={handleGetStarted}
                  style={pkg.is_popular ? { background: '#0892d0', border: 'none', borderRadius: '8px' } : { borderRadius: '8px' }}
                >
                  {pkg.slug === 'corporate' ? 'Contact Sales' : pkg.is_popular ? 'Choose ' + pkg.name : 'Get Started'}
                </Button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', width: '100%', padding: '40px 0', color: '#8c8c8c' }}>
              No pricing plans available.
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Host Your Next Memorable Event?</h2>
          <p className="cta-subtitle">
            Join thousands of hosts using Kadi Yako to invite their friends, families, and colleagues. Experience the convenience of digital invitation management.
          </p>
          <button className="cta-btn" onClick={handleGetStarted}>
            Create Host Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-col-brand">
            <div className="footer-brand-title">KADI YAKO</div>
            <p className="footer-brand-desc">
              The premier digital solution for invitation card creation, RSVP tracking, contribution management, and gate security scanning in East Africa.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="#features">Features</a></li>
              <li className="footer-link-item"><a href="#how-it-works">How It Works</a></li>
              <li className="footer-link-item"><a href="#pricing">Pricing Plans</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="https://abbelinedigital.co.tz/" target="_blank" rel="noreferrer">Abbeline Digital</a></li>
              <li className="footer-link-item"><a href="mailto:info@abbelinedigital.co.tz">Contact Us</a></li>
              <li className="footer-link-item"><a href="#home">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Legal</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item"><a href="#home">Terms of Service</a></li>
              <li className="footer-link-item"><a href="#home">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Kadi Yako. All rights reserved.</span>
          <span>Developed by <a href="https://abbelinedigital.co.tz/" target="_blank" rel="noopener noreferrer">Jcodes Technologies</a></span>
        </div>
      </footer>
    </div>
  );
};

export default Home;

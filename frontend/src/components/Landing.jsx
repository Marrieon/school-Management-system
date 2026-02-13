import { useState } from 'react'
import { motion } from 'framer-motion'
import './Landing.css'

const Landing = ({ setPage }) => {
  const [role, setRole] = useState('')

  const stats = [
    { value: '100+', label: 'Students Managed' },
    { value: '50+', label: 'Teachers Engaged' },
    { value: '1000+', label: 'Assignments Tracked' },
  ]

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setPage('signup')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="landing"
      role="region"
      aria-label="Welcome to Grade Manager"
    >
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">Welcome to Grade Manager</h1>
        <p className="hero-subtitle">Your all-in-one platform for tracking grades, assignments, and communication.</p>
        <div className="hero-cta">
          <button
            onClick={() => handleRoleSelect('teacher')}
            className="cta-button teacher"
            aria-label="Get started as a teacher"
          >
            I'm a Teacher
          </button>
          <button
            onClick={() => handleRoleSelect('student')}
            className="cta-button student"
            aria-label="Get started as a student"
          >
            I'm a Student
          </button>
        </div>
      </section>
      <section className="stats" aria-labelledby="stats-title">
        <h2 id="stats-title" className="stats-title">Why Choose Grade Manager?</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              className="stat-item"
              role="figure"
              aria-label={`${stat.value} ${stat.label}`}
            >
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="features" aria-labelledby="features-title">
        <h2 id="features-title" className="features-title">Features</h2>
        <div className="features-grid">
          <div className="feature-item" role="article" aria-label="Real-time notifications feature">
            <h3>Real-Time Notifications</h3>
            <p>Stay updated with instant alerts for grades and assignments.</p>
          </div>
          <div className="feature-item" role="article" aria-label="Analytics dashboard feature">
            <h3>Analytics Dashboard</h3>
            <p>Track progress with insightful grade trends and comparisons.</p>
          </div>
          <div className="feature-item" role="article" aria-label="Assignment uploads feature">
            <h3>Assignment Uploads</h3>
            <p>Submit and review assignments seamlessly.</p>
          </div>
        </div>
      </section>
      <footer className="footer">
        <p>&copy; 2025 Grade Manager. All rights reserved.</p>
        <nav aria-label="Footer navigation">
          <a href="#" onClick={() => setPage('login')} aria-label="Login to your account">Login</a>
          <a href="#" onClick={() => setPage('signup')} aria-label="Sign up for a new account">Sign Up</a>
        </nav>
      </footer>
    </motion.div>
  )
}

export default Landing
import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './LoginForm.css'

const LoginForm = ({ onLogin, setPage }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.post('/api/login', { email, password, role })
      onLogin(response.data.user)
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="login-form"
    >
      <h2 className="form-title">Login</h2>
      <form onSubmit={handleSubmit} className="form-content">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
          aria-label="Email"
          required
        />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
          aria-label="Password"
          required
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show Password
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input-field"
          aria-label="Role"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner" /> : 'Login'}
        </button>
      </form>
      <p className="signup-link">
        Don't have an account?{' '}
        <button onClick={() => setPage('signup')} className="link-button">
          Signup
        </button>
      </p>
    </motion.div>
  )
}

export default LoginForm
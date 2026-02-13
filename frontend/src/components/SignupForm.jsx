import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './SignupForm.css'

const SignupForm = ({ onSignup, setPage }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error')
      return
    }
    setIsLoading(true)
    try {
      const response = await axios.post('/api/signup', { name, email, password, role })
      Swal.fire('Success', 'Account created successfully!', 'success')
      onSignup(response.data.user)
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="signup-form"
    >
      <h2 className="form-title">Signup</h2>
      <form onSubmit={handleSubmit} className="form-content">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="input-field"
          aria-label="Full Name"
          required
        />
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
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="input-field"
          aria-label="Confirm Password"
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
          {isLoading ? <span className="spinner" /> : 'Signup'}
        </button>
      </form>
      <p className="login-link">
        Already have an account?{' '}
        <button onClick={() => setPage('login')} className="link-button">
          Login
        </button>
      </p>
    </motion.div>
  )
}

export default SignupForm
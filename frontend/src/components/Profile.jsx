import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './Profile.css'

const Profile = ({ user, setPage, setUser }) => {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState(user.bio || '')
  const [password, setPassword] = useState('')
  const [photo, setPhoto] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.put(`/api/profile/${user.id}`, { name, email, bio, password })
      let updatedUser = { ...user, name, email, bio }
      if (photo) {
        const formData = new FormData()
        formData.append('photo', photo)
        const photoResponse = await axios.post(`/api/profile/${user.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        updatedUser.profile_photo = photoResponse.data.photo
      }
      setUser(updatedUser)
      Swal.fire('Success', response.data.message, 'success')
      setPage(user.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update profile', 'error')
    }
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="profile"
    >
      <h2 className="profile-title">Profile</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <img
          src={user.profile_photo ? `/uploads/${user.profile_photo}?t=${new Date().getTime()}` : `https://ui-avatars.com/api/?name=${user.name}`}
          alt="Profile"
          className="profile-pic"
        />
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif"
          onChange={(e) => setPhoto(e.target.files[0])}
          className="input-field"
          aria-label="Profile Photo"
        />
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
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          className="input-field"
          aria-label="Bio"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password (optional)"
          className="input-field"
          aria-label="New Password"
        />
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner" /> : 'Update Profile'}
        </button>
      </form>
    </motion.div>
  )
}

export default Profile
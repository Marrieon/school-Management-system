import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './Notifications.css'

const Notifications = ({ user, setPage }) => {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/notifications/${user.id}`)
      setNotifications(response.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch notifications', 'error')
    }
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="notifications"
    >
      <h2 className="notifications-title">Notifications</h2>
      {isLoading ? (
        <div className="spinner">Loading...</div>
      ) : notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <p>{notification.content}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No notifications</p>
      )}
      <button onClick={() => setPage(user.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')} className="action-button">Back to Dashboard</button>
    </motion.div>
  )
}

export default Notifications
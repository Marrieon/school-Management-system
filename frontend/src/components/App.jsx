import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaBars, FaSun, FaMoon, FaBell } from 'react-icons/fa'
import io from 'socket.io-client'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import TeacherDashboard from './TeacherDashboard'
import StudentDashboard from './StudentDashboard'
import Profile from './Profile'
import StudentProfile from './StudentProfile'
import StudyGroup from './StudyGroup'
import ChatRoom from './ChatRoom'
import Notifications from './Notifications'
import Analytics from './Analytics'
import Assignments from './Assignments'
import Landing from './Landing'
import './App.css'

const socket = io('http://localhost:5000')

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('landing')
  const [pageParams, setPageParams] = useState({})
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    setIsDarkMode(theme === 'dark')
    document.body.classList.toggle('dark', theme === 'dark')

    socket.on('notification', (data) => {
      if (data.user_id === user?.id) {
        setUnreadNotifications(prev => prev + 1)
      }
    })

    return () => socket.off('notification')
  }, [user])

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('theme', newTheme)
    document.body.classList.toggle('dark', newTheme === 'dark')
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('profile')
  }

  const handleSignup = (userData) => {
    setUser(userData)
    setCurrentPage('profile')
  }

  const navigate = (page, params = {}) => {
    setCurrentPage(page)
    setPageParams(params)
    setIsMenuOpen(false)
    if (page === 'notifications') {
      setUnreadNotifications(0)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing setPage={navigate} />
      case 'login':
        return <LoginForm onLogin={handleLogin} setPage={navigate} />
      case 'signup':
        return <SignupForm onSignup={handleSignup} setPage={navigate} />
      case 'profile':
        return <Profile user={user} setPage={navigate} setUser={setUser} />
      case 'teacherDashboard':
        return <TeacherDashboard user={user} setPage={navigate} />
      case 'studentDashboard':
        return <StudentDashboard user={user} setPage={navigate} />
      case 'studentProfile':
        return <StudentProfile user={user} studentId={pageParams.studentId} setPage={navigate} />
      case 'studyGroup':
        return <StudyGroup user={user} groupId={pageParams.groupId} setPage={navigate} />
      case 'chatRoom':
        return <ChatRoom user={user} chatRoomId={pageParams.chatRoomId} setPage={navigate} />
      case 'notifications':
        return <Notifications user={user} setPage={navigate} />
      case 'analytics':
        return <Analytics user={user} studentId={pageParams.studentId} setPage={navigate} />
      case 'assignments':
        return <Assignments user={user} setPage={navigate} />
      default:
        return <Landing setPage={navigate} />
    }
  }

  return (
    <div className="app">
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-content">
          <h1 className="navbar-title">Grade Manager</h1>
          <div className="navbar-actions">
            {user && (
              <>
                <img
                  src={user.profile_photo ? `/uploads/${user.profile_photo}` : `https://ui-avatars.com/api/?name=${user.name}`}
                  alt="Profile"
                  className="profile-pic"
                  onClick={() => navigate('profile')}
                  role="button"
                  aria-label="Go to profile"
                />
                <button
                  onClick={() => navigate('notifications')}
                  className={`notification-bell ${unreadNotifications > 0 ? 'has-unread' : ''}`}
                  aria-label={`Notifications, ${unreadNotifications} unread`}
                >
                  <FaBell />
                  {unreadNotifications > 0 && (
                    <span className="notification-count">{unreadNotifications}</span>
                  )}
                </button>
              </>
            )}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              className="theme-toggle"
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <FaBars />
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="menu-dropdown"
            role="menu"
          >
            <a href="#" className="menu-item" onClick={() => navigate('landing')} role="menuitem">Home</a>
            <a href="#" className="menu-item" onClick={() => navigate('login')} role="menuitem">Login</a>
            <a href="#" className="menu-item" onClick={() => navigate('signup')} role="menuitem">Signup</a>
            {user && (
              <>
                <a href="#" className="menu-item" onClick={() => navigate(user.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')} role="menuitem">
                  Dashboard
                </a>
                <a href="#" className="menu-item" onClick={() => navigate('notifications')} role="menuitem">
                  Notifications
                </a>
                <a href="#" className="menu-item" onClick={() => navigate('analytics', { studentId: user.id })} role="menuitem">
                  Analytics
                </a>
                <a href="#" className="menu-item" onClick={() => navigate('assignments')} role="menuitem">
                  Assignments
                </a>
              </>
            )}
          </motion.div>
        )}
      </nav>
      <main className="main-content" role="main">{renderPage()}</main>
    </div>
  )
}

export default App
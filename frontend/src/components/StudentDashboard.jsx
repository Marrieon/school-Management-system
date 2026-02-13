import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './StudentDashboard.css'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const StudentDashboard = ({ user, setPage }) => {
  const [grades, setGrades] = useState([])
  const [chatRooms, setChatRooms] = useState([])
  const [groups, setGroups] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [studentRes, chatRoomsRes, groupsRes, messagesRes] = await Promise.all([
        axios.get(`/api/students/${user.id}`),
        axios.get('/api/chatrooms'),
        axios.get('/api/groups'),
        axios.get(`/api/private_messages/${user.id}`)
      ])
      setGrades(studentRes.data.grades)
      setChatRooms(chatRoomsRes.data)
      setGroups(groupsRes.data)
      setMessages(messagesRes.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch data', 'error')
    }
    setIsLoading(false)
  }

  const setTarget = async () => {
    const subject = prompt('Subject:')
    const target = prompt('Target (0-100):')
    if (!subject || !target || isNaN(target) || target < 0 || target > 100) {
      Swal.fire('Error', 'Invalid subject or target (0-100)', 'error')
      return
    }
    try {
      await axios.post('/api/targets', { studentId: user.id, subject, target })
      Swal.fire('Success', 'Target set', 'success')
      fetchData()
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const sendMessage = async () => {
    if (!newMessage) {
      Swal.fire('Error', 'Message cannot be empty', 'error')
      return
    }
    if (!user.teacher_id) {
      Swal.fire('Error', 'No teacher assigned', 'error')
      return
    }
    try {
      await axios.post(`/api/private_messages/${user.id}`, {
        sender_id: user.id,
        receiver_id: user.teacher_id,
        content: newMessage,
        type: 'text'
      })
      setNewMessage('')
      fetchData()
      Swal.fire('Success', 'Message sent', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const chartData = {
    labels: grades.map(g => new Date(g.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'General Grade',
        data: grades.map(g => g.score),
        borderColor: '#3498DB',
        backgroundColor: '#F1C40F',
      },
    ],
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="student-dashboard"
      role="region"
      aria-label="Student Dashboard"
    >
      <h2 className="dashboard-title">Student Dashboard</h2>
      <div className="dashboard-grid">
        <section className="section" aria-labelledby="grades-title">
          <h3 id="grades-title" className="section-title">Grades</h3>
          {isLoading ? (
            <div className="spinner" aria-live="polite">Loading...</div>
          ) : grades.length > 0 ? (
            grades.map((grade) => (
              <div key={grade.id} className="grade-item">
                <p>{grade.subject}: {grade.score} ({grade.grade})</p>
              </div>
            ))
          ) : (
            <p>No grades available</p>
          )}
          <button
            onClick={setTarget}
            className="action-button"
            aria-label="Set grade target"
          >
            Set Target
          </button>
        </section>
        <section className="section" aria-labelledby="chatrooms-title">
          <h3 id="chatrooms-title" className="section-title">Chat Rooms</h3>
          {chatRooms.length > 0 ? (
            chatRooms.map((room) => (
              <button
                key={room.id}
                className="chatroom-item"
                onClick={() => setPage('chatRoom', { chatRoomId: room.id })}
                aria-label={`Go to ${room.name} chat room`}
              >
                <p>{room.name}</p>
              </button>
            ))
          ) : (
            <p>No chat rooms available</p>
          )}
        </section>
        <section className="section" aria-labelledby="groups-title">
          <h3 id="groups-title" className="section-title">Study Groups</h3>
          {groups.length > 0 ? (
            groups.map((group) => (
              <button
                key={group.id}
                className="group-item"
                onClick={() => setPage('studyGroup', { groupId: group.id })}
                aria-label={`Go to ${group.name} study group`}
              >
                <p>{group.name}</p>
              </button>
            ))
          ) : (
            <p>No study groups available</p>
          )}
        </section>
        <section className="section" aria-labelledby="messages-title">
          <h3 id="messages-title" className="section-title">Messages</h3>
          <div className="messages-container" role="log" aria-live="polite">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                  <small>{new Date(msg.created_at).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <p>No messages</p>
            )}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input-field"
              aria-label="Type a message to your teacher"
            />
            <button
              onClick={sendMessage}
              className="action-button"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </section>
        <section className="section" aria-labelledby="performance-title">
          <h3 id="performance-title" className="section-title">Performance Over Time</h3>
          {grades.length > 0 ? (
            <Line data={chartData} options={{ responsive: true }} />
          ) : (
            <p>No performance data available</p>
          )}
        </section>
      </div>
      <button
        onClick={() => setPage('analytics', { studentId: user.id })}
        className="action-button"
        aria-label="View analytics"
      >
        View Analytics
      </button>
      <button
        onClick={() => setPage('assignments')}
        className="action-button"
        aria-label="View assignments"
      >
        View Assignments
      </button>
    </motion.div>
  )
}

export default StudentDashboard
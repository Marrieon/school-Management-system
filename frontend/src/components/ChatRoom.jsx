import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './ChatRoom.css'

const ChatRoom = ({ user, chatRoomId, setPage }) => {
  const [chatRoom, setChatRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [students, setStudents] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [inviteStudentId, setInviteStudentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchChatRoomData()
    if (user.role === 'teacher') {
      fetchStudents()
    }
  }, [chatRoomId, user.role])

  const fetchChatRoomData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/chatrooms/${chatRoomId}/messages`)
      setMessages(response.data.messages)
      setMembers(response.data.members)
      setChatRoom({ id: chatRoomId, name: 'General Chat' })
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch chat room data', 'error')
    }
    setIsLoading(false)
  }

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students')
      setStudents(response.data.filter(s => !members.includes(s.id)))
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch students', 'error')
    }
  }

  const inviteStudent = async () => {
    if (!inviteStudentId) {
      Swal.fire('Error', 'Please select a student', 'error')
      return
    }
    try {
      await axios.post(`/api/chatrooms/${chatRoomId}/invite`, {
        studentId: inviteStudentId,
        teacher_id: user.id
      })
      setInviteStudentId('')
      fetchChatRoomData()
      fetchStudents()
      Swal.fire('Success', 'Student invited', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const sendMessage = async () => {
    if (!newMessage && !file) {
      Swal.fire('Error', 'Message or file cannot be empty', 'error')
      return
    }
    try {
      if (file) {
        // Simulate file upload (extend backend for actual file storage)
        await axios.post(`/api/chatrooms/${chatRoomId}/messages`, {
          user_id: user.id,
          content: `File: ${file.name}`,
          type: file.type.startsWith('image') ? 'image' : 'video'
        })
      } else {
        await axios.post(`/api/chatrooms/${chatRoomId}/messages`, {
          user_id: user.id,
          content: newMessage,
          type: 'text'
        })
      }
      setNewMessage('')
      setFile(null)
      fetchChatRoomData()
      Swal.fire('Success', 'Message sent', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const removeMember = async (memberId) => {
    try {
      await axios.post(`/api/chatrooms/${chatRoomId}/remove`, { studentId: memberId })
      fetchChatRoomData()
      fetchStudents()
      Swal.fire('Success', 'Member removed', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chat-room"
    >
      <h2 className="chat-title">Chat Room</h2>
      {isLoading ? (
        <div className="spinner">Loading...</div>
      ) : chatRoom ? (
        <div className="chat-content">
          <h3 className="chat-name">{chatRoom.name}</h3>
          <div className="section">
            <h4 className="section-title">Members</h4>
            {members.map((memberId) => (
              <div key={memberId} className="member-item">
                <img
                  src={`https://ui-avatars.com/api/?name=${memberId}`}
                  alt="Member"
                  className="member-pic"
                />
                <p>User {memberId}</p>
                {user.role === 'teacher' && (
                  <button
                    onClick={() => removeMember(memberId)}
                    className="action-button danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {user.role === 'teacher' && (
              <div className="invite-member">
                <select
                  value={inviteStudentId}
                  onChange={(e) => setInviteStudentId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
                <button onClick={inviteStudent} className="action-button">Invite Student</button>
              </div>
            )}
          </div>
          <div className="section">
            <h4 className="section-title">Messages</h4>
            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.user_id === user.id ? 'sent' : 'received'}`}>
                  {msg.type === 'text' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div>
                      {msg.type === 'image' ? (
                        <img src={`/uploads/${msg.content}`} alt="Uploaded" className="message-file" />
                      ) : (
                        <video src={`/Uploads/${msg.content}`} controls className="message-file" />
                      )}
                    </div>
                  )}
                  <small>{new Date(msg.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input-field"
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="input-field"
              />
              <button onClick={sendMessage} className="action-button">Send</button>
            </div>
          </div>
        </div>
      ) : (
        <p>Chat room not found</p>
      )}
      <button onClick={() => setPage(user.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')} className="action-button">Back to Dashboard</button>
    </motion.div>
  )
}

export default ChatRoom
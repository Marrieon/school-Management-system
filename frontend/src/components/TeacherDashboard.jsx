import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import { FaUserMinus, FaEdit, FaPlus } from 'react-icons/fa'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './TeacherDashboard.css'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const TeacherDashboard = ({ user, setPage }) => {
  const [students, setStudents] = useState([])
  const [chatRooms, setChatRooms] = useState([])
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [studentsRes, chatRoomsRes, groupsRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/chatrooms'),
        axios.get('/api/groups'),
      ])
      setStudents(studentsRes.data)
      setChatRooms(chatRoomsRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch data', 'error')
    }
    setIsLoading(false)
  }

  const addStudent = async () => {
    const name = prompt('Name:')
    const email = prompt('Email:')
    if (!name || !email) {
      Swal.fire('Error', 'Name and email cannot be empty', 'error')
      return
    }
    try {
      await axios.post('/api/students', { name, email, teacher_id: user.id })
      fetchData()
      Swal.fire('Success', 'Student added', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const removeStudent = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`)
      fetchData()
      Swal.fire('Success', 'Student removed', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const editStudent = async (id, oldName) => {
    const name = prompt('New name:', oldName)
    if (!name) {
      Swal.fire('Error', 'Name cannot be empty', 'error')
      return
    }
    try {
      await axios.put(`/api/students/${id}`, { name })
      fetchData()
      Swal.fire('Success', 'Student updated', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const addGrade = async (studentId) => {
    const subject = prompt('Subject:')
    const score = prompt('Score (0-100):')
    if (!subject || !score) {
      Swal.fire('Error', 'Subject and score cannot be empty', 'error')
      return
    }
    try {
      await axios.post('/api/grades', { studentId, subject, score, teacher_id: user.id })
      fetchData()
      Swal.fire('Success', 'Grade added', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const createChatRoom = async () => {
    const name = prompt('Chat Room Name:')
    if (!name) {
      Swal.fire('Error', 'Name cannot be empty', 'error')
      return
    }
    try {
      await axios.post('/api/chatrooms', { name, teacher_id: user.id })
      fetchData()
      Swal.fire('Success', 'Chat room created', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const createGroup = async () => {
    const name = prompt('Group Name:')
    if (!name) {
      Swal.fire('Error', 'Name cannot be empty', 'error')
      return
    }
    try {
      await axios.post('/api/groups', { name, teacher_id: user.id })
      fetchData()
      Swal.fire('Success', 'Group created', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Average Grades',
        data: [85, 88, 90, 87, 89],
        borderColor: '#A34054',
        backgroundColor: '#ED9E59',
      },
    ],
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="teacher-dashboard"
    >
      <h2 className="dashboard-title">Teacher Dashboard</h2>
      <div className="dashboard-grid">
        <div className="section">
          <h3 className="section-title">Students</h3>
          {isLoading ? (
            <div className="spinner">Loading...</div>
          ) : (
            students.map((student, index) => (
              <div
                key={student.id}
                className={`student-item ${index >= students.length - 3 ? 'warning' : ''}`}
                onClick={() => setPage('studentProfile', { studentId: student.id })}
              >
                <img
                  src={student.profile_photo ? `/uploads/${student.profile_photo}` : `https://ui-avatars.com/api/?name=${student.name}`}
                  alt={student.name}
                  className="student-pic"
                />
                <div>
                  <p>{student.name}</p>
                  <p>General Grade: {student.general_grade}</p>
                </div>
                <div className="student-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                    className="action-button danger"
                    aria-label="Remove student"
                  >
                    <FaUserMinus />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); editStudent(student.id, student.name); }}
                    className="action-button"
                    aria-label="Edit student"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); addGrade(student.id); }}
                    className="action-button success"
                    aria-label="Add grade"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            ))
          )}
          <button onClick={addStudent} className="action-button primary">Add Student</button>
        </div>
        <div className="section">
          <h3 className="section-title">Chat Rooms</h3>
          {chatRooms.map((room) => (
            <div
              key={room.id}
              className="chatroom-item"
              onClick={() => setPage('chatRoom', { chatRoomId: room.id })}
            >
              <p>{room.name}</p>
            </div>
          ))}
          <button onClick={createChatRoom} className="action-button primary">Create Chat Room</button>
        </div>
        <div className="section">
          <h3 className="section-title">Study Groups</h3>
          {groups.map((group) => (
            <div
              key={group.id}
              className="group-item"
              onClick={() => setPage('studyGroup', { groupId: group.id })}
            >
              <p>{group.name}</p>
            </div>
          ))}
          <button onClick={createGroup} className="action-button primary">Create Group</button>
        </div>
        <div className="section">
          <h3 className="section-title">Performance</h3>
          <Line data={chartData} />
        </div>
      </div>
    </motion.div>
  )
}

export default TeacherDashboard
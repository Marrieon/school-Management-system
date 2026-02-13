import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './StudentProfile.css'

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const StudentProfile = ({ user, studentId, setPage }) => {
  const [student, setStudent] = useState(null)
  const [grades, setGrades] = useState([])
  const [targets, setTargets] = useState([])
  const [remarks, setRemarks] = useState([])
  const [newRemark, setNewRemark] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  const fetchStudentData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/students/${studentId}`)
      setStudent(response.data.student)
      setGrades(response.data.grades)
      setTargets(response.data.targets)
      setRemarks(response.data.remarks)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch student data', 'error')
    }
    setIsLoading(false)
  }

  const addRemark = async () => {
    if (!newRemark) {
      Swal.fire('Error', 'Remark cannot be empty', 'error')
      return
    }
    try {
      await axios.post('/api/remarks', { studentId, teacherId: user.id, content: newRemark })
      setNewRemark('')
      fetchStudentData()
      Swal.fire('Success', 'Remark added', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const chartData = {
    labels: grades.map(g => new Date(g.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Scores',
        data: grades.map(g => g.score),
        borderColor: '#A34054',
        backgroundColor: '#ED9E59',
      },
      {
        label: 'Targets',
        data: targets.map(t => t.target),
        borderColor: '#44174E',
        backgroundColor: '#662249',
      },
    ],
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="student-profile"
    >
      <h2 className="profile-title">Student Profile</h2>
      {isLoading ? (
        <div className="spinner">Loading...</div>
      ) : student ? (
        <div className="profile-content">
          <img
            src={student.profile_photo ? `/uploads/${student.profile_photo}` : `https://ui-avatars.com/api/?name=${student.name}`}
            alt={student.name}
            className="student-pic"
          />
          <h3 className="student-name">{student.name}</h3>
          <p>Email: {student.email}</p>
          <div className="section">
            <h4 className="section-title">Grades</h4>
            {grades.map((grade) => (
              <div key={grade.id} className="grade-item">
                <p>{grade.subject}: {grade.score} ({grade.grade})</p>
              </div>
            ))}
          </div>
          <div className="section">
            <h4 className="section-title">Targets</h4>
            {targets.map((target) => (
              <div key={target.id} className="target-item">
                <p>{target.subject}: {target.target}</p>
              </div>
            ))}
          </div>
          <div className="section">
            <h4 className="section-title">Remarks</h4>
            {remarks.map((remark) => (
              <div key={remark.id} className="remark-item">
                <p>{remark.content}</p>
                <small>{new Date(remark.created_at).toLocaleString()}</small>
              </div>
            ))}
            <div className="remark-input">
              <textarea
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                placeholder="Add a remark..."
                className="input-field"
              />
              <button onClick={addRemark} className="action-button">Add Remark</button>
            </div>
          </div>
          <div className="section">
            <h4 className="section-title">Performance Graph</h4>
            <Line data={chartData} />
          </div>
        </div>
      ) : (
        <p>Student not found</p>
      )}
      <button onClick={() => setPage('teacherDashboard')} className="action-button">Back to Dashboard</button>
    </motion.div>
  )
}

export default StudentProfile
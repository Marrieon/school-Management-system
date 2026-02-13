import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './Assignments.css'

const Assignments = ({ user, setPage }) => {
  const [assignments, setAssignments] = useState([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setIsLoading(true)
    try {
      const params = user.role === 'teacher' ? { teacher_id: user.id } : { student_id: user.id }
      const response = await axios.get('/api/assignments', { params })
      setAssignments(response.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch assignments', 'error')
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !file) {
      Swal.fire('Error', 'Title and file are required', 'error')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('student_id', user.id)
    formData.append('teacher_id', user.teacher_id || 'teacher_placeholder')
    try {
      await axios.post('/api/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setTitle('')
      setFile(null)
      fetchAssignments()
      Swal.fire('Success', 'Assignment submitted', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const updateStatus = async (assignmentId, status, studentId) => {
    try {
      await axios.put(`/api/assignments/${assignmentId}/status`, { status, student_id: studentId })
      fetchAssignments()
      Swal.fire('Success', 'Status updated', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="assignments"
      role="region"
      aria-label="Assignments"
    >
      <h2 className="assignments-title">Assignments</h2>
      {user.role === 'student' && (
        <form onSubmit={handleSubmit} className="assignment-form">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment Title"
            className="input-field"
            aria-label="Assignment title"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="input-field"
            aria-label="Upload assignment file"
          />
          <button
            type="submit"
            className="action-button"
            disabled={isLoading}
            aria-label="Submit assignment"
          >
            {isLoading ? <span className="spinner" /> : 'Submit'}
          </button>
        </form>
      )}
      <section className="assignments-list" aria-labelledby="assignments-list-title">
        <h3 id="assignments-list-title" className="section-title">Assignment List</h3>
        {isLoading ? (
          <div className="spinner" aria-live="polite">Loading...</div>
        ) : assignments.length > 0 ? (
          assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-item">
              <p><strong>{assignment.title}</strong> - Status: {assignment.status}</p>
              <a
                href={`/uploads/${assignment.file_path}`}
                download
                className="download-link"
                aria-label={`Download ${assignment.title}`}
              >
                Download
              </a>
              {user.role === 'teacher' && (
                <div className="status-buttons">
                  <button
                    onClick={() => updateStatus(assignment.id, 'Reviewed', assignment.student_id)}
                    className="action-button"
                    aria-label="Mark as reviewed"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(assignment.id, 'Graded', assignment.student_id)}
                    className="action-button"
                    aria-label="Mark as graded"
                  >
                    Mark Graded
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No assignments available</p>
        )}
      </section>
      <button
        onClick={() => setPage(user.role === 'teacher' ? 'teacherDashboard' : 'studentDashboard')}
        className="action-button"
        aria-label="Back to dashboard"
      >
        Back to Dashboard
      </button>
    </motion.div>
  )
}

export default Assignments
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Chart as ChartJS, LineElement, BarElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import './Analytics.css'

ChartJS.register(LineElement, BarElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

const Analytics = ({ user, studentId, setPage }) => {
  const [trends, setTrends] = useState({ grades: [], average_score: 0, subject_averages: [] })
  const [selectedSubject, setSelectedSubject] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTrends()
  }, [studentId])

  const fetchTrends = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/students/${studentId || user.id}/trends`)
      setTrends(response.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch analytics', 'error')
    }
    setIsLoading(false)
  }

  const filteredGrades = selectedSubject
    ? trends.grades.filter(g => g.subject === selectedSubject)
    : trends.grades

  const lineChartData = {
    labels: filteredGrades.map(g => new Date(g.created_at).toLocaleDateString()),
    datasets: [
      {
        label: selectedSubject || 'All Subjects',
        data: filteredGrades.map(g => g.score),
        borderColor: '#3498DB',
        backgroundColor: '#F1C40F',
      },
    ],
  }

  const barChartData = {
    labels: trends.subject_averages.map(s => s.subject),
    datasets: [
      {
        label: 'Average Score per Subject',
        data: trends.subject_averages.map(s => s.avg_score),
        backgroundColor: '#3498DB',
      },
    ],
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="analytics"
      role="region"
      aria-label="Analytics Dashboard"
    >
      <h2 className="analytics-title">Analytics</h2>
      {isLoading ? (
        <div className="spinner" aria-live="polite">Loading...</div>
      ) : (
        <div className="analytics-content">
          <div className="filter-section">
            <label htmlFor="subject-filter" className="filter-label">Filter by Subject:</label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
              aria-label="Filter by subject"
            >
              <option value="">All Subjects</option>
              {trends.subject_averages.map(s => (
                <option key={s.subject} value={s.subject}>{s.subject}</option>
              ))}
            </select>
          </div>
          <section className="chart-section" aria-labelledby="progress-title">
            <h3 id="progress-title" className="chart-title">Grade Progression</h3>
            <Line data={lineChartData} options={{ responsive: true }} />
          </section>
          <section className="chart-section" aria-labelledby="comparison-title">
            <h3 id="comparison-title" className="chart-title">Subject Comparison</h3>
            <Bar data={barChartData} options={{ responsive: true }} />
          </section>
          <p className="average-score">Overall Average: {trends.average_score.toFixed(2)}</p>
        </div>
      )}
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

export default Analytics
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Swal from 'sweetalert2'
import './StudyGroup.css'

const StudyGroup = ({ user, groupId, setPage }) => {
  const [group, setGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [newMemberId, setNewMemberId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchGroupData()
    fetchStudents()
  }, [groupId])

  const fetchGroupData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/groups/${groupId}`)
      setGroup(response.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch group data', 'error')
    }
    setIsLoading(false)
  }

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students')
      setStudents(response.data)
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch students', 'error')
    }
  }

  const addMember = async () => {
    if (!newMemberId) {
      Swal.fire('Error', 'Please select a student', 'error')
      return
    }
    try {
      await axios.post(`/api/groups/${groupId}/members`, { studentId: newMemberId, teacher_id: user.id })
      fetchGroupData()
      setNewMemberId('')
      Swal.fire('Success', 'Member added', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  const removeMember = async (memberId) => {
    try {
      await axios.delete(`/api/groups/${groupId}/members`, { data: { studentId: memberId } })
      fetchGroupData()
      Swal.fire('Success', 'Member removed', 'success')
    } catch (error) {
      Swal.fire('Error', error.response.data.message, 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="study-group"
    >
      <h2 className="group-title">Study Group</h2>
      {isLoading ? (
        <div className="spinner">Loading...</div>
      ) : group ? (
        <div className="group-content">
          <h3 className="group-name">{group.name}</h3>
          <div className="section">
            <h4 className="section-title">Members</h4>
            {group.members.map((memberId) => {
              const member = students.find(s => s.id === memberId)
              return member ? (
                <div key={member.id} className="member-item">
                  <img
                    src={member.profile_photo ? `/uploads/${member.profile_photo}` : `https://ui-avatars.com/api/?name=${member.name}`}
                    alt={member.name}
                    className="member-pic"
                  />
                  <p>{member.name}</p>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="action-button danger"
                  >
                    Remove
                  </button>
                </div>
              ) : null
            })}
            <div className="add-member">
              <select
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                className="input-field"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
              <button onClick={addMember} className="action-button">Add Member</button>
            </div>
          </div>
        </div>
      ) : (
        <p>Group not found</p>
      )}
      <button onClick={() => setPage('teacherDashboard')} className="action-button">Back to Dashboard</button>
    </motion.div>
  )
}

export default StudyGroup
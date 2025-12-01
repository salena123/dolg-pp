import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, jobsAPI } from '../api'
import DepartmentManagement from '../components/employer/DepartmentManagement'

function ProfilePage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const response = await applicationsAPI.getAll()
      setApplications(response.data)
      
      const jobIds = [...new Set(response.data.map((app) => app.job_id))]
      const jobsData = {}
      for (const jobId of jobIds) {
        try {
          const jobResponse = await jobsAPI.getById(jobId)
          jobsData[jobId] = jobResponse.data
        } catch (err) {
          console.error(`Ошибка загрузки вакансии ${jobId}:`, err)
        }
      }
      setJobs(jobsData)
      
      setError(null)
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err)
      console.error('Детали ошибки:', err.response?.data)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      submitted: { text: 'Отправлена', class: 'bg-info' },
      reviewed: { text: 'Рассматривается', class: 'bg-warning' },
      accepted: { text: 'Принята', class: 'bg-success' },
      rejected: { text: 'Отклонена', class: 'bg-danger' },
    }
    const statusInfo = statusMap[status] || { text: status, class: 'bg-secondary' }
    return (
      <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-4 mb-3">Личный кабинет</h1>
          <p className="lead text-muted">
            {user?.role === 'employer' 
              ? 'Управление вашим профилем и отделами' 
              : 'Здесь вы можете отслеживать статус ваших заявок'}
          </p>
        </div>
      </div>
      
      {user?.role === 'employer' && (
        <div className="row mb-5">
          <div className="col-12">
            <DepartmentManagement />
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">У вас пока нет заявок</h5>
          <p className="mb-0">
            Перейдите на <Link to="/">главную страницу</Link>, чтобы найти
            подходящие вакансии и подать заявку.
          </p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="row g-4">
          {applications.map((application) => {
            const job = jobs[application.job_id]
            return (
              <div key={application.id} className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-2">
                          {job ? (
                            <Link to={`/job/${job.id}`}>{job.title}</Link>
                          ) : (
                            `Вакансия #${application.job_id}`
                          )}
                        </h5>
                        <p className="text-muted mb-0">
                          Подана: {formatDate(application.submitted_at)}
                        </p>
                      </div>
                      <div>{getStatusBadge(application.status)}</div>
                    </div>

                    {application.cover_letter && (
                      <div className="mb-3">
                        <h6 className="text-muted">Сопроводительное письмо:</h6>
                        <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    {application.resume_url && (
                      <div className="mb-3">
                        <h6 className="text-muted">Резюме:</h6>
                        <a
                          href={application.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          Открыть резюме
                        </a>
                      </div>
                    )}

                    {application.updated_at &&
                      application.updated_at !== application.submitted_at && (
                        <small className="text-muted">
                          Обновлено: {formatDate(application.updated_at)}
                        </small>
                      )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProfilePage


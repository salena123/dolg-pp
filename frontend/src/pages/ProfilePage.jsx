import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, jobsAPI, employerReviewsAPI } from '../api'
import DepartmentManagement from '../components/employer/DepartmentManagement'

function ProfilePage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [myJobs, setMyJobs] = useState([])
  const [myJobsLoading, setMyJobsLoading] = useState(true)
  const [myJobsError, setMyJobsError] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [jobApplications, setJobApplications] = useState([])
  const [jobApplicationsLoading, setJobApplicationsLoading] = useState(false)
  const [jobApplicationsError, setJobApplicationsError] = useState(null)
  const [employerReviews, setEmployerReviews] = useState({})
  const [reviewForm, setReviewForm] = useState({})
  const [reviewSubmittingId, setReviewSubmittingId] = useState(null)
  const [reviewErrors, setReviewErrors] = useState({})
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [statusErrors, setStatusErrors] = useState({})

  useEffect(() => {
    if (user?.role === 'student') {
      loadApplications()
    } else {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => {
    if (user?.role === 'employer') {
      loadMyJobs()
    }
  }, [user?.role])

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

  const loadMyJobs = async () => {
    try {
      setMyJobsLoading(true)
      const response = await jobsAPI.getMy()
      setMyJobs(response.data)
      setMyJobsError(null)
    } catch (err) {
      console.error('Ошибка загрузки вакансий работодателя:', err)
      setMyJobsError(err.message)
    } finally {
      setMyJobsLoading(false)
    }
  }

  const loadApplicationsForJob = async (jobId) => {
    try {
      setSelectedJobId(jobId)
      setJobApplicationsLoading(true)
      setJobApplicationsError(null)
      const response = await applicationsAPI.getByJob(jobId)
      const apps = response.data
      setJobApplications(apps)

      const reviewsData = {}
      const formData = {}
      for (const app of apps) {
        try {
          const reviewResponse = await employerReviewsAPI.getForApplication(app.id)
          if (reviewResponse.data) {
            reviewsData[app.id] = reviewResponse.data
          } else {
            formData[app.id] = { rating: '', comment: '' }
          }
        } catch (err) {
          formData[app.id] = { rating: '', comment: '' }
        }
      }
      setEmployerReviews(reviewsData)
      setReviewForm(formData)
      setReviewErrors({})
    } catch (err) {
      console.error('Ошибка загрузки заявок для вакансии:', err)
      setJobApplicationsError(err.message)
      setJobApplications([])
    } finally {
      setJobApplicationsLoading(false)
    }
  }

  const handleReviewFieldChange = (applicationId, field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [applicationId]: {
        ...(prev[applicationId] || { rating: '', comment: '' }),
        [field]: value,
      },
    }))
  }

  const handleSubmitEmployerReview = async (applicationId) => {
    const form = reviewForm[applicationId]
    if (!form || !form.rating) {
      setReviewErrors((prev) => ({
        ...prev,
        [applicationId]: 'Укажите оценку от 1 до 5',
      }))
      return
    }

    try {
      setReviewSubmittingId(applicationId)
      setReviewErrors((prev) => ({ ...prev, [applicationId]: null }))
      const response = await employerReviewsAPI.create({
        application_id: applicationId,
        rating: Number(form.rating),
        comment: form.comment ? form.comment.trim() : null,
      })
      setEmployerReviews((prev) => ({
        ...prev,
        [applicationId]: response.data,
      }))
    } catch (err) {
      setReviewErrors((prev) => ({
        ...prev,
        [applicationId]: err.message,
      }))
    } finally {
      setReviewSubmittingId(null)
    }
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setStatusUpdatingId(applicationId)
      setStatusErrors((prev) => ({ ...prev, [applicationId]: null }))
      const response = await applicationsAPI.updateStatus(applicationId, newStatus)
      const updated = response.data
      setJobApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: updated.status } : app))
      )
    } catch (err) {
      setStatusErrors((prev) => ({
        ...prev,
        [applicationId]: err.message,
      }))
    } finally {
      setStatusUpdatingId(null)
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
              ? 'Управление вашим профилем, отделами и вакансиями' 
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

      {user?.role === 'employer' && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Мои вакансии</h5>
              </div>
              <div className="card-body">
                {myJobsLoading && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Загрузка...</span>
                    </div>
                  </div>
                )}

                {myJobsError && (
                  <div className="alert alert-danger" role="alert">
                    <strong>Ошибка:</strong> {myJobsError}
                  </div>
                )}

                {!myJobsLoading && !myJobsError && myJobs.length === 0 && (
                  <div className="alert alert-info mb-0" role="alert">
                    У вас пока нет созданных вакансий.
                  </div>
                )}

                {!myJobsLoading && !myJobsError && myJobs.length > 0 && (
                  <div className="row g-3">
                    {myJobs.map((job) => (
                      <div key={job.id} className="col-12 col-md-6">
                        <div className="card h-100">
                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title">{job.title}</h5>
                            <p className="card-text text-muted flex-grow-1">
                              {job.description?.length > 120
                                ? `${job.description.substring(0, 120)}...`
                                : job.description}
                            </p>
                            <div className="mb-2">
                              <span className={`badge ${job.status === 'open' ? 'bg-success' : 'bg-secondary'}`}>
                                {job.status === 'open' ? 'Открыта' : 'Закрыта'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-primary mt-auto"
                              onClick={() => loadApplicationsForJob(job.id)}
                            >
                              Показать отклики
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedJobId && (
              <div className="card">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Отклики на вакансию #{selectedJobId}</h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSelectedJobId(null)
                      setJobApplications([])
                      setJobApplicationsError(null)
                    }}
                  >
                    Скрыть
                  </button>
                </div>
                <div className="card-body">
                  {jobApplicationsLoading && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                      </div>
                    </div>
                  )}

                  {jobApplicationsError && (
                    <div className="alert alert-danger" role="alert">
                      <strong>Ошибка:</strong> {jobApplicationsError}
                    </div>
                  )}

                  {!jobApplicationsLoading && !jobApplicationsError && jobApplications.length === 0 && (
                    <div className="alert alert-info mb-0" role="alert">
                      На эту вакансию пока нет откликов.
                    </div>
                  )}

                  {!jobApplicationsLoading && !jobApplicationsError && jobApplications.length > 0 && (
                    <div className="list-group">
                      {jobApplications.map((app) => (
                        <div key={app.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="mb-1">
                                <strong>Заявка #{app.id}</strong>
                              </div>
                              <div className="mb-2">
                                <div className="text-muted small mb-1">Статус заявки:</div>
                                <div className="d-flex align-items-center">
                                  <select
                                    className="form-select form-select-sm me-2"
                                    value={app.status}
                                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                    disabled={statusUpdatingId === app.id}
                                  >
                                    <option value="submitted">Отправлена</option>
                                    <option value="reviewed">Рассматривается</option>
                                    <option value="accepted">Принята</option>
                                    <option value="rejected">Отклонена</option>
                                  </select>
                                </div>
                                {statusErrors[app.id] && (
                                  <div className="text-danger small mt-1">{statusErrors[app.id]}</div>
                                )}
                              </div>
                              {app.cover_letter && (
                                <div className="mt-2">
                                  <div className="text-muted small mb-1">Сопроводительное письмо:</div>
                                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                    {app.cover_letter}
                                  </p>
                                </div>
                              )}
                              {employerReviews[app.id] && (
                                <div className="mt-2">
                                  <div className="text-muted small mb-1">Ваша оценка студента:</div>
                                  <p className="mb-1">
                                    Оценка: <strong>{employerReviews[app.id].rating} / 5</strong>
                                  </p>
                                  {employerReviews[app.id].comment && (
                                    <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                      {employerReviews[app.id].comment}
                                    </p>
                                  )}
                                </div>
                              )}
                              {!employerReviews[app.id] && reviewForm[app.id] && app.status === 'accepted' && (
                                <div className="mt-3">
                                  <div className="text-muted small mb-1">Оценить студента:</div>
                                  {reviewErrors[app.id] && (
                                    <div className="alert alert-danger py-1 mb-2" role="alert" style={{ fontSize: '0.875rem' }}>
                                      {reviewErrors[app.id]}
                                    </div>
                                  )}
                                  <div className="row g-2 align-items-center mb-2">
                                    <div className="col-4">
                                      <select
                                        className="form-select form-select-sm"
                                        value={reviewForm[app.id].rating}
                                        onChange={(e) => handleReviewFieldChange(app.id, 'rating', e.target.value)}
                                        disabled={reviewSubmittingId === app.id}
                                      >
                                        <option value="">Оценка</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                      </select>
                                    </div>
                                    <div className="col-8">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Краткий комментарий"
                                        value={reviewForm[app.id].comment}
                                        onChange={(e) => handleReviewFieldChange(app.id, 'comment', e.target.value)}
                                        disabled={reviewSubmittingId === app.id}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success"
                                    disabled={reviewSubmittingId === app.id}
                                    onClick={() => handleSubmitEmployerReview(app.id)}
                                  >
                                    {reviewSubmittingId === app.id ? 'Сохранение...' : 'Сохранить оценку'}
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="ms-3 text-end">
                              {app.resume_url && (
                                <a
                                  href={app.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary mb-2"
                                >
                                  Резюме
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'student' && loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      )}

      {user?.role === 'student' && error && (
        <div className="alert alert-danger" role="alert">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      {user?.role === 'student' && !loading && !error && applications.length === 0 && (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">У вас пока нет заявок</h5>
          <p className="mb-0">
            Перейдите на <Link to="/">главную страницу</Link>, чтобы найти
            подходящие вакансии и подать заявку.
          </p>
        </div>
      )}

      {user?.role === 'student' && !loading && !error && applications.length > 0 && (
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


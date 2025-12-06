import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { jobsAPI, applicationsAPI, reviewsAPI } from '../api'
import ApplicationForm from '../components/ApplicationForm'

function JobPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isStudent, user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState(null)
  const [userRating, setUserRating] = useState('')
  const [userComment, setUserComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    loadJob()
    loadReviews()
  }, [id])

  const loadJob = async () => {
    try {
      setLoading(true)
      const response = await jobsAPI.getById(id)
      setJob(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await reviewsAPI.getForJob(id)
      setReviews(response.data)
      setReviewsError(null)
      if (user) {
        const existing = response.data.find(r => r.user_id === user.id)
        if (existing) {
          setUserRating(String(existing.rating))
          setUserComment(existing.comment || '')
        } else {
          setUserRating('')
          setUserComment('')
        }
      }
    } catch (err) {
      setReviewsError(err.message)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleApplicationSubmit = async (formData) => {
    await applicationsAPI.create(formData)
    setSubmitSuccess(true)
    setShowForm(false)
    setTimeout(() => {
      navigate('/profile')
    }, 2000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  }

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user || !isStudent) {
      return
    }
    if (!userRating) {
      return
    }
    try {
      setReviewSubmitting(true)
      setReviewSuccess(false)
      await reviewsAPI.create({
        job_id: Number(id),
        rating: Number(userRating),
        comment: userComment ? userComment.trim() : null,
      })
      setReviewSuccess(true)
      await loadReviews()
    } catch (err) {
      setReviewsError(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger" role="alert">
          <strong>Ошибка:</strong> {error}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Вернуться на главную
        </button>
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="container my-5">
      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Успешно!</strong> Ваша заявка отправлена. Вы будете перенаправлены в личный кабинет.
        </div>
      )}

      <div className="row">
        <div className="col-12 mb-4">
          <button
            className="btn btn-outline-secondary mb-3"
            onClick={() => navigate('/')}
          >
            ← Назад к списку вакансий
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="card-title display-5 mb-4">{job.title}</h1>
              
              <div className="mb-4">
                <h5 className="mb-3">Описание вакансии</h5>
                <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {job.description}
                </p>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="text-muted">Детали вакансии</h6>
                  <ul className="list-unstyled">
                    {job.location && (
                      <li className="mb-2">
                        <strong>Местоположение:</strong> {job.location}
                      </li>
                    )}
                    {job.employment_type && (
                      <li className="mb-2">
                        <strong>Тип занятости:</strong> {job.employment_type}
                      </li>
                    )}
                    <li className="mb-2">
                      <strong>Удаленная работа:</strong>{' '}
                      {job.remote ? 'Да' : 'Нет'}
                    </li>
                    {job.start_date && (
                      <li className="mb-2">
                        <strong>Дата начала:</strong> {formatDate(job.start_date)}
                      </li>
                    )}
                    {job.end_date && (
                      <li className="mb-2">
                        <strong>Дата окончания:</strong> {formatDate(job.end_date)}
                      </li>
                    )}
                    {job.spots && (
                      <li className="mb-2">
                        <strong>Количество мест:</strong> {job.spots}
                      </li>
                    )}
                    <li className="mb-2">
                      <strong>Статус:</strong>{' '}
                      <span
                        className={`badge ${
                          job.status === 'open' ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {job.status === 'open' ? 'Открыта' : 'Закрыта'}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted">Рейтинг стажировки</h6>
                  {reviewsLoading ? (
                    <p className="text-muted mb-2">Загрузка рейтинга...</p>
                  ) : reviewsError ? (
                    <p className="text-danger mb-2">{reviewsError}</p>
                  ) : averageRating ? (
                    <p className="mb-1">
                      Средний рейтинг: <strong>{averageRating} / 5</strong>
                    </p>
                  ) : (
                    <p className="text-muted mb-1">Пока нет отзывов</p>
                  )}
                  {!reviewsLoading && reviews.length > 0 && (
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                      Отзывов: {reviews.length}
                    </p>
                  )}
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-12 col-lg-8">
                  <h5 className="mb-3">Отзывы студентов</h5>
                  {reviewsLoading && <p className="text-muted">Загрузка отзывов...</p>}
                  {!reviewsLoading && reviews.length === 0 && (
                    <p className="text-muted mb-0">Пока нет отзывов.</p>
                  )}
                  {!reviewsLoading && reviews.length > 0 && (
                    <div className="list-group mb-3">
                      {reviews.map((r) => (
                        <div key={r.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="mb-1">
                                Оценка: <strong>{r.rating} / 5</strong>
                              </div>
                              {r.comment && (
                                <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                  {r.comment}
                                </p>
                              )}
                            </div>
                            <small className="text-muted ms-3">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-4">
                  {isAuthenticated && isStudent ? (
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title mb-3">Оставить отзыв</h5>
                        {reviewSuccess && (
                          <div className="alert alert-success py-2" role="alert">
                            Ваш отзыв сохранен.
                          </div>
                        )}
                        <form onSubmit={handleReviewSubmit}>
                          <div className="mb-3">
                            <label htmlFor="rating" className="form-label">
                              Оценка (1–5)
                            </label>
                            <select
                              id="rating"
                              className="form-select"
                              value={userRating}
                              onChange={(e) => setUserRating(e.target.value)}
                              disabled={reviewSubmitting}
                            >
                              <option value="">Не выбрано</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="comment" className="form-label">
                              Комментарий (необязательно)
                            </label>
                            <textarea
                              id="comment"
                              className="form-control"
                              rows="3"
                              value={userComment}
                              onChange={(e) => setUserComment(e.target.value)}
                              disabled={reviewSubmitting}
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={reviewSubmitting || !userRating}
                          >
                            {reviewSubmitting ? 'Сохранение...' : 'Отправить отзыв'}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted">
                      Только авторизованные студенты могут оставлять отзывы.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
            <div className="card-body">
              {job.status === 'open' ? (
                <>
                  {!isAuthenticated ? (
                    <div className="alert alert-info mb-0" role="alert">
                      <p className="mb-2">Для подачи заявки необходимо войти в систему</p>
                      <Link to="/login" className="btn btn-primary btn-sm">
                        Войти
                      </Link>
                    </div>
                  ) : !isStudent ? (
                    <div className="alert alert-warning mb-0" role="alert">
                      Только студенты могут подавать заявки на вакансии
                    </div>
                  ) : !showForm ? (
                    <>
                      <h5 className="card-title mb-3">Подать заявку</h5>
                      <p className="card-text text-muted mb-4">
                        Заполните форму, чтобы подать заявку на эту вакансию
                      </p>
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => setShowForm(true)}
                      >
                        Подать заявку
                      </button>
                    </>
                  ) : (
                    <ApplicationForm
                      jobId={job.id}
                      onSubmit={handleApplicationSubmit}
                      onCancel={() => setShowForm(false)}
                    />
                  )}
                </>
              ) : (
                <div className="alert alert-secondary mb-0" role="alert">
                  Эта вакансия больше не принимает заявки
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobPage


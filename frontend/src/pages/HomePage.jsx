import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

function HomePage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isEmployer, user } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    employment_type: '',
    location: '',
    remote: null,
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    location: '',
    employment_type: '',
    remote: false,
    start_date: '',
    end_date: '',
    spots: '',
  })
  const [createError, setCreateError] = useState(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [filters, searchTerm])

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [showCreateModal])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const params = {
        status: 'open',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.employment_type && { employment_type: filters.employment_type }),
        ...(filters.location && { location: filters.location }),
        ...(filters.remote !== null && { remote: filters.remote }),
      }
      const response = await jobsAPI.getAll(params)
      setJobs(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value === '' ? '' : value
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      employment_type: '',
      location: '',
      remote: null,
    })
  }

  const handleCreateFieldChange = (e) => {
    const { name, value, type, checked } = e.target
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleOpenCreateModal = () => {
    setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    if (createSubmitting) return
    setShowCreateModal(false)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) {
      setCreateError('Не удалось определить работодателя')
      return
    }

    if (!createForm.title.trim() || !createForm.description.trim()) {
      setCreateError('Название и описание вакансии обязательны')
      return
    }

    try {
      setCreateSubmitting(true)
      setCreateError(null)

      const payload = {
        employer_id: user.id,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        location: createForm.location.trim() || null,
        employment_type: createForm.employment_type || null,
        remote: !!createForm.remote,
        start_date: createForm.start_date || null,
        end_date: createForm.end_date || null,
        spots: createForm.spots ? Number(createForm.spots) : null,
      }

      await jobsAPI.create(payload)
      await loadJobs()

      setCreateForm({
        title: '',
        description: '',
        location: '',
        employment_type: '',
        remote: false,
        start_date: '',
        end_date: '',
        spots: '',
      })
      setShowCreateModal(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateSubmitting(false)
    }
  }

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-4 mb-3">Доступные вакансии</h1>
          <p className="lead text-muted">
            Найдите подходящую работу или стажировку в кампусе университета
          </p>
          {isEmployer && (
            <button
              type="button"
              className="btn btn-primary mt-2"
              onClick={handleOpenCreateModal}
            >
              Создать вакансию
            </button>
          )}
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="search" className="form-label">Поиск по ключевым словам</label>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Введите ключевые слова..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="employment_type" className="form-label">Тип занятости</label>
              <select
                className="form-select"
                id="employment_type"
                value={filters.employment_type}
                onChange={(e) => handleFilterChange('employment_type', e.target.value)}
              >
                <option value="">Все типы</option>
                <option value="full-time">Полная занятость</option>
                <option value="part-time">Частичная занятость</option>
                <option value="internship">Стажировка</option>
                <option value="contract">Договор</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="location" className="form-label">Местоположение</label>
              <input
                type="text"
                className="form-control"
                id="location"
                placeholder="Город или адрес..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Удаленная работа</label>
              <div>
                <button
                  type="button"
                  className={`btn btn-sm me-2 ${filters.remote === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleFilterChange('remote', null)}
                >
                  Все
                </button>
                <button
                  type="button"
                  className={`btn btn-sm me-2 ${filters.remote === true ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleFilterChange('remote', true)}
                >
                  Только удаленные
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filters.remote === false ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleFilterChange('remote', false)}
                >
                  Только офисные
                </button>
              </div>
            </div>

            <div className="col-12 col-md-8 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {!loading && !error && jobs.length === 0 && (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">Вакансии не найдены</h5>
          <p className="mb-0">
            {(searchTerm || filters.employment_type || filters.location || filters.remote !== null) 
              ? 'Попробуйте изменить параметры поиска или фильтры'
              : 'На данный момент нет доступных вакансий'}
          </p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <div className="mb-3">
            <p className="text-muted">Найдено вакансий: <strong>{jobs.length}</strong></p>
          </div>
          <div className="row g-4">
            {jobs.map((job) => (
              <div key={job.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{job.title}</h5>
                    <p className="card-text text-muted flex-grow-1">
                      {job.description.length > 150
                        ? `${job.description.substring(0, 150)}...`
                        : job.description}
                    </p>
                    <div className="mb-3">
                      {job.location && (
                        <small className="text-muted d-block">
                          {job.location}
                        </small>
                      )}
                      {job.employment_type && (
                        <small className="text-muted d-block">
                          {job.employment_type}
                        </small>
                      )}
                      {job.remote && (
                        <span className="badge bg-success">Удаленная работа</span>
                      )}
                    </div>
                    <Link
                      to={`/job/${job.id}`}
                      className="btn btn-primary mt-auto"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseCreateModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Создать вакансию</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseCreateModal}
                  disabled={createSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                {createError && (
                  <div className="alert alert-danger" role="alert">
                    {createError}
                  </div>
                )}
                <form onSubmit={handleCreateSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Название вакансии
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={createForm.title}
                      onChange={handleCreateFieldChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Описание
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="4"
                      value={createForm.description}
                      onChange={handleCreateFieldChange}
                      required
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="location" className="form-label">
                        Местоположение
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={createForm.location}
                        onChange={handleCreateFieldChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="employment_type" className="form-label">
                        Тип занятости
                      </label>
                      <select
                        className="form-select"
                        id="employment_type"
                        name="employment_type"
                        value={createForm.employment_type}
                        onChange={handleCreateFieldChange}
                      >
                        <option value="">Не выбрано</option>
                        <option value="full-time">Полная занятость</option>
                        <option value="part-time">Частичная занятость</option>
                        <option value="internship">Стажировка</option>
                        <option value="contract">Договор</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label htmlFor="start_date" className="form-label">
                        Дата начала
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="start_date"
                        name="start_date"
                        value={createForm.start_date}
                        onChange={handleCreateFieldChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="end_date" className="form-label">
                        Дата окончания
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="end_date"
                        name="end_date"
                        value={createForm.end_date}
                        onChange={handleCreateFieldChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="spots" className="form-label">
                        Количество мест
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="spots"
                        name="spots"
                        min="1"
                        value={createForm.spots}
                        onChange={handleCreateFieldChange}
                      />
                    </div>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="remote"
                      name="remote"
                      checked={createForm.remote}
                      onChange={handleCreateFieldChange}
                    />
                    <label className="form-check-label" htmlFor="remote">
                      Удаленная работа
                    </label>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary me-2"
                      onClick={handleCloseCreateModal}
                      disabled={createSubmitting}
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={createSubmitting}
                    >
                      {createSubmitting ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
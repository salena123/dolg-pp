import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../api'

function HomePage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    employment_type: '',
    location: '',
    remote: null,
  })

  useEffect(() => {
    loadJobs()
  }, [filters, searchTerm])

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

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-4 mb-3">Доступные вакансии</h1>
          <p className="lead text-muted">
            Найдите подходящую работу или стажировку в кампусе университета
          </p>
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
    </div>
  )
}

export default HomePage
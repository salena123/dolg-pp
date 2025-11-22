import React, { useState } from 'react'
import { applicationsAPI } from '../api'

function ApplicationForm({ jobId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    job_id: jobId,
    cover_letter: '',
    resume_url: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          resume_file: 'Файл слишком большой. Максимальный размер: 5 MB'
        }))
        return
      }
      
      const allowedTypes = ['.pdf', '.doc', '.docx']
      const fileExt = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedTypes.includes(fileExt)) {
        setErrors((prev) => ({
          ...prev,
          resume_file: 'Неподдерживаемый формат. Используйте: PDF, DOC или DOCX'
        }))
        return
      }
      
      setResumeFile(file)
      setErrors((prev) => ({
        ...prev,
        resume_file: null
      }))
    }
  }

  const handleUploadResume = async () => {
    if (!resumeFile) return null
    
    try {
      setUploadingResume(true)
      const response = await applicationsAPI.uploadResume(resumeFile)
      return response.data.file_url
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        resume_file: err.response?.data?.detail?.detail || err.message || 'Ошибка при загрузке файла'
      }))
      return null
    } finally {
      setUploadingResume(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.cover_letter.trim()) {
      newErrors.cover_letter = 'Пожалуйста, заполните сопроводительное письмо'
    } else if (formData.cover_letter.trim().length < 50) {
      newErrors.cover_letter = 'Сопроводительное письмо должно содержать минимум 50 символов'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      let resumeUrl = formData.resume_url
      if (resumeFile) {
        const uploadedUrl = await handleUploadResume()
        if (uploadedUrl) {
          resumeUrl = uploadedUrl
        } else {
          setSubmitting(false)
          return
        }
      }
      
      await onSubmit({
        ...formData,
        resume_url: resumeUrl
      })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="mb-3">Форма заявки</h5>
      
      <div className="mb-3">
        <label htmlFor="cover_letter" className="form-label">
          Сопроводительное письмо <span className="text-danger">*</span>
        </label>
        <textarea
          className={`form-control ${errors.cover_letter ? 'is-invalid' : ''}`}
          id="cover_letter"
          name="cover_letter"
          rows="6"
          value={formData.cover_letter}
          onChange={handleChange}
          placeholder="Расскажите о себе, своих навыках и почему вы подходите для этой вакансии..."
          required
        />
        {errors.cover_letter && (
          <div className="invalid-feedback">{errors.cover_letter}</div>
        )}
        <small className="form-text text-muted">
          Минимум 50 символов. Текущее количество: {formData.cover_letter.length}
        </small>
      </div>

      <div className="mb-3">
        <label htmlFor="resume_file" className="form-label">
          Загрузить резюме (необязательно)
        </label>
        <input
          type="file"
          className={`form-control ${errors.resume_file ? 'is-invalid' : ''}`}
          id="resume_file"
          name="resume_file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        {errors.resume_file && (
          <div className="invalid-feedback">{errors.resume_file}</div>
        )}
        {resumeFile && (
          <div className="mt-2">
            <small className="text-success">
              Файл выбран: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(2)} KB)
            </small>
          </div>
        )}
        {uploadingResume && (
          <div className="mt-2">
            <small className="text-info">
              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              Загрузка файла...
            </small>
          </div>
        )}
        <small className="form-text text-muted">
          Поддерживаемые форматы: PDF, DOC, DOCX. Максимальный размер: 5 MB
        </small>
      </div>

      <div className="mb-3">
        <label htmlFor="resume_url" className="form-label">
          Или укажите ссылку на резюме (необязательно)
        </label>
        <input
          type="url"
          className="form-control"
          id="resume_url"
          name="resume_url"
          value={formData.resume_url}
          onChange={handleChange}
          placeholder="https://example.com/resume.pdf"
          disabled={!!resumeFile}
        />
        <small className="form-text text-muted">
          Укажите ссылку на ваше резюме, если оно размещено в интернете (не используется, если загружен файл)
        </small>
      </div>

      {errors.submit && (
        <div className="alert alert-danger" role="alert">
          {errors.submit}
        </div>
      )}

      <div className="d-grid gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Отправка...
            </>
          ) : (
            'Отправить заявку'
          )}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

export default ApplicationForm


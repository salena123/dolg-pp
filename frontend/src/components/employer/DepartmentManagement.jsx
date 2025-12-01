import React, { useState, useEffect } from 'react';
import { departmentsAPI } from '../../api';

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    office: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getMyDepartment();
      if (response.data) {
        setDepartments([response.data]);
      } else {
        setDepartments([]);
      }
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки отдела:', err);
      setError('Не удалось загрузить информацию об отделе');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      if (cleaned === '' || /^9\d*$/.test(cleaned)) {
        setFormData(prev => ({
          ...prev,
          [name]: cleaned
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone && !/^9\d{9}$/.test(formData.phone)) {
      setError('Номер телефона должен быть в формате 9XXXXXXXXX (10 цифр, начиная с 9)');
      return;
    }
    
    try {
      setError(null);
      if (editingId) {
        await departmentsAPI.updateMyDepartment(formData);
      } else {
        await departmentsAPI.createDepartment(formData);
      }
      await loadDepartments();
      handleCancel();
    } catch (err) {
      console.error('Ошибка сохранения отдела:', err);
      setError(err.response?.data?.detail || 'Не удалось сохранить отдел');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      office: '',
      phone: ''
    });
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (dept) => {
    if (!dept) return;
    
    setFormData({
      name: dept.name || '',
      office: dept.office || '',
      phone: dept.phone ? dept.phone.replace(/^\+7/, '') : ''
    });
    setEditingId(dept.id);
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm('Вы уверены, что хотите удалить этот отдел?')) {
      return;
    }
    
    try {
      setLoading(true);
      await departmentsAPI.deleteDepartment(id);
      await loadDepartments();
      handleCancel();
    } catch (err) {
      console.error('Ошибка удаления отдела:', err);
      setError(err.response?.data?.detail || 'Не удалось удалить отдел');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Управление отделом</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Показываем форму только если отдела ещё нет или мы в режиме редактирования */}
        {(departments.length === 0 || editingId !== null) && (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Название отдела <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="office" className="form-label">
                Кабинет
              </label>
              <input
                type="text"
                className="form-control"
                id="office"
                name="office"
                value={formData.office}
                onChange={handleInputChange}
                placeholder="Например: 101"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="phone" className="form-label">
                Телефон
              </label>
              <div className="input-group">
                <span className="input-group-text">+7</span>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9XXXXXXXXX"
                  maxLength={10}
                />
              </div>
              <small className="form-text text-muted">
                Введите 10 цифр, начиная с 9 (например: 9123456789)
              </small>
            </div>
          </div>
          <button type="submit" className="btn btn-primary px-4">
            {editingId ? 'Обновить отдел' : 'Добавить отдел'}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="btn btn-outline-secondary ms-2 px-4"
              onClick={handleCancel}
            >
              Отмена
            </button>
          )}
        </form>
        )}

        {/* Сообщение, если отдел ещё не добавлен */}
        {departments.length === 0 && !loading && (
          <div className="mt-3 text-muted">
            Вы пока не добавили отдел.
          </div>
        )}

        {departments.length > 0 && (
          <div className="mt-4">
            <h6>Ваш отдел:</h6>
            <div className="list-group">
              {departments.map((dept) => (
                <div key={dept.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{dept.name}</h6>
                      <div className="mt-2">
                        {dept.office && (
                          <div className="text-muted">
                            <i className="bi bi-door-open me-2"></i> Кабинет: {dept.office}
                          </div>
                        )}
                        {dept.phone && (
                          <div className="text-muted">
                            <i className="bi bi-telephone me-2"></i> Телефон: {dept.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button 
                        className="btn btn-outline-primary me-3 px-4"
                        onClick={() => handleEdit(dept)}
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Изменить
                      </button>
                      <button 
                        className="btn btn-outline-danger px-4"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentManagement;

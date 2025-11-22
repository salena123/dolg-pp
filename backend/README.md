# Backend - Кампусные вакансии API

FastAPI приложение для управления вакансиями и заявками.

## Установка зависимостей

```bash
pip install -r requirements.txt
```

## Настройка

Создайте файл `.env` в корне папки `backend` со следующим содержимым:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=campusjobs
SECRET_KEY=your-secret-key-min-32-chars-long-change-in-production
```

## Запуск

```bash
uvicorn app.main:app --reload
```

API будет доступен по адресу http://localhost:8000

Документация API доступна по адресу http://localhost:8000/docs

## Роли пользователей

- **student** - Студент (может подавать заявки на вакансии)
- **employer** - Работодатель (может создавать вакансии)
- **admin** - Администратор (полный доступ)

## API Endpoints

### Аутентификация
- `POST /auth/register` - Регистрация нового пользователя
- `POST /auth/login` - Вход в систему (получение JWT токена)
- `GET /auth/me` - Получить информацию о текущем пользователе

### Вакансии
- `GET /jobs` - Получить список вакансий
- `GET /jobs/{id}` - Получить вакансию по ID
- `POST /jobs` - Создать вакансию (требует авторизации)
- `PUT /jobs/{id}` - Обновить вакансию (требует авторизации)
- `DELETE /jobs/{id}` - Удалить вакансию (требует авторизации)

### Заявки
- `GET /applications` - Получить список заявок (требует авторизации)
- `GET /applications/{id}` - Получить заявку по ID (требует авторизации)
- `POST /applications` - Создать заявку (требует авторизации студента)
- `DELETE /applications/{id}` - Удалить заявку (требует авторизации)





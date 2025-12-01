import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token')
      
      if (storedToken) {
        try {
          const response = await authAPI.getMe()
          setUser(response.data)
          setToken(storedToken)
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error)
          console.error('Детали ошибки:', error.response?.data)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } else {
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      console.log('Ответ от сервера при входе:', response.data)
      const { access_token, user: userData } = response.data
      console.log('Токен получен:', access_token ? access_token.substring(0, 20) + '...' : 'НЕТ ТОКЕНА')
      console.log('Данные пользователя:', userData)
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(userData)
      setLoading(false)
      return { success: true }
    } catch (error) {
      console.error('Ошибка входа:', error)
      console.error('Детали ошибки:', error.response?.data)
      setLoading(false)
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const loginResponse = await authAPI.login({
        email: userData.email,
        password: userData.password
      })
      const { access_token, user: newUser } = loginResponse.data
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(newUser)
      setLoading(false)
      return { success: true }
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      setLoading(false)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
    isStudent: user?.role === 'student',
    isEmployer: user?.role === 'employer',
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


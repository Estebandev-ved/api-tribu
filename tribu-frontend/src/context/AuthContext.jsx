import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tribu_user')) } catch { return null }
    })

    const loginUser = (userData) => {
        localStorage.setItem('tribu_token', userData.token)
        localStorage.setItem('tribu_user', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('tribu_token')
        localStorage.removeItem('tribu_user')
        setUser(null)
    }

    const isAdmin = user?.rol === 'ADMIN'
    const isAuthenticated = !!user

    return (
        <AuthContext.Provider value={{ user, loginUser, logout, isAdmin, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

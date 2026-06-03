import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('tribu_user');
            console.log('[AuthContext] Initializing user from localStorage:', stored ? 'Found' : 'Not found');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('[AuthContext] Error parsing stored user:', e);
            return null;
        }
    })

    const loginUser = (userData) => {
        console.log('[AuthContext] loginUser called with:', userData?.email);
        localStorage.setItem('tribu_token', userData.token)
        localStorage.setItem('tribu_user', JSON.stringify(userData))
        setUser(userData)
    }

    const updateUser = (fieldsToUpdate) => {
        console.log('[AuthContext] updateUser called with fields:', fieldsToUpdate);
        if (!user) {
            console.warn('[AuthContext] Cannot update user: no active user session.');
            return;
        }
        const updated = { ...user, ...fieldsToUpdate }
        localStorage.setItem('tribu_user', JSON.stringify(updated))
        setUser(updated)
    }

    const logout = () => {
        console.log('[AuthContext] logout called. Clearing session.');
        localStorage.removeItem('tribu_token')
        localStorage.removeItem('tribu_user')
        setUser(null)
    }

    const isAdmin = user?.rol === 'ADMIN'
    const isAuthenticated = !!user

    console.log('[AuthContext] Rendering AuthProvider. user:', user?.email, 'isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin);

    return (
        <AuthContext.Provider value={{ user, loginUser, logout, isAdmin, isAuthenticated, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import './Layout.css'

const Layout = ({ user, onLogout, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className="app-layout">
            <Sidebar
                user={user}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onToggle={setSidebarOpen}
            />
            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {children}
            </main>
        </div>
    )
}

export default Layout

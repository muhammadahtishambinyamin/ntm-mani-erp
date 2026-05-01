import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    FaBars,
    FaTimes,
    FaCog,
    FaDatabase,
    FaSignOutAlt,
    FaUniversity,
    FaBuilding,
    FaDollarSign,
    FaUsers,
    FaSitemap,
    FaFileInvoice,
    FaTachometerAlt,
    FaChartBar
} from 'react-icons/fa'
import './Sidebar.css'

const Sidebar = ({ user, onLogout, isOpen, onToggle }) => {
    const navigate = useNavigate()
    const location = useLocation()

    // Use internal state if props not provided (for backward compatibility)
    const [internalOpen, setInternalOpen] = useState(window.innerWidth > 768)
    const sidebarOpen = isOpen !== undefined ? isOpen : internalOpen
    const setSidebarOpen = onToggle || setInternalOpen

    const [setupOpen, setSetupOpen] = useState(false)
    const [dataEntryOpen, setDataEntryOpen] = useState(false)
    const [reportsOpen, setReportsOpen] = useState(false)

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            onLogout()
            navigate('/')
        }
    }

    const handleNavigation = (path) => {
        navigate(path)
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            setSidebarOpen(false)
        }
    }

    const isActive = (path) => location.pathname === path

    return (
        <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Toggle Button */}
            <button
                className="mobile-sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle Sidebar"
            >
                <FaBars />
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <h2>{sidebarOpen && 'NTM Credit'}</h2>
                    <button
                        className="toggle-btn desktop-only"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle Sidebar"
                    >
                        {sidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                    <button
                        className="toggle-btn mobile-only"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close Sidebar"
                    >
                        <FaTimes />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {/* Dashboard */}
                    <div className="nav-section">
                        <button
                            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                            onClick={() => handleNavigation('/dashboard')}
                        >
                            <FaTachometerAlt className="nav-icon" />
                            {sidebarOpen && <span>Dashboard</span>}
                        </button>
                    </div>

                    {/* Setup Section */}
                    <div className="nav-section">
                        <button
                            className={`nav-item ${setupOpen ? 'active' : ''}`}
                            onClick={() => setSetupOpen(!setupOpen)}
                        >
                            <FaCog className="nav-icon" />
                            {sidebarOpen && <span>Setup</span>}
                            {sidebarOpen && <span className="arrow">{setupOpen ? '▼' : '▶'}</span>}
                        </button>

                        {setupOpen && sidebarOpen && (
                            <div className="sub-menu">
                                <button
                                    className={`sub-item ${isActive('/setup/banks') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/setup/banks')}
                                >
                                    <FaUniversity className="sub-icon" />
                                    <span>Banks</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/setup/departments') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/setup/departments')}
                                >
                                    <FaSitemap className="sub-icon" />
                                    <span>Departments</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/setup/companies') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/setup/companies')}
                                >
                                    <FaBuilding className="sub-icon" />
                                    <span>Companies</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/setup/currencies') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/setup/currencies')}
                                >
                                    <FaDollarSign className="sub-icon" />
                                    <span>Currencies</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/setup/customers') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/setup/customers')}
                                >
                                    <FaUsers className="sub-icon" />
                                    <span>Customers</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Data Entry Section */}
                    <div className="nav-section">
                        <button
                            className={`nav-item ${dataEntryOpen ? 'active' : ''}`}
                            onClick={() => setDataEntryOpen(!dataEntryOpen)}
                        >
                            <FaDatabase className="nav-icon" />
                            {sidebarOpen && <span>Data Entry</span>}
                            {sidebarOpen && <span className="arrow">{dataEntryOpen ? '▼' : '▶'}</span>}
                        </button>

                        {dataEntryOpen && sidebarOpen && (
                            <div className="sub-menu">
                                <button
                                    className={`sub-item ${isActive('/data-entry/commission') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/data-entry/commission')}
                                >
                                    <FaFileInvoice className="sub-icon" />
                                    <span>Customer Data Entry</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/data-entry/credit-limit') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/data-entry/credit-limit')}
                                >
                                    <FaFileInvoice className="sub-icon" />
                                    <span>Credit Bank Limit</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Reports Section */}
                    <div className="nav-section">
                        <button
                            className={`nav-item ${reportsOpen ? 'active' : ''}`}
                            onClick={() => setReportsOpen(!reportsOpen)}
                        >
                            <FaChartBar className="nav-icon" />
                            {sidebarOpen && <span>Reports</span>}
                            {sidebarOpen && <span className="arrow">{reportsOpen ? '▼' : '▶'}</span>}
                        </button>

                        {reportsOpen && sidebarOpen && (
                            <div className="sub-menu">
                                <button
                                    className={`sub-item ${isActive('/reports/gl-report') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/reports/gl-report')}
                                >
                                    <FaChartBar className="sub-icon" />
                                    <span>Limit Report</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/reports/gross-report') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/reports/gross-report')}
                                >
                                    <FaChartBar className="sub-icon" />
                                    <span>Gross Report</span>
                                </button>
                                <button
                                    className={`sub-item ${isActive('/reports/payment-report') ? 'active' : ''}`}
                                    onClick={() => handleNavigation('/reports/payment-report')}
                                >
                                    <FaChartBar className="sub-icon" />
                                    <span>Payment Report</span>
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt className="nav-icon" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar

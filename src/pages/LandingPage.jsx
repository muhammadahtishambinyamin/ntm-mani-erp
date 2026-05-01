import { useNavigate } from 'react-router-dom'
import { FaUserShield, FaChartLine, FaDatabase, FaFileAlt } from 'react-icons/fa'
import './LandingPage.css'

const LandingPage = () => {
    const navigate = useNavigate()

    return (
        <div className="landing-container">
            <div className="landing-hero">
                <div className="hero-content">
                    <div className="logo-section">
                        <div className="logo-circle">
                            <FaChartLine className="logo-icon" />
                        </div>
                        <h1 className="app-title">Credit Limit Management</h1>
                        <p className="app-subtitle">Streamline your credit operations with precision</p>
                    </div>

                    <button className="login-btn" onClick={() => navigate('/login')}>
                        <FaUserShield className="btn-icon" />
                        <span>Login to Continue</span>
                    </button>

                    <div className="features-grid">
                        <div className="feature-card">
                            <FaDatabase className="feature-icon" />
                            <h3>Master Data</h3>
                            <p>Manage banks, departments, companies & currencies</p>
                        </div>
                        <div className="feature-card">
                            <FaChartLine className="feature-icon" />
                            <h3>Data Entry</h3>
                            <p>Efficient credit limit tracking and management</p>
                        </div>
                        <div className="feature-card">
                            <FaFileAlt className="feature-icon" />
                            <h3>Reports</h3>
                            <p>Comprehensive reporting and analytics</p>
                        </div>
                    </div>
                </div>

                <div className="hero-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>
            </div>

            <footer className="landing-footer">
                <p>&copy; 2026 NTM Credit Management System. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default LandingPage

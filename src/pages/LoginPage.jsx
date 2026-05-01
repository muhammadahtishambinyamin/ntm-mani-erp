import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaLock, FaArrowLeft } from 'react-icons/fa'
import { supabase } from '../supabaseClient'
import './LoginPage.css'

const LoginPage = ({ onLogin }) => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.username || !formData.password) {
            setError('Username and password are required')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Query TB_USERS table (similar to frmLogin.aspx.vb line 76)
            const { data, error: queryError } = await supabase
                .from('tb_users')
                .select('vname, utype, uid')
                .eq('uid', formData.username)
                .eq('pwd', formData.password)
                .single()

            if (queryError || !data) {
                setError('Invalid Username and Password')
                setLoading(false)
                return
            }

            // Fetch business info (similar to callyear function)
            const { data: businessInfo } = await supabase
                .from('tb_businessinfo')
                .select('company, phone, add_1, vyear')
                .eq('vyear', 2026)
                .single()

            // Create user session
            const userData = {
                userName: data.vname.toUpperCase(),
                userType: data.utype,
                uid: data.uid,
                vyear: 2026,
                company: businessInfo?.company || 'NTM Credit Management',
                phone: businessInfo?.phone || '',
                address: businessInfo?.add_1 || ''
            }

            onLogin(userData)
            navigate('/dashboard')
        } catch (err) {
            console.error('Login error:', err)
            setError('An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        setFormData({ username: '', password: '' })
        setError('')
    }

    return (
        <div className="login-container">
            <button className="back-btn" onClick={() => navigate('/')}>
                <FaArrowLeft /> Back to Home
            </button>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon-circle">
                        <FaUser className="login-icon" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue to Credit Management</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">
                            <FaUser className="input-icon" />
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter your username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <FaLock className="input-icon" />
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button type="button" className="btn-clear" onClick={handleClear} disabled={loading}>
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
            </div>
        </div>
    )
}

export default LoginPage

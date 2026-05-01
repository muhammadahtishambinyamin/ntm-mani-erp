import { useState, useEffect } from 'react'
import { FaTachometerAlt } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import KPICards from '../components/dashboard/KPICards'
import CustomerUtilization from '../components/dashboard/CustomerUtilization'
import BankSummary from '../components/dashboard/BankSummary'
import CustomerBankMatrix from '../components/dashboard/CustomerBankMatrix'
import OverdueExposure from '../components/dashboard/OverdueExposure'
import { getAllDashboardData } from '../services/dashboardService'
import './Dashboard.css'


const Dashboard = ({ user, onLogout }) => {
    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        kpi: null,
        customerUtilization: [],
        bankSummary: [],
        customerBankMatrix: [],
        overdueExposure: []
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const data = await getAllDashboardData()
            setDashboardData(data)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            {/* Main Content */}
            <main className="main-content">
                <Navbar
                    user={user}
                    title="Credit Limit Dashboard"
                    icon={<FaTachometerAlt />}
                />

                <div className="content-area">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading dashboard data...</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <KPICards data={dashboardData.kpi} />

                            {/* Overdue Exposure Alert */}
                            <OverdueExposure data={dashboardData.overdueExposure} />

                            {/* Customer Utilization Table */}
                            <CustomerUtilization data={dashboardData.customerUtilization} />

                            {/* Bank Summary */}
                            <BankSummary data={dashboardData.bankSummary} />

                            {/* Customer × Bank Matrix */}
                            <CustomerBankMatrix data={dashboardData.customerBankMatrix} />
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Dashboard

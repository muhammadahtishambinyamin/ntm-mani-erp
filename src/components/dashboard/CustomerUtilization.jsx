import { useState } from 'react'
import { FaSearch, FaExclamationCircle } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatters'
import './CustomerUtilization.css'

const CustomerUtilization = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'outstanding', direction: 'desc' })

    const getUtilizationPercentage = (utilized, totalLimit) => {
        if (!totalLimit) return 0
        return Math.min((utilized / totalLimit) * 100, 100)
    }

    const getRiskLevel = (percentage) => {
        if (percentage >= 90) return 'critical'
        if (percentage >= 75) return 'high'
        if (percentage >= 50) return 'medium'
        return 'low'
    }

    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        })
    }

    const filteredData = (data || []).filter(item =>
        item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ccode?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sortedData = [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key] || 0
        const bValue = b[sortConfig.key] || 0
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    })

    return (
        <div className="customer-utilization-container">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Customer-wise Limit Utilization</h2>
                    <p className="section-subtitle">Track credit exposure by customer</p>
                </div>
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="dashboard-search-input"
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="utilization-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('ccode')}>
                                Code {sortConfig.key === 'ccode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('customerName')}>
                                Customer Name {sortConfig.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalUtilized')} className="text-right">
                                Utilized {sortConfig.key === 'totalUtilized' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalRecovered')} className="text-right">
                                Recovered {sortConfig.key === 'totalRecovered' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('outstanding')} className="text-right">
                                Outstanding {sortConfig.key === 'outstanding' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map((item, index) => {
                                const percentage = getUtilizationPercentage(item.outstanding, item.totalLimit)
                                const riskLevel = getRiskLevel(percentage)

                                return (
                                    <tr key={index} className={`row-${riskLevel}`}>
                                        <td className="code-cell">{item.ccode}</td>
                                        <td className="name-cell">
                                            {item.customerName}
                                            {riskLevel === 'critical' && (
                                                <FaExclamationCircle className="risk-icon" title="Critical exposure" />
                                            )}
                                        </td>
                                        <td className="text-right amount-cell">{formatCurrency(item.totalUtilized)}</td>
                                        <td className="text-right amount-cell success">{formatCurrency(item.totalRecovered)}</td>
                                        <td className="text-right amount-cell outstanding">{formatCurrency(item.outstanding)}</td>
                                        <td>
                                            <div className="progress-container">
                                                <div className="progress-bar">
                                                    <div
                                                        className={`progress-fill ${riskLevel}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="progress-text">{percentage.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    {searchTerm ? 'No customers found' : 'No data available'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CustomerUtilization

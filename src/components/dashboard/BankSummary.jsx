import { FaUniversity, FaChartPie } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatters'
import './BankSummary.css'

const BankSummary = ({ data }) => {

    const totalOutstanding = (data || []).reduce((sum, item) => sum + (item.outstanding || 0), 0)

    const getPercentage = (value) => {
        if (!totalOutstanding) return 0
        return ((value / totalOutstanding) * 100).toFixed(1)
    }

    const colors = [
        '#667eea',
        '#f093fb',
        '#43e97b',
        '#fa709a',
        '#4facfe',
        '#f5576c',
        '#38f9d7',
        '#fee140'
    ]

    return (
        <div className="bank-summary-container">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <FaUniversity className="title-icon" />
                        Bank-wise Utilization Summary
                    </h2>
                    <p className="section-subtitle">Exposure distribution across banks</p>
                </div>
            </div>

            <div className="bank-grid">
                {(data || []).length > 0 ? (
                    (data || []).map((bank, index) => {
                        const percentage = getPercentage(bank.outstanding)
                        const color = colors[index % colors.length]

                        return (
                            <div key={index} className="bank-card">
                                <div className="bank-header">
                                    <div
                                        className="bank-icon-wrapper"
                                        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                                    >
                                        <FaUniversity />
                                    </div>
                                    <div className="bank-info">
                                        <h3 className="bank-name">{bank.bankName}</h3>
                                        <span className="bank-code">{bank.bcode}</span>
                                    </div>
                                </div>

                                <div className="bank-metrics">
                                    <div className="metric">
                                        <span className="metric-label">Utilized</span>
                                        <span className="metric-value utilized">{formatCurrency(bank.totalUtilized)}</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">Recovered</span>
                                        <span className="metric-value recovered">{formatCurrency(bank.totalRecovered)}</span>
                                    </div>
                                    <div className="metric highlight">
                                        <span className="metric-label">Outstanding</span>
                                        <span className="metric-value outstanding">{formatCurrency(bank.outstanding)}</span>
                                    </div>
                                </div>

                                <div className="bank-footer">
                                    <div className="exposure-bar">
                                        <div
                                            className="exposure-fill"
                                            style={{
                                                width: `${percentage}%`,
                                                background: `linear-gradient(90deg, ${color}, ${color}cc)`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="exposure-percentage">{percentage}% of total exposure</span>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="no-data-message">
                        <FaChartPie className="no-data-icon" />
                        <p>No bank data available</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BankSummary

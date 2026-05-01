import { FaExclamationTriangle, FaClock } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatters'
import './OverdueExposure.css'

const OverdueExposure = ({ data }) => {

    const totalOverdue = (data || []).reduce((sum, item) => sum + (item.outstanding || 0), 0)
    const overdueCount = (data || []).length

    if (overdueCount === 0) {
        return (
            <div className="overdue-exposure-container">
                <div className="no-overdue">
                    <div className="success-icon">✓</div>
                    <h3>No Overdue Exposure</h3>
                    <p>All credit limits are within acceptable terms</p>
                </div>
            </div>
        )
    }

    return (
        <div className="overdue-exposure-container">
            <div className="alert-header">
                <div className="alert-icon">
                    <FaExclamationTriangle />
                </div>
                <div className="alert-info">
                    <h2 className="alert-title">Overdue / Risky Exposure</h2>
                    <p className="alert-subtitle">
                        <span className="alert-count">{overdueCount}</span> customer(s) with overdue exposure totaling <span className="alert-amount">{formatCurrency(totalOverdue)}</span>
                    </p>
                </div>
            </div>

            <div className="overdue-list">
                {(data || []).map((item, index) => (
                    <div key={index} className="overdue-item">
                        <div className="overdue-item-header">
                            <div className="overdue-customer">
                                <FaClock className="clock-icon" />
                                <div>
                                    <h4 className="overdue-customer-name">{item.customerName}</h4>
                                    <span className="overdue-customer-code">{item.ccode}</span>
                                </div>
                            </div>
                            <div className="overdue-amount">
                                {formatCurrency(item.outstanding)}
                            </div>
                        </div>
                        <div className="overdue-item-details">
                            <div className="overdue-detail">
                                <span className="detail-label">Bank:</span>
                                <span className="detail-value">{item.bankName}</span>
                            </div>
                            <div className="overdue-detail">
                                <span className="detail-label">Bank Code:</span>
                                <span className="detail-value">{item.bcode}</span>
                            </div>
                        </div>
                        <div className="overdue-badge">OVERDUE</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default OverdueExposure

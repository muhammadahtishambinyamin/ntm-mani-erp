import { FaMoneyBillWave, FaChartLine, FaUndo, FaExclamationTriangle } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatters'
import './KPICards.css'

const KPICards = ({ data }) => {

    const cards = [
        {
            title: 'Total Active Limit',
            value: data?.totalLimit || 0,
            icon: <FaMoneyBillWave />,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            description: 'Sanctioned credit limit'
        },
        {
            title: 'Total Utilized',
            value: data?.totalUtilized || 0,
            icon: <FaChartLine />,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            description: 'Debited amount'
        },
        {
            title: 'Total Recovered',
            value: data?.totalRecovered || 0,
            icon: <FaUndo />,
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            description: 'Credited back'
        },
        {
            title: 'Net Outstanding',
            value: data?.netOutstanding || 0,
            icon: <FaExclamationTriangle />,
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            description: 'Current exposure',
            highlight: true
        }
    ]

    return (
        <div className="kpi-cards-container">
            {cards.map((card, index) => (
                <div key={index} className={`kpi-card ${card.highlight ? 'highlight' : ''}`}>
                    <div className="kpi-icon" style={{ background: card.gradient }}>
                        {card.icon}
                    </div>
                    <div className="kpi-content">
                        <h3 className="kpi-title">{card.title}</h3>
                        <p className="kpi-value">{formatCurrency(card.value)}</p>
                        <span className="kpi-description">{card.description}</span>
                    </div>
                    {card.highlight && (
                        <div className="kpi-pulse"></div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default KPICards

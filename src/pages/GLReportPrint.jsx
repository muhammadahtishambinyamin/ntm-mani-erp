import { useLocation, useNavigate } from 'react-router-dom'
import { FaPrint, FaTimes, FaFileExcel } from 'react-icons/fa'
import { formatCurrencyFull, formatNumber } from '../utils/formatters'
import './GLReportPrint.css'

const GLReportPrint = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { reportData, filters, companies, customers, banks } = location.state || {}

    if (!reportData) {
        return (
            <div className="print-error">
                <h2>No Report Data Available</h2>
                <button onClick={() => navigate('/reports/gl-report')}>Go Back</button>
            </div>
        )
    }

    // Get filter labels
    const getCompanyName = () => {
        if (!filters.compcode) return 'All Companies'
        const company = companies?.find(c => c.code === filters.compcode)
        return company?.des || filters.compcode
    }

    const getCustomerName = () => {
        if (!filters.ccode) return 'All Customers'
        const customer = customers?.find(c => c.code === filters.ccode)
        return customer?.vname || filters.ccode
    }

    const getBankName = () => {
        if (!filters.bcode) return 'All Banks'
        const bank = banks?.find(b => b.code === filters.bcode)
        return bank?.des || filters.bcode
    }

    // Calculate totals
    const totalDebit = reportData.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0)
    const totalCredit = reportData.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0)
    const totalBalance = totalDebit - totalCredit

    const handlePrint = () => {
        window.print()
    }

    const handleClose = () => {
        navigate('/reports/gl-report')
    }

    const handleExport = () => {
        // Create CSV content
        const headers = ['VNo', 'Date', 'Type', 'Company', 'Customer', 'Bank', 'Department', 'Description', 'Ref No', 'Debit', 'Credit', 'Balance']
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => [
                row.vno,
                row.vdate,
                row.vtype,
                row.compname || '',
                row.cname || '',
                row.bname || '',
                row.deptname || '',
                `"${(row.des || '').replace(/"/g, '""')}"`,
                row.refno || '',
                row.debit || 0,
                row.credit || 0,
                row.balance || 0
            ].join(','))
        ].join('\n')

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `GL_Report_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    // Determine which columns to show based on filters
    const showCompany = !filters.compcode
    const showCustomer = !filters.ccode
    const showBank = !filters.bcode

    return (
        <div className="print-container">
            {/* Action Buttons - Hidden in print */}
            <div className="print-actions no-print">
                <button className="btn-print" onClick={handlePrint}>
                    <FaPrint /> Print
                </button>
                <button className="btn-export" onClick={handleExport}>
                    <FaFileExcel /> Export CSV
                </button>
                <button className="btn-close" onClick={handleClose}>
                    <FaTimes /> Close
                </button>
            </div>

            {/* Report Content */}
            <div className="report-page">
                {/* Report Header */}
                <div className="report-header">
                    <h1>NTM Credit Management System</h1>
                    <h2>General Ledger Report</h2>
                    <div className="report-date">
                        Generated on: {new Date().toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Filter Summary */}
                <div className="filter-summary">
                    <h3>Applied Filters</h3>
                    <div className="filter-summary-grid">
                        <div className="filter-item">
                            <span className="filter-label">Company:</span>
                            <span className="filter-value">{getCompanyName()}</span>
                        </div>
                        <div className="filter-item">
                            <span className="filter-label">Customer:</span>
                            <span className="filter-value">{getCustomerName()}</span>
                        </div>
                        <div className="filter-item">
                            <span className="filter-label">Bank:</span>
                            <span className="filter-value">{getBankName()}</span>
                        </div>
                        {filters.filterByDate && (
                            <div className="filter-item">
                                <span className="filter-label">Date Range:</span>
                                <span className="filter-value">
                                    {new Date(filters.fromDate).toLocaleDateString('en-PK')} to {new Date(filters.toDate).toLocaleDateString('en-PK')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Table */}
                <div className="report-table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                {showCompany && <th>Company</th>}
                                {showCustomer && <th>Customer</th>}
                                {showBank && <th>Bank</th>}
                                <th>Dept</th>
                                <th>Description</th>
                                <th className="amount-header">Utilized<br /><span className="currency-label">(Rs.)</span></th>
                                <th className="amount-header">Recovered<br /><span className="currency-label">(Rs.)</span></th>
                                <th className="amount-header">Balance<br /><span className="currency-label">(Rs.)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, index) => (
                                <tr key={index}>
                                    {showCompany && <td>{row.compname || '-'}</td>}
                                    {showCustomer && <td>{row.cname || '-'}</td>}
                                    {showBank && <td>{row.bname || '-'}</td>}
                                    <td>{row.deptname || '-'}</td>
                                    <td className="description-cell">{row.des || '-'}</td>
                                    <td className="amount-cell">{formatNumber(row.debit)}</td>
                                    <td className="amount-cell">{formatNumber(row.credit)}</td>
                                    <td className="balance-cell">{formatNumber(row.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="total-row">
                                <td colSpan={2 + (showCompany ? 1 : 0) + (showCustomer ? 1 : 0) + (showBank ? 1 : 0)} className="total-label">Grand Total:</td>
                                <td className="amount-cell total-amount">{formatNumber(totalDebit)}</td>
                                <td className="amount-cell total-amount">{formatNumber(totalCredit)}</td>
                                <td className="balance-cell total-balance">{formatNumber(totalBalance)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Report Summary */}
                <div className="report-summary">
                    <div className="summary-item">
                        <span className="summary-label">Total Records:</span>
                        <span className="summary-value">{reportData.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Utilized:</span>
                        <span className="summary-value">Rs. {formatNumber(totalDebit)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Recovered:</span>
                        <span className="summary-value">Rs. {formatNumber(totalCredit)}</span>
                    </div>
                    <div className="summary-item highlight">
                        <span className="summary-label">Net Balance:</span>
                        <span className="summary-value">Rs. {formatNumber(totalBalance)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GLReportPrint

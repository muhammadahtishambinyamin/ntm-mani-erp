import { useLocation, useNavigate } from 'react-router-dom'
import { FaPrint, FaTimes, FaFileExcel } from 'react-icons/fa'
import { formatNumber } from '../utils/formatters'
import './GrossReportPrint.css'

const PaymentReportPrint = () => {
    const { state } = useLocation()
    const navigate = useNavigate()

    if (!state?.reportData?.length) {
        return (
            <div className="print-error">
                <h2>No Report Data Available</h2>
                <button onClick={() => navigate('/reports/payment-report')}>Go Back</button>
            </div>
        )
    }

    const { reportData, filters } = state

    /* ============================
       WHICH COLUMNS TO SHOW
    ============================ */
    const show = {
        policy: !filters.refno,
        company: !filters.compcode,
        customer: !filters.ccode,
        bank: !filters.bcode,
        dept: !filters.deptcode,
        paymentType: !filters.payment_type
    }

    /* ============================
       TOTALS
    ============================ */
    const totals = reportData.reduce((t, r) => ({
        gross: t.gross + (+r.gross || 0),
        netpremium: t.netpremium + (+r.netpremium || 0)
    }), { gross: 0, netpremium: 0 })

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : '-'

    /* ============================
       CSV EXPORT
    ============================ */
    const exportCSV = () => {
        const headers = [
            'VNO',
            show.policy && 'Policy',
            show.company && 'Company',
            show.customer && 'Customer',
            'Issue Date',
            'Expiry Date',
            show.bank && 'Bank',
            show.dept && 'Department',
            'Gross',
            'Net Premium',
            'Paid Date',
            show.paymentType && 'Payment Type',
            'Bank Name',
            'TID/Cheque No',
            'Remarks'
        ].filter(Boolean)

        const rows = [headers.join(',')]

        reportData.forEach(r => {
            rows.push([
                r.vno,
                show.policy && r.refno,
                show.company && `"${r.compname}"`,
                show.customer && `"${r.cname}"`,
                r.idate,
                r.edate,
                show.bank && `"${r.bname}"`,
                show.dept && `"${r.deptname}"`,
                r.gross,
                r.netpremium,
                r.paiddate || '-',
                show.paymentType && (r.payment_type || '-'),
                r.payment_bank_name || '-',
                r.payment_tid || '-',
                `"${r.remarks || '-'}"`
            ].filter(Boolean).join(','))
        })

        const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `Payment_Report_${Date.now()}.csv`
        a.click()
    }

    return (
        <div className="print-page">
            {/* ACTIONS */}
            <div className="print-actions">
                <button onClick={() => window.print()}><FaPrint /> Print</button>
                <button onClick={exportCSV}><FaFileExcel /> Export</button>
                <button onClick={() => navigate('/reports/payment-report')}><FaTimes /> Close</button>
            </div>

            {/* HEADER */}
            <div className="report-header">
                <h1>NTM Credit Management System</h1>
                <h2>Payment Details Report</h2>
                <p>Generated on {new Date().toLocaleString()}</p>
            </div>

            {/* FILTER SUMMARY */}
            {(filters.refno || filters.compcode || filters.ccode || filters.payment_type) && (
                <div className="filter-summary">
                    {filters.refno && <div><b>Policy:</b> {filters.refno}</div>}
                    {filters.compcode && <div><b>Company:</b> {reportData[0].compname}</div>}
                    {filters.ccode && <div><b>Customer:</b> {reportData[0].cname}</div>}
                    {filters.payment_type && <div><b>Payment Type:</b> {filters.payment_type.toUpperCase()}</div>}
                    {filters.filterByPaidDate && filters.fromDate && filters.toDate && (
                        <div><b>Paid Date Range:</b> {fmtDate(filters.fromDate)} to {fmtDate(filters.toDate)}</div>
                    )}
                </div>
            )}

            {/* REPORT TABLE */}
            <table className="report-table">
                <thead>
                    <tr>
                        <th>VNO</th>
                        {show.policy && <th>Policy</th>}
                        {show.company && <th>Company</th>}
                        {show.customer && <th>Customer</th>}
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        {show.bank && <th>Bank</th>}
                        {show.dept && <th>Department</th>}
                        <th>Gross</th>
                        <th>Net Premium</th>
                        <th>Paid Date</th>
                        {show.paymentType && <th>Payment Type</th>}
                        <th>Bank Name</th>
                        <th>TID/Cheque</th>
                        <th>Remarks</th>
                    </tr>
                </thead>

                <tbody>
                    {reportData.map((r, i) => (
                        <tr key={i}>
                            <td>{r.vno}</td>
                            {show.policy && <td>{r.refno}</td>}
                            {show.company && <td>{r.compname}</td>}
                            {show.customer && <td>{r.cname}</td>}
                            <td>{fmtDate(r.idate)}</td>
                            <td>{fmtDate(r.edate)}</td>
                            {show.bank && <td>{r.bname}</td>}
                            {show.dept && <td>{r.deptname}</td>}
                            <td className="amount">{formatNumber(r.gross)}</td>
                            <td className="amount">{formatNumber(r.netpremium)}</td>
                            <td>{fmtDate(r.paiddate)}</td>
                            {show.paymentType && <td>{r.payment_type ? r.payment_type.toUpperCase() : '-'}</td>}
                            <td>{r.payment_bank_name || '-'}</td>
                            <td>{r.payment_tid || '-'}</td>
                            <td>{r.remarks || '-'}</td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr>
                        <td
                            colSpan={
                                1 +                  // VNO
                                (show.policy ? 1 : 0) +
                                (show.company ? 1 : 0) +
                                (show.customer ? 1 : 0) +
                                2 +                 // Issue + Expiry
                                (show.bank ? 1 : 0) +
                                (show.dept ? 1 : 0)
                            }
                        >
                            <strong>GRAND TOTAL</strong>
                        </td>

                        <td className="amount"><strong>{formatNumber(totals.gross)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.netpremium)}</strong></td>
                        <td colSpan={4 + (show.paymentType ? 1 : 0)}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}

export default PaymentReportPrint

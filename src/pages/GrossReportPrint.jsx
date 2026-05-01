import { useLocation, useNavigate } from 'react-router-dom'
import { FaPrint, FaTimes, FaFileExcel } from 'react-icons/fa'
import { formatNumber } from '../utils/formatters'
import './GrossReportPrint.css'

const GrossReportPrint = () => {
    const { state } = useLocation()
    const navigate = useNavigate()

    if (!state?.reportData?.length) {
        return (
            <div className="print-error">
                <h2>No Report Data Available</h2>
                <button onClick={() => navigate('/reports/gross-report')}>Go Back</button>
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
        fcColumns: !!filters.showFCColumns
    }

    /* ============================
       TOTALS
    ============================ */
    const totals = reportData.reduce((t, r) => ({
        fcamnt: t.fcamnt + (+r.fcamnt || 0),
        dutyamt: t.dutyamt + (+r.dutyamt || 0),
        netfcamnt: t.netfcamnt + (+r.netfcamnt || 0),
        gross: t.gross + (+r.gross || 0),
        netpremium: t.netpremium + (+r.netpremium || 0),
        cut: t.cut + (+r.cut || 0),
        stax: t.stax + (+r.stax || 0),
        netcut: t.netcut + (+r.netcut || 0),
        sumpaid: t.sumpaid + (+r.sumpaid || 0)
    }), { fcamnt: 0, dutyamt: 0, netfcamnt: 0, gross: 0, netpremium: 0, cut: 0, stax: 0, netcut: 0, sumpaid: 0 })

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
            show.fcColumns && 'FC Amount',
            show.fcColumns && 'Duty Amt',
            show.fcColumns && 'Total FC',
            show.fcColumns && 'FC Rate',
            'Sum Insured',
            'Gross',
            'Net Premium',
            'Commission',
            'STax',
            'Net Commission',
            'Paid Status',
            'Paid Date'
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
                show.fcColumns && (r.fcamnt || 0),
                show.fcColumns && (r.dutyamt || 0),
                show.fcColumns && (r.netfcamnt || 0),
                show.fcColumns && (r.fcrate || 0),
                r.sumpaid,
                r.gross,
                r.netpremium,
                r.cut,
                r.stax,
                r.netcut,
                r.paid_status ? 'Paid' : 'Unpaid',
                r.paiddate || '-'
            ].filter(Boolean).join(','))
        })

        const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `Gross_Report_${Date.now()}.csv`
        a.click()
    }

    return (
        <div className="print-page">
            {/* ACTIONS */}
            <div className="print-actions">
                <button onClick={() => window.print()}><FaPrint /> Print</button>
                <button onClick={exportCSV}><FaFileExcel /> Export</button>
                <button onClick={() => navigate('/reports/gross-report')}><FaTimes /> Close</button>
            </div>

            {/* HEADER */}
            <div className="report-header">
                <h1>NTM Credit Management System</h1>
                <h2>Gross Commission Report</h2>
                <p>Generated on {new Date().toLocaleString()}</p>
            </div>

            {/* FILTER SUMMARY */}
            {(filters.refno || filters.compcode || filters.ccode) && (
                <div className="filter-summary">
                    {filters.refno && <div><b>Policy:</b> {filters.refno}</div>}
                    {filters.compcode && <div><b>Company:</b> {reportData[0].compname}</div>}
                    {filters.ccode && <div><b>Customer:</b> {reportData[0].cname}</div>}
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
                        {show.fcColumns && <th>FC Amount</th>}
                        {show.fcColumns && <th>Duty Amt</th>}
                        {show.fcColumns && <th>Total FC</th>}
                        {show.fcColumns && <th>FC Rate</th>}
                        <th>Sum Insured</th>
                        <th>Gross</th>
                        <th>Net Premium</th>
                        <th>Commission</th>
                        <th>STax</th>
                        <th>Net Comm</th>
                        <th>Paid Status</th>
                        <th>Paid Date</th>
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
                            {show.fcColumns && <td className="amount">{formatNumber(r.fcamnt || 0)}</td>}
                            {show.fcColumns && <td className="amount">{formatNumber(r.dutyamt || 0)}</td>}
                            {show.fcColumns && <td className="amount">{formatNumber(r.netfcamnt || 0)}</td>}
                            {show.fcColumns && <td className="amount">{formatNumber(r.fcrate || 0)}</td>}
                            <td className="amount">{formatNumber(r.sumpaid)}</td>
                            <td className="amount">{formatNumber(r.gross)}</td>
                            <td className="amount">{formatNumber(r.netpremium)}</td>
                            <td className="amount">{formatNumber(r.cut)}</td>
                            <td className="amount">{formatNumber(r.stax)}</td>
                            <td className="amount">{formatNumber(r.netcut)}</td>
                            <td>{r.paid_status ? 'Paid' : 'Unpaid'}</td>
                            <td>{fmtDate(r.paiddate)}</td>
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
                                (show.dept ? 1 : 0) +
                                (show.fcColumns ? 4 : 0) // FC Amt, Duty, Total FC, FC Rate
                            }
                        >
                            <strong>GRAND TOTAL</strong>
                        </td>

                        <td className="amount"><strong>{formatNumber(totals.sumpaid)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.gross)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.netpremium)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.cut)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.stax)}</strong></td>
                        <td className="amount"><strong>{formatNumber(totals.netcut)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}

export default GrossReportPrint

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './PrintPage.css'

const CommissionPrintPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const vno = searchParams.get('vno')

    const [loading, setLoading] = useState(true)
    const [businessInfo, setBusinessInfo] = useState(null)
    const [voucherData, setVoucherData] = useState(null)
    const [entries, setEntries] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch business info
                const { data: bizData, error: bizError } = await supabase
                    .from('tb_businessinfo')
                    .select('company')
                    .limit(1)
                    .single()

                if (bizError) throw bizError
                setBusinessInfo(bizData)

                // Fetch voucher entries with all joined data
                const { data: entriesData, error: entriesError } = await supabase
                    .from('vw_bank_limit')
                    .select('*')
                    .eq('vno', vno)
                    .order('trid', { ascending: true })

                if (entriesError) throw entriesError

                if (entriesData && entriesData.length > 0) {
                    setEntries(entriesData)
                    // Use first entry for voucher header data
                    setVoucherData(entriesData[0])
                }

                setLoading(false)

                // Auto-trigger print after data loads
                setTimeout(() => {
                    window.print()
                }, 500)
            } catch (error) {
                console.error('Error fetching data:', error)
                alert('Error loading voucher data: ' + error.message)
                navigate(-1)
            }
        }

        if (vno) {
            fetchData()
        } else {
            alert('No voucher number provided')
            navigate(-1)
        }
    }, [vno, navigate])

    // Calculate totals
    const totalFCAmt = entries.reduce((sum, entry) => sum + parseFloat(entry.fcamnt || 0), 0)
    const totalDutyAmt = entries.reduce((sum, entry) => sum + parseFloat(entry.dutyamt || 0), 0)
    const totalNetFCAmt = entries.reduce((sum, entry) => sum + parseFloat(entry.netfcamnt || 0), 0)
    const totalGross = entries.reduce((sum, entry) => sum + parseFloat(entry.gross || 0), 0)
    const totalNetPremium = entries.reduce((sum, entry) => sum + parseFloat(entry.netpremium || 0), 0)
    const totalCommission = entries.reduce((sum, entry) => sum + parseFloat(entry.cut || 0), 0)
    const totalNetCommission = entries.reduce((sum, entry) => sum + parseFloat(entry.netcut || 0), 0)
    const totalSumPaid = entries.reduce((sum, entry) => sum + parseFloat(entry.sumpaid || 0), 0)

    if (loading) {
        return (
            <div className="print-loading">
                <h2>Loading voucher data...</h2>
            </div>
        )
    }

    return (
        <div className="print-page">
            {/* Header */}
            <div className="print-page-header">
                <h1>{businessInfo?.company || 'NTM CREDIT'}</h1>
                <h2>Customer Commission Report</h2>
            </div>

            {/* Voucher Information */}
            <div className="voucher-info-print">
                <div className="info-row-print">
                    <div className="info-item-print">
                        <span className="info-label-print">Voucher No:</span>
                        <span className="info-value-print">{voucherData?.vno}</span>
                    </div>
                    <div className="info-item-print">
                        <span className="info-label-print">Voucher Date:</span>
                        <span className="info-value-print">{voucherData?.vdate}</span>
                    </div>
                </div>
                <div className="info-row-print">
                    <div className="info-item-print">
                        <span className="info-label-print">Policy No:</span>
                        <span className="info-value-print">{voucherData?.refno || ' '}</span>
                    </div>
                    <div className="info-item-print">
                        <span className="info-label-print">Issue Date:</span>
                        <span className="info-value-print">{voucherData?.idate}</span>
                    </div>
                </div>
                <div className="info-row-print">
                    <div className="info-item-print">
                        <span className="info-label-print">Company:</span>
                        <span className="info-value-print">{voucherData?.compname}</span>
                    </div>
                    <div className="info-item-print">
                        <span className="info-label-print">Expiry Date:</span>
                        <span className="info-value-print">{voucherData?.edate}</span>
                    </div>
                </div>
                <div className="info-row-print">
                    <div className="info-item-print full-width-print">
                        <span className="info-label-print">Customer:</span>
                        <span className="info-value-print">{voucherData?.cname}</span>
                    </div>
                </div>
            </div>

            {/* Entries Table */}
            <table className="print-page-table">
                <thead>
                    <tr>
                        <th>Bank Name</th>
                        <th>Department</th>
                        <th>FC Amount</th>
                        <th>Duty Amt</th>
                        <th>Total FC</th>
                        <th>FC Rate</th>
                        <th>Sum Insured</th>
                        <th>Gross</th>
                        <th>Net Premium</th>
                        <th>Rate %</th>
                        <th>Commission</th>
                        <th>STax %</th>
                        <th>Net Commission</th>
                        <th>Paid Date</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, index) => (
                        <tr key={index}>
                            <td>{entry.bname}</td>
                            <td>{entry.deptname}</td>
                            <td className="text-right">{parseFloat(entry.fcamnt || 0).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.dutyamt || 0).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.netfcamnt || 0).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.fcrate || 0).toFixed(4)}</td>
                            <td className="text-right">{parseFloat(entry.sumpaid).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.gross).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.netpremium).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.cutrate).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.cut).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.staxr).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.netcut).toFixed(2)}</td>
                            <td>{entry.paiddate}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="2" className="text-right"><strong>Totals:</strong></td>
                        <td className="text-right"><strong>{totalFCAmt.toFixed(2)}</strong></td>
                        <td className="text-right"><strong>{totalDutyAmt.toFixed(2)}</strong></td>
                        <td className="text-right"><strong>{totalNetFCAmt.toFixed(2)}</strong></td>
                        <td></td>
                        <td className="text-right"><strong>{totalSumPaid.toFixed(2)}</strong></td>
                        <td className="text-right"><strong>{totalGross.toFixed(2)}</strong></td>
                        <td className="text-right"><strong>{totalNetPremium.toFixed(2)}</strong></td>
                        <td></td>
                        <td className="text-right"><strong>{totalCommission.toFixed(2)}</strong></td>
                        <td></td>
                        <td className="text-right"><strong>{totalNetCommission.toFixed(2)}</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div className="print-page-footer">
                <div className="footer-info-print">
                    <span>Computer Run Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="footer-company-print">
                    <span>Software Developed by NTM Soft</span>
                </div>
            </div>
        </div>
    )
}

export default CommissionPrintPage

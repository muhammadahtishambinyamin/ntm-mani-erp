import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './PrintPage.css'

const CreditLimitPrintPage = () => {
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
                    .from('vw_bank_credit_limit')
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

    // Calculate total payment
    const totalPayment = entries.reduce((sum, entry) => sum + parseFloat(entry.payment || 0), 0)

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
                <h2>Credit Bank Limit Utilization Report</h2>
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
                        <span className="info-label-print">Policy Date:</span>
                        <span className="info-value-print">{voucherData?.policydate}</span>
                    </div>
                </div>
                <div className="info-row-print">
                    <div className="info-item-print">
                        <span className="info-label-print">Company:</span>
                        <span className="info-value-print">{voucherData?.compname}</span>
                    </div>
                    <div className="info-item-print">
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
                        <th>Currency</th>
                        <th>FC Amount</th>
                        <th>FC Rate</th>
                        <th>Paid Date</th>
                        <th>Payment (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, index) => (
                        <tr key={index}>
                            <td>{entry.bname}</td>
                            <td>{entry.deptname}</td>
                            <td>{entry.currencyname}</td>
                            <td className="text-right">{parseFloat(entry.fcamt).toFixed(2)}</td>
                            <td className="text-right">{parseFloat(entry.fcrate).toFixed(4)}</td>
                            <td>{entry.paiddate}</td>
                            <td className="text-right">{parseFloat(entry.payment).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="6" className="text-right"><strong>Total Payment:</strong></td>
                        <td className="text-right"><strong>{totalPayment.toFixed(2)}</strong></td>
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

export default CreditLimitPrintPage

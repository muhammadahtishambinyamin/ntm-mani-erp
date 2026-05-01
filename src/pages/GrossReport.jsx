import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaChartBar, FaSearch, FaFilter } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import './GLReport.css'

const GrossReport = ({ user, onLogout }) => {
    const navigate = useNavigate()

    /* =======================
       FILTER STATE
    ======================= */
    const [filters, setFilters] = useState({
        refno: '',
        compcode: '',
        ccode: '',
        bcode: '',
        deptcode: '',
        fromDate: '',
        toDate: '',
        filterByDate: false,
        filterByPaidDate: false,
        paid_status: '', // '', 'paid', 'unpaid'
        showFCColumns: false
    })

    /* =======================
       DROPDOWN DATA
    ======================= */
    const [policyNumbers, setPolicyNumbers] = useState([])
    const [companies, setCompanies] = useState([])
    const [customers, setCustomers] = useState([])
    const [banks, setBanks] = useState([])
    const [departments, setDepartments] = useState([])

    const [message, setMessage] = useState(null)

    /* =======================
       INITIAL LOAD
    ======================= */
    useEffect(() => {
        loadDropdowns()
    }, [])

    /* =======================
       LOAD FILTER OPTIONS
    ======================= */
    const loadDropdowns = async () => {
        try {
            const [
                policyRes,
                companyRes,
                customerRes,
                bankRes,
                deptRes
            ] = await Promise.all([
                supabase.from('vw_bank_limit').select('refno').not('refno', 'is', null),
                supabase.from('vw_bank_limit').select('compcode, compname'),
                supabase.from('vw_bank_limit').select('ccode, cname'),
                supabase.from('vw_bank_limit').select('bcode, bname'),
                supabase.from('vw_bank_limit').select('deptcode, deptname')
            ])

            if (policyRes.error) throw policyRes.error
            if (companyRes.error) throw companyRes.error
            if (customerRes.error) throw customerRes.error
            if (bankRes.error) throw bankRes.error
            if (deptRes.error) throw deptRes.error

            setPolicyNumbers([...new Set(policyRes.data.map(i => i.refno))])

            setCompanies(
                Array.from(new Map(companyRes.data.map(i => [i.compcode, i])).values())
            )

            setCustomers(
                Array.from(new Map(customerRes.data.map(i => [i.ccode, i])).values())
            )

            setBanks(
                Array.from(new Map(bankRes.data.map(i => [i.bcode, i])).values())
            )

            setDepartments(
                Array.from(new Map(deptRes.data.map(i => [i.deptcode, i])).values())
            )

        } catch (err) {
            console.error(err)
            showMessage('Failed to load filter data', 'error')
        }
    }

    /* =======================
       HANDLERS
    ======================= */
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const showMessage = (text, type) => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 4000)
    }

    const handleClearFilters = () => {
        setFilters({
            refno: '',
            compcode: '',
            ccode: '',
            bcode: '',
            deptcode: '',
            fromDate: '',
            toDate: '',
            filterByDate: false,
            filterByPaidDate: false,
            paid_status: '',
            showFCColumns: false
        })
        setMessage(null)
    }

    /* =======================
       VIEW REPORT
    ======================= */
    const handleViewReport = async () => {
        if (filters.filterByDate || filters.filterByPaidDate) {
            if (!filters.fromDate || !filters.toDate) {
                showMessage('Please select From and To dates', 'error')
                return
            }
            if (filters.fromDate > filters.toDate) {
                showMessage('From Date cannot be greater than To Date', 'error')
                return
            }
        }

        try {
            let query = supabase
                .from('vw_bank_limit')
                .select('*')
                .order('vno', { ascending: true })
                .order('refno')
                .order('ccode')
                .order('compcode')
                .order('bcode')
                .order('deptcode')

            if (filters.refno) query = query.eq('refno', filters.refno)
            if (filters.compcode) query = query.eq('compcode', filters.compcode)
            if (filters.ccode) query = query.eq('ccode', filters.ccode)
            if (filters.bcode) query = query.eq('bcode', filters.bcode)
            if (filters.deptcode) query = query.eq('deptcode', filters.deptcode)

            if (filters.filterByDate) {
                query = query
                    .gte('idate', filters.fromDate)
                    .lte('idate', filters.toDate)
            }

            if (filters.filterByPaidDate) {
                query = query
                    .gte('paiddate', filters.fromDate)
                    .lte('paiddate', filters.toDate)
            }

            if (filters.paid_status === 'paid') {
                query = query.eq('paid_status', true)
            } else if (filters.paid_status === 'unpaid') {
                query = query.eq('paid_status', false)
            }

            const { data, error } = await query

            if (error) throw error
            if (!data || data.length === 0) {
                showMessage('No data found for selected filters', 'error')
                return
            }

            navigate('/reports/gross-report/print', {
                state: {
                    reportData: data,
                    filters
                }
            })

        } catch (err) {
            console.error(err)
            showMessage('Error generating report', 'error')
        }
    }

    /* =======================
       RENDER
    ======================= */
    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            <main className="main-content">
                <Navbar title="Gross Report" icon={<FaChartBar />} user={user} />

                <div className="form-container">

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="report-filter-card">
                        <div className="filter-header">
                            <FaFilter className="filter-icon" />
                            <h2>Gross Report Filters</h2>
                            <p className="filter-subtitle">
                                Leave blank to view all records
                            </p>
                        </div>

                        <div className="filter-grid">
                            <div className="filter-field">
                                <label>Policy Number</label>
                                <select value={filters.refno}
                                    onChange={e => handleFilterChange('refno', e.target.value)}>
                                    <option value="">-- All Policies --</option>
                                    {policyNumbers.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-field">
                                <label>Company</label>
                                <select value={filters.compcode}
                                    onChange={e => handleFilterChange('compcode', e.target.value)}>
                                    <option value="">-- All Companies --</option>
                                    {companies.map(c => (
                                        <option key={c.compcode} value={c.compcode}>
                                            {c.compname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-field">
                                <label>Customer</label>
                                <select value={filters.ccode}
                                    onChange={e => handleFilterChange('ccode', e.target.value)}>
                                    <option value="">-- All Customers --</option>
                                    {customers.map(c => (
                                        <option key={c.ccode} value={c.ccode}>
                                            {c.cname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-field">
                                <label>Bank</label>
                                <select value={filters.bcode}
                                    onChange={e => handleFilterChange('bcode', e.target.value)}>
                                    <option value="">-- All Banks --</option>
                                    {banks.map(b => (
                                        <option key={b.bcode} value={b.bcode}>
                                            {b.bname}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-field">
                                <label>Department</label>
                                <select value={filters.deptcode}
                                    onChange={e => handleFilterChange('deptcode', e.target.value)}>
                                    <option value="">-- All Departments --</option>
                                    {departments.map(d => (
                                        <option key={d.deptcode} value={d.deptcode}>
                                            {d.deptname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label>Payment Status</label>
                                <select value={filters.paid_status}
                                    onChange={e => handleFilterChange('paid_status', e.target.value)}>
                                    <option value="">-- All --</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div className="filter-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.filterByDate}
                                        onChange={e => handleFilterChange('filterByDate', e.target.checked)}
                                    />
                                    <span>Filter by Issue Date</span>
                                </label>
                            </div>

                            <div className="filter-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.filterByPaidDate}
                                        onChange={e => handleFilterChange('filterByPaidDate', e.target.checked)}
                                    />
                                    <span>Filter by Paid Date</span>
                                </label>
                            </div>

                            <div className="filter-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.showFCColumns}
                                        onChange={e => handleFilterChange('showFCColumns', e.target.checked)}
                                    />
                                    <span>Show FC Columns</span>
                                </label>
                            </div>

                            <div className="filter-field">
                                <label>From Date</label>
                                <input type="date"
                                    disabled={!filters.filterByDate && !filters.filterByPaidDate}
                                    value={filters.fromDate}
                                    onChange={e => handleFilterChange('fromDate', e.target.value)} />
                            </div>

                            <div className="filter-field">
                                <label>To Date</label>
                                <input type="date"
                                    disabled={!filters.filterByDate && !filters.filterByPaidDate}
                                    value={filters.toDate}
                                    onChange={e => handleFilterChange('toDate', e.target.value)} />
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button className="btn-view" onClick={handleViewReport}>
                                <FaSearch /> View Report
                            </button>
                            <button className="btn-clear" onClick={handleClearFilters}>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default GrossReport

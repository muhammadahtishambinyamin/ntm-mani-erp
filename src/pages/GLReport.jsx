import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaChartBar, FaSearch, FaFilter } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import './GLReport.css'

const GLReport = ({ user, onLogout }) => {
    const navigate = useNavigate()

    const [filters, setFilters] = useState({
        compcode: '',
        ccode: '',
        bcode: '',
        fromDate: '',
        toDate: '',
        filterByDate: false
    })

    const [companies, setCompanies] = useState([])
    const [customers, setCustomers] = useState([])
    const [banks, setBanks] = useState([])
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadDropdowns()
    }, [])

    const loadDropdowns = async () => {
        try {
            const [compData, custData, bankData] = await Promise.all([
                supabase.from('tb_company').select('code, des').order('des'),
                supabase.from('tb_customer').select('code, vname').order('vname'),
                supabase.from('tb_banks').select('code, des').order('des')
            ])

            setCompanies(compData.data || [])
            setCustomers(custData.data || [])
            setBanks(bankData.data || [])
        } catch (error) {
            console.error('Error loading dropdowns:', error)
            showMessage('Error loading filter options', 'error')
        }
    }

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const handleViewReport = async () => {
        // Validate date range if filtering by date
        if (filters.filterByDate) {
            if (!filters.fromDate || !filters.toDate) {
                showMessage('Please select both From Date and To Date', 'error')
                return
            }
            if (new Date(filters.fromDate) > new Date(filters.toDate)) {
                showMessage('From Date cannot be greater than To Date', 'error')
                return
            }
        }

        try {
            // Build query
            let query = supabase
                .from('vw_biggl')
                .select('*')
                .order('vdate', { ascending: true })
                .order('vno', { ascending: true })

            // Apply company filter
            if (filters.compcode) {
                query = query.eq('compcode', filters.compcode)
            }

            // Apply customer filter
            if (filters.ccode) {
                query = query.eq('code', filters.ccode)
            }

            // Apply bank filter
            if (filters.bcode) {
                query = query.eq('bcode', filters.bcode)
            }

            // Apply date range filter on idate (Issue Date)
            if (filters.filterByDate && filters.fromDate && filters.toDate) {
                query = query.gte('idate', filters.fromDate).lte('idate', filters.toDate)
            }

            const { data, error } = await query

            if (error) throw error

            if (!data || data.length === 0) {
                showMessage('No data found for the selected filters', 'error')
                return
            }

            // Navigate to print view with data
            navigate('/reports/gl-report/print', {
                state: {
                    reportData: data,
                    filters: filters,
                    companies: companies,
                    customers: customers,
                    banks: banks
                }
            })
        } catch (error) {
            console.error('Error generating report:', error)
            showMessage('Error generating report: ' + error.message, 'error')
        }
    }

    const handleClearFilters = () => {
        setFilters({
            compcode: '',
            ccode: '',
            bcode: '',
            fromDate: '',
            toDate: '',
            filterByDate: false
        })
        setMessage('')
    }

    const showMessage = (msg, type) => {
        setMessage({ text: msg, type })
        setTimeout(() => setMessage(''), 4000)
    }

    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            <main className="main-content">
                <Navbar
                    user={user}
                    title="GL Report"
                    icon={<FaChartBar />}
                />

                <div className="form-container">
                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="report-filter-card">
                        <div className="filter-header">
                            <FaFilter className="filter-icon" />
                            <h2>Report Filters</h2>
                            <p className="filter-subtitle">Select filters to generate General Ledger Report</p>
                        </div>

                        <div className="filter-grid">
                            {/* Company Filter */}
                            <div className="filter-field">
                                <label>Company</label>
                                <select
                                    value={filters.compcode}
                                    onChange={(e) => handleFilterChange('compcode', e.target.value)}
                                >
                                    <option value="">-- All Companies --</option>
                                    {companies.map(c => (
                                        <option key={c.code} value={c.code}>{c.des}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Customer Filter */}
                            <div className="filter-field">
                                <label>Customer</label>
                                <select
                                    value={filters.ccode}
                                    onChange={(e) => handleFilterChange('ccode', e.target.value)}
                                >
                                    <option value="">-- All Customers --</option>
                                    {customers.map(c => (
                                        <option key={c.code} value={c.code}>{c.vname}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Bank Filter */}
                            <div className="filter-field">
                                <label>Bank</label>
                                <select
                                    value={filters.bcode}
                                    onChange={(e) => handleFilterChange('bcode', e.target.value)}
                                >
                                    <option value="">-- All Banks --</option>
                                    {banks.map(b => (
                                        <option key={b.code} value={b.code}>{b.des}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter Checkbox */}
                            <div className="filter-field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.filterByDate}
                                        onChange={(e) => handleFilterChange('filterByDate', e.target.checked)}
                                    />
                                    <span>Filter by Date Range</span>
                                </label>
                            </div>

                            {/* From Date */}
                            <div className="filter-field">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    disabled={!filters.filterByDate}
                                />
                            </div>

                            {/* To Date */}
                            <div className="filter-field">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    disabled={!filters.filterByDate}
                                />
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button className="btn-view" onClick={handleViewReport}>
                                <FaSearch />
                                <span>View Report</span>
                            </button>
                            <button className="btn-clear" onClick={handleClearFilters}>
                                <span>Clear Filters</span>
                            </button>
                        </div>

                        <div className="filter-info">
                            <p><strong>Note:</strong> Leave filters empty to view all data. Use date range filter for specific period analysis.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default GLReport

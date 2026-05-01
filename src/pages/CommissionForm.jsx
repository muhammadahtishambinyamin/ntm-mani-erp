import { useState, useEffect } from 'react'
import {
    FaSave, FaPlus, FaEdit, FaTrash, FaSearch, FaFileInvoice, FaTimes as FaClear, FaEye
} from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import CommissionPrintView from '../components/CommissionPrintView'
import './CreditLimitForm.css'

const CommissionForm = ({ user, onLogout }) => {
    const [showPrintView, setShowPrintView] = useState(false)

    const [formData, setFormData] = useState({
        vno: 0,
        vdate: new Date().toISOString().split('T')[0],
        compcode: '',
        ccode: '',
        refno: '',
        idate: new Date().toISOString().split('T')[0],
        edate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    })

    const [entryData, setEntryData] = useState({
        bcode: '',
        deptcode: '',
        curcode: '',
        fcamt: 0,
        dutyrate: 0,
        totalfcamt: 0,
        exrate: 0,
        gross: 0,
        netpremium: 0,
        cutrate: 0,
        cut: 0,
        staxr: 17,
        netcut: 0,
        sumpaid: 0,
        paiddate: '', // Empty string to avoid null warnings
        paid_status: false,
        payment_type: '',
        payment_bank_name: '',
        payment_tid: '',
        remarks: ''
    })

    const [lastVNo, setLastVNo] = useState(0)
    const [companies, setCompanies] = useState([])
    const [customers, setCustomers] = useState([])
    const [banks, setBanks] = useState([])
    const [departments, setDepartments] = useState([])
    const [currencies, setCurrencies] = useState([])
    const [entries, setEntries] = useState([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [editTrid, setEditTrid] = useState(null)
    const [message, setMessage] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadLastVNo()
        loadDropdowns()
    }, [])

    useEffect(() => {
        if (formData.vno > 0) {
            loadEntries()
        }
    }, [formData.vno])

    useEffect(() => {
        calculateCommission()
    }, [entryData.gross, entryData.cutrate])

    useEffect(() => {
        calculateNetCommission()
    }, [entryData.cut, entryData.staxr])

    // Auto-sync paid_status when paiddate changes
    useEffect(() => {
        // If user enters a date, automatically set paid_status to true
        if (entryData.paiddate && entryData.paiddate.trim() !== '') {
            if (!entryData.paid_status) {
                setEntryData(prev => ({ ...prev, paid_status: true }))
            }
        }
    }, [entryData.paiddate])

    // Auto-clear paiddate and payment fields when paid_status is set to false
    useEffect(() => {
        if (!entryData.paid_status && (entryData.paiddate || entryData.payment_type || entryData.payment_bank_name || entryData.payment_tid || entryData.remarks)) {
            setEntryData(prev => ({
                ...prev,
                paiddate: '',
                payment_type: '',
                payment_bank_name: '',
                payment_tid: '',
                remarks: ''
            }))
        }
    }, [entryData.paid_status])

    // Calculate Total FC Amount (FC Amt + Duty)
    useEffect(() => {
        const fc = parseFloat(entryData.fcamt) || 0
        const rate = parseFloat(entryData.dutyrate) || 0
        const duty = (fc * rate) / 100
        const total = fc + duty
        setEntryData(prev => ({ ...prev, totalfcamt: total.toFixed(2) }))
    }, [entryData.fcamt, entryData.dutyrate])

    // Calculate Sum Insured (Total FC * Exchange Rate)
    useEffect(() => {
        const total = parseFloat(entryData.totalfcamt) || 0
        const ex = parseFloat(entryData.exrate) || 0
        const sum = total * ex
        if (ex > 0) { // Only update if exchange rate is entered, explicitly
            setEntryData(prev => ({ ...prev, sumpaid: sum.toFixed(2) }))
        }
    }, [entryData.totalfcamt, entryData.exrate])

    const loadLastVNo = async () => {
        try {
            const { data, error } = await supabase
                .from('tb_bank_limit')
                .select('vno')
                .order('vno', { ascending: false })
                .limit(1)

            if (error) throw error
            const maxVno = data && data.length > 0 ? data[0].vno : 0
            setLastVNo(maxVno)
        } catch (error) {
            console.error('Error loading last VNo:', error)
        }
    }

    const loadDropdowns = async () => {
        try {
            const [compData, custData, bankData, deptData, currData] = await Promise.all([
                supabase.from('tb_company').select('code, des').order('des'),
                supabase.from('tb_customer').select('code, vname').order('vname'),
                supabase.from('tb_banks').select('code, des').order('des'),
                supabase.from('tb_dept').select('code, des').order('des'),
                supabase.from('tb_currency').select('code, des').order('des')
            ])

            setCompanies(compData.data || [])
            setCustomers(custData.data || [])
            setBanks(bankData.data || [])
            setDepartments(deptData.data || [])
            setCurrencies(currData.data || [])
        } catch (error) {
            console.error('Error loading dropdowns:', error)
        }
    }

    const loadEntries = async () => {
        try {
            const { data, error } = await supabase
                .from('vw_bank_limit')
                .select('*')
                .eq('vno', formData.vno)
                .order('trid')

            if (error) throw error
            setEntries(data || [])
        } catch (error) {
            console.error('Error loading entries:', error)
            setEntries([])
        }
    }

    const calculateCommission = () => {
        const gross = parseFloat(entryData.gross) || 0
        const cutrate = parseFloat(entryData.cutrate) || 0
        const cut = (gross * cutrate) / 100
        setEntryData(prev => ({ ...prev, cut: cut.toFixed(2) }))
    }

    const calculateNetCommission = () => {
        const cut = parseFloat(entryData.cut) || 0
        const staxr = parseFloat(entryData.staxr) || 0
        const stax = (cut * staxr) / 100
        const netcut = cut - stax
        setEntryData(prev => ({ ...prev, netcut: netcut.toFixed(2) }))
    }

    const handleSaveEntry = async () => {
        // Validate voucher header fields
        if (!formData.compcode) {
            showMessage('Please select a Company', 'error')
            return
        }
        if (!formData.ccode) {
            showMessage('Please select a Customer', 'error')
            return
        }

        // Validate entry fields
        if (!entryData.bcode) {
            showMessage('Please select a Bank', 'error')
            return
        }
        if (!entryData.deptcode) {
            showMessage('Please select a Department', 'error')
            return
        }

        // Validate paid status and paid date
        if (entryData.paid_status && (!entryData.paiddate || entryData.paiddate.trim() === '')) {
            showMessage('Paid Date is required when Paid Status is Yes', 'error')
            return
        }

        if (isSaving) return
        setIsSaving(true)

        try {
            let currentVno = formData.vno
            const fcamt = parseFloat(entryData.fcamt) || 0
            const dutyrate = parseFloat(entryData.dutyrate) || 0
            const dutyamt = (fcamt * dutyrate) / 100

            if (isEditMode && editTrid) {
                const { error } = await supabase.rpc('pr_upd_limit', {
                    p_vno: currentVno,
                    p_vdate: formData.vdate,
                    p_compcode: formData.compcode,
                    p_ccode: formData.ccode,
                    p_refno: formData.refno,
                    p_idate: formData.idate,
                    p_bcode: entryData.bcode,
                    p_deptcode: entryData.deptcode,
                    p_gross: parseFloat(entryData.gross) || 0,
                    p_netpremium: parseFloat(entryData.netpremium) || 0,
                    p_paiddate: (entryData.paid_status && entryData.paiddate && entryData.paiddate.trim() !== '') ? entryData.paiddate : null,
                    p_cutrate: parseFloat(entryData.cutrate) || 0,
                    p_cut: parseFloat(entryData.cut) || 0,
                    p_staxr: parseFloat(entryData.staxr) || 0,
                    p_netcut: parseFloat(entryData.netcut) || 0,
                    p_uid: user?.uid || 'admin',
                    p_trid: editTrid,
                    p_edate: formData.edate,
                    p_sumpaid: parseFloat(entryData.sumpaid) || 0,
                    p_currencycode: entryData.curcode,
                    p_fcamnt: fcamt,
                    p_dutyr: dutyrate,
                    p_dutyamt: dutyamt,
                    p_netfcamnt: parseFloat(entryData.totalfcamt) || 0,
                    p_fcrate: parseFloat(entryData.exrate) || 0,
                    p_paid_status: !!entryData.paid_status, // Force boolean
                    p_payment_type: (entryData.paid_status && entryData.payment_type) ? entryData.payment_type : '',
                    p_payment_bank_name: (entryData.paid_status && entryData.payment_type && entryData.payment_type !== 'cash' && entryData.payment_bank_name) ? entryData.payment_bank_name : '',
                    p_payment_tid: (entryData.paid_status && entryData.payment_type && entryData.payment_type !== 'cash' && entryData.payment_tid) ? entryData.payment_tid : '',
                    p_remarks: entryData.remarks || ''
                })

                if (error) throw error
                showMessage('Entry updated successfully!', 'success')
            } else {
                const { data: newVno, error } = await supabase.rpc('pr_save_limit', {
                    p_vno: currentVno,
                    p_vdate: formData.vdate,
                    p_compcode: formData.compcode,
                    p_ccode: formData.ccode,
                    p_refno: formData.refno,
                    p_idate: formData.idate,
                    p_bcode: entryData.bcode,
                    p_deptcode: entryData.deptcode,
                    p_gross: parseFloat(entryData.gross) || 0,
                    p_netpremium: parseFloat(entryData.netpremium) || 0,
                    p_paiddate: (entryData.paid_status && entryData.paiddate && entryData.paiddate.trim() !== '') ? entryData.paiddate : null,
                    p_cutrate: parseFloat(entryData.cutrate) || 0,
                    p_cut: parseFloat(entryData.cut) || 0,
                    p_staxr: parseFloat(entryData.staxr) || 0,
                    p_netcut: parseFloat(entryData.netcut) || 0,
                    p_uid: user?.uid || 'admin',
                    p_edate: formData.edate,
                    p_sumpaid: parseFloat(entryData.sumpaid) || 0,
                    p_currencycode: entryData.curcode,
                    p_fcamnt: fcamt,
                    p_dutyr: dutyrate,
                    p_dutyamt: dutyamt,
                    p_netfcamnt: parseFloat(entryData.totalfcamt) || 0,
                    p_fcrate: parseFloat(entryData.exrate) || 0,
                    p_paid_status: !!entryData.paid_status, // Force boolean
                    p_payment_type: (entryData.paid_status && entryData.payment_type) ? entryData.payment_type : '',
                    p_payment_bank_name: (entryData.paid_status && entryData.payment_type && entryData.payment_type !== 'cash' && entryData.payment_bank_name) ? entryData.payment_bank_name : '',
                    p_payment_tid: (entryData.paid_status && entryData.payment_type && entryData.payment_type !== 'cash' && entryData.payment_tid) ? entryData.payment_tid : '',
                    p_remarks: entryData.remarks || ''
                })

                if (error) throw error

                if (currentVno === 0 && newVno) {
                    setFormData(prev => ({ ...prev, vno: newVno }))
                    setLastVNo(newVno)
                }

                showMessage('Entry saved successfully!', 'success')
            }

            clearEntry()
            loadEntries()
        } catch (error) {
            console.error('Error saving entry:', error)
            showMessage('Error: ' + error.message, 'error')
        } finally {
            // Keep disabled for a short time to prevent accidental double-clicks
            setTimeout(() => {
                setIsSaving(false)
            }, 1000)
        }
    }

    const handleEditEntry = async (entry) => {
        try {
            // Fetch complete record from backend using the view
            const { data, error } = await supabase
                .from('vw_bank_limit')
                .select('*')
                .eq('trid', entry.trid)
                .eq('vno', entry.vno)
                .single()

            if (error) throw error

            if (data) {
                // Populate voucher header fields
                setFormData({
                    vno: data.vno,
                    vdate: data.vdate,
                    compcode: data.compcode,
                    ccode: data.ccode,
                    refno: data.refno || '',
                    idate: data.idate,
                    edate: data.edate
                })

                // Populate entry fields
                // Auto-determine paid_status based on whether paiddate exists
                const hasPaidDate = data.paiddate && data.paiddate.trim() !== ''
                setEntryData({
                    bcode: data.bcode,
                    deptcode: data.deptcode,
                    curcode: data.currencycode || '',
                    fcamt: data.fcamnt || 0,
                    dutyrate: data.dutyr || 0,
                    totalfcamnt: data.netfcamnt || 0,
                    exrate: data.fcrate || 0,
                    gross: data.gross,
                    netpremium: data.netpremium,
                    cutrate: data.cutrate,
                    cut: data.cut,
                    staxr: data.staxr,
                    netcut: data.netcut,
                    sumpaid: data.sumpaid,
                    paiddate: data.paiddate || '', // Use empty string if null
                    paid_status: data.paid_status !== undefined ? data.paid_status : hasPaidDate,
                    payment_type: data.payment_type || '',
                    payment_bank_name: data.payment_bank_name || '',
                    payment_tid: data.payment_tid || '',
                    remarks: data.remarks || ''
                })

                setIsEditMode(true)
                setEditTrid(data.trid)
                showMessage('Record loaded for editing', 'success')
            }
        } catch (error) {
            console.error('Error loading entry for edit:', error)
            showMessage('Error loading entry: ' + error.message, 'error')
        }
    }

    const handleDeleteEntry = async (trid) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return

        try {
            const { error } = await supabase
                .from('tb_bank_limit')
                .delete()
                .eq('trid', trid)
                .eq('vno', formData.vno)

            if (error) throw error
            showMessage('Entry deleted successfully!', 'success')
            loadEntries()
        } catch (error) {
            console.error('Error deleting entry:', error)
            showMessage('Error: ' + error.message, 'error')
        }
    }

    const clearEntry = () => {
        setEntryData({
            bcode: '',
            deptcode: '',
            curcode: '',
            fcamt: 0,
            dutyrate: 0,
            totalfcamt: 0,
            exrate: 0,
            gross: 0,
            netpremium: 0,
            cutrate: 0,
            cut: 0,
            staxr: 17,
            netcut: 0,
            sumpaid: 0,
            paiddate: '', // Empty string to avoid null warnings
            paid_status: false,
            payment_type: '',
            payment_bank_name: '',
            payment_tid: '',
            remarks: ''
        })
        setIsEditMode(false)
        setEditTrid(null)
    }

    const handleNew = () => {
        setFormData({
            vno: 0,
            vdate: new Date().toISOString().split('T')[0],
            compcode: '',
            ccode: '',
            refno: '',
            idate: new Date().toISOString().split('T')[0],
            edate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        })
        clearEntry()
        setEntries([])
    }

    const handleView = async () => {
        if (!formData.vno || formData.vno === 0) {
            showMessage('Please enter a valid Voucher Number', 'error')
            return
        }

        try {
            // Fetch voucher entries
            const { data: entriesData, error: entriesError } = await supabase
                .from('vw_bank_limit')
                .select('*')
                .eq('vno', formData.vno)
                .order('trid', { ascending: true })

            if (entriesError) throw entriesError

            if (!entriesData || entriesData.length === 0) {
                showMessage('No entries found for this voucher number', 'error')
                return
            }

            // Show print view
            setShowPrintView(true)
        } catch (error) {
            console.error('Error loading voucher for view:', error)
            showMessage('Error loading voucher: ' + error.message, 'error')
        }
    }

    const handleFind = async () => {
        if (formData.vno <= 0) {
            showMessage('Please enter a valid voucher number', 'error')
            return
        }

        try {
            const { data, error } = await supabase
                .from('vw_bank_limit')
                .select('*')
                .eq('vno', formData.vno)
                .limit(1)
                .single()

            if (error || !data) {
                showMessage('Voucher not found', 'error')
                return
            }

            setFormData({
                vno: data.vno,
                vdate: data.vdate,
                compcode: data.compcode,
                ccode: data.ccode,
                refno: data.refno,
                idate: data.idate,
                edate: data.edate
            })
            loadEntries()
        } catch (error) {
            console.error('Error finding voucher:', error)
            showMessage('Error finding voucher', 'error')
        }
    }

    const showMessage = (msg, type) => {
        setMessage({ text: msg, type })
        setTimeout(() => setMessage(''), 3000)
    }

    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            <main className="main-content">
                <Navbar
                    user={user}
                    title="Customer Data Entry (Commission)"
                    icon={<FaFileInvoice />}
                />

                <div className="form-container-compact">
                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Two Column Layout: Voucher Header (Left) + Entry Form (Right) */}
                    <div className="entry-layout">
                        {/* Left Side: Voucher Header */}
                        <div className="voucher-header">
                            <h3>Voucher Information</h3>

                            <div className="vno-group">
                                <div className="voucher-field">
                                    <label>Last VNo</label>
                                    <input type="text" value={lastVNo} disabled />
                                </div>
                                <div className="voucher-field">
                                    <label>VNo</label>
                                    <input
                                        type="number"
                                        value={formData.vno}
                                        onChange={(e) => setFormData({ ...formData, vno: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="field-row">
                                <div className="voucher-field">
                                    <label>Voucher Date</label>
                                    <input
                                        type="date"
                                        value={formData.vdate}
                                        onChange={(e) => setFormData({ ...formData, vdate: e.target.value })}
                                    />
                                </div>
                                <div className="voucher-field">
                                    <label>Policy Number</label>
                                    <input
                                        type="text"
                                        value={formData.refno}
                                        onChange={(e) => setFormData({ ...formData, refno: e.target.value })}
                                        placeholder="Policy number"
                                    />
                                </div>
                            </div>

                            <div className="voucher-field">
                                <label>Company</label>
                                <select
                                    value={formData.compcode}
                                    onChange={(e) => setFormData({ ...formData, compcode: e.target.value })}
                                >
                                    <option value="">--Select Company--</option>
                                    {companies.map(c => <option key={c.code} value={c.code}>{c.des}</option>)}
                                </select>
                            </div>

                            <div className="voucher-field">
                                <label>Customer</label>
                                <select
                                    value={formData.ccode}
                                    onChange={(e) => setFormData({ ...formData, ccode: e.target.value })}
                                >
                                    <option value="">--Select Customer--</option>
                                    {customers.map(c => <option key={c.code} value={c.code}>{c.vname}</option>)}
                                </select>
                            </div>

                            <div className="field-row">
                                <div className="voucher-field">
                                    <label>Issue Date</label>
                                    <input
                                        type="date"
                                        value={formData.idate}
                                        onChange={(e) => setFormData({ ...formData, idate: e.target.value })}
                                    />
                                </div>
                                <div className="voucher-field">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={formData.edate}
                                        onChange={(e) => setFormData({ ...formData, edate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="voucher-actions">
                                <button className="btn-action btn-find" onClick={handleFind}>
                                    <FaSearch /> Find
                                </button>
                                <button className="btn-action btn-new" onClick={handleNew}>
                                    <FaPlus /> New
                                </button>
                                <button className="btn-action btn-find" onClick={handleView}>
                                    <FaEye /> View
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Entry Form */}
                        <div className="entry-section">
                            <h3>{isEditMode ? 'Edit Commission Entry' : 'Add Commission Entry'}</h3>

                            <div className="entry-row-2">
                                <div className="entry-field">
                                    <label>Bank</label>
                                    <select
                                        value={entryData.bcode}
                                        onChange={(e) => setEntryData({ ...entryData, bcode: e.target.value })}
                                    >
                                        <option value="">--Select Bank--</option>
                                        {banks.map(b => <option key={b.code} value={b.code}>{b.des}</option>)}
                                    </select>
                                </div>
                                <div className="entry-field">
                                    <label>Department</label>
                                    <select
                                        value={entryData.deptcode}
                                        onChange={(e) => setEntryData({ ...entryData, deptcode: e.target.value })}
                                    >
                                        <option value="">--Select Department--</option>
                                        {departments.map(d => <option key={d.code} value={d.code}>{d.des}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Currency</label>
                                    <select
                                        value={entryData.curcode}
                                        onChange={(e) => setEntryData({ ...entryData, curcode: e.target.value })}
                                    >
                                        <option value="">--Select Currency--</option>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.des}</option>)}
                                    </select>
                                </div>
                                <div className="entry-field">
                                    <label>FC Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.fcamt}
                                        onChange={(e) => setEntryData({ ...entryData, fcamt: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Duty Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.dutyrate}
                                        onChange={(e) => setEntryData({ ...entryData, dutyrate: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Total FC Amt</label>
                                    <input
                                        type="number"
                                        value={entryData.totalfcamt}
                                        disabled
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Exchange Rate</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={entryData.exrate}
                                        onChange={(e) => setEntryData({ ...entryData, exrate: e.target.value })}
                                        placeholder="0.0000"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Sum Insured (PKR)</label>
                                    <input
                                        type="number"
                                        value={entryData.sumpaid}
                                        onChange={(e) => setEntryData({ ...entryData, sumpaid: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-2">
                                <div className="entry-field">
                                    <label>Gross Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.gross}
                                        onChange={(e) => setEntryData({ ...entryData, gross: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Net Premium</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.netpremium}
                                        onChange={(e) => setEntryData({ ...entryData, netpremium: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Comm Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.cutrate}
                                        onChange={(e) => setEntryData({ ...entryData, cutrate: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Commission</label>
                                    <input type="text" value={entryData.cut} disabled />
                                </div>
                                <div className="entry-field">
                                    <label>STax (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryData.staxr}
                                        onChange={(e) => setEntryData({ ...entryData, staxr: e.target.value })}
                                        placeholder="17.00"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Net Commission</label>
                                    <input type="text" value={entryData.netcut} disabled />
                                </div>
                                <div className="entry-field">
                                    <label>Paid Status</label>
                                    <select
                                        value={entryData.paid_status ? 'yes' : 'no'}
                                        onChange={(e) => setEntryData({ ...entryData, paid_status: e.target.value === 'yes' })}
                                    >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>
                                <div className="entry-field">
                                    <label>Paid Date</label>
                                    <input
                                        type="date"
                                        value={entryData.paiddate || ''}
                                        onChange={(e) => setEntryData({ ...entryData, paiddate: e.target.value })}
                                        disabled={!entryData.paid_status}
                                    />
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Payment Type</label>
                                    <select
                                        value={entryData.payment_type}
                                        onChange={(e) => setEntryData({ ...entryData, payment_type: e.target.value })}
                                        disabled={!entryData.paid_status}
                                    >
                                        <option value="">--Select Type--</option>
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div className="entry-field">
                                    <label>Bank Name</label>
                                    <input
                                        type="text"
                                        value={entryData.payment_bank_name || ''}
                                        onChange={(e) => setEntryData({ ...entryData, payment_bank_name: e.target.value })}
                                        disabled={!entryData.paid_status || !entryData.payment_type || entryData.payment_type === 'cash'}
                                        placeholder="Enter bank name"
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>TID / Cheque No</label>
                                    <input
                                        type="text"
                                        value={entryData.payment_tid || ''}
                                        onChange={(e) => setEntryData({ ...entryData, payment_tid: e.target.value })}
                                        disabled={!entryData.paid_status || !entryData.payment_type || entryData.payment_type === 'cash'}
                                        placeholder="Enter TID or Cheque No"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-1">
                                <div className="entry-field" style={{ gridColumn: '1 / -1' }}>
                                    <label>Remarks</label>
                                    <textarea
                                        value={entryData.remarks || ''}
                                        onChange={(e) => setEntryData({ ...entryData, remarks: e.target.value })}
                                        placeholder="Enter any remarks or notes"
                                        rows="3"
                                        style={{ width: '100%', resize: 'vertical', padding: '8px', fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>


                            <div className="entry-actions">
                                <button className="btn-save" onClick={handleSaveEntry} disabled={isSaving}>
                                    <FaSave /> {isSaving ? 'Processing...' : (isEditMode ? 'Update Entry' : 'Save Entry')}
                                </button>
                                <button className="btn-clear" onClick={clearEntry} disabled={isSaving}>
                                    <FaClear /> Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Grid Section */}
                    <div className="grid-section">
                        <h3>Entries for VNo: {formData.vno || 'New'}</h3>
                        <div className="grid-container-compact">
                            <table className="data-grid-compact">
                                <thead>
                                    <tr>
                                        <th>Bank</th>
                                        <th>Department</th>
                                        <th>Gross</th>
                                        <th>Net Premium</th>
                                        <th>Rate %</th>
                                        <th>Commission</th>
                                        <th>STax %</th>
                                        <th>Net Commission</th>
                                        <th>Sum Paid</th>
                                        <th>Paid Status</th>
                                        <th>Paid Date</th>
                                        <th>Payment Type</th>
                                        <th>Bank Name</th>
                                        <th>TID/Cheque</th>
                                        <th>Remarks</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan="16" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                                                No entries found. Add a new entry above.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.trid}>
                                                <td>{entry.bname || entry.bcode}</td>
                                                <td>{entry.deptname || entry.deptcode}</td>
                                                <td className="text-right">{parseFloat(entry.gross).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.netpremium).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.cutrate).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.cut).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.staxr).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.netcut).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.sumpaid).toFixed(2)}</td>
                                                <td>{entry.paid_status ? 'Yes' : 'No'}</td>
                                                <td>{entry.paiddate || '-'}</td>
                                                <td>{entry.payment_type || '-'}</td>
                                                <td>{entry.payment_bank_name || '-'}</td>
                                                <td>{entry.payment_tid || '-'}</td>
                                                <td>{entry.remarks || '-'}</td>
                                                <td>
                                                    <button className="btn-icon btn-edit" onClick={() => handleEditEntry(entry)} title="Edit">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="btn-icon btn-delete" onClick={() => handleDeleteEntry(entry.trid)} title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Print View Modal */}
            {showPrintView && (
                <CommissionPrintView
                    voucherData={formData}
                    entries={entries}
                    onClose={() => setShowPrintView(false)}
                />
            )}
        </div>
    )
}

export default CommissionForm

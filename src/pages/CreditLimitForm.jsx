import { useState, useEffect } from 'react'
import {
    FaSave, FaPlus, FaEdit, FaTrash, FaSearch, FaFileInvoice, FaTimes as FaClear, FaEye
} from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import CreditLimitPrintView from '../components/CreditLimitPrintView'
import './CreditLimitForm.css'

const CreditLimitForm = ({ user, onLogout }) => {
    const [showPrintView, setShowPrintView] = useState(false)

    const [formData, setFormData] = useState({
        vno: 0,
        vdate: new Date().toISOString().split('T')[0],
        compcode: '',
        ccode: '',
        refno: '',
        policydate: new Date().toISOString().split('T')[0]
    })

    const [entryData, setEntryData] = useState({
        bcode: '',
        deptcode: '',
        currencycode: '',
        fcamt: 0,
        fcrate: 0,
        payment: 0,
        paiddate: new Date().toISOString().split('T')[0],
        remarks: ''
    })

    const [balance, setBalance] = useState(0)

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
        calculatePayment()
    }, [entryData.fcamt, entryData.fcrate])

    const loadLastVNo = async () => {
        try {
            const { data, error } = await supabase
                .from('tb_bank_credit_limit')
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
                .from('vw_bank_credit_limit')
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

    const calculatePayment = () => {
        const payment = (parseFloat(entryData.fcamt) || 0) * (parseFloat(entryData.fcrate) || 0)
        setEntryData(prev => ({ ...prev, payment: payment.toFixed(2) }))
    }

    const fetchBalance = async (customerCode, bankCode) => {
        try {
            if (!customerCode || !bankCode || !formData.vdate) {
                setBalance(0)
                return
            }

            const { data, error } = await supabase
                .rpc('get_customer_bank_balance', {
                    p_customer_code: customerCode,
                    p_bank_code: bankCode,
                    p_voucher_date: formData.vdate
                })

            if (error) throw error

            const balanceValue = data?.[0]?.balance || 0
            setBalance(balanceValue)
        } catch (error) {
            console.error('Error fetching balance:', error)
            setBalance(0)
        }
    }

    const handleCustomerChange = (value) => {
        setFormData({ ...formData, ccode: value })
        // Reset bank and balance when customer changes
        setEntryData({ ...entryData, bcode: '' })
        setBalance(0)
    }

    const handleBankChange = async (value) => {
        setEntryData({ ...entryData, bcode: value })

        if (!value) {
            setBalance(0)
            return
        }

        if (!formData.ccode) {
            showMessage('Please select a customer first', 'error')
            setEntryData({ ...entryData, bcode: '' })
            return
        }

        // Fetch balance for selected customer and bank
        await fetchBalance(formData.ccode, value)
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
        if (!entryData.currencycode) {
            showMessage('Please select a Currency', 'error')
            return
        }

        // Validate payment against balance
        const paymentAmount = parseFloat(entryData.payment) || 0
        // if (paymentAmount > balance) {
        //     showMessage(`Payment amount (Rs. ${paymentAmount.toFixed(2)}) cannot exceed available balance (Rs. ${balance.toFixed(2)})`, 'error')
        //     return
        // }

        if (paymentAmount <= 0) {
            showMessage('Payment amount must be greater than zero', 'error')
            return
        }

        if (isSaving) return
        setIsSaving(true)

        try {
            let currentVno = formData.vno

            if (isEditMode && editTrid) {
                const { error } = await supabase.rpc('pr_upd_credit_limit', {
                    p_vno: currentVno,
                    p_vdate: formData.vdate,
                    p_compcode: formData.compcode,
                    p_ccode: formData.ccode,
                    p_refno: formData.refno,
                    p_policydate: formData.policydate,
                    p_bcode: entryData.bcode,
                    p_deptcode: entryData.deptcode,
                    p_currencycode: entryData.currencycode,
                    p_fcamt: parseFloat(entryData.fcamt) || 0,
                    p_fcrate: parseFloat(entryData.fcrate) || 0,
                    p_payment: parseFloat(entryData.payment) || 0,
                    p_paiddate: entryData.paiddate,
                    p_remarks: entryData.remarks || '',
                    p_uid: user?.uid || 'admin',
                    p_trid: editTrid
                })

                if (error) throw error
                showMessage('Entry updated successfully!', 'success')
            } else {
                const { data: newVno, error } = await supabase.rpc('pr_save_credit_limit', {
                    p_vno: currentVno,
                    p_vdate: formData.vdate,
                    p_compcode: formData.compcode,
                    p_ccode: formData.ccode,
                    p_refno: formData.refno,
                    p_policydate: formData.policydate,
                    p_bcode: entryData.bcode,
                    p_deptcode: entryData.deptcode,
                    p_currencycode: entryData.currencycode,
                    p_fcamt: parseFloat(entryData.fcamt) || 0,
                    p_fcrate: parseFloat(entryData.fcrate) || 0,
                    p_payment: parseFloat(entryData.payment) || 0,
                    p_paiddate: entryData.paiddate,
                    p_remarks: entryData.remarks || '',
                    p_uid: user?.uid || 'admin'
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
                .from('vw_bank_credit_limit')
                .select('*')
                .eq('trid', entry.trid)
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
                    policydate: data.policydate
                })

                // Populate entry fields
                setEntryData({
                    bcode: data.bcode,
                    deptcode: data.deptcode,
                    currencycode: data.currencycode,
                    fcamt: data.fcamt,
                    fcrate: data.fcrate,
                    payment: data.payment,
                    paiddate: data.paiddate,
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
                .from('tb_bank_credit_limit')
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
            currencycode: '',
            fcamt: 0,
            fcrate: 0,
            payment: 0,
            paiddate: new Date().toISOString().split('T')[0],
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
            policydate: new Date().toISOString().split('T')[0]
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
                .from('vw_bank_credit_limit')
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
                .from('vw_bank_credit_limit')
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
                policydate: data.policydate
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
                    title="Credit Bank Limit"
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
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                >
                                    <option value="">--Select Customer--</option>
                                    {customers.map(c => <option key={c.code} value={c.code}>{c.vname}</option>)}
                                </select>
                            </div>

                            <div className="voucher-field">
                                <label>Policy Date</label>
                                <input
                                    type="date"
                                    value={formData.policydate}
                                    onChange={(e) => setFormData({ ...formData, policydate: e.target.value })}
                                />
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
                            <h3>{isEditMode ? 'Edit Entry' : 'Add New Entry'}</h3>

                            <div className="entry-row-2">
                                <div className="entry-field">
                                    <label>Bank</label>
                                    <select
                                        value={entryData.bcode}
                                        onChange={(e) => handleBankChange(e.target.value)}
                                    >
                                        <option value="">--Select Bank--</option>
                                        {banks.map(b => <option key={b.code} value={b.code}>{b.des}</option>)}
                                    </select>
                                </div>
                                <div className="entry-field">
                                    <label>Balance</label>
                                    <input
                                        type="text"
                                        value={`Rs. ${balance.toFixed(2)}`}
                                        disabled
                                        className="balance-field"
                                    />
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
                                        value={entryData.currencycode}
                                        onChange={(e) => setEntryData({ ...entryData, currencycode: e.target.value })}
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
                                    <label>FC Rate</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={entryData.fcrate}
                                        onChange={(e) => setEntryData({ ...entryData, fcrate: e.target.value })}
                                        placeholder="0.0000"
                                    />
                                </div>
                            </div>

                            <div className="entry-row-3">
                                <div className="entry-field">
                                    <label>Payment</label>
                                    <input type="text" value={entryData.payment} disabled />
                                </div>
                                <div className="entry-field">
                                    <label>Paid Date</label>
                                    <input
                                        type="date"
                                        value={entryData.paiddate}
                                        onChange={(e) => setEntryData({ ...entryData, paiddate: e.target.value })}
                                    />
                                </div>
                                <div className="entry-field">
                                    <label>Remarks</label>
                                    <input
                                        type="text"
                                        value={entryData.remarks}
                                        onChange={(e) => setEntryData({ ...entryData, remarks: e.target.value })}
                                        placeholder="Optional"
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
                                        <th>Currency</th>
                                        <th>FC Amount</th>
                                        <th>FC Rate</th>
                                        <th>Payment</th>
                                        <th>Paid Date</th>
                                        <th>Remarks</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                                                No entries found. Add a new entry above.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.trid}>
                                                <td>{entry.bname || entry.bcode}</td>
                                                <td>{entry.deptname || entry.deptcode}</td>
                                                <td>{entry.currencyname || entry.currencycode}</td>
                                                <td className="text-right">{parseFloat(entry.fcamt).toFixed(2)}</td>
                                                <td className="text-right">{parseFloat(entry.fcrate).toFixed(4)}</td>
                                                <td className="text-right">{parseFloat(entry.payment).toFixed(2)}</td>
                                                <td>{entry.paiddate}</td>
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
                <CreditLimitPrintView
                    voucherData={formData}
                    entries={entries}
                    onClose={() => setShowPrintView(false)}
                />
            )}
        </div>
    )
}

export default CreditLimitForm

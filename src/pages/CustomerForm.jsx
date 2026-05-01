import { useState, useEffect } from 'react'
import { FaUsers, FaSave, FaPlus, FaEdit, FaTrash, FaPrint } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import './CustomerForm.css'

const CustomerForm = ({ user, onLogout }) => {

    const [formData, setFormData] = useState({
        refcode: '',
        codePrefix: '',
        code: '',
        vname: '',
        cnic: '',
        add_1: '',
        add_2: '',
        phone_1: '',
        phone_2: '',
        phone_3: '',
        cellno: '',
        fax_1: '',
        fax_2: '',
        contactperson: '',
        stn: '',
        ntn: '',
        ac: '1'
    })

    const [records, setRecords] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isEditMode, setIsEditMode] = useState(false)
    const [message, setMessage] = useState('')
    const [businessInfo, setBusinessInfo] = useState(null)

    useEffect(() => {
        loadBusinessInfo()
        loadRecords()
        fillAutoCode()
    }, [])

    const loadBusinessInfo = async () => {
        try {
            const { data } = await supabase
                .from('tb_businessinfo')
                .select('company, add_1, phone')
                .limit(1)
                .single()

            setBusinessInfo(data)
        } catch (error) {
            console.error('Error loading business info:', error)
        }
    }

    const loadRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('tb_customer')
                .select('refcode, vname, cellno, ntn, ac')
                .order('refcode', { ascending: true })

            if (error) throw error
            setRecords(data || [])
        } catch (error) {
            console.error('Error loading records:', error)
        }
    }

    // Step 1: Get Debtors code from Chart of Accounts (6 characters)
    const fillAutoCode = async () => {
        try {
            const { data, error } = await supabase
                .from('tb_mychartofaccount')
                .select('code')
                .ilike('headofaccount', 'DEBTORS')
                .like('code', '______') // exactly 6 characters
                .limit(1)
                .maybeSingle()

            if (error || !data) {
                showMessage(
                    'First enter the Debtors control account in Chart of Accounts (third level).',
                    'error'
                )
                return
            }

            setFormData(prev => ({ ...prev, codePrefix: data.code }))
            fillNextRefCode(data.code)

        } catch (err) {
            console.error(err)
            showMessage('Error loading code prefix', 'error')
        }
    }

    // Step 2: Get next REFCODE
    const fillNextRefCode = async (prefix) => {
        try {
            const { data, error } = await supabase
                .rpc('get_next_customer_refcode') // see SQL below

            if (error) throw error

            const nextRefCode = data ?? 1
            const ref = String(nextRefCode)

            setFormData(prev => ({
                ...prev,
                refcode: ref,
                codePrefix: prefix
            }))

            generateCustomerCode(prefix, ref)

        } catch (err) {
            console.error(err)
            generateCustomerCode(prefix, '1')
        }
    }

    // Step 3: Generate full customer code (Prefix + Padded RefCode)
    const generateCustomerCode = (prefix, refcode) => {
        if (prefix && refcode) {
            // Pad refcode to 4 digits: "0000".substring(0, 4 - refcode.length) + refcode
            const paddedRefCode = ('0000' + refcode).slice(-4)
            const fullCode = prefix + paddedRefCode
            setFormData(prev => ({ ...prev, code: fullCode }))
        }
    }

    const handleSave = async () => {
        // Validate required fields
        if (!formData.vname || !formData.add_1) {
            showMessage('Please fill required fields: Name and Address 1', 'error')
            return
        }

        try {
            const customerData = {
                code: formData.code,
                refcode: formData.refcode,
                vname: formData.vname,
                add_1: formData.add_1,
                add_2: formData.add_2 || null,
                phone_1: formData.phone_1 || null,
                phone_2: formData.phone_2 || null,
                phone_3: formData.phone_3 || null,
                fax_1: formData.fax_1 || null,
                fax_2: formData.fax_2 || null,
                cellno: formData.cellno || null,
                contactperson: formData.contactperson || null,
                stn: formData.stn || null,
                ntn: formData.ntn || null,
                ac: formData.ac,
                cnic: formData.cnic || null
            }

            if (isEditMode) {
                // Update existing customer
                const { error } = await supabase
                    .from('tb_customer')
                    .update(customerData)
                    .eq('refcode', formData.refcode)

                if (error) throw error
                showMessage('Customer updated successfully!', 'success')
            } else {
                // Insert new customer (refcode is auto-generated by SERIAL)
                const { error } = await supabase
                    .from('tb_customer')
                    .insert([customerData])

                if (error) throw error
                showMessage('Customer saved successfully!', 'success')
            }

            handleNew()
            loadRecords()
        } catch (error) {
            console.error('Error saving customer:', error)
            showMessage('Error: ' + error.message, 'error')
        }
    }

    const handleEdit = async (refcode) => {
        try {
            const { data, error } = await supabase
                .from('tb_customer')
                .select('*')
                .eq('refcode', refcode)
                .single()

            if (error) throw error

            // Extract prefix from code (first 6 characters)
            const codePrefix = data.code.substring(0, 6)

            setFormData({
                refcode: String(data.refcode),
                codePrefix: codePrefix,
                code: data.code,
                vname: data.vname,
                cnic: data.cnic || '',
                add_1: data.add_1,
                add_2: data.add_2 || '',
                phone_1: data.phone_1 || '',
                phone_2: data.phone_2 || '',
                phone_3: data.phone_3 || '',
                cellno: data.cellno || '',
                fax_1: data.fax_1 || '',
                fax_2: data.fax_2 || '',
                contactperson: data.contactperson || '',
                stn: data.stn || '',
                ntn: data.ntn || '',
                ac: data.ac
            })
            setIsEditMode(true)
        } catch (error) {
            console.error('Error loading customer:', error)
            showMessage('Error loading customer', 'error')
        }
    }

    const handleDelete = async (refcode) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) {
            return
        }

        try {
            const { error } = await supabase
                .from('tb_customer')
                .delete()
                .eq('refcode', refcode)

            if (error) throw error
            showMessage('Customer deleted successfully!', 'success')
            loadRecords()
        } catch (error) {
            console.error('Error deleting customer:', error)
            showMessage('Error: ' + error.message, 'error')
        }
    }

    const handleNew = () => {
        setFormData({
            refcode: '',
            codePrefix: '',
            code: '',
            vname: '',
            cnic: '',
            add_1: '',
            add_2: '',
            phone_1: '',
            phone_2: '',
            phone_3: '',
            cellno: '',
            fax_1: '',
            fax_2: '',
            contactperson: '',
            stn: '',
            ntn: '',
            ac: '1'
        })
        setIsEditMode(false)
        fillAutoCode()
    }

    const handleView = () => {
        const printWindow = window.open('', '_blank')
        const filteredRecords = records.filter(r =>
            r.vname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.cellno && r.cellno.includes(searchTerm)) ||
            (r.ntn && r.ntn.toLowerCase().includes(searchTerm.toLowerCase()))
        )

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customers Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #667eea; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9f9f9; }
          .active { color: green; font-weight: bold; }
          .inactive { color: red; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessInfo?.company || 'NTM Credit Management'}</h1>
          <p>${businessInfo?.add_1 || ''}</p>
          <p>${businessInfo?.phone || ''}</p>
          <h2 style="margin-top: 20px;">Customers Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>NTN</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map(record => `
              <tr>
                <td>${record.refcode}</td>
                <td>${record.vname}</td>
                <td>${record.cellno || '-'}</td>
                <td>${record.ntn || '-'}</td>
                <td class="${record.ac === '1' ? 'active' : 'inactive'}">
                  ${record.ac === '1' ? 'Active' : 'Inactive'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
      </body>
      </html>
    `

        printWindow.document.write(html)
        printWindow.document.close()
    }

    const showMessage = (msg, type) => {
        setMessage({ text: msg, type })
        setTimeout(() => setMessage(''), 3000)
    }

    const filteredRecords = records.filter(r =>
        r.vname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.cellno && r.cellno.includes(searchTerm)) ||
        (r.ntn && r.ntn.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            <main className="main-content">
                <Navbar
                    user={user}
                    title="Customers"
                    icon={<FaUsers />}
                />

                <div className="form-container">
                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="customer-layout">
                        {/* Left Panel - Form */}
                        <div className="customer-form-panel">
                            <h3>Customer Entry Form</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>ID (RefCode)</label>
                                    <input
                                        type="text"
                                        value={formData.refcode}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Code Prefix</label>
                                    <input
                                        type="text"
                                        value={formData.codePrefix}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Customer Name *</label>
                                <input
                                    type="text"
                                    value={formData.vname}
                                    onChange={(e) => setFormData({ ...formData, vname: e.target.value })}
                                    maxLength="255"
                                />
                            </div>

                            <div className="form-group">
                                <label>CNIC</label>
                                <input
                                    type="text"
                                    value={formData.cnic}
                                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                    maxLength="50"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address 1 *</label>
                                <textarea
                                    value={formData.add_1}
                                    onChange={(e) => setFormData({ ...formData, add_1: e.target.value })}
                                    rows="2"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address 2</label>
                                <textarea
                                    value={formData.add_2}
                                    onChange={(e) => setFormData({ ...formData, add_2: e.target.value })}
                                    rows="2"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone 1</label>
                                    <input
                                        type="text"
                                        value={formData.phone_1}
                                        onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone 2</label>
                                    <input
                                        type="text"
                                        value={formData.phone_2}
                                        onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone 3</label>
                                    <input
                                        type="text"
                                        value={formData.phone_3}
                                        onChange={(e) => setFormData({ ...formData, phone_3: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile</label>
                                    <input
                                        type="text"
                                        value={formData.cellno}
                                        onChange={(e) => setFormData({ ...formData, cellno: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fax 1</label>
                                    <input
                                        type="text"
                                        value={formData.fax_1}
                                        onChange={(e) => setFormData({ ...formData, fax_1: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fax 2</label>
                                    <input
                                        type="text"
                                        value={formData.fax_2}
                                        onChange={(e) => setFormData({ ...formData, fax_2: e.target.value })}
                                        maxLength="50"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contactperson}
                                    onChange={(e) => setFormData({ ...formData, contactperson: e.target.value })}
                                    maxLength="255"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>STN</label>
                                    <input
                                        type="text"
                                        value={formData.stn}
                                        onChange={(e) => setFormData({ ...formData, stn: e.target.value })}
                                        maxLength="100"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>NTN</label>
                                    <input
                                        type="text"
                                        value={formData.ntn}
                                        onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                                        maxLength="100"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.ac === '1'}
                                        onChange={(e) => setFormData({ ...formData, ac: e.target.checked ? '1' : '0' })}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-save" onClick={handleSave}>
                                    <FaSave /> {isEditMode ? 'Update' : 'Save'}
                                </button>
                                <button className="btn btn-new" onClick={handleNew}>
                                    <FaPlus /> New
                                </button>
                                <button className="btn btn-view" onClick={handleView}>
                                    <FaPrint /> View
                                </button>
                            </div>
                        </div>

                        {/* Right Panel - Grid */}
                        <div className="customer-grid-panel">
                            <div className="grid-header">
                                <h3>All Customers</h3>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search by name, mobile, or NTN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid-container">
                                <table className="data-grid">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Mobile</th>
                                            <th>NTN</th>
                                            <th>Active</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((record) => (
                                            <tr key={record.refcode}>
                                                <td>{record.refcode}</td>
                                                <td>{record.vname}</td>
                                                <td>{record.cellno || '-'}</td>
                                                <td>{record.ntn || '-'}</td>
                                                <td>
                                                    <span className={`status-badge ${record.ac === '1' ? 'active' : 'inactive'}`}>
                                                        {record.ac === '1' ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-icon btn-edit"
                                                        onClick={() => handleEdit(record.refcode)}
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-delete"
                                                        onClick={() => handleDelete(record.refcode)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default CustomerForm

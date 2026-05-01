import { useState, useEffect } from 'react'
import {
    FaUniversity,
    FaBuilding,
    FaDollarSign,
    FaSitemap,
    FaSave,
    FaPlus,
    FaEdit,
    FaTrash,
    FaPrint
} from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../supabaseClient'
import './MasterForm.css'

const MasterForm = ({ type, user, onLogout }) => {
    const [formData, setFormData] = useState({
        code: '',
        des: '',
        nik: ''
    })
    const [records, setRecords] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isEditMode, setIsEditMode] = useState(false)
    const [message, setMessage] = useState('')
    const [businessInfo, setBusinessInfo] = useState(null)

    const config = {
        banks: { table: 'tb_banks', title: 'Banks', icon: FaUniversity },
        departments: { table: 'tb_dept', title: 'Departments', icon: FaSitemap },
        companies: { table: 'tb_company', title: 'Companies', icon: FaBuilding },
        currencies: { table: 'tb_currency', title: 'Currencies', icon: FaDollarSign }
    }

    const currentConfig = config[type]

    useEffect(() => {
        loadRecords()
        loadBusinessInfo()
        generateCode()
    }, [type])

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
                .from(currentConfig.table)
                .select('*')
                .order('code', { ascending: true })

            if (error) throw error
            setRecords(data || [])
        } catch (error) {
            console.error('Error loading records:', error)
        }
    }

    const generateCode = async () => {
        if (isEditMode) return

        try {
            const { data, error } = await supabase
                .from(currentConfig.table)
                .select('code')
                .order('code', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                const lastCode = parseInt(data[0].code)
                setFormData(prev => ({ ...prev, code: String(lastCode + 1).padStart(3, '0') }))
            } else {
                setFormData(prev => ({ ...prev, code: '101' }))
            }
        } catch (error) {
            console.error('Error generating code:', error)
            setFormData(prev => ({ ...prev, code: '101' }))
        }
    }

    const handleSave = async () => {
        if (!formData.code || !formData.des || !formData.nik) {
            showMessage('Please fill all fields', 'error')
            return
        }

        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from(currentConfig.table)
                    .update({ des: formData.des, nik: formData.nik })
                    .eq('code', formData.code)

                if (error) throw error
                showMessage('Record updated successfully', 'success')
            } else {
                const { error } = await supabase
                    .from(currentConfig.table)
                    .insert([formData])

                if (error) throw error
                showMessage('Record saved successfully', 'success')
            }

            handleNew()
            loadRecords()
        } catch (error) {
            console.error('Error saving record:', error)
            showMessage('Error: ' + error.message, 'error')
        }
    }

    const handleEdit = (record) => {
        setFormData(record)
        setIsEditMode(true)
    }

    const handleDelete = async (code) => {
        if (!window.confirm('Are you sure you want to delete this record?')) {
            return
        }

        try {
            const { error } = await supabase
                .from(currentConfig.table)
                .delete()
                .eq('code', code)

            if (error) throw error
            showMessage('Record deleted successfully', 'success')
            loadRecords()
        } catch (error) {
            console.error('Error deleting record:', error)
            showMessage('Error: ' + error.message, 'error')
        }
    }

    const handleNew = () => {
        setFormData({ code: '', des: '', nik: '' })
        setIsEditMode(false)
        generateCode()
    }

    const handleView = () => {
        const printWindow = window.open('', '_blank')
        const filteredRecords = records.filter(r =>
            r.des.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.code.includes(searchTerm) ||
            r.nik.toLowerCase().includes(searchTerm.toLowerCase())
        )

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentConfig.title} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #667eea; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9f9f9; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessInfo?.company || 'NTM Credit Management'}</h1>
          <p>${businessInfo?.add_1 || ''}</p>
          <p>${businessInfo?.phone || ''}</p>
          <h2 style="margin-top: 20px;">${currentConfig.title} Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Nick Name</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map(record => `
              <tr>
                <td>${record.code}</td>
                <td>${record.des}</td>
                <td>${record.nik}</td>
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
        r.des.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.includes(searchTerm) ||
        r.nik.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const IconComponent = currentConfig.icon

    return (
        <div className="dashboard-container">
            <Sidebar user={user} onLogout={onLogout} />

            <main className="main-content">
                <Navbar
                    user={user}
                    title={currentConfig.title}
                    icon={<IconComponent />}
                />

                <div className="form-container">
                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="form-layout">
                        {/* Left Panel - Form */}
                        <div className="form-panel">
                            <h3>Entry Form</h3>

                            <div className="form-group">
                                <label>Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    disabled={isEditMode}
                                    maxLength="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.des}
                                    onChange={(e) => setFormData({ ...formData, des: e.target.value })}
                                    maxLength="255"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nick Name</label>
                                <input
                                    type="text"
                                    value={formData.nik}
                                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                    maxLength="8"
                                />
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-save" onClick={handleSave}>
                                    <FaSave /> Save
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
                        <div className="grid-panel">
                            <div className="grid-header">
                                <h3>All Records</h3>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid-container">
                                <table className="data-grid">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Description</th>
                                            <th>Nick</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((record) => (
                                            <tr key={record.code}>
                                                <td>{record.code}</td>
                                                <td>{record.des}</td>
                                                <td>{record.nik}</td>
                                                <td>
                                                    <button
                                                        className="btn-icon btn-edit"
                                                        onClick={() => handleEdit(record)}
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-delete"
                                                        onClick={() => handleDelete(record.code)}
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

export default MasterForm

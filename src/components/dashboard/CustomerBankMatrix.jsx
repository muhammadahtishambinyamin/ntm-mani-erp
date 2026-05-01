import React, { useState } from 'react'
import { FaChevronDown, FaChevronRight, FaSearch } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatters'
import './CustomerBankMatrix.css'

const CustomerBankMatrix = ({ data }) => {
    const [expandedRows, setExpandedRows] = useState(new Set())
    const [searchTerm, setSearchTerm] = useState('')

    const toggleRow = (ccode) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(ccode)) {
            newExpanded.delete(ccode)
        } else {
            newExpanded.add(ccode)
        }
        setExpandedRows(newExpanded)
    }

    // Group data by customer
    const groupedData = (data || []).reduce((acc, item) => {
        if (!acc[item.ccode]) {
            acc[item.ccode] = {
                ccode: item.ccode,
                customerName: item.customerName,
                banks: [],
                totalUtilized: 0,
                totalRecovered: 0,
                totalOutstanding: 0
            }
        }
        acc[item.ccode].banks.push({
            bcode: item.bcode,
            bankName: item.bankName,
            utilized: item.utilized,
            recovered: item.recovered,
            outstanding: item.outstanding
        })
        acc[item.ccode].totalUtilized += item.utilized || 0
        acc[item.ccode].totalRecovered += item.recovered || 0
        acc[item.ccode].totalOutstanding += item.outstanding || 0
        return acc
    }, {})

    const customers = Object.values(groupedData).filter(customer =>
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.ccode?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.totalOutstanding - a.totalOutstanding)

    return (
        <div className="customer-bank-matrix-container">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Customer × Bank Matrix</h2>
                    <p className="section-subtitle">Detailed exposure breakdown by customer and bank</p>
                </div>
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="dashboard-search-input"
                    />
                </div>
            </div>

            <div className="matrix-wrapper">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Customer</th>
                            <th className="text-right">Total Utilized</th>
                            <th className="text-right">Total Recovered</th>
                            <th className="text-right">Total Outstanding</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length > 0 ? (
                            customers.map((customer) => {
                                const isExpanded = expandedRows.has(customer.ccode)

                                return (
                                    <React.Fragment key={customer.ccode}>
                                        <tr
                                            className="customer-row"
                                            onClick={() => toggleRow(customer.ccode)}
                                        >
                                            <td className="expand-cell">
                                                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                            </td>
                                            <td className="customer-cell">
                                                <div className="customer-info">
                                                    <span className="customer-name">{customer.customerName}</span>
                                                    <span className="customer-code">{customer.ccode}</span>
                                                </div>
                                            </td>
                                            <td className="text-right amount-cell">{formatCurrency(customer.totalUtilized)}</td>
                                            <td className="text-right amount-cell success">{formatCurrency(customer.totalRecovered)}</td>
                                            <td className="text-right amount-cell outstanding">{formatCurrency(customer.totalOutstanding)}</td>
                                        </tr>

                                        {isExpanded && customer.banks.map((bank, idx) => (
                                            <tr key={`${customer.ccode}-${bank.bcode}`} className="bank-detail-row">
                                                <td></td>
                                                <td className="bank-detail-cell">
                                                    <div className="bank-detail-info">
                                                        <span className="bank-icon">🏦</span>
                                                        <div>
                                                            <span className="bank-detail-name">{bank.bankName}</span>
                                                            <span className="bank-detail-code">{bank.bcode}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right amount-cell detail">{formatCurrency(bank.utilized)}</td>
                                                <td className="text-right amount-cell detail success">{formatCurrency(bank.recovered)}</td>
                                                <td className="text-right amount-cell detail outstanding">{formatCurrency(bank.outstanding)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    {searchTerm ? 'No customers found' : 'No data available'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CustomerBankMatrix

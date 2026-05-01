import { supabase } from '../supabaseClient'

/**
 * Dashboard Service
 * Fetches all dashboard data using the provided SQL queries
 */

// KPI Card 1: Total Active Limit
export const getTotalActiveLimit = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_total_active_limit')

        if (error) throw error
        return data?.[0]?.total_limit || 0
    } catch (error) {
        console.error('Error fetching total active limit:', error)
        return 0
    }
}

// KPI Card 2: Total Utilized
export const getTotalUtilized = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_total_utilized')

        if (error) throw error
        return data?.[0]?.total_utilized || 0
    } catch (error) {
        console.error('Error fetching total utilized:', error)
        return 0
    }
}

// KPI Card 3: Total Recovered
export const getTotalRecovered = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_total_recovered')

        if (error) throw error
        return data?.[0]?.total_recovered || 0
    } catch (error) {
        console.error('Error fetching total recovered:', error)
        return 0
    }
}

// KPI Card 4: Net Outstanding
export const getNetOutstanding = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_net_outstanding')

        if (error) throw error
        return data?.[0]?.net_outstanding || 0
    } catch (error) {
        console.error('Error fetching net outstanding:', error)
        return 0
    }
}

// Combined KPI Data
export const getKPIData = async () => {
    try {
        const [totalLimit, totalUtilized, totalRecovered, netOutstanding] = await Promise.all([
            getTotalActiveLimit(),
            getTotalUtilized(),
            getTotalRecovered(),
            getNetOutstanding()
        ])

        return {
            totalLimit,
            totalUtilized,
            totalRecovered,
            netOutstanding
        }
    } catch (error) {
        console.error('Error fetching KPI data:', error)
        return {
            totalLimit: 0,
            totalUtilized: 0,
            totalRecovered: 0,
            netOutstanding: 0
        }
    }
}

// Customer-wise Utilization
export const getCustomerUtilization = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_customer_utilization')

        if (error) throw error

        return (data || []).map(r => ({
            ccode: r.ccode,
            customerName: r.customer_name,
            totalUtilized: r.total_utilized,
            totalRecovered: r.total_recovered,
            outstanding: r.outstanding,
            totalLimit: r.total_limit
        }))
    } catch (error) {
        console.error('Error fetching customer utilization:', error)
        return []
    }
}

// Bank-wise Summary
export const getBankSummary = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_bank_summary')

        if (error) throw error

        return (data || []).map(r => ({
            bcode: r.bcode,
            bankName: r.bank_name,
            totalUtilized: r.total_utilized,
            totalRecovered: r.total_recovered,
            outstanding: r.outstanding
        }))
    } catch (error) {
        console.error('Error fetching bank summary:', error)
        return []
    }
}

// Customer × Bank Matrix
export const getCustomerBankMatrix = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_customer_bank_matrix')

        if (error) throw error

        return (data || []).map(r => ({
            ccode: r.ccode,
            customerName: r.customer_name,
            bcode: r.bcode,
            bankName: r.bank_name,
            utilized: r.utilized,
            recovered: r.recovered,
            outstanding: r.outstanding
        }))
    } catch (error) {
        console.error('Error fetching customer bank matrix:', error)
        return []
    }
}

// Overdue/Risky Exposure
export const getOverdueExposure = async () => {
    try {
        const { data, error } = await supabase
            .rpc('get_overdue_exposure')

        if (error) throw error

        return (data || []).map(r => ({
            ccode: r.ccode,
            customerName: r.customer_name,
            bcode: r.bcode,
            bankName: r.bank_name,
            outstanding: r.outstanding
        }))
    } catch (error) {
        console.error('Error fetching overdue exposure:', error)
        return []
    }
}

// Fetch all dashboard data
export const getAllDashboardData = async () => {
    try {
        const [
            kpi,
            customerUtilization,
            bankSummary,
            customerBankMatrix,
            overdueExposure
        ] = await Promise.all([
            getKPIData(),
            getCustomerUtilization(),
            getBankSummary(),
            getCustomerBankMatrix(),
            getOverdueExposure()
        ])

        return {
            kpi,
            customerUtilization,
            bankSummary,
            customerBankMatrix,
            overdueExposure
        }
    } catch (error) {
        console.error('Error fetching all dashboard data:', error)
        return {
            kpi: {
                totalLimit: 0,
                totalUtilized: 0,
                totalRecovered: 0,
                netOutstanding: 0
            },
            customerUtilization: [],
            bankSummary: [],
            customerBankMatrix: [],
            overdueExposure: []
        }
    }
}

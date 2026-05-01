/**
 * Format large numbers with K, M, B suffixes
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string with suffix
 */
export const formatLargeNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0'
    }

    const num = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    if (num >= 1000000000) {
        // Billions
        return sign + (num / 1000000000).toFixed(decimals) + 'B'
    } else if (num >= 1000000) {
        // Millions
        return sign + (num / 1000000).toFixed(decimals) + 'M'
    } else if (num >= 1000) {
        // Thousands
        return sign + (num / 1000).toFixed(decimals) + 'K'
    } else {
        // Less than 1000
        return sign + num.toFixed(decimals)
    }
}

/**
 * Format currency with Rs. prefix and K, M, B suffixes
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, decimals = 2) => {
    return 'Rs. ' + formatLargeNumber(value, decimals)
}

/**
 * Format currency with full number (no abbreviation)
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string with commas
 */
export const formatCurrencyFull = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'Rs. 0.00'
    }

    return 'Rs. ' + new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

/**
 * Format number with commas (no currency symbol)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string with commas
 */
export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00'
    }

    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value)
}

/**
 * Format percentage
 * @param {number} value - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%'
    }

    return value.toFixed(decimals) + '%'
}

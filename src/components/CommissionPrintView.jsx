import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const CommissionPrintView = ({ voucherData, entries, onClose }) => {
    const navigate = useNavigate()

    useEffect(() => {
        // Redirect to print page with voucher number
        if (voucherData && voucherData.vno) {
            navigate(`/print/commission?vno=${voucherData.vno}`)
            onClose() // Close the modal
        }
    }, [voucherData, navigate, onClose])

    return null
}

export default CommissionPrintView

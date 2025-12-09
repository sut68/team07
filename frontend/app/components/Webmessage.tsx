import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Toast_success(message: string) {
    toast.success(message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        style: { marginTop: '25px', backgroundColor: 'white', fontFamily: 'Inter, sans-serif', color: "black", borderRadius: '30px', width: "100%", borderColor: '#9a0120', borderStyle: 'solid', zIndex: "9999" }
    })
}

function Toast_fail(message: string) {
    toast.error(message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        style: { marginTop: '25px', backgroundColor: 'white', fontFamily: 'Inter, sans-serif', color: "black", borderRadius: '30px', width: "100%", borderColor: '#9a0120', borderStyle: 'solid', zIndex: "9999" }
    })
}

export {
    Toast_success,
    Toast_fail
}
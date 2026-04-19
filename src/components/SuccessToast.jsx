import { Toast } from 'react-bootstrap';

export default function SuccessToast({ show, message, onClose }) {
    return (
        <Toast
            show={show}
            onClose={onClose}
            delay={3000}
            autohide
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                minWidth: '250px',
            }}
        >
            <Toast.Header>
                <strong className="me-auto">Success</strong>
            </Toast.Header>
            <Toast.Body>{message}</Toast.Body>
        </Toast>
    );
}
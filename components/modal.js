import React from 'react';

const Modal = ({ isOpen, onClose, title, children, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <div className="mb-4">{children}</div>
                <div className="flex justify-between">
                    <button onClick={onClose} className="bg-gray-300 text-black px-4 py-2 rounded">Cancel</button>
                    <button onClick={onConfirm} className="bg-blue-500 text-white px-4 py-2 rounded">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
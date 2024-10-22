import React, { useState } from 'react'

// Dialog Component
interface DialogProps {
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = useState(open)

  const handleClose = () => {
    setIsOpen(false)
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative" onClick={(e) => e.stopPropagation()}>
            {children}
            <button onClick={handleClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// DialogTrigger Component
interface DialogTriggerProps {
  children: React.ReactNode
  onOpenChange?: (isOpen: boolean) => void
}

export function DialogTrigger({ children, onOpenChange }: DialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    if (onOpenChange) {
      onOpenChange(true)
    }
  }

  return (
    <>
      <div onClick={handleOpen}>{children}</div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Dialog>
    </>
  )
}

// DialogContent Component
export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="dialog-content p-4">{children}</div>
}

// DialogHeader Component
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="dialog-header mb-4 border-b pb-2">{children}</div>
}

// DialogTitle Component
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>
}

// DialogDescription Component
export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 mt-2">{children}</p>
}

// DialogClose Component
export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
    >
      Close
    </button>
  )
}

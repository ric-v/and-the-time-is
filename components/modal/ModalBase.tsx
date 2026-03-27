import React from 'react'

type Props = {
  body: React.ReactNode;
  actionBar: React.ReactNode;
}

const ModalBase = ({ body, actionBar }: Props) => {
  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true"
      id="timestampmodal" tabIndex={-1}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all"></div>

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative rounded-2xl border border-[var(--border-subtle)] text-left overflow-hidden
            shadow-[0_24px_60px_rgba(0,0,0,0.35)] transform transition-all sm:my-8 sm:max-w-xl sm:w-full">
            <div className="bg-[var(--bg-card)] px-4 pt-5 pb-4 sm:p-6 sm:pb-5">
              <div className="text-center">
                {body}
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] px-4 py-3 sm:px-6 flex flex-row justify-end border-t border-[var(--border-subtle)]">
              {actionBar}
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default ModalBase;

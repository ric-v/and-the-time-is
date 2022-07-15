import React from 'react'

type Props = {
  body: React.ReactNode;
  actionBar: React.ReactNode;
}

const ModalBase = ({ body, actionBar }: Props) => {
  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true"
      id="timestampmodal" tab-index="-1" aria-hidden="true">
      <div className="fixed inset-0 backdrop-blur-md backdrop-brightness-75 transition-opacity"></div>

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-slate-800 rounded-lg text-left overflow-hidden  
            shadow-[20px_40px_40px_5px_rgba(0,0,0,0.33)] transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
            <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4">
                {body}
              </div>
            </div>
            {actionBar}
          </div>
        </div>
      </div>
    </div >
  )
}

export default ModalBase;

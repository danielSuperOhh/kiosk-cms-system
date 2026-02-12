
const Signin = () => {
  return (
    <div>
        <nav className='bg-slate-950 px-8 py-'>
            <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap= 'round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'></path>
                    </svg>
                </div>
                <span className='text-white text-xl font-heading font-semibold tracking-tight'>Admin Portal</span>
            </div>
        </nav>
    </div>
  )
}

export default Signin
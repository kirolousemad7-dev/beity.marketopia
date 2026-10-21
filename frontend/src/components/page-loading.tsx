export default function PageLoading() {
    return (
        <div className="page__loading">
            <svg className="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" />
            </svg>
            <span>Loading....</span>
        </div>
    )
}
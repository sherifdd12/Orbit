import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold text-slate-900 mb-2">404</h2>
            <p className="text-slate-600 mb-6 font-medium">Page not found</p>
            <Link
                href="/dashboard"
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all"
            >
                Back to Dashboard
            </Link>
        </div>
    )
}

import { TestAppLayout } from "./test-app-layout";
import Link from "next/link";

export default function Home() {
  return (
    <TestAppLayout>
      <div className="cls_test_app_main_content max-w-4xl">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></span>
            Test Application
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Welcome to Hazo PDF
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            A powerful React component library for viewing and annotating PDF documents.
            Explore the demos to see what&apos;s possible.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Link href="/demo/embedded" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Embedded View</h3>
            <p className="text-sm text-gray-500">Full-width PDF viewer embedded directly in your content area.</p>
          </Link>

          <Link href="/demo/dialog" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Dialog View</h3>
            <p className="text-sm text-gray-500">Open PDFs in modal dialogs for focused viewing.</p>
          </Link>

          <Link href="/demo/sidepanel" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Side Panel</h3>
            <p className="text-sm text-gray-500">Resizable PDF panel alongside your main content.</p>
          </Link>

          <Link href="/demo/highlight" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Highlight API</h3>
            <p className="text-sm text-gray-500">Programmatically create and manage text highlights.</p>
          </Link>

          <Link href="/demo/multi-file" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Multi-File</h3>
            <p className="text-sm text-gray-500">Switch between multiple PDF documents seamlessly.</p>
          </Link>

          <Link href="/demo/server-extract" className="group p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Server Extract</h3>
            <p className="text-sm text-gray-500">LLM-powered data extraction from PDF documents.</p>
          </Link>
        </div>

        {/* Getting Started */}
        <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white">
          <h3 className="font-semibold mb-2">Quick Start</h3>
          <p className="text-gray-400 text-sm mb-4">Install the package and start using the PDF viewer in your React app.</p>
          <pre className="bg-black/30 rounded-xl p-4 text-sm font-mono overflow-x-auto">
            <code className="text-green-400">npm install hazo_pdf</code>
          </pre>
        </div>
      </div>
    </TestAppLayout>
  );
}


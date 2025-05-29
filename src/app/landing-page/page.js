'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const [hasMounted, setHasMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const launchApp = () => {
        router.push('/dashboard');
    };

    if (!hasMounted) {
        return null;
    }

    return (
        <>
            <style jsx global>{`
                .feature-card {
                    transition: all 0.3s ease;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
            `}</style>

            <div className="bg-slate-50/90 text-slate-800 min-h-screen">
                {/* Navigation */}
                <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-slate-300">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-800">AeroNotes</h1>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center px-6 pt-16">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left side - Main content */}
                            <div className="text-center lg:text-left">
                                <div>
                                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        Secure File Storage
                                    </div>
                                    <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-slate-800 leading-none">
                                        Your Online <br/>Flash Drive,<br/>Simplified
                                    </h1>
                                </div>
                                <div>
                                    <p className="text-xl text-slate-600 mb-8 leading-snug">
                                        Store files remotely without the hassle. No email logins, no complexity.<br/>
                                        Just your <span className="font-semibold text-blue-700">phone number + secure PIN</span> access to your digital storage space.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <button 
                                        onClick={launchApp}
                                        className="inline-flex items-center px-8 py-4 bg-blue-100 hover:bg-blue-200 border border-blue-300 hover:border-blue-400 text-blue-700 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                                        </svg>
                                        Access Your Files
                                    </button>
                                    <div className="flex items-center justify-center lg:justify-start text-slate-500 text-sm">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                        </svg>
                                        No signup required
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right side - Feature highlights */}
                            <div className="lg:pl-8">
                                <div className="bg-white border border-slate-300 rounded-3xl p-8 shadow-lg">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6">Why Choose AeroNotes?</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800">Phone + PIN Access</h4>
                                                <p className="text-slate-600 text-sm">Your phone number and secure PIN create your unique storage vault</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800">Instant Upload</h4>
                                                <p className="text-slate-600 text-sm">Drag, drop, and access files instantly from any device</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                                                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800">Military-Grade Security</h4>
                                                <p className="text-slate-600 text-sm">Your files are encrypted and protected with enterprise security</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-12 px-6 bg-blue-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-none">
                                How It Works
                            </h2>
                            <p className="text-lg text-slate-600 leading-snug">
                                Three simple steps to secure file storage with phone + PIN authentication
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-blue-700">1</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 leading-tight">Enter Phone + PIN</h3>
                                <p className="text-slate-600 leading-snug">Enter your phone number and secure PIN to access your personal storage vault. Your unique combination creates your private space.</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-blue-700">2</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 leading-tight">Upload Files</h3>
                                <p className="text-slate-600 leading-snug">Drag and drop any file type. Documents, photos, videos - we handle them all securely in your personal vault.</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-blue-700">3</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 leading-tight">Access Anywhere</h3>
                                <p className="text-slate-600 leading-snug">Use the same phone + PIN combination from any device, anywhere in the world. Your flash drive follows you.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-12 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-none">
                                File Storage Made Simple
                            </h2>
                            <p className="text-lg text-slate-600 leading-snug">
                                Everything you need for secure remote file storage, without the complexity
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Simple PIN Access */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Phone + PIN Access</h3>
                                <p className="text-slate-600 leading-snug">No email, no passwords, no complexity. Just your phone number and secure PIN combination to access your files instantly from anywhere.</p>
                            </div>

                            {/* Universal File Support */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Any File Type</h3>
                                <p className="text-slate-600 leading-snug">Documents, images, videos, archives - store any file type securely. Your digital flash drive handles it all.</p>
                            </div>

                            {/* Instant Upload/Download */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Lightning Fast</h3>
                                <p className="text-slate-600 leading-snug">Drag, drop, done. Upload files instantly and download them just as quickly. No waiting, no frustration.</p>
                            </div>

                            {/* Cross-Device Access */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Access Anywhere</h3>
                                <p className="text-slate-600 leading-snug">Phone, tablet, laptop, desktop - access your files from any device with an internet connection. Your flash drive follows you.</p>
                            </div>

                            {/* No Email Hassles */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">No Email Required</h3>
                                <p className="text-slate-600 leading-snug">Skip the complicated sign-up process. No email accounts, no verification links, no forgotten passwords. Just simple, secure access.</p>
                            </div>

                            {/* Temporary Storage */}
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Auto-Delete Options</h3>
                                <p className="text-slate-600 leading-snug">Set files to auto-delete after a specific time. Perfect for temporary file sharing without cluttering your storage space.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section className="py-12 px-6 bg-slate-100">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-none">
                                Perfect For Everyone
                            </h2>
                            <p className="text-lg text-slate-600 leading-snug">
                                Whether you're a student, professional, or just need quick file access
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 leading-tight">Students</h3>
                                <p className="text-sm text-slate-600 leading-snug">Share assignments, store research, access files between home and school</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6m0 0v6m0-6H8m0 0V6m0 0v6"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 leading-tight">Professionals</h3>
                                <p className="text-sm text-slate-600 leading-snug">Quick file sharing, backup important documents, access anywhere</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 leading-tight">Photographers</h3>
                                <p className="text-sm text-slate-600 leading-snug">Store large image files, share with clients, backup portfolios</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-800 leading-tight">Families</h3>
                                <p className="text-sm text-slate-600 leading-snug">Share photos, store important documents, access from anywhere</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section className="py-12 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-none">
                                Security Without Complexity
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-snug">
                                Enterprise-level security with consumer-friendly simplicity
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Secure PIN Protection</h3>
                                <p className="text-slate-600 leading-snug">Your files are protected by secure PIN access with automatic session timeouts. Simple for you, impossible for others.</p>
                            </div>

                            <div className="feature-card bg-white border border-slate-300 rounded-2xl p-6">
                                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-800 leading-tight">Encrypted Storage</h3>
                                <p className="text-slate-600 leading-snug">Your files are encrypted both in transit and at rest. Military-grade security protecting your digital assets.</p>
                            </div>
                        </div>

                        <div>
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-3 text-blue-800 leading-tight">Privacy First</h3>
                                <p className="text-blue-700 leading-snug">
                                    Your files belong to you. We use secure PIN access instead of collecting personal information. No tracking, no data mining, just secure storage that respects your privacy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-12 px-6 ">
                    <div className="max-w-4xl mx-auto text-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-none">
                                Ready for Simple File Storage?
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-snug">
                                Join users who've chosen simplicity over complexity for their file storage needs
                            </p>
                            <button 
                                onClick={launchApp}
                                className="inline-flex items-center px-10 py-5 bg-blue-100 hover:bg-blue-200 border border-blue-300 hover:border-blue-400 text-blue-700 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                                </svg>
                                Start Storing Files
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-6 border-t border-slate-300">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="flex items-center justify-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">AeroNotes</h3>
                        </div>
                        <p className="text-slate-600">
                            Your online flash drive, simplified. Made with ❤️ for people who value simplicity over complexity.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
} 
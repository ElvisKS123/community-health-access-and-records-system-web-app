import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/Community Health Access & Records System PHOTO.jpg';
import imageOne from '../../assets/c79951cf-ffe9-4184-91af-72f19e66fe0d.jpeg';
import imageTwo from '../../assets/csmphoto 1.jpg';
import imageThree from '../../assets/EMR trecod image.jpg';
import imageFour from '../../assets/Hospital-Management-System.png';

export default function LandingPage() {
  return (
    <div className="antialiased">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 py-3 font-manrope">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-green-900">CHARS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-slate-500 hover:text-green-800 transition-colors duration-200" href="#problem">The Problem</a>
          <a className="text-slate-500 hover:text-green-800 transition-colors duration-200" href="#solution">The Solution</a>
          <a className="text-slate-500 hover:text-green-800 transition-colors duration-200" href="#features">Features</a>
          <a className="text-slate-500 hover:text-green-800 transition-colors duration-200" href="#benefits">Benefits</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 text-primary font-semibold hover:bg-green-50 transition-colors rounded-lg active:scale-95 duration-200">Login</Link>
          <Link to="/register" className="bg-primary-container text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary transition-colors active:scale-95 duration-200">Register Health Center</Link>
        </div>
      </nav>
      <main className="pt-24">
        <section className="px-6 py-20 lg:py-32 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-primary leading-[1.1] mb-8 tracking-tight font-headline">
                Community Health Access & Records System (CHARS)
              </h1>
              <p className="text-xl text-on-surface-variant mb-10 max-w-xl leading-relaxed">
                Replace paper-based records with a unified digital sanctuary. Streamline patient care, secure medical history, and empower clinicians with real-time data access.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-primary text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95">
                  Register Health Center
                </Link>
                <a href="#solution" className="px-8 py-4 bg-secondary-container text-on-secondary-container font-bold rounded-lg hover:bg-secondary-fixed transition-all active:scale-95">
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <img alt="Modern healthcare digital interface" className="w-full h-full object-cover" src={heroImage} />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-secondary-fixed-dim rounded-2xl -z-0 opacity-40"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 border-4 border-primary-fixed rounded-2xl -z-0 opacity-30"></div>
            </div>
          </div>
        </section>

        <section className="py-24" id="problem">
          <div className="px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <span className="text-primary font-bold tracking-widest text-sm mb-4 block">The Challenge</span>
                <h2 className="text-4xl font-bold text-on-surface font-headline">The Burden of Paper Records</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-primary">
                <h3 className="text-xl font-bold mb-3">Disorganized Records</h3>
                <p className="text-on-surface-variant">Lost folders and mislabeled documents lead to critical gaps in patient medical history.</p>
              </div>
              <div className="p-8 bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-primary">
                <h3 className="text-xl font-bold mb-3">Slow Access to Information</h3>
                <p className="text-on-surface-variant">Clinicians waste valuable minutes searching through stacks of paper instead of focusing on care.</p>
              </div>
              <div className="p-8 bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-primary">
                <h3 className="text-xl font-bold mb-3">Risk of Data Loss</h3>
                <p className="text-on-surface-variant">Paper records are easily damaged or lost due to factors like fire, water, or wear over time and can threaten lifelong health records.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24" id="solution">
          <div className="px-6 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-primary-container/10 rounded-lg overflow-hidden flex items-center justify-center">
                    <img alt="Cloud interface" className="w-full h-full object-cover" src={imageOne} />
                  </div>
                  <div className="aspect-square bg-secondary-container/20 rounded-lg overflow-hidden flex items-center justify-center">
                    <img alt="Encryption interface" className="w-full h-full object-cover" src={imageTwo} />
                  </div>
                  <div className="col-span-2 aspect-[21/9] bg-surface-container-high rounded-lg overflow-hidden">
                    <img alt="Secure digital healthcare record system" className="w-full h-full object-cover" src={imageThree} />
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-primary font-bold tracking-widest text-sm mb-4 block">The Solution</span>
                <h2 className="text-4xl lg:text-5xl font-bold text-on-surface mb-8 font-headline">Clinical Efficiency, Redefined</h2>
                <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
                  CHARS transforms healthcare delivery by centralizing patient data into a secure, intuitive digital platform. We move beyond simple storage to active care management.
                </p>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div>
                      <h4 className="font-bold text-primary">Fully Digital</h4>
                      <p className="text-on-surface-variant text-sm">Eliminate physical storage costs and clutter.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">

                    <div>
                      <h4 className="font-bold text-primary">Instant Access</h4>
                      <p className="text-on-surface-variant text-sm">Patient records available at the point of care within seconds.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24" id="features">
          <div className="px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 font-headline">Core Clinical Capabilities</h2>
              <p className="text-on-surface-variant">A comprehensive suite designed for the modern health center.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
              <div className="md:col-span-3 lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6">person_add</span>
                  <h3 className="text-2xl font-bold mb-2 font-headline">Patient Registration</h3>
                  <p className="text-on-surface-variant">Simple onboarding with unique biometric or ID tracking for lifelong continuity.</p>
                </div>
              </div>
              <div className="md:col-span-3 lg:col-span-8 bg-primary text-white p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-primary-fixed text-4xl mb-6">medical_services</span>
                  <h3 className="text-2xl font-bold mb-2 text-primary-fixed font-headline">Doctor Assignment</h3>
                  <p className="text-primary-fixed/80 max-w-md">Smart triage and automated queue management to ensure every patient reaches the right specialist faster.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10">
                  <span className="material-symbols-outlined text-[200px]">stethoscope</span>
                </div>
              </div>
              <div className="md:col-span-6 lg:col-span-8 bg-secondary-container p-8 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-on-secondary-container text-4xl mb-6">history_edu</span>
                  <h3 className="text-2xl font-bold mb-2 text-on-secondary-container font-headline">Medical Records</h3>
                  <p className="text-on-secondary-container/80 max-w-xl">Comprehensive history tracking including vitals, prescriptions, lab results, and longitudinal health insights.</p>
                </div>
              </div>
              <div className="md:col-span-6 lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between border-2 border-primary/5">
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6">analytics</span>
                  <h3 className="text-2xl font-bold mb-2 font-headline">Population Health</h3>
                  <p className="text-on-surface-variant">Aggregate data reports to help community leaders identify health trends and allocate resources.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24" id="benefits">
          <div className="px-6 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <h2 className="text-4xl font-bold mb-12 font-headline">The Impact of CHARS</h2>
                <div className="space-y-12">
                  <div className="flex gap-6">
                    <div className="text-5xl font-black text-primary/10">01</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 font-headline">Faster Service Delivery</h3>
                      <p className="text-on-surface-variant">Reduced wait times by up to 60% through automated registration and retrieval systems.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-5xl font-black text-primary/10">02</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 font-headline">Organized, Semantic Data</h3>
                      <p className="text-on-surface-variant">Data isn't just stored; it's structured for clinical decision support and accurate diagnosis.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-5xl font-black text-primary/10">03</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 font-headline">Better Healthcare Outcomes</h3>
                      <p className="text-on-surface-variant">Prevent errors, track immunizations, and ensure consistent follow-ups for chronic care.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 w-full grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] bg-surface-container rounded-2xl overflow-hidden shadow-sm">
                  <img alt="High quality healthcare equipment" className="w-full h-full object-cover" src={imageFour} />
                </div>
                <div className="aspect-[4/5] bg-surface-container rounded-2xl overflow-hidden mt-12 shadow-sm">
                  <img alt="Professional healthcare consultant" className="w-full h-full object-cover" src={heroImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="max-w-5xl mx-auto bg-primary rounded-[2rem] p-12 lg:p-20 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 font-headline">Ready to modernize your health center?</h2>
              <p className="text-primary-fixed/80 text-xl mb-12 max-w-2xl mx-auto">
                Join hundreds of community clinics already providing faster, safer, and more efficient healthcare through CHARS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="px-10 py-5 bg-white text-primary font-bold rounded-lg hover:bg-primary-fixed transition-all shadow-xl active:scale-95">
                  Register Your Center
                </Link>
              </div>
            </div>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <pattern height="10" id="grid" patternUnits="userSpaceOnUse" width="10">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"></path>
                </pattern>
                <rect fill="url(#grid)" height="100" width="100"></rect>
              </svg>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-highest py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <span className="text-2xl font-black text-primary mb-6 block font-headline">CHARS</span>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Building the digital foundation for community health centers worldwide. Ensuring every patient has a record that moves as fast as their care needs.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
            <div>
              <h5 className="font-bold text-primary mb-6 font-headline">Platform</h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">Digital Records</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Staff Management</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Triage System</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Reporting</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-6 font-headline">Organization</h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">About CHARS</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Case Studies</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Compliance</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Partners</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-primary mb-6 font-headline">Support</h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">Documentation</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant">
          (c) 2026 Community Health Access & Records System. All clinical rights reserved.
        </div>
      </footer>
    </div>
  );
}

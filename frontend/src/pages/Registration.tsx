import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUpload } from '../lib/api';

export default function Registration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [document, setDocument] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('contactPerson', form.contactPerson);
      body.append('email', form.email);
      body.append('phone', form.phone);
      body.append('licenseNumber', form.licenseNumber);
      body.append('address', form.address);
      body.append('password', form.password);
      if (document) body.append('document', document);

      await apiUpload('/api/clinics/register', body);
      setSuccess('Clinic registered successfully. You can now sign in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[60%] rounded-full bg-secondary-container/20 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[30%] h-[50%] rounded-full bg-primary-container/10 blur-[100px]"></div>
      </div>
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="md:col-span-2 bg-primary-container p-8 md:p-12 flex flex-col justify-between text-on-primary-container">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-tight text-white font-headline">CHARS</span>
            </Link>
            <div className="space-y-4">
              <p className="text-on-primary-container/80 text-sm leading-relaxed">
                Empower your healthcare facility with a system designed for precision, clarity, and patient-centered care. Join our network of excellence.
              </p>
            </div>

          </div>
          <div className="mt-12 text-xs text-on-primary-container/50">
            (c) 2026 Clinical Health Administration & Registration System.
          </div>
        </div>
        <div className="md:col-span-3 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-2 font-headline">Health Center Registration</h2>
            <p className="text-slate-500 text-sm">Complete the profile to begin your digital transformation.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Health Center Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">domain</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                    placeholder="e.g. St. Mary's General Hospital"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Administrator Name</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">person</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="Full legal name"
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Email Address</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">mail</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="admin@center.com"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Phone Number</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">call</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="+250 788 888 888"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">License Number</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">badge</span>
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="MD-8829-001"
                      type="text"
                      required
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Physical Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">location_on</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                    placeholder="Suite, Street, City, ZIP"
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant tracking-wider">License Document (optional)</label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all outline-none"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setDocument(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">lock</span>
                    <input
                      className="w-full pl-10 pr-10 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="Minimum 6 characters"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant tracking-wider">Confirm Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-lg group-focus-within:text-primary transition-colors">enhanced_encryption</span>
                    <input
                      className="w-full pl-10 pr-10 py-3 bg-surface-container-low border-none rounded-lg text-sm focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline outline-2 outline-transparent focus:outline-primary/20"
                      placeholder="Repeat password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            {success && <p className="text-xs text-primary font-semibold">{success}</p>}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Register Facility'}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
            <p className="text-center text-xs text-on-surface-variant">
              By registering, you agree to our 
              <a className="text-primary font-bold hover:underline mx-1" href="#">Terms of Service</a> and 
              <a className="text-primary font-bold hover:underline mx-1" href="#">Privacy Policy</a>.
            </p>
          </form>
          <div className="mt-8 pt-8 border-t border-surface-container-high text-center">
            <p className="text-sm text-on-surface-variant">
              Already have an account? 
              <Link to="/login" className="text-primary font-bold hover:underline ml-1">Log in here</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

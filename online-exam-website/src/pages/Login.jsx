import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // স্টুডেন্টের নাম নেওয়ার জন্য নতুন স্টেট
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // কেউ আগে থেকেই লগইন থাকলে তাকে সরাসরি ড্যাশবোর্ডে পাঠিয়ে দেবে
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userPhone = session.user.email.split('@')[0];
        if (userPhone === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Supabase Auth-এর জন্য ফোন নাম্বারকে একটি ডামি ইমেইলে কনভার্ট করা হচ্ছে
    const email = `${phone}@examportal.com`; 

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      if (!name.trim()) {
        toast.error("Please enter your name!");
        setLoading(false);
        return;
      }

      // ১. প্রথমে Auth-এ ইউজার তৈরি করা
      const { error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        toast.error("Sign Up Error: " + authError.message);
      } else {
        // ২. Auth তৈরি হলে profiles টেবিলে স্টুডেন্টের আসল নাম ও নাম্বার সেভ করা
        const { error: profileError } = await supabase.from('profiles').insert([
          { phone: phone, name: name.trim() }
        ]);

        if (profileError) {
          toast.error("Profile Error: " + profileError.message);
        } else {
          // --- নতুন লজিক: সাইন-আপ হলেই সরাসরি লগইন করিয়ে ড্যাশবোর্ডে পাঠানো ---
          toast.success("Account Created & Logged in Successfully!");
          
          if (phone === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/user-dashboard');
          }
        }
      }
    } else {
      // --- LOGIN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error("Invalid Phone Number or Password!");
      } else {
        toast.success("Welcome Back!");
        // অ্যাডমিন হলে অ্যাডমিন ড্যাশবোর্ডে, নাহলে ইউজার ড্যাশবোর্ডে যাবে
        if (phone === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#287A74] mb-2">Exam Portal</h1>
          <p className="text-gray-500 font-bold">
            {isSignUp ? 'Create your new account' : 'Login to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* সাইন-আপ মোডে থাকলে নাম দেওয়ার ফিল্ড দেখাবে */}
          {isSignUp && (
            <div>
              <label className="block text-gray-700 font-bold mb-2">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Jerin Akter" 
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none transition-colors font-medium"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-2">{isSignUp ? 'Phone Number' : 'Phone Number or Admin ID'}</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. 018XXXXXXXX" 
              className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none transition-colors font-medium"
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Password</label>
            <input 
              type="password" 
              required 
              placeholder="********" 
              className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none transition-colors font-medium"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all text-lg mt-4 ${loading ? 'bg-gray-400' : 'bg-[#287A74] hover:bg-[#1f5c57]'}`}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Login')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-bold">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setName(''); setPassword(''); }} 
              className="ml-2 text-[#55A9A0] hover:text-[#287A74] transition-colors"
            >
              {isSignUp ? 'Login here' : 'Sign up now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
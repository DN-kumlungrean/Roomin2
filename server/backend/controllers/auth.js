// controllers/Controller.js (FINAL FIXED VERSION)
import supabase from '../config/supabaseClient.js' // 👈 "Admin Client" (กุญแจผี)
import { createServerClient } from '@supabase/ssr';
import dotenv from 'dotenv';
dotenv.config();

// =Failure to start a new line before this point 🔹 REGISTER (สมัครสมาชิก)
// (ฟังก์ชันนี้ใช้ Admin Client อยู่แล้ว... ปลอดภัย)
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(201).json({
      message: 'User registered successfully',
      user: data.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ======================================================================
// 🔹 LOGIN (Email/Password)
// (ฟังก์ชันนี้ใช้ Admin Client อยู่แล้ว... ปลอดภัย)
// ======================================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(200).json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ======================================================================
// 🔹 ดึงข้อมูลผู้ใช้จาก Token (ใช้ Admin Client... ปลอดภัย)
// ======================================================================
export const user = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(200).json({ user: data.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ======================================================================
// 🔹 สร้าง Supabase Client ที่เชื่อมกับ cookie (User Client)
// ======================================================================
const createSupabaseClient = (req, res) => {
  let headersSent = false;
  res.on('finish', () => { headersSent = true });

  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: (name, value, options) => {
          let cookieOptions = { ...options };
          if (process.env.NODE_ENV !== 'production') {
            cookieOptions.sameSite = 'none'; 
            cookieOptions.secure = true;    
          }

          if (!headersSent && !res.headersSent) {
            res.cookie(name, value, cookieOptions); 
          }
        },
        remove: (name, options) => {
          let cookieOptions = { ...options };
          if (process.env.NODE_ENV !== 'production') {
            cookieOptions.sameSite = 'none';
            cookieOptions.secure = true;
          }
          if (!headersSent && !res.headersSent) {
            res.cookie(name, '', cookieOptions); 
          }
        },
      },
    }
  );
};

// ======================================================================
// 🔹 1. เริ่ม Login ด้วย Google (ไม่แก้)
// ======================================================================
export const handleGoogleLogin = async (req, res) => {
  const supabase = createSupabaseClient(req, res);
  const role = req.query.role || 'TENANT'; 
  console.log(`[handleGoogleLogin] Setting auth_role cookie to: ${role}`);
  const cookieOptions = {
    httpOnly: true,
    maxAge: 5 * 60 * 1000,
    secure: true, 
    sameSite: 'none' 
  };
  res.cookie('auth_role', role, cookieOptions);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/api/auth/callback', 
    },
  });

  if (error) {
    console.error(' Error signing in with Google:', error);
    return res.status(500).send('Something went wrong');
  }
  return res.redirect(data.url);
};

// ======================================================================
// 🔹 2. Callback หลังจาก Google Login (ไม่แก้)
// ======================================================================
export const handleGoogleCallback = async (req, res) => {
  const code = req.query.code;
  const supabase = createSupabaseClient(req, res);
  const role = req.cookies.auth_role || 'TENANT';
  console.log(` [handleGoogleCallback] Received code, Role from Cookie: ${role}`);
  res.clearCookie('auth_role', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(String(code));
    if (error) {
      console.error(' Error exchanging code for session:', error);
      return res.status(500).send('Something went wrong');
    }
  }
  res.redirect(`/api/auth/check-profile?role=${role}`);
};

// ======================================================================
// 🔹 3. ตรวจสอบ Profile (✅✅✅ FIXED - Bug #1 ✅✅✅)
// ======================================================================
export const checkProfile = async (req, res) => {
  const roleFromQuery = req.query.role || 'TENANT';
  const frontendUrl = 'http://localhost:5173';
  console.log(`[checkProfile] role from query: ${roleFromQuery}`);

  // 1. (FIX) ใช้ "User Client" เพื่อถอดรหัส Token
  const userClient = createSupabaseClient(req, res);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 2. (FIX) ใช้ "Admin Client" (ตัวพิมพ์เล็ก) เพื่อข้าม RLS
  const { data, error } = await supabase // 👈 "supabase" (ตัวเล็ก)
    .from('User')
    .select('role')
    .eq('authId', user.id)
    .maybeSingle();

  if (error) {
    console.error('DB error in checkProfile:', error);
    return res.status(500).json({ message: 'Database Error' });
  }

  if (data) {
    if (data.role === 'OWNER') {
      console.log(`➡️ Redirect to OWNER dashboard`);
      return res.redirect(`${frontendUrl}/owner/dashboard`);
    } else {
      console.log(`➡️ Redirect to TENANT dashboard`);
      return res.redirect(`${frontendUrl}/tenant/dashboard`);
    }
  } else {
    if (roleFromQuery === 'OWNER') {
      console.log(`➡️ Redirect to OWNER inform`);
      return res.redirect(`${frontendUrl}/owner/inform`);
    } else {
      console.log(`➡️ Redirect to TENANT inform`);
      return res.redirect(`${frontendUrl}/tenant/inform`);
    }
  }
};

// ======================================================================
// 🔹 4. ดึงข้อมูล Profile (✅✅✅ FIXED - Bug #1 ✅✅✅)
// ======================================================================
export const getMyProfile = async (req, res) => {
  // 1. (FIX) ใช้ "User Client" เพื่อถอดรหัส Token
  const userClient = createSupabaseClient(req, res);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 2. (FIX) ใช้ "Admin Client" (ตัวพิมพ์เล็ก) เพื่อข้าม RLS
  const { data: profile, error: profileError } = await supabase // 👈 "supabase" (ตัวเล็ก)
    .from('User')
    .select('*')
    .eq('authId', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile for /me:', profileError);
    return res.status(500).json({ message: "Error fetching profile: " + profileError.message });
  }
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found', needsProfile: true });
  }
  return res.status(200).json({ user: profile });
};

// ======================================================================
// 🔹 5. แสดงฟอร์มกรอกโปรไฟล์ (ไม่แก้)
// ======================================================================
export const showCompleteProfileForm = (req, res) => {
  res.render('complete-profile');
};

// ======================================================================
// 🔹 6. บันทึกข้อมูลโปรไฟล์ (✅✅✅ FIXED - Bug #1 and #2 ✅✅✅)
// (ฟังก์ชันนี้แก้ทั้ง 2 บั๊ก: Client + Schema)
// ======================================================================
export const handleCompleteProfileSubmit = async (req, res) => {
  const userClient = createSupabaseClient(req, res);

  try {
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. (FIX) อ่าน "promptpay" มาจาก req.body โดยตรง
    // (เพราะ Frontend ส่ง "promptpay" มา)
    const { FName, LName, phone, role, promptpay } = req.body; 
    const userRole = (role === 'OWNER') ? 'OWNER' : 'TENANT';

    // 2. (FIX - Client) ใช้ "Admin Client" (ตัวเล็ก)
    const { data: newRow, error: insertError } = await supabase.from('User').insert({
      authId: user.id,
      Gmail: user.email, 
      FName,
      LName,
      phone,
      role: userRole,
      promptpay: promptpay 
    }).select().single();

    if (insertError) {
      console.error('Error saving profile:', insertError);
      return res.status(500).json({ message: insertError.message });
    }

    return res.status(200).json({ message: 'Profile completed successfully', user: newRow });
  } catch (err) {
    console.error('Critical Error in handleCompleteProfileSubmit:', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ======================================================================
// 🔹 7. Dashboard (ไม่แก้)
// ======================================================================
export const showDashboard = async (req, res) => {
  const supabase = createSupabaseClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.render('dashboard');
};

// ======================================================================
// 🔹 8. Logout (ไม่แก้)
// ======================================================================
export const handleLogout = async (req, res) => {
  const supabase = createSupabaseClient(req, res);
  await supabase.auth.signOut();
  return res.status(200).json({ message: 'Logged out successfully' });
};
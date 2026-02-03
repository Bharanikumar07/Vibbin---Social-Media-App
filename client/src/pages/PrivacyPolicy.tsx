import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Lock, Eye, FileText, Bell } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text-main)',
            padding: '40px 20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '40px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-100px',
                    right: '-100px',
                    width: '300px',
                    height: '300px',
                    background: 'var(--primary)',
                    filter: 'blur(120px)',
                    opacity: 0.1,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '0',
                            marginBottom: '32px',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ChevronLeft size={18} />
                        Back to App
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{
                            padding: '12px',
                            background: 'rgba(var(--primary-rgb), 0.1)',
                            borderRadius: '16px',
                            color: 'var(--primary)'
                        }}>
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Privacy Policy</h1>
                            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Last updated: February 3, 2026</p>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '32px 0' }}></div>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Eye size={20} color="var(--primary)" />
                            1. Information We Collect
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Vibebin collects information to provide better services to all our users. We collect information in the following ways:
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li><strong>Account Information:</strong> When you sign up, we ask for personal information like your name, email address, username, and password.</li>
                            <li><strong>Profile Content:</strong> Information you choose to provide for your profile, such as photos, bio, and other details.</li>
                            <li><strong>Usage Data:</strong> We collect information about how you interact with our services, including posts you view, connections you make, and messages you send.</li>
                            <li><strong>Device Information:</strong> We may collect device-specific information such as your hardware model and operating system version.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lock size={20} color="var(--primary)" />
                            2. How We Use Information
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            We use the information we collect to:
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li>Provide, maintain, protect and improve our services.</li>
                            <li>Develop new features and services.</li>
                            <li>Personalize your experience by showing you relevant content.</li>
                            <li>Communicate with you about our services, including updates and security alerts.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={20} color="var(--primary)" />
                            3. Information Sharing
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            We do not share your personal information with companies, organizations, or individuals outside of Vibebin except in the following cases:
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li><strong>With your consent:</strong> We will share personal information when we have your explicit consent.</li>
                            <li><strong>For legal reasons:</strong> We will share personal information if we believe that access, use, preservation, or disclosure of the information is reasonably necessary to meet any applicable law, regulation, legal process, or enforceable governmental request.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell size={20} color="var(--primary)" />
                            4. Your Privacy Controls
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            You have many choices regarding your information:
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li>You can view and edit your profile information at any time.</li>
                            <li>You can control who sees your content through privacy settings.</li>
                            <li>You can delete your account, which will remove your profile and posts from public view.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>5. Contact Us</h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            If you have any questions about this Privacy Policy, please contact us at:<br />
                            <a href="mailto:bharanikumargv07@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>bharanikumargv07@gmail.com</a>
                        </p>
                    </section>
                </div>
            </div>

            <footer style={{
                textAlign: 'center',
                marginTop: '40px',
                color: 'var(--text-muted)',
                fontSize: '14px'
            }}>
                &copy; {new Date().getFullYear()} Vibebin. All rights reserved.
            </footer>
        </div>
    );
};

export default PrivacyPolicy;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Gavel, UserCheck, AlertTriangle, Scale, Globe } from 'lucide-react';

const TermsOfService = () => {
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
                    left: '-100px',
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
                            <Gavel size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Terms of Service</h1>
                            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Last updated: February 3, 2026</p>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '32px 0' }}></div>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Globe size={20} color="var(--primary)" />
                            1. Acceptance of Terms
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            By accessing or using Vibebin, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <UserCheck size={20} color="var(--primary)" />
                            2. User Eligibility and Accounts
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            You must be at least 13 years old to use Vibebin. When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertTriangle size={20} color="var(--primary)" />
                            3. Content and Conduct
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            You are solely responsible for the content you post on Vibebin. You agree not to:
                        </p>
                        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li>Post content that is illegal, harmful, threatening, or abusive.</li>
                            <li>Impersonate any person or entity.</li>
                            <li>Infringe upon the intellectual property rights of others.</li>
                            <li>Upload viruses or other malicious code.</li>
                            <li>Harass or bully other users.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Scale size={20} color="var(--primary)" />
                            4. Termination
                        </h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            We reserve the right to terminate or suspend your account and access to Vibebin at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of Vibebin, us, or third parties.
                        </p>
                    </section>

                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>5. Limitation of Liability</h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            Vibebin shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>6. Changes to Terms</h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            We may revise these Terms of Service at any time without notice. By using Vibebin, you are agreeing to be bound by the then-current version of these Terms of Service.
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

export default TermsOfService;

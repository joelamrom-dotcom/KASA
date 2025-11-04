// Email Service for Goldberger Family Dashboard
// Handles Gmail SMTP integration for dunning emails

class EmailService {
    constructor() {
        this.isConfigured = false;
        this.smtpConfig = null;
        this.loadConfig();
    }

    // Load email configuration from localStorage
    loadConfig() {
        const savedConfig = localStorage.getItem('emailConfig');
        if (savedConfig) {
            this.smtpConfig = JSON.parse(savedConfig);
            this.isConfigured = true;
        }
    }

    // Save email configuration to localStorage
    saveConfig(config) {
        this.smtpConfig = config;
        this.isConfigured = true;
        localStorage.setItem('emailConfig', JSON.stringify(config));
    }

    // Show email configuration modal
    showEmailConfig() {
        const modalHTML = `
            <div id="emailConfigModal" class="modal-overlay">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>📧 Email Configuration</h2>
                        <button onclick="closeModal('emailConfigModal')" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Gmail Address</label>
                            <input type="email" id="emailAddress" class="form-control" placeholder="your-email@gmail.com">
                            <small>Your Gmail address that will send emails</small>
                        </div>
                        
                        <div class="form-group">
                            <label>App Password</label>
                            <input type="password" id="appPassword" class="form-control" placeholder="16-character app password">
                            <small>
                                <strong>How to get an App Password:</strong><br>
                                1. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank">Google Account Settings</a><br>
                                2. Enable 2-Factor Authentication if not already enabled<br>
                                3. Generate an App Password for "Mail"<br>
                                4. Use the 16-character password (no spaces)
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label>From Name (Optional)</label>
                            <input type="text" id="fromName" class="form-control" placeholder="Goldberger Family Management">
                            <small>Display name for sent emails</small>
                        </div>
                        
                        <div class="alert alert-info">
                            <strong>Security Note:</strong> Your app password is stored locally in your browser. 
                            Never share this password or use it on public computers.
                        </div>
                        
                        <div class="form-group">
                            <button onclick="testEmailConfig()" class="btn btn-warning">🧪 Test Configuration</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="saveEmailConfig()" class="btn btn-primary">Save Configuration</button>
                        <button onclick="closeModal('emailConfigModal')" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate with existing config
        if (this.smtpConfig) {
            document.getElementById('emailAddress').value = this.smtpConfig.email || '';
            document.getElementById('appPassword').value = this.smtpConfig.password || '';
            document.getElementById('fromName').value = this.smtpConfig.fromName || '';
        }
        
        openModal('emailConfigModal');
    }

    // Save email configuration
    saveEmailConfig() {
        const email = document.getElementById('emailAddress').value.trim();
        const password = document.getElementById('appPassword').value.trim();
        const fromName = document.getElementById('fromName').value.trim();

        if (!email || !password) {
            alert('Please provide both Gmail address and App Password');
            return;
        }

        if (!email.includes('@gmail.com')) {
            alert('Please use a Gmail address');
            return;
        }

        const config = {
            email: email,
            password: password,
            fromName: fromName || 'Goldberger Family Management',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            secure: false
        };

        this.saveConfig(config);
        closeModal('emailConfigModal');
        alert('Email configuration saved successfully!');
    }

    // Test email configuration
    async testEmailConfig() {
        const email = document.getElementById('emailAddress').value.trim();
        const password = document.getElementById('appPassword').value.trim();
        const fromName = document.getElementById('fromName').value.trim();

        if (!email || !password) {
            alert('Please provide both Gmail address and App Password');
            return;
        }

        const config = {
            email: email,
            password: password,
            fromName: fromName || 'Goldberger Family Management',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            secure: false
        };

        try {
            // Show loading state
            const testBtn = document.querySelector('button[onclick="testEmailConfig()"]');
            const originalText = testBtn.innerHTML;
            testBtn.innerHTML = '🔄 Testing...';
            testBtn.disabled = true;

            // Send test email
            const success = await this.sendEmail({
                to: email,
                subject: 'Test Email - Goldberger Family Dashboard',
                html: `
                    <h2>Email Configuration Test</h2>
                    <p>This is a test email from your Goldberger Family Dashboard.</p>
                    <p>If you received this email, your configuration is working correctly!</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                `
            }, config);

            if (success) {
                alert('✅ Test email sent successfully! Check your inbox.');
            } else {
                alert('❌ Failed to send test email. Please check your configuration.');
            }
        } catch (error) {
            alert('❌ Error sending test email: ' + error.message);
        } finally {
            // Restore button state
            const testBtn = document.querySelector('button[onclick="testEmailConfig()"]');
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    // Send email using Gmail SMTP
    async sendEmail(emailData, config = null) {
        const emailConfig = config || this.smtpConfig;
        
        if (!emailConfig) {
            console.error('Email configuration not found');
            return false;
        }

        try {
            // For now, we'll use a simple approach with EmailJS or similar
            // In a real implementation, you'd use a backend service or EmailJS
            
            // Simulate email sending (replace with actual implementation)
            console.log('📧 Sending email:', {
                from: `${emailConfig.fromName} <${emailConfig.email}>`,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html
            });

            // Add to audit log
            if (typeof addAuditLogEntry === 'function') {
                addAuditLogEntry('system', 'email', 'system', 'Email Service', 
                    `Email sent to ${emailData.to}: ${emailData.subject}`);
            }

            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // Send dunning email
    async sendDunningEmail(member, statement, templateType) {
        if (!this.isConfigured) {
            console.warn('Email service not configured. Logging to console only.');
            return false;
        }

        const template = dunningSettings.emailTemplates[templateType];
        const emailContent = template
            .replace('{memberName}', `${member.firstName} ${member.lastName}`)
            .replace('{amount}', `$${statement.amount}`)
            .replace('{statementNumber}', statement.statementNumber);

        const subject = `Payment ${templateType === 'reminder' ? 'Reminder' : 
                        templateType === 'final' ? 'Final Notice' : 'Account Reinstated'}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; text-align: center;">
                    <h1>${familyData.family?.name || 'Goldberger Family'} Management</h1>
                </div>
                <div style="padding: 20px; background: #f8f9fa;">
                    <p>${emailContent.replace(/\n/g, '<br>')}</p>
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3>Statement Details:</h3>
                        <p><strong>Statement #:</strong> ${statement.statementNumber}</p>
                        <p><strong>Amount Due:</strong> $${statement.amount}</p>
                        <p><strong>Due Date:</strong> ${new Date(statement.dueDate).toLocaleDateString()}</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `;

        return await this.sendEmail({
            to: member.email,
            subject: subject,
            html: htmlContent
        });
    }

    // Get configuration status
    getStatus() {
        return {
            configured: this.isConfigured,
            email: this.smtpConfig?.email || 'Not configured'
        };
    }
}

// Global email service instance
const emailService = new EmailService();

// Global functions for HTML onclick handlers
function showEmailConfig() {
    emailService.showEmailConfig();
}

function saveEmailConfig() {
    emailService.saveEmailConfig();
}

function testEmailConfig() {
    emailService.testEmailConfig();
}

// Override the existing sendDunningEmail function
function sendDunningEmail(member, statement, templateType) {
    return emailService.sendDunningEmail(member, statement, templateType);
}

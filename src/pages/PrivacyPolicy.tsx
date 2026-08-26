import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4 pb-12">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-6 w-6" />
        <h1 className="text-2xl font-display font-semibold">Privacy Policy</h1>
      </div>
      <p className="text-xs text-muted-foreground">Last updated: August 2026 · DPDP Act 2023 compliant</p>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">1. Who We Are</h2>
        <p className="text-sm text-muted-foreground">The organization operating this Field-Sync deployment is the Data Fiduciary for personal data collected through field visits and customer/prospect records.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">2. Data We Collect</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Customer/prospect details: name, mobile number, address, location</li>
          <li>Field visit records: geo-tagged check-in/out, visit outcome, notes</li>
          <li>Where a visit is DSA/Sub-DSA channel-sourced: the name and mobile number of the person met, OTP-verified at the time of the visit</li>
          <li>Employee details: name, phone, email, attendance and location while on duty</li>
        </ul>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">3. Purpose of Collection</h2>
        <p className="text-sm text-muted-foreground">Data is collected solely to run field sales/service operations, verify that a visit genuinely took place, and — for channel-sourced business — trace a lead back to the DSA/Sub-DSA that originated it.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">4. Legal Basis</h2>
        <p className="text-sm text-muted-foreground">Personal data is processed based on consent obtained at the point of collection (e.g. the OTP confirmation on a channel visit), as required by Section 6 of the Digital Personal Data Protection Act, 2023.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">5. Data Retention</h2>
        <p className="text-sm text-muted-foreground">Data is retained for the duration of the business relationship and as required by applicable regulatory record-keeping rules. On a verified erasure request, data is anonymised, subject to legal retention requirements.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">6. Your Rights (DPDP Act 2023)</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li><strong>Right to Access:</strong> request a summary of data held about you</li>
          <li><strong>Right to Correction:</strong> request correction of inaccurate data</li>
          <li><strong>Right to Erasure:</strong> request deletion of your personal data</li>
          <li><strong>Right to Withdraw Consent:</strong> withdraw consent at any time</li>
          <li><strong>Right to Grievance Redressal:</strong> raise a concern, resolved within 90 days</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">To exercise any of these rights, contact the organization directly — staff log and track every request from the DPDP Compliance screen.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">7. Data Security</h2>
        <p className="text-sm text-muted-foreground">Mobile numbers and email addresses are stored encrypted, with only a masked value ever shown on screen; row-level access control and a full access audit log are in place for anyone who needs to view the real value.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">8. Data Breach Notification</h2>
        <p className="text-sm text-muted-foreground">In the event of a data breach, affected individuals and the Data Protection Board of India will be notified without delay, in plain language, describing the nature of the breach, its impact, and remedial steps taken.</p>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <h2 className="font-semibold">9. Contact</h2>
        <p className="text-sm text-muted-foreground">
          For any privacy query or to exercise a data right, contact the organization's designated point of contact directly, or raise it with In-Sync support.<br /><br />
          If your concern is not addressed within 90 days, you may approach the Data Protection Board of India.
        </p>
      </CardContent></Card>
    </div>
  );
}

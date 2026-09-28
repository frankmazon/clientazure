import type { ReactNode } from 'react';
export default function PrivacyAuthority({ date, children }: { date: string; children: ReactNode }) {
  return <article className="privacy-authority mx-auto max-w-[794px] bg-white px-5 py-8 text-[13px] leading-relaxed text-black sm:px-12">
    <img src="/logo/logo.png" alt="SBR Funding" className="mb-5 h-20 w-32 object-contain object-left" />
    <h2 className="mb-2 font-bold underline">Privacy Statement and Authority</h2>
    <table className="mb-5 w-full border-collapse text-left text-xs"><thead><tr><th colSpan={2} className="border border-black bg-cyan-500 p-1 text-center text-white">ABOUT US</th></tr></thead><tbody>
      {[["Licensee", 'SBR Funding ("Licensee") ABN 25 074 790 882'], ['Australian Credit License Number', '565712'], ['Address', 'Level 4 / 24 Albert Road, South Melbourne VIC 3205'], ['Date', date]].map(([label, value]) => <tr key={label}><th className="w-[35%] border border-black p-1 font-normal">{label}</th><td className="border border-black p-1">{value}</td></tr>)}
    </tbody></table>
    <div className="space-y-4">
      <p>We need to collect personal information about you to provide you with our mortgage management and related services.</p>
      <p>The information is required to assist us in preparing the loan application and locating an appropriate lender. If your information is not provided, we may not be able to assist in finding a suitable loan relevant to your circumstances.</p>
      <p>Unless you tell us not to, we may use your information to provide you with offers or information of other products or services we or a third party can provide you.</p>
      <p><strong>SBR Funding</strong> and its related bodies corporate may disclose your information to other organisations whether local or international to help us provide our services and arrange the loan.</p>
      <p>The types of organisations we may disclose your information to include lenders, mortgage insurers, other mortgage intermediaries, property valuers, insurers and other organisations which assist us (such as printers, mailing houses, lawyers and accountants).</p>
      <p>In addition, we may disclose your personal information to any other organisation that may wish to or has acquired an interest in your loan or lease or in our business.</p>
      <p>You can gain access to the information we hold about you by contacting us via:</p>
      <p>Phone:　1300 997 125<br />Email:　<a className="text-blue-700 underline" href="mailto:support@sbrfunding.com.au">support@sbrfunding.com.au</a></p>
      <p>You agree that we may collect and use your personal information as specified above. If you require further information about our privacy policy, you can visit the Federal Privacy Commissioner's website at www.privacy.gov.au.</p>
      <p>By signing this document, you agree to the terms of this Authority above.</p>
    </div>
    <div className="mt-8 space-y-8">{children}</div>
    <footer className="mt-10 flex flex-wrap justify-between gap-4 border-t border-slate-100 pt-4 text-[10px] text-cyan-700"><p>Casa Avian (AUST) Pty Ltd ACL 565712 trading as<br />SBR Funding (ABN 25 074 790 882)<br />Level 4 / 24 Albert Rd, South Melbourne VIC 3205</p><p>SBR Funding<br />support@sbrfunding.com.au<br />P 1300 997 125</p></footer>
  </article>;
}

import { useState } from "react";
import { extractDocs, evaluateClaim } from "./api";
import type { ExtractedPayload, EvaluationResponse, ChargeItem } from "./types";
import "./styles.css";

type Step = "upload" | "preview" | "receipt";

export default function App() {
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);

  // server payloads
  const [extracted, setExtracted] = useState<ExtractedPayload | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);

  // local editable copy of extracted
  const [editable, setEditable] = useState<ExtractedPayload | null>(null);

  // handlers
  async function onUploadSubmit(fd: FormData) {
    setLoading(true);
    try {
      const data = await extractDocs(fd);
      setExtracted(data);
      setEditable(data); // start with server’s output
      setStep("preview");
    } catch (e:any) {
      alert(e?.response?.data?.error || "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  async function onAnalyze() {
    if (!editable) return;
    // hard guard: these are required
    if (!editable.maximumBenefit || editable.maximumBenefit <= 0) {
      alert("Maximum Benefit is required.");
      return;
    }
    if (!editable.monthlyRent || editable.monthlyRent <= 0) {
      alert("Monthly Rent is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await evaluateClaim(editable);
      setEvaluation(result);
      setStep("receipt");
    } catch (e:any) {
      alert(e?.response?.data?.error || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <Header />
      {step === "upload" && <UploadCard onSubmit={onUploadSubmit} loading={loading} />}

      {step === "preview" && editable && extracted && (
        
        <PreviewCard
          editable={editable}
          setEditable={setEditable}
          onAnalyze={onAnalyze}
          loading={loading}
          uploadedDocs={extracted.docPresence}
        />
      )}

      {step === "receipt" && evaluation && editable && (
        <Receipt
          evaluation={evaluation}
          extracted={editable} 
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="header">
      <h1>Claim Evaluator</h1>
    </div>
  );
}

function UploadCard({ onSubmit, loading }:{
  onSubmit:(fd:FormData)=>void; loading:boolean;
}) {
  const [leaseAgreement, setLeaseAgreement] = useState<File|null>(null);
  const [leaseAddendum, setLeaseAddendum] = useState<File|null>(null);
  const [notification, setNotification] = useState<File|null>(null);
  const [tenantLedger, setTenantLedger] = useState<File|null>(null);
  const [policyNumber, setPolicyNumber] = useState<string>(""); 

  const handle = (e:React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (leaseAgreement) fd.append("lease_agreement", leaseAgreement);
    if (leaseAddendum)  fd.append("lease_addendum", leaseAddendum);
    if (notification)   fd.append("notification_to_tenant", notification);
    if (tenantLedger)   fd.append("tenant_ledger", tenantLedger);
    fd.append("policyNumber", policyNumber);
    onSubmit(fd);
  };

  return (
    <div className="card">
      <h2>Upload Documents</h2>
      <form onSubmit={handle} className="grid">
         <div className="col">
          <label>Policy Number</label>
          <input
            className="input"
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            placeholder="e.g. 6313R"
            required
          />
        </div>
        <LabeledFile label="Lease Agreement" onChange={setLeaseAgreement} />
        <LabeledFile label="Lease Addendum (SDI)" onChange={setLeaseAddendum} />
        <LabeledFile label="Notification to Tenant" onChange={setNotification} />
        <LabeledFile label="Tenant Ledger / Move-Out" onChange={setTenantLedger} />
        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? <Loader/> : "Extract"}
          </button>
          <p className="hint">
            Note: Uploading fewer than 4 is allowed
          </p>
        </div>
      </form>
    </div>
  );
}

function LabeledFile({label,onChange}:{label:string; onChange:(f:File|null)=>void}) {
  return (
    <label className="file">
      <span>{label}</span>
      <input type="file" accept="application/pdf" onChange={(e)=>onChange(e.target.files?.[0]||null)} />
    </label>
  );
}

function PreviewCard({
  editable, setEditable, onAnalyze, loading, uploadedDocs
}:{
  editable: ExtractedPayload;
  setEditable: (v:ExtractedPayload)=>void;
  onAnalyze: ()=>void;
  loading: boolean;
  uploadedDocs: ExtractedPayload["docPresence"];
}) {
  // helpers to edit numbers
  const setNum = (key:"monthlyRent"|"maximumBenefit") => (v:string) => {
    const n = v.trim()==="" ? null : Number(v);
    setEditable({...editable, [key]: isNaN(Number(n)) ? null : n});
  };
  const setText = (key: "tenantName" | "propertyAddress") => (v: string) => {
  setEditable({ ...editable, [key]: v.trim() === "" ? null : v });
};

  // shows wear selector only when policy requires it
  const needsWear = (catRaw: string | null, descRaw?: string | null) => {
    const cat = (catRaw || "").toLowerCase();
    const desc = (descRaw || "").toLowerCase();

    const DAMAGE_CATS = new Set(["cleaning", "painting", "carpet", "flooring", "repair"]);

    const FEE_LIKE = /(late fee|returned payment|convenience|admin(istrative)?|legal|professional|court|maintenance coordination|sdrp|filter program|processing fee|service fee|coordination)/i;

    const DAMAGE_LIKE = /(repair|replace|patch|hole|stain|burn|tear|broken|damaged|gouge|scrape|paint|clean|carpet|floor|tile|appliance|fixture)/i;

    if (DAMAGE_CATS.has(cat)) return true;
    if (cat === "other" && DAMAGE_LIKE.test(desc) && !FEE_LIKE.test(desc)) return true;

    return false;
  };

  const anyNeedsWear = editable.charges.some(c => needsWear(c.category, c.description));

  const setWear = (idx:number, val:"normal_wear_and_tear"|"beyond_normal_wear_and_tear"|"" )=>{
    const next = [...editable.charges];
    next[idx] = { ...next[idx], wearClassification: val===""?null:val };
    setEditable({...editable, charges: next});
  };
  
const needsOccupancy = (catRaw: string | null) => {
  const cat = (catRaw || "").toLowerCase();
  return cat === "prorated_rent";
};

const anyNeedsOccupancy = editable.charges.some(c => needsOccupancy(c.category));

const setOccupancy = (idx: number, val: "Yes" | "No" | "" ) => {
  const next = [...editable.charges];
  next[idx] = { ...next[idx], occupancyLink: val==="" ? null : val };
  setEditable({ ...editable, charges: next });
};

  return (
    <div className="card">
      <h2>Review & Complete Details</h2>
      <div className="row">
  <div className="col">
    <label>Tenant Name</label>
    <input
      className="input"
      value={editable.tenantName ?? ""}
      onChange={(e)=>setText("tenantName")(e.target.value)}
      placeholder="e.g. Sai Bharath"
    />
  </div>
  <div className="col">
    <label>Property Address</label>
    <input
      className="input"
      value={editable.propertyAddress ?? ""}
      onChange={(e)=>setText("propertyAddress")(e.target.value)}
      placeholder="e.g. 1801 Crystal Dr Apt 511, Arlington, VA 22202"
    />
  </div>
</div>
      <div className="row">
        <div className="col">
          <label>Monthly Rent (USD)</label>
          <input
            className="input"
            value={editable.monthlyRent ?? ""}
            onChange={(e)=>setNum("monthlyRent")(e.target.value)}
            placeholder="e.g. 1750"
          />
        </div>
        <div className="col">
          <label>Maximum Benefit (USD)</label>
          <input
            className="input"
            value={editable.maximumBenefit ?? ""}
            onChange={(e)=>setNum("maximumBenefit")(e.target.value)}
            placeholder="Required"
          />
        </div>
      </div>

      <div className="doclist">
        <strong>Submitted Documents:</strong>
        <ul>
          <li>Lease Agreement: {uploadedDocs.leaseAgreement ? "Yes" : "No"}</li>
          <li>Lease Addendum (SDI): {uploadedDocs.leaseAddendum ? "Yes" : "No"}</li>
          <li>Notification to Tenant: {uploadedDocs.notificationToTenant ? "Yes" : "No"}</li>
          <li>Tenant Ledger / Move-Out: {uploadedDocs.tenantLedger ? "Yes" : "No"}</li>
        </ul>
      </div>

      <h3>Charges</h3>
      <div className="table">
        <div className="tr head">
          <div>Date</div>
          <div>Description</div>
          <div>Amount</div>
          <div>Category</div>
          {anyNeedsWear && <div>Wear</div>}
          {anyNeedsOccupancy && <div>Tied to Occupancy</div>}
        </div>

        {editable.charges.map((c, i)=>(
          <div className="tr" key={i}>
            <div>{c.date ?? "-"}</div>
            <div title={c.evidence || ""}>{c.description}</div>
            <div>${c.amount.toFixed(2)}</div>
            <div>{c.category ?? "-"}</div>
            {anyNeedsWear && (
              <div>
                {needsWear(c.category, c.description) ? (
                  <select
                    className="input"
                    value={c.wearClassification ?? ""}
                    onChange={(e)=>setWear(i, e.target.value as any)}
                  >
                    <option value="">(unset)</option>
                    <option value="beyond_normal_wear_and_tear">beyond</option>
                    <option value="normal_wear_and_tear">normal</option>
                  </select>
                ) : "—"}
              </div>
            )}
            {anyNeedsOccupancy && (
  <div>
    {needsOccupancy(c.category) ? (
      <select
        className="input"
        value={c.occupancyLink??""}
        onChange={(e) => setOccupancy(i, e.target.value as any)}
      >
        <option value="">(unset)</option>
        <option value="Yes">tied to occupancy</option>
        <option value="No">not tied</option>
      </select>
    ) : "—"}
  </div>
)}
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="btn primary" onClick={onAnalyze} disabled={loading}>
          {loading ? <Loader/> : "Analyze"}
        </button>
      </div>

      <div className="note">
        • If any required doc is missing, backend will return Status: <b>Declined</b> in the next step.<br/>
        • Late/Admin/Legal/SDRP/Filter/Maintenance fees are excluded automatically.<br/>
        • For repair/cleaning/etc, set wear = <b>beyond</b> if evidence supports it.
      </div>
    </div>
  );
}

function Receipt({
  evaluation, extracted
}:{ evaluation: EvaluationResponse; extracted: ExtractedPayload }) {

  // derive submitted docs list
  const docs = extracted.docPresence;
  const submittedDocs = [
    docs.leaseAgreement && "lease_agreement",
    docs.leaseAddendum && "lease_addendum",
    docs.notificationToTenant && "notification_to_tenant",
    docs.tenantLedger && "tenant_ledger",
  ].filter(Boolean) as string[];

const tenantName = extracted.tenantName ?? "(Not extracted)";
const propertyAddress = extracted.propertyAddress ?? "(Not extracted)";

  return (
    <div className="card receipt">
      <h2>Claim Result (Receipt)</h2>

      <div className="kv">
        <div><b>Tenant Name:</b></div><div>{tenantName}</div>
        <div><b>Assessment Status:</b></div><div>{evaluation.status}</div>
        <div><b>Property Address:</b></div><div>{propertyAddress}</div>
        <div><b>Monthly Rent:</b></div><div>${(extracted.monthlyRent ?? 0).toFixed(2)}</div>
        <div><b>Submitted Documents:</b></div>
        <div>{submittedDocs.length ? submittedDocs.join(", ") : "None"}</div>
      </div>

      <h3>Approved Charges</h3>
      {(evaluation.approvedCharges?.length ?? 0) > 0 ? (
        <ul className="list">
          {evaluation.approvedCharges!.map((a, i)=>(
            <li key={i}>
              <span>{a.description}</span>
              <span>${a.amount.toFixed(2)} — {a.reason}</span>
            </li>
          ))}
        </ul>
      ) : <p>None</p>}

      <h3>Excluded Charges</h3>
      {(evaluation.excludedCharges?.length ?? 0) > 0 ? (
        <ul className="list">
          {evaluation.excludedCharges!.map((x, i)=>(
            <li key={i}>
              <span>{x.description}</span>
              <span>${x.amount.toFixed(2)} — {x.reason}</span>
            </li>
          ))}
        </ul>
      ) : <p>None</p>}

      <div className="totals">
        <div><b>Total Approved Charges:</b> ${Number(evaluation.totalApprovedCharges ?? 0).toFixed(2)}</div>
        <div><b>Final Payout Based on Coverage:</b> ${Number(evaluation.finalPayoutBasedOnCoverage ?? 0).toFixed(2)}</div>
      </div>

      <h3>Ledger Verification</h3>
      <div className="kv">
        <div>• First Month Paid:</div><div>{String(evaluation.firstMonthPaid)}</div>
        <div>• First Month Paid Evidence:</div><div>{evaluation.firstMonthPaidEvidence || "-"}</div>
        <div>• First Month SDI Premium Paid:</div><div>{String(evaluation.firstMonthSdiPremiumPaid)}</div>
        <div>• First Month SDI Premium Paid Evidence:</div><div>{evaluation.firstMonthSdiPremiumPaidEvidence || "-"}</div>
        <div>• Missing documents:</div><div>{evaluation.missingDocuments?.join(", ") || "[]"}</div>
        <div>• Status:</div><div>{evaluation.status}</div>
        <div>• Summary of decision:</div><div>{evaluation.summaryOfDecision}</div>
      </div>

      <p className="muted">This receipt is read-only. To adjust, go back and re-analyze with updated details.</p>
    </div>
  );
}

function Loader() {
  return <span className="loader" aria-label="Loading"/>;
}

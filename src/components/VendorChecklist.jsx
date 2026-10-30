import { useState } from 'react'

export default function VendorChecklist({ vendors }) {
  const [checked, setChecked] = useState(() => new Set())

  const toggle = (index) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <section className="plan-card" aria-labelledby="vendors-heading">
      <div className="card-head">
        <h3 id="vendors-heading">Vendor checklist</h3>
        <p className="progress" aria-live="polite">{checked.size} of {vendors.length} booked</p>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${(checked.size / vendors.length) * 100}%` }} />
      </div>
      <ul className="vendor-list">
        {vendors.map((vendor, index) => (
          <li key={`${vendor.type}-${index}`}>
            <label className="vendor-item">
              <input type="checkbox" checked={checked.has(index)} onChange={() => toggle(index)} />
              <span className="vendor-text">
                <span className="vendor-type">{vendor.type}</span>
                <span className="vendor-confirm">Confirm: {vendor.confirm}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
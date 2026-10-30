const OPTIONS = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'community', label: 'Community' },
]

export default function EventTypeSelector({ value, onChange }) {
  return (
    <fieldset className="event-type-fieldset">
      <legend className="form-legend">Occasion</legend>
      <div className="segmented-group" role="radiogroup">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <label
              key={opt.value}
              className={`segmented-label ${isSelected ? 'is-selected' : ''}`}
            >
              <input
                type="radio"
                name="eventType"
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="segmented-input"
              />
              <span className="segmented-text">{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

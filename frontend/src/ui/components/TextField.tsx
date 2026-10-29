interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  multiline?: boolean
}

export function TextField({ id, label, value, onChange, disabled, multiline }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

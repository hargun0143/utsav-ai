export default function FormField({
  id,
  label,
  error,
  inputRef,
  as: Component = 'input',
  children,
  className = '',
  ...props
}) {
  const isTextarea = Component === 'textarea'
  const baseClass = isTextarea ? 'form-textarea' : 'form-input'
  const controlClass = `${baseClass}${error ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`
  const errorId = id.startsWith('planner-')
    ? `${id.replace(/^planner-/, '')}-error`
    : `${id}-error`

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Component
        ref={inputRef}
        id={id}
        className={controlClass}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {children}
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

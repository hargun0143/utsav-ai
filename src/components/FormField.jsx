/**
 * Reusable form control wrapper with label, error message, and accessibility attributes.
 * @param {object} props - Component props.
 * @param {string} props.id - HTML input element ID.
 * @param {string} props.label - Label text for the field.
 * @param {string} [props.error] - Validation error message to display.
 * @param {import('react').RefObject<HTMLElement>} [props.inputRef] - Ref passed to control element.
 * @param {'input' | 'textarea'} [props.as='input'] - Control component element type.
 * @param {import('react').ReactNode} [props.children] - Additional child nodes (e.g., datalist).
 * @param {string} [props.className=''] - Additional CSS classes.
 * @returns {import('react').JSX.Element}
 */
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

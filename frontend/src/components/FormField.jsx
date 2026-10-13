import './FormField.css';

/**
 * Reusable FormField component for clean, accessible inputs
 */
export function FormField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helperText = '',
  disabled = false,
  readOnly = false,
  options = [],
  rows = 3,
  className = '',
  ...props
}) {
  const inputId = id || `field-${name}`;

  return (
    <div className={`medicare-form-field ${error ? 'medicare-form-field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="medicare-form-field__label">
          {label} {required && <span className="medicare-form-field__required">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="medicare-form-field__input medicare-form-field__select"
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          rows={rows}
          className="medicare-form-field__input medicare-form-field__textarea"
          {...props}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className="medicare-form-field__input"
          {...props}
        />
      )}

      {error ? (
        <span className="medicare-form-field__error-msg" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="medicare-form-field__helper-msg">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

export default FormField;

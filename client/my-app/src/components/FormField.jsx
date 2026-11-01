export default function FormField({ label, htmlFor, error, hint, children }) {
    return (
        <div className={`form-field${error ? " has-error" : ""}`}>
            <label htmlFor={htmlFor}>{label}</label>
            {children}
            {hint && !error && <small className="hint">{hint}</small>}
            {error && <small className="field-error">{error}</small>}
        </div>
    );
}

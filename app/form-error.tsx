export function FormError({ error }: { error?: string }) {
  return error ? <p className="error">{error}</p> : null;
}

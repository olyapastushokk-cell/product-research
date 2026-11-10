export function FormError({ error }: { error?: string }) {
  return error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null;
}

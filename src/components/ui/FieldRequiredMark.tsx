/** Visual + accessible mark for required field labels. */
export function FieldRequiredMark() {
  return (
    <>
      <span className="text-red-500 ml-1" aria-hidden="true">
        *
      </span>
      <span className="sr-only">(required)</span>
    </>
  );
}

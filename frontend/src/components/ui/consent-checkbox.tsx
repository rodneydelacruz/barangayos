import { Label } from '@/components/ui/label';

const CONSENT_TEXT =
  'I hereby certify that the above information are true and correct to the best of my knowledge. I understand that for the Barangay to carry out its mandate pursuant to Section 394 (d)(6) of the Local Government Code of 1991, they must necessarily process my personal information for easy identification of inhabitants, as a tool in planning, and as an updated reference in the number of inhabitants of the Barangay. Therefore, I grant my consent that my data will be stored in the LGUSS-BIMS which is a highly secured tool that is being used by the barangay.';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ConsentCheckbox({ checked, onChange, disabled }: ConsentCheckboxProps) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{CONSENT_TEXT}</p>
      <div className="flex items-start gap-3">
        <input type="checkbox" id="data_privacy_consent" checked={checked}
          onChange={(e) => onChange(e.target.checked)} disabled={disabled} required
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary" />
        <Label htmlFor="data_privacy_consent" className="text-xs font-medium leading-relaxed cursor-pointer">
          I agree to the collection and processing of my personal data as described above.
        </Label>
      </div>
    </div>
  );
}

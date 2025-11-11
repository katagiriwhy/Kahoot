interface VariantProps {
    variants: string[];
    onVariantChange: (variantIndex: number, value: string) => void;
}

export default function Variant({variants, onVariantChange}: VariantProps) {

    return (
        <>

            {
                variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="questionVariants">
                        <input type="text" placeholder={`Variant ${variantIndex + 1}`} value={variant} onChange={(e) => onVariantChange(variantIndex, e.target.value)} required />
                    </div>
                ))
            }
        </>
    )
}

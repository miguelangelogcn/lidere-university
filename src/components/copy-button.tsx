'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CopyButtonProps = {
    textToCopy: string;
};

export function CopyButton({ textToCopy }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            toast({ title: "Copiado!", description: "O texto foi copiado para a área de transferência." });
            setTimeout(() => setCopied(false), 2000);
        }, (err) => {
            toast({ variant: 'destructive', title: "Erro!", description: "Não foi possível copiar o texto." });
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copiar</span>
        </Button>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { getFormations } from '@/services/formationService';
import { importContacts } from '@/lib/actions/contactActions';
import type { SerializableFormation } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, FileUp, Download, CalendarIcon, Loader2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const REQUIRED_FIELDS = [
    { id: 'name', label: 'Nome' },
    { id: 'phone', label: 'Telefone' },
    { id: 'email', label: 'Email' },
];

const OPTIONAL_FIELDS = [
    { id: 'tags', label: 'Tags (separadas por vírgula)' },
    { id: 'city', label: 'Cidade' },
    { id: 'isStudent', label: 'É Aluno (true/false)' },
];

export function ImportContactsFlow({ onSuccess }: { onSuccess: () => void }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<{ headers: string[]; rows: any[] }>({ headers: [], rows: [] });
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [formations, setFormations] = useState<SerializableFormation[]>([]);
    const [studentConfig, setStudentConfig] = useState({ grantAccess: false, formationIds: [] as string[], expiresAt: null as Date | null });
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function loadFormations() {
            const data = await getFormations();
            setFormations(data);
        }
        loadFormations();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsParsing(true);
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setCsvData({ headers: results.meta.fields || [], rows: results.data });
                    // Auto-map columns
                    const newMappings: Record<string, string> = {};
                    [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach(field => {
                        const foundHeader = (results.meta.fields || []).find(h => h.toLowerCase().replace(/ /g, '_') === field.id.toLowerCase());
                        if (foundHeader) {
                            newMappings[field.id] = foundHeader;
                        }
                    });
                    setMappings(newMappings);
                    setIsParsing(false);
                    setStep(2);
                },
                error: (error) => {
                    toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: error.message });
                    setIsParsing(false);
                }
            });
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const result = await importContacts(csvData.rows, mappings, studentConfig);
            setImportResult(result);
            setStep(4);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na Importação', description: 'Ocorreu um erro inesperado.' });
        } finally {
            setIsImporting(false);
        }
    };
    
    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," + "name,phone,email,tags,is_student,city\nJohn Doe,11999998888,john.doe@example.com,lead_quente,true,São Paulo";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_contatos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isNextDisabled = () => {
        if (step === 2) {
            return REQUIRED_FIELDS.some(field => !mappings[field.id]);
        }
        return false;
    }

    const resetFlow = () => {
        setStep(1);
        setFile(null);
        setCsvData({ headers: [], rows: [] });
        setMappings({});
        setStudentConfig({ grantAccess: false, formationIds: [], expiresAt: null });
        setImportResult(null);
    }
    
    const handleSuccessAndReset = () => {
        resetFlow();
        onSuccess();
    }


    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Importar Contatos (Passo 1 de 3)</DialogTitle>
                            <DialogDescription>Faça o upload de um arquivo CSV e configure as opções de importação.</DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 py-4">
                           <div>
                                <h3 className="font-semibold mb-2">Arquivo CSV</h3>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                            <p className="text-xs text-muted-foreground">Arquivo CSV (MAX. 5MB)</p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <Button variant="link" onClick={downloadTemplate} className="mt-2"><Download className="mr-2"/>Baixar modelo de CSV</Button>
                           </div>

                            <div>
                                <h3 className="font-semibold mb-2">Configurações para Alunos</h3>
                                <div className="p-4 border rounded-lg space-y-4">
                                     <div className="flex items-start space-x-2">
                                        <Checkbox id="grant-access" checked={studentConfig.grantAccess} onCheckedChange={(checked) => setStudentConfig(prev => ({ ...prev, grantAccess: !!checked }))} />
                                        <Label htmlFor="grant-access" className="font-normal cursor-pointer">
                                            Criar acesso de aluno para contatos com email e marcados como "É Aluno".
                                            <p className="text-xs text-muted-foreground">Uma senha aleatória será criada para cada novo aluno.</p>
                                        </Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Formações para conceder acesso</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", !studentConfig.formationIds.length && "text-muted-foreground")} disabled={!studentConfig.grantAccess}>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {formations.filter(f => studentConfig.formationIds.includes(f.id)).map(f => (<Badge variant="secondary" key={f.id}>{f.title}</Badge>))}
                                                        {studentConfig.formationIds.length === 0 && "Selecione as formações"}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Buscar formação..." />
                                                    <CommandList>
                                                        <CommandEmpty>Nenhuma formação encontrada.</CommandEmpty>
                                                        <CommandGroup>
                                                            {formations.map((f) => (
                                                                <CommandItem value={f.title} key={f.id} onSelect={() => setStudentConfig(prev => ({...prev, formationIds: prev.formationIds.includes(f.id) ? prev.formationIds.filter(id => id !== f.id) : [...prev.formationIds, f.id]}))}>
                                                                    <Check className={cn("mr-2 h-4 w-4", studentConfig.formationIds.includes(f.id) ? "opacity-100" : "opacity-0")} />
                                                                    {f.title}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data de Expiração (opcional)</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !studentConfig.expiresAt && "text-muted-foreground")} disabled={!studentConfig.grantAccess}>
                                                    <CalendarIcon className="mr-2"/>
                                                    {studentConfig.expiresAt ? format(studentConfig.expiresAt, "PPP", { locale: ptBR }) : <span>Acesso vitalício</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={studentConfig.expiresAt || undefined} onSelect={(date) => setStudentConfig(prev => ({...prev, expiresAt: date || null}))} initialFocus /></PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                         <DialogHeader>
                            <DialogTitle>Importar Contatos (Passo 2 de 3)</DialogTitle>
                            <DialogDescription>Associe as colunas do seu arquivo CSV aos campos de contato da plataforma.</DialogDescription>
                        </DialogHeader>
                         <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map(field => (
                                <div key={field.id} className="grid grid-cols-2 items-center gap-4">
                                    <Label>
                                        {field.label} {REQUIRED_FIELDS.some(f => f.id === field.id) && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Select value={mappings[field.id] || ''} onValueChange={(value) => setMappings(prev => ({...prev, [field.id]: value}))}>
                                        <SelectTrigger><SelectValue placeholder="Não importar" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Não importar</SelectItem>
                                            {csvData.headers.map(header => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            <h3 className="font-semibold pt-4">Pré-visualização dos Dados</h3>
                            <ScrollArea className="border rounded-lg">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>{csvData.headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {csvData.rows.slice(0, 5).map((row, i) => (
                                            <TableRow key={i}>{csvData.headers.map(h => <TableCell key={h}>{row[h]}</TableCell>)}</TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                         </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <DialogHeader>
                           <DialogTitle>Importar Contatos (Passo 3 de 3)</DialogTitle>
                           <DialogDescription>Revise as informações e inicie a importação.</DialogDescription>
                       </DialogHeader>
                        <div className="py-4 space-y-4">
                           <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Revisão Final</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-5">
                                        <li>Você está prestes a importar <span className="font-bold">{csvData.rows.length}</span> contatos.</li>
                                        {studentConfig.grantAccess && (
                                            <>
                                                <li>Contatos marcados como alunos com um email válido receberão acesso.</li>
                                                <li>Acesso será concedido a <span className="font-bold">{studentConfig.formationIds.length}</span> formação(ões).</li>
                                                <li>O acesso <span className="font-bold">{studentConfig.expiresAt ? `expira em ${format(studentConfig.expiresAt, 'dd/MM/yyyy')}` : 'será vitalício'}</span>.</li>
                                            </>
                                        )}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita. Contatos duplicados (com base no email) serão ignorados se já forem alunos.</p>
                        </div>
                    </>
                )
             case 4:
                return (
                     <>
                        <DialogHeader>
                           <DialogTitle>Importação Concluída</DialogTitle>
                           <DialogDescription>Veja o resumo do processo de importação.</DialogDescription>
                       </DialogHeader>
                       <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="text-center">
                                    <CardHeader><CardTitle className="text-green-600">{importResult?.success || 0}</CardTitle></CardHeader>
                                    <CardContent><p>Importados com Sucesso</p></CardContent>
                                </Card>
                                 <Card className="text-center">
                                    <CardHeader><CardTitle className="text-red-600">{importResult?.failed || 0}</CardTitle></CardHeader>
                                    <CardContent><p>Falhas na Importação</p></CardContent>
                                </Card>
                            </div>
                            {importResult?.errors && importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Detalhes dos Erros</Label>
                                    <ScrollArea className="h-40 border rounded-md p-2">
                                        <ul className="text-xs text-destructive space-y-1">
                                            {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </ScrollArea>
                                </div>
                            )}
                       </div>
                     </>
                );
        }
    };

    const renderFooter = () => {
        if (step === 1) {
            return null; // No footer, file upload triggers next step
        }
        if (step === 2) {
            return <Button onClick={() => setStep(3)} disabled={isNextDisabled()}>Revisar Importação</Button>;
        }
        if (step === 3) {
            return <Button onClick={handleImport} disabled={isImporting}>{isImporting && <Loader2 className="mr-2 animate-spin"/>}Iniciar Importação</Button>;
        }
        if (step === 4) {
             return <Button onClick={handleSuccessAndReset}>Concluir</Button>
        }
    };

    return (
        <div className="h-full">
            {renderStep()}
            <DialogFooter className="mt-4 pt-4 border-t">
                {step > 1 && step < 4 && <Button variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button>}
                {renderFooter()}
            </DialogFooter>
        </div>
    );
}

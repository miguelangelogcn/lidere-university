"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleGenerateEmail, type State } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar Email
        </>
      )}
    </Button>
  );
}


export function SmartEmailForm() {
  const initialState: State = { message: null, errors: {}, generatedEmail: null };
  const [state, dispatch] = useFormState(handleGenerateEmail, initialState);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);


  useEffect(() => {
    if (state.message) {
      if(state.errors || state.message.includes('Falha') || state.message.includes('erro')) {
        toast({
            variant: "destructive",
            title: "Erro na Geração",
            description: state.message,
        })
      } else {
        toast({
            title: "Sucesso!",
            description: state.message,
        })
        if (state.generatedEmail) {
            setGeneratedEmail(state.generatedEmail);
        }
        formRef.current?.reset();
      }
    }
  }, [state, toast]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={dispatch} ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Criar Email com IA</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para que a inteligência artificial crie um email personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customerProfile">Perfil do Cliente</Label>
              <Textarea
                id="customerProfile"
                name="customerProfile"
                placeholder="Ex: Cliente interessado em soluções de nuvem, já participou de um webinar nosso..."
                rows={4}
              />
              {state.errors?.customerProfile && <p className="text-sm font-medium text-destructive">{state.errors.customerProfile}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailPurpose">Propósito do Email</Label>
              <Input
                id="emailPurpose"
                name="emailPurpose"
                placeholder="Ex: Apresentar novo produto X"
              />
               {state.errors?.emailPurpose && <p className="text-sm font-medium text-destructive">{state.errors.emailPurpose}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Tom do Email</Label>
              <Select name="tone" defaultValue="informal">
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
      <Card className="flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline">Email Gerado</CardTitle>
            <CardDescription>
                Revise o email gerado pela IA e copie para usar.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="w-full h-full bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">
                {generatedEmail || "O email gerado pela IA aparecerá aqui..."}
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigator.clipboard.writeText(generatedEmail || "")} disabled={!generatedEmail}>Copiar Email</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

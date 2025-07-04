'use client';

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/main-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts, deleteProduct } from "@/services/productService";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddProductForm } from "@/components/add-product-form";
import { EditProductForm } from "@/components/edit-product-form";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
        const productList = await getProducts();
        setProducts(productList);
    } catch(err) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar produtos." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
    fetchProducts();
    toast({ title: "Sucesso!", description: "Operação realizada com sucesso." });
  };
  
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
        await deleteProduct(selectedProduct.id);
        toast({ title: "Sucesso!", description: "Produto excluído com sucesso." });
        fetchProducts();
    } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao excluir o produto." });
    } finally {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
    }
  };

  return (
    <>
      <MainHeader title="Gerenciar Produtos" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Adicionar Produto
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Produto</DialogTitle>
                          <DialogDescription>
                            Preencha os dados do novo produto.
                          </DialogDescription>
                        </DialogHeader>
                        <AddProductForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Garantia</TableHead>
                <TableHead className="w-[100px]">Apresentação</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Carregando...
                    </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </TableCell>
                    <TableCell>{product.warranty}</TableCell>
                    <TableCell>
                      {product.presentationUrl ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={product.presentationUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver
                          </a>
                        </Button>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu de ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => { setSelectedProduct(product); setIsEditDialogOpen(true); }}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedProduct(product); setIsDeleteDialogOpen(true); }}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) setSelectedProduct(null); setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere os dados do produto.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && <EditProductForm product={selectedProduct} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) setSelectedProduct(null); setIsDeleteDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o produto <span className="font-bold">{selectedProduct?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

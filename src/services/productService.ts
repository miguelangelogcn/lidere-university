'use server';

import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { collection, getDocs, type DocumentData, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function docToProduct(doc: DocumentData): Product {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        price: data.price || 0,
        deliverables: data.deliverables || [],
        presentationUrl: data.presentationUrl || null,
        warranty: data.warranty || '',
    };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    if (productSnapshot.empty) {
        return [];
    }
    const productList = productSnapshot.docs.map(docToProduct);
    return productList;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<void> {
    try {
        const productsCollection = collection(db, 'products');
        await addDoc(productsCollection, data);
    } catch (error) {
        console.error("Error creating product: ", error);
        throw new Error("Falha ao criar produto.");
    }
}


export async function updateProduct(productId: string, data: Partial<Omit<Product, 'id'>>): Promise<void> {
    try {
        const productDocRef = doc(db, 'products', productId);
        await updateDoc(productDocRef, data);
    } catch (error) {
        console.error("Error updating product: ", error);
        throw new Error("Falha ao atualizar produto.");
    }
}

export async function deleteProduct(productId: string): Promise<void> {
    try {
        const productDocRef = doc(db, 'products', productId);
        await deleteDoc(productDocRef);
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw new Error("Falha ao excluir produto.");
    }
}

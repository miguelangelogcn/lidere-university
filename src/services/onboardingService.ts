'use server';

import { db } from '@/lib/firebase';
import type { Onboarding, OnboardingStep } from '@/lib/types';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

// The document ID for an onboarding template will be the product ID.
const onboardingTemplateCollection = collection(db, 'onboardingTemplates');

export async function getOnboardingSteps(productId: string): Promise<OnboardingStep[]> {
  try {
    const onboardingDocRef = doc(onboardingTemplateCollection, productId);
    const docSnap = await getDoc(onboardingDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Onboarding;
      // Sort by day, then by the order within the day
      return (data.steps || []).sort((a, b) => a.day - b.day || a.order - b.order);
    }
    return [];
  } catch (error) {
    console.error("Error fetching onboarding steps: ", error);
    return [];
  }
}

export async function updateOnboardingSteps(
  productId: string,
  productName: string,
  steps: Omit<OnboardingStep, 'id'>[]
): Promise<void> {
  try {
    const onboardingDocRef = doc(onboardingTemplateCollection, productId);

    const stepsWithIds: OnboardingStep[] = steps.map((step) => ({
      ...step,
      id: doc(collection(db, 'random')).id, // Generate a random id
    }));

    const onboardingData: Onboarding = {
        id: productId,
        productId,
        productName,
        steps: stepsWithIds,
    };

    await setDoc(onboardingDocRef, onboardingData, { merge: true });

  } catch (error) {
    console.error("Error updating onboarding steps: ", error);
    throw new Error("Falha ao atualizar os passos de onboarding.");
  }
}

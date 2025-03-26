// src/types/index.ts
import { UniqueIdentifier } from "@dnd-kit/core";

export interface Ingredient {
  id: string; // Unique ID for the *type* of ingredient
  name: string;
  emoji: string;
  color: string;
}

// Represents an ingredient placed in the sandwich with a unique instance ID
export interface StackedLayer {
  instanceId: UniqueIdentifier; // Unique ID for *this specific layer* in the stack
  ingredient: Ingredient;
}

// Update DraggableData to handle both types
export interface DraggableIngredientData {
  type: "ingredient";
  ingredient: Ingredient;
}

export interface DraggableStackedLayerData {
  type: "stackedLayer";
  layer: StackedLayer;
}

export type DraggableData = DraggableIngredientData | DraggableStackedLayerData;

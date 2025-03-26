// src/components/IngredientBank.tsx
import React from "react";
import DraggableIngredient from "./DraggableIngredient";
import { Ingredient } from "../types";
import styles from "../styles/IngredientBank.module.css";

interface IngredientBankProps {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void; // Accept the callback
}

function IngredientBank({ ingredients, onAddIngredient }: IngredientBankProps) {
  return (
    <div className={styles.bank}>
      <h2 className={styles.title}>Pick your Ingredients! (Click or Drag)</h2>{" "}
      {/* Updated title */}
      {ingredients.map((ingredient) => (
        <DraggableIngredient
          key={ingredient.id}
          ingredient={ingredient}
          onAdd={onAddIngredient} // Pass the callback down
        />
      ))}
    </div>
  );
}

export default IngredientBank;

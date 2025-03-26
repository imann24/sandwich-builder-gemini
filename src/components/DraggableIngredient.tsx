// src/components/DraggableIngredient.tsx
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Ingredient, DraggableData } from "../types";
import sharedStyles from "../styles/Shared.module.css";

interface DraggableIngredientProps {
  ingredient: Ingredient;
  onAdd: (ingredient: Ingredient) => void; // Callback for adding
}

function DraggableIngredient({ ingredient, onAdd }: DraggableIngredientProps) {
  const draggableData: DraggableData = { type: "ingredient", ingredient };
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: ingredient.id, // Use ingredient type ID for bank items
      data: draggableData,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    backgroundColor: ingredient.color,
    // Fix for Ghosting: Make original invisible when dragging
    opacity: isDragging ? 0 : 1,
    // Ensure cursor updates correctly
    cursor: isDragging ? "grabbing" : "grab",
  };

  const handleClick = (event: React.MouseEvent) => {
    // Basic check to prevent click during drag start phase
    // dnd-kit activation constraint helps, but this adds safety
    if (!isDragging && event.detail) {
      // event.detail > 0 ensures it's a real click
      console.log("Clicked to add:", ingredient.name);
      onAdd(ingredient);
    }
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      {...listeners} // DnD listeners
      {...attributes} // DnD attributes
      onClick={handleClick} // Click listener
      className={`${sharedStyles.ingredient}`} // Remove dragging class here, handled by opacity style
      // Framer Motion animations
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span>{ingredient.emoji}</span>
      <span>{ingredient.name}</span>
    </motion.button>
  );
}

export default DraggableIngredient;

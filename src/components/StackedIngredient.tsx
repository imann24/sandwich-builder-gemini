// src/components/StackedIngredient.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { StackedLayer, DraggableStackedLayerData } from "../types";
import sharedStyles from "../styles/Shared.module.css";
import { UniqueIdentifier } from "@dnd-kit/core";

interface StackedIngredientProps {
  layer: StackedLayer;
  onRemove: (instanceId: UniqueIdentifier) => void; // Callback for removing
}

// Animation variants for entering and exiting
const itemVariants = {
  hidden: {
    // Initial state (when added)
    opacity: 0,
    y: -20,
    scale: 0.9,
  },
  visible: {
    // Animate to state
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
  exit: {
    // State when removing
    opacity: 0,
    scale: 0.8,
    height: 0, // Animate height to 0
    marginTop: 0, // Animate margin (use specific margin if needed)
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.2, ease: "easeOut" }, // Use easeOut for smoother exit
  },
};

function StackedIngredient({ layer, onRemove }: StackedIngredientProps) {
  const sortableData: DraggableStackedLayerData = {
    type: "stackedLayer",
    layer,
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layer.instanceId, // Use the unique instanceId here
    data: sortableData,
  });

  const style: React.CSSProperties = {
    // Apply dnd-kit transform for drag displacement
    transform: CSS.Transform.toString(transform),
    // Use dnd-kit transition for smooth drop, disable CSS transition during drag
    transition: isDragging ? "none" : transition,
    backgroundColor: layer.ingredient.color,
    // Fix for Ghosting: Make original invisible when dragging
    opacity: isDragging ? 0 : 1,
    cursor: "grab", // Cursor indicates draggability
    width: "80%",
    justifyContent: "center",
    margin: "2px auto", // Keep original margin for layout calculation by Framer Motion
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative", // Needed for z-index and layout animations
    zIndex: isDragging ? 100 : "auto", // Bring dragging item visually to front
    overflow: "hidden", // Crucial for height animation on exit
    touchAction: "none", // Recommended for preventing scrolling issues on touch devices during drag
  };

  const handleClick = (event: React.MouseEvent) => {
    // Only trigger remove on a clear click, not during a drag initiation
    // Checking event.detail ensures it wasn't triggered programmatically
    if (!isDragging && event.detail) {
      console.log("Clicked to remove:", layer.instanceId);
      onRemove(layer.instanceId);
    }
  };

  return (
    // Use motion.div and connect refs/listeners/attributes
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`${sharedStyles.ingredient}`} // Base styles, dragging state handled by opacity
      onClick={handleClick} // Add remove handler
      // Apply dnd-kit listeners/attributes here
      {...attributes}
      {...listeners}
      // Framer Motion props
      layout // Animates layout changes (reordering, removal causing shifts)
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // Add visual feedback on hover/tap (optional)
      whileHover={{ scale: 1.03, zIndex: 1 }} // Slight raise on hover
      whileTap={{ scale: 0.98 }} // Slight shrink on tap
    >
      {/* Content doesn't need to change */}
      <span>{layer.ingredient.emoji}</span>
      <span>{layer.ingredient.name}</span>
    </motion.div>
  );
}

export default StackedIngredient;

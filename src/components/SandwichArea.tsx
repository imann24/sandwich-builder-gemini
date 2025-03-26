// src/components/SandwichArea.tsx
import { useDroppable, UniqueIdentifier } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { StackedLayer } from "../types";
import StackedIngredient from "./StackedIngredient";
import styles from "../styles/SandwichArea.module.css";

interface SandwichAreaProps {
  id: string;
  layers: StackedLayer[];
  onRemoveLayer: (instanceId: UniqueIdentifier) => void; // Accept callback
}

function SandwichArea({ id, layers, onRemoveLayer }: SandwichAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: "sandwichArea" },
  });

  const layerInstanceIds = layers.map((layer) => layer.instanceId);

  return (
    <div className={styles.sandwichContainer}>
      <h2>Your Masterpiece! (Click item to remove)</h2> {/* Updated title */}
      <SortableContext
        items={layerInstanceIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef} // Keep droppable ref on the container
          className={`${styles.dropArea} ${isOver ? styles.dropAreaOver : ""}`}
        >
          {layers.length === 0 && !isOver && (
            <div className={styles.placeholder}>
              Click or Drag ingredients here!
            </div>
          )}
          {/* Wrap the mapping with AnimatePresence */}
          <AnimatePresence initial={false}>
            {" "}
            {/* initial={false} prevents initial animation on load */}
            {layers.map((layer) => (
              <StackedIngredient
                key={layer.instanceId} // Key MUST be stable and unique for AnimatePresence
                layer={layer}
                onRemove={onRemoveLayer} // Pass callback down
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}

export default SandwichArea;

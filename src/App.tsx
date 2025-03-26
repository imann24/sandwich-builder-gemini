// src/App.tsx
import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
  DropAnimation,
  defaultDropAnimationSideEffects,
  // MeasuringStrategy, // Only needed if dimensions change drastically/unpredictably
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Ingredient, StackedLayer, DraggableData } from "./types";
import IngredientBank from "./components/IngredientBank";
import SandwichArea from "./components/SandwichArea";
import sharedStyles from "./styles/Shared.module.css";
import appStyles from "./styles/App.module.css";
import { motion } from "framer-motion";

// --- Initial Ingredients ---
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: "ing-1", name: "Top Bun", emoji: "🍞", color: "#e2ab6f" },
  { id: "ing-2", name: "Lettuce", emoji: "🥬", color: "#90ee90" },
  { id: "ing-3", name: "Tomato", emoji: "🍅", color: "#ff6347" },
  { id: "ing-4", name: "Cheese", emoji: "🧀", color: "#ffcc00" },
  { id: "ing-5", name: "Patty", emoji: "🍔", color: "#a0522d" },
  { id: "ing-6", name: "Bottom Bun", emoji: "🍞", color: "#e2ab6f" },
  { id: "ing-7", name: "Onion", emoji: "🧅", color: "#d8bfd8" },
  { id: "ing-8", name: "Pickles", emoji: "🥒", color: "#8fbc8f" },
];

const SANDWICH_AREA_ID = "sandwich-drop-area";

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } }, // Opacity of the DROPPING overlay item
  }),
};

function App() {
  const [sandwichLayers, setSandwichLayers] = useState<StackedLayer[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragData, setActiveDragData] = useState<DraggableData | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Increase activation delay slightly if needed, but distance is usually better
      // delay: 100, tolerance: 5
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor) // Keep keyboard sensor for accessibility
  );

  // --- Click Handlers ---
  const handleAddIngredient = useCallback((ingredient: Ingredient) => {
    setSandwichLayers((layers) => {
      const newLayer: StackedLayer = {
        instanceId: uuidv4(),
        ingredient: ingredient,
      };
      return [...layers, newLayer]; // Add to the end of the array
    });
  }, []); // No dependencies needed

  const handleRemoveLayer = useCallback(
    (instanceIdToRemove: UniqueIdentifier) => {
      setSandwichLayers((layers) =>
        layers.filter((layer) => layer.instanceId !== instanceIdToRemove)
      );
    },
    []
  ); // No dependencies needed

  // --- Drag Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DraggableData | undefined;
    setActiveId(active.id);
    if (data) {
      setActiveDragData(data);
      console.log("Drag Start:", { id: active.id, type: data.type });
    } else {
      setActiveDragData(null);
      console.log("Drag Start (no data):", { id: active.id });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Store data before resetting state, in case needed for logging
    const currentActiveData = activeDragData;
    const currentActiveId = activeId;

    // Reset active state immediately
    setActiveId(null);
    setActiveDragData(null);

    if (!over) {
      console.log("Drag End: No droppable target.", {
        activeId: currentActiveId,
        type: currentActiveData?.type,
      });
      return; // Dropped outside any valid area
    }

    const activeData = active.data.current as DraggableData | undefined; // Get fresh data if possible
    const overId = over.id;

    console.log("Drag End:", {
      activeId: active.id,
      overId: over.id,
      activeType: activeData?.type,
    });

    // Determine if the drop target is part of the sandwich area (container or an item within it)
    const isOverSandwichContainer = overId === SANDWICH_AREA_ID;
    const isOverExistingLayer = sandwichLayers.some(
      (layer) => layer.instanceId === overId
    );
    const isOverSandwichAreaOrContents =
      isOverSandwichContainer || isOverExistingLayer;

    // Scenario 1: Dragging NEW ingredient TO the Sandwich Area/Contents
    if (activeData?.type === "ingredient" && isOverSandwichAreaOrContents) {
      console.log("✅ Scenario 1: Adding new ingredient");
      handleAddIngredient(activeData.ingredient);
      return;
    }

    // Scenario 2: Reordering WITHIN Sandwich Area
    if (activeData?.type === "stackedLayer" && isOverSandwichAreaOrContents) {
      console.log("🔄 Scenario 2: Attempting reorder");
      const oldIndex = sandwichLayers.findIndex(
        (layer) => layer.instanceId === active.id
      );
      let newIndex = sandwichLayers.findIndex(
        (layer) => layer.instanceId === overId
      );

      if (oldIndex === -1) {
        console.warn(
          "Reorder failed: Could not find dragged item's old index for ID:",
          active.id
        );
        return; // Dragged item doesn't exist in the list? Should not happen.
      }

      // If dropped onto the container background (overId is SANDWICH_AREA_ID)
      // during a reorder, decide placement. arrayMove might handle this based on collision,
      // but explicitly placing at the end might be desired.
      // Note: closestCenter usually means over.id will be a sortable item ID, not container.
      if (newIndex === -1 && overId === SANDWICH_AREA_ID) {
        console.log(
          "Reordering: Dropped directly on container, interpreting as move to end."
        );
        // Set newIndex to be the last position in the array
        newIndex = sandwichLayers.length; // arrayMove uses target index for insertion
      } else if (newIndex === -1) {
        // This means overId is something unexpected within the area (not container, not layer)
        console.warn(
          `Reorder failed: Invalid target overId '${overId}' within sandwich area.`
        );
        return;
      }

      // Only move if the index actually changed
      if (
        oldIndex !== newIndex &&
        newIndex >= 0 &&
        newIndex <= sandwichLayers.length
      ) {
        // If moving an item downwards, the target index appears one less than expected visually.
        // arrayMove handles the insertion correctly based on target index.
        console.log(
          `Reordering: Moving layer ${active.id} from index ${oldIndex} to index ${newIndex}`
        );
        setSandwichLayers((layers) => arrayMove(layers, oldIndex, newIndex));
      } else {
        console.log("Reordering: Item dropped in the same effective position.");
      }
      return;
    }

    // Log unhandled cases for debugging
    console.log(
      `🚫 Unhandled drag end: activeType=${activeData?.type}, overId=${overId}, isOverSandwich=${isOverSandwichAreaOrContents}`
    );
  };

  const handleReset = () => {
    setSandwichLayers([]);
  };

  // --- Render Drag Overlay ---
  const renderDragOverlay = () => {
    if (!activeDragData) return null;

    const MotionDiv = motion.div;

    switch (activeDragData.type) {
      case "ingredient":
        return (
          <MotionDiv
            className={`${sharedStyles.ingredient} ${sharedStyles.dragging}`}
            style={{ backgroundColor: activeDragData.ingredient.color }}
            initial={false}
            layout // Helps if styling changes, but less critical for overlay
          >
            <span>{activeDragData.ingredient.emoji}</span>
            <span>{activeDragData.ingredient.name}</span>
          </MotionDiv>
        );
      case "stackedLayer":
        return (
          <MotionDiv
            className={`${sharedStyles.ingredient} ${sharedStyles.dragging}`}
            style={{
              backgroundColor: activeDragData.layer.ingredient.color,
              width: "80%", // Match stacked item appearance
              justifyContent: "center",
              margin: 0, // Reset margin for overlay
            }}
            initial={false}
            layout
          >
            <span>{activeDragData.layer.ingredient.emoji}</span>
            <span>{activeDragData.layer.ingredient.name}</span>
          </MotionDiv>
        );
      default:
        return null;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter} // Stick with closestCenter for sortable interaction
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Auto-scrolling can be added if the container might overflow
      // autoScroll={true}
    >
      <div className={appStyles.appContainer}>
        <h1 className={appStyles.title}>🥪 Sandwich Builder 🥪</h1>

        <IngredientBank
          ingredients={INITIAL_INGREDIENTS}
          onAddIngredient={handleAddIngredient}
        />

        <SandwichArea
          id={SANDWICH_AREA_ID}
          layers={sandwichLayers}
          onRemoveLayer={handleRemoveLayer}
        />

        <button onClick={handleReset} className={appStyles.resetButton}>
          Reset Sandwich
        </button>

        <DragOverlay
          dropAnimation={dropAnimationConfig} /* No adjustments needed here */
        >
          {renderDragOverlay()}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;

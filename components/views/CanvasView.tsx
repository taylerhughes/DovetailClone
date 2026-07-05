"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { canvasNodeTypes, type CanvasCardData } from "./canvas/CanvasCardNode";
import { updateCardPosition, removeFromCanvas } from "@/actions/canvas";
import { useProjectAccess } from "@/components/projects/ProjectAccessContext";
import type { CanvasSubjectType } from "@/lib/generated/prisma/client";

export interface CanvasCard {
  subjectType: CanvasSubjectType;
  subjectId: string;
  x: number;
  y: number;
  href: string;
  title: string;
  subtitle: string;
}

export function CanvasView({
  viewId,
  cards,
}: {
  viewId: string;
  cards: CanvasCard[];
}) {
  const router = useRouter();
  const { canEdit } = useProjectAccess();

  const initialNodes = useMemo<Node[]>(
    () =>
      cards.map((card) => ({
        id: `${card.subjectType}:${card.subjectId}`,
        type: "canvasCard",
        position: { x: card.x, y: card.y },
        data: {
          href: card.href,
          title: card.title,
          subtitle: card.subtitle,
          kind: card.subjectType,
          onRemove: () => {
            void removeFromCanvas(viewId, card.subjectType, card.subjectId).then(
              () => router.refresh(),
            );
          },
        } satisfies CanvasCardData,
      })),
    [cards, viewId, router],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // useNodesState only seeds from initialNodes on mount; re-sync whenever the
  // server-fetched card list changes (e.g. after adding/removing a card via
  // router.refresh()), without clobbering in-progress local drag state.
  useEffect(() => {
    setNodes(initialNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const handleNodeDragStop: OnNodeDrag<Node> = (_event, node) => {
    const [subjectType, subjectId] = node.id.split(":") as [
      CanvasSubjectType,
      string,
    ];
    void updateCardPosition(
      viewId,
      subjectType,
      subjectId,
      node.position.x,
      node.position.y,
    );
  };

  return (
    <div className="h-[70vh] w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={canvasNodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={handleNodeDragStop}
        nodesDraggable={canEdit}
        nodesConnectable={false}
        elementsSelectable
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
